#!/usr/bin/env node
/**
 * audit-image-dupes.mjs — which pictures repeat on a page, BY PIXELS.
 *
 *   node audit-image-dupes.mjs              # /posts (the loop's 43 thumbnails)
 *   node audit-image-dupes.mjs --page index
 *   node audit-image-dupes.mjs --page smile-makeover --cols 4
 *
 * ## Why this exists, and why counting asset ids is not enough
 *
 * Written for BugHerd #9 (the /posts thumbnails) and left behind for #11
 * ("there are a lot of repeated images in this site overall").
 *
 * This media library holds the SAME PHOTOGRAPH re-uploaded under several
 * filenames and several asset ids. On /posts, 43 cards carry 29 distinct
 * `featuredMedia` ids — and 22 distinct pictures. Every tool on this project
 * that de-duplicates by id or by filename is blind to the difference, including
 * `pick-post-images.mjs`, whose `MAX_USES = 2` counts by asset name: two ids
 * for one picture silently permit FOUR uses of it, which is what happened
 * (`patient_hero.jpg` and `pt-hero-1.jpg` are byte-identical and land on cards
 * 4, 11, 25 and 30).
 *
 * So this hashes the bytes the visitor actually downloads — the published
 * `-w320.webp` variant — and groups by that.
 *
 * ## Two things it finds that are worth more than the repeat count
 *
 *  - **Disagreeing alt text on one picture.** If a hash group carries more than
 *    one alt string, all but one of them are factually wrong: the same pixels
 *    cannot be both "the reception area" and "an operatory light". Three of the
 *    /posts groups are like this. Alt lives on the ASSET, so the fix is to
 *    merge the duplicate assets, not to edit pages.
 *  - **An allowlist defeated by a re-upload.** `post-image-pool.mjs` excludes
 *    named-patient photography by FILENAME (`pt-yolanda.jpg`). The same
 *    patient's photograph is also in the library as `pt-hero-1.jpg` and
 *    `patient_hero.jpg`, both allowlisted — and `pt-hero-1.jpg`'s own alt text
 *    names her. A name-based allowlist cannot see a re-upload; a hash can.
 *
 * ## What it reads
 *
 * The page is rendered from the DRAFT through the platform's own publisher
 * (`POST /admin/api/cms/runtime/preview`), so this sees unpublished work.
 * Image BYTES come from the published site, because only published variants
 * exist on disk — a brand-new upload that has never been published will report
 * `MISS:404` rather than a hash, and is reported as its own picture.
 *
 * Read-only. Writes nothing anywhere.
 */
import { createHash } from 'node:crypto'
import { api, getSite, getPages } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag)
  return i > 0 ? process.argv[i + 1] : fallback
}
const SLUG = arg('--page', 'posts')
const COLS = Number(arg('--cols', '3'))
const ORIGIN = (process.env.PUBLIC_ORIGIN || 'https://www.drnahlah.com').replace(/\/$/, '')

/* `resolvePreviewPage` looks the page up in `site.pages`, which the shell does
   NOT carry — pages live in the data table. The editor posts a site document
   with them attached, so rebuild that shape here. */
const { site: shell } = await getSite()
const { rows } = await getPages()
const pages = rows.map((row) => ({
  id: row.id,
  slug: row.slug,
  title: row.cells.title ?? '',
  nodes: row.cells.body?.nodes ?? {},
  rootNodeId: row.cells.body?.rootNodeId ?? '',
  ...(row.cells.templateEnabled === true
    ? { template: { enabled: true, target: row.cells.templateTarget, priority: row.cells.templatePriority ?? 0 } }
    : {}),
  ownerUserId: row.authorUserId ?? null,
  createdByUserId: row.createdByUserId ?? null,
  updatedByUserId: row.updatedByUserId ?? null,
}))
const page = pages.find((p) => p.slug === SLUG)
if (!page) { console.error(`  ! no page /${SLUG}`); process.exit(1) }

const { html } = await api('POST', '/admin/api/cms/runtime/preview', { pageId: page.id, site: { ...shell, pages } })
if (!html) { console.error('  ! the preview returned no html'); process.exit(1) }

/* Every <img> in document order, with the nearest enclosing link for context.
   Deliberately whole-page: #11's pin is about a page, not a section. */
const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]).map((tag) => ({
  src: (/\ssrc="([^"]+)"/.exec(tag) ?? [, null])[1],
  alt: (/\salt="([^"]*)"/.exec(tag) ?? [, ''])[1],
})).filter((i) => i.src && i.src.startsWith('/uploads/'))
if (!imgs.length) { console.log(`/${SLUG}: no library images on the page`); process.exit(0) }

const hashOf = new Map()
for (const img of imgs) {
  if (!hashOf.has(img.src)) {
    const variant = img.src.replace(/\.(jpe?g|png|webp|avif)$/i, '-w320.webp')
    let h
    try {
      const r = await fetch(`${ORIGIN}${variant}`)
      /* An unpublished upload has no variant on disk yet. Key it by src so it
         counts as its own picture rather than colliding with every other miss. */
      h = r.ok ? createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex').slice(0, 16) : `unpublished:${img.src}`
    } catch (e) {
      h = `unreachable:${img.src}`
    }
    hashOf.set(img.src, h)
  }
  img.hash = hashOf.get(img.src)
}

const groups = new Map()
for (const img of imgs) {
  if (!groups.has(img.hash)) groups.set(img.hash, [])
  groups.get(img.hash).push(img)
}
const file = (src) => src.replace(/^\/uploads\/[^-]*-/, '')
const repeats = [...groups].filter(([, g]) => g.length > 1).sort((a, b) => b[1].length - a[1].length)

console.log(`/${SLUG}`)
console.log(`  ${imgs.length} library images | ${hashOf.size} distinct asset ids | ${groups.size} distinct PICTURES`)
console.log(`  ${repeats.length} picture(s) appear more than once\n`)

let idAliases = 0
let altConflicts = 0
for (const [hash, group] of repeats) {
  const files = [...new Set(group.map((i) => file(i.src)))]
  const alts = [...new Set(group.map((i) => i.alt).filter(Boolean))]
  console.log(`${String(group.length).padStart(2)}x  ${hash}  ${files.join('  +  ')}`)
  console.log(`      positions ${group.map((i) => imgs.indexOf(i) + 1).join(', ')}`)
  if (files.length > 1) {
    idAliases++
    console.log(`      ONE PICTURE, ${files.length} ASSET IDS — de-duplicating by id or filename cannot see this`)
  }
  if (alts.length > 1) {
    altConflicts++
    console.log(`      ${alts.length} DIFFERENT ALT TEXTS for one picture — at least ${alts.length - 1} of them is wrong:`)
    for (const a of alts) console.log(`        ${JSON.stringify(a)}`)
  }
}

/* Adjacency is what a reader notices; a repeat forty cards apart is invisible.
   It has to be measured over the GRID, not the document: the header logo and
   the page hero sit in front of the first card and shift every row boundary by
   two. Where the page has a `base.loop`, that wrapper is the grid. */
const loop = /<[^>]*\sdata-instatic-loop="[^"]*"[^>]*>/.exec(html)
let grid = imgs
let gridLabel = 'the whole page'
if (loop) {
  const tag = (/^<([a-z0-9-]+)/i.exec(loop[0]) ?? [, 'div'])[1]
  const start = loop.index + loop[0].length
  /* Walk to the wrapper's OWN closing tag. Slicing to the end of the document
     instead sweeps the footer logo in and reports one image too many. */
  let depth = 1
  let end = html.length
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi')
  re.lastIndex = start
  for (let m = re.exec(html); m; m = re.exec(html)) {
    depth += m[1] ? -1 : 1
    if (depth === 0) { end = m.index; break }
  }
  /* Positional, not by src — the same asset can appear inside and outside. */
  let seen = 0
  const positions = imgs.map((i) => {
    const at = html.indexOf(`src="${i.src}"`, seen)
    seen = at >= 0 ? at + 1 : seen
    return at
  })
  const inLoop = imgs.filter((_, i) => positions[i] >= start && positions[i] < end)
  if (inLoop.length) {
    grid = inLoop
    gridLabel = `the loop (${grid.length} images of ${imgs.length} on the page)`
  }
}
let adjacent = 0
for (let i = 1; i < grid.length; i++) {
  if (grid[i].hash === grid[i - 1].hash) { adjacent++; console.log(`\n  VISIBLE: items ${i} and ${i + 1} are adjacent and show the same picture`) }
}
let sameRow = 0
for (let r = 0; r * COLS < grid.length; r++) {
  const row = grid.slice(r * COLS, r * COLS + COLS).map((i) => i.hash)
  if (row.length !== new Set(row).size) { sameRow++; console.log(`\n  VISIBLE: row ${r + 1} at ${COLS}-up shows one picture twice`) }
}
console.log(`\nadjacency measured over      ${gridLabel}`)
console.log(`adjacent in reading order    ${adjacent}`)
console.log(`same row at ${COLS}-up             ${sameRow}`)
console.log(`one picture / several ids    ${idAliases}`)
console.log(`conflicting alt text         ${altConflicts}`)
if (idAliases) console.log('\nMerge the duplicate ASSETS before re-picking anything — alt text lives on the asset,\nso merging fixes every page at once, and a name-based allowlist stays blind until you do.')
