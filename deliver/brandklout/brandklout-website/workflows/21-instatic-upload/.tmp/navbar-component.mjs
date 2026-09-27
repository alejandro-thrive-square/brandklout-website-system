/* Swap every page's hard-coded primary nav for the NavBar visual component (2026-09-16, Alejandro:
   "apply that component to all of the pages and remove the old nav bar", nav only, no page re-push).
   Per page: drop the <nav aria-label="Primary"> subtree, put a base.visual-component-ref at the same
   index under the same parent. Nothing else in the page is touched; SEO cells are read-merge-written.
     node navbar-component.mjs            # dry run
     node navbar-component.mjs --apply    # write the draft
     node navbar-component.mjs --publish  # publish */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../../../..')
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
process.env.INSTATIC_BASE_URL ||= 'https://brandklout-production.up.railway.app'
const { api, getSite, getPages, publish, publishStatus, toChangedPage, assertTemplatesIntact } =
  await import('../../../../../process/22-instatic-api-sync/insta-api.mjs')
const APPLY = process.argv.includes('--apply')
if (process.argv.includes('--publish')) {
  console.log('status before:', JSON.stringify(await publishStatus()))
  console.log('publish:', JSON.stringify(await publish()))
  process.exit(0)
}
const ALPHA = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const newId = () => Array.from(crypto.randomBytes(21), (b) => ALPHA[b & 63]).join('')

const comps = (await api('GET', '/admin/api/cms/components')).rows
const nav = comps.find((c) => c.cells.slug === 'navbar')
if (!nav) throw new Error('NavBar component not found')
console.log('status:', JSON.stringify(await publishStatus()))

const { site, seq: shellBaseSeq } = await getSite()
const changedPages = [], baseSeqs = {}, seoKeep = {}, templates = {}
for (const r of (await getPages()).rows) {
  const row = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row
  const c = row.cells
  if (c.templateEnabled === true) templates[c.slug] = true
  const N = c.body?.nodes
  if (!N) { console.log(`${c.slug}: NO BODY, skipped`); continue }
  const refs = Object.values(N).filter((n) => n.moduleId === 'base.visual-component-ref' && n.props?.componentId === nav.id)
  const olds = Object.values(N).filter((n) => n.props?.htmlAttributes?.['aria-label'] === 'Primary' && (n.props?.tag === 'nav' || n.props?.customTag === 'nav'))
  if (!olds.length) { console.log(`${c.slug.padEnd(40)} already component (${refs.length} ref)`); continue }
  if (olds.length > 1 || refs.length) throw new Error(`${c.slug}: ${olds.length} old navs, ${refs.length} refs — unexpected, stopping`)
  const old = olds[0], parent = N[old.parentId], at = parent.children.indexOf(old.id)
  const nodes = structuredClone(N)
  const doomed = [old.id]
  for (let i = 0; i < doomed.length; i++) doomed.push(...(nodes[doomed[i]].children ?? []))
  for (const id of doomed) delete nodes[id]
  const id = newId()
  nodes[id] = { props: { componentId: nav.id, propOverrides: {} }, breakpointOverrides: {}, children: [], id, moduleId: 'base.visual-component-ref', classIds: [], parentId: parent.id }
  nodes[parent.id].children.splice(at, 1, id)
  const before = Object.keys(N).length, after = Object.keys(nodes).length
  if (after !== before - doomed.length + 1) throw new Error(`${c.slug}: node count off`)
  changedPages.push(toChangedPage(row, { nodes, rootNodeId: c.body.rootNodeId }))
  baseSeqs[row.id] = row.seq
  seoKeep[row.id] = { slug: c.slug, seoTitle: c.seoTitle, seoDescription: c.seoDescription, n: after }
  console.log(`${c.slug.padEnd(40)} nav (${doomed.length} nodes) -> component at ${parent.moduleId}[${at}]  ${before} -> ${after}`)
}
console.log(`\n${changedPages.length} pages to change`)
if (!APPLY) { console.log('DRY RUN — re-run with --apply'); process.exit(0) }

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site, changedPages, deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [], baseSeqs, shellBaseSeq,
})
console.log('saved:', JSON.stringify(res).slice(0, 200))

for (const [id, k] of Object.entries(seoKeep)) {
  const cur = (await api('GET', `/admin/api/cms/data/rows/${id}`)).row
  const cells = { ...cur.cells }
  if (!cells.body || !cells.slug) throw new Error(`${k.slug}: body/slug missing after save — not patching`)
  if (k.seoTitle !== undefined) cells.seoTitle = k.seoTitle
  if (k.seoDescription !== undefined) cells.seoDescription = k.seoDescription
  await api('PATCH', `/admin/api/cms/data/rows/${id}`, { cells })
  const a = (await api('GET', `/admin/api/cms/data/rows/${id}`)).row.cells
  const n = Object.keys(a.body?.nodes ?? {}).length
  const ok = a.slug === k.slug && n === k.n && a.seoTitle === k.seoTitle
  console.log(`${k.slug.padEnd(40)} ${ok ? 'ok' : 'MISMATCH'} nodes ${n} seo "${a.seoTitle ?? ''}"`)
  if (!ok) process.exitCode = 1
}
await assertTemplatesIntact(templates)
console.log('templates intact:', Object.keys(templates).join(', '))
