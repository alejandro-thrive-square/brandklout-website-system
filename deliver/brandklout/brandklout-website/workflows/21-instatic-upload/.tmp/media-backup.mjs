import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../../../..')
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const { api, BASE } = await import('../../../../../process/22-instatic-api-sync/insta-api.mjs')
const OUT = path.join(HERE, process.argv[2])
fs.mkdirSync(OUT, { recursive: true })
const list = await api('GET', '/admin/api/cms/media?limit=500')
const items = list.items ?? list.assets ?? list.media ?? list
fs.writeFileSync(path.join(OUT, 'media.json'), JSON.stringify(list, null, 1))
let n = 0
for (const a of items) {
  const p = a.publicPath ?? a.path ?? a.url
  if (!p) continue
  const r = await fetch(BASE + p)
  if (!r.ok) { console.log('MISS', p, r.status); continue }
  fs.writeFileSync(path.join(OUT, path.posix.basename(p)), Buffer.from(await r.arrayBuffer()))
  n++
}
console.log(JSON.stringify({ listed: items.length, saved: n, keys: Object.keys(items[0] ?? {}) }))
