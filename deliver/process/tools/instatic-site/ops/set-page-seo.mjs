#!/usr/bin/env node
/**
 * set-page-seo.mjs — set a page's SEO title and meta description in every store that holds them,
 * and nothing else. Scenario 7 step 02 (titles and descriptions from the keyword map).
 *
 * The stores (the "eight stores" lesson, Dr. Nahlah 2026-09-28):
 *   1. the page row: `title` (the published <title>), `seoTitle`, `seoDescription`
 *      — flat slugs only: a cells PATCH flattens a nested route, so a nested page is skipped here
 *   2. the brandklout.open-graph override: title + description (og:*, twitter:*, meta description)
 * The aeo-schema WebPage node reads the row's seoTitle/seoDescription at publish time, so it follows.
 *
 * PATCH does not merge: the current cells are read fresh and spread underneath, and the page body is
 * compared byte for byte before and after (see restore-page-seo-cells.mjs). Origin: bk-dr-nahlah
 * seo-v2/push-seo-v2.mjs §1–2, cut down to titles and descriptions so a re-run cannot touch schema.
 *
 *   INSTATIC_BASE_URL=https://staging.<domain> node set-page-seo.mjs --from seo.json            # plan
 *   INSTATIC_BASE_URL=https://staging.<domain> STAGING_HOST=staging.<domain> node set-page-seo.mjs --from seo.json --apply
 * seo.json: { "<slug>": { "title": "...", "description": "..." }, ... }  ("index" or "/" = home).
 * Backs up the rows and overrides it will touch to --out (default output/backups) before writing. Draft only:
 * publish with tools/instatic-api-sync/insta-api.mjs publish. Exit 1 on any failed read-back.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { api, getPages, BASE } from '../lib/site.mjs'
import { assertStaging } from '../lib/staging-guard.mjs'

const argv = process.argv.slice(2)
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d }
const APPLY = argv.includes('--apply')
const from = arg('--from')
if (!from) { console.error('usage: node set-page-seo.mjs --from seo.json [--apply] [--out output/backups]'); process.exit(2) }
const abs = (p) => (isAbsolute(p) ? p : join(process.cwd(), p))
const want = JSON.parse(readFileSync(abs(from), 'utf8'))
if (APPLY) assertStaging()

const OG = '/admin/api/cms/plugins/brandklout.open-graph'
const slugOf = (k) => (k === '/' || k === '' ? 'index' : k.replace(/^\/+|\/+$/g, ''))
let fail = 0
const bad = (m) => { fail++; console.log(`  !! ${m}`) }

for (const [k, v] of Object.entries(want)) {
  if (v.title && v.title.length > 60) bad(`${k}: title is ${v.title.length} characters (60 max)`)
  if (v.description && (v.description.length < 120 || v.description.length > 160)) bad(`${k}: description is ${v.description.length} characters (120–160)`)
}
if (fail) { console.log('\nrefusing: fix the lengths first'); process.exit(1) }

const rows = (await getPages()).rows
const ogPages = (await api('GET', `${OG}/runtime/pages`)).pages ?? []
if (APPLY) {
  // back up every row and override this run may touch BEFORE the first write
  const keys = Object.keys(want).map(slugOf)
  const snap = { rows: [], og: ogPages.filter((x) => keys.includes(x.key)) }
  for (const r of rows.filter((x) => keys.includes(x.cells?.slug ?? x.slug) || keys.includes(x.slug))) snap.rows.push((await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row)
  const dir = abs(arg('--out', 'output/backups'))
  mkdirSync(dir, { recursive: true })
  const bf = join(dir, `set-page-seo-${new URL(BASE).hostname}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  writeFileSync(bf, JSON.stringify(snap, null, 1))
  console.log(`backup   ${bf}
`)
}
console.log(`${APPLY ? 'APPLY' : 'PLAN'} on ${BASE}: ${Object.keys(want).length} page(s)\n`)

for (const [key, v] of Object.entries(want)) {
  const slug = slugOf(key)
  const r = rows.find((x) => (x.cells?.slug ?? x.slug) === slug || x.slug === slug)
  if (!r) { bad(`${slug}: no page row`); continue }
  const full = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row
  const cells = { title: v.title ?? full.cells.title, seoTitle: v.title ?? full.cells.seoTitle, seoDescription: v.description ?? full.cells.seoDescription }
  const rowChange = Object.entries(cells).some(([c, val]) => full.cells[c] !== val)
  const og = ogPages.find((x) => x.key === slug)
  const ogChange = og && ((v.title && og.override?.title !== v.title) || (v.description && og.override?.description !== v.description))
  console.log(`  ${slug.padEnd(28)} title ${JSON.stringify(full.cells.title)} -> ${JSON.stringify(cells.title)}${rowChange || ogChange ? '' : '  (already set)'}`)
  if (!APPLY || (!rowChange && !ogChange)) continue

  if (rowChange) {
    if (slug.includes('/')) bad(`${slug}: nested slug — row cells skipped (a cells PATCH flattens the route); open-graph only`)
    else {
      const body = JSON.stringify(full.cells.body)
      await api('PATCH', `/admin/api/cms/data/rows/${r.id}`, { cells: { ...full.cells, ...cells } })
      const after = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row
      if (after.slug !== full.slug || after.cells.slug !== full.cells.slug || JSON.stringify(after.cells.body) !== body) { bad(`${slug}: SLUG OR BODY CHANGED — restore from the backup`); break }
      if (Object.entries(cells).some(([c, val]) => after.cells[c] !== val)) bad(`${slug}: cells did not read back`)
    }
  }
  if (ogChange) {
    const cur = og.override ?? { key: slug, type: 'website', enabled: true }
    const res = await api('POST', `${OG}/runtime/override`, { ...cur, key: slug, ...(v.title ? { title: v.title } : {}), ...(v.description ? { description: v.description } : {}) })
    if (!res.saved) bad(`${slug}: open-graph override not saved ${JSON.stringify(res).slice(0, 200)}`)
  } else if (!og) bad(`${slug}: not in the open-graph pages list (its share preview keeps the old text)`)
}


