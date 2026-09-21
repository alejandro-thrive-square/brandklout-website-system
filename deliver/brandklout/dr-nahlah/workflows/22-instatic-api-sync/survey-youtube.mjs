#!/usr/bin/env node
/** survey-youtube.mjs — every YouTube reference in the Instatic draft, by page and node. */
import { getSite, getPages, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const YT = /youtube\.com|youtu\.be|youtube-nocookie|ytimg\.com|data-yt/i
const hits = []

function walk(nodes, pageLabel) {
  for (const [id, n] of Object.entries(nodes || {})) {
    const blob = JSON.stringify(n)
    if (!YT.test(blob)) continue
    const ids = [...blob.matchAll(/(?:embed\/|youtu\.be\/|v=|vi?\/)([A-Za-z0-9_-]{11})/g)].map(m => m[1])
    hits.push({ page: pageLabel, nodeId: id, type: n.type, tag: n.props?.customTag || '',
                ytIds: [...new Set(ids)], blob: blob.length > 420 ? blob.slice(0, 420) + '…' : blob })
  }
}

const { site } = await getSite()
const rows = (await getPages()).rows
console.log('BASE', BASE, '| pages', rows.length)

for (const r of rows) walk(r.cells?.body?.nodes, `${r.cells?.slug ?? r.slug ?? r.id}`)
// shared components live on the shell
walk(site?.components && Object.assign({}, ...Object.values(site.components).map(c => c.nodes || {})), '[shared-component]')

const byPage = {}
for (const h of hits) (byPage[h.page] ||= []).push(h)
console.log('\npages with YouTube:', Object.keys(byPage).length, '| nodes:', hits.length, '\n')
for (const [pg, hs] of Object.entries(byPage).sort()) {
  console.log(`--- /${pg}  (${hs.length})`)
  for (const h of hs) console.log(`    ${h.nodeId}  ${h.type}${h.tag ? ':' + h.tag : ''}  ids=${h.ytIds.join(',') || '-'}`)
}
const all = [...new Set(hits.flatMap(h => h.ytIds))]
console.log('\ndistinct YouTube ids on the site:', all.length)
console.log(all.join('\n'))
