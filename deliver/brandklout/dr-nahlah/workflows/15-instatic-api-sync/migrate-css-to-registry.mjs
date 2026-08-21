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

const HERE = dirname(fileURLToPath(import.meta.url))
const TMP = join(HERE, '.tmp')
const CODE_ASSETS = ['src/styles/runtime-states.css', 'src/styles/site.css']

const nanoid = () => randomBytes(12).toString('base64url')

/** Registry lookup key: class rules are addressed by name, ambient by selector. */
const keyOf = (rule) => (rule.kind === 'class' ? `class:${rule.name}` : `ambient:${rule.selector}`)

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
  for (const incoming of conv.rules) {
    const existing = index.get(keyOf(incoming))
    if (existing) {
      const wasEmpty = Object.keys(existing.styles ?? {}).length === 0
        && Object.keys(existing.contextStyles ?? {}).length === 0
      mergeInto(existing, incoming)
      wasEmpty ? stats.filled++ : stats.merged++
    } else {
      const created = {
        id: nanoid(),
        name: incoming.name,
        kind: incoming.kind,
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
      stats.created++
    }
  }

  // Register any @media / @supports context the converter introduced.
  const conditions = shell.conditions ?? (shell.conditions = [])
  const haveCondition = new Set(conditions.map((c) => c.id))
  for (const cond of conv.conditions ?? []) {
    if (haveCondition.has(cond.id)) continue
    conditions.push(cond)
    haveCondition.add(cond.id)
    stats.conditionsAdded++
  }

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
  const { pages } = await getPages()
  const assigned = new Set()
  for (const page of pages ?? []) {
    for (const node of Object.values(page.nodes ?? {})) {
      for (const id of node.classIds ?? []) assigned.add(id)
    }
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
