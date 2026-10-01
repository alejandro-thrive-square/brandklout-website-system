#!/usr/bin/env node
/**
 * Set the zone's SSL baseline and prove every host still serves: SSL Full (strict), Always Use
 * HTTPS on, minimum TLS 1.2. Optionally report or turn off Email Obfuscation.
 *
 * Origin: settings changed by hand on bk-ifa-dentistry (2026-09-11), bk-mason-park-kids (2026-09-14)
 * and brandklout.ai (2026-09-22); Email Obfuscation findings from bk-stone (2026-09-17) and IFA
 * (2026-09-18 A2P review). Written as a script 2026-09-23.
 *
 *   node zone-hardening.mjs --zone example.com --hosts example.com,www.example.com,staging.example.com   # dry run
 *   node zone-hardening.mjs --zone example.com --hosts ... --apply
 *   node zone-hardening.mjs --zone example.com --hosts ... --apply --email-obfuscation off              # client's call
 *
 * Flexible SSL makes Railway loop (it redirects http to https); Full (strict) is correct because the
 * Railway origin has a valid certificate. After the change every --hosts entry must still answer
 * 200 or a redirect; the script re-checks and reverts ssl to the previous value if any host breaks.
 *
 * Email Obfuscation rewrites mailto: links to /cdn-cgi/l/email-protection (a 404 to link checkers,
 * "[email protected]" with scripts off, which A2P reviewers see). Turning it off is the client's
 * decision; this script only reports it unless --email-obfuscation off is passed.
 *
 * Token: minted with mint-token.mjs --preset launch (Zone Settings Write, SSL and Certificates Write).
 */
import { cf, zoneFor, arg, flag } from './cf-api.mjs'

const ZONE = arg('zone')
const HOSTS = (arg('hosts', '') || '').split(',').map((s) => s.trim()).filter(Boolean)
if (!ZONE || !HOSTS.length) { console.error('usage: node zone-hardening.mjs --zone <domain> --hosts a,b,c [--apply] [--email-obfuscation off]'); process.exit(2) }
const zone = await zoneFor(ZONE)

const WANT = { ssl: 'strict', always_use_https: 'on', min_tls_version: '1.2' }
const EO = arg('email-obfuscation')
if (EO) WANT.email_obfuscation = EO

const current = {}
for (const id of [...Object.keys(WANT), 'email_obfuscation']) {
  try { current[id] = (await cf('GET', `/zones/${zone.id}/settings/${id}`)).value } catch (e) { current[id] = `? (${e.code ?? e.status})` }
}
const probe = async () => Promise.all(HOSTS.map(async (h) => {
  const r = await fetch(`https://${h}/`, { redirect: 'manual' }).catch((e) => ({ status: e.cause?.code ?? e.message }))
  return [h, r.status]
}))

console.log(`zone ${zone.name} (${zone.status})`)
for (const [id, want] of Object.entries(WANT)) console.log(`  ${id.padEnd(18)} ${String(current[id]).padEnd(10)} -> ${want}${current[id] === want ? '  (ok)' : ''}`)
if (!EO) console.log(`  email_obfuscation  ${current.email_obfuscation}  (report only; the client decides)`)
const before = await probe()
console.log(`hosts before: ${before.map(([h, s]) => `${h} ${s}`).join(', ')}`)
if (!flag('apply')) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

for (const [id, value] of Object.entries(WANT)) {
  if (current[id] === value) continue
  await cf('PATCH', `/zones/${zone.id}/settings/${id}`, { value }, { retries: 2 })
  console.log(`set ${id} = ${value}`)
}
await new Promise((r) => setTimeout(r, 5000))
const after = await probe()
console.log(`hosts after:  ${after.map(([h, s]) => `${h} ${s}`).join(', ')}`)
const broken = after.filter(([, s]) => !(s === 200 || (s >= 301 && s <= 308)))
if (broken.length) {
  console.error(`BROKEN: ${broken.map(([h, s]) => `${h} ${s}`).join(', ')}; reverting ssl to ${current.ssl}`)
  if (typeof current.ssl === 'string' && !current.ssl.startsWith('?')) await cf('PATCH', `/zones/${zone.id}/settings/ssl`, { value: current.ssl })
  process.exit(1)
}
console.log('done: every host still serves')
