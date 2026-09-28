#!/usr/bin/env node
/**
 * Collapse registry rules that share a selector into one rule.
 *
 * The original per-page HTML import ingested each of 26 pages' `<style>` block
 * into a single site-wide registry with no dedup, so the shared stylesheet
 * landed 26 times over. The 2026-08 dedupe pass deliberately skipped `:root`
 * and `html` — they hold the design tokens and were thought to diverge — which
 * left **52 copies of each**.
 *
 * That was survivable while the code-asset stylesheet loaded last and won
 * everything. It stopped being survivable at cutover: with the registry as the
 * only source, which of 52 `:root` copies (and which of their `@media` context
 * blocks) comes last now decides what every design token resolves to.
 *
 * Collapsing is a pure cascade-preserving operation IF it is done in order:
 * fold the copies ascending by `order`, letting later copies overwrite earlier
 * ones per property and per context, and keep the result at the highest order.
 * That is exactly what the browser computes today, expressed as one rule.
 *
 *   node collapse-duplicates.mjs            # report what would collapse
 *   node collapse-duplicates.mjs --apply
 *
 * By default it collapses every duplicated selector. Pass selectors to limit
 * it:  node collapse-duplicates.mjs ':root' 'html' --apply
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSite, saveShell } from './insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const TMP = join(HERE, 'output')

const normaliseSelector = (selector) =>
  (selector ?? '')
    .replace(/\s*([>+~,])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

const apply = process.argv.includes('--apply')
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'))

const { site: shell, seq } = await getSite()
mkdirSync(TMP, { recursive: true })
writeFileSync(join(TMP, `shell.before.${seq}.json`), JSON.stringify(shell), 'utf8')

const rules = shell.styleRules ?? {}
const groups = new Map()
for (const rule of Object.values(rules)) {
  // Scoped rules belong to a single node and are not interchangeable with a
  // same-selector rule elsewhere; generated utilities are framework-owned.
  if (rule.scope || rule.generated) continue
  const key = `${rule.kind}|${normaliseSelector(rule.selector)}`
  if (!groups.has(key)) groups.set(key, [])
  groups.get(key).push(rule)
}

const duplicated = [...groups.entries()]
  .filter(([, rs]) => rs.length > 1)
  .filter(([key]) => only.length === 0 || only.some((s) => key.endsWith(`|${normaliseSelector(s)}`)))
  .sort((a, b) => b[1].length - a[1].length)

if (duplicated.length === 0) {
  console.log('no duplicated selectors to collapse')
  process.exit(0)
}

console.log(`duplicated selectors: ${duplicated.length}`)
for (const [key, rs] of duplicated.slice(0, 12)) {
  console.log(`   ${String(rs.length).padStart(3)}x  ${key.split('|')[1].slice(0, 60)}`)
}

let removed = 0
for (const [, rs] of duplicated) {
  // Ascending by order: later copies win, which is the cascade as it stands.
  const ordered = [...rs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const winner = ordered[ordered.length - 1]
  const styles = {}
  const contextStyles = {}
  let rawCss
  for (const rule of ordered) {
    Object.assign(styles, rule.styles ?? {})
    for (const [ctx, bag] of Object.entries(rule.contextStyles ?? {})) {
      contextStyles[ctx] = { ...(contextStyles[ctx] ?? {}), ...bag }
    }
    if (rule.rawCss) rawCss = rule.rawCss
  }
  winner.styles = styles
  winner.contextStyles = contextStyles
  if (rawCss) winner.rawCss = rawCss
  winner.updatedAt = Date.now()
  for (const rule of ordered) {
    if (rule.id === winner.id) continue
    delete rules[rule.id]
    removed++
  }
}

console.log(`\nrules removed: ${removed}`)
console.log(`registry: ${Object.keys(rules).length + removed} -> ${Object.keys(rules).length}`)

if (!apply) {
  console.log('\nDRY RUN — nothing written. Re-run with --apply.')
  process.exit(0)
}

const saved = await saveShell(shell, seq)
const { site: after } = await getSite()
const remaining = Object.values(after.styleRules ?? {})
console.log(`saved — seq ${seq} -> ${saved.seq}; registry now ${remaining.length} rules`)
for (const sel of [':root', 'html']) {
  const n = remaining.filter((r) => normaliseSelector(r.selector) === sel).length
  console.log(`   copies of ${sel}: ${n}`)
}
