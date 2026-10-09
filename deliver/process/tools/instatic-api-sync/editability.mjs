#!/usr/bin/env node
/**
 * GATE: can every style on this Instatic site be edited by hand in the editor?
 *
 *   node editability.mjs [--site <client>[:staging]] [--published]
 *
 * Fails (exit 1) when:
 *   1. an ENABLED code-asset stylesheet still carries rules. Code assets are
 *      served last (`userStyles`), are invisible to the Styles panel, and beat
 *      every panel edit at equal specificity. Only what the registry cannot
 *      hold may stay (`@font-face`, `@import`, nested conditions), and those
 *      are listed, not failed.
 *   2. a `:root`/`html` rule in the registry or a code asset declares a
 *      variable the Framework owns. It loads after framework.css, so the
 *      Framework edit never shows.
 *   3. the Framework has type or spacing sizes but its root font size is not
 *      16 (the default 10 makes every Framework rem 1.6x too small).
 * With --published, also reads the live stylesheets of every page and fails
 * when an owned variable is missing from framework.css or re-declared at :root
 * in a later stylesheet.
 *
 * Standard: ../client-first-style-guide/INSTATIC-FRAMEWORK.md
 */
import { connect } from './target.mjs'
import { parseCss } from './css-source.mjs'
import { ownedNames, frameworkVariables, isRootSelector } from './framework-lib.mjs'

const { api, target } = await connect()
const { site: shell } = await api.getSite()
const fw = shell.settings?.framework
const owned = ownedNames(fw)
const problems = []
const notes = []

/* 1. code assets */
const runtimeStyles = shell.runtime?.styles ?? {}
for (const f of (shell.files ?? []).filter((x) => x.type === 'style')) {
  if (runtimeStyles[f.id]?.enabled === false) continue
  const p = parseCss(f.content ?? '')
  const n = p.rules.length + p.keyframes.length
  if (n) problems.push(`code asset ${f.path} is enabled and holds ${n} rule(s) the Styles panel cannot edit — move them: css-to-registry.mjs --files ${f.path}`)
  if (p.unsupported.length) notes.push(`code asset ${f.path}: ${p.unsupported.length} residual block(s) the registry cannot hold (${[...new Set(p.unsupported.map((u) => u.why))].join(', ')})`)
}

/* 2. :root shadows */
for (const r of Object.values(shell.styleRules ?? {})) {
  if (!isRootSelector(r.selector)) continue
  for (const bag of [r.styles ?? {}, ...Object.values(r.contextStyles ?? {})]) {
    for (const k of Object.keys(bag)) if (owned.has(k)) problems.push(`registry ${r.selector} re-declares Framework variable ${k}`)
  }
}
for (const f of (shell.files ?? []).filter((x) => x.type === 'style' && runtimeStyles[x.id]?.enabled !== false)) {
  for (const r of parseCss(f.content ?? '').rules) {
    if (!isRootSelector(r.selector)) continue
    for (const d of r.decls) if (owned.has(d.prop)) problems.push(`${f.path} ${r.selector} re-declares Framework variable ${d.prop}`)
  }
}

/* 3. preferences */
const sized = (fw?.typography?.groups?.length ?? 0) + (fw?.spacing?.groups?.length ?? 0)
if (sized && fw?.preferences?.rootFontSize !== 16) problems.push(`Framework root font size is ${fw?.preferences?.rootFontSize ?? '10 (default)'}, not 16`)
if (!owned.size) problems.push('the Framework owns no variables: tokens are not editable in the Framework panel')

/* published */
if (process.argv.includes('--published')) {
  const base = target.url.replace(/\/$/, '')
  const { rows } = await api.getPages()
  const slugs = rows.map((r) => String(r.cells?.slug ?? '')).filter((s) => s && !s.includes('[') && s !== '404').map((s) => (s === 'index' ? '' : s))
  const sheets = new Map() // href -> css
  for (const slug of slugs) {
    const html = await fetch(`${base}/${slug}`).then((r) => (r.ok ? r.text() : ''))
    for (const m of html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+\.css)"/g)) if (!sheets.has(m[1])) sheets.set(m[1], null)
  }
  for (const href of sheets.keys()) sheets.set(href, await fetch(new URL(href, base)).then((r) => r.text()))
  const fwHref = [...sheets.keys()].find((h) => /\/framework-[^/]*\.css$/.test(h))
  if (!fwHref) problems.push('published: no framework-*.css linked')
  const declared = (css) => new Set(parseCss(css).rules.filter((r) => !r.contexts.length && isRootSelector(r.selector)).flatMap((r) => r.decls.map((d) => d.prop)))
  if (fwHref) {
    const inFw = declared(sheets.get(fwHref))
    for (const v of frameworkVariables(fw)) if (!inFw.has(v.name)) problems.push(`published: ${v.name} missing from ${fwHref}`)
  }
  for (const [href, css] of sheets) {
    if (href === fwHref || /\/reset-/.test(href)) continue
    for (const k of declared(css)) if (owned.has(k)) problems.push(`published: ${href} re-declares ${k} at :root`)
    if (/\/userStyles-/.test(href)) {
      const n = parseCss(css).rules.length
      if (n) problems.push(`published: ${href} serves ${n} code-asset rule(s)`)
    }
  }
  notes.push(`published: ${slugs.length} pages, ${sheets.size} stylesheet(s) checked`)
}

console.log(`${target.url}: Framework owns ${owned.size} variables, registry holds ${Object.keys(shell.styleRules ?? {}).length} rules`)
for (const n of notes) console.log(`note  ${n}`)
for (const p of problems) console.log(`FAIL  ${p}`)
console.log(problems.length ? `\n${problems.length} problem(s): not fully editable in Instatic` : '\nEDITABLE — every style is in the Framework or the Styles panel')
process.exit(problems.length ? 1 : 0)
