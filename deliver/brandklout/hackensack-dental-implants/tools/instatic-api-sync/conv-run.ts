import './conv-preload.ts'
import { encodeLossyDeclarations } from './conv-encode.ts'
import { readFileSync, writeFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
const { cssToStyleRules } = await import('@core/siteImport')

let css = gunzipSync(readFileSync('/app/migrate-input.css.gz')).toString('utf8')

// happy-dom's CSS parser rejects the space-less at-rule prelude that browsers
// accept (`@media(min-width:720px)`), and cssToStyleRules drops the whole block
// with NO warning. The local build minifies to that form, so normalise first.
// The site's existing `site.conditions` ids are spelled with a space after the
// feature colon (`media:(max-width: 679px)`). Condition ids are derived from
// the prelude text verbatim, so normalising both gaps makes converted rules
// REUSE the existing conditions instead of minting whitespace-only duplicates.
let normalised = 0
css = css.replace(/@(media|supports|container)\s*(\([^{]*)/g, (_m, at, prelude) => {
  const tidy = prelude.replace(/:\s*/g, ': ').replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')')
  normalised++
  return `@${at} ${tidy}`
})
console.error(`normalised ${normalised} at-rule preludes`)

// happy-dom drops length-typed declarations whose value is a CSS math
// function — `padding: clamp(...)`, `margin-top: clamp(...)`, `width: min(...)`
// all vanish with no warning. Instatic's own substitution encoder covers only
// var()/env(), so widen it to the math functions using the same marker; their
// `decodeSubstitutionProperty` restores ours for free.
const enc = encodeLossyDeclarations(css)
css = enc.css
console.error(`encoded ${enc.encoded} declarations the parser would drop`)

// NO breakpoint folding.
//
// `matchMediaQueryToViewport` folds an @media that matches a site breakpoint
// into `contextStyles[breakpointId]`, and `classCss.ts` emits ALL custom
// conditions before ANY viewport context. A folded block therefore lands at the
// end of the cascade permanently, where nothing narrower can override it —
// regardless of where it sat in the source.
//
// On this site `@media screen and (max-width: 1440px)` folded into `desktop`
// and outranked `@media screen and (max-width: 479px)`, so the fluid root
// font-size took the desktop tokens at 390px and 9% of every computed value on
// mobile shifted. Passing no breakpoints keeps every @media as a custom
// condition, in one array whose order the migration controls.
const bps: Array<{ id: string; width: number; mediaQuery: string }> = []

const out: any = cssToStyleRules(css, { breakpoints: bps })
writeFileSync('/app/conv-out.json', JSON.stringify({ rules: out.rules, conditions: out.conditions, warnings: out.warnings }))
const byKind: Record<string, number> = {}
for (const r of out.rules) byKind[r.kind] = (byKind[r.kind] ?? 0) + 1
const warnKinds: Record<string, number> = {}
for (const w of out.warnings) warnKinds[w.kind] = (warnKinds[w.kind] ?? 0) + 1
console.log(JSON.stringify({
  rules: out.rules.length, byKind,
  withContexts: out.rules.filter((r: any) => Object.keys(r.contextStyles ?? {}).length).length,
  conditions: out.conditions.map((c: any) => c.id),
  warnings: out.warnings.length, warnKinds,
}, null, 1))
