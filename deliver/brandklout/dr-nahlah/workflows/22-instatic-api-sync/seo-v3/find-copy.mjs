// read-only: where a string lives on INSTATIC_BASE_URL — page and post rows (every cell), components,
// the shell (files, settings), open-graph overrides, aeo blocks + settings.  node seo-v3/find-copy.mjs "<regex>"
import { api, getSite, getPages, BASE } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'
const RE = new RegExp(process.argv[2], 'g')
const hits = []
const scan = (where, v) => { const s = typeof v === 'string' ? v : JSON.stringify(v); for (const m of s.matchAll(RE)) hits.push(`${where}: …${s.slice(Math.max(0, m.index - 60), m.index + m[0].length + 40).replace(/\s+/g, ' ')}…`) }
for (const r of (await getPages()).rows) scan(`page ${r.cells?.slug ?? r.slug}`, (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row.cells)
for (const r of (await api('GET', '/admin/api/cms/data/tables/posts/rows')).rows) scan(`post ${r.cells?.slug}`, r.cells)
const { site } = await getSite()
for (const f of site.files ?? []) scan(`file ${f.path}`, f.content)
scan('shell (non-file)', { ...site, files: undefined })
for (const t of ['components', 'layouts']) { try { for (const r of (await api('GET', `/admin/api/cms/data/tables/${t}/rows`)).rows) scan(`${t} ${r.cells?.slug ?? r.id}`, r.cells) } catch {} }
scan('og', (await api('GET', '/admin/api/cms/plugins/brandklout.open-graph/runtime/pages')).pages.map((p) => p.override))
scan('aeo', (await api('GET', '/admin/api/cms/plugins/brandklout.aeo-schema/runtime/entries')).entries.map((e) => e.block))
scan('aeo settings', (await api('GET', '/admin/api/cms/plugins/brandklout.aeo-schema/settings')).settings)
console.log(BASE, hits.length ? '\n' + hits.join('\n') : 'no hits')
