#!/usr/bin/env node
/**
 * swap-phone.mjs — change the practice's phone number IN PLACE on an instance,
 * without a re-import, then publish.
 *
 *   node swap-phone.mjs                    # plan only
 *   node swap-phone.mjs --apply            # write the draft AND publish
 *   INSTATIC_BASE_URL=https://staging.dfwsurgicalarts.com node swap-phone.mjs --apply
 *
 * 2026-09-23: (817) 918-3666 -> (817) 767-4188, then the same day (817) 767-4188
 * -> (817) 674-2061; 2026-09-24 -> (817) 631-4619, the DISPLAY number: the one published for SEO and NAP, which
 * the GoHighLevel pool (set-dni-pool.mjs, production only) swaps for a tracking
 * number in the visitor's browser. Edit MAP for the next change.
 *
 * On this site the number lives in page nodes only (checked 2026-09-23: all
 * 52 production / 54 staging pages, slugs flat; nothing in the shell, no shared
 * components, no open-graph / aeo-schema plugins). Shell files are swept anyway.
 * If either head plugin is ever installed, extend this — see the memory
 * "a phone number lives in four places".
 *
 * Every string reachable from a node's props (and every shell file's content)
 * is substituted, so aria-labels come along. Structure is never touched.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, BASE, getSite, getPages, toChangedPage, publish } from '../../../../process/tools/instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')

/* Longest literal first, so a shorter one cannot eat half of a longer one. */
const MAP = [
  ['+1-817-674-2061', '+1-817-631-4619'],
  ['(817) 674-2061', '(817) 631-4619'],
  ['+18176742061', '+18176314619'],
  ['817-674-2061', '817-631-4619'],
  ['817.674.2061', '817.631.4619'],
].sort((a, b) => b[0].length - a[0].length)
const OLD = /674.?2061/

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
