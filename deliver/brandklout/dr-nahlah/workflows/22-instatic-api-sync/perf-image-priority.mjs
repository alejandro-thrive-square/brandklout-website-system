#!/usr/bin/env node
/**
 * Two fixes to the image nodes, in one atomic save.
 *
 * ── 1. The LCP image was lazy-loaded on every page ────────────────────────
 * `base.image` resolves `loading` to `lazy` unless the node's own prop says
 * `eager`, and the migration never set it — so all 196 published images,
 * header logo and hero included, shipped `loading="lazy"` with no
 * `fetchpriority`. Lighthouse flags that by name.
 *
 * Walking each page tree in DOCUMENT order shows one consistent shape:
 * image[0] is the header logo and image[1] is the hero. That matches, file for
 * file, the images the hand-built reference package (`04-design/final-site`)
 * leaves eager by omitting `loading` — the build that held the good score.
 * So: image[0] eager, image[1] eager + fetchPriority high, everything else
 * untouched. Exactly one high-priority image per page; two would compete.
 *
 * Three pages are deliberately excluded from the image[1] rule:
 *   • `contact` and `post` — image[1] IS the footer logo (same file as
 *     image[0]), which is below the fold. Caught by comparing filenames.
 *   • `index` — the home hero is a <video>; its LCP is the poster, which is
 *     not an <img> and cannot take fetchpriority. image[1] there is a
 *     comparison slider below the fold and must stay lazy.
 *
 * KNOWN TRADE-OFF, accepted: `resolveSizes()` emits `auto, 100vw` for lazy
 * images but plain `100vw` for eager ones, and the publisher's auto-sizes
 * pre-pass yields nothing here (`_resolvedAutoSizes` is undefined). For the
 * hero, full-bleed, `100vw` selects the same variant either way — no change.
 * For the logo it means w1024 (29,128 B) instead of the w320 (14,362 B) that
 * `sizes=auto` picks in browsers that support it: about +15 KB, once, on a
 * year-immutable asset. Worth it to stop the header painting late. There is
 * no user-facing `sizes` knob to do better.
 *
 * ── 2. 194 of 196 images published TWO `alt` attributes ───────────────────
 * The migration put the design package's per-instance alt into the node's
 * `htmlAttributes`. `base.image` renders `htmlAttributes` FIRST and the
 * library's alt second:
 *
 *     return { html: `<img${htmlAttrs} ${attrs.join(' ')}>` }
 *
 * HTML keeps the first occurrence of a duplicated attribute, so the library
 * value — the single source of truth the module's own comment describes — was
 * being ignored, and the output was invalid besides.
 *
 * Stripping `alt` from `htmlAttributes` hands the role back to the library.
 * It is done ONLY where the node's src resolves to a library asset that has
 * non-empty alt text. The 13 YouTube thumbnails point at `img.youtube.com`,
 * have no library row, and their `htmlAttributes` alt is the only alt they can
 * ever have — stripping those would replace real alt text with nothing.
 *
 *   node perf-image-priority.mjs           # dry run
 *   node perf-image-priority.mjs --apply
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { api, getSite, getPages } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const TMP = join(HERE, '.tmp')
const APPLY = process.argv.includes('--apply')
const NO_HERO = new Set(['index'])

const assets = (await api('GET', '/admin/api/cms/media')).assets ?? []
const byPath = new Map(assets.map((a) => [a.publicPath, a]))
const byMediaId = new Map(assets.map((a) => [a.id, a]))
const site = await getSite()
const rows = (await getPages()).rows

const resolve = (src) => {
  if (typeof src !== 'string') return null
  if (src.startsWith('cms:media:')) return byMediaId.get(src.slice(10)) ?? null
  return byPath.get(src) ?? null
}
const docOrder = (nodes, root) => {
  const out = []
  ;(function walk(id) { const n = nodes[id]; if (!n) return; out.push(n); for (const c of n.children ?? []) walk(c) })(root)
  return out
}

mkdirSync(join(TMP, 'backups'), { recursive: true })
writeFileSync(join(TMP, 'backups', `pre-image-priority-${site.seq}.json`),
  JSON.stringify(rows.map((r) => ({ id: r.id, slug: r.slug, seq: r.seq, body: r.cells.body })), null, 2))

const writes = []
const log = []
for (const r of rows) {
  const nodes = structuredClone(r.cells.body.nodes)
  const imgs = docOrder(nodes, r.cells.body.rootNodeId).filter((n) => n.moduleId === 'base.image')
  let touched = 0

  const setProp = (n, k, v) => { if (n.props[k] !== v) { n.props[k] = v; touched++; return true } return false }

  // 1a. header logo
  if (imgs[0] && setProp(imgs[0], 'loading', 'eager')) {
    log.push(`  ${r.slug.padEnd(28)} eager        ${resolve(imgs[0].props.src)?.filename ?? imgs[0].props.src}`)
  }
  // 1b. hero
  const heroOk = imgs[1] && !NO_HERO.has(r.slug) &&
    resolve(imgs[1].props.src)?.filename !== resolve(imgs[0]?.props.src)?.filename
  if (heroOk) {
    setProp(imgs[1], 'loading', 'eager')
    setProp(imgs[1], 'fetchPriority', 'high')
    log.push(`  ${r.slug.padEnd(28)} eager+high   ${resolve(imgs[1].props.src)?.filename ?? imgs[1].props.src}`)
  }
  // 2. duplicate alt
  let stripped = 0, kept = 0
  for (const n of imgs) {
    const ha = n.props?.htmlAttributes
    if (!ha || ha.alt == null) continue
    const a = resolve(n.props.src)
    if (a?.altText?.trim()) { delete ha.alt; stripped++; touched++ }
    else kept++
  }
  if (stripped || kept) log.push(`  ${r.slug.padEnd(28)} alt          stripped ${stripped}, kept ${kept} (no library alt)`)

  if (touched) writes.push({ id: r.id, slug: r.cells.slug, title: r.cells.title, nodes, rootNodeId: r.cells.body.rootNodeId, seq: r.seq })
}

console.log(log.join('\n'))
console.log(`\npages to write: ${writes.length}`)
if (!writes.length) { console.log('nothing to do'); process.exit(0) }
if (!APPLY) { console.log('\ndry run — re-run with --apply'); process.exit(0) }

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: site.site,
  changedPages: writes.map(({ seq, ...p }) => p),
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(writes.map((w) => [w.id, w.seq])),
  shellBaseSeq: site.seq,
})
console.log('saved:', JSON.stringify(res).slice(0, 120))

// verify from a fresh read
const after = (await getPages()).rows
let eager = 0, high = 0, dupAlt = 0, noAlt = 0, totalImgs = 0
for (const r of after) {
  const imgs = docOrder(r.cells.body.nodes, r.cells.body.rootNodeId).filter((n) => n.moduleId === 'base.image')
  totalImgs += imgs.length
  for (const n of imgs) {
    if (n.props.loading === 'eager') eager++
    if (n.props.fetchPriority === 'high') high++
    const a = resolve(n.props.src)
    const hasHtmlAlt = n.props?.htmlAttributes?.alt != null
    if (hasHtmlAlt && a?.altText?.trim()) dupAlt++
    if (!hasHtmlAlt && !a?.altText?.trim()) noAlt++
  }
}
console.log(`\nimages total          : ${totalImgs}`)
console.log(`  loading=eager       : ${eager}`)
console.log(`  fetchPriority=high  : ${high}   (one per page, minus the 3 excluded)`)
console.log(`  still duplicating alt: ${dupAlt}   (must be 0)`)
console.log(`  no alt from any source: ${noAlt}   (must be 0)`)
process.exit(dupAlt || noAlt ? 1 : 0)
