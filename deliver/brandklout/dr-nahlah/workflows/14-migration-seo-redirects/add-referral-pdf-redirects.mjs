#!/usr/bin/env node
/**
 * add-referral-pdf-redirects.mjs — /patient-referral-form.pdf and
 * /about-dr-nahlah.pdf on drnahlah.com (Asana 1219086723228800, 2026-10-02).
 *
 *   node add-referral-pdf-redirects.mjs <referral-form-pdf-url> <about-pdf-url>            # plan
 *   node add-referral-pdf-redirects.mjs <referral-form-pdf-url> <about-pdf-url> --apply    # append to drnahlah_301
 *
 * Instatic's media library takes only images, video and fonts, so the two PDFs
 * are served by the drnahlah-files Worker on workers.dev (deploy-referral-pdfs.mjs).
 * These rows keep the site's links on this domain: a 302, not a 301, so the file host can move without browsers
 * caching the old target. Same row shape as add-mclean-redirects.mjs (apex
 * source, include_subdomains covers www. and staging.). Both targets must
 * answer 200 with a PDF before anything is written; refuses if a row exists.
 */
import { cf, accountId } from './cf-api.mjs'

const APPLY = process.argv.includes('--apply')
const [formUrl, aboutUrl] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
if (!formUrl || !aboutUrl) { console.error('usage: <referral-form-pdf-url> <about-pdf-url> [--apply]'); process.exit(1) }
const ROWS = { 'drnahlah.com/patient-referral-form.pdf': formUrl, 'drnahlah.com/about-dr-nahlah.pdf': aboutUrl }
const LIST = 'drnahlah_301'
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLAREAPI

for (const t of Object.values(ROWS)) {
  const r = await fetch(t)
  const type = r.headers.get('content-type') ?? ''
  const head = Buffer.from(await r.arrayBuffer()).subarray(0, 5).toString()
  console.log(`  ${r.status} ${type} ${head === '%PDF-' ? 'PDF' : 'NOT A PDF'}  ${t}`)
  if (r.status !== 200 || head !== '%PDF-') process.exit(1)
}
const acct = await accountId()
const list = (await cf('GET', `/accounts/${acct}/rules/lists`)).find((l) => l.name === LIST)
let items = [], cursor = ''
do {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/rules/lists/${list.id}/items?per_page=500${cursor ? '&cursor=' + cursor : ''}`, { headers: { Authorization: `Bearer ${TOKEN}` } }).then((r) => r.json())
  items.push(...res.result); cursor = res.result_info?.cursors?.after ?? ''
} while (cursor)
const add = []
for (const [src, target] of Object.entries(ROWS)) {
  if (items.some((i) => i.redirect?.source_url === src)) { console.error(`list already has ${src}`); process.exit(1) }
  add.push({ redirect: { source_url: src, target_url: target, status_code: 302, include_subdomains: true, subpath_matching: false, preserve_query_string: false, preserve_path_suffix: false } })
}
console.log(`list ${LIST}: ${items.length} rows, +${add.length}`)
for (const a of add) console.log(`  ${a.redirect.source_url} -> ${a.redirect.target_url}`)
if (!APPLY) { console.log('plan only — pass --apply'); process.exit(0) }

const op = await cf('POST', `/accounts/${acct}/rules/lists/${list.id}/items`, add)
for (let i = 0; i < 30; i++) {
  const s = await cf('GET', `/accounts/${acct}/rules/lists/bulk_operations/${op.operation_id}`)
  if (s.status === 'completed') break
  if (s.status === 'failed') { console.error(`bulk operation failed: ${s.error}`); process.exit(1) }
  await new Promise((r) => setTimeout(r, 1000))
}
console.log(`list now ${(await cf('GET', `/accounts/${acct}/rules/lists/${list.id}`)).num_items} rows`)
for (const src of Object.keys(ROWS)) {
  const r = await fetch(`https://www.${src}`, { redirect: 'manual' })
  console.log(`  www.${src} -> ${r.status} ${r.headers.get('location')}`)
}
