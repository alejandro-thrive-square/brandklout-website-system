#!/usr/bin/env node
/**
 * push-mobile-smoother-fix.mjs — BugHerd pins #4/#5, the actual cause.
 *
 *   node push-mobile-smoother-fix.mjs            # report the plan, write nothing
 *   node push-mobile-smoother-fix.mjs --apply    # write the draft (does NOT publish)
 *
 * ## What was really wrong
 *
 * ScrollTrigger pins one of two ways, and it chooses silently. With no
 * ScrollSmoother it uses native `position:fixed` — the browser holds the pinned
 * chapter still and there is no per-frame work at all. With a smoother present
 * it switches to `pinType:'transform'`, because fixed positioning is unreliable
 * inside a smoothed container, and the pinned element's `translateY` then has to
 * be rewritten from JS on EVERY scroll update. Measured mid-pin, same scroll
 * depth, on the two live builds:
 *
 *   Webflow  (no smoother)  #tPin  position:fixed   transform: identity
 *   Instatic (smoother on)  #tPin  position:static  transform: translateY(1350.5px)
 *
 * On a phone those writes land late whenever the main thread is busy, and the
 * chapter drifts against the finger. That is the reported flicker.
 *
 * The Webflow build is smooth by ACCIDENT: its `#smooth-wrapper` element never
 * survived the conversion, so `create()` is skipped there. `smoothTouch:false`
 * does not achieve this — it disables the easing, not the instantiation, and it
 * is the instantiation that flips the pin strategy.
 *
 * ## Why this is ONE write
 *
 * `#smooth-wrapper{overflow:hidden}` is unconditional in the registry. Ship the
 * JS without the CSS and a phone gets no smoother AND a clipping full-height
 * wrapper — the page stops scrolling entirely. (Proved the hard way while
 * A/B testing: stubbing the plugin alone left two runs travelling 0px and
 * reporting a flattering 16.7ms for a stationary page.) Both halves land in a
 * single `saveShell`, because `files[]` and `styleRules` both live on the shell.
 *
 *   ~ `#smooth-wrapper`  ->  `.wz-smooth #smooth-wrapper`
 *   ~ `src/scripts/site.js` — smoother gated to non-touch; sets `.wz-smooth` on
 *     <html> only once create() has actually succeeded.
 *
 * Desktop is deliberately untouched: verified against the rebuilt package at
 * 1440x900 that the smoother still creates, `wz-smooth` is set and the wrapper
 * still clips.
 *
 * NOTHING HERE PUBLISHES.
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSite, saveShell } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')

const RULE_ID = 'nOU8aVKSCE1n5kYI7IKr7'
const FROM_SELECTOR = '#smooth-wrapper'
const TO_SELECTOR = '.wz-smooth #smooth-wrapper'
const ASSET = 'src/scripts/site.js'
const LOCAL = '../04-design/.tmp/final-site/assets/site.js'

const BANNER = '/* Dr. Nahlah runtime: WZ, every section module, the boot sequence. One file. */\n'
const SENTINELS = ['/*__wz_seo_end__*/', '/*__wz_end__*/']

const { site: shell, seq } = await getSite()
const rules = shell.styleRules ?? {}

// ── the CSS half ───────────────────────────────────────────────────────────
const rule = rules[RULE_ID]
if (!rule) { console.error(`  ! no rule ${RULE_ID}`); process.exit(1) }
if (rule.selector === TO_SELECTOR) {
  console.log('= selector already scoped')
} else if (rule.selector !== FROM_SELECTOR) {
  console.error(`  ! rule is "${rule.selector}", expected "${FROM_SELECTOR}" — refusing`)
  process.exit(1)
} else {
  console.log(`~ ${FROM_SELECTOR}  ->  ${TO_SELECTOR}`)
  console.log(`    ${JSON.stringify(rule.styles)}`)
}

// ── the JS half ────────────────────────────────────────────────────────────
const file = (shell.files ?? []).find(f => f.path === ASSET)
if (!file) { console.error(`  ! no code asset ${ASSET}`); process.exit(1) }
const live = file.content ?? ''
const local = readFileSync(resolve(HERE, LOCAL), 'utf8')

// Preserve whatever wrapper the original push used: the sentinel is how a
// truncated write is detected later, so dropping it would disarm that check.
const hadBanner = live.startsWith(BANNER)
const sentinel = SENTINELS.find(s => live.trimEnd().endsWith(s))
const wrapped = (hadBanner ? BANNER : '') + local + (sentinel ?? '')

console.log(`\n~ ${ASSET}`)
console.log(`    live ${live.length}c  ->  ${wrapped.length}c   banner=${hadBanner} sentinel=${sentinel ?? '(none)'}`)

// The change must actually be IN the bundle we are about to ship.
for (const marker of ['wz-smooth', '(hover:none) and (pointer:coarse)']) {
  if (!local.includes(marker)) { console.error(`  ! local bundle is missing ${marker} — rebuild first`); process.exit(1) }
}
if (live.includes('wz-smooth')) console.log('    (live already carries wz-smooth)')

if (!APPLY) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

// ── one atomic shell write ─────────────────────────────────────────────────
rule.selector = TO_SELECTOR
rule.name = TO_SELECTOR
rule.updatedAt = Date.now()
file.content = wrapped
file.updatedAt = Date.now()

const res = await saveShell(shell, seq)

// Read back rather than trust the write.
const { site: after } = await getSite()
const r2 = (after.styleRules ?? {})[RULE_ID]
const f2 = (after.files ?? []).find(f => f.path === ASSET)
const ok = r2?.selector === TO_SELECTOR &&
  f2?.content === wrapped &&
  f2.content.includes('wz-smooth')
console.log(`\nseq ${seq} -> ${res.seq}`)
console.log(`selector   ${r2?.selector}`)
console.log(`asset      ${f2?.content?.length}c, byte-exact: ${f2?.content === wrapped}`)
console.log(`verified   ${ok}`)
if (!ok) { console.error('WRITE DID NOT LAND — do not publish'); process.exit(1) }
console.log('\nDraft updated. Publish with: node insta-api.mjs publish')
