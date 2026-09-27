/* Footer as a visual component on every page (2026-09-16, Alejandro: "same for the footer ... just the
   footer, like we did on the navbar"). The component is built from the HOME page's footer, the only one
   carrying the office address. Per page: drop the <footer> subtree, put a base.visual-component-ref at
   the same index. Nothing else is touched; SEO cells are read-merge-written.
     node footer-component.mjs            # dry run
     node footer-component.mjs --apply    # create the component (if missing) + write the pages
     node footer-component.mjs --publish */
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
const isFooter = (n) => n.props?.tag === 'footer' || n.props?.customTag === 'footer'
const subtree = (N, id) => { const out = [id]; for (let i = 0; i < out.length; i++) out.push(...(N[out[i]].children ?? [])); return out }

console.log('status:', JSON.stringify(await publishStatus()))
const rows = []
for (const r of (await getPages()).rows) rows.push((await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row)

// 1. the component
let comp = (await api('GET', '/admin/api/cms/components')).rows.find((c) => c.cells.slug === 'footer' || c.cells.name === 'Footer')
if (comp) console.log('component exists:', comp.id)
else {
  const home = rows.find((r) => r.cells.slug === 'index')
  const HN = home.cells.body.nodes
  const f = Object.values(HN).filter(isFooter)
  if (f.length !== 1) throw new Error(`home has ${f.length} footers`)
  const ids = subtree(HN, f[0].id), map = Object.fromEntries(ids.map((id) => [id, newId()]))
  const rootId = newId(), nodes = {}
  for (const id of ids) {
    const n = structuredClone(HN[id])
    n.id = map[id]
    n.children = (n.children ?? []).map((k) => map[k])
    n.parentId = id === f[0].id ? rootId : map[n.parentId]
    nodes[n.id] = n
  }
  nodes[rootId] = { id: rootId, moduleId: 'base.body', props: {}, breakpointOverrides: {}, children: [map[f[0].id]], classIds: [], parentId: null }
  comp = { id: newId(), name: 'Footer', tree: { nodes, rootNodeId: rootId }, params: [], classIds: [], createdAt: Date.now() }
  console.log(`component to create: ${comp.id}, ${ids.length} nodes from home's footer`)
}
const compId = comp.id

// 2. the pages
const changedPages = [], baseSeqs = {}, seoKeep = {}, templates = {}
for (const row of rows) {
  const c = row.cells
  if (c.templateEnabled === true) templates[c.slug] = true
  const N = c.body?.nodes
  if (!N) { console.log(`${c.slug}: NO BODY, skipped`); continue }
  const refs = Object.values(N).filter((n) => n.moduleId === 'base.visual-component-ref' && n.props?.componentId === compId)
  const olds = Object.values(N).filter(isFooter)
  if (!olds.length && refs.length) { console.log(`${c.slug.padEnd(40)} already component`); continue }
  if (olds.length !== 1 || refs.length) throw new Error(`${c.slug}: ${olds.length} footers, ${refs.length} refs — unexpected, stopping`)
  const old = olds[0], parent = N[old.parentId], at = parent.children.indexOf(old.id)
  const nodes = structuredClone(N), doomed = subtree(N, old.id)
  for (const id of doomed) delete nodes[id]
  const id = newId()
  nodes[id] = { props: { componentId: compId, propOverrides: {} }, breakpointOverrides: {}, children: [], id, moduleId: 'base.visual-component-ref', classIds: [], parentId: parent.id }
  nodes[parent.id].children.splice(at, 1, id)
  const before = Object.keys(N).length, after = Object.keys(nodes).length
  if (after !== before - doomed.length + 1) throw new Error(`${c.slug}: node count off`)
  changedPages.push(toChangedPage(row, { nodes, rootNodeId: c.body.rootNodeId }))
  baseSeqs[row.id] = row.seq
  seoKeep[row.id] = { slug: c.slug, seoTitle: c.seoTitle, seoDescription: c.seoDescription, n: after }
  console.log(`${c.slug.padEnd(40)} footer (${doomed.length} nodes) -> component at ${parent.moduleId}[${at}/${parent.children.length}]  ${before} -> ${after}`)
}
console.log(`\n${changedPages.length} pages to change`)
if (!APPLY) { console.log('DRY RUN — re-run with --apply'); process.exit(0) }

const save = async (extra) => {
  const { site, seq: shellBaseSeq } = await getSite()
  return api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental', site, changedPages: [], deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
    changedLayouts: [], deletedLayoutIds: [], baseSeqs: {}, shellBaseSeq, ...extra,
  })
}
if (!comp.cells) {
  console.log('component saved:', JSON.stringify(await save({ changedComponents: [comp] })).slice(0, 200))
  const back = (await api('GET', '/admin/api/cms/components')).rows.find((c) => c.id === compId)
  const n = Object.keys(back?.cells?.body?.nodes ?? {}).length
  if (n !== Object.keys(comp.tree.nodes).length) throw new Error(`component read-back has ${n} nodes — stopping before pages`)
  console.log(`component read back: ${back.cells.name} (${back.cells.slug}), ${n} nodes`)
}
console.log('pages saved:', JSON.stringify(await save({ changedPages, baseSeqs })).slice(0, 200))

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
  console.log(`${k.slug.padEnd(40)} ${ok ? 'ok' : 'MISMATCH'} nodes ${n}`)
  if (!ok) process.exitCode = 1
}
await assertTemplatesIntact(templates)
console.log('templates intact:', Object.keys(templates).join(', '))
