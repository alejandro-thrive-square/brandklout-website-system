#!/usr/bin/env node
/**
 * retarget-office-numbers.mjs — point each office's NEW PATIENTS line at the
 * number the practice actually wants answered.
 *
 *   node retarget-office-numbers.mjs           # report, change nothing
 *   node retarget-office-numbers.mjs --apply
 *
 * Client instruction, 2026-09-22: "Alexandria: 571-617-7245, Tyson:
 * 703-448-3312 — these are the correct ones for each location." Confirmed that
 * the new/current-patient split stays and these two take the NEW PATIENTS slot.
 *
 *   Tysons Corner / McLean   new patients  (571) 702-9900 -> (703) 448-3312
 *   Alexandria               new patients  (571) 253-7790 -> (571) 617-7245
 *
 * Current-patient lines are untouched: Tysons keeps (703) 448-3312 and
 * Alexandria keeps (703) 940-5410.
 *
 * TYSONS THEREFORE SHOWS THE SAME NUMBER ON BOTH ITS LINES. That is the
 * client's call, made with the duplication shown to them. If it should instead
 * collapse to a single line, that is a change to partials/drawer.html,
 * partials/footer.html and partials/lp-office.html, not to this script.
 *
 * ## The two numbers nobody was looking at
 *
 * `seo.json` was telling Google a DIFFERENT pair of new-patient numbers from
 * the ones on the page — `+1-571-619-9442` for McLean and `+1-571-410-3430`
 * for Alexandria — in the `/#office-*` blocks, and `gen-gallery.mjs` carried
 * the same two as `tel:` links. Neither reaches the live site today (Instatic
 * serves structured data from the brandklout.aeo-schema plugin, whose home-page
 * payload carries the page numbers), but they are in `final-site/index.html`
 * and one republish of that block would have put them in front of a crawler.
 * They are new-patient numbers for the same two offices, so they retire into
 * the same replacements rather than being left to rot.
 *
 * ## After this runs
 *
 * **Call tracking goes dark until GoHighLevel is repointed.** The DNI pool's
 * forwarding number is `(571) 253-7790`, which this removes from every page, so
 * `number_pool.js` will find nothing to swap. See the 2026-09-22 runbook run.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const SRC = join(import.meta.dirname, 'site-src')
const APPLY = process.argv.includes('--apply')

/* Every written form, because the file set uses all of them: the bare E.164 in
   an href, the dashed E.164 in JSON-LD, and the display text. Replacing the
   number alone leaves any `tel:` prefix in place. */
const MAP = [
  // Tysons Corner / McLean, new patients -> (703) 448-3312
  ['+15717029900', '+17034483312'],
  ['+1-571-702-9900', '+1-703-448-3312'],
  ['(571) 702-9900', '(703) 448-3312'],
  ['+15716199442', '+17034483312'],
  ['+1-571-619-9442', '+1-703-448-3312'],
  ['(571) 619-9442', '(703) 448-3312'],
  // Alexandria, new patients -> (571) 617-7245
  ['+15712537790', '+15716177245'],
  ['+1-571-253-7790', '+1-571-617-7245'],
  ['(571) 253-7790', '(571) 617-7245'],
  ['+15714103430', '+15716177245'],
  ['+1-571-410-3430', '+1-571-617-7245'],
  ['(571) 410-3430', '(571) 617-7245'],
]

/* Longest first, so `+1-571-702-9900` can never be half-eaten by a shorter
   literal that happens to be a prefix of it. */
MAP.sort((a, b) => b[0].length - a[0].length)

const files = []
;(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) { walk(p); continue }
    if (/\.(html|mjs|js|json|css)$/.test(e)) files.push(p)
  }
})(SRC)

let touched = 0
let total = 0
for (const f of files) {
  /* Read as a byte-faithful string and write it back the same way. seo.json is
     CRLF with 2-space indent; a JSON round-trip would turn a 22-line edit into
     a 3,476-line diff, so this never parses, only substitutes. */
  const before = readFileSync(f, 'utf8')
  let after = before
  const hits = []
  for (const [from, to] of MAP) {
    if (!after.includes(from)) continue
    const n = after.split(from).length - 1
    after = after.split(from).join(to)
    hits.push(`${n}x ${from} -> ${to}`)
  }
  if (after === before) continue
  touched++
  total += hits.reduce((s, h) => s + Number(h.split('x')[0]), 0)
  console.log(`${relative(SRC, f)}`)
  for (const h of hits) console.log(`    ${h}`)
  if (APPLY) writeFileSync(f, after)
}

console.log(`\n${total} replacements across ${touched} files`)
if (!APPLY) { console.log('DRY RUN — re-run with --apply'); process.exit(0) }

/* Refuse to finish quietly if any retired form survives anywhere. */
const dead = ['5717029900', '5712537790', '5716199442', '5714103430',
  '571-702-9900', '571-253-7790', '571-619-9442', '571-410-3430',
  '571) 702-9900', '571) 253-7790', '571) 619-9442', '571) 410-3430']
const left = []
for (const f of files) {
  const s = readFileSync(f, 'utf8')
  for (const d of dead) if (s.includes(d)) left.push(`${relative(SRC, f)}: ${d}`)
}
if (left.length) {
  console.error('\nRETIRED NUMBERS STILL PRESENT:\n  ' + left.join('\n  '))
  process.exit(1)
}
console.log('no retired number survives in site-src. Rebuild next.')
