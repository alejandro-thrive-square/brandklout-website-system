// read-only: the hero subtree of one page row (node ids, module, tag, classes, props) on INSTATIC_BASE_URL
import { api, getPages, getSite, BASE } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'
const slug = process.argv[2] || 'dental-implants'
const { site } = await getSite()
const cls = Object.fromEntries(Object.entries(site.styleRules ?? {}).filter(([, r]) => r.kind === 'class').map(([id, r]) => [id, r.name]))
const r0 = (await getPages()).rows.find((r) => (r.cells?.slug ?? r.slug) === slug)
const row = (await api('GET', `/admin/api/cms/data/rows/${r0.id}`)).row
const nodes = row.cells.body.nodes
const h1 = Object.values(nodes).find((n) => n.props?.tag === 'h1')
let hero = h1; for (let i = 0; i < 3; i++) hero = nodes[hero.parentId]
const show = (id, d = 0) => {
  const n = nodes[id]
  console.log(`${'  '.repeat(d)}${n.moduleId} ${n.props?.tag ?? n.props?.customTag ?? ''} .${(n.classIds ?? []).map((c) => cls[c] ?? c).join('.')} ${JSON.stringify({ ...n.props, text: undefined })?.slice(0, 160)} text=${JSON.stringify(n.props?.text)?.slice(0, 90)} inline=${JSON.stringify(n.inlineStyles ?? {})}`)
  for (const c of n.children ?? []) show(c, d + 1)
}
console.log(BASE, slug); show(hero.id)
console.log('h1 node raw:', JSON.stringify(h1).slice(0, 900))
// the eyebrow label used in section heads
const label = Object.values(nodes).find((n) => (n.classIds ?? []).some((c) => /^(label|chapter-tag_label)$/.test(cls[c] ?? '')))
console.log('label node:', JSON.stringify(label)?.slice(0, 500))
const ruleNames = Object.values(site.styleRules ?? {}).filter((r) => /label|chapter|page-hero|pg-hero|ph-/.test(r.name ?? '')).map((r) => r.kind + ':' + r.name)
console.log('rules:', ruleNames.join(' '))
console.log('files:', (site.files ?? []).filter((f) => /\.css$/.test(f.path)).map((f) => `${f.path}${f.disabled ? ' (disabled)' : ''} ${f.content.length}`).join(' | '))
