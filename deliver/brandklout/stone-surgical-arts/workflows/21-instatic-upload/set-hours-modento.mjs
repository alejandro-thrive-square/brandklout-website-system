#!/usr/bin/env node
/**
 * set-hours-modento.mjs — 2026-10-06 client request (via Jessica): hours Mon–Fri 9am–5pm, and the
 * Modento online-booking link on the site. The site already read Mon–Fri 9–5; Saturday "by
 * appointment" goes (the user's call: Saturday closed). Three edits, nothing else:
 *
 *   1. Footer hours table (every page): Saturday "By appointment" -> "Closed".
 *   2. The "Hours" fact (contact sections, /book twice): "Saturday by appointment" -> "Closed on weekends".
 *   3. Footer page list (nav aria-label="Footer", every page): "Book online" right after "Book a
 *      consultation", a clone of that link (same class, aria-current dropped), linking
 *      https://book.modento.io/stonesurgicalarts/patient-details. /book already links Modento three times.
 *
 * String-level node edits on what the instance holds, not a push from local source: staging carries
 * BugHerd round two and the 2026-10-05 class renames, production does not. Idempotent.
 *
 *   node set-hours-modento.mjs                       dry run against INSTATIC_BASE_URL
 *   node set-hours-modento.mjs --apply               back up, write the drafts, re-apply SEO cells
 *   node set-hours-modento.mjs --apply --publish     ... and publish, after the guard below
 *
 * PUBLISH GUARD: the draft must match live before the write, and before publishing the shell seq
 * must be unchanged and no row other than the ones written may have moved.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { api, getSite, getPages, publish, publishStatus, toChangedPage, BASE } from '../../../../process/tools/instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const MODENTO = 'https://book.modento.io/stonesurgicalarts/patient-details'
const nid = () => crypto.randomBytes(16).toString('base64url').slice(0, 21)

const textOf = (n) => (n?.moduleId === 'base.text' ? n.props?.text : null)
function dtFor(nodes, valueNode) { // value text -> dd -> row -> the row's dt text
  const dd = nodes[valueNode.parentId], row = dd && nodes[dd.parentId]
  const dt = row?.children.map((c) => nodes[c]).find((n) => n?.props?.customTag === 'dt')
  return dt ? textOf(nodes[dt.children?.[0]]) : null
}

const status0 = await publishStatus()
const siteRes = await getSite()
const pagesRes = await getPages()
const { seq } = siteRes
const rows = pagesRes.rows ?? []
console.log(`${BASE}\nstatus   draftMatchesPublished=${status0.draftMatchesPublished}; shell seq ${seq}; ${rows.length} pages`)

const comps = await api('GET', '/admin/api/cms/components').catch(() => null)
if (/By appointment|by appointment/.test(JSON.stringify(comps ?? ''))) throw new Error('a shared component carries "by appointment" — this script edits pages only')

const changed = [], full = {}
let nFooter = 0, nFact = 0, nLink = 0
const missingNav = []
for (const r of rows) {
  const row = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row
  const nodes = row.cells.body?.nodes
  if (!nodes) continue
  const notes = []

  for (const n of Object.values(nodes)) {
    if (textOf(n) === 'By appointment') {
      if (dtFor(nodes, n) !== 'Saturday') throw new Error(`/${r.slug}: "By appointment" is not in the Saturday row (${dtFor(nodes, n)}) — refusing`)
      n.props.text = 'Closed'
      nFooter++; notes.push('footer Saturday')
    } else if (textOf(n) === 'Saturday by appointment') {
      n.props.text = 'Closed on weekends'
      nFact++; notes.push('hours fact')
    } else if (/by appointment/i.test(textOf(n) ?? '') && /saturday/i.test(textOf(n))) {
      throw new Error(`/${r.slug}: unexpected Saturday wording "${textOf(n)}" — add it to this script`)
    }
  }

  const nav = Object.values(nodes).find((n) => n.props?.htmlAttributes?.['aria-label'] === 'Footer')
  if (!nav) missingNav.push(r.slug)
  else if (!nav.children.some((c) => nodes[c]?.props?.href === MODENTO)) {
    const book = nav.children.map((c) => nodes[c]).find((n) => n?.moduleId === 'base.link' && n.props?.href === '/book')
    if (!book) throw new Error(`/${r.slug}: footer nav has no /book link — refusing`)
    const attrs = { ...(book.props.htmlAttributes ?? {}) }
    delete attrs['aria-current']
    const link = { ...structuredClone(book), id: nid(), props: { ...structuredClone(book.props), href: MODENTO, text: 'Book online', target: '_self', htmlAttributes: attrs }, children: [] }
    nodes[link.id] = link
    nav.children.splice(nav.children.indexOf(book.id) + 1, 0, link.id)
    nLink++; notes.push(`footer link ${link.id}`)
  }

  if (notes.length) {
    changed.push(r); full[r.id] = row
    console.log(`/${r.slug === 'index' ? '' : r.slug}`.padEnd(34) + notes.join(', '))
  }
}
if (missingNav.length) console.log(`note     no footer nav on: ${missingNav.map((s) => '/' + s).join(' ')}`)

console.log(`\ntarget   ${BASE}  ${changed.length} page(s): ${nFooter} footer Saturday, ${nFact} hours fact(s), ${nLink} footer link(s)`)
if (!APPLY) { console.log('DRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }
if (!changed.length) { console.log('nothing to write'); process.exit(0) }
if (PUBLISH && !status0.draftMatchesPublished) throw new Error('the draft already differs from live — publishing would carry someone else\'s edits. Stopped before writing.')

const label = /staging/.test(BASE) ? 'staging' : 'prod'
const bak = path.join(HERE, '.tmp', `backup-${label}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}-seq${seq}-pre-hours-modento`)
fs.mkdirSync(bak, { recursive: true })
fs.writeFileSync(path.join(bak, 'site.json'), JSON.stringify(siteRes))
fs.writeFileSync(path.join(bak, 'pages.json'), JSON.stringify(pagesRes))
fs.writeFileSync(path.join(bak, 'status.json'), JSON.stringify(status0))
for (const r of changed) fs.writeFileSync(path.join(bak, `row-${r.slug.replace(/[\\/]/g, '__')}.json`), JSON.stringify((await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row))
console.log(`backup   ${path.relative(HERE, bak)}`)

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site: siteRes.site,
  changedPages: changed.map((r) => toChangedPage(full[r.id])),
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(changed.map((r) => [r.id, r.seq ?? 0])),
  shellBaseSeq: seq,
})
console.log(`saved    ${JSON.stringify(res).slice(0, 200)}`)

let restored = 0
for (const r of changed) {
  const want = full[r.id].cells
  const cur = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row.cells
  if (!cur.body || cur.slug !== want.slug) throw new Error(`/${r.slug}: row missing body/slug after the save`)
  const n = Object.keys(cur.body.nodes).length
  if (n !== Object.keys(want.body.nodes).length) throw new Error(`/${r.slug}: ${n} nodes after the save, expected ${Object.keys(want.body.nodes).length}`)
  if (/"(By appointment|Saturday by appointment)"/.test(JSON.stringify(cur.body.nodes))) throw new Error(`/${r.slug}: old Saturday wording still in the saved row`)
  if (cur.seoTitle === want.seoTitle && cur.seoDescription === want.seoDescription) continue
  await api('PATCH', `/admin/api/cms/data/rows/${r.id}`, { cells: { ...cur, seoTitle: want.seoTitle, seoDescription: want.seoDescription } })
  const back = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row.cells
  if (back.seoTitle !== want.seoTitle || back.seoDescription !== want.seoDescription || Object.keys(back.body.nodes).length !== n) throw new Error(`/${r.slug}: SEO re-apply failed`)
  restored++
}
console.log(`check    node counts and texts ok; seo re-applied on ${restored} page(s)`)

const after = (await getPages()).rows
const shellNow = (await getSite()).seq
const stray = after.filter((r) => !changed.some((c) => c.id === r.id) && r.seq !== rows.find((x) => x.id === r.id)?.seq).map((r) => `/${r.slug}`)
console.log(`guard    pages ${after.length} (was ${rows.length}); untouched rows moved ${stray.join(' ') || 'none'}; shell seq ${shellNow} (was ${seq})`)
if (!PUBLISH) { console.log('drafts written; not publishing (no --publish)'); process.exit(0) }
if (stray.length || after.length !== rows.length || shellNow !== seq) { console.log('NOT PUBLISHING: something other than this change moved in the draft.'); process.exit(1) }
console.log(`publish  ${JSON.stringify(await publish()).slice(0, 200)}`)
console.log(`status   ${JSON.stringify(await publishStatus())}`)
