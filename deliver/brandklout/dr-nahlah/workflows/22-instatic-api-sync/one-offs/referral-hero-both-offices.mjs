#!/usr/bin/env node
/**
 * referral-hero-both-offices.mjs — /doctor-referral hero lead names both offices:
 * "A prosthodontic and implant referral practice in Tysons Corner." → "… in Tysons Corner and
 * Alexandria." (Brandklout review, Jessica, 2026-10-06). One text prop on one node; the
 * read-back requires every other node deep-equal to before. Matched by text, not class, so it
 * runs on production (old class names) and staging (Client-First) alike.
 *
 *   node one-offs/referral-hero-both-offices.mjs [--apply | --publish]   (run from 22-instatic-api-sync;
 *   INSTATIC_BASE_URL for staging)
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { api, getSite, getPages, BASE } from '../sedation-api.mjs'

const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const HOST = BASE.replace(/^https?:\/\//, '')
const STATE = `.tmp/referral/hero-offices-state-${HOST}.json`
mkdirSync('.tmp/referral', { recursive: true })
const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex')
const slugOf = (r) => r.cells?.slug ?? r.slug
const OLD = 'A prosthodontic and implant referral practice in Tysons Corner. Thank you for partnering with us.'
const NEW = 'A prosthodontic and implant referral practice in Tysons Corner and Alexandria. Thank you for partnering with us.'

const status = await api('GET', '/admin/api/cms/publish/status')
console.log(HOST, APPLY ? '(apply)' : PUBLISH ? '(publish)' : '(plan)', JSON.stringify(status))
const rows = (await getPages()).rows
const dst = rows.find((r) => slugOf(r) === 'doctor-referral')
const { site: shell0, seq: shellSeq0 } = await getSite()

if (PUBLISH) {
  const st = existsSync(STATE) && JSON.parse(readFileSync(STATE, 'utf8'))
  if (!st) { console.error('no --apply state'); process.exit(1) }
  const moved = rows.filter((r) => st.seqs[r.id] !== r.seq).length
  if (moved || sha(shell0) !== st.shell) { console.error('REFUSING TO PUBLISH: draft moved since --apply'); process.exit(1) }
  console.log('published', JSON.stringify(await api('POST', '/admin/api/cms/publish', {})))
  console.log('after', JSON.stringify(await api('GET', '/admin/api/cms/publish/status')))
  process.exit(0)
}
if (!status.draftMatchesPublished) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }

const row = (await api('GET', `/admin/api/cms/data/rows/${dst.id}`)).row
const before = row.cells.body.nodes
const nodes = structuredClone(before)
const hits = Object.values(nodes).filter((n) => typeof n.props?.text === 'string' && n.props.text.includes(OLD))
if (hits.length !== 1) { console.error(`found ${hits.length} node(s) with the old line`); process.exit(1) }
hits[0].props.text = hits[0].props.text.replace(OLD, NEW)
console.log(`  ${hits[0].moduleId} ${hits[0].id}: "${hits[0].props.text}"`)
if (!APPLY) process.exit(0)

await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: shell0,
  changedPages: [{ id: dst.id, slug: slugOf(row), title: row.cells.title, nodes, rootNodeId: row.cells.body.rootNodeId }],
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: { [dst.id]: row.seq }, shellBaseSeq: shellSeq0,
})
const back = (await api('GET', `/admin/api/cms/data/rows/${dst.id}`)).row
const problems = []
if (!isDeepStrictEqual(back.cells.body.nodes, nodes)) problems.push('body differs from plan')
for (const k of ['title', 'slug']) if (back.cells[k] !== row.cells[k]) problems.push(`cell ${k} changed`)
const rowsAfter = (await getPages()).rows
const movedOthers = rowsAfter.filter((r) => r.id !== dst.id && rows.find((x) => x.id === r.id)?.seq !== r.seq).length
const { site: shell1 } = await getSite()
if (movedOthers) problems.push(`${movedOthers} other rows moved`)
if (sha(shell1) !== sha(shell0)) problems.push('shell differs')
if (problems.length) { console.error(problems.join('\n')); process.exit(1) }
console.log(`  readback body exactly as planned (${Object.keys(nodes).length} nodes); other rows and shell untouched`)
writeFileSync(STATE, JSON.stringify({ seqs: Object.fromEntries(rowsAfter.map((r) => [r.id, r.seq])), shell: sha(shell1) }))
console.log('draft only — re-run with --publish')
