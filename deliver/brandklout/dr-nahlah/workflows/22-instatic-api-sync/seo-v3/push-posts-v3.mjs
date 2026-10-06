#!/usr/bin/env node
/**
 * SEO v3, the 43 Journal posts:
 *   1. one H1 per article: the collection body opened with its own <h1> (the WordPress title)
 *      under the template's hero H1, so every post published two. The body's is removed; the
 *      hero H1 carries the same title.
 *   2. a meta description written from the article (seo-v3/post-descriptions.json, checked
 *      against the post text) replaces the WordPress-era ones ("Click here", "Come to our office
 *      today!", "Dental Group of Tysons"): row seoDescription cell + open-graph override.
 * Post rows are NOT promoted by a site publish (publish-post-rows.mjs): each changed row is
 * published with POST /data/rows/:id/publish. Run publish-post-rows.mjs first: it must report 0
 * stale rows, or this would ship somebody else's draft.
 *
 *   node seo-v3/push-posts-v3.mjs            # dry run
 *   node seo-v3/push-posts-v3.mjs --apply    # write + publish the changed rows
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { api, BASE } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const DESC = JSON.parse(readFileSync(join(HERE, 'post-descriptions.json'), 'utf8'))
const OG = '/admin/api/cms/plugins/brandklout.open-graph'
console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} on ${BASE}`)

const { rows } = await api('GET', '/admin/api/cms/data/tables/posts/rows')
const ogPages = (await api('GET', `${OG}/runtime/pages`)).pages
const BK = join(HERE, '..', '.tmp', 'backups', `posts-v3-${BASE.replace(/^https?:\/\//, '')}-${new Date().toISOString().replace(/[:.]/g, '-')}`)
mkdirSync(BK, { recursive: true })
const full = []
for (const r of rows) full.push((await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row)
writeFileSync(join(BK, 'post-rows.json'), JSON.stringify(full))
writeFileSync(join(BK, 'og-pages.json'), JSON.stringify(ogPages.filter((p) => p.tableSlug === 'posts')))
console.log('backup', BK)

let failures = 0, changed = 0
const fail = (m) => { failures++; console.log('  !! ' + m) }
for (const row of full) {
  const slug = row.cells.slug
  const desc = DESC[slug]
  if (!desc) { fail(`${slug}: no description written`); continue }
  const body = row.cells.body
  const h1s = (body.match(/<h1\b/g) || []).length
  const nextBody = body.replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>\s*\n?/, '')
  if (h1s > 1) fail(`${slug}: ${h1s} h1 in the body`)
  if (h1s === 1 && nextBody === body) fail(`${slug}: the body h1 is not its first element`)
  const want = { ...row.cells, body: nextBody, seoDescription: desc }
  const ogp = ogPages.find((p) => p.key === `posts:${slug}`)
  const ogCur = ogp?.override ?? { key: `posts:${slug}`, type: 'article', enabled: true }
  const rowDiff = want.body !== body || want.seoDescription !== row.cells.seoDescription
  const ogDiff = ogCur.description !== desc
  if (!rowDiff && !ogDiff) continue
  changed++
  console.log(`  ${slug.slice(0, 70).padEnd(72)} ${h1s ? 'h1 removed ' : ''}${rowDiff ? 'cells ' : ''}${ogDiff ? 'og' : ''}`)
  if (!APPLY) continue
  if (rowDiff) {
    await api('PATCH', `/admin/api/cms/data/rows/${row.id}`, { cells: want })
    const after = (await api('GET', `/admin/api/cms/data/rows/${row.id}`)).row
    if (after.cells.slug !== slug || after.cells.title !== row.cells.title || after.cells.body !== nextBody || after.cells.seoDescription !== desc) { fail(`${slug}: cells did not read back — restore from ${BK}`); break }
  }
  if (ogDiff) {
    const res = await api('POST', `${OG}/runtime/override`, { ...ogCur, key: `posts:${slug}`, description: desc })
    if (!res.saved) fail(`${slug}: og override not saved`)
  }
  if (rowDiff) await api('POST', `/admin/api/cms/data/rows/${row.id}/publish`, {})
}
console.log(`\n${changed} posts ${APPLY ? 'written' : 'to write'}; ${failures ? failures + ' FAILURE(S)' : 'clean'}${APPLY ? ' — rows published; the og overrides ship with the next site publish' : ' (dry run)'}`)
process.exit(failures ? 1 : 0)
