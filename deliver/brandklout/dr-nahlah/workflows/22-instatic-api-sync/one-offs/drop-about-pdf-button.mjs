#!/usr/bin/env node
/**
 * drop-about-pdf-button.mjs — /doctor-referral #referral-forms: remove the
 * "About Dr. Nahlah (PDF)" button and the sentence that pointed at it ("The second
 * sheet introduces Dr. Nahlah…"). Client, 2026-10-05. Nothing else on the page moves:
 * the read-back requires every other node deep-equal to before.
 *
 *   node one-offs/drop-about-pdf-button.mjs [--apply | --publish]   (run from 22-instatic-api-sync)
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { api, getSite, getPages, BASE } from '../sedation-api.mjs'

const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const HOST = BASE.replace(/^https?:\/\//, '')
const STATE = `.tmp/referral/about-btn-state-${HOST}.json`
mkdirSync('.tmp/referral', { recursive: true })
const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex')
const slugOf = (r) => r.cells?.slug ?? r.slug
const SENTENCE = ' The second sheet introduces Dr. Nahlah, his training and his qualifications.'

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
const sec = Object.values(nodes).find((n) => n.props?.htmlAttributes?.id === 'referral-forms')
const under = (id) => [nodes[id], ...(nodes[id].children ?? []).flatMap(under)]
const inSec = under(sec.id)
const btns = inSec.filter((n) => n.props?.href === '/about-dr-nahlah.pdf')
const paras = inSec.filter((n) => n.moduleId === 'base.text' && n.props?.text?.includes(SENTENCE))
if (btns.length !== 1 || paras.length !== 1) { console.error(`found ${btns.length} button(s), ${paras.length} paragraph(s)`); process.exit(1) }
const btn = btns[0], para = paras[0]
const gone = under(btn.id).map((n) => n.id)
nodes[btn.parentId].children = nodes[btn.parentId].children.filter((c) => c !== btn.id)
for (const id of gone) delete nodes[id]
para.props.text = para.props.text.replace(SENTENCE, '')
console.log(`  button   "${btn.props.label ?? btn.props.text}" (${gone.length} node(s)) removed; its row keeps ${nodes[btn.parentId].children.length}`)
console.log(`  text     "${para.props.text}"`)
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
console.log(`  readback body exactly as planned (${Object.keys(before).length} -> ${Object.keys(nodes).length} nodes); other rows and shell untouched`)
writeFileSync(STATE, JSON.stringify({ seqs: Object.fromEntries(rowsAfter.map((r) => [r.id, r.seq])), shell: sha(shell1) }))
console.log('draft only — re-run with --publish')
