/**
 * Site push, step 5 — make the pushed site EDITABLE in Instatic (tools/client-first-style-guide/INSTATIC-FRAMEWORK.md).
 *
 * push.mjs replaces the style registry with the importer's bare classes and ships the whole stylesheet as the
 * code asset src/styles/site.css, which the Styles panel cannot see and which beats every panel edit. So after
 * EVERY push, before the publish:
 *   1. css-to-registry.mjs moves site.css into the registry (bare `.class` rules into their class chip, the
 *      rest as selector rules in source order). Only the @font-face blocks stay in the asset (--keep-residual).
 *   1b. fold-split.mjs folds every class that step 1 left split over its chip + later ambient rules back into
 *      one rule (same cascade; the classes it refuses stay split and are listed), so a Styles-panel edit on the
 *      chip wins (phase 2 D, 2026-10-08).
 *   2. framework.mjs apply removes the colour tokens, the spacing steps and the type bases of
 *      ../../class-standard/framework-spec.json from the registry `:root` (a `:root` copy loads after
 *      framework.css and would beat the Framework panel), adding to the Framework only what it lacks.
 *
 * THE FRAMEWORK IS THE SOURCE OF TRUTH FOR THOSE COLOURS. push.mjs keeps `site.settings`, so the Framework
 * survives a push. Step 2 therefore only ADDS a token the Framework does not hold yet (first run on a fresh
 * instance), with the value in the spec; a token already there keeps its value, so a colour edited in the
 * panel is never put back by a push. Mirror such an edit into site-src/css/01-tokens.css (and the spec), or
 * the local preview shows the old colour.
 *
 * Staging only: the target is spelled `:staging` here and the tools resolve it from the master env.
 *
 * Usage: node push/editable.mjs             dry run (step 2's dry run needs the registry step 1 writes, so on a
 *                                           fresh push it is skipped with a note)
 *        node push/editable.mjs --apply     step 1, then step 2 dry (must pass), then step 2. Does not publish.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const TOOLS = path.resolve(HERE, '../../../../../tools/instatic-api-sync')
const SPEC = path.resolve(HERE, '../../class-standard/framework-spec.json')
const SITE = 'institute-for-advanced-dentistry:staging'
const apply = process.argv.includes('--apply')
const TMP = path.join(HERE, '.tmp')
fs.mkdirSync(TMP, { recursive: true })

const run = (name, args, write) => {
  const r = spawnSync(process.execPath, [...args, '--site', SITE, ...(write ? ['--apply'] : [])], { cwd: TOOLS, encoding: 'utf8', maxBuffer: 1 << 28 })
  const out = (r.stdout ?? '') + (r.stderr ?? '')
  const log = path.join(TMP, `editable-${name}-${write ? 'apply' : 'dry'}.log`)
  fs.writeFileSync(log, out)
  console.log(`\n=== ${name} (${write ? 'apply' : 'dry run'}) exit ${r.status} -> ${log}\n${out.trim().split('\n').slice(-14).join('\n')}`)
  return { ok: r.status === 0, out }
}

if (!fs.existsSync(SPEC)) { console.error(`missing ${SPEC}`); process.exit(1) }
const spec = JSON.parse(fs.readFileSync(SPEC, 'utf8'))

/* step 1 */
if (!run('css-to-registry', ['css-to-registry.mjs', '--files', 'src/styles/site.css', '--keep-residual'], apply).ok) process.exit(1)

/* step 1b (since 2026-10-08, CLASS-STANDARD.md §10 phase 2 D): css-to-registry leaves a class whose selector
   rules sit later in site.css split over its chip and one or more ambient `.name` rules, and a panel edit on the
   chip loses to the later rule. fold-split.mjs merges each such class back into ONE rule with the same cascade,
   and refuses (lists) the classes where the merged rule could compute differently. The push rebuilds the
   registry, so the fold runs after EVERY push; its dry run on a fresh push sees the bare registry (0 split). */
if (!run('fold-split', ['fold-split.mjs'], apply).ok) process.exit(1)

/* step 2: only what the Framework does not hold yet is added; every `:root` copy is removed */
const show = run('framework-show', ['framework.mjs', 'show'], false)
if (!show.ok) process.exit(1)
const owned = new Set([...show.out.matchAll(/^\s+(--[\w-]+)\s/gm)].map((m) => m[1]))
const missing = (spec.colors ?? []).filter((c) => !owned.has(`--${c.slug}`))
// Since 2026-10-08 (Client-First phase 2) the spec also holds the house spacing steps and the role-class type
// bases; the same rule: a size the Framework already holds is never touched, only a missing one is added.
const missingSizes = (family) => (spec[family] ?? []).map((g) => ({ group: g.group, sizes: g.sizes.filter((s) => !owned.has(`--${s.name}`)) })).filter((g) => g.sizes.length)
const typography = missingSizes('typography'), spacing = missingSizes('spacing')
const effective = { preferences: spec.preferences, colors: missing, typography, spacing, registry: spec.registry }
const effPath = path.join(TMP, 'framework-spec.effective.json')
fs.writeFileSync(effPath, JSON.stringify(effective, null, 2))
const names = (groups) => groups.flatMap((g) => g.sizes.map((s) => s.name))
console.log(`\nFramework holds ${owned.size} variable(s); ${missing.length} of the spec's ${spec.colors?.length ?? 0} colour(s) are new: ${missing.map((c) => c.slug).join(', ') || 'none'}`)
console.log(`new type sizes: ${names(typography).join(', ') || 'none'}; new spacing steps: ${names(spacing).join(', ') || 'none'}`)

const dry = run('framework', ['framework.mjs', 'apply', effPath], false)
if (!dry.ok) {
  if (!apply && /no ambient rule with selector/.test(dry.out)) {
    console.log('\n(the registry has no `:root` rule yet: step 1 is not applied. Re-run with --apply.)')
    process.exit(0)
  }
  process.exit(1)
}
if (!apply) { console.log('\ndry run: re-run with --apply to write both steps'); process.exit(0) }
if (!run('framework', ['framework.mjs', 'apply', effPath], true).ok) process.exit(1)
console.log('\nNEXT: node push/publish.mjs, then editability.mjs --published and the other gates (README)')
