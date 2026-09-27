#!/usr/bin/env node
/**
 * push-office-numbers.mjs — retarget each office's NEW PATIENTS line on the
 * LIVE site, to match what retarget-office-numbers.mjs did to the source.
 *
 *   node push-office-numbers.mjs            # report the plan, write nothing
 *   node push-office-numbers.mjs --apply    # write the drafts (does NOT publish)
 *
 * Client instruction, 2026-09-22:
 *
 *   Tysons Corner / McLean   new patients  (571) 702-9900 -> (703) 448-3312
 *   Alexandria               new patients  (571) 253-7790 -> (571) 617-7245
 *
 * Current-patient lines are untouched, so Tysons now shows the same number on
 * both of its lines. That is the client's call, made with the duplication in
 * front of them.
 *
 * ## Why this is a node rewrite and not a re-import
 *
 * The numbers are `base.link` nodes carrying `props.href` and `props.text`,
 * spread across all 57 pages plus the one shared component (`cta-offices`).
 * Re-importing 57 pages to change a phone number would risk every import
 * artefact this project has already been bitten by — baked hidden state,
 * dropped attributes, flattened slugs. Rewriting two string properties in
 * place touches nothing else.
 *
 * Every string anywhere in a node's props is substituted, not just `href` and
 * `text`, because the same number also appears in aria-labels and in the
 * occasional `htmlAttributes`. Structure, classes and ids are never touched.
 *
 * ## Why this writes through site-document and does not patch rows
 *
 * 18 of these pages have a NESTED slug (`ads-landing-pages/<name>`), and only a
 * `PUT /site-document` keeps the route nested — a `PATCH /data/rows/:id`
 * re-derives it and flattens it to `/ads-landing-pages-<name>`. So the numbers
 * go in through site-document, which drops `seoTitle`/`seoDescription`. That
 * costs nothing here: those two cells are **inert at publish time** (see the
 * header of push-page-seo-cells.mjs) and only the home page has them at all.
 * Put that one back afterwards with `--only index`, which has no slash in its
 * slug and so cannot be flattened. Published `<title>` is unaffected either
 * way; that comes from push-page-seo.mjs.
 *
 * ## After this
 *
 * **Call tracking goes dark until GoHighLevel is repointed.** The DNI pool
 * forwards from `(571) 253-7790`, which no longer exists on any page, so
 * `number_pool.js` will find nothing to swap. Repoint the pool's forwarding
 * numbers in LeadConnector — not reachable from this repository.
 *
 * NOTHING HERE PUBLISHES.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, getSite, getPages, toChangedPage } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')

/* Longest literal first, so a shorter one cannot eat half of a longer one. */
const MAP = [
  ['+1-571-702-9900', '+1-703-448-3312'],
  ['+1-571-619-9442', '+1-703-448-3312'],
  ['+1-571-253-7790', '+1-571-617-7245'],
  ['+1-571-410-3430', '+1-571-617-7245'],
  ['+15717029900', '+17034483312'],
  ['+15716199442', '+17034483312'],
  ['+15712537790', '+15716177245'],
  ['+15714103430', '+15716177245'],
  ['(571) 702-9900', '(703) 448-3312'],
  ['(571) 619-9442', '(703) 448-3312'],
  ['(571) 253-7790', '(571) 617-7245'],
  ['(571) 410-3430', '(571) 617-7245'],
  ['571-702-9900', '703-448-3312'],
  ['571-619-9442', '703-448-3312'],
  ['571-253-7790', '571-617-7245'],
  ['571-410-3430', '571-617-7245'],
].sort((a, b) => b[0].length - a[0].length)

const DEAD = ['5717029900', '5712537790', '5716199442', '5714103430',
  '571-702-9900', '571-253-7790', '571-619-9442', '571-410-3430',
  '571) 702-9900', '571) 253-7790', '571) 619-9442', '571) 410-3430']

let hits = 0
/** Substitute in every string reachable from a value. Returns a new value. */
function sub(v) {
  if (typeof v === 'string') {
    let out = v
    for (const [from, to] of MAP) {
      if (!out.includes(from)) continue
      hits += out.split(from).length - 1
      out = out.split(from).join(to)
    }
    return out
  }
  if (Array.isArray(v)) return v.map(sub)
  if (v && typeof v === 'object') {
    const o = {}
    for (const [k, x] of Object.entries(v)) o[k] = sub(x)
    return o
  }
  return v
}

const { site, seq: shellBaseSeq } = await getSite()
const { rows } = await getPages()
const comps = (await api('GET', '/admin/api/cms/components')).rows ?? []

// ── pages ──────────────────────────────────────────────────────────────────
const changedPages = []
const baseSeqs = {}
const report = []
for (const row of rows) {
  const body = row.cells.body
  if (!body?.nodes) continue
  const before = hits
  const nodes = {}
  let n = 0
  for (const [id, node] of Object.entries(body.nodes)) {
    const next = { ...node, props: sub(node.props ?? {}) }
    if (JSON.stringify(next.props) !== JSON.stringify(node.props ?? {})) n++
    nodes[id] = next
  }
  if (hits === before) continue
  report.push(`  ${(row.cells.slug || '(home)').padEnd(48)} ${String(n).padStart(3)} nodes, ${hits - before} strings`)
  changedPages.push(toChangedPage(row, { nodes, rootNodeId: body.rootNodeId }))
  baseSeqs[row.id] = row.seq
}

// ── the shared component ───────────────────────────────────────────────────
const changedComponents = []
const componentSeqs = {}
for (const c of comps) {
  const cells = c.cells ?? {}
  const body = cells.body
  if (!body?.nodes) continue
  const before = hits
  const nodes = {}
  for (const [id, node] of Object.entries(body.nodes)) {
    nodes[id] = { ...node, props: sub(node.props ?? {}) }
  }
  if (hits === before) continue
  report.push(`  component ${(cells.name || c.id).padEnd(38)} ${hits - before} strings`)
  /* Flat, like toChangedPage does for a page: the endpoint runs the entry
     through its own cells builder, so handing it the raw row is a 400. */
  changedComponents.push({
    id: c.id,
    name: cells.name,
    slug: cells.slug,
    nodes,
    rootNodeId: body.rootNodeId,
    params: cells.params ?? [],
    classIds: cells.classIds ?? [],
  })
  componentSeqs[c.id] = c.seq
}

console.log(`${hits} strings to rewrite across ${changedPages.length} pages and ${changedComponents.length} components\n`)
console.log(report.join('\n'))
if (!hits) { console.log('\nnothing to do'); process.exit(0) }
if (!APPLY) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

mkdirSync(join(HERE, '.tmp', 'backups'), { recursive: true })
const backup = join(HERE, '.tmp', 'backups', 'pre-office-numbers.json')
writeFileSync(backup, JSON.stringify({ rows, comps }, null, 1))
console.log(`\nbacked up ${rows.length} rows and ${comps.length} components to ${backup}`)

/* Two calls, on purpose. The component entry's shape is the less certain of
   the two, and a 400 on it must not also lose the 57 pages. */
const envelope = (over) => ({
  mode: 'incremental',
  site,
  changedPages: [],
  deletedPageIds: [],
  changedComponents: [],
  deletedComponentIds: [],
  changedLayouts: [],
  deletedLayoutIds: [],
  baseSeqs: {},
  shellBaseSeq,
  ...over,
})

const res = await api('PUT', '/admin/api/cms/site-document', envelope({ changedPages, baseSeqs }))
console.log('pages saved:', JSON.stringify(res).slice(0, 160))

if (changedComponents.length) {
  try {
    const r2 = await api('PUT', '/admin/api/cms/site-document',
      envelope({ changedComponents, baseSeqs: componentSeqs }))
    console.log('components saved:', JSON.stringify(r2).slice(0, 160))
  } catch (e) {
    console.error('COMPONENT WRITE FAILED (the pages are already written): ' + e.message)
    console.error('the read-back below will name whatever it left behind')
  }
}

// ── read back ──────────────────────────────────────────────────────────────
const after = (await getPages()).rows
const afterComps = (await api('GET', '/admin/api/cms/components')).rows ?? []
const stillDead = []
for (const r of after) {
  const s = JSON.stringify(r.cells.body ?? {})
  for (const d of DEAD) if (s.includes(d)) stillDead.push(`${r.cells.slug || '(home)'}: ${d}`)
}
for (const c of afterComps) {
  const s = JSON.stringify(c.cells?.body ?? {})
  for (const d of DEAD) if (s.includes(d)) stillDead.push(`component ${c.cells?.name}: ${d}`)
}
const live = (s) => after.filter((r) => JSON.stringify(r.cells.body ?? {}).includes(s)).length
console.log(`\npages carrying (703) 448-3312 : ${live('(703) 448-3312')}/${after.length}`)
console.log(`pages carrying (571) 617-7245 : ${live('(571) 617-7245')}/${after.length}`)
console.log(`pages carrying (703) 940-5410 : ${live('(703) 940-5410')}/${after.length}  (Alexandria current patients, unchanged)`)
if (stillDead.length) {
  console.error(`\nRETIRED NUMBERS STILL ON THE DRAFT (${stillDead.length}):\n  ` + stillDead.slice(0, 20).join('\n  '))
  console.error(`restore from ${backup}`)
  process.exit(1)
}
console.log('\nno retired number survives on the draft.')
console.log('Not published. One cosmetic cell to put back on the home page:')
console.log('  node push-page-seo-cells.mjs --only index --apply')
