#!/usr/bin/env node
/**
 * Create Mason Park's 404 page and wire it to Instatic's `notFound` template target.
 *
 * ── WHY A TEMPLATE, NOT A PAGE ────────────────────────────────────────────
 * Instatic serves public 404s from whichever page carries
 * `template.target = { kind: 'notFound' }`. On publish, `publishSite.ts` bakes
 * that page to the `404.html` artefact; `renderNotFoundResponse` in
 * `publish/publicRouter.ts` then serves it with a real **status 404** for every
 * GET no route claimed. Without one the dispatcher falls through to a bare
 * 21-byte `{"error":"Not found"}` — which is what every Mason Park hostname
 * served before this script.
 *
 * A template page is deliberately NOT baked at its own slug
 * (`isTemplatePage(page) -> continue` in publishSite), so slug `404` cannot
 * collide with the `404.html` artefact and never appears as an ordinary route.
 * `/404` answering 200 with the same body is the static-hosting convention,
 * not a bug.
 *
 * ── HOW THIS DIFFERS FROM DR. NAHLAH'S VERSION ────────────────────────────
 * Same mechanism, different site, and one thing is much safer here.
 *
 * Dr. Nahlah's style registry keys rules by random nanoid, so its script had to
 * hardcode twelve opaque ids and assert every one — a wrong id is SILENT, and
 * publishes a completely unstyled page. Mason Park is a Client-First build
 * whose style-rule IDS ARE THE CLASS NAMES (`section_hero` -> `.section_hero`),
 * so the mapping is legible and `assertClasses()` reads as documentation. The
 * assertion is kept anyway: it is what turns a renamed class into a refusal
 * instead of an unstyled live page.
 *
 * Mason Park also has NO templates at all (Dr. Nahlah has `post`, for 43
 * articles) and no `everywhere` layout, so every page carries its own chrome.
 * The 404 therefore CLONES a donor page — `about-us` — keeping the topbar,
 * navbar, scrim, contact band, accreditations, footer and call bar byte for
 * byte, stripping every child of `main.main-wrapper`, and rebuilding one hero
 * from the site's own classes. Nothing is added to the style registry.
 *
 * Node ids are REMAPPED to fresh ones. They are page-scoped, but the runtime
 * hole manifest and the editor both key on them, and two pages sharing ids is a
 * class of bug nobody wants to debug later.
 *
 * ── TRAPS ─────────────────────────────────────────────────────────────────
 *  1. `INSTATIC_BASE_URL` in the repo `.env` is NOT staging. Always pass it
 *     explicitly; this script refuses to run without it.
 *  2. `insta-api.mjs` caches one session cookie in `lib/.tmp/.session` with no
 *     record of which host it came from, so switching environments silently
 *     reuses the other one's. We delete it up front.
 *  3. `site` is REQUIRED in the `PUT /site-document` body even when the shell
 *     is unchanged — omit it and you get a bare `400 Invalid request body` that
 *     reads like a problem with the page payload. Ship the shell you just read.
 *  4. The published `<title>` comes from `page.title`. `seo-head.js` keys off
 *     `location.pathname`, which on a 404 is the missed URL, and returns early
 *     on a miss — so the static title is the ONLY title this page will have.
 *  5. `publish` bakes the WHOLE draft, not your change. Check
 *     `GET /publish/status` says `draftMatchesPublished: true` before
 *     publishing anywhere you care about, or you ship whatever else was
 *     sitting unreviewed in the draft.
 *
 *   INSTATIC_BASE_URL=https://staging.masonparkdental.com node push-404-page.mjs
 *   INSTATIC_BASE_URL=https://staging.masonparkdental.com node push-404-page.mjs --apply
 *   INSTATIC_BASE_URL=https://staging.masonparkdental.com node push-404-page.mjs --apply --publish
 */
import { existsSync, unlinkSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { api, getSite, getPages, publish, publishStatus, BASE } from '../../../../process/18-instatic-embeds/lib/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const TMP = join(HERE, '.tmp')
mkdirSync(TMP, { recursive: true })
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
// Re-running is normal: staging first, then production, and again whenever the
// copy changes. Without this the script refuses the moment a /404 exists, which
// leaves no way to correct one. --overwrite REUSES the existing page's row id so
// the save updates that row instead of creating a second page on the same slug.
const OVERWRITE = process.argv.includes('--overwrite')
// Publish even though the draft already differs from published. Only ever safe
// when you know what the pending delta is — see the check further down.
const ALLOW_DIRTY = process.argv.includes('--allow-dirty-draft')

if (!process.env.INSTATIC_BASE_URL) {
  console.error('refusing to run: set INSTATIC_BASE_URL explicitly (the .env default is not staging)')
  process.exit(2)
}
// Trap 2: the session cache is shared across hosts.
const SESSION = join(HERE, '..', '..', '..', '..', 'process', '18-instatic-embeds', 'lib', '.tmp', '.session')
if (existsSync(SESSION)) unlinkSync(SESSION)

const SLUG = '404'
const TITLE = 'Page Not Found | Mason Park Dental of Katy'
const DONOR = 'about-us'

const PHONE_LABEL = '(281) 769-8878'
const PHONE_HREF = 'tel:+12817698878'
const BOOK_HREF = 'https://www.flexbook.me/masonpark/1'
const ADDRESS = 'Mason Park Dental of Katy - 21830 Kingsland Blvd #104, Katy, TX 77450'

/**
 * Classes this page builds with, as `id -> expected selector`.
 *
 * On this site the id and the name are the same string, which makes the table
 * readable — but it is still a claim about a live registry, so it is asserted.
 * A class id that resolves to nothing publishes a node with no styling and no
 * error, so this refuses to build rather than shipping an unstyled 404.
 */
const CLS = {
  sectionHero:  ['section_hero', '.section_hero'],
  heroComponent:['hero_component', '.hero_component'],
  isPlain:      ['is-plain', '.is-plain'],
  paddingGlobal:['padding-global', '.padding-global'],
  containerLarge:['container-large', '.container-large'],
  paddingSection:['padding-section-large', '.padding-section-large'],
  eyebrow:      ['text-style-eyebrow', '.text-style-eyebrow'],
  h1:           ['heading-style-h1', '.heading-style-h1'],
  spacerSmall:  ['spacer-small', '.spacer-small'],
  textMedium:   ['text-size-medium', '.text-size-medium'],
  buttonGroup:  ['button-group', '.button-group'],
  button:       ['button', '.button'],
  buttonGhost:  ['is-ghost', '.is-ghost'],
  cardMeta:     ['card_meta', '.card_meta'],
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
  for (const k of Object.keys(CLS)) CLS[k] = CLS[k][0]
}

/**
 * slug -> template, for every page that declares one. Trap 3's proof.
 *
 * `GET /pages` returns the template FLATTENED across three cells
 * (`templateEnabled` / `templateTarget` / `templatePriority`) even though
 * `PUT /site-document` accepts — and this script sends — a nested `template`
 * object. Reading `cells.template` here returns undefined for every row, which
 * looks exactly like "the template did not save" on a save that worked
 * perfectly. Read the flattened cells, and fall back to the nested shape.
 */
async function templateMap() {
  const rows = (await getPages()).rows ?? []
  const out = {}
  for (const r of rows) {
    const c = r.cells ?? {}
    const slug = c.slug ?? r.slug
    if (c.templateEnabled) {
      out[slug] = { enabled: true, target: c.templateTarget, priority: c.templatePriority }
    } else {
      const t = c.template ?? r.template
      if (t && t.enabled) out[slug] = t
    }
  }
  return out
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'
const nid = (len = 21) => Array.from({ length: len }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')

// ── Trap 5, checked BEFORE this run changes anything ───────────────────────
// `publish` bakes the WHOLE draft, so publishing with a dirty draft ships
// whatever else was sitting unreviewed in it. This has to be read before the
// save below, not after: afterwards the draft is dirty BY DEFINITION — with
// this script's own page — and the check can never pass on a second run.
const startStatus = await publishStatus()
if (PUBLISH && !startStatus.draftMatchesPublished && !ALLOW_DIRTY) {
  console.error(`refusing to publish: ${BASE} already has unpublished draft changes`)
  console.error(`  ${JSON.stringify(startStatus)}`)
  console.error('Publishing would ship them too. Review them, or pass --allow-dirty-draft')
  console.error('if you know the pending delta is yours (e.g. an earlier run of this script).')
  process.exit(1)
}

// ── read the donor ─────────────────────────────────────────────────────────
const pages = (await getPages()).rows
const slugOf = (p) => p.cells?.slug ?? p.slug
const existing = pages.find((p) => slugOf(p) === SLUG)
if (existing && !OVERWRITE) {
  console.error(`a page with slug "${SLUG}" already exists on ${BASE} — pass --overwrite to replace it`)
  process.exit(1)
}
const donorRow = pages.find((p) => slugOf(p) === DONOR)
if (!donorRow) { console.error(`donor page "${DONOR}" not found on ${BASE}`); process.exit(1) }
const donor = (await api('GET', `/admin/api/cms/data/rows/${donorRow.id}`)).row
const src = donor.cells.body.nodes
const srcRoot = donor.cells.body.rootNodeId

// ── locate <main> ──────────────────────────────────────────────────────────
// Mason Park's chrome is not wrapped in a #smooth-content div (Dr. Nahlah's is),
// so main is found by tag anywhere in the tree rather than as a known child.
const mainId = Object.keys(src).find((id) => src[id].props?.tag === 'main')
if (!mainId) { console.error(`donor "${DONOR}" has no <main>`); process.exit(1) }

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
const strippedSections = nodes[mainId].children.length
for (const secId of [...nodes[mainId].children]) prune(secId)
nodes[mainId].children = []

await assertClasses()

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
const link = (parent, href, text, { classIds = [], target = '_self' } = {}) =>
  add(parent, { moduleId: 'base.link', props: { href, text, target, htmlAttributes: {} }, classIds })

const hero = box(mainId, {
  tag: 'section',
  classIds: [CLS.sectionHero, CLS.heroComponent, CLS.isPlain],
})
const pad = box(hero, { classIds: [CLS.paddingGlobal] })
const container = box(pad, { classIds: [CLS.containerLarge] })
const inner = box(container, { classIds: [CLS.paddingSection] })

txt(inner, '404 - Page not found', { tag: 'p', classIds: [CLS.eyebrow] })
txt(inner, 'We could not find that page.', { tag: 'h1', classIds: [CLS.h1] })
box(inner, { classIds: [CLS.spacerSmall] })
txt(inner, 'The page you were looking for has moved, or it never existed. Nothing is lost - you can head back to the homepage, or call the practice and we will point you to the right place.', {
  tag: 'p',
  classIds: [CLS.textMedium],
})
box(inner, { classIds: [CLS.spacerSmall] })

const actions = box(inner, { classIds: [CLS.buttonGroup] })
link(actions, '/', 'Back to home', { classIds: [CLS.button] })
link(actions, BOOK_HREF, 'Schedule online', { classIds: [CLS.button, CLS.buttonGhost], target: '_blank' })
link(actions, PHONE_HREF, `Call ${PHONE_LABEL}`, { classIds: [CLS.button, CLS.buttonGhost] })

box(inner, { classIds: [CLS.spacerSmall] })
txt(inner, ADDRESS, { tag: 'p', classIds: [CLS.cardMeta] })

// ── remap every node id ────────────────────────────────────────────────────
const map = new Map(Object.keys(nodes).map((id) => [id, nid()]))
const remapped = {}
for (const [oldId, n] of Object.entries(nodes)) {
  const id = map.get(oldId)
  remapped[id] = { ...n, id, parentId: n.parentId ? map.get(n.parentId) : null, children: n.children.map((c) => map.get(c)) }
}

const entry = {
  id: existing ? existing.id : nid(),
  slug: SLUG,
  title: TITLE,
  nodes: remapped,
  rootNodeId: map.get(srcRoot),
  template: { enabled: true, target: { kind: 'notFound' }, priority: 100 },
}

console.log(BASE)
console.log(`  donor        ${DONOR} (${Object.keys(src).length} nodes, ${strippedSections} main sections stripped)`)
console.log(`  ${existing ? 'REPLACING ' : 'new page  '}   /${SLUG}  "${TITLE}"`)
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
// Trap 3: `site` is required even though nothing about the shell changes.
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
  // Overwriting an EXISTING row means quoting the seq it was read at, exactly
  // like shellBaseSeq does for the shell. Sending {} against a row that already
  // exists is a 409 "Another admin saved a newer version" — which names no
  // other admin, because there isn't one: the newer version is the row's own
  // current seq, unquoted. A brand-new row has no seq and needs no entry.
  baseSeqs: existing ? { [existing.id]: existing.seq } : {},
  shellBaseSeq: seq,
})
console.log(`\nsaved: ${JSON.stringify(res)}`)

const after = await templateMap()
const lost = Object.keys(before).filter((s) => !after[s])
if (lost.length) {
  console.error(`TEMPLATES LOST: ${lost.join(', ')} — do NOT publish`)
  process.exit(1)
}
if (!after[SLUG]) {
  console.error(`the new /${SLUG} page did not save as a template`)
  process.exit(1)
}
console.log(`templates after save: ${Object.keys(after).sort().join(', ') || '(none)'}`)

if (!PUBLISH) {
  console.log('\nsaved to draft — rerun with --apply --publish to publish')
  process.exit(0)
}
console.log('\npublishing…')
console.log(JSON.stringify(await publish()))
