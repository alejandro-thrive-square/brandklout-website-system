#!/usr/bin/env node
/**
 * template-guard.mjs — prove, WITHOUT writing anything, that the shared client's page write keeps each
 * templated page's `template` (collection entry templates, the notFound page).
 *
 * Origin: bk-dr-nahlah, workflows/22-instatic-api-sync/verify-template-guard.mjs (after 43 articles
 * 404'd on 2026-08-25). Generalized 2026-09-23: checks every templated row, not one hardcoded `post`.
 *
 * The failure: a `changedPages` entry that omits `template` un-templates the page, because
 * `pageToCells()` only emits the template trio when the payload carries one. This sends a
 * deliberately BAD payload (no template) through the real client with `fetch` monkey-patched, so the
 * PUT is captured and inspected instead of sent, and asserts the client backfilled each template.
 * Also lists every templated row with its target, which is the quick way to see that an import
 * wiped them (then run ../ops/apply-template-flags.mjs).
 *
 * Usage: node template-guard.mjs     Env: INSTATIC_BASE_URL (+ login). Nothing is saved.
 */
import { getPages, api } from '../lib/site.mjs'

const rows = (await getPages()).rows
const templated = rows.filter((r) => r.cells?.templateEnabled === true)
console.log(`${rows.length} page rows, ${templated.length} templated:`)
for (const r of templated) console.log(`  ${r.cells.slug}  -> ${JSON.stringify(r.cells.templateTarget)} priority=${r.cells.templatePriority}`)
if (!templated.length) {
  console.log('\nNO templated pages. If the site has a blog/collection or a custom 404, an import wiped the flags.')
  process.exit(1)
}

let captured = null
const realFetch = globalThis.fetch
globalThis.fetch = async (url, init) => {
  if (init?.method === 'PUT' && String(url).includes('/site-document')) {
    captured = JSON.parse(init.body)
    return new Response(JSON.stringify({ ok: true, seq: -1 }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  return realFetch(url, init)
}
await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  changedPages: templated.map((r) => ({
    id: r.id, slug: r.cells.slug, title: r.cells.title,
    nodes: r.cells.body.nodes, rootNodeId: r.cells.body.rootNodeId,
  })),
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [], baseSeqs: {}, shellBaseSeq: 0,
})
globalThis.fetch = realFetch

let bad = 0
for (const r of templated) {
  const e = captured?.changedPages?.find((p) => p.id === r.id)
  const ok = e?.template?.enabled === true &&
    JSON.stringify(e.template.target) === JSON.stringify(r.cells.templateTarget) &&
    (e.template.priority ?? 0) === (r.cells.templatePriority ?? 0) &&
    e.rootNodeId === r.cells.body.rootNodeId
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${r.cells.slug}  template ${ok ? 'backfilled' : 'would be DROPPED by a page write'}`)
  if (!ok) bad++
}
console.log(`\n${templated.length - bad}/${templated.length} passed — nothing was written`)
process.exit(bad ? 1 : 0)
