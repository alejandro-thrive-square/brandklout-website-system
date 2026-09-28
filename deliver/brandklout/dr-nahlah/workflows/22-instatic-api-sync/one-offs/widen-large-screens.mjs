#!/usr/bin/env node
/**
 * widen-large-screens.mjs — the container and the type ceiling above 1920px.
 *
 * ## What was wrong
 *
 * Type scaled past 1440 and the container did not. `--maxw` was a flat 1560px,
 * so on a big monitor the page became a narrow column of ever-larger text.
 * Measured on /dental-implants before this change:
 *
 *     viewport   root    container   share of screen   page height
 *     1440       16px    1440        100%              9,162
 *     1920       18px    1560         81%             10,673
 *     2560     20.7px    1560         61%             12,105
 *     3440     24.3px    1560         45%             14,457
 *
 * Both halves of "the container is too small and the content gets too tall"
 * are that one row: bigger text in a fixed column means fewer characters per
 * line, so the page grew 58% taller from 1440 to 3440 while using less than
 * half the screen.
 *
 * ## Two changes
 *
 * 1. `--maxw: max(1560px, min(2200px, 88vw))`
 *
 *    Fluid, so there are no breakpoints to keep in step, and it drives all six
 *    container rules at once (.wrap, .dr-grid, .dr-foot, .ar-in, .pa-head,
 *    .mband-in). The `min()` caps it at 2200px so a 34-inch monitor does not
 *    get an unreadable line length. The `max()` floor matters below ~1773px,
 *    where 88vw would be NARROWER than today's 1560 — without it this would
 *    quietly shrink every laptop.
 *
 * 2. `html { font-size: clamp(12px, <the existing fluid expression>, 20px) }`
 *
 *    The fluid root had no upper bound. Its top tier interpolates 18px→20px
 *    across 1920→2400, and above 2400 the `1vw` term simply kept extrapolating
 *    — 24.3px at 3440, and rising forever. The clamp pins it to the two sizes
 *    the design already intends at its own end stops (12px at 320, 20px at
 *    2400) and changes NOTHING in between.
 *
 * Effect, same page:
 *
 *     1920   1560 -> 1690   (81% -> 88%)
 *     2560   1560 -> 2200   (61% -> 86%)
 *     3440   1560 -> 2200   (45% -> 64%),  height 14,457 -> 12,230
 *
 * Note that page height rises slightly at 1920 and 2560 even though the column
 * is wider: several figures are sized by `aspect-ratio`, so a wider container
 * makes them proportionally taller. The height win only appears at 3440, where
 * capping the root font-size does the work. Height was never the goal — the
 * column using the screen is.
 *
 * Deliberately NOT in the Framework: it has three families (Colors, Typography,
 * Space) and no sizing family, so container width stays a custom property on
 * the registry's `:root` rule. That is still one place, and still editable in
 * the panel's Custom properties section.
 *
 *   node widen-large-screens.mjs [--apply]
 *
 * Publishes nothing. Roll back with rollback-registry.mjs <snapshot>.
 */
import { getSite, saveShell } from './insta-api.mjs'
import { writeFileSync } from 'node:fs'

const apply = process.argv.includes('--apply')

const MAXW_FROM = '1560px'
const MAXW_TO = 'max(1560px, min(2200px, 88vw))'
const FONT_FROM = 'calc(var(--base) * 1rem + var(--coefficient) * 1vw)'
const FONT_TO = 'clamp(12px, calc(var(--base) * 1rem + var(--coefficient) * 1vw), 20px)'

const { site: shell, seq } = await getSite()
writeFileSync(`output/shell.before.${seq}.json`, JSON.stringify(shell, null, 1), 'utf8')
console.log(`snapshot output/shell.before.${seq}.json`)

const rules = Object.values(shell.styleRules ?? {})
const root = rules.find((r) => (r.selector ?? '').trim() === ':root')
const html = rules.find((r) => (r.selector ?? '').trim() === 'html')
if (!root || !html) {
  console.error('REFUSING: :root or html rule missing from the registry')
  process.exit(1)
}

// Refuse on anything but the exact value this script was written against —
// someone may have edited it in the panel since, and silently overwriting a
// hand-set container width is exactly the kind of loss this pipeline avoids.
const problems = []
if (root.styles['--maxw'] !== MAXW_FROM)
  problems.push(`--maxw is "${root.styles['--maxw']}", expected "${MAXW_FROM}"`)
if (html.styles.fontSize !== FONT_FROM)
  problems.push(`html font-size is "${html.styles.fontSize}", expected "${FONT_FROM}"`)
if (problems.length) {
  console.error('REFUSING — the live values are not what this script expects:')
  for (const p of problems) console.error('  ' + p)
  console.error('\nRe-read them and update the constants deliberately.')
  process.exit(1)
}

// The fluid root's own tiers live in :root's contextStyles. The clamp sits
// OUTSIDE them, so every tier keeps its slope and only the end stops are held.
const tiers = Object.keys(root.contextStyles ?? {}).filter((c) => /--font-from/.test(JSON.stringify(root.contextStyles[c])))
console.log(`\nfluid-root tiers left untouched: ${tiers.length}`)
for (const t of tiers) console.log('  ' + t)

console.log('\n:root')
console.log(`  --maxw:  ${MAXW_FROM}`)
console.log(`  --maxw:  ${MAXW_TO}`)
console.log('html')
console.log(`  font-size:  ${FONT_FROM}`)
console.log(`  font-size:  ${FONT_TO}`)

if (!apply) {
  console.log('\nDRY RUN — re-run with --apply')
  process.exit(0)
}

root.styles['--maxw'] = MAXW_TO
html.styles.fontSize = FONT_TO
const now = Date.now()
root.updatedAt = now
html.updatedAt = now
const res = await saveShell(shell, seq)

const { site: after } = await getSite()
const aRules = Object.values(after.styleRules ?? {})
const aRoot = aRules.find((r) => (r.selector ?? '').trim() === ':root')
const aHtml = aRules.find((r) => (r.selector ?? '').trim() === 'html')
const ok = aRoot?.styles['--maxw'] === MAXW_TO && aHtml?.styles.fontSize === FONT_TO
console.log(`\nseq ${seq} -> ${res.seq}`)
console.log(`  --maxw     ${aRoot?.styles['--maxw']}`)
console.log(`  font-size  ${aHtml?.styles.fontSize}`)
if (!ok) {
  console.error('WRITE DID NOT LAND')
  process.exit(1)
}
console.log('verified')
console.log('\nDraft updated. Publish with: node insta-api.mjs publish')
