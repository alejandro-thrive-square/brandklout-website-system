#!/usr/bin/env node
/**
 * Snapshot every email-related DNS record of a domain over DoH, BEFORE any nameserver change.
 *
 * Origin: the email-record checks done by hand on bk-ifa-dentistry (2026-09-11 cutover) and
 * bk-mason-park (2026-09-17: the Cloudflare scan missed the live `mail` A record and held a
 * DMARC p=quarantine and a google._domainkey the live DNS did not have). Written as a script
 * 2026-09-23. Plain DNS (nslookup) times out on the agency workstation, so this uses DoH only.
 *
 *   node email-dns-audit.mjs old-domain.com --out <client>/docs/migration > audit.log
 *   node email-dns-audit.mjs old-domain.com --selectors s1,s2,mandrill --out <dir> > audit.log
 *
 * Writes <out>/email-dns-<domain>.json, .md and <domain>-email.zone (BIND, for the dashboard import): MX, SPF, DMARC, DKIM (common selectors plus
 * --selectors), mail/webmail/autodiscover hosts, SRV autodiscover, and the verification TXT
 * records (google-site-verification, MS=, etc.). The .md is the checklist to re-create or
 * compare in Cloudflare with tools/cloudflare-launch/copy-dns-records.mjs.
 *
 * DKIM selectors cannot be listed over DNS: ask the email provider (Google Workspace:
 * `google`; Microsoft 365: `selector1`/`selector2`; SiteGround: `default`) and pass any
 * other selector with --selectors. A missing DKIM record after the switch sends mail to spam.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const domain = process.argv[2]
if (!domain || domain.startsWith('--')) { console.error('usage: node email-dns-audit.mjs <domain> [--selectors a,b] [--out dir]'); process.exit(2) }
const val = (n) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : null }
const OUT = val('out') ?? '.'
const EXTRA = (val('selectors') ?? '').split(',').map((s) => s.trim()).filter(Boolean)
const SELECTORS = [...new Set([...EXTRA, 'google', 'default', 'selector1', 'selector2', 'k1', 'k2', 's1', 's2', 'dkim', 'mail',
  'smtp', 'mandrill', 'mxvault', 'zoho', 'zmail', 'protonmail', 'protonmail2', 'protonmail3', 'hs1', 'hs2', 'fm1', 'fm2', 'fm3',
  'ctct1', 'ctct2', 'mailjet', 'sendgrid', 'smtpapi', 'everlytickey1', 'everlytickey2', 'turbo-smtp', 'cm', 'krs', 'gd', 'brevo1', 'brevo2', 'mte1', 'mte2'])]

const TYPES = { A: 1, CNAME: 5, MX: 15, TXT: 16, AAAA: 28, SRV: 33 }
async function doh(name, type) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, { headers: { accept: 'application/dns-json' } })
      const json = await res.json()
      return (json.Answer ?? []).filter((a) => a.type === TYPES[type] || (a.type === 5 && type !== 'CNAME')).map((a) => ({ name: a.name.replace(/\.$/, ''), type: a.type === 5 ? 'CNAME' : type, ttl: a.TTL, data: a.data }))
    } catch (e) { if (i === 2) throw e; await new Promise((r) => setTimeout(r, 1000)) }
  }
}

const found = []
const take = (group, recs) => { for (const r of recs) if (!found.some((f) => f.name === r.name && f.type === r.type && f.data === r.data)) found.push({ group, ...r }) }

take('mx', await doh(domain, 'MX'))
const txt = await doh(domain, 'TXT')
take('spf', txt.filter((r) => /v=spf1/i.test(r.data)))
take('verification', txt.filter((r) => !/v=spf1/i.test(r.data)))
take('dmarc', await doh(`_dmarc.${domain}`, 'TXT'))
for (const s of SELECTORS) {
  const name = `${s}._domainkey.${domain}`
  take('dkim', [...await doh(name, 'TXT'), ...await doh(name, 'CNAME')])
}
for (const h of ['mail', 'webmail', 'smtp', 'imap', 'pop', 'autodiscover', 'autoconfig', 'email', 'mta-sts', 'em', 'bounce']) {
  const name = `${h}.${domain}`
  take('mail-host', [...await doh(name, 'CNAME'), ...await doh(name, 'A')])
}
take('srv', await doh(`_autodiscover._tcp.${domain}`, 'SRV'))
take('mta-sts', await doh(`_mta-sts.${domain}`, 'TXT'))
take('tls-rpt', await doh(`_smtp._tls.${domain}`, 'TXT'))

const provider = (() => {
  const mx = found.filter((f) => f.group === 'mx').map((f) => f.data.toLowerCase()).join(' ')
  if (/google|googlemail/.test(mx)) return 'Google Workspace (DKIM selector usually "google")'
  if (/outlook|protection\.outlook/.test(mx)) return 'Microsoft 365 (DKIM selector1/selector2 CNAMEs)'
  if (/mailspamprotection|siteground/.test(mx)) return 'SiteGround (keep mail A and MX as they are)'
  if (/secureserver|godaddy/.test(mx)) return 'GoDaddy mail'
  if (/zoho/.test(mx)) return 'Zoho Mail'
  return mx ? 'unknown: ask the client who hosts email' : 'NO MX: the domain receives no email, confirm with the client'
})()

mkdirSync(OUT, { recursive: true })
const stamp = new Date().toISOString()
writeFileSync(join(OUT, `email-dns-${domain}.json`), JSON.stringify({ domain, checkedAt: stamp, provider, records: found }, null, 1) + '\n')
const md = [
  `# Email DNS snapshot: ${domain}`, '',
  `Checked ${stamp} over DoH (cloudflare-dns.com). Provider guess: ${provider}.`, '',
  'Every row must exist in the new DNS zone BEFORE the nameservers change. Mail records stay DNS-only (grey cloud).', '',
  '| Group | Type | Name | Value | TTL |', '| --- | --- | --- | --- | --- |',
  ...found.map((f) => `| ${f.group} | ${f.type} | ${f.name} | \`${f.data.replace(/\|/g, '\\|')}\` | ${f.ttl} |`), '',
  found.some((f) => f.group === 'dkim') ? '' : '**No DKIM found on the common selectors.** Ask the email provider for the selector and re-run with --selectors.',
  found.some((f) => f.group === 'dmarc' && /p=(quarantine|reject)/i.test(f.data)) ? '**DMARC is enforcing.** A missing SPF or DKIM after the switch bounces or quarantines mail.' : '',
  '', '## Version Control', '', 'Generated by deliver/process/scenario-1-migration/scripts/email-dns-audit.mjs; follows SYSTEM_RULES.md §4.', '',
].join('\n')
writeFileSync(join(OUT, `email-dns-${domain}.md`), md)
/* BIND file for the Cloudflare dashboard import (DNS > Records > Import and Export), the IFA
   route when the token cannot write DNS. Web records (@, www) are deliberately left out. */
const zoneLines = found.map((f) => {
  const data = f.type === 'TXT' && !f.data.startsWith('"') ? `"${f.data}"` : f.data
  return `${f.name}. ${f.ttl || 3600} IN ${f.type} ${data}`
})
writeFileSync(join(OUT, `${domain}-email.zone`), [
  `; ${domain}: email and verification records only, read over DoH on ${stamp}.`,
  '; Import into the new Cloudflare zone BEFORE the nameserver switch. Set every imported record DNS-only.', '',
  ...zoneLines, ''].join('\n'))
console.log(`${found.length} email records for ${domain} (${provider}); wrote ${OUT}/email-dns-${domain}.md`)
for (const f of found) console.log(`  ${f.group.padEnd(12)} ${f.type.padEnd(5)} ${f.name}  ${f.data.slice(0, 90)}`)
