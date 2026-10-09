#!/usr/bin/env node
/**
 * apply-bugherd-round3.mjs — Brandklout's third BugHerd round on the main site (project 541030,
 * pins #39-#112, 2026-10-07/08) and the two new hub pages (#59 #60; Asana 1219333478027729),
 * written into the LIVE draft as surgical edits: read the rows, change only the named nodes, write
 * each row against its own seq, add two new code assets, guarded publish. Same contract as
 * apply-bugherd-site.mjs / apply-lp-review.mjs (trap 46). No push.
 *
 *   node apply-bugherd-round3.mjs                      # dry run
 *   node apply-bugherd-round3.mjs --apply              # backup, write the draft
 *   node apply-bugherd-round3.mjs --apply --publish    # ...and publish (guarded)
 *   ... --hubs                                         # rebuild the two hub pages too (they exist after the first run)
 *   INSTATIC_BASE_URL=<staging> node apply-bugherd-round3.mjs --media-map .tmp/media-map.staging.json ...
 *
 * CLASS NAMES. The source (site-src) and these edits are written in the Client-First names; the
 * production instance still carries the old ones until the class standard is rolled out there. The
 * script reads which set the instance has and translates through workflows/class-standard/
 * class-map.json, so the same run is right on production and on staging. Classes this round adds
 * (footer_brand, steps_scroll-cue …) are Client-First on both.
 *
 * What it does (pin numbers are BugHerd's):
 *   shell   + src/styles/wla-review-3.css   (site-src/css/06-review-3.css, font URLs resolved)
 *           + src/scripts/wla-review-3.js   (site-src/js/95-review-3.js): releases the pins of the
 *             statement, reality, compare, ledger and before/after (#39 #41 #42 #45 #49 #55), hover
 *             swap on before/after, "Scroll" cue on pinned steps (#43 #46)
 *           fonts: Lora (#50 #51 #66 #96), Cormorant Garamond (#97), Playfair on FAQ heads (#64)
 *   every main page: nav + "Surgery & Care" and "The Practice" (#59 #60); footer: name and line
 *           centred, then five columns with Hours beside the rest (#65)
 *   images  #40 #47(+6 neighbourhood pages) #48 #57 #58 #61 #62 #67 #70 #71 #73 #75 #77 #79 #81
 *           #83 #84 #85 #86 #87 #93 #99 #100 #101 #102 #104 #105 #106 #107 #108 #110 #112
 *   centred #54 #68 #91 #95 (focal point; #54 #95 also lose the parallax overscan)
 *   order   #44 #56 #63 #72 #74 #76 #78 #80 #82 #88 #89 #92 #103 #111 (the section moves up to sit
 *           right after the cover, "The Reality" second), #98 (team before the rooms); chapters
 *           renumbered
 *   copy    #52 #53 /technology questions head; #90 #109 (+3 more) the comma after an italic word
 *           no longer wraps alone (it moves inside the em)
 *   #94     /general-dentistry: the statement on the left, the six services as an accordion
 *           list on the right; the horizontal rail goes
 *   pages   + /surgery-and-care, + /the-practice (cloned chrome; photo cards of the linked pages)
 * Not here: #25 and #69 (no image attached; asked on the pins).
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
const argv = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null }
const MM_FILE = path.resolve(HERE, argv('--media-map') ?? '.tmp/media-map.json')
const MM = JSON.parse(fs.readFileSync(MM_FILE, 'utf8'))
if (MM.base !== BASE) throw new Error(`${path.basename(MM_FILE)} is for ${MM.base}, the target is ${BASE}: pass --media-map for this instance`)
const media = (k) => { const h = MM.map[k]; if (!h) throw new Error(`media map has no ${k}`); return h.url }

// ── class names: Client-First in the source, translated to the instance ──
const RENAME = JSON.parse(fs.readFileSync(path.resolve(HERE, '../class-standard/class-map.json'), 'utf8')).rename // old -> new
const BACK = Object.fromEntries(Object.entries(RENAME).map(([o, n]) => [n, o]))
const OURS = ['footer_brand', 'steps_scroll-cue', 'has-scroll-cue', 'is-steps-done', 'is-swapped', 'is-lit', 'is-drawn']
for (const c of OURS) if (BACK[c] || RENAME[c]) throw new Error(`new class .${c} collides with the class map`)
let OLD = false
const cn = (name) => (OLD ? BACK[name] ?? name : name)
const tr = (text) => (OLD ? text.replace(/(?<![\w-])\.([A-Za-z_][\w-]*)/g, (m, n) => (BACK[n] ? '.' + BACK[n] : m)) : text)

// ── the round's data ──────────────────────────────────────────────────
const IMG = 'media/img/'
/* [pins, slug, slot, file, focal x-y, {noPar}] — slot: cover | steps | strip:N (0-based) | card:N (1-based)
   Focal points from the faces in each photo against the slot's box at 1440 (the .par overscan
   included), scratchpad focal.py; checked on the published page. */
const IMAGES = [
  ['#40', 'dental-implants', 'cover', 'stock-index-cosmetic.jpg', '40-40'],
  ['#47', 'dental-implants', 'steps', 'front-desk-emily.jpg', '60-40'],
  ...['beverly-hills', 'brentwood', 'century-city', 'culver-city', 'santa-monica', 'westwood'].map((n) => ['#47', `dental-implants-${n}`, 'steps', 'front-desk-emily.jpg', '60-40']),
  ['#48', 'dental-implants', 'strip:0', 'still-doctor-xray-screen.jpg', '70-40'],
  ['#57', 'results', 'cover', 'patient-smile-portrait-1.jpg', '40-40'],
  ['#58', 'contact', 'cover', 'front-desk-leslie.jpg', '10-40'],
  ['#61', 'all-on-4', 'cover', 'patient-smile-portrait-1.jpg', '40-40'],
  ['#62', 'all-on-4', 'steps', 'still-doctor-xray-screen.jpg', '70-40'],
  ['#67', 'implant-supported-dentures', 'steps', 'dental-implant-crown-placement.png', '50-50'],
  ['#70', 'zirconia-fixed-bridge', 'strip:1', 'patient-smile-portrait-2.jpg', '60-40'],
  ['#71', 'zirconia-fixed-bridge', 'strip:2', 'patient-smile-portrait-1.jpg', '40-40'],
  ['#73', 'failing-dental-implants', 'strip:1', 'patient-smile-portrait-3.jpg', '50-40'],
  ['#75', 'implant-cost', 'cover', 'front-desk-receptionist.jpg', '20-40'],
  ['#77', 'financing', 'cover', 'doctor-handshake.jpg', '40-40', { noPar: true }],
  ['#79', 'financing', 'strip:0', 'front-desk-leslie.jpg', '50-40'],
  ['#81', 'sedation-dentistry', 'strip:2', 'patient-under-sedation.jpg', '30-40'],
  ['#83', 'bone-grafting', 'strip:0', 'hygienist-procedure.jpg', '80-40'],
  ['#84', 'bone-grafting', 'strip:1', 'cbct-emily.jpg', '90-40'],
  ['#85', 'bone-grafting', 'strip:2', 'sinus-lift-graphic.jpg', '80-50'],
  ['#86', 'tooth-extractions', 'cover', 'patient-smile-portrait-5.jpg', '50-40'],
  ['#87', 'tooth-extractions', 'strip:2', 'dental-implant-crown-placement.png', '50-50'],
  ['#93', 'cosmetic-dentistry', 'steps', 'patient-smile-portrait-2.jpg', '50-50'],
  ['#99', 'our-practice', 'strip:2', 'cbct-emily.jpg', '90-40'],
  ['#100', 'our-practice', 'strip:0', 'hygienist-procedure.jpg', '80-40'],
  ['#101', 'what-to-expect', 'cover', 'doctor-patient-2.jpg', '70-40'],
  ['#102', 'what-to-expect', 'steps', 'front-desk-receptionist.jpg', '50-30'],
  ['#104', 'blog', 'cover', 'front-desk-emily.jpg', '80-40'],
  ['#105', 'blog', 'card:13', 'patients-eating.jpg', '50-50'],
  ['#106', 'blog', 'card:15', 'emily-makeover-after.jpg', '100-50'],
  ['#107', 'blog', 'card:43', 'patient-smile-portrait-4.jpg', '50-50'],
  ['#108', 'referring-doctors', 'cover', 'barriere_dentalpatient_welcoming_westlaimplants3.jpg', '90-40'],
  ['#110', 'referring-doctors', 'steps', 'front-desk-receptionist.jpg', '50-30'],
  ['#112', 'referring-doctors', 'strip:0', 'hygienist-procedure.jpg', '80-40'],
  // centred, same photo
  ['#54', 'dr-tony-barriere', 'cover', null, '50-50', { noPar: true }],
  ['#68', 'hybrid-dentures', 'cover', null, '90-50'],
  ['#91', 'missing-teeth', 'strip:2', null, '90-50'],
  ['#95', 'general-dentistry', 'strip:0', null, '100-50', { noPar: true }],
]
fs.mkdirSync(path.join(HERE, '.tmp'), { recursive: true })
fs.writeFileSync(path.join(HERE, '.tmp', 'round3-slots.json'), JSON.stringify(IMAGES.map(([pin, slug, slot]) => ({ pin, slug, slot }))))
/* the section that moves up to sit right after the cover ("The Reality" second) */
const TO_TOP = {
  technology: ['#44', 'steps'], 'dr-tony-barriere': ['#56', 'steps'], 'all-on-4': ['#63', 'steps'],
  'zirconia-fixed-bridge': ['#72', 'ledger'], 'failing-dental-implants': ['#74', 'ledger'], 'implant-cost': ['#76', 'ledger'],
  financing: ['#78', 'ledger'], 'sedation-dentistry': ['#80', 'ledger'], 'bone-grafting': ['#82', 'steps'],
  'tooth-extractions': ['#88', 'compare'], periodontics: ['#89', 'ledger'], 'missing-teeth': ['#92', 'steps'],
  'what-to-expect': ['#103', 'ledger'], 'referring-doctors': ['#111', 'steps'],
}
const FOOTER_ABOUT = ['Dental implants, cosmetic dentistry and oral surgery on Wilshire Blvd.', 'Minutes from Brentwood, Santa Monica, Westwood, Century City and Culver City.']
const NAV_ADD = [
  { after: '/dental-implants', href: '/surgery-and-care', text: 'Surgery & Care' },
  { before: '/contact', href: '/the-practice', text: 'The Practice' },
]
const HUBS = [
  {
    pins: '#59', slug: 'surgery-and-care', from: 'sedation-dentistry', id: 'treatments',
    seoTitle: 'Surgery & Care in Los Angeles | West LA Implants',
    seoDescription: 'Sedation, bone and sinus grafting, extractions, gum care, missing teeth and loose dentures, cosmetic and general dentistry at West LA Implants on Wilshire Blvd.',
    tag: 'Surgery & care · Los Angeles', h1: ['The care around ', 'the implant.'],
    lead: 'Sedation, grafting, extractions and gum treatment prepare the mouth for an implant. Cosmetic and general dentistry keep the result for life. All of it is done here, by the same team.',
    button: 'Request a Consultation', link: ['/dr-tony-barriere', 'Meet Dr. Barriere '],
    image: ['hygienist-procedure.jpg', '60-50'],
    meta: [['7', 'Treatments under one roof'], ['IV sedation', 'For anxious patients'], ['Laser', 'Gum care, faster healing'], ['Same day', 'Emergency visits']],
    chapter: 'The Treatments', ktag: 'The treatments', h2: ['Seven treatments, ', 'one roof.'],
    intro: 'Each page explains the treatment, the visit and the recovery.',
    cards: [
      ['/sedation-dentistry', 'IV sedation', 'IV, oral and nitrous sedation, matched to how anxious you are and how long the work will take.', 'stock-sedation-hero.jpg', '50-50'],
      ['/bone-grafting', 'Bone, sinus & ridge grafting', 'Bone shrinks where a tooth is missing. Grafting puts it back, so an implant has something solid to hold.', 'stock-graft-hero.jpg', '50-50'],
      ['/tooth-extractions', 'Tooth extractions', 'When a tooth cannot be saved, a gentle extraction ends the pain and protects everything around it.', 'patient-smile-portrait-5.jpg', '50-40'],
      ['/periodontics', 'Periodontics', 'Gum disease treated with a diode laser: less scraping, less pain and faster healing.', 'gum-disease-patient.jpg', '90-50'],
      ['/missing-teeth', 'Missing teeth & loose dentures', 'Missing teeth, loose dentures and bone loss, and every option that replaces them.', 'patient-covering-mouth.jpg', '90-50'],
      ['/cosmetic-dentistry', 'Cosmetic dentistry', 'Veneers, whitening, Invisalign® and complete makeovers, shown to you on screen first.', 'emily-makeover-after.jpg', '100-50'],
      ['/general-dentistry', 'General dentistry', 'Cleanings, exams, crowns and emergencies, with the same team and the same scanner.', 'cbct-emily.jpg', '90-40'],
    ],
    next: [['/dental-implants', 'Dental implants', 'One tooth to a full arch.'], ['/technology', 'Technology', 'Yomi®, the CBCT and the in-house lab.'], ['/the-practice', 'The practice', 'The team, the first visit, the journal.']],
  },
  {
    pins: '#60', slug: 'the-practice', from: 'sedation-dentistry', id: 'practice',
    seoTitle: 'The Practice | West LA Implants, Los Angeles',
    seoDescription: 'Meet the West LA Implants team, see what happens at a first visit, read the questions and the journal, refer a patient or contact the practice on Wilshire Blvd.',
    tag: 'The practice · 12301 Wilshire Blvd', h1: ['The people and ', 'the place.'],
    lead: 'Who will look after you, what happens at your first visit, the questions patients ask most, and how to reach the front desk.',
    button: 'Book a Visit', link: ['https://vimeo.com/1233869447', 'Watch: welcome to West LA Implants '],
    image: ['still-reception-neon.jpg', '60-50'],
    meta: [['Wilshire', 'Suite 205'], ['English & Spanish', 'Spoken by the team'], ['Mon to Fri', '9am to 5pm'], ['Free', 'Second opinions']],
    chapter: 'The Practice', ktag: 'The practice', h2: ['Everything beyond ', 'the chair.'],
    intro: 'The team, the visit, the answers and the way in.',
    cards: [
      ['/our-practice', 'Our team', 'The people who run the day, and the rooms where the work happens.', 'staff.jpg', '100-50'],
      ['/what-to-expect', 'Your first visit', 'What happens in the first hour, the implant path, and the instructions for after surgery.', 'doctor-patient-2.jpg', '50-30'],
      ['/faq', 'Questions', 'The questions the practice hears most about implants, answered plainly.', 'still-emily-consult.jpg', '60-20'],
      ['/blog', 'Journal', 'Forty-six short entries on what patients ask, from candidacy to recovery.', 'front-desk-emily.jpg', '50-40'],
      ['/referring-doctors', 'Referring doctors', 'For dentists referring implant, grafting, extraction and sedation cases.', 'barriere_dentalpatient_welcoming_westlaimplants3.jpg', '100-40'],
      ['/contact', 'Contact', 'Address, hours, both phone lines and online booking.', 'front-desk-leslie.jpg', '50-40'],
    ],
    next: [['/dr-tony-barriere', 'Dr. Barriere', 'The surgeon who plans and places every implant.'], ['/results', 'Results', 'Before and after, and patients on film.'], ['/surgery-and-care', 'Surgery & care', 'Sedation, grafting, extractions and everyday care.']],
  },
]
const NEW_ALT = {
  'patient-smile-portrait-1.jpg': 'A West LA Implants patient smiling after his treatment',
  'patient-smile-portrait-2.jpg': 'A West LA Implants patient smiling after her treatment',
  'patient-smile-portrait-3.jpg': 'A West LA Implants patient smiling after his implant treatment',
  'patient-smile-portrait-4.jpg': 'A West LA Implants patient smiling after her treatment',
  'patient-smile-portrait-5.jpg': 'A West LA Implants patient smiling after his treatment',
}

// ── helpers ───────────────────────────────────────────────────────────
const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b))) : x))
const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => [...randomBytes(n)].map((b) => ALPHABET[b & 63]).join('')
const log = []
const note = (s) => { log.push(s); console.log(s) }

// ── read ──────────────────────────────────────────────────────────────
const start = await publishStatus()
if (!start.draftMatchesPublished) { console.error('REFUSING: the draft already differs from the published site.'); process.exit(1) }
const site = await getSite()
const shell = site.site
const rules = shell.styleRules
const byName = (name) => Object.values(rules).find((r) => r.kind === 'class' && r.name === name)
OLD = !!byName('b-statement')
if (!OLD && !byName('section_statement')) throw new Error('neither naming found on the shell')
const nameOf = (id) => rules[id]?.name
const rid = (name) => { const r = byName(cn(name)); if (!r) throw new Error(`registry has no .${cn(name)}`); return r.id }
const hasC = (n, name) => (n?.classIds ?? []).some((id) => nameOf(id) === cn(name))
const isFocal = (id) => /^(fp|object-position)-\d+-\d+$/.test(nameOf(id) ?? '')
let shellChanged = false
const classRule = (name) => {
  let r = byName(name)
  if (!r) {
    const order = Math.max(0, ...Object.values(rules).map((x) => x.order ?? 0)) + 1
    r = { id: nanoid(), name, kind: 'class', selector: `.${name}`, order, styles: {}, contextStyles: {}, createdAt: Date.now(), updatedAt: Date.now() }
    rules[r.id] = r; shellChanged = true; note(`rule    + .${name}`)
  }
  return r.id
}
/* Focal points. Of the 121 object-position rules only the ones the build used are kind "class";
   the rest are "ambient" (same selector, same style). A node whose classIds point at an ambient
   rule renders NO class: the 2026-10-07 /faq cover fix (#22, 60% 20%) never showed. A focal rule
   this round needs is promoted to "class" in place (nothing else about it changes). */
const focalId = (xy) => {
  const want = cn(`object-position-${xy}`)
  /* on staging the class-standard rename rewrote the ambient rules' selectors but left their
     `name` on the old fp-X-Y, and a class rule renders its name: match by selector, fix the name */
  const r = Object.values(rules).find((x) => x.name === want || x.selector === `.${want}.${want}`)
  if (!r) throw new Error(`registry has no .${want}`)
  if (r.kind !== 'class' || r.name !== want) { note(`rule    ~ .${want} ${r.kind}${r.name !== want ? ` (named ${r.name})` : ''} -> class`); r.kind = 'class'; r.name = want; r.updatedAt = Date.now(); shellChanged = true }
  return r.id
}
focalId('60-20') // #22's /faq cover
const { rows } = await getPages()
const startRows = new Map(rows.map((r) => [r.id, { seq: r.seq, updatedAt: r.updatedAt }]))
console.log(`target ${BASE} (${OLD ? 'old class names' : 'Client-First names'})  shell seq ${site.seq}  rows ${rows.length}`)

// ── shell: two new code assets ────────────────────────────────────────
const fontUrl = (s) => s.replace(/url\('\.\.\/fonts\/([^']+)'\)/g, (m, n) => `url('${media('fonts/' + n)}')`)
const ASSETS = [
  { type: 'style', path: 'src/styles/wla-review-3.css', content: tr(fontUrl(fs.readFileSync(path.join(SRC, 'css/06-review-3.css'), 'utf8'))) },
  { type: 'script', path: 'src/scripts/wla-review-3.js', content: tr(fs.readFileSync(path.join(SRC, 'js/95-review-3.js'), 'utf8')) },
]
for (const A of ASSETS) {
  const have = shell.files.find((f) => f.path === A.path)
  if (!have) { const now = new Date().toISOString(); shell.files.push({ id: nanoid(), ...A, createdAt: now, updatedAt: now }); shellChanged = true; note(`shell   + ${A.path} (${A.content.length} B)`) }
  else if (have.content !== A.content) { have.content = A.content; have.updatedAt = new Date().toISOString(); shellChanged = true; note(`shell   ~ ${A.path}`) }
  else note(`shell   ${A.path} exact`)
}
const FOOTER_BRAND = classRule('footer_brand')

// ── per-page tools ────────────────────────────────────────────────────
function tools(row) {
  const N = row.cells.body.nodes
  const all = () => Object.values(N)
  const main = all().find((n) => n.props?.htmlAttributes?.['data-seo'])
  const section = (id) => main?.children.map((c) => N[c]).find((s) => s?.props?.htmlAttributes?.id === id)
  const desc = (id, out = []) => { if (!N[id]) return out; out.push(N[id]); for (const c of N[id].children ?? []) desc(c, out); return out }
  const drop = (id) => { for (const c of N[id]?.children ?? []) drop(c); delete N[id] }
  const mk = (parentId, moduleId, props, classIds = []) => {
    const n = { id: nanoid(), moduleId, parentId, classIds, children: [], breakpointOverrides: {}, props: { htmlAttributes: {}, ...props } }
    N[n.id] = n
    if (parentId) N[parentId].children.push(n.id)
    return n
  }
  const text = (parentId, t, tag = 'none', classIds = []) => mk(parentId, 'base.text', { text: t, tag }, classIds)
  const box = (parentId, tag, classIds = [], attrs = {}) => {
    const standard = ['div', 'section', 'article', 'aside', 'ul', 'ol', 'main', 'header', 'footer', 'nav']
    return mk(parentId, 'base.container', { tag: standard.includes(tag) ? tag : 'custom', customTag: standard.includes(tag) ? '' : tag, htmlAttributes: attrs }, classIds)
  }
  const reparent = (id, parentId) => { const n = N[id]; const p = N[n.parentId]; if (p) p.children = p.children.filter((c) => c !== id); n.parentId = parentId; N[parentId].children.push(id) }
  const renumber = () => main.children.forEach((c, i) => {
    const a = N[c].props.htmlAttributes ?? {}
    if ('data-chapter' in a && a['data-chapter'] !== String(i)) N[c].props.htmlAttributes = { ...a, 'data-chapter': String(i) }
  })
  return { N, all, main, section, desc, drop, mk, text, box, reparent, renumber }
}

function imageIn(t, slot) {
  const [kind, arg] = slot.split(':')
  if (kind === 'cover') {
    const sec = t.section('arrival')
    const fig = t.desc(sec.id).find((n) => hasC(n, 'cover_image-wrapper'))
    return fig && t.N[fig.children.find((c) => t.N[c].moduleId === 'base.image')]
  }
  if (kind === 'steps') {
    const fig = t.desc(t.section('steps').id).find((n) => hasC(n, 'steps_image-wrapper'))
    return fig && t.N[fig.children.find((c) => t.N[c].moduleId === 'base.image')]
  }
  if (kind === 'strip') {
    const fig = t.desc(t.section('strip').id).find((n) => hasC(n, 'photo-strip_photo') && hasC(n, `is-photo-${+arg + 1}`))
    return fig && t.N[fig.children.find((c) => t.N[c].moduleId === 'base.image')]
  }
  if (kind === 'card') {
    const grid = t.desc(t.section('entries').id).find((n) => hasC(n, 'post-index_grid'))
    const card = t.N[grid.children[+arg - 1]]
    return t.desc(card.id).find((n) => n.moduleId === 'base.image')
  }
  throw new Error(`slot ${slot}?`)
}

const short = (src) => String(src).split('/').pop().replace(/^[A-Za-z0-9_-]{21}-/, '')
const changed = new Set()
const bySlug = new Map(rows.map((r) => [r.slug, r]))
const isMain = (r) => !r.slug.startsWith('ads-landing-pages/')

for (const row of rows) {
  if (!row.cells?.body?.nodes || !isMain(row)) continue
  const t = tools(row)
  const say = (s) => { changed.add(row); note(`/${row.slug}  ${s}`) }

  // nav (#59 #60)
  const navLinks = t.all().find((n) => hasC(n, 'nav_links'))
  if (navLinks) {
    for (const add of NAV_ADD) {
      const links = navLinks.children.map((c) => t.N[c])
      if (links.some((l) => l.props?.href === add.href)) continue
      const anchor = links.findIndex((l) => l.props?.href === (add.after ?? add.before))
      if (anchor < 0) throw new Error(`/${row.slug}: nav has no ${add.after ?? add.before}`)
      const a = t.mk(navLinks.id, 'base.link', { href: add.href, text: add.text, target: '_self' })
      navLinks.children.pop()
      navLinks.children.splice(add.after ? anchor + 1 : anchor, 0, a.id)
      say(`nav   + ${add.text}`)
    }
  }

  // footer (#65)
  const footer = t.all().find((n) => hasC(n, 'footer_component'))
  if (footer) {
    const wrap = t.N[footer.children[0]]
    const grid = wrap.children.map((c) => t.N[c]).find((n) => hasC(n, 'footer_grid'))
    if (!wrap.children.some((c) => (t.N[c].classIds ?? []).includes(FOOTER_BRAND))) {
      const col0 = t.N[grid.children[0]]
      const kids = col0.children.map((c) => t.N[c])
      const [logo, about, tOffice, pOffice, tHours, pHours] = kids
      const ok = kids.length === 6 && hasC(logo, 'footer_logo') && hasC(about, 'footer_about') && about.props.text === FOOTER_ABOUT.join(' ')
        && hasC(tOffice, 'footer_title') && hasC(tHours, 'footer_title')
      if (!ok) throw new Error(`/${row.slug}: footer first column is not the expected shape`)
      const brand = t.box(wrap.id, 'div', [FOOTER_BRAND])
      t.reparent(logo.id, brand.id)
      const p = t.box(brand.id, 'p', [...about.classIds])
      t.text(p.id, FOOTER_ABOUT[0]); t.box(p.id, 'br'); t.text(p.id, FOOTER_ABOUT[1])
      col0.children = col0.children.filter((c) => c !== about.id); delete t.N[about.id]
      const office = t.box(grid.id, 'div'); t.reparent(tOffice.id, office.id); t.reparent(pOffice.id, office.id)
      const hours = t.box(grid.id, 'div'); t.reparent(tHours.id, hours.id); t.reparent(pHours.id, hours.id)
      grid.children = [office.id, hours.id, ...grid.children.filter((c) => c !== col0.id && c !== office.id && c !== hours.id)]
      t.drop(col0.id)
      wrap.children = [brand.id, ...wrap.children.filter((c) => c !== brand.id)]
      say('footer name + line centred, five columns')
    }
  }

  // comma after an italic word (#90 #109): the punctuation joins the em
  for (const h of t.all().filter((x) => /^h[12]$/.test(x.props?.customTag || x.props?.tag || ''))) {
    const kids = h.children.map((c) => t.N[c])
    kids.forEach((k, i) => {
      const em = kids[i - 1]
      const m = k?.moduleId === 'base.text' && em?.moduleId === 'base.text' && em.props?.tag === 'em' && String(k.props?.text ?? '').match(/^([,.;:!?]+)/)
      if (!m) return
      em.props = { ...em.props, text: em.props.text + m[1] }
      const rest = k.props.text.slice(m[1].length)
      if (rest) k.props = { ...k.props, text: rest }
      else { h.children = h.children.filter((c) => c !== k.id); delete t.N[k.id] }
      say(`text  "${em.props.text}" keeps its "${m[1]}"`)
    })
  }

  // images and focal points
  for (const [pin, slug, slot, file, focal, opts = {}] of IMAGES.filter((x) => x[1] === row.slug)) {
    const img = imageIn(t, slot)
    if (!img) throw new Error(`/${row.slug}: no image in ${slot}`)
    const want = focalId(focal)
    const par = byName(cn('parallax_image'))?.id
    const src = file ? media(IMG + file) : img.props.src
    const classIds = (img.classIds ?? []).filter((id) => !isFocal(id) && !(opts.noPar && id === par)).concat(want)
    if (img.props.src === src && canon(classIds.slice().sort()) === canon((img.classIds ?? []).slice().sort())) continue
    const was = short(img.props.src)
    img.props = { ...img.props, src }
    img.classIds = classIds
    say(`image ${pin} ${slot} ${was} -> ${short(src)} [${nameOf(want)}${opts.noPar ? ', no parallax' : ''}]`)
  }

  // order
  if (TO_TOP[row.slug]) {
    const [pin, id] = TO_TOP[row.slug]
    const sec = t.section(id)
    if (!sec || !hasC(t.N[t.main.children[0]], 'section_cover')) throw new Error(`/${row.slug}: no #${id} or no cover first`)
    if (t.main.children.indexOf(sec.id) !== 1) {
      t.main.children = [t.main.children[0], sec.id, ...t.main.children.slice(1).filter((c) => c !== sec.id)]
      say(`order ${pin} #${id} up to second, after the cover`)
    }
  }
  if (row.slug === 'our-practice') {
    const team = t.section('team'), i = t.main.children.indexOf(team.id), prev = t.N[t.main.children[i - 1]]
    if (prev.props.htmlAttributes.id === 'strip') {
      t.main.children.splice(i - 1, 2, team.id, prev.id)
      say('order #98 #team before #strip')
    }
  }

  // #52 #53 /technology: the questions head
  if (row.slug === 'technology') {
    const head = t.desc(t.section('questions').id).find((n) => hasC(n, 'faq-section_head'))
    const h2 = t.desc(head.id).find((n) => n.props?.customTag === 'h2')
    const runs = h2.children.map((c) => t.N[c])
    if (runs[0]?.props.text === 'Technology ') {
      runs[0].props = { ...runs[0].props, text: 'Your questions about our technology, ' }
      runs[1].props = { ...runs[1].props, text: 'answered.' }
      say('text  #52 "Technology questions." -> "Your questions about our technology, answered."')
    }
    const tag = t.desc(head.id).find((n) => n.moduleId === 'base.text' && n.props?.text === 'The Questions')
    if (tag) { tag.props = { ...tag.props, text: 'Frequently asked questions' }; say('text  #53 tag -> "Frequently asked questions"') }
  }

  // #94 /general-dentistry: statement + services
  if (row.slug === 'general-dentistry') {
    const st = t.section('statement'), rail = t.section('rail')
    if (rail) {
      const stage = st.children.map((c) => t.N[c]).find((n) => hasC(n, 'statement_stage'))
      const cards = t.desc(rail.id).filter((n) => hasC(n, 'card-rail_card'))
      const items = cards.map((c) => {
        const d = t.desc(c.id)
        return [d.find((n) => n.props?.tag === 'h3')?.props.text, d.find((n) => n.props?.tag === 'p')?.props.text]
      })
      if (items.length !== 6 || items.some(([a, b]) => !a || !b)) throw new Error('/general-dentistry: rail cards not as expected')
      st.props = { ...st.props, htmlAttributes: { ...(st.props.htmlAttributes ?? {}), 'data-st-services': '' } }
      const svc = t.box(stage.id, 'div', [rid('statement_services')])
      t.text(svc.id, 'General dentistry services', 'span', [rid('statement_services-label')])
      const list = t.box(svc.id, 'div', [rid('faq_list')])
      for (const [q, a] of items) {
        const item = t.box(list.id, 'div', [rid('faq_item')])
        const btn = t.box(item.id, 'button', [rid('faq_question')], { type: 'button', 'aria-expanded': 'false' })
        t.text(btn.id, q, 'span'); t.box(btn.id, 'i')
        t.text(t.box(item.id, 'div', [rid('faq_answer')]).id, a, 'p')
      }
      t.main.children = t.main.children.filter((c) => c !== rail.id)
      t.drop(rail.id)
      say(`#94 statement + ${items.length} services as a list; rail removed`)
    }
  }

  if (changed.has(row)) t.renumber()
}

// ── the hub pages (#59 #60) ───────────────────────────────────────────
const newPages = []
for (const H of HUBS) {
  const src = bySlug.get(H.from)
  const existing = bySlug.get(H.slug)
  if (existing && !process.argv.includes('--hubs')) { console.log(`/${H.slug}  exists (pass --hubs to rebuild it)`); continue }
  const idMap = new Map(Object.keys(src.cells.body.nodes).map((id) => [id, nanoid()]))
  const nodes = {}
  for (const [id, n] of Object.entries(src.cells.body.nodes)) {
    const c = structuredClone(n)
    c.id = idMap.get(id); if (c.parentId) c.parentId = idMap.get(c.parentId); c.children = (c.children ?? []).map((x) => idMap.get(x))
    nodes[c.id] = c
  }
  const row = { id: existing?.id ?? nanoid(), slug: H.slug, cells: { title: H.seoTitle, slug: H.slug, body: { nodes, rootNodeId: idMap.get(src.cells.body.rootNodeId) } } }
  const t = tools(row)
  // SEO object (js/80-seo.js)
  const seo = JSON.parse(Buffer.from(t.main.props.htmlAttributes['data-seo'], 'base64').toString('utf8'))
  const origin = new URL(seo.canonical).origin
  seo.canonical = `${origin}/${H.slug}`
  seo.title = H.seoTitle; seo.description = H.seoDescription
  seo.image = origin + media(IMG + H.image[0])
  const practice = seo.jsonld.find((j) => j['@type'] === 'Dentist')
  if (practice?.sameAs) practice.sameAs = practice.sameAs.map((u) => u.replace('@westlaimplants892', '@westlaimplants'))
  seo.jsonld = [practice, { '@context': 'https://schema.org', '@type': 'CollectionPage', name: H.seoTitle, url: seo.canonical, hasPart: H.cards.map(([href, name]) => ({ '@type': 'WebPage', name, url: origin + href })) }]
  t.main.props.htmlAttributes = { ...t.main.props.htmlAttributes, 'data-seo': Buffer.from(JSON.stringify(seo), 'utf8').toString('base64') }
  // cover
  const cover = t.N[t.main.children[0]]
  if (!hasC(cover, 'section_cover')) throw new Error('hub: first chapter is not the cover')
  const cd = t.desc(cover.id)
  const textIn = (n) => t.N[n.children.find((c) => t.N[c].moduleId === 'base.text')]
  textIn(cd.find((n) => hasC(n, 'text-style-tagline'))).props.text = H.tag
  const h1 = cd.find((n) => n.props?.customTag === 'h1')
  for (const c of [...h1.children]) t.drop(c)
  h1.children = []
  t.text(h1.id, H.h1[0]); t.text(h1.id, H.h1[1], 'em')
  cd.find((n) => hasC(n, 'cover_lead')).props.text = H.lead
  const actions = cd.find((n) => hasC(n, 'cover_actions'))
  const [btn, more] = actions.children.map((c) => t.N[c])
  textIn(btn).props.text = H.button
  more.props = { ...more.props, href: H.link[0] }
  t.N[more.children[0]].props.text = H.link[1]
  const img = imageIn(t, 'cover')
  img.props = { ...img.props, src: media(IMG + H.image[0]) }
  img.classIds = img.classIds.filter((id) => !isFocal(id)).concat(focalId(H.image[1]))
  const meta = cd.find((n) => hasC(n, 'cover_meta'))
  meta.children.forEach((li, i) => {
    const [b, s] = t.N[li].children.map((c) => t.N[c])
    textIn(b).props.text = H.meta[i][0]; s.props.text = H.meta[i][1]
  })
  // middle chapters out, the hub in
  const invite = t.main.children.map((c) => t.N[c]).find((n) => hasC(n, 'section_invitation'))
  for (const c of t.main.children) if (c !== cover.id && c !== invite.id) t.drop(c)
  const sec = t.box(t.main.id, 'section', [rid('section_post-index')], { 'data-chapter': '1', 'data-chapter-name': H.chapter, id: H.id, 'data-hub': '' })
  t.main.children = [cover.id, sec.id, invite.id]
  const head = t.box(sec.id, 'div', [rid('container-large'), rid('post-index_head')])
  const tag = t.box(head.id, 'div', [rid('text-style-tagline')]); t.box(tag.id, 'i'); t.text(tag.id, H.ktag, 'span')
  const h2 = t.box(head.id, 'h2', [rid('heading-style-h2')]); t.text(h2.id, H.h2[0]); t.text(h2.id, H.h2[1], 'em')
  t.text(head.id, H.intro, 'p', [rid('text-style-lead')])
  const grid = t.box(sec.id, 'div', [rid('container-large'), rid('post-index_grid')])
  H.cards.forEach(([href, title, line, file, focal], i) => {
    const a = t.mk(grid.id, 'base.link', { href, target: '_self' }, [rid('post-index_card')])
    const fig = t.box(a.id, 'figure', [rid('media-frame_component'), rid('is-wide')])
    t.mk(fig.id, 'base.image', { src: media(IMG + file), loading: 'lazy', fetchPriority: 'auto', decoding: 'async' }, [focalId(focal)])
    t.text(a.id, String(i + 1).padStart(2, '0'), 'span', [rid('post-index_date')])
    t.text(a.id, title, 'h3', [rid('heading-style-h3')])
    t.text(a.id, line, 'p', [rid('text-size-small')])
  })
  // invitation: next cards
  const cards = t.desc(invite.id).filter((n) => hasC(n, 'invitation_next-card'))
  if (cards.length !== 3) throw new Error('hub: invitation has no three next cards')
  cards.forEach((c, i) => {
    const [href, title, line] = H.next[i]
    c.props = { ...c.props, href }
    const [b, s] = c.children.map((x) => t.N[x])
    textIn(b).props.text = title; s.props.text = line
  })
  t.renumber()
  // nav: this page is current
  for (const l of t.all().filter((n) => n.moduleId === 'base.link' && n.props?.htmlAttributes?.['aria-current'])) {
    const { ['aria-current']: _, ...rest } = l.props.htmlAttributes; l.props = { ...l.props, htmlAttributes: rest }
  }
  const self = t.all().find((n) => hasC(t.N[n.parentId], 'nav_links') && n.props?.href === `/${H.slug}`)
  self.props = { ...self.props, htmlAttributes: { ...self.props.htmlAttributes, 'aria-current': 'page' } }
  for (const n of Object.values(nodes)) {
    for (const c of n.children) if (nodes[c]?.parentId !== n.id) throw new Error(`hub ${H.slug}: broken link ${n.id} -> ${c}`)
    if (n.parentId && !nodes[n.parentId]) throw new Error(`hub ${H.slug}: orphan ${n.id}`)
  }
  newPages.push({ H, row, existing })
  note(`/${H.slug}  ${H.pins} ${existing ? 'rebuilt' : 'new'} page: ${Object.keys(nodes).length} nodes, ${H.cards.length} cards, chapters ${t.main.children.map((c) => nodes[c].props.htmlAttributes.id).join(' > ')}`)
}

// integrity of every edited row
for (const row of changed) {
  const N = row.cells.body.nodes
  for (const n of Object.values(N)) {
    for (const c of n.children ?? []) if (N[c]?.parentId !== n.id) throw new Error(`/${row.slug}: broken link ${n.id} -> ${c}`)
    if (n.parentId && !N[n.parentId]) throw new Error(`/${row.slug}: orphan ${n.id}`)
  }
}

console.log(`\ntarget ${BASE}  shell ${shellChanged ? 'changed' : 'unchanged'}  pages ${changed.size} edited + ${newPages.length} hub`)
if (!APPLY) { console.log('DRY RUN: nothing written. Re-run with --apply.'); process.exit(0) }

// ── backup, write, read back ──────────────────────────────────────────
const dir = path.join(HERE, '.tmp', `backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}-pre-bugherd-round3`)
fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(path.join(dir, 'shell.json'), JSON.stringify(await getSite(), null, 1))
const fresh = (await getPages()).rows
for (const r of changed) fs.writeFileSync(path.join(dir, `${r.slug.replace(/\//g, '__') || 'index'}.json`), JSON.stringify(fresh.find((x) => x.id === r.id), null, 1))
fs.writeFileSync(path.join(dir, 'CHANGES.txt'), log.join('\n') + '\n')
console.log(`backup  ${path.relative(HERE, dir)}`)
const templates = await templateMap()
const edited = [...changed]
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: shell,
  changedPages: edited.map((r) => ({ ...toChangedPage(r), status: 'published', cells: { ...r.cells } })),
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(edited.map((r) => [r.id, r.seq ?? 0])), shellBaseSeq: site.seq,
})
console.log(`saved   ${edited.length} pages + shell: ${JSON.stringify(res).slice(0, 140)}`)
let back = (await getPages()).rows
let diff = 0
for (const r of edited) if (canon(back.find((x) => x.id === r.id).cells.body.nodes) !== canon(r.cells.body.nodes)) { diff++; console.log(`check   /${r.slug}: NODES DIFFER`) }
console.log(`check   ${edited.length - diff}/${edited.length} pages as written`)
const shellNow = await getSite()
for (const A of ASSETS) console.log(`check   ${A.path}: ${shellNow.site.files.find((f) => f.path === A.path)?.content === A.content ? 'exact' : 'DIFFERS'}`)
if (diff) process.exit(1)

// the hub pages, one at a time, then their SEO cells (PATCH merges; flat slugs)
let shellSeq = shellNow.seq
for (const { H, row, existing } of newPages) {
  const r2 = await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental', site: (await getSite()).site,
    changedPages: [{ id: row.id, slug: H.slug, title: H.seoTitle, nodes: row.cells.body.nodes, rootNodeId: row.cells.body.rootNodeId, status: 'published' }],
    deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: { [row.id]: existing?.seq ?? 0 }, shellBaseSeq: shellSeq,
  })
  shellSeq = (await getSite()).seq
  const cur = await api('GET', `/admin/api/cms/data/rows/${row.id}`)
  const cells = { ...(cur.row?.cells ?? {}) }
  if (!cells.body || cells.slug !== H.slug) throw new Error(`/${H.slug}: row missing body/slug before the SEO merge`)
  cells.seoTitle = H.seoTitle; cells.seoDescription = H.seoDescription
  await api('PATCH', `/admin/api/cms/data/rows/${row.id}`, { cells })
  const got = (await api('GET', `/admin/api/cms/data/rows/${row.id}`)).row.cells
  const n = Object.keys(got.body?.nodes ?? {}).length
  if (got.slug !== H.slug || n !== Object.keys(row.cells.body.nodes).length || got.seoTitle !== H.seoTitle) throw new Error(`/${H.slug}: lost content after the SEO write`)
  console.log(`page    /${H.slug} saved (${n} nodes, seo ok) ${JSON.stringify(r2).slice(0, 80)}`)
}

// alt text for the new photographs lives on the media asset
for (const [file, alt] of Object.entries(NEW_ALT)) {
  const h = MM.map[IMG + file]
  if (h) { await api('PATCH', `/admin/api/cms/media/${h.id}`, { altText: alt }); console.log(`alt     ${file}`) }
}
await assertTemplatesIntact(templates)

if (PUBLISH) {
  const mine = new Set([...edited.map((r) => r.id), ...newPages.map((p) => p.row.id)])
  const now = (await getPages()).rows
  const moved = now.filter((r) => !mine.has(r.id) && (startRows.get(r.id)?.seq !== r.seq || startRows.get(r.id)?.updatedAt !== r.updatedAt))
  const extra = now.filter((r) => !startRows.has(r.id) && !mine.has(r.id))
  if (moved.length || extra.length) { console.error(`REFUSING to publish: rows changed during this run: ${[...moved, ...extra].map((r) => r.slug).join(', ')}`); process.exit(1) }
  console.log('publish', JSON.stringify(await publish()).slice(0, 160))
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000))
    const s = JSON.stringify(await publishStatus())
    if (!/running|pending|in_progress|building/i.test(s)) { console.log('status ', s.slice(0, 200)); break }
  }
}
