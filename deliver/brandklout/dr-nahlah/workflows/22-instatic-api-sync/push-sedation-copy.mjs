#!/usr/bin/env node
/**
 * push-sedation-copy.mjs — take IV sedation and the anaesthesiologist off the
 * live site. Client instruction, Asana "Update Website" (2026-09-28):
 *
 *   "Does not do IV sedation / no anesthesiologist on team / oral and nitro
 *    only … we had an issue today with patient read that in our website."
 *
 * The practice offers NITROUS OXIDE and ORAL SEDATION, given by its own team,
 * under local anaesthetic. Everything that says otherwise is rewritten.
 *
 *   node push-sedation-copy.mjs            # plan, writes nothing
 *   node push-sedation-copy.mjs --apply    # write DRAFTS, back up first
 *
 * ## Where the claim lived — seven stores, not one
 *
 *   1. page nodes (57 pages incl. the 19 noindex ads pages the sitemap omits)
 *   2. two STRUCTURAL edits a string swap cannot make: the home page's short
 *      credential list loses its "IV Sedation Certificate" item, and the
 *      /sedation-dentistry "why it is safe here" paragraph, built from bold
 *      fragments, is re-cut
 *   3. code assets: `src/scripts/jsonld/*.js` (FAQ + procedure schema) and
 *      `src/scripts/seo-head.js` (per-page title/description)
 *   4. the `brandklout.open-graph` runtime store (materialised descriptions)
 *   5. the media library's alt text (the home sedation photo's alt said IV)
 *   7. `brandklout.aeo-schema` stored blocks (per-page JSON-LD, merged into
 *      the generated WebPage node)
 *   6. `posts` rows — two migrated blog sentences ("Anesthesiologist put them
 *      to sleep", "induce deep sleep")
 *
 * ## Kept on purpose
 *
 * The full credential list on /meet-dr-nahlah still reads "IV Sedation
 * Certificate": it is a list of the doctor's qualifications, numbered 01-14 and
 * counted as "fourteen" on three pages. It says nothing about what the practice
 * offers. The home page's SHORT list (no numbers, no count) drops it, because
 * there it sits beside the sales copy a patient reads.
 *
 * ## Publishing
 *
 * NOTHING HERE PUBLISHES THE SITE. Page, code-asset, OG and media writes go
 * live with the next site publish; post rows need `POST /data/rows/:id/publish`
 * each (a site publish does not promote post rows — see publish-post-rows.mjs),
 * which `--apply` does for the two rows it edits only after checking their
 * drafts carried nothing else unpublished.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, getSite, getPages, toChangedPage, saveShell, BASE } from './sedation-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')

import { SUB, WHOLE, WHOLE_PAGES } from './sedation-copy-map.mjs'

let hits = 0
const subStr = (s, whole) => {
  if (whole && WHOLE.has(s)) { hits++; return WHOLE.get(s) }
  let out = s
  for (const [from, to] of SUB) {
    if (!out.includes(from)) continue
    hits += out.split(from).length - 1
    out = out.split(from).join(to)
  }
  return out
}
const sub = (v, whole = false) => {
  if (typeof v === 'string') return subStr(v, whole)
  if (Array.isArray(v)) return v.map((x) => sub(x, whole))
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, sub(x, whole)]))
  return v
}

/* ── structural edits, by node id, each guarded by the text it expects ───── */
const STRUCT = {
  index: (N) => {
    // the short credential list's last item
    const li = 'fLQs1OMFoZ4VmP3g_eKPX'
    const txt = '83xLaoFfPKnnUmYeYBqnF'
    if (N[txt]?.props?.text !== 'IV Sedation Certificate' || !N[li]?.children?.includes(txt)) return 0
    const parent = N[N[li].parentId]
    N[parent.id ?? N[li].parentId] = { ...parent, children: parent.children.filter((c) => c !== li) }
    for (const c of N[li].children ?? []) delete N[c]
    delete N[li]
    return 1
  },
  'sedation-dentistry': (N) => {
    // "Plenty of practices refer sedation out. Dr. Nahlah holds an <b>IV Sedation
    // Certificate</b>, is a <b>BLS & ACLS provider</b>, and works with a <b>medical
    // anaesthesiologist</b> for oral and IV cases, so the person watching you is
    // not the same person doing the surgery."
    const P = '9bNTcm_lAQoHeqhcwu6ZH'
    const [lead, cert, is, bls, works, anaes, tail] = ['gg8CczL0f1vJSAR8ZRYrA', 'NRxT6DMNXXHo7iG4Cdq0B',
      'alIxL8YVViykiuI4qLK2U', '92SlSEkb2HtAyA7qiG51e', '5ks43Hfx7f_8Lro0z18dT', 'tXyNgJOvFg5gLXrXuqd-U',
      'keITASkhKVH-5BBtq8Nkb']
    if (N[cert]?.props?.text !== 'IV Sedation Certificate' || N[bls]?.props?.text !== 'BLS & ACLS provider') return 0
    for (const id of [cert, is, works, anaes]) delete N[id]
    N[lead] = { ...N[lead], props: { ...N[lead].props, text: 'Sedation here is kept to the two kinds given safely in a dental chair, nitrous oxide and oral sedation, by a doctor who is a ' } }
    N[tail] = { ...N[tail], props: { ...N[tail].props, text: '. The practice does not offer IV sedation or general anaesthesia.' } }
    N[P] = { ...N[P], children: [lead, bls, tail] }
    return 1
  },
}

/* ── the audit: what must be gone afterwards ───────────────────────────────
   A sentence that DENIES IV sedation is allowed; nothing else may name it. */
const BAD = /\bIV\b|an(a)?esthesiolog|no memory of the|put them to sleep|induce deep sleep|do not remember/i
const DENIAL = /does not offer IV sedation|IV Sedation Certificate/ // the credential stays on /meet-dr-nahlah only
const leftovers = (where, v, out) => {
  if (typeof v === 'string') {
    for (const s of v.split(/(?<=[.!?"])\s+/)) {
      if (!BAD.test(s)) continue
      if (/does not offer IV sedation/.test(s) && !/an(a)?esthesiolog/i.test(s.replace(/general an(a)?esthesia/gi, ''))) continue
      if (/IV Sedation Certificate/.test(s) && where === 'page:meet-dr-nahlah') continue
      if (/^[\w./:-]+$/.test(s)) continue // ids, paths, class names
      out.push(`${where}: ${s.slice(0, 160)}`)
    }
  } else if (Array.isArray(v)) v.forEach((x) => leftovers(where, x, out))
  else if (v && typeof v === 'object') for (const x of Object.values(v)) leftovers(where, x, out)
}

console.log(`host ${BASE}\n`)
const { site, seq: shellBaseSeq } = await getSite()
const { rows } = await getPages()
const report = []

// 1 + 2. pages
const changedPages = []
const baseSeqs = {}
for (const r of rows) {
  const slug = r.cells?.slug ?? r.slug
  const N0 = r.cells?.body?.nodes
  if (!N0) continue
  const before = hits
  const whole = WHOLE_PAGES.has(slug)
  const N = {}
  for (const [id, n] of Object.entries(N0)) N[id] = n.props ? { ...n, props: sub(n.props, whole) } : n
  let struct = 0
  if (STRUCT[slug]) { struct = STRUCT[slug](N); hits += struct }
  /* The page row's own `title` cell is the published <title>; the node pass
     never sees it. Missed on the first run, caught by the live audit. */
  const title = typeof r.cells?.title === 'string' ? sub(r.cells.title) : r.cells?.title
  if (hits === before) continue
  report.push(`  page   ${slug.padEnd(52)} ${hits - before} edit(s)${struct ? ' incl. structural' : ''}`)
  changedPages.push(toChangedPage(r, { nodes: N, title }))
  baseSeqs[r.id] = r.seq
}

// 3. code assets
const fileEdits = []
for (const f of site.files ?? []) {
  if (!/^src\/scripts\/(jsonld\/.*|seo-head)\.js$/.test(f.path)) continue
  const before = hits
  const next = sub(f.content ?? '')
  if (hits === before) continue
  fileEdits.push({ f, next })
  report.push(`  asset  ${f.path.padEnd(52)} ${hits - before} edit(s)`)
}

// 4. open graph overrides
const OG = '/admin/api/cms/plugins/brandklout.open-graph/runtime'
const og = await api('GET', `${OG}/pages`)
const ogEdits = []
for (const p of og.pages ?? []) {
  if (!p.override) continue
  const before = hits
  const next = sub(p.override)
  if (hits === before) continue
  ogEdits.push({ slug: p.slug, next })
  report.push(`  og     ${p.slug.padEnd(52)} ${hits - before} edit(s)`)
}

// 5. media alt text
const media = (await api('GET', '/admin/api/cms/media')).assets ?? []
const altEdits = []
for (const a of media) {
  if (typeof a.altText !== 'string') continue
  const before = hits
  const next = sub(a.altText)
  if (hits === before) continue
  altEdits.push({ id: a.id, next })
  report.push(`  alt    ${String(a.filename ?? a.id).slice(0, 52).padEnd(52)} "${next}"`)
}

// 7. aeo-schema stored blocks — per-page JSON-LD kept in the plugin's own
//    `schema-blocks` collection, merged into the generated WebPage node. It
//    held the old /sedation-dentistry name + description after every other
//    store was clean; only the live audit's HEAD half caught it.
const AEO = '/admin/api/cms/plugins/brandklout.aeo-schema/runtime'
const aeo = await api('GET', `${AEO}/entries`)
const blockEdits = []
for (const b of [...(aeo.entries ?? []).map((e) => e.block), aeo.global].filter(Boolean)) {
  const before = hits
  const json = sub(b.json)
  if (hits === before) continue
  blockEdits.push({ ...b, json })
  report.push(`  schema ${String(b.key).padEnd(52)} ${hits - before} edit(s)`)
}

// 6. post rows
const posts = (await api('GET', '/admin/api/cms/data/tables/posts/rows')).rows ?? []
const postEdits = []
for (const p of posts) {
  const before = hits
  const next = sub(p.cells)
  if (hits === before) continue
  postEdits.push({ p, next })
  report.push(`  post   ${p.cells.slug.slice(0, 52).padEnd(52)} ${hits - before} edit(s)`)
}

console.log(report.join('\n'))
console.log(`\n${hits} edits: ${changedPages.length} pages, ${fileEdits.length} code assets, ${ogEdits.length} OG overrides, ${blockEdits.length} schema blocks, ${altEdits.length} alts, ${postEdits.length} posts`)

/* Audit the PLANNED state, so a dry run already shows what would survive. */
const planned = []
const changedById = new Map(changedPages.map((c) => [c.id, c]))
for (const r of rows) {
  const slug = r.cells?.slug ?? r.slug
  const nodes = changedById.get(r.id)?.nodes ?? r.cells?.body?.nodes ?? {}
  for (const n of Object.values(nodes)) leftovers(`page:${slug}`, n.props, planned)
  leftovers(`title:${slug}`, changedById.get(r.id)?.title ?? r.cells?.title, planned)
}
for (const f of site.files ?? []) if (/^src\/scripts\/(jsonld\/.*|seo-head)\.js$/.test(f.path)) leftovers(`asset:${f.path}`, fileEdits.find((e) => e.f === f)?.next ?? f.content, planned)
for (const p of og.pages ?? []) leftovers(`og:${p.slug}`, ogEdits.find((e) => e.slug === p.slug)?.next ?? p.override, planned)
for (const a of media) leftovers(`alt:${a.id}`, altEdits.find((e) => e.id === a.id)?.next ?? a.altText, planned)
for (const b of [...(aeo.entries ?? []).map((e) => e.block), aeo.global].filter(Boolean)) leftovers(`schema:${b.key}`, blockEdits.find((e) => e.key === b.key)?.json ?? b.json, planned)
for (const p of posts) leftovers(`post:${p.cells.slug}`, postEdits.find((e) => e.p === p)?.next ?? p.cells, planned)
console.log(`\nwould survive: ${planned.length}`)
for (const l of planned) console.log(`  ! ${l}`)

if (!APPLY) { console.log('\nDRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }
if (planned.length) { console.error('\nrefusing to apply while the plan leaves claims behind'); process.exit(1) }

/* Post rows: publishing a row ships its WHOLE draft. Refuse if either edited
   row carried unpublished changes before this run. */
const preview = await api('GET', '/admin/api/cms/data/tables/posts/loop-preview?limit=60')
const live = new Map((preview.items ?? []).map((it) => [it.fields.rowId, it.fields]))
for (const { p } of postEdits) {
  const l = live.get(p.id)
  const stale = Object.keys(p.cells).filter((k) => k !== 'featuredMedia'
    && JSON.stringify(p.cells[k]) !== JSON.stringify(l?.[k]))
  if (stale.length) throw new Error(`post ${p.cells.slug} has unpublished draft changes (${stale.join(', ')}) — refusing`)
}

mkdirSync(join(HERE, '.tmp', 'backups'), { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const host = BASE.replace(/^https?:\/\//, '')
const backup = join(HERE, '.tmp', 'backups', `pre-sedation-${host}-${stamp}.json`)
writeFileSync(backup, JSON.stringify({ rows, files: site.files, og: og.pages, media, posts, aeo }, null, 1))
console.log(`\nbacked up to ${backup}`)

if (changedPages.length) {
  const res = await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental', site, changedPages, deletedPageIds: [],
    changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs, shellBaseSeq,
  })
  console.log(`pages saved — seq ${res.seq}`)
}
if (fileEdits.length) {
  const fresh = await getSite()
  for (const { f, next } of fileEdits) {
    const tgt = fresh.site.files.find((x) => x.path === f.path)
    if (tgt.content !== f.content) throw new Error(`${f.path} changed since it was read — re-run`)
    tgt.content = next
  }
  const saved = await saveShell(fresh.site, fresh.seq)
  console.log(`code assets saved — seq ${saved.seq}`)
}
for (const e of ogEdits) await api('POST', `${OG}/override`, e.next)
if (ogEdits.length) console.log(`og overrides saved — ${ogEdits.length}`)
for (const b of blockEdits) await api('POST', `${AEO}/entry`, { key: b.key, json: b.json, note: b.note, enabled: b.enabled })
if (blockEdits.length) console.log(`schema blocks saved — ${blockEdits.length}`)
for (const e of altEdits) await api('PATCH', `/admin/api/cms/media/${e.id}`, { altText: e.next })
if (altEdits.length) console.log(`alts saved — ${altEdits.length}`)
for (const { p, next } of postEdits) {
  const cur = (await api('GET', `/admin/api/cms/data/rows/${p.id}`)).row
  await api('PATCH', `/admin/api/cms/data/rows/${p.id}`, { cells: { ...cur.cells, ...next } })
  await api('POST', `/admin/api/cms/data/rows/${p.id}/publish`, {})
}
if (postEdits.length) console.log(`posts saved and row-published — ${postEdits.length}`)

/* Read back everything, from the server. */
const back = []
for (const r of (await getPages()).rows) {
  for (const n of Object.values(r.cells?.body?.nodes ?? {})) leftovers(`page:${r.cells?.slug ?? r.slug}`, n.props, back)
  leftovers(`title:${r.cells?.slug ?? r.slug}`, r.cells?.title, back)
}
for (const f of (await getSite()).site.files ?? []) if (/^src\/scripts\/(jsonld\/.*|seo-head)\.js$/.test(f.path)) leftovers(`asset:${f.path}`, f.content, back)
for (const p of (await api('GET', `${OG}/pages`)).pages ?? []) leftovers(`og:${p.slug}`, p.override, back)
{ const a2 = await api('GET', `${AEO}/entries`); for (const b of [...(a2.entries ?? []).map((e) => e.block), a2.global].filter(Boolean)) leftovers(`schema:${b.key}`, b.json, back) }
for (const a of (await api('GET', '/admin/api/cms/media')).assets ?? []) leftovers(`alt:${a.id}`, a.altText, back)
for (const p of (await api('GET', '/admin/api/cms/data/tables/posts/rows')).rows ?? []) leftovers(`post:${p.cells.slug}`, p.cells, back)
console.log(`\nread back: ${back.length} leftover(s)`)
for (const l of back) console.log(`  ! ${l}`)
if (back.length) process.exit(1)
console.log('\nDRAFTS written. Publish the site next (node insta-api.mjs publish), then run audit-live-sedation.mjs.')
