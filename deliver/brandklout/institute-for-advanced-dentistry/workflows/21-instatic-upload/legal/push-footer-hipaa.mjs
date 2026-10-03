/**
 * Add "HIPAA Disclosure" to the footer legal row (`ul#menu-legal-footer`) of every PRODUCTION page,
 * right after Privacy Policy. The footer is inlined in each page (WordPress clone, no component), so
 * this edits that one <ul> on each page and nothing else.
 *
 * Markup = its neighbours': a `' '` text node, then <li class="menu-item menu-item-type-post_type
 * menu-item-object-page bricks-menu-item"> > <a href target=_self>. The classes are the generic ones
 * the WordPress items carry (their per-item `menu-item-<n>` / `menu-item-privacy-policy` / id are not
 * copied). On /hipaa-disclosure itself the link gets aria-current="page", as Privacy Policy does on its page.
 *
 *   node push-footer-hipaa.mjs                      dry run
 *   node push-footer-hipaa.mjs --apply --publish    write all pages in one incremental PUT, restore the
 *                                                   SEO cells the write drops, publish if nothing else moved
 *
 * The rebuilt site (staging) gets the link from site-src/partials/footer.html instead.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
for (let dir = HERE; ; dir = path.dirname(dir)) {
  const env = path.join(dir, '.env')
  if (fs.existsSync(env)) {
    for (const l of fs.readFileSync(env, 'utf8').split(/\r?\n/)) {
      const m = l.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
    break
  }
  if (path.dirname(dir) === dir) throw new Error('no .env above this script')
}
const toolkit = path.resolve(HERE, '../../../../../..', 'deliver/process/tools/instatic-api-sync/insta-api.mjs')
const { getPages, getSite, api, publish, publishStatus, toChangedPage, assertTemplatesIntact, templateMap, BASE } = await import(pathToFileURL(toolkit).href)
const host = new URL(BASE).hostname
if (!['www.ifadentistry.com', 'institute-for-advanced-dentistry-production.up.railway.app'].includes(host)) {
  throw new Error(`refusing: ${host} is not IFA production (staging gets the link from site-src)`)
}
console.log(`host       ${BASE}`)
const apply = process.argv.includes('--apply')
const doPublish = process.argv.includes('--publish')
const HREF = '/hipaa-disclosure'
const LABEL = 'HIPAA Disclosure'
const LI_CLASSES = ['menu-item', 'menu-item-type-post_type', 'menu-item-object-page', 'bricks-menu-item']
const nid = () => crypto.randomBytes(16).toString('base64url').slice(0, 21)

function findAll(nodes, id, test, out = []) {
  const n = nodes[id]
  if (!n) return out
  if (test(n)) out.push(n)
  for (const c of n.children ?? []) findAll(nodes, c, test, out)
  return out
}
const hrefsUnder = (nodes, id) => findAll(nodes, id, (n) => n.moduleId === 'base.link').map((n) => n.props.href)

const before = await publishStatus()
console.log(`publish    draftMatchesPublished=${before.draftMatchesPublished} draft ${before.draftPages} / published ${before.publishedPages}`)
if (before.draftMatchesPublished !== true) throw new Error('the draft already differs from live: someone has unpublished work here. Not writing.')

const { site, seq } = await getSite()
const nameOf = (cid) => site.styleRules?.[cid]?.name ?? site.styleRules?.[cid]?.selector ?? null
const classIdByName = {}
for (const [cid, r] of Object.entries(site.styleRules ?? {})) {
  const name = r?.name ?? r?.selector
  if (LI_CLASSES.includes(name) && !classIdByName[name]) classIdByName[name] = cid
}

const list = (await getPages()).rows
const fingerprint = (rs) => rs.map((r) => `${r.id}:${r.seq}:${r.updatedAt}`).sort().join('|')
const changedPages = []
const baseSeqs = {}
const seo = []
let present = 0
for (const lr of list) {
  const full = await api('GET', `/admin/api/cms/data/rows/${lr.id}`)
  const row = { ...lr, ...(full.row ?? full), cells: (full.row ?? full).cells }
  const slug = row.cells.slug
  const nodes = structuredClone(row.cells.body.nodes)
  const rootNodeId = row.cells.body.rootNodeId
  const ul = findAll(nodes, rootNodeId, (n) => n.props?.htmlAttributes?.id === 'menu-legal-footer')[0]
  if (!ul) throw new Error(`${slug}: no ul#menu-legal-footer`)
  if (hrefsUnder(nodes, ul.id).includes(HREF)) { present++; continue }
  const privacyLi = ul.children.find((c) => hrefsUnder(nodes, c).includes('/privacy-policy'))
  if (!privacyLi) throw new Error(`${slug}: no Privacy Policy item in the legal row`)
  // the generic classes, by id, exactly as the WordPress neighbour carries them
  const liClassIds = nodes[privacyLi].classIds.filter((cid) => LI_CLASSES.includes(nameOf(cid)))
  if (liClassIds.length !== LI_CLASSES.length) throw new Error(`${slug}: Privacy Policy li has ${liClassIds.map(nameOf)}; expected ${LI_CLASSES}`)

  const liId = nid(); const aId = nid(); const sepId = nid()
  nodes[aId] = { id: aId, moduleId: 'base.link', props: { href: HREF, text: LABEL, target: '_self', htmlAttributes: slug === 'hipaa-disclosure' ? { 'aria-current': 'page' } : {} }, breakpointOverrides: {}, children: [], classIds: [], parentId: liId }
  nodes[liId] = { id: liId, moduleId: 'base.container', props: { tag: 'custom', customTag: 'li', htmlAttributes: {} }, breakpointOverrides: {}, children: [aId], classIds: liClassIds, parentId: ul.id }
  nodes[sepId] = { id: sepId, moduleId: 'base.text', props: { text: ' ', tag: 'none', htmlAttributes: {} }, breakpointOverrides: {}, children: [], classIds: [], parentId: ul.id }
  const kids = [...ul.children]
  kids.splice(kids.indexOf(privacyLi) + 1, 0, sepId, liId)
  nodes[ul.id] = { ...ul, children: kids }

  changedPages.push(toChangedPage(row, { nodes, rootNodeId }))
  baseSeqs[row.id] = row.seq
  if (row.cells.seoTitle !== undefined || row.cells.seoDescription !== undefined) seo.push({ id: row.id, slug, seoTitle: row.cells.seoTitle, seoDescription: row.cells.seoDescription })
}
console.log(`footer     adding to ${changedPages.length} page(s), already present on ${present}; li classes ${LI_CLASSES.join(' ')}`)
console.log(`seo        ${seo.length} row(s) carry SEO cells to restore after the write`)
if (!apply) { console.log('\ndry run: --apply [--publish]'); process.exit(0) }
if (!changedPages.length) { console.log('nothing to write'); process.exit(0) }

const templatesBefore = await templateMap()
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site, shellBaseSeq: seq, changedPages, deletedPageIds: [],
  changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [], baseSeqs,
})
console.log('saved:', JSON.stringify(res).slice(0, 200))

for (const s of seo) {
  const cur = await api('GET', `/admin/api/cms/data/rows/${s.id}`)
  const cells = { ...((cur.row ?? cur).cells) }
  if (!cells.slug || !Object.keys(cells.body?.nodes ?? {}).length) throw new Error(`${s.slug}: row missing body/slug before the SEO merge`)
  if (s.seoTitle !== undefined) cells.seoTitle = s.seoTitle
  if (s.seoDescription !== undefined) cells.seoDescription = s.seoDescription
  await api('PATCH', `/admin/api/cms/data/rows/${s.id}`, { cells })
  const back = (await api('GET', `/admin/api/cms/data/rows/${s.id}`))
  const bc = (back.row ?? back).cells
  if (bc.seoTitle !== s.seoTitle || !hrefsUnder(bc.body.nodes, bc.body.rootNodeId).includes(HREF)) throw new Error(`${s.slug}: SEO restore or link lost`)
}
console.log(`seo        restored on ${seo.length}`)
await assertTemplatesIntact(templatesBefore)

const mine = new Set(changedPages.map((p) => p.id))
const after = (await getPages()).rows
const othersSame = fingerprint(after.filter((r) => !mine.has(r.id))) === fingerprint(list.filter((r) => !mine.has(r.id)))
console.log(`rows       ${after.length} stored (was ${list.length}); rows not written unchanged: ${othersSame}`)
if (!doPublish) { console.log('\ndraft written; not published'); process.exit(0) }
if (!othersSame || after.length !== list.length) { console.error('NOT PUBLISHING: something else changed while this ran.'); process.exit(1) }
console.log('published:', JSON.stringify(await publish()).slice(0, 200))
console.log('status:', JSON.stringify(await publishStatus()))
