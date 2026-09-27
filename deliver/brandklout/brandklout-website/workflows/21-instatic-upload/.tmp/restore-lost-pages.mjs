/* Restore /customer-stories and /book, emptied by Sang's "Restore version" on 2026-09-16
   (12:12 and 12:34 UTC; Instatic's row versions hold only title + slug). Content comes from
   site snapshot 4IhX6gyIoZ (the 11:57 UTC publish), saved beside this file; SEO from site-src/seo.json.
     node restore-lost-pages.mjs            # dry run
     node restore-lost-pages.mjs --apply    # write the draft + SEO cells
     node restore-lost-pages.mjs --publish  # publish (after --apply) */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../../../..')
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
process.env.INSTATIC_BASE_URL ||= 'https://brandklout-production.up.railway.app'
const { api, getSite, publish, publishStatus } = await import('../../../../../process/22-instatic-api-sync/insta-api.mjs')
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')

const snap = JSON.parse(fs.readFileSync(path.join(HERE, 'backup-2026-09-16-snapshot-1157-lost-pages/pages.json'), 'utf8'))
const seo = JSON.parse(fs.readFileSync(path.join(HERE, 'site/site-src/seo.json'), 'utf8'))
const seoFor = (slug) => { for (const v of Object.values(seo)) if (v && v[slug]) return v[slug]; return seo[slug] }

if (PUBLISH) {
  console.log('status before:', JSON.stringify(await publishStatus()).slice(0, 300))
  console.log('publish:', JSON.stringify(await publish()).slice(0, 300))
  process.exit(0)
}

console.log('status:', JSON.stringify(await publishStatus()).slice(0, 300))
const { site, seq: shellBaseSeq } = await getSite()
const changedPages = []
const baseSeqs = {}
for (const p of snap) {
  const cur = (await api('GET', `/admin/api/cms/data/rows/${p.id}`)).row
  const curNodes = Object.keys(cur.cells.body?.nodes ?? {}).length
  if (curNodes > 0) throw new Error(`${p.slug} already has ${curNodes} nodes — refusing to overwrite`)
  if (cur.cells.slug !== p.slug) throw new Error(`${p.id} slug mismatch ${cur.cells.slug} vs ${p.slug}`)
  if (!p.nodes?.[p.rootNodeId]) throw new Error(`${p.slug}: snapshot root node missing`)
  changedPages.push({ id: p.id, slug: p.slug, title: p.title, nodes: p.nodes, rootNodeId: p.rootNodeId })
  baseSeqs[p.id] = cur.seq
  const s = seoFor(p.slug)
  console.log(`${p.slug}: ${Object.keys(p.nodes).length} nodes from snapshot (now ${curNodes}), row seq ${cur.seq}, seo ${s ? 'yes' : 'MISSING'}`)
}
if (!APPLY) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site, changedPages, deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [], baseSeqs, shellBaseSeq,
})
console.log('saved:', JSON.stringify(res).slice(0, 200))

// SEO: PATCH replaces cells wholesale, so read, merge, send all, read back.
for (const p of snap) {
  const s = seoFor(p.slug)
  const cur = (await api('GET', `/admin/api/cms/data/rows/${p.id}`)).row
  const cells = { ...cur.cells }
  if (!cells.body || !cells.slug) throw new Error(`${p.slug}: body/slug missing after save — not patching`)
  if (s) { cells.seoTitle = s.title ?? s.seoTitle; cells.seoDescription = s.description ?? s.seoDescription }
  await api('PATCH', `/admin/api/cms/data/rows/${p.id}`, { cells })
  const after = (await api('GET', `/admin/api/cms/data/rows/${p.id}`)).row.cells
  const n = Object.keys(after.body?.nodes ?? {}).length
  if (!after.slug || n !== Object.keys(p.nodes).length) throw new Error(`${p.slug}: read-back wrong (slug=${after.slug}, nodes=${n})`)
  console.log(`${p.slug}: ${n} nodes, seoTitle="${after.seoTitle}"`)
}
console.log('\nDraft written. Publish with --publish')
