#!/usr/bin/env node
/**
 * swap-phone.mjs — change the practice's phone number IN PLACE on an instance,
 * without a re-import, then publish.
 *
 *   node swap-phone.mjs                    # plan only
 *   node swap-phone.mjs --apply            # write the draft AND publish
 *   INSTATIC_BASE_URL=https://staging.westlaketxmedspa.com node swap-phone.mjs --apply
 *
 * 2026-09-23: (817) 383-8361 -> (817) 674-2061, the practice's display number
 * (the one in the HTML for SEO); a GoHighLevel pool script swaps it for visitors.
 *
 * On this site the number lives in two stores only (checked 2026-09-23):
 *   - page nodes — `props.text` / `props.href` on every page (all slugs flat,
 *     so a site-document write cannot flatten a route);
 *   - the shell's site.js — `var PHONE` in the GHL form's fallback.
 * There are no shared components and no open-graph / aeo-schema plugins here,
 * so nothing in a head store carries it. If either plugin is ever installed,
 * extend this — see the memory "a phone number lives in four places".
 *
 * Every string reachable from a node's props (and every shell file's content)
 * is substituted, so aria-labels come along. Structure is never touched.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, BASE, getSite, getPages, toChangedPage, publish } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')

/* Longest literal first, so a shorter one cannot eat half of a longer one. */
const MAP = [
  ['+1-817-383-8361', '+1-817-674-2061'],
  ['(817) 383-8361', '(817) 674-2061'],
  ['+18173838361', '+18176742061'],
  ['817-383-8361', '817-674-2061'],
  ['817.383.8361', '817.674.2061'],
].sort((a, b) => b[0].length - a[0].length)
const OLD = /383[\s.\- ]?8361/

let hits = 0
function sub(v) {
  if (typeof v === 'string') {
    let out = v
    for (const [from, to] of MAP) {
      if (!out.includes(from)) continue
      hits += out.split(from).length - 1
      out = out.split(from).join(to)
    }
    return out
  }
  if (Array.isArray(v)) return v.map(sub)
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, sub(x)]))
  return v
}

const { site, seq: shellBaseSeq } = await getSite()
const { rows } = await getPages()
console.log(`${BASE}  shell seq ${shellBaseSeq}, ${rows.length} pages`)

// ── the shell's files (site.js) ────────────────────────────────────────────
const before0 = hits
const nextSite = { ...site, files: (site.files ?? []).map((f) => (typeof f.content === 'string' ? { ...f, content: sub(f.content) } : f)) }
const shellHits = hits - before0
console.log(`  shell files${' '.repeat(38)} ${shellHits} strings`)

// ── pages ──────────────────────────────────────────────────────────────────
const changedPages = []
const baseSeqs = {}
for (const row of rows) {
  const body = row.cells.body
  if (!body?.nodes) continue
  const before = hits
  const nodes = Object.fromEntries(Object.entries(body.nodes).map(([id, n]) => [id, { ...n, props: sub(n.props ?? {}) }]))
  if (hits === before) continue
  console.log(`  ${(row.cells.slug || '(home)').padEnd(48)} ${hits - before} strings`)
  changedPages.push(toChangedPage(row, { nodes, rootNodeId: body.rootNodeId }))
  baseSeqs[row.id] = row.seq
}

console.log(`\n${hits} strings across ${changedPages.length} pages and the shell`)
if (!hits) { console.log('nothing to do'); process.exit(0) }
if (!APPLY) { console.log('plan only — pass --apply (writes AND publishes)'); process.exit(0) }

const host = BASE.replace(/^https?:\/\//, '').replace(/[^a-z0-9.-]/gi, '_')
const stamp = new Date().toISOString().slice(0, 10)
const dir = join(HERE, '.tmp', `backup-${host}-${stamp}-pre-phone`)
mkdirSync(dir, { recursive: true })
writeFileSync(join(dir, 'site-and-pages.json'), JSON.stringify({ site, shellBaseSeq, rows }, null, 1))
console.log(`backed up to ${dir}`)

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site: nextSite,
  changedPages,
  deletedPageIds: [],
  changedComponents: [],
  deletedComponentIds: [],
  changedLayouts: [],
  deletedLayoutIds: [],
  baseSeqs,
  shellBaseSeq,
})
console.log('saved:', JSON.stringify(res).slice(0, 160))

// ── read back, then publish ────────────────────────────────────────────────
const { site: s2 } = await getSite()
const left = []
if (OLD.test(JSON.stringify(s2))) left.push('shell')
for (const r of (await getPages()).rows) if (OLD.test(JSON.stringify(r.cells.body ?? {}))) left.push(r.cells.slug || '(home)')
if (left.length) { console.error(`OLD NUMBER STILL ON THE DRAFT: ${left.join(', ')} — not publishing; restore from ${dir}`); process.exit(1) }
console.log('draft clean — publishing')
console.log('published:', JSON.stringify(await publish()).slice(0, 200))
