#!/usr/bin/env node
/**
 * Brandklout website migration: the SEO cells a site-document page write drops.
 *
 * `class-rename.mjs --apply` saves every changed page through PUT /site-document, whose
 * pageToCells() keeps title/slug/body/template and NOTHING else: `seoTitle` and `seoDescription`
 * are gone from every page it wrote (insta-api.mjs says so above toChangedPage). The Open Graph
 * plugin reads `seoDescription` for the page's own <meta name="description"> and og:description, so
 * publishing without them gives those pages the site-wide description.
 *
 *   node seo-cells.mjs check   <pages.json backup> --site brandklout-website:staging    # read-only
 *   node seo-cells.mjs probe   <pages.json backup> --slug <one slug> --site …           # PATCH ONE row, report row.slug
 *   node seo-cells.mjs restore <pages.json backup> --site … [--apply]                   # every row with a hole
 *
 * A row PATCH replaces `cells` wholesale, so the CURRENT cells are read immediately before and
 * spread underneath; afterwards the body must be byte-identical, and the row's ROUTING slug
 * (`row.slug`, the column the public router uses) and `cells.slug` unchanged: on some Instatic
 * versions a PATCH flattens `a/b` to `a-b`. Only fills a hole; never overwrites a value. Never publishes.
 */
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const [cmd, backupPath] = args
const opt = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : null)
const APPLY = args.includes('--apply')
const { connect } = await import(pathToFileURL(join(HERE, '..', '..', '..', 'target.mjs')).href)
const { api, target } = await connect()
if (!/staging\./.test(target.url)) throw new Error('refusing: not a staging host')

const snap = JSON.parse(readFileSync(backupPath, 'utf8'))
const snapRows = Array.isArray(snap) ? snap : (snap.rows ?? snap.pages ?? [])
const want = new Map()
for (const r of snapRows) {
  const c = r.cells ?? {}
  if (c.seoTitle || c.seoDescription) want.set(r.id, { slug: c.slug, rowSlug: r.slug, seoTitle: c.seoTitle, seoDescription: c.seoDescription })
}
const { rows } = await api.getPages()
const plan = []
for (const row of rows) {
  const w = want.get(row.id)
  if (!w) continue
  const missing = {}
  if (w.seoTitle && !row.cells.seoTitle) missing.seoTitle = w.seoTitle
  if (w.seoDescription && !row.cells.seoDescription) missing.seoDescription = w.seoDescription
  const differs = ['seoTitle', 'seoDescription'].filter((k) => row.cells[k] && row.cells[k] !== w[k])
  if (differs.length) console.log(`  ! ${row.cells.slug}: ${differs.join(', ')} set to a DIFFERENT value than the backup (left alone)`)
  if (row.slug !== w.rowSlug) console.log(`  ! ${row.cells.slug}: routing slug is "${row.slug}", the backup had "${w.rowSlug}"`)
  // --flat-only: a PATCH flattens a nested routing slug (story/x -> story-x, proved 2026-10-06 on this
  // instance), so nested-slug pages are left to the Open Graph override store (og-overrides.mjs).
  if (args.includes('--flat-only') && String(row.cells.slug).includes('/')) continue
  if (Object.keys(missing).length) plan.push({ row, missing })
}
console.log(`${target.url}: backup carries seo cells for ${want.size} page(s); ${plan.length} page(s) have a hole now`)
for (const { row, missing } of plan) console.log(`  ~ ${row.cells.slug}  (routing slug "${row.slug}")  ${Object.keys(missing).join(', ')}`)

async function patchOne({ row, missing }) {
  const before = (await api.api('GET', `/admin/api/cms/data/rows/${row.id}`)).row
  const bodyBefore = JSON.stringify(before.cells.body)
  await api.api('PATCH', `/admin/api/cms/data/rows/${row.id}`, { cells: { ...before.cells, ...missing } })
  const after = (await api.api('GET', `/admin/api/cms/data/rows/${row.id}`)).row
  const checks = {
    'body identical': JSON.stringify(after.cells.body) === bodyBefore,
    'cells.slug kept': after.cells.slug === before.cells.slug,
    'routing slug kept': after.slug === before.slug,
    'title kept': after.cells.title === before.cells.title,
    'template kept': after.cells.templateEnabled === before.cells.templateEnabled,
    'status kept': after.status === before.status,
    'seo written': Object.entries(missing).every(([k, v]) => after.cells[k] === v),
    'no other cell changed': JSON.stringify(Object.keys(after.cells).sort()) === JSON.stringify([...new Set([...Object.keys(before.cells), ...Object.keys(missing)])].sort()),
  }
  const bad = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k)
  console.log(`  ${bad.length ? '!! FAILED' : 'ok'}  ${before.cells.slug}  routing slug "${before.slug}" -> "${after.slug}"  seq ${before.seq} -> ${after.seq}${bad.length ? '  [' + bad.join('; ') + ']' : ''}`)
  return !bad.length
}

if (cmd === 'check') process.exit(plan.length ? 1 : 0)
if (cmd === 'probe') {
  const one = plan.find((p) => p.row.cells.slug === opt('--slug'))
  if (!one) throw new Error(`no hole on slug ${opt('--slug')}`)
  process.exit((await patchOne(one)) ? 0 : 1)
}
if (cmd === 'restore') {
  if (!APPLY) { console.log('DRY RUN — re-run with --apply'); process.exit(0) }
  let ok = true
  for (const p of plan) ok = (await patchOne(p)) && ok
  console.log(`restored ${plan.length} page(s) | verified ${ok}`)
  process.exit(ok ? 0 : 1)
}
console.error('usage: seo-cells.mjs check|probe|restore <pages.json> --site <client>:staging [--slug x] [--apply]')
process.exit(2)
