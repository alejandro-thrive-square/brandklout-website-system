#!/usr/bin/env node
/**
 * Emit the two launch artefacts for the INSTATIC build of drnahlah.com:
 *
 *   .tmp/out/sitemap.xml                     -> upload to Cloudflare
 *   .tmp/out/drnahlah-cloudflare-301.csv     -> Cloudflare Bulk Redirects list
 *   .tmp/out/drnahlah-cloudflare-301.audit.csv  (documented, human-readable)
 *
 *   node build_cloudflare.mjs
 *
 * ## Webflow is gone
 *
 * `build_redirects.py` produced a **Webflow** "Import 301 redirects" CSV: two
 * columns, paths only, and `(.*)` wildcards. None of that is Cloudflare's
 * format, and the project is not shipping on Webflow. This script supersedes it
 * for delivery. The mapping *decisions* still come from that work — the audit
 * CSV it produced is read as the source inventory, so the Wayback CDX sweep and
 * the per-URL judgement calls are not thrown away and re-guessed.
 *
 * ## Two behaviours that were Webflow's and are now ours
 *
 * 1. **Trailing slashes.** Webflow 301'd `/foo/` to `/foo` natively, *before*
 *    redirect matching, which is why the old map deliberately emitted no slash
 *    variants. Instatic does not: `/veneers/` and `/veneers` BOTH return 200
 *    (verified). The old site was WordPress, whose default permalinks carry a
 *    trailing slash, so the slash form is what is actually indexed and linked.
 *    Every rule is therefore emitted twice, bare and slashed.
 * 2. **Wildcards.** Cloudflare Bulk Redirects has no regex. `/blog/(.*)`
 *    becomes one row with `subpath_matching=TRUE`, which matches the source URL
 *    *and everything beneath it*, so the bare row collapses into it.
 *    `preserve_path_suffix` is forced FALSE — it defaults to TRUE, which would
 *    send `/blog/some-post` to `/posts/some-post` and 404 on every one.
 *
 * ## Host coverage
 *
 * `drnahlah.com` and `www.drnahlah.com` both serve the site, byte-identical,
 * with no canonical and no redirect between them. Rules are written against the
 * apex with `include_subdomains=TRUE` so one row covers both. That is coverage,
 * not a fix — see the CANONICAL note printed at the end.
 *
 * ## The rule that keeps this file honest
 *
 * A redirect on a URL that is a real page again does not fail loudly: the URL
 * still returns 200, it just serves the WRONG page, and the real one becomes
 * unreachable at its own address. So no destination and no source is trusted
 * from the table below — both are checked against the live build, and anything
 * whose source is now a page is dropped and reported.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadConfig } from './lib/config.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CFG = loadConfig(process.cwd())
const TMP = join(HERE, '.tmp')
const OUT = join(TMP, 'out')
const SYNC = join(HERE, '..', '15-instatic-api-sync', '.tmp')

const APEX = CFG.apex
const CANONICAL = CFG.canonicalHost

// ── the live build is the only authority ───────────────────────────────────

const pages = JSON.parse(readFileSync(join(SYNC, 'inventory-pages.json'), 'utf8'))
const posts = JSON.parse(readFileSync(join(SYNC, 'inventory-posts.json'), 'utf8'))
const status = JSON.parse(readFileSync(join(TMP, 'live-status.json'), 'utf8'))

/* `post` is the entry TEMPLATE for the posts table, not a page. It has a row in
   the pages table and a slug, and it 404s in production — including it in the
   sitemap would submit a known-dead URL. */
const livePages = pages.filter((p) => !p.templated)
const live = new Map()
for (const p of livePages) live.set(p.slug === 'index' ? '/' : `/${p.slug}`, p)
for (const p of posts) live.set(`/posts/${p.slug}`, p)

const status200 = new Set(status.filter((s) => s.status === 200).map((s) => s.path))
const notOk = [...live.keys()].filter((p) => !status200.has(p))
if (notOk.length) {
  console.error(`these build URLs are not 200 in production — refusing to emit:\n  ${notOk.join('\n  ')}`)
  process.exit(1)
}

// ── source inventory ───────────────────────────────────────────────────────

const auditRows = readFileSync(join(TMP, CFG.auditCsv ?? 'redirects-audit.csv'), 'utf8')
  .trim().split(/\r?\n/).slice(1)
  .map((line) => {
    const [from, to, source, wasLive] = line.split(',')
    return { from, to, source, wasLive }
  })

/**
 * Re-points, applied on top of the inherited map.
 *
 * Every one of these exists because the Instatic build has a page the old
 * eleven-page Webflow site did not, so the inherited rule settles for a worse
 * destination than is now available. Left alone they are not broken links —
 * they are quietly bad redirects, which is harder to notice.
 */
const REPOINT = {
  // The posts index exists now. Sending the whole blog to a treatment page was
  // what you do when there is no blog to send it to.
  '/blog': '/posts',
  '/category': '/posts',
  '/category/dental-care': '/posts',
  '/category/dental-implants': '/posts',
  '/category/dental-info-center': '/posts',
  '/tag': '/posts',
  // Real pages in this build; the old map had to approximate all four.
  '/video-gallery': '/video-library',
  '/our-dental-facility': '/our-facility',
  '/dental-crowns-and-bridges': '/crowns-and-bridges',
  '/dental-bridges': '/crowns-and-bridges',
  '/dental-crowns': '/crowns-and-bridges',
  '/replace-lost-or-missing-teeth-with-dental-bridges': '/crowns-and-bridges',
  // Both survey confirmations were the same 978 words under two slugs.
  '/veneer-survey-thank-you': '/thank-you',
  '/implant-survey-thank-you': '/thank-you',
}

/** WordPress structural prefixes → one subpath-matching row each. */
const SUBPATH = new Map([
  ['/blog', '/posts'], ['/category', '/posts'], ['/tag', '/posts'],
  ['/author', '/meet-dr-nahlah'],
  ['/feed', '/'], ['/comments', '/'], ['/wp-json', '/'], ['/wp-content', '/'],
  ...Array.from({ length: 10 }, (_, i) => [`/${2017 + i}`, '/']),
])

// ── reconcile ──────────────────────────────────────────────────────────────

const dropped = [], repointed = [], deadTarget = []
const rules = new Map()   // source path -> { to, subpath, why }

for (const [path, to] of SUBPATH) rules.set(path, { to, subpath: true, why: 'wp-structure' })

for (const r of auditRows) {
  const bare = r.from.replace(/\/\(\.\*\)$/, '').replace(/\/page$/, '')
  if (r.from.includes('(.*)')) continue          // folded into SUBPATH above
  if (rules.has(bare) && rules.get(bare).subpath) continue   // covered by a subpath row

  // RULE: a source that is a live page again is a bug, not a redirect.
  if (live.has(r.from)) { dropped.push(r.from); continue }

  let to = REPOINT[r.from] ?? r.to
  if (to !== r.to) repointed.push(`${r.from}: ${r.to} -> ${to}`)
  if (!live.has(to)) { deadTarget.push(`${r.from} -> ${to}`); continue }
  if (to === r.from) { dropped.push(`${r.from} (self)`); continue }
  rules.set(r.from, { to, subpath: false, why: r.source })
}

// subpath destinations are validated too
for (const [from, rule] of rules) if (!live.has(rule.to)) deadTarget.push(`${from} -> ${rule.to}`)

if (deadTarget.length) {
  console.error(`destinations that are not live pages — refusing to emit:\n  ${deadTarget.join('\n  ')}`)
  process.exit(1)
}

// ── emit the Cloudflare CSV ────────────────────────────────────────────────
//
// Column order, per Cloudflare's CSV reference:
//   SOURCE_URL,TARGET_URL,STATUS_CODE,PRESERVE_QUERY_STRING,INCLUDE_SUBDOMAINS,
//   SUBPATH_MATCHING,PRESERVE_PATH_SUFFIX
// and the file must NOT carry a header row.

mkdirSync(OUT, { recursive: true })
const csv = [], audit = ['Source URL,Target URL,Subpath matching,Origin,Note']
const sorted = [...rules.entries()].sort(([a], [b]) => a.localeCompare(b))

for (const [from, rule] of sorted) {
  const target = CANONICAL + (rule.to === '/' ? '/' : rule.to)
  const row = (src, subpath) =>
    `${APEX}${src},${target},301,FALSE,TRUE,${subpath ? 'TRUE' : 'FALSE'},FALSE`
  csv.push(row(from, rule.subpath))
  /* The slashed form of a subpath row is already inside its own subtree, so it
     needs no second row; a bare rule does. */
  if (!rule.subpath) csv.push(row(`${from}/`, false))
  audit.push(`${APEX}${from},${target},${rule.subpath ? 'yes' : 'no'},${rule.why},${
    REPOINT[from] ? 're-pointed for the Instatic build' : ''}`)
}

writeFileSync(join(OUT, `${CFG.apex}-cloudflare-301.csv`), csv.join('\n') + '\n')
writeFileSync(join(OUT, `${CFG.apex}-cloudflare-301.audit.csv`), audit.join('\n') + '\n')

// ── emit the sitemap ───────────────────────────────────────────────────────

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const entries = [...live.entries()]
  .map(([path, row]) => ({
    loc: CANONICAL + (path === '/' ? '/' : path),
    lastmod: (row.publishedAt || row.updatedAt || '').slice(0, 10),
    isPost: path.startsWith('/posts/'),
    path,
  }))
  /* Home first, then pages, then articles — reading order, not that crawlers
     care, but a human will open this file. */
  .sort((a, b) => (a.path === '/' ? -1 : b.path === '/' ? 1
    : a.isPost !== b.isPost ? (a.isPost ? 1 : -1) : a.path.localeCompare(b.path)))

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries.map((e) => [
    '  <url>',
    `    <loc>${esc(e.loc)}</loc>`,
    e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
    '  </url>',
  ].filter(Boolean).join('\n')),
  '</urlset>',
  '',
].join('\n')
writeFileSync(join(OUT, 'sitemap.xml'), sitemap)

// ── and something to actually serve it ─────────────────────────────────────
//
// Instatic 0.0.16 has no sitemap route: /sitemap.xml, /sitemap_index.xml and
// /sitemap.txt all 404, and the origin's robots.txt (Cloudflare's default
// content-signals file) names no sitemap. Cloudflare has no "upload a static
// file" slot either — a sitemap has to be served by something. This Worker is
// that something, and it fixes robots.txt in the same deploy.

if (sitemap.includes('`') || sitemap.includes('${')) {
  console.error('sitemap contains a character that would break the worker template literal')
  process.exit(1)
}
const worker = `/**
 * Serves /sitemap.xml and a robots.txt that points at it, for drnahlah.com.
 *
 * GENERATED by 14-migration-seo-redirects/build_cloudflare.mjs — do not hand-edit.
 * Re-run that script whenever the build gains or loses a page, then redeploy.
 *
 * Deploy as a Worker with two routes:
 *   www.drnahlah.com/sitemap.xml
 *   www.drnahlah.com/robots.txt
 * Every other request falls through to the origin untouched.
 */
const SITEMAP = \`${sitemap}\`

const SITEMAP_LINE = 'Sitemap: ${CANONICAL}/sitemap.xml'

/** Used only if the origin has no robots.txt of its own. */
const ROBOTS_FALLBACK = 'User-agent: *\\nAllow: /\\n\\n' + SITEMAP_LINE + '\\n'

const send = (body, type) => new Response(body, {
  headers: { 'content-type': type, 'cache-control': 'public, max-age=3600' },
})

/**
 * The origin ALREADY serves a real robots.txt — Cloudflare's content-signals
 * policy, which is an express reservation of rights under Article 4 of the EU
 * DSM copyright directive. Replacing it would silently drop that. So append the
 * missing Sitemap: line to whatever the origin says, and only invent a file if
 * the origin has none.
 */
async function robots(request) {
  let body = null
  try {
    const res = await fetch(request)
    if (res.ok) body = await res.text()
  } catch {}
  if (body === null) return send(ROBOTS_FALLBACK, 'text/plain; charset=utf-8')
  if (body.includes(SITEMAP_LINE)) return send(body, 'text/plain; charset=utf-8')
  return send(body.replace(/\\s*$/, '') + '\\n\\n' + SITEMAP_LINE + '\\n', 'text/plain; charset=utf-8')
}

export default {
  async fetch(request) {
    const { pathname } = new URL(request.url)
    if (pathname === '/sitemap.xml') return send(SITEMAP, 'application/xml; charset=utf-8')
    if (pathname === '/robots.txt') return robots(request)
    return fetch(request)
  },
}
`
writeFileSync(join(OUT, 'sitemap-worker.js'), worker)

// ── report ─────────────────────────────────────────────────────────────────

console.log(`live build: ${livePages.length} pages + ${posts.length} articles = ${live.size} URLs`)
console.log(`  excluded from the sitemap: /post (the posts entry TEMPLATE, 404 in production)`)
console.log(`\nsitemap.xml            ${entries.length} <url> entries`)
console.log(`cloudflare 301 csv     ${csv.length} rows from ${rules.size} rules (bare + trailing-slash)`)
console.log(`\nre-pointed for this build (${repointed.length}):`)
for (const r of repointed) console.log(`  ${r}`)
console.log(`\ndropped — the old URL is a real page again (${dropped.length}):`)
for (const d of dropped) console.log(`  ${d}`)
console.log(`\nwrote ${OUT}`)
