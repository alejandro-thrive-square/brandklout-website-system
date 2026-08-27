#!/usr/bin/env node
/**
 * push-post-layout.mjs — BugHerd pin #7, revisited.
 *
 *   node push-post-layout.mjs            # report the plan, write nothing
 *   node push-post-layout.mjs --apply    # write the draft (does NOT publish)
 *
 * The client attached a competitor's article page and asked for that LAYOUT in
 * this site's style guide. `push-post-template.mjs` gave the `post` template a
 * column-width hero, a contents list, a consult block and a related strip. This
 * rearranges those into the reference's shape and adds what it was missing:
 *
 *     .pk
 *       .pg-hero.bl-ph          full bleed, the featured image, the title over it
 *       .wrap.section
 *         .bl-post              a three-column grid above 1280px
 *           .bl-rail-l          contents (filled at runtime, pinned)
 *           .bl-main            the outlet, the FAQ (runtime), the consult block
 *           .bl-rail-r          specialist / review / consult cards
 *           .bl-related         now with thumbnails
 *           .bl-foot
 *
 * ## Where the styling comes from
 *
 * NOT from a table in this file. The rules are PARSED out of the design
 * package's `css/62-blog.css`, from the "A SINGLE POST" banner to the end of
 * the file, and upserted into the registry by selector. That file is the one
 * both platforms are supposed to share; a hand-maintained copy of sixty rules
 * in a push script is exactly how the two forked the last time.
 *
 * Existing rules are updated IN PLACE — same id, same order, same kind — so
 * nothing moves in the cascade and no duplicate selector appears.
 *
 * ## What is deliberately NOT a class rule
 *
 * `bl-toc`, `bl-faq`, `pin-spacer` and `wz-fine` only ever exist at runtime.
 * A class-kind rule for any of them would be referenced by no node, count as
 * unused, and take every ambient rule mentioning it down with it at publish
 * (`styleRuleTreeShake.ts`). Left unregistered as classes they are invisible to
 * the shake and their ambient rules survive. CLASS_KIND below is the explicit
 * list of names that DO get attached to a node.
 *
 * ## The hero binding
 *
 * The image node is MOVED out of the old `.bl-hero` figure into `.ph-bg`, with
 * its `dynamicBindings` intact — that exact binding is what renders today, and
 * re-deriving it was not worth the risk. The title is a `{currentEntry.title}`
 * token on a `base.text`. There is NO date field to bind (`publishedAt` is the
 * import timestamp, identical on all 43 rows), so `.bl-ph-when` ships empty and
 * `sections/blog-post.js` moves the real date into it from the article body.
 *
 * ## Idempotence
 *
 * Re-running upserts the rules and reports the node work as already done. The
 * node restructure is guarded on `.bl-main` existing.
 *
 * NOTHING HERE PUBLISHES.
 */
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSite, getPages, api, toChangedPage, assertTemplatesIntact } from './insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CSS = join(HERE, '..', '04-design', '.tmp', 'site-src', 'css', '62-blog.css')
const APPLY = process.argv.includes('--apply')

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => {
  const b = randomBytes(n)
  let s = ''
  for (let i = 0; i < n; i++) s += ALPHABET[b[i] & 63]
  return s
}

/* Names that end up in some node's classIds. Everything else the parser meets
   becomes an ambient rule — see the tree-shake note above. */
const CLASS_KIND = new Set([
  'bl-ph', 'bl-ph-when', 'bl-post', 'bl-main', 'bl-rail', 'bl-rail-l', 'bl-rail-r',
  'bl-body', 'bl-cta', 'bl-related', 'bl-rel-grid', 'bl-rel-card', 'bl-rel-fig',
  'bl-rc', 'bl-rc-fig', 'bl-rc-dark', 'bl-rc-off', 'bl-foot',
])

/* The rail's fixed copy. The review is one quote, not the vendor's widget: that
   embed is a third-party script plus an iframe, and 43 article pages is the
   wrong place to multiply this site's one remaining mobile-performance problem.
   Refresh it from 04-design/.tmp/reviews.json when the feed moves on. */
const REVIEW = {
  stars: '★★★★★',
  body: 'Service excellence and Stephanie is amazing! This place is very professional and caring. '
    + 'The consultation was really helpful. They took the time to explain everything well, making me '
    + 'feel comfortable and welcomed. Absolutely a great choice for dental needs.',
  by: 'Tajala Battle · Google',
}
/* Two offices, two calendars. A single "book now" here would send every reader
   to Alexandria — the bug push-cta-offices.mjs exists to have fixed. */
const OFFICES = [
  ['Tysons Corner · McLean', 'https://www.flexbook.me/DrNahlahTy/1'],
  ['Alexandria', 'https://flexbook.me/drnahlah'],
]

// ── the CSS parser ─────────────────────────────────────────────────────────
/**
 * Small and deliberate. happy-dom is not used here and neither is Instatic's
 * converter: both drop declarations they cannot evaluate (`clamp()`, `100svh`)
 * and both flatten multi-layer `background`. This keeps every value verbatim,
 * which is the only thing a registry rule actually needs.
 */
const camel = (p) => p.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

function declarations(block) {
  const out = {}
  let depth = 0, buf = ''
  const flush = () => {
    const d = buf.trim()
    buf = ''
    if (!d) return
    const i = d.indexOf(':')
    if (i < 0) return
    out[camel(d.slice(0, i).trim())] = d.slice(i + 1).trim().replace(/\s*\n\s*/g, ' ')
  }
  for (const ch of block) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (ch === ';' && depth === 0) { flush(); continue }
    buf += ch
  }
  flush()
  return out
}

/** `(min-width:1280px)` -> the condition id the registry uses. */
const conditionId = (query) => 'media:' + query.replace(/:\s*/g, ': ').replace(/\s+/g, ' ').trim()

function parse(css) {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '')          // comments
  const rules = new Map()                                    // selector -> {styles, contexts}
  const add = (selector, block, ctx) => {
    for (const sel of selector.split(',').map((s) => s.trim()).filter(Boolean)) {
      const hit = rules.get(sel) ?? { styles: {}, contexts: {} }
      if (ctx) Object.assign(hit.contexts[ctx] ?? (hit.contexts[ctx] = {}), declarations(block))
      else Object.assign(hit.styles, declarations(block))
      rules.set(sel, hit)
    }
  }

  let i = 0
  while (i < src.length) {
    const open = src.indexOf('{', i)
    if (open < 0) break
    const head = src.slice(i, open).trim()

    if (head.startsWith('@media')) {
      /* One level of nesting only, which is all this file has. */
      let depth = 1, j = open + 1
      while (j < src.length && depth > 0) {
        if (src[j] === '{') depth++
        else if (src[j] === '}') depth--
        j++
      }
      const inner = src.slice(open + 1, j - 1)
      const ctx = conditionId(head.replace(/^@media\s*/, '').trim())
      let k = 0
      while (k < inner.length) {
        const o = inner.indexOf('{', k)
        if (o < 0) break
        const c = inner.indexOf('}', o)
        add(inner.slice(k, o).trim(), inner.slice(o + 1, c), ctx)
        k = c + 1
      }
      i = j
      continue
    }

    const close = src.indexOf('}', open)
    add(head, src.slice(open + 1, close), null)
    i = close + 1
  }
  return rules
}

const whole = readFileSync(CSS, 'utf8')
const start = whole.indexOf('A SINGLE POST')
if (start < 0) { console.error('  ! 62-blog.css has no "A SINGLE POST" section — refusing'); process.exit(1) }
const parsed = parse(whole.slice(whole.lastIndexOf('/*', start)))
console.log(`parsed ${parsed.size} rules from css/62-blog.css`)

// ── read ───────────────────────────────────────────────────────────────────
const { site: shell, seq } = await getSite()
const rules = shell.styleRules ?? (shell.styleRules = {})
const nameOf = (id) => rules[id]?.name

const { rows } = await getPages()
const page = rows.find((r) => r.slug === 'post')
if (!page) { console.error('  ! no `post` template page'); process.exit(1) }
if (page.cells.templateEnabled !== true) { console.error('  ! `post` is not a template — refusing'); process.exit(1) }

const nodes = page.cells.body.nodes
const byClass = (name) => Object.values(nodes).find((n) => (n.classIds ?? []).some((c) => nameOf(c) === name))

const post = byClass('bl-post')
const pk = byClass('pk')
if (!post || !pk) { console.error('  ! .bl-post / .pk not found'); process.exit(1) }

// ── conditions ─────────────────────────────────────────────────────────────
/* Custom conditions emit in ARRAY order and only viewport breakpoints get
   sorted, so a new min-width goes in beside its neighbours rather than at the
   end — see 15-instatic-api-sync.md, "Cascade order". */
const conds = shell.conditions ?? (shell.conditions = [])
const needed = new Set()
for (const { contexts } of parsed.values()) for (const c of Object.keys(contexts)) needed.add(c)
for (const id of needed) {
  if (conds.some((c) => c.id === id)) { console.log(`= condition ${id}`); continue }
  const query = id.slice('media:'.length)
  const px = Number((query.match(/min-width:\s*(\d+)/) ?? [])[1] ?? NaN)
  const entry = { id, label: query, condition: { kind: 'media', query } }
  let at = conds.length
  if (Number.isFinite(px)) {
    at = conds.findIndex((c) => {
      const m = Number((String(c.condition?.query ?? '').match(/min-width:\s*(\d+)/) ?? [])[1] ?? NaN)
      return Number.isFinite(m) && m > px
    })
    if (at < 0) at = conds.findIndex((c) => !/min-width/.test(String(c.condition?.query ?? '')) && /prefers/.test(String(c.condition?.query ?? '')))
    if (at < 0) at = conds.length
  }
  conds.splice(at, 0, entry)
  console.log(`+ condition ${id}  at index ${at}`)
}

// ── rules ──────────────────────────────────────────────────────────────────
/* A SELECTOR CAN APPEAR TWICE. `.bl-rel-grid` is in this registry as an empty
   class-kind rule (the name a node references) AND as an ambient rule that does
   the painting — the shape push-post-template.mjs left behind. When that
   happens the one with the higher `order` is the one the cascade lands on, so
   that is the one an upsert has to write into, and the one a verify has to read
   back. Picking "the first match" instead means writing one and checking the
   other, which is exactly how this script failed its own gate the first time. */
const pickRule = (all, selector) => all
  .filter((r) => r.selector === selector)
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  .pop()
const bySelector = new Map()
for (const r of Object.values(rules)) bySelector.set(r.selector, pickRule(Object.values(rules), r.selector))
const byName = new Map(Object.values(rules).filter((r) => r.kind === 'class').map((r) => [r.name, r]))
let order = Math.max(...Object.values(rules).map((r) => r.order ?? 0))
let added = 0, updated = 0

for (const [selector, { styles, contexts }] of parsed) {
  const single = /^\.([A-Za-z0-9_-]+)$/.exec(selector)
  const kind = single && CLASS_KIND.has(single[1]) ? 'class' : 'ambient'
  const name = kind === 'class' ? single[1] : selector

  const hit = bySelector.get(selector)
  if (hit) {
    /* In place: id, order and kind are load-bearing and none of them change. */
    hit.styles = styles
    hit.contextStyles = contexts
    hit.updatedAt = Date.now()
    updated++
    continue
  }
  const id = nanoid()
  rules[id] = {
    id, name, kind, selector, order: ++order,
    styles, contextStyles: contexts, createdAt: Date.now(), updatedAt: Date.now(),
  }
  bySelector.set(selector, rules[id])
  if (kind === 'class') byName.set(name, rules[id])
  added++
  console.log(`+ ${selector}  ${kind}  order ${order}`)
}
console.log(`rules: ${added} added, ${updated} updated in place`)

/* Every class this build attaches to a node must exist as a class-kind rule, or
   the node has nothing to reference and emits no class at all.

   A class the CSS only ever uses in a COMPOUND selector — `bl-ph` appears as
   `.pg-hero.bl-ph`, never bare — produces no rule above, so an empty one is
   created to carry the name. `.bl-rel-grid` has lived in this registry exactly
   like that since the first push: an empty class rule paired with an ambient
   that does the painting. */
for (const name of CLASS_KIND) {
  if (byName.has(name)) continue
  const id = nanoid()
  rules[id] = {
    id, name, kind: 'class', selector: `.${name}`, order: ++order,
    styles: {}, contextStyles: {}, createdAt: Date.now(), updatedAt: Date.now(),
  }
  byName.set(name, rules[id])
  bySelector.set(`.${name}`, rules[id])
  added++
  console.log(`+ .${name}  class (name carrier, styled by a compound selector)  order ${order}`)
}
for (const n of ['pg-hero', 'ph-bg', 'ph-in', 'wrap', 'pk-crumb', 'label', 'rv-stars', 'pk-more']) {
  if (!byName.has(n)) { console.error(`  ! expected existing class rule .${n}`); process.exit(1) }
}
const cls = (n) => byName.get(n).id

// ── nodes ──────────────────────────────────────────────────────────────────
if (byClass('bl-main')) {
  console.log('\ntemplate already carries .bl-main — node work already done')
} else {
  const made = {}
  const node = (moduleId, props, classIds, children, extra) => {
    const id = nanoid()
    made[id] = {
      props, breakpointOverrides: {}, children: children ?? [], id, moduleId,
      classIds: classIds ?? [], parentId: null, ...(extra ?? {}),
    }
    for (const c of made[id].children) (made[c] ?? nodes[c]).parentId = id
    return id
  }
  const box = (tag, attrs, classIds, children, customTag) =>
    node('base.container', { tag, customTag: customTag ?? '', htmlAttributes: attrs ?? {} }, classIds, children)
  const text = (tag, value, classIds, attrs) =>
    node('base.text', { text: value, tag, htmlAttributes: attrs ?? {} }, classIds)
  const link = (href, label, classIds, children, target) =>
    node('base.link', { href, text: label ?? '', target: target ?? '_self', htmlAttributes: {} }, classIds, children)

  /* --- the hero -------------------------------------------------------- */
  const oldHero = byClass('bl-hero')
  if (!oldHero) { console.error('  ! .bl-hero not found — run push-post-template.mjs first'); process.exit(1) }
  const heroImg = (oldHero.children ?? []).map((c) => nodes[c]).find((n) => n.moduleId === 'base.image')
  /* The binding may be a `{currentEntry.*}` string token or a structured
     `dynamicBindings` overlay. Both resolve; the token is what actually shipped.
     Either is accepted here, neither is invented. */
  const bindsEntry = (n) => !!n
    && (!!n.dynamicBindings?.src || /\{currentEntry\./.test(String(n.props?.src ?? '')))
  if (!bindsEntry(heroImg)) {
    console.error('  ! the .bl-hero image is not bound to the entry — refusing to guess a binding')
    process.exit(1)
  }
  const crumb = byClass('pk-crumb')
  if (!crumb) { console.error('  ! .pk-crumb not found'); process.exit(1) }

  const phBg = box('div', {}, [cls('ph-bg')], [heroImg.id])
  const phIn = box('div', {}, [cls('wrap'), cls('ph-in')], [
    crumb.id,
    text('h1', '{currentEntry.title}', [], { 'data-rv': '' }),
    text('p', '', [cls('bl-ph-when')], { 'data-rv': '' }),
  ])
  const hero = box('section', { id: 'hero' }, [cls('pg-hero'), cls('bl-ph')], [phBg, phIn])

  /* --- the trust rail --------------------------------------------------- */
  const railR = box('aside', {}, [cls('bl-rail'), cls('bl-rail-r')], [
    box('div', { 'data-rv': '' }, [cls('bl-rc')], [
      box('div', {}, [cls('bl-rc-fig')], [
        node('base.image', {
          src: '/uploads/3TStFVfzcPUbzOZ_nJqk1-dr-nahlah.png',
          loading: 'lazy', decoding: 'async', htmlAttributes: {},
        }, [], []),
      ]),
      text('span', 'The specialist', [cls('label')]),
      text('strong', 'Dr. Esam Nahlah', []),
      text('p', 'D.D.S., M.S. — Diplomate of the American Board of Prosthodontics, practising in Northern Virginia since 2013.', []),
      link('/meet-dr-nahlah', 'Meet the specialist', [cls('pk-more')]),
    ]),
    box('div', { 'data-rv': '' }, [cls('bl-rc')], [
      text('span', 'Trusted by patients', [cls('label')]),
      text('span', REVIEW.stars, [cls('rv-stars')], { 'aria-hidden': 'true' }),
      box('custom', {}, [], [text('none', REVIEW.body, [])], 'blockquote'),
      box('custom', {}, [], [text('none', REVIEW.by, [])], 'cite'),
      link('/patient-stories', 'More patient stories', [cls('pk-more')]),
    ]),
    box('div', { 'data-rv': '', 'data-theme': 'dark' }, [cls('bl-rc'), cls('bl-rc-dark')], [
      text('strong', 'Request a consultation', []),
      text('p', 'A 3D scan and a straight answer about what your case actually needs, before you commit to anything.', []),
      ...OFFICES.map(([label, href]) => box('div', {}, [cls('bl-rc-off')], [
        text('span', label, []),
        link(href, 'Book', [], [], '_blank'),
      ])),
    ]),
  ])

  /* --- the middle column ------------------------------------------------ */
  const blBody = byClass('bl-body')
  const blCta = byClass('bl-cta')
  if (!blBody || !blCta) { console.error('  ! .bl-body / .bl-cta not found'); process.exit(1) }
  const main = box('div', {}, [cls('bl-main')], [blBody.id, blCta.id])
  const railL = box('aside', {}, [cls('bl-rail'), cls('bl-rail-l')], [])

  /* --- the related card gains a thumbnail -------------------------------- */
  const relCard = byClass('bl-rel-card')
  if (!relCard) { console.error('  ! .bl-rel-card not found'); process.exit(1) }
  /* The same `featuredMediaPath` token the hero uses, and this loop's existing
     `{currentEntry.permalink}` already proves the token resolves per ROW. No alt
     is set: base.image takes alt from the resolved library asset, and that is
     the accessible name this link needs — an empty alt would leave it nameless.
     A row with no featured image resolves to an empty src, and blog-post.js
     drops the figure, so the card degrades to the title it shows today rather
     than to an empty grey plate. */
  const relFig = link('{currentEntry.permalink}', '', [cls('bl-rel-fig')], [
    node('base.image', {
      src: '{currentEntry.featuredMediaPath}', loading: 'lazy', decoding: 'async', htmlAttributes: {},
    }, [], []),
  ])

  /* --- splice ------------------------------------------------------------ */
  Object.assign(nodes, made)

  nodes[relFig].parentId = relCard.id
  relCard.children = [relFig, ...relCard.children]

  nodes[hero].parentId = pk.id
  pk.children = [hero, ...pk.children.filter((c) => c !== hero)]

  const related = byClass('bl-related')
  const foot = byClass('bl-foot')
  const keep = new Set([blBody.id, blCta.id, crumb.id, oldHero.id])
  const tail = post.children.filter((c) => !keep.has(c))
  const ordered = [railL, main, railR, ...tail]
  /* .bl-related and .bl-foot are placed by the grid, but source order is what a
     narrow screen and a screen reader get, so assert it rather than assume the
     filter above preserved it. */
  if (related && foot && ordered.indexOf(related.id) > ordered.indexOf(foot.id)) {
    console.error('  ! related would follow the footer — refusing'); process.exit(1)
  }
  for (const id of ordered) nodes[id].parentId = post.id
  post.children = ordered

  /* The old figure is now empty and unreferenced. Its `.bl-hero` class rule is
     left alone: it is a class rule referenced by nothing, so the publish shake
     removes it and the `.bl-hero img` ambient with it. */
  delete nodes[oldHero.id]

  console.log(`\n+ hero -> .pk children: ${pk.children.map((c) => (nodes[c].classIds ?? []).map(nameOf).join('.') || nodes[c].moduleId).join(' | ')}`)
  console.log(`+ .bl-post children: ${post.children.map((c) => (nodes[c].classIds ?? []).map(nameOf).join('.') || nodes[c].moduleId).join(' | ')}`)
  console.log(`  ${Object.keys(made).length} nodes added, 1 removed`)
}

if (!APPLY) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

// ── write ──────────────────────────────────────────────────────────────────
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site: shell,
  changedPages: [toChangedPage(page, { nodes: page.cells.body.nodes, rootNodeId: page.cells.body.rootNodeId })],
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: { [page.id]: page.seq },
  shellBaseSeq: seq,
})
console.log('\nwrite:', JSON.stringify(res).slice(0, 160))

// ── verify against a fresh read ────────────────────────────────────────────
await assertTemplatesIntact({ post: true })
const { site: sBack } = await getSite()
const backRules = sBack.styleRules ?? {}
const { rows: back } = await getPages()
const t = back.find((r) => r.slug === 'post')
const bn = t.cells.body.nodes
const bName = (id) => backRules[id]?.name
const hasClass = (name) => Object.values(bn).some((n) => (n.classIds ?? []).some((c) => bName(c) === name))

let ok = t.cells.templateEnabled === true
for (const name of ['bl-ph', 'bl-main', 'bl-rail-l', 'bl-rail-r', 'bl-rc', 'bl-rel-fig']) {
  if (!hasClass(name)) { console.error(`  ! .${name} did not land`); ok = false }
}
for (const [selector, { styles, contexts }] of parsed) {
  const r = pickRule(Object.values(backRules), selector)
  if (!r) { console.error(`  ! ${selector} did not land`); ok = false; continue }
  for (const [k, v] of Object.entries(styles)) {
    if (r.styles?.[k] !== v) { console.error(`  ! ${selector} { ${k} } is ${JSON.stringify(r.styles?.[k])}, expected ${JSON.stringify(v)}`); ok = false }
  }
  for (const [ctx, decls] of Object.entries(contexts)) {
    for (const [k, v] of Object.entries(decls)) {
      if (r.contextStyles?.[ctx]?.[k] !== v) { console.error(`  ! ${selector} @${ctx} { ${k} } did not land`); ok = false }
    }
  }
}
for (const id of needed) {
  if (!(sBack.conditions ?? []).some((c) => c.id === id)) { console.error(`  ! condition ${id} did not land`); ok = false }
}
/* The title token and the hero binding are the two things that make this a
   TEMPLATE rather than one page, so they are checked by value. */
const titled = Object.values(bn).some((n) => n.props?.text === '{currentEntry.title}')
const bound = Object.values(bn).filter((n) => n.moduleId === 'base.image'
  && (n.dynamicBindings?.src || /\{currentEntry\./.test(String(n.props?.src ?? '')))).length
if (!titled) { console.error('  ! {currentEntry.title} is not in the hero'); ok = false }
/* Two: the hero and the related thumbnail. One means the splice lost one. */
if (bound !== 2) { console.error(`  ! ${bound} entry-bound images, expected 2`); ok = false }

console.log(`\ntemplateEnabled ${t.cells.templateEnabled} | title token ${titled} | entry-bound images ${bound}`)
console.log(`verified   ${ok}`)
if (!ok) { console.error('WRITE DID NOT LAND — do not publish'); process.exit(1) }
console.log('\nDraft updated. Push site.js and site.css, then publish.')
