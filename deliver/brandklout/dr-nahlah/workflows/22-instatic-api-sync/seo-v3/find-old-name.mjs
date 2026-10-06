// read-only: every "Dental Group of Tysons" (any case, "Tyson's") in the post rows' cells, with context
import { api, BASE } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'
const RE = /Dental Group of Tyson'?s/gi
const { rows } = await api('GET', '/admin/api/cms/data/tables/posts/rows')
let n = 0
for (const r of rows) {
  const row = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row
  for (const [k, v] of Object.entries(row.cells)) {
    if (typeof v !== 'string') continue
    for (const m of v.matchAll(RE)) { n++; console.log(`${row.cells.slug.slice(0, 50)} [${k}] …${v.slice(Math.max(0, m.index - 70), m.index + m[0].length + 50).replace(/\n/g, ' ')}…`) }
  }
}
console.log(BASE, n, 'occurrences')
