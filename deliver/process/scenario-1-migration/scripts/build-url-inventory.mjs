#!/usr/bin/env node
/**
 * Merge every source of old URLs into one inventory with provenance: the input of the redirect map.
 *
 * Origin: the "three inventory sources, never one" rule of the old 14-migration-seo-redirects
 * directive and bk-dr-nahlah workflows/14-migration-seo-redirects/.tmp/provenance.mjs (the live
 * scrape had 78 URLs; Wayback CDX added 29 legacy URLs it missed). Generalized 2026-09-23.
 *
 *   node build-url-inventory.mjs --from scrape=<scrape>/site-data.json --from wayback=<wb>/wayback-paths.txt \
 *        --from wxr=<recovered>/urls.txt --from gsc=gsc-pages.csv --out <capture dir> [--check https://www.old.com]
 *
 * Each --from is label=file. A .json file is read as scrape_site.py records or a mirror's site-data
 * ({ pages: [...] }); anything else as one URL or path per line (the first CSV column when it has
 * commas, so a Search Console "Pages" export works as is). Paths are normalised: lower case, no
 * trailing slash, no query, no static assets or WordPress plumbing.
 * --check fetches each path on the old host (no redirects followed) and records the status, which
 * tells a page that still serves from one only the archive remembers.
 * Writes <out>/url-inventory.txt (paths, one per line) and <out>/url-inventory.csv (path, sources, status).
 */
import fs from 'node:fs'
import path from 'node:path'

const froms = []
for (let i = 2; i < process.argv.length; i++) if (process.argv[i] === '--from') froms.push(process.argv[++i])
const val = (n) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : null }
const OUT = path.resolve(val('out') || '.'), CHECK = val('check')?.replace(/\/$/, '')
if (!froms.length) { console.error('usage: node build-url-inventory.mjs --from label=file [--from ...] --out <dir> [--check https://old-host]'); process.exit(2) }

const NOISE = /\.(css|js|map|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|mp4|webm|mp3|pdf|zip|xml|json|txt)$|^\/wp-(content|includes|json|admin)(\/|$)|^\/xmlrpc\.php|^\/cdn-cgi\//i
const norm = (u) => {
  let p
  try { p = new URL(u).pathname } catch { p = u.split(/[?#]/)[0] }
  try { p = decodeURIComponent(p) } catch {}
  p = ('/' + p.replace(/^\/+/, '')).toLowerCase().replace(/\/{2,}/g, '/').replace(/\/+$/, '')
  return p || '/'
}
const inv = new Map()
for (const f of froms) {
  const [label, file] = f.split(/=(.*)/s)
  const raw = fs.readFileSync(file, 'utf8')
  let list
  if (file.endsWith('.json')) { const j = JSON.parse(raw); list = (Array.isArray(j) ? j : j.pages ?? []).filter((r) => !r.error && r.status !== 'fail').map((r) => r.url) }
  else list = raw.split(/\r?\n/).map((l) => l.split(',')[0].replace(/^"|"$/g, '').trim()).filter((l) => l && !/^(url|page|top pages|address)$/i.test(l))
  let n = 0
  for (const u of list) {
    const p = norm(u)
    if (NOISE.test(p)) continue
    if (!inv.has(p)) inv.set(p, { sources: new Set(), status: '' })
    inv.get(p).sources.add(label); n++
  }
  console.log(`${label.padEnd(10)} ${n} URLs from ${file}`)
}
if (CHECK) {
  const q = [...inv.keys()]
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (q.length) {
      const p = q.shift()
      const r = await fetch(CHECK + p, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (migration inventory)' } }).catch((e) => ({ status: e.cause?.code ?? 'ERR' }))
      inv.get(p).status = String(r.status)
      await new Promise((res) => setTimeout(res, 300))   // old hosts rate-limit (429) under load
    }
  }))
}
const rows = [...inv.entries()].sort(([a], [b]) => a.localeCompare(b))
fs.mkdirSync(OUT, { recursive: true })
fs.writeFileSync(path.join(OUT, 'url-inventory.txt'), rows.map(([p]) => p).join('\n') + '\n')
fs.writeFileSync(path.join(OUT, 'url-inventory.csv'), ['path,sources,status', ...rows.map(([p, v]) => `"${p.replace(/"/g, '""')}",${[...v.sources].join('+')},${v.status}`)].join('\n') + '\n')
const only = (label) => rows.filter(([, v]) => v.sources.size === 1 && v.sources.has(label)).length
console.log(`\n${rows.length} unique old paths` + froms.map((f) => f.split('=')[0]).map((l) => `; only in ${l}: ${only(l)}`).join(''))
console.log(`wrote ${OUT}/url-inventory.txt and url-inventory.csv`)
