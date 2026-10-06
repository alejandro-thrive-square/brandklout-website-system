#!/usr/bin/env node
/**
 * Two copy fixes (user, 2026-10-06), node props only, production and staging:
 *   1. Implants placed = 18,000+ everywhere. /about and /doctor-referral said "7,000+ Full-mouth
 *      implants placed" and "Over 7,000 dental implants placed"; home and /meet-dr-nahlah carry the
 *      client's 2026-08-18 figure "18,000+ Implants placed". The counters take 18,000 with the
 *      meet-dr-nahlah label (a total of implants, not full-mouth cases).
 *   2. /veneers' breadcrumb "Cosmetic" linked /smile-makeover; the other cosmetic treatments'
 *      breadcrumbs link the hub, /cosmetic-dentistry. Only the breadcrumb link: the header nav's
 *      "Cosmetic" is /smile-makeover on every page by design.
 * Same discipline as push-keyword-h1.mjs: plan → --apply (read back every node) → --publish (only if
 * the draft holds nothing else).
 *   node seo-v3/push-copy-fixes-v3.mjs [--apply | --publish]     (INSTATIC_BASE_URL for staging)
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { api, getSite, getPages, toChangedPage, BASE } from '../sedation-api.mjs'

const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const HOST = BASE.replace(/^https?:\/\//, '')
const STATE = `.tmp/copy-fixes-v3-state-${HOST}.json`
mkdirSync('.tmp', { recursive: true })
const slugOf = (r) => r.cells?.slug ?? r.slug
const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex')

console.log(HOST, APPLY ? '(apply)' : PUBLISH ? '(publish)' : '(plan)')
const status = await api('GET', '/admin/api/cms/publish/status')
const list = (await getPages()).rows
const { site: shell0 } = await getSite()
if (PUBLISH) {
  const st = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : null
  if (!st) { console.error('no --apply state for this host'); process.exit(1) }
  const now = Object.fromEntries(list.map((r) => [r.id, r.seq]))
  const moved = Object.keys(st.seqs).filter((id) => now[id] !== st.seqs[id])
  if (moved.length || sha(shell0) !== st.shell || status.draftPages !== status.publishedPages) { console.error('REFUSING TO PUBLISH: the draft holds something else'); process.exit(1) }
  console.log('published', JSON.stringify(await api('POST', '/admin/api/cms/publish', {})).slice(0, 120))
  process.exit(0)
}
if (!status.draftMatchesPublished) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }
const crumbClass = Object.entries(shell0.styleRules).filter(([, r]) => r.kind === 'class' && ['pk-crumb', 'breadcrumb_component'].includes(r.name)).map(([id]) => id)

// [slug, node predicate, props patch]
const FIXES = [
  ...['about', 'doctor-referral'].flatMap((slug) => [
    [slug, (n) => n.props?.text === '7,000+', { text: '18,000+' }],
    [slug, (n) => n.props?.text === 'Over 7,000 dental implants placed', { text: 'Over 18,000 dental implants placed' }],
    [slug, (n) => n.props?.text === 'Full-mouth implants placed', { text: 'Implants placed' }],
    [slug, (n) => n.props?.htmlAttributes?.['data-count'] === '7000', (p) => ({ htmlAttributes: { ...p.htmlAttributes, 'data-count': '18000' } })],
  ]),
  ['veneers', (n, N) => n.moduleId === 'base.link' && n.props?.text === 'Cosmetic' && (N[n.parentId]?.classIds ?? []).some((c) => crumbClass.includes(c)), { href: '/cosmetic-dentistry' }],
]
const plans = []
for (const slug of [...new Set(FIXES.map((f) => f[0]))]) {
  const r0 = list.find((r) => slugOf(r) === slug)
  const row = (await api('GET', `/admin/api/cms/data/rows/${r0.id}`)).row
  const nodes = structuredClone(row.cells.body.nodes)
  const changed = []
  for (const [s, pred, patch] of FIXES.filter((f) => f[0] === slug)) {
    for (const n of Object.values(nodes).filter((x) => pred(x, nodes))) {
      const p = typeof patch === 'function' ? patch(n.props) : patch
      nodes[n.id] = { ...n, props: { ...n.props, ...p } }
      changed.push(n.id)
      console.log(`  /${s.padEnd(16)} ${n.id} ${JSON.stringify(p)}`)
    }
  }
  if (changed.length) plans.push({ row, slug, nodes, changed })
}
// expected: about 2 counters + 1 data-count + 2 labels + 1 bullet; doctor-referral 1 + 1 label (+ count if animated); veneers 1
console.log(`  ${plans.reduce((a, p) => a + p.changed.length, 0)} nodes on ${plans.length} pages`)
if (!plans.some((p) => p.slug === 'veneers')) console.log('  (veneers breadcrumb already fixed)')
if (!APPLY) { console.log('plan only — pass --apply'); process.exit(0) }

const { site: sh, seq } = await getSite()
await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: sh,
  changedPages: plans.map((p) => toChangedPage(p.row, { nodes: p.nodes })),
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(plans.map((p) => [p.row.id, p.row.seq])), shellBaseSeq: seq,
})
const problems = []
for (const p of plans) {
  const keep = Object.fromEntries(['seoTitle', 'seoDescription'].filter((k) => p.row.cells[k] !== undefined).map((k) => [k, p.row.cells[k]]))
  let back = (await api('GET', `/admin/api/cms/data/rows/${p.row.id}`)).row
  if (Object.entries(keep).some(([k, v]) => back.cells[k] !== v)) { await api('PATCH', `/admin/api/cms/data/rows/${p.row.id}`, { cells: { ...back.cells, ...keep } }); back = (await api('GET', `/admin/api/cms/data/rows/${p.row.id}`)).row }
  for (const k of new Set([...Object.keys(p.row.cells), ...Object.keys(back.cells)])) if (k !== 'body' && !isDeepStrictEqual(p.row.cells[k], back.cells[k])) problems.push(`/${p.slug}: cell ${k} changed`)
  const bn = p.row.cells.body.nodes, an = back.cells.body.nodes
  if (Object.keys(an).length !== Object.keys(bn).length) problems.push(`/${p.slug}: node count changed`)
  for (const [id, n] of Object.entries(bn)) if (!isDeepStrictEqual(an[id], p.changed.includes(id) ? p.nodes[id] : n)) problems.push(`/${p.slug}: node ${id} ${p.changed.includes(id) ? 'not as planned' : 'changed'}`)
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1) }
const { site: shell1 } = await getSite()
writeFileSync(STATE, JSON.stringify({ seqs: Object.fromEntries((await getPages()).rows.map((r) => [r.id, r.seq])), shell: sha(shell1) }, null, 1))
console.log(`  readback clean; shell ${sha(shell1) === sha(shell0) ? 'identical' : 'DIFFERS'} — re-run with --publish`)
