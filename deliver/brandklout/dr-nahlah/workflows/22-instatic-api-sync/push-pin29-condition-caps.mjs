#!/usr/bin/env node
/**
 * push-pin29-condition-caps.mjs — BugHerd #29, /dental-conditions: "capitalize
 * all words".
 *
 *   node push-pin29-condition-caps.mjs            # report the plan, write nothing
 *   node push-pin29-condition-caps.mjs --apply    # write the draft (does NOT publish)
 *
 * ## What the pin is on
 *
 * `section#conditions > .pk-faq > details > summary` — the ten accordion labels
 * in "Ten things people come in with." They were sentence case ("Loose
 * dentures"); the labels of an index are the one place on this page where title
 * case belongs, and the surrounding prose headings ("Even the small things
 * matter.") are deliberately sentence case and are NOT touched.
 *
 * ## The one judgement call
 *
 * "Capitalize all words" read literally gives "Missing Or Failing Teeth". This
 * uses ordinary title case instead, so the two coordinating conjunctions stay
 * lowercase — "Missing or Failing Teeth", "Yellow or Discolored Teeth". Every
 * other word on every label is capitalised. Flagged on the pin so the client can
 * ask for the literal version in one line if they want it.
 *
 * The text is on a `base.text` child of each `summary` container, never on the
 * summary itself, so the edit is keyed to those ten child ids and asserts the
 * before-text on each one rather than matching by position.
 *
 * NOTHING HERE PUBLISHES.
 */
import { getPages, getSite, api, toChangedPage } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')

/** id -> [expected before, after]. Ids are the base.text children of the ten
 *  `summary` containers in `#conditions`, read off the draft on 2026-09-21. */
const EDITS = {
  'IOh8y0z9mwGYu4-3sGoxl': ['Loose dentures', 'Loose Dentures'],
  'QsJzac-J6yNV89RVR47e1': ['Bad breath', 'Bad Breath'],
  'iA0vqbVBwyzL1DpFs5-pK': ['Bleeding gums', 'Bleeding Gums'],
  'ySuEG82OPJ386Gip-2ixn': ['Cracked teeth', 'Cracked Teeth'],
  '5hbvcObNsvX5NuhMCB3zX': ['Crooked teeth', 'Crooked Teeth'],
  'yIy-LB_f389lR6PYhcE4v': ['Gum disease', 'Gum Disease'],
  'c35R6--zuAiP4_osuA2VC': ['A gummy smile', 'A Gummy Smile'],
  'eq1eTXWpZkko7fNnnSx7F': ['Missing or failing teeth', 'Missing or Failing Teeth'],
  'KNi9-G_JQAf38kRp0Cpul': ['Toothache', 'Toothache'],
  'Kn2cnVfmlQRdFw_xC_Bow': ['Yellow or discolored teeth', 'Yellow or Discolored Teeth'],
}

const { rows } = await getPages()
const page = rows.find((r) => (r.cells?.slug ?? r.slug) === 'dental-conditions')
if (!page) throw new Error('dental-conditions not found')

const nodes = page.cells.body.nodes
console.log(`/dental-conditions — row ${page.id}, seq ${page.seq}, ${Object.keys(nodes).length} nodes\n`)

/* Every summary label on the page has to be accounted for, or the pin is only
   half fixed. Collect them from the tree rather than trusting the id list. */
const labels = Object.entries(nodes)
  .filter(([, n]) => n.props?.customTag === 'summary')
  .flatMap(([, n]) => n.children || [])
const missing = labels.filter((id) => !EDITS[id])
if (missing.length) {
  throw new Error(`summary labels not covered by this script: ${missing.join(', ')}`)
}
console.log(`${labels.length} summary labels on the page, all covered\n`)

const drift = []
for (const [id, [from, to]] of Object.entries(EDITS)) {
  const got = nodes[id]?.props?.text
  if (got === undefined) { drift.push(`${id}: node is gone`); continue }
  if (got !== from && got !== to) drift.push(`${id}: expected ${JSON.stringify(from)}, found ${JSON.stringify(got)}`)
  const done = got === to
  console.log(`  ${done ? 'already' : '   edit'}  ${JSON.stringify(from)} -> ${JSON.stringify(to)}`)
}
if (drift.length) {
  console.error('\nthe page has moved under this script:\n  ' + drift.join('\n  '))
  process.exit(1)
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
   endpoint answers a bare 400 "Invalid request body" without them. */
const { site, seq: shellBaseSeq } = await getSite()

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site,
  changedPages: [toChangedPage(page, { nodes: next })],
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: { [page.id]: page.seq },
  shellBaseSeq,
})
console.log(`\nsaved — seq ${res.seq}`)

/* Read back. This platform reports some write failures as prose with a 200. */
const after = (await getPages()).rows.find((r) => r.id === page.id)
const got = after.cells.body.nodes
const bad = Object.entries(EDITS).filter(([id, [, to]]) => got[id]?.props?.text !== to)
if (bad.length) throw new Error(`read-back mismatch on: ${bad.map(([id]) => id).join(', ')}`)
if (Object.keys(got).length !== Object.keys(nodes).length) {
  throw new Error(`node count changed: ${Object.keys(nodes).length} -> ${Object.keys(got).length}`)
}
console.log(`verified — ${labels.length} labels in title case, ${Object.keys(got).length} nodes total (unchanged)`)
console.log('\nDRAFT only. Publishing is a separate step.')
