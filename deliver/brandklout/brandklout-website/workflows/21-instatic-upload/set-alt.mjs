#!/usr/bin/env node
/**
 * Step 1b — put every image's alt text into the MEDIA LIBRARY, because that is
 * the only place Instatic will read it from.
 *
 * > [!WARNING]
 * > **`importHtml` DISCARDS `alt` AND THE SITE PUBLISHES WITH `alt=""` ON EVERY
 * > IMAGE.** Found 2026-09-04 on the med spa's first publish: the local build
 * > carries a written alt on every photograph and the published home page had
 * > fifteen images and fifteen `alt=""`.
 *
 * It is not a bug, it is a design decision, and the platform says so out loud:
 *
 *     ImageEditor.tsx:10   alt text comes from the library asset
 *                          (single source of truth — edit via the Media viewer)
 *     modules/base/image/index.ts:187
 *                          const alt = escapeHtml(media?.altText?.trim() ?? '')
 *
 * A `base.image` node has no alt prop at all — `props` is `{src, loading,
 * fetchPriority, decoding, htmlAttributes}` and the importer does not even put
 * the attribute in `htmlAttributes`. So no amount of care in the markup can
 * survive the import, and nothing warns: the page renders, the picture is
 * there, and only a screen reader or an audit notices.
 *
 * The consequence is that alt is PER ASSET here, not per usage. Where the same
 * photograph appears twice with different alt text, one of them has to win —
 * this picks the longest, and prints every conflict so a human can decide
 * whether the two usages really wanted different words.
 *
 * Idempotent. Run after upload-media.mjs and before, or after, any publish;
 * alt lives on the asset, so a re-publish picks up the change with no re-import.
 *
 * Usage:
 *   node set-alt.mjs            # dry run — prints what it would set
 *   node set-alt.mjs --apply
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { api } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const FINAL = path.resolve(HERE, '.tmp/site/final-site')
const TMP = path.join(HERE, '.tmp')
const apply = process.argv.includes('--apply')

const mediaMap = JSON.parse(fs.readFileSync(path.join(TMP, 'media-map.json'), 'utf8')).map

/* filename -> Set(alt), harvested from the static build. The build is the
   source of truth for alt text: it is where a human wrote it, and audit.mjs
   already fails on an <img> without one. */
const alts = new Map()
const conflicts = []
// Every page at every depth: Brandklout v2 nests its pages (`customer-stories/<name>/index.html`)
// and writes image srcs root-relative (`/assets/x`). A top-level-only walk would see one page.
const htmlFiles = fs.readdirSync(FINAL, { recursive: true }).map(String).filter((f) => f.endsWith('.html'))
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(FINAL, file), 'utf8')
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0]
    const src = (tag.match(/\bsrc="\/?assets\/([^"]+)"/) ?? [])[1]
    const alt = (tag.match(/\balt="([^"]*)"/) ?? [])[1]
    if (!src || !alt) continue // a deliberately decorative image keeps alt=""
    if (!alts.has(src)) alts.set(src, new Set())
    alts.get(src).add(decodeEntities(alt))
  }
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

const live = await api('GET', '/admin/api/cms/media?limit=500')
const assets = live.assets ?? live.items ?? live
const byId = new Map(assets.map((a) => [a.id, a]))

let set = 0
let already = 0
let missing = 0
for (const [filename, values] of [...alts].sort()) {
  const hit = mediaMap[filename]
  if (!hit) {
    console.log(`MISS  ${filename} is not in media-map.json`)
    missing++
    continue
  }
  const wanted = [...values].sort((a, b) => b.length - a.length)[0]
  if (values.size > 1) conflicts.push({ filename, values: [...values], chose: wanted })

  const asset = byId.get(hit.id)
  if (asset && (asset.altText ?? '') === wanted) {
    already++
    continue
  }
  console.log(`${apply ? 'set ' : 'would set'}  ${filename.padEnd(28)} "${wanted}"`)
  if (apply) {
    await api('PATCH', `/admin/api/cms/media/${hit.id}`, { altText: wanted })
    set++
  }
}

if (conflicts.length) {
  console.log(`\nSAME IMAGE, DIFFERENT ALT — the library holds one per asset, so the longest wins:`)
  for (const c of conflicts) {
    console.log(`  ${c.filename}`)
    for (const v of c.values) console.log(`    ${v === c.chose ? '->' : '  '} "${v}"`)
  }
}

console.log(
  `\n${alts.size} image(s) with written alt text; ${already} already correct, ` +
    `${apply ? set + ' updated' : 'dry run'}${missing ? `, ${missing} not in the library` : ''}.`,
)
if (!apply) console.log('re-run with --apply')
