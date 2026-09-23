#!/usr/bin/env node
/**
 * Build /sitemap.xml for an Instatic site and the Cloudflare Worker that serves it.
 *
 * Origin: bk-stone-med-spa stone-med-spa/workflows/06-cloudflare-sitemap/build-sitemap.mjs
 * (2026-09-15, itself a cut-down fork of bk-dr-nahlah cloudflare-launch/build_cloudflare.mjs).
 * Generalized 2026-09-23: canonical host, exclusions and extra URLs are arguments, and a crawl
 * picks up collection entries (blog posts) that the pages API does not list.
 *
 *   node build-sitemap-worker.mjs --canonical https://www.example.com --out <client>/workflows/cloudflare/out
 *   node build-sitemap-worker.mjs --canonical https://www.example.com --out <dir> --crawl --exclude thank-you,book-thank-you
 *   node build-sitemap-worker.mjs --canonical https://www.example.com --out <dir> --no-api --extra urls.txt
 *
 * Pages come from the Instatic admin API (INSTATIC_BASE_URL / INSTATIC_EMAIL / INSTATIC_PASSWORD
 * in the generated .env, through ../instatic-api-sync/insta-api.mjs); templated pages (collection
 * templates) are skipped because they never serve at their own slug. --crawl follows same-host
 * links from the home page (cap 1000) to add collection entries. --extra adds a list of paths or
 * URLs. EVERY URL must answer 200 on the canonical host or nothing is written.
 *
 * Writes <out>/sitemap.xml and <out>/sitemap-worker.js. The Worker answers ONLY
 * pathname === '/sitemap.xml' and passes everything else to the origin. Deploy with:
 *   node deploy-worker.mjs --zone example.com --script example-sitemap --file <out>/sitemap-worker.js \
 *     --routes "example.com/sitemap.xml*,www.example.com/sitemap.xml*" --apply
 * Never bind robots.txt to it (the edge generates robots.txt; routing it replaced 1248 B with 70 B
 * on Dr. Nahlah). The sitemap is baked in: rebuild and redeploy when a page is added or renamed.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { arg, flag } from './cf-api.mjs'

const CANONICAL = (arg('canonical') || '').replace(/\/$/, '')
const OUT = resolve(arg('out', 'out'))
if (!/^https:\/\/[^/]+$/.test(CANONICAL)) { console.error('usage: node build-sitemap-worker.mjs --canonical https://www.example.com --out <dir> [--crawl] [--exclude a,b] [--extra file] [--no-api]'); process.exit(2) }
const EXCLUDE = new Set((arg('exclude', '') || '').split(',').map((s) => s.trim().replace(/^\//, '')).filter(Boolean))
const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' }

const entries = new Map()   // path -> lastmod
const norm = (p) => (p.replace(/\/+$/, '') || '/')
const excluded = (p) => EXCLUDE.has(p.replace(/^\//, '')) || /(^|\/)(thank-you|404)$/.test(p)

if (!flag('no-api')) {
  const { getPages } = await import('../instatic-api-sync/insta-api.mjs')
  const res = await getPages()
  const rows = Array.isArray(res) ? res : res.rows ?? res.pages ?? []
  for (const p of rows) {
    if (p.templated) continue
    const path = p.slug === 'index' ? '/' : `/${p.slug}`
    if (!excluded(path)) entries.set(path, String(p.publishedAt || p.updatedAt || '').slice(0, 10))
  }
  console.log(`api: ${rows.length} pages, ${entries.size} kept`)
}

const extra = arg('extra')
if (extra) for (const line of readFileSync(extra, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean)) {
  const path = norm(line.startsWith('http') ? new URL(line).pathname : line)
  if (!excluded(path) && !entries.has(path)) entries.set(path, '')
}

if (flag('crawl')) {
  const seen = new Set(['/'])
  const queue = ['/']
  while (queue.length && seen.size < 1000) {
    const path = queue.shift()
    const r = await fetch(CANONICAL + path, { headers: UA, redirect: 'manual' }).catch(() => null)
    if (!r || r.status !== 200 || !/html/.test(r.headers.get('content-type') || '')) continue
    if (!excluded(path) && !entries.has(path)) entries.set(path, '')
    const html = await r.text()
    if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) { entries.delete(path); continue }
    for (const [, href] of html.matchAll(/href=["']([^"'#]+)["']/g)) {
      let u
      try { u = new URL(href, CANONICAL + path) } catch { continue }
      if (u.origin !== CANONICAL || u.search) continue
      if (/\.(xml|txt|css|js|png|jpe?g|webp|svg|pdf|ico|woff2?)$/i.test(u.pathname) || u.pathname.startsWith('/admin') || u.pathname.startsWith('/cdn-cgi')) continue
      const p = norm(u.pathname)
      if (!seen.has(p)) { seen.add(p); queue.push(p) }
    }
  }
  console.log(`crawl: ${seen.size} links seen`)
}

// Every URL must be live on the canonical host, or the sitemap submits a dead page.
const dead = []
const q = [...entries.keys()]
await Promise.all(Array.from({ length: 8 }, async () => {
  while (q.length) {
    const p = q.shift()
    const r = await fetch(CANONICAL + p, { redirect: 'manual', headers: UA }).catch((e) => ({ status: e.message }))
    if (r.status !== 200) dead.push(`${p} ${r.status}`)
  }
}))
if (dead.length) { console.error(`not 200 on ${CANONICAL}; refusing to write:\n  ${dead.join('\n  ')}`); process.exit(1) }

const sorted = [...entries.entries()].sort(([a], [b]) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)))
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sorted.map(([p, lastmod]) => ['  <url>', `    <loc>${esc(CANONICAL + p)}</loc>`, lastmod ? `    <lastmod>${lastmod}</lastmod>` : null, '  </url>'].filter(Boolean).join('\n')),
  '</urlset>', '',
].join('\n')

/* JSON.stringify, not a template literal, so no character in a slug can break the Worker. */
const worker = `/**
 * Serves /sitemap.xml for ${CANONICAL.replace('https://', '')} (bind apex and www with a trailing *).
 *
 * GENERATED by deliver/process/tools/cloudflare-launch/build-sitemap-worker.mjs. Do not hand-edit:
 * rebuild and redeploy whenever a page or collection entry is added, removed or renamed.
 */
const SITEMAP = ${JSON.stringify(sitemap)}

export default {
  async fetch(request) {
    if (new URL(request.url).pathname === '/sitemap.xml') {
      return new Response(SITEMAP, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
    }
    return fetch(request)
  },
}
`
mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'sitemap.xml'), sitemap)
writeFileSync(join(OUT, 'sitemap-worker.js'), worker)
console.log(`sitemap.xml: ${sorted.length} <url> entries, all 200 on ${CANONICAL}`)
for (const [p] of sorted) console.log(`  ${p}`)
console.log(`wrote ${OUT}`)
