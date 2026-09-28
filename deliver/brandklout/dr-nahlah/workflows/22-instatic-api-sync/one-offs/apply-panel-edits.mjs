#!/usr/bin/env node
/**
 * Re-apply the panel edits that the code-asset stylesheet was swallowing.
 *
 * Four rules were edited in the Styles panel and never took effect, because
 * `userStyles.css` loaded last and overrode them. They were captured before the
 * migration merged the code-asset values over the top
 * (`output/unpublished-panel-edits.json`), as published-vs-draft pairs.
 *
 * This replays that delta — the exact property changes the user made — onto the
 * current registry. Now that the panel is the only source, they will render.
 *
 *   node apply-panel-edits.mjs [--apply]
 */
import { readFileSync } from 'node:fs'
import { getSite, saveShell } from './insta-api.mjs'

const apply = process.argv.includes('--apply')
const edits = JSON.parse(readFileSync('output/unpublished-panel-edits.json', 'utf8'))
const { site: shell, seq } = await getSite()
const rules = shell.styleRules ?? {}

const norm = (s) => (s ?? '').replace(/\s*([>+~,])\s*/g, '$1').replace(/\s+/g, ' ').trim()
const bySelector = new Map()
for (const r of Object.values(rules)) {
  const k = norm(r.selector)
  const prev = bySelector.get(k)
  if (!prev || (r.order ?? 0) > (prev.order ?? 0)) bySelector.set(k, r)
}

let changed = 0
for (const e of edits) {
  const target = bySelector.get(norm(e.selector))
  if (!target) { console.warn(`  ! no rule for ${e.selector}`); continue }
  const was = e.publishedStyles ?? {}
  const wanted = e.draftStyles ?? {}
  const props = new Set([...Object.keys(was), ...Object.keys(wanted)])
  const applied = []
  for (const p of props) {
    if (was[p] === wanted[p]) continue
    const now = target.styles?.[p]
    if (wanted[p] === undefined || wanted[p] === '') {
      if (now !== undefined) { delete target.styles[p]; applied.push(`-${p}`) }
    } else if (now !== wanted[p]) {
      target.styles[p] = wanted[p]
      applied.push(`${p}=${wanted[p]}`)
    }
  }
  if (applied.length) {
    target.updatedAt = Date.now()
    changed++
    console.log(`  ${e.selector}: ${applied.join(', ')}`)
  } else {
    console.log(`  ${e.selector}: already as edited`)
  }
}
console.log(`\nrules changed: ${changed}`)
if (!apply) { console.log('DRY RUN — re-run with --apply'); process.exit(0) }
const res = await saveShell(shell, seq)
console.log(`saved — seq ${seq} -> ${res.seq}`)
