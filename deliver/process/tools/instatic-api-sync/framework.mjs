#!/usr/bin/env node
/**
 * The design tokens of an Instatic site live in its Framework panel
 * (`site.settings.framework`) so they can be edited by hand and survive every
 * AI upload. This script reads, seeds and mirrors that store.
 *
 *   node framework.mjs show     [--site <client>[:staging]]
 *   node framework.mjs extract  <tokens.css>  > spec.json   # draft a spec, review it
 *   node framework.mjs apply    <spec.json>   [--site ...] [--apply]
 *   node framework.mjs pull     --out <file.css> [--site ...]
 *
 * `apply` upserts (never deletes) colours and fixed type/spacing sizes, and can
 * rewrite registry declarations in the same save (`spec.registry`), which is how
 * a token moves: the Framework gains it, the registry `:root` loses it, in one
 * atomic `PUT /site-document`. Then it refuses to save if any `:root`/`html`
 * registry rule or enabled code asset still declares a Framework-owned name,
 * because that declaration loads after framework.css and silently wins.
 *
 *   spec.registry = [{ selector: ':root', set: { '--d1': 'calc(var(--d1-base) * var(--t-disp))' }, remove: ['--accent'] }]
 *
 * `pull` writes the site-src mirror (`01-tokens.css`-style `:root` block) from
 * the live Framework, so a build never re-asserts an old value.
 *
 * Gate: `editability.mjs`. Standard: ../client-first-style-guide/INSTATIC-FRAMEWORK.md
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { connect, argOf } from './target.mjs'
import { parseCss } from './css-source.mjs'
import { frameworkVariables, ownedNames, applySpec, extractSpec, isRootSelector } from './framework-lib.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, 'output')
const [cmd, file] = process.argv.slice(2).filter((x, i, all) => !x.startsWith('--') && !['--site', '--out'].includes(all[i - 1]))

if (cmd === 'extract') {
  const rules = parseCss(readFileSync(file, 'utf8')).rules.filter((r) => isRootSelector(r.selector))
  const decls = rules.filter((r) => !r.contexts.length).flatMap((r) => r.decls)
  // A token redefined inside @media is responsive; the Framework holds one value per token.
  const responsive = new Set(rules.filter((r) => r.contexts.length).flatMap((r) => r.decls.map((d) => d.prop)))
  console.log(JSON.stringify(extractSpec(decls, { responsive }), null, 2))
  process.exit(0)
}

const { api, target } = await connect()
const { site: shell, seq } = await api.getSite()
const fw = shell.settings?.framework

if (cmd === 'show') {
  console.log(`${target.url} (seq ${seq})  preferences ${JSON.stringify(fw?.preferences ?? 'defaults (root 10!)')}`)
  for (const v of frameworkVariables(fw)) console.log(`  ${v.name.padEnd(22)} ${String(v.value ?? '(fluid)').padEnd(34)} ${v.source}`)
  process.exit(0)
}

if (cmd === 'pull') {
  const out = argOf('--out')
  if (!out) throw new Error('pull needs --out <file.css>')
  const lines = frameworkVariables(fw).map((v) => `  ${v.name}: ${v.value ?? '/* fluid scale: see the Framework panel */ initial'};`)
  writeFileSync(out, `/* Mirror of the Instatic Framework on ${target.url}, pulled ${new Date().toISOString().slice(0, 10)}.\n   The Framework is the source of truth: edit there, then pull. framework.mjs pull --out <this file> */\n:root {\n${lines.join('\n')}\n}\n`)
  console.log(`wrote ${out} (${lines.length} variables)`)
  process.exit(0)
}

if (cmd !== 'apply' || !file) {
  console.error('usage: framework.mjs show | extract <css> | apply <spec.json> [--apply] | pull --out <file>  [--site <client>[:staging]]')
  process.exit(2)
}

const spec = JSON.parse(readFileSync(file, 'utf8'))
mkdirSync(OUT, { recursive: true })
const host = new URL(target.url).hostname
writeFileSync(join(OUT, `shell.before-framework.${host}.${seq}.json`), JSON.stringify(shell))
console.log(`target  ${target.url} (seq ${seq})`)

shell.settings ??= {}
shell.settings.framework = applySpec(fw, spec, (m) => console.log(`  ${m}`))

for (const edit of spec.registry ?? []) {
  // A stylesheet moved in source order (css-to-registry without --in-place) leaves one `:root`
  // rule per block (Mason Park: 14). A Framework-owned name leaves every one of them; a formula is
  // set where its property already lives (the LAST such rule wins the cascade), else on the last rule.
  const hits = Object.values(shell.styleRules ?? {})
    .filter((r) => r.selector === edit.selector && r.kind === 'ambient')
    .sort((x, y) => (x.order ?? 0) - (y.order ?? 0))
  if (!hits.length) throw new Error(`registry edit: no ambient rule with selector ${edit.selector}`)
  for (const k of edit.remove ?? []) {
    for (const r of hits) {
      if (k in (r.styles ?? {})) {
        console.log(`  registry ${edit.selector}#${r.order} - ${k}: ${r.styles[k]}`)
        delete r.styles[k]
        r.updatedAt = Date.now()
      }
    }
  }
  for (const [k, v] of Object.entries(edit.set ?? {})) {
    const holders = hits.filter((r) => k in (r.styles ?? {}))
    const r = holders.length ? holders[holders.length - 1] : hits[hits.length - 1]
    if (r.styles?.[k] !== v) console.log(`  registry ${edit.selector}#${r.order} ${k}: ${r.styles?.[k] ?? '(none)'} -> ${v}`)
    ;(r.styles ??= {})[k] = v
    r.updatedAt = Date.now()
  }
}

/* Nothing loaded after framework.css may re-declare an owned name at :root. */
const owned = ownedNames(shell.settings.framework)
const shadows = []
for (const r of Object.values(shell.styleRules ?? {})) {
  if (!isRootSelector(r.selector)) continue
  for (const bag of [r.styles ?? {}, ...Object.values(r.contextStyles ?? {})]) {
    for (const k of Object.keys(bag)) if (owned.has(k)) shadows.push(`registry ${r.selector} ${k}`)
  }
}
const runtimeStyles = shell.runtime?.styles ?? {}
for (const f of (shell.files ?? []).filter((x) => x.type === 'style' && runtimeStyles[x.id]?.enabled !== false)) {
  for (const r of parseCss(f.content ?? '').rules) {
    if (!isRootSelector(r.selector)) continue
    for (const d of r.decls) if (owned.has(d.prop)) shadows.push(`${f.path} ${r.selector} ${d.prop}`)
  }
}
if (shadows.length) {
  console.error(`\nREFUSING: ${shadows.length} declaration(s) would override the Framework (they load after framework.css):`)
  for (const s of shadows) console.error(`  ${s}`)
  console.error('Remove them in the same spec (`registry[].remove`), or rename the token.')
  process.exit(1)
}

console.log(`\nFramework now owns ${owned.size} variables; nothing at :root re-declares them.`)
if (!process.argv.includes('--apply')) {
  console.log('DRY RUN — nothing written. Re-run with --apply.')
  process.exit(0)
}
const saved = await api.saveShell(shell, seq)
console.log(`saved — seq ${seq} -> ${saved.seq}. Not published.`)
