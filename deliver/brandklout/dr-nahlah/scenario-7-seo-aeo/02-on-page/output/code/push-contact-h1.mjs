#!/usr/bin/env node
/**
 * push-contact-h1.mjs — Scenario 7 step 02 on /contact (Dr. Nahlah), by hand because its hero is a
 * section heading, not a page hero push-keyword-h1 handles ("0 nodes with .section_page-hero"):
 *   the "Locations" tagline becomes the keyword H1 "Contact Our McLean & Alexandria Dental Offices"
 *   (the keyword map's h1) in the same tagline look; the designed headline "Where to go." becomes a
 *   <p id="contactTitle"> that keeps its look through two registry rules:
 *     .section_content p#contactTitle          = `h1, h2, h3, h4` + `.section_content h1` (beats
 *                                                `.section-heading_component p`, the body-text rule)
 *     .section_content h1.text-style-tagline   = tagline size, no max width, inherited line height
 * Proof: output/code/text-style.mjs snapshot before, compare after ("Locations=>…" for the tagline).
 *
 *   node output/code/push-contact-h1.mjs                      # plan (INSTATIC_BASE_URL = target host)
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com STAGING_HOST=staging.drnahlah.com node output/code/push-contact-h1.mjs --apply [--publish]
 * Run from scenario-7-seo-aeo/02-on-page. Refuses when the draft already differs from live. Backs up
 * the row and the registry to output/schema/backups/. Reads every node and rule back.
 */
import { randomBytes } from 'node:crypto'
import { writeFileSync, mkdirSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const lib = (p) => import(pathToFileURL(resolve('../../tools/instatic-site', p)).href)
const { api, getSite, getPages, toChangedPage, publish, publishStatus, BASE } = await lib('lib/site.mjs')
const { assertStaging } = await lib('lib/staging-guard.mjs')
const APPLY = process.argv.includes('--apply'), PUBLISH = process.argv.includes('--publish')
if (APPLY) assertStaging()
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'
const nanoid = () => [...randomBytes(21)].map((b) => ABC[b & 63]).join('')

const SLUG = 'contact'
const H1_TEXT = 'Contact Our McLean & Alexandria Dental Offices'
const TITLE_ID = 'contactTitle'

const status = await publishStatus()
const { site: shell0 } = await getSite()
const rows = (await getPages()).rows
const r0 = rows.find((x) => (x.cells?.slug ?? x.slug) === SLUG)
const row = (await api('GET', `/admin/api/cms/data/rows/${r0.id}`)).row
const N0 = row.cells.body.nodes, nodes = structuredClone(N0)
const rule = (sel) => Object.values(shell0.styleRules).find((r) => r.selector === sel)
const problems = [], changed = []

// the first section's heading block: tagline (span or, once done, h1) and the data-split headline
const main = Object.values(nodes).find((n) => n.props?.tag === 'main')
const sec = nodes[main.children[0]]
const all = []; const walk = (id) => { all.push(nodes[id]); (nodes[id].children || []).forEach(walk) }; walk(sec.id)
const title = all.find((n) => n.moduleId === 'base.text' && n.props?.htmlAttributes && 'data-split' in n.props.htmlAttributes && ['h1', 'p'].includes(n.props.tag))
const tagline = title && all.find((n) => n.moduleId === 'base.text' && ['span', 'h1'].includes(n.props?.tag) && n.id !== title.id && nodes[n.parentId]?.parentId === title.parentId)
if (!title || !tagline) problems.push(`heading block not as expected: headline ${!!title}, tagline ${!!tagline}`)
else {
  if (tagline.props.tag !== 'h1' || tagline.props.text !== H1_TEXT) { tagline.props = { ...tagline.props, tag: 'h1', text: H1_TEXT }; changed.push(tagline.id) }
  if (title.props.tag !== 'p' || title.props.htmlAttributes.id !== TITLE_ID) { title.props = { ...title.props, tag: 'p', htmlAttributes: { ...title.props.htmlAttributes, id: TITLE_ID } }; changed.push(title.id) }
}
const base = rule('h1, h2, h3, h4'), secH1 = rule('.section_content h1')
if (!base || !secH1) problems.push('heading rules not found: the headline look cannot be carried to a <p>')
const NEW_RULES = base && secH1 ? [
  [`.section_content p#${TITLE_ID}`, { ...base.styles, ...secH1.styles }, secH1.contextStyles || {}, secH1.order + 0.1],
  ['.section_content h1.text-style-tagline', { fontSize: 'var(--label)', maxWidth: 'none', lineHeight: 'inherit' }, {}, secH1.order + 0.2],
] : []

console.log(`${APPLY ? 'APPLY' : 'PLAN'} on ${BASE} — /${SLUG} row ${row.id}`)
console.log(`  status   ${JSON.stringify(status)}`)
console.log(`  h1       tagline -> <h1> "${H1_TEXT}"; "${title?.props.text}" -> <p id="${TITLE_ID}"> (${changed.length} node(s) to change)`)
for (const [s, st] of NEW_RULES) console.log(`  rule     ${s} ${JSON.stringify(st)}${rule(s) ? ' (exists)' : ''}`)
for (const p of problems) console.log(`  !! ${p}`)
if (!APPLY) process.exit(problems.length ? 1 : 0)
if (problems.length) { console.error('REFUSING: problems above'); process.exit(1) }
if (status.draftMatchesPublished !== true) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }

const BK = resolve('output/schema/backups'); mkdirSync(BK, { recursive: true })
const bf = join(BK, `contact-h1-${new URL(BASE).hostname}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
writeFileSync(bf, JSON.stringify({ row, styleRules: shell0.styleRules }))
console.log(`  backup   ${bf}`)
const { site: sh, seq } = await getSite()
const styleRules = structuredClone(sh.styleRules)
let rulesAdded = 0
for (const [selector, styles, contextStyles, order] of NEW_RULES) {
  if (Object.values(styleRules).some((x) => x.selector === selector)) continue
  const id = nanoid(), t = Date.now()
  styleRules[id] = { id, name: selector, kind: 'ambient', selector, order, styles, contextStyles, createdAt: t, updatedAt: t }
  rulesAdded++
}
await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: { ...sh, styleRules },
  changedPages: changed.length ? [toChangedPage(row, { nodes })] : [],
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: changed.length ? { [row.id]: row.seq } : {}, shellBaseSeq: seq,
})
console.log(`  wrote    /${SLUG} + ${rulesAdded} rule(s)`)

const keep = Object.fromEntries(['seoTitle', 'seoDescription'].filter((k) => row.cells[k] !== undefined).map((k) => [k, row.cells[k]]))
let back = (await api('GET', `/admin/api/cms/data/rows/${row.id}`)).row
if (Object.entries(keep).some(([k, v]) => back.cells[k] !== v)) {
  await api('PATCH', `/admin/api/cms/data/rows/${row.id}`, { cells: { ...back.cells, ...keep } })
  back = (await api('GET', `/admin/api/cms/data/rows/${row.id}`)).row
}
const bad = [], an = back.cells.body.nodes
for (const [id, n] of Object.entries(N0)) if (!isDeepStrictEqual(an[id], changed.includes(id) ? nodes[id] : n)) bad.push(`node ${id} ${changed.includes(id) ? 'differs from plan' : 'changed though untouched'}`)
if (Object.keys(an).length !== Object.keys(N0).length) bad.push(`node count ${Object.keys(N0).length} -> ${Object.keys(an).length}`)
for (const k of ['title', 'seoTitle', 'seoDescription', 'slug']) if (back.cells[k] !== row.cells[k]) bad.push(`cell ${k} changed`)
const { site: shell1 } = await getSite()
for (const [selector, styles] of NEW_RULES) { const x = Object.values(shell1.styleRules).find((y) => y.selector === selector); if (!x || !isDeepStrictEqual(x.styles, styles)) bad.push(`rule ${selector} did not read back`) }
if (Object.keys(shell1.styleRules).length !== Object.keys(sh.styleRules).length + rulesAdded) bad.push('rule count moved by more than the rules added')
for (const b of bad.slice(0, 20)) console.log(`  !! ${b}`)
if (bad.length) { console.log(`READ-BACK FAILED (${bad.length}) — restore from ${bf}`); process.exit(1) }
console.log('  readback clean: only the planned nodes and rules differ')
if (PUBLISH) { const p = await publish(); console.log(`published ${JSON.stringify(p)}`) } else console.log('draft only — pass --publish after checking')
