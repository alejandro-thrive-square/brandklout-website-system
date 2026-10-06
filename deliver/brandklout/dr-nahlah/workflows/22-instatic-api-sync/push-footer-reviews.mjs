#!/usr/bin/env node
/**
 * push-footer-reviews.mjs — the per-office profile links the client supplied, in the footer's
 * "Find Us Online" block (Asana 1219087019480243, description updated 2026-10-06):
 *
 *   McLean      Facebook · Google · Yelp
 *   Alexandria  Facebook · Google · Yelp
 *   Instagram · RealSelf · Vitals · Healthgrades        (kept from 2026-10-05)
 *
 * It replaces the two links the 2026-10-05 run had to guess (one Facebook page, the McLean Google
 * profile) with the six the practice gave, one set per office.
 *
 *   node push-footer-reviews.mjs              # plan only (host from the worktree .env = production)
 *   node push-footer-reviews.mjs --apply      # write the drafts
 *   node push-footer-reviews.mjs --publish    # publish, only if those edits are the draft's only difference
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com node push-footer-reviews.mjs ...
 *
 * Works from either starting state: a footer that has the 2026-10-05 row (production) or one that
 * never got it (staging). Class names are resolved per host: production still has the old names,
 * staging the Client-First ones (class-standard/class-map.json).
 *
 * Only rows whose footer has the site footer grid are edited; the ads landing pages keep theirs
 * free of anything that leads away from the form. Every node is a clone of one already in that
 * page's footer and no class or CSS is added: the office list reuses the footer's own facts list
 * (bold label, soft text), the links the footer's own link. Layout is inline and wrap-safe (flex,
 * wrap), because the first column is under 200px wide between 720 and 800.
 *
 * Same write / verify / publish discipline as push-footer-social.mjs: chunks of 10 with their own
 * seqs, SEO cells re-applied (the shared client does it too), every untouched node deep-equal on
 * read-back, every other cell identical, publish refuses if anything else moved.
 */
import { randomBytes, createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { api, getSite, getPages, toChangedPage, BASE } from './sedation-api.mjs'
import { OFFICES, OTHERS } from './footer-reviews-links.mjs'

const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const HEADING = 'Find Us Online'
const SUPERSEDED = new Set(['Facebook', 'Google']) // the two guessed links the office sets replace
const STYLE_OFFICES_UL = { rowGap: '0.9rem' }
const STYLE_OFFICE_LI = { display: 'flex', flexWrap: 'wrap', columnGap: '1.25rem', rowGap: '0.3rem' }
const STYLE_LABEL = { width: '100%' }
const STYLE_OTHERS_UL = { display: 'flex', flexWrap: 'wrap', columnGap: '1.25rem', rowGap: '0.55rem', marginTop: '1rem' }

const HOST = BASE.replace(/^https?:\/\//, '')
const STATE = `.tmp/social/footer-reviews-state-${HOST}.json`
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

// Class names: production keeps the pre-standard names until it migrates; staging has the map's.
const rules = Object.entries(shell0.styleRules ?? {})
const has = (name) => rules.some(([, r]) => r.kind === 'class' && r.name === name)
const MAP = JSON.parse(readFileSync(new URL('./class-standard/class-map.json', import.meta.url), 'utf8')).rename
const resolve = (old) => (has(old) ? old : MAP[old])
const classId = (old) => {
  const name = resolve(old)
  const ids = rules.filter(([, r]) => r.kind === 'class' && r.name === name).map(([id]) => id)
  if (ids.length !== 1) { console.error(`${old} -> ${name}: ${ids.length} class id(s)`); process.exit(1) }
  return ids[0]
}
const GRID = classId('foot-grid'), BLURB = classId('foot-blurb'), FACTS = classId('foot-facts')
console.log(`  classes  ${['foot-grid', 'foot-blurb', 'foot-facts'].map((n) => `${n} = .${resolve(n)}`).join(', ')}`)

// ── plan every page ─────────────────────────────────────────────────────────
const fail = (slug, why) => { console.error(`/${slug}: ${why}`); process.exit(1) }
const plans = []
let already = 0
const skipped = []
for (const r0 of list) {
  const row = (await api('GET', `/admin/api/cms/data/rows/${r0.id}`)).row
  const slug = slugOf(row)
  const nodes = structuredClone(row.cells.body.nodes)
  const grids = Object.values(nodes).filter((n) => (n.classIds ?? []).includes(GRID))
  if (grids.length === 0) { skipped.push(slug); continue }
  if (grids.length !== 1) fail(slug, `${grids.length} footer grids`)
  const cols = grids[0].children.map((c) => nodes[c])
  if (cols.length !== 4) fail(slug, `footer grid has ${cols.length} columns`)
  const [col1, col2, , col4] = cols
  const subtree = (id, out = []) => { out.push(id); for (const c of nodes[id].children ?? []) subtree(c, out); return out }
  if (subtree(col1.id).some((id) => /DrNahlahAlexandria/.test(nodes[id].props?.href ?? ''))) { already++; continue }

  // sources to clone, all from this page's own footer
  const [h0, ul0] = col2.children.map((c) => nodes[c])
  const li0 = nodes[ul0?.children?.[0]], a0 = nodes[li0?.children?.[0]]
  const facts0 = col4.children.map((c) => nodes[c]).find((n) => (n.classIds ?? []).includes(FACTS))
  const factLi = nodes[facts0?.children?.[0]]
  const b0 = (factLi?.children ?? []).map((c) => nodes[c]).find((n) => n.props?.customTag === 'b')
  const t0 = nodes[b0?.children?.[0]]
  const blurb = nodes[col1.children[1]]
  if (!(blurb?.classIds ?? []).includes(BLURB) || h0?.props?.tag !== 'h2' || ul0?.props?.tag !== 'ul'
    || li0?.props?.customTag !== 'li' || a0?.moduleId !== 'base.link' || !b0 || t0?.moduleId !== 'base.text' || b0.children.length !== 1) {
    fail(slug, 'unexpected footer shape (sources)')
  }

  const added = [], removed = [], changed = new Set([col1.id])
  const clone = (src, parentId, patch = {}) => {
    const n = { ...structuredClone(src), id: nanoid(), parentId, children: [], ...patch }
    nodes[n.id] = n; added.push(n.id); return n
  }
  const link = (parent, label, href, aria) => {
    const li = parent.props?.tag === 'ul' ? clone(li0, parent.id) : null
    const a = clone(a0, (li ?? parent).id)
    // No rel: base.link emits rel="noopener noreferrer" for _blank itself (2026-10-05 gotcha).
    a.props = { ...a.props, href, text: label, target: '_blank', htmlAttributes: { 'aria-label': aria } }
    if (li) { li.children = [a.id]; parent.children.push(li.id) } else parent.children.push(a.id)
  }

  // heading + the "others" list: adjust the 2026-10-05 row, or create it where it never landed
  let h = col1.children.map((c) => nodes[c]).find((n) => n.props?.text === HEADING)
  let others
  if (h) {
    if (col1.children.length !== 4 || col1.children[2] !== h.id) fail(slug, 'column 1 is not logo, blurb, heading, list')
    others = nodes[col1.children[3]]
    if (others?.props?.tag !== 'ul') fail(slug, 'the node after the heading is not a list')
    const keep = []
    for (const liId of others.children) {
      const li = nodes[liId], a = nodes[li.children?.[0]]
      if (li.children.length !== 1 || a?.moduleId !== 'base.link') fail(slug, 'unexpected item in the profile list')
      if (SUPERSEDED.has(a.props.text)) { removed.push(li.id, a.id); delete nodes[li.id]; delete nodes[a.id] } else keep.push(liId)
    }
    const kept = keep.map((id) => nodes[nodes[id].children[0]].props.text)
    if (!isDeepStrictEqual(kept, OTHERS.map(([l]) => l)) || removed.length !== 4) fail(slug, `profile list is ${kept.join(', ')} with ${removed.length / 2} superseded`)
    others.children = keep
    others.inlineStyles = { ...STYLE_OTHERS_UL }
    changed.add(others.id)
  } else {
    if (col1.children.length !== 2) fail(slug, 'column 1 is not logo, blurb')
    h = clone(h0, col1.id, { inlineStyles: { marginTop: '2rem' } })
    h.props.text = HEADING
    others = clone(ul0, col1.id, { inlineStyles: { ...STYLE_OTHERS_UL } })
    for (const [label, href] of OTHERS) link(others, label, href, `Dr. Nahlah on ${label} (opens in a new tab)`)
  }

  // the office list: <ul facts><li><b>McLean</b><a>Facebook</a><a>Google</a><a>Yelp</a></li>…</ul>
  const offices = clone(ul0, col1.id, { classIds: [FACTS], inlineStyles: { ...STYLE_OFFICES_UL } })
  for (const [office, links] of OFFICES) {
    const li = clone(li0, offices.id, { inlineStyles: { ...STYLE_OFFICE_LI } })
    const b = clone(b0, li.id, { inlineStyles: { ...STYLE_LABEL } })
    const t = clone(t0, b.id)
    t.props = { ...t.props, text: office }
    b.children = [t.id]
    li.children = [b.id]
    for (const [label, href] of links) link(li, label, href, `Dr. Nahlah ${office} on ${label} (opens in a new tab)`)
    offices.children.push(li.id)
  }
  col1.children = [col1.children[0], col1.children[1], h.id, offices.id, others.id]
  plans.push({ row, slug, nodes, added, removed, changed: [...changed] })
}
const shapes = new Map()
for (const p of plans) { const k = `+${p.added.length} -${p.removed.length}`; shapes.set(k, (shapes.get(k) ?? 0) + 1) }
console.log(`  pages    ${list.length}: ${plans.length} to edit (${[...shapes].map(([k, n]) => `${n} x nodes ${k}`).join(', ') || '-'}), ${already} already done, ${skipped.length} without a site footer`)
console.log(`  skipped  ${skipped.join(', ')}`)
if (!APPLY) { console.log('plan only — pass --apply'); process.exit(0) }
if (!plans.length) { console.log('nothing to write'); process.exit(0) }

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

// ── restore SEO cells a page write drops, then read everything back ─────────
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
  if (slugOf(back) !== p.slug || back.slug !== p.row.slug) problems.push(`/${p.slug}: slug now ${slugOf(back)} / ${back.slug}`)
  if (after.body.rootNodeId !== before.body.rootNodeId) problems.push(`/${p.slug}: root moved`)
  const bn = before.body.nodes, an = after.body.nodes
  if (Object.keys(an).length !== Object.keys(bn).length + p.added.length - p.removed.length) problems.push(`/${p.slug}: node count ${Object.keys(bn).length} -> ${Object.keys(an).length}`)
  for (const [id, n] of Object.entries(bn)) {
    if (p.removed.includes(id)) { if (an[id]) problems.push(`/${p.slug}: removed node ${id} is still there`); continue }
    if (p.changed.includes(id)) { if (!isDeepStrictEqual(an[id], p.nodes[id])) problems.push(`/${p.slug}: node ${id} differs from plan`); continue }
    if (!isDeepStrictEqual(an[id], n)) problems.push(`/${p.slug}: untouched node ${id} changed`)
  }
  for (const id of p.added) if (!isDeepStrictEqual(an[id], p.nodes[id])) problems.push(`/${p.slug}: new node ${id} not as written`)
}
if (problems.length) { console.error(`READ-BACK PROBLEMS (${problems.length}):\n  ${problems.slice(0, 30).join('\n  ')}`); process.exit(1) }
console.log(`  readback ${plans.length} pages: only the planned nodes differ; every other node and cell is identical`)

const { site: shell1 } = await getSite()
console.log(`  shell    ${sha(shell1) === shellHash ? 'identical' : 'DIFFERS'} after our writes`)
const seqs = Object.fromEntries((await getPages()).rows.map((r) => [r.id, r.seq]))
writeFileSync(STATE, JSON.stringify({ seqs, shell: sha(shell1), at: new Date().toISOString() }, null, 1))
console.log(`  status   ${JSON.stringify(await api('GET', '/admin/api/cms/publish/status'))}`)
console.log('draft only — re-run with --publish')
