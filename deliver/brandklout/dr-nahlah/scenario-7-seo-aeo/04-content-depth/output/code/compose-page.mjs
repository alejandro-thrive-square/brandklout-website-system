#!/usr/bin/env node
/**
 * compose-page.mjs — Scenario 7 step 04 for Dr. Nahlah: a new page (or a re-run of one) built only from
 * this site's own sections, as fresh-id clones, with every visible word rewritten from a spec.
 *
 * spec: {
 *   "slug", "title",                      the page's URL slug and its title cell
 *   "base": "<slug>",                     whose header, drawer, wrapper and footer the page carries
 *   "sections": [{
 *     "from": "<slug>#<section id>",      the section cloned
 *     "id": "<new section id>",
 *     "lists": [[k, n], …],               resize the k-th repeating group (re-detected after each) to n items
 *     "faq": [[q, a, [text, href] | null], …],   rebuild the section's <details> list (FAQPage on the build)
 *     "text": [ … ],                      one entry per text slot, in document order (--outline lists them):
 *                                         "words" | {"text"|"label"|"href"|"target": …} | null (keep)
 *     "images": [ "/uploads/…" | "media:<file name>" | null, … ]   one per image, in document order;
 *                                         media: resolves the library asset by name on the target host
 *   }, …],
 *   "seoTitle", "seoDescription"          read by pages-seo.mjs into ops/set-page-seo.mjs's input
 * }
 *
 *   node output/code/compose-page.mjs <spec> --outline   # each section's groups and text slots, after `lists`/`faq`
 *   node output/code/compose-page.mjs <spec>             # plan: slot counts must match, words, sections
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com STAGING_HOST=staging.drnahlah.com node output/code/compose-page.mjs <spec> --apply [--publish]
 * Run from scenario-7-seo-aeo/04-content-depth. A slug that already exists is rebuilt in place (same
 * row, its seq as baseSeq). Refuses when the draft already differs from live. Backs up an existing row
 * to output/backups/, reads the page back node for node.
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
if (!specFile) { console.error('usage: node compose-page.mjs <spec.json> [--outline] [--apply] [--publish]'); process.exit(2) }
const OUTLINE = process.argv.includes('--outline'), APPLY = process.argv.includes('--apply'), PUBLISH = process.argv.includes('--publish')
if (APPLY) assertStaging()
const spec = JSON.parse(readFileSync(specFile, 'utf8'))
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'
const nanoid = () => [...randomBytes(21)].map((b) => ABC[b & 63]).join('')

const status = await publishStatus()
const { site } = await getSite()
const rows = (await getPages()).rows
const cache = new Map()
const rowOf = async (slug) => {
  if (!cache.has(slug)) { const r = rows.find((x) => (x.cells?.slug ?? x.slug) === slug); cache.set(slug, r ? (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row : null) }
  return cache.get(slug)
}
const problems = []
let media = null
const N = {}
const cloneInto = (S, id, parentId) => {
  const src = S[id], nid = nanoid()
  const n = structuredClone(src); n.id = nid; n.parentId = parentId; n.children = []
  N[nid] = n
  for (const c of src.children || []) n.children.push(cloneInto(S, c, nid))
  return nid
}
const sub = (root) => { const out = []; const w = (id) => { out.push(N[id]); (N[id].children || []).forEach(w) }; w(root); return out }
const drop = (id) => { for (const n of sub(id)) delete N[n.id] }
const cls = (n) => (n.classIds || []).join('.')
const shape = (n) => [n.moduleId, n.props?.tag, n.props?.customTag, cls(n)].join('|')
const groupsOf = (root) => sub(root).filter((n) => (n.children || []).length >= 2 && new Set(n.children.map((c) => shape(N[c]))).size === 1)
const isSlot = (n) => n.moduleId === 'base.button' || n.moduleId === 'base.link' || (n.moduleId === 'base.text' && typeof n.props?.text === 'string' && n.props.text.trim() !== '')
const inDetails = (n) => { for (let p = n; p; p = N[p.parentId]) if (p.props?.customTag === 'details') return true; return false }
const label = (n) => (n.classIds || []).map((c) => (site.styleRules[c]?.selector || '').replace(/^\./, '')).filter(Boolean).join('.')

// ── the shell: the base page, every main section removed ────────────────────────
const baseRow = await rowOf(spec.base)
if (!baseRow) { console.error(`no base page ${spec.base}`); process.exit(1) }
const B = baseRow.cells.body.nodes
const rootId = cloneInto(B, baseRow.cells.body.rootNodeId, null)
const main = Object.values(N).find((n) => n.props?.tag === 'main')
for (const s of main.children) drop(s)
main.children = []

// ── the sections ────────────────────────────────────────────────────────────────
const report = []
for (const [i, sec] of spec.sections.entries()) {
  const [fromSlug, fromId] = sec.from.split('#')
  const srcRow = await rowOf(fromSlug)
  const S = srcRow?.cells.body.nodes
  const srcSec = S && Object.values(S).find((n) => n.props?.htmlAttributes?.id === fromId)
  if (!srcSec) { problems.push(`section ${i}: ${sec.from} not found`); continue }
  const sid = cloneInto(S, srcSec.id, main.id)
  main.children.push(sid)
  if (sec.id) N[sid].props = { ...N[sid].props, htmlAttributes: { ...N[sid].props.htmlAttributes, id: sec.id } }
  for (const [k, n] of sec.lists || []) {
    const g = groupsOf(sid)[k]
    if (!g) { problems.push(`section ${sec.id}: no repeating group ${k}`); continue }
    while (g.children.length > n) drop(g.children.pop())
    while (g.children.length < n) g.children.push(cloneInto(N, g.children[g.children.length - 1], g.id))
  }
  if (sec.faq) {
    const list = sub(sid).find((n) => (n.children || []).some((c) => N[c]?.props?.customTag === 'details'))
    if (!list) { problems.push(`section ${sec.id}: no <details> list for faq`); continue }
    const tmpl = list.children.find((c) => N[c].props?.customTag === 'details')
    const linkTmpl = sub(sid).find((n) => n.moduleId === 'base.link' && inDetails(n))
      ?? Object.values((await rowOf('all-on-4')).cells.body.nodes).find((n) => n.moduleId === 'base.link' && n.props?.text?.includes('→'))
    const keepTmpl = structuredClone(sub(tmpl).reduce((m, n) => ((m[n.id] = n), m), {}))
    for (const c of list.children.slice()) drop(c)
    list.children = []
    for (const [q, a, link] of sec.faq) {
      const dId = cloneInto(keepTmpl, tmpl, list.id), [sumId, ansId] = N[dId].children
      N[N[sumId].children[0]].props = { ...N[N[sumId].children[0]].props, text: q }
      for (const extra of N[ansId].children.slice(1)) drop(extra)
      N[ansId].children = N[ansId].children.slice(0, 1)
      N[N[ansId].children[0]].props = { ...N[N[ansId].children[0]].props, tag: 'none', text: a }
      if (link) {
        const lid = nanoid()
        N[lid] = { ...structuredClone(linkTmpl), id: lid, parentId: ansId, children: [] }
        N[lid].props = { ...N[lid].props, text: link[0], href: link[1], target: /^https?:/.test(link[1]) ? '_blank' : '_self' }
        N[ansId].children.push(lid)
      }
      list.children.push(dId)
    }
  }
  const nodes = sub(sid)
  const slots = nodes.filter((n) => isSlot(n) && !(sec.faq && inDetails(n)))
  const imgs = nodes.filter((n) => n.moduleId === 'base.image')
  if (OUTLINE) {
    console.log(`\n## [${i}] ${sec.from} -> #${sec.id}   .${label(N[sid])}`)
    groupsOf(sid).forEach((g, k) => console.log(`   group ${k}: ${g.children.length} x ${N[g.children[0]].props?.customTag || N[g.children[0]].moduleId}.${label(N[g.children[0]])} (${sub(g.children[0]).filter(isSlot).length} slots each)`))
    slots.forEach((n, j) => console.log(`   ${String(j).padStart(2)} ${n.moduleId === 'base.button' ? 'button' : n.moduleId === 'base.link' ? (typeof n.props?.text === 'string' ? 'link  ' : 'a[ ]  ') : (n.props?.tag || 'text').padEnd(6)} ${JSON.stringify(n.props?.text ?? n.props?.label ?? '').slice(0, 90)}${n.props?.href ? '  -> ' + n.props.href : ''}`))
    imgs.forEach((n, j) => console.log(`   img ${j} ${n.props?.src}`))
    continue
  }
  const T = sec.text || []
  if (T.length !== slots.length) problems.push(`section #${sec.id} (${sec.from}): ${slots.length} text slots, spec has ${T.length}`)
  slots.forEach((n, j) => {
    const v = T[j]
    if (v === null || v === undefined) return
    const o = typeof v === 'string'
      ? (n.moduleId === 'base.button' ? { label: v } : n.moduleId === 'base.link' && typeof n.props?.text !== 'string' ? { href: v } : { text: v })
      : v
    n.props = { ...n.props, ...o }
  })
  const I = sec.images || []
  if (I.length > imgs.length) problems.push(`section #${sec.id}: ${imgs.length} images, spec has ${I.length}`)
  for (const [j, n] of imgs.entries()) {
    let src = I[j]
    if (!src) continue
    // "media:<file name>" = the library asset with that name on this host (upload paths differ per host)
    if (src.startsWith('media:')) {
      media ??= (await api('GET', '/admin/api/cms/media')).assets ?? []
      const name = src.slice(6), a = media.find((m) => (m.publicPath || '').replace(/^\/uploads\/[A-Za-z0-9_-]{21}-/, '') === name)
      if (!a) { problems.push(`section #${sec.id}: no media named ${name} on this host`); continue }
      src = a.publicPath
    }
    n.props = { ...n.props, src }
  }
  report.push([sec.id, sec.from, slots.length, imgs.length])
}
for (const n of Object.values(N)) if (!Array.isArray(n.children)) n.children = []
if (OUTLINE) process.exit(0)

// ── plan ────────────────────────────────────────────────────────────────────────
const existing = await rowOf(spec.slug)
const ids = main.children.map((c) => N[c].props?.htmlAttributes?.id)
const dupIds = ids.filter((x, i) => x && ids.indexOf(x) !== i)
if (dupIds.length) problems.push(`duplicate section ids: ${dupIds.join(', ')}`)
const words = main.children.flatMap((c) => sub(c)).filter((n) => typeof n.props?.text === 'string').map((n) => n.props.text).join(' ').split(/\s+/).filter(Boolean).length
console.log(`${APPLY ? 'APPLY' : 'PLAN'} on ${BASE} — /${spec.slug} ${existing ? `(rebuild of row ${existing.id})` : '(new page)'}, shell from /${spec.base}`)
console.log(`  status   ${JSON.stringify(status)}`)
console.log(`  page     "${spec.title}", ${Object.keys(N).length} nodes, ~${words} words in main`)
for (const [id, from, s, im] of report) console.log(`  section  #${String(id).padEnd(14)} from ${from.padEnd(34)} ${s} slots, ${im} images`)
for (const p of problems) console.log(`  !! ${p}`)
if (!APPLY) process.exit(problems.length ? 1 : 0)
if (problems.length) { console.error('REFUSING: problems above'); process.exit(1) }
if (status.draftMatchesPublished !== true) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }

// ── write ───────────────────────────────────────────────────────────────────────
const pageId = existing?.id ?? nanoid()
if (existing) {
  const BK = resolve('output/backups'); mkdirSync(BK, { recursive: true })
  const bf = join(BK, `compose-${spec.slug}-${new URL(BASE).hostname}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  writeFileSync(bf, JSON.stringify(existing)); console.log(`  backup   ${bf}`)
}
// the title cell is the published <title>: set-page-seo writes the SEO title there, so a rebuild keeps it
const title = spec.seoTitle ?? spec.title
const entry = existing
  ? toChangedPage(existing, { nodes: N, rootNodeId: rootId, title })
  : { id: pageId, slug: spec.slug, title, nodes: N, rootNodeId: rootId }
const { site: sh, seq } = await getSite()
await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: sh, changedPages: [entry],
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: existing ? { [existing.id]: existing.seq } : {}, shellBaseSeq: seq,
})
console.log(`  wrote    /${spec.slug} (row ${pageId})`)
const back = (await api('GET', `/admin/api/cms/data/rows/${pageId}`)).row
const an = back.cells.body.nodes, bad = []
for (const [id, n] of Object.entries(N)) if (!isDeepStrictEqual(an[id], n)) bad.push(`node ${id} not as written`)
if (Object.keys(an).length !== Object.keys(N).length) bad.push(`node count ${Object.keys(an).length}, wrote ${Object.keys(N).length}`)
if ((back.cells.slug ?? back.slug) !== spec.slug) bad.push(`slug reads back as ${back.cells.slug ?? back.slug}`)
for (const b of bad.slice(0, 12)) console.log(`  !! ${b}`)
if (bad.length) { console.log(`READ-BACK FAILED (${bad.length})`); process.exit(1) }
console.log('  readback clean')
if (PUBLISH) { const p = await publish(); console.log(`published ${JSON.stringify(p)}`) } else console.log('draft only — pass --publish after checking')
