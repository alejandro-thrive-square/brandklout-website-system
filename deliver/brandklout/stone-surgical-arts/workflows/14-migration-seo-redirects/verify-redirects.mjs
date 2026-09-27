#!/usr/bin/env node
/**
 * Replay every row of the 301 map against the live old domain.
 *
 *   node verify-redirects.mjs          # every known old URL, apex and www, with and without the slash
 *   node verify-redirects.mjs --quick  # apex only, no slash variants
 *
 * No credentials; changes nothing. For each row it expects exactly one hop:
 * a 301 whose Location is the mapped page on the new host, query string kept.
 * Then every distinct destination must answer 200 on the new host. Ends with
 * `FAIL  none` when it passes.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const { target, oldHosts, rows } = JSON.parse(readFileSync(join(HERE, '.tmp', 'out', 'redirect-map.json'), 'utf8'))
const QUICK = process.argv.includes('--quick')
const hosts = QUICK ? oldHosts.slice(0, 1) : oldHosts

const cases = []
for (const r of rows) for (const host of hosts) {
  const path = r.from === '/' ? '/' : r.from
  cases.push({ url: `https://${host}${encodeURI(path)}`, expect: target + r.to })
  if (!QUICK && path !== '/') cases.push({ url: `https://${host}${encodeURI(path)}/`, expect: target + r.to })
}
/* The query string must survive, and a path nobody ever served must still land somewhere. */
cases.push({ url: `https://${oldHosts[0]}/blog/?utm_source=verify`, expect: `${target}/blog?utm_source=verify` })
cases.push({ url: `https://${oldHosts[0]}/no-such-page-${Date.now()}`, expect: `${target}/` })

const fails = []
let done = 0
async function run(c) {
  const res = await fetch(c.url, { redirect: 'manual' }).catch((e) => ({ status: e.message, headers: new Headers() }))
  const loc = res.headers.get('location')
  if (res.status !== 301 || loc !== c.expect) fails.push(`${c.url}\n      got ${res.status} ${loc ?? ''}\n      want 301 ${c.expect}`)
  done++
}
const queue = [...cases]
await Promise.all(Array.from({ length: 8 }, async () => { while (queue.length) await run(queue.shift()) }))

const dests = [...new Set(rows.map((r) => r.to))]
for (const d of dests) {
  const r = await fetch(target + d, { redirect: 'manual' }).catch((e) => ({ status: e.message }))
  if (r.status !== 200) fails.push(`destination ${target + d} -> ${r.status}`)
}

console.log(`checked ${done} old URLs across ${hosts.join(', ')}; ${dests.length} destinations`)
console.log(fails.length ? `FAIL  ${fails.length}\n  ${fails.slice(0, 40).join('\n  ')}` : 'FAIL  none')
process.exit(fails.length ? 1 : 0)
