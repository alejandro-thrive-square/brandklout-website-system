#!/usr/bin/env node
/**
 * patch-sitemap-worker.mjs — QA 2026-09-28 follow-up (F09, D02), applied to the
 * worker that is ACTUALLY deployed, without regenerating it.
 *
 *   node patch-sitemap-worker.mjs [apple-touch-icon.png]
 *   node deploy-worker.mjs --apply
 *
 * Why a patch and not `build_cloudflare.mjs`: that build reads the pre-v2
 * 15-instatic-api-sync inventories and also re-emits the 301 CSV. Neither is
 * needed to add two pages, and regenerating the redirect map to do it would put
 * every redirect back in play.
 *
 *  - Adds /five-year-warranty (live since 2026-09-21) and /hipaa-disclosure
 *    (2026-10-01) to the sitemap, each only if it answers 200 with a
 *    self-referencing canonical and no noindex. Already-present URLs are left.
 *  - Optionally serves /apple-touch-icon.png and /apple-touch-icon-precomposed.png (the
 *    paths iOS asks for when a page declares no icon; Instatic cannot declare
 *    one) from a 180×180 PNG embedded in the worker. See make-touch-icon.mjs.
 *    NOT USED as of 2026-10-02: the Cloudflare token cannot bind routes (403),
 *    so the icon is declared from seo-head.js instead (22-instatic-api-sync).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const FILE = join(HERE, '.tmp', 'out', 'sitemap-worker.js')
const CANONICAL = 'https://www.drnahlah.com'
const ADD = [
  { path: '/five-year-warranty', lastmod: '2026-09-21' },
  { path: '/hipaa-disclosure', lastmod: '2026-10-01' },
]
const icon = process.argv[2] // optional: needs a zone Workers Routes grant the current token lacks (2026-10-02)

let w = readFileSync(FILE, 'utf8')
const m = /const SITEMAP = `([\s\S]*?)`/.exec(w)
let sm = m[1]
const urls = [...sm.matchAll(/<url>\s*<loc>([^<]+)<\/loc>[\s\S]*?<\/url>/g)]

for (const a of ADD) {
  const loc = CANONICAL + a.path
  if (sm.includes(`<loc>${loc}</loc>`)) { console.log(`  have     ${a.path}`); continue }
  const res = await fetch(loc, { redirect: 'manual' })
  const html = await res.text()
  const canon = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1]
  const noindex = /<meta name="robots" content="[^"]*noindex/i.test(html)
  if (res.status !== 200 || canon !== loc || noindex) { console.error(`  REFUSING ${a.path}: ${res.status} canonical=${canon} noindex=${noindex}`); process.exit(1) }
  // pages are sorted by path and come before /posts/*; insert before the first larger page path
  const next = urls.find(([, l]) => { const p = l.slice(CANONICAL.length); return p !== '/' && (p.startsWith('/posts/') || p > a.path) })
  const entry = `<url>\n    <loc>${loc}</loc>\n    <lastmod>${a.lastmod}</lastmod>\n  </url>\n  `
  sm = sm.replace(next[0], entry + next[0])
  console.log(`  added    ${a.path} (before ${next[1].slice(CANONICAL.length)})`)
}
w = w.replace(m[0], 'const SITEMAP = `' + sm + '`')

if (icon && !w.includes('APPLE_TOUCH_ICON')) {
  const b64 = readFileSync(icon).toString('base64')
  w = w.replace('export default {', `/** 180×180 iOS home-screen icon (make-touch-icon.mjs). */
const APPLE_TOUCH_ICON = Uint8Array.from(atob('${b64}'), (c) => c.charCodeAt(0))

export default {`)
  w = w.replace("    if (pathname === '/robots.txt') return robots(request)",
    "    if (pathname === '/robots.txt') return robots(request)\n" +
    "    if (pathname === '/apple-touch-icon.png' || pathname === '/apple-touch-icon-precomposed.png')\n" +
    "      return new Response(APPLE_TOUCH_ICON, { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' } })")
  if (!w.includes("pathname === '/apple-touch-icon.png'")) { console.error('could not wire the icon route'); process.exit(1) }
  console.log(`  icon     embedded (${readFileSync(icon).length} bytes)`)
}
writeFileSync(FILE, w)
console.log(`wrote ${FILE}: ${(sm.match(/<loc>/g) || []).length} sitemap URLs`)
