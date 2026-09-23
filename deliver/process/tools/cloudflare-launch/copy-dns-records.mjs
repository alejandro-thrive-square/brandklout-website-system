#!/usr/bin/env node
/**
 * Compare the LIVE DNS of a domain (over DoH) with its Cloudflare zone, and copy what is missing.
 * Run it before every nameserver switch.
 *
 * Origin: the zone-vs-live check done by hand on bk-mason-park (2026-09-17: the Cloudflare scan
 * missed the `mail` A record and carried DMARC/DKIM records the live DNS did not have) and the
 * IFA cutover (2026-09-11: the Cloudflare import drops DKIM). Promoted 2026-09-23.
 *
 *   node copy-dns-records.mjs --zone example.com --snapshot email-dns-example.com.json > diff.log
 *   node copy-dns-records.mjs --zone example.com --snapshot email-dns-example.com.json --apply
 *   node copy-dns-records.mjs --zone example.com --hosts ftp,shop,booking     # extra names to check
 *
 * --snapshot is the JSON written by scenario-1-migration/scripts/email-dns-audit.mjs. Without it
 * only the apex, www and --hosts are compared (A, AAAA, CNAME, MX, TXT).
 *
 * --apply only ADDS live records missing from the zone, always DNS-only (grey cloud): mail
 * records must never be proxied, and web records are proxied later on purpose. It never deletes:
 * records that exist only in the zone are listed for a human decision (an enforcing DMARC the
 * live DNS does not have will start quarantining mail the day the nameservers change).
 *
 * Token: needs Zone Read + DNS Write on that zone. The shared CLOUDFLAREAPI has no zone
 * permissions; mint one with mint-token.mjs and export it as CLOUDFLARE_API_TOKEN.
 */
import { readFileSync } from 'node:fs'
import { cf, zoneFor, arg, flag } from './cf-api.mjs'
import { doh } from './doh.mjs'

const ZONE = arg('zone')
if (!ZONE) { console.error('usage: node copy-dns-records.mjs --zone <domain> [--snapshot file.json] [--hosts a,b] [--apply]'); process.exit(2) }
const APPLY = flag('apply')
const zone = await zoneFor(ZONE)

// ── live side ──────────────────────────────────────────────────────────────
const live = []
const push = (r) => { if (!live.some((l) => l.name === r.name && l.type === r.type && l.data === r.data)) live.push(r) }
const snapshotPath = arg('snapshot')
if (snapshotPath) for (const r of JSON.parse(readFileSync(snapshotPath, 'utf8')).records) push({ name: r.name, type: r.type, data: r.data })
const names = [ZONE, `www.${ZONE}`, ...(arg('hosts', '') ? arg('hosts').split(',').map((h) => `${h.trim()}.${ZONE}`) : [])]
for (const n of names) for (const t of ['A', 'AAAA', 'CNAME', 'MX', 'TXT']) {
  for (const a of await doh(n, t)) push({ name: a.name.replace(/\.$/, ''), type: t, data: a.data })
}

// ── zone side ──────────────────────────────────────────────────────────────
const zoneRecords = []
for (let page = 1; ; page++) {
  const batch = await cf('GET', `/zones/${zone.id}/dns_records?per_page=100&page=${page}`)
  zoneRecords.push(...batch)
  if (batch.length < 100) break
}

/* Compare on name + type + normalized value. DoH quotes TXT and puts the MX priority first. */
const norm = (type, data, priority) => {
  let d = String(data).trim()
  if (type === 'TXT') d = d.replace(/^"|"$/g, '').replace(/"\s*"/g, '')
  if (type === 'MX' && priority !== undefined) d = `${priority} ${d}`
  return d.toLowerCase().replace(/\.$/, '')
}
const key = (name, type, value) => `${name.toLowerCase()}|${type}|${value}`
const zoneKeys = new Set(zoneRecords.map((r) => key(r.name, r.type, norm(r.type, r.content, r.priority))))
const liveKeys = new Set(live.map((r) => key(r.name, r.type, norm(r.type, r.data))))

/* A proxied A/CNAME in the zone shows Cloudflare IPs over DoH once active, so web records are only
   compared by presence of the name, not the value. */
const webType = (t) => ['A', 'AAAA', 'CNAME'].includes(t)
const missing = live.filter((r) => {
  if (zoneKeys.has(key(r.name, r.type, norm(r.type, r.data)))) return false
  if (webType(r.type) && zoneRecords.some((z) => z.name.toLowerCase() === r.name.toLowerCase() && webType(z.type))) return false
  return true
})
const extra = zoneRecords.filter((z) => !['NS', 'SOA'].includes(z.type) && !liveKeys.has(key(z.name, z.type, norm(z.type, z.content, z.priority)))
  && !(webType(z.type) && live.some((l) => l.name.toLowerCase() === z.name.toLowerCase() && webType(l.type))))

console.log(`zone ${zone.name} (${zone.status}); ${zoneRecords.length} zone records, ${live.length} live records checked`)
console.log(`\nLIVE BUT MISSING FROM THE ZONE (${missing.length}) — these break on the nameserver switch:`)
for (const r of missing) console.log(`  ${r.type.padEnd(5)} ${r.name}  ${r.data.slice(0, 100)}`)
console.log(`\nIN THE ZONE BUT NOT LIVE (${extra.length}) — decide each one with the client before switching:`)
for (const z of extra) console.log(`  ${z.type.padEnd(5)} ${z.name}  ${String(z.content).slice(0, 100)}${z.proxied ? '  (proxied)' : ''}`)

if (!APPLY) { console.log('\nDRY RUN — re-run with --apply to add the missing live records (DNS-only)'); process.exit(0) }

for (const r of missing) {
  const body = { type: r.type, name: r.name, ttl: 1, proxied: false }
  if (r.type === 'MX') { const [prio, ...host] = r.data.split(/\s+/); body.priority = Number(prio); body.content = host.join(' ').replace(/\.$/, '') }
  else if (r.type === 'TXT') body.content = r.data.replace(/^"|"$/g, '').replace(/"\s*"/g, '')
  else body.content = r.data.replace(/\.$/, '')
  if (!webType(r.type)) delete body.proxied
  await cf('POST', `/zones/${zone.id}/dns_records`, body)
  console.log(`added ${r.type} ${r.name}`)
}
console.log('\ndone. Re-run without --apply: the first list must be empty before the nameservers change.')
