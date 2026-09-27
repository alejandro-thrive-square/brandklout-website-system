#!/usr/bin/env node
/**
 * Make each page's published <title> its OWN title, statically.
 *
 * Instatic has no per-page SEO fields. `buildDocumentMetaTags` in
 * `core/publisher/render.ts` resolves the document title as
 *
 *     settings.metaTitle ?? page.title ?? site.name
 *
 * and `settings` is SITE-wide. With `settings.metaTitle` set — as it was —
 * that first branch always wins, so all 37 published pages shipped the
 * identical <title>, and the only per-page title on the site was the one
 * `src/scripts/seo-head.js` assigns from JavaScript after load. Google
 * renders that; Bing and every social unfurler (Facebook, LinkedIn, Slack,
 * X) do not.
 *
 * Clearing `metaTitle` drops the resolution to `page.title`, which is the
 * per-page row title the CMS list already shows. Two things have to be true
 * of those rows first, and this script enforces both:
 *
 *   1. They must MATCH `seo.json` — the same source `seo-head.js` is
 *      generated from — or the static title and the JS title disagree and
 *      the page visibly re-titles itself in the tab on load.
 *   2. They must be PLAIN TEXT. The publisher runs `escapeHtml()` over the
 *      value, so a row holding a literal `&amp;` publishes as `&amp;amp;`
 *      and renders as the visible text "&amp;". Six rows were storing
 *      escaped entities.
 *
 * `metaDescription` is deliberately LEFT SET. There is one description slot
 * for the whole site and no per-page equivalent at any layer of the
 * publisher, so per-page descriptions stay with seo-head.js; the site-wide
 * value remains the home page's, which is the best available fallback for a
 * crawler that does not run scripts.
 *
 *   node push-page-seo.mjs           # dry run
 *   node push-page-seo.mjs --apply
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { api, getSite, getPages } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const TMP = join(HERE, '.tmp')
const APPLY = process.argv.includes('--apply')

const seo = JSON.parse(readFileSync(join(HERE, '..', '04-design', '.tmp', 'site-src', 'seo.json'), 'utf8'))

const decodeEntities = (s) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
   .replace(/&#39;/g, "'").replace(/&amp;/g, '&')

const site = await getSite()
const rows = (await getPages()).rows

mkdirSync(TMP, { recursive: true })
writeFileSync(join(TMP, 'backups', `pre-page-seo-${site.seq}.json`).replace('backups', 'backups'),
  JSON.stringify({ seq: site.seq, settings: site.site.settings, titles: Object.fromEntries(rows.map(r => [r.slug, r.cells.title])) }, null, 2))

// ── page titles ────────────────────────────────────────────────────────────
const writes = []
for (const r of rows) {
  const want = seo[r.slug]?.title
  if (!want) { console.log(`!! ${r.slug}: no seo.json entry — left untouched`); continue }
  if (r.cells.title === want) continue
  writes.push({
    id: r.id, slug: r.slug, from: r.cells.title, title: want,
    nodes: r.cells.body.nodes, rootNodeId: r.cells.body.rootNodeId, seq: r.seq,
    reason: decodeEntities(r.cells.title ?? '') === want ? 'html entities in stored title' : 'drifted from seo.json',
  })
}

// Refuse to publish a title the publisher would double-escape.
const contaminated = writes.filter((w) => /&(amp|lt|gt|quot|#\d+);/i.test(w.title))
if (contaminated.length) {
  console.error('seo.json itself carries HTML entities in a title — fix the source, not this script:')
  for (const c of contaminated) console.error(`  ${c.slug}: ${JSON.stringify(c.title)}`)
  process.exit(1)
}

const clearMetaTitle = site.site.settings?.metaTitle != null

console.log(`page title rewrites: ${writes.length}`)
for (const w of writes) {
  console.log(`  ${w.slug.padEnd(30)} (${w.reason})`)
  console.log(`      from ${JSON.stringify(w.from)}`)
  console.log(`      to   ${JSON.stringify(w.title)}`)
}
console.log(`\nsite.settings.metaTitle: ${clearMetaTitle ? `CLEAR (was ${JSON.stringify(site.site.settings.metaTitle)})` : 'already unset'}`)
console.log(`site.settings.metaDescription: kept — ${JSON.stringify(site.site.settings?.metaDescription)}`)

if (!writes.length && !clearMetaTitle) { console.log('\nnothing to do'); process.exit(0) }
if (!APPLY) { console.log('\ndry run — re-run with --apply'); process.exit(0) }

// ── one atomic save: shell + pages together ────────────────────────────────
const settings = { ...site.site.settings }
delete settings.metaTitle

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site: { ...site.site, settings },
  changedPages: writes.map(({ seq, from, reason, ...p }) => p),
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(writes.map((w) => [w.id, w.seq])),
  shellBaseSeq: site.seq,
})
console.log('\nsaved:', JSON.stringify(res).slice(0, 160))

// ── verify from a fresh read ───────────────────────────────────────────────
const afterSite = await getSite()
const afterRows = (await getPages()).rows
let bad = 0
for (const r of afterRows) {
  const want = seo[r.slug]?.title
  if (!want) continue
  if (r.cells.title !== want) { console.log(`BAD ${r.slug}: ${JSON.stringify(r.cells.title)}`); bad++ }
}
console.log(`titles matching seo.json: ${afterRows.filter(r => seo[r.slug] && r.cells.title === seo[r.slug].title).length}/${afterRows.filter(r => seo[r.slug]).length}`)
console.log(`metaTitle now: ${JSON.stringify(afterSite.site.settings?.metaTitle ?? null)}`)
console.log(`metaDescription now: ${JSON.stringify(afterSite.site.settings?.metaDescription ?? null)}`)
if (bad || afterSite.site.settings?.metaTitle != null) process.exit(1)
