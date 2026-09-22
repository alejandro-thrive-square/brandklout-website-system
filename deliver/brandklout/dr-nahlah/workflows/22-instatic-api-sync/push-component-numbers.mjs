#!/usr/bin/env node
/**
 * push-component-numbers.mjs — the same new-patient number retarget as
 * push-office-numbers.mjs, but for the shared `cta-offices` COMPONENT, which
 * that script could not write.
 *
 *   node push-component-numbers.mjs            # report, write nothing
 *   node push-component-numbers.mjs --apply
 *
 * ## Why a separate script
 *
 * `PUT /site-document` takes `changedComponents`, but every shape tried for an
 * entry was rejected with a bare `400 Invalid request body` — the raw row, and
 * the flat `{id, name, slug, nodes, rootNodeId, params, classIds}` that mirrors
 * `toChangedPage`. Rather than guess further at an undocumented envelope, this
 * goes through `PATCH /admin/api/cms/data/rows/:id`, which is the same endpoint
 * push-page-seo-cells.mjs uses and which merges nothing: `cells` is REPLACED
 * wholesale, so the payload is the row as it stands right now with only
 * `body.nodes` swapped.
 *
 * The usual reason not to patch a row — it re-derives the route and flattens a
 * nested slug — does not apply: `cta-offices` has no slash in its slug and is
 * not routable at all.
 *
 * NOTHING HERE PUBLISHES.
 */
import { api } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')
const NAME = 'cta-offices'

const MAP = [
  ['+1-571-702-9900', '+1-703-448-3312'],
  ['+1-571-619-9442', '+1-703-448-3312'],
  ['+1-571-253-7790', '+1-571-617-7245'],
  ['+1-571-410-3430', '+1-571-617-7245'],
  ['+15717029900', '+17034483312'],
  ['+15716199442', '+17034483312'],
  ['+15712537790', '+15716177245'],
  ['+15714103430', '+15716177245'],
  ['(571) 702-9900', '(703) 448-3312'],
  ['(571) 619-9442', '(703) 448-3312'],
  ['(571) 253-7790', '(571) 617-7245'],
  ['(571) 410-3430', '(571) 617-7245'],
].sort((a, b) => b[0].length - a[0].length)

const DEAD = ['5717029900', '5712537790', '5716199442', '5714103430',
  '571) 702-9900', '571) 253-7790', '571) 619-9442', '571) 410-3430']

let hits = 0
const sub = (v) => {
  if (typeof v === 'string') {
    let out = v
    for (const [from, to] of MAP) {
      if (!out.includes(from)) continue
      hits += out.split(from).length - 1
      out = out.split(from).join(to)
    }
    return out
  }
  if (Array.isArray(v)) return v.map(sub)
  if (v && typeof v === 'object') {
    const o = {}
    for (const [k, x] of Object.entries(v)) o[k] = sub(x)
    return o
  }
  return v
}

const rows = (await api('GET', '/admin/api/cms/components')).rows ?? []
const row = rows.find((r) => (r.cells?.name ?? r.slug) === NAME)
if (!row) { console.error(`no component named ${NAME}`); process.exit(1) }

const before = (await api('GET', `/admin/api/cms/data/rows/${row.id}`)).row
const nodes = {}
let changed = 0
for (const [id, n] of Object.entries(before.cells.body.nodes)) {
  const next = { ...n, props: sub(n.props ?? {}) }
  if (JSON.stringify(next.props) !== JSON.stringify(n.props ?? {})) changed++
  nodes[id] = next
}
console.log(`${NAME}: ${Object.keys(nodes).length} nodes, ${changed} changed, ${hits} strings`)
for (const n of Object.values(nodes)) {
  if (n.props?.href || n.props?.text) {
    const t = `${n.props.text ?? ''} ${n.props.href ?? ''}`.trim()
    if (/\d{3}/.test(t)) console.log(`    ${t}`)
  }
}
if (!hits) { console.log('nothing to do'); process.exit(0) }
if (!APPLY) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

await api('PATCH', `/admin/api/cms/data/rows/${row.id}`, {
  cells: { ...before.cells, body: { ...before.cells.body, nodes } },
})

const after = (await api('GET', `/admin/api/cms/data/rows/${row.id}`)).row
const s = JSON.stringify(after.cells.body)
const left = DEAD.filter((d) => s.includes(d))
const checks = [
  ['name intact', after.cells.name === before.cells.name],
  ['slug intact', after.cells.slug === before.cells.slug],
  ['node count', Object.keys(after.cells.body.nodes).length === Object.keys(before.cells.body.nodes).length],
  ['root intact', after.cells.body.rootNodeId === before.cells.body.rootNodeId],
  ['params intact', JSON.stringify(after.cells.params) === JSON.stringify(before.cells.params)],
  ['no retired number left', left.length === 0],
]
let bad = 0
for (const [l, ok] of checks) { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${l}`); if (!ok) bad++ }
if (left.length) console.error('  still present: ' + left.join(', '))
process.exit(bad ? 1 : 0)
