#!/usr/bin/env node
/**
 * add-hipaa-footer-link.mjs — "HIPAA Disclosure" in the footer's legal row, right after Privacy.
 *
 *   node add-hipaa-footer-link.mjs                      # dry run
 *   node add-hipaa-footer-link.mjs --apply              # write the draft
 *   node add-hipaa-footer-link.mjs --apply --publish    # ...and publish
 *
 * This site has no components: the footer is inlined on every page row. Two legal rows exist,
 * `.footer-links` (the site footer, 81 pages) and `.lp-foot-links` (the ads landing footer, 6
 * pages). In each, the Privacy link (`base.link`, href /privacy-policy) is cloned — same module,
 * classes and props, no separator nodes because the row spaces its links with `gap` — and the
 * clone goes in right after it, relabelled and re-pointed. Nothing else on any page is touched.
 * Source footers: lib/layout.mjs footer() and lib/lp.mjs carry the same link.
 *
 * Side effects handled:
 *   - a site-document page write drops the row's seoTitle/seoDescription cells, so the ones
 *     present before are put back with a read-merge-write PATCH (flat slugs only; every row
 *     that has them is flat — a PATCH on a nested slug would flatten its route).
 *   - publish is site-wide: refuses unless the draft matched published before the write, and
 *     refuses to publish if the shell or any row it did not write moved meanwhile.
 * Re-runnable: a row that already has the link is skipped.
 */
import { randomBytes } from 'node:crypto'
import { api, getPages, getSite, publish, publishStatus, toChangedPage, BASE } from '../../tools/instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const HREF = '/hipaa-disclosure'
const LABEL = 'HIPAA Disclosure'
const ROWS = ['footer_links', 'landing-footer_links']

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => [...randomBytes(n)].map((b) => ALPHABET[b & 63]).join('')

const status0 = await publishStatus()
const site = await getSite()
const { rows } = await getPages()
const rules = site.site.styleRules ?? {}
const nameOf = (id) => rules[id]?.name
console.log(`target ${BASE}  shell seq ${site.seq}  rows ${rows.length}  draftMatchesPublished ${status0.draftMatchesPublished}`)

const changed = []
const misses = []
for (const row of rows) {
  const nodes = row.cells.body.nodes
  const legal = Object.values(nodes).filter((n) => (n.classIds ?? []).some((c) => ROWS.includes(nameOf(c))))
  let did = 0
  for (const box of legal) {
    const kids = box.children.map((c) => nodes[c])
    if (kids.some((k) => k?.props?.href === HREF)) continue
    const at = kids.findIndex((k) => k?.moduleId === 'base.link' && k.props?.href === '/privacy-policy')
    if (at < 0) continue
    const clone = structuredClone(kids[at])
    clone.id = nanoid()
    clone.props = { ...clone.props, href: HREF, text: LABEL }
    nodes[clone.id] = clone
    box.children.splice(at + 1, 0, clone.id)
    did++
  }
  if (did) changed.push(row)
  else if (!legal.some((b) => b.children.some((c) => nodes[c]?.props?.href === HREF))) misses.push(row.slug)
}
console.log(`pages  ${changed.length} to change, ${rows.length - changed.length - misses.length} already linked, no legal row: [${misses.join(', ')}]`)
if (!APPLY) { console.log('DRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }
if (!status0.draftMatchesPublished) { console.error('REFUSING: the draft already differs from the published site. Nothing written.'); process.exit(1) }
if (!changed.length) process.exit(0)

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: site.site,
  changedPages: changed.map((r) => ({ ...toChangedPage(r), status: 'published' })),
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(changed.map((r) => [r.id, r.seq ?? 0])), shellBaseSeq: site.seq,
})
console.log(`saved  ${JSON.stringify(res).slice(0, 160)}`)

// put the SEO cells back where they were
let restored = 0
for (const r of changed.filter((x) => x.cells.seoTitle !== undefined || x.cells.seoDescription !== undefined)) {
  if (r.slug.includes('/')) { console.log(`seo    ${r.slug} SKIPPED (nested slug)`); continue }
  const cells = { ...(await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row.cells }
  if (!cells.body || cells.slug !== r.slug) throw new Error(`${r.slug}: row missing body/slug before the SEO merge`)
  if (cells.seoTitle === r.cells.seoTitle && cells.seoDescription === r.cells.seoDescription) continue
  cells.seoTitle = r.cells.seoTitle
  cells.seoDescription = r.cells.seoDescription
  await api('PATCH', `/admin/api/cms/data/rows/${r.id}`, { cells })
  restored++
}

// read back
const after = (await getPages()).rows
const byId = new Map(after.map((r) => [r.id, r]))
const bad = []
for (const r of changed) {
  const a = byId.get(r.id)
  const n = Object.values(a.cells.body.nodes)
  if (a.slug !== r.slug || n.length !== Object.keys(r.cells.body.nodes).length || !n.some((x) => x.props?.href === HREF)) bad.push(r.slug)
  if (a.cells.seoTitle !== r.cells.seoTitle) bad.push(`${r.slug} (seo)`)
}
const before = new Map(rows.map((r) => [r.id, `${r.seq}|${r.updatedAt}`]))
const moved = after.filter((r) => !changed.some((c) => c.id === r.id) && before.get(r.id) !== `${r.seq}|${r.updatedAt}`).map((r) => r.slug)
const shellSame = JSON.stringify((await getSite()).site) === JSON.stringify(site.site)
console.log(`check  seo restored ${restored}, bad [${bad.join(', ')}], untouched rows moved [${moved.join(', ')}], shell ${shellSame ? 'unchanged' : 'CHANGED'}, rows ${after.length}`)
if (bad.length) { console.error('REFUSING to publish: read-back failed.'); process.exit(1) }

if (!PUBLISH) process.exit(0)
if (moved.length || !shellSame) { console.error('REFUSING to publish: something else changed since the read.'); process.exit(1) }
console.log('publish', JSON.stringify(await publish()).slice(0, 160))
for (let i = 0; i < 60; i++) {
  await new Promise((r) => setTimeout(r, 3000))
  const s = JSON.stringify(await publishStatus())
  if (!/running|pending|in_progress|building/i.test(s)) { console.log('status ', s.slice(0, 200)); break }
}
