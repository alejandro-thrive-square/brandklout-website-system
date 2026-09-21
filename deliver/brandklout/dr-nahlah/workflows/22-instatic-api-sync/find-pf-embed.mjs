import { getSite, getPages } from '../../../../process/22-instatic-api-sync/insta-api.mjs'
const { site } = await getSite()
for (const f of site.files) {
  if (!/\.css$/.test(f.path)) continue
  const c = f.content || ''
  if (!/pf-embed/.test(c)) continue
  console.log('=== ' + f.path + '  (scope ' + JSON.stringify(f.pageIds ?? null) + ')')
  for (const m of c.matchAll(/[^}]*pf-embed[^{]*\{[^}]*\}/g)) console.log('   ' + m[0].trim().replace(/\s+/g, ' '))
}
// registry rules too
const reg = Object.values(site.styleRules || {}).filter(r => /pf-embed/.test(r.selector || r.name || ''))
console.log('\nregistry styleRules matching pf-embed:', reg.length)
for (const r of reg) console.log('   ', r.selector, JSON.stringify(r.styles))

// which pages carry the class, and what is inside each
const rows = (await getPages()).rows
console.log('\npages with a pf-embed node:')
for (const row of rows) {
  const nodes = row.cells?.body?.nodes || {}
  const cls = site.styleRules || {}
  const ids = Object.entries(nodes).filter(([, n]) =>
    (n.classIds || []).some(id => (cls[id]?.name || '') === 'pf-embed'))
  if (!ids.length) continue
  for (const [id, n] of ids) {
    const kids = (n.children || []).map(c => nodes[c]?.moduleId).join(', ')
    console.log('  /' + (row.cells?.slug ?? row.slug) + '  ' + id + '  children: ' + (kids || '(none)'))
  }
}
