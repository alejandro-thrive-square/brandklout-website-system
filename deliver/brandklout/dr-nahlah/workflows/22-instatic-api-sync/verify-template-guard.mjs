#!/usr/bin/env node
/**
 * Prove the template guard holds — WITHOUT writing anything.
 *
 * The failure it protects against: a `changedPages` entry that omits
 * `template` un-templates the page, because `pageToCells()` only emits the
 * template trio when the payload carries one. That 404'd 43 articles on
 * 2026-08-25.
 *
 * This drives the real `backfillTemplates` path against the live draft by
 * monkey-patching `fetch`, so the PUT is intercepted and inspected instead of
 * sent. Nothing is saved.
 */
import { getPages, api } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const rows = (await getPages()).rows
const post = rows.find((r) => r.slug === 'post')
if (!post) { console.error('no `post` page'); process.exit(2) }

let captured = null
const realFetch = globalThis.fetch
globalThis.fetch = async (url, init) => {
  if (init?.method === 'PUT' && String(url).includes('/site-document')) {
    captured = JSON.parse(init.body)
    return new Response(JSON.stringify({ ok: true, seq: -1 }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  return realFetch(url, init)
}

// A deliberately BAD payload: the exact shape every script used before the fix.
await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  changedPages: [{
    id: post.id, slug: post.cells.slug, title: post.cells.title,
    nodes: post.cells.body.nodes, rootNodeId: post.cells.body.rootNodeId,
  }],
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [], baseSeqs: {}, shellBaseSeq: 0,
})
globalThis.fetch = realFetch

const entry = captured?.changedPages?.[0]
const checks = [
  ['PUT was intercepted', Boolean(entry)],
  ['template was backfilled', entry?.template?.enabled === true],
  ['target preserved', entry?.template?.target?.kind === 'postTypes'],
  ['tableSlugs preserved', JSON.stringify(entry?.template?.target?.tableSlugs) === '["posts"]'],
  ['priority preserved', entry?.template?.priority === 100],
  ['body untouched', entry?.rootNodeId === post.cells.body.rootNodeId],
]
let bad = 0
for (const [name, ok] of checks) { console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}`); if (!ok) bad++ }
console.log(`\n${checks.length - bad}/${checks.length} passed — nothing was written`)
process.exit(bad ? 1 : 0)
