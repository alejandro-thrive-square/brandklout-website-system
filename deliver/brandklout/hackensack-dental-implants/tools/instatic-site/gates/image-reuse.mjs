#!/usr/bin/env node
/**
 * image-reuse.mjs — count how often each photo is used across the site. Reviewers kept finding the
 * same photo on page after page; no gate counted it, because every page looks fine on its own.
 * The rule it enforces is deliver/docs/IMAGES.md: a photo appears once per page and on at most
 * two pages (--max-pages), and each page's hero is its own.
 *
 * Written 2026-09-25 from the team's image feedback on the Brandklout builds.
 *
 * Usage:
 *   node image-reuse.mjs [--dist <dir>] [--base https://staging.example.com] [--max-pages 2]
 *                        [--allow allow.json] > image-reuse.txt 2>&1
 *   allow.json: ["dr-cho-headshot", "front-desk"]  substrings of file names allowed to repeat
 *   (a doctor's headshot on the bio and the team page), each one reported as INFO.
 * Scans every .html in the build (SITE_SRC/dist by default) and, with --base, every URL in the live
 * sitemap. Reads img src/srcset/data-src, <source srcset>, video poster and inline background-image.
 * Images on 80% or more of the pages are the site shell (logo, footer) and are listed, not failed.
 * SVGs and files named logo, icon, favicon, underline, pattern, texture, divider or squiggle are skipped. Exit 1 on any repeat over the limits.
 * Raw HTML only: an image a script injects after load is not seen; check those by eye.
 */
import fs from 'node:fs'
import path from 'node:path'

const argv = process.argv.slice(2)
const val = (n) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv.splice(i, 2)[1] : undefined }
const DIST_ARG = val('dist')
const BASE = (val('base') || '').replace(/\/$/, '')
const MAX_PAGES = Number(val('max-pages') || 2)
const ALLOW_FILE = val('allow')
const allow = ALLOW_FILE ? JSON.parse(fs.readFileSync(ALLOW_FILE, 'utf8')).map((s) => s.toLowerCase()) : []

// One key per photo, whatever size variant or CDN suffix a page asked for.
function key(u) {
  let p
  try { p = decodeURIComponent(new URL(u, 'https://x.invalid/').pathname) } catch { return null }
  let b = path.basename(p).toLowerCase()
  if (/^data:/.test(u) || !b) return null
  b = b.replace(/=w\d+.*$/, '')                                        // Google Photos =w1536
  b = b.replace(/\.(jpe?g|png|webp|avif|gif)$/, '')
  if (/\.svg$/.test(b) || /(logo|icon|favicon|underline|pattern|texture|divider|squiggle)/.test(b)) return null
  return b.replace(/(-p-\d+|[-_@]\d+(w|x)|[-_]\d{2,4}x\d{2,4}|-scaled)$/g, '')  // Webflow, WP, srcset variants
}

function imagesIn(html) {
  const out = []
  const push = (u) => { const k = u && key(u.trim()); if (k) out.push(k) }
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0]
    if (/\swidth="1"/i.test(tag)) continue                          // tracking pixel
    for (const a of ['src', 'data-src']) { const v = tag.match(new RegExp(`\\s${a}="([^"]+)"`, 'i')); if (v) push(v[1]) }
    const ss = tag.match(/\ssrcset="([^"]+)"/i)
    if (ss && !/\ssrc="/i.test(tag)) push(ss[1].split(',')[0].trim().split(/\s+/)[0])
  }
  for (const m of html.matchAll(/<source\b[^>]*\ssrcset="([^"]+)"/gi)) push(m[1].split(',')[0].trim().split(/\s+/)[0])
  for (const m of html.matchAll(/\sposter="([^"]+)"/gi)) push(m[1])
  for (const m of html.matchAll(/background(?:-image)?\s*:[^;"]*url\((['"]?)([^'")]+)\1\)/gi)) push(m[2])
  return out
}

const pages = new Map()   // page -> [keys in document order]
const dist = DIST_ARG ? path.resolve(DIST_ARG) : (await import('../lib/paths.mjs')).DIST
if (!BASE && fs.existsSync(dist)) {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.html') ? [path.join(d, e.name)] : []))
  for (const f of walk(dist)) pages.set(path.relative(dist, f), imagesIn(fs.readFileSync(f, 'utf8')))
} else if (!BASE) { console.error(`no local build at ${dist}; pass --dist or --base`); process.exit(2) }

if (BASE) {
  let urls = []
  // A sitemap index (WordPress, Rank Math) lists child sitemaps; follow them one level.
  const locs = async (u) => { const r = await fetch(u).catch(() => null); return r && r.ok ? [...(await r.text()).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]) : null }
  const top = await locs(BASE + '/sitemap.xml')
  if (top) for (const l of top) {
    if (/\.xml(\?|$)/.test(l)) urls.push(...((await locs(l)) || []).map((c) => BASE + new URL(c).pathname))
    else urls.push(BASE + new URL(l).pathname)
  }
  if (urls.length) urls = [...new Set(urls)]
  else if (fs.existsSync(dist)) urls = (await import('../lib/paths.mjs')).distPages(dist).map((p) => BASE + p.route)
  if (!urls.length) { console.error(`no sitemap at ${BASE}/sitemap.xml and no local build`); process.exit(2) }
  for (const u of urls) {
    const r = await fetch(u).catch(() => null)
    if (!r || !r.ok) { console.log(`${r ? r.status : 'ERR'}  ${u}`); continue }
    pages.set(u, imagesIn(await r.text()))
  }
}

const n = pages.size
const shell = new Set()
const onPages = new Map()   // key -> Set(page)
for (const [p, ks] of pages) for (const k of new Set(ks)) { if (!onPages.has(k)) onPages.set(k, new Set()); onPages.get(k).add(p) }
if (n >= 5) for (const [k, s] of onPages) if (s.size / n >= 0.8) shell.add(k)

let bad = 0
const allowed = (k) => allow.some((a) => k.includes(a))
for (const [p, ks] of pages) {
  const seen = new Map()
  for (const k of ks) if (!shell.has(k)) seen.set(k, (seen.get(k) || 0) + 1)
  for (const [k, c] of seen) if (c > 1 && !allowed(k)) { bad++; console.log(`TWICE  ${p}  ${k} x${c}`) }
}
const heroes = new Map()    // first non-shell image of each page = its hero
for (const [p, ks] of pages) { const h = ks.find((k) => !shell.has(k)); if (h) { if (!heroes.has(h)) heroes.set(h, []); heroes.get(h).push(p) } }
for (const [k, ps] of heroes) if (ps.length > 1 && !allowed(k)) { bad++; console.log(`HERO   ${k} leads ${ps.length} pages: ${ps.join(', ')}`) }
for (const [k, s] of [...onPages].sort((a, b) => b[1].size - a[1].size)) {
  if (shell.has(k)) { console.log(`SHELL  ${k} on ${s.size}/${n} pages (site shell, not counted)`); continue }
  if (s.size <= MAX_PAGES) continue
  if (allowed(k)) { console.log(`INFO   ${k} on ${s.size} pages (allowed)`); continue }
  bad++
  console.log(`REUSE  ${k} on ${s.size} pages (max ${MAX_PAGES}): ${[...s].join(', ')}`)
}
console.log(`\n${n} pages, ${onPages.size} distinct images, ${bad} problem(s)`)
process.exit(bad ? 1 : 0)
