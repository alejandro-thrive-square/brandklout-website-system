#!/usr/bin/env node
/**
 * fix-rv-wall-display.mjs — the review wall has been `display:none` on the
 * published site since the import. Three registry rules carry it.
 *
 *   node fix-rv-wall-display.mjs            # report the plan, write nothing
 *   node fix-rv-wall-display.mjs --apply    # write the draft (does NOT publish)
 *
 * ## What is wrong
 *
 * `css/37-ch-proof.css` declares `.rv-wall{display:grid;…}`. The live style
 * registry declares `.rv-wall{display:none;…}` in three rules. So on the
 * published site the home page's reviews section renders its headline —
 * "4.9 ★★★★★ Google reviews · both offices" — over nothing at all, with six
 * `.rv-card` elements present in the DOM and invisible. Confirmed in a browser
 * on 2026-09-21: `getComputedStyle(.rv-wall).display === 'none'`, six cards,
 * height 0.
 *
 * ## Where the `none` came from, because the answer decides the fix
 *
 * NOT from a stylesheet. `sections/ch-proof.js` upgrades the cards to the
 * vendor's live widget where a third-party frame is allowed, and when it does
 * it sets `wall.hidden = true` — the HTML attribute, deliberately, so the cards
 * stay in the DOM for a crawler with no JS. The page was imported into Instatic
 * while that attribute was set, and the importer recorded the COMPUTED style of
 * a hidden element into the class rule. The upgrade itself can never happen on
 * this platform: Instatic's CSP lists `frame-src` for YouTube only, so the
 * `.rv-live` slot is dropped and the cards are the only copy there is.
 *
 * So the `none` is an import artefact, not a decision, and the fix is to put
 * back the value the design package has always declared.
 *
 * ## Why this is in this run at all
 *
 * BugHerd #41/#42 replaced the films on the two veneers consultation pages with
 * a `.rv-wall` of veneer reviews. It published invisible. Fixing the rule fixes
 * both that and the home page.
 *
 * NOTHING HERE PUBLISHES.
 */
import { getSite, saveShell } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')

const { site: shell, seq } = await getSite()
const rules = shell.styleRules ?? {}

const targets = Object.entries(rules).filter(([, r]) =>
  r.selector === '.rv-wall' && r.styles?.display === 'none')

console.log(`${targets.length} .rv-wall rule(s) carry display:none\n`)
for (const [id, r] of targets) {
  console.log(`  ${id}  ${r.kind.padEnd(8)} order ${String(r.order).padStart(4)}  display:none -> grid`)
  console.log(`      rest: ${JSON.stringify({ ...r.styles, display: undefined })}`)
}

/* If some other rule sets it too, changing these three would be theatre. */
const others = Object.entries(rules).filter(([id, r]) =>
  /\brv-wall\b/.test(r.selector ?? '') && r.styles?.display && r.styles.display !== 'none'
  && !targets.some(([tid]) => tid === id))
if (others.length) {
  console.log('\nalso setting display on .rv-wall:')
  for (const [id, r] of others) console.log(`  ${id}  ${r.selector}  display:${r.styles.display}`)
}

if (!targets.length) { console.log('nothing to do'); process.exit(0) }
if (!APPLY) { console.log('\ndry run — nothing written. Re-run with --apply.'); process.exit(0) }

for (const [id] of targets) {
  rules[id] = { ...rules[id], styles: { ...rules[id].styles, display: 'grid' }, updatedAt: Date.now() }
}
shell.styleRules = rules
const res = await saveShell(shell, seq)
console.log(`\nshell saved — seq ${res.seq}`)

const after = (await getSite()).site.styleRules
const bad = targets.filter(([id]) => after[id]?.styles?.display !== 'grid')
if (bad.length) throw new Error(`read-back mismatch on: ${bad.map(([id]) => id).join(', ')}`)
console.log(`verified — ${targets.length} rules now declare display:grid`)
console.log('\nDRAFT only. Publishing is a separate step.')
