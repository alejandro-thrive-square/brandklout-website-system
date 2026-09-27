#!/usr/bin/env node
/**
 * push-services-section.mjs — BugHerd pin #6, Chapter 07 "The Services".
 *
 *   node push-services-section.mjs            # report the plan, write nothing
 *   node push-services-section.mjs --apply    # write the draft (does NOT publish)
 *
 * The local counterpart is `04-design/.tmp/site-src` — `css/39-ch-services.css`
 * plus the `<section class="ch-services">` block in `pages/home.body.html`.
 * That package is the reference; run its build and look at the result FIRST.
 * This script mirrors it into the registry and the page node tree.
 *
 * ## What the client asked for
 *
 * "Let's add an explicit services section before this selected section so we
 * can display and link to the current services pages", pinned on `#proof`. The
 * home page told the whole story without ever listing what the practice does —
 * every treatment page was reachable only from the drawer.
 *
 * ## What it changes
 *
 * STYLE REGISTRY
 *   + 6 class rules   ch-services, sv-head, sv-grid, sv-card, sv-no, sv-more.
 *                     Class-kind because nodes reference them, which is also
 *                     what keeps them through the publish tree-shake.
 *   + 16 ambient rules for the descendant selectors.
 *
 *   Every responsive override rides an EXISTING condition — `(min-width: 620px)`
 *   and `(min-width: 1040px)`, both already in `site.conditions` and already in
 *   the platform's min-ascending order. Inventing a breakpoint here would place
 *   it at the end of the array, where it emits after everything regardless of
 *   width (see 15-instatic-api-sync.md, "Cascade order").
 *
 * PAGE `index`
 *   + the `#services` subtree, inserted immediately before `#proof`.
 *   ~ `#proof`      data-chapter 7 -> 8, and its visible "Chapter 07" label.
 *   ~ `#invitation` data-chapter 8 -> 9, and its visible "Chapter 08" label.
 *
 * The renumber is not cosmetic. `js/90-boot.js` drives the nav chapter readout
 * AND the progress bar off these attributes; the divisor used to be a hardcoded
 * 8, which would have pushed the last two sections past 100%. That is fixed in
 * the local package (it now derives the last index) and ships with site.js —
 * PUSH THAT TOO, or the bar overshoots:
 *
 *   node push-script-asset.mjs src/scripts/site.js \
 *        ../04-design/.tmp/final-site/assets/site.js --apply
 *
 * Idempotent: a page that already carries `#services` is left alone.
 *
 * NOTHING HERE PUBLISHES.
 */
import { randomBytes } from 'node:crypto'
import { getSite, getPages, api, toChangedPage, assertTemplatesIntact } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => {
  const b = randomBytes(n)
  let s = ''
  for (let i = 0; i < n; i++) s += ALPHABET[b[i] & 63]
  return s
}

const M620 = 'media:(min-width: 620px)'
const M1040 = 'media:(min-width: 1040px)'

// ── the eleven treatment pages, in the order the client's drawer groups them ─
const SERVICES = [
  ['/dental-implants', 'Dental Implants',
   'Single implants, bridges and full arches, planned and placed by one board-certified prosthodontist.'],
  ['/all-on-4', 'All-on-4 Full Arch',
   'Four implants, a fixed provisional arch the same day, and a definitive zirconia bridge.'],
  ['/implant-supported-dentures', 'Fixed vs. Removable',
   'Traditional dentures, implant dentures and a fixed full arch, compared honestly — drawbacks included.'],
  ['/cosmetic-dentistry', 'Cosmetic Dentistry',
   'Five cosmetic treatments and the sequence they belong in, previewed before anything is prepared.'],
  ['/veneers', 'Porcelain Veneers',
   'Thin porcelain hand-designed to your lip line, gum line and colouring.'],
  ['/crowns-and-bridges', 'Crowns & Bridges',
   'A damaged tooth is not automatically a lost one. Designed and milled in the practice’s own laboratory.'],
  ['/teeth-whitening', 'Teeth Whitening',
   'In-office whitening that lifts internal stains as well as surface ones, in about an hour.'],
  ['/smile-makeover', 'Smile Makeover',
   'One design decided first: shape, shade, lip line and facial proportion.'],
  ['/oral-surgery', 'Oral Surgery',
   'Extractions, bone grafting and CT-guided placement, by the specialist who restores the tooth afterwards.'],
  ['/sedation-dentistry', 'Sedation Dentistry',
   'Nitrous, oral and IV sedation, with a medical anaesthesiologist for longer surgical cases.'],
  ['/emergency-dentistry', 'Emergency Dentistry',
   'Toothache, abscess or a broken tooth — space is made in the schedule the same day wherever possible.'],
]

// ── style registry ─────────────────────────────────────────────────────────
// name -> base styles. These carry the class NAME into the HTML; the real
// styling lives in the ambient rules below, exactly as .pa-pin / .ch-path
// .pa-pin already do on this site.
const CLASS_RULES = {
  'ch-services': { background: 'var(--bg)', position: 'relative' },
  'sv-head': {},
  'sv-grid': {},
  'sv-card': {},
  'sv-no': {},
  'sv-more': {},
}

// selector -> { styles, contexts? }
const AMBIENT = [
  ['.ch-services .sv-head', { maxWidth: '62ch', marginBottom: 'clamp(2.5rem,5vw,4rem)' }],
  ['.ch-services .sv-head h2', { fontSize: 'var(--h2)', marginTop: '0.75rem' }],
  ['.ch-services .sv-head p', { color: 'var(--fg-body)', fontWeight: '400', marginTop: '1rem' }],

  ['.ch-services .sv-grid',
    { display: 'grid', gridTemplateColumns: '1fr', borderTop: '1px solid var(--line)' },
    { [M620]: { gridTemplateColumns: '1fr 1fr' }, [M1040]: { gridTemplateColumns: 'repeat(3,1fr)' } }],

  ['.ch-services .sv-card',
    { position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.55rem',
      padding: 'clamp(1.5rem,2.6vw,2.25rem)', borderBottom: '1px solid var(--line)',
      borderRight: '0', textDecoration: 'none', color: 'inherit', isolation: 'isolate' },
    { [M620]: { borderRight: '1px solid var(--line)' } }],
  ['.ch-services .sv-card:last-child', { borderBottom: '0' }],
  ['.ch-services .sv-card:nth-child(2n)', {},
    { [M620]: { borderRight: '0' }, [M1040]: { borderRight: '1px solid var(--line)' } }],
  ['.ch-services .sv-card:nth-child(3n)', {}, { [M1040]: { borderRight: '0' } }],
  ['.ch-services .sv-card:nth-last-child(-n+2)', {}, { [M1040]: { borderBottom: '0' } }],

  ['.ch-services .sv-card::before',
    { content: '""', position: 'absolute', inset: '0', zIndex: '-1',
      background: 'var(--card)', opacity: '0', transition: 'opacity .45s' }],
  ['.ch-services .sv-card::after',
    { content: '""', position: 'absolute', left: '0', right: '0', top: '-1px', height: '1px',
      background: 'var(--rule)', transform: 'scaleX(0)', transformOrigin: 'left',
      transition: 'transform .5s cubic-bezier(.22,1,.36,1)' }],
  ['.wz-fine .ch-services .sv-card:hover::before', { opacity: '1' }],
  ['.wz-fine .ch-services .sv-card:hover::after', { transform: 'scaleX(1)' }],
  ['.ch-services .sv-card:focus-visible',
    { outline: '2px solid var(--focus)', outlineOffset: '-2px' }],

  ['.ch-services .sv-no',
    { fontFamily: 'var(--f-display)', fontSize: 'calc(1.5rem * var(--t-lg))',
      color: 'var(--accent-lg)', lineHeight: '1' }],
  ['.ch-services .sv-card h3', { fontSize: 'var(--h3)' }],
  ['.ch-services .sv-card p',
    { color: 'var(--fg-body)', fontWeight: '400', fontSize: '0.95rem', marginBottom: '0.35rem' }],
  ['.ch-services .sv-more',
    { marginTop: 'auto', fontFamily: 'var(--f-body)', fontSize: '0.7rem', letterSpacing: '0.18em',
      textTransform: 'uppercase', fontWeight: '700', color: 'var(--accent)' }],
  ['.ch-services .sv-more::after',
    { content: '"→"', display: 'inline-block', marginLeft: '0.5rem', transition: 'transform .4s' }],
  ['.wz-fine .ch-services .sv-card:hover .sv-more::after', { transform: 'translateX(5px)' }],
]

// ── read ───────────────────────────────────────────────────────────────────
const { site: shell, seq } = await getSite()
const rules = shell.styleRules ?? {}
shell.styleRules = rules

const { rows } = await getPages()
const page = rows.find(r => r.slug === 'index')
if (!page) { console.error('  ! no index page'); process.exit(1) }
const body = page.cells.body
const nodes = body.nodes

if (Object.values(nodes).some(n => n?.props?.htmlAttributes?.id === 'services')) {
  console.log('#services already present — nothing to do')
  process.exit(0)
}

// Existing conditions only. A missing one means the cascade assumption is void.
for (const c of [M620, M1040]) {
  const known = (shell.conditions ?? []).some(x => x.id === c)
  if (!known) { console.error(`  ! condition ${c} is not registered — refusing`); process.exit(1) }
}

const byName = new Map(Object.values(rules).filter(r => r.kind === 'class').map(r => [r.name, r]))
const bySelector = new Map(Object.values(rules).map(r => [r.selector, r]))
const need = n => {
  const r = byName.get(n)
  if (!r) { console.error(`  ! expected an existing class rule "${n}"`); process.exit(1) }
  return r.id
}
const ID_WRAP = need('wrap'), ID_SECTION = need('section')
const ID_CHTAG = need('chapter-tag'), ID_LABEL = need('label')

let order = Math.max(...Object.values(rules).map(r => r.order ?? 0))
const newClassIds = {}

for (const [name, styles] of Object.entries(CLASS_RULES)) {
  const existing = byName.get(name)
  if (existing) { newClassIds[name] = existing.id; console.log(`= .${name} (exists)`); continue }
  const id = nanoid()
  newClassIds[name] = id
  rules[id] = { id, name, kind: 'class', selector: `.${name}`, order: ++order,
    styles, contextStyles: {}, createdAt: Date.now(), updatedAt: Date.now() }
  console.log(`+ .${name}  class  order ${order}`)
}

for (const [selector, styles, contexts] of AMBIENT) {
  if (bySelector.has(selector)) { console.log(`= ${selector} (exists)`); continue }
  const id = nanoid()
  rules[id] = { id, name: selector, kind: 'ambient', selector, order: ++order,
    styles, contextStyles: contexts ?? {}, createdAt: Date.now(), updatedAt: Date.now() }
  console.log(`+ ${selector}  ambient  order ${order}`)
}

// ── nodes ──────────────────────────────────────────────────────────────────
const made = {}
const node = (moduleId, props, classIds, children) => {
  const id = nanoid()
  made[id] = { props, breakpointOverrides: {}, children: children ?? [], id, moduleId,
    classIds: classIds ?? [], parentId: null }
  for (const c of made[id].children) made[c].parentId = id
  return id
}
const box = (tag, attrs, classIds, children) =>
  node('base.container', { tag, customTag: tag === 'custom' ? attrs.customTag : '',
    htmlAttributes: attrs.html ?? {} }, classIds, children)
const text = (tag, value, classIds, html) =>
  node('base.text', { text: value, tag, htmlAttributes: html ?? {} }, classIds)

const cards = SERVICES.map(([href, title, blurb], i) => node('base.link',
  { href, target: '_self', htmlAttributes: {} },
  [newClassIds['sv-card']],
  [
    text('span', String(i + 1).padStart(2, '0'), [newClassIds['sv-no']]),
    text('h3', title, []),
    text('p', blurb, []),
    text('span', 'Explore', [newClassIds['sv-more']]),
  ]))

const chapterTag = box('div', { html: { 'data-rv': '' } }, [ID_CHTAG], [
  node('base.container', { tag: 'custom', customTag: 'i', htmlAttributes: {} }, [], []),
  text('span', 'Chapter 07 · The Services', [ID_LABEL]),
])

const head = box('div', {}, [newClassIds['sv-head']], [
  chapterTag,
  text('h2', 'Everything the practice does, in one place.', [], { 'data-rv': '' }),
  text('p', 'From a single implant to a full-arch rebuild — every treatment planned and carried out in the same two buildings, by the same team, with the laboratory down the hall.', [], { 'data-rv': '' }),
])

const grid = box('div', { html: { id: 'svcGrid', 'data-rv': 'stagger' } },
  [newClassIds['sv-grid']], cards)

const section = box('section',
  { html: { id: 'services', 'data-chapter': '7', 'data-chapter-name': 'The Services' } },
  [newClassIds['ch-services']],
  [box('div', {}, [ID_WRAP, ID_SECTION], [head, grid])])

// ── renumber, and splice in ────────────────────────────────────────────────
const proof = Object.values(nodes).find(n => n?.props?.htmlAttributes?.id === 'proof')
const invitation = Object.values(nodes).find(n => n?.props?.htmlAttributes?.id === 'invitation')
if (!proof || !invitation) { console.error('  ! #proof / #invitation not found'); process.exit(1) }
if (proof.parentId !== invitation.parentId) { console.error('  ! they do not share a parent'); process.exit(1) }
if (proof.props.htmlAttributes['data-chapter'] !== '7') {
  console.error(`  ! #proof is chapter ${proof.props.htmlAttributes['data-chapter']}, expected 7 — already run?`)
  process.exit(1)
}

const relabel = (sec, from, to) => {
  const want = `Chapter ${String(from).padStart(2, '0')} · `
  const hit = []
  const walk = id => { const n = nodes[id]; if (!n) return
    if (n.moduleId === 'base.text' && typeof n.props?.text === 'string' && n.props.text.startsWith(want)) hit.push(n)
    for (const c of n.children ?? []) walk(c) }
  walk(sec.id)
  if (hit.length !== 1) { console.error(`  ! ${sec.props.htmlAttributes.id}: found ${hit.length} "${want}…" labels, expected 1`); process.exit(1) }
  const before = hit[0].props.text
  hit[0].props.text = before.replace(want, `Chapter ${String(to).padStart(2, '0')} · `)
  return `${before}  ->  ${hit[0].props.text}`
}

console.log(`\n~ #proof      chapter 7 -> 8   ${relabel(proof, 7, 8)}`)
proof.props.htmlAttributes['data-chapter'] = '8'
console.log(`~ #invitation chapter 8 -> 9   ${relabel(invitation, 8, 9)}`)
invitation.props.htmlAttributes['data-chapter'] = '9'

const parent = nodes[proof.parentId]
const at = parent.children.indexOf(proof.id)
Object.assign(nodes, made)
made[section].parentId = parent.id
parent.children = [...parent.children.slice(0, at), section, ...parent.children.slice(at)]

console.log(`\n+ #services inserted at index ${at} of ${parent.children.length} in ${parent.id}`)
console.log(`  ${Object.keys(made).length} nodes, ${cards.length} service links`)

if (!APPLY) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

// ── write ──────────────────────────────────────────────────────────────────
// ONE atomic write. The rules and the nodes that reference them have to land
// together: rules without nodes are tree-shaken on publish, and nodes without
// rules render the section unstyled. `site` and `shellBaseSeq` are required
// even when the page is the point of the write (15-instatic-api-sync.md).
// changedPages entries are FLAT — { id, slug, title, nodes, rootNodeId } — and
// are built with toChangedPage, never by hand: it is what carries a page's
// `template` through, and omitting that once turned the `post` template into an
// ordinary page and 404'd all 43 articles.
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site: shell,
  changedPages: [toChangedPage(page, { nodes: body.nodes, rootNodeId: body.rootNodeId })],
  deletedPageIds: [],
  changedComponents: [],
  deletedComponentIds: [],
  changedLayouts: [],
  deletedLayoutIds: [],
  baseSeqs: { [page.id]: page.seq },
  shellBaseSeq: seq,
})
console.log('\nwrite:', JSON.stringify(res).slice(0, 200))

// Read back rather than trust the write.
const { rows: after } = await getPages()
const back = after.find(r => r.slug === 'index').cells.body.nodes
const sec = Object.values(back).find(n => n?.props?.htmlAttributes?.id === 'services')
const p2 = Object.values(back).find(n => n?.props?.htmlAttributes?.id === 'proof')
const i2 = Object.values(back).find(n => n?.props?.htmlAttributes?.id === 'invitation')
// Count links INSIDE the section. Matching service hrefs across the whole page
// counts the drawer and the footer too — that read 30 and cried failure on a
// write that was perfectly fine.
const links = []
;(function walk (id) {
  const n = back[id]; if (!n) return
  if (n.moduleId === 'base.link') links.push(n)
  for (const c of n.children ?? []) walk(c)
})(sec?.id)
let ok = !!sec && p2?.props.htmlAttributes['data-chapter'] === '8' && i2?.props.htmlAttributes['data-chapter'] === '9'
if (links.length !== SERVICES.length) { console.error(`  ! ${links.length} service links landed, wanted ${SERVICES.length}`); ok = false }
const { site: shellBack } = await getSite()
for (const [selector] of AMBIENT) {
  if (!Object.values(shellBack.styleRules ?? {}).some(r => r.selector === selector)) {
    console.error(`  ! ${selector} did not land`); ok = false
  }
}
// The one check that would have caught the 43 dead articles: an incremental
// write should not touch `post`, but verify rather than assume.
await assertTemplatesIntact({ post: true })
console.log(`verified   ${ok}`)
if (!ok) { console.error('WRITE DID NOT LAND — do not publish'); process.exit(1) }
console.log('\nDraft updated. Push site.js, then publish.')
