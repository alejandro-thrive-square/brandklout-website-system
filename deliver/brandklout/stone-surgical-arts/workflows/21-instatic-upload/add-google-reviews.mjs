/**
 * The practice's live Google reviews (Elfsight) where the static ones were,
 * written straight onto the three live pages.
 *
 *   node add-google-reviews.mjs                         dry run (default)
 *   node add-google-reviews.mjs --apply                 write the draft
 *   node add-google-reviews.mjs --apply --publish
 *   INSTATIC_BASE_URL=https://staging.dfwsurgicalarts.com node add-google-reviews.mjs …
 *
 * Widget: Elfsight Google Reviews `c92f78df-0615-4ab9-a204-4f7b385011c9`, the
 * practice's own listing (72 Andorra Dr #110, Westlake), on the shared Elfsight
 * account. It existed since April 2026 but was embedded on the sister
 * practice's site; the 2026-09-30 rollout puts it here. Registry of every
 * widget: deliver/process/tools/elfsight-reviews/review-widgets.json.
 *
 *   /         proof chapter   .proof_slides + .proof_controls (six quotes)  -> Embed
 *   /results  #reviews        [data-filter] wall + .tier_foot (eight cards) -> Embed,
 *                             and the lede no longer claims the practice published them
 *   /team     proof band      .proof_slides + .proof_controls (four quotes) -> Embed
 *
 * Each chapter keeps its photograph, its 4.8 rating card, its chapter mark and
 * (on /results) its heading. The two carousels also lose `tabindex` and
 * `aria-roledescription="carousel"`: the carousel they described is gone.
 *
 * WHY A SEPARATE SCRIPT AND NOT THE PIPELINE. The authored pages carry the
 * same change as an embed MARKER (see `site-src/pages/*.body.html` and the
 * `google-reviews` row in place-embeds.mjs), so the next full re-import puts
 * the block back by itself. But a full re-import replaces all 54 pages and
 * every admin edit with them (trap 11), which is the wrong tool for a change
 * to three sections. This edits the three rows in place, by class name, so it
 * runs against staging and production alike (their node ids differ).
 *
 * WHAT IT WRITES. One `brandklout.embed-origins.embed` module node per page in
 * snippet mode, carrying the author class `.reviews_embed` (created on the
 * shell if missing, mirroring css/62-embed.css). The snippet is read out of
 * the BUILT page's marker, exactly as place-embeds.mjs does, so the authored
 * page stays the only copy; build the site first. The page's CSP is widened
 * by the plugin at publish time, which is what lets platform.js run at all.
 *
 * Re-runnable: a page that already carries the block gets its snippet
 * refreshed if the authored one changed, and is otherwise left alone.
 *
 * Backup first: the whole shell and every page row go to
 * `.tmp/backup-<host>-<stamp>-pre-google-reviews.json` before any write.
 */
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { api, getSite, getPages, saveShell, publish, BASE } from '../../../../process/tools/instatic-api-sync/insta-api.mjs'
import { markerFor } from './embed-markers.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const FINAL = path.resolve(HERE, '../04-design/.tmp/surgical-arts/final-site')
const TMP = path.join(HERE, '.tmp')

const apply = process.argv.includes('--apply')
const alsoPublish = process.argv.includes('--publish')

const MODULE_ID = 'brandklout.embed-origins.embed'
const KEY = 'google-reviews'
const WIDGET = 'c92f78df-0615-4ab9-a204-4f7b385011c9'
const CLASS = 'reviews_embed'
/* Mirrors `.reviews_embed` in site-src/css/62-embed.css. A full re-import
   creates this rule from the CSS; until then this is the only copy live. */
const CLASS_STYLES = { position: 'relative', width: '100%', maxWidth: '100%', minHeight: '26rem' }
/* Same row as `google-reviews` in place-embeds.mjs, which is the canonical one. */
const PROPS = {
  source: 'snippet',
  url: '',
  title: 'Google reviews',
  fit: 'auto',
  height: 420,
  ratio: '16 / 9',
  lazy: true,
  allowFullscreen: false,
  allow: '',
}
const OLD_LEDE = 'These are the reviews from cosmetic patients, published by the practice itself.'
const NEW_LEDE = 'Straight from the practice' + String.fromCharCode(0x2019) + 's Google listing, as patients wrote them.'
const DROP_SECTION_ATTRS = ['tabindex', 'aria-roledescription']

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => [...randomBytes(n)].map((b) => ALPHABET[b & 63]).join('')

// ── the instance ─────────────────────────────────────────────────────────
const plugins = await api('GET', '/admin/api/cms/plugins').catch(() => ({}))
const plugin = (plugins.plugins ?? plugins.rows ?? []).find((p) => p.id === 'brandklout.embed-origins')
if (!plugin || plugin.enabled === false) {
  console.error('REFUSING: brandklout.embed-origins is not installed or not enabled here; a module node without its plugin publishes as nothing.')
  process.exit(1)
}
console.log(`target     ${BASE}`)
console.log(`plugin     ${plugin.id} ${plugin.version}  policy=${plugin.settings?.embedPolicy ?? '?'}`)

const siteDoc = await getSite()
const shell = siteDoc.site
const shellSeq = siteDoc.seq
const pagesDoc = await getPages()
const rows = pagesDoc.rows ?? []
console.log(`shell seq  ${shellSeq}  pages ${rows.length}`)

// ── backup, before anything else ──────────────────────────────────────────
const host = BASE.replace(/^https?:\/\//, '')
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const backupFile = path.join(TMP, `backup-${host}-${stamp}-pre-google-reviews.json`)
if (apply) {
  fs.mkdirSync(TMP, { recursive: true })
  fs.writeFileSync(backupFile, JSON.stringify({ base: BASE, shellSeq, site: shell, rows }, null, 1))
  console.log(`backup     ${path.relative(HERE, backupFile)}  (${(fs.statSync(backupFile).size / 1e6).toFixed(1)} MB)`)
}

// ── the author class ──────────────────────────────────────────────────────
const rules = shell.styleRules ?? (shell.styleRules = {})
const ruleName = (r) => String(r.name ?? '').replace(/^\./, '')
const ruleByName = (name) => Object.values(rules).find((r) => r.kind === 'class' && ruleName(r) === name)
const nameOf = (id) => ruleName(rules[id] ?? {})
const hasClass = (n, c) => (n?.classIds ?? []).some((id) => nameOf(id) === c)

let embedRule = ruleByName(CLASS)
let shellChanged = false
if (!embedRule) {
  const model = ruleByName('form_embed')
  if (!model) throw new Error('no .form_embed rule on the shell to model the new class on')
  const dotted = String(model.name).startsWith('.')
  const order = Math.max(0, ...Object.values(rules).map((r) => r.order ?? 0)) + 1
  embedRule = {
    id: nanoid(),
    name: dotted ? `.${CLASS}` : CLASS,
    kind: 'class',
    selector: `.${CLASS}`,
    order,
    styles: { ...CLASS_STYLES },
    contextStyles: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  rules[embedRule.id] = embedRule
  shellChanged = true
  console.log(`rule       + .${CLASS} (order ${order}, modelled on .form_embed ${model.id})`)
} else {
  console.log(`rule       .${CLASS} exists (${embedRule.id})`)
}

// ── helpers ───────────────────────────────────────────────────────────────
function dropSubtree(nodes, id) {
  for (const c of nodes[id]?.children ?? []) dropSubtree(nodes, c)
  delete nodes[id]
}

function embedNode(parentId, snippet) {
  return {
    id: nanoid(),
    moduleId: MODULE_ID,
    props: { ...PROPS, snippet },
    breakpointOverrides: {},
    children: [],
    classIds: [embedRule.id],
    parentId,
  }
}

/* Every child named exists, every parent named exists, and everything is
   reachable from the root: the three ways a hand edit leaves a page that the
   admin can no longer open. */
function assertTree(nodes, rootId, slug) {
  const seen = new Set()
  const walk = (id) => {
    const n = nodes[id]
    if (!n) throw new Error(`${slug}: child ${id} does not exist`)
    if (seen.has(id)) throw new Error(`${slug}: ${id} reached twice`)
    seen.add(id)
    for (const c of n.children ?? []) {
      if (nodes[c]?.parentId !== id) throw new Error(`${slug}: ${c} claims parent ${nodes[c]?.parentId}, sits under ${id}`)
      walk(c)
    }
  }
  walk(rootId)
  const orphans = Object.keys(nodes).filter((id) => !seen.has(id))
  if (orphans.length) throw new Error(`${slug}: ${orphans.length} node(s) unreachable from the root: ${orphans.slice(0, 5).join(', ')}`)
}

function sectionOf(nodes, cls, slug) {
  const hits = Object.values(nodes).filter((n) => hasClass(n, cls))
  if (hits.length !== 1) throw new Error(`${slug}: expected one .${cls}, found ${hits.length}`)
  return hits[0]
}

function placedIn(nodes, sectionId) {
  const inside = []
  const walk = (id) => {
    const n = nodes[id]
    if (!n) return
    if (n.moduleId === MODULE_ID && String(n.props?.snippet ?? '').includes(WIDGET)) inside.push(n)
    for (const c of n.children ?? []) walk(c)
  }
  walk(sectionId)
  return inside
}

function snippetFor(slug) {
  const html = fs.readFileSync(path.join(FINAL, `${slug}.html`), 'utf8')
  const snippet = markerFor(html, KEY, `${slug}.html`).inner.trim()
  if (!snippet.includes(WIDGET)) throw new Error(`${slug}.html: the ${KEY} marker does not name widget ${WIDGET}`)
  if (/data-elfsight-app-lazy/.test(snippet)) throw new Error(`${slug}.html: the snippet carries data-elfsight-app-lazy, which never boots on Instatic — remove it`)
  return snippet
}

/* Swap `.proof_slides` + `.proof_controls` inside `.proof_stage` for the block. */
function swapCarousel(row, slug) {
  const nodes = row.cells.body.nodes
  const section = sectionOf(nodes, 'proof_component', slug)
  const snippet = snippetFor(slug)
  const already = placedIn(nodes, section.id)
  if (already.length) {
    const stale = already.filter((n) => n.props.snippet !== snippet)
    for (const n of stale) n.props.snippet = snippet
    console.log(`${slug.padEnd(10)} block already placed; ${stale.length ? 'snippet refreshed' : 'up to date'}`)
    return stale.length > 0
  }
  const stage = Object.values(nodes).find((n) => hasClass(n, 'proof_stage'))
  if (!stage) throw new Error(`${slug}: no .proof_stage`)
  const slidesId = stage.children.find((c) => hasClass(nodes[c], 'proof_slides'))
  const controlsId = stage.children.find((c) => hasClass(nodes[c], 'proof_controls'))
  if (!slidesId || !controlsId) throw new Error(`${slug}: .proof_stage lacks .proof_slides or .proof_controls`)
  const at = stage.children.indexOf(slidesId)
  const made = embedNode(stage.id, snippet)
  const before = Object.keys(nodes).length
  dropSubtree(nodes, slidesId)
  dropSubtree(nodes, controlsId)
  nodes[made.id] = made
  stage.children = stage.children.filter((c) => c !== controlsId)
  stage.children[at] = made.id
  const attrs = section.props?.htmlAttributes ?? {}
  const dropped = DROP_SECTION_ATTRS.filter((a) => a in attrs)
  for (const a of dropped) delete attrs[a]
  console.log(`${slug.padEnd(10)} .proof_slides + .proof_controls -> Embed ${made.id} at index ${at}; ${before} -> ${Object.keys(nodes).length} nodes; section attrs dropped: ${dropped.join(', ') || 'none'}`)
  return true
}

/* Swap the `[data-filter]` wall and `.tier_foot` inside `.wall_component`, and fix the lede. */
function swapWall(row, slug) {
  const nodes = row.cells.body.nodes
  const section = sectionOf(nodes, 'wall_component', slug)
  const snippet = snippetFor(slug)
  let changed = false
  const already = placedIn(nodes, section.id)
  if (already.length) {
    const stale = already.filter((n) => n.props.snippet !== snippet)
    for (const n of stale) n.props.snippet = snippet
    console.log(`${slug.padEnd(10)} block already placed; ${stale.length ? 'snippet refreshed' : 'up to date'}`)
    changed = stale.length > 0
  } else {
    const filterId = section.children.find((c) => nodes[c]?.props?.htmlAttributes?.['data-filter'] !== undefined)
    const footId = section.children.find((c) => hasClass(nodes[c], 'tier_foot'))
    if (!filterId || !footId) throw new Error(`${slug}: .wall_component lacks [data-filter] or .tier_foot`)
    const at = section.children.indexOf(filterId)
    const made = embedNode(section.id, snippet)
    const before = Object.keys(nodes).length
    dropSubtree(nodes, filterId)
    dropSubtree(nodes, footId)
    nodes[made.id] = made
    section.children = section.children.filter((c) => c !== footId)
    section.children[at] = made.id
    console.log(`${slug.padEnd(10)} [data-filter] wall + .tier_foot -> Embed ${made.id} at index ${at}; ${before} -> ${Object.keys(nodes).length} nodes`)
    changed = true
  }
  const lede = Object.values(nodes).find((n) => hasClass(n, 'steps_lede') && n.props?.text === OLD_LEDE)
  if (lede) {
    lede.props.text = NEW_LEDE
    console.log(`${''.padEnd(10)} lede: "${OLD_LEDE}" -> "${NEW_LEDE}"`)
    changed = true
  }
  return changed
}

// ── the three pages ───────────────────────────────────────────────────────
const PLAN = { index: swapCarousel, results: swapWall, team: swapCarousel }
const changed = []
for (const [slug, swap] of Object.entries(PLAN)) {
  const row = rows.find((r) => r.cells?.slug === slug)
  if (!row) throw new Error(`no page with slug "${slug}"`)
  if (swap(row, slug)) {
    assertTree(row.cells.body.nodes, row.cells.body.rootNodeId, slug)
    changed.push(row)
  }
}

console.log(`\nshell ${shellChanged ? 'changes' : 'unchanged'}; pages to write: ${changed.map((r) => r.cells.slug).join(', ') || 'none'}`)
if (!apply) {
  console.log('dry run — re-run with --apply to write')
  process.exit(0)
}

// ── write ─────────────────────────────────────────────────────────────────
if (shellChanged) {
  const res = await saveShell(shell, shellSeq)
  const after = await getSite()
  const back = Object.values(after.site.styleRules ?? {}).find((r) => r.id === embedRule.id)
  if (!back) throw new Error('the .reviews_embed rule did not come back after the shell save')
  const untouched = Object.keys(rules).length === Object.keys(after.site.styleRules ?? {}).length
  console.log(`shell      saved (seq ${shellSeq} -> ${after.seq}); rule ${back.id} present; rule count ${untouched ? 'unchanged' : 'DIFFERS'} ${JSON.stringify(res).slice(0, 80)}`)
  if (!untouched) process.exitCode = 1
}

for (const row of changed) {
  const cells = row.cells
  const expect = Object.keys(cells.body.nodes).length
  await api('PATCH', `/admin/api/cms/data/rows/${row.id}`, { cells })
  // Read back: this platform reports some write failures as a 200.
  const after = await api('GET', `/admin/api/cms/data/rows/${row.id}`)
  const ac = after.row?.cells ?? after.cells ?? {}
  const back = ac.body?.nodes ?? {}
  const blocks = Object.values(back).filter((n) => n.moduleId === MODULE_ID && String(n.props?.snippet ?? '').includes(WIDGET))
  const ok = ac.slug === cells.slug && Object.keys(back).length === expect && blocks.length === 1 && blocks[0].props.snippet === snippetFor(cells.slug)
  if (!ok) {
    console.error(`FAILED ${cells.slug}: slug="${ac.slug}" nodes=${Object.keys(back).length}/${expect} blocks=${blocks.length}`)
    process.exitCode = 1
    continue
  }
  console.log(`${cells.slug.padEnd(10)} written and read back: ${Object.keys(back).length} nodes, block ${blocks[0].id}, snippet exact`)
}

if (process.exitCode) {
  console.error(`\nNOT published: a write failed. Backup: ${backupFile}`)
  process.exit(1)
}
if (alsoPublish) {
  console.log('\npublish:', JSON.stringify(await publish()))
} else {
  console.log('\nNOT published. The block only exists on the published page after a publish.')
}
