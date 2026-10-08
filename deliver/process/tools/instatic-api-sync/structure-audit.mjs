#!/usr/bin/env node
/**
 * STRUCTURE GATE: is the CSS shaped the Client-First way, beyond class names?
 *
 *   node structure-audit.mjs --site <client>:staging [--strict]        # live registry
 *   node structure-audit.mjs --local <site-src dir> [--strict]         # .css files of a build
 *
 * Checks (report always; --strict fails on any of the first three):
 *   1. SPACE SCALE   the Framework holds the house spacing steps (space-xxsmall … space-xxhuge)  [site mode]
 *   2. TYPE TOKENS   every heading-style-* / text-size-* class reads its size from a variable
 *   3. NO OVERRIDES  no static contextual rule restyles a utility / role class on a property that
 *                    class sets (`.section_arrival .heading-style-h1 {font-size}`): vary with a combo
 *                    class on the element instead. Themes and states (`[data-theme]`, `:not(.is-open)`,
 *                    `:hover` of a context) are allowed.
 *   4. SPACING ON TOKENS  share of rem spacing values (padding / margin / gap) that read a var();
 *                    --strict needs >= 80%. Existing sites report it until their scale snap (phase 2 C).
 * New builds (Scenario 0 step 03) run --strict; migrated sites run it in `migration-gates final` as a
 * report. Tools that fix what it finds: scale-tokens.mjs (1, 2, 4), context-combo.mjs (3).
 * Standard: ../client-first-style-guide/CLASS-STANDARD.md §10.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { argOf } from './target.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const STRICT = process.argv.includes('--strict')
const template = JSON.parse(readFileSync(join(HERE, '..', 'client-first-style-guide', 'framework-spec.template.json'), 'utf8'))
const houseSteps = template.spacing.find((g) => g.group === 'Spacing').sizes.filter((s) => s.px > 0).map((s) => s.name)
const ROLE = /^(heading-style-[\w-]+|text-size-[\w-]+)$/
const UTIL = /^(heading-style|text-size|text-style|text-weight|text-color|text-align|font-|padding-|margin-|spacer-|max-width|container-|button|icon-|background-color)/
const SPACE = /^(padding|margin)(Top|Right|Bottom|Left|Block|Inline)?$|^(gap|rowGap|columnGap)$/
const camel = (k) => k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
const fam = (k) => k.replace(/^(Webkit|Moz)/, '').replace(/^(padding|margin|border|inset|gap|grid|flex|font|text|background|transition|animation)[A-Z].*$/, '$1')

/* Normalised rules: { selector, decls: [[prop, value]] } (every breakpoint folded in) */
let rules = []
let frameworkSteps = null
let label
if (argOf('--local')) {
  const { parseCss } = await import('./css-source.mjs')
  const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? (n === 'node_modules' ? [] : walk(p)) : /\.css$/i.test(n) ? [p] : [] })
  for (const f of walk(argOf('--local'))) for (const r of parseCss(readFileSync(f, 'utf8')).rules) for (const sel of r.selector.split(',')) rules.push({ selector: sel.trim(), decls: r.decls.map((d) => [camel(d.prop), d.value]) })
  label = argOf('--local')
} else {
  const { connect } = await import('./target.mjs')
  const { api, target } = await connect()
  const { site } = await api.getSite()
  for (const r of Object.values(site.styleRules ?? {})) {
    if (r.rawCss) continue
    const decls = [r.styles ?? {}, ...Object.values(r.contextStyles ?? {})].flatMap((b) => Object.entries(b ?? {}))
    for (const sel of String(r.selector ?? '').split(',')) rules.push({ selector: sel.trim(), decls })
  }
  frameworkSteps = new Set((site.settings?.framework?.spacing?.groups ?? []).flatMap((g) => (g.manualSizes ?? []).map((s) => s.name)))
  label = target.url
}

const fails = []
const lines = []
// 1
if (frameworkSteps) {
  const missing = houseSteps.filter((n) => !frameworkSteps.has(n))
  lines.push(`${missing.length ? 'FAIL' : 'ok  '}  space scale      ${missing.length ? `Framework lacks ${missing.join(', ')}` : 'all house steps in the Framework'}`)
  if (missing.length) fails.push('space scale')
}
// 2
const bare = new Map()
for (const r of rules) {
  const m = r.selector.match(/^\.([\w-]+)$/)
  if (!m || !ROLE.test(m[1])) continue
  for (const [k, v] of r.decls) if (k === 'fontSize' && !/var\(--/.test(v)) bare.set(m[1], v)
}
lines.push(`${bare.size ? 'FAIL' : 'ok  '}  type tokens      ${bare.size ? `${bare.size} role class(es) with a literal size: ${[...bare].slice(0, 8).map(([c, v]) => `${c} ${v}`).join(', ')}` : 'every role class reads a variable'}`)
if (bare.size) fails.push('type tokens')
// 3
const own = new Map()
for (const r of rules) { const m = r.selector.match(/^\.([\w-]+)$/); if (m) for (const [k] of r.decls) (own.get(m[1]) ?? own.set(m[1], new Set()).get(m[1])).add(fam(k)) }
const overrides = []
for (const r of rules) {
  const parts = r.selector.split(/\s*[>+~]\s*|\s+/).filter(Boolean)
  if (parts.length < 2) continue
  const context = parts.slice(0, -1).join(' ')
  if (/\[|:not\(|:has\(|:is\(|:where\(|:hover|:focus|:active|:checked|^\.js\b|[+~]/.test(context) || /[+~]/.test(r.selector)) continue
  const subject = [...parts.at(-1).replace(/::?[\w-]+(\([^)]*\))?/g, '').matchAll(/\.([\w-]+)/g)].map((m) => m[1])
  for (const c of subject) {
    if (!UTIL.test(c) || !own.has(c)) continue
    const shared = [...new Set(r.decls.map(([k]) => fam(k)))].filter((p) => own.get(c).has(p))
    if (shared.length) overrides.push(`${r.selector} {${shared.join(',')}}`)
  }
}
const uniq = [...new Set(overrides)]
lines.push(`${uniq.length ? 'FAIL' : 'ok  '}  no overrides     ${uniq.length ? `${uniq.length} static contextual override(s) of utility/role classes, e.g. ${uniq.slice(0, 4).join(' | ')}` : 'none'}`)
if (uniq.length) fails.push('overrides')
// 4
let tok = 0, lit = 0
for (const r of rules) for (const [k, v] of r.decls) {
  if (!SPACE.test(k) || typeof v !== 'string') continue
  for (const part of v.split(/\s+/)) { if (/var\(--/.test(part)) tok++; else if (/^\d*\.?\d+rem$/.test(part) && Number.parseFloat(part) !== 0) lit++ }
}
const share = Math.round((100 * tok) / Math.max(1, tok + lit))
const shareOk = share >= 80
lines.push(`${shareOk ? 'ok  ' : STRICT ? 'FAIL' : 'note'}  spacing tokens   ${share}% of rem spacing values read a variable (${tok} token, ${lit} literal)${shareOk ? '' : '; >= 80% for a new build'}`)
if (STRICT && !shareOk) fails.push('spacing tokens')

console.log(`structure ${label}`)
for (const l of lines) console.log(l)
const verdict = STRICT ? (fails.length ? `NOT CLIENT-FIRST SHAPED (${fails.join(', ')})` : 'CLIENT-FIRST SHAPED') : `report: ${fails.length ? fails.join(', ') + ' to fix' : 'shaped'}`
console.log(verdict)
process.exit(STRICT && fails.length ? 1 : 0)
