#!/usr/bin/env node
/**
 * Two copy corrections on the home page, requested 2026-08-25.
 *
 *   1. "recognised" -> "recognized". British spelling on a Virginia practice's
 *      site. One visible instance (the Chapter 02 H2); the other two live in
 *      `seo.json`'s ogDesc for /meet-dr-nahlah and reach the page only through
 *      `src/scripts/seo-head.js`, which is a SEPARATE push — see below.
 *
 *   2. Review dates day-first -> month-first: "18 Aug 2026" -> "Aug 18, 2026".
 *      US convention, and it is what the client asked for.
 *
 * SCOPE, AND WHAT IS DELIBERATELY NOT IN IT
 * -----------------------------------------
 * The six `.rv-card` dates are the ONLY review dates on the site — the vendor
 * ReputationHub widget below them renders inside an iframe this cannot reach
 * (and Instatic's CSP blocks that frame anyway, which is why the native cards
 * exist at all). All 43 blog posts carry the same day-first `.bl-when` format;
 * they are a separate ask and are not touched here.
 *
 * Matching is by NODE ID plus an exact expected-text assertion, not by regex
 * sweep: a blind find-and-replace over 669 nodes cannot tell a review date from
 * a date in body copy, and there is no undo for the one it gets wrong.
 *
 *   node push-home-copy-fixes.mjs              # dry run, prints every edit
 *   node push-home-copy-fixes.mjs --apply
 *
 * Draft only. Publishing is a separate, announced step.
 */
import { getPages, getSite, api, toChangedPage } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')

/** id -> [expected current text, new text]. Both asserted before anything is written. */
const EDITS = {
  'Y5KlCvwCPKWTiyL65rDlp': ['One of twelve recognised dental specialties.',
                            'One of twelve recognized dental specialties.'],
  'rvwall-4':  ['18 Aug 2026', 'Aug 18, 2026'],
  'rvwall-e':  ['18 Aug 2026', 'Aug 18, 2026'],
  'rvwall-o':  ['17 Aug 2026', 'Aug 17, 2026'],
  'rvwall-y':  ['13 Aug 2026', 'Aug 13, 2026'],
  'rvwall-18': ['13 Aug 2026', 'Aug 13, 2026'],
  'rvwall-1i': ['13 Aug 2026', 'Aug 13, 2026'],
}

const { rows } = await getPages()
const home = rows.find((r) => r.slug === 'index')
if (!home) throw new Error('no page with slug "index"')

const nodes = home.cells?.body?.nodes
if (!nodes) throw new Error('home row carries no body.nodes')

/* Assert the whole plan before touching anything. A partial apply on a page
   tree is the worst outcome available here. */
const problems = []
for (const [id, [want]] of Object.entries(EDITS)) {
  const node = nodes[id]
  if (!node) { problems.push(`${id}: node not found`); continue }
  if (node.moduleId !== 'base.text') { problems.push(`${id}: moduleId is ${node.moduleId}, not base.text`); continue }
  if (node.props?.text !== want) {
    problems.push(`${id}: text is ${JSON.stringify(node.props?.text)}, expected ${JSON.stringify(want)}`)
  }
}

/* A sweep for anything the id list missed — if the page still says "recognised"
   somewhere else after this runs, the report should say so rather than imply
   the page is clean. */
const strays = Object.keys(nodes).filter(
  (id) => !EDITS[id] && /recognised|\b\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) 20\d\d\b/
    .test(nodes[id].props?.text ?? ''))

if (problems.length) {
  console.error('refusing to write — the page is not in the state this script was written against:')
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}

console.log(`home page ${home.id} (seq ${home.seq}), ${Object.keys(nodes).length} nodes\n`)
for (const [id, [from, to]] of Object.entries(EDITS)) {
  console.log(`  ${id.padEnd(24)} ${JSON.stringify(from)}\n  ${' '.repeat(24)} -> ${JSON.stringify(to)}`)
}
if (strays.length) {
  console.log(`\nNOT covered by this script (${strays.length}):`)
  for (const id of strays) console.log(`  ${id}: ${JSON.stringify(nodes[id].props.text).slice(0, 120)}`)
}

if (!APPLY) {
  console.log('\ndry run — nothing written. Re-run with --apply.')
  process.exit(0)
}

const next = structuredClone(nodes)
for (const [id, [, to]] of Object.entries(EDITS)) {
  next[id] = { ...next[id], props: { ...next[id].props, text: to } }
}

/* `site` and `shellBaseSeq` are BOTH required even for a page-only write — the
   endpoint answers a bare 400 "Invalid request body" without them, which reads
   like a malformed page payload and is not. The shell is passed through
   untouched; `mode: 'incremental'` leaves every unmentioned page alone. */
const { site, seq: shellBaseSeq } = await getSite()

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site,
  changedPages: [toChangedPage(home, { nodes: next })],
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: { [home.id]: home.seq },
  shellBaseSeq,
})
console.log(`\nsaved — seq ${res.seq}`)

/* Read back. This platform reports some write failures as prose with a 200. */
const after = (await getPages()).rows.find((r) => r.slug === 'index')
const got = after.cells.body.nodes
const bad = Object.entries(EDITS).filter(([id, [, to]]) => got[id]?.props?.text !== to)
if (bad.length) {
  throw new Error(`read-back mismatch on: ${bad.map(([id]) => id).join(', ')}`)
}
if (Object.keys(got).length !== Object.keys(nodes).length) {
  throw new Error(`node count changed: ${Object.keys(nodes).length} -> ${Object.keys(got).length}`)
}
console.log(`verified — ${Object.keys(EDITS).length} nodes carry the new text, `
  + `${Object.keys(got).length} nodes total (unchanged)`)
console.log('\nDRAFT only. `node insta-api.mjs publish` is a separate step.')
