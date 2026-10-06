#!/usr/bin/env node
/**
 * Brandklout website migration: put a nested routing slug back (staging only, draft only).
 *
 * A row PATCH re-derives the ROUTING slug (`row.slug`) from the title rules and flattens
 * `story/x` to `story-x` (the SEO-cell probe did this to one draft row). Only a save through
 * PUT /site-document keeps a nested route, so the page is re-saved there unchanged: same nodes,
 * same title, same slug. That save drops `seoTitle`/`seoDescription` again (pageToCells), which is
 * why nested-slug pages get their description from the Open Graph override store instead.
 *
 *   node reassert-slug.mjs --site brandklout-website:staging            # lists rows whose routing slug != cells.slug
 *   node reassert-slug.mjs --site brandklout-website:staging --apply
 */
import { pathToFileURL } from 'node:url'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = dirname(fileURLToPath(import.meta.url))
const { connect } = await import(pathToFileURL(join(HERE, '..', '..', '..', 'target.mjs')).href)
const { api, target } = await connect()
if (!/staging\./.test(target.url)) throw new Error('refusing: not a staging host')
const { site: shell, seq } = await api.getSite()
const { rows } = await api.getPages()
const off = rows.filter((r) => r.cells?.slug && r.slug !== r.cells.slug)
console.log(`${target.url} (shell seq ${seq}): ${off.length} row(s) whose routing slug differs from cells.slug`)
for (const r of off) console.log(`  ${r.cells.slug}  routing slug "${r.slug}"  seq ${r.seq}`)
if (!off.length) process.exit(0)
if (!process.argv.includes('--apply')) { console.log('DRY RUN — re-run with --apply'); process.exit(0) }
const bodies = new Map(off.map((r) => [r.id, JSON.stringify(typeof r.cells.body === 'string' ? JSON.parse(r.cells.body) : r.cells.body)]))
const changedPages = off.map((r) => api.toChangedPage({ ...r, cells: { ...r.cells, body: typeof r.cells.body === 'string' ? JSON.parse(r.cells.body) : r.cells.body } }))
const res = await api.api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: shell, changedPages, deletedPageIds: [],
  changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(off.map((r) => [r.id, r.seq])),
  shellBaseSeq: seq,
})
console.log(`saved — ${JSON.stringify(res).slice(0, 120)}. Not published.`)
const after = (await api.getPages()).rows
let ok = true
for (const r of off) {
  const n = after.find((x) => x.id === r.id)
  const body = JSON.stringify(typeof n.cells.body === 'string' ? JSON.parse(n.cells.body) : n.cells.body)
  const good = n.slug === n.cells.slug && n.cells.slug === r.cells.slug && body === bodies.get(r.id) && n.cells.title === r.cells.title && n.status === r.status
  console.log(`  ${good ? 'ok' : '!! FAILED'}  ${n.cells.slug}  routing slug "${n.slug}"  seq ${r.seq} -> ${n.seq}  body identical: ${body === bodies.get(r.id)}  seo cells now: ${!!n.cells.seoDescription}`)
  if (!good) ok = false
}
process.exit(ok ? 0 : 1)
