#!/usr/bin/env node
/**
 * push-home-faq.mjs — Scenario 7 step 02 on the HOME page (Dr. Nahlah), by hand because its hero is
 * built differently from the page heroes push-keyword-h1 handles:
 *   1. keyword H1: the hero tagline ("Chapter 00 · Arrival") becomes the H1 "Prosthodontist & Dental
 *      Implants in McLean & Alexandria, VA" in the same tagline style; #heroTitle ("A smile rebuilt by
 *      a specialist") becomes a <p> that keeps its look through three registry rules;
 *   2. a local FAQ section (#local-faq) before #invitation: a fresh-id clone of /all-on-4's #faq,
 *      seven questions answered only with facts the site already states (offices, hours, phones,
 *      sedation, financing, same-day teeth, first visit). The aeo-schema build turns it into a FAQPage.
 *
 *   node output/code/push-home-faq.mjs                      # plan (INSTATIC_BASE_URL = target host)
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com STAGING_HOST=staging.drnahlah.com node output/code/push-home-faq.mjs --apply [--publish]
 * Run from scenario-7-seo-aeo/02-on-page. Refuses when the draft already differs from live. Backs up
 * the home row and the registry to output/schema/backups/. Reads every node and rule back.
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

const H1_TEXT = 'Prosthodontist & Dental Implants in McLean & Alexandria, VA'
const FAQ_TAGLINE = 'Questions'
const FAQ_HEADING = 'What patients ask before they visit.'
const FAQ = [
  ['What is a prosthodontist, and how is that different from a general dentist?',
    'A prosthodontist is a dental specialist in replacing and rebuilding teeth: implants, full arches, dentures, crowns and veneers. Dr. Esam Nahlah is a board-certified prosthodontist, a Diplomate of the American Board of Prosthodontics, and treats patients at both offices, in McLean near Tysons Corner and in Alexandria.',
    ['Meet Dr. Nahlah →', '/meet-dr-nahlah']],
  ['Where are your offices?',
    'Two offices in Northern Virginia. Tysons Corner: 7901 Jones Branch Drive, Suite 220, McLean, VA 22102, (703) 448-3312. Alexandria: 2855 Duke Street, Alexandria, VA 22314, new patients (571) 617-7245. Both are open Monday to Thursday, 8 am to 5 pm, and Friday, 8 am to 2 pm.',
    ['Directions and hours →', '/contact']],
  ['How much do dental implants cost in McLean and Alexandria?',
    'It depends on how many implants you need, whether bone grafting is required and which teeth go on them, which is why two quotes for the same mouth can differ by thousands. The cost is set at your consultation, once Dr. Nahlah has seen your 3D scan and you have chosen an option. Call (703) 448-3312 in McLean or (571) 617-7245 in Alexandria to book.',
    ['What drives implant cost →', '/implant-cost']],
  ['How can I pay for treatment?',
    'Cash, check, credit card, most PPO dental plans, or financing of up to $60,000 over terms of up to 96 months.',
    ['Financing options →', '/financing']],
  ['Do you offer sedation for anxious patients?',
    'Yes. Nitrous oxide and oral sedation are both available, given at the office by the practice.',
    ['Sedation options →', '/sedation-dentistry']],
  ['Can I leave with new teeth the same day?',
    'With All-on-4, in most cases yes: you leave the same visit wearing a fixed provisional arch, and the final zirconia arch follows three to four months later.',
    ['All-on-4 dental implants →', '/all-on-4']],
  ['What happens at the first visit?',
    'An office tour, a consultation with Dr. Nahlah, digital X-rays, an examination and a cleaning.',
    ['Your first visit →', '/patient-center']],
]

// ── read ──────────────────────────────────────────────────────────────────────
const status = await publishStatus()
const { site: shell0 } = await getSite()
const rows = (await getPages()).rows
const rowOf = async (slug) => { const r = rows.find((x) => (x.cells?.slug ?? x.slug) === slug); return (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row }
const home = await rowOf('index'), a4 = await rowOf('all-on-4')
const N0 = home.cells.body.nodes, A = a4.cells.body.nodes
const nodes = structuredClone(N0)
const find = (map, pred) => Object.values(map).find(pred)
const hasId = (n, id) => n.props?.htmlAttributes?.id === id
const rule = (sel) => Object.values(shell0.styleRules).find((r) => r.selector === sel)

const problems = []
const heroTitle = find(nodes, (n) => hasId(n, 'heroTitle'))
const content = heroTitle && nodes[heroTitle.parentId]
// the tagline: the hero-content child before #heroTitle whose text node is a <span> (or already the <h1>)
const isTag = (n) => n?.moduleId === 'base.text' && ['span', 'h1'].includes(n.props?.tag)
const tagWrap = content && content.children.map((c) => nodes[c]).find((n) => n.id !== heroTitle.id && (n.children || []).some((c) => isTag(nodes[c])))
const tagText = tagWrap && tagWrap.children.map((c) => nodes[c]).find(isTag)
const main = find(nodes, (n) => n.props?.tag === 'main')
const invitation = find(nodes, (n) => hasId(n, 'invitation'))
const already = find(nodes, (n) => hasId(n, 'local-faq'))
const faq = find(A, (n) => hasId(n, 'faq'))
if (!heroTitle || !tagText || !main || !invitation || !faq) problems.push(`structure not as expected: heroTitle ${!!heroTitle}, tagline ${!!tagText}, main ${!!main}, #invitation ${!!invitation}, all-on-4 #faq ${!!faq}`)
const changed = [], added = []

// 1. keyword H1
if (!problems.length) {
  if (tagText.props.tag !== 'h1' || tagText.props.text !== H1_TEXT) { tagText.props = { ...tagText.props, tag: 'h1', text: H1_TEXT }; changed.push(tagText.id) }
  if (heroTitle.props.customTag !== 'p') { heroTitle.props = { ...heroTitle.props, customTag: 'p' }; changed.push(heroTitle.id) }
}
const base = rule('h1, h2, h3, h4'), arrH1 = rule('.section_arrival h1'), arrEm = rule('.section_arrival h1 em')
if (!base || !arrH1 || !arrEm) problems.push('heading rules not found: the headline look cannot be carried to a <p>')
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o?.[k] !== undefined).map((k) => [k, o[k]]))
const NEW_RULES = base && arrH1 && arrEm ? [
  ['.section_arrival p#heroTitle', { ...pick(base.styles, ['fontFamily', 'fontWeight', 'lineHeight', 'letterSpacing', 'color']), ...arrH1.styles }, arrH1.contextStyles || {}, arrH1.order + 0.1],
  ['.section_arrival p#heroTitle em', { ...arrEm.styles }, arrEm.contextStyles || {}, arrEm.order + 0.1],
  ['.section_arrival h1.text-style-tagline', { fontSize: 'var(--label)', maxWidth: 'none', lineHeight: 'inherit' }, {}, arrEm.order + 0.2],
] : []

// 2. the local FAQ: clone /all-on-4 #faq with fresh ids, then rewrite it
if (!problems.length && !already) {
  const map = new Map()
  const cloneTree = (id, parentId) => {
    const src = A[id], nid = nanoid()
    map.set(id, nid)
    const n = structuredClone(src)
    n.id = nid; n.parentId = parentId; n.children = []
    nodes[nid] = n; added.push(nid)
    for (const c of src.children || []) n.children.push(cloneTree(c, nid))
    return nid
  }
  const secId = cloneTree(faq.id, main.id)
  const sec = nodes[secId]
  sec.props = { ...sec.props, htmlAttributes: { ...sec.props.htmlAttributes, id: 'local-faq' } }
  const sub = (root) => { const out = []; const w = (id) => { out.push(nodes[id]); (nodes[id].children || []).forEach(w) }; w(root); return out }
  const all = sub(secId)
  const tagline = all.find((n) => n.moduleId === 'base.text' && n.props.tag === 'span')
  const h2 = all.find((n) => n.moduleId === 'base.text' && n.props.tag === 'h2')
  tagline.props = { ...tagline.props, text: FAQ_TAGLINE }
  h2.props = { ...h2.props, text: FAQ_HEADING }
  const list = all.find((n) => n.props?.customTag !== 'details' && (n.children || []).some((c) => nodes[c]?.props?.customTag === 'details'))
  const items = list.children.map((c) => nodes[c])
  const drop = (id) => { for (const n of sub(id)) { delete nodes[n.id]; const i = added.indexOf(n.id); if (i >= 0) added.splice(i, 1) } }
  for (const it of items) drop(it.id)
  list.children = []
  // templates from /all-on-4 itself: its first <details> item and the "read on" link inside its #faq
  const inFaq = (n) => { for (let p = n; p; p = A[p.parentId]) if (p.id === faq.id) return true; return false }
  const srcItem = Object.values(A).find((n) => n.props?.customTag === 'details' && inFaq(n))
  const linkSrc = Object.values(A).find((n) => n.moduleId === 'base.link' && inFaq(n))
  // one item per question: details > summary > text, answer div > text [+ link]
  for (const [q, a, link] of FAQ) {
    const dId = cloneTree(srcItem.id, list.id)
    const d = nodes[dId]
    const [sumId, ansId] = d.children
    const sum = nodes[sumId], ans = nodes[ansId]
    nodes[sum.children[0]].props = { ...nodes[sum.children[0]].props, text: q }
    for (const extra of ans.children.slice(1)) drop(extra)
    ans.children = ans.children.slice(0, 1)
    nodes[ans.children[0]].props = { ...nodes[ans.children[0]].props, tag: 'none', text: a }
    if (link && linkSrc) {
      const lid = nanoid()
      nodes[lid] = { ...structuredClone(linkSrc), id: lid, parentId: ansId, children: [] }
      nodes[lid].props = { ...nodes[lid].props, href: link[1], text: link[0] }
      ans.children.push(lid); added.push(lid)
    }
    list.children.push(dId)
  }
  main.children = [...main.children]
  main.children.splice(main.children.indexOf(invitation.id), 0, secId)
  changed.push(main.id)
}
for (const n of Object.values(nodes)) if (!Array.isArray(n.children)) n.children = []

// ── plan ──────────────────────────────────────────────────────────────────────
console.log(`${APPLY ? 'APPLY' : 'PLAN'} on ${BASE} — home row ${home.id}`)
console.log(`  status   ${JSON.stringify(status)}`)
console.log(`  h1       tagline -> <h1> "${H1_TEXT}"; #heroTitle -> <p>`)
console.log(`  faq      ${already ? '#local-faq already present: skipped' : `#local-faq, ${FAQ.length} questions, before #invitation`} (${added.length} new nodes)`)
for (const [s, st] of NEW_RULES) console.log(`  rule     ${s} ${JSON.stringify(st)}`)
for (const p of problems) console.log(`  !! ${p}`)
if (!APPLY) process.exit(problems.length ? 1 : 0)
if (problems.length) { console.error('REFUSING: problems above'); process.exit(1) }
if (status.draftMatchesPublished !== true) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }

// ── backup, write ─────────────────────────────────────────────────────────────
const BK = join(resolve('output/schema/backups'))
mkdirSync(BK, { recursive: true })
const bf = join(BK, `home-faq-${new URL(BASE).hostname}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
writeFileSync(bf, JSON.stringify({ row: home, styleRules: shell0.styleRules }))
console.log(`  backup   ${bf}`)
const shellNext = structuredClone(shell0)
let rulesAdded = 0
for (const [selector, styles, contextStyles, order] of NEW_RULES) {
  if (Object.values(shellNext.styleRules).some((r) => r.selector === selector)) continue
  const id = nanoid(), t = Date.now()
  shellNext.styleRules[id] = { id, name: selector, kind: 'ambient', selector, order, styles, contextStyles, createdAt: t, updatedAt: t }
  rulesAdded++
}
const { site: sh, seq } = await getSite()
await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: { ...sh, styleRules: shellNext.styleRules },
  changedPages: [toChangedPage(home, { nodes })],
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: { [home.id]: home.seq }, shellBaseSeq: seq,
})
console.log(`  wrote    home + ${rulesAdded} rule(s)`)

// ── read back ─────────────────────────────────────────────────────────────────
const keep = Object.fromEntries(['seoTitle', 'seoDescription'].filter((k) => home.cells[k] !== undefined).map((k) => [k, home.cells[k]]))
let back = (await api('GET', `/admin/api/cms/data/rows/${home.id}`)).row
if (Object.entries(keep).some(([k, v]) => back.cells[k] !== v)) {
  await api('PATCH', `/admin/api/cms/data/rows/${home.id}`, { cells: { ...back.cells, ...keep } })
  back = (await api('GET', `/admin/api/cms/data/rows/${home.id}`)).row
  console.log('  seo      seoTitle + seoDescription re-applied')
}
const bad = []
const an = back.cells.body.nodes
for (const [id, n] of Object.entries(N0)) {
  if (changed.includes(id)) { if (!isDeepStrictEqual(an[id], nodes[id])) bad.push(`node ${id} differs from plan`); continue }
  if (!isDeepStrictEqual(an[id], n)) bad.push(`untouched node ${id} changed`)
}
for (const id of added) if (!isDeepStrictEqual(an[id], nodes[id])) bad.push(`new node ${id} not as written`)
if (Object.keys(an).length !== Object.keys(N0).length + added.length) bad.push(`node count ${Object.keys(N0).length} + ${added.length} -> ${Object.keys(an).length}`)
for (const k of ['title', 'seoTitle', 'seoDescription', 'slug']) if (back.cells[k] !== home.cells[k]) bad.push(`cell ${k} changed`)
const { site: shell1 } = await getSite()
for (const [selector, styles] of NEW_RULES) { const r = Object.values(shell1.styleRules).find((x) => x.selector === selector); if (!r || !isDeepStrictEqual(r.styles, styles)) bad.push(`rule ${selector} did not read back`) }
for (const b of bad.slice(0, 20)) console.log(`  !! ${b}`)
if (bad.length) { console.log(`READ-BACK FAILED (${bad.length}) — restore from ${bf}`); process.exit(1) }
console.log('  readback clean: only the planned nodes and rules differ')
if (PUBLISH) { const r = await publish(); console.log(`published ${JSON.stringify(r)}`) } else console.log('draft only — pass --publish (or publish with insta-api) after checking')
