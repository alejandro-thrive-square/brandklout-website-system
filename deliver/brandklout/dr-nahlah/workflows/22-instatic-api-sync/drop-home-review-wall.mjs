#!/usr/bin/env node
/**
 * drop-home-review-wall.mjs — take the six-card review wall off the HOME page,
 * leaving the ReputationHub embed as the only reviews there. The exact inverse
 * of process/22-instatic-api-sync/restore-review-wall.mjs.
 *
 *   node drop-home-review-wall.mjs            # report the plan, write nothing
 *   node drop-home-review-wall.mjs --apply    # write the draft (does NOT publish)
 *
 * ## What the client is actually seeing
 *
 * The published home page carries BOTH: `.rv-wall` with six `.rv-card`s, and
 * below it a `brandklout.embed-origins.embed` node holding the ReputationHub
 * iframe. The same reviews, twice, one above the other. (The plugin was
 * `webzite.embed-origins.*` before migrate-plugin-ids.mjs renamed it, and
 * restore-review-wall.mjs still looks for the old id, so it no longer finds
 * this embed at all. Both spellings are accepted here.)
 *
 * ## Why they both appeared, because it decides what to remove
 *
 * `sections/ch-proof.js` was written to show cards and upgrade to the live
 * widget where a frame is allowed, hiding the wall (`wall.hidden = true`) once
 * the widget reports its height. Two things broke that on the platform:
 *
 *   1. the page was imported while `hidden` was set, so the importer baked
 *      `display:none` into the `.rv-wall` style rules and the cards were
 *      invisible from the import until 2026-09-21, when fix-rv-wall-display.mjs
 *      put `display:grid` back — which is when the wall APPEARED on the home
 *      page for the first time, and why this reads as "the wall was restored";
 *   2. the live frame on the published page is NOT the one ch-proof.js builds.
 *      Its `.rv-live` slot is not in the published document at all; the frame
 *      is a separate Embed block. So the upgrade code returns early, the hide
 *      never runs, and nothing was ever going to take the wall down.
 *
 * ## What this must NOT touch
 *
 *   - the `.rv-wall` / `.rv-card` STYLE RULES. The two veneers consultation
 *     landing pages carry their own `.rv-wall lp-rv-wall` of four
 *     veneer-specific reviews, added 2026-09-21 when the client dropped the
 *     filmed patient. Reverting fix-rv-wall-display.mjs would blank those
 *     again. This removes NODES from one page, never a rule.
 *   - the Embed node, `.rv-head` and the `.rv-more` link. All three are
 *     asserted before the write and after it.
 *
 * ## What this gives up
 *
 * ~356 words of review text that counted for this domain (inside the frame they
 * count for reputationhub.site), and the copy shown with JavaScript off or when
 * the widget fails to load — the section can now be a heading and a link.
 * Confirmed with the client on 2026-09-22 before this was written.
 *
 * ## After the write
 *
 * `toChangedPage` REPLACES the row's cells, so `seoTitle` / `seoDescription`
 * cannot survive this call. Re-apply them with
 * `node push-page-seo-cells.mjs --only index --apply` before publishing.
 *
 * NOTHING HERE PUBLISHES.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, getSite, getPages, toChangedPage } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')

const { site, seq: shellBaseSeq } = await getSite()
const idByName = new Map()
for (const [id, rule] of Object.entries(site.styleRules)) {
  idByName.set(rule.name ?? rule.selector ?? id, id)
}

const { rows } = await getPages()
const row = rows.find((r) => r.cells.slug === 'index')
if (!row) { console.error('no page with slug "index"'); process.exit(1) }

const body = JSON.parse(JSON.stringify(row.cells.body))
const nameOf = (n) => (n.classIds || []).map((id) => {
  for (const [name, cid] of idByName) if (cid === id) return name
  return id
})
const allByClass = (name) => Object.values(body.nodes).filter((n) => nameOf(n).includes(name))

const walls = allByClass('rv-wall')
const cards = allByClass('rv-card')
console.log(`home page: ${Object.keys(body.nodes).length} nodes, .rv-wall ${walls.length}, .rv-card ${cards.length}`)

if (walls.length === 0) {
  console.log('no .rv-wall on the home page — nothing to do')
  process.exit(0)
}
if (walls.length !== 1) {
  console.error(`expected exactly one .rv-wall, found ${walls.length} — refusing to guess`)
  process.exit(1)
}
const wall = walls[0]

/* The whole subtree, so no orphans are left stranded in the node map. */
const doomed = new Set()
;(function walk(id) {
  if (!id || doomed.has(id)) return
  doomed.add(id)
  for (const c of body.nodes[id]?.children ?? []) walk(c)
})(wall.id)

const section = Object.values(body.nodes).find((n) => (n.children || []).includes(wall.id))
if (!section) { console.error('the .rv-wall has no parent — refusing'); process.exit(1) }
console.log(`\nparent "${section.id}" (${nameOf(section).join(' ') || section.moduleId}) children, before:`)
for (const [i, c] of (section.children || []).entries()) {
  const n = body.nodes[c]
  console.log(`  ${i}. ${c}  ${nameOf(n).join(' ') || n.moduleId}`)
}
console.log(`\nremoving ${doomed.size} nodes: the .rv-wall and its ${doomed.size - 1} descendants`)

for (const id of doomed) delete body.nodes[id]
for (const n of Object.values(body.nodes)) {
  if ((n.children || []).some((c) => doomed.has(c))) {
    n.children = n.children.filter((c) => !doomed.has(c))
  }
}

/* Guards, checked against the POST-removal document. */
const survives = (name) => Object.values(body.nodes).some((n) => nameOf(n).includes(name))
const embedSurvives = Object.values(body.nodes)
  .some((n) => /^(brandklout|webzite).embed-origins.embed$/.test(n.moduleId))
const guards = [
  ['.rv-head survives', survives('rv-head')],
  ['.rv-more survives', survives('rv-more')],
  ['.pf-reviews section survives', survives('pf-reviews')],
  ['the ReputationHub embed survives', embedSurvives],
  ['no .rv-wall left', !survives('rv-wall')],
  ['no .rv-card left', !survives('rv-card')],
  ['root intact', !!body.nodes[body.rootNodeId]],
]
let bad = 0
for (const [label, ok] of guards) { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}`); if (!ok) bad++ }
if (bad) { console.error(`\n${bad} guard(s) failed — writing nothing`); process.exit(1) }

console.log(`\nnode count ${Object.keys(row.cells.body.nodes).length} -> ${Object.keys(body.nodes).length}`)
console.log(`section children after: ${(Object.values(body.nodes).find((n) => n.id === section.id).children || []).join(', ')}`)
if (!APPLY) { console.log('\nDRY RUN — re-run with --apply to write the draft'); process.exit(0) }

mkdirSync(join(HERE, '.tmp', 'backups'), { recursive: true })
const backup = join(HERE, '.tmp', 'backups', 'pre-drop-review-wall-index.json')
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
const countAfter = (name) => Object.values(nodesAfter).filter((n) => nameAfter(n).includes(name)).length
const checks = [
  ['.rv-wall gone', countAfter('rv-wall') === 0],
  ['.rv-card gone', countAfter('rv-card') === 0],
  ['.rv-head kept', countAfter('rv-head') === 1],
  ['.rv-more kept', countAfter('rv-more') === 1],
  ['node count', Object.keys(nodesAfter).length === Object.keys(body.nodes).length],
  ['slug intact', after.cells.slug === row.cells.slug],
  ['title intact', after.cells.title === row.cells.title],
  ['root intact', after.cells.body.rootNodeId === row.cells.body.rootNodeId],
  ['embed survived', Object.values(nodesAfter).some((n) => /^(brandklout|webzite).embed-origins.embed$/.test(n.moduleId))],
]
bad = 0
for (const [label, ok] of checks) { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}`); if (!ok) bad++ }
if (bad) { console.error(`\n${bad} check(s) failed — restore from ${backup}`); process.exit(1) }

console.log('\nNot published. Re-apply the SEO cells before anyone does:')
console.log('  node push-page-seo-cells.mjs --only index --apply')
