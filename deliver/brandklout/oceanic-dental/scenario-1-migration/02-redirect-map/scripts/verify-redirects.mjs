#!/usr/bin/env node
/**
 * Replay every row of the redirect map against the live edge (or a workers.dev preview).
 *
 * Origin: bk-mason-park mason-park/workflows/12-legacy-redirects/verify-redirects.mjs (2026-09-17),
 * itself from bk-stone 14-migration-seo-redirects/verify-redirects.mjs. Generalized 2026-09-23:
 * reads the map path from --map, supports same-domain and keep-path maps.
 *
 *   node verify-redirects.mjs --map out/redirect-map.json                  # every row, every old host, with and without the slash
 *   node verify-redirects.mjs --map out/redirect-map.json --quick          # first host only, no slash variants
 *   node verify-redirects.mjs --map out/redirect-map.json --via https://<worker>.<sub>.workers.dev
 *                                                                          # before the zone is active
 *
 * No credentials; changes nothing. Each row must answer exactly one hop with the map's
 * status and the mapped Location (query string kept). Every distinct destination must then
 * answer 200. In same-domain mode it also checks that robots.txt is still the edge's file.
 * Ends with "FAIL  none" when it passes. Before the Worker is deployed every row fails: that
 * is the before-state, not a bug.
 */
import { readFileSync } from 'node:fs'

const argv = process.argv
const val = (n) => { const i = argv.indexOf(`--${n}`); return i > 0 ? argv[i + 1] : null }
const MAP_PATH = val('map')
if (!MAP_PATH) { console.error('usage: node verify-redirects.mjs --map <redirect-map.json> [--quick] [--via <origin>]'); process.exit(2) }
const { target, oldHosts, rows, mode, status = 301, keepPath } = JSON.parse(readFileSync(MAP_PATH, 'utf8'))
const QUICK = argv.includes('--quick')
const VIA = val('via')?.replace(/\/$/, '') ?? null
const hosts = QUICK || VIA ? oldHosts.slice(0, 1) : oldHosts
const origin = (host) => VIA ?? `https://${host}`
const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' }

const cases = []
for (const r of rows) for (const host of hosts) {
  const path = r.from === '/' ? '/' : encodeURI(r.from)
  const want = keepPath ? target + r.from : target + r.to
  cases.push({ url: origin(host) + path, expect: want })
  if (!QUICK && r.from !== '/') cases.push({ url: origin(host) + path + '/', expect: keepPath ? want + '/' : want })
}
/* The query string must survive. */
const sample = rows.find((r) => r.from !== '/' && r.rule !== 'fallback')
if (sample) cases.push({ url: `${origin(oldHosts[0])}${encodeURI(sample.from)}/?utm_source=verify`, expect: `${target}${keepPath ? sample.from + '/' : sample.to}?utm_source=verify` })
/* A path nobody ever served: legacy domain lands on the fallback; same domain must still 404 honestly. */
const ghost = `/no-such-page-${Date.now()}`
if (mode === 'legacy-domain' && !keepPath) cases.push({ url: `${origin(oldHosts[0])}${ghost}`, expect: `${target}${rows.find((r) => r.rule === 'fallback')?.to ?? '/'}` })

const fails = []
let done = 0
async function run(c) {
  const res = await fetch(c.url, { redirect: 'manual', headers: UA }).catch((e) => ({ status: e.cause?.code ?? e.message, headers: new Headers() }))
  const loc = res.headers.get('location')
  if (res.status !== status || loc !== c.expect) fails.push(`${c.url}\n      got ${res.status} ${loc ?? ''}\n      want ${status} ${c.expect}`)
  done++
}
const queue = [...cases]
await Promise.all(Array.from({ length: 8 }, async () => { while (queue.length) await run(queue.shift()) }))

if (!keepPath) {
  const dests = [...new Set(rows.map((r) => r.to))]
  for (const d of dests) {
    const r = await fetch(target + d, { redirect: 'manual', headers: UA }).catch((e) => ({ status: e.message }))
    if (r.status !== 200) fails.push(`destination ${target + d} -> ${r.status}`)
  }
  console.log(`${dests.length} destinations checked on ${target}`)
}

if (mode === 'same-domain' && !VIA) {
  const ghostRes = await fetch(`${target}${ghost}`, { redirect: 'manual', headers: UA }).catch(() => ({ status: 0 }))
  if (ghostRes.status !== 404) fails.push(`${target}${ghost} should 404 honestly, got ${ghostRes.status}`)
  const robots = await fetch(`${target}/robots.txt`, { headers: UA }).then((r) => r.text()).catch(() => '')
  /* The Cloudflare content-signals robots.txt is ~1.2 KB. A 70-byte file means something replaced it. */
  if (robots.length < 200) console.log(`WARN robots.txt is ${robots.length} bytes; compare with the pre-deploy copy (the edge file may have been replaced)`)
}

console.log(`checked ${done} old URLs via ${VIA ?? hosts.join(', ')}`)
console.log(fails.length ? `FAIL  ${fails.length}\n  ${fails.slice(0, 40).join('\n  ')}` : 'FAIL  none')
process.exit(fails.length ? 1 : 0)
