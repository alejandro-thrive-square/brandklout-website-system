#!/usr/bin/env node
/**
 * "Dental Group of Tysons" out of the Journal (user, 2026-10-06; CS item since 2026-10-02): the
 * practice's former name, in 23 places across 13 post bodies. Ordered rules, most specific first,
 * so each sentence still reads; the last rule is the plain swap to the practice's name.
 * Same mechanics as push-posts-v3.mjs: backup, PATCH the body, read back, ROW publish (a site
 * publish does not promote post rows). Run publish-post-rows.mjs first: 0 stale rows.
 *
 *   node seo-v3/push-old-name.mjs            # dry run: every change in context
 *   node seo-v3/push-old-name.mjs --apply
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { api, BASE } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const NAME = 'Dr. Nahlah Implants and Prosthodontics Specialists'
const OLD = 'Dental Group of Tysons'
export const RULES = [
  [`<h2>How ${OLD} Can Help`, '<h2>How Dr. Nahlah’s Practice Can Help'],
  [`<h2>Why Choose ${OLD} for`, '<h2>Why Choose Dr. Nahlah’s Practice for'],
  [`His practice at ${OLD} is renowned`, 'His practice is renowned'],
  [`Dr. Nahlah’s practice at the ${OLD} is equipped`, 'Dr. Nahlah’s practice is equipped'],
  [`flexible payment plans at the ${OLD}.`, 'flexible payment plans.'],
  [`at our ${OLD} office`, 'at our Tysons Corner office'],
  [`The ${OLD}, led by`, `${NAME}, led by`],
  [`the ${OLD}`, NAME],
  [OLD, NAME],
]
console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} on ${BASE}`)
const { rows } = await api('GET', '/admin/api/cms/data/tables/posts/rows')
const BK = join(HERE, '..', '.tmp', 'backups', `old-name-${BASE.replace(/^https?:\/\//, '')}-${new Date().toISOString().replace(/[:.]/g, '-')}`)
mkdirSync(BK, { recursive: true })
let changed = 0, failures = 0, swaps = 0
const saved = []
for (const r of rows) {
  const row = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row
  const body = row.cells.body
  if (!body.includes(OLD)) continue
  saved.push(row)
  let next = body
  for (const [a, b] of RULES) { const n = next.split(a).length - 1; if (n) { swaps += n; next = next.split(a).join(b) } }
  if (next.includes(OLD)) { failures++; console.log(`  !! ${row.cells.slug}: old name left`); continue }
  changed++
  console.log(`  ${row.cells.slug}`)
  for (const [a, b] of RULES) for (let i = body.indexOf(a); i >= 0; i = body.indexOf(a, i + 1)) console.log(`     …${body.slice(Math.max(0, i - 40), i).replace(/\n/g, ' ')}[${a} → ${b}]`)
  if (!APPLY) continue
  await api('PATCH', `/admin/api/cms/data/rows/${row.id}`, { cells: { ...row.cells, body: next } })
  const after = (await api('GET', `/admin/api/cms/data/rows/${row.id}`)).row
  if (after.cells.body !== next || after.cells.slug !== row.cells.slug || after.cells.title !== row.cells.title) { failures++; console.log(`  !! ${row.cells.slug}: did not read back — restore from ${BK}`); break }
  await api('POST', `/admin/api/cms/data/rows/${row.id}/publish`, {})
}
writeFileSync(join(BK, 'post-rows.json'), JSON.stringify(saved))
console.log(`\n${changed} posts, ${swaps} swaps ${APPLY ? 'written + row-published' : 'planned'}; ${failures ? failures + ' FAILURE(S)' : 'clean'}; backup ${BK}`)
process.exit(failures ? 1 : 0)
