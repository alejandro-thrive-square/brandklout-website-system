#!/usr/bin/env node
/**
 * patch-path-swipe.mjs — BugHerd pins #4 and #5, the registry half.
 *
 * Both pins say the same thing on two different sections: "on mobile the
 * flickering keeps going on". #4 is pinned on `#transformation` (Chapter 04),
 * #5 on `#path` (Chapter 05) — the only two pinned ScrollTrigger sections on
 * the home page. Session 14 built and measured the fix in
 * `04-design/.tmp/site-src` but never shipped it, because the JS half is
 * useless without the CSS half and the CSS half had not been written. This is
 * that CSS half; the JS half is `push-script-asset.mjs`.
 *
 * MIRRORS `04-design/.tmp/site-src/css/35-ch-path.css`, which stays the source
 * of truth. Two separate changes:
 *
 * 1. THE GRAYSCALE REVEAL COMES OFF TOUCH. `filter:grayscale(1)` sits on four
 *    card images inside a horizontally-scrubbed (transformed) ancestor. A
 *    filtered subtree inside a moving transform cannot be composited, so the
 *    browser re-rasterizes all four every frame — which is the flicker. The
 *    filter moves behind `.wz-fine`, a class `js/90-boot.js` puts on <html>
 *    only for a real hovering pointer. Desktop is unchanged; touch stops
 *    paying for a hover effect it can never trigger.
 *
 *    Deliberately a CLASS, not `@media (hover:hover)`: this platform stores
 *    non-viewport media queries as custom conditions emitted in raw
 *    `site.conditions` array order with none of the sorting viewport
 *    breakpoints get (see 15-instatic-api-sync.md, "Cascade order").
 *
 * 2. THE SWIPE PATH. `.ch-path.is-swipe` is added by `sections/ch-path.js` on
 *    touch: the pin becomes an ordinary block and the track becomes a
 *    snap-scroller, dropping the pin, the containerAnimation triggers and the
 *    per-frame JS (67 ScrollTriggers -> 58).
 *
 *    DO NOT PUSH THE JS WITHOUT THESE RULES. `is-swipe` with no styles leaves
 *    `.pa-track` at `width:max-content` inside a non-pinned block and the whole
 *    page scrolls sideways.
 *
 * Every new rule is `kind: 'ambient'`. A `class` rule survives publish only if
 * its id appears in some `node.classIds`, so a rule invented here would be
 * tree-shaken on the next publish. Ambient rules are shaken only when a class
 * token in the selector is a *registered but unused* class-kind rule name;
 * `wz-fine` and `is-swipe` are registered as nothing at all, and the remaining
 * tokens already carry surviving ambient rules today.
 *
 *   node patch-path-swipe.mjs [--apply]
 *
 * Publishes nothing. Publish with: node insta-api.mjs publish
 */
import { getSite, saveShell } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const apply = process.argv.includes('--apply')

// ── edits to existing rules ────────────────────────────────────────────────
const EDIT = {
  // The always-on filter is the cost. Strip it to the plain image.
  JbooYo0Vu4c24U0B: {
    expect: '.ch-path .pa-card .pa-shot img',
    drop: ['filter', 'transition'],
  },
  // The hover pair only means anything on a pointer device.
  'dYMRf-qqRCy57Iwb': {
    expect: '.ch-path .pa-card:hover .pa-shot img',
    selector: '.wz-fine .ch-path .pa-card:hover .pa-shot img',
  },
}

// ── new ambient rules, in cascade order after everything else ──────────────
const ADD = [
  ['.wz-fine .ch-path .pa-card .pa-shot img', {
    filter: 'grayscale(1)', transition: 'filter .6s,transform .8s',
  }],
  ['.ch-path.is-swipe', {
    scrollMarginTop: 'var(--nav-h,78px)',
  }],
  ['.ch-path.is-swipe .pa-pin', {
    height: 'auto',
    paddingTop: 'calc(var(--nav-h,78px) + clamp(2rem,6vw,3.5rem))',
    paddingBottom: 'clamp(3rem,9vw,5rem)',
  }],
  ['.ch-path.is-swipe .pa-track', {
    overflowX: 'auto', overflowY: 'hidden', width: 'auto',
    scrollSnapType: 'x mandatory', overscrollBehaviorX: 'contain',
    WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
    paddingBottom: '0.5rem',
  }],
  ['.ch-path.is-swipe .pa-track::-webkit-scrollbar', {
    display: 'none',
  }],
  ['.ch-path.is-swipe .pa-card', {
    scrollSnapAlign: 'center',
  }],
  ['.ch-path.is-swipe .pa-bar', {
    position: 'static',
    marginTop: 'clamp(1.25rem,4vw,2rem)',
    marginInline: 'var(--pa-inset) var(--pa-inset-end)',
  }],
]

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'
const newId = () => Array.from({ length: 16 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('')

const { site: shell, seq } = await getSite()
const rules = shell.styleRules ?? {}
shell.styleRules = rules

let changed = 0

for (const [id, p] of Object.entries(EDIT)) {
  const r = rules[id]
  if (!r) { console.error(`  ! no rule ${id} (${p.expect})`); process.exit(1) }
  if (r.selector !== p.expect) {
    console.error(`  ! ${id} is "${r.selector}", expected "${p.expect}" — refusing`)
    process.exit(1)
  }
  const before = JSON.stringify(r)
  for (const k of p.drop ?? []) delete r.styles[k]
  if (p.selector) { r.selector = p.selector; r.name = p.selector }
  if (JSON.stringify(r) !== before) { r.updatedAt = Date.now(); changed++ }
  console.log(`~ ${p.expect}${p.selector ? `  ->  ${p.selector}` : ''}`)
  if (p.drop) console.log(`      dropped: ${p.drop.join(', ')}  |  kept: ${JSON.stringify(r.styles)}`)
}

// Refuse to create a second rule for a selector that already has one — running
// this twice must not litter the registry with duplicates.
const bySelector = new Map(Object.values(rules).map(r => [r.selector, r]))
let order = Math.max(...Object.values(rules).map(r => r.order ?? 0))

for (const [selector, styles] of ADD) {
  const existing = bySelector.get(selector)
  if (existing) {
    const before = JSON.stringify(existing.styles)
    existing.styles = { ...existing.styles, ...styles }
    existing.kind = 'ambient'
    if (JSON.stringify(existing.styles) !== before) { existing.updatedAt = Date.now(); changed++ }
    console.log(`= ${selector}  (already present, styles merged)`)
    continue
  }
  const id = newId()
  rules[id] = {
    id, name: selector, kind: 'ambient', selector,
    order: ++order, styles, contextStyles: {},
    createdAt: Date.now(), updatedAt: Date.now(),
  }
  changed++
  console.log(`+ ${selector}   (order ${order})`)
  console.log(`      ${JSON.stringify(styles)}`)
}

if (!changed) { console.log('\nnothing to do'); process.exit(0) }
if (!apply) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

const res = await saveShell(shell, seq)

// Read back rather than trust the write.
const { site: after } = await getSite()
const now = after.styleRules ?? {}
let ok = true

for (const [id, p] of Object.entries(EDIT)) {
  const r = now[id]
  const wantSel = p.selector ?? p.expect
  if (!r || r.selector !== wantSel) { console.error(`  ! ${id} selector did not land`); ok = false; continue }
  for (const k of p.drop ?? []) {
    if (k in r.styles) { console.error(`  ! ${wantSel} still carries ${k}`); ok = false }
  }
}
for (const [selector, styles] of ADD) {
  const r = Object.values(now).find(x => x.selector === selector)
  if (!r) { console.error(`  ! ${selector} did not land`); ok = false; continue }
  if (r.kind !== 'ambient') { console.error(`  ! ${selector} is kind=${r.kind}, must be ambient`); ok = false }
  for (const [k, v] of Object.entries(styles)) {
    if (r.styles[k] !== v) { console.error(`  ! ${selector} ${k} = ${r.styles[k]}, wanted ${v}`); ok = false }
  }
}

console.log(`\nseq ${seq} -> ${res.seq}`)
console.log(`verified   ${ok}`)
if (!ok) { console.error('WRITE DID NOT LAND — do not publish'); process.exit(1) }
console.log('\nDraft updated. Now push the JS half:')
console.log('  node push-script-asset.mjs src/scripts/site.js ../04-design/.tmp/final-site/assets/site.js --apply')
