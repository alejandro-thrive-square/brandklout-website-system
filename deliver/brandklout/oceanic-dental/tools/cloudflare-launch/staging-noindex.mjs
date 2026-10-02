#!/usr/bin/env node
/**
 * Keep staging.<domain> out of search: a response-header Transform Rule that adds
 * `X-Robots-Tag: noindex, nofollow` to every response on the staging host, then prove it.
 *
 * Origin: the rule made by hand on bk-stone (2026-09-15), bk-stone-med-spa (2026-09-15),
 * bk-ifa-dentistry (2026-09-18) and brandklout.ai (2026-09-22). Written as a script 2026-09-23.
 *
 *   node staging-noindex.mjs --zone example.com                     # dry run (staging.example.com)
 *   node staging-noindex.mjs --zone example.com --apply
 *   node staging-noindex.mjs --zone example.com --host review.example.com --apply
 *
 * Why a header and not robots.txt: robots.txt on a Cloudflare zone is generated at the edge for
 * the whole account, and a robots.txt Disallow stops Google fetching the page, so it never sees a
 * noindex and can still index the bare URL. The header needs the page to be fetched, which is what
 * we want. The rule only runs on PROXIED records: the staging CNAME must be orange-clouded.
 *
 * This is one of four staging leaks. The others are not fixed here:
 *   - the staging Railway service domain (*.up.railway.app) bypasses Cloudflare: delete it;
 *   - og:url / canonical / schema @id keep production's siteUrl: set siteUrl to the staging host;
 *   - tag scripts gated on /(^|\.)client\.com$/ run on staging: add a /^staging\./ guard.
 *
 * Token: the http_response_headers_transform phase accepts the shared account-owned token on some
 * zones and a minted --preset launch token (Zone Transform Rules Write) on all. The PUT replaces the
 * phase, so existing rules are read and kept.
 */
import { cf, zoneFor, entrypoint, stripRule, arg, flag } from './cf-api.mjs'

const ZONE = arg('zone')
if (!ZONE) { console.error('usage: node staging-noindex.mjs --zone <domain> [--host staging.<domain>] [--apply]'); process.exit(2) }
const HOST = arg('host', `staging.${ZONE}`)
if (HOST === ZONE || HOST === `www.${ZONE}`) { console.error('refusing to noindex the production host'); process.exit(2) }
const PHASE = 'http_response_headers_transform'
const DESCRIPTION = `noindex ${HOST}`

const zone = await zoneFor(ZONE)
const rule = {
  description: DESCRIPTION,
  expression: `(http.host eq "${HOST}")`,
  action: 'rewrite',
  action_parameters: { headers: { 'X-Robots-Tag': { operation: 'set', value: 'noindex, nofollow' } } },
  enabled: true,
}
const ep = await entrypoint(zone.id, PHASE)
const keep = (ep?.rules ?? []).filter((r) => r.description !== DESCRIPTION)
console.log(`zone  ${zone.name}; ${PHASE}: ${(ep?.rules ?? []).length} existing rule(s)`)
console.log(`rule  ${rule.expression} -> X-Robots-Tag: noindex, nofollow`)

const dns = await cf('GET', `/zones/${zone.id}/dns_records?name=${encodeURIComponent(HOST)}`).catch(() => [])
if (dns.length && !dns.some((r) => r.proxied)) console.log(`WARN ${HOST} is DNS-only; the header only applies once it is proxied`)

if (flag('apply')) {
  const updated = await cf('PUT', `/zones/${zone.id}/rulesets/phases/${PHASE}/entrypoint`, { rules: [...keep.map(stripRule), rule] }, { retries: 2 })
  console.log(`applied: ${updated.rules.length} rule(s) in phase`)
  await new Promise((r) => setTimeout(r, 4000))
} else console.log('DRY RUN — re-run with --apply')

// Prove it on the staging host, and prove production is untouched.
for (const [host, want] of [[HOST, true], [ZONE, false], [`www.${ZONE}`, false]]) {
  const r = await fetch(`https://${host}/?noindex-check=${Date.now()}`, { redirect: 'manual' }).catch(() => null)
  const tag = r?.headers.get('x-robots-tag') ?? ''
  const ok = want ? /noindex/i.test(tag) : !/noindex/i.test(tag)
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${host} ${r?.status ?? 'unreachable'} x-robots-tag: ${tag || '(none)'}`)
}
