#!/usr/bin/env node
// PROMOTED 2026-09-23 to deliver/process/tools/instatic-site/push/set-alt.mjs
// Origin: bk-west-la-implants/deliver/brandklout/west-la-implants/workflows/21-instatic-upload/set-alt.mjs. Paths now come from ../lib/paths.mjs (run from the client's workflow
// folder; build root = --site-src or SITE_SRC; outputs in <cwd>/output) and the admin client from
// ../lib/site.mjs (refuses to run without INSTATIC_BASE_URL). Client-specific notes below are the
// origin's record; review them against the new site before --apply.
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
import { api } from '../lib/site.mjs'

const HERE = P.WORK // was this file's folder; outputs now go to <cwd>/output
const FINAL = P.DIST
const TMP = path.join(HERE, 'output')
const apply = process.argv.includes('--apply')

const mediaMap = JSON.parse(fs.readFileSync(path.join(TMP, 'media-map.json'), 'utf8')).map

/* filename -> Set(alt), harvested from the static build. The build is the
   source of truth for alt text: it is where a human wrote it, and audit.mjs
   already fails on an <img> without one. */
const alts = new Map()
const conflicts = []
const walk = (dir) => fs.readdirSync(dir).flatMap((e) => (fs.statSync(path.join(dir, e)).isDirectory() ? walk(path.join(dir, e)) : e.endsWith('.html') ? [path.join(dir, e)] : []))
for (const file of walk(FINAL)) {
  const html = fs.readFileSync(file, 'utf8')
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0]
    // WEST LA IMPLANTS: this build references `media/img/x.jpg`, not `assets/x`,
    // and `media-map.json` is keyed by that same dist-relative path.
    // root-relative since the multi-page build; the map is keyed without the slash
    const src = (tag.match(/\bsrc="\/?(media\/[^"]+)"/) ?? [])[1]
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
