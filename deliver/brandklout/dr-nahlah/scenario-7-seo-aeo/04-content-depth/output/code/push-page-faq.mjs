#!/usr/bin/env node
/**
 * push-page-faq.mjs — Scenario 7 step 04 for Dr. Nahlah: a FAQ section on an existing page, from a
 * spec file, as a fresh-id clone of /all-on-4's #faq (the site's own FAQ component: details/summary,
 * which the aeo-schema build turns into a FAQPage). The same build as the home and office FAQs
 * (02-on-page/output/code/push-home-faq.mjs, 03-office-pages/output/code/push-office-pages.mjs).
 *
 * spec: { "slug", "id" (the new section's id), "after" (id of the section it follows), "tagline",
 *         "heading", "items": [[question, answer, [link text, href] | null], …] }
 * Answers use only facts the site already states; the brief beside the spec lists where.
 *
 *   node output/code/push-page-faq.mjs output/code/faq-<page>.json                # plan
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com STAGING_HOST=staging.drnahlah.com node output/code/push-page-faq.mjs <spec> --apply [--publish]
 * Run from scenario-7-seo-aeo/04-content-depth. Refuses when the draft already differs from live or the
 * page already has a section with that id. Backs up the row to output/backups/, reads every node back.
 */
import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const lib = (p) => import(pathToFileURL(resolve('../../tools/instatic-site', p)).href)
const { api, getSite, getPages, toChangedPage, publish, publishStatus, BASE } = await lib('lib/site.mjs')
const { assertStaging } = await lib('lib/staging-guard.mjs')
const specFile = process.argv.slice(2).find((a) => !a.startsWith('--'))
if (!specFile) { console.error('usage: node push-page-faq.mjs <spec.json> [--apply] [--publish]'); process.exit(2) }
const APPLY = process.argv.includes('--apply'), PUBLISH = process.argv.includes('--publish')
if (APPLY) assertStaging()
const spec = JSON.parse(readFileSync(specFile, 'utf8'))
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'
const nanoid = () => [...randomBytes(21)].map((b) => ABC[b & 63]).join('')

const status = await publishStatus()
const rows = (await getPages()).rows
const rowOf = async (slug) => { const r = rows.find((x) => (x.cells?.slug ?? x.slug) === slug); return r && (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row }
const row = await rowOf(spec.slug), a4 = await rowOf('all-on-4')
const problems = []
if (!row) { console.error(`no page with slug ${spec.slug}`); process.exit(1) }
const N0 = row.cells.body.nodes, N = structuredClone(N0), A = a4.cells.body.nodes
const byHtmlId = (M, id) => Object.values(M).find((n) => n.props?.htmlAttributes?.id === id)
const main = Object.values(N).find((n) => n.props?.tag === 'main')
const after = byHtmlId(N, spec.after), faq = byHtmlId(A, 'faq')
if (byHtmlId(N, spec.id)) problems.push(`/${spec.slug} already has #${spec.id}`)
if (!main || !after || !main.children.includes(after.id)) problems.push(`#${spec.after} is not a section of /${spec.slug}'s main`)
if (!faq) problems.push('/all-on-4 has no #faq to clone')
const added = []
if (!problems.length) {
  const clone = (id, parentId) => {
    const src = A[id], nid = nanoid()
    const n = structuredClone(src); n.id = nid; n.parentId = parentId; n.children = []
    N[nid] = n; added.push(nid)
    for (const c of src.children || []) n.children.push(clone(c, nid))
    return nid
  }
  const sub = (root) => { const out = []; const w = (id) => { out.push(N[id]); (N[id].children || []).forEach(w) }; w(root); return out }
  const drop = (id) => { for (const n of sub(id)) { delete N[n.id]; const i = added.indexOf(n.id); if (i >= 0) added.splice(i, 1) } }
  const inFaq = (n) => { for (let p = n; p; p = A[p.parentId]) if (p.id === faq.id) return true; return false }
  const srcItem = Object.values(A).find((n) => n.props?.customTag === 'details' && inFaq(n))
  const linkSrc = Object.values(A).find((n) => n.moduleId === 'base.link' && inFaq(n))
  const secId = clone(faq.id, main.id)
  N[secId].props = { ...N[secId].props, htmlAttributes: { ...N[secId].props.htmlAttributes, id: spec.id } }
  const all = sub(secId)
  const tag = all.find((n) => n.moduleId === 'base.text' && n.props?.tag === 'span'), h2 = all.find((n) => n.moduleId === 'base.text' && n.props?.tag === 'h2')
  tag.props = { ...tag.props, text: spec.tagline }; h2.props = { ...h2.props, text: spec.heading }
  const list = all.find((n) => n.props?.customTag !== 'details' && (n.children || []).some((c) => N[c]?.props?.customTag === 'details'))
  for (const it of list.children.slice()) drop(it)
  list.children = []
  for (const [q, a, link] of spec.items) {
    const dId = clone(srcItem.id, list.id), [sumId, ansId] = N[dId].children
    N[N[sumId].children[0]].props = { ...N[N[sumId].children[0]].props, text: q }
    for (const extra of N[ansId].children.slice(1)) drop(extra)
    N[ansId].children = N[ansId].children.slice(0, 1)
    N[N[ansId].children[0]].props = { ...N[N[ansId].children[0]].props, tag: 'none', text: a }
    if (link) {
      const lid = nanoid()
      N[lid] = { ...structuredClone(linkSrc), id: lid, parentId: ansId, children: [] }
      N[lid].props = { ...N[lid].props, text: link[0], href: link[1], target: /^https?:/.test(link[1]) ? '_blank' : '_self' }
      N[ansId].children.push(lid); added.push(lid)
    }
    list.children.push(dId)
  }
  main.children = [...main.children]; main.children.splice(main.children.indexOf(after.id) + 1, 0, secId)
}
for (const n of Object.values(N)) if (!Array.isArray(n.children)) n.children = []

console.log(`${APPLY ? 'APPLY' : 'PLAN'} on ${BASE} — /${spec.slug} row ${row.id}`)
console.log(`  status   ${JSON.stringify(status)}`)
console.log(`  faq      #${spec.id} after #${spec.after}: "${spec.heading}", ${spec.items.length} questions (${added.length} new nodes)`)
if (main) console.log(`  order    ${main.children.map((c) => '#' + (N[c].props?.htmlAttributes?.id || '?')).join(' > ')}`)
for (const p of problems) console.log(`  !! ${p}`)
if (!APPLY) process.exit(problems.length ? 1 : 0)
if (problems.length) { console.error('REFUSING: problems above'); process.exit(1) }
if (status.draftMatchesPublished !== true) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }

const BK = resolve('output/backups'); mkdirSync(BK, { recursive: true })
const bf = join(BK, `faq-${spec.slug}-${new URL(BASE).hostname}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
writeFileSync(bf, JSON.stringify(row))
console.log(`  backup   ${bf}`)
const { site: sh, seq } = await getSite()
await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: sh, changedPages: [toChangedPage(row, { nodes: N })],
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: { [row.id]: row.seq }, shellBaseSeq: seq,
})
console.log(`  wrote    /${spec.slug}`)

const keep = Object.fromEntries(['seoTitle', 'seoDescription'].filter((k) => row.cells[k] !== undefined).map((k) => [k, row.cells[k]]))
let back = (await api('GET', `/admin/api/cms/data/rows/${row.id}`)).row
if (Object.entries(keep).some(([k, v]) => back.cells[k] !== v)) {
  await api('PATCH', `/admin/api/cms/data/rows/${row.id}`, { cells: { ...back.cells, ...keep } })
  back = (await api('GET', `/admin/api/cms/data/rows/${row.id}`)).row
}
const bad = [], an = back.cells.body.nodes
for (const [id, n] of Object.entries(N0)) if (!isDeepStrictEqual(an[id], id === main.id ? N[id] : n)) bad.push(`node ${id} ${id === main.id ? 'differs from plan' : 'changed though untouched'}`)
for (const id of added) if (!isDeepStrictEqual(an[id], N[id])) bad.push(`new node ${id} not as written`)
if (Object.keys(an).length !== Object.keys(N0).length + added.length) bad.push(`node count ${Object.keys(N0).length} + ${added.length} -> ${Object.keys(an).length}`)
for (const k of ['title', 'seoTitle', 'seoDescription', 'slug']) if (back.cells[k] !== row.cells[k]) bad.push(`cell ${k} changed`)
for (const b of bad.slice(0, 20)) console.log(`  !! ${b}`)
if (bad.length) { console.log(`READ-BACK FAILED (${bad.length}) — restore from ${bf}`); process.exit(1) }
console.log('  readback clean')
if (PUBLISH) { const p = await publish(); console.log(`published ${JSON.stringify(p)}`) } else console.log('draft only — pass --publish after checking')
