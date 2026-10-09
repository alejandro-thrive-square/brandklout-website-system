#!/usr/bin/env node
/**
 * upload-files-to.mjs: upload a few named dist files to the instance in INSTATIC_BASE_URL and write a
 * media map for that instance, without touching .tmp/media-map.json (production's).
 *
 *   INSTATIC_BASE_URL=<staging> node upload-files-to.mjs <from-map.json> <out-map.json> media/img/a.jpg fonts/b.woff2 ...
 *
 * For a clone whose library carries the same /uploads paths as its source (the staging clone does:
 * import-media-chunks kept ids and paths), every entry of <from-map> is carried over with the new
 * base, and only the named files are uploaded and replaced. upload-media.mjs is NOT safe for that:
 * the library list returns the newest 100 only, so on a host with no prior map it re-uploads everything.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { requestForm, BASE } from '../../tools/instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.resolve(HERE, '../04-design/.tmp/site-src') // the source, not dist/: a rebuild empties dist/ first
const [fromFile, outFile, ...files] = process.argv.slice(2)
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' }
const from = JSON.parse(fs.readFileSync(path.resolve(HERE, fromFile), 'utf8'))
const out = { base: BASE, uploadedAt: new Date().toISOString(), derivedFrom: { base: from.base, file: fromFile }, map: { ...from.map } }
// a carried entry must answer on this host
for (const rel of ['media/img/front-desk-receptionist.jpg', 'fonts/playfair-display-normal-var.woff2']) {
  const r = await fetch(BASE + out.map[rel].url, { method: 'HEAD' })
  if (!r.ok) throw new Error(`${BASE}${out.map[rel].url} -> ${r.status}: this host does not share the source's /uploads paths`)
}
for (const rel of files) {
  const name = path.basename(rel)
  const bytes = fs.readFileSync(path.join(SRC, rel)) // media/img/* and fonts/* sit at the same paths in the source
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: MIME[path.extname(name).toLowerCase()] }), name)
  const res = await requestForm('/admin/api/cms/media', form)
  const a = res.asset ?? res
  if (!a.publicPath) throw new Error(`${rel}: no publicPath in ${JSON.stringify(res).slice(0, 160)}`)
  out.map[rel] = out.map[name] = { id: a.id, url: a.publicPath, uploadedAs: name, width: a.width, height: a.height, variants: (a.variants ?? []).length }
  console.log(`ok  ${rel} -> ${a.publicPath} (${a.mimeType}, ${(a.variants ?? []).length} variants)`)
}
fs.writeFileSync(path.resolve(HERE, outFile), JSON.stringify(out, null, 2))
console.log(`${files.length} uploaded to ${BASE}; map -> ${outFile}`)
