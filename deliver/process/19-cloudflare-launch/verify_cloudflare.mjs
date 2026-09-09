#!/usr/bin/env node
/**
 * Gate the two launch artefacts before anyone uploads them.
 *
 *   node verify_cloudflare.mjs           # offline checks
 *   node verify_cloudflare.mjs --live    # also re-fetch every sitemap URL
 *
 * The checks that matter most are not "is the file valid" but:
 *
 *   - **Coverage.** Every old URL in the inventory must be matched by some
 *     rule. A silently uncovered URL is a 404 nobody sees until it is gone from
 *     the index.
 *   - **Shadowing.** No rule may match a URL the build serves as a real page.
 *     This one does not fail loudly in production — the URL keeps returning
 *     200, it just serves the wrong page — so it has to be caught here.
 *   - **Subpath blast radius.** `subpath_matching` on `/blog` must not also
 *     swallow a page called `/blog-something`. Matching is segment-wise, and
 *     this asserts it against the real page list rather than trusting that.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadConfig } from './lib/config.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CFG = loadConfig(process.cwd())
const TMP = join(HERE, '.tmp')
const OUT = join(TMP, 'out')
const SYNC = join(HERE, '..', '15-instatic-api-sync', '.tmp')
const LIVE = process.argv.includes('--live')
const CANONICAL = CFG.canonicalHost

let pass = 0, fail = 0
const ok = (label, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok   ${label}`) }
  else { fail++; console.log(`  FAIL ${label}${detail ? `  — ${detail}` : ''}`) }
}

const pages = JSON.parse(readFileSync(join(SYNC, 'inventory-pages.json'), 'utf8')).filter((p) => !p.templated)
const posts = JSON.parse(readFileSync(join(SYNC, 'inventory-posts.json'), 'utf8'))
const livePaths = new Set([
  ...pages.map((p) => (p.slug === 'index' ? '/' : `/${p.slug}`)),
  ...posts.map((p) => `/posts/${p.slug}`),
])

// ── the CSV ────────────────────────────────────────────────────────────────
console.log('\ncloudflare bulk redirects csv')
const raw = readFileSync(join(OUT, `${CFG.apex}-cloudflare-301.csv`), 'utf8').trim().split(/\r?\n/)
ok('no header row', !/^source_url|^SOURCE_URL|^Old path/i.test(raw[0]), raw[0])

const rows = raw.map((line) => {
  const [src, tgt, code, pqs, isub, sub, pps] = line.split(',')
  return { line, src, tgt, code, pqs, isub, sub, pps }
})
ok('every row has 7 fields', rows.every((r) => r.line.split(',').length === 7))
ok('every source carries the hostname', rows.every((r) => r.src.startsWith(CFG.apex + '/')))
ok('no source has a query string', !rows.some((r) => r.src.includes('?')))
ok('no source has a regex wildcard left over', !rows.some((r) => r.src.includes('(.*)')))
ok('every status is 301', rows.every((r) => r.code === '301'))
ok('booleans are TRUE/FALSE only',
  rows.every((r) => [r.pqs, r.isub, r.sub, r.pps].every((v) => v === 'TRUE' || v === 'FALSE')))
ok('include_subdomains TRUE on every row (covers www + apex)', rows.every((r) => r.isub === 'TRUE'))
/* Defaults to TRUE. Left alone, /blog/some-post would redirect to
   /posts/some-post, which does not exist — a 404 on every subpath hit. */
ok('preserve_path_suffix FALSE on every row', rows.every((r) => r.pps === 'FALSE'))
ok('every target is on the canonical host', rows.every((r) => r.tgt.startsWith(CANONICAL + '/')))

const targets = [...new Set(rows.map((r) => r.tgt.slice(CANONICAL.length)))]
const badTargets = targets.filter((t) => !livePaths.has(t))
ok('every target is a live page in the build', badTargets.length === 0, badTargets.join(', '))

const srcPaths = rows.map((r) => r.src.slice(CFG.apex.length))
ok('no duplicate source rows', new Set(srcPaths).size === srcPaths.length)
ok('no self-redirect', !rows.some((r) => r.src.slice(CFG.apex.length).replace(/\/$/, '') === r.tgt.slice(CANONICAL.length)))

// ── matching simulation ────────────────────────────────────────────────────
console.log('\nmatching')
const exact = new Map(), subpath = new Map()
for (const r of rows) {
  const p = r.src.slice(CFG.apex.length)
  if (r.sub === 'TRUE') subpath.set(p.replace(/\/$/, ''), r.tgt)
  else exact.set(p, r.tgt)
}
/** Cloudflare matches a subpath rule segment-wise: `/blog` hits `/blog` and `/blog/…`. */
const match = (path) => {
  if (exact.has(path)) return exact.get(path)
  for (const [pre, tgt] of subpath) if (path === pre || path.startsWith(pre + '/')) return tgt
  return null
}

/* SHADOWING — the failure that returns 200 and serves the wrong page. */
const shadowed = [...livePaths].filter((p) => match(p))
ok('no rule matches a live page', shadowed.length === 0, shadowed.join(', '))
const shadowedSlash = [...livePaths].filter((p) => p !== '/' && match(p + '/'))
ok('no rule matches a live page with a trailing slash', shadowedSlash.length === 0, shadowedSlash.join(', '))

/* COVERAGE — every old URL in the inventory reaches somewhere. */
const audit = readFileSync(join(TMP, CFG.auditCsv ?? 'redirects-audit.csv'), 'utf8')
  .trim().split(/\r?\n/).slice(1).map((l) => l.split(',')[0])
const uncovered = audit
  .map((p) => p.replace(/\/\(\.\*\)$/, '/sample').replace(/\/page\/sample$/, '/page/2'))
  .filter((p) => !livePaths.has(p) && !match(p))
ok(`every inventoried old URL is covered (${audit.length} sources)`, uncovered.length === 0, uncovered.slice(0, 8).join(', '))

/* Both forms of every covered URL, because WordPress served the slashed one. */
const missingSlash = audit
  .filter((p) => !p.includes('(.*)') && !livePaths.has(p) && match(p))
  .filter((p) => !match(p + '/'))
ok('the trailing-slash form is covered too', missingSlash.length === 0, missingSlash.slice(0, 8).join(', '))

/* A WordPress dated permalink and a feed under a post, as spot checks. */
ok('/2019/05/some-old-post resolves', match('/2019/05/some-old-post') === CANONICAL + '/')
ok('/blog/page/3 resolves to /posts', match('/blog/page/3') === CANONICAL + '/posts')
ok('/category/dental-care resolves to /posts', match('/category/dental-care') === CANONICAL + '/posts')
ok('an unknown URL is NOT matched (still 404s honestly)', match('/definitely-not-a-real-url') === null)

// ── the sitemap ────────────────────────────────────────────────────────────
console.log('\nsitemap.xml')
const xml = readFileSync(join(OUT, 'sitemap.xml'), 'utf8')
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
ok('declares the sitemap 0.9 namespace', xml.includes('http://www.sitemaps.org/schemas/sitemap/0.9'))
ok('entry count matches the build', locs.length === livePaths.size, `${locs.length} vs ${livePaths.size}`)
ok('no duplicate <loc>', new Set(locs).size === locs.length)
ok('every loc is on the canonical host', locs.every((l) => l.startsWith(CANONICAL + '/')))
ok('no trailing slashes except the home page',
  locs.every((l) => l === CANONICAL + '/' || !l.endsWith('/')))
ok('the posts entry TEMPLATE is excluded', !locs.includes(CANONICAL + '/post'))
ok('every build URL is present', [...livePaths].every((p) => locs.includes(CANONICAL + (p === '/' ? '/' : p))))
ok('no loc is also a redirect source', !locs.some((l) => match(l.slice(CANONICAL.length))))
ok('every lastmod is ISO yyyy-mm-dd',
  [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].every((m) => /^\d{4}-\d{2}-\d{2}$/.test(m[1])))
ok('parses as XML', (() => {
  const open = (xml.match(/<url>/g) || []).length, close = (xml.match(/<\/url>/g) || []).length
  return open === close && open === locs.length
})())

if (LIVE) {
  console.log('\nlive re-check of every sitemap URL')
  const bad = []
  const q = [...locs]
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (q.length) {
      const u = q.shift()
      try { const r = await fetch(u, { redirect: 'manual' }); if (r.status !== 200) bad.push(`${r.status} ${u}`) }
      catch (e) { bad.push(`ERR ${u}`) }
    }
  }))
  ok(`all ${locs.length} sitemap URLs return 200`, bad.length === 0, bad.slice(0, 10).join(' | '))
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
