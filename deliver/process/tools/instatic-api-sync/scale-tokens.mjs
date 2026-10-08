#!/usr/bin/env node
/**
 * The house Client-First scale in the Framework, and every declaration that already equals a step
 * pointed at it, so spacing and type are edited in ONE place. No visual change by construction.
 *
 *   node scale-tokens.mjs --site <client>:staging                    # dry run: report + coverage
 *   node scale-tokens.mjs --site <client>:staging --apply            # one atomic save, not published
 *   node scale-tokens.mjs --site <client>:staging --type <type-map.json> [--apply]
 *
 * SPACING (always):
 *   - the Framework group "Spacing" gets every house step it lacks (names and px from
 *     ../client-first-style-guide/framework-spec.template.json: space-xxsmall 4 … space-xxhuge 192).
 *     An existing token is never changed: a site token with a house NAME and another value refuses.
 *   - in every registry rule, base and every breakpoint, each padding / margin / gap / row-gap /
 *     column-gap value that is a rem literal EQUAL to a step becomes var(--space-<step>), including
 *     inside calc()/clamp() (`clamp(2rem, 4vw, 3rem)` -> `clamp(var(--space-medium), 4vw, var(--space-large))`).
 *   - px literals are left alone: the house fluid root scales rem, not px, so 16px is not 1rem at every
 *     width. Negative values and zeros are left alone.
 *   Off-scale values (0.9rem, 1.25rem …) stay literal: snapping them is a visible change, decided per
 *   site after a before/after (phase 2 step C).
 *
 * TYPE (only with --type): { "heading-style-h1": "size-h1", "text-size-large": "size-text-large", … }
 *   For each mapped class rule whose font-size is `Xrem` or `calc(Xrem * var(--m))` and is not
 *   redefined at a breakpoint: Framework `<token>-base` = X (must be exact at the Framework's two rem
 *   decimals, else refused), registry :root `--<token>: calc(var(--<token>-base) * var(--m))` (or
 *   `var(--<token>-base)`), and the rule reads `var(--<token>)`. Same computed value at every width.
 *
 * Refuses on a Framework conflict or a Framework-owned name re-declared at :root (framework.mjs logic).
 * Standard: ../client-first-style-guide/INSTATIC-FRAMEWORK.md, CLASS-STANDARD.md §8 (phase 2).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { connect, argOf } from './target.mjs'
import { applySpec, ownedNames, isRootSelector } from './framework-lib.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const template = JSON.parse(readFileSync(join(HERE, '..', 'client-first-style-guide', 'framework-spec.template.json'), 'utf8'))
const houseSpacing = template.spacing.find((g) => g.group === 'Spacing').sizes.filter((s) => s.px > 0)

/* ── local source mode: the same spacing rewrite on .css files ───────────────
 *   node scale-tokens.mjs --files <site-src dir> [--apply]
 * A site pushed from a local source must carry the same var(--space-*) references, or its next push
 * puts the literals back. Afterwards `framework.mjs pull --out <tokens mirror>` gives the source the
 * Framework's values for local previews. */
if (argOf('--files')) {
  const { readdirSync, statSync } = await import('node:fs')
  const stepOf = new Map(houseSpacing.map((s) => [String(Math.round((s.px / 16) * 10000) / 10000), `space-${s.name.replace(/^space-/, '')}`]))
  const DECL = /(^|[;{\s])((?:padding|margin)(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?|gap|row-gap|column-gap)(\s*:\s*)([^;}]+)/g
  const REM_ = /(?<![\w.\-])(\d*\.?\d+)rem(?![\w-])/g
  let files = 0, hit = 0, left = 0
  const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? (n === 'node_modules' ? [] : walk(p)) : /\.css$/i.test(n) ? [p] : [] })
  for (const f of walk(argOf('--files'))) {
    const src = readFileSync(f, 'utf8')
    // Comments out of the way first: a commented-out declaration is not rewritten.
    const masked = src.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
    let out = '', last = 0
    for (const m of masked.matchAll(DECL)) {
      const start = m.index + m[1].length + m[2].length + m[3].length
      const value = src.slice(start, start + m[4].length)
      const nv = value.replace(REM_, (x, n) => { const s = Number(n) === 0 ? null : stepOf.get(String(Math.round(Number(n) * 10000) / 10000)); if (!s) { left++; return x } hit++; return `var(--${s})` })
      out += src.slice(last, start) + nv
      last = start + m[4].length
    }
    out += src.slice(last)
    if (out !== src) { files++; if (APPLY) writeFileSync(f, out) }
  }
  console.log(`${argOf('--files')}: ${files} file(s) ${APPLY ? 'rewritten' : 'would change'}; ${hit} rem value(s) pointed at a step, ${left} left off-scale${APPLY ? '' : '  DRY RUN'}`)
  process.exit(0)
}

const { api, target } = await connect()
const { site: shell, seq } = await api.getSite()
const client = (argOf('--site') ?? 'site').split(':')[0]
const OUT = join(HERE, 'output', 'fleet', client)
mkdirSync(OUT, { recursive: true })
console.log(`target  ${target.url} (seq ${seq})${APPLY ? '' : '  DRY RUN'}`)

const fw = (shell.settings ??= {}).framework ??= {}
const problems = []
const remKey = (n) => String(Math.round(Number(n) * 10000) / 10000)

/* ── spacing: the house steps in the Framework ──────────────────────────── */
const existing = new Map()
for (const g of fw.spacing?.groups ?? []) for (const s of g.manualSizes ?? []) existing.set(s.name, { group: g.name, min: Number(s.min), max: Number(s.max) })
const toAdd = []
for (const s of houseSpacing) {
  const have = existing.get(s.name)
  if (!have) toAdd.push(s)
  else if (have.min !== s.px || have.max !== s.px) problems.push(`Framework ${have.group}/${s.name} is ${have.min}/${have.max}px, the house step is ${s.px}px: rename the site token first`)
}
const stepByRem = new Map(houseSpacing.map((s) => [remKey(s.px / 16), `space-${s.name.replace(/^space-/, '')}`]))

/* ── spacing: rem literals equal to a step -> var(--space-*) ─────────────── */
const SPACE_PROP = /^(padding|margin)(Top|Right|Bottom|Left|Block|Inline|BlockStart|BlockEnd|InlineStart|InlineEnd)?$|^(gap|rowGap|columnGap)$/
const REM = /(?<![\w.\-])(\d*\.?\d+)rem(?![\w-])/g
const tally = new Map()
let literalTotal = 0, literalAfter = 0
const rewrite = (value) => value.replace(REM, (m, n) => {
  literalTotal++
  const step = Number(n) === 0 ? null : stepByRem.get(remKey(n))
  if (!step) { literalAfter++; return m }
  tally.set(step, (tally.get(step) ?? 0) + 1)
  return `var(--${step})`
})
let rulesTouched = 0
for (const r of Object.values(shell.styleRules ?? {})) {
  if (r.rawCss || isRootSelector(r.selector)) continue
  let touched = false
  for (const bag of [r.styles ?? {}, ...Object.values(r.contextStyles ?? {})]) {
    for (const [k, v] of Object.entries(bag ?? {})) {
      if (!SPACE_PROP.test(k) || typeof v !== 'string' || !v.includes('rem')) continue
      const nv = rewrite(v)
      if (nv !== v) { bag[k] = nv; touched = true }
    }
  }
  if (touched) { r.updatedAt = Date.now(); rulesTouched++ }
}

/* ── type (optional map) ─────────────────────────────────────────────────── */
const typeSpec = []
const rootSet = {}
if (argOf('--type')) {
  const map = JSON.parse(readFileSync(argOf('--type'), 'utf8'))
  const owned = ownedNames(fw)
  for (const [cls, token] of Object.entries(map)) {
    const rule = Object.values(shell.styleRules ?? {}).find((r) => r.kind === 'class' && r.name === cls)
    if (!rule) { problems.push(`type: no class rule .${cls}`); continue }
    const v = rule.styles?.fontSize
    const redefined = Object.values(rule.contextStyles ?? {}).some((b) => b?.fontSize !== undefined)
    if (!v) { problems.push(`type: .${cls} has no base font-size`); continue }
    if (redefined) { problems.push(`type: .${cls} redefines font-size at a breakpoint (${v}): tokenise by hand`); continue }
    const m = v.match(/^(\d*\.?\d+)rem$/) ?? v.match(/^calc\(\s*(\d*\.?\d+)rem\s*\*\s*(var\(--[\w-]+\))\s*\)$/)
    if (!m) { if (!/var\(--/.test(v)) problems.push(`type: .${cls} font-size ${v} is not Xrem or calc(Xrem * var(--m))`); continue }
    const px = Number(m[1]) * 16
    if (Math.abs(Number((px / 16).toFixed(2)) - px / 16) > 1e-9) { problems.push(`type: .${cls} ${m[1]}rem is not exact at two rem decimals (the Framework would shift it)`); continue }
    if (owned.has(`--${token}-base`) || existing.has(`${token}-base`)) problems.push(`type: ${token}-base already exists in the Framework: check it, then map another class`)
    typeSpec.push({ name: `${token}-base`, px })
    rootSet[`--${token}`] = m[2] ? `calc(var(--${token}-base) * ${m[2]})` : `var(--${token}-base)`
    rule.styles.fontSize = `var(--${token})`
    rule.updatedAt = Date.now()
    console.log(`  type  .${cls}: ${v} -> var(--${token})   (${token}-base ${px}px)`)
  }
}

/* ── Framework + :root formulas ──────────────────────────────────────────── */
const spec = { spacing: toAdd.length ? [{ group: 'Spacing', sizes: toAdd }] : [], typography: typeSpec.length ? [{ group: 'Typography', sizes: typeSpec }] : [] }
shell.settings.framework = applySpec(fw, spec, (m) => console.log(`  ${m}`))
if (Object.keys(rootSet).length) {
  const roots = Object.values(shell.styleRules).filter((r) => r.selector === ':root' && r.kind === 'ambient' && !Object.keys(r.contextStyles ?? {}).length).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  if (!roots.length) problems.push('type: no base :root rule to hold the formulas')
  else { const r = roots.at(-1); Object.assign((r.styles ??= {}), rootSet); r.updatedAt = Date.now(); for (const [k, v] of Object.entries(rootSet)) console.log(`  registry :root#${r.order} ${k}: ${v}`) }
}
const owned = ownedNames(shell.settings.framework)
for (const r of Object.values(shell.styleRules ?? {})) {
  if (!isRootSelector(r.selector)) continue
  for (const bag of [r.styles ?? {}, ...Object.values(r.contextStyles ?? {})]) for (const k of Object.keys(bag ?? {})) if (owned.has(k)) problems.push(`registry ${r.selector} re-declares Framework-owned ${k} (it would win over framework.css)`)
}

const pct = (a, b) => `${Math.round((100 * a) / Math.max(1, b))}%`
console.log(`spacing  house steps added ${toAdd.length ? toAdd.map((s) => s.name).join(', ') : 'none'}; ${rulesTouched} rule(s) rewritten`)
console.log(`spacing  rem literals in spacing properties: ${literalTotal}; pointed at a step: ${literalTotal - literalAfter} (${pct(literalTotal - literalAfter, literalTotal)}); left off-scale: ${literalAfter}`)
console.log(`spacing  by step: ${[...tally].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}×${n}`).join(' ')}`)
if (problems.length) {
  console.error(`\nREFUSING — ${problems.length} problem(s):`)
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}
if (!APPLY) { console.log('DRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }
writeFileSync(join(OUT, `shell.before-scale-tokens.${seq}.json`), JSON.stringify((await api.getSite()).site))
const saved = await api.saveShell(shell, seq)
console.log(`saved — seq ${seq} -> ${saved.seq}. Not published. Backup: output/fleet/${client}/shell.before-scale-tokens.${seq}.json`)
