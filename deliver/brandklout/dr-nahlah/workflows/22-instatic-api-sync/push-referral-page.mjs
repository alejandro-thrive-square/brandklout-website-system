#!/usr/bin/env node
/**
 * push-referral-page.mjs — /doctor-referral in Stone's /patient-forms order, with the
 * practice's printed referral form as a native form (Asana 1219086723228800, 2026-10-02).
 *
 *   node push-referral-page.mjs             # plan only, against INSTATIC_BASE_URL (production)
 *   node push-referral-page.mjs --apply     # upload the preview card, write the DRAFT
 *   node push-referral-page.mjs --publish   # publish, only if this page is the draft's ONLY difference
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com node push-referral-page.mjs ...
 *
 * Source of truth: 04-design/.tmp/site-src/pages/doctor-referral.body.html (#hero buttons,
 * #referral-forms, #referral-form) and partials/referral-form.html (the form snippet).
 *
 * What changes on the page, and nothing else:
 *   1. any earlier #referral-forms / #referral-form is dropped (staging had the GHL-builder
 *      form section for a few hours on 2026-10-02);
 *   2. the two hero buttons: "Refer a patient" -> #referral-form, "Download the referral
 *      form" -> /patient-referral-form.pdf;
 *   3. #referral-forms after #hero: a fresh-id clone of THIS page's #study-club split
 *      (minus .pk-split-rev and the drift), the preview card, the copy, and two buttons
 *      cloned from the hero's;
 *   4. #referral-form after that: a .pk-light section, a clone of #refer's .pk-head, and the
 *      contact page's embed slot + embed-origins node carrying the form snippet. The module's
 *      compatible CSP is what lets the snippet's inline <script> run;
 *   5. #patient-reviews after the form: a .pk.pk-alt section holding a fresh-id clone of the
 *      HOME page's #reviews block (heading, Google score, the ReputationHub Embed node, the
 *      patient-stories link);
 *   6. the six sections that followed are dropped (client, 2026-10-02: "they don't serve any
 *      purpose there"): experience, capability, study-club, refer, next, book.
 * The PDFs are not Instatic media (it refuses PDFs): /patient-referral-form.pdf and
 * /about-dr-nahlah.pdf are drnahlah_301 rows to the drnahlah-files Worker
 * (14-migration-seo-redirects/deploy-referral-pdfs.mjs, add-referral-pdf-redirects.mjs).
 */
import { randomBytes, createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, getSite, getPages, requestForm, BASE } from './sedation-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const SITE_SRC = join(HERE, '../04-design/.tmp/site-src')
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const HOST = new URL(BASE).host
const DST = 'doctor-referral'
const CARD = 'referral-form-card.jpg'
const CARD_ALT = "The practice's printed patient referral form"
mkdirSync(join(HERE, '.tmp/referral'), { recursive: true })
const STATE = join(HERE, `.tmp/referral/state-${HOST}.json`)

const slugOf = (r) => r.cells?.slug ?? r.slug
const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex')
const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = () => { const b = randomBytes(21); let s = ''; for (let i = 0; i < 21; i++) s += ALPHABET[b[i] & 63]; return s }
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/&middot;/g, '·').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim()

// ── the local source ────────────────────────────────────────────────────────
const body = readFileSync(join(SITE_SRC, 'pages/doctor-referral.body.html'), 'utf8').replace(/\r\n/g, '\n')
const section = (id) => body.match(new RegExp(`<section class="[^"]*" id="${id}">([\\s\\S]*?)</section>`))?.[1] ?? (() => { throw new Error(`no #${id} in the source`) })()
const hero = section('hero'), forms = section('referral-forms'), online = section('referral-form')
const buttons = (html) => [...html.matchAll(/<a class="btn ([^"]+)" href="([^"]+)"([^>]*)><span>([\s\S]*?)<\/span><\/a>/g)]
  .map((m) => ({ cls: m[1], href: m[2], target: /target="_blank"/.test(m[3]) ? '_blank' : '_self', label: strip(m[4]) }))
const HERO_BTNS = buttons(hero)
const FORMS = {
  label: strip(forms.match(/<span class="label">([\s\S]*?)<\/span>/)[1]),
  h2: strip(forms.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)[1]),
  p: strip(forms.match(/<p data-rv>([\s\S]*?)<\/p>/)[1]),
  btns: buttons(forms),
}
const ONLINE = {
  label: strip(online.match(/<span class="label">([\s\S]*?)<\/span>/)[1]),
  h2: strip(online.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)[1]),
  p: strip(online.match(/<div class="pk-head">[\s\S]*?<p>([\s\S]*?)<\/p>/)[1]),
}
/* 2026-10-03: the GHL survey (HIPAA, Sung), replacing the native webhook form that
   partials/referral-form.html still holds. The header comment is not shipped. */
const SNIPPET = readFileSync(join(SITE_SRC, 'partials/referral-survey.html'), 'utf8').replace(/\r\n/g, '\n').replace(/<!--[\s\S]*?-->/g, '').trim()
/* #referral-forms carries one button since 2026-10-05 (client dropped "About Dr. Nahlah (PDF)"). */
if (HERO_BTNS.length !== 2 || FORMS.btns.length !== 1) throw new Error('expected two buttons in #hero and one in #referral-forms')
if (!/widget\/survey\/KXFNR4JPqxonXEFTtme0/.test(SNIPPET) || !/form_embed\.js/.test(SNIPPET)) throw new Error('survey snippet lacks its iframe or form_embed.js')

// ── read ────────────────────────────────────────────────────────────────────
console.log(HOST, APPLY ? '(apply)' : PUBLISH ? '(publish)' : '(plan)')
const status = await api('GET', '/admin/api/cms/publish/status')
const rows = (await getPages()).rows
const dst = rows.find((r) => slugOf(r) === DST)
const contact = rows.find((r) => slugOf(r) === 'contact-mclean')
const home = rows.find((r) => slugOf(r) === 'index')
if (!dst || !contact || !home) throw new Error(`/${DST}, /contact-mclean or the home page missing on ${HOST}`)
const others = Object.fromEntries(rows.filter((r) => r.id !== dst.id).map((r) => [r.id, r.seq]))
const { site: shell0, seq: shellSeq0 } = await getSite()
console.log(`  status   ${JSON.stringify(status)}`)

if (PUBLISH) {
  if (!existsSync(STATE)) { console.error('no --apply state for this host'); process.exit(1) }
  const st = JSON.parse(readFileSync(STATE, 'utf8'))
  const moved = Object.entries(others).filter(([id, s]) => st.others[id] !== s).map(([id]) => slugOf(rows.find((r) => r.id === id)))
  const shellNow = sha(shell0)
  console.log(`  rows     moved since apply: ${moved.length ? moved.join(', ') : 'none'}; /${DST} seq ${dst.seq} (apply wrote ${st.pageSeq})`)
  console.log(`  shell    ${shellNow === st.shellAfter ? 'unchanged since apply' : 'CHANGED since apply'}`)
  if (moved.length || shellNow !== st.shellAfter || dst.seq !== st.pageSeq) {
    console.error('REFUSING TO PUBLISH: the draft holds something other than this page'); process.exit(1)
  }
  const r = await api('POST', '/admin/api/cms/publish', {})
  console.log('published', JSON.stringify(r).slice(0, 300))
  console.log('after', JSON.stringify(await api('GET', '/admin/api/cms/publish/status')))
  process.exit(0)
}
if (!status.draftMatchesPublished) {
  console.error('REFUSING: the draft already differs from live — someone else has unpublished work here'); process.exit(1)
}

// ── build ───────────────────────────────────────────────────────────────────
const classOf = Object.fromEntries(Object.values(shell0.styleRules).filter((r) => r.kind === 'class').map((r) => [r.id, r.name]))
const classId = (name) => { const id = Object.keys(classOf).find((k) => classOf[k] === name); if (!id) throw new Error(`no class .${name}`); return id }
const has = (n, c) => (n.classIds ?? []).some((id) => classOf[id] === c)
const nodes = structuredClone(dst.cells.body.nodes)
const byHtmlId = (ns, id) => Object.values(ns).find((n) => n.props?.htmlAttributes?.id === id)
const under = (ns, root) => { const out = []; const w = (id) => { out.push(ns[id]); for (const c of ns[id].children ?? []) w(c) }; w(root.id); return out }
const drop = (id) => { for (const c of nodes[id].children ?? []) drop(c); delete nodes[id] }

/* fresh-id clone of a subtree from `src` into `nodes`, parented under `parentId` */
function clone(src, rootId, parentId) {
  const map = new Map(); const collect = (id) => { map.set(id, nanoid()); for (const c of src[id].children ?? []) collect(c) }
  collect(rootId)
  for (const [oldId, id] of map) {
    const n = structuredClone(src[oldId])
    nodes[id] = { ...n, id, parentId: oldId === rootId ? parentId : map.get(n.parentId), children: (n.children ?? []).map((c) => map.get(c)) }
  }
  return nodes[map.get(rootId)]
}
const mk = (parentId, moduleId, props, classIds = []) => {
  const n = { id: nanoid(), moduleId, props: { htmlAttributes: {}, ...props }, breakpointOverrides: {}, children: [], classIds, parentId }
  nodes[n.id] = n; if (parentId) nodes[parentId].children.push(n.id); return n
}

/* UPDATE mode: the page already has the new layout (its source sections are gone), so
   only the form snippet is refreshed in place. */
const UPDATE = !byHtmlId(nodes, 'study-club') && !!byHtmlId(nodes, 'referral-form')
let img = null
if (UPDATE) {
  const e = under(nodes, byHtmlId(nodes, 'referral-form')).find((n) => /embed-origins\.embed$/.test(n.moduleId))
  const same = e.props.snippet === SNIPPET
  e.props = { ...e.props, snippet: SNIPPET }
  console.log(`  update   page already restructured; form snippet ${same ? 'unchanged' : 'replaced'} (${SNIPPET.length} chars)`)
  if (same) { console.log('nothing to do'); process.exit(0) }
} else {
// 1. earlier attempts
let dropped = 0
for (const id of ['referral-forms', 'referral-form', 'patient-reviews']) {
  const s = byHtmlId(nodes, id)
  if (s) { const p = nodes[s.parentId]; p.children = p.children.filter((c) => c !== s.id); drop(s.id); dropped++ }
}

// 2. hero buttons
const heroSec = byHtmlId(nodes, 'hero')
const heroBtns = under(nodes, heroSec).filter((n) => n.moduleId === 'base.button')
if (heroBtns.length !== 2) throw new Error(`hero has ${heroBtns.length} buttons`)
heroBtns.forEach((b, i) => { b.props = { ...b.props, label: HERO_BTNS[i].label, href: HERO_BTNS[i].href, target: HERO_BTNS[i].target } })

// 3. #referral-forms from #study-club
const club = byHtmlId(nodes, 'study-club')
const parent = nodes[heroSec.parentId]
const secA = clone(nodes, club.id, parent.id)
secA.props.htmlAttributes = { ...secA.props.htmlAttributes, id: 'referral-forms' }
const A = () => under(nodes, secA)
const split = A().find((n) => has(n, 'pk-split'))
split.classIds = split.classIds.filter((c) => classOf[c] !== 'pk-split-rev')
img = A().find((n) => n.moduleId === 'base.image')
const copy = A().find((n) => has(n, 'sp-copy'))
A().find((n) => n.moduleId === 'base.text' && n.props.tag === 'span' && has(n, 'label')).props.text = FORMS.label
A().find((n) => n.moduleId === 'base.text' && n.props.tag === 'h2').props.text = FORMS.h2
const keep = copy.children.slice(0, 2) // chapter-tag, h2
for (const c of copy.children.slice(2)) drop(c)
copy.children = keep
mk(copy.id, 'base.text', { text: FORMS.p, tag: 'p', htmlAttributes: { 'data-rv': '' } })
const actions = mk(copy.id, 'base.container', { tag: 'div', customTag: '', htmlAttributes: { 'data-rv': '' } }, [classId('ph-actions')])
FORMS.btns.forEach((b, i) => {
  const c = clone(nodes, heroBtns[i].id, actions.id); actions.children.push(c.id)
  c.props = { ...c.props, label: b.label, href: b.href, target: b.target }
})

// 4. #referral-form
const refer = byHtmlId(nodes, 'refer')
const secB = mk(null, 'base.container', { tag: 'section', customTag: '', htmlAttributes: { id: 'referral-form' } }, [classId('pk'), classId('pk-light')])
secB.parentId = parent.id
const wrapSrc = nodes[refer.children[0]]
const wrap = mk(secB.id, 'base.container', { ...structuredClone(wrapSrc.props) }, [...wrapSrc.classIds])
const headSrc = under(nodes, refer).find((n) => has(n, 'pk-head'))
const head = clone(nodes, headSrc.id, wrap.id); wrap.children.push(head.id)
const H = under(nodes, head)
H.find((n) => has(n, 'label')).props.text = ONLINE.label
H.find((n) => n.moduleId === 'base.text' && n.props.tag === 'h2').props.text = ONLINE.h2
H.find((n) => n.moduleId === 'base.text' && n.props.tag === 'p').props.text = ONLINE.p
const cNodes = contact.cells.body.nodes
const cEmbed = Object.values(cNodes).find((n) => /embed-origins\.embed$/.test(n.moduleId))
const slot = clone(cNodes, cEmbed.parentId, wrap.id); wrap.children.push(slot.id)
const embed = under(nodes, slot).find((n) => /embed-origins\.embed$/.test(n.moduleId))
embed.props = { ...embed.props, source: 'snippet', snippet: SNIPPET, title: 'Patient referral survey', fit: 'auto', height: 1500, lazy: false }

// 5. #patient-reviews from the home page's #reviews
const hNodes = home.cells.body.nodes
const hReviews = byHtmlId(hNodes, 'reviews')
if (!hReviews || !under(hNodes, hReviews).some((n) => /embed-origins\.embed$/.test(n.moduleId) && /reputationhub/.test(n.props.snippet ?? ''))) {
  throw new Error('home #reviews has no ReputationHub embed')
}
const secC = mk(null, 'base.container', { tag: 'section', customTag: '', htmlAttributes: { id: 'patient-reviews' } }, [classId('pk'), classId('pk-alt')])
secC.parentId = parent.id
const wrapC = mk(secC.id, 'base.container', { ...structuredClone(wrapSrc.props) }, [...wrapSrc.classIds])
const rv = clone(hNodes, hReviews.id, wrapC.id); wrapC.children.push(rv.id)

// 6. the six sections below the form
const GONE = ['experience', 'capability', 'study-club', 'refer', 'next', 'book']
for (const id of GONE) {
  const s = byHtmlId(nodes, id)
  if (!s) throw new Error(`no #${id} to drop`)
  parent.children = parent.children.filter((c) => c !== s.id); drop(s.id)
}

// order: hero, referral-forms, referral-form, patient-reviews
parent.children = parent.children.filter((c) => ![secA.id, secB.id, secC.id].includes(c))
parent.children.splice(parent.children.indexOf(heroSec.id) + 1, 0, secA.id, secB.id, secC.id)

console.log(`  hero     ${HERO_BTNS.map((b) => `"${b.label}" -> ${b.href}`).join(' · ')}`)
console.log(`  dropped  ${dropped} earlier section(s)`)
}

// ── checks ──────────────────────────────────────────────────────────────────
const all = Object.values(nodes)
const orphans = all.filter((n) => n.parentId && !nodes[n.parentId]).length
const dangling = all.flatMap((n) => n.children).filter((c) => !nodes[c]).length
const flat = JSON.stringify(Object.values(nodes).map((n) => n.props))
const leftovers = ['Study Club', 'Thank you for the partnership', 'flexbook', 'axgcdqEPUFoHF8Dt5Nji', 'NZgQWT70a54fLzOUe1b0', 'Continuing Education'].filter((s) => flat.includes(s))
const order = nodes[byHtmlId(nodes, 'hero').parentId].children.map((c) => nodes[c].props?.htmlAttributes?.id ?? '?').join(' > ')
console.log(`  page     /${DST} ${dst.id} seq ${dst.seq}: ${Object.keys(dst.cells.body.nodes).length} -> ${all.length} nodes`)
console.log(`  forms    "${FORMS.h2}" · ${FORMS.btns.map((b) => b.href).join(', ')} · card ${CARD}`)
console.log(`  online   "${ONLINE.h2}" · snippet ${SNIPPET.length} chars`)
console.log(`  order    ${order}`)
console.log(`  checks   orphans ${orphans}; dangling ${dangling}; leftovers: ${leftovers.length ? leftovers.join(', ') : 'none'}`)
if (orphans || dangling || leftovers.length) process.exit(1)
if (!APPLY) { console.log('\nplan only — pass --apply'); process.exit(0) }

// ── write: the preview card, then the page ─────────────────────────────────
if (img) {
let asset = ((await api('GET', '/admin/api/cms/media')).assets ?? []).find((a) => (a.filename ?? a.publicPath ?? '').endsWith(CARD))
if (!asset) {
  const f = new FormData()
  f.append('file', new File([readFileSync(join(SITE_SRC, 'assets', CARD))], CARD, { type: 'image/jpeg' }))
  asset = (await requestForm('/admin/api/cms/media', f))?.asset
  if (!asset?.publicPath) { console.error('card upload failed'); process.exit(1) }
}
if (asset.altText !== CARD_ALT) await api('PATCH', `/admin/api/cms/media/${asset.id}`, { altText: CARD_ALT })
console.log(`  card     ${asset.publicPath} (alt set)`)
img.props = { ...img.props, src: asset.publicPath, loading: 'lazy', htmlAttributes: {} }
}

const shellBefore = sha(shell0)
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: shell0,
  changedPages: [{ id: dst.id, slug: DST, title: dst.cells.title, nodes, rootNodeId: dst.cells.body.rootNodeId }],
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: { [dst.id]: dst.seq }, shellBaseSeq: shellSeq0,
})
console.log(`  saved    ${JSON.stringify(res).slice(0, 120)}`)
const rowsAfter = (await getPages()).rows
const back = rowsAfter.find((r) => r.id === dst.id)
const bn = back.cells.body.nodes
const ok = Object.keys(bn).length === all.length && byHtmlId(bn, 'referral-forms') && byHtmlId(bn, 'referral-form') &&
  byHtmlId(bn, 'patient-reviews') && Object.values(bn).some((n) => /embed-origins\.embed$/.test(n.moduleId) && n.props.snippet === SNIPPET) &&
  Object.values(bn).some((n) => /embed-origins\.embed$/.test(n.moduleId) && /reputationhub/.test(n.props.snippet ?? '')) &&
  !['experience', 'capability', 'study-club', 'refer', 'next', 'book'].some((id) => byHtmlId(bn, id))
const othersAfter = Object.fromEntries(rowsAfter.filter((r) => r.id !== dst.id).map((r) => [r.id, r.seq]))
const movedByUs = Object.keys(others).filter((id) => others[id] !== othersAfter[id])
const shellAfter = sha((await getSite()).site)
console.log(`  read     ${Object.keys(bn).length} nodes, sections + snippet ${ok ? 'present' : 'MISSING'}; other rows moved: ${movedByUs.length}; shell ${shellAfter === shellBefore ? 'identical' : 'DIFFERS'}`)
if (!ok) process.exit(1)
writeFileSync(STATE, JSON.stringify({ pageSeq: back.seq, others: othersAfter, shellAfter, at: new Date().toISOString() }, null, 1))
console.log(`  status   ${JSON.stringify(await api('GET', '/admin/api/cms/publish/status'))}`)
console.log('draft only — re-run with --publish')
