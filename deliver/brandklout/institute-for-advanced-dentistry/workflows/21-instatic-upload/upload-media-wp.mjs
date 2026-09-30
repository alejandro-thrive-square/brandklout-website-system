/**
 * Step 1 — put every local file the clone references into Instatic's media library, and record
 * site path -> served URL in .tmp/media-map-wp.json for build-wp.mjs.
 *
 * Input is prepare-wp.mjs's .tmp/wp/media-needed.json: every image, font, video and icon a page,
 * a stylesheet or a head tag points at, as a SITE PATH (`/wp-content/uploads/2025/06/x.jpg`).
 * Keyed by path, not filename: WordPress keeps `2024/05/logo.png` and `2025/06/logo.png` apart
 * by folder, and the library would not. When two needed paths share a basename, both are
 * uploaded under a folder-prefixed name.
 *
 * Special paths:
 *   /__vimeo__/<file>.mp4       media-library/vimeo-instatic/<file> when it exists (the three
 *                               testimonials re-encoded under the 50 MB cap), else vimeo/<file>
 *   /__vimeo__/<id>-poster.jpg  media-library/vimeo-posters/ (Vimeo's own thumbnail, via oEmbed)
 *
 * Idempotent: a path already in the map whose asset still exists is skipped. --force re-uploads.
 *
 * Usage: node upload-media-wp.mjs > .tmp/upload.log 2>&1
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, requestForm, BASE } from '../../../../process/tools/instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SCRAPE = path.resolve(HERE, '../01-content-intake/.tmp/current-site-scrape')
const SITE = path.join(SCRAPE, 'site')
const LIB = path.join(SCRAPE, 'media-library')
const NEEDED = path.join(HERE, '.tmp', 'wp', 'media-needed.json')
const OUT = path.join(HERE, '.tmp', 'media-map-wp.json')
const force = process.argv.includes('--force')
const CONCURRENCY = 4

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
}
const MAX = 50 * 1024 * 1024

const { files } = JSON.parse(fs.readFileSync(NEEDED, 'utf8'))

function localFile(p) {
  if (p.startsWith('/__vimeo__/')) {
    const name = p.slice('/__vimeo__/'.length)
    if (name.endsWith('-poster.jpg')) return path.join(LIB, 'vimeo-posters', name)
    const re = path.join(LIB, 'vimeo-instatic', name)
    return fs.existsSync(re) ? re : path.join(LIB, 'vimeo', name)
  }
  return path.join(SITE, ...p.split('/').filter(Boolean))
}

// A key `<path>#aN` is the same file uploaded again to carry a different alt (prepare-wp.mjs,
// per-usage alt). The stem is the real path; the upload name gets `-aN` before the extension.
const stemOf = (p) => p.replace(/#a\d+$/, '')
// Upload names: the basename, unless another needed path has the same one.
const byBase = new Map()
for (const p of new Set(files.map(stemOf))) {
  const b = path.posix.basename(p)
  byBase.set(b, (byBase.get(b) || 0) + 1)
}
const uploadName = (key) => {
  const p = stemOf(key)
  const b = path.posix.basename(p)
  const name = byBase.get(b) === 1 ? b : p.replace(/^\/+/, '').replace(/^wp-content\/(uploads\/)?/, '').replace(/\//g, '-')
  const v = (key.match(/#(a\d+)$/) || [])[1]
  return v ? name.replace(/(\.[^.]+)$/, `-${v}$1`) : name
}

const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { map: {} }
const map = prev.base === BASE ? prev.map : {}
const listed = await api('GET', '/admin/api/cms/media')
const assets = listed.assets ?? listed.rows ?? listed.items ?? []
const liveIds = new Set(assets.map((a) => a.id))
const byFilename = new Map(assets.map((a) => [a.filename, a]))

const save = () => fs.writeFileSync(OUT, JSON.stringify({ base: BASE, updatedAt: new Date().toISOString(), map }, null, 1))

const todo = []
const log = []
let skipped = 0
for (const p of files) {
  const ext = path.extname(stemOf(p)).toLowerCase()
  if (!MIME[ext]) {
    log.push(`SKIP   ${p}  (${ext || 'no extension'} is not an accepted media type; left pointing at the live site)`)
    continue
  }
  if (!force && map[p] && liveIds.has(map[p].id)) {
    skipped++
    continue
  }
  const name = uploadName(p)
  const hit = byFilename.get(name)
  if (!force && hit) {
    map[p] = { id: hit.id, url: hit.publicPath, mime: hit.mimeType, name, reused: true }
    skipped++
    continue
  }
  todo.push({ p, name, ext })
}

let done = 0
async function worker() {
  while (todo.length) {
    const { p, name, ext } = todo.shift()
    const file = localFile(stemOf(p))
    try {
      if (!fs.existsSync(file)) throw new Error('no local file ' + file)
      const bytes = fs.readFileSync(file)
      if (bytes.length > MAX) throw new Error(`${(bytes.length / 1048576).toFixed(1)} MB is over the 50 MB cap`)
      const form = new FormData()
      form.append('file', new Blob([bytes], { type: MIME[ext] }), name)
      const res = await requestForm('/admin/api/cms/media', form)
      const a = res.asset ?? res
      if (!a.publicPath) throw new Error('no publicPath: ' + JSON.stringify(a).slice(0, 160))
      const family = MIME[ext].split('/')[0]
      if (!String(a.mimeType || '').startsWith(family)) throw new Error(`stored as ${a.mimeType}, expected ${family}/*`)
      map[p] = { id: a.id, url: a.publicPath, mime: a.mimeType, name, width: a.width ?? null, height: a.height ?? null, bytes: bytes.length }
      done++
      if (done % 25 === 0) {
        save()
        console.log(`  ${done} uploaded, ${todo.length} to go`)
      }
    } catch (e) {
      log.push(`FAIL   ${p}  ${String(e.message).slice(0, 180)}`)
      process.exitCode = 1
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker))
save()

console.log(log.join('\n'))
console.log(`\n${files.length} needed: ${done} uploaded, ${skipped} already there, ${log.filter((l) => l.startsWith('FAIL')).length} failed, ${log.filter((l) => l.startsWith('SKIP')).length} not uploadable -> ${path.relative(process.cwd(), OUT)}`)
