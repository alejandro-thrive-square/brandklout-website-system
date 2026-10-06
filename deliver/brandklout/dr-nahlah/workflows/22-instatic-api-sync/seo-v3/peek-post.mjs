// read-only: the shape of one post row and its open-graph override (SEO v3 pass 2 prep)
import { api } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'
const tables = await api('GET', '/admin/api/cms/data/tables')
console.log('tables', JSON.stringify((tables.tables || tables).map?.((t) => [t.id, t.slug, t.name]) ?? Object.keys(tables)).slice(0, 600))
const t = (tables.tables || tables).find((x) => x.slug === 'posts')
const rows = await api('GET', `/admin/api/cms/data/tables/${t.id}/rows?limit=100`)
const list = rows.rows || rows
console.log('rows', list.length)
const r = list.find((x) => (x.slug || x.cells?.slug) === 'all-on-four-your-questions') || list[0]
const full = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row
for (const [k, v] of Object.entries(full.cells)) console.log(' cell', k, typeof v, JSON.stringify(v)?.slice(0, 300))
const og = (await api('GET', '/admin/api/cms/plugins/brandklout.open-graph/runtime/pages')).pages.find((p) => p.key === 'posts:all-on-four-your-questions')
console.log('og', JSON.stringify(og).slice(0, 600))
