#!/usr/bin/env node
/**
 * push-footer-social.mjs — "Find Us Online" in the footer's first column, under
 * the blurb: Facebook, Instagram, RealSelf, Vitals, Healthgrades, Google
 * (Asana 1219087019480243, 2026-10-05).
 *
 *   node push-footer-social.mjs              # plan only (production)
 *   node push-footer-social.mjs --apply      # write the drafts
 *   node push-footer-social.mjs --publish    # publish, only if those edits are the draft's only difference
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com node push-footer-social.mjs ...
 *
 * Only rows whose footer has the site `.foot-grid` are edited. The ads landing
 * pages (`.lp-foot-grid`) are skipped on purpose: lp-foot.html keeps a paid
 * page's footer free of anything that leads away from the form.
 *
 * Every node is a clone of one already in that page's footer, so no new class
 * or CSS: the heading clones the "Treatments" h2, the list its ul, each item
 * its first li>a. Two inline styles only: the h2's top margin and the ul's
 * three-column grid. Same write/verify/publish discipline as
 * push-hipaa-footer-link.mjs (chunks of 10 with their own seqs, SEO cells
 * re-applied, every pre-existing node deep-equal on read-back, publish refuses
 * if anything else moved).
 */
import { randomBytes, createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { api, getSite, getPages, toChangedPage, BASE } from './sedation-api.mjs'
import { isDeepStrictEqual } from 'node:util'

const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const HEADING = 'Find Us Online'
export const PROFILES = [
  ['Facebook', 'https://www.facebook.com/drnahlahprosthodontist/'],
  ['Instagram', 'https://www.instagram.com/drnahlah/'],
  ['RealSelf', 'https://www.realself.com/dr/esam-abou-nahlah-mclean-va'],
  ['Vitals', 'https://www.vitals.com/doctors/esam-abou-nahlah-gokheu'],
  ['Healthgrades', 'https://www.healthgrades.com/dentist/dr-esam-abou-nahlah-26pyg'],
  ['Google', 'https://maps.google.com/?cid=16584195885077624360'],
]
const ADDED = 2 + PROFILES.length * 2
const HOST = BASE.replace(/^https?:\/\//, '')
const STATE = `.tmp/social/footer-state-${HOST}.json`
mkdirSync('.tmp/social', { recursive: true })
const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = () => { const b = randomBytes(21); let s = ''; for (let i = 0; i < 21; i++) s += ALPHABET[b[i] & 63]; return s }
const slugOf = (r) => r.cells?.slug ?? r.slug
const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex')

console.log(HOST, APPLY ? '(apply)' : PUBLISH ? '(publish)' : '(plan)')
const status = await api('GET', '/admin/api/cms/publish/status')
console.log(`  status   ${JSON.stringify(status)}`)
const list = (await getPages()).rows
const { site: shell0 } = await getSite()

if (PUBLISH) {
  if (!existsSync(STATE)) { console.error('no --apply state for this host'); process.exit(1) }
  const st = JSON.parse(readFileSync(STATE, 'utf8'))
  const now = Object.fromEntries(list.map((r) => [r.id, r.seq]))
  const moved = Object.keys(st.seqs).filter((id) => now[id] !== st.seqs[id])
  const added = Object.keys(now).filter((id) => !(id in st.seqs))
  const shellOk = sha(shell0) === st.shell
  console.log(`  rows     moved since apply: ${moved.length}, new rows: ${added.length}; shell ${shellOk ? 'unchanged' : 'CHANGED'}`)
  if (moved.length || added.length || !shellOk || status.draftPages !== status.publishedPages) {
    console.error('REFUSING TO PUBLISH: the draft holds something other than the footer edits'); process.exit(1)
  }
  const r = await api('POST', '/admin/api/cms/publish', {})
  console.log('published', JSON.stringify(r).slice(0, 200))
  console.log('after', JSON.stringify(await api('GET', '/admin/api/cms/publish/status')))
  process.exit(0)
}

if (!status.draftMatchesPublished) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }
const classId = (name) => {
  const ids = Object.entries(shell0.styleRules ?? {}).filter(([, r]) => r.name === name).map(([id]) => id)
  if (ids.length !== 1) { console.error(`${name} class ids: ${ids.length}`); process.exit(1) }
  return ids[0]
}
const GRID = classId('foot-grid'), BLURB = classId('foot-blurb')

// ── plan every page ─────────────────────────────────────────────────────────
const plans = []
let already = 0, skipped = []
for (const r0 of list) {
  const row = (await api('GET', `/admin/api/cms/data/rows/${r0.id}`)).row
  const slug = slugOf(row)
  const nodes = structuredClone(row.cells.body.nodes)
  const grids = Object.values(nodes).filter((n) => (n.classIds ?? []).includes(GRID))
  if (grids.length === 0) { skipped.push(slug); continue }
  if (grids.length !== 1) { console.error(`/${slug}: ${grids.length} .foot-grid`); process.exit(1) }
  const [col1Id, col2Id] = grids[0].children
  const col1 = nodes[col1Id], col2 = nodes[col2Id]
  if (col1.children.some((c) => nodes[c]?.props?.text === HEADING)) { already++; continue }
  const blurb = nodes[col1.children[1]]
  const [h0, ul0] = col2.children.map((c) => nodes[c])
  const li0 = nodes[ul0?.children?.[0]], a0 = nodes[li0?.children?.[0]]
  if (col1.children.length !== 2 || !(blurb.classIds ?? []).includes(BLURB) || h0?.props?.tag !== 'h2'
    || ul0?.props?.tag !== 'ul' || li0?.props?.customTag !== 'li' || a0?.moduleId !== 'base.link') {
    console.error(`/${slug}: unexpected footer shape`); process.exit(1)
  }
  const added = []
  const clone = (src, parentId, patch) => {
    const n = { ...structuredClone(src), id: nanoid(), parentId, children: [], ...patch }
    nodes[n.id] = n; added.push(n.id); return n
  }
  const h = clone(h0, col1.id, { inlineStyles: { marginTop: '2rem' } })
  h.props.text = HEADING
  const ul = clone(ul0, col1.id, { inlineStyles: { gridTemplateColumns: 'repeat(3, max-content)', columnGap: '1.75rem' } })
  for (const [label, href] of PROFILES) {
    const li = clone(li0, ul.id)
    const a = clone(a0, li.id)
    // No rel here: base.link emits rel="noopener noreferrer" for _blank itself,
    // and a second one in htmlAttributes publishes as a duplicate attribute.
    a.props = { ...a.props, href, text: label, target: '_blank',
      htmlAttributes: { 'aria-label': `Dr. Nahlah on ${label} (opens in a new tab)` } }
    li.children = [a.id]
    ul.children.push(li.id)
  }
  col1.children.push(h.id, ul.id)
  plans.push({ row, slug, nodes, added, col1Id: col1.id })
}
console.log(`  pages    ${list.length}: ${plans.length} to edit, ${already} already done, ${skipped.length} without a site footer (${skipped.join(', ')})`)
if (!APPLY) { console.log('plan only — pass --apply'); process.exit(0) }

// ── write in chunks, each with its own seqs ─────────────────────────────────
const shellHash = sha(shell0)
for (let k = 0; k < plans.length; k += 10) {
  const chunk = plans.slice(k, k + 10)
  const { site: sh, seq } = await getSite()
  await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental', site: sh,
    changedPages: chunk.map((p) => toChangedPage(p.row, { nodes: p.nodes })),
    deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: Object.fromEntries(chunk.map((p) => [p.row.id, p.row.seq])), shellBaseSeq: seq,
  })
  console.log(`  wrote    ${chunk.map((p) => p.slug).join(', ')}`)
}

// ── restore SEO cells the page write drops, then read everything back ───────
const problems = []
for (const p of plans) {
  const keep = Object.fromEntries(['seoTitle', 'seoDescription'].filter((k) => p.row.cells[k] !== undefined).map((k) => [k, p.row.cells[k]]))
  let back = (await api('GET', `/admin/api/cms/data/rows/${p.row.id}`)).row
  if (Object.keys(keep).length && Object.entries(keep).some(([k, v]) => back.cells[k] !== v)) {
    await api('PATCH', `/admin/api/cms/data/rows/${p.row.id}`, { cells: { ...back.cells, ...keep } })
    back = (await api('GET', `/admin/api/cms/data/rows/${p.row.id}`)).row
    console.log(`  seo      /${p.slug}: ${Object.keys(keep).join(' + ')} re-applied`)
  }
  const before = p.row.cells, after = back.cells
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (k === 'body') continue
    if (!isDeepStrictEqual(before[k], after[k])) problems.push(`/${p.slug}: cell ${k} changed`)
  }
  if (slugOf(back) !== p.slug) problems.push(`/${p.slug}: slug now ${slugOf(back)}`)
  if (after.body.rootNodeId !== before.body.rootNodeId) problems.push(`/${p.slug}: root moved`)
  const bn = before.body.nodes, an = after.body.nodes
  if (Object.keys(an).length !== Object.keys(bn).length + ADDED) problems.push(`/${p.slug}: node count ${Object.keys(bn).length} -> ${Object.keys(an).length}`)
  for (const [id, n] of Object.entries(bn)) {
    const m = an[id]
    if (id === p.col1Id) {
      if (!isDeepStrictEqual({ ...m, children: [] }, { ...n, children: [] })
        || !isDeepStrictEqual(m.children, [...n.children, p.added[0], p.added[1]])) problems.push(`/${p.slug}: column differs from plan`)
    } else if (!isDeepStrictEqual(m, n)) problems.push(`/${p.slug}: node ${id} changed`)
  }
  for (const id of p.added) if (!isDeepStrictEqual(an[id], p.nodes[id])) problems.push(`/${p.slug}: new node ${id} not as written`)
}
if (problems.length) { console.error(`READ-BACK PROBLEMS (${problems.length}):\n  ${problems.slice(0, 30).join('\n  ')}`); process.exit(1) }
console.log(`  readback ${plans.length} pages: only the ${ADDED} new nodes + column 1's child list differ; other cells intact`)

const { site: shell1 } = await getSite()
console.log(`  shell    ${sha(shell1) === shellHash ? 'identical' : 'DIFFERS'} after our writes`)
const seqs = Object.fromEntries((await getPages()).rows.map((r) => [r.id, r.seq]))
writeFileSync(STATE, JSON.stringify({ seqs, shell: sha(shell1), at: new Date().toISOString() }, null, 1))
console.log(`  status   ${JSON.stringify(await api('GET', '/admin/api/cms/publish/status'))}`)
console.log('draft only — re-run with --publish')
