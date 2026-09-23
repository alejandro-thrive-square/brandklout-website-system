#!/usr/bin/env node
/**
 * Attach a custom domain to a Railway service and wire it in Cloudflare the way that works:
 * CNAME + _railway-verify TXT, DNS-only until the certificate is VALID, then proxied.
 *
 * Origin: the sequence done by hand on bk-ifa-dentistry (2026-09-11 production, 2026-09-18 staging),
 * bk-stone and bk-stone-med-spa (2026-09-15 staging) and brandklout.ai (2026-09-22), recorded in
 * 21-instatic-staging-clone.md and the auto-memory notes. Written as a script 2026-09-23.
 *
 *   node railway-domain.mjs --project <id> --environment <id> --service <id> --domain www.example.com --zone example.com
 *   ... --apply                          # create the Railway domain, the DNS records, wait, proxy
 *   ... --apply --delete-service-domain  # staging: also delete the *.up.railway.app host
 *
 * Ids: `railway status --json` / `railway list --json` in the linked project.
 * Railway token: JSON.parse(~/.railway/config.json).user.accessToken (NOT user.token, NOT the shared
 * RAILWAY_TOKEN). If it answers Not Authorized, run `railway whoami` once to refresh it.
 * Cloudflare token: CLOUDFLARE_API_TOKEN minted with mint-token.mjs (DNS Write on the zone).
 *
 * What it does, in order:
 *   1. Read the service's domains. Create the custom domain if missing (customDomainCreate takes
 *      CustomDomainCreateInput). Re-creating a deleted domain mints a NEW CNAME target: always
 *      re-read it, never reuse an old one.
 *   2. Write the CNAME (DNS-only) and the TXT from status.verificationDnsHost/verificationToken
 *      (that TXT is NOT in status.dnsRecords, and without it a proxied domain never verifies).
 *   3. Poll certificateStatus (usually 1 to 4 minutes). On ISSUE_FAILED call
 *      customDomainIssueCertificate once (a failed certificate never retries by itself).
 *   4. On VALID, proxy the CNAME. From then on ignore Railway's DNS_RECORD_STATUS_REQUIRES_UPDATE
 *      badge: the orange cloud hides the target from its check. Judge by certificateStatus and a request.
 *   5. List the service domains (*.up.railway.app). On staging they bypass Cloudflare and its
 *      noindex rule: --delete-service-domain removes them.
 *
 * It does NOT touch PUBLIC_ORIGIN. Attaching a domain never updates it, and the new host then shows
 * a normal login page that answers 403 invalid origin. Next step, always:
 *   node ../instatic-domain-origins/check-origins.mjs https://www.example.com
 */
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { cf, zoneFor, arg, flag } from './cf-api.mjs'

const P = arg('project'), E = arg('environment'), S = arg('service'), DOMAIN = arg('domain'), ZONE = arg('zone')
if (!P || !E || !S || !DOMAIN) { console.error('usage: node railway-domain.mjs --project <id> --environment <id> --service <id> --domain <host> [--zone <apex>] [--apply] [--delete-service-domain]'); process.exit(2) }
const APPLY = flag('apply')

const RTOKEN = (() => {
  try { return JSON.parse(readFileSync(join(homedir(), '.railway', 'config.json'), 'utf8')).user.accessToken } catch { return null }
})()
if (!RTOKEN) { console.error('no ~/.railway/config.json user.accessToken: run `railway login` then `railway whoami`'); process.exit(2) }

async function gql(query, variables = {}) {
  const res = await fetch('https://backboard.railway.com/graphql/v2', {
    method: 'POST',
    headers: { authorization: `Bearer ${RTOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join(' | '))
  return json.data
}

const STATUS = 'status { verified verificationDnsHost verificationToken certificateStatus dnsRecords { hostlabel recordType requiredValue status } }'
const readDomains = async () => (await gql(`query($p:String!,$e:String!,$s:String!){ domains(projectId:$p, environmentId:$e, serviceId:$s){
  customDomains { id domain ${STATUS} } serviceDomains { id domain } } }`, { p: P, e: E, s: S })).domains

let domains = await readDomains()
let custom = domains.customDomains.find((d) => d.domain === DOMAIN)
console.log(`railway  custom: ${domains.customDomains.map((d) => d.domain).join(', ') || 'none'}; service: ${domains.serviceDomains.map((d) => d.domain).join(', ') || 'none'}`)

if (!custom) {
  console.log(`plan     customDomainCreate ${DOMAIN}`)
  if (!APPLY) { console.log('DRY RUN — re-run with --apply'); process.exit(0) }
  await gql('mutation($i:CustomDomainCreateInput!){ customDomainCreate(input:$i){ id domain } }', { i: { domain: DOMAIN, projectId: P, environmentId: E, serviceId: S } })
  domains = await readDomains()
  custom = domains.customDomains.find((d) => d.domain === DOMAIN)
}
const target = custom.status.dnsRecords.find((r) => r.recordType?.includes('CNAME'))?.requiredValue
const txtHost = custom.status.verificationDnsHost
const txtValue = custom.status.verificationToken
console.log(`domain   ${DOMAIN} (${custom.id}) cert ${custom.status.certificateStatus}, verified ${custom.status.verified}`)
console.log(`needs    CNAME ${DOMAIN} -> ${target}`)
console.log(`needs    TXT   ${txtHost} = ${txtValue}`)

if (ZONE) {
  const zone = await zoneFor(ZONE)
  const fq = (h) => (h.endsWith(ZONE) ? h : `${h}.${ZONE}`)
  const records = await cf('GET', `/zones/${zone.id}/dns_records?per_page=200`)
  const cname = records.find((r) => r.name === DOMAIN && r.type === 'CNAME')
  const blockers = records.filter((r) => r.name === DOMAIN && ['A', 'AAAA'].includes(r.type))
  const txt = txtHost && records.find((r) => r.name === fq(txtHost) && r.type === 'TXT')
  if (blockers.length) console.log(`WARN ${DOMAIN} has ${blockers.map((r) => `${r.type} ${r.content}`).join(', ')}: imported edge IPs cause Error 1000; they are removed on --apply`)
  if (!APPLY) { console.log('DRY RUN — re-run with --apply'); process.exit(0) }

  for (const b of blockers) { await cf('DELETE', `/zones/${zone.id}/dns_records/${b.id}`); console.log(`dns del  ${b.type} ${b.name} ${b.content}`) }
  if (!cname) await cf('POST', `/zones/${zone.id}/dns_records`, { type: 'CNAME', name: DOMAIN, content: target, proxied: false, ttl: 1 })
  else if (cname.content !== target || cname.proxied) await cf('PATCH', `/zones/${zone.id}/dns_records/${cname.id}`, { content: target, proxied: false })
  console.log(`dns      CNAME ${DOMAIN} -> ${target} (DNS only)`)
  if (txtHost && !txt) { await cf('POST', `/zones/${zone.id}/dns_records`, { type: 'TXT', name: fq(txtHost), content: txtValue, ttl: 1 }); console.log(`dns add  TXT ${fq(txtHost)}`) }

  let retried = false
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 15000))
    const d = (await readDomains()).customDomains.find((x) => x.domain === DOMAIN)
    const cert = d.status.certificateStatus
    process.stdout.write(`  ${new Date().toISOString().slice(11, 19)} cert ${cert} verified ${d.status.verified}\n`)
    if (/VALID$/.test(cert) && !/INVALID/.test(cert)) {
      const now = (await cf('GET', `/zones/${zone.id}/dns_records?name=${encodeURIComponent(DOMAIN)}&type=CNAME`))[0]
      await cf('PATCH', `/zones/${zone.id}/dns_records/${now.id}`, { proxied: true })
      console.log(`dns      ${DOMAIN} proxied. Ignore Railway's REQUIRES_UPDATE badge from here on.`)
      break
    }
    if (/FAILED/.test(cert) && !retried) { await gql('mutation($id:String!){ customDomainIssueCertificate(id:$id) }', { id: d.id }).catch((e) => console.log(`retry failed: ${e.message}`)); retried = true; console.log('  certificate retry requested') }
    if (i === 39) { console.error('certificate not VALID after 10 minutes; check the TXT, WAF rules on /.well-known/acme-challenge/, then re-run'); process.exit(1) }
  }
}

if (flag('delete-service-domain') && APPLY) {
  for (const sd of domains.serviceDomains) {
    await gql('mutation($id:String!){ serviceDomainDelete(id:$id) }', { id: sd.id })
    console.log(`deleted service domain ${sd.domain} (it bypassed Cloudflare)`)
  }
} else if (domains.serviceDomains.length) console.log(`note     service domain(s) ${domains.serviceDomains.map((d) => d.domain).join(', ')} still serve; on staging delete them (--delete-service-domain)`)

const probe = await fetch(`https://${DOMAIN}/`, { redirect: 'manual' }).catch((e) => ({ status: e.cause?.code ?? e.message }))
console.log(`probe    https://${DOMAIN}/ -> ${probe.status}${probe.status === 'ENOTFOUND' ? ' (new names can NXDOMAIN locally for a while: use doh-lookup.cjs or curl --resolve)' : ''}`)
console.log('next     PUBLIC_ORIGIN: node ../instatic-domain-origins/check-origins.mjs https://' + DOMAIN)
