#!/usr/bin/env node
/**
 * Fill the Pages table's `seoTitle` / `seoDescription` cells from `seo.json`.
 *
 * ── READ THIS BEFORE ASSUMING THESE FIELDS DO ANYTHING ────────────────────
 * On 0.0.16 these two fields are **inert at publish time.** They are `builtIn`
 * fields on the system `pages` table, they render in the Data grid and in the
 * Content authoring panel, and `dataRows.ts` exposes `seoTitle` as a bindable
 * loop value — but NOTHING in `server/publish/` or `src/core/publisher/`
 * reads them:
 *
 *   - `<title>` is emitted in exactly ONE place, `core/publisher/render.ts:461`,
 *     from `buildDocumentMetaTags`, which reads
 *     `settings.metaTitle ?? page.title ?? site.name`.
 *   - `readSeoTitleCell` / `readSeoDescriptionCell` have exactly two callers,
 *     both under `src/admin/pages/content/` (the authoring UI).
 *   - For templated data-row entries, `publicRenderer.ts:182` sets the document
 *     title from `row.cells.title` — again, not `seoTitle`.
 *
 * They are filled anyway because they are where a person looks for a page's
 * SEO, an empty column reads as broken, and they cost nothing to keep correct
 * if a later release or an SEO plugin wires them up. **The thing that actually
 * changes published `<title>` is `push-page-seo.mjs`.**
 *
 * ── THE TRAP IN THIS ENDPOINT ─────────────────────────────────────────────
 * `handleRowItemPatch` does `const rawCells = body.cells ?? currentRow.cells`
 * and persists that WHOLE object. `cells` is REPLACED, never merged. Sending
 * `{ cells: { seoTitle } }` would drop `title`, `slug` and the entire `body`
 * page tree — and `slugForTable` re-derives the routable slug from the cells it
 * was handed, so the page would also lose its URL. Always send the current
 * cells spread underneath, and verify the tree survived.
 *
 *   node push-page-seo-cells.mjs                 # dry run
 *   node push-page-seo-cells.mjs --only <slug>   # one page, for a first pass
 *   node push-page-seo-cells.mjs --apply
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { api, getPages } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const ONLY = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null

const seo = JSON.parse(readFileSync(join(HERE, '..', '04-design', '.tmp', 'site-src', 'seo.json'), 'utf8'))

const list = (await getPages()).rows.filter((r) => !ONLY || r.slug === ONLY)
if (!list.length) { console.error(`no page matches --only ${ONLY}`); process.exit(2) }

const plan = []
for (const r of list) {
  const e = seo[r.slug]
  if (!e) { console.log(`!! ${r.slug}: no seo.json entry — skipped`); continue }
  if (!e.title || !e.desc) { console.log(`!! ${r.slug}: seo.json entry missing title or desc — skipped`); continue }
  // seo.json is the source the local build ESCAPES on output, so it must hold
  // plain text. A stored entity here would publish doubled if these fields are
  // ever wired to the head.
  if (/&(amp|lt|gt|quot|#\d+);/i.test(e.title + e.desc)) {
    console.error(`${r.slug}: seo.json carries HTML entities — fix the source`); process.exit(1)
  }
  plan.push({ id: r.id, slug: r.slug, seoTitle: e.title, seoDescription: e.desc,
              already: r.cells.seoTitle === e.title && r.cells.seoDescription === e.desc })
}

const todo = plan.filter((p) => !p.already)
console.log(`pages: ${plan.length}   to write: ${todo.length}   already correct: ${plan.length - todo.length}`)
for (const p of todo) {
  console.log(`  ${p.slug}`)
  console.log(`      seoTitle       ${JSON.stringify(p.seoTitle)}`)
  console.log(`      seoDescription ${JSON.stringify(p.seoDescription.slice(0, 90))}${p.seoDescription.length > 90 ? '…' : ''}`)
}
if (!todo.length) { console.log('nothing to do'); process.exit(0) }
if (!APPLY) { console.log('\ndry run — re-run with --apply'); process.exit(0) }

let ok = 0
const failed = []
for (const p of todo) {
  // Re-read immediately before writing: cells is replaced wholesale, so the
  // payload has to be built from the row as it stands right now.
  const before = (await api('GET', `/admin/api/cms/data/rows/${p.id}`)).row
  const bodyBefore = JSON.stringify(before.cells.body)
  try {
    await api('PATCH', `/admin/api/cms/data/rows/${p.id}`, {
      cells: { ...before.cells, seoTitle: p.seoTitle, seoDescription: p.seoDescription },
    })
  } catch (e) { failed.push({ ...p, error: e.message }); continue }

  const after = (await api('GET', `/admin/api/cms/data/rows/${p.id}`)).row
  const intact =
    after.cells.title === before.cells.title &&
    after.cells.slug === before.cells.slug &&
    after.slug === before.slug &&
    JSON.stringify(after.cells.body) === bodyBefore
  const written = after.cells.seoTitle === p.seoTitle && after.cells.seoDescription === p.seoDescription
  if (!intact) { failed.push({ ...p, error: 'TITLE/SLUG/BODY CHANGED — restore from .tmp/backups/pages-rows-full.json' }); break }
  if (!written) { failed.push({ ...p, error: 'seo cells did not read back' }); continue }
  ok++
  console.log(`  ok  ${p.slug}  (body ${bodyBefore.length}c intact)`)
}
console.log(`\nwritten: ${ok}/${todo.length}`)
for (const f of failed) console.log(`  FAILED ${f.slug}: ${f.error}`)
process.exit(failed.length ? 1 : 0)
