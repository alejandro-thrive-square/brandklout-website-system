/**
 * Site push, step 1 — every file the pages, the CSS and the JS need, into the STAGING media library;
 * dist path -> served URL in .tmp/media-map.json.
 *
 * The home's 49 files are already in the library from 2026-09-21 (`home-<name>`,
 * workflows/21-instatic-upload/.tmp/home/media-map.json): those are reused by basename, never re-uploaded.
 * Everything else uploads as `ifa-<name>`. The library listing returns only the newest 100 rows (limit and
 * offset are ignored), so reuse is decided from the two local maps, never from a listing.
 * A RE-CUT image needs a NEW file name: a name already in the map is not uploaded again.
 *
 * Usage: INSTATIC_BASE_URL=https://staging.ifadentistry.com node push/upload-media.mjs > push/.tmp/upload.log 2>&1
 *        --force re-uploads what this map holds (never the home's)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { requestForm, BASE } from '../../../../../tools/instatic-api-sync/insta-api.mjs'
import { assertStaging } from './staging-only.mjs'

assertStaging(BASE)
const HERE = path.dirname(fileURLToPath(import.meta.url))
const TMP = path.join(HERE, '.tmp')
const OUT = path.join(TMP, 'media-map.json')
const HOME_MAP = path.resolve(HERE, '../../../../../workflows/21-instatic-upload/.tmp/home/media-map.json')
const force = process.argv.includes('--force')
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.woff2': 'font/woff2' }
const MAX = 50 * 1024 * 1024

const { root, files } = JSON.parse(fs.readFileSync(path.join(TMP, 'media-needed.json'), 'utf8'))
const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { map: {} }
const map = prev.base === BASE ? prev.map : {}
const home = fs.existsSync(HOME_MAP) ? JSON.parse(fs.readFileSync(HOME_MAP, 'utf8')) : { map: {} }
const homeByBase = new Map(home.base === BASE ? Object.entries(home.map).map(([k, v]) => [path.posix.basename(k), v]) : [])
const save = () => fs.writeFileSync(OUT, JSON.stringify({ base: BASE, updatedAt: new Date().toISOString(), map }, null, 1))

let up = 0, kept = 0, reused = 0
for (const p of files) {
  const ext = path.extname(p).toLowerCase()
  if (!MIME[ext]) throw new Error(`${p}: ${ext} is not an accepted media type`)
  const base = path.posix.basename(p)
  if (homeByBase.has(base)) { map[p] = { ...homeByBase.get(base), reused: 'home' }; reused++; continue }
  if (!force && map[p]?.url) { kept++; continue }
  const name = 'ifa-' + base
  const bytes = fs.readFileSync(path.join(root, p))
  if (bytes.length > MAX) throw new Error(`${p}: ${(bytes.length / 1048576).toFixed(1)} MB is over the 50 MB cap`)
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: MIME[ext] }), name)
  const res = await requestForm('/admin/api/cms/media', form)
  const a = res.asset ?? res
  if (!a.publicPath) throw new Error(`${p}: no publicPath: ${JSON.stringify(a).slice(0, 160)}`)
  if (!String(a.mimeType || '').startsWith(MIME[ext].split('/')[0]) && ext !== '.woff2') throw new Error(`${p}: stored as ${a.mimeType}`)
  map[p] = { id: a.id, url: a.publicPath, mime: a.mimeType, name, width: a.width ?? null, height: a.height ?? null, bytes: bytes.length }
  up++
  save()
  console.log(`up   ${p} -> ${a.publicPath}`)
}
save()
console.log(`\n${files.length} needed: ${up} uploaded, ${reused} reused from the home, ${kept} already there -> ${path.relative(process.cwd(), OUT)}`)
