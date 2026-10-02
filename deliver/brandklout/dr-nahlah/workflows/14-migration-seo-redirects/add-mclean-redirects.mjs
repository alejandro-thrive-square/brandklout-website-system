#!/usr/bin/env node
/**
 * add-mclean-redirects.mjs — the 301s and sitemap entries for the "maclean" ->
 * "mclean" page renames (QA 2026-09-28, C12; 22-instatic-api-sync/push-mclean-rename.mjs).
 *
 *   node add-mclean-redirects.mjs            # plan
 *   node add-mclean-redirects.mjs --apply    # append to drnahlah_301, patch + upload the sitemap worker
 *
 * APPENDS to the existing Bulk Redirect list (POST items) rather than re-uploading
 * the 190-row CSV with deploy-redirects.mjs, which would put every redirect back in
 * play. Rows follow the list's own shape (apex source, include_subdomains, so www.
 * and staging. are covered), plus preserve_query_string — a contact page is where
 * campaign UTMs land. Refuses if a row for the source already exists.
 * The new pages must answer 200 before anything is written.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cf, accountId } from './cf-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const RENAME = { 'contact-maclean': 'contact-mclean', 'privacy-policy-maclean': 'privacy-policy-mclean', 'terms-of-service-maclean': 'terms-of-service-mclean' }
const LIST = 'drnahlah_301'
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLAREAPI

for (const n of Object.values(RENAME)) {
  const r = await fetch(`https://www.drnahlah.com/${n}`, { redirect: 'manual' })
  if (r.status !== 200) { console.error(`/${n} answers ${r.status} — publish the rename first`); process.exit(1) }
}
const acct = await accountId()
const list = (await cf('GET', `/accounts/${acct}/rules/lists`)).find((l) => l.name === LIST)
let items = [], cursor = ''
do {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/rules/lists/${list.id}/items?per_page=500${cursor ? '&cursor=' + cursor : ''}`, { headers: { Authorization: `Bearer ${TOKEN}` } }).then((r) => r.json())
  items.push(...res.result); cursor = res.result_info?.cursors?.after ?? ''
} while (cursor)
const add = []
for (const [o, n] of Object.entries(RENAME)) for (const src of [`drnahlah.com/${o}`, `drnahlah.com/${o}/`]) {
  if (items.some((i) => i.redirect?.source_url === src)) { console.error(`list already has ${src}`); process.exit(1) }
  add.push({ redirect: { source_url: src, target_url: `https://www.drnahlah.com/${n}`, status_code: 301, include_subdomains: true, subpath_matching: false, preserve_query_string: true, preserve_path_suffix: false } })
}
console.log(`list ${LIST}: ${items.length} rows, +${add.length}`)
for (const a of add) console.log(`  ${a.redirect.source_url} -> ${a.redirect.target_url}`)

const WORKER = join(HERE, '.tmp', 'out', 'sitemap-worker.js')
let w = readFileSync(WORKER, 'utf8')
const before = w
for (const [o, n] of Object.entries(RENAME)) w = w.split(`https://www.drnahlah.com/${o}</loc>`).join(`https://www.drnahlah.com/${n}</loc>`)
console.log(`sitemap: ${before === w ? 'nothing to move' : 'three URLs moved'}`)
if (!APPLY) { console.log('plan only — pass --apply'); process.exit(0) }

const op = await cf('POST', `/accounts/${acct}/rules/lists/${list.id}/items`, add)
for (let i = 0; i < 30; i++) {
  const s = await cf('GET', `/accounts/${acct}/rules/lists/bulk_operations/${op.operation_id}`)
  if (s.status === 'completed') break
  if (s.status === 'failed') { console.error(`bulk operation failed: ${s.error}`); process.exit(1) }
  await new Promise((r) => setTimeout(r, 1000))
}
console.log(`list now ${(await cf('GET', `/accounts/${acct}/rules/lists/${list.id}`)).num_items} rows`)
if (w !== before) { writeFileSync(WORKER, w); console.log('sitemap worker patched — now: node deploy-worker.mjs --apply --script-only') }
