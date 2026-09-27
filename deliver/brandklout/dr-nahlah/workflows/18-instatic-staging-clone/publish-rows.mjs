#!/usr/bin/env node
/**
 * Publish imported COLLECTION rows one by one.
 *
 *   node publish-rows.mjs --site https://staging.drnahlah.com --table posts
 *
 * THE FAILURE THIS FIXES — the subtlest one in the whole clone
 * -----------------------------------------------------------
 * After importing Dr. Nahlah's bundle, staging had all 43 post rows, each with
 * `status: "published"` and the original `publishedAt`. The export round-trip
 * was byte-perfect: the `/posts` page body hashed IDENTICAL to production's.
 *
 * And `/posts` rendered ZERO articles, and every post URL 404'd.
 *
 * `status: published` on an imported row is metadata that came along in the
 * bundle. It is not a published REVISION. `POST /admin/api/cms/publish`
 * publishes the site's PAGES (it reported `publishedPages: 37`, exactly as on
 * production) and does not publish data rows — so the collection stayed
 * invisible and its detail routes were never generated.
 *
 * There is no bulk endpoint. Each row needs `POST /data/rows/:id/publish`.
 * After that, and one more site publish, the listing rendered all 43 and the
 * detail routes returned 200.
 *
 * Nothing warns you. The row list in the admin says "published", the diff of
 * the page source says identical, and the public site says nothing is there.
 * ALWAYS run this after importing a bundle that carries collection rows.
 */
import { session, api } from './lib.mjs'

const argv = process.argv.slice(2)
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i === -1 ? d : argv[i + 1] }
const SITE = flag('site')
const TABLE = flag('table', 'posts')
if (!SITE) { console.error('usage: node publish-rows.mjs --site <url> [--table posts]'); process.exit(2) }

const cookie = await session(SITE)          // row publish is step-up gated
const res = await api(SITE, cookie, 'GET', `/admin/api/cms/data/tables/${TABLE}/rows`)
const rows = res.rows ?? res.items ?? []
console.log(`${TABLE}: ${rows.length} row(s) on ${SITE}`)

let ok = 0
const failed = []
for (const row of rows) {
  const r = await fetch(`${SITE}/admin/api/cms/data/rows/${row.id}/publish`, {
    method: 'POST', headers: { 'content-type': 'application/json', cookie, origin: SITE }, body: '{}',
  })
  if (r.ok) ok++
  else failed.push(`${row.slug ?? row.id}: ${r.status} ${(await r.text()).slice(0, 120)}`)
}
console.log(`published ${ok} of ${rows.length}`)
for (const f of failed.slice(0, 10)) console.log('  FAIL', f)

console.log(`\nNow publish the site itself, or the listing stays empty:
  cd ../../../../process/18-instatic-embeds/lib && INSTATIC_BASE_URL=${SITE} node insta-api.mjs publish`)
if (failed.length) process.exit(1)
