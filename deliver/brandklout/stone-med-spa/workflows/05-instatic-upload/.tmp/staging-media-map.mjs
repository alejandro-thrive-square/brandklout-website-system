// One-off: rebuild media-map.json's entries against staging's own media ids,
// matched by URL (clone-site keeps URLs, not ids). Writes media-map.staging.json.
import fs from 'node:fs'
import { api, BASE } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'
const media = await api('GET', '/admin/api/cms/media?limit=500')
const list = Array.isArray(media) ? media : media.assets || media.items || []
if (!list.length) { console.log('unexpected shape', JSON.stringify(media).slice(0, 400)); process.exit(1) }
const byUrl = new Map(list.map((m) => [m.publicPath || m.url, m]))
const src = JSON.parse(fs.readFileSync(new URL('./media-map.json', import.meta.url), 'utf8'))
const out = { base: BASE, uploadedAt: src.uploadedAt, derivedFrom: 'media-map.json by URL', map: {} }
const missing = []
for (const [k, v] of Object.entries(src.map)) { const m = byUrl.get(v.url); if (!m) { missing.push(k); continue } out.map[k] = { ...v, id: m.id } }
fs.writeFileSync(new URL('./media-map.staging.json', import.meta.url), JSON.stringify(out, null, 2))
console.log('staging media', list.length, 'mapped', Object.keys(out.map).length, 'missing', missing, 'sample keys', Object.keys(list[0]).join(','))
