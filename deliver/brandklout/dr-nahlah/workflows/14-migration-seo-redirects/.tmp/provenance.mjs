/**
 * Where did every URL go, and where did every Instatic page come from?
 *
 * The redirect map answers "what should this old URL do". It does NOT answer
 * "why is there no page here any more" — a rule pointing `/tysons-study-club`
 * at `/meet-dr-nahlah` looks identical whether that page was deliberately
 * retired, quietly forgotten, or never existed on WordPress at all.
 *
 * This joins three lists that have never been compared directly:
 *   1. the WordPress scrape (78 URLs live at migration, with word counts)
 *   2. the Instatic build (36 pages + 43 articles, live)
 *   3. the redirect audit (adds the Wayback-only URLs, already dead pre-scrape)
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SYNC = join(HERE, '..', '..', '15-instatic-api-sync', '.tmp')
const SCRAPE = join(HERE, '..', '..', '01-content-intake', '.tmp', 'current-site-scrape', 'site-data.json')

const scrape = JSON.parse(readFileSync(SCRAPE, 'utf8'))
const pages = JSON.parse(readFileSync(join(SYNC, 'inventory-pages.json'), 'utf8')).filter((p) => !p.templated)
const posts = JSON.parse(readFileSync(join(SYNC, 'inventory-posts.json'), 'utf8'))
const audit = readFileSync(join(HERE, 'drnahlah-301-redirects-audit.csv'), 'utf8')
  .trim().split(/\r?\n/).slice(1)
  .map((l) => { const [from, to, source, wasLive] = l.split(','); return { from, to, source, wasLive } })

const instaticPages = new Set(pages.map((p) => (p.slug === 'index' ? '' : p.slug)))
const instaticPosts = new Set(posts.map((p) => p.slug))
const ruleFor = new Map(audit.map((r) => [r.from, r.to]))

const wpPages = scrape.filter((r) => r.kind === 'page')
const wpPosts = scrape.filter((r) => r.kind === 'post')
const wpCats = scrape.filter((r) => r.kind === 'category')

const survived = [], renamed = [], retired = []
for (const p of wpPages) {
  const slug = p.slug === '' || p.slug === 'home' ? '' : p.slug
  if (instaticPages.has(slug)) { survived.push(p); continue }
  const to = ruleFor.get(`/${p.slug}`) ?? ruleFor.get('/' + slug)
  /* "Renamed" means the CONTENT has a home under a different address.
     "Retired" means it was folded into another page or dropped. Only a human
     reading both can tell them apart, so the call is recorded here by name. */
  const RENAMED = {
    'dr-esam-nahlah': 'meet-dr-nahlah',
    'our-dental-facility': 'our-facility',
    'dental-crowns-and-bridges': 'crowns-and-bridges',
    'cost-of-dental-implants': 'implant-cost',
    'testimonials': 'patient-stories',
    'video-gallery': 'video-library',
    'veneer-survey-thank-you': 'thank-you',
    'implant-survey-thank-you': 'thank-you',
    'blog': 'posts',
  }
  if (RENAMED[p.slug]) { renamed.push({ ...p, to: '/' + RENAMED[p.slug] }); continue }
  retired.push({ ...p, to })
}

const missingPosts = wpPosts.filter((p) => !instaticPosts.has(p.slug))
const wpSlugs = new Set(wpPages.map((p) => (p.slug === '' || p.slug === 'home' ? '' : p.slug)))
/* A rebuilt-elsewhere page is not new — its destination slug has a WordPress
   ancestor even though the slug itself does not appear in the scrape. */
const renamedTargets = new Set(renamed.map((p) => p.to.replace(/^\//, '')))
const brandNew = [...instaticPages].filter((s) => !wpSlugs.has(s) && !renamedTargets.has(s))

const line = (p) => `    /${p.slug}`.padEnd(46) + `${String(p.word_count).padStart(5)} words` +
  (p.to ? `   -> ${p.to}` : '')

console.log(`WORDPRESS AT MIGRATION: ${scrape.length} URLs — ${wpPages.length} pages, ${wpPosts.length} posts, ${wpCats.length} category archives`)
console.log(`INSTATIC NOW:           ${pages.length} pages + ${posts.length} articles\n`)

console.log(`1. WP pages rebuilt at the SAME url (${survived.length})`)
for (const p of survived.sort((a, b) => a.slug.localeCompare(b.slug))) console.log(line(p))

console.log(`\n2. WP pages rebuilt at a DIFFERENT url — content survived (${renamed.length})`)
for (const p of renamed.sort((a, b) => a.slug.localeCompare(b.slug))) console.log(line(p))

console.log(`\n3. WP pages with NO page in the new build — folded or dropped (${retired.length})`)
for (const p of retired.sort((a, b) => a.slug.localeCompare(b.slug))) console.log(line(p))

console.log(`\n4. WP posts not migrated (${missingPosts.length})`)
for (const p of missingPosts) console.log(line(p))

console.log(`\n5. Instatic pages with NO WordPress ancestor — net new (${brandNew.length})`)
for (const s of brandNew.sort()) console.log(`    /${s}`)

const legacy = audit.filter((r) => r.source === 'legacy')
const wpStruct = audit.filter((r) => r.source === 'wp-structure')
console.log(`\n6. Redirect sources that were ALREADY DEAD before the scrape (${legacy.length} legacy, Wayback-only)`)
console.log(`   — earlier site generations. Never candidates to rebuild; they hold inbound links only.`)
console.log(`\n7. WordPress plumbing, never a page at all (${wpStruct.length} rules)`)
console.log(`   — /feed, /wp-json, /author/*, dated archives, /category/*, /tag/*.`)
