#!/usr/bin/env node
/**
 * push-services-images.mjs — BugHerd pin #8, the image on the services card.
 *
 *   node push-services-images.mjs            # report the plan, write nothing
 *   node push-services-images.mjs --apply    # write the draft (does NOT publish)
 *
 * The client, pinned on `a.sv-card` in Chapter 07:
 *
 *   "On desktop I want to have a hover effect with an image showing following
 *    the cursor and on mobile and tablet the image should be present on the
 *    card with no hover effect."
 *
 * The image arrives on BOTH sides; only the presentation differs. So there is
 * ONE image per card in the tree, authored here, and on a fine pointer
 * `sections/ch-services.js` takes the card's copy out of the flow and shows it
 * under the cursor on a single shared floating element instead. Eleven
 * absolutely-positioned images would have been the other way to build it and it
 * is worse on every axis: eleven more nodes in a section that is deliberately a
 * typographic index, eleven layers, and eleven fetches for a visitor who may
 * never reach Chapter 07.
 *
 * The behaviour half ships with site.js. PUSH THAT TOO or the registry rules
 * land with nothing to drive them:
 *
 *   node push-script-asset.mjs src/scripts/site.js \
 *        ../04-design/.tmp/final-site/assets/site.js --apply
 *
 * ## What it changes
 *
 * STYLE REGISTRY
 *   + 1 class rule    sv-shot — class-kind because the figure node references
 *                     it by id, which is also what keeps it through the publish
 *                     tree-shake.
 *   + 5 ambient rules the figure, its img, the fine-pointer hide, and the
 *                     floating element + its img. `.sv-follow` never appears in
 *                     the node tree (JS builds it), so it MUST be ambient —
 *                     a class-kind rule nothing references is shaken out. The
 *                     seven `.ch-path.is-swipe*` ambients survived exactly this
 *                     way in session 15b.
 *
 *   NO NEW CONDITION, and no condition at all: every rule here is base or is
 *   gated on a CLASS. `.wz-svfollow` is put on <html> by the section module and
 *   only after it has actually built the follower. A pointer media query would
 *   have been the obvious alternative and it is the wrong one on this platform —
 *   a non-viewport media query is stored as a custom condition emitted in raw
 *   array order (15-instatic-api-sync.md, "Cascade order"). A class is not.
 *
 * PAGE `index`
 *   + 22 nodes: a `<figure class="sv-shot" aria-hidden="true">` holding one
 *     `base.image`, inserted as the FIRST child of each of the 11 `.sv-card`s.
 *
 * MEDIA
 *   ~ altText on any of the eleven assets that has none. `base.image` reads alt
 *     EXCLUSIVELY from the resolved library asset, never from a per-instance
 *     prop (see push-asset-alt-text.mjs), so this is the only place an alt can
 *     be set — and one row here changes that image's alt on every page that
 *     renders it. Never overwrites an alt that is already there.
 *
 * ## The eleven images
 *
 * Library only. Nothing was bought from Magnific/Freepik and no quota was
 * spent: the client's ordering from pin #7 is library first, Freepik as the
 * fallback, and the library had a right answer for all eleven.
 *
 * They are an ALLOWLIST, hand-checked as pixels, for the reason
 * post-image-pool.mjs spells out: 443 assets, most of them `*-before` /
 * `*-after` case pairs, bare numeric case files, staff headshots and named
 * patient portraits. A blocklist cannot be trusted on that. None of the eleven
 * is a round-radius crop either — the whole square-PNG family in this library
 * (the 507/593/617/654/672/771px `*-graphic.png`, `*-icon-*.png`,
 * `sedation-*.png`, `full-arch-*.png` tiles) is the old WordPress circular
 * artwork and is skipped wholesale. That is pin #11's ask #2, kept out of their
 * way rather than added to their pile.
 *
 * MIN WIDTH IS 800, not the 1400 post-image-pool.mjs uses, and the difference
 * is deliberate. That number exists because an ARTICLE HERO renders ~860 CSS px
 * wide. The widest thing here is the follower at `clamp(200px,20vw,320px)`, so
 * 640 physical pixels covers it at 2x — and holding out for 1400 would have
 * meant passing over the model and treatment photography, which is what a
 * treatment card actually wants, in favour of practice interiors.
 *
 * Idempotent: a card that already carries `.sv-shot` is left alone.
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

/* href -> [asset filename, alt to write IF the asset has none].
   Keyed on the card's href rather than its index so a reorder of the section
   cannot silently re-pair pictures with the wrong treatments. */
const SHOTS = {
  '/dental-implants': ['dental-implant-crown-model.jpg', null],
  '/all-on-4': ['full-mouth-dental-implants-model.jpg', null],
  '/implant-supported-dentures': ['implant-supported-dentures-model-3.jpg',
    'A denture clipped onto implant locators'],
  '/cosmetic-dentistry': ['cosmetic-transformation.jpg', null],
  '/veneers': ['case-veneers-7-after.jpg', null],
  '/crowns-and-bridges': ['bridge-model.jpg', null],
  '/teeth-whitening': ['whitening-procedure.jpg', null],
  '/smile-makeover': ['8L6A7479.jpg',
    'An intraoral scanner beside the digital model of a patient’s arch'],
  '/oral-surgery': ['Dentist-holding-a-dental-implant-in-his-hands-.jpg', null],
  '/sedation-dentistry': ['sedation-dentistry-patient.jpg', null],
  '/emergency-dentistry': ['emergency-patient.jpg', null],
}

/** A card image never renders wider than the follower; see the header. */
const MIN_WIDTH = 800

const CLASS_RULES = { 'sv-shot': {} }

const PAD = 'clamp(1.5rem,2.6vw,2.25rem)'
const AMBIENT = [
  /* Full-bleed to the card's edges: the padding is cancelled rather than
     re-declared, so the plate cannot disagree with the card it sits in. The
     card is a column flex container and this is a stretched item, so a negative
     inline margin genuinely widens it — used cross size is the content width
     MINUS the margins — instead of overflowing it. */
  ['.ch-services .sv-shot',
    { position: 'relative', overflow: 'hidden', background: 'var(--card)',
      aspectRatio: '16/9', margin: `calc(-1 * ${PAD}) calc(-1 * ${PAD}) .4rem` }],
  ['.ch-services .sv-shot img',
    { display: 'block', width: '100%', height: '100%', objectFit: 'cover' }],

  /* Fine pointer: the card's copy leaves the flow entirely. `display:none` on a
     `loading="lazy"` image is also why the eleven cost a desktop visitor
     nothing until they hover — an image with no box never intersects, so it is
     never fetched. Verified, not assumed: probe-services-hover.mjs asserts all
     eleven have naturalWidth 0 at 1440. */
  ['.wz-svfollow .ch-services .sv-shot', { display: 'none' }],

  /* The follower. Built and appended to <body> by the section module, so on a
     coarse pointer it is absent from the DOM rather than present-and-hidden.
     z-index sits under the nav (120) and the drawer (125) on purpose: a plate
     chasing the cursor must never cover the site's own fixed chrome.
     `pointer-events:none` keeps it out of its own hit-testing — without it, it
     would steal the pointerleave from the card it is standing on.
     opacity/visibility start closed so nothing flashes before GSAP's first set;
     both are what `autoAlpha` drives. */
  ['.sv-follow',
    { position: 'fixed', left: '0', top: '0', zIndex: '100', pointerEvents: 'none',
      width: 'clamp(200px,20vw,320px)', aspectRatio: '16/9', overflow: 'hidden',
      background: 'var(--card)', opacity: '0', visibility: 'hidden', willChange: 'transform' }],
  ['.sv-follow img',
    { display: 'block', width: '100%', height: '100%', objectFit: 'cover' }],
]

// ── media ──────────────────────────────────────────────────────────────────
const { assets } = await api('GET', '/admin/api/cms/media')
/* Resolve each allowlisted filename to its LARGEST upload: this library holds
   duplicate uploads of the same picture at different sizes, and picking by
   filename alone would sometimes take the small one. */
const byName = new Map()
for (const a of assets) {
  if (!a.publicPath || !/^image\//.test(a.mimeType ?? '')) continue
  if ((a.width ?? 0) < MIN_WIDTH) continue
  const prev = byName.get(a.filename)
  if (!prev || (a.width ?? 0) * (a.height ?? 0) > (prev.width ?? 0) * (prev.height ?? 0)) byName.set(a.filename, a)
}

const picks = []
for (const [href, [file, altIfMissing]] of Object.entries(SHOTS)) {
  const a = byName.get(file)
  if (!a) { console.error(`  ! ${file} is not in the library at >= ${MIN_WIDTH}px — refusing`); process.exit(1) }
  picks.push({ href, file, asset: a, altIfMissing })
}
/* Two pictures on one card would be invisible in a readback that only counted
   nodes, so assert it here where it is cheap. */
const seen = new Set()
for (const p of picks) {
  if (seen.has(p.asset.id)) { console.error(`  ! ${p.file} is claimed twice — refusing`); process.exit(1) }
  seen.add(p.asset.id)
}

console.log(`${picks.length} images, all from the library:\n`)
for (const p of picks) {
  console.log(`  ${p.href.padEnd(30)} ${String(p.asset.width).padStart(4)}x${String(p.asset.height).padEnd(4)}` +
    `  ${p.asset.publicPath}\n${' '.repeat(32)}alt ${p.asset.altText ? JSON.stringify(p.asset.altText) : `MISSING -> ${JSON.stringify(p.altIfMissing)}`}`)
}

// ── one attempt: read fresh, build, write ──────────────────────────────────
/**
 * Three other agents are writing this same document right now, so the
 * read -> write window is kept as small as it can be and a 409 is retried from
 * a FRESH read rather than forced. A seq that jumped since the last read is one
 * of them, not corruption.
 */
async function attempt (n) {
  const { site: shell, seq } = await getSite()
  const rules = shell.styleRules ?? {}
  shell.styleRules = rules

  const { rows } = await getPages()
  const page = rows.find((r) => r.slug === 'index')
  if (!page) throw new Error('no index page')
  const nodes = page.cells.body.nodes

  const section = Object.values(nodes).find((x) => x?.props?.htmlAttributes?.id === 'services')
  if (!section) throw new Error('#services is not on the page — run push-services-section.mjs first')
  const grid = Object.values(nodes).find((x) => x?.props?.htmlAttributes?.id === 'svcGrid')
  if (!grid) throw new Error('#svcGrid not found')

  const svCardId = Object.values(rules).find((r) => r.kind === 'class' && r.name === 'sv-card')?.id
  if (!svCardId) throw new Error('no .sv-card class rule — this is not the section this script knows')
  const cards = grid.children.map((id) => nodes[id]).filter((x) => x && (x.classIds ?? []).includes(svCardId))
  if (cards.length !== picks.length) throw new Error(`${cards.length} cards in #svcGrid, expected ${picks.length}`)

  /* Idempotence: a card that already has a figure is left alone. */
  const already = cards.filter((c) => (c.children ?? []).some((id) => nodes[id]?.moduleId === 'base.container' &&
    nodes[id]?.props?.customTag === 'figure'))
  if (already.length === cards.length) return { done: true, seq }
  if (already.length) throw new Error(`${already.length} of ${cards.length} cards already carry a figure — half-applied, refusing`)

  /* No image on this page may be spent twice. Cross-PAGE reuse is explicitly
     out of scope (pin #11: "not to repeat images on the same page"), so this
     looks at the index tree only. */
  const onPage = new Set(Object.values(nodes).filter((x) => x.moduleId === 'base.image' || x.moduleId === 'base.video')
    .flatMap((x) => [x.props?.src, x.props?.poster, x.props?.videoUrl]).filter(Boolean))
  const clash = picks.filter((p) => onPage.has(p.asset.publicPath))
  if (clash.length) throw new Error(`already on the home page: ${clash.map((c) => c.file).join(', ')}`)

  // -- registry --
  let order = Math.max(...Object.values(rules).map((r) => r.order ?? 0))
  const byName2 = new Map(Object.values(rules).filter((r) => r.kind === 'class').map((r) => [r.name, r]))
  /* A selector can exist TWICE in this registry — an empty class-kind rule that
     names the class plus an ambient that paints it. Match on kind as well as
     selector so an upsert cannot write one and verify the other (session 16). */
  const hasAmbient = (sel) => Object.values(rules).some((r) => r.kind === 'ambient' && r.selector === sel)

  const classIds = {}
  const added = []
  for (const [name, styles] of Object.entries(CLASS_RULES)) {
    const existing = byName2.get(name)
    if (existing) { classIds[name] = existing.id; continue }
    const id = nanoid()
    classIds[name] = id
    rules[id] = { id, name, kind: 'class', selector: `.${name}`, order: ++order,
      styles, contextStyles: {}, createdAt: Date.now(), updatedAt: Date.now() }
    added.push(`.${name} (class)`)
  }
  for (const [selector, styles] of AMBIENT) {
    if (hasAmbient(selector)) continue
    const id = nanoid()
    rules[id] = { id, name: selector, kind: 'ambient', selector, order: ++order,
      styles, contextStyles: {}, createdAt: Date.now(), updatedAt: Date.now() }
    added.push(`${selector} (ambient)`)
  }

  // -- nodes --
  const made = {}
  const node = (moduleId, props, classIds2, children) => {
    const id = nanoid()
    made[id] = { props, breakpointOverrides: {}, children: children ?? [], id, moduleId,
      classIds: classIds2 ?? [], parentId: null }
    for (const c of made[id].children) made[c].parentId = id
    return id
  }

  const byHref = new Map(picks.map((p) => [p.href, p]))
  const figures = []
  for (const card of cards) {
    const pick = byHref.get(card.props?.href)
    if (!pick) throw new Error(`no image mapped for card href ${JSON.stringify(card.props?.href)}`)
    /* `figure` is not one of base.container's built-in tags; 'custom' is the
       documented escape hatch and is what the chapter tag's <i> already uses.
       aria-hidden because the card is a LINK: without it the image's alt joins
       the link's accessible name, and "An abutment and crown on an implant post
       01 Dental Implants Single implants..." is not a link name. The card's own
       text says everything the picture does. */
    const img = node('base.image',
      { src: pick.asset.publicPath, loading: 'lazy', fetchPriority: 'auto', decoding: 'async', htmlAttributes: {} },
      [], [])
    const fig = node('base.container',
      { tag: 'custom', customTag: 'figure', htmlAttributes: { 'aria-hidden': 'true' } },
      [classIds['sv-shot']], [img])
    made[fig].parentId = card.id
    figures.push({ card, fig })
  }

  console.log(`\nattempt ${n}: shell seq ${seq}, index seq ${page.seq}`)
  console.log(`  + ${added.length} style rules${added.length ? `: ${added.join(', ')}` : ' (all present)'}`)
  console.log(`  + ${Object.keys(made).length} nodes across ${figures.length} cards`)

  if (!APPLY) return { dry: true }

  Object.assign(nodes, made)
  for (const { card, fig } of figures) card.children = [fig, ...card.children]

  const res = await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental',
    site: shell,
    changedPages: [toChangedPage(page, { nodes: page.cells.body.nodes, rootNodeId: page.cells.body.rootNodeId })],
    deletedPageIds: [],
    changedComponents: [],
    deletedComponentIds: [],
    changedLayouts: [],
    deletedLayoutIds: [],
    baseSeqs: { [page.id]: page.seq },
    shellBaseSeq: seq,
  })
  return { res, seq }
}

// ── alt text first ─────────────────────────────────────────────────────────
/* Media writes bump the shell seq (variant bookkeeping), so they go BEFORE the
   document read, never between it and the write. */
if (APPLY) {
  for (const p of picks) {
    if (p.asset.altText && p.asset.altText.trim()) continue
    if (!p.altIfMissing) { console.warn(`  ! ${p.file} has no alt and none was written for it`); continue }
    await api('PATCH', `/admin/api/cms/media/${p.asset.id}`, { altText: p.altIfMissing })
    const back = (await api('GET', '/admin/api/cms/media')).assets.find((a) => a.id === p.asset.id)
    if (back?.altText !== p.altIfMissing) { console.error(`  ! alt did not land on ${p.file}`); process.exit(1) }
    console.log(`  alt  ${p.file}  ${JSON.stringify(p.altIfMissing)}`)
  }
}

let out
for (let n = 1; n <= 6; n++) {
  try {
    out = await attempt(n)
    break
  } catch (e) {
    if (e.status === 409 && n < 6) { console.log(`  409 (someone else wrote) — re-reading and retrying`); continue }
    console.error(`  ! ${e.message}`)
    process.exit(1)
  }
}
if (out.done) { console.log('\nevery card already carries a figure — nothing to do'); process.exit(0) }
if (out.dry) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }
console.log('\nwrite:', JSON.stringify(out.res).slice(0, 160))

// ── read back ──────────────────────────────────────────────────────────────
/* SUBTREE-SCOPED. The drawer and the footer live in this same node tree, so
   counting `base.image` across the whole page reads dozens and says nothing
   about Chapter 07 — the same mistake that made the section push cry failure
   over a perfect write (session 15b). */
const { rows: after } = await getPages()
const back = after.find((r) => r.slug === 'index').cells.body.nodes
const sec = Object.values(back).find((n) => n?.props?.htmlAttributes?.id === 'services')
const found = []
;(function walk (id) {
  const n = back[id]; if (!n) return
  if (n.moduleId === 'base.image') found.push(n)
  for (const c of n.children ?? []) walk(c)
})(sec?.id)

let ok = !!sec
if (found.length !== picks.length) { console.error(`  ! ${found.length} images inside #services, wanted ${picks.length}`); ok = false }
const want = new Set(picks.map((p) => p.asset.publicPath))
for (const n of found) if (!want.has(n.props.src)) { console.error(`  ! unexpected image ${n.props.src}`); ok = false }
if (new Set(found.map((n) => n.props.src)).size !== found.length) { console.error('  ! a picture landed on two cards'); ok = false }
/* Each one must be first in its card and wrapped in the figure, or the CSS
   selector and the full-bleed margins both miss. */
for (const n of found) {
  const fig = back[n.parentId]
  const card = back[fig?.parentId]
  if (fig?.props?.customTag !== 'figure') { console.error(`  ! ${n.props.src} is not inside a <figure>`); ok = false }
  if (fig?.props?.htmlAttributes?.['aria-hidden'] !== 'true') { console.error(`  ! ${n.props.src}'s figure is not aria-hidden`); ok = false }
  if (card?.children?.[0] !== fig?.id) { console.error(`  ! ${n.props.src} is not the first child of its card`); ok = false }
}
const { site: shellBack } = await getSite()
for (const [selector] of AMBIENT) {
  if (!Object.values(shellBack.styleRules ?? {}).some((r) => r.kind === 'ambient' && r.selector === selector)) {
    console.error(`  ! ambient ${selector} did not land`); ok = false
  }
}
if (!Object.values(shellBack.styleRules ?? {}).some((r) => r.kind === 'class' && r.name === 'sv-shot')) {
  console.error('  ! class rule .sv-shot did not land'); ok = false
}
/* An incremental write should not touch `post`, but verify rather than assume:
   this is the check that would have caught the 43 dead articles. */
await assertTemplatesIntact({ post: true })

console.log(`verified   ${ok}   (${found.length} images in #services)`)
if (!ok) { console.error('WRITE DID NOT LAND — do not publish'); process.exit(1) }
console.log('\nDraft updated. Push site.js next; nothing here published.')
