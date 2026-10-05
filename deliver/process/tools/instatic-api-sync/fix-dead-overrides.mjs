#!/usr/bin/env node
/**
 * Repair for sites moved with `css-to-registry.mjs --in-place` before 2026-10-05 (dead media overrides).
 *
 *   node fix-dead-overrides.mjs --site <client>:staging --backup <backup-pre-migration/site.json> --path src/styles/tokens.css [--apply]
 *
 * The old --in-place merged a later base declaration into a rule but kept media overrides of the
 * same property that came BEFORE it (in the asset, or already in the registry). In the old cascade
 * the later base won inside that media; in the registry the override wins. This recomputes, from the
 * asset as it was (read from the pre-migration backup), which overrides were dead, and removes them
 * from the live registry: for each selector/property the asset sets as a base, an override survives
 * only if the asset itself declares it AFTER its last base declaration. Not published.
 */
import { readFileSync } from 'node:fs'
import { connect, argOf } from './target.mjs'
import { parseCss, normaliseMedia, normaliseSelector, toBag } from './css-source.mjs'

const backup = JSON.parse(readFileSync(argOf('--backup'), 'utf8'))
const old = backup.site ?? backup
const asset = (old.files ?? []).find((f) => f.path === argOf('--path'))
if (!asset) throw new Error(`no ${argOf('--path')} in the backup`)
const { api, target } = await connect()
const { site, seq } = await api.getSite()

// per selector+prop: last base position; per selector+ctx+prop: last override position (asset only)
const lastBase = new Map()
const lastCtx = new Map()
for (const r of parseCss(asset.content ?? '').rules) {
  const sel = normaliseSelector(r.selector)
  const ctx = r.contexts.length ? `${r.contexts[0].match(/^@(media|supports|container)/i)[1].toLowerCase()}:${normaliseMedia(r.contexts[0])}` : null
  for (const k of Object.keys(toBag(r.decls).styles)) {
    if (ctx) lastCtx.set(`${sel}|${ctx}|${k}`, r.pos)
    else lastBase.set(`${sel}|${k}`, r.pos)
  }
}
const bySel = new Map()
for (const r of Object.values(site.styleRules ?? {})) {
  if (r.rawCss) continue
  const k = normaliseSelector(r.selector)
  const prev = bySel.get(k)
  if (!prev || (r.order ?? 0) > (prev.order ?? 0)) bySel.set(k, r)
}
const removed = []
for (const [key, basePos] of lastBase) {
  const [sel, prop] = key.split('|')
  const rule = bySel.get(sel)
  if (!rule) continue
  for (const [ctx, bag] of Object.entries(rule.contextStyles ?? {})) {
    if (!(prop in bag)) continue
    const p = lastCtx.get(`${sel}|${ctx}|${prop}`)
    if (p !== undefined && p > basePos) continue
    removed.push(`${sel} @ ${ctx}: ${prop}: ${bag[prop]}`)
    delete bag[prop]
    if (rule.contextStylePriorities?.[ctx]) delete rule.contextStylePriorities[ctx][prop]
    rule.updatedAt = Date.now()
  }
}
console.log(`${target.url} (seq ${seq}): ${removed.length} dead media override(s)`)
for (const r of removed) console.log(`  - ${r}`)
if (!process.argv.includes('--apply') || !removed.length) {
  console.log(removed.length ? '\nDRY RUN — re-run with --apply.' : '\nnothing to repair')
  process.exit(0)
}
const saved = await api.saveShell(site, seq)
console.log(`\nsaved — seq ${seq} -> ${saved.seq}. Not published.`)
