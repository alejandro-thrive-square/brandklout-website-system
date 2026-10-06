#!/usr/bin/env node
/**
 * Brandklout website migration: per-page descriptions for NESTED-slug pages (staging only).
 *
 * A nested-slug page (`story/x`, `solution/x`, `specialty/x`) cannot keep `seoDescription` in its
 * cells once it has been written through PUT /site-document (pageToCells drops it), and the PATCH
 * that would put it back flattens the page's route. The Open Graph plugin reads, in order:
 * override -> the row's seoDescription -> the site-wide description. So the description each of
 * these pages had before the migration (from the pre-migration backup) goes into the plugin's
 * override store, description only: title, image, url and type stay derived exactly as before.
 *
 *   node og-overrides.mjs <pages.json backup> --site brandklout-website:staging [--apply]
 *
 * Only writes where the page has no seoDescription cell AND no override yet. Never publishes
 * (an override ships with the next publish).
 */
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const { connect } = await import(pathToFileURL(join(HERE, '..', '..', '..', 'target.mjs')).href)
const { api, target } = await connect()
if (!/staging\./.test(target.url)) throw new Error('refusing: not a staging host')
const BASE = '/admin/api/cms/plugins/brandklout.open-graph/runtime'
const snap = JSON.parse(readFileSync(args[0], 'utf8'))
const snapRows = Array.isArray(snap) ? snap : (snap.rows ?? snap.pages ?? [])
const want = new Map(snapRows.filter((r) => r.cells?.seoDescription).map((r) => [r.id, r.cells]))
const { rows } = await api.getPages()
const view = (await api.api('GET', `${BASE}/pages`)).pages
const byKey = new Map(view.map((p) => [p.key, p]))
const plan = []
for (const row of rows) {
  const was = want.get(row.id)
  if (!was || !String(row.cells.slug).includes('/')) continue
  if (row.cells.seoDescription) { console.log(`  = ${row.cells.slug}: has its seoDescription cell`); continue }
  const seen = byKey.get(row.slug)
  if (!seen) { console.log(`  ! ${row.cells.slug}: the plugin lists no page under key "${row.slug}"`); continue }
  if (seen.override) { console.log(`  = ${row.cells.slug}: already has an override`); continue }
  if (was.seoTitle && was.seoTitle !== row.cells.title) console.log(`  note ${row.cells.slug}: seoTitle "${was.seoTitle}" differed from the title; <title> and og:title were, and stay, the title cell`)
  plan.push({ key: row.slug, description: was.seoDescription })
}
console.log(`${target.url}: ${plan.length} nested-slug page(s) need a description override`)
for (const p of plan) console.log(`  + ${p.key}: ${p.description.slice(0, 90)}`)
if (!args.includes('--apply')) { console.log('DRY RUN — re-run with --apply'); process.exit(0) }
let ok = true
for (const p of plan) {
  try {
    await api.api('POST', `${BASE}/override`, { key: p.key, description: p.description, enabled: true })
  } catch (e) { ok = false; console.log(`  !! ${p.key}: ${String(e.message ?? e).slice(0, 200)}`) }
}
const after = new Map((await api.api('GET', `${BASE}/pages`)).pages.map((p) => [p.key, p]))
for (const p of plan) {
  const o = after.get(p.key)?.override
  const good = o && o.description === p.description && o.enabled !== false && !o.title && !o.url && !o.image
  console.log(`  ${good ? 'ok' : '!! FAILED'}  ${p.key}`)
  if (!good) { ok = false; console.log(`       stored: ${JSON.stringify(o)?.slice(0, 200)}  wanted: ${p.description.slice(0, 80)}`) }
}
console.log(`wrote ${plan.length} override(s) | verified ${ok}`)
process.exit(ok ? 0 : 1)
