#!/usr/bin/env node
/**
 * drop-footer-social-rel.mjs — one-off after push-footer-social.mjs's first run
 * (2026-10-05): its six links carried rel in htmlAttributes, and base.link adds
 * rel="noopener noreferrer" for _blank itself, so every page published the
 * attribute twice. Removes the htmlAttributes copy; nothing else changes.
 *
 *   node one-offs/drop-footer-social-rel.mjs [--apply | --publish]   (run from 22-instatic-api-sync)
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { api, getSite, getPages, toChangedPage, BASE } from '../sedation-api.mjs'

const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const HOST = BASE.replace(/^https?:\/\//, '')
const STATE = `.tmp/social/rel-state-${HOST}.json`
mkdirSync('.tmp/social', { recursive: true })
const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex')
const slugOf = (r) => r.cells?.slug ?? r.slug
const isSocial = (n) => n.moduleId === 'base.link' && n.props?.target === '_blank'
  && /opens in a new tab\)$/.test(n.props?.htmlAttributes?.['aria-label'] ?? '') && 'rel' in (n.props.htmlAttributes ?? {})

const status = await api('GET', '/admin/api/cms/publish/status')
console.log(HOST, APPLY ? '(apply)' : PUBLISH ? '(publish)' : '(plan)', JSON.stringify(status))
const list = (await getPages()).rows
const { site: shell0 } = await getSite()

if (PUBLISH) {
  const st = existsSync(STATE) && JSON.parse(readFileSync(STATE, 'utf8'))
  if (!st) { console.error('no --apply state'); process.exit(1) }
  const moved = list.filter((r) => st.seqs[r.id] !== r.seq).length + Object.keys(st.seqs).filter((id) => !list.some((r) => r.id === id)).length
  if (moved || sha(shell0) !== st.shell) { console.error('REFUSING TO PUBLISH: draft moved since --apply'); process.exit(1) }
  console.log('published', JSON.stringify(await api('POST', '/admin/api/cms/publish', {})))
  console.log('after', JSON.stringify(await api('GET', '/admin/api/cms/publish/status')))
  process.exit(0)
}
if (!status.draftMatchesPublished) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }

const plans = []
for (const r0 of list) {
  const row = (await api('GET', `/admin/api/cms/data/rows/${r0.id}`)).row
  const nodes = structuredClone(row.cells.body.nodes)
  const hits = Object.values(nodes).filter(isSocial)
  if (!hits.length) continue
  if (hits.length !== 6) { console.error(`/${slugOf(row)}: ${hits.length} social links`); process.exit(1) }
  for (const n of hits) delete n.props.htmlAttributes.rel
  plans.push({ row, slug: slugOf(row), nodes, ids: hits.map((n) => n.id) })
}
console.log(`  pages    ${plans.length} to fix`)
if (!APPLY) process.exit(0)

for (let k = 0; k < plans.length; k += 10) {
  const chunk = plans.slice(k, k + 10)
  const { site: sh, seq } = await getSite()
  await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental', site: sh,
    changedPages: chunk.map((p) => toChangedPage(p.row, { nodes: p.nodes })),
    deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: Object.fromEntries(chunk.map((p) => [p.row.id, p.row.seq])), shellBaseSeq: seq,
  })
}
const problems = []
for (const p of plans) {
  const keep = Object.fromEntries(['seoTitle', 'seoDescription'].filter((k) => p.row.cells[k] !== undefined).map((k) => [k, p.row.cells[k]]))
  let back = (await api('GET', `/admin/api/cms/data/rows/${p.row.id}`)).row
  if (Object.entries(keep).some(([k, v]) => back.cells[k] !== v)) {
    await api('PATCH', `/admin/api/cms/data/rows/${p.row.id}`, { cells: { ...back.cells, ...keep } })
    back = (await api('GET', `/admin/api/cms/data/rows/${p.row.id}`)).row
    console.log(`  seo      /${p.slug}: re-applied`)
  }
  for (const k of new Set([...Object.keys(p.row.cells), ...Object.keys(back.cells)])) {
    if (k !== 'body' && !isDeepStrictEqual(p.row.cells[k], back.cells[k])) problems.push(`/${p.slug}: cell ${k} changed`)
  }
  if (!isDeepStrictEqual(back.cells.body.nodes, p.nodes)) problems.push(`/${p.slug}: body differs from plan`)
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1) }
console.log(`  readback ${plans.length} pages: body exactly as planned, other cells intact`)
const { site: shell1 } = await getSite()
console.log(`  shell    ${sha(shell1) === sha(shell0) ? 'identical' : 'DIFFERS'}`)
writeFileSync(STATE, JSON.stringify({ seqs: Object.fromEntries((await getPages()).rows.map((r) => [r.id, r.seq])), shell: sha(shell1) }))
console.log('draft only — re-run with --publish')
