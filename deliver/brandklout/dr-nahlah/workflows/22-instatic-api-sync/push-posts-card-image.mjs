#!/usr/bin/env node
/**
 * push-posts-card-image.mjs — BugHerd pin #9.
 *
 *   node push-posts-card-image.mjs            # report the plan, write nothing
 *   node push-posts-card-image.mjs --apply    # write the DRAFT (never publishes)
 *
 * > "Here we should display the main image of the blog post."   /posts
 *
 * ## What the page actually is
 *
 * `/posts` `section#articles > div.wrap.section > div.bl-grid` is a single
 * `base.loop` (source `data.rows`, `filters.tableId = posts`, `publishedAt`
 * desc, `limit 60`, `pagination: 'none'`), and its ONE child is
 * `article.bl-card`. The publisher renders that subtree once per row, so this
 * script adds exactly one figure to exactly one node and all 43 cards get it.
 *
 * The corollary is the constraint: every card renders from the same props.
 * There is no "first row eager, rest lazy" available here — `renderLoop`
 * round-robins over the loop's CHILDREN (N children = N alternating variants;
 * with 3 variants items 0,1,2 and 3,4,5 both cycle A,B,C), which is not a hook
 * on item 0. It is also not wanted: this page's LCP is the `.pg-hero` photo,
 * which already carries the page's single `fetchpriority="high"`, and
 * perf-image-priority.mjs is explicit that a second one competes with it.
 *
 * ## Where the image comes from
 *
 * `{currentEntry.featuredMediaPath}` — the same field the article hero and the
 * related strip bind. Checked live before writing: every `posts` row must carry
 * a `featuredMedia` id that resolves to a library asset with alt text, and must
 * have no edit newer than its last ROW publish. That last one matters — the
 * loop reads the PUBLISHED row snapshot
 * (`server/repositories/data/publish.ts`), so a row PATCHed but not
 * row-published renders its old, empty cell.
 *
 * `dataRows.ts` resolves `featuredMediaPath` to `/uploads/...` per item, and
 * `collectEntryMediaReferences` (`server/publish/mediaPrefetch.ts`) collects it
 * "in every loop row", so each img publishes with srcset, sizes, intrinsic
 * width/height and the LIBRARY's alt text. Alt is never a node prop here.
 *
 * ## Styling: no second thumbnail style
 *
 * The figure carries `.bl-rel-fig`, the class the article page's related strip
 * already uses — same 16/10 box, cover, `--mist` placeholder, no rounding. The
 * only new rules are the index's own hover selector and the empty case, and
 * they are PARSED out of `04-design/.tmp/site-src/css/62-blog.css` between the
 * "INDEX CARD IMAGE" banner and the "A SINGLE POST" banner rather than kept as
 * a second copy in this file. Both go in as `ambient`: a `class`-kind rule that
 * no `node.classIds` references is tree-shaken at publish.
 *
 * ## The empty case
 *
 * `base.image.render` returns `{html: ''}` for an empty `src`, and `base.link`
 * joins children with `''`, so a row with no featured image publishes
 * `<a class="bl-rel-fig"></a>` — genuinely `:empty`, hidden by CSS before first
 * paint. No JS, no broken img, no grey plate. All 43 rows have an image today;
 * this is what happens when the 44th does not.
 *
 * ## Two traps this endpoint sets
 *
 * - `pageToCells` does not carry `seoTitle` / `seoDescription`, so ANY page
 *   write through `PUT /site-document` drops them. `/posts` has both. They are
 *   re-applied afterwards through `PATCH /data/rows/:id`, which merges nothing
 *   either — the CURRENT cells are spread underneath — and then verified.
 * - Other agents may be writing this same document. Shell and page seqs are
 *   read immediately before the write and a 409 is re-read and retried, never
 *   forced.
 *
 * Idempotent: a card that already has a `.bl-rel-fig` child reports done.
 * NOTHING HERE PUBLISHES.
 */
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSite, getPages, api, toChangedPage } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CSS = join(HERE, '..', '04-design', '.tmp', 'site-src', 'css', '62-blog.css')
const APPLY = process.argv.includes('--apply')
const PAGE = 'posts'
const FIG = 'bl-rel-fig'
const SRC_TOKEN = '{currentEntry.featuredMediaPath}'
const HREF_TOKEN = '{currentEntry.permalink}'

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => {
  const b = randomBytes(n)
  let s = ''
  for (let i = 0; i < n; i++) s += ALPHABET[b[i] & 63]
  return s
}
const die = (m) => { console.error(`  ! ${m}`); process.exit(1) }

// ── the CSS parser ─────────────────────────────────────────────────────────
/* Same twenty lines as push-post-layout.mjs, and for the same reason: happy-dom
   (and therefore Instatic's own converter) drops `clamp()` / `min()` / `100svh`
   and flattens a multi-layer `background` to its last layer. Splitting on `;`
   and `:` at paren-depth 0 keeps every value verbatim, which is all a registry
   rule needs. */
const camel = (p) => p.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

function declarations(block) {
  const out = {}
  let depth = 0
  let buf = ''
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

function parse(css) {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules = new Map()
  let i = 0
  while (i < src.length) {
    const open = src.indexOf('{', i)
    if (open < 0) break
    const head = src.slice(i, open).trim()
    if (head.startsWith('@media')) die('the pin #9 block has no @media and must not grow one silently')
    const close = src.indexOf('}', open)
    for (const sel of head.split(',').map((s) => s.trim()).filter(Boolean)) {
      if (!rules.has(sel)) rules.set(sel, {})
      Object.assign(rules.get(sel), declarations(src.slice(open + 1, close)))
    }
    i = close + 1
  }
  return rules
}

const whole = readFileSync(CSS, 'utf8')
/* Bounded from the pin #9 banner to the NEXT "A SINGLE POST" after it, not the
   first one in the file. Pin #10 landed a block above this one whose prose
   quotes that banner name, and an unanchored search made `to` precede `from`.
   Their own script hit the mirror image of this and left a marker comment
   saying so — a slice keyed on a phrase has to be anchored, or the next person
   to write ABOUT a marker moves it. */
const from = whole.indexOf('INDEX CARD IMAGE')
if (from < 0) die('62-blog.css has no "INDEX CARD IMAGE" banner')
const to = whole.indexOf('A SINGLE POST', from)
if (to < 0) die('62-blog.css has no "A SINGLE POST" banner after the pin #9 block')
const parsed = parse(whole.slice(whole.lastIndexOf('/*', from), whole.lastIndexOf('/*', to)))
if (parsed.size === 0) die('the pin #9 CSS block parsed to nothing')
/* And refuse to carry anything that is not this pin's. Three other agents are
   editing this file; a slice that quietly grew would upsert their rules under
   this script's name and its verify would pass. */
const MINE = new Set(['.wz-fine .bl-card:hover .bl-rel-fig img', '.bl-rel-fig:empty'])
for (const sel of parsed.keys()) if (!MINE.has(sel)) die(`the pin #9 slice picked up ${JSON.stringify(sel)}, which is not this pin's — check the block markers in 62-blog.css`)
console.log(`parsed ${parsed.size} rule(s) from css/62-blog.css:`)
for (const [sel, decls] of parsed) console.log(`    ${sel}  ${JSON.stringify(decls)}`)

/**
 * One declaration on a rule this script does NOT own.
 *
 * `.bl-rel-fig` belongs to the article page's related strip (pin #7, seq 98)
 * and the index now shares it. Its `max-width` is a PERFORMANCE hint, not
 * layout: `sizesResolver.ts` reads px `width`/`max-width` only from rules the
 * node's `classIds` point at, and finds nothing else on this site to read —
 * `.wrap` caps with `max-width:var(--maxw)`, every gutter and padding is a
 * `clamp()`, and the resolver bails on a `base.loop` grid's tracks by design.
 * Without it every thumbnail publishes `sizes="auto, 100vw"` and Safari and
 * Firefox fetch the w2000 variant — 238 KB where 38.5 KB would do.
 *
 * It is MERGED into the existing rule, one key, never a wholesale replace:
 * the other five declarations are another session's and the read-back asserts
 * they came through untouched. The value is read from 62-blog.css so there is
 * still exactly one source of truth for it.
 */
const SHARED_CAP_KEY = 'maxWidth'
/* Lifted by hand rather than through `parse()`: that parser refuses `@media`
   on purpose (this pin's own block must never grow one silently) and the rest
   of 62-blog.css is full of them. One block, matched exactly. */
const figBlock = new RegExp(`(^|\\n)\\.${FIG}\\s*\\{([^}]*)\\}`).exec(whole.replace(/\/\*[\s\S]*?\*\//g, ''))
if (!figBlock) die(`62-blog.css has no bare .${FIG} rule to read the sizes hint from`)
const figCss = declarations(figBlock[2])
const sharedCap = figCss[SHARED_CAP_KEY]
if (!sharedCap) die(`.bl-rel-fig in 62-blog.css has no ${SHARED_CAP_KEY} — the sizes hint would be silently lost`)
if (!/^\d+px$/.test(sharedCap)) die(`.bl-rel-fig ${SHARED_CAP_KEY} is ${JSON.stringify(sharedCap)}; sizesResolver only reads px`)
console.log(`shared cap: .bl-rel-fig { ${SHARED_CAP_KEY}: ${sharedCap} }  (merged, not replaced)`)

// ── the data has to be there before the template is worth changing ─────────
const rows = (await api('GET', '/admin/api/cms/data/tables/posts/rows')).rows ?? []
const media = (await api('GET', '/admin/api/cms/media')).assets ?? []
const assetById = new Map(media.map((a) => [a.id, a]))
const flagged = []
for (const r of rows) {
  const fm = r.cells?.featuredMedia
  const asset = fm ? assetById.get(fm) : null
  if (!fm) flagged.push(`${r.slug}: no featuredMedia`)
  else if (!asset) flagged.push(`${r.slug}: featuredMedia ${fm} is not a library asset`)
  else if (!(asset.altText ?? '').trim()) flagged.push(`${r.slug}: asset ${asset.publicPath} has no alt text`)
  if (!r.publishedAt || new Date(r.updatedAt) > new Date(r.publishedAt)) {
    flagged.push(`${r.slug}: edited since its last ROW publish — the loop reads the published snapshot`)
  }
}
const distinct = new Set(rows.map((r) => r.cells?.featuredMedia).filter(Boolean)).size
console.log(`\n${rows.length} posts rows | ${distinct} distinct images | ${flagged.length} flagged`)
for (const f of flagged) console.log(`    ! ${f}`)
/* Flags are reported, not fatal: the empty case degrades deliberately. But it
   has to be said out loud, because a silently empty column is this pin. */

// ── plan, then write in the smallest possible window ───────────────────────
async function attempt() {
  const { site: shell, seq } = await getSite()
  const rules = shell.styleRules ?? (shell.styleRules = {})
  const nameOf = (id) => rules[id]?.name

  const { rows: pages } = await getPages()
  const page = pages.find((p) => p.slug === PAGE)
  if (!page) die(`no /${PAGE} page`)
  if (page.cells.templateEnabled === true) die(`/${PAGE} is a template — wrong page`)

  const nodes = page.cells.body.nodes
  const before = JSON.stringify(nodes).length
  const beforeCount = Object.keys(nodes).length

  /* Scope everything to the pinned subtree. The drawer and the footer live in
     this same node tree and will inflate any page-wide count. */
  const section = Object.values(nodes).find((n) => n.props?.htmlAttributes?.id === 'articles')
  if (!section) die('section#articles not found on /posts')
  const inSection = new Set()
  const collect = (id) => {
    inSection.add(id)
    for (const c of nodes[id]?.children ?? []) collect(c)
  }
  collect(section.id)
  const within = (pred) => [...inSection].map((id) => nodes[id]).filter(pred)

  const loops = within((n) => n.moduleId === 'base.loop')
  if (loops.length !== 1) die(`expected 1 base.loop in #articles, found ${loops.length}`)
  const grid = loops[0]
  if (grid.props?.sourceId !== 'data.rows' || grid.props?.filters?.tableId !== 'posts') {
    die(`the loop no longer reads data.rows/posts: ${JSON.stringify(grid.props?.sourceId)} ${JSON.stringify(grid.props?.filters)}`)
  }
  if (grid.props?.pagination !== 'none') die(`loop pagination is ${JSON.stringify(grid.props?.pagination)} — the cards would not all be in the DOM`)
  if ((grid.props?.limit ?? 0) < rows.length) die(`loop limit ${grid.props?.limit} < ${rows.length} rows`)
  if ((grid.children ?? []).length !== 1) {
    die(`the loop has ${(grid.children ?? []).length} children — it round-robins over them, so a second child is a second CARD VARIANT, not a sibling. Refusing.`)
  }
  const card = nodes[grid.children[0]]
  if (card.props?.tag !== 'article') die(`the loop's child is <${card.props?.tag}>, expected <article>`)

  // ── rules ────────────────────────────────────────────────────────────────
  /* A selector can exist TWICE — an empty class-kind rule carrying the name
     plus an ambient that paints. The one with the highest `order` is the one
     the cascade lands on, so it is the one to write and the one to verify. */
  const pickRule = (selector) => Object.values(rules)
    .filter((r) => r.selector === selector)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .pop()
  const figRule = Object.values(rules).find((r) => r.kind === 'class' && r.name === FIG)
  if (!figRule) die(`.${FIG} has no class-kind rule — run push-post-layout.mjs first, or the card emits no class at all`)

  let order = Math.max(...Object.values(rules).map((r) => r.order ?? 0))
  const ruleWork = []
  for (const [selector, styles] of parsed) {
    const hit = pickRule(selector)
    if (hit) {
      const same = JSON.stringify(hit.styles ?? {}) === JSON.stringify(styles)
      if (!same) { hit.styles = styles; hit.updatedAt = Date.now() }
      ruleWork.push(`${same ? '=' : '~'} ${selector}  ${hit.kind}  order ${hit.order}  (${hit.id})`)
      continue
    }
    /* ambient, always. A class-kind rule referenced by no node.classIds is
       deleted by the publish shake and takes its declarations with it. */
    const id = nanoid()
    rules[id] = {
      id, name: selector, kind: 'ambient', selector, order: ++order,
      styles, contextStyles: {}, createdAt: Date.now(), updatedAt: Date.now(),
    }
    ruleWork.push(`+ ${selector}  ambient  order ${order}  (${id})`)
  }
  /* The shared cap — one key, merged into another session's rule. */
  const capBefore = { ...(figRule.styles ?? {}) }
  if (capBefore[SHARED_CAP_KEY] === sharedCap) {
    ruleWork.push(`= .${FIG} { ${SHARED_CAP_KEY}: ${sharedCap} }  (${figRule.id})`)
  } else {
    figRule.styles = { ...capBefore, [SHARED_CAP_KEY]: sharedCap }
    figRule.updatedAt = Date.now()
    ruleWork.push(`~ .${FIG} { ${SHARED_CAP_KEY}: ${capBefore[SHARED_CAP_KEY] ?? 'unset'} -> ${sharedCap} }  (${figRule.id})`)
  }
  const capUntouched = Object.entries(capBefore).filter(([k]) => k !== SHARED_CAP_KEY)
  for (const [k, v] of capUntouched) {
    if (figRule.styles[k] !== v) die(`.${FIG} { ${k} } was disturbed — that rule is pin #7's, refusing`)
  }

  console.log('\nrules:')
  for (const line of ruleWork) console.log(`    ${line}`)

  // ── the node ─────────────────────────────────────────────────────────────
  const already = (card.children ?? []).map((c) => nodes[c])
    .find((n) => (n.classIds ?? []).some((c) => nameOf(c) === FIG))
  let addedNodes = 0
  if (already) {
    console.log(`\ncard already carries .${FIG} (${already.id}) — node work already done`)
  } else {
    const imgId = nanoid()
    const figId = nanoid()
    nodes[imgId] = {
      id: imgId, moduleId: 'base.image', parentId: figId, classIds: [],
      breakpointOverrides: {}, children: [],
      props: {
        src: SRC_TOKEN,
        loading: 'lazy',
        fetchPriority: 'auto',
        decoding: 'async',
        /* No `alt` here on purpose. `base.image` renders htmlAttributes FIRST
           and the library's alt second, and HTML keeps the first occurrence of
           a duplicated attribute — an alt here would SHADOW the library's,
           which is the bug perf-image-priority.mjs was written to undo on 194
           images. */
        htmlAttributes: {},
      },
    }
    nodes[figId] = {
      id: figId, moduleId: 'base.link', parentId: card.id, classIds: [figRule.id],
      breakpointOverrides: {}, children: [imgId],
      props: {
        href: HREF_TOKEN,
        text: '',
        target: '_self',
        /* The card already links to this post twice (the h2 and "Read the
           article"). A third announced, tabbable link is noise in a 43-card
           list, so the figure is hidden from the a11y tree and taken out of the
           tab order while staying clickable with a mouse. `aria-hidden` on a
           NON-focusable element is valid; the tabindex is what makes it
           non-focusable, so the two travel together. */
        htmlAttributes: { 'aria-hidden': 'true', tabindex: '-1' },
      },
    }
    card.children = [figId, ...(card.children ?? [])]
    addedNodes = 2
    console.log(`\n+ .${FIG} > base.image  as the first child of .bl-card`)
  }
  const label = (n) => (n.classIds ?? []).map(nameOf).filter(Boolean).join('.')
    || n.props?.customTag || n.props?.tag || n.moduleId
  console.log(`  card children: ${(card.children ?? []).map((c) => label(nodes[c])).join(' | ')}`)

  const after = JSON.stringify(nodes).length
  const afterCount = Object.keys(nodes).length
  console.log(`\nnodes ${beforeCount} -> ${afterCount} (+${afterCount - beforeCount}), bytes ${before} -> ${after} (+${after - before})`)
  if (afterCount - beforeCount !== addedNodes) die(`node count moved by ${afterCount - beforeCount}, expected ${addedNodes}`)
  if (addedNodes && after <= before) die('bytes did not grow — the splice did not land')
  if (!addedNodes && after !== before) die('no node work, yet the tree changed size')

  if (!APPLY) { console.log('\nDRY RUN — re-run with --apply'); return 'dry' }

  // ── write ────────────────────────────────────────────────────────────────
  const seoBefore = { seoTitle: page.cells.seoTitle, seoDescription: page.cells.seoDescription }
  let res
  try {
    res = await api('PUT', '/admin/api/cms/site-document', {
      mode: 'incremental',
      site: shell,
      changedPages: [toChangedPage(page, { nodes, rootNodeId: page.cells.body.rootNodeId })],
      deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
      changedLayouts: [], deletedLayoutIds: [],
      baseSeqs: { [page.id]: page.seq },
      shellBaseSeq: seq,
    })
  } catch (e) {
    if (/\b409\b/.test(e.message)) { console.log('\n409 — someone else wrote first. Re-reading and retrying.'); return 'retry' }
    throw e
  }
  console.log('\nwrite:', JSON.stringify(res).slice(0, 160))

  /* `pageToCells` has no seoTitle/seoDescription, so the write above dropped
     them. PATCH replaces `cells` wholesale too — spread the CURRENT ones. */
  if (seoBefore.seoTitle || seoBefore.seoDescription) {
    const now = (await api('GET', `/admin/api/cms/data/rows/${page.id}`)).row
    if (now.cells.seoTitle === seoBefore.seoTitle && now.cells.seoDescription === seoBefore.seoDescription) {
      console.log('seo cells: survived the page write (unexpected, but nothing to do)')
    } else {
      await api('PATCH', `/admin/api/cms/data/rows/${page.id}`, { cells: { ...now.cells, ...seoBefore } })
      console.log('seo cells: re-applied after the page write')
    }
  }
  return 'wrote'
}

let outcome = await attempt()
for (let i = 0; outcome === 'retry' && i < 4; i++) outcome = await attempt()
if (outcome === 'retry') die('still conflicting after 5 attempts — another agent is mid-write; try again in a minute')
if (outcome === 'dry') process.exit(0)

// ── verify against a FRESH read, subtree-scoped ────────────────────────────
const { site: sBack } = await getSite()
const backRules = sBack.styleRules ?? {}
const { rows: back } = await getPages()
const p = back.find((r) => r.slug === PAGE)
if (!p) die('/posts is gone from the read-back')
const bn = p.cells.body.nodes
const bName = (id) => backRules[id]?.name

let ok = true
const sec = Object.values(bn).find((n) => n.props?.htmlAttributes?.id === 'articles')
if (!sec) die('section#articles is gone from the read-back')
const scope = new Set()
const collectBack = (id) => {
  scope.add(id)
  for (const c of bn[id]?.children ?? []) collectBack(c)
}
collectBack(sec.id)
const inScope = [...scope].map((id) => bn[id])

const gridBack = inScope.filter((n) => n.moduleId === 'base.loop')
if (gridBack.length !== 1) { console.error(`  ! ${gridBack.length} loops in #articles, expected 1`); ok = false }
if (gridBack[0] && (gridBack[0].children ?? []).length !== 1) {
  console.error(`  ! the loop has ${(gridBack[0].children ?? []).length} children, expected 1`); ok = false
}
const cardBack = gridBack[0] && bn[gridBack[0].children[0]]
const figs = inScope.filter((n) => (n.classIds ?? []).some((c) => bName(c) === FIG))
if (figs.length !== 1) { console.error(`  ! ${figs.length} .${FIG} nodes in #articles, expected 1`); ok = false }
const fig = figs[0]
if (fig) {
  if (fig.parentId !== cardBack?.id) { console.error('  ! the figure is not a child of .bl-card'); ok = false }
  if (cardBack?.children?.[0] !== fig.id) { console.error('  ! the figure is not the FIRST child of .bl-card'); ok = false }
  if (fig.props?.href !== HREF_TOKEN) { console.error(`  ! figure href is ${JSON.stringify(fig.props?.href)}`); ok = false }
  if (fig.props?.htmlAttributes?.['aria-hidden'] !== 'true' || fig.props?.htmlAttributes?.tabindex !== '-1') {
    console.error(`  ! figure htmlAttributes are ${JSON.stringify(fig.props?.htmlAttributes)}`); ok = false
  }
  const img = bn[(fig.children ?? [])[0]]
  if (!img || img.moduleId !== 'base.image') { console.error('  ! the figure has no base.image child'); ok = false }
  else {
    if (img.props?.src !== SRC_TOKEN) { console.error(`  ! img src is ${JSON.stringify(img.props?.src)}`); ok = false }
    if (img.props?.loading !== 'lazy') { console.error(`  ! img loading is ${JSON.stringify(img.props?.loading)}`); ok = false }
    if ('alt' in (img.props?.htmlAttributes ?? {})) { console.error('  ! the img carries an alt attribute — it would shadow the library alt'); ok = false }
  }
}
/* The card's own furniture must still be there, in order, with the figure in
   front of it. NOT an exact equality: pin #10 splices a `bl-topic` chip in
   ahead of the `h2`, and this script has to stay re-runnable next to theirs.
   Anything they add is allowed; anything of the card's that VANISHES is not. */
const shape = (cardBack?.children ?? [])
  .map((c) => bn[c])
  .map((n) => (n.classIds ?? []).map(bName).filter(Boolean).join('.') || n.props?.customTag || n.props?.tag || n.moduleId)
if (shape[0] !== FIG) { console.error(`  ! the first child of .bl-card is ${JSON.stringify(shape[0])}, expected ${FIG}`); ok = false }
let cursor = -1
for (const want of ['h2', 'p', 'bl-more']) {
  const at = shape.indexOf(want)
  if (at < 0) { console.error(`  ! the card lost its ${want}`); ok = false; break }
  if (at < cursor) { console.error(`  ! the card's ${want} moved ahead of its previous sibling`); ok = false; break }
  cursor = at
}
if (shape.filter((s) => s === FIG).length !== 1) { console.error(`  ! ${shape.filter((s) => s === FIG).length} figures on the card`); ok = false }

for (const [selector, styles] of parsed) {
  const r = Object.values(backRules)
    .filter((x) => x.selector === selector)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .pop()
  if (!r) { console.error(`  ! ${selector} did not land`); ok = false; continue }
  if (r.kind === 'class' && !Object.values(bn).some((n) => (n.classIds ?? []).includes(r.id))) {
    console.error(`  ! ${selector} is class-kind and referenced by no node — the publish shake will drop it`); ok = false
  }
  for (const [k, v] of Object.entries(styles)) {
    if (r.styles?.[k] !== v) { console.error(`  ! ${selector} { ${k} } is ${JSON.stringify(r.styles?.[k])}, expected ${JSON.stringify(v)}`); ok = false }
  }
}
/* The shared cap landed, and the five declarations it sits beside did not move.
   `.bl-rel-fig` is the article page's rule; this script only ever adds one key
   to it, so anything else changing is a bug in this script, not a merge. */
const figRuleBack = Object.values(backRules).find((r) => r.kind === 'class' && r.name === FIG)
if (!figRuleBack) { console.error(`  ! .${FIG} class rule is gone`); ok = false }
else {
  if (figRuleBack.styles?.[SHARED_CAP_KEY] !== sharedCap) {
    console.error(`  ! .${FIG} { ${SHARED_CAP_KEY} } is ${JSON.stringify(figRuleBack.styles?.[SHARED_CAP_KEY])}, expected ${sharedCap}`); ok = false
  }
  for (const [k, v] of Object.entries(figCss)) {
    if (figRuleBack.styles?.[k] !== v) {
      console.error(`  ! .${FIG} { ${k} } is ${JSON.stringify(figRuleBack.styles?.[k])}, 62-blog.css says ${JSON.stringify(v)}`); ok = false
    }
  }
  if (!Object.values(bn).some((n) => (n.classIds ?? []).includes(figRuleBack.id))) {
    console.error(`  ! .${FIG} is referenced by no node on /posts`); ok = false
  }
}
if (!p.cells.seoTitle || !p.cells.seoDescription) { console.error('  ! /posts lost its seo cells'); ok = false }
if (p.cells.slug !== PAGE) { console.error(`  ! the slug is now ${JSON.stringify(p.cells.slug)}`); ok = false }

console.log(`\ncard shape   ${shape.join(' | ')}`)
console.log(`seo cells    title=${!!p.cells.seoTitle} description=${!!p.cells.seoDescription}`)
console.log(`verified     ${ok}`)
if (!ok) { console.error('WRITE DID NOT LAND — do not publish'); process.exit(1) }
console.log('\nDraft updated. NOT published.')
