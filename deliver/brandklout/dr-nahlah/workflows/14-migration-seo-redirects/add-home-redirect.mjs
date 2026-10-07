#!/usr/bin/env node
/**
 * add-home-redirect.mjs — 301 `/home` and `/home/` to the homepage (2026-10-07).
 *
 *   node add-home-redirect.mjs            # plan
 *   node add-home-redirect.mjs --apply    # append to drnahlah_301
 *
 * Search Console's "Not found (404)" report lists `drnahlah.com/home`. No page on the site
 * links to it (all 81 sitemap pages scanned), it is in neither the sitemap nor the migration
 * map, and the Wayback Machine has no capture of it on the WordPress site, so Google found it
 * off-site. Rows in the Bulk Redirect list, same shape as add-trailing-slash-redirects.mjs:
 * source on www only (the apex reaches www through the canonical-host Single Redirect first,
 * gotcha 2; staging keeps its own behaviour), exact match, query string preserved (ads UTMs).
 * Refuses if `/home` has become a real page or the homepage is not answering 200; skips a
 * source the list already holds.
 */
import { cf, accountId } from './cf-api.mjs'

const APPLY = process.argv.includes('--apply')
const LIST = 'drnahlah_301'
const S = 'https://www.drnahlah.com'
const TARGET = `${S}/`
const SOURCES = ['/home', '/home/']
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLAREAPI

const home = await fetch(TARGET, { redirect: 'manual' })
if (home.status !== 200) { console.error(`/ answers ${home.status} — not redirecting to it`); process.exit(1) }
for (const p of SOURCES) {
  const r = await fetch(S + p, { redirect: 'manual' })
  if (r.status === 200) { console.error(`${p} answers 200 — it is a page now, not redirecting it`); process.exit(1) }
  console.log(`${p} answers ${r.status}${r.headers.get('location') ? ' -> ' + r.headers.get('location') : ''}`)
}
const acct = await accountId()
const list = (await cf('GET', `/accounts/${acct}/rules/lists`)).find((l) => l.name === LIST)
let items = [], cursor = ''
do {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/rules/lists/${list.id}/items?per_page=500${cursor ? '&cursor=' + cursor : ''}`, { headers: { Authorization: `Bearer ${TOKEN}` } }).then((r) => r.json())
  items.push(...res.result); cursor = res.result_info?.cursors?.after ?? ''
} while (cursor)
const have = new Set(items.map((i) => i.redirect?.source_url))
const add = SOURCES
  .filter((p) => !have.has(`www.drnahlah.com${p}`) && !have.has(`drnahlah.com${p}`))
  .map((p) => ({ redirect: { source_url: `www.drnahlah.com${p}`, target_url: TARGET, status_code: 301, include_subdomains: false, subpath_matching: false, preserve_query_string: true, preserve_path_suffix: false } }))
console.log(`list ${LIST}: ${items.length} rows, +${add.length} (${SOURCES.length - add.length} already covered)`)
for (const a of add) console.log(`  ${a.redirect.source_url} -> ${a.redirect.target_url}`)
if (!add.length) process.exit(0)
if (!APPLY) { console.log('plan only — pass --apply'); process.exit(0) }

const op = await cf('POST', `/accounts/${acct}/rules/lists/${list.id}/items`, add)
for (let i = 0; i < 30; i++) {
  const s = await cf('GET', `/accounts/${acct}/rules/lists/bulk_operations/${op.operation_id}`)
  if (s.status === 'completed') break
  if (s.status === 'failed') { console.error(`bulk operation failed: ${s.error}`); process.exit(1) }
  await new Promise((r) => setTimeout(r, 1000))
}
console.log(`list now ${(await cf('GET', `/accounts/${acct}/rules/lists/${list.id}`)).num_items} rows`)
