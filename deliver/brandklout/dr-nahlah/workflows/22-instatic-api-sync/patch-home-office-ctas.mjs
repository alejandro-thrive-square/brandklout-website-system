#!/usr/bin/env node
/**
 * patch-home-office-ctas.mjs — give the home page's closing call to action the
 * two offices, and stop it booking everyone into one of them.
 *
 *   node patch-home-office-ctas.mjs            # report the plan, write nothing
 *   node patch-home-office-ctas.mjs --apply    # write the draft (does NOT publish)
 *
 * ## The defect
 *
 * `.iv-cta` closed the home page with one button, "Book Your Free Consult",
 * pointing at `https://flexbook.me/drnahlah`. The two practices keep SEPARATE
 * Flexbook calendars and that URL is the ALEXANDRIA one, so every visitor who
 * took the page's main call to action was booked into Alexandria — including
 * the ones who had just read the McLean address two hundred pixels above it.
 * Nothing on the page said so.
 *
 * The Webflow build fixed the same defect on 2026-08-24 by replacing that
 * button with the two office cards, each carrying its own Flexbook link. This
 * does the same thing in this design's own vocabulary:
 *
 *   - each `.iv-loc` card gains its own "Book now" button, so a reader who has
 *     already decided goes straight to the right calendar;
 *   - the gold band's button goes to `/contact#book`, the office chooser, which
 *     is the honest destination for a button that cannot know which office the
 *     reader wants.
 *
 * ## Why this is surgery and not a page rebuild
 *
 * The home page carries an Embed block the CLIENT pasted in (the LeadConnector
 * review widget) and a review wall that has already been lost once to a
 * wholesale rewrite — see restore-review-wall.mjs. Replacing the page body to
 * change three links would put both at risk for no reason. This touches four
 * nodes and asserts every one of them before and after.
 *
 * Offices are matched by their <h3>, never by node id, so the script re-runs
 * safely and fails loudly if the section is ever restructured.
 *
 * NOTHING HERE PUBLISHES.
 */
import { randomBytes } from 'node:crypto'
import { api, getSite, getPages } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')

const OFFICES = [
  { h3: 'Tysons Corner · McLean', book: 'https://www.flexbook.me/DrNahlahTy/1' },
  { h3: 'Alexandria', book: 'https://flexbook.me/drnahlah' },
]
const CHOOSER = '/contact#book'

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = () => {
  const b = randomBytes(21)
  let s = ''
  for (let i = 0; i < 21; i++) s += ALPHABET[b[i] & 63]
  return s
}

const site = await getSite()
const rules = site.site.styleRules
const classId = (name) => {
  const hit = Object.values(rules).find((r) => r.name === name && r.kind === 'class')
  if (!hit) throw new Error(`no class rule named ${name}`)
  return hit.id
}
const BTN = [classId('btn'), classId('btn-primary'), classId('magnetic')]
const IV_LOC = classId('iv-loc')

const row = (await getPages()).rows.find((r) => r.slug === 'index')
if (!row) throw new Error('no index page')
const nodes = row.cells.body.nodes
const before = Object.keys(nodes).length

/* Counted BEFORE the edit and asserted unchanged after it, rather than against
   a fixed number. The six `.rv-card` review fallbacks have been lost twice to
   unrelated page writes (restore-review-wall.mjs exists because of the first),
   so this page's verification has to notice a change — but it must notice a
   change THIS SCRIPT made, not carry an expectation of what the section ought
   to contain. On 2026-08-24 the draft already held ZERO rv-cards: the client's
   pasted review widget replaced that block again after the August restore. An
   assertion of `=== 6` failed a write that was entirely correct. */
const rvCardId = classId('rv-card')
const rvBefore = Object.values(nodes).filter((n) => (n.classIds ?? []).includes(rvCardId)).length
const embedBefore = Object.values(nodes).filter((n) => n.moduleId === 'webzite.embed-origins.embed').length

const text = (n) => (n?.props ?? {}).text ?? ''
const changes = []

// ── 1. a Book now button in each office card ───────────────────────────────

for (const office of OFFICES) {
  const card = Object.values(nodes).find((n) =>
    (n.classIds ?? []).includes(IV_LOC) &&
    n.children.some((c) => text(nodes[c]).trim() === office.h3))
  if (!card) throw new Error(`no .iv-loc card headed "${office.h3}"`)

  const already = card.children
    .map((c) => nodes[c])
    .find((n) => n.moduleId === 'base.button' && (n.props ?? {}).href === office.book)
  if (already) { changes.push(`${office.h3}: book button already present`); continue }

  const stray = card.children
    .map((c) => nodes[c])
    .find((n) => n.moduleId === 'base.button')
  if (stray) throw new Error(`${office.h3}: card already has a button (${stray.props.href})`)

  const node = {
    props: {
      label: 'Book now',
      href: office.book,
      target: '_blank',
      disabled: false,
      buttonType: 'button',
      htmlAttributes: {},
    },
    breakpointOverrides: {},
    children: [],
    id: nanoid(),
    moduleId: 'base.button',
    classIds: [...BTN],
    parentId: card.id,
  }
  nodes[node.id] = node
  card.children = [...card.children, node.id]
  changes.push(`${office.h3}: + Book now -> ${office.book}`)
}

// ── 2. the gold band's button goes to the chooser ──────────────────────────

const cta = Object.values(nodes).find((n) =>
  n.moduleId === 'base.button' && text(n) === '' &&
  (n.props ?? {}).label === 'Book Your Free Consult')
if (!cta) throw new Error('no "Book Your Free Consult" button on the home page')

if (cta.props.href === CHOOSER) {
  changes.push('gold CTA already points at the chooser')
} else {
  changes.push(`gold CTA: ${cta.props.href} -> ${CHOOSER}`)
  cta.props = { ...cta.props, href: CHOOSER, target: '_self' }
}

for (const c of changes) console.log(' ', c)
console.log(`nodes ${before} -> ${Object.keys(nodes).length}`)

if (!APPLY) { console.log('\ndry run — nothing written. re-run with --apply'); process.exit(0) }

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site: site.site,
  changedPages: [{
    id: row.id, slug: row.slug, title: row.cells.title,
    nodes, rootNodeId: row.cells.body.rootNodeId,
  }],
  deletedPageIds: [],
  changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: { [row.id]: row.seq },
  shellBaseSeq: site.seq,
})
console.log('written:', JSON.stringify(res).slice(0, 200))

// ── verify, against a fresh read ───────────────────────────────────────────

const fresh = (await getPages()).rows.find((r) => r.slug === 'index').cells.body.nodes
const V = Object.values(fresh)
const books = V.filter((n) => n.moduleId === 'base.button' && /flexbook/.test((n.props ?? {}).href ?? ''))
  .map((n) => n.props.href).sort()
const goldCta = V.find((n) => (n.props ?? {}).label === 'Book Your Free Consult')
/* The client's pasted review widget lives on this page. Losing it to an
   unrelated edit is exactly what happened in August; assert both it and the
   review fallbacks came through this write unchanged. */
const widget = V.filter((n) => n.moduleId === 'webzite.embed-origins.embed').length
const cards = V.filter((n) => (n.classIds ?? []).includes(rvCardId)).length

const want = OFFICES.map((o) => o.book).sort()
const ok = JSON.stringify(books) === JSON.stringify(want) &&
  goldCta?.props?.href === CHOOSER && widget === embedBefore && cards === rvBefore
console.log(`${ok ? 'OK  ' : 'BAD '} flexbook links ${JSON.stringify(books)} · ` +
  `gold CTA ${goldCta?.props?.href} · review embed ${widget}/${embedBefore} · rv-card ${cards}/${rvBefore}`)
if (!ok) { console.error('\nhome page is not as expected — do NOT publish.'); process.exit(1) }
if (cards === 0) {
  console.log('\nNOTE, and it is not this script\'s doing: the home page carries ZERO .rv-card\n' +
    'review fallbacks. They were restored on 2026-08-22 and the client\'s pasted\n' +
    'review widget has replaced that block again since. With the widget blocked or\n' +
    'slow there is now no review copy on the page and no no-JS copy for a crawler.\n' +
    'node restore-review-wall.mjs --apply puts them back above the widget.')
}
console.log('\nhome page CTAs carry both offices. Nothing published.')
