#!/usr/bin/env node
/**
 * patch-specialist-video.mjs — BugHerd pins #2 and #3 (Chapter 03, The Specialist).
 *
 * Pin #2 ("add a video below this photo") was already built by hand in the
 * editor on 2026-08-25 22:21Z: an embed node carrying `.vimeo-video` sits
 * between `.doc-portrait` and `.doc-credentials` inside `.ch-specialist
 * .doc-grid`. Nothing to add. What this script fixes is the state that hand-edit
 * was left in.
 *
 * THE REGRESSION. The PUBLISHED stylesheet has:
 *
 *     .vimeo-video { width:100%; aspect-ratio:16:9; margin-top:6rem;
 *                    grid-column:1; grid-row:2 }
 *
 * The DRAFT rule has lost `grid-column`/`grid-row` (a second hand-edit at
 * 2026-08-26 03:22Z, presumably a first swing at pin #3). Those two
 * declarations are the whole desktop layout. `.doc-grid` is `.82fr 1.18fr`
 * above 900px, and DOM order is portrait, video, credentials — so with no
 * explicit placement the auto-placer gives:
 *
 *     portrait col1/row1   VIDEO col2/row1   credentials col1/row2
 *
 * i.e. the video takes the credentials' column and Chapter 03 scrambles.
 * Publishing the draft as it stands would ship that. Restored here.
 *
 * PIN #3 ("this video should be after the container on mobile"). Below 900px
 * the grid is one column, so DOM order rules and the video lands between the
 * portrait and the credentials. The fix is `order:1` on the base (mobile-first)
 * rule, which pushes it past `.doc-credentials` (order 0) at every
 * single-column width — not just at the `mobile` breakpoint, which on this site
 * is `(max-width: 375px)` and would miss every phone wider than an iPhone SE.
 * The desktop context resets `order` and restores the explicit placement.
 *
 * Also fixed: `aspect-ratio: 16:9` is invalid CSS — the property takes
 * `<number> / <number>`, so a colon makes the browser drop the declaration.
 * It has been dead since it was written. Corrected to `16 / 9`, which is a
 * no-op visually because the embed snippet already carries a `padding:56.25%`
 * ratio box (56.25% == 9/16).
 *
 *   node patch-specialist-video.mjs [--apply]
 *
 * Publishes nothing. Publish with: node insta-api.mjs publish
 */
import { getSite, saveShell } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const apply = process.argv.includes('--apply')

const RULE_ID = '0RDnYdOnStswsND1BdBxy'
const EXPECT = '.vimeo-video'
const DESKTOP = 'media:(min-width: 900px)'   // the breakpoint .doc-grid itself uses

const BASE_SET = {
  aspectRatio: '16 / 9',  // was "16:9" — invalid, silently dropped
  order: '1',             // pin #3: last in the single-column stack
}
const DESKTOP_SET = {
  order: '0',             // reset, so document order drives auto-placement
  gridColumn: '1',        // restored: below the portrait, left column
  gridRow: '2',
}

const { site: shell, seq } = await getSite()
const rules = shell.styleRules ?? {}
const r = rules[RULE_ID]

if (!r) { console.error(`  ! no rule ${RULE_ID} (${EXPECT})`); process.exit(1) }
if (r.selector !== EXPECT) {
  console.error(`  ! ${RULE_ID} is "${r.selector}", expected "${EXPECT}" — refusing`)
  process.exit(1)
}

// The desktop condition must already exist; inventing one risks the emission
// order bug documented in 15-instatic-api-sync.md.
const conditions = shell.conditions ?? []
const hasDesktop = conditions.some(c => `media:${c.condition?.query}` === DESKTOP || c.id === DESKTOP)
const usedElsewhere = Object.values(rules).some(x => x.id !== RULE_ID && (x.contextStyles ?? {})[DESKTOP])
if (!hasDesktop && !usedElsewhere) {
  console.error(`  ! condition "${DESKTOP}" is not registered on this site — refusing`)
  process.exit(1)
}

const before = JSON.stringify({ s: r.styles, c: r.contextStyles })

r.styles = { ...r.styles, ...BASE_SET }
r.contextStyles = { ...(r.contextStyles ?? {}) }
r.contextStyles[DESKTOP] = { ...(r.contextStyles[DESKTOP] ?? {}), ...DESKTOP_SET }

const after = JSON.stringify({ s: r.styles, c: r.contextStyles })
if (before === after) { console.log('nothing to do'); process.exit(0) }
r.updatedAt = Date.now()

console.log(`~ ${EXPECT}`)
console.log('  base:', JSON.stringify(r.styles))
for (const [k, v] of Object.entries(r.contextStyles)) console.log(`  ${k}:`, JSON.stringify(v))

if (!apply) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

const res = await saveShell(shell, seq)

// Read back rather than trust the write: this platform reports some failures as
// a 200 with a prose body.
const { site: verify } = await getSite()
const v = (verify.styleRules ?? {})[RULE_ID]
let ok = !!v && v.selector === EXPECT
for (const [k, val] of Object.entries(BASE_SET)) {
  if (v?.styles?.[k] !== val) { console.error(`  ! base ${k} = ${v?.styles?.[k]}, wanted ${val}`); ok = false }
}
for (const [k, val] of Object.entries(DESKTOP_SET)) {
  if (v?.contextStyles?.[DESKTOP]?.[k] !== val) {
    console.error(`  ! ${DESKTOP} ${k} = ${v?.contextStyles?.[DESKTOP]?.[k]}, wanted ${val}`); ok = false
  }
}
if (v?.styles?.marginTop !== '6rem') { console.error('  ! base marginTop drifted'); ok = false }

console.log(`\nseq ${seq} -> ${res.seq}`)
console.log(`verified   ${ok}`)
if (!ok) { console.error('WRITE DID NOT LAND — do not publish'); process.exit(1) }
console.log('\nDraft updated. Publish with: node insta-api.mjs publish')
