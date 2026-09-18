#!/usr/bin/env node
/**
 * upload-ads-media.mjs — put the photographs the ads pages need, and the media
 * library does not yet have, into the library over REST, and record each one
 * in the media map the page converter reads.
 *
 *   node upload-ads-media.mjs --map <media-map.json>            # dry run
 *   node upload-ads-media.mjs --map <media-map.json> --apply
 *
 * The map is keyed on the LOCAL file name and valued with the `/uploads/...`
 * path the platform answered with, exactly as 13-content-export-import/.tmp/
 * instatic-media-map.json is. Upload ids are PER SITE, so staging gets its own
 * map (seeded from production's, which it was cloned from) and its own run:
 *
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com node upload-ads-media.mjs \
 *       --map .tmp/media-map-staging.json --apply
 *
 * Every successful upload is written to the map at once, so an interrupted run
 * resumes rather than uploading twice. Alt text is lifted from the built page's
 * own `alt` for that file, so the library carries the same description the
 * page does. `File`, not `Blob`: a bare Blob arrives as a text field and the
 * handler answers 400 "Missing file" (pick-post-images.mjs). AVIF is refused
 * by the sniffer (stored as video/mp4), so `.avif` sources are expected to be
 * in the map already under their `.jpg` conversion and are never uploaded.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { requestForm, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const SITE = join(HERE, '..', '04-design', '.tmp', 'final-site')
const argOf = (f) => { const i = process.argv.indexOf(f); return i === -1 ? null : process.argv[i + 1] }
const MAP = argOf('--map')
const APPLY = process.argv.includes('--apply')
if (!MAP) { console.error('usage: upload-ads-media.mjs --map <file> [--apply]'); process.exit(2) }

const map = JSON.parse(readFileSync(MAP, 'utf8'))
const alt = new Map()
const used = new Set()
for (const f of readdirSync(SITE).filter((n) => n.startsWith('ads-') && n.endsWith('.html'))) {
  const html = readFileSync(join(SITE, f), 'utf8')
  for (const m of html.matchAll(/<img[^>]*\bsrc="assets\/([^"]+)"[^>]*>/g)) {
    used.add(m[1])
    const a = /\balt="([^"]*)"/.exec(m[0])
    if (a && a[1] && !alt.has(m[1])) alt.set(m[1], a[1])
  }
}
const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' }
const todo = [...used].filter((n) => !map[n] && !map[n.replace(/\.avif$/i, '.jpg')]).sort()
console.log(`${BASE}\n${used.size} images on the ads pages, ${todo.length} not in ${basename(MAP)}`)
for (const n of todo) console.log('  ', n, '|', alt.get(n) ?? '(no alt)')
if (!APPLY) { console.log('\ndry run — pass --apply to upload'); process.exit(0) }

let done = 0
const failed = []
for (const name of todo) {
  const file = join(SITE, 'assets', name)
  if (!existsSync(file)) { failed.push(`${name}: not on disk`); continue }
  const ext = name.split('.').pop().toLowerCase()
  if (!MIME[ext]) { failed.push(`${name}: ${ext} is not an image the library takes`); continue }
  try {
    const form = new FormData()
    form.append('file', new File([readFileSync(file)], name, { type: MIME[ext] }))
    if (alt.get(name)) form.append('altText', alt.get(name))
    const res = await requestForm('/admin/api/cms/media', form)
    const asset = res?.asset
    if (!asset?.publicPath) throw new Error(`no publicPath: ${JSON.stringify(res).slice(0, 200)}`)
    map[name] = asset.publicPath
    writeFileSync(MAP, JSON.stringify(map, null, 1))
    done++
    console.log(`  + ${name} -> ${asset.publicPath} ${asset.width ?? '?'}x${asset.height ?? '?'}`)
  } catch (e) {
    failed.push(`${name}: ${e.message}`)
    console.log(`  ! ${name}: ${e.message}`)
  }
}
console.log(`\n${done} uploaded, ${failed.length} failed`)
if (failed.length) { console.log(failed.join('\n')); process.exit(1) }
