#!/usr/bin/env node
/**
 * push-hipaa-footer-link.mjs — "HIPAA Disclosure" in the footer's legal row,
 * right after Privacy Policy, on every page (2026-10-01).
 *
 *   node push-hipaa-footer-link.mjs              # plan only (production)
 *   node push-hipaa-footer-link.mjs --apply      # write the drafts
 *   node push-hipaa-footer-link.mjs --publish    # publish, only if those edits are the draft's only difference
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com node push-hipaa-footer-link.mjs ...
 *
 * There is no shared footer component on this site: every page row carries its
 * own `footer.foot`, and all 59 have the identical `.foot-base` row
 *   span · span · span>a(/privacy-policy) · span>a(/terms-conditions)
 * The row has no separator glyph (12-footer.css: flex, gap 1rem,
 * space-between), so the new item is a clone of the Privacy Policy
 * span>a with fresh ids, inserted after it. Nothing else in any page moves:
 * the read-back requires every pre-existing node to be deep-equal to before.
 *
 * Page writes through site-document REPLACE a row's cells (title, slug, body,
 * template): `toChangedPage` carries the 404/post templates, and seoTitle /
 * seoDescription (index, hipaa-disclosure) are re-applied by PATCH afterwards.
 * Nested ads slugs are only ever written through site-document, so they stay nested.
 */
import { randomBytes, createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { api, getSite, getPages, toChangedPage, BASE } from './sedation-api.mjs'
import { isDeepStrictEqual } from 'node:util'

const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const HREF = '/hipaa-disclosure'
const LABEL = 'HIPAA Disclosure'
const HOST = BASE.replace(/^https?:\/\//, '')
const STATE = `.tmp/hipaa/footer-state-${HOST}.json`
mkdirSync('.tmp/hipaa', { recursive: true })
const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = () => { const b = randomBytes(21); let s = ''; for (let i = 0; i < 21; i++) s += ALPHABET[b[i] & 63]; return s }
const slugOf = (r) => r.cells?.slug ?? r.slug
const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex')

console.log(HOST, APPLY ? '(apply)' : PUBLISH ? '(publish)' : '(plan)')
const status = await api('GET', '/admin/api/cms/publish/status')
console.log(`  status   ${JSON.stringify(status)}`)
const list = (await getPages()).rows
const { site: shell0, seq: shellSeq0 } = await getSite()

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
const fb = Object.entries(shell0.styleRules ?? {}).filter(([, r]) => r.name === 'foot-base').map(([id]) => id)
if (fb.length !== 1) { console.error(`foot-base class ids: ${fb.length}`); process.exit(1) }

// ── plan every page ─────────────────────────────────────────────────────────
const plans = []
let already = 0
for (const r0 of list) {
  const row = (await api('GET', `/admin/api/cms/data/rows/${r0.id}`)).row
  const slug = slugOf(row)
  const nodes = structuredClone(row.cells.body.nodes)
  const bases = Object.values(nodes).filter((n) => (n.classIds ?? []).includes(fb[0]))
  if (bases.length !== 1) { console.error(`/${slug}: ${bases.length} .foot-base rows`); process.exit(1) }
  const base = bases[0]
  const linkOf = (id) => nodes[id]?.children?.length === 1 ? nodes[nodes[id].children[0]] : null
  if (base.children.some((c) => linkOf(c)?.props?.href === HREF)) { already++; continue }
  const i = base.children.findIndex((c) => linkOf(c)?.props?.href === '/privacy-policy')
  if (i < 0 || base.children.length !== 4) { console.error(`/${slug}: unexpected .foot-base shape`); process.exit(1) }
  const wrap0 = nodes[base.children[i]], link0 = linkOf(wrap0.id)
  const wrap = { ...structuredClone(wrap0), id: nanoid(), children: [] }
  const link = { ...structuredClone(link0), id: nanoid(), parentId: wrap.id, children: [] }
  link.props.href = HREF
  link.props.text = LABEL
  wrap.children = [link.id]
  nodes[wrap.id] = wrap
  nodes[link.id] = link
  base.children.splice(i + 1, 0, wrap.id)
  plans.push({ row, slug, nodes, added: [wrap.id, link.id], baseId: base.id })
}
console.log(`  pages    ${list.length}: ${plans.length} to edit, ${already} already linked`)
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
  if (Object.keys(an).length !== Object.keys(bn).length + 2) problems.push(`/${p.slug}: node count ${Object.keys(bn).length} -> ${Object.keys(an).length}`)
  for (const [id, n] of Object.entries(bn)) {
    const m = an[id]
    if (id === p.baseId) {
      const want = [...n.children]; want.splice(want.findIndex((c) => bn[bn[c].children?.[0]]?.props?.href === '/privacy-policy') + 1, 0, p.added[0])
      if (!isDeepStrictEqual({ ...m, children: [] }, { ...n, children: [] }) || !isDeepStrictEqual(m.children, want)) problems.push(`/${p.slug}: foot-base differs from plan`)
    } else if (!isDeepStrictEqual(m, n)) problems.push(`/${p.slug}: node ${id} changed`)
  }
  const l = an[p.added[1]]
  if (l?.props?.href !== HREF || l?.props?.text !== LABEL) problems.push(`/${p.slug}: new link missing`)
}
if (problems.length) { console.error(`READ-BACK PROBLEMS (${problems.length}):\n  ${problems.slice(0, 30).join('\n  ')}`); process.exit(1) }
console.log(`  readback ${plans.length} pages: only the two new nodes + the row's child order differ; other cells intact`)

const { site: shell1 } = await getSite()
console.log(`  shell    ${sha(shell1) === shellHash ? 'identical' : 'DIFFERS'} after our writes`)
const seqs = Object.fromEntries((await getPages()).rows.map((r) => [r.id, r.seq]))
writeFileSync(STATE, JSON.stringify({ seqs, shell: sha(shell1), at: new Date().toISOString() }, null, 1))
console.log(`  status   ${JSON.stringify(await api('GET', '/admin/api/cms/publish/status'))}`)
console.log('draft only — re-run with --publish')
