// One-off: snapshot staging's site + pages over the API before a --force push,
// and check staging's media ids match media-map.json (set-alt PATCHes by id).
import fs from 'node:fs'
import { getSite, getPages, api, BASE } from '../../../../../process/tools/instatic-api-sync/insta-api.mjs'
// Usage: node snapshot-staging.mjs [folder]  — never reuse a folder, it is overwritten.
const out = new URL(`./${process.argv[2] || 'backup-staging-2026-09-15'}/`, import.meta.url)
fs.mkdirSync(out, { recursive: true })
const site = await getSite(); const pages = await getPages()
fs.writeFileSync(new URL('site.json', out), JSON.stringify(site)); fs.writeFileSync(new URL('pages.json', out), JSON.stringify(pages))
const media = await api('GET', '/admin/api/cms/media?limit=500')
const list = media.assets || media.items || media.media || media
const ids = new Set((Array.isArray(list) ? list : []).map((m) => m.id))
const map = JSON.parse(fs.readFileSync(new URL('./media-map.json', import.meta.url), 'utf8')).map
const missing = Object.entries(map).filter(([, v]) => !ids.has(v.id)).map(([k]) => k)
console.log('base', BASE, 'seq', site.seq, 'pages', (pages.rows || pages).length, 'media', ids.size, 'map ids missing on staging:', missing.length, missing.slice(0, 5))
