#!/usr/bin/env node
/**
 * push-text-edits.mjs — Scenario 7 for Dr. Nahlah: surgical copy and photo edits on existing pages,
 * from a spec, in one incremental save. Every edit must hit exactly one node; nothing else moves.
 *
 * spec: { "<slug>": {
 *   "text":   [[ "<the node's text starts with>", "<new text>" ], …],      text and link nodes in <main>
 *   "images": [[ "<the image src ends with>", "/uploads/…" | "media:<file name>" ], …],
 *   "faqAppend": { "section": "<section id>", "items": [[q, a, [text, href] | null], …] }
 *                                          appends <details> items to an existing FAQ section (its own
 *                                          first item is the template); an item whose question is
 *                                          already there is skipped, so a re-run adds nothing
 * } }
 *
 *   node output/code/push-text-edits.mjs <spec>                   # plan
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com STAGING_HOST=staging.drnahlah.com node output/code/push-text-edits.mjs <spec> --apply [--publish]
 * Run from scenario-7-seo-aeo/04-content-depth. Refuses when the draft already differs from live.
 * Backs up every row it writes to output/backups/, reads every node back.
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
if (!specFile) { console.error('usage: node push-text-edits.mjs <spec.json> [--apply] [--publish]'); process.exit(2) }
const APPLY = process.argv.includes('--apply'), PUBLISH = process.argv.includes('--publish')
if (APPLY) assertStaging()
const SPEC = JSON.parse(readFileSync(specFile, 'utf8'))
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'
const nanoid = () => [...randomBytes(21)].map((b) => ABC[b & 63]).join('')

const status = await publishStatus()
const rows = (await getPages()).rows
let media = null
const problems = [], plans = []
for (const [slug, spec] of Object.entries(SPEC)) {
  const r = rows.find((x) => (x.cells?.slug ?? x.slug) === slug)
  if (!r) { problems.push(`no page ${slug}`); continue }
  const row = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row
  const N0 = row.cells.body.nodes, N = structuredClone(N0)
  const changed = new Set(), added = []
  const main = Object.values(N).find((n) => n.props?.tag === 'main')
  const inMain = (n) => { for (let p = n; p; p = N[p.parentId]) if (p.id === main.id) return true; return false }
  const sub = (root) => { const out = []; const w = (id) => { out.push(N[id]); (N[id].children || []).forEach(w) }; w(root); return out }
  for (const [old, text] of spec.text || []) {
    const hits = Object.values(N).filter((n) => ['base.text', 'base.link'].includes(n.moduleId) && inMain(n) && typeof n.props?.text === 'string' && (n.props.text.startsWith(old) || n.props.text === text))
    if (hits.length !== 1) { problems.push(`${slug}: "${old.slice(0, 50)}" matches ${hits.length} nodes`); continue }
    if (hits[0].props.text === text) continue
    hits[0].props = { ...hits[0].props, text }; changed.add(hits[0].id)
  }
  for (const [end, to] of spec.images || []) {
    let src = to
    if (src.startsWith('media:')) {
      media ??= (await api('GET', '/admin/api/cms/media')).assets ?? []
      const a = media.find((m) => (m.publicPath || '').replace(/^\/uploads\/[A-Za-z0-9_-]{21}-/, '') === src.slice(6))
      if (!a) { problems.push(`${slug}: no media named ${src.slice(6)}`); continue }
      src = a.publicPath
    }
    const hits = Object.values(N).filter((n) => n.moduleId === 'base.image' && inMain(n) && (String(n.props?.src).endsWith(end) || n.props?.src === src))
    if (hits.length !== 1) { problems.push(`${slug}: image "${end}" matches ${hits.length} nodes`); continue }
    if (hits[0].props.src === src) continue
    hits[0].props = { ...hits[0].props, src }; changed.add(hits[0].id)
  }
  if (spec.faqAppend) {
    const sec = Object.values(N).find((n) => n.props?.htmlAttributes?.id === spec.faqAppend.section)
    const list = sec && sub(sec.id).find((n) => (n.children || []).some((c) => N[c]?.props?.customTag === 'details'))
    if (!list) problems.push(`${slug}: no FAQ list in #${spec.faqAppend.section}`)
    else {
      const tmplId = list.children.find((c) => N[c].props?.customTag === 'details')
      const T = Object.fromEntries(sub(tmplId).map((n) => [n.id, structuredClone(N0[n.id])]))
      // a link to copy for "read on" answers: this FAQ's own, else the one in /all-on-4's FAQ
      let linkTmpl = sub(sec.id).find((n) => n.moduleId === 'base.link' && N0[n.id])
      if (!linkTmpl) {
        const a4r = rows.find((x) => (x.cells?.slug ?? x.slug) === 'all-on-4')
        const A = (await api('GET', `/admin/api/cms/data/rows/${a4r.id}`)).row.cells.body.nodes
        linkTmpl = Object.values(A).find((n) => n.moduleId === 'base.link' && String(n.props?.text).includes('→'))
        N0[linkTmpl.id] = linkTmpl
      }
      const clone = (id, parentId) => { const nid = nanoid(); const n = structuredClone(T[id]); n.id = nid; n.parentId = parentId; n.children = []; N[nid] = n; added.push(nid); for (const c of T[id].children || []) n.children.push(clone(c, nid)); return nid }
      const asked = new Set(list.children.map((c) => N[N[N[c].children[0]].children[0]]?.props?.text))
      for (const [q, a, link] of spec.faqAppend.items) {
        if (asked.has(q)) continue
        const dId = clone(tmplId, list.id), [sumId, ansId] = N[dId].children
        N[N[sumId].children[0]].props = { ...N[N[sumId].children[0]].props, text: q }
        for (const extra of N[ansId].children.slice(1)) { for (const n of sub(extra)) { delete N[n.id]; added.splice(added.indexOf(n.id), 1) } }
        N[ansId].children = N[ansId].children.slice(0, 1)
        N[N[ansId].children[0]].props = { ...N[N[ansId].children[0]].props, tag: 'none', text: a }
        if (link) {
          if (!linkTmpl) { problems.push(`${slug}: no link in #${spec.faqAppend.section} to copy`); continue }
          const lid = nanoid()
          N[lid] = { ...structuredClone(N0[linkTmpl.id]), id: lid, parentId: ansId, children: [] }
          N[lid].props = { ...N[lid].props, text: link[0], href: link[1], target: /^https?:/.test(link[1]) ? '_blank' : '_self' }
          N[ansId].children.push(lid); added.push(lid)
        }
        list.children = [...list.children, dId]; changed.add(list.id)
      }
    }
  }
  for (const n of Object.values(N)) if (!Array.isArray(n.children)) n.children = []
  plans.push({ slug, row, N0, N, changed: [...changed], added })
}

console.log(`${APPLY ? 'APPLY' : 'PLAN'} on ${BASE}`)
console.log(`  status   ${JSON.stringify(status)}`)
for (const p of plans) console.log(`  ${p.slug.padEnd(28)} ${p.changed.length} nodes changed, ${p.added.length} added`)
for (const pr of problems) console.log(`  !! ${pr}`)
if (!APPLY) process.exit(problems.length ? 1 : 0)
if (problems.length) { console.error('REFUSING: problems above'); process.exit(1) }
if (status.draftMatchesPublished !== true) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }
const todo = plans.filter((p) => p.changed.length || p.added.length)
if (!todo.length) { console.log('nothing to change'); process.exit(0) }

const BK = resolve('output/backups'); mkdirSync(BK, { recursive: true })
const bf = join(BK, `text-edits-${new URL(BASE).hostname}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
writeFileSync(bf, JSON.stringify(todo.map((p) => p.row)))
console.log(`  backup   ${bf}`)
const { site: sh, seq } = await getSite()
await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: sh,
  changedPages: todo.map((p) => toChangedPage(p.row, { nodes: p.N })),
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(todo.map((p) => [p.row.id, p.row.seq])), shellBaseSeq: seq,
})
console.log(`  wrote    ${todo.map((p) => p.slug).join(', ')}`)
const bad = []
for (const p of todo) {
  const back = (await api('GET', `/admin/api/cms/data/rows/${p.row.id}`)).row, an = back.cells.body.nodes
  for (const [id, n] of Object.entries(p.N)) if (!isDeepStrictEqual(an[id], n)) bad.push(`${p.slug}: node ${id} ${p.N0[id] ? (p.changed.includes(id) ? 'differs from plan' : 'changed though untouched') : 'not as written'}`)
  if (Object.keys(an).length !== Object.keys(p.N).length) bad.push(`${p.slug}: node count ${Object.keys(an).length}, planned ${Object.keys(p.N).length}`)
  for (const k of ['title', 'seoTitle', 'seoDescription', 'slug']) if (back.cells[k] !== p.row.cells[k]) bad.push(`${p.slug}: cell ${k} changed`)
}
for (const b of bad.slice(0, 20)) console.log(`  !! ${b}`)
if (bad.length) { console.log(`READ-BACK FAILED (${bad.length}) — restore from ${bf}`); process.exit(1) }
console.log('  readback clean')
if (PUBLISH) { const r = await publish(); console.log(`published ${JSON.stringify(r)}`) } else console.log('draft only — pass --publish after checking')
