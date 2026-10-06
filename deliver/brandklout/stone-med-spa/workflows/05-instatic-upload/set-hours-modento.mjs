#!/usr/bin/env node
/**
 * set-hours-modento.mjs — 2026-10-06 client request (via Jessica): hours Mon–Fri 9am–5pm, and the
 * Modento online-booking link on the site. Three edits, nothing else:
 *
 *   1. Footer hours table (every page): Wed 9:00AM – 3:00PM and Fri 9:00AM – 4:00PM -> 9:00AM – 5:00PM.
 *      The seven-row table stays (Sat and Sun already read Closed).
 *   2. The "Hours" fact (/, /about, /book): five lines -> "Mon – Fri: 9:00 AM – 5:00 PM" and
 *      "Sat & Sun: Closed"; the Wed/Thu/Fri lines and their <br> nodes are removed.
 *   3. /book: "Prefer to pick a time yourself? Book online." between the form title and the GHL
 *      form, a clone of the privacy note under the form (same class on whichever instance), linking
 *      https://book.modento.io/stonesurgicalarts/patient-details (the user's choice, 2026-10-06).
 *
 * String-level node edits on what the instance holds, not a push from local source: staging carries
 * the 2026-10-05 class renames and production does not. Idempotent: a second run finds nothing.
 *
 *   node set-hours-modento.mjs                       dry run against INSTATIC_BASE_URL
 *   node set-hours-modento.mjs --apply               back up, write the drafts, re-apply SEO cells
 *   node set-hours-modento.mjs --apply --publish     ... and publish, after the guard below
 *
 *      The link carries text-style-link (underlined), looked up by name per instance.
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
const FOOTER_OLD = { Wed: '9:00AM – 3:00PM', Fri: '9:00AM – 4:00PM' }
const FOOTER_NEW = '9:00AM – 5:00PM'
const FACT_OLD = ['Mon & Tue: 9:00 AM – 5:00 PM', 'Wed: 9:00 AM – 3:00 PM', 'Thu: 9:00 AM – 5:00 PM', 'Fri: 9:00 AM – 4:00 PM', 'Sat & Sun: Closed']
const FACT_NEW = 'Mon – Fri: 9:00 AM – 5:00 PM'
const nid = () => crypto.randomBytes(16).toString('base64url').slice(0, 21)

const textOf = (n) => (n?.moduleId === 'base.text' ? n.props?.text : null)
const isBr = (n) => n?.moduleId === 'base.container' && n.props?.customTag === 'br'
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

// The footer is inlined per page here; refuse if a shared component carries the hours too.
// The link's class: text-style-link (underline), looked up by name — ids differ per instance. The
// privacy note's own link has no class and renders as plain grey text, which a booking link cannot be.
const linkClass = Object.values(siteRes.site.styleRules ?? {}).find((s) => s.kind === 'class' && s.name === 'text-style-link')?.id
if (!linkClass) throw new Error('no text-style-link class in the style registry')

const comps = await api('GET', '/admin/api/cms/components').catch(() => null)
const compHits = JSON.stringify(comps ?? '').match(/9:00AM – [34]:00PM|Wed: 9:00 AM – 3:00 PM/g)
if (compHits) throw new Error(`a shared component carries the old hours (${compHits.length} hit(s)) — this script edits pages only`)

const changed = [], full = {}
let nFooter = 0, nFact = 0, nModento = 0
for (const r of rows) {
  const row = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row
  const nodes = row.cells.body?.nodes
  if (!nodes) continue
  const notes = []

  for (const n of Object.values(nodes)) {
    const day = Object.keys(FOOTER_OLD).find((d) => textOf(n) === FOOTER_OLD[d])
    if (!day) continue
    if (dtFor(nodes, n) !== day) throw new Error(`/${r.slug}: "${textOf(n)}" is not in the ${day} row (row says ${dtFor(nodes, n)}) — refusing`)
    n.props.text = FOOTER_NEW
    nFooter++; notes.push(`footer ${day}`)
  }

  for (const n of Object.values(nodes).filter((x) => textOf(x) === FACT_OLD[0])) {
    const dd = nodes[n.parentId]
    const kids = dd.children.map((c) => nodes[c])
    const ok = kids.length === 9 && FACT_OLD.every((t, i) => textOf(kids[i * 2]) === t) && [1, 3, 5, 7].every((i) => isBr(kids[i]))
    if (!ok) throw new Error(`/${r.slug}: the Hours fact (${dd.id}) is not the five-line shape — refusing`)
    n.props.text = FACT_NEW
    for (const k of kids.slice(1, 7)) delete nodes[k.id]
    dd.children = [kids[0].id, kids[7].id, kids[8].id]
    nFact++; notes.push('hours fact')
  }

  // first run (2026-10-06 21:14) shipped the link without a class: give it one
  for (const n of Object.values(nodes).filter((x) => x.moduleId === 'base.link' && x.props?.href === MODENTO && !(x.classIds ?? []).includes(linkClass))) {
    n.classIds = [...(n.classIds ?? []), linkClass]
    notes.push('modento link class')
  }

  if (r.slug === 'book' && !Object.values(nodes).some((n) => n.props?.href === MODENTO)) {
    const slot = Object.values(nodes).find((n) => n.props?.htmlAttributes?.['data-embed'] === 'ghl-form')
    const form = slot && nodes[slot.parentId]
    const priv = form?.children.map((c) => nodes[c]).find((n) => n?.props?.customTag === 'p' && n.children.some((c) => nodes[c]?.props?.href === '/privacy-policy'))
    if (!priv) throw new Error('/book: no form slot with a privacy note beside it — refusing')
    const [t0, link0] = priv.children.map((c) => nodes[c])
    if (textOf(t0) == null || link0?.moduleId !== 'base.link') throw new Error('/book: privacy note is not text + link — refusing')
    const p = { ...structuredClone(priv), id: nid(), children: [] }
    const t1 = { ...structuredClone(t0), id: nid(), parentId: p.id, props: { ...structuredClone(t0.props), text: 'Prefer to pick a time yourself? ' }, children: [] }
    const ln = { ...structuredClone(link0), id: nid(), parentId: p.id, classIds: [linkClass], props: { ...structuredClone(link0.props), href: MODENTO, text: 'Book online', target: '_self', htmlAttributes: {} }, children: [] }
    const t2 = { ...structuredClone(t0), id: nid(), parentId: p.id, props: { ...structuredClone(t0.props), text: '.' }, children: [] }
    p.children = [t1.id, ln.id, t2.id]
    for (const x of [p, t1, ln, t2]) nodes[x.id] = x
    form.children.splice(form.children.indexOf(slot.id), 0, p.id)
    nModento++; notes.push(`modento note ${p.id} before the form`)
  }

  if (notes.length) {
    changed.push(r); full[r.id] = row
    console.log(`/${r.slug === 'index' ? '' : r.slug}`.padEnd(22) + notes.join(', '))
  }
}

console.log(`\ntarget   ${BASE}  ${changed.length} page(s): ${nFooter} footer value(s), ${nFact} hours fact(s), ${nModento} Modento note(s)`)
if (!APPLY) { console.log('DRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }
if (!changed.length) { console.log('nothing to write'); process.exit(0) }
if (PUBLISH && !status0.draftMatchesPublished) throw new Error('the draft already differs from live — publishing would carry someone else\'s edits. Stopped before writing.')

const label = /staging/.test(BASE) ? 'staging' : 'prod'
const bak = path.join(HERE, '.tmp', `backup-${label}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}-seq${seq}-pre-hours-modento`)
fs.mkdirSync(bak, { recursive: true })
fs.writeFileSync(path.join(bak, 'site.json'), JSON.stringify(siteRes))
fs.writeFileSync(path.join(bak, 'pages.json'), JSON.stringify(pagesRes))
fs.writeFileSync(path.join(bak, 'status.json'), JSON.stringify(status0))
for (const r of changed) fs.writeFileSync(path.join(bak, `row-${r.slug}.json`), JSON.stringify((await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row))
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

/* read back: node counts, the new texts, SEO cells back on (PUT /site-document drops them) */
let restored = 0
for (const r of changed) {
  const want = full[r.id].cells
  const cur = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row.cells
  if (!cur.body || cur.slug !== want.slug) throw new Error(`/${r.slug}: row missing body/slug after the save`)
  const n = Object.keys(cur.body.nodes).length
  if (n !== Object.keys(want.body.nodes).length) throw new Error(`/${r.slug}: ${n} nodes after the save, expected ${Object.keys(want.body.nodes).length}`)
  const s = JSON.stringify(cur.body.nodes)
  if (/9:00AM – [34]:00PM|Wed: 9:00 AM – 3:00 PM|Fri: 9:00 AM – 4:00 PM/.test(s)) throw new Error(`/${r.slug}: old hours still in the saved row`)
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
