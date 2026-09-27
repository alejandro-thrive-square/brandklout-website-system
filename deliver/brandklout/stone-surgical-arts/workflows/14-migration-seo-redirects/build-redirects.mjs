#!/usr/bin/env node
/**
 * The 301 map from the old stonesurgicalarts.com to www.dfwsurgicalarts.com, and
 * the Cloudflare Worker that serves it.
 *
 *   node build-redirects.mjs             # build, and check every destination is 200 live
 *   node build-redirects.mjs --offline   # skip the live check
 *
 * Writes .tmp/out/:
 *   stone-legacy-redirects.js   the Worker — deploy with deploy-redirects.mjs
 *   redirect-map.json           the map plus one audit row per known old URL
 *   redirect-audit.csv          the same rows, for a human
 *
 * ## Why a Worker and not a Bulk Redirect list
 *
 * The old domain is its own Cloudflare zone, and it already carries a Single
 * Redirect that sends EVERY path to the new home page. Single Redirects run
 * before Bulk Redirects, so a list could never fire while that rule exists, and
 * a list without it has no documented answer for which row wins when an exact
 * URL and a catch-all both match. A Worker makes that ordering explicit: exact
 * URL, then the longest matching old section, then the home page. The same
 * `resolve()` that is tested below against every known old URL is the code the
 * Worker runs — it is embedded by source, not re-implemented.
 *
 * ## Scope
 *
 * This site is Stone Surgical Arts only. The old domain also carried the oral
 * surgery and implant pillar, which now belongs to a different practice brand
 * and is not part of this project: those URLs are listed as `out-of-scope` and
 * land on the home page, as every old URL does today. Skin and non-surgical
 * URLs go to /treatments and are marked `provisional` — nobody has decided
 * where that pillar should send its visitors.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const WF = join(HERE, '..')
const SITE = join(WF, '04-design', '.tmp', 'surgical-arts', 'site-src')
const OUT = join(HERE, '.tmp', 'out')
const TARGET = 'https://www.dfwsurgicalarts.com'
const OFFLINE = process.argv.includes('--offline')

// ── the matcher. Both functions are copied into the Worker by source. ──────

function normalise(path) {
  let p = path
  try { p = decodeURIComponent(p) } catch {}
  p = p.toLowerCase().replace(/\/{2,}/g, '/').replace(/\/+$/, '')
  return p || '/'
}

function resolve(rawPath, MAP) {
  const path = normalise(rawPath)
  if (Object.prototype.hasOwnProperty.call(MAP.exact, path)) return { to: MAP.exact[path], rule: path }
  let best = null
  for (const prefix of Object.keys(MAP.prefix)) {
    if ((path === prefix || path.startsWith(prefix + '/')) && (!best || prefix.length > best.length)) best = prefix
  }
  if (best) return { to: MAP.prefix[best], rule: best + '/*' }
  return { to: '/', rule: 'fallback' }
}

// ── inputs ─────────────────────────────────────────────────────────────────

const fail = (msg) => { console.error('FAIL ' + msg); process.exitCode = 1 }

const { BLOG_PAGES } = await import(pathToFileURL(join(SITE, 'blog-render.mjs')).href)
const dataModule = await import(pathToFileURL(join(SITE, 'blog-data.mjs')).href)
const POSTS = Object.values(dataModule).find((v) => Array.isArray(v) && v.some((p) => p?.slug && p?.source))
if (!POSTS) throw new Error('blog-data.mjs exports no array of posts carrying `source`')

/* Which tree each old post lived in decides its old URL: /blog/<slug> or /news/<slug>. */
const manifest = JSON.parse(readFileSync(join(WF, '01-content-intake', '.tmp', 'archive-text', 'archive-manifest.json'), 'utf8'))
const TREE = new Map(manifest.posts.map((p) => [p.slug, p.tree]))

/* The Wayback CDX sweep taken at intake: every URL the old site is known to have served. */
const inventory = readFileSync(join(WF, '00-client-delivery-initialization', '.tmp', 'archived-urls-raw.txt'), 'utf8')
  .split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  .map((u) => normalise('/' + u.replace(/^(https?:\/\/)?(www\.)?stonesurgicalarts\.com\/?/i, '')))

/* Every page the new site serves. Destinations are also checked live below. */
const PAGES = ['/', '/neck-lift', '/blepharoplasty', '/treatments', '/meet-the-doctor', '/about', '/team',
  '/memberships', '/results', '/book', '/myellevate-neck-lift', '/face-and-neck-lift']
const LIVE = new Set([...PAGES, ...BLOG_PAGES.map((p) => '/' + p.slug)])

// ── the map ────────────────────────────────────────────────────────────────
//
// Rules, in order of preference:
//   an article goes to its own adaptation (derived from blog-data `source`)
//   a procedure with its own page on the new site goes to that page
//   any other surgical procedure goes to /treatments, which lists it with its fee
//   skin and non-surgical go to /treatments too, marked provisional
//   oral surgery is out of scope and lands on the home page

const exact = new Map()   // old path -> { to, category, note }
const add = (from, to, category, note = '') => {
  const key = normalise(from)
  if (exact.has(key)) fail(`${key} is mapped twice`)
  exact.set(key, { to, category, note })
}

for (const post of POSTS.filter((p) => p.source)) {
  const tree = TREE.get(post.source)
  if (!tree) { fail(`no archive tree for ${post.source}`); continue }
  add(`/${tree === 'news' ? 'news' : 'blog'}/${post.source}`, '/' + post.slug, 'article', `${tree} post, adapted`)
}
/* WordPress dated permalinks for the same posts, e.g. /2021/08/10/<slug>. */
for (const path of inventory) {
  const m = path.match(/^\/\d{4}\/\d{2}\/\d{2}\/([^/]+)$/)
  const post = m && POSTS.find((p) => p.source === m[1])
  if (post) add(path, '/' + post.slug, 'article', 'dated WordPress permalink')
}

const P = 'procedure', PP = 'procedure-provisional'
const TABLE = [
  ['/', '/', 'practice', 'home'],
  ['/facial-surgery-southlake', '/', 'practice', 'an old landing page for the practice'],
  ['/about-us', '/about', 'practice'],
  ['/about-us/about-facial-surgeon-southlake', '/meet-the-doctor', 'practice', 'the surgeon, not the practice'],
  ['/about-facial-surgeon-southlake', '/meet-the-doctor', 'practice', 'the surgeon, not the practice'],
  ['/about-us/facial-surgery-media-articles-southlake', '/meet-the-doctor', 'practice', 'press coverage of Dr. Stone'],
  ['/facial-surgery-media-articles-southlake', '/meet-the-doctor', 'practice', 'press coverage of Dr. Stone'],

  ['/cosmetic-facial-surgery-southlake', '/treatments', P, 'the surgical menu'],
  ['/cosmetic-facial-surgery-southlake/blepharoplasty', '/blepharoplasty', P],
  ['/cosmetic-facial-surgery-southlake/eyelid-lifting', '/blepharoplasty', P],
  ['/cosmetic-facial-surgery-southlake/neck-lift', '/neck-lift', P],
  ['/cosmetic-facial-surgery-southlake/myellevate-facelift', '/myellevate-neck-lift', P],
  ['/cosmetic-facial-surgery-southlake/facelift-easy-lift', '/face-and-neck-lift', P],
  ...['buccal-fat-removal', 'chin-sculpting-reshaping', 'facetite', 'facial-fat-transfer', 'fat-transfer',
    'facial-implants', 'male-facial-enhancement', 'neck-liposuction', 'skin-lesion-removal']
    .map((s) => [`/cosmetic-facial-surgery-southlake/${s}`, '/treatments', P, 'no page of its own; listed with its fee']),
  ...['botox-xeomin', 'facial-fillers', 'hydrafacial-md', 'morpheus8']
    .map((s) => [`/cosmetic-facial-surgery-southlake/${s}`, '/treatments', PP, 'non-surgical: destination not confirmed']),
  ['/male-facial-enhancement', '/treatments', P, 'no page of its own'],
  ['/procedure/blepharoplasty', '/blepharoplasty', P],
  ['/procedure/neck-surgery', '/neck-lift', P],
  ['/procedure/cosmetic-facial', '/treatments', P],
  ['/procedure/chin-surgery', '/treatments', P, 'no page of its own'],
  ...['botox', 'facial-fillers', 'co2-laser-skin-resurfacing', 'hair-restoration']
    .map((s) => [`/procedure/${s}`, '/treatments', PP, 'non-surgical: destination not confirmed']),

  ['/before-and-afters', '/results', 'results'],
  ['/testimonials', '/results', 'results', 'reviews are on the results page'],
  ['/pricing', '/treatments', 'practice', 'every fee is on /treatments'],
  ['/patient-resources/pricing', '/treatments', 'practice', 'every fee is on /treatments'],
  ['/financing', '/book', 'booking', 'financing is answered on the booking page'],
  ['/book-now', '/book', 'booking'],
  ['/contact-information', '/book', 'booking'],
  ['/patient-resources', '/book', 'booking', 'preparation, rules and financing are on the booking page'],
  ['/patient-resources/request-consultation', '/book', 'booking'],
  ['/patient-resources/crisalix', '/book', 'booking', '3D simulation happens at the consultation'],

  ...['/procedure/oral-maxillofacial-surgery', '/procedure/jaw-surgery-orthognathic', '/all-on-4-dental-implants',
    '/online-referral', '/patient-resources/online-referral']
    .map((s) => [s, '/', 'out-of-scope', 'oral surgery: not part of this site']),
  ...['/privacy-policy', '/hipaa-privacy-policy', '/patient-resources/hipaa-privacy-policy', '/terms-of-use', '/ada']
    .map((s) => [s, '/', 'no-equivalent', 'the new site has no such page']),
]
for (const [from, to, category, note] of TABLE) add(from, to, category, note)

const PREFIXES = [
  ['/cosmetic-facial-surgery-southlake', '/treatments', P, 'any other surgical procedure page'],
  ['/skin-treatments-southlake', '/treatments', PP, 'skin and non-surgical: destination not confirmed'],
  ['/before-after', '/results', 'results'],
  ['/patient-resources/financing', '/book', 'booking', 'financing is answered on the booking page'],
  ['/patient-resources/pre-op-post-op-instructions', '/book', 'booking', 'preparation and aftercare are on the booking page'],
  ['/contact-facial-surgeon-southlake', '/book', 'booking'],
  ['/blog', '/blog', 'article', 'any post the backup did not hold'],
  ['/news', '/blog', 'article', 'any post the backup did not hold'],
  ['/category', '/blog', 'article'],
  ['/author', '/blog', 'article', 'agency authors; there are no author pages'],
  ['/oral-surgery-procedures-southlake', '/', 'out-of-scope', 'oral surgery: not part of this site'],
]
const prefix = new Map(PREFIXES.map(([from, to, category, note = '']) => [normalise(from), { to, category, note }]))

const MAP = {
  exact: Object.fromEntries([...exact].map(([k, v]) => [k, v.to])),
  prefix: Object.fromEntries([...prefix].map(([k, v]) => [k, v.to])),
}

// ── checks ─────────────────────────────────────────────────────────────────

/* Every adapted article must be the destination of its own original. */
for (const page of BLOG_PAGES.filter((p) => p.slug !== 'blog')) {
  const post = POSTS.find((p) => p.slug === page.slug)
  if (!post?.source) { fail(`/${page.slug} has no source post, so no old URL points at it`); continue }
  const from = `/${TREE.get(post.source) === 'news' ? 'news' : 'blog'}/${post.source}`
  if (resolve(from, MAP).to !== '/' + page.slug) fail(`${from} does not reach /${page.slug}`)
}

const destinations = new Set([...Object.values(MAP.exact), ...Object.values(MAP.prefix)])
for (const d of destinations) if (!LIVE.has(d)) fail(`destination ${d} is not a page on the new site`)

if (!OFFLINE) {
  const bad = []
  await Promise.all([...destinations].map(async (d) => {
    const r = await fetch(TARGET + d, { redirect: 'manual' }).catch((e) => ({ status: e.message }))
    if (r.status !== 200) bad.push(`${d} -> ${r.status}`)
  }))
  if (bad.length) fail(`destinations not 200 on ${TARGET}:\n  ${bad.join('\n  ')}`)
  else console.log(`live: all ${destinations.size} destinations answer 200 on ${TARGET}`)
}

// ── audit rows: every known old URL, and what it will do ───────────────────

const sources = new Set([...inventory, ...exact.keys()])
const rows = [...sources].sort().map((from) => {
  const { to, rule } = resolve(from, MAP)
  const meta = rule === 'fallback' ? { category: 'fallback', note: 'no page; lands on the home page, as today' }
    : rule.endsWith('/*') ? prefix.get(rule.slice(0, -2)) : exact.get(rule)
  return { from, to, rule, category: meta.category, note: meta.note }
})

// ── emit ───────────────────────────────────────────────────────────────────

mkdirSync(OUT, { recursive: true })
const worker = `/**
 * 301s every URL on stonesurgicalarts.com to its page on ${TARGET}.
 *
 * GENERATED by workflows/14-migration-seo-redirects/build-redirects.mjs — do not
 * hand-edit. Change the map there, rebuild, and redeploy with deploy-redirects.mjs.
 *
 * Order: the exact old URL, then the longest matching old section, then the home
 * page. Case and trailing slashes are ignored; the query string is kept.
 */
const TARGET = ${JSON.stringify(TARGET)}
const MAP = ${JSON.stringify(MAP, null, 1)}

${normalise.toString()}

${resolve.toString()}

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const { to, rule } = resolve(url.pathname, MAP)
    return new Response(null, {
      status: 301,
      headers: {
        location: TARGET + to + url.search,
        'cache-control': 'public, max-age=86400',
        'x-stone-redirect': rule,
      },
    })
  },
}
`
writeFileSync(join(OUT, 'stone-legacy-redirects.js'), worker)
writeFileSync(join(OUT, 'redirect-map.json'), JSON.stringify({ target: TARGET, oldHosts: ['stonesurgicalarts.com', 'www.stonesurgicalarts.com'], map: MAP, rows }, null, 1) + '\n')
const q = (s) => /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
writeFileSync(join(OUT, 'redirect-audit.csv'), ['Old URL,New URL,Matched by,Category,Note',
  ...rows.map((r) => [`stonesurgicalarts.com${r.from === '/' ? '/' : r.from}`, TARGET + r.to, r.rule, r.category, r.note].map((v) => q(String(v ?? ''))).join(','))].join('\n') + '\n')

// ── report ─────────────────────────────────────────────────────────────────

const by = rows.reduce((m, r) => (m[r.category] = (m[r.category] || 0) + 1, m), {})
console.log(`\n${rows.length} known old URLs -> ${destinations.size} destinations`)
for (const [k, v] of Object.entries(by).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(22)} ${v}`)
console.log(`\nmap: ${exact.size} exact rules, ${prefix.size} section rules`)
console.log(`\nprovisional — skin and non-surgical, destination to confirm:`)
for (const r of rows.filter((r) => r.category === PP)) console.log(`  ${r.from}`)
console.log(`\nfalls back to the home page with no rule (system and test URLs):`)
for (const r of rows.filter((r) => r.category === 'fallback')) console.log(`  ${r.from}`)
console.log(`\nwrote ${OUT}`)
if (process.exitCode) console.error('\nBUILD FAILED — nothing above is safe to deploy')
