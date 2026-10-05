#!/usr/bin/env node
/**
 * Move a code-asset stylesheet into the style registry, so every declaration
 * in it can be edited in the Styles panel, then switch the asset off.
 *
 *   node css-to-registry.mjs --site dr-nahlah:staging --files src/styles/landing.css
 *   node css-to-registry.mjs ... --apply          # write the shell (does not publish)
 *
 * Unlike `migrate-css-to-registry.mjs` this needs no container: `css-source.mjs`
 * reads the CSS here and writes custom properties, math values, layered
 * backgrounds, `!important` and `@keyframes` straight into the registry, all of
 * which Instatic's happy-dom converter drops.
 *
 * ## Keeping the cascade
 *
 * The asset loaded after the whole registry, so it won every tie. Its rules
 * are therefore APPENDED (order after every existing rule) in source order, one
 * seat per source rule, which reproduces the old cascade exactly. Two
 * exceptions, both for editability and both checked:
 *
 * - A bare `.class` rule whose class is already a class-kind rule on the page
 *   tree is merged INTO that rule, so the class chip shows its declarations.
 *   The rule moves to the seat of its first occurrence here.
 * - A later occurrence of the same `.class` (an @media override, a second
 *   block) folds into that rule too, unless a rule seated in between could
 *   style the same element with the same property. Then it keeps its own seat
 *   as a separate ambient rule, because folding would let the in-between rule
 *   win where it used to lose.
 *
 * Contexts become `site.conditions` entries (`media:<query>`), inserted in the
 * order the platform's own breakpoint sort uses (max-width descending, then
 * min-width ascending, then the rest), because condition blocks inside one rule
 * emit in that array's order.
 *
 * Unassigned class-kind rules are demoted to ambient (see
 * `migrate-css-to-registry.mjs`: an unused class-kind name makes the publish
 * tree-shake drop every ambient selector that mentions it).
 *
 * Refuses when the CSS holds anything the registry cannot (`@font-face`,
 * `@import`, nested conditions, CSS nesting) unless `--keep-residual`, which
 * leaves exactly those in the asset and keeps it enabled.
 *
 * Verify with `css-parity.mjs` before and after the publish.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import { connect, argOf } from './target.mjs'
import { parseCss, normaliseMedia, normaliseSelector, toBag, family, mightOverlap } from './css-source.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, 'output')
const apply = process.argv.includes('--apply')
const keepResidual = process.argv.includes('--keep-residual')
const inPlace = process.argv.includes('--in-place')
const files = (argOf('--files') ?? '').split(',').filter(Boolean)
if (!files.length) {
  console.error('usage: css-to-registry.mjs [--site <client>[:staging]] --files <asset path,...> [--keep-residual] [--apply]')
  process.exit(2)
}

const nid = () => randomBytes(12).toString('base64url')
const now = Date.now()
const { api, target } = await connect()
const { site: shell, seq } = await api.getSite()
mkdirSync(OUT, { recursive: true })
const host = new URL(target.url).hostname
writeFileSync(join(OUT, `shell.before-css-to-registry.${host}.${seq}.json`), JSON.stringify(shell))
console.log(`target     ${target.url} (seq ${seq})`)

const rules = shell.styleRules ?? (shell.styleRules = {})
const conditions = shell.conditions ?? (shell.conditions = [])
const runtimeStyles = (shell.runtime ??= {}).styles ??= {}

/* ── class ids on the page trees and visual components ───────────────────── */
const { rows } = await api.getPages()
const assigned = new Set()
for (const row of rows ?? []) {
  const body = typeof row.cells?.body === 'string' ? JSON.parse(row.cells.body) : row.cells?.body
  for (const node of Object.values(body?.nodes ?? {})) for (const id of node.classIds ?? []) assigned.add(id)
}
for (const vc of shell.visualComponents ?? []) {
  for (const id of vc.classIds ?? []) assigned.add(id)
  for (const node of Object.values(vc.tree?.nodes ?? {})) for (const id of node.classIds ?? []) assigned.add(id)
}
if (assigned.size === 0) throw new Error('no class ids found on any page: a traversal bug, refusing')
console.log(`class ids on nodes  ${assigned.size}`)

const classRuleByName = new Map()
for (const r of Object.values(rules)) {
  if (r.kind === 'class' && assigned.has(r.id) && r.selector === `.${r.name}`) classRuleByName.set(r.name, r)
}

/* ── conditions ─────────────────────────────────────────────────────────── */
const WIDTH_RE = /^\(?\s*(max|min)-width\s*:\s*(\d+(?:\.\d+)?)\s*px\s*\)?$/i
const conditionRank = (c) => {
  if (c.condition?.kind !== 'media') return [3, 0]
  const q = c.condition.query.replace(/^\s*(?:only\s+)?(?:screen|all)\s+and\s+/i, '').trim()
  const m = q.match(WIDTH_RE)
  if (!m) return [2, 0]
  return m[1].toLowerCase() === 'max' ? [0, -Number(m[2])] : [1, Number(m[2])]
}
let conditionsAdded = 0
function contextId(prelude) {
  const kind = prelude.match(/^@(media|supports|container)/i)[1].toLowerCase()
  const query = normaliseMedia(prelude)
  const id = `${kind}:${query}`
  if (!conditions.some((c) => c.id === id)) {
    const entry = { id, label: query, condition: { kind, query } }
    const r = conditionRank(entry)
    let at = conditions.findIndex((c) => {
      const o = conditionRank(c)
      return o[0] > r[0] || (o[0] === r[0] && o[1] > r[1])
    })
    if (at === -1) at = conditions.length
    conditions.splice(at, 0, entry)
    conditionsAdded++
  }
  return id
}

/* ── read the assets ────────────────────────────────────────────────────── */
const assets = files.map((p) => {
  const f = (shell.files ?? []).find((x) => x.type === 'style' && x.path === p)
  if (!f) throw new Error(`no style asset ${p} on the shell`)
  if (runtimeStyles[f.id]?.enabled === false) throw new Error(`${p} is already disabled`)
  return f
})
const scoped = assets.filter((f) => runtimeStyles[f.id]?.scope && runtimeStyles[f.id].scope.type !== 'all-pages')
for (const f of scoped) {
  console.log(`note       ${f.path} is scoped to ${runtimeStyles[f.id].scope.pageIds?.length ?? '?'} page(s); the registry is site-wide, so its selectors must not match elsewhere (check the list below)`)
}
const parsed = parseCss(assets.map((f) => f.content ?? '').join('\n'))
if (parsed.unsupported.length) {
  console.log(`\nresidual   ${parsed.unsupported.length} block(s) the registry cannot hold:`)
  for (const u of parsed.unsupported) console.log(`  [${u.why}] ${u.text.slice(0, 140)}`)
  if (!keepResidual) {
    console.error('\nREFUSING: move these first (fonts to the font library) or pass --keep-residual')
    process.exit(1)
  }
}

/* ── place every rule ───────────────────────────────────────────────────── */
let seat = Math.max(0, ...Object.values(rules).map((r) => r.order ?? 0)) + 1
const placed = [] // { selector, keys: Set<family>, order }
const stats = { merged: 0, folded: 0, created: 0, keyframes: 0, droppedFallbacks: 0, inPlace: 0 }
const inPlaceIndex = new Map()
if (inPlace) {
  for (const r of Object.values(rules)) {
    if (r.rawCss) continue
    const k = normaliseSelector(r.selector)
    const prev = inPlaceIndex.get(k)
    if (!prev || (r.order ?? 0) > (prev.order ?? 0)) inPlaceIndex.set(k, r)
  }
}
const home = new Map() // class name -> { rule, order }
const touched = new Set()
const broadSelectors = new Set()

const conflictsBetween = (lo, selector, keys) =>
  placed.some((p) => p.order > lo && [...keys].some((k) => p.keys.has(k)) && mightOverlap(p.selector, selector))

for (const item of [...parsed.rules, ...parsed.keyframes].sort((a, b) => a.pos - b.pos)) {
  const order = seat++
  if (item.name !== undefined) {
    const id = nid()
    rules[id] = {
      id, name: `@keyframes ${item.name}`, kind: 'ambient', selector: `@keyframes ${item.name}`,
      order, styles: {}, contextStyles: {}, rawCss: item.text, createdAt: now, updatedAt: now,
    }
    stats.keyframes++
    continue
  }
  const { styles, priorities, dropped } = toBag(item.decls)
  stats.droppedFallbacks += dropped.length
  if (!Object.keys(styles).length) continue
  const ctx = item.contexts.length ? contextId(item.contexts[0]) : null
  const keys = new Set(Object.keys(styles).map(family))
  if (scoped.length && !/\.[\w-]/.test(item.selector)) broadSelectors.add(item.selector)

  if (inPlace) {
    // The asset holds declarations the converter lost from rules the registry already has: they
    // go back INTO those rules, at their own position (registry-repair's semantics).
    const key = normaliseSelector(item.selector)
    const t = inPlaceIndex.get(key)
    if (t) {
      const bag = ctx ? (((t.contextStyles ??= {})[ctx]) ??= {}) : (t.styles ??= {})
      Object.assign(bag, styles)
      for (const [k, p] of Object.entries(priorities)) {
        if (ctx) (((t.contextStylePriorities ??= {})[ctx] ??= {})[k] = p)
        else ((t.stylePriorities ??= {})[k] = p)
      }
      t.updatedAt = now
      touched.add(t.id)
      stats.inPlace++
      continue
    }
  }

  const bare = item.selector.match(/^\.([\w-]+)$/)
  const cls = !inPlace && bare && classRuleByName.get(bare[1])
  let target = null
  if (cls) {
    const h = home.get(bare[1])
    if (!h) {
      cls.order = order
      home.set(bare[1], { rule: cls, order })
      target = cls
      stats.merged++
    } else if (!conflictsBetween(h.order, item.selector, keys)) {
      target = h.rule
      stats.folded++
    }
  }

  if (target) {
    if (ctx) {
      target.contextStyles = { ...(target.contextStyles ?? {}) }
      target.contextStyles[ctx] = { ...(target.contextStyles[ctx] ?? {}), ...styles }
      if (Object.keys(priorities).length) {
        target.contextStylePriorities = { ...(target.contextStylePriorities ?? {}) }
        target.contextStylePriorities[ctx] = { ...(target.contextStylePriorities[ctx] ?? {}), ...priorities }
      }
    } else {
      target.styles = { ...(target.styles ?? {}), ...styles }
      if (Object.keys(priorities).length) target.stylePriorities = { ...(target.stylePriorities ?? {}), ...priorities }
    }
    target.updatedAt = now
    touched.add(target.id)
    placed.push({ selector: item.selector, keys, order: home.get(bare[1]).order })
    continue
  }

  const id = nid()
  rules[id] = {
    id, name: item.selector, kind: 'ambient', selector: item.selector, order,
    styles: ctx ? {} : styles,
    contextStyles: ctx ? { [ctx]: styles } : {},
    ...(Object.keys(priorities).length
      ? ctx ? { contextStylePriorities: { [ctx]: priorities } } : { stylePriorities: priorities }
      : {}),
    createdAt: now, updatedAt: now,
  }
  touched.add(id)
  stats.created++
  if (inPlace) inPlaceIndex.set(normaliseSelector(item.selector), rules[id])
  placed.push({ selector: item.selector, keys, order })
}

/* Context order inside a merged rule follows the global conditions array. Say
   so when two of its contexts set the same property in the opposite order. */
const condPos = new Map(conditions.map((c, i) => [c.id, i]))
let ctxConflicts = 0
for (const id of touched) {
  const r = rules[id]
  const ids = Object.keys(r.contextStyles ?? {}).filter((k) => condPos.has(k))
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = r.contextStyles[ids[i]]
    const b = r.contextStyles[ids[j]]
    if (Object.keys(a).some((k) => k in b)) {
      ctxConflicts++
      console.warn(`  ! ${r.selector}: ${ids[i]} and ${ids[j]} both set ${Object.keys(a).filter((k) => k in b).join(', ')} — emitted in conditions order`)
    }
  }
}

/* ── demote unassigned class rules (publish tree-shake) ─────────────────────
   Only those whose name one of the moved selectors mentions: those would make
   the shake drop the moved rule. Any other unassigned class rule is dropped at
   publish today, and demoting it would start emitting it, a rendering change
   nobody asked for. Those are listed, not touched. */
const mentioned = new Set()
for (const id of touched) for (const m of (rules[id].selector ?? '').matchAll(/\.([\w-]+)/g)) mentioned.add(m[1])
let demoted = 0
const leftAlone = []
for (const r of Object.values(rules)) {
  if (r.kind !== 'class' || assigned.has(r.id) || r.generated) continue
  if (!mentioned.has(r.name)) {
    leftAlone.push(r.selector)
    continue
  }
  r.kind = 'ambient'
  r.selector = r.selector || `.${r.name}`
  demoted++
}
if (leftAlone.length) console.log(`unassigned class rules left alone (dropped at publish, as today): ${leftAlone.length}`)

/* ── switch the assets off, or leave only the residual ──────────────────── */
for (const f of assets) {
  if (parsed.unsupported.length) continue
  runtimeStyles[f.id] = { ...(runtimeStyles[f.id] ?? {}), enabled: false }
}
if (parsed.unsupported.length) {
  const f = assets[assets.length - 1]
  f.content = `/* Residual: what the style registry cannot hold. Everything else moved to the registry (css-to-registry.mjs). */\n${parsed.unsupported.map((u) => u.text).join('\n')}\n`
  f.updatedAt = now
  for (const other of assets.slice(0, -1)) runtimeStyles[other.id] = { ...(runtimeStyles[other.id] ?? {}), enabled: false }
}

console.log(`\nrules read            ${parsed.rules.length} (+${parsed.keyframes.length} @keyframes)`)
console.log(`merged into class rule ${stats.merged}, folded into it ${stats.folded}`)
console.log(`new ambient rules     ${stats.created}, keyframes ${stats.keyframes}${inPlace ? `, merged in place into existing rules ${stats.inPlace}` : ''}`)
console.log(`fallback values dropped ${stats.droppedFallbacks} (same property twice in one block: the last wins)`)
console.log(`conditions added      ${conditionsAdded} (now ${conditions.length})`)
console.log(`context conflicts     ${ctxConflicts}`)
console.log(`class rules demoted   ${demoted}`)
if (broadSelectors.size) console.log(`selectors without a class (would apply site-wide): ${[...broadSelectors].join(' | ')}`)
console.log(`assets               ${assets.map((f) => f.path).join(', ')} -> ${parsed.unsupported.length ? 'residual only' : 'disabled (content kept for rollback)'}`)

if (!apply) {
  console.log('\nDRY RUN — nothing written. Re-run with --apply.')
  process.exit(0)
}
if (scoped.length && broadSelectors.size && !process.argv.includes('--allow-broad')) {
  console.error('\nREFUSING: a page-scoped asset has selectors without a class; they would style every page. Review, then --allow-broad.')
  process.exit(1)
}
const saved = await api.saveShell(shell, seq)
console.log(`\nsaved — seq ${seq} -> ${saved.seq}. Not published: run css-parity before and after the publish.`)
