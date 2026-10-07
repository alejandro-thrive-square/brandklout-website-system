#!/usr/bin/env node
/**
 * add-gsc-404-redirects.mjs — 301 the URLs in Search Console's "Not found (404)" report
 * (2026-10-07b; Asana "Fix 404" 1218884763280824, its drilldown lists exactly these).
 *
 *   node add-gsc-404-redirects.mjs            # plan
 *   node add-gsc-404-redirects.mjs --apply    # append to drnahlah_301
 *
 * Two kinds of row:
 *   - `/home` and `/home/` -> `/`. Never a page: no page links it (81 sitemap pages scanned), not in
 *     the sitemap or the migration map, and the Wayback Machine has no capture of it on the
 *     WordPress site, so Google found it off-site.
 *   - Every import-map PREFIX entry on the homepage (`"gsap/": "/_instatic/runtime/cache/<hash>/gsap/"`)
 *     -> its package's entry module (`"gsap": ".../gsap/index.js"`). Googlebot crawls URL-shaped
 *     strings in inline scripts, and the bare folder 404s. Browsers never request the folder (an
 *     import map only resolves paths under it), so the row changes nothing for visitors; it turns a
 *     404 into "Page with redirect", so the report's Validate fix can pass. The hash changes when
 *     Instatic rebuilds the runtime: re-run this then.
 * Rows follow add-trailing-slash-redirects.mjs: www only (the apex reaches www through the
 * canonical-host Single Redirect first, gotcha 2; staging keeps its own behaviour), exact match,
 * query string preserved. A source answering 200 or a target not answering 200 stops the run;
 * a source the list already holds is skipped.
 */
import { cf, accountId } from './cf-api.mjs'

const APPLY = process.argv.includes('--apply')
const LIST = 'drnahlah_301'
const S = 'https://www.drnahlah.com'
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLAREAPI

const rows = [['/home', '/'], ['/home/', '/']]
const html = await (await fetch(`${S}/`)).text()
const map = html.match(/<script type="importmap">([\s\S]*?)<\/script>/)
const imports = map ? JSON.parse(map[1]).imports ?? {} : {}
for (const [k, v] of Object.entries(imports)) {
  if (!k.endsWith('/') || !imports[k.slice(0, -1)]) continue
  rows.push([v, imports[k.slice(0, -1)]])
}
for (const [src, dst] of rows) {
  const s = await fetch(S + src, { redirect: 'manual' })
  const d = await fetch(S + dst, { redirect: 'manual' })
  if (s.status === 200) { console.error(`${src} answers 200 — it is a page now, not redirecting it`); process.exit(1) }
  if (d.status !== 200) { console.error(`${dst} answers ${d.status} — not redirecting to it`); process.exit(1) }
  console.log(`${src} answers ${s.status}${s.headers.get('location') ? ' -> ' + s.headers.get('location') : ''}`)
}
const acct = await accountId()
const list = (await cf('GET', `/accounts/${acct}/rules/lists`)).find((l) => l.name === LIST)
let items = [], cursor = ''
do {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/rules/lists/${list.id}/items?per_page=500${cursor ? '&cursor=' + cursor : ''}`, { headers: { Authorization: `Bearer ${TOKEN}` } }).then((r) => r.json())
  items.push(...res.result); cursor = res.result_info?.cursors?.after ?? ''
} while (cursor)
const have = new Set(items.map((i) => i.redirect?.source_url))
const add = rows
  .filter(([src]) => !have.has(`www.drnahlah.com${src}`) && !have.has(`drnahlah.com${src}`))
  .map(([src, dst]) => ({ redirect: { source_url: `www.drnahlah.com${src}`, target_url: S + dst, status_code: 301, include_subdomains: false, subpath_matching: false, preserve_query_string: true, preserve_path_suffix: false } }))
console.log(`list ${LIST}: ${items.length} rows, +${add.length} (${rows.length - add.length} already covered)`)
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
