import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../../../..')
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const { api } = await import('../../../../../process/22-instatic-api-sync/insta-api.mjs')
const map = JSON.parse(fs.readFileSync(path.join(HERE, 'media-map.json'), 'utf8'))
// media-map.json is { base, uploadedAt, map: { <name>: { url, id? } } } — NOT a flat map. Read as a flat map on
// 2026-09-15 this purged every asset the site uses (Alejandro's verbatim run); refuse rather than guess.
if (!map.map || typeof map.map !== 'object') throw new Error('media-map.json has no .map')
const used = new Set(Object.values(map.map).map((v) => v.id).filter(Boolean))
const usedPaths = new Set(Object.values(map.map).map((v) => v.url))
if (!usedPaths.size) throw new Error('media-map.json .map is empty; refusing to prune')
const assets = (await api('GET', '/admin/api/cms/media?limit=500')).assets
const extra = assets.filter((a) => !usedPaths.has(a.publicPath) && !used.has(a.id))
console.log('library', assets.length, 'used', usedPaths.size, 'unreferenced', extra.map((a) => a.filename))
if (process.argv.includes('--apply')) for (const a of extra) { await api('DELETE', `/admin/api/cms/media/${a.id}`); await api('DELETE', `/admin/api/cms/media/${a.id}?purge=1`); console.log('purged', a.filename) }
