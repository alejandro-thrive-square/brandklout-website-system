#!/usr/bin/env node
/**
 * resolve-home-image-clash.mjs — BugHerd #11 vs #8, the one collision.
 * DRAFT ONLY, NEVER PUBLISHES.
 *
 *   node resolve-home-image-clash.mjs            # dry run
 *   node resolve-home-image-clash.mjs --apply
 *
 * ## What happened
 *
 * Pins #8 and #11 ran against the same draft at the same time. #8 was filling
 * eleven `#svcGrid .sv-card` service cards on the home page; #11 was clearing
 * same-page repeats everywhere. Both of us independently reached for the same
 * library photograph — `8L6A7479.jpg`, the practice's own intraoral scanner and
 * its scan on screen, previously unused and the most obviously "digital" image
 * in a 443-asset library.
 *
 * The result was a NEW same-page repeat on `/index`, created by the two fixes
 * landing together:
 *
 *   #pathPin > .pa-card > .pa-shot   (mine, Chapter 05 card 02 "Digital Smile Design")
 *   #svcGrid > .sv-card > .sv-shot   (theirs)
 *
 * Neither of us was wrong on our own; the collision only exists jointly. This is
 * exactly what `.tmp/bugherd/briefs/NOTES-images.md` was for, and it is the
 * honest lesson: a claims file only works if the claim is written down BEFORE
 * the asset is used, not after.
 *
 * ## Why MY instance moves
 *
 * `#services` is the section the client pinned on #8 and the harder constraint —
 * eleven cards to fill from one library. My slot is one card of four, and I
 * already hold a licensed image that fits it better than the scanner did: the
 * Chapter 05 card says "the final teeth are designed before a single implant is
 * placed — you approve the result in advance", and the Freepik asset licensed
 * for `/doctor-referral` is a clinician showing an arch scan on a wall screen to
 * a seated patient. Approving a design in advance is what that photograph is.
 *
 * Cross-page reuse is explicitly outside this pin's rule ("on the same page"),
 * so sharing it with `/doctor-referral` costs nothing and spends no quota.
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, getPages, getSite, toChangedPage } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const LEDGER = join(HERE, '.tmp', 'pin11', 'uploaded.json')
const APPLY = process.argv.includes('--apply')

const NODE = 'opGWBWrurdecOO9mckl2b'      // /index, Chapter 05 path card 02
const EXPECT = '8L6A7479.jpg'

if (!existsSync(LEDGER)) { console.error(`no upload ledger at ${LEDGER} — run dedupe-page-images.mjs --apply first`); process.exit(1) }
const uploaded = JSON.parse(readFileSync(LEDGER, 'utf8'))
const target = uploaded.cbct
if (!target?.publicPath) { console.error('the "cbct" asset is not in the ledger'); process.exit(1) }

const rows = (await getPages()).rows
const home = rows.find((r) => r.slug === 'index')
if (!home) throw new Error('no page with slug "index"')
const nodes = home.cells.body.nodes
const node = nodes[NODE]
if (!node) throw new Error(`${NODE}: node not found`)
if (node.moduleId !== 'base.image') throw new Error(`${NODE}: moduleId is ${node.moduleId}`)

const current = node.props.src.replace(/^\/uploads\/[A-Za-z0-9_-]{21}-/, '')
if (current !== EXPECT) {
  // Either someone already fixed it, or #8 moved instead. Either way, stop.
  console.log(`${NODE} holds "${current}", not "${EXPECT}" — nothing to do.`)
  process.exit(0)
}

// Confirm the clash is real before moving anything: the whole justification is
// that this asset renders twice on THIS page.
const twins = Object.entries(nodes).filter(([, n]) => n.moduleId === 'base.image' && n.props?.src === node.props.src)
console.log(`${EXPECT} renders ${twins.length}x on /index:`)
for (const [id] of twins) console.log(`  ${id}`)
if (twins.length < 2) { console.log('no clash on this draft — nothing to do.'); process.exit(0) }

console.log(`\nwould set ${NODE} -> ${target.publicPath}  (${target.width}x${target.height})`)
if (!APPLY) { console.log('\nDRY RUN — nothing changed. Re-run with --apply.'); process.exit(0) }

const next = { ...nodes, [NODE]: { ...node, props: { ...node.props, src: target.publicPath } } }
if (Object.keys(next).length !== Object.keys(nodes).length) throw new Error('node count changed')

const seoTitle = home.cells.seoTitle
const seoDescription = home.cells.seoDescription

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
console.log(`saved — seq ${res.seq}`)

// pageToCells() drops these; re-apply through PATCH, which merges.
if (seoTitle || seoDescription) {
  const before = (await api('GET', `/admin/api/cms/data/rows/${home.id}`)).row
  await api('PATCH', `/admin/api/cms/data/rows/${home.id}`, { cells: { ...before.cells, seoTitle, seoDescription } })
  console.log('  seo  restored on /index')
}

const after = (await getPages()).rows.find((r) => r.slug === 'index')
const got = after.cells.body.nodes
if (got[NODE].props.src !== target.publicPath) throw new Error(`read-back mismatch: ${got[NODE].props.src}`)
if (Object.keys(got).length !== Object.keys(nodes).length) throw new Error('node count changed on read-back')
const stillTwins = Object.values(got).filter((n) => n.moduleId === 'base.image' && n.props?.src === node.props.src).length
console.log(`read back clean — ${EXPECT} now renders ${stillTwins}x on /index`)
console.log('\nDRAFT ONLY. Nothing published.')
