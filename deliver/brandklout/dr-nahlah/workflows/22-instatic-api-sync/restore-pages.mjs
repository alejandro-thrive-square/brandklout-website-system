#!/usr/bin/env node
/**
 * restore-pages.mjs — put page CONTENT back from a `backup.mjs` snapshot.
 *
 *   node restore-pages.mjs .tmp/backups/<stamp>-pages.json
 *   node restore-pages.mjs .tmp/backups/<stamp>-pages.json --apply
 *   node restore-pages.mjs .tmp/backups/<stamp>-pages.json --only index,contact --apply
 *   node restore-pages.mjs .tmp/backups/<stamp>-pages.json --apply --delete-new
 *
 * ## Why this exists next to rollback-registry.mjs
 *
 * That script restores `styleRules` + `conditions` — the CSS half of the shell.
 * Nothing restored page NODES, so a snapshot was only half an undo: the backups
 * were complete and there was no way to put one back. This is the other half.
 *
 * The two are deliberately separate. A bad CSS conversion and a bad page write
 * are different accidents, and restoring the registry when only a page is wrong
 * would throw away every style edit made in the browser since.
 *
 * ## What it does and does not touch
 *
 * Writes `nodes`, `rootNodeId`, `title` and `slug` for the pages named in the
 * snapshot, and nothing else. The shell — styleRules, conditions, settings,
 * code assets — is passed through untouched, so this cannot revert a CSS or
 * `seo-head.js` change. Pages CREATED since the snapshot are reported and left
 * alone unless `--delete-new` is passed, because deleting a page someone added
 * in the browser is not an undo, it is a second accident.
 *
 * ## Concurrency
 *
 * `baseSeqs` carries each page's CURRENT seq, not the snapshot's — the write is
 * "replace what is there now with this", and a 409 means someone edited that
 * page while this ran. Re-read and re-run; never force.
 *
 * NOTHING HERE PUBLISHES. The live site keeps serving the last publish until
 * someone runs `node insta-api.mjs publish`, which is deliberately a separate,
 * announced step.
 */
import { readFileSync } from 'node:fs'
import { api, getSite, getPages } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const argv = process.argv.slice(2)
const file = argv.find((a) => !a.startsWith('--'))
const APPLY = argv.includes('--apply')
const DELETE_NEW = argv.includes('--delete-new')
const onlyArg = argv.indexOf('--only')
const ONLY = onlyArg > -1 ? new Set((argv[onlyArg + 1] ?? '').split(',').filter(Boolean)) : null

if (!file) {
  console.error('usage: restore-pages.mjs <backup-pages.json> [--only a,b] [--apply] [--delete-new]')
  process.exit(2)
}

const snapshot = JSON.parse(readFileSync(file, 'utf8'))
const snapRows = snapshot.rows ?? snapshot
if (!Array.isArray(snapRows) || !snapRows.length) throw new Error(`${file}: no rows`)

const site = await getSite()
const live = (await getPages()).rows
const liveBySlug = new Map(live.map((r) => [r.slug, r]))
const snapBySlug = new Map(snapRows.map((r) => [r.slug, r]))

const nodeCount = (row) => Object.keys(row?.cells?.body?.nodes ?? {}).length

const writes = []
const unchanged = []
const missing = []

for (const snap of snapRows) {
  if (ONLY && !ONLY.has(snap.slug)) continue
  const now = liveBySlug.get(snap.slug)
  if (!now) { missing.push(snap.slug); continue }

  const same = JSON.stringify(now.cells.body) === JSON.stringify(snap.cells.body) &&
    now.cells.title === snap.cells.title
  if (same) { unchanged.push(snap.slug); continue }

  writes.push({
    id: now.id,                 // the LIVE id — a snapshot of a deleted+recreated page must not resurrect an old id
    slug: snap.slug,
    title: snap.cells.title,
    nodes: snap.cells.body.nodes,
    rootNodeId: snap.cells.body.rootNodeId,
    seq: now.seq,
    from: nodeCount(now),
    to: nodeCount(snap),
  })
}

const created = live
  .filter((r) => !snapBySlug.has(r.slug))
  .filter((r) => !ONLY || ONLY.has(r.slug))

console.log(`snapshot: ${file}`)
console.log(`  ${snapRows.length} pages in snapshot, ${live.length} live now\n`)

if (writes.length) {
  console.log(`would restore (${writes.length}):`)
  for (const w of writes) console.log(`   ${w.slug.padEnd(28)} ${w.from} -> ${w.to} nodes`)
} else {
  console.log('nothing to restore — every snapshot page already matches')
}
if (unchanged.length) console.log(`\nalready identical (${unchanged.length}): ${unchanged.join(', ')}`)
if (missing.length) console.log(`\nIN SNAPSHOT BUT NOT LIVE (${missing.length}, NOT recreated): ${missing.join(', ')}`)
if (created.length) {
  console.log(`\nCREATED SINCE THE SNAPSHOT (${created.length}): ${created.map((r) => r.slug).join(', ')}`)
  console.log(DELETE_NEW
    ? '  --delete-new given: these WILL be deleted'
    : '  left alone. Pass --delete-new only if you are sure they are yours to remove.')
}

if (!writes.length && !(DELETE_NEW && created.length)) process.exit(0)
if (!APPLY) { console.log('\ndry run — nothing written. re-run with --apply'); process.exit(0) }

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site: site.site,
  changedPages: writes.map(({ seq, from, to, ...p }) => p),
  deletedPageIds: DELETE_NEW ? created.map((r) => r.id) : [],
  changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries([
    ...writes.map((w) => [w.id, w.seq]),
    ...(DELETE_NEW ? created.map((r) => [r.id, r.seq]) : []),
  ]),
  shellBaseSeq: site.seq,
})
console.log('\nwritten:', JSON.stringify(res).slice(0, 160))

// ── verify against a fresh read ────────────────────────────────────────────

const after = (await getPages()).rows
let bad = 0
for (const w of writes) {
  const row = after.find((r) => r.slug === w.slug)
  const ok = row && JSON.stringify(row.cells.body.nodes) === JSON.stringify(w.nodes)
  if (!ok) { bad++; console.log(`BAD  ${w.slug}: ${nodeCount(row)} nodes, expected ${w.to}`) }
}
if (DELETE_NEW) {
  for (const c of created) {
    if (after.some((r) => r.slug === c.slug)) { bad++; console.log(`BAD  ${c.slug} was not deleted`) }
  }
}
console.log(`${bad ? 'BAD ' : 'OK  '} ${writes.length - bad}/${writes.length} pages restored byte-for-byte`)
if (bad) { console.error('\ndo NOT publish.'); process.exit(1) }
console.log('\nDraft restored. The LIVE site is unchanged until someone publishes.')
