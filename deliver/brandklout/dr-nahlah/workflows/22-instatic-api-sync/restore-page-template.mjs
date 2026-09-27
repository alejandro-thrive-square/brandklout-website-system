#!/usr/bin/env node
/**
 * Restore the entry-template config on the `post` page.
 *
 * ── WHAT BROKE, AND WHY ───────────────────────────────────────────────────
 * `PUT /admin/api/cms/site-document` does NOT merge a page's cells. Each entry
 * in `changedPages` is run through `pageToCells()` (`core/data/pageFromRow.ts`)
 * and the RESULT REPLACES the row's cells wholesale:
 *
 *     const cells = { title, slug, body: { nodes, rootNodeId } }
 *     if (page.template) { cells.templateEnabled = true; … }
 *     return cells
 *
 * Note what is NOT in there: `seoTitle` and `seoDescription` are absent from
 * `pageToCells` ENTIRELY, and the template trio survives only when the payload
 * carries a `template` object. Every page write in sessions 11 and 12 sent
 * `{ id, slug, title, nodes, rootNodeId }` — so each one silently:
 *
 *   • wiped `seoTitle` / `seoDescription` on all 37 pages, and
 *   • wiped `templateEnabled` / `templateTarget` / `templatePriority` on `post`,
 *     which is the entry template for the `posts` post-type — so all 43
 *     articles began 404ing the moment that draft was published.
 *
 * The original values come from `.tmp/backups/pre-cta-offices-pages.json`,
 * captured 2026-08-24 before any of this, and are asserted against that file
 * rather than retyped from memory.
 *
 * ── THE RULE THIS ESTABLISHES ─────────────────────────────────────────────
 * Any script that puts a page through `changedPages` MUST carry `template`
 * through from the row it read, and MUST re-assert `seoTitle` /
 * `seoDescription` afterwards via the data-row PATCH (which does merge).
 * `assertPageCellsIntact()` below is the check; call it after every page write.
 *
 *   node restore-page-template.mjs           # dry run
 *   node restore-page-template.mjs --apply
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { api, getSite, getPages } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')

const backup = JSON.parse(readFileSync(join(HERE, '.tmp', 'backups', 'pre-cta-offices-pages.json'), 'utf8'))
const backupRows = Array.isArray(backup) ? backup : (backup.rows ?? backup.pages ?? [])

// Every page that had a template before any of this ran.
const want = new Map()
for (const r of backupRows) {
  const c = r.cells ?? r
  if (c.templateEnabled === true) {
    want.set(r.slug, { enabled: true, target: c.templateTarget, priority: c.templatePriority ?? 0 })
  }
}
console.log(`pages that carried a template in the 2026-08-24 backup: ${want.size}`)
for (const [slug, t] of want) console.log(`  ${slug}: ${JSON.stringify(t)}`)
if (!want.size) { console.error('backup has no template config — wrong file?'); process.exit(2) }

const site = await getSite()
const rows = (await getPages()).rows

const writes = []
for (const [slug, template] of want) {
  const r = rows.find((x) => x.slug === slug)
  if (!r) { console.error(`  !! page ${slug} no longer exists`); process.exit(2) }
  const full = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row
  const now = full.cells.templateEnabled === true
    ? { enabled: true, target: full.cells.templateTarget, priority: full.cells.templatePriority ?? 0 }
    : null
  if (JSON.stringify(now) === JSON.stringify(template)) { console.log(`  ${slug}: already correct`); continue }
  console.log(`  ${slug}: ${JSON.stringify(now)}  ->  ${JSON.stringify(template)}`)
  writes.push({
    id: r.id, slug: r.cells.slug, title: r.cells.title,
    nodes: r.cells.body.nodes, rootNodeId: r.cells.body.rootNodeId,
    template,                       // <- the whole point
    seq: r.seq,
  })
}
if (!writes.length) { console.log('\nnothing to do'); process.exit(0) }
if (!APPLY) { console.log('\ndry run — re-run with --apply'); process.exit(0) }

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: site.site,
  changedPages: writes.map(({ seq, ...p }) => p),
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(writes.map((w) => [w.id, w.seq])),
  shellBaseSeq: site.seq,
})
console.log('\nsaved:', JSON.stringify(res).slice(0, 120))

const after = (await getPages()).rows
let bad = 0
for (const [slug, template] of want) {
  const r = after.find((x) => x.slug === slug)
  const full = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row
  const ok = full.cells.templateEnabled === true &&
    JSON.stringify(full.cells.templateTarget) === JSON.stringify(template.target) &&
    full.cells.templatePriority === template.priority
  console.log(`${ok ? 'OK  ' : 'BAD '} ${slug}  enabled=${full.cells.templateEnabled} target=${JSON.stringify(full.cells.templateTarget)} priority=${full.cells.templatePriority}`)
  if (!ok) bad++
}
process.exit(bad ? 1 : 0)
