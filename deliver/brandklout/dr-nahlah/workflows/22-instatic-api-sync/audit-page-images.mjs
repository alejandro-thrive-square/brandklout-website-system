#!/usr/bin/env node
/**
 * audit-page-images.mjs — BugHerd pin #11, the audit half. READ-ONLY.
 *
 *   node audit-page-images.mjs
 *
 * The client: "There are a lot of repeated images in this site overall. We need
 * to make sure not to repeat images on the same page."  So the unit of the
 * question is (page, image) — NOT (site, image). Cross-page reuse is explicitly
 * out of scope, which matters because the header logo and the footer mark are on
 * all 37 pages and are not defects.
 *
 * ## Where images actually live on this site
 *
 * Every rendered image is a `base.image` node with `props.src` = the asset's
 * `publicPath`. Verified, not assumed: on `/smile-makeover` the node tree holds
 * 23 `base.image` nodes and exactly 23 `/uploads/` strings, and NONE of the 885
 * style rules carries a `background-image`. So walking the node tree for
 * `base.image` is complete coverage for page imagery. The single other
 * `/uploads/` reference on the whole site is the og:image poster inside
 * `src/scripts/seo-head.js`, which renders nothing.
 *
 * ## Two kinds of "same image"
 *
 * 1. SAME SRC twice on a page. The obvious case, and what pin #11 was raised on
 *    — `/smile-makeover`'s process cards 02/03/04 are one lab photograph three
 *    times.
 * 2. DIFFERENT src, same picture. The library holds duplicate uploads of the
 *    same file, so a page can repeat a photo without repeating a path. Those are
 *    matched here on the (width, height, byteSize) triple, which is exact enough
 *    to be worth acting on and is reported separately so a human can confirm.
 *
 * ## The header/footer problem
 *
 * The nav and the footer are part of EVERY page's own node tree, so a naive
 * count reports the logo as a 37-page duplicate and buries the real findings.
 * Each hit is therefore tagged with its nearest identifiable ancestors
 * (`#id` or `.class` off the style rule) and classified CHROME / CONTENT.
 * Only CONTENT duplicates are defects; CHROME ones are still listed so the
 * classification can be checked rather than trusted.
 *
 * Outputs, all under 05-design-revisions/.tmp/bugherd/:
 *   image-audit.json  the full inventory, machine-readable
 *   image-audit.md    the table for the client
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { api, getPages, getSite, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '..', '05-design-revisions', '.tmp', 'bugherd')
const TAG = process.argv.includes('--after') ? 'after' : 'before'

// ── data ───────────────────────────────────────────────────────────────────
const { assets } = await api('GET', '/admin/api/cms/media')
const byPath = new Map(assets.filter((a) => a.publicPath).map((a) => [a.publicPath, a]))
const { site } = await getSite()
const ruleName = new Map(Object.values(site.styleRules ?? {}).map((r) => [r.id, r.name]))
const pageRows = (await getPages()).rows

console.log(`${assets.length} assets, ${pageRows.length} pages`)

// Duplicate uploads of one picture. Two independent signals, because either
// alone is wrong:
//   - (width, height, sizeBytes) catches the SAME FILE uploaded twice under two
//     asset ids, which is the common case in this library.
//   - `blurHash` catches the same PICTURE re-encoded or re-cropped, where the
//     byte size differs. It is a 4x4-ish perceptual DCT the CMS already
//     computed for every asset, so this costs nothing and needs no decoder.
// Only exact blurHash equality is treated as a match; near-misses are listed
// for a human rather than acted on.
const sizeOf = (a) => a.sizeBytes ?? '?'
const sigOf = (a) => `${a.width}x${a.height}:${sizeOf(a)}`
const bySig = new Map()
for (const a of assets) {
  if (!/^image\//.test(a.mimeType ?? '')) continue
  if (!a.width || !a.height || sizeOf(a) === '?') continue
  const s = sigOf(a)
  if (!bySig.has(s)) bySig.set(s, [])
  bySig.get(s).push(a)
}
const byHash = new Map()
for (const a of assets) {
  if (!a.blurHash || !/^image\//.test(a.mimeType ?? '')) continue
  if (!byHash.has(a.blurHash)) byHash.set(a.blurHash, [])
  byHash.get(a.blurHash).push(a)
}
const twinOf = new Map() // assetId -> signature, only when >1 upload shares it
for (const [s, group] of bySig) if (group.length > 1) for (const a of group) twinOf.set(a.id, s)
for (const [h, group] of byHash) if (group.length > 1) for (const a of group) if (!twinOf.has(a.id)) twinOf.set(a.id, `hash:${h}`)
console.log(`duplicate uploads: ${[...bySig.values()].filter((g) => g.length > 1).length} by size, ` +
  `${[...byHash.values()].filter((g) => g.length > 1).length} by blurHash`)

// ── walking one page ───────────────────────────────────────────────────────
/**
 * DOM order matters: "card 02 and card 03 are the same photo" is only legible
 * if the hits come back in the order a reader meets them. `children` is already
 * render order, so a depth-first walk is the page as read.
 */
function labelFor (node) {
  const htmlId = node.props?.htmlAttributes?.id
  if (htmlId) return `#${htmlId}`
  const cls = (node.classIds ?? []).map((id) => ruleName.get(id)).filter(Boolean)
  if (cls.length) return `.${cls.join('.')}`
  const tag = node.props?.tag
  return tag && tag !== 'div' ? `<${tag}>` : null
}

/**
 * Chrome is recognised STRUCTURALLY, off the ancestor trail, not off the
 * filename — `logo.png` is chrome in `.nav-logo` and would still be a defect if
 * someone dropped it into a process card.
 *
 * The two chrome roots on this site are `#nav` (the sticky header and its
 * drawer) and `.foot`. Deliberately NOT included: `.brandmark`, which is the
 * financing partners' logos (CareCredit / Proceed / LendingClub) inside real
 * page content, and `.rv-head`, which is the Google mark on the review wall.
 * Both are page content and both are correctly distinct today.
 */
const CHROME = /^#nav$|^\.nav|^\.foot|^#drawer|^\.drawer/i

/**
 * `/post` is the entry TEMPLATE. Its image srcs are binding tokens
 * (`{currentEntry.featuredMediaPath}`), so the hero and the related-post cards
 * look like the same src while rendering a different photograph per article.
 * Counting them as a repeat is a false positive; they are reported separately.
 */
const TOKEN = /[{}]/

function walkPage (nodes, rootId) {
  const hits = []
  const stack = []
  const visit = (id) => {
    const node = nodes[id]
    if (!node) return
    const label = labelFor(node)
    if (label) stack.push(label)
    if (node.moduleId === 'base.image' && node.props?.src) {
      hits.push({
        nodeId: id,
        src: node.props.src,
        alt: node.props.alt ?? node.props.htmlAttributes?.alt ?? '',
        where: stack.slice(-4).join(' > '),
        chrome: stack.some((s) => CHROME.test(s)),
        token: TOKEN.test(node.props.src),
      })
    }
    for (const c of node.children ?? []) visit(c)
    if (label) stack.pop()
  }
  visit(rootId)
  return hits
}

// ── pass 1: walk every page ────────────────────────────────────────────────
const walked = []
for (const row of pageRows) {
  const full = (await api('GET', `/admin/api/cms/data/rows/${row.id}`)).row
  const body = full.cells?.body
  if (!body?.nodes || !body.rootNodeId) { console.warn(`  ! ${row.slug}: no body`); continue }
  walked.push({ row, title: full.cells?.title ?? row.slug, hits: walkPage(body.nodes, body.rootNodeId) })
}

// ── pass 2: settle identity by BYTES, for the assets it can change ─────────
/**
 * `sizeBytes` + `blurHash` agreeing is strong, but "these two files are the
 * same photograph" is a claim that gets acted on, so it is settled by the
 * bytes rather than by metadata. Only the collision candidates that are
 * actually ON a page are fetched — on this site that is ~20 files, not 443.
 *
 * It is not a theoretical concern: `lab.jpg` and `tech-hero.jpg` are one
 * 215,637-byte file under two names, and that single fact is what put three
 * identical lab photographs in the `/smile-makeover` process grid the client
 * pinned. No filename comparison would have found it.
 */
const referenced = new Set()
for (const w of walked) for (const h of w.hits) { const a = byPath.get(h.src); if (a) referenced.add(a.id) }
const candidates = assets.filter((a) => referenced.has(a.id) && twinOf.has(a.id))
console.log(`hashing ${candidates.length} referenced collision candidates…`)
const sha = new Map()
for (const a of candidates) {
  try {
    const res = await fetch(BASE + a.publicPath)
    if (!res.ok) { console.warn(`  ! ${a.filename}: ${res.status}`); continue }
    const bytes = Buffer.from(await res.arrayBuffer())
    sha.set(a.id, createHash('sha256').update(bytes).digest('hex'))
  } catch (e) { console.warn(`  ! ${a.filename}: ${e.message}`) }
}
const shaCount = new Map()
for (const h of sha.values()) shaCount.set(h, (shaCount.get(h) ?? 0) + 1)
// Identity: the content hash when it is shared, otherwise the path. A candidate
// whose hash turned out unique is NOT a duplicate, whatever the metadata said.
const identityOf = (asset, src) => {
  const h = asset && sha.get(asset.id)
  return h && shaCount.get(h) > 1 ? `sha:${h.slice(0, 16)}` : `src:${src}`
}
const demoted = candidates.filter((a) => !sha.has(a.id) || shaCount.get(sha.get(a.id)) === 1)
if (demoted.length) console.log(`  ${demoted.length} metadata-collision(s) were NOT byte-identical: ${demoted.map((a) => a.filename).join(', ')}`)

// ── pass 3: group per page ─────────────────────────────────────────────────
const pages = []
for (const { row, title, hits } of walked) {
  const groups = new Map()
  for (const h of hits) {
    const asset = byPath.get(h.src)
    const key = identityOf(asset, h.src)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push({
      ...h,
      // Alt text lives on the ASSET, not the node — `push-asset-alt-text.mjs`
      // wrote it there and the renderer reads it from there.
      alt: asset?.altText ?? h.alt ?? '',
      assetId: asset?.id ?? null,
      filename: asset?.filename ?? h.src.replace(/^\/uploads\/[A-Za-z0-9_-]{21}-/, ''),
      w: asset?.width ?? null,
      h: asset?.height ?? null,
      mime: asset?.mimeType ?? null,
    })
  }

  const dupes = [...groups.entries()]
    .filter(([, g]) => g.length > 1)
    .map(([key, g]) => ({
      key,
      kind: new Set(g.map((x) => x.src)).size > 1 ? 'same-picture' : 'same-src',
      count: g.length,
      chrome: g.every((x) => x.chrome) || g.every((x) => x.token),
      token: g.every((x) => x.token),
      filenames: [...new Set(g.map((x) => x.filename))],
      places: g.map((x) => x.where),
      nodeIds: g.map((x) => x.nodeId),
    }))

  pages.push({
    slug: row.slug,
    rowId: row.id,
    title,
    images: hits.length,
    distinct: groups.size,
    hits,
    dupes: dupes.sort((a, b) => b.count - a.count),
  })
  const bad = dupes.filter((d) => !d.chrome)
  console.log(`  ${row.slug.padEnd(30)} ${String(hits.length).padStart(3)} imgs  ${String(groups.size).padStart(3)} distinct  ${bad.length ? `DUP x${bad.length}` : '-'}`)
}

// ── posts table ────────────────────────────────────────────────────────────
// Every /posts card is one image on ONE page, so pin #9's featuredMedia choices
// land inside pin #11's rule the moment they render on the index.
const { rows: posts } = await api('GET', '/admin/api/cms/data/tables/posts/rows')
const byId = new Map(assets.map((a) => [a.id, a]))
const featured = posts.map((p) => ({ slug: p.slug, title: p.cells?.title ?? p.slug, media: p.cells?.featuredMedia || null }))
const featCount = new Map()
for (const f of featured) if (f.media) featCount.set(f.media, (featCount.get(f.media) ?? 0) + 1)
const featDupes = [...featCount.entries()]
  .filter(([, n]) => n > 1)
  .map(([id, n]) => ({ assetId: id, filename: byId.get(id)?.filename ?? '?', uses: n, posts: featured.filter((f) => f.media === id).map((f) => f.slug) }))
  .sort((a, b) => b.uses - a.uses)

console.log(`\nposts: ${posts.length}, with featuredMedia: ${featured.filter((f) => f.media).length}, assets used more than once: ${featDupes.length}`)

// ── report ─────────────────────────────────────────────────────────────────
mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, `image-audit.${TAG}.json`), JSON.stringify({
  tag: TAG,
  assets: assets.length,
  pages,
  posts: featured,
  featuredDupes: featDupes,
  duplicateUploads: [
    ...[...bySig].filter(([, g]) => g.length > 1).map(([sig, g]) => ({ by: 'size', sig, files: g.map((a) => a.filename) })),
    ...[...byHash].filter(([, g]) => g.length > 1).map(([sig, g]) => ({ by: 'blurHash', sig, files: g.map((a) => a.filename) })),
  ],
}, null, 2))

const contentDupePages = pages.filter((p) => p.dupes.some((d) => !d.chrome))
const tableRows = pages.map((p) => {
  const bad = p.dupes.filter((d) => !d.chrome).length
  const chrome = p.dupes.filter((d) => d.chrome).length
  return `| \`/${p.slug}\` | ${p.images} | ${p.distinct} | ${bad ? `**${bad}**` : '0'} | ${chrome} |`
})
const detail = contentDupePages.map((p) => {
  const bad = p.dupes.filter((d) => !d.chrome)
  return `### \`/${p.slug}\`\n\n` + bad.map((d) =>
    `- **${d.filenames.join(' + ')}** — used **${d.count}×** (${d.kind})\n` +
    d.places.map((w, i) => `  - ${i + 1}. \`${w}\`  · node \`${d.nodeIds[i]}\``).join('\n')
  ).join('\n')
}).join('\n\n')

writeFileSync(join(OUT, `image-audit.${TAG}.md`), `# Image audit — BugHerd #11 (${TAG.toUpperCase()})

Read off the **draft** document. ${assets.length} assets in the library,
${pages.length} pages walked, ${pages.reduce((n, p) => n + p.images, 0)} rendered images.

**${contentDupePages.length} of ${pages.length} pages repeat an image in their own content.**
Header/footer chrome (the logo, the footer mark) is counted separately — it is on
every page by design and is not a defect.

| page | images | distinct | content repeats | chrome repeats |
|---|---:|---:|---:|---:|
${tableRows.join('\n')}

## The repeats, in reading order

${detail || '_none_'}

## Posts table

${posts.length} article rows; ${featured.filter((f) => f.media).length} carry a \`featuredMedia\`.
${featDupes.length
  ? `${featDupes.length} asset(s) headline more than one article — every one of those becomes a visible side-by-side repeat once pin #9 renders them as cards on \`/posts\`:\n\n` +
    featDupes.map((d) => `- \`${d.filename}\` ×${d.uses} — ${d.posts.join(', ')}`).join('\n')
  : '_No asset is used twice._'}
`)

console.log(`\n${contentDupePages.length}/${pages.length} pages have a content-level repeat`)
console.log(`wrote ${join(OUT, `image-audit.${TAG}.md`)}`)
