#!/usr/bin/env node
// The local post archive (13-content-export-import/.tmp/posts.json, read by site-src/gen-blog.mjs)
// takes the live rows' title, SEO title/description and body (SEO v3: one H1, descriptions written
// from the articles, the practice's former name gone). date / oldUrl / words stay local facts.
//   node seo-v3/sync-local-posts.mjs        (host = INSTATIC_BASE_URL, production by default)
import { readFileSync, writeFileSync } from 'node:fs'
import { api } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'
const FILE = new URL('../../13-content-export-import/.tmp/posts.json', import.meta.url)
const local = JSON.parse(readFileSync(FILE, 'utf8'))
const { rows } = await api('GET', '/admin/api/cms/data/tables/posts/rows')
let n = 0
for (const p of local) {
  const r = rows.find((x) => (x.cells?.slug ?? x.slug) === p.slug)
  if (!r) { console.log('no live row for', p.slug); continue }
  const c = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row.cells
  const next = { ...p, title: c.title, seoTitle: c.seoTitle, seoDescription: c.seoDescription, body: c.body }
  if (JSON.stringify(next) !== JSON.stringify(p)) { Object.assign(p, next); n++ }
}
writeFileSync(FILE, JSON.stringify(local, null, 1) + '\n')
console.log(`posts.json: ${n} of ${local.length} updated from the live rows`)
