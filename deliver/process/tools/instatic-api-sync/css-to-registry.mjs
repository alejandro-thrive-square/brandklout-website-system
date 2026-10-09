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
 *   An empty chip moves to the seat of its first occurrence here. A chip that
 *   already holds declarations moves only when no rule seated in between could
 *   style the same element with one of ITS properties (they travel with it);
 *   else it keeps its own seat, when no rule in between sets one of the NEW
 *   properties; else the bare rule stays a separate ambient rule at its own seat
 *   (a split class: fold-split decides later). West LA, 2026-10-08: the
 *   `display` chip (Bodoni 500, font-size) moved past `.display,.display em
 *   {font-family: Playfair}`, every H1 fell back to Bodoni and 46 blog H1s went
 *   54px -> 102px; order-pairs saw nothing, it only scans the asset.
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
import { parseCss, normaliseMedia, normaliseSelector, toBag, family, mightOverlap, splitTop } from './css-source.mjs'

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
/* Which class NAMES share an element (from the trees), for mightOverlap: a base class and its combo
   must count as overlapping, or an @media override folds past its partner and the cascade flips. */
const nameOf = new Map(Object.values(rules).map((r) => [r.id, r.name]))
const together = new Map()
const onNodes = new Set()
const noteNode = (ids) => {
  const names = ids.map((id) => nameOf.get(id)).filter(Boolean)
  for (const a of names) {
    onNodes.add(a)
    for (const b of names) if (a !== b) (together.get(a) ?? together.set(a, new Set()).get(a)).add(b)
  }
}
for (const row of rows ?? []) {
  const body = typeof row.cells?.body === 'string' ? JSON.parse(row.cells.body) : row.cells?.body
  for (const node of Object.values(body?.nodes ?? {})) { for (const id of node.classIds ?? []) assigned.add(id); noteNode(node.classIds ?? []) }
}
for (const vc of shell.visualComponents ?? []) {
  for (const id of vc.classIds ?? []) assigned.add(id)
  for (const node of Object.values(vc.tree?.nodes ?? {})) { for (const id of node.classIds ?? []) assigned.add(id); noteNode(node.classIds ?? []) }
}
// A class on no node is added at runtime by a script (is-open, is-active...): it can join anything.
const canJoin = (a, b) => !onNodes.has(a) || !onNodes.has(b) || together.get(a)?.has(b) === true
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
const stats = { merged: 0, folded: 0, created: 0, keyframes: 0, droppedFallbacks: 0, inPlace: 0, deadOverrides: 0, keptSeat: 0, keptApart: 0 }
const ctxSeen = new Map() // ruleId|ctx|prop -> source position of the asset's override
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

/* The rules already in the registry, for a chip that keeps (or leaves) a seat among them. A raw-CSS
   rule's properties are unknown, so it conflicts with any (keyframes style nothing). */
const propsOf = (r) => new Set([...Object.keys(r.styles ?? {}), ...Object.values(r.contextStyles ?? {}).flatMap((b) => Object.keys(b ?? {}))])
const existing = Object.values(rules)
  .filter((r) => !/^@keyframes\b/.test(r.selector ?? ''))
  .map((r) => ({ id: r.id, selector: r.selector || `.${r.name}`, order: r.order ?? 0, keys: r.rawCss ? null : new Set([...propsOf(r)].map(family)), props: r.rawCss ? null : propsOf(r) }))
// Same property, or a shorthand and its longhand (`font` / `fontSize`, `borderTop` / `borderTopWidth`).
const clash = (p, q) => {
  if (p === q) return true
  const [a, b] = p.length < q.length ? [p, q] : [q, p]
  return b.startsWith(a) && /[A-Z]/.test(b[a.length])
}
const clashes = (A, B) => B === null || [...A].some((p) => [...B].some((q) => clash(p, q)))

/* Order only decides between equal specificities: `h1 {font-size}` seated after a chip never beat it.
   Unknown (:is/:where/:not/:has, raw CSS) counts as equal. */
const specs = (sel) => /:(is|where|not|has)\(/i.test(sel) ? null : splitTop(sel, ',').map((s) => {
  s = s.replace(/::[\w-]+/g, ' ')
  const a = (s.match(/#[\w-]+/g) ?? []).length
  const b = (s.match(/\.[\w-]+|\[[^\]]*\]|:[\w-]+(\([^)]*\))?/g) ?? []).length
  const c = (s.replace(/#[\w-]+|\.[\w-]+|\[[^\]]*\]|:[\w-]+(\([^)]*\))?/g, ' ').match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) ?? []).length
  return `${a},${b},${c}`
})
const sameSpec = (x, y) => { const p = specs(x), q = specs(y); return !p || !q || p.some((s) => q.includes(s)) }
const conflictsBetween = (lo, selector, keys, skip = null) =>
  existing.some((e) => e.id !== skip && e.order > lo && (e.keys === null || [...keys].some((k) => e.keys.has(k))) && mightOverlap(e.selector, selector, canJoin) && (e.keys === null || sameSpec(e.selector, selector))) ||
  placed.some((p) => p.order > lo && [...keys].some((k) => p.keys.has(k)) && mightOverlap(p.selector, selector, canJoin))

/* Where a chip that already holds declarations sits (see the header): can a rule's selector meet the
   chip's element at the chip's specificity? Yes when its subject carries the chip's own class (West LA
   `.display, .display em`), classes the page trees put on one node with it, or a class on no node that
   a script adds (`is-open`). Not for a class-less subject (`[data-theme]`, `:root`) or a class on no
   node and in no script (dead): moves past those passed every gate on seven sites (2026-10-09 replay
   of every saved pre-move shell: only West LA's `.display` is a same-class pass). */
const scriptText = [
  ...(shell.files ?? []).filter((f) => f.type === 'script').map((f) => f.content ?? ''),
  ...(rows ?? []).flatMap((row) => (JSON.stringify(row.cells?.body ?? '').match(/<script[\s\S]*?<\\?\/script>/gi) ?? [])),
].join('\n')
const addedByScript = (c) => new RegExp(`(^|[^\\w-])${c.replace(/-/g, '\\-')}([^\\w-]|$)`).test(scriptText)
const couldMeet = (selector, cls) => splitTop(selector, ',').some((part) => {
  if (!sameSpec(part, `.${cls}`) || !mightOverlap(part, `.${cls}`, canJoin)) return false
  const last = (part.split(/\s*[>+~]\s*|\s+/).filter(Boolean).pop() ?? '').replace(/::?[a-z-]+(\([^)]*\))?/gi, '')
  const cs = [...last.matchAll(/\.([\w-]+)/g)].map((m) => m[1])
  if (cs.includes(cls)) return true
  return cs.length > 0 && cs.every((c) => (onNodes.has(c) ? canJoin(c, cls) : addedByScript(c)))
})
const seatBlocked = (list, lo, cls, props) =>
  list.some((r) => r.order > lo && r.id !== cls.id && clashes(props, r.props) && couldMeet(r.selector, cls.name))

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
      // CASCADE: the registry emits a rule's base, then its media overrides. A base declaration
      // that came LATER than a media override of the same property (in this asset, or any
      // override already in the registry: the asset loaded after the whole registry) used to win
      // inside that media too; as an override it would now beat the base. Such an override is
      // dead, so it goes. (Stone Surgical Arts `.arrival_component`: 84vh, @991 0, then 92vh from a
      // later file: phones showed 92vh; keeping "@991 0" made the hero collapse to 0.)
      if (!ctx) {
        for (const [c, cbag] of Object.entries(t.contextStyles ?? {})) {
          for (const k of Object.keys(styles)) {
            if (!(k in cbag)) continue
            const p = ctxSeen.get(`${t.id}|${c}|${k}`)
            if (p === undefined || p < item.pos) {
              delete cbag[k]
              if (t.contextStylePriorities?.[c]) delete t.contextStylePriorities[c][k]
              stats.deadOverrides++
            }
          }
        }
      } else {
        for (const k of Object.keys(styles)) ctxSeen.set(`${t.id}|${ctx}|${k}`, item.pos)
      }
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
      // The chip's own declarations, less those this rule overwrites (they take the asset's value,
      // which belongs at the asset's seat anyway: West LA `.ba-quote` re-set its own opsz).
      const prior = new Set([
        ...Object.keys(cls.styles ?? {}).filter((k) => ctx || !(k in styles)),
        ...Object.entries(cls.contextStyles ?? {}).flatMap(([c, b]) => Object.keys(b ?? {}).filter((k) => c !== ctx || !(k in styles))),
      ])
      const was = cls.order ?? 0
      // Its own declarations travel past every rule seated after `was`: the registry's (moving past
      // those has passed every gate) and the asset's earlier ones (the West LA failure).
      if (!prior.size || !seatBlocked(placed, -Infinity, cls, prior)) {
        // Move: nothing seated between its old seat and here sees its own declarations change place.
        cls.order = order
        const e = existing.find((x) => x.id === cls.id)
        if (e) e.order = order
        home.set(bare[1], { rule: cls, order })
        target = cls
        stats.merged++
      } else if (!seatBlocked(existing, was, cls, new Set(Object.keys(styles))) && !seatBlocked(placed, was, cls, new Set(Object.keys(styles)))) {
        home.set(bare[1], { rule: cls, order: was })
        target = cls
        stats.merged++
        stats.keptSeat++
        console.log(`  keeps seat  .${bare[1]} (order ${was}): its own declarations would move past a rule that can style the same element`)
      } else {
        stats.keptApart++
        console.log(`  kept apart  .${bare[1]}: the chip can neither move here nor take these declarations at its seat (order ${was}); a separate rule at seat ${order}`)
      }
    } else if (!conflictsBetween(h.order, item.selector, keys)) {
      target = h.rule
      stats.folded++
    }
  }

  if (target) {
    // Same cascade rule as --in-place: a base declaration folded in AFTER a media override of the
    // same property kills that override (Mason Park Kids `.cf-shot`: @1100 min-height 0, then a
    // later base 18rem; folded, the override won and the home photo collapsed to 0).
    if (!ctx) {
      for (const [c, cbag] of Object.entries(target.contextStyles ?? {})) {
        for (const k of Object.keys(styles)) {
          if (!(k in cbag)) continue
          const p = ctxSeen.get(`${target.id}|${c}|${k}`)
          if (p === undefined || p < item.pos) {
            delete cbag[k]
            if (target.contextStylePriorities?.[c]) delete target.contextStylePriorities[c][k]
            stats.deadOverrides++
          }
        }
      }
    } else {
      for (const k of Object.keys(styles)) ctxSeen.set(`${target.id}|${ctx}|${k}`, item.pos)
    }
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
    placed.push({ selector: item.selector, keys, props: new Set(Object.keys(styles)), order: home.get(bare[1]).order })
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
  placed.push({ selector: item.selector, keys, props: new Set(Object.keys(styles)), order })
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
console.log(`merged into class rule ${stats.merged} (${stats.keptSeat} at the chip's own seat), folded into it ${stats.folded}, kept apart ${stats.keptApart}`)
console.log(`new ambient rules     ${stats.created}, keyframes ${stats.keyframes}${inPlace ? `, merged in place into existing rules ${stats.inPlace}` : ''}, dead media overrides dropped ${stats.deadOverrides}`)
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
