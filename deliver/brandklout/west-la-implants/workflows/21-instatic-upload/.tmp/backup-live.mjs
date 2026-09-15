/* Full backup of the live Instatic site before a --force re-import (copied from the Brandklout website worktree): the admin's site shell (styles, assets,
   settings) and every page row as the API returns them, plus each route's published HTML. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../../../..')
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { getSite, getPages, BASE } = await import('../../../../../process/22-instatic-api-sync/insta-api.mjs')
const OUT = path.join(HERE, process.argv[2] || 'backup-live') // e.g. backup-2026-09-15-pre-round-two
fs.mkdirSync(path.join(OUT, 'html'), { recursive: true })
const site = await getSite()
fs.writeFileSync(path.join(OUT, 'site.json'), JSON.stringify(site, null, 1))
const pages = await getPages()
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages, null, 1))
const rows = Array.isArray(pages) ? pages : pages.pages ?? pages.rows ?? []
const slugs = rows.map((r) => r.slug ?? r.cells?.slug).filter((s) => s !== undefined)
let n = 0
for (const slug of slugs) {
  const route = slug === '' || slug === 'index' ? '/' : '/' + slug
  const r = await fetch(BASE + route, { headers: { 'user-agent': 'Mozilla/5.0' } })
  fs.writeFileSync(path.join(OUT, 'html', (route === '/' ? 'index' : slug) + '.html'), await r.text())
  n++
}
console.log(JSON.stringify({ base: BASE, seq: site.seq ?? site.site?.seq ?? site.shellBaseSeq, pageRows: rows.length, htmlSaved: n, keys: Object.keys(site) }))
