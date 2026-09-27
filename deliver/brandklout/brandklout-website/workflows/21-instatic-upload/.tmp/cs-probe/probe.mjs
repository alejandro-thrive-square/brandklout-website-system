import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../../../../..')
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
process.env.INSTATIC_BASE_URL ||= 'https://brandklout-production.up.railway.app'
const { api, getPages, BASE } = await import('../../../../../../process/22-instatic-api-sync/insta-api.mjs')
const pages = await getPages()
fs.writeFileSync(path.join(HERE, 'pages.json'), JSON.stringify(pages, null, 1))
const rows = Array.isArray(pages) ? pages : pages.pages ?? pages.rows ?? []
const summary = rows.map((r) => ({ id: r.id, slug: r.slug ?? r.cells?.slug, title: r.title ?? r.cells?.title, keys: Object.keys(r), nodes: JSON.stringify(r).length }))
console.log(BASE, rows.length)
for (const s of summary) console.log(JSON.stringify(s))
