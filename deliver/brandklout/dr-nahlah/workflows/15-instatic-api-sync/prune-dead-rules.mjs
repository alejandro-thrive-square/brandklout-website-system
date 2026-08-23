#!/usr/bin/env node
/**
 * prune-dead-rules.mjs — delete style-registry rules that can never match.
 *
 * The registry carries two generations of class vocabulary. The 2026-08-17
 * rename prefixed every bare class per component (`.head` -> `.df-head`,
 * `.big` -> `.re-big`, `.in` -> `.ar-in`, …) but the OLD rules were never
 * removed, so the Selectors panel shows a dead twin beside most live rules and
 * editing the wrong one appears to do nothing.
 *
 * A rule is deleted only when EVERY class and id its selector names is absent
 * from the live site. "Live" is deliberately over-inclusive, because a class
 * that only ever exists at runtime is the trap that has already cost this site
 * a nav menu once (Instatic's publish-time CSS purge, see
 * reference_instatic_publish_purges_css). The live set is the union of:
 *
 *   1. every `class="…"` and `id="…"` token in all 35 PUBLISHED pages;
 *   2. every `.token` inside a quoted string in the published JS bundles —
 *      that is `querySelector('.wz-line')`, `closest('.pk-card')`, …;
 *   3. every bare string handed to classList.add/remove/toggle/contains,
 *      getElementsByClassName, or assigned to className — that is `is-open`,
 *      `wz-ready`, and friends, which appear in NO page's HTML.
 *
 * Anything the scan cannot see is kept. This errs toward leaving a dead rule
 * in place, never toward removing a live one.
 *
 *   node prune-dead-rules.mjs            # report
 *   node prune-dead-rules.mjs --apply    # delete, then read back
 *
 * Publishes nothing. Roll back with rollback-registry.mjs <snapshot>.
 */
import { getSite, getPages, saveShell, BASE } from './insta-api.mjs'
import { writeFileSync } from 'node:fs'

const apply = process.argv.includes('--apply')

/* ---- 1. the live set -------------------------------------------------- */
const { rows } = await getPages()
const urls = new Set()
for (const p of rows) {
  const slug = p.slug ?? p.path ?? p.name
  if (!slug) continue
  // `post` is the blog TEMPLATE. It has no standalone URL (entries render at
  // /posts/<slug>) so /post is a 404 by design, not a page we failed to read.
  // A real post is followed from /posts below, and the run asserts that.
  if (slug === 'post') continue
  urls.add(BASE + '/' + (slug === 'index' ? '' : String(slug).replace(/^\//, '')))
}
const classes = new Set(), ids = new Set()
const addClasses = (h) => {
  for (const m of h.matchAll(/class="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c) classes.add(c)
  for (const m of h.matchAll(/\sid="([^"]*)"/g)) if (m[1]) ids.add(m[1])
}
// Cloudflare in front of this site drops a 36-way fan-out, so requests run six
// at a time with one retry — the sweep REFUSES to delete anything if a page
// cannot be read, and a transient timeout must not look like a missing page.
const fetchText = async (u) => {
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(u); return r.ok ? await r.text() : null }
    catch { await new Promise((s) => setTimeout(s, 400 * (i + 1))) }
  }
  return undefined                                   // undefined = unreadable, not 404
}
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i) }
  }))
  return out
}

const pagesMissed = []
const scripts = new Set()
const first = await mapLimit([...urls], 6, async (u) => [u, await fetchText(u)])
for (const [u, h] of first) {
  if (h == null) { pagesMissed.push(u); continue }
  addClasses(h)
  for (const m of h.matchAll(/<script[^>]+src="([^"]+\.js)"/g)) scripts.add(new URL(m[1], u).href)
  if (u.endsWith('/posts')) {
    const post = [...h.matchAll(/href="(\/posts\/[^"]+)"/g)].map((m) => m[1])[0]
    if (post) {
      const ph = await fetchText(BASE + post)
      if (ph == null) pagesMissed.push(BASE + post); else { addClasses(ph); urls.add(BASE + post) }
    }
  }
}
console.log(`pages: ${urls.size - pagesMissed.length}/${urls.size} read`)
// The blog template's classes only exist on a rendered entry, so a sweep that
// never reached one would call every .bl-* rule dead.
if (![...urls].some((u) => u.includes('/posts/'))) {
  console.error('REFUSING: no rendered blog post was reached, so .bl-* classes are unproven')
  process.exit(1)
}

// Only OUR bundles. The vendor GSAP blob is 153 KB of minified property access
// (`.length`, `.head`, `.in`) — scanning it would mark half the old vocabulary
// "live" for the wrong reason and defeat the whole sweep.
const ours = [...scripts].filter((u) => /\/entries\/site-|\/classic\/(?!001-gsap)/.test(u))
let jsRead = 0
for (const js of await mapLimit(ours, 6, fetchText)) {
  if (js == null) continue
  jsRead++
  // `.token` inside a selector string
  for (const m of js.matchAll(/["'`][^"'`]{0,200}?\.([A-Za-z][A-Za-z0-9_-]*)/g)) classes.add(m[1])
  // bare names handed to the classList / className APIs
  for (const m of js.matchAll(/(?:classList\s*\.\s*(?:add|remove|toggle|contains|replace)|getElementsByClassName)\s*\(([^)]{0,200})\)/g))
    for (const t of m[1].matchAll(/["'`]([A-Za-z][A-Za-z0-9_ -]*)["'`]/g))
      for (const c of t[1].split(/\s+/)) if (c) classes.add(c)
  for (const m of js.matchAll(/className\s*=\s*["'`]([^"'`]{0,200})["'`]/g))
    for (const c of m[1].split(/\s+/)) if (c) classes.add(c)
}
console.log(`scripts: ${jsRead}/${ours.length} of ours read (${scripts.size - ours.length} vendor bundles deliberately skipped)`)

// Belt and braces: every class named anywhere in the LOCAL build's JS and CSS.
// Offline, free, and it catches a runtime class the published bundle happens to
// build by concatenation.
try {
  const { readFileSync } = await import('node:fs')
  for (const f of ['../04-design/.tmp/final-site/assets/site.js', '../04-design/.tmp/final-site/assets/site.css']) {
    const t = readFileSync(new URL(f, import.meta.url), 'utf8')
    for (const m of t.matchAll(/\.([A-Za-z][A-Za-z0-9_-]*)/g)) classes.add(m[1])
    for (const m of t.matchAll(/(?:classList\s*\.\s*\w+|getElementsByClassName)\s*\(\s*["'`]([^"'`]*)["'`]/g))
      for (const c of m[1].split(/\s+/)) if (c) classes.add(c)
  }
  // …and every class in the local build's 35 pages. The published site and the
  // design package are two copies of one design; a class that is markup in the
  // package but absent from the site today is NOT dead — deleting its rule
  // would make the next re-sync from the package come out unstyled.
  const { readdirSync } = await import('node:fs')
  const localDir = new URL('../04-design/.tmp/final-site/', import.meta.url)
  let localPages = 0
  for (const f of readdirSync(localDir).filter((n) => n.endsWith('.html'))) {
    localPages++
    const h = readFileSync(new URL(f, localDir), 'utf8')
    for (const m of h.matchAll(/class="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c) classes.add(c)
  }
  if (localPages < 20) throw new Error(`only ${localPages} local pages read — expected the full build`)
  console.log(`local build scanned too: ${localPages} pages + site.js + site.css`)
} catch (e) {
  console.error('REFUSING: the local build could not be scanned —', e.message)
  process.exit(1)
}

console.log(`live set: ${classes.size} classes, ${ids.size} ids`)
if (pagesMissed.length) {
  console.error(`
REFUSING: ${pagesMissed.length} page(s) unreadable, so the live set is incomplete:`)
  for (const p of pagesMissed) console.error('  ' + p)
  process.exit(1)
}

/* ---- 2. classify ------------------------------------------------------ */
const { site: shell, seq } = await getSite()
const rules = shell.styleRules ?? {}
const dead = []
for (const [id, r] of Object.entries(rules)) {
  const sel = (r.selector ?? '').trim()
  if (!sel || /^(:root|html|body|\*)/.test(sel)) continue
  const cls = [...sel.matchAll(/\.([A-Za-z][A-Za-z0-9_-]*)/g)].map((m) => m[1])
  const idt = [...sel.matchAll(/#([A-Za-z][A-Za-z0-9_-]*)/g)].map((m) => m[1])
  if (!cls.length && !idt.length) continue          // bare tag / attribute rules: keep
  const missing = [...cls.filter((c) => !classes.has(c)), ...idt.filter((i) => !ids.has(i))]
  if (missing.length) dead.push({ id, order: r.order ?? 0, kind: r.kind, sel, missing, props: Object.keys(r.styles ?? {}).length })
}
dead.sort((a, b) => a.order - b.order)
const decls = dead.reduce((n, d) => n + d.props, 0)
console.log(`\ndead: ${dead.length} of ${Object.keys(rules).length} rules, carrying ${decls} declarations`)
console.log(`  empty shells (no declarations): ${dead.filter((d) => !d.props).length}`)
const missingNames = [...new Set(dead.flatMap((d) => d.missing))].sort()
console.log(`  distinct class/id names that exist nowhere on the site: ${missingNames.length}`)
console.log('  ' + missingNames.join(' '))
writeFileSync('.tmp/dead-rules.json', JSON.stringify(dead, null, 1), 'utf8')
console.log('\nfull list -> .tmp/dead-rules.json')

if (!apply) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

/* ---- 3. delete and read back ------------------------------------------ */
for (const d of dead) delete rules[d.id]
const res = await saveShell(shell, seq)
const { site: after } = await getSite()
const left = after.styleRules ?? {}
const survivors = dead.filter((d) => left[d.id])
console.log(`\nseq ${seq} -> ${res.seq}`)
console.log(`registry ${Object.keys(rules).length + dead.length} -> ${Object.keys(left).length} rules`)
if (survivors.length) { console.error(`WRITE DID NOT LAND — ${survivors.length} still present`); process.exit(1) }
console.log('verified — every targeted rule is gone')
console.log('\nDraft updated. Publish with: node insta-api.mjs publish')
