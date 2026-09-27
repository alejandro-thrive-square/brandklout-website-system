import { getPages } from '../../../../process/22-instatic-api-sync/insta-api.mjs'
import fs from 'node:fs'
const rows = (await getPages()).rows
const OWN = new Set(['HiNtywrb4Yg','Vp6hSfd3oLI','oveSqavqCIQ','R_cKCMsVr8o','yTCwgaq4zqw','bn3vdCgDTrc',
                     'x6Dr-YPCUaI','8DH9ZdyBcp4','fiWLQROMvcg','glyfx-NFHHM','lU62bTDjV64','BnB_W6F_P1g'])
const inv = []
for (const r of rows) {
  const slug = r.cells?.slug ?? r.slug ?? r.id
  const nodes = r.cells?.body?.nodes || {}
  for (const [id, n] of Object.entries(nodes)) {
    const p = n.props || {}
    const attrs = p.htmlAttributes || {}
    let kind = null, yt = null
    if (n.moduleId === 'base.video' && /youtube/i.test(p.videoUrl || '')) {
      kind = 'base.video'; yt = (p.videoUrl.match(/embed\/([A-Za-z0-9_-]{11})/) || [])[1]
    } else if (attrs['data-yt']) {
      kind = 'facade-card'; yt = attrs['data-yt']
    } else if (/ytimg\.com|img\.youtube\.com/i.test(JSON.stringify(p))) {
      kind = 'thumb-img'; yt = (JSON.stringify(p).match(/vi\/([A-Za-z0-9_-]{11})\//) || [])[1]
    } else if (/youtube/i.test(JSON.stringify(p))) {
      kind = 'other:' + n.moduleId; yt = (JSON.stringify(p).match(/([A-Za-z0-9_-]{11})/) || [])[1]
    }
    if (kind) inv.push({ slug, id, kind, moduleId: n.moduleId, yt, own: OWN.has(yt), title: p.title || attrs['aria-label'] || '' })
  }
}
fs.writeFileSync('.tmp/inventory-video.json', JSON.stringify(inv, null, 2), 'utf8')
const by = (f) => inv.reduce((a, x) => (a[f(x)] = (a[f(x)] || 0) + 1, a), {})
console.log('total video nodes:', inv.length)
console.log('\nby mechanism:', JSON.stringify(by(x => x.kind), null, 2))
console.log('\nby ownership:', JSON.stringify(by(x => x.own ? 'own(migrated)' : 'THIRD-PARTY'), null, 2))
console.log('\nper page:')
const pages = {}
for (const x of inv) (pages[x.slug] ||= []).push(x)
for (const [s, xs] of Object.entries(pages).sort()) {
  const third = xs.filter(x => !x.own).length
  console.log(`  ${s.padEnd(50)} ${String(xs.length).padStart(3)} nodes  ${third ? `(${third} THIRD-PARTY)` : ''}`)
}
console.log('\nthird-party nodes (cannot move):')
for (const x of inv.filter(x => !x.own)) console.log(`  ${x.slug}  ${x.kind}  ${x.yt}  ${x.title.slice(0,50)}`)
