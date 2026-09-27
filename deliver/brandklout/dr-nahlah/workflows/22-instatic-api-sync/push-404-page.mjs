#!/usr/bin/env node
/**
 * Create the site's 404 page and wire it to Instatic's `notFound` template target.
 *
 * ── WHY A TEMPLATE, NOT A PAGE ────────────────────────────────────────────
 * Instatic serves public 404s from whichever page carries
 * `template.target = { kind: 'notFound' }`. On publish, `publishSite.ts` bakes
 * that page (wrapped in its `everywhere` chain, of which this site has none) to
 * the `404.html` artefact; `renderNotFoundResponse` in `publish/publicRouter.ts`
 * then serves it with a real **status 404** for every GET no route claimed.
 * Without one, the dispatcher falls through to a bare `{"error":"Not found"}`
 * JSON body — which is what both drnahlah.com and staging.drnahlah.com served
 * before this script.
 *
 * A template page is deliberately NOT baked at its own slug
 * (`isTemplatePage(page) -> continue` in publishSite), so slug `404` cannot
 * collide with the `404.html` artefact and the page never appears as an
 * ordinary route.
 *
 * ── HOW THE BODY IS BUILT ─────────────────────────────────────────────────
 * This site has exactly ONE template (`post`, for the 43 articles) and no
 * `everywhere` layout, so every page carries its own header, drawer and footer
 * nodes. The 404 page therefore CLONES an existing page's chrome — `about`,
 * because its hero is the only one that already contains a `.ph-actions` CTA
 * row — keeps `header#nav`, `#drawer`, `#smooth-wrapper` and `footer` byte for
 * byte, strips every `main` section except the hero, and rebuilds the hero from
 * the site's own class ids. Nothing new is added to the style registry.
 *
 * Node ids are REMAPPED to fresh ones. They are page-scoped, but the runtime
 * hole manifest and the editor both key on them, and two pages sharing ids is a
 * class of bug nobody wants to debug later.
 *
 * ── TRAPS ─────────────────────────────────────────────────────────────────
 *  1. `INSTATIC_BASE_URL` in the repo `.env` points at **production**. Always
 *     pass it explicitly. This script REFUSES to run without it.
 *  2. `insta-api.mjs` caches one session cookie in `.tmp/.session` with no
 *     regard for which host it came from. Switching environments reuses the
 *     other one's cookie; we delete it up front.
 *  3. `PUT /site-document` REPLACES a page's cells. `insta-api`'s
 *     `backfillTemplates` guards other pages, but we re-assert the whole
 *     template map afterwards anyway — this is the save shape that un-templated
 *     `post` and 404'd all 43 articles on 2026-08-25.
 *  4. The published `<title>` comes from `page.title` (see push-page-seo.mjs).
 *     `seo-head.js` returns early on an unknown path, and a 404 URL is by
 *     definition unknown, so the static title is the ONLY title this page gets.
 *
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com node push-404-page.mjs
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com node push-404-page.mjs --apply
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com node push-404-page.mjs --apply --publish
 */
import { existsSync, unlinkSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { api, getSite, getPages, publish, templateMap, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const TMP = join(HERE, '.tmp')
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')

if (!process.env.INSTATIC_BASE_URL) {
  console.error('refusing to run: set INSTATIC_BASE_URL explicitly (the .env default is PRODUCTION)')
  process.exit(2)
}
// Trap 2: the session cache is shared across hosts.
const SESSION = join(TMP, '.session')
if (existsSync(SESSION)) unlinkSync(SESSION)

const SLUG = '404'
const TITLE = 'Page Not Found | Dr. Nahlah Implants & Prosthodontics'
const DONOR = 'about'

/**
 * Class ids resolved from the live shell — never invent one.
 *
 * These are ids, not names, and an id is only meaningful on the site it came
 * from. Staging is a clone of production so the two agree today, but a clone is
 * a snapshot: nothing keeps them in step, and a wrong id is SILENT — the node
 * publishes with a class that resolves to no rule, so the page renders
 * completely unstyled rather than erroring. `assertClasses()` below refuses to
 * build unless every id resolves to the selector recorded here, on the host
 * actually being written.
 */
const CLS = {
  hero:       ['eq8IgdsWzTzXpSRXBCfL5', '.pg-hero'],
  phBg:       ['qFTCVNOFbRjbh1eowihSz', '.pg-hero .ph-bg'],
  wrap:       ['K-ZQdXR7EGEfTH5WswR7X', '.wrap'],
  phIn:       ['5jSxlxiO-1kEhpqttw_8T', '.pg-hero .ph-in'],
  crumb:      ['zIYeFkOm6K3YPa_l-4sGg', '.pk-crumb'],
  lead:       ['t7ELFvmSpy546dJCdWAOf', '.pg-hero .ph-lead'],
  actions:    ['VjVu0I8ikPAxREOrSIL2L', '.pg-hero .ph-actions'],
  meta:       ['L8OiZiU6OTPD65R1YgVIg', '.pg-hero .ph-meta'],
  btn:        ['nZGdD3S928UgOLCXXNrGW', '.btn'],
  btnPrimary: ['383EorqrucaKZ2ATMr7dt', '.btn-primary'],
  btnGhost:   ['WYkpuaU-mfZl1HbanXfe7', '.btn-ghost'],
  magnetic:   ['QJ1IomemcTdwByUz7dBGr', '.magnetic'],
}

async function assertClasses() {
  const { site } = await getSite()
  const rules = site.styleRules ?? {}
  const wrong = []
  for (const [key, [id, selector]] of Object.entries(CLS)) {
    const actual = rules[id]?.selector
    if (actual !== selector) wrong.push(`${key}: ${id} is ${actual ? `"${actual}"` : 'MISSING'}, expected "${selector}"`)
  }
  if (wrong.length) {
    console.error(`style registry on ${BASE} does not match this script:\n  ${wrong.join('\n  ')}`)
    process.exit(1)
  }
  console.log(`  classes      ${Object.keys(CLS).length}/${Object.keys(CLS).length} resolve on this host`)
  // Collapse to plain ids for the builders below.
  for (const k of Object.keys(CLS)) CLS[k] = CLS[k][0]
}
const HERO_IMAGE = '/uploads/2C20pz3ECCoUqdKZUeTEm-interior.jpg'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'
function nid(len = 21) {
  let s = ''
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return s
}

// ── read the donor ─────────────────────────────────────────────────────────
const pages = (await getPages()).rows
if (pages.some((p) => p.slug === SLUG)) {
  console.error(`a page with slug "${SLUG}" already exists on ${BASE} — delete it or rerun against a clean site`)
  process.exit(1)
}
const donorRow = pages.find((p) => p.slug === DONOR)
if (!donorRow) { console.error(`donor page "${DONOR}" not found on ${BASE}`); process.exit(1) }
const donor = (await api('GET', `/admin/api/cms/data/rows/${donorRow.id}`)).row
const src = donor.cells.body.nodes
const srcRoot = donor.cells.body.rootNodeId

// ── locate the chrome landmarks ────────────────────────────────────────────
const findByAttrId = (v) => Object.keys(src).find((id) => src[id].props?.htmlAttributes?.id === v)
const smoothContent = findByAttrId('smooth-content')
if (!smoothContent) { console.error('donor has no #smooth-content'); process.exit(1) }
const mainId = (src[smoothContent].children ?? []).find((id) => src[id].props?.tag === 'main')
if (!mainId) { console.error('donor has no <main>'); process.exit(1) }

// ── copy the donor tree, keeping ONLY the chrome ───────────────────────────
const nodes = {}
function copy(id, parentId) {
  const n = src[id]
  if (!n) return
  nodes[id] = {
    ...n,
    props: structuredClone(n.props ?? {}),
    breakpointOverrides: structuredClone(n.breakpointOverrides ?? {}),
    classIds: [...(n.classIds ?? [])],
    children: [...(n.children ?? [])],
    parentId,
  }
  for (const c of nodes[id].children) copy(c, id)
}
copy(srcRoot, null)

function prune(id) {
  for (const c of nodes[id]?.children ?? []) prune(c)
  delete nodes[id]
}
// Drop every donor <main> section; the rebuilt hero is attached below.
for (const secId of [...nodes[mainId].children]) prune(secId)
nodes[mainId].children = []

// ── refuse to build against a site whose registry or media differ ──────────
await assertClasses()
// The hero image is an upload id, and upload ids are per-site. Staging was
// cloned from production so they agree today, but a missing image publishes as
// a broken <img>, not an error.
const img = await fetch(`${BASE}${HERO_IMAGE}`, { method: 'HEAD' })
if (!img.ok) {
  console.error(`hero image ${HERO_IMAGE} is ${img.status} on ${BASE} — find this site's own upload id`)
  process.exit(1)
}
console.log(`  hero image   ${HERO_IMAGE} -> ${img.status}`)

// ── build the hero ─────────────────────────────────────────────────────────
function add(parentId, node) {
  const id = nid()
  nodes[id] = {
    id,
    moduleId: node.moduleId,
    props: node.props ?? {},
    breakpointOverrides: {},
    classIds: node.classIds ?? [],
    children: [],
    parentId,
  }
  if (parentId) nodes[parentId].children.push(id)
  return id
}
const box = (parent, { tag = 'div', customTag = '', attrs = {}, classIds = [] } = {}) =>
  add(parent, { moduleId: 'base.container', props: { tag, customTag, htmlAttributes: attrs }, classIds })
const txt = (parent, text, { tag = 'none', attrs = {}, classIds = [] } = {}) =>
  add(parent, { moduleId: 'base.text', props: { text, tag, htmlAttributes: attrs }, classIds })
const link = (parent, href, text, { classIds = [] } = {}) =>
  add(parent, { moduleId: 'base.link', props: { href, text, target: '_self', htmlAttributes: {} }, classIds })
const btn = (parent, href, label, classIds) =>
  add(parent, { moduleId: 'base.button', props: { label, href, target: '_self', disabled: false, buttonType: 'button', htmlAttributes: {} }, classIds })

const hero = box(mainId, { tag: 'section', attrs: { id: 'hero' }, classIds: [CLS.hero] })

const bg = box(hero, { classIds: [CLS.phBg] })
add(bg, {
  moduleId: 'base.image',
  props: { src: HERO_IMAGE, loading: 'eager', fetchPriority: 'high', decoding: 'async', htmlAttributes: { 'data-drift': '' } },
})

const inner = box(hero, { classIds: [CLS.wrap, CLS.phIn] })

const crumb = box(inner, { attrs: { 'data-rv': '' }, classIds: [CLS.crumb] })
link(crumb, '/', 'Home')
box(crumb, { tag: 'custom', customTag: 'i' })
txt(crumb, 'Page not found', { tag: 'span' })

const h1 = box(inner, { tag: 'custom', customTag: 'h1', attrs: { 'data-split': '' } })
txt(h1, 'Page ')
txt(h1, 'not found', { tag: 'em' })
txt(h1, '.')

txt(inner, 'The page you were looking for has moved, or it never existed. Nothing is lost — here is the way back.', {
  tag: 'p',
  attrs: { 'data-rv': '' },
  classIds: [CLS.lead],
})

const actions = box(inner, { attrs: { 'data-rv': '' }, classIds: [CLS.actions] })
btn(actions, '/', 'Back to home', [CLS.btn, CLS.btnPrimary, CLS.magnetic])
btn(actions, '/contact#book', 'Book a consultation', [CLS.btn, CLS.btnGhost, CLS.magnetic])

const meta = box(inner, { attrs: { 'data-rv': 'stagger' }, classIds: [CLS.meta] })
const OFFICES = [
  ['tel:+15717029900', '(571) 702-9900', 'McLean · Tysons Corner'],
  ['tel:+15712537790', '(571) 253-7790', 'Alexandria'],
]
for (const [tel, num, office] of OFFICES) {
  const cell = box(meta)
  const b = box(cell, { tag: 'custom', customTag: 'b' })
  link(b, tel, num)
  txt(cell, office, { tag: 'span' })
}

// ── remap every node id ────────────────────────────────────────────────────
const map = new Map(Object.keys(nodes).map((id) => [id, nid()]))
const remapped = {}
for (const [oldId, n] of Object.entries(nodes)) {
  const id = map.get(oldId)
  remapped[id] = {
    ...n,
    id,
    parentId: n.parentId ? map.get(n.parentId) : null,
    children: n.children.map((c) => map.get(c)),
  }
}

const pageId = nid()
const entry = {
  id: pageId,
  slug: SLUG,
  title: TITLE,
  nodes: remapped,
  rootNodeId: map.get(srcRoot),
  template: { enabled: true, target: { kind: 'notFound' }, priority: 100 },
}

console.log(BASE)
console.log(`  donor        ${DONOR} (${Object.keys(src).length} nodes)`)
console.log(`  new page     /${SLUG}  "${TITLE}"`)
console.log(`  template     ${JSON.stringify(entry.template)}`)
console.log(`  nodes        ${Object.keys(remapped).length}`)
writeFileSync(join(TMP, 'page-404.json'), JSON.stringify(entry, null, 2))
console.log('  payload      .tmp/page-404.json')

if (!APPLY) {
  console.log('\ndry run — pass --apply to write, --apply --publish to publish')
  process.exit(0)
}

// ── write ──────────────────────────────────────────────────────────────────
const before = await templateMap()
// `site` is REQUIRED by SiteDocumentBodySchema (additionalProperties: false) even
// when nothing about the shell changes — omit it and the save is a bare
// 400 "Invalid request body". The handler writes the shell only when its content
// actually differs, so shipping the shell we just read is a no-op.
const { site: shell, seq } = await getSite()
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site: shell,
  changedPages: [entry],
  deletedPageIds: [],
  changedComponents: [],
  deletedComponentIds: [],
  changedLayouts: [],
  deletedLayoutIds: [],
  baseSeqs: {},
  shellBaseSeq: seq,
})
console.log(`\nsaved: ${JSON.stringify(res)}`)

// Trap 3: prove nothing else lost its template.
const after = await templateMap()
const lost = Object.keys(before).filter((s) => !after[s])
if (lost.length) {
  console.error(`TEMPLATES LOST: ${lost.join(', ')} — do NOT publish`)
  process.exit(1)
}
console.log(`templates intact: ${Object.keys(after).sort().join(', ')}`)
if (!after[SLUG]) {
  console.error(`the new /${SLUG} page did not save as a template`)
  process.exit(1)
}

if (!PUBLISH) {
  console.log('\nsaved to draft — rerun with --apply --publish to publish')
  process.exit(0)
}
console.log('\npublishing…')
console.log(JSON.stringify(await publish()))
