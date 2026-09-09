#!/usr/bin/env node
/**
 * push-post-template.mjs — BugHerd pin #7, the design half.
 *
 *   node push-post-template.mjs            # report the plan, write nothing
 *   node push-post-template.mjs --apply    # write the draft (does NOT publish)
 *
 * The 43 articles arrived from WordPress as a bare column: breadcrumb, title,
 * date, body, nothing else. This gives the `post` TEMPLATE — so, all 43 at once
 * — a featured-image hero, a consult block and a related strip. The contents
 * list is not here: it has to be built at runtime, for the reason below.
 *
 * ## What the outlet forces
 *
 * The article renders through a single `base.outlet`, the only child of
 * `.bl-body`. Title, date and body arrive as ONE block and the template cannot
 * reach inside it. So anything that belongs *between* the title and the first
 * paragraph — the contents list — cannot be a template node, and is built in
 * `sections/blog-post.js` instead. Everything here sits either side of the
 * outlet, which is all the template can address.
 *
 * ## The hero binding
 *
 * `posts.featuredMedia` already existed as a `media` field and was empty on all
 * 43 rows; `pick-post-images.mjs` filled it. The image node reads it through
 *
 *     dynamicBindings: { src: { source: 'currentEntry', field: 'featuredMedia',
 *                               format: 'media' } }
 *
 * (`src/core/page-tree/dynamicBinding.ts`). `currentEntry` on a single-entry
 * template page is the entry being viewed. Alt text is NOT set here: `base.image`
 * reads alt exclusively from the resolved library asset, so it lives on the
 * media row — see push-asset-alt-text.mjs.
 *
 * ## The related strip
 *
 * A `base.loop` over the posts table, exactly as the Journal index builds its
 * grid, with `{currentEntry.permalink}` / `{currentEntry.title}` tokens. It asks
 * for FOUR and shows three, because the loop has no "not equal" filter — the
 * article being read can appear in its own related list, and blog-post.js drops
 * it by href. Asking for four means removing one never leaves a short row.
 *
 * ## Tree-shake note
 *
 * `bl-toc` is deliberately NOT registered as a class rule. It only ever exists
 * at runtime, so a class-kind rule for it would be referenced by no node, count
 * as unused, and take every `.bl-toc …` ambient rule down with it at publish.
 * Left unregistered it is invisible to the shake and the ambient rules survive —
 * the same reason `.wz-fine` and `.is-swipe` are unregistered.
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
const M700 = 'media:(min-width: 700px)'

// ── registry ───────────────────────────────────────────────────────────────
const CLASS_RULES = {
  'bl-hero': { marginBottom: 'clamp(1.75rem,3.5vw,2.5rem)' },
  'bl-cta': {
    marginTop: 'clamp(2.5rem,5vw,3.5rem)', padding: 'clamp(1.6rem,3.4vw,2.4rem)',
    background: 'var(--bg-3)', border: '1px solid var(--line)', display: 'flex',
    flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center', justifyContent: 'space-between',
  },
  'bl-related': {
    marginTop: 'clamp(2.5rem,5vw,4rem)', paddingTop: 'clamp(1.5rem,3vw,2.25rem)',
    borderTop: '1px solid var(--line)',
  },
  'bl-rel-grid': {},
  'bl-rel-card': {},
}

const AMBIENT = [
  ['.bl-hero img', { width: '100%', aspectRatio: '16 / 9', objectFit: 'cover',
    display: 'block', background: 'var(--mist)' }],

  // Runtime-only class: see the tree-shake note above.
  ['.bl-toc', { borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
    paddingBlock: 'clamp(1rem,2.2vw,1.4rem)', marginBlock: 'clamp(1.5rem,3vw,2rem)' }],
  ['.bl-toc b', { display: 'block', fontFamily: 'var(--f-body)', fontSize: '0.7rem',
    letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: '700',
    color: 'var(--accent)', marginBottom: '0.7rem' }],
  ['.bl-toc ol', { display: 'grid', gap: '0.42rem', margin: '0', padding: '0',
    listStyle: 'none', counterReset: 'toc' }],
  ['.bl-toc li', { counterIncrement: 'toc', display: 'flex', gap: '0.7rem',
    alignItems: 'baseline', lineHeight: '1.45' }],
  ['.bl-toc li::before', { content: 'counter(toc,decimal-leading-zero)', flex: '0 0 auto',
    fontSize: '0.68rem', color: 'var(--fg-faint)', fontVariantNumeric: 'tabular-nums' }],
  ['.bl-toc a', { color: 'var(--fg)', textDecoration: 'none', fontSize: '0.92rem',
    borderBottom: '1px solid transparent', transition: 'border-color .3s' }],
  ['.wz-fine .bl-toc a:hover', { borderBottomColor: 'var(--rule)' }],

  ['.bl-cta div', { maxWidth: '46ch' }],
  ['.bl-cta b', { display: 'block', fontFamily: 'var(--f-display)', fontWeight: '500',
    fontSize: 'calc(1.25rem * var(--t-sm))', lineHeight: '1.3', marginBottom: '0.4rem' }],
  ['.bl-cta p', { color: 'var(--fg-body)', fontSize: '0.92rem', lineHeight: '1.65', margin: '0' }],

  ['.bl-related > b', { display: 'block', fontFamily: 'var(--f-body)', fontSize: '0.7rem',
    letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: '700',
    color: 'var(--accent)', marginBottom: '1.25rem' }],
  ['.bl-rel-grid', { display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' },
    { [M700]: { gridTemplateColumns: 'repeat(3,1fr)' } }],
  ['.bl-rel-card h3', { fontFamily: 'var(--f-display)', fontWeight: '500',
    fontSize: 'calc(1.02rem * var(--t-sm))', lineHeight: '1.35', margin: '0' }],
  ['.bl-rel-card h3 a', { color: 'inherit', textDecoration: 'none',
    borderBottom: '1px solid transparent', transition: 'border-color .35s' }],
  ['.wz-fine .bl-rel-card h3 a:hover', { borderBottomColor: 'var(--rule)' }],
]

// ── read ───────────────────────────────────────────────────────────────────
const { site: shell, seq } = await getSite()
const rules = shell.styleRules ?? {}
shell.styleRules = rules

const { rows } = await getPages()
const page = rows.find(r => r.slug === 'post')
if (!page) { console.error('  ! no `post` template page'); process.exit(1) }
if (page.cells.templateEnabled !== true) { console.error('  ! `post` is not a template — refusing'); process.exit(1) }

const body = page.cells.body
const nodes = body.nodes
const nameOf = id => rules[id]?.name

const post = Object.values(nodes).find(n => (n.classIds ?? []).some(c => nameOf(c) === 'bl-post'))
if (!post) { console.error('  ! .bl-post not found in the template'); process.exit(1) }
if (Object.values(nodes).some(n => (n.classIds ?? []).some(c => nameOf(c) === 'bl-hero'))) {
  console.log('template already carries .bl-hero — nothing to do')
  process.exit(0)
}
const blBody = post.children.map(c => nodes[c]).find(n => (n.classIds ?? []).some(c => nameOf(c) === 'bl-body'))
const blFoot = post.children.map(c => nodes[c]).find(n => (n.classIds ?? []).some(c => nameOf(c) === 'bl-foot'))
if (!blBody) { console.error('  ! .bl-body not found'); process.exit(1) }

if (!(shell.conditions ?? []).some(c => c.id === M700)) {
  console.error(`  ! condition ${M700} is not registered — refusing`); process.exit(1)
}

// ── rules ──────────────────────────────────────────────────────────────────
const byName = new Map(Object.values(rules).filter(r => r.kind === 'class').map(r => [r.name, r]))
const bySelector = new Map(Object.values(rules).map(r => [r.selector, r]))
let order = Math.max(...Object.values(rules).map(r => r.order ?? 0))
const cls = {}

for (const [name, styles] of Object.entries(CLASS_RULES)) {
  const hit = byName.get(name)
  if (hit) { cls[name] = hit.id; console.log(`= .${name} (exists)`); continue }
  const id = nanoid()
  cls[name] = id
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
const node = (moduleId, props, classIds, children, extra) => {
  const id = nanoid()
  made[id] = { props, breakpointOverrides: {}, children: children ?? [], id, moduleId,
    classIds: classIds ?? [], parentId: null, ...(extra ?? {}) }
  for (const c of made[id].children) (made[c] ?? {}).parentId = id
  return id
}
const box = (tag, html, classIds, children, customTag) =>
  node('base.container', { tag, customTag: customTag ?? '', htmlAttributes: html ?? {} }, classIds, children)
const text = (tag, value, classIds) =>
  node('base.text', { text: value, tag, htmlAttributes: {} }, classIds)

// hero — the bound image
const hero = node('base.container',
  { tag: 'custom', customTag: 'figure', htmlAttributes: { 'data-rv': '' } },
  [cls['bl-hero']],
  [node('base.image',
    { src: '', loading: 'eager', fetchPriority: 'high', decoding: 'async', htmlAttributes: {} },
    [], [],
    { dynamicBindings: { src: { source: 'currentEntry', field: 'featuredMedia', format: 'media' } } })])

// consult block
const cta = box('div', { 'data-rv': '' }, [cls['bl-cta']], [
  box('div', {}, [], [
    text('b', 'Still deciding whether this applies to you?'),
    text('p', 'A consultation includes the 3D scan and a straight answer about what your case actually needs, before you commit to anything.'),
  ]),
  node('base.link', { href: '/contact#book', text: 'Book a consult', target: '_self', htmlAttributes: {} },
    [byName.get('btn')?.id, byName.get('btn-primary')?.id].filter(Boolean), []),
])

// related — a loop that asks for four so dropping the current one still fills a row
const relCard = box('article', { 'data-rv': '' }, [cls['bl-rel-card']], [
  box('custom', {}, [], [
    node('base.link', { href: '{currentEntry.permalink}', text: '{currentEntry.title}',
      target: '_self', htmlAttributes: {} }, [], []),
  ], 'h3'),
])
const relLoop = node('base.loop', {
  sourceId: 'data.rows', filters: { tableId: 'posts' }, orderBy: 'publishedAt',
  direction: 'desc', limit: 4, offset: 0, pagination: 'none', pageSize: 10,
  tag: 'div', customTag: '',
}, [cls['bl-rel-grid']], [relCard])
const related = box('div', {}, [cls['bl-related']], [
  text('b', 'More from the Journal'),
  relLoop,
])

// ── splice ─────────────────────────────────────────────────────────────────
Object.assign(nodes, made)
for (const id of [hero, cta, related]) nodes[id].parentId = post.id
const at = post.children.indexOf(blBody.id)
const footAt = blFoot ? post.children.indexOf(blFoot.id) : -1
const kids = [...post.children]
kids.splice(at, 0, hero)                                  // before the article
const after = footAt === -1 ? kids.length : kids.indexOf(blFoot.id)
kids.splice(after, 0, cta, related)                       // after it, before .bl-foot
post.children = kids

console.log(`\n+ hero, cta, related  ->  .bl-post children now: ${post.children.map(c => (nodes[c].classIds ?? []).map(nameOf).join('.') || nodes[c].moduleId).join(' | ')}`)
console.log(`  ${Object.keys(made).length} nodes added`)

if (!APPLY) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

// ── write ──────────────────────────────────────────────────────────────────
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site: shell,
  changedPages: [toChangedPage(page, { nodes: body.nodes, rootNodeId: body.rootNodeId })],
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: { [page.id]: page.seq },
  shellBaseSeq: seq,
})
console.log('\nwrite:', JSON.stringify(res).slice(0, 160))

// Read back. `post` is THE template for all 43 articles — if this write
// un-templated it, every one of them 404s on the next publish.
await assertTemplatesIntact({ post: true })
const { rows: back } = await getPages()
const t = back.find(r => r.slug === 'post')
const bn = t.cells.body.nodes
const has = name => Object.values(bn).some(n => (n.classIds ?? []).some(c => nameOf(c) === name))
const bound = Object.values(bn).find(n => n.dynamicBindings?.src?.field === 'featuredMedia')
const loop = Object.values(bn).find(n => n.moduleId === 'base.loop')
let ok = t.cells.templateEnabled === true && has('bl-hero') && has('bl-cta') && has('bl-related') && !!bound && !!loop
const { site: sBack } = await getSite()
for (const [selector] of AMBIENT) {
  if (!Object.values(sBack.styleRules ?? {}).some(r => r.selector === selector)) {
    console.error(`  ! ${selector} did not land`); ok = false
  }
}
console.log(`templateEnabled ${t.cells.templateEnabled} | hero ${has('bl-hero')} | binding ${!!bound} | loop ${!!loop}`)
console.log(`verified   ${ok}`)
if (!ok) { console.error('WRITE DID NOT LAND — do not publish'); process.exit(1) }
console.log('\nDraft updated. Push site.js (blog-post.js rides in it), then publish.')
