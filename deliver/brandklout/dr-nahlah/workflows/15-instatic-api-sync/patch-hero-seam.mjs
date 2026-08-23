#!/usr/bin/env node
/**
 * patch-hero-seam.mjs — the four registry rules behind the hero seam.
 *
 * The seam is a thin hairline along the bottom edge of every hero, visible only
 * while ScrollSmoother has the page at a fractional y. The media (the interior
 * hero's <img>, the home hero's <video>) composites on its own layer and its
 * clip rounds outward; the scrim painted over it rounds with the section's own
 * raster and stops a device row earlier. That row renders as raw, unscrimmed
 * source: dark on the light heroes.
 *
 * Two rules fix it, and both are needed:
 *   1. the media is held SHORT of the section's bottom clip edge, so a
 *      composited layer never meets it;
 *   2. the scrim is bled 2px past every edge AND must not share a clipping box
 *      with the media — which is why .pg-hero .ph-bg::after becomes
 *      .pg-hero::after.
 *
 * Reproduced and measured headlessly against the local build at seven
 * fractional scroll offsets before being written here:
 *   interior hero  225 -> 0.3   home hero  58 -> 1.0   (0-255 median row step)
 *
 * Mirrors css/20-pagekit.css and css/30-ch-arrival.css in the design package,
 * which are the source of truth for this CSS.
 *
 *   node patch-hero-seam.mjs [--apply]
 *
 * Publishes nothing. Publish with: node insta-api.mjs publish
 */
import { getSite, saveShell } from './insta-api.mjs'

const apply = process.argv.includes('--apply')

// id -> { expectSelector, selector?, set{}, drop[] }
const PATCH = {
  // Interior hero: clip the drifting photo 4px short of the section's bottom.
  qFTCVNOFbRjbh1eowihSz: {
    expect: '.pg-hero .ph-bg',
    set: { top: '-2px', right: '-2px', bottom: '4px', left: '-2px',
           inset: '-2px -2px 4px -2px', overflow: 'hidden',
           overflowX: 'hidden', overflowY: 'hidden' },
  },
  // Interior hero scrim: off .ph-bg (the photo's clipper) and onto the section.
  '9u5Jp_LzFp4zmmMXqDAHB': {
    expect: '.pg-hero .ph-bg::after',
    selector: '.pg-hero::after',
    name: '.pg-hero::after',
    set: { top: '-2px', right: '-2px', bottom: '-2px', left: '-2px',
           inset: '-2px', zIndex: '1', pointerEvents: 'none' },
  },
  // Home hero: bleed the wrapper so both of its scrims clear every edge.
  UkUq3X7YiZmyAkQk: {
    expect: '.ch-arrival .ar-bg',
    set: { top: '-2px', right: '-2px', bottom: '-2px', left: '-2px', inset: '-2px' },
  },
  // Home hero film: bled on three edges, held 2px short of the bottom.
  'VAo-26MR4tHhZNrJ': {
    expect: '.ch-arrival .ar-film',
    set: { top: '-2px', right: '-2px', bottom: '4px', left: '-2px',
           inset: '-2px -2px 4px -2px', width: 'auto', height: 'auto' },
  },
}

const { site: shell, seq } = await getSite()
const rules = shell.styleRules ?? {}
let changed = 0

for (const [id, p] of Object.entries(PATCH)) {
  const r = rules[id]
  if (!r) { console.error(`  ! no rule ${id} (${p.expect})`); process.exit(1) }
  if (r.selector !== p.expect) {
    console.error(`  ! ${id} is "${r.selector}", expected "${p.expect}" — refusing`)
    process.exit(1)
  }
  const before = JSON.stringify(r.styles)
  for (const [k, v] of Object.entries(p.set)) r.styles[k] = v
  for (const k of p.drop ?? []) delete r.styles[k]
  if (p.selector) r.selector = p.selector
  if (p.name) r.name = p.name
  const after = JSON.stringify(r.styles)
  const moved = before !== after || p.selector
  if (moved) changed++
  console.log(`${moved ? '~' : '='} ${p.expect}${p.selector ? `  ->  ${p.selector}` : ''}`)
  for (const [k, v] of Object.entries(p.set)) console.log(`      ${k}: ${v}`)
  if (moved) r.updatedAt = Date.now()
}

if (!changed) { console.log('\nnothing to do'); process.exit(0) }
if (!apply) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

const res = await saveShell(shell, seq)
// Read back rather than trust the write: this platform reports some failures as
// a 200 with a prose body.
const { site: after } = await getSite()
let ok = true
for (const [id, p] of Object.entries(PATCH)) {
  const r = (after.styleRules ?? {})[id]
  const wantSel = p.selector ?? p.expect
  if (!r || r.selector !== wantSel) { console.error(`  ! ${id} selector did not land`); ok = false; continue }
  for (const [k, v] of Object.entries(p.set)) {
    if (r.styles[k] !== v) { console.error(`  ! ${wantSel} ${k} = ${r.styles[k]}, wanted ${v}`); ok = false }
  }
}
console.log(`\nseq ${seq} -> ${res.seq}`)
console.log(`verified   ${ok}`)
if (!ok) { console.error('WRITE DID NOT LAND — do not publish'); process.exit(1) }
console.log('\nDraft updated. Publish with: node insta-api.mjs publish')
