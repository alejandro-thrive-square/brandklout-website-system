#!/usr/bin/env node
/**
 * facts-sweep.mjs — sweep EVERY published URL for the practice facts (phones, hours, address, emails)
 * and for retired values, reporting whether each hit is in the HEAD or the BODY.
 *
 * Origin: bk-dr-nahlah, workflows/22-instatic-api-sync/audit-live-numbers.mjs (2026-09-22 retarget,
 * "done" three times before it was). Generalized 2026-09-23: facts come from a JSON file, not constants.
 *
 * WHY HEAD vs BODY. On Instatic a phone number lives in four stores: page nodes, shared components,
 * the brandklout.aeo-schema settings (the JSON-LD Google reads) and the brandklout.open-graph runtime
 * store (per-page meta/og/twitter descriptions). The last two are not fed by the page tree, so a body
 * check passes while the head still publishes the old value. The two halves have different fixes.
 * It also parses every JSON-LD block and lists the telephone / openingHours values it carries, so
 * numbers that are on no page at all (schema-only strays) show up too.
 *
 * Usage:
 *   node facts-sweep.mjs --host https://www.example.com --facts facts.json [--urls /a,/b]
 * facts.json:
 *   { "expect":  ["(703) 448-3312", "Mon-Fri 8am-5pm"],        every page should carry at least one
 *     "retired": { "(571) 702-9900": "old new-patient line" },  must appear nowhere
 *     "variants": true }                                          also match 571-702-9900 / 5717029900 forms
 * URLs come from <host>/sitemap.xml unless --urls is given. Read-only. Redirect output to a file on
 * Windows (Node 24 + a pipe = libuv assertion).
 */
import fs from 'node:fs'

const argv = process.argv.slice(2)
const arg = (n) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : undefined }
const HOST = (arg('host') || '').replace(/\/$/, '')
const FACTS = arg('facts')
if (!HOST || !FACTS) { console.error('usage: --host https://<site> --facts facts.json [--urls /a,/b]'); process.exit(2) }
const facts = JSON.parse(fs.readFileSync(FACTS, 'utf8'))
const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0.0.0 Safari/537.36' }

const phoneForms = (p) => {
  const d = p.replace(/\D/g, '')
  if (d.length !== 10) return [p]
  return [p, `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`, `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`, `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`, d]
}
const expand = (v) => [...new Set(facts.variants ? phoneForms(v) : [v])]
const RETIRED = Object.entries(facts.retired || {}).flatMap(([v, why]) => expand(v).map((f) => [f, why]))
const EXPECT = facts.expect || []

let urls
if (arg('urls')) urls = arg('urls').split(',').map((p) => HOST + p)
else {
  const r = await fetch(`${HOST}/sitemap.xml`, { headers: UA })
  if (!r.ok) { console.error(`sitemap ${r.status} — pass --urls (before launch there is no sitemap)`); process.exit(2) }
  urls = [...(await r.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
}
console.log(`${urls.length} URLs\n`)

let bad = 0
let missing = 0
const ldValues = new Map()
for (const url of urls) {
  const r = await fetch(url, { headers: UA })
  if (!r.ok) { console.log(`${r.status}  ${url}`); bad++; continue }
  const html = await r.text()
  const cut = html.indexOf('</head>')
  const head = cut > -1 ? html.slice(0, cut) : html
  const body = cut > -1 ? html.slice(cut) : ''

  const hits = []
  for (const [n, why] of RETIRED) {
    const inHead = head.includes(n)
    const inBody = body.includes(n)
    if (inHead || inBody) hits.push(`${n} (${why}) in ${[inHead && 'HEAD', inBody && 'body'].filter(Boolean).join(' + ')}`)
  }
  if (hits.length) {
    bad++
    console.log(`RETIRED  ${url}`)
    for (const h of hits) console.log(`         ${h}`)
  }
  if (EXPECT.length && EXPECT.every((n) => !html.includes(n))) {
    missing++
    console.log(`NONE OF THE EXPECTED FACTS  ${url}`)
  }

  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    let doc
    try { doc = JSON.parse(m[1]) } catch (e) { bad++; console.log(`JSON-LD DOES NOT PARSE  ${url}  ${e.message}`); continue }
    const walk = (n) => {
      if (!n || typeof n !== 'object') return
      for (const [k, v] of Object.entries(n)) {
        if (['telephone', 'openingHours', 'email', 'streetAddress'].includes(k)) {
          for (const x of [].concat(v)) ldValues.set(`${k}: ${typeof x === 'string' ? x : JSON.stringify(x)}`, (ldValues.get(`${k}: ${x}`) || 0) + 1)
        }
        if (typeof v === 'object') walk(v)
      }
    }
    walk(doc)
  }
}

console.log('\nJSON-LD values seen across the site (check each one is current):')
for (const [k, n] of [...ldValues].sort()) console.log(`  ${k}   (${n} page${n > 1 ? 's' : ''})`)
console.log(`\n${urls.length - bad}/${urls.length} pages clean`)
if (missing) console.log(`${missing} pages carry none of the expected facts (check these are meant to)`)
process.exit(bad ? 1 : 0)
