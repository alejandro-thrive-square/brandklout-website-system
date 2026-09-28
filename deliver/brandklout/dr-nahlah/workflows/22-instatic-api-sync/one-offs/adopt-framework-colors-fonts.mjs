#!/usr/bin/env node
/**
 * adopt-framework-colors-fonts.mjs — make the Framework panel actually drive
 * the site's colours and fonts. Phase 1 of the token adoption.
 *
 * ## The problem
 *
 * The Framework's 25 colour tokens were already configured, and none of them
 * did anything. Stylesheets load `reset -> framework -> style`, and the style
 * registry's `:root` rule redefined every one of the 25 — so `framework.css`
 * said `--gold: hsla(48, 27.9%, 54.31%, 1)`, `style.css` said `--gold: #AB9E6A`
 * a few kilobytes later, and the panel was decorative. Editing a swatch changed
 * nothing on the published site.
 *
 * ## Why this is safe
 *
 * All 25 pairs were compared channel-by-channel first: every one is the same
 * colour to within a rounding step (the Framework stores hsla, the migrated CSS
 * stored hex). Deleting the registry's copies is therefore a pixel-for-pixel
 * no-op that hands authorship to the panel. The script re-checks that itself
 * and REFUSES on any mismatch rather than trusting the earlier analysis.
 *
 * Three further conditions were verified and are re-asserted here, because each
 * would otherwise change rendering:
 *   - no token has darkModeEnabled, so framework.css emits a plain `:root` and
 *     no [data-theme] block that could newly win over this site's four dark
 *     sections;
 *   - no token generates utilities, shades or transparent variants, so no new
 *     classes appear;
 *   - `:root`'s contextStyles carry only the fluid-root and type-step machinery
 *     (--font-from, --t-disp, …), never a colour, so the media-query cascade is
 *     untouched.
 *
 * ## Fonts
 *
 * `settings.fonts` had both families installed and ZERO tokens, so there was no
 * `--font-*` to point at. Two tokens are created. Their names are forced to a
 * `font-` prefix by the platform (normalizeFontTokenVariable), so they cannot be
 * called `--f-display`; instead the site's two existing names become one-line
 * aliases and all of their usages keep working untouched:
 *
 *     --f-display: var(--font-display)
 *     --f-body:    var(--font-body)
 *
 * The fallback stacks are carried across verbatim from the values being
 * replaced, so a font that fails to load degrades exactly as it does today.
 *
 *   node adopt-framework-colors-fonts.mjs [--apply]
 *
 * Publishes nothing. Roll back with rollback-registry.mjs <snapshot> for the
 * registry — the font TOKENS live in settings, which that tool does not touch,
 * so a full revert also needs the snapshot's settings.fonts restoring.
 */
import { getSite, saveShell } from './insta-api.mjs'
import { writeFileSync } from 'node:fs'

const apply = process.argv.includes('--apply')

/* ---- colour comparison ------------------------------------------------ */
function toRgba(v) {
  v = String(v).trim()
  let m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v)
  if (m) {
    let h = m[1]
    if (h.length === 3) h = [...h].map((c) => c + c).join('')
    return [...[0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)), 1]
  }
  m = /^hsla?\(\s*([\d.]+)(?:deg)?\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+))?\s*\)$/i.exec(v)
  if (m) {
    const h = +m[1], s = +m[2] / 100, l = +m[3] / 100, a = m[4] === undefined ? 1 : +m[4]
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const mm = l - c / 2
    const t = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h / 60) % 6]
    return [...t.map((u) => Math.round((u + mm) * 255)), a]
  }
  m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/i.exec(v)
  if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]]
  return null
}

const { site: shell, seq } = await getSite()
writeFileSync(`output/shell.before.${seq}.json`, JSON.stringify(shell, null, 1), 'utf8')
console.log(`snapshot output/shell.before.${seq}.json`)

const fw = shell.settings?.framework
if (!fw?.colors?.tokens?.length) {
  console.error('no framework colour tokens — nothing to adopt')
  process.exit(1)
}
const tokens = fw.colors.tokens

const dark = tokens.filter((t) => t.darkModeEnabled)
const utils = tokens.filter(
  (t) => Object.values(t.generateUtilities ?? {}).some(Boolean) || t.generateShades?.enabled || t.generateTransparent,
)
if (dark.length) {
  console.error(`REFUSING: ${dark.length} token(s) have dark mode on — framework.css would emit a [data-theme] block`)
  process.exit(1)
}
if (utils.length) {
  console.error(`REFUSING: ${utils.length} token(s) generate utilities/shades — new classes would appear`)
  process.exit(1)
}

const root = Object.values(shell.styleRules ?? {}).find((r) => (r.selector ?? '').trim() === ':root')
if (!root) {
  console.error('REFUSING: no :root rule in the registry')
  process.exit(1)
}
const ctxColour = Object.entries(root.contextStyles ?? {}).flatMap(([c, bag]) =>
  Object.keys(bag ?? {})
    .filter((k) => tokens.some((t) => '--' + t.slug === k))
    .map((k) => `${c} ${k}`),
)
if (ctxColour.length) {
  console.error('REFUSING: a media context redefines a colour token:')
  for (const c of ctxColour) console.error('  ' + c)
  process.exit(1)
}

/* ---- 1. the colour shadows -------------------------------------------- */
const remove = [], mismatch = []
for (const t of tokens) {
  const name = '--' + t.slug
  const mine = root.styles?.[name]
  if (mine === undefined) continue
  const a = toRgba(t.lightValue), b = toRgba(mine)
  if (!a || !b) {
    mismatch.push(`${name}: unparseable (framework ${t.lightValue} / registry ${mine})`)
    continue
  }
  const d = Math.max(...[0, 1, 2].map((i) => Math.abs(a[i] - b[i])))
  if (d > 1 || Math.abs(a[3] - b[3]) > 0.01) {
    mismatch.push(`${name}: framework ${t.lightValue} != registry ${mine} (delta ${d})`)
    continue
  }
  remove.push(name)
}
console.log(`\ncolour shadows to remove from the registry :root: ${remove.length}`)
console.log('  ' + remove.join(' '))
if (mismatch.length) {
  console.error(`\nREFUSING: ${mismatch.length} token(s) would CHANGE colour:`)
  for (const m of mismatch) console.error('  ' + m)
  process.exit(1)
}

/* ---- 2. font tokens + aliases ----------------------------------------- */
const items = shell.settings?.fonts?.items ?? []
const PLAN = [
  { variable: 'font-display', name: 'Display', family: 'Playfair Display', alias: '--f-display' },
  { variable: 'font-body', name: 'Body', family: 'Raleway', alias: '--f-body' },
]
const fontOps = []
for (const p of PLAN) {
  const entry = items.find((i) => i.family === p.family)
  if (!entry) {
    console.error(`REFUSING: font family "${p.family}" is not installed`)
    process.exit(1)
  }
  const current = root.styles?.[p.alias]
  if (current === undefined) {
    console.error(`REFUSING: ${p.alias} is not on :root`)
    process.exit(1)
  }
  if (/^var\(/.test(current.trim())) {
    console.log(`  ${p.alias} is already an alias (${current}) — leaving it`)
    continue
  }
  const fallback =
    current
      .split(',')
      .slice(1)
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      .join(', ') || 'sans-serif'
  fontOps.push({ ...p, familyId: entry.id, fallback, was: current })
}
console.log(`\nfont tokens to create: ${fontOps.length}`)
for (const f of fontOps) {
  console.log(`  --${f.variable} = "${f.family}", ${f.fallback}`)
  console.log(`      ${f.alias}:  ${f.was}`)
  console.log(`      ${f.alias}:  var(--${f.variable})`)
}

if (!apply) {
  console.log('\nDRY RUN — re-run with --apply')
  process.exit(0)
}

/* ---- write ------------------------------------------------------------ */
const before = Object.keys(root.styles).length
for (const n of remove) delete root.styles[n]
const now = Date.now()
shell.settings.fonts.tokens = shell.settings.fonts.tokens ?? []
for (const f of fontOps) {
  shell.settings.fonts.tokens.push({
    id: `wz-${f.variable}`,
    name: f.name,
    variable: f.variable,
    familyId: f.familyId,
    fallback: f.fallback,
    order: shell.settings.fonts.tokens.length,
    createdAt: now,
    updatedAt: now,
  })
  root.styles[f.alias] = `var(--${f.variable})`
}
root.updatedAt = now
const res = await saveShell(shell, seq)

const { site: after } = await getSite()
const aRoot = Object.values(after.styleRules ?? {}).find((r) => (r.selector ?? '').trim() === ':root')
const still = remove.filter((n) => aRoot.styles?.[n] !== undefined)
const aTokens = after.settings?.fonts?.tokens ?? []
const missing = fontOps.filter((f) => !aTokens.some((t) => t.variable === f.variable))
const badAlias = fontOps.filter((f) => aRoot.styles?.[f.alias] !== `var(--${f.variable})`)
console.log(`\nseq ${seq} -> ${res.seq}`)
console.log(`:root custom properties ${before} -> ${Object.keys(aRoot.styles).length}`)
console.log(`font tokens: ${aTokens.length}`)
if (still.length || missing.length || badAlias.length) {
  console.error(
    `WRITE DID NOT LAND — ${still.length} shadows remain, ${missing.length} tokens missing, ${badAlias.length} aliases wrong`,
  )
  process.exit(1)
}
console.log('verified')
console.log('\nDraft updated. Publish with: node insta-api.mjs publish')
