#!/usr/bin/env node
// PROMOTED 2026-09-23 to tools/instatic-site/ops/restore-page-seo-cells.mjs. Origin: bk-dr-nahlah,
// deliver/brandklout/dr-nahlah/workflows/22-instatic-api-sync/restore-page-seo-cells.mjs. Admin client via ../lib/site.mjs
// (refuses without INSTATIC_BASE_URL); relative paths resolve against the directory you run from.
/**
 * restore-page-seo-cells.mjs — put back the `seoTitle` / `seoDescription` that
 * a page write dropped.
 *
 *   node restore-page-seo-cells.mjs --from output/backups/pre-pin9-pages.json
 *   node restore-page-seo-cells.mjs --from output/backups/pre-pin9-pages.json --only posts --apply
 *
 * ## Why a page write drops them at all
 *
 * `PUT /site-document` runs every `changedPages` entry through `pageToCells()`
 * (`core/data/pageFromRow.ts`), which builds `{ title, slug, body }` plus the
 * template keys and NOTHING ELSE. The row's cells are REPLACED with that, so
 * `seoTitle` and `seoDescription` are gone the moment any script writes a page
 * tree — whether or not it touched them. There is no flag to prevent it; the
 * only fix is to re-apply them afterwards through `PATCH /data/rows/:id`.
 *
 * `push-page-seo-cells.mjs` is where they come FROM (`seo.json`). This is the
 * repair for when a page tree write has already eaten them and the authored
 * values only survive in a `output/backup.mjs` snapshot.
 *
 * ## The trap inside the repair
 *
 * `PATCH` does not merge either. `handleRowItemPatch` does
 * `const rawCells = body.cells ?? currentRow.cells` and persists that whole
 * object, and `slugForTable` re-derives the routable slug from the cells it was
 * handed. Sending `{cells: {seoTitle}}` would drop `title`, `slug` and the
 * entire page tree, and the page would also lose its URL. So the CURRENT cells
 * are always read fresh and spread underneath, and the body is compared
 * byte-for-byte before and after.
 *
 * Only ever ADDS a missing value: a page whose cell is already set is reported
 * and skipped, so this can never overwrite an edit made since the snapshot.
 * NOTHING HERE PUBLISHES.
 */
import { readFileSync } from 'node:fs'
import { isAbsolute, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, getPages } from '../lib/site.mjs'

const HERE = process.cwd()
const arg = (flag) => {
  const i = process.argv.indexOf(flag)
  return i > 0 ? process.argv[i + 1] : null
}
const APPLY = process.argv.includes('--apply')
const ONLY = arg('--only')
const FROM = arg('--from')
if (!FROM) { console.error('  ! --from <pages.json snapshot> is required'); process.exit(2) }

const snapshot = JSON.parse(readFileSync(isAbsolute(FROM) ? FROM : join(HERE, FROM), 'utf8'))
const snapRows = Array.isArray(snapshot) ? snapshot : (snapshot.rows ?? snapshot.pages ?? [])
if (!snapRows.length) { console.error('  ! the snapshot holds no page rows'); process.exit(1) }

const want = new Map()
for (const r of snapRows) {
  const c = r.cells ?? {}
  if (c.seoTitle || c.seoDescription) want.set(c.slug ?? r.slug, { seoTitle: c.seoTitle, seoDescription: c.seoDescription })
}
console.log(`snapshot carries seo cells for ${want.size} page(s)`)

const { rows } = await getPages()
const plan = []
for (const row of rows) {
  if (ONLY && row.slug !== ONLY) continue
  const target = want.get(row.slug)
  if (!target) continue
  const missing = {}
  /* Only ever fills a HOLE. An edit made since the snapshot wins. */
  if (target.seoTitle && !row.cells.seoTitle) missing.seoTitle = target.seoTitle
  if (target.seoDescription && !row.cells.seoDescription) missing.seoDescription = target.seoDescription
  if (Object.keys(missing).length) plan.push({ row, missing })
  else console.log(`  = ${row.slug}`)
}
if (!plan.length) { console.log('\nnothing to restore'); process.exit(0) }
for (const { row, missing } of plan) console.log(`  ~ ${row.slug}: ${Object.keys(missing).join(', ')}`)
if (!APPLY) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

let ok = true
for (const { row, missing } of plan) {
  /* Re-read immediately before the write: cells are replaced wholesale, so the
     spread underneath has to be the CURRENT ones, not the listing's. */
  const before = (await api('GET', `/admin/api/cms/data/rows/${row.id}`)).row
  const bodyBefore = JSON.stringify(before.cells.body)
  await api('PATCH', `/admin/api/cms/data/rows/${row.id}`, { cells: { ...before.cells, ...missing } })
  const after = (await api('GET', `/admin/api/cms/data/rows/${row.id}`)).row
  const good = after.cells.title === before.cells.title
    && after.cells.slug === before.cells.slug
    && after.cells.templateEnabled === before.cells.templateEnabled
    && JSON.stringify(after.cells.body) === bodyBefore
    && Object.entries(missing).every(([k, v]) => after.cells[k] === v)
  console.log(`  ${good ? 'ok' : '  ! FAILED'}  ${row.slug}`)
  if (!good) ok = false
}
console.log(`\nrestored ${plan.length} page(s) | verified ${ok}`)
process.exit(ok ? 0 : 1)
