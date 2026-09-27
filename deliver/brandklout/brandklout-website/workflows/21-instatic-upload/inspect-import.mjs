/**
 * Read .tmp/import-out.json and list what the importer did to the elements it is known to
 * rewrite: buttons (trap 15: children flattened into a label), inputs/selects/textareas
 * (trap 22: attributes dropped), forms, ids the page script needs, and inline styles.
 *
 * Usage: node inspect-import.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const out = JSON.parse(fs.readFileSync(path.join(HERE, '.tmp', 'import-out.json'), 'utf8'))

for (const page of out.pages) {
  const nodes = Object.values(page.nodes)
  const byModule = {}
  for (const n of nodes) byModule[n.moduleId] = (byModule[n.moduleId] ?? 0) + 1
  console.log(`page ${page.slug}: ${nodes.length} nodes`)
  console.log('  modules', JSON.stringify(byModule))
  const show = (n) => JSON.stringify({ module: n.moduleId, props: n.props, attrs: n.attributes ?? n.attrs, children: (n.children ?? []).length }).slice(0, 400)
  for (const n of nodes) {
    const tag = n.props?.customTag ?? n.props?.tag ?? ''
    if (/button|input|select|textarea|form|label|option/.test(n.moduleId + ' ' + tag)) console.log('  ', show(n))
  }
  const ids = nodes.map((n) => n.props?.id ?? n.attributes?.id ?? n.props?.htmlId).filter(Boolean)
  console.log('  ids', JSON.stringify(ids))
  const styled = nodes.filter((n) => JSON.stringify(n).includes('style')).length
  console.log('  nodes mentioning style', styled)
}
