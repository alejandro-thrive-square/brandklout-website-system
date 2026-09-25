#!/usr/bin/env node
/**
 * The 301 map from the old bestdentistinkatytx.com to www.masonparkdental.com, and
 * the Cloudflare Worker that serves it.
 *
 *   node build-redirects.mjs             # build, checking every destination live
 *   node build-redirects.mjs --offline   # skip the live checks (articles then fall back to /)
 *
 * Writes .tmp/out/:
 *   mason-park-legacy-redirects.js   the Worker — deploy with deploy-redirects.mjs
 *   redirect-map.json                the map plus one audit row per known old URL
 *   redirect-audit.csv               the same rows, for a human
 *
 * Order in the Worker: the exact old URL, then the longest matching old section,
 * then the home page. `resolve()` is embedded by source, so the checks below test
 * the code that ships.
 *
 * ## Articles follow the blog
 *
 * The old site kept its 161 articles at the root (/<slug>). The rebuild serves them
 * at /blog/<slug>, but on 2026-09-17 only staging has the blog — production answers
 * 404 for /blog. So each article is checked live: if www.masonparkdental.com/blog/<slug>
 * answers 200 it goes there, otherwise it lands on the home page and is marked
 * `article-pending`. Once the blog is on production, rebuild and redeploy — nothing
 * in this file changes.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const WF = join(HERE, '..')
const OUT = join(HERE, '.tmp', 'out')
const TARGET = 'https://www.masonparkdental.com'
const OLD_HOSTS = ['bestdentistinkatytx.com', 'www.bestdentistinkatytx.com']
const OFFLINE = process.argv.includes('--offline')
const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' }

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
const status = async (path) => {
  if (OFFLINE) return 0
  for (let i = 0; i < 3; i++) {
    const r = await fetch(TARGET + path, { redirect: 'manual', headers: UA }).catch(() => null)
    if (r) return r.status
  }
  return 0
}
const pool = async (items, fn, n = 8) => {
  const q = [...items]
  await Promise.all(Array.from({ length: n }, async () => { while (q.length) await fn(q.shift()) }))
}

/* The intake crawl of the old site (2026-08-05): every page it served. */
const crawl = JSON.parse(readFileSync(join(WF, '01-content-intake', '.tmp', 'site-scrape', '.state', 'pages.json'), 'utf8'))
const inventory = [...new Set(crawl.flatMap((p) => [p.url, p.requested]).map((u) => normalise(new URL(u).pathname)))]

/* The 161 articles, from the rebuild's extraction. */
const POSTS = JSON.parse(readFileSync(join(WF, '09-static-rebuild', '.tmp', 'blog', 'posts.json'), 'utf8'))
const ARTICLES = (Array.isArray(POSTS) ? POSTS : POSTS.posts).map((p) => p.slug)

/* Old paths the new site serves at the same address (Sang's package kept the old structure). */
const live = new Map()
await pool(inventory.filter((p) => !ARTICLES.includes(p.slice(1))), async (p) => live.set(p, await status(p)))
const blogLive = (await status('/blog')) === 200
const articleLive = new Map()
if (blogLive) await pool(ARTICLES, async (s) => articleLive.set(s, (await status('/blog/' + s)) === 200))

// ── the map ────────────────────────────────────────────────────────────────

const exact = new Map()   // old path -> { to, category, note }
const add = (from, to, category, note = '') => {
  const key = normalise(from)
  if (exact.has(key)) fail(`${key} is mapped twice`)
  exact.set(key, { to, category, note })
}

for (const s of ARTICLES) {
  if (articleLive.get(s)) add('/' + s, '/blog/' + s, 'article', 'root permalink, now under /blog')
  else add('/' + s, '/', 'article-pending', blogLive ? 'article missing from the production blog' : 'production has no blog yet; rebuild once it does')
}

const BLOG = blogLive ? '/blog' : '/'
const S = 'service', PR = 'practice', DEMO = 'theme-demo'
const TABLE = [
  ['/about', '/about-us', PR],
  ['/about/meet-our-team', '/our-team', PR],
  ['/about/smile-gallery', '/before-after', PR],
  ['/team', '/our-team', PR],
  ['/testimonials', '/before-after', PR, 'reviews sit with the smile gallery'],
  ['/contact', '/contacts', PR],
  ['/consultation', '/virtual-consultation', PR],
  ['/new-patients', '/patient-resources', PR],
  ['/faq', '/faq-page', PR],
  ['/frequently-asked-questions', '/faq-page', PR],
  ['/katy-tx-dentist', '/', PR, 'an old landing page for the practice'],
  ['/locations.kml', '/contacts', PR, 'the location feed; the address is on contacts'],
  ['/accessibility-statement', '/', 'no-equivalent', 'the new site has no such page'],
  ['/pricing', '/financing', PR],
  ['/mpd-invisalign', '/ads-landing-pages/invisalign', 'landing', 'the paid-traffic Invisalign page (the root /invisalign is a forwarder since 2026-09-25)'],
  ['/mpd-new-patient', '/ads-landing-pages/new-patient-special', 'landing', 'the paid-traffic new-patient page (the root slug is a forwarder since 2026-09-25)'],

  ['/blog', BLOG, 'blog'],
  ['/blog-masonry', BLOG, 'blog', 'a theme layout of the blog'],
  ['/blog-portfolio', BLOG, 'blog', 'a theme layout of the blog'],
  ['/blog-standard', BLOG, 'blog', 'a theme layout of the blog'],

  ['/services', '/our-services', S],
  ['/service/dental-implants', '/services/dental-implants', S],
  ['/cosmetic-dentistry/porcelain-veneers', '/services/porcelain-dental-veneers', S],
  ['/orthodontics', '/services/invisalign', S, 'Invisalign is the practice\'s orthodontic treatment'],
  ['/services/orthodontics', '/services/invisalign', S],
  ['/services/retainers', '/services/invisalign', S],
  ['/services/childrens-dentistry', '/services/pediatric-dental-care', S],
  ['/services/early-intervention', '/services/pediatric-dental-care', S],
  ['/services/pulp-therapy', '/services/pediatric-dental-care', S, 'pulp therapy is a children\'s treatment'],
  ['/services/deep-cleaning', '/services/comprehensive-care', S, 'comprehensive-care is the deep-cleaning page'],
  ['/services/dental-hygiene', '/services/hygiene-and-periodontics', S],
  ['/services/preventive-dentistry', '/services/preventative-dentistry', S],
  ['/services/family-dentistry', '/our-services', S],

  ['/patient-resources/dental-savings-plan', '/dental-savings-plan', PR],
  ['/patient-resources/product-recommendations', '/product-recommendations', PR],
  ['/patient-resources/special-offers', '/special-offers', PR],

  ['/dental-library/cosmetic-dentistry', '/services/cosmetic-dentistry', S],
  ['/dental-library/cosmetic-dentistry/bonding', '/services/bonding', S],
  ['/dental-library/cosmetic-dentistry/porcelain-veneers', '/services/porcelain-dental-veneers', S],
  ['/dental-library/cosmetic-dentistry/teeth-whitening', '/services/cosmetic-dentistry', S, 'no page of its own'],
  ['/dental-library/endodontic-procedures', '/services/root-canal-therapy', S],
  ['/dental-library/endodontic-procedures/root-canal-therapy', '/services/root-canal-therapy', S],
  ['/dental-library/endodontic-procedures/root-canal-retreatment', '/services/root-canal-therapy', S],
  ['/dental-library/general-dentistry', '/services/preventative-dentistry', S],
  ['/dental-library/general-dentistry/childrens-dentistry', '/services/pediatric-dental-care', S],
  ['/dental-library/general-dentistry/space-maintainers', '/services/pediatric-dental-care', S],
  ['/dental-library/general-dentistry/dental-cleanings-and-exams', '/services/preventative-dentistry', S],
  ['/dental-library/general-dentistry/dental-hygiene', '/services/hygiene-and-periodontics', S],
  ['/dental-library/general-dentistry/fluoride-treatment', '/services/fluoride-treatment', S],
  ['/dental-library/general-dentistry/night-guards', '/services/night-guards', S],
  ['/dental-library/general-dentistry/snore-appliances', '/services/night-guards', S, 'the nearest oral appliance page'],
  ['/dental-library/general-dentistry/occlusal-adjustment', '/services/tmj-tmd', S],
  ['/dental-library/general-dentistry/oral-cancer-screenings', '/services/oral-cancer-screening', S],
  ['/dental-library/general-dentistry/sealants', '/services/sealants', S],
  ['/dental-library/general-dentistry/sedation-dentistry', '/services/sedation-dentistry', S],
  ['/dental-library/general-dentistry/tooth-extractions', '/services/extractions', S],
  ['/dental-library/general-dentistry/wisdom-tooth-removal', '/services/extractions', S],
  ['/dental-library/orthodontic-treatment', '/services/invisalign', S],
  ['/dental-library/orthodontic-treatment/invisaligntm', '/services/invisalign', S],
  ['/dental-library/orthodontic-treatment/interceptive-orthodontics', '/services/pediatric-dental-care', S],
  ['/dental-library/periodontal-therapy', '/services/hygiene-and-periodontics', S],
  ['/dental-library/periodontal-therapy/gingivitis', '/services/hygiene-and-periodontics', S],
  ['/dental-library/restorative-dentistry', '/services/restorative-dentistry', S],
  ['/dental-library/restorative-dentistry/bridges', '/services/bridges', S],
  ['/dental-library/restorative-dentistry/composite-fillings', '/services/composite-fillings', S],
  ['/dental-library/restorative-dentistry/crowns', '/services/dental-crowns', S],
  ['/dental-library/restorative-dentistry/inlay-and-onlay-restorations', '/services/restorative-dentistry', S],
  ['/dental-library/restorative-dentistry/dentures', '/services/dentures', S],
  ['/dental-library/restorative-dentistry/dental-implants', '/services/dental-implants', S],
  ['/dental-library/technology', '/technology', PR],
  ['/dental-library/technology/digital-x-rays', '/technology', PR],
  ['/dental-library/technology/intra-oral-camera', '/technology', PR],

  ...['/sample', '/test', '/shop'].map((s) => [s, '/', DEMO, 'a WordPress theme page, never real content']),
]
for (const [from, to, category, note] of TABLE) add(from, to, category, note)

/* Every other crawled page the new site serves at the same address maps to itself. */
for (const [p, code] of live) if (code === 200 && !exact.has(p)) add(p, p, 'same-path', 'served at the same address')

const PREFIXES = [
  ['/dental-dictionary', '/dental-dictionary', PR, 'the letter pages are one page now'],
  ['/dental-library', '/dental-library', S, 'any other library entry'],
  ['/services', '/our-services', S, 'any other old service page'],
  ['/service', '/our-services', S],
  ['/team', '/our-team', PR, 'theme demo staff and any other profile'],
  ['/about', '/about-us', PR],
  ['/patient-resources', '/patient-resources', PR],
  ['/category', BLOG, 'blog', 'article archives'],
  ['/tag', BLOG, 'blog', 'article archives'],
  ['/author', BLOG, 'blog', 'article archives'],
  ['/portfolio', '/', DEMO, 'WordPress theme demo pages'],
]
const prefix = new Map(PREFIXES.map(([from, to, category, note = '']) => [normalise(from), { to, category, note }]))

const MAP = {
  exact: Object.fromEntries([...exact].map(([k, v]) => [k, v.to])),
  prefix: Object.fromEntries([...prefix].map(([k, v]) => [k, v.to])),
}

// ── checks ─────────────────────────────────────────────────────────────────

const destinations = new Set([...Object.values(MAP.exact), ...Object.values(MAP.prefix)])
if (!OFFLINE) {
  const bad = []
  await pool(destinations, async (d) => { const s = await status(d); if (s !== 200) bad.push(`${d} -> ${s}`) })
  if (bad.length) fail(`destinations not 200 on ${TARGET}:\n  ${bad.join('\n  ')}`)
  else console.log(`live: all ${destinations.size} destinations answer 200 on ${TARGET}`)
}
for (const p of inventory) if (!exact.has(p) && resolve(p, MAP).rule === 'fallback') fail(`crawled page ${p} has no rule`)

// ── audit rows: every known old URL, and what it will do ───────────────────

const rows = [...new Set([...inventory, ...exact.keys()])].sort().map((from) => {
  const { to, rule } = resolve(from, MAP)
  const meta = rule === 'fallback' ? { category: 'fallback', note: 'no page; lands on the home page' }
    : rule.endsWith('/*') ? prefix.get(rule.slice(0, -2)) : exact.get(rule)
  return { from, to, rule, category: meta.category, note: meta.note }
})

// ── emit ───────────────────────────────────────────────────────────────────

mkdirSync(OUT, { recursive: true })
const worker = `/**
 * 301s every URL on bestdentistinkatytx.com to its page on ${TARGET}.
 *
 * GENERATED by mason-park/workflows/12-legacy-redirects/build-redirects.mjs — do not
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
        'cache-control': 'public, max-age=3600',
        'x-mason-park-redirect': rule,
      },
    })
  },
}
`
writeFileSync(join(OUT, 'mason-park-legacy-redirects.js'), worker)
writeFileSync(join(OUT, 'redirect-map.json'), JSON.stringify({ target: TARGET, oldHosts: OLD_HOSTS, blogLive, map: MAP, rows }, null, 1) + '\n')
const q = (s) => /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
writeFileSync(join(OUT, 'redirect-audit.csv'), ['Old URL,New URL,Matched by,Category,Note',
  ...rows.map((r) => [`bestdentistinkatytx.com${r.from}`, TARGET + r.to, r.rule, r.category, r.note].map((v) => q(String(v ?? ''))).join(','))].join('\n') + '\n')

// ── report ─────────────────────────────────────────────────────────────────

const by = rows.reduce((m, r) => (m[r.category] = (m[r.category] || 0) + 1, m), {})
console.log(`\n${rows.length} known old URLs -> ${destinations.size} destinations (blog on production: ${blogLive})`)
for (const [k, v] of Object.entries(by).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(18)} ${v}`)
console.log(`\nmap: ${exact.size} exact rules, ${prefix.size} section rules`)
console.log(`wrote ${OUT}`)
if (process.exitCode) console.error('\nBUILD FAILED — nothing above is safe to deploy')
