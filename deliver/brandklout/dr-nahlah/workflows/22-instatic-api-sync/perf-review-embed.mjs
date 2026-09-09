#!/usr/bin/env node
/**
 * Stop the third-party embeds blocking the parser.
 *
 * The nodes already carry `lazy: true` and a `height` — and those props do
 * NOTHING here. With `source: 'snippet'` the embed-origins module returns the
 * pasted markup verbatim (`{ html: wrapper(fit, ratio, styles, note + snippet) }`),
 * so the vendor's own tags are what ship. Three snippets on this site, and every
 * one of them loads its vendor script with neither `defer` nor `async`:
 *
 *   index            reputationhub  review-widget.js  + the reviews iframe
 *   contact-maclean  msgsndr        form_embed.js     + the LeadConnector form
 *   contact-alexandria  ditto
 *
 * A bare third-party `<script src>` mid-body halts the parser on a network
 * round trip to someone else's origin. `defer` is strictly safer as well as
 * faster: deferred scripts run once the DOM is complete, so the element the
 * vendor script goes looking for is guaranteed to exist, which is NOT true of
 * the blocking version it replaces.
 *
 * `loading="lazy"` is applied to the home page only — see LAZY_SLUGS.
 *
 * Idempotent: re-running reports nothing to do.
 *
 *   node perf-review-embed.mjs           # dry run
 *   node perf-review-embed.mjs --apply
 */
import { api, getSite, getPages } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')

/**
 * Lazy-load only the embeds listed here. The two contact pages embed the
 * LeadConnector FORM — the entire reason those pages exist, sitting at the top
 * of them. Deferring the thing the visitor came for to save a few milliseconds
 * is the wrong trade; those get the script fix and nothing else. The reviews
 * widget on the home page is far below the fold and is exactly what lazy
 * loading is for.
 */
const LAZY_SLUGS = new Set(['index'])

const site = await getSite()
const rows = (await getPages()).rows

const targets = []
for (const r of rows) {
  for (const n of Object.values(r.cells.body.nodes)) {
    if (n.moduleId !== 'webzite.embed-origins.embed') continue
    if (typeof n.props?.snippet !== 'string' || !n.props.snippet.trim()) continue
    targets.push({ row: r, node: n })
  }
}
console.log(`snippet embeds found: ${targets.length}`)

const NEEDS_DEFER = /<script\b(?![^>]*\b(?:defer|async)\b)[^>]*>/i

function fix(snippet, { height, lazy }) {
  let out = snippet.replace(/<script\b(?![^>]*\b(?:defer|async)\b)([^>]*?)\s*>/gi, '<script$1 defer>')
  if (lazy) {
    out = out.replace(/<iframe\b(?![^>]*\bloading=)([^>]*?)\s*>/gi, '<iframe$1 loading="lazy">')
    // Reserve space only where the markup does not already size the frame — an
    // inline `height:` in the style attribute beats an HTML height attribute,
    // so adding one there would be noise rather than a fix.
    out = out.replace(
      /<iframe\b(?![^>]*\bheight=)(?![^>]*style="[^"]*height:)([^>]*?)\s*>/gi,
      `<iframe$1 height="${height}">`,
    )
  }
  return out
}

const writes = []
for (const { row, node } of targets) {
  const before = node.props.snippet
  const lazy = LAZY_SLUGS.has(row.slug)
  const after = fix(before, { height: node.props.height ?? 600, lazy })
  console.log(`\n${row.slug} / ${node.id}   lazy=${lazy}`)
  if (after === before) { console.log('  already correct'); continue }
  const shown = (s) => s.replace(/\s+/g, ' ').slice(0, 230)
  console.log(`  before: ${shown(before)}`)
  console.log(`  after : ${shown(after)}`)
  writes.push({ row, node, after, lazy })
}
if (!writes.length) { console.log('\nnothing to do'); process.exit(0) }
if (!APPLY) { console.log('\ndry run — re-run with --apply'); process.exit(0) }

const byRow = new Map()
for (const w of writes) {
  if (!byRow.has(w.row.id)) byRow.set(w.row.id, { row: w.row, nodes: structuredClone(w.row.cells.body.nodes) })
  byRow.get(w.row.id).nodes[w.node.id].props.snippet = w.after
}
const changedPages = [...byRow.values()].map(({ row, nodes }) => ({
  id: row.id, slug: row.cells.slug, title: row.cells.title, nodes, rootNodeId: row.cells.body.rootNodeId,
}))
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: site.site, changedPages,
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries([...byRow.values()].map(({ row }) => [row.id, row.seq])),
  shellBaseSeq: site.seq,
})
console.log('\nsaved:', JSON.stringify(res).slice(0, 120))

const after = (await getPages()).rows
for (const w of writes) {
  const r = after.find((x) => x.id === w.row.id)
  const got = r.cells.body.nodes[w.node.id].props.snippet
  const deferred = !NEEDS_DEFER.test(got)
  const lazyOk = !w.lazy || /<iframe[^>]*loading="lazy"/i.test(got)
  const ok = got === w.after && deferred && lazyOk
  console.log(`${ok ? 'OK  ' : 'BAD '} ${r.slug}   every script deferred=${deferred}  lazy=${lazyOk}`)
  if (!ok) process.exitCode = 1
}
