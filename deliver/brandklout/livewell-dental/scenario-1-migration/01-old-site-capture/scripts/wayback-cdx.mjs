#!/usr/bin/env node
/**
 * List every URL the Internet Archive has seen on a domain (Wayback CDX), deduplicated to paths.
 *
 * Origin: the CDX query in the old deliver/process/14-migration-seo-redirects directive, used on
 * bk-dr-nahlah (found 29 URLs the live crawl missed) and bk-stone (archived-urls-raw.txt, the
 * inventory behind the 185-URL 301 map). Written as a script 2026-09-23.
 *
 *   node wayback-cdx.mjs old-domain.com --out <dir> [--all-status] > wayback.log
 *
 * Writes <dir>/wayback-raw.txt (every original URL) and <dir>/wayback-paths.txt (unique paths,
 * static assets and WordPress plumbing removed). Default dir: ./wayback.
 * By default only captures that answered 200 are kept; --all-status keeps redirects too
 * (useful when the old platform had its own redirect chains).
 *
 * The Archive is sometimes offline (Mason Park, 2026-09-17). The script retries three times and
 * then fails loudly: re-run later, never skip this source. Redirect stdout to a file on Windows
 * (Node 24 dies on a piped stdout).
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const domain = process.argv[2]
if (!domain || domain.startsWith('--')) { console.error('usage: node wayback-cdx.mjs <domain> [--out dir] [--all-status]'); process.exit(2) }
const outAt = process.argv.indexOf('--out')
const OUT = outAt > 0 ? process.argv[outAt + 1] : 'wayback'
const ALL = process.argv.includes('--all-status')

const params = new URLSearchParams({ url: `${domain.replace(/^www\./, '')}*`, fl: 'original,statuscode', collapse: 'urlkey', output: 'json' })
if (!ALL) params.append('filter', 'statuscode:200')
const url = `https://web.archive.org/cdx/search/cdx?${params}`

let rows = null
for (let i = 0; i < 3 && !rows; i++) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (migration inventory)' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    rows = text.trim() ? JSON.parse(text) : [['original', 'statuscode']]
  } catch (e) {
    console.error(`attempt ${i + 1}: ${e.message}`)
    await new Promise((r) => setTimeout(r, 5000 * (i + 1)))
  }
}
if (!rows) { console.error('the Wayback CDX API did not answer; re-run later (do not skip this source)'); process.exit(1) }

const originals = rows.slice(1).map((r) => r[0])
const NOISE = /\.(css|js|mjs|map|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|otf|mp4|webm|mp3|pdf|zip|xml|json|txt)(\?|$)|\/wp-(content|includes|json|admin)\/|\/xmlrpc\.php|\/feed\/?$|\/comments\/feed|[?&](replytocom|share|ver|s)=/i
const paths = new Set()
for (const u of originals) {
  let p
  try { p = new URL(u.startsWith('http') ? u : `http://${u}`).pathname } catch { continue }
  if (NOISE.test(u)) continue
  p = p.replace(/\/{2,}/g, '/').replace(/\/+$/, '') || '/'
  paths.add(p.toLowerCase())
}

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'wayback-raw.txt'), originals.join('\n') + '\n')
writeFileSync(join(OUT, 'wayback-paths.txt'), [...paths].sort().join('\n') + '\n')
console.error(`${originals.length} archived URLs -> ${paths.size} unique page paths; wrote ${OUT}/wayback-raw.txt and wayback-paths.txt`)
