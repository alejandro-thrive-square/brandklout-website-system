#!/usr/bin/env node
/**
 * push-path-reveal.mjs — Chapter 05's card reveal, restored for touch.
 *
 *   node push-path-reveal.mjs            # report the plan, write nothing
 *   node push-path-reveal.mjs --apply    # write the draft (does NOT publish)
 *
 * ## What was missing
 *
 * The pinned build lights each card as it reaches centre stage — gold border,
 * the number up from 35%, the photo out of grayscale — and every one of those
 * hangs off `containerAnimation`, which exists only when there is a scrubbed
 * tween. Session 14 swapped the pin for a native swipe on touch to kill the
 * flicker, and the reveal went with it. Webflow still pins on mobile, so it
 * kept the animation; that is the difference the client was looking at.
 *
 * ## How it comes back without the cost
 *
 * An IntersectionObserver rooted on the TRACK, with a horizontal rootMargin
 * that narrows the trigger zone to the middle ~30%, toggling `.is-live`. The
 * animation is then CSS transitions. One callback per card per crossing
 * instead of JS on every frame — which matters, because per-frame work on a
 * phone is the entire reason the swipe build exists.
 *
 * Measured on the rebuilt package, real touch gestures, 390x844:
 *   swipe across the track   p50 16.7ms, 1% of frames over 32ms
 *   vertical drag over it    p50 16.7ms, 0%   (page still scrolls — not trapped)
 *
 * The grayscale reveal is included even though `.wz-fine` withholds it from
 * touch elsewhere. What made it expensive was repainting a filtered image every
 * frame of a scrub; there is no scrub here, so it transitions once per crossing.
 *
 * Both halves ship in ONE `saveShell` — `files[]` and `styleRules` both live on
 * the shell — because the JS toggles a class that only the CSS gives meaning to.
 *
 * NOTHING HERE PUBLISHES.
 */
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSite, saveShell } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => {
  const b = randomBytes(n)
  let s = ''
  for (let i = 0; i < n; i++) s += ALPHABET[b[i] & 63]
  return s
}
const RM = 'media:(prefers-reduced-motion: reduce)'
const ASSET = 'src/scripts/site.js'
const LOCAL = '../04-design/.tmp/final-site/assets/site.js'
const BANNER = '/* Dr. Nahlah runtime: WZ, every section module, the boot sequence. One file. */\n'
const SENTINELS = ['/*__wz_seo_end__*/', '/*__wz_end__*/']

// selector -> [styles, contexts?]  — mirrors css/35-ch-path.css
const RULES = [
  ['.ch-path.is-swipe .pa-card',
    { scrollSnapAlign: 'center', borderColor: 'var(--line)', transition: 'border-color .5s' }],
  ['.ch-path.is-swipe .pa-card .pa-no',
    { opacity: '0.35', transition: 'opacity .45s' }, { [RM]: { opacity: '1' } }],
  ['.ch-path.is-swipe .pa-card .pa-shot img',
    { filter: 'grayscale(1)', transition: 'filter .6s' }, { [RM]: { filter: 'none' } }],
  ['.ch-path.is-swipe .pa-card.is-live', { borderColor: 'rgba(138,126,78,.55)' }],
  ['.ch-path.is-swipe .pa-card.is-live .pa-no', { opacity: '1' }],
  ['.ch-path.is-swipe .pa-card.is-live .pa-shot img', { filter: 'grayscale(0)' }],
]

const { site: shell, seq } = await getSite()
const rules = shell.styleRules ?? {}
shell.styleRules = rules

if (!(shell.conditions ?? []).some(c => c.id === RM)) {
  console.error(`  ! condition ${RM} is not registered — refusing`); process.exit(1)
}

// ── JS half ────────────────────────────────────────────────────────────────
const file = (shell.files ?? []).find(f => f.path === ASSET)
if (!file) { console.error(`  ! no code asset ${ASSET}`); process.exit(1) }
const live = file.content ?? ''
const local = readFileSync(resolve(HERE, LOCAL), 'utf8')
if (!local.includes('IntersectionObserver') || !local.includes('is-live')) {
  console.error('  ! local bundle has no IntersectionObserver reveal — rebuild first'); process.exit(1)
}
const hadBanner = live.startsWith(BANNER)
const sentinel = SENTINELS.find(s => live.trimEnd().endsWith(s))
const wrapped = (hadBanner ? BANNER : '') + local + (sentinel ?? '')
console.log(`~ ${ASSET}   ${live.length}c -> ${wrapped.length}c   banner=${hadBanner} sentinel=${sentinel ?? '(none)'}`)

// ── CSS half ───────────────────────────────────────────────────────────────
const bySelector = new Map(Object.values(rules).map(r => [r.selector, r]))
let order = Math.max(...Object.values(rules).map(r => r.order ?? 0))
const planned = []
for (const [selector, styles, contexts] of RULES) {
  const hit = bySelector.get(selector)
  if (hit) {
    planned.push(() => {
      hit.styles = { ...hit.styles, ...styles }
      if (contexts) hit.contextStyles = { ...(hit.contextStyles ?? {}), ...contexts }
      hit.updatedAt = Date.now()
    })
    console.log(`~ ${selector}  (merge)`)
  } else {
    const id = nanoid()
    const o = ++order
    planned.push(() => {
      rules[id] = { id, name: selector, kind: 'ambient', selector, order: o,
        styles, contextStyles: contexts ?? {}, createdAt: Date.now(), updatedAt: Date.now() }
    })
    console.log(`+ ${selector}  ambient  order ${o}`)
  }
  console.log(`    ${JSON.stringify(styles)}${contexts ? '  ' + JSON.stringify(contexts) : ''}`)
}

if (!APPLY) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

for (const fn of planned) fn()
file.content = wrapped
file.updatedAt = Date.now()

const res = await saveShell(shell, seq)

// Read back rather than trust the write.
const { site: after } = await getSite()
const back = after.styleRules ?? {}
const f2 = (after.files ?? []).find(f => f.path === ASSET)
let ok = f2?.content === wrapped
for (const [selector, styles] of RULES) {
  const r = Object.values(back).find(x => x.selector === selector)
  if (!r) { console.error(`  ! ${selector} did not land`); ok = false; continue }
  for (const [k, v] of Object.entries(styles)) {
    if (r.styles[k] !== v) { console.error(`  ! ${selector} ${k}=${r.styles[k]}, wanted ${v}`); ok = false }
  }
}
console.log(`\nseq ${seq} -> ${res.seq}`)
console.log(`asset byte-exact: ${f2?.content === wrapped}`)
console.log(`verified   ${ok}`)
if (!ok) { console.error('WRITE DID NOT LAND — do not publish'); process.exit(1) }
console.log('\nDraft updated. Publish with: node insta-api.mjs publish')
