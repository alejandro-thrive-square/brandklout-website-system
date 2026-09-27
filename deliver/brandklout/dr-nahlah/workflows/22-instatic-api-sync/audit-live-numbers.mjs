#!/usr/bin/env node
/**
 * audit-live-numbers.mjs — sweep EVERY published page for a retired telephone
 * number, in the body and in the head alike.
 *
 *   node audit-live-numbers.mjs
 *
 * Written because the 2026-09-22 retarget was "done" three times before it
 * was. Rewriting the page nodes fixed every number a visitor can see, and left
 * the numbers in `<meta name="description">`, `og:description`,
 * `twitter:description` and the JSON-LD untouched, because none of those come
 * from the page tree: the schema lives in the `brandklout.aeo-schema` plugin's
 * settings and the descriptions are materialised per page in the
 * `brandklout.open-graph` runtime store. A check of the visible numbers alone
 * would have passed while Google was still being told the old ones.
 *
 * So this reads the whole served document per page, and reports WHERE a hit is
 * — head or body — because the two have different fixes.
 */
const HOST = process.argv[2] || 'https://www.drnahlah.com'
const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0.0.0 Safari/537.36' }

/* Every written form of the two numbers that were retired on 2026-09-22, plus
   the two that were only ever in the structured data. */
const RETIRED = {
  '(571) 702-9900': 'Tysons, old new-patient line',
  '571-702-9900': 'Tysons, old new-patient line',
  '5717029900': 'Tysons, old new-patient line',
  '(571) 253-7790': 'Alexandria, old new-patient line',
  '571-253-7790': 'Alexandria, old new-patient line',
  '5712537790': 'Alexandria, old new-patient line',
  '(571) 619-9442': 'McLean, schema-only stray',
  '571-619-9442': 'McLean, schema-only stray',
  '(571) 410-3430': 'Alexandria, schema-only stray',
  '571-410-3430': 'Alexandria, schema-only stray',
}
const EXPECTED = ['(703) 448-3312', '(571) 617-7245', '(703) 940-5410']

const slugs = await (async () => {
  const r = await fetch(`${HOST}/sitemap.xml`, { headers: UA })
  if (!r.ok) throw new Error(`sitemap ${r.status}`)
  const xml = await r.text()
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
})()
console.log(`${slugs.length} URLs from the sitemap\n`)

let bad = 0
let missing = 0
for (const url of slugs) {
  const r = await fetch(url, { headers: UA })
  if (!r.ok) { console.log(`${r.status}  ${url}`); bad++; continue }
  const html = await r.text()
  const cut = html.indexOf('</head>')
  const head = cut > -1 ? html.slice(0, cut) : html
  const body = cut > -1 ? html.slice(cut) : ''

  const hits = []
  for (const [n, why] of Object.entries(RETIRED)) {
    const inHead = head.includes(n)
    const inBody = body.includes(n)
    if (inHead || inBody) hits.push(`${n} (${why}) in ${[inHead && 'HEAD', inBody && 'body'].filter(Boolean).join(' + ')}`)
  }
  const absent = EXPECTED.filter((n) => !html.includes(n))
  if (hits.length) {
    bad++
    console.log(`RETIRED  ${url}`)
    for (const h of hits) console.log(`         ${h}`)
  }
  if (absent.length === EXPECTED.length) {
    missing++
    console.log(`NO NUMBERS AT ALL  ${url}`)
  }
}

console.log(`\n${slugs.length - bad}/${slugs.length} pages clean`)
if (missing) console.log(`${missing} pages carry none of the current numbers (check these are meant to)`)
process.exit(bad ? 1 : 0)
