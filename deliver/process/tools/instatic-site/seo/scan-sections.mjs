#!/usr/bin/env node
/**
 * scan-sections.mjs — step 1 of the content-built schema chain (scan → facts → build → push → verify).
 *
 * Reads what every indexed page actually says, section by section, so the structured data is built
 * from the visible copy and not from the meta description. For each sitemap URL of the host
 * (default: site.origin from seo-config.json): the served <title> and meta description, the words,
 * the visible breadcrumb, and every <section> outside header/nav/footer as
 *   { h1?, headline?, h2, lead[], items[{ h3, text[] }], qa[{ q, a }], images[{ src, alt }], videos[], quotes?, table? }
 * plus, for collection entries (articles.prefix), the body split at its h2s.
 *
 *   node scan-sections.mjs [--config output/seo-config.json] [--host https://staging.example.com] [--out output/schema]
 *                          [--also /new-page,/other-page]   pages the sitemap does not list yet (staging builds)
 *     → <out>/sections.json
 *
 * Read-only: plain GETs of the public pages, no login. Markup assumptions: lib/sections.mjs.
 * Promoted 2026-10-07 from bk-dr-nahlah workflows/22-instatic-api-sync/seo-v3/scan-sections.mjs
 * (class names, host and article paths moved to seo-config.json).
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfig, arg, outDir } from './lib/seo-config.mjs'
import { get, sitemapLocs, slugOfPath, makeReader, stripChrome, txt } from './lib/sections.mjs'

const C = loadConfig()
const OUT = outDir()
mkdirSync(OUT, { recursive: true })
const HOST = (arg('--host', C.site.origin)).replace(/\/+$/, '')
const R = makeReader(C.markup)
const prefix = C.articles?.prefix ?? null

const urls = await sitemapLocs(HOST, C.site.origin)
// --also /a,/b: pages a sitemap does not list yet. A staging host serves no sitemap and is read at
// production's paths, so pages built on staging first are invisible to the schema without this.
for (const p of arg('--also', '').split(',').map((x) => x.trim()).filter(Boolean)) {
  const u = HOST + (p.startsWith('/') ? p : '/' + p)
  if (!urls.includes(u)) urls.push(u)
}
if (!urls.length) { console.error(`no sitemap URLs on ${HOST} (or ${C.site.origin}) — nothing scanned`); process.exit(1) }
const pages = {}
let fails = 0
for (const u of urls) {
  const { s, h } = await get(u)
  if (s !== 200) { console.log('status', s, u); fails++; continue }
  const path = new URL(u).pathname
  const slug = slugOfPath(path)
  const body = h.split('</head>')[1] || ''
  const sections = R.sectionsOf(body)
  const words = txt(stripChrome(body)).split(' ').length
  pages[slug] = { url: HOST + path, ...R.headOf(h), words, crumb: R.crumbOf(body), sections }
  if (prefix && slug.startsWith(prefix)) {
    const post = R.articleOf(body)
    if (post) pages[slug].post = post
    else console.log(`note     ${path}: no article region (markup.articleRegionAttr "${C.markup.articleRegionAttr}")`)
  }
}
writeFileSync(join(OUT, 'sections.json'), JSON.stringify(pages, null, 1))
console.log(`host ${HOST}: pages ${Object.keys(pages).length} of ${urls.length} → ${join(OUT, 'sections.json')}`)
process.exit(fails ? 1 : 0)
