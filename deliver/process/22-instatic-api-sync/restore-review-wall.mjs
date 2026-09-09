#!/usr/bin/env node
/**
 * Put the six review cards back on the Instatic home page.
 *
 *   node restore-review-wall.mjs            # report what it would write
 *   node restore-review-wall.mjs --apply    # write the draft (does NOT publish)
 *
 * ## What went wrong
 *
 * The published home page carried `.rv-wall` with six `.rv-card`s — the copy a
 * visitor sees with JS off, the fallback when the vendor frame cannot load, and
 * ~356 words of real review text for a crawler. The Instatic DRAFT does not
 * have them: it holds `rv-head`, `rv-live` and `rv-more` only. Live and draft
 * had diverged, and because a publish bakes every page, the next publish for
 * ANY reason shipped that divergence and the cards vanished from the live site.
 *
 * Evidence that the published page really did have them (all three agree):
 *   - `13-content-export-import/.tmp/home-readback.html` (2026-08-19), a
 *     readback of the PLATFORM page: 6 `.rv-card`;
 *   - `.tmp/.instatic2/index.json` (2026-08-20), same, with the section order
 *     `rv-wall` → `rv-more` → `rv-live`;
 *   - `08-qa/.tmp/audit-out/index.json` as committed: `words: 1741`. The same
 *     audit re-run after the divergence shipped reports `1385`.
 *
 * ## Where the content comes from
 *
 * `04-design/.tmp/final-site/index.html` — the local build, which is the
 * reference for this site. The six cards are parsed out of it rather than
 * re-derived from `reviews.json` (which holds eight), so what goes back is what
 * was there, in the order it was there.
 *
 * ## Node shapes
 *
 * Mirrored from the page's own surviving nodes (`rv-head`, `rv-more`):
 * `base.container` carries `{tag, customTag, htmlAttributes}` and `base.text`
 * carries `{text, tag, htmlAttributes}`, where `tag: 'none'` is a bare string
 * beside a sibling element (the reviewer's name next to the avatar and the
 * `<i>Google</i>`). Text props are stored RAW — the publisher escapes them at
 * render time — so the HTML entities in the source markup are decoded here.
 * Classes are referenced by id; every id is looked up by NAME from the live
 * shell rather than hardcoded, and a missing one aborts before any write.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, getSite, getPages, toChangedPage } from './insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const LOCAL = join(HERE, '../04-design/.tmp/final-site/index.html')
const APPLY = process.argv.includes('--apply')

// ── read the six cards out of the local build ──────────────────────────────

const html = readFileSync(LOCAL, 'utf8')
const wallMatch = html.match(/<div class="rv-wall"([^>]*)>([\s\S]*?)\n {6}<\/div>/)
if (!wallMatch) { console.error(`no .rv-wall found in ${LOCAL}`); process.exit(1) }

const decode = (s) => s
  .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”')
  .replace(/&lsquo;/g, '‘').replace(/&rsquo;/g, '’')
  .replace(/&nbsp;/g, ' ').replace(/&hellip;/g, '…')
  .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&amp;/g, '&')
  .trim()

const cards = []
for (const m of wallMatch[2].matchAll(/<article class="rv-card">([\s\S]*?)<\/article>/g)) {
  const card = m[1]
  const stars = card.match(/<span class="rv-stars"[^>]*>([^<]*)<\/span>/)
  const when = card.match(/<span class="rv-when">([^<]*)<\/span>/)
  const body = card.match(/<p>([\s\S]*?)<\/p>/)
  const foot = card.match(/<footer><span class="rv-av"[^>]*>([^<]*)<\/span>([^<]*)<i>([^<]*)<\/i><\/footer>/)
  if (!stars || !when || !body || !foot) {
    console.error('a card did not match the expected shape — refusing to guess')
    process.exit(1)
  }
  cards.push({
    stars: decode(stars[1]), when: decode(when[1]), body: decode(body[1]),
    avatar: decode(foot[1]), name: decode(foot[2]), source: decode(foot[3]),
  })
}
console.log(`parsed ${cards.length} cards from the local build`)
if (cards.length !== 6) { console.error('expected 6 cards'); process.exit(1) }

// ── build the nodes ────────────────────────────────────────────────────────

const { site, seq: shellBaseSeq } = await getSite()
const idByName = new Map()
for (const [id, rule] of Object.entries(site.styleRules)) {
  idByName.set(rule.name ?? rule.selector ?? id, id)
}
const cls = (...names) => names.map((n) => {
  const id = idByName.get(n)
  if (!id) { console.error(`class "${n}" does not exist on this site — aborting`); process.exit(1) }
  return id
})

const nodes = {}
let counter = 0
/** Deterministic ids, so re-running replaces the same nodes instead of stacking. */
const mk = (moduleId, props, classIds, parentId) => {
  const id = `rvwall-${(counter++).toString(36)}`
  nodes[id] = { id, moduleId, props, classIds, parentId, children: [], breakpointOverrides: {} }
  if (parentId) nodes[parentId].children.push(id)
  return id
}
const box = (customTag, classIds, parentId) => mk('base.container',
  customTag === 'div'
    ? { tag: 'div', customTag: '', htmlAttributes: {} }
    : { tag: 'custom', customTag, htmlAttributes: {} },
  classIds, parentId)
const text = (value, tag, classIds, parentId, htmlAttributes = {}) =>
  mk('base.text', { text: value, tag, htmlAttributes }, classIds, parentId)

const wallId = mk('base.container',
  { tag: 'div', customTag: '', htmlAttributes: { 'data-rv': 'stagger' } },
  cls('rv-wall'), null)

for (const card of cards) {
  const article = box('article', cls('rv-card'), wallId)
  const meta = box('div', cls('rv-meta'), article)
  text(card.stars, 'span', cls('rv-stars'), meta, { 'aria-hidden': 'true' })
  text(card.when, 'span', cls('rv-when'), meta)
  text(card.body, 'p', [], article)
  const footer = box('footer', [], article)
  text(card.avatar, 'span', cls('rv-av'), footer, { 'aria-hidden': 'true' })
  /* `tag: 'none'` — the reviewer's name is a bare string between the avatar
     span and the <i>, exactly as the built markup has it. */
  text(card.name, 'none', [], footer)
  const src = box('i', [], footer)
  text(card.source, 'none', [], src)
}

// ── splice into the page ───────────────────────────────────────────────────

const { rows } = await getPages()
const row = rows.find((r) => r.cells.slug === 'index')
if (!row) { console.error('no page with slug "index"'); process.exit(1) }

const body = JSON.parse(JSON.stringify(row.cells.body))
const nameOf = (n) => (n.classIds || []).map((id) => {
  for (const [name, cid] of idByName) if (cid === id) return name
  return id
})
const findByClass = (name) =>
  Object.values(body.nodes).find((n) => nameOf(n).includes(name))

/* Anchor on the SECTION, not on `.rv-live`. The original version of this script
   found the section via the live slot, because that slot was the only thing
   left of the review block. It has since been replaced by a
   `webzite.embed-origins.embed` node (the ReputationHub widget), so `.rv-live`
   no longer exists and anchoring on it aborts. `.pf-reviews` is the section
   itself and has survived every revision of this block. */
const section = findByClass('pf-reviews')
if (!section) { console.error('no .pf-reviews on the page — the section is not what this script expects'); process.exit(1) }

if (findByClass('rv-wall')) {
  console.log('the page already has a .rv-wall — nothing to do')
  process.exit(0)
}

nodes[wallId].parentId = section.id
Object.assign(body.nodes, nodes)
/* Directly after the header, so the cards are the section's content. */
const at = Math.min(1, section.children.length)
section.children.splice(at, 0, wallId)

/* Put the vendor embed LAST, after the "Read the patient stories" link. That is
   the order the published page carried before the wall was lost
   (`rv-wall` → `rv-more` → live slot, per `.tmp/.instatic2/index.json`), and it
   matters now for a reason it did not then: the widget's own SSR payload
   currently returns `reviews: []` (no review source is connected to it at the
   vendor), so it collapses to ~91px. Between the cards and the link that reads
   as a hole in the section; after the link it is invisible until the vendor
   account is fixed, at which point it appears in place with no further edit. */
const embed = Object.values(body.nodes).find(
  (n) => n.moduleId === 'webzite.embed-origins.embed' && n.parentId === section.id,
)
if (embed) {
  const from = section.children.indexOf(embed.id)
  section.children.splice(from, 1)
  section.children.push(embed.id)
  console.log(`moved the vendor embed "${embed.id}" from index ${from} to last`)
}

console.log(`inserting ${Object.keys(nodes).length} nodes into "${section.id}" at index ${at}`)
console.log(`page node count ${Object.keys(row.cells.body.nodes).length} -> ${Object.keys(body.nodes).length}`)
console.log(`section children: ${section.children.join(', ')}`)
if (!APPLY) { console.log('\nDRY RUN — re-run with --apply to write the draft'); process.exit(0) }

/* `toChangedPage` carries `template` through. A page write REPLACES the row's
   cells (`pageToCells`), so anything not in the payload is dropped — that is
   how 43 articles were un-templated on 2026-08-25. `index` carries no template
   today, but going through the helper means this stays correct if it ever does.
   `seoTitle` / `seoDescription` CANNOT survive this call at all; re-apply them
   afterwards with `push-page-seo-cells.mjs --only index --apply`. */
mkdirSync(join(HERE, '.tmp', 'backups'), { recursive: true })
const backup = join(HERE, '.tmp', 'backups', 'pre-review-wall-index.json')
writeFileSync(backup, JSON.stringify(row, null, 1))
console.log(`backed up the page row to ${backup}`)

const page = toChangedPage(row, { nodes: body.nodes, rootNodeId: body.rootNodeId })
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site,
  changedPages: [page],
  deletedPageIds: [],
  changedComponents: [],
  deletedComponentIds: [],
  changedLayouts: [],
  deletedLayoutIds: [],
  baseSeqs: { [row.id]: row.seq },
  shellBaseSeq,
})
console.log('saved:', JSON.stringify(res).slice(0, 200))

// ── read back, and prove it ────────────────────────────────────────────────

const after = (await getPages()).rows.find((r) => r.id === row.id)
const nodesAfter = after.cells.body.nodes
const nameAfter = (n) => (n.classIds || []).map((id) => {
  for (const [name, cid] of idByName) if (cid === id) return name
  return id
})
const count = (name) => Object.values(nodesAfter).filter((n) => nameAfter(n).includes(name)).length
const checks = [
  ['.rv-wall present', count('rv-wall') === 1],
  ['6 .rv-card', count('rv-card') === 6],
  ['node count', Object.keys(nodesAfter).length === Object.keys(body.nodes).length],
  ['slug intact', after.cells.slug === row.cells.slug],
  ['title intact', after.cells.title === row.cells.title],
  ['root intact', after.cells.body.rootNodeId === row.cells.body.rootNodeId],
  ['embed survived', Object.values(nodesAfter).some((n) => n.moduleId === 'webzite.embed-origins.embed')],
]
let bad = 0
for (const [label, ok] of checks) { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}`); if (!ok) bad++ }
if (bad) { console.error(`\n${bad} check(s) failed — restore from ${backup}`); process.exit(1) }

console.log('\nNot published.')
console.log('NEXT, in this order:')
console.log('  1. node push-page-seo-cells.mjs --only index --apply   (this write wiped them)')
console.log('  2. node insta-api.mjs publish')
