#!/usr/bin/env node
/**
 * push-office-twins.mjs — second pass on the Dr. Nahlah office pages (after push-office-pages.mjs):
 * the blocks the two pages still shared word for word are written per office, so the twins pass the
 * overlap gate (page-overlap.mjs, at most 25% shared). Same facts, different words; nothing new claimed.
 *   #book     each page lists only its own office's phones (the other office's block is dropped);
 *             Alexandria's heading and paragraph are rewritten, McLean keeps the site's original wording
 *   #visiting Alexandria's "before you come" list is rewritten; McLean keeps the original
 *   McLean    the hours bullet, four FAQ items and the lead are reworded away from Alexandria's
 * Measured before (staging, 2026-10-08): 58.2% shared, 107 of the shared shingles being the site-wide
 * menu drawer, which every page carries and the gate counts.
 *
 *   node output/code/push-office-twins.mjs                          # plan
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com STAGING_HOST=staging.drnahlah.com node output/code/push-office-twins.mjs --apply [--publish]
 * Run from scenario-7-seo-aeo/03-office-pages.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const lib = (p) => import(pathToFileURL(resolve('../../tools/instatic-site', p)).href)
const { api, getSite, getPages, toChangedPage, publish, publishStatus, BASE } = await lib('lib/site.mjs')
const { assertStaging } = await lib('lib/staging-guard.mjs')
const APPLY = process.argv.includes('--apply'), PUBLISH = process.argv.includes('--publish')
if (APPLY) assertStaging()

// [text the node starts with, its new text]: each must match exactly one text or link node on the page
const TEXT = {
  'contact-alexandria': [
    ['Tell us what you are dealing with.', 'Start with a consultation in Alexandria.'],
    ['A consultation includes the 3D scan', 'The first visit includes a 3D scan and an honest read of what your case needs, and a second opinion on implant surgery costs nothing.'],
    [' Prefer to speak to someone?', ' Rather call the Alexandria office?'],
    [' If anxiety is what has kept you away', ' If nerves have kept you from the dentist, tell the team when you call: the visit is planned around it.'],
    ['What to bring, and what to expect.', 'Before your first visit in Alexandria.'],
    ['Any existing treatment plan or quote', 'A quote or treatment plan from another practice, if you have one: a second opinion on implant surgery is free'],
    ['Recent imaging, if another practice', 'Scans or X-rays another office has already taken'],
    ['Your insurance details', 'Your dental insurance card: most PPO plans are accepted, and the office files the claim'],
    ['A list of medications', 'The medicines you take, above all if you may have sedation'],
    ['Time. A first consultation', 'Enough time for an exam and a cone-beam scan, both part of the first consultation'],
    ['Cost and financing before you come', 'What it costs, and ways to pay'],
  ],
  'contact-mclean': [
    ['Dr. Nahlah\'s Tysons Corner office is in Suite 220', 'Dr. Nahlah\'s Tysons Corner office is in Suite 220 at 7901 Jones Branch Drive, McLean, close to Vienna, Great Falls and Reston. Dental implants, All-on-4, dentures and veneers by a board-certified prosthodontist.'],
    ['Open Monday to Thursday, 8 am to 5 pm', 'Open 8 am–5 pm Monday through Thursday, and 8 am–2 pm on Fridays'],
    ['7901 Jones Branch Drive, Suite 220, McLean, VA 22102, in Tysons.', '7901 Jones Branch Drive, Suite 220, McLean, VA 22102, in Tysons. The office\'s Google listing gives a route from wherever you are.'],
    ['Directions on Google Maps →', 'Open the Google listing →'],
    ['What are the office hours in McLean?', 'What hours does the Tysons Corner office keep?'],
    ['The Tysons Corner office opens Monday to Thursday', 'It opens at 8 am every weekday and closes at 5 pm Monday through Thursday, 2 pm on Friday. There are no weekend hours.'],
    ['Which number should I call?', 'What is the phone number?'],
    ['Is the Tysons Corner office the closer one for me?', 'Is Tysons Corner the nearer office for me?'],
    ['For most patients in McLean', 'Usually, if you live in McLean, Tysons, Vienna, Great Falls, Falls Church or Reston. From Alexandria, the Duke Street office is usually closer.'],
    ['Yes. The same team and the same standards', 'Yes. One team and one set of standards run both offices, and the board-certified prosthodontist Dr. Esam Nahlah sees patients in each.'],
    ['Meet Dr. Nahlah →', 'About Dr. Nahlah →'],
  ],
}
// the #book paragraph lists both offices' phones: keep only this page's office
const KEEP_OFFICE = { 'contact-alexandria': 'Alexandria', 'contact-mclean': 'Tysons Corner · McLean' }

const status = await publishStatus()
const rows = (await getPages()).rows
const rowOf = async (slug) => { const r = rows.find((x) => (x.cells?.slug ?? x.slug) === slug); return (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row }
const byHtmlId = (N, id) => Object.values(N).find((n) => n.props?.htmlAttributes?.id === id)
const under = (N, rootId) => { const out = []; const w = (id) => { if (!N[id]) return; out.push(N[id]); (N[id].children || []).forEach(w) }; w(rootId); return out }
const problems = [], plans = []

for (const slug of Object.keys(TEXT)) {
  const row = await rowOf(slug)
  const N0 = row.cells.body.nodes, N = structuredClone(N0)
  const changed = new Set(), dropped = []
  if (!byHtmlId(N, 'local-faq')) { problems.push(`${slug}: no #local-faq — run push-office-pages.mjs first`); continue }
  const main = Object.values(N).find((n) => n.props?.tag === 'main')
  const inMain = (n) => { for (let p = n; p; p = N[p.parentId]) if (p.id === main.id) return true; return false }

  // #book: drop the other office's phone block (b, br, text, link, br, text, link, br, br)
  const book = byHtmlId(N, 'book')
  const para = under(N, book.id).find((n) => n.props?.customTag === 'p' && (n.children || []).some((c) => N[c]?.props?.customTag === 'b'))
  const ch = para.children
  const officeOf = (id) => N[id]?.props?.customTag === 'b' ? under(N, id).find((n) => n.moduleId === 'base.text')?.props?.text : null
  const blocks = ch.map((id, i) => [officeOf(id), i]).filter(([o]) => o)
  if (blocks.length === 2) {
    const [other, at] = blocks.find(([o]) => o !== KEEP_OFFICE[slug]) ?? []
    const run = ch.slice(at, at + 9).map((id) => N[id])
    const shape = run.map((n) => n.moduleId === 'base.link' ? 'a' : n.moduleId === 'base.text' ? 't' : n.props?.customTag).join(' ')
    if (shape !== 'b br t a br t a br br') problems.push(`${slug}: #book block for ${other} is "${shape}", expected "b br t a br t a br br"`)
    else {
      for (const n of run) for (const d of under(N, n.id)) { delete N[d.id]; dropped.push(d.id) }
      para.children = ch.filter((id) => !run.some((n) => n.id === id)); changed.add(para.id)
    }
  } else if (!(blocks.length === 1 && blocks[0][0] === KEEP_OFFICE[slug])) problems.push(`${slug}: #book lists ${blocks.map(([o]) => o).join(', ') || 'no office'}`)

  for (const [old, text] of TEXT[slug]) {
    const hits = Object.values(N).filter((n) => ['base.text', 'base.link'].includes(n.moduleId) && inMain(n) && typeof n.props?.text === 'string' && (n.props.text.startsWith(old) || n.props.text === text))
    if (hits.length !== 1) { problems.push(`${slug}: "${old.slice(0, 40)}" matches ${hits.length} nodes`); continue }
    if (hits[0].props.text === text) continue
    hits[0].props = { ...hits[0].props, text }; changed.add(hits[0].id)
  }
  plans.push({ slug, row, N0, N, changed: [...changed], dropped })
}

console.log(`${APPLY ? 'APPLY' : 'PLAN'} on ${BASE}`)
console.log(`  status   ${JSON.stringify(status)}`)
for (const p of plans) console.log(`  ${p.slug.padEnd(20)} ${p.changed.length} nodes changed, ${p.dropped.length} dropped`)
for (const pr of problems) console.log(`  !! ${pr}`)
if (!APPLY) process.exit(problems.length ? 1 : 0)
if (problems.length) { console.error('REFUSING: problems above'); process.exit(1) }
if (status.draftMatchesPublished !== true) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }
const todo = plans.filter((p) => p.changed.length || p.dropped.length)
if (!todo.length) { console.log('nothing to change'); process.exit(0) }

const BK = resolve('output/backups'); mkdirSync(BK, { recursive: true })
const bf = join(BK, `office-twins-${new URL(BASE).hostname}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
writeFileSync(bf, JSON.stringify(todo.map((p) => p.row)))
console.log(`  backup   ${bf}`)
const { site: sh, seq } = await getSite()
await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: sh,
  changedPages: todo.map((p) => toChangedPage(p.row, { nodes: p.N })),
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(todo.map((p) => [p.row.id, p.row.seq])), shellBaseSeq: seq,
})
console.log(`  wrote    ${todo.map((p) => p.slug).join(', ')}`)

const bad = []
for (const p of todo) {
  const keep = Object.fromEntries(['seoTitle', 'seoDescription'].filter((k) => p.row.cells[k] !== undefined).map((k) => [k, p.row.cells[k]]))
  let back = (await api('GET', `/admin/api/cms/data/rows/${p.row.id}`)).row
  if (Object.entries(keep).some(([k, v]) => back.cells[k] !== v)) {
    await api('PATCH', `/admin/api/cms/data/rows/${p.row.id}`, { cells: { ...back.cells, ...keep } })
    back = (await api('GET', `/admin/api/cms/data/rows/${p.row.id}`)).row
  }
  const an = back.cells.body.nodes
  for (const [id, n] of Object.entries(p.N0)) {
    if (p.dropped.includes(id)) { if (an[id]) bad.push(`${p.slug}: dropped node ${id} still there`); continue }
    if (!isDeepStrictEqual(an[id], p.N[id])) bad.push(`${p.slug}: node ${id} ${p.changed.includes(id) ? 'differs from plan' : 'changed though untouched'}`)
  }
  if (Object.keys(an).length !== Object.keys(p.N).length) bad.push(`${p.slug}: node count ${Object.keys(an).length}, planned ${Object.keys(p.N).length}`)
  for (const k of ['title', 'seoTitle', 'seoDescription', 'slug']) if (back.cells[k] !== p.row.cells[k]) bad.push(`${p.slug}: cell ${k} changed`)
}
for (const b of bad.slice(0, 20)) console.log(`  !! ${b}`)
if (bad.length) { console.log(`READ-BACK FAILED (${bad.length}) — restore from ${bf}`); process.exit(1) }
console.log('  readback clean')
if (PUBLISH) { const r = await publish(); console.log(`published ${JSON.stringify(r)}`) } else console.log('draft only — pass --publish after checking')
