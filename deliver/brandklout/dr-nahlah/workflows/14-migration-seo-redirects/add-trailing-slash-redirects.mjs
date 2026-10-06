#!/usr/bin/env node
/**
 * add-trailing-slash-redirects.mjs — 301 every sitemap page's trailing-slash twin to the page.
 *
 *   node add-trailing-slash-redirects.mjs            # plan
 *   node add-trailing-slash-redirects.mjs --apply    # append the rows to drnahlah_301
 *
 * Instatic answers `/dental-implants/` with 200 and the same page (canonical points at the bare
 * URL), so every page had two crawlable addresses. A row per page (SEO audit 2026-10-05e, #15):
 * source `www.drnahlah.com/<path>/`, www only (include_subdomains false: staging keeps its own
 * behaviour), exact match, query string preserved (ads UTMs). Appends with POST items, like
 * add-mclean-redirects.mjs; skips a source the list already holds. Every target must answer 200
 * before anything is written.
 */
import { cf, accountId } from './cf-api.mjs'

const APPLY = process.argv.includes('--apply')
const LIST = 'drnahlah_301'
const S = 'https://www.drnahlah.com'
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLAREAPI

const sm = await (await fetch(`${S}/sitemap.xml`)).text()
const paths = [...sm.matchAll(/<loc>([^<]+)/g)].map((m) => new URL(m[1]).pathname).filter((p) => p !== '/')
for (const p of paths) {
  const r = await fetch(S + p, { redirect: 'manual' })
  if (r.status !== 200) { console.error(`${p} answers ${r.status} — not redirecting to it`); process.exit(1) }
}
const acct = await accountId()
const list = (await cf('GET', `/accounts/${acct}/rules/lists`)).find((l) => l.name === LIST)
let items = [], cursor = ''
do {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/rules/lists/${list.id}/items?per_page=500${cursor ? '&cursor=' + cursor : ''}`, { headers: { Authorization: `Bearer ${TOKEN}` } }).then((r) => r.json())
  items.push(...res.result); cursor = res.result_info?.cursors?.after ?? ''
} while (cursor)
const have = new Set(items.map((i) => i.redirect?.source_url))
const add = paths
  .filter((p) => !have.has(`www.drnahlah.com${p}/`) && !have.has(`drnahlah.com${p}/`))
  .map((p) => ({ redirect: { source_url: `www.drnahlah.com${p}/`, target_url: S + p, status_code: 301, include_subdomains: false, subpath_matching: false, preserve_query_string: true, preserve_path_suffix: false } }))
console.log(`list ${LIST}: ${items.length} rows, ${paths.length} pages, +${add.length} (${paths.length - add.length} already covered)`)
for (const a of add.slice(0, 5)) console.log(`  ${a.redirect.source_url} -> ${a.redirect.target_url}`)
if (!APPLY) { console.log('plan only — pass --apply'); process.exit(0) }

const op = await cf('POST', `/accounts/${acct}/rules/lists/${list.id}/items`, add)
for (let i = 0; i < 60; i++) {
  const s = await cf('GET', `/accounts/${acct}/rules/lists/bulk_operations/${op.operation_id}`)
  if (s.status === 'completed') break
  if (s.status === 'failed') { console.error(`bulk operation failed: ${s.error}`); process.exit(1) }
  await new Promise((r) => setTimeout(r, 1000))
}
console.log(`list now ${(await cf('GET', `/accounts/${acct}/rules/lists/${list.id}`)).num_items} rows`)
