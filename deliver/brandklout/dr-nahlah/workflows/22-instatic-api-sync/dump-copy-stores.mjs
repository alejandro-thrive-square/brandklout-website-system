#!/usr/bin/env node
/**
 * dump-copy-stores.mjs — every string a visitor or a crawler can read, from all
 * seven copy stores, one per line: store <TAB> where <TAB> key <TAB> text.
 *
 *   node dump-copy-stores.mjs > .tmp/copy-dump.tsv
 *
 * Read-only. Used to copy exact FROM strings into a copy map (copy-fixes-*.mjs)
 * instead of trusting a report's quotation of them.
 */
import { api, getSite, getPages } from './sedation-api.mjs'

const out = []
const clean = (s) => String(s).replace(/\t/g, ' ').replace(/\r?\n/g, '\\n')
const walk = (store, where, key, v) => {
  if (typeof v === 'string') { if (v.trim()) out.push([store, where, key, clean(v)].join('\t')) }
  else if (Array.isArray(v)) v.forEach((x, i) => walk(store, where, `${key}[${i}]`, x))
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(store, where, key ? `${key}.${k}` : k, x)
}

const { site } = await getSite()
for (const r of (await getPages()).rows) {
  const slug = r.cells?.slug ?? r.slug
  walk('title', slug, 'title', r.cells?.title)
  for (const k of ['seoTitle', 'seoDescription']) walk('cell', slug, k, r.cells?.[k])
  for (const n of Object.values(r.cells?.body?.nodes ?? {})) walk('node', slug, `${n.id}:${n.moduleId}`, n.props)
}
for (const f of site.files ?? []) if (/^src\/scripts\/(jsonld\/.*|seo-head)\.js$/.test(f.path)) walk('asset', f.path, '', f.content)
const comps = (await api('GET', '/admin/api/cms/components')).rows ?? []
for (const c of comps) {
  const row = (await api('GET', `/admin/api/cms/data/rows/${c.id}`)).row
  for (const n of Object.values(row.cells?.body?.nodes ?? {})) walk('component', row.cells.name, `${n.id}:${n.moduleId}`, n.props)
}
const og = await api('GET', '/admin/api/cms/plugins/brandklout.open-graph/runtime/pages')
for (const p of og.pages ?? []) walk('og', p.slug, '', p.override)
const aeo = await api('GET', '/admin/api/cms/plugins/brandklout.aeo-schema/runtime/entries')
for (const b of [...(aeo.entries ?? []).map((e) => e.block), aeo.global].filter(Boolean)) walk('schema', b.key, '', b.json)
for (const a of (await api('GET', '/admin/api/cms/media')).assets ?? []) walk('alt', a.filename ?? a.id, a.id, a.altText)
for (const p of (await api('GET', '/admin/api/cms/data/tables/posts/rows')).rows ?? []) walk('post', p.cells.slug, '', p.cells)
process.stdout.write(out.join('\n') + '\n')
