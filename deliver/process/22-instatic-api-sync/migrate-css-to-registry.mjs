#!/usr/bin/env node
/**
 * Move the site's CSS out of the code-asset stylesheets and into the style
 * registry, so the Styles panel can actually edit it.
 *
 * ## Why
 *
 * Dr. Nahlah's design lives in two stylesheets attached as code assets
 * (`src/styles/runtime-states.css`, `src/styles/site.css`). Instatic serves
 * those as `userStyles.css`, which loads LAST and wins every tie. The editor's
 * Selectors/Properties panels only ever read `site.styleRules`, so:
 *
 *   - 158 registry class rules are empty shells (`.rv-card` among them) — the
 *     chip is there, the declarations are not;
 *   - no `:hover` rule exists for those classes, so the panel has no state to
 *     offer even though Instatic supports state editing perfectly well;
 *   - where a rule DOES exist in both layers, the panel edit loses the cascade.
 *
 * Once the rules are in the registry, `.rv-card:hover` becomes an ambient rule
 * that the picker surfaces as an inactive-pseudo pill with forced-state preview
 * (see `docs/reference/css-class-registry.md`), and the client edits it directly.
 *
 * ## Staging — each step is independently reversible
 *
 *   1. `--merge`   import the converted rules into the registry. The code
 *                  assets stay enabled, so they still win the cascade and the
 *                  rendered site does not change at all. Zero visual risk.
 *   2. (publish)   verify nothing moved.
 *   3. `--cutover` disable the two code assets. Now the registry is the only
 *                  source. Verify parity against the step-2 baseline.
 *
 * Rollback at any point is re-enabling the code assets.
 *
 * ## Input
 *
 * `.tmp/conv-out.json`, produced by `convert-css.md`'s remote step — Instatic's
 * OWN `cssToStyleRules` run headlessly under happy-dom. We use the platform's
 * converter rather than a reimplementation so the classification (class vs
 * ambient, breakpoint folding, condition ids) matches what the editor expects.
 *
 * Two traps that are handled there, not here, and must not be undone:
 *   - `@media(min-width:720px)` with no space is dropped SILENTLY (no warning,
 *     no rule). Browsers accept it, happy-dom does not. Preludes are normalised.
 *   - Condition ids are derived from the prelude verbatim, so the spacing has
 *     to match the site's existing `site.conditions` ids or you mint
 *     whitespace-only duplicates.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import { getSite, getPages, saveShell } from './insta-api.mjs'
import { readCascadeOrder, normaliseMedia } from './cascade-order.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const TMP = join(HERE, '.tmp')
const CODE_ASSETS = ['src/styles/runtime-states.css', 'src/styles/site.css']

const nanoid = () => randomBytes(12).toString('base64url')

/**
 * Registry lookup key. **The selector, always — never the name.**
 *
 * A class-kind rule's `name` is a binding label, not its target. The converter
 * emits `kind: 'class'` for any selector whose subject carries a class, keeping
 * the full selector and setting `name` to the bound class token: 144 of the 286
 * class rules it produced here have a selector that is not `.<name>`, including
 *
 *     name 'df-stat'  selector '.ch-difference .df-stat b'
 *     name 'dr-col'   selector '.drawer.open .dr-col li a'
 *     name 'b'        selector '.cmp .tag.b'
 *
 * Keying on the name merges the `<b>` element's declarations onto the container
 * rule and drops the ancestor scoping. That is exactly what went wrong on the
 * first run: the homepage stat blocks took the big gold display type meant for
 * the number inside them. Two rules are the same rule iff they target the same
 * selector.
 */
const normaliseSelector = (selector) =>
  (selector ?? '')
    .replace(/\s*([>+~,])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
const keyOf = (rule) => `sel:${normaliseSelector(rule.selector)}`

/**
 * Merge one converted rule's declarations onto an existing registry rule.
 * The converted values win — they are what the code asset is serving today,
 * and the code asset currently overrides the registry.
 */
function mergeInto(target, incoming) {
  target.styles = { ...(target.styles ?? {}), ...(incoming.styles ?? {}) }
  const ctx = { ...(target.contextStyles ?? {}) }
  for (const [id, bag] of Object.entries(incoming.contextStyles ?? {})) {
    ctx[id] = { ...(ctx[id] ?? {}), ...bag }
  }
  target.contextStyles = ctx
  if (incoming.rawCss) target.rawCss = incoming.rawCss
  target.updatedAt = Date.now()
}

/**
 * A class-kind rule that no node references is deleted at publish by
 * `treeShakeStyleRules`, AND it poisons every ambient selector mentioning its
 * name — that is the mechanism that silently ate `.drawer.open` and friends on
 * the last publish. An ambient rule with the same `.foo` selector is exempt
 * from both checks, because the shake only distrusts KNOWN CLASS-KIND names.
 *
 * So: any class rule that is never assigned becomes ambient. Same CSS output,
 * survives publish.
 */
function demoteUnassignedClassRules(rules, assignedIds) {
  const demoted = []
  for (const rule of Object.values(rules)) {
    if (rule.kind !== 'class') continue
    if (assignedIds.has(rule.id)) continue
    if (rule.generated) continue
    rule.kind = 'ambient'
    rule.selector = rule.selector || `.${rule.name}`
    demoted.push(rule.selector)
  }
  return demoted
}

const wantMerge = process.argv.includes('--merge')
const wantCutover = process.argv.includes('--cutover')
const apply = process.argv.includes('--apply')
if (!wantMerge && !wantCutover) {
  console.error('pick a stage: --merge  or  --cutover   (add --apply to write)')
  process.exit(2)
}

const { site: shell, seq } = await getSite()
mkdirSync(TMP, { recursive: true })
writeFileSync(join(TMP, `shell.before.${seq}.json`), JSON.stringify(shell), 'utf8')

if (wantMerge) {
  const conv = JSON.parse(readFileSync(join(TMP, 'conv-out.json'), 'utf8'))

  const rules = shell.styleRules ?? (shell.styleRules = {})
  // Index by key, keeping the HIGHEST-order copy — that is the one winning the
  // cascade today, so it is the one to merge onto. (`:root` and `html` each
  // have 52 duplicate copies left over from the import; collapsing those is a
  // separate job, but we must at least target the right one.)
  const index = new Map()
  for (const rule of Object.values(rules)) {
    const k = keyOf(rule)
    const prev = index.get(k)
    if (!prev || (rule.order ?? 0) > (prev.order ?? 0)) index.set(k, rule)
  }
  let nextOrder = Math.max(0, ...Object.values(rules).map((r) => r.order ?? 0)) + 1

  const stats = { filled: 0, merged: 0, created: 0, conditionsAdded: 0 }
  // Which registry rule each converted rule ended up as, by source position —
  // the cascade re-order below needs both facts.
  const index2rule = new Map()
  const convertedIds = new Set()
  conv.rules.forEach((incoming, sourceIndex) => {
    const existing = index.get(keyOf(incoming))
    index2rule.set(sourceIndex, existing ?? null)
    if (existing) convertedIds.add(existing.id)
    if (existing) {
      const wasEmpty = Object.keys(existing.styles ?? {}).length === 0
        && Object.keys(existing.contextStyles ?? {}).length === 0
      mergeInto(existing, incoming)
      wasEmpty ? stats.filled++ : stats.merged++
    } else {
      // New rules are created AMBIENT regardless of what the converter called
      // them. A class-kind rule survives publish only if its id appears in some
      // `node.classIds` (`styleRuleTreeShake.ts`), and a rule we just invented
      // is referenced by nothing — so creating it as class-kind would have it
      // silently deleted on the next publish. Ambient rules attach by selector
      // matching, emit identical CSS, and stay out of `knownClassNames`, which
      // also keeps junk binding names like `b`, `a` and `grid` from
      // disqualifying every other selector that mentions them.
      const created = {
        id: nanoid(),
        name: incoming.selector,
        kind: 'ambient',
        selector: incoming.selector,
        order: nextOrder++,
        styles: incoming.styles ?? {},
        contextStyles: incoming.contextStyles ?? {},
        ...(incoming.rawCss ? { rawCss: incoming.rawCss } : {}),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      rules[created.id] = created
      index.set(keyOf(created), created)
      index2rule.set(sourceIndex, created)
      convertedIds.add(created.id)
      stats.created++
    }
  })

  // ── Cascade order ──────────────────────────────────────────────────────
  //
  // Until now the code asset won everything simply by being last in the link
  // order. Once it is switched off, ties are decided by `rule.order` and by the
  // key order of `contextStyles` — neither of which the converter sets to the
  // stylesheet's own order. Recover both from the source. See cascade-order.mjs
  // for the two failures this fixes (`.ta-card h3` and `.ga-grid`).
  const cascade = readCascadeOrder(readFileSync(join(TMP, 'source.css'), 'utf8'))
  const bpQuery = new Map((shell.breakpoints ?? []).map((b) => [b.id, b.mediaQuery]))
  const preludeOf = (contextId) =>
    contextId.startsWith('media:') ? contextId.slice('media:'.length) : (bpQuery.get(contextId) ?? '')

  /** Re-insert a rule's context keys in the order the stylesheet declares them. */
  function orderContexts(rule) {
    const entries = Object.entries(rule.contextStyles ?? {})
    if (entries.length < 2) return 0
    const sel = normaliseSelector(rule.selector)
    const rank = (id) => cascade.context.get(`${sel}|${normaliseMedia(preludeOf(id))}`) ?? -1
    const sorted = [...entries].sort((a, b) => rank(a[0]) - rank(b[0]))
    const changed = sorted.some(([id], i) => id !== entries[i][0])
    if (!changed) return 0
    rule.contextStyles = Object.fromEntries(sorted)
    return 1
  }

  // Drop stale VIEWPORT-context overrides on rules the stylesheet defines.
  //
  // `classCss.ts` emits every breakpoint context AFTER every custom condition,
  // so a breakpoint entry always wins regardless of source order. `:root` still
  // carried a `desktop` entry from the original per-page import holding the
  // fluid font tokens; it re-applied `(max-width: 1440px)` after the authored
  // 479px block and made every mobile font size ~16% too large.
  //
  // A breakpoint context is kept only if the stylesheet actually declares an
  // override for this selector at that breakpoint's own media query. Anything
  // else is import residue that the code asset used to mask.
  let staleContexts = 0
  for (const id of convertedIds) {
    const rule = rules[id]
    if (!rule?.contextStyles) continue
    const sel = normaliseSelector(rule.selector)
    for (const ctxId of Object.keys(rule.contextStyles)) {
      if (!bpQuery.has(ctxId)) continue
      const declared = cascade.context.has(`${sel}|${normaliseMedia(bpQuery.get(ctxId))}`)
      if (!declared) {
        delete rule.contextStyles[ctxId]
        staleContexts++
      }
    }
  }
  console.log(`stale breakpoint contexts dropped      ${staleContexts}`)

  const splitSeats = new Map()
  const untouched = Object.values(rules).filter((r) => !convertedIds.has(r.id))
  const orderBase = Math.max(0, ...untouched.map((r) => r.order ?? 0)) + 1
  // Split out @media overrides that the stylesheet INTERLEAVES.
  //
  // Instatic emits a rule as one block: base, then every context override. The
  // source does not always agree —
  //
  //   .vs-row > span      { … }                                   (base, early)
  //   .vs-head-row > span { … }                                   (must beat it)
  //   @media(max-width:719px){ .vs-row > span { font-size:.9rem } } (must beat THAT)
  //
  // Keeping the override on the early rule lets `.vs-head-row > span` win at
  // mobile and the comparison table header takes the wrong size. Bumping the
  // whole rule later instead breaks the desktop case. The only shape that holds
  // both is a SEPARATE rule carrying just that override, seated at the
  // override's own source position.
  //
  // Only genuinely interleaved contexts are split — one whose source rank has
  // another converted rule's base sitting between it and its own base. Anything
  // else stays a context override, where the breakpoint UI can still edit it.
  const convertedRules = () => [...convertedIds].map((id) => rules[id]).filter(Boolean)
  const baseRanks = convertedRules()
    .map((r) => cascade.rule.get(normaliseSelector(r.selector)))
    .filter((v) => v !== undefined)
    .sort((a, b) => a - b)
  const hasBaseBetween = (lo, hi) => baseRanks.some((v) => v > lo && v < hi)
  let split = 0
  for (const rule of convertedRules()) {
    const sel = normaliseSelector(rule.selector)
    const base = cascade.rule.get(sel)
    if (base === undefined) continue
    for (const ctxId of Object.keys(rule.contextStyles ?? {})) {
      const rc = cascade.context.get(`${sel}|${normaliseMedia(preludeOf(ctxId))}`)
      if (rc === undefined || rc <= base) continue
      if (!hasBaseBetween(base, rc)) continue
      const bag = rule.contextStyles[ctxId]
      delete rule.contextStyles[ctxId]
      const clone = {
        id: nanoid(),
        name: rule.selector,
        kind: 'ambient',
        selector: rule.selector,
        order: 0, // set below, from rc
        styles: {},
        contextStyles: { [ctxId]: bag },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      rules[clone.id] = clone
      convertedIds.add(clone.id)
      splitSeats.set(clone.id, rc)
      split++
    }
  }
  if (split) console.log(`interleaved @media overrides split out  ${split}`)

  // Rank by LAST source position; rules the source never names keep the tail.
  const ranked = [...convertedIds]
    .map((id) => rules[id])
    .filter(Boolean)
    .sort((a, b) => {
      const ra = splitSeats.get(a.id) ?? cascade.rule.get(normaliseSelector(a.selector)) ?? Number.MAX_SAFE_INTEGER
      const rb = splitSeats.get(b.id) ?? cascade.rule.get(normaliseSelector(b.selector)) ?? Number.MAX_SAFE_INTEGER
      return ra - rb
    })
  let unranked = 0
  ranked.forEach((rule, i) => {
    if (!cascade.rule.has(normaliseSelector(rule.selector))) unranked++
    rule.order = orderBase + i
  })

  let ctxFixed = 0
  for (const rule of ranked) ctxFixed += orderContexts(rule)
  console.log(`rules re-seated in stylesheet order    ${ranked.length} (base ${orderBase}, ${unranked} not found in source)`)
  console.log(`rules whose @media order was corrected ${ctxFixed}`)

  // Register BEFORE sorting: a condition appended afterwards keeps the tail of
  // the array, which is the end of the cascade. That is how `screen and
  // (max-width: 1440px)` ended up after the 479px block again.
  // Register any @media / @supports context the converter introduced.
  const conditions = shell.conditions ?? (shell.conditions = [])
  const haveCondition = new Set(conditions.map((c) => c.id))
  for (const cond of conv.conditions ?? []) {
    if (haveCondition.has(cond.id)) continue
    conditions.push(cond)
    haveCondition.add(cond.id)
    stats.conditionsAdded++
  }


  // `classCss.ts` emits custom conditions in **`site.conditions` array order**
  // (only viewport breakpoints get its max-desc/min-asc sort). So the array is
  // the cascade for every @media block that is not a site breakpoint, and it
  // has to be the stylesheet's order or `.bl-grid`'s 1080px block emits before
  // its 700px one and the blog grid drops from three columns to two.
  // Ordering by each condition's last position in the source looks right and is
  // not: a condition appears against many rules, so one global position cannot
  // honour them all — `.ga-grid` needs 700 before 1100 while an earlier 1100
  // block pushes it the other way. Use the SAME rule the platform applies to
  // viewport breakpoints (`compareViewportContextCascade` in classCss.ts):
  // max-width descending, then min-width ascending. Non-width conditions
  // (`prefers-reduced-motion`) keep their order and sit last, where they
  // override rather than get overridden. The conflict check below is what
  // proves this order actually satisfies every rule in the sheet.
  // A media TYPE prefix must not hide the width. `screen and (max-width: 479px)`
  // and `(max-width: 479px)` are the same rung of the cascade, but a pattern
  // anchored at `(` puts every `screen and …` prelude in the unsorted bucket —
  // which is how the fluid-root 479px block ended up emitting BEFORE the 1440px
  // one and every mobile font size came out ~16% too large.
  const WIDTH_RE = /^\(?\s*(max|min)-width\s*:\s*(\d+(?:\.\d+)?)\s*px\s*\)?$/i
  const stripMediaType = (q) => q.replace(/^\s*(?:only\s+)?(?:screen|all|print)\s+and\s+/i, '').trim()
  const conditionRank = (c) => {
    const m = stripMediaType(normaliseMedia(preludeOf(c.id))).match(WIDTH_RE)
    if (!m) return [2, 0]
    return m[1].toLowerCase() === 'max' ? [0, -Number(m[2])] : [1, Number(m[2])]
  }
  const beforeOrder = (shell.conditions ?? []).map((c) => c.id)
  shell.conditions = [...(shell.conditions ?? [])]
    .map((c, i) => ({ c, i, r: conditionRank(c) }))
    .sort((a, b) => a.r[0] - b.r[0] || a.r[1] - b.r[1] || a.i - b.i)
    .map((x) => x.c)
  const movedConditions = shell.conditions.filter((c, i) => c.id !== beforeOrder[i]).length
  console.log(`conditions re-ordered                  ${movedConditions} of ${shell.conditions.length}`)

  // A single global array cannot satisfy two rules that need opposite orders.
  // Say so rather than shipping a silent conflict.
  const conditionPos = new Map(shell.conditions.map((c, i) => [c.id, i]))
  let conflicts = 0
  for (const rule of ranked) {
    const ids = Object.keys(rule.contextStyles ?? {}).filter((id) => conditionPos.has(id))
    const sel = normaliseSelector(rule.selector)
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const [x, y] = [ids[i], ids[j]]
        const sx = cascade.context.get(`${sel}|${normaliseMedia(preludeOf(x))}`)
        const sy = cascade.context.get(`${sel}|${normaliseMedia(preludeOf(y))}`)
        if (sx === undefined || sy === undefined) continue
        // Two contexts only contend if they set the same property. The fluid
        // `screen and (max-width: …)` blocks write `--font-*` while the token
        // blocks write `--t-*`; whichever emits first, the result is identical.
        const bagX = rule.contextStyles[x] ?? {}
        const bagY = rule.contextStyles[y] ?? {}
        if (!Object.keys(bagX).some((k) => k in bagY)) continue
        if ((sx - sy) * (conditionPos.get(x) - conditionPos.get(y)) < 0) {
          conflicts++
          console.warn(`  ! ${sel} wants ${preludeOf(x)} and ${preludeOf(y)} in the opposite order`)
        }
      }
    }
  }
  if (conflicts) console.warn(`  ${conflicts} rule/condition order conflicts — a global array cannot express these`)

  console.log(`empty rules filled     ${stats.filled}`)
  console.log(`live rules merged      ${stats.merged}`)
  console.log(`new rules created      ${stats.created}`)
  console.log(`conditions added       ${stats.conditionsAdded}`)
  console.log(`registry size          ${Object.keys(rules).length}`)
  console.log('\ncode assets stay ENABLED at this stage — the rendered site does not change.')
}

if (wantCutover) {
  // Which class rules does any node actually reference? Needed before we can
  // safely demote the rest; a wrong answer here deletes CSS at publish.
  // `GET /pages` answers `{ rows }` — data rows, not page trees. The tree is
  // `row.cells.body.nodes`. Reading `res.pages` returns undefined and yields a
  // confident "0 class ids referenced", which would demote every class rule in
  // the registry. Assert a plausible count rather than trusting the traversal.
  const { rows } = await getPages()
  const assigned = new Set()
  for (const row of rows ?? []) {
    const body = typeof row.cells?.body === 'string' ? JSON.parse(row.cells.body) : row.cells?.body
    for (const node of Object.values(body?.nodes ?? {})) {
      for (const id of node.classIds ?? []) assigned.add(id)
    }
  }
  if (assigned.size === 0) {
    console.error('refusing to continue: no class ids found across any page.')
    console.error('That is a traversal bug, not a site with no classes — demoting on this')
    console.error('basis would rewrite every class rule in the registry.')
    process.exit(1)
  }
  for (const vc of shell.visualComponents ?? []) {
    for (const id of vc.classIds ?? []) assigned.add(id)
    for (const node of Object.values(vc.tree?.nodes ?? {})) {
      for (const id of node.classIds ?? []) assigned.add(id)
    }
  }
  console.log(`class ids referenced by nodes: ${assigned.size}`)

  const demoted = demoteUnassignedClassRules(shell.styleRules ?? {}, assigned)
  console.log(`unassigned class rules demoted to ambient (publish-safe): ${demoted.length}`)

  const runtime = shell.runtime ?? (shell.runtime = {})
  const styles = runtime.styles ?? (runtime.styles = {})
  for (const path of CODE_ASSETS) {
    const file = (shell.files ?? []).find((f) => f.type === 'style' && f.path === path)
    if (!file) {
      console.warn(`  ! ${path} not found on the shell`)
      continue
    }
    styles[file.id] = { ...(styles[file.id] ?? {}), enabled: false }
    console.log(`  disabled ${path} (${(file.content ?? '').length} chars kept on disk for rollback)`)
  }
  console.log('\nContent is NOT deleted — re-enabling these two entries restores the old behaviour exactly.')
}

if (!apply) {
  console.log('\nDRY RUN — nothing written. Re-run with --apply.')
  process.exit(0)
}

const saved = await saveShell(shell, seq)
console.log(`\nsaved — seq ${seq} -> ${saved.seq}`)

const { site: after } = await getSite()
writeFileSync(join(TMP, `shell.after.${saved.seq}.json`), JSON.stringify(after), 'utf8')
console.log(`registry now holds ${Object.keys(after.styleRules ?? {}).length} rules`)
console.log('Publish is a separate, announced step — it ships the whole draft.')
