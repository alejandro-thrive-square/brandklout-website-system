#!/usr/bin/env node
/**
 * apply-bugherd-site.mjs — Brandklout's BugHerd pins on the main site (project 541030, 2026-10-07),
 * written into the LIVE draft as surgical edits (same contract as apply-lp-review.mjs: read the
 * rows, change only the named nodes, write each row against its own seq, guarded publish).
 *
 *   node apply-bugherd-site.mjs                      # dry run
 *   node apply-bugherd-site.mjs --apply              # backup, write the draft
 *   node apply-bugherd-site.mjs --apply --publish    # ...and publish (guarded)
 *
 *   #19 /bone-grafting   "Four ways to put bone back." -> "Three ways to rebuild bone support."
 *   #20 /missing-teeth   "Four choices. Only two put a root back…" -> three options, one root
 *   #22 /faq             cover photo focal point 50% 50% -> 60% 20% (both faces in frame)
 *   #23 /faq             invitation: "Have another question? Request a call from our team."
 *                        (+ the cover button "Ask your own" -> "Request a call")
 *   #24 every page       H1 (.display) in Playfair Display SemiBold: css/05-site-review.css,
 *                        shipped as src/styles/wla-site-review.css with the font URLs resolved
 *   #26 /                answer card 1 (Dental Implants) -> the implant-and-crown render
 *   #27 #36 every page   YouTube link @westlaimplants892 (a 404) -> @westlaimplants
 *   #37 every page       Zocdoc booking-link (opens blank) -> the practice profile
 *   #28 #30 /            experience heading and lead -> the reviewer's copy
 *   #38 /dental-implants "The Reality": smaller statement on the left, the eight dental implant
 *                        services as links on the right (nav.st-services, section[data-st-services])
 */
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { api, getPages, getSite, publish, publishStatus, toChangedPage, templateMap, assertTemplatesIntact, BASE } from '../../tools/instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.resolve(HERE, '../04-design/.tmp/site-src')
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const mediaMap = JSON.parse(fs.readFileSync(path.join(HERE, '.tmp', 'media-map.json'), 'utf8')).map
const media = (k) => { const h = mediaMap[k]; if (!h) throw new Error(`media-map has no ${k}`); return h.url }
const baseName = (src) => String(src ?? '').split('/').pop().replace(/^[A-Za-z0-9_-]{21}-/, '')

const css = fs.readFileSync(path.join(SRC, 'css/05-site-review.css'), 'utf8').replace(/url\('\.\.\/fonts\/([^']+)'\)/g, (m, n) => `url('${media('fonts/' + n)}')`)
const ASSET = { type: 'style', path: 'src/styles/wla-site-review.css', content: css }
const HREF = [
  ['https://www.youtube.com/@westlaimplants892', 'https://www.youtube.com/@westlaimplants'],
  ['https://www.zocdoc.com/booking-link/practice/west-la-implants-65990', 'https://www.zocdoc.com/practice/west-la-implants-65990'],
]
const TEXT = {
  'bone-grafting': [['Four ways to put bone ', 'Three ways to rebuild bone '], ['back.', 'support.', 'em']],
  'missing-teeth': [['Four choices. Only two put a root back in the bone.', 'Three choices. Only one puts a root back in the bone.']],
  faq: [['Ask it here, or at a consultation with the implant team.', 'Request a call from our team.'], ['Ask Your Own', 'Request a Call']],
  index: [
    ['Advanced dentistry, without forgetting the ', 'Advanced dentistry. Care centered on '],
    ['person', 'you.', 'em'],
    ['Nervous patients are the rule here, not the exception. The visit is built to feel calm from the front door to the last appointment.', 'Feeling nervous about dental treatment is common. We take time to listen, explain your options, and help you feel at ease, from your first visit through each step of your care.'],
  ],
}
const SERVICES = [
  ['/dental-implants', 'Dental implants'], ['/all-on-4', 'All-on-4® full arch'], ['/implant-supported-dentures', 'Implant-supported dentures'],
  ['/hybrid-dentures', 'Hybrid fixed dentures'], ['/zirconia-fixed-bridge', 'Zirconia fixed bridge'], ['/failing-dental-implants', 'Failing implants'],
  ['/implant-cost', 'Implant cost'], ['/financing', 'Insurance & financing'],
]

// the server stores node keys in its own order: compare canonically, never by raw JSON
const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b))) : x))
const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => [...randomBytes(n)].map((b) => ALPHABET[b & 63]).join('')

// ── read ──────────────────────────────────────────────────────────────
const start = await publishStatus()
if (!start.draftMatchesPublished) { console.error('REFUSING: the draft already differs from the published site.'); process.exit(1) }
const site = await getSite()
const shell = site.site
const rules = shell.styleRules
const ruleByName = (name) => Object.values(rules).find((r) => r.kind === 'class' && r.name === name)
const nameOf = (id) => rules[id]?.name
const { rows } = await getPages()
const startRows = new Map(rows.map((r) => [r.id, { seq: r.seq, updatedAt: r.updatedAt }]))
const log = []
const note = (s) => { log.push(s); console.log(s) }

// ── shell ─────────────────────────────────────────────────────────────
let shellChanged = false
const have = shell.files.find((f) => f.path === ASSET.path)
if (!have) { const now = new Date().toISOString(); shell.files.push({ id: nanoid(), ...ASSET, createdAt: now, updatedAt: now }); shellChanged = true; note(`shell   + ${ASSET.path}`) }
else if (have.content !== ASSET.content) { have.content = ASSET.content; have.updatedAt = new Date().toISOString(); shellChanged = true; note(`shell   ~ ${ASSET.path}`) }
else note(`shell   ${ASSET.path} exact`)
// class rules for the new services list: names only, the CSS is in the asset
const classRule = (name) => {
  let r = ruleByName(name)
  if (!r) {
    const order = Math.max(0, ...Object.values(rules).map((x) => x.order ?? 0)) + 1
    r = { id: nanoid(), name, kind: 'class', selector: `.${name}`, order, styles: {}, contextStyles: {}, createdAt: Date.now(), updatedAt: Date.now() }
    rules[r.id] = r; shellChanged = true; note(`rule    + .${name}`)
  }
  return r
}
const needRule = (name) => { const r = ruleByName(name); if (!r) throw new Error(`registry has no .${name}`); return r }

// ── pages ─────────────────────────────────────────────────────────────
const changed = []
for (const row of rows) {
  const nodes = row.cells?.body?.nodes
  if (!nodes) continue
  const all = Object.values(nodes)
  let n = 0
  const say = (s) => { n++; note(`/${row.slug}  ${s}`) }

  // links, every page
  for (const x of all.filter((x) => x.moduleId === 'base.link' && typeof x.props?.href === 'string')) {
    const fix = HREF.find(([a]) => x.props.href === a)
    if (fix) { x.props = { ...x.props, href: fix[1] }; say(`link  ${fix[0].split('/').slice(2, 4).join('/')} -> ${fix[1]}`) }
  }

  // copy
  for (const [from, to, tag] of TEXT[row.slug] ?? []) {
    const hit = all.filter((x) => x.moduleId === 'base.text' && x.props?.text === from && (!tag || x.props?.tag === tag))
    if (hit.length === 1) { hit[0].props = { ...hit[0].props, text: to }; say(`text  "${from.slice(0, 36)}…" -> "${to.slice(0, 40)}…"`) }
    else if (all.some((x) => x.props?.text === to)) note(`/${row.slug}  text already "${to.slice(0, 40)}…"`)
    else throw new Error(`/${row.slug}: expected one "${from}" text node, found ${hit.length}`)
  }
  // #28: the heading's third run (" in the chair.") goes
  if (row.slug === 'index') {
    const tail = all.find((x) => x.moduleId === 'base.text' && x.props?.text === ' in the chair.')
    if (tail) {
      const parent = nodes[tail.parentId]
      parent.children = parent.children.filter((c) => c !== tail.id)
      delete nodes[tail.id]
      say('text  " in the chair." removed from the experience heading')
    }
    // #26: answer card 1
    const img = all.find((x) => x.moduleId === 'base.image' && baseName(x.props?.src) === 'still-doctor-xray-screen.jpg' && nodes[nodes[x.parentId]?.parentId] && (nodes[nodes[x.parentId].parentId].classIds ?? []).some((id) => nameOf(id) === 'answer_card'))
    if (img) {
      img.props = { ...img.props, src: media('media/img/dental-implant-crown-placement.png') }
      img.classIds = (img.classIds ?? []).filter((id) => !/^object-position-/.test(nameOf(id) ?? '')).concat(needRule('object-position-50-50').id)
      say('image answer card 1 still-doctor-xray-screen.jpg -> dental-implant-crown-placement.png [fp-50-50]')
    }
  }
  // #22: the faq cover focal point
  if (row.slug === 'faq') {
    const img = all.find((x) => x.moduleId === 'base.image' && (x.classIds ?? []).some((id) => nameOf(id) === 'cover_image'))
    /* the photo was a parallax frame (.par: 124% tall, shifted by scroll), which always hid the top of
       the photo and the doctor's face with it; it now fills its frame, focal point 60% 20% */
    const want = Object.values(rules).find((r) => r.name === 'object-position-60-20')
    if (!want) throw new Error('registry has no .object-position-60-20')
    const par = Object.values(rules).find((r) => r.name === 'parallax_image')
    if (img && (!(img.classIds ?? []).includes(want.id) || (par && img.classIds.includes(par.id)))) {
      img.classIds = (img.classIds ?? []).filter((id) => !/^object-position-/.test(nameOf(id) ?? '') && id !== par?.id).concat(want.id)
      say(`image cover focal -> .${want.name}`)
    }
  }
  // #38: services beside the statement
  if (row.slug === 'dental-implants') {
    const sec = all.find((x) => (x.classIds ?? []).some((id) => nameOf(id) === 'section_statement'))
    const stage = sec && sec.children.map((c) => nodes[c]).find((c) => (c.classIds ?? []).some((id) => nameOf(id) === 'statement_stage'))
    if (!stage) throw new Error('/dental-implants: no .section_statement > .statement_stage')
    if (!('data-st-services' in (sec.props?.htmlAttributes ?? {}))) {
      sec.props = { ...sec.props, htmlAttributes: { ...(sec.props.htmlAttributes ?? {}), 'data-st-services': '' } }
      say('section #statement + data-st-services')
    }
    const listRule = classRule('statement_services'), kRule = classRule('statement_services-label')
    if (!stage.children.some((c) => (nodes[c]?.classIds ?? []).includes(listRule.id))) {
      const nav = { id: nanoid(), moduleId: 'base.container', parentId: stage.id, classIds: [listRule.id], children: [], breakpointOverrides: {}, props: { tag: 'custom', customTag: 'nav', htmlAttributes: { 'aria-label': 'Dental implant services' } } }
      const k = { id: nanoid(), moduleId: 'base.text', parentId: nav.id, classIds: [kRule.id], children: [], breakpointOverrides: {}, props: { text: 'Dental implant services', tag: 'span', htmlAttributes: {} } }
      nodes[nav.id] = nav; nodes[k.id] = k; nav.children.push(k.id)
      for (const [href, text] of SERVICES) {
        const a = { id: nanoid(), moduleId: 'base.link', parentId: nav.id, classIds: [], children: [], breakpointOverrides: {}, props: { href, text, target: '_self', htmlAttributes: href === '/dental-implants' ? { 'aria-current': 'page' } : {} } }
        nodes[a.id] = a; nav.children.push(a.id)
      }
      stage.children.push(nav.id)
      say(`nav.statement_services with ${SERVICES.length} links appended to the statement`)
    }
  }
  if (n) changed.push(row)
}

console.log(`\ntarget ${BASE}  shell ${shellChanged ? 'changed' : 'unchanged'}  pages ${changed.length}`)
if (!APPLY) { console.log('DRY RUN: nothing written. Re-run with --apply.'); process.exit(0) }

// ── backup, write, read back ──────────────────────────────────────────
const dir = path.join(HERE, '.tmp', `backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}-pre-bugherd-site`)
fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(path.join(dir, 'shell.json'), JSON.stringify(await getSite(), null, 1))
const fresh = (await getPages()).rows
for (const r of changed) fs.writeFileSync(path.join(dir, `${r.slug.replace(/\//g, '__') || 'index'}.json`), JSON.stringify(fresh.find((x) => x.id === r.id), null, 1))
fs.writeFileSync(path.join(dir, 'CHANGES.txt'), log.join('\n') + '\n')
console.log(`backup  ${path.relative(HERE, dir)}`)
const templates = await templateMap()
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: shell,
  changedPages: changed.map((r) => ({ ...toChangedPage(r), status: 'published', cells: { ...r.cells } })),
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(changed.map((r) => [r.id, r.seq ?? 0])), shellBaseSeq: site.seq,
})
console.log(`saved   ${JSON.stringify(res).slice(0, 160)}`)
const back = (await getPages()).rows
let diff = 0
for (const r of changed) if (canon(back.find((x) => x.id === r.id).cells.body.nodes) !== canon(r.cells.body.nodes)) { diff++; console.log(`check   /${r.slug}: NODES DIFFER`) }
console.log(`check   ${changed.length - diff}/${changed.length} pages as written`)
console.log(`check   ${ASSET.path}: ${(await getSite()).site.files.find((f) => f.path === ASSET.path)?.content === ASSET.content ? 'exact' : 'DIFFERS'}`)
await assertTemplatesIntact(templates)
if (diff) process.exit(1)

if (PUBLISH) {
  const mine = new Set(changed.map((r) => r.id))
  const now = (await getPages()).rows
  const moved = now.filter((r) => !mine.has(r.id) && (startRows.get(r.id)?.seq !== r.seq || startRows.get(r.id)?.updatedAt !== r.updatedAt))
  if (moved.length || now.length !== rows.length) { console.error(`REFUSING to publish: rows changed during this run: ${moved.map((r) => r.slug).join(', ')}`); process.exit(1) }
  console.log('publish', JSON.stringify(await publish()).slice(0, 160))
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000))
    const s = JSON.stringify(await publishStatus())
    if (!/running|pending|in_progress|building/i.test(s)) { console.log('status ', s.slice(0, 200)); break }
  }
}
