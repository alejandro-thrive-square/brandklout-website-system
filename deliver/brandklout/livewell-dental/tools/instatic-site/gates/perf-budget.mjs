#!/usr/bin/env node
// PROMOTED 2026-09-23 to tools/instatic-site/gates/perf-budget.mjs. Origin: bk-dr-nahlah,
// workflows/08-qa/perf-budget.mjs. Pages now from --paths or the sitemap; waivers from a JSON file.
/**
 * Performance budget gate — run against PUBLISHED URLs, before sign-off.
 *
 * This exists because a performance regression on this site was invisible until
 * someone happened to run PageSpeed. Every check below encodes a specific way
 * this site has actually been broken, not a generic best-practice list:
 *
 *   1. render-blocking JS in <head>   — 246 KB of it shipped for weeks. Instatic
 *      emits classic scripts as a bare `<script src>` with no defer/async EVER,
 *      and the per-script `timing` field is never read at publish time, so
 *      `placement: head` is silently `placement: block-the-parser`.
 *   2. lazy LCP image                 — `base.image` defaults `loading` to lazy,
 *      so every image including the hero shipped lazy with no fetchpriority.
 *   3. duplicate alt attributes       — the migration put alt into the node's
 *      `htmlAttributes`, which the module renders BEFORE the library's alt.
 *      Two alt attributes; HTML keeps the first; the library was ignored.
 *   4. un-lazy third-party iframes    — the embed module ignores its own `lazy`
 *      prop when `source: 'snippet'`, so vendor markup ships verbatim.
 *   5. parser-blocking vendor scripts — same cause as 4.
 *   6. oversized media                — a 9.2 MB hero video.
 *
 * Deliberately NOT a Lighthouse run: this asserts the CAUSES, which are stable
 * and cheap to check over plain HTTP, rather than a score, which drifts with
 * network conditions and Lighthouse versions. Run a real PSI pass as well —
 * this gate is what tells you WHY the score moved.
 *
 *   node perf-budget.mjs --base https://www.example.com [--paths /a,/b] [--quick] [--waivers perf-waivers.json]
 *   node perf-budget.mjs --json out.json
 */
import fs, { writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name)
  return i === -1 ? fallback : process.argv[i + 1]
}
const BASE = (arg('--base', process.env.INSTATIC_BASE_URL || '')).replace(/\/$/, '')
if (!BASE) { console.error('pass --base https://<published host>'); process.exit(2) }
const JSON_OUT = arg('--json', null)

/* Pages: --paths /a,/b, else the live sitemap, else the home page. (Dr. Nahlah's hardcoded list of
   13 paths is gone: a gate with a page list watches only the list.) --quick keeps the first 5. */
let paths = (arg('--paths', '') || '').split(',').filter(Boolean)
if (!paths.length) {
  const sm = await fetch(BASE + '/sitemap.xml').catch(() => null)
  if (sm && sm.ok) paths = [...(await sm.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)
}
if (!paths.length) paths = ['/']
if (process.argv.includes('--quick')) paths = paths.slice(0, 5)

// ── budgets ────────────────────────────────────────────────────────────────
/* Waivers are per-site decisions, so they live in a JSON file (--waivers perf-waivers.json):
   { "mediaWaivers": { "/uploads/<id>-hero.mp4": "why, who, date" },
     "eagerIframeWaivers": { "api.leadconnectorhq.com": "the contact form IS the page" },
     "noImageLcp": ["/"], "duplicateAltWaivers": { "/video-library": 13 } }
   Every entry is a decision someone made, not a check that passes. */
const W = arg('--waivers', null) ? JSON.parse(fs.readFileSync(arg('--waivers'), 'utf8')) : {}
const BUDGET = {
  blockingHeadJsGz: 0, // nothing may block the parser from <head>
  blockingCssGz: Number(process.env.BUDGET_CSS_GZ ?? 20_000),
  maxMediaBytes: Number(process.env.BUDGET_MEDIA_BYTES ?? 2_000_000),
  mediaWaivers: W.mediaWaivers ?? {},
  eagerIframeWaivers: W.eagerIframeWaivers ?? { 'api.leadconnectorhq.com': 'the contact form IS the page; lazying the thing the visitor came for is the wrong trade' },
  noImageLcp: new Set(W.noImageLcp ?? []),
  duplicateAltWaivers: W.duplicateAltWaivers ?? {},
}

// ── helpers ────────────────────────────────────────────────────────────────
const sizeCache = new Map()
/**
 * Transfer size in bytes.
 *
 * `gzip: true` compresses locally rather than trusting the response. Node's
 * fetch transparently decompresses AND the origin serves these chunked with no
 * `content-length`, so reading the header or the buffer length both yield the
 * DECOMPRESSED size — which silently reported 114,222 B of CSS as "gzip" on the
 * first run of this gate. Compressing here is deterministic, independent of
 * whatever the CDN negotiates, and within a few percent of the wire size.
 */
async function transferSize(url, gzip) {
  const key = `${url}|${gzip}`
  if (sizeCache.has(key)) return sizeCache.get(key)
  const res = await fetch(url)
  const buf = Buffer.from(await res.arrayBuffer())
  const n = gzip ? gzipSync(buf, { level: 9 }).byteLength : buf.byteLength
  sizeCache.set(key, n)
  return n
}
const abs = (src) => (src.startsWith('http') ? src : `${BASE}${src.startsWith('/') ? '' : '/'}${src}`)
const isThirdParty = (src) => /^https?:\/\//i.test(src) && !src.startsWith(BASE)
const headOf = (html) => html.slice(0, html.search(/<\/head>/i) === -1 ? html.length : html.search(/<\/head>/i))

const results = []
function check(page, name, ok, detail) {
  results.push({ page, name, ok, detail })
}

// ── per page ───────────────────────────────────────────────────────────────
for (const path of paths) {
  const url = `${BASE}${path}`
  const res = await fetch(url)
  if (!res.ok) { check(path, 'page responds 200', false, `HTTP ${res.status}`); continue }
  const html = await res.text()
  const head = headOf(html)

  // 1 ── nothing in <head> may block the parser
  const headScripts = [...head.matchAll(/<script\b([^>]*)\bsrc="([^"]+)"([^>]*)>/gi)]
    .filter((m) => {
      const attrs = m[1] + m[3]
      return !/\bdefer\b|\basync\b|type="module"/i.test(attrs)
    })
  let blockingBytes = 0
  for (const m of headScripts) blockingBytes += await transferSize(abs(m[2]), true)
  check(path, 'no render-blocking JS in <head>',
    blockingBytes <= BUDGET.blockingHeadJsGz,
    headScripts.length ? `${headScripts.length} script(s), ${blockingBytes.toLocaleString()} B gz: ${headScripts.map((m) => m[2].split('/').pop()).join(', ')}` : 'none')

  // 2 ── blocking CSS stays within budget
  const css = [...head.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/gi)]
  let cssBytes = 0
  for (const m of css) cssBytes += await transferSize(abs(m[1]), true)
  check(path, `blocking CSS <= ${(BUDGET.blockingCssGz / 1000).toFixed(0)} KB gz`,
    cssBytes <= BUDGET.blockingCssGz, `${cssBytes.toLocaleString()} B gz across ${css.length} file(s)`)

  // 3 ── images: the LCP candidate must not be lazy, and alt must be sane
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0])
  const attr = (tag, n) => tag.match(new RegExp(`\\b${n}="([^"]*)"`, 'i'))?.[1] ?? null
  if (imgs.length) {
    const noImgLcp = BUDGET.noImageLcp.has(path)
    // Where the LCP is not an image, only the header logo needs to be eager.
    const early = imgs.slice(0, noImgLcp ? 1 : 2)
    const lazyEarly = early.filter((t) => attr(t, 'loading') === 'lazy')
    check(path, 'above-the-fold images are not lazy', lazyEarly.length === 0,
      lazyEarly.length
        ? `${lazyEarly.length} of the first ${early.length} images still loading="lazy"`
        : `first ${early.length} eager${noImgLcp ? ' (LCP is a <video> poster, not an <img>)' : ''}`)

    const anyHigh = imgs.some((t) => attr(t, 'fetchpriority') === 'high')
    const highCount = imgs.filter((t) => attr(t, 'fetchpriority') === 'high').length
    // The home page's LCP is a <video> poster, which cannot take fetchpriority.
    const expectHigh = path !== '/' && imgs.length > 2
    check(path, 'exactly one fetchpriority="high" image',
      expectHigh ? highCount === 1 : highCount <= 1,
      `${highCount} high-priority image(s)${expectHigh ? '' : ' (page has no <img> LCP — none expected)'}`)
  }

  const dupAlt = imgs.filter((t) => (t.match(/\balt="/gi) ?? []).length > 1)
  const dupWaived = BUDGET.duplicateAltWaivers[path] ?? 0
  check(path, 'no duplicate alt attributes', dupAlt.length <= dupWaived,
    dupAlt.length
      ? `${dupAlt.length} of ${imgs.length} images emit two alt attributes` +
        (dupWaived ? ` — ${dupWaived} WAIVED: no library row can carry their alt (remote src)` : '')
      : `${imgs.length} images clean`)

  const emptyAlt = imgs.filter((t) => !(attr(t, 'alt') ?? '').trim())
  check(path, 'every image has alt text', emptyAlt.length === 0,
    emptyAlt.length ? `${emptyAlt.length} of ${imgs.length} images have an empty effective alt` : `${imgs.length} images`)

  // 4 ── third-party iframes lazy, unless waived
  const iframes = [...html.matchAll(/<iframe\b[^>]*>/gi)].map((m) => m[0])
  const eager = iframes.filter((t) => {
    const src = attr(t, 'src') ?? t.match(/src='([^']*)'/i)?.[1] ?? ''
    if (!isThirdParty(src)) return false
    if (Object.keys(BUDGET.eagerIframeWaivers).some((h) => src.includes(h))) return false
    return !/loading=["']?lazy/i.test(t)
  })
  check(path, 'third-party iframes are lazy', eager.length === 0,
    eager.length ? `${eager.length} eager: ${eager.map((t) => (attr(t, 'src') ?? t.match(/src='([^']*)'/i)?.[1] ?? '?').slice(0, 60)).join('; ')}` : `${iframes.length} iframe(s)`)

  // 5 ── no parser-blocking third-party script anywhere in the document
  const tpBlocking = [...html.matchAll(/<script\b([^>]*)>/gi)]
    .map((m) => m[1])
    .filter((a) => /\bsrc=/i.test(a) && !/\bdefer\b|\basync\b|type=["']module/i.test(a))
    .filter((a) => {
      const src = a.match(/src=["']([^"']+)["']/i)?.[1] ?? ''
      return isThirdParty(src)
    })
  check(path, 'no parser-blocking third-party scripts', tpBlocking.length === 0,
    tpBlocking.length ? `${tpBlocking.length} blocking` : 'none')

  // 6 ── oversized media
  const media = [...html.matchAll(/<(?:video|source)\b[^>]*\bsrc="([^"]+)"/gi)].map((m) => m[1])
  for (const src of new Set(media)) {
    const bytes = await transferSize(abs(src), false)
    const waiver = BUDGET.mediaWaivers[src]
    const ok = bytes <= BUDGET.maxMediaBytes || Boolean(waiver)
    check(path, `media <= ${(BUDGET.maxMediaBytes / 1e6).toFixed(0)} MB`, ok,
      `${src.split('/').pop()} ${(bytes / 1e6).toFixed(2)} MB${waiver ? ` — WAIVED: ${waiver}` : ''}`)
  }
}

// ── templated routes still resolve ─────────────────────────────────────────
// Not a performance check — it is here because this gate is what runs after a
// publish, and on 2026-08-25 a page write dropped `templateEnabled` from the
// `post` page, which is the entry template for the `posts` post-type. All 43
// articles began returning 404 and nothing noticed until a human opened one.
// A templated route is invisible to any check that only walks static pages.
const ARTICLE_ROUTES = [
  '/posts/all-on-four-your-questions',
  '/posts/dental-implants-everything-you-need-to-know',
  '/posts/porcelain-veneers-the-answers-to-your-questions',
]
for (const route of ARTICLE_ROUTES) {
  const r = await fetch(`${BASE}${route}`)
  check('(templated routes)', `article resolves: ${route.split('/').pop()}`, r.ok, `HTTP ${r.status}`)
}

// ── report ─────────────────────────────────────────────────────────────────
const failed = results.filter((r) => !r.ok)
const byPage = new Map()
for (const r of results) {
  if (!byPage.has(r.page)) byPage.set(r.page, [])
  byPage.get(r.page).push(r)
}
console.log(`PERFORMANCE BUDGET — ${BASE}\n${'='.repeat(66)}`)
for (const [page, rs] of byPage) {
  const bad = rs.filter((r) => !r.ok).length
  console.log(`\n${page}   ${bad ? `${bad} FAILED` : 'pass'}`)
  for (const r of rs) console.log(`  ${r.ok ? 'ok  ' : 'FAIL'}  ${r.name.padEnd(42)} ${r.detail}`)
}
console.log(`\n${'='.repeat(66)}`)
console.log(`${results.length - failed.length}/${results.length} checks passed across ${byPage.size} pages`)
if (JSON_OUT) { writeFileSync(JSON_OUT, JSON.stringify({ base: BASE, results }, null, 2)); console.log(`json → ${JSON_OUT}`) }
process.exit(failed.length ? 1 : 0)
