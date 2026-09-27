#!/usr/bin/env node
/**
 * Replay every row of the 301 map against the live old domain.
 *
 *   node verify-redirects.mjs                 # every known old URL, apex and www, with and without the slash
 *   node verify-redirects.mjs --quick         # apex only, no slash variants
 *   node verify-redirects.mjs --via <url>     # send every request to this origin instead
 *                                             # (the Worker's workers.dev address, before the zone is active)
 *
 * No credentials; changes nothing. Each row must answer exactly one hop: a 301 whose
 * Location is the mapped page on the new host, query string kept. Then every distinct
 * destination must answer 200. Ends with `FAIL  none` when it passes.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const { target, oldHosts, rows } = JSON.parse(readFileSync(join(HERE, '.tmp', 'out', 'redirect-map.json'), 'utf8'))
const QUICK = process.argv.includes('--quick')
const viaAt = process.argv.indexOf('--via')
const VIA = viaAt > 0 ? process.argv[viaAt + 1].replace(/\/$/, '') : null
const hosts = QUICK || VIA ? oldHosts.slice(0, 1) : oldHosts
const origin = (host) => VIA ?? `https://${host}`
const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' }

const cases = []
for (const r of rows) for (const host of hosts) {
  cases.push({ url: origin(host) + encodeURI(r.from), expect: target + r.to })
  if (!QUICK && r.from !== '/') cases.push({ url: origin(host) + encodeURI(r.from) + '/', expect: target + r.to })
}
/* The query string must survive, and a path nobody ever served must still land somewhere. */
cases.push({ url: `${origin(oldHosts[0])}/services/invisalign/?utm_source=verify`, expect: `${target}/services/invisalign?utm_source=verify` })
cases.push({ url: `${origin(oldHosts[0])}/wp-content/uploads/no-such-file-${Date.now()}.jpg`, expect: `${target}/` })
if (!VIA) cases.push({ url: `http://${oldHosts[1]}/about/`, expect: `${target}/about-us` })

const fails = []
let done = 0
async function run(c) {
  const res = await fetch(c.url, { redirect: 'manual', headers: UA }).catch((e) => ({ status: e.cause?.code ?? e.message, headers: new Headers() }))
  const loc = res.headers.get('location')
  if (res.status !== 301 || loc !== c.expect) fails.push(`${c.url}\n      got ${res.status} ${loc ?? ''}\n      want 301 ${c.expect}`)
  done++
}
const queue = [...cases]
await Promise.all(Array.from({ length: 8 }, async () => { while (queue.length) await run(queue.shift()) }))

const dests = [...new Set(rows.map((r) => r.to))]
for (const d of dests) {
  const r = await fetch(target + d, { redirect: 'manual', headers: UA }).catch((e) => ({ status: e.message }))
  if (r.status !== 200) fails.push(`destination ${target + d} -> ${r.status}`)
}

console.log(`checked ${done} old URLs via ${VIA ?? hosts.join(', ')}; ${dests.length} destinations`)
console.log(fails.length ? `FAIL  ${fails.length}\n  ${fails.slice(0, 40).join('\n  ')}` : 'FAIL  none')
process.exit(fails.length ? 1 : 0)
