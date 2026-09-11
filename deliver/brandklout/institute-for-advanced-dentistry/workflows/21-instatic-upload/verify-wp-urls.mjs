/**
 * Does every WordPress URL still answer? Reads the scrape's pages.csv (the WordPress URL list) and
 * requests each one.
 *
 *   against the Railway host (default): applies docs/dns/URL-RULES.md's Cloudflare rules itself and
 *     requests the flat Instatic slug, because the host has no Cloudflare in front of it;
 *   against the real domain: requests the WordPress path as it is, so Cloudflare's rules are what
 *     is being tested.
 *
 * Usage: node verify-wp-urls.mjs [base] > .tmp/verify-wp-urls.log 2>&1
 * (redirect to a file: Node 24 on Windows can die when stdout is a pipe)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const CSV = path.join(HERE, '..', '01-content-intake', '.tmp', 'current-site-scrape', 'pages.csv')
const BASE = (process.argv[2] || 'https://institute-for-advanced-dentistry-production.up.railway.app').replace(/\/$/, '')
const viaCloudflare = !/\.up\.railway\.app$/.test(new URL(BASE).host)

// Mirror of docs/dns/URL-RULES.md. Keep the two in step.
const REDIRECTS = [
  [/^\/about\/?$/, '/about-our-practice/'],
  [/^\/contact\/?$/, '/contact-us/'],
]
const REWRITES = [
  [/^\/about-our-practice\/articles\/page\/(.+)$/, (m) => `/about-our-practice-articles-page-${m[1]}`],
  [/^\/category\/([^/]+)\/page\/(.+)$/, (m) => `/category-${m[1]}-page-${m[2]}`],
  [/^\/(dental-services|about-our-practice|contact-us|category)\/(.+)$/, (m) => `/${m[1]}-${m[2]}`],
]

const urls = fs.readFileSync(CSV, 'utf8').trim().split('\n').slice(1).map((l) => JSON.parse(`[${l}]`)[0])
let fail = 0
const lines = []
for (const url of urls) {
  const p = new URL(url).pathname
  const redirect = REDIRECTS.find(([re]) => re.test(p))
  let target = p
  let note = ''
  if (redirect) note = `301 -> ${redirect[1]}`
  else if (!viaCloudflare) {
    for (const [re, to] of REWRITES) {
      const m = p.match(re)
      if (m) { target = to(m); note = `rewrite -> ${target}`; break }
    }
  }
  const r = await fetch(BASE + target, { redirect: 'manual' })
  const loc = r.headers.get('location') || ''
  const ok = redirect
    ? (viaCloudflare ? r.status === 301 && loc.endsWith(redirect[1]) : (await fetch(BASE + redirect[1])).status === 200)
    : r.status === 200
  if (!ok) fail++
  lines.push(`${ok ? 'ok  ' : 'FAIL'} ${r.status} ${p}${note ? '  ' + note : ''}${loc && !redirect ? '  location ' + loc : ''}`)
}
console.log(`${BASE}: ${urls.length} WordPress URLs, ${fail} fail`)
console.log(lines.join('\n'))
process.exitCode = fail ? 1 : 0
