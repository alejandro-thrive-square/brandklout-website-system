#!/usr/bin/env node
/**
 * redirect-legacy-sitemaps.mjs — 301 the old WordPress sitemap URLs to the
 * Worker-served /sitemap.xml (2026-10-05).
 *
 *   node redirect-legacy-sitemaps.mjs            # plan
 *   node redirect-legacy-sitemaps.mjs --apply    # append to drnahlah_301
 *
 * Search Console still lists the WordPress sitemaps (`sitemap_index.xml`,
 * `category-sitemap.xml`, …) and reports "Couldn't fetch" because they 404.
 * Redirecting them lets Google follow to the live sitemap without anyone
 * deleting the entries there.
 *
 * Rows in the Bulk Redirect list, same shape as add-mclean-redirects.mjs (apex
 * source, include_subdomains covers www.). Not a Single Redirect rule: no token
 * we hold may write the zone's rulesets (403 on CLOUDFLAREAPI and the read-only
 * CLOUDFLAREDIAGNOSIS), while CLOUDFLAREAPI can write account lists. Bulk lists
 * match exact paths, so the WordPress/Rank Math/Yoast names are enumerated.
 * Rows already present are skipped.
 */
import { cf, accountId } from './cf-api.mjs'

const APPLY = process.argv.includes('--apply')
const LIST = 'drnahlah_301'
const TARGET = 'https://www.drnahlah.com/sitemap.xml'
const NAMES = [
  'sitemap_index.xml', 'wp-sitemap.xml', 'page-sitemap.xml', 'post-sitemap.xml', 'category-sitemap.xml',
  'post_tag-sitemap.xml', 'author-sitemap.xml', 'local-sitemap.xml', 'attachment-sitemap.xml',
  'page-sitemap1.xml', 'post-sitemap1.xml',
]
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLAREAPI

const acct = await accountId()
const list = (await cf('GET', `/accounts/${acct}/rules/lists`)).find((l) => l.name === LIST)
let items = [], cursor = ''
do {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/rules/lists/${list.id}/items?per_page=500${cursor ? '&cursor=' + cursor : ''}`, { headers: { Authorization: `Bearer ${TOKEN}` } }).then((r) => r.json())
  items.push(...res.result); cursor = res.result_info?.cursors?.after ?? ''
} while (cursor)
const add = []
for (const n of NAMES) {
  const src = `drnahlah.com/${n}`
  if (items.some((i) => i.redirect?.source_url === src)) { console.log(`  have ${src}`); continue }
  add.push({ redirect: { source_url: src, target_url: TARGET, status_code: 301, include_subdomains: true, subpath_matching: false, preserve_query_string: false, preserve_path_suffix: false } })
}
console.log(`list ${LIST}: ${items.length} rows, +${add.length}`)
for (const a of add) console.log(`  ${a.redirect.source_url} -> ${a.redirect.target_url}`)
if (!APPLY || !add.length) { console.log(add.length ? 'plan only — pass --apply' : 'nothing to add'); process.exit(0) }

const op = await cf('POST', `/accounts/${acct}/rules/lists/${list.id}/items`, add)
for (let i = 0; i < 30; i++) {
  const s = await cf('GET', `/accounts/${acct}/rules/lists/bulk_operations/${op.operation_id}`)
  if (s.status === 'completed') break
  if (s.status === 'failed') { console.error(`bulk operation failed: ${s.error}`); process.exit(1) }
  await new Promise((r) => setTimeout(r, 1000))
}
console.log(`list now ${(await cf('GET', `/accounts/${acct}/rules/lists/${list.id}`)).num_items} rows`)
for (const n of NAMES) {
  const r = await fetch(`https://www.drnahlah.com/${n}`, { redirect: 'manual' })
  console.log(`  www.drnahlah.com/${n} -> ${r.status} ${r.headers.get('location')}`)
}
