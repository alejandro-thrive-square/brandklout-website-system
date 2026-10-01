#!/usr/bin/env node
/**
 * add-hipaa-footer-link.mjs — "HIPAA Disclosure" in the footer's legal row, right after
 * "Privacy Policy", on EVERY page of ONE instance. Nothing else is touched.
 *
 *   node add-hipaa-footer-link.mjs                       dry run against INSTATIC_BASE_URL
 *   node add-hipaa-footer-link.mjs --apply               back up, write the drafts, re-apply SEO cells
 *   node add-hipaa-footer-link.mjs --apply --publish     ... and publish, after the guard below
 *
 * The footer is inlined per page (no Visual Component on this site), so each page's legal row
 * gets its own node: a clone of that page's Privacy Policy link (same module, classes, target),
 * href /hipaa-disclosure, `aria-current="page"` only on /hipaa-disclosure itself — what
 * build-site.mjs's {{CUR_HIPAA_DISCLOSURE}} produces from partials/footer.html. The row has no
 * separator glyphs; `.footer_legal` spaces its children with flex `gap`.
 *
 * One incremental save for all pages, with baseSeqs. PUT /site-document drops seoTitle and
 * seoDescription, so they are captured first and PATCHed back, whole cells, per row.
 *
 * PUBLISH GUARD: the draft must match live before the write, and before publishing the shell
 * seq must be unchanged and every row must be exactly the seq our save gave it.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { api, getSite, getPages, publish, publishStatus, toChangedPage, BASE } from '../../../../process/tools/instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const HREF = '/hipaa-disclosure'
const LABEL = 'HIPAA Disclosure'
const nid = () => crypto.randomBytes(16).toString('base64url').slice(0, 21)

const status0 = await publishStatus()
const siteRes = await getSite()
const pagesRes = await getPages()
const { site: shell, seq } = siteRes
const rows = pagesRes.rows ?? []
console.log(`${BASE}\nstatus   draftMatchesPublished=${status0.draftMatchesPublished} draft=${status0.draftPages} published=${status0.publishedPages}; shell seq ${seq}; ${rows.length} pages`)
if (!rows.some((r) => r.slug === 'hipaa-disclosure')) throw new Error('no /hipaa-disclosure page on this instance — run add-hipaa-page.mjs first')

const changed = []
const full = {}
for (const r of rows) {
  const row = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row
  full[r.id] = row
  const nodes = row.cells.body.nodes
  const links = Object.values(nodes).filter((n) => n.moduleId === 'base.link')
  const rowsWithPrivacy = links
    .filter((n) => n.props?.href === '/privacy-policy')
    .map((n) => nodes[n.parentId])
    .filter((p) => p && p.children.some((c) => nodes[c]?.props?.href === '/terms-of-service'))
  if (rowsWithPrivacy.length !== 1) throw new Error(`/${r.slug}: ${rowsWithPrivacy.length} legal rows (privacy + terms siblings), expected 1`)
  const legal = rowsWithPrivacy[0]
  const tag = `/${r.slug === 'index' ? '' : r.slug}`.padEnd(20)
  if (legal.children.some((c) => nodes[c]?.props?.href === HREF)) { console.log(`${tag} already linked`); continue }
  const priv = nodes[legal.children.find((c) => nodes[c]?.props?.href === '/privacy-policy')]
  const attrs = { ...(priv.props.htmlAttributes ?? {}) }
  delete attrs['aria-current']
  if (r.slug === 'hipaa-disclosure') attrs['aria-current'] = 'page'
  const link = { ...structuredClone(priv), id: nid(), props: { ...structuredClone(priv.props), href: HREF, text: LABEL, htmlAttributes: attrs }, children: [] }
  nodes[link.id] = link
  legal.children.splice(legal.children.indexOf(priv.id) + 1, 0, link.id)
  changed.push(r)
  console.log(`${tag} + ${link.id} after Privacy Policy${attrs['aria-current'] ? ' (aria-current)' : ''}; row = ${legal.children.map((c) => nodes[c].props?.text ?? '©…').join(' | ')}`)
}

console.log(`\ntarget   ${BASE}  ${changed.length} page(s) to write`)
if (!APPLY) { console.log('DRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }
if (!changed.length) { console.log('nothing to write'); process.exit(0) }
if (PUBLISH && !status0.draftMatchesPublished) throw new Error('the draft already differs from live — publishing would carry someone else\'s edits. Stopped before writing.')

const label = /staging/.test(BASE) ? 'staging' : 'prod'
const bak = path.join(HERE, '.tmp', `backup-${label}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}-seq${seq}-pre-hipaa-footer`)
if (fs.existsSync(bak)) throw new Error(`${path.relative(HERE, bak)} already exists`)
fs.mkdirSync(bak, { recursive: true })
fs.writeFileSync(path.join(bak, 'site.json'), JSON.stringify(siteRes))
fs.writeFileSync(path.join(bak, 'pages.json'), JSON.stringify(pagesRes))
fs.writeFileSync(path.join(bak, 'status.json'), JSON.stringify(status0))
console.log(`backup   ${path.relative(HERE, bak)}`)

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site: shell,
  changedPages: changed.map((r) => toChangedPage(full[r.id])),
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(changed.map((r) => [r.id, r.seq ?? 0])),
  shellBaseSeq: seq,
})
console.log(`saved    ${JSON.stringify(res).slice(0, 200)}`)

/* SEO cells back on, whole row each time, and the node count checked */
let restored = 0
for (const r of changed) {
  const want = full[r.id].cells
  const cur = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row.cells
  if (!cur.body || cur.slug !== want.slug) throw new Error(`/${r.slug}: row missing body/slug after the save — refusing to write`)
  const n = Object.keys(cur.body.nodes).length
  if (n !== Object.keys(want.body.nodes).length) throw new Error(`/${r.slug}: ${n} nodes after the save, expected ${Object.keys(want.body.nodes).length}`)
  if (cur.seoTitle === want.seoTitle && cur.seoDescription === want.seoDescription) continue
  const cells = { ...cur, seoTitle: want.seoTitle, seoDescription: want.seoDescription }
  await api('PATCH', `/admin/api/cms/data/rows/${r.id}`, { cells })
  const back = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row.cells
  if (back.seoTitle !== want.seoTitle || back.seoDescription !== want.seoDescription || Object.keys(back.body.nodes).length !== n) throw new Error(`/${r.slug}: SEO re-apply failed`)
  restored++
}
console.log(`seo      re-applied on ${restored} page(s); ${changed.length - restored} already intact`)

/* guard: only our writes moved */
const after = (await getPages()).rows
const shellNow = (await getSite()).seq
const ids = new Set(rows.map((r) => r.id))
const added = after.filter((r) => !ids.has(r.id)).map((r) => `/${r.slug}`)
const stray = after.filter((r) => ids.has(r.id) && !changed.some((c) => c.id === r.id) && r.seq !== rows.find((x) => x.id === r.id).seq).map((r) => `/${r.slug}`)
const tooFar = after.filter((r) => changed.some((c) => c.id === r.id) && r.seq > res.seq).map((r) => `/${r.slug}`)
console.log(`guard    added ${added.join(' ') || 'none'}; untouched rows moved ${stray.join(' ') || 'none'}; written rows beyond seq ${res.seq} ${tooFar.join(' ') || 'none'}; shell seq ${shellNow} (was ${seq})`)
if (!PUBLISH) { console.log('drafts written; not publishing (no --publish)'); process.exit(0) }
if (added.length || stray.length || tooFar.length || after.length !== rows.length || shellNow !== seq) {
  console.log('NOT PUBLISHING: something other than this change moved in the draft.')
  process.exit(1)
}
console.log(`publish  ${JSON.stringify(await publish()).slice(0, 200)}`)
console.log(`status   ${JSON.stringify(await publishStatus())}`)
