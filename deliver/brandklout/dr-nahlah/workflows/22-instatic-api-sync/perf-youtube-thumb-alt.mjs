#!/usr/bin/env node
/**
 * Give the YouTube thumbnails on /video-library real alt text.
 *
 * These 13 images are the only ones on the site with no library row — their
 * `src` points at `img.youtube.com`, so `base.image` can never resolve alt from
 * the media library, and their `htmlAttributes.alt` was the EMPTY STRING.
 *
 * That is a trap worth naming: `htmlAttributes.alt` being present is not the
 * same as it carrying text. An earlier pass here checked `alt != null`, saw a
 * value, and reported these as covered — they were not. The perf-budget gate
 * caught it by reading the rendered attribute instead of the prop.
 *
 * The alt is taken from the card's own heading, which is the text node
 * immediately following the thumbnail in document order — i.e. the title of the
 * video the thumbnail links to, which is exactly what a person needs to hear.
 *
 *   node perf-youtube-thumb-alt.mjs           # dry run
 *   node perf-youtube-thumb-alt.mjs --apply
 */
import { api, getSite, getPages } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')
const site = await getSite()
const rows = (await getPages()).rows

const docOrder = (nodes, root) => {
  const out = []
  ;(function walk(id) { const n = nodes[id]; if (!n) return; out.push(n); for (const c of n.children ?? []) walk(c) })(root)
  return out
}
const textOf = (n) => {
  const t = n.props?.text ?? n.props?.content
  return typeof t === 'string' ? t.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : ''
}

const writes = []
for (const r of rows) {
  const nodes = structuredClone(r.cells.body.nodes)
  const order = docOrder(nodes, r.cells.body.rootNodeId)
  let touched = 0
  for (let i = 0; i < order.length; i++) {
    const n = order[i]
    if (n.moduleId !== 'base.image') continue
    if (!/img\.youtube\.com/i.test(n.props?.src ?? '')) continue
    if ((n.props?.htmlAttributes?.alt ?? '').trim()) continue
    // the card heading is the next non-empty text node after the thumbnail
    let title = ''
    for (let j = i + 1; j < Math.min(i + 10, order.length); j++) {
      const t = textOf(order[j])
      if (t.length > 3) { title = t; break }
    }
    if (!title) { console.log(`  !! ${r.slug} / ${n.id}: no heading found — left alone`); continue }
    const alt = `${title} — video thumbnail`
    n.props.htmlAttributes = { ...(n.props.htmlAttributes ?? {}), alt }
    console.log(`  ${r.slug.padEnd(16)} ${n.props.src.split('/').slice(-2)[0].padEnd(14)} ${JSON.stringify(alt)}`)
    touched++
  }
  if (touched) writes.push({ id: r.id, slug: r.cells.slug, title: r.cells.title, nodes, rootNodeId: r.cells.body.rootNodeId, seq: r.seq })
}

console.log(`\npages to write: ${writes.length}`)
if (!writes.length) { console.log('nothing to do'); process.exit(0) }
if (!APPLY) { console.log('dry run — re-run with --apply'); process.exit(0) }

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: site.site,
  changedPages: writes.map(({ seq, ...p }) => p),
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(writes.map((w) => [w.id, w.seq])),
  shellBaseSeq: site.seq,
})
console.log('saved:', JSON.stringify(res).slice(0, 120))

const after = (await getPages()).rows
let empty = 0, total = 0
for (const r of after) {
  for (const n of Object.values(r.cells.body.nodes)) {
    if (n.moduleId !== 'base.image' || !/img\.youtube\.com/i.test(n.props?.src ?? '')) continue
    total++
    if (!(n.props?.htmlAttributes?.alt ?? '').trim()) empty++
  }
}
console.log(`youtube thumbnails: ${total}, still without alt: ${empty}`)
process.exit(empty ? 1 : 0)
