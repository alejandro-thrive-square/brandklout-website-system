/**
 * Add "HIPAA Disclosure" to the footer's legal row on every live page, right after
 * "Privacy Policy". No re-import.
 *
 *   node add-hipaa-footer-link.mjs                       dry run
 *   node add-hipaa-footer-link.mjs --apply --publish     write every page, publish once
 *   INSTATIC_BASE_URL=https://staging.dfwsurgicalarts.com node add-hipaa-footer-link.mjs …
 *
 * The footer is inlined in every page row (there is no shared component on this
 * site), so this edits exactly one row of nodes per page: `.footer_legal` gets a
 * clone of its own Privacy Policy `base.link` (same classes, props, target),
 * retargeted to /hipaa-disclosure. The row's spacing is a flex `gap`, so there is
 * no separator node to copy. The source of the same change is
 * site-src/partials/footer.html (`{{CUR_HIPAA_DISCLOSURE}}`).
 *
 * aria-current: on /hipaa-disclosure the new link carries `aria-current="page"`,
 * and the Privacy Policy link loses the one it inherited when that page was cloned
 * from /privacy-policy by add-hipaa-page.mjs.
 *
 * A site-document page write drops `seoTitle` / `seoDescription` (pageToCells
 * does not carry them), so they are re-applied with a full-cells PATCH after it.
 * Refuses unless the draft matched the published site first; the write carries
 * every row's seq, so a concurrent edit 409s instead of being overwritten.
 * Backup of every row: .tmp/backup-<host>-<stamp>-pre-hipaa-footer.json
 */
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { api, getSite, getPages, publish, publishStatus, toChangedPage, BASE } from '../../../../process/tools/instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const TMP = path.join(HERE, '.tmp')
const apply = process.argv.includes('--apply')
const alsoPublish = process.argv.includes('--publish')

const HREF = '/hipaa-disclosure'
const TEXT = 'HIPAA Disclosure'
const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => [...randomBytes(n)].map((b) => ALPHABET[b & 63]).join('')

console.log(`target     ${BASE}`)
const status0 = await publishStatus()
console.log(`status     ${JSON.stringify(status0)}`)
const { site: shell, seq: shellSeq } = await getSite()
const legalRule = Object.values(shell.styleRules ?? {}).find((r) => r.kind === 'class' && String(r.name).replace(/^\./, '') === 'footer_legal')
if (!legalRule) throw new Error('no .footer_legal class on this instance')

const list = (await getPages()).rows
const rows = []
for (const r of list) rows.push((await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row)

const changed = []
for (const row of rows) {
  const slug = row.cells.slug
  const nodes = row.cells.body.nodes
  const legal = Object.values(nodes).filter((n) => (n.classIds ?? []).includes(legalRule.id))
  if (legal.length !== 1) throw new Error(`${slug}: expected one .footer_legal, found ${legal.length}`)
  const row_ = legal[0]
  const kids = row_.children.map((id) => nodes[id])
  const privacy = kids.filter((n) => n.moduleId === 'base.link' && n.props?.href === '/privacy-policy')
  if (privacy.length !== 1) throw new Error(`${slug}: expected one Privacy Policy link in .footer_legal, found ${privacy.length}`)
  if (kids.some((n) => n.props?.href === HREF)) { console.log(`${slug.padEnd(38)} already has the link`); continue }
  const p = privacy[0]
  const link = structuredClone(p)
  link.id = nanoid()
  link.children = []
  link.props = { ...link.props, href: HREF, text: TEXT, htmlAttributes: { ...(p.props.htmlAttributes ?? {}) } }
  delete link.props.htmlAttributes['aria-current']
  if (slug === 'hipaa-disclosure') {
    link.props.htmlAttributes['aria-current'] = 'page'
    delete p.props.htmlAttributes?.['aria-current']
  }
  nodes[link.id] = link
  row_.children.splice(row_.children.indexOf(p.id) + 1, 0, link.id)
  changed.push(row)
}
console.log(`pages      ${rows.length}; to write ${changed.length}`)
if (!apply) { console.log('dry run — re-run with --apply to write'); process.exit(0) }
if (!status0.draftMatchesPublished || status0.draftPages !== status0.publishedPages) {
  console.error('REFUSING: the draft differs from the published site, so a publish would ship someone else\'s drafts.')
  process.exit(1)
}

const host = BASE.replace(/^https?:\/\//, '')
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
fs.mkdirSync(TMP, { recursive: true })
const backup = path.join(TMP, `backup-${host}-${stamp}-pre-hipaa-footer.json`)
fs.writeFileSync(backup, JSON.stringify({ base: BASE, shellSeq, rows: list }, null, 1))
console.log(`backup     ${path.relative(HERE, backup)}`)

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site: shell,
  changedPages: changed.map((r) => toChangedPage(r)),
  deletedPageIds: [],
  changedComponents: [],
  deletedComponentIds: [],
  changedLayouts: [],
  deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(changed.map((r) => [r.id, r.seq])),
  shellBaseSeq: shellSeq,
})
console.log(`write      ${JSON.stringify(res).slice(0, 120)}`)

let bad = 0
for (const row of changed) {
  const want = row.cells
  const now = (await api('GET', `/admin/api/cms/data/rows/${row.id}`)).row.cells
  if (want.seoTitle !== undefined || want.seoDescription !== undefined) {
    if (now.seoTitle !== want.seoTitle || now.seoDescription !== want.seoDescription) {
      await api('PATCH', `/admin/api/cms/data/rows/${row.id}`, { cells: { ...now, seoTitle: want.seoTitle, seoDescription: want.seoDescription } })
    }
  }
  const back = (await api('GET', `/admin/api/cms/data/rows/${row.id}`)).row.cells
  const n = back.body.nodes
  const legal = Object.values(n).find((x) => (x.classIds ?? []).includes(legalRule.id))
  const hrefs = legal.children.map((id) => n[id].props?.href).filter(Boolean)
  const ok = back.slug === want.slug && back.title === want.title && back.seoTitle === want.seoTitle && back.seoDescription === want.seoDescription &&
    Object.keys(n).length === Object.keys(want.body.nodes).length && hrefs.indexOf(HREF) === hrefs.indexOf('/privacy-policy') + 1
  if (!ok) { bad++; console.error(`FAILED ${back.slug}: ${hrefs.join(' ')}`) }
}
const status1 = await publishStatus()
console.log(`read back  ${changed.length - bad}/${changed.length} ok; status ${JSON.stringify(status1)}`)
if (bad || status1.draftPages !== status0.draftPages) { console.error(`NOT published. Backup: ${backup}`); process.exit(1) }
if (alsoPublish) console.log('publish    ' + JSON.stringify(await publish()).slice(0, 200))
else console.log('NOT published.')
