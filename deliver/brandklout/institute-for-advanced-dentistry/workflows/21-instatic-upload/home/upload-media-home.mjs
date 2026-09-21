/**
 * Home redesign, step 1 — the prototype's images, films and typefaces into the STAGING media
 * library; prototype path -> served URL in ../.tmp/home/media-map.json.
 *
 * Names are prefixed `home-` so they sort together in the library and cannot collide with the
 * 820 assets cloned from production. Idempotent; --force re-uploads.
 *
 * Usage: INSTATIC_BASE_URL=https://staging.ifadentistry.com node home/upload-media-home.mjs > .tmp/home/upload.log 2>&1
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, requestForm, BASE } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'
import { assertStaging } from './staging-only.mjs'

assertStaging(BASE)
const HERE = path.dirname(fileURLToPath(import.meta.url))
const TMP = path.resolve(HERE, '../.tmp/home')
const OUT = path.join(TMP, 'media-map.json')
const force = process.argv.includes('--force')
const MIME = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4', '.woff2': 'font/woff2' }
const MAX = 50 * 1024 * 1024

const { root, files } = JSON.parse(fs.readFileSync(path.join(TMP, 'media-needed.json'), 'utf8'))
const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { map: {} }
const map = prev.base === BASE ? prev.map : {}
const listed = await api('GET', '/admin/api/cms/media')
const assets = listed.assets ?? listed.rows ?? listed.items ?? []
const liveIds = new Set(assets.map((a) => a.id))
const byFilename = new Map(assets.map((a) => [a.filename, a]))
const save = () => fs.writeFileSync(OUT, JSON.stringify({ base: BASE, updatedAt: new Date().toISOString(), map }, null, 1))

let done = 0, kept = 0
for (const p of files) {
  const ext = path.extname(p).toLowerCase()
  if (!MIME[ext]) throw new Error(`${p}: ${ext} is not an accepted media type`)
  if (!force && map[p] && liveIds.has(map[p].id)) { kept++; continue }
  const name = 'home-' + path.posix.basename(p)
  const hit = byFilename.get(name)
  if (!force && hit) { map[p] = { id: hit.id, url: hit.publicPath, mime: hit.mimeType, name, reused: true }; kept++; continue }
  const bytes = fs.readFileSync(path.join(root, p))
  if (bytes.length > MAX) throw new Error(`${p}: ${(bytes.length / 1048576).toFixed(1)} MB is over the 50 MB cap`)
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: MIME[ext] }), name)
  const res = await requestForm('/admin/api/cms/media', form)
  const a = res.asset ?? res
  if (!a.publicPath) throw new Error(`${p}: no publicPath: ${JSON.stringify(a).slice(0, 160)}`)
  if (!String(a.mimeType || '').startsWith(MIME[ext].split('/')[0])) throw new Error(`${p}: stored as ${a.mimeType}`)
  map[p] = { id: a.id, url: a.publicPath, mime: a.mimeType, name, width: a.width ?? null, height: a.height ?? null, bytes: bytes.length }
  done++
  save()
  console.log(`up   ${p} -> ${a.publicPath}`)
}
save()
console.log(`\n${files.length} needed: ${done} uploaded, ${kept} already there -> ${path.relative(process.cwd(), OUT)}`)
