#!/usr/bin/env node
/**
 * READ-ONLY: what the Open Graph plugin knows per page (the description each page would publish
 * with, and any override), for the Brandklout website migration.
 *   node og-pages.mjs --site brandklout-website:staging [--out file.json]
 */
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = dirname(fileURLToPath(import.meta.url))
const { connect, argOf } = await import(pathToFileURL(join(HERE, '..', '..', '..', 'target.mjs')).href)
const { api, target } = await connect()
let res = null
for (const p of ['/admin/api/cms/plugins/brandklout.open-graph/runtime/pages', '/admin/api/plugins/brandklout.open-graph/runtime/pages', '/plugins/brandklout.open-graph/runtime/pages']) {
  try { res = await api.api('GET', p); console.log(`${target.url}${p}`); break } catch (e) { console.log(`  ${p}: ${String(e.message ?? e).slice(0, 100)}`) }
}
if (!res) process.exit(1)
const rows = res.pages ?? res.rows ?? res
console.log(`keys: ${Object.keys(res).join(', ')}; ${rows.length} rows; sample ${JSON.stringify(rows[0]).slice(0, 500)}`)
const withOverride = rows.filter((r) => r.override)
console.log(`${withOverride.length} override(s): ${withOverride.map((r) => `${r.key}=${JSON.stringify(r.override).slice(0, 120)}`).join(' | ')}`)
for (const r of rows) console.log(`  ${String(r.key).padEnd(48)} seoDescription:${r.seoDescription ? 'yes' : 'NO '} override:${r.override ? 'yes' : 'no'}`)
if (argOf('--out')) writeFileSync(argOf('--out'), JSON.stringify(res, null, 1))
