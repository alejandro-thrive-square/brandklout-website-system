#!/usr/bin/env node
/**
 * push-posts-filter.mjs — BugHerd pin #10, the /posts search bar and topic filter.
 *
 *   node push-posts-filter.mjs            # report the plan, write nothing
 *   node push-posts-filter.mjs --apply    # write the draft (does NOT publish)
 *
 * The local counterpart is `04-design/.tmp/site-src` — the "index: search bar +
 * topic filter" block in `css/62-blog.css`, `sections/blog-filter.js`, and the
 * markup `gen-blog.mjs` now emits. That package is the reference: build it and
 * open `final-site/posts.html` FIRST. This script mirrors it into the CMS.
 *
 * ## What the client asked for
 *
 * "Here we should have a search bar and a filter per topic", pinned on
 * `main#top > section#articles.pk.pk-alt > div.wrap.section`. 43 articles, no
 * way to find one.
 *
 * ## Why this is a client-side filter, and why it has to be
 *
 * `.bl-grid` is a `base.loop` over the `posts` table — ONE `article.bl-card`
 * node rendered 43 times, `limit: 60`, `pagination: 'none'`. Every row is
 * already in the DOM at load. There is no server-side query surface to filter
 * against and, at 43 rows, no reason to want one: no fetch, no spinner, no
 * library, nothing added to a site that already has one measured mobile
 * performance problem.
 *
 * ## The topic is DATA on the card, and getting it there is the whole trick
 *
 * `{currentEntry.*}` tokens are interpolated over TOP-LEVEL STRING PROPS ONLY
 * (`core/templates/dynamicBindings.ts` — `if (typeof v !== 'string') continue`).
 * `htmlAttributes` is an object, so `data-topic="{currentEntry.topic}"`
 * publishes that text LITERALLY on all 43 cards. A per-row value has to ride a
 * real string prop: `text`, `href`, `src`, `label`, `alt`.
 *
 * So the topic is a rendered `<span class="bl-topic">`, whose text is the row's
 * `topic` cell. Which means this script does four things, in this order:
 *
 *   1. adds a CUSTOM `topic` field to the `posts` table. `posts` is a SYSTEM
 *      table, but system tables freeze only their *built-in* fields — custom
 *      ones may be added (`core/data/systemTableGuard.ts`). The PATCH is
 *      step-up gated; insta-api handles that. (The comment in `gen-blog.mjs`
 *      that called this collection "builtIn-only with no tool to add one" was
 *      true of the UI, not of the platform. It is corrected there now.)
 *   2. sets that cell on all 43 rows from `post-image-pool.mjs`'s taxonomy.
 *   3. adds the chip node, the filter row and the empty state to `/posts`.
 *   4. upserts the registry rules parsed out of `css/62-blog.css`.
 *
 * Steps 3 and 4 are ONE atomic PUT: rules without nodes are tree-shaken at
 * publish, and nodes without rules render unstyled.
 *
 * ## The taxonomy is reused, not invented
 *
 * `post-image-pool.mjs` `TOPICS[].id` is the ordered, specific-before-general
 * list that already decides which photograph each article gets. Reusing it is
 * what keeps a card's picture and its topic label from disagreeing, and it is
 * the only curated topic set this project has. The chip LABEL is the id with
 * its first letter capitalised — nothing else — so `slugify(label) === id`
 * holds by construction, `?topic=implants` needs no lookup table in the
 * browser, and this script asserts it for all twelve before it writes anything.
 *
 * ## Then push the JS, or the filter is furniture
 *
 *   node push-script-asset.mjs src/scripts/site.js \
 *        ../04-design/.tmp/final-site/assets/site.js --apply
 *
 * Idempotent throughout: re-running reports `=` and changes nothing.
 *
 * NOTHING HERE PUBLISHES.
 */
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSite, getPages, api, toChangedPage, assertTemplatesIntact } from '../../../../process/22-instatic-api-sync/insta-api.mjs'
import { TOPICS, topicFor } from './post-image-pool.mjs'

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

/* Classes that a NODE carries. These must exist as `kind: 'class'` rules or the
   node has nothing to reference and emits no class attribute at all. Everything
   else parsed below goes in as ambient. */
const CLASS_KIND = new Set([
  'bl-filter', 'bl-f-field', 'bl-f-label', 'bl-f-input', 'bl-f-select',
  'bl-f-count', 'bl-topic', 'bl-empty', 'bl-clear',
])

// ── the taxonomy, and the invariant the URL depends on ─────────────────────
/* Must match `slugify` in sections/blog-filter.js exactly. If these two ever
   drift, `?topic=` silently stops restoring and nobody notices until a client
   sends a link that does not work. */
const slugify = (s) => String(s).toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').replace(/^ +| +$/g, '').replace(/ /g, '-')
const labelFor = (id) => id.charAt(0).toUpperCase() + id.slice(1)

for (const t of TOPICS) {
  const label = labelFor(t.id)
  if (slugify(label) !== t.id) {
    console.error(`  ! taxonomy invariant broken: labelFor("${t.id}") = "${label}", ` +
      `slugify -> "${slugify(label)}". ?topic=${t.id} would stop working. Refusing.`)
    process.exit(1)
  }
}
console.log(`taxonomy   ${TOPICS.length} topics from post-image-pool.mjs, slug round-trip OK`)

// ── the CSS parser ─────────────────────────────────────────────────────────
/* Lifted from push-post-layout.mjs, and for the same reason: happy-dom and
   Instatic's own converter both drop `clamp()`, `min()`, `max()` and `100svh`,
   and both flatten a multi-layer `background` to its last layer. This keeps
   every value verbatim, which is all a registry rule needs. */
const camel = (p) => p.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

function declarations (block) {
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

const conditionId = (query) => 'media:' + query.replace(/:\s*/g, ': ').replace(/\s+/g, ' ').trim()

function parse (css) {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules = new Map()
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

/* Slice out only this pin's block. The rest of 62-blog.css is pin #7's, still
   unpublished, and re-upserting someone else's live work from a file they may
   be mid-edit on is not this script's business. */
const whole = readFileSync(CSS, 'utf8')
const from = whole.indexOf('/* --- index: search bar + topic filter')
const to = whole.indexOf('/* --- end of the pin #10 block ---')
if (from < 0 || to < 0 || to < from) {
  console.error('  ! css/62-blog.css does not carry the pin #10 block between its markers — refusing')
  process.exit(1)
}
/* BOTH markers are this pin's own. The first version of this slice ended at the
   "A SINGLE POST" heading instead, and swallowed the two `.bl-rel-fig` rules
   pin #9 appended below mine while this was being written — this script would
   have created another agent's registry rules, at ordering of its choosing,
   inside its own atomic write. An explicit end marker is the fix; a shared file
   needs a boundary you own, not one you inferred. */
const parsed = parse(whole.slice(from, to))
console.log(`css        ${parsed.size} selectors parsed from the pin #10 block of 62-blog.css`)

// ── 1. the `topic` field on the posts table ────────────────────────────────
/* Options carry the LABEL as the option `id`, because that is what the panel's
   dropdown writes into the cell (`SelectCell.tsx` -> `onChange(opt.id)`) and
   what `SelectDisplay` resolves back (`o.id === value || o.value === value`).
   `value` carries the slug, so a cell holding either form still resolves. */
const OPTIONS = TOPICS.map((t) => ({ id: labelFor(t.id), label: labelFor(t.id), value: t.id }))
const TOPIC_FIELD = {
  type: 'select',
  id: 'topic',
  label: 'Topic',
  description: 'Drives the topic filter on /posts. Slug = the label, lowercased.',
  options: OPTIONS,
}

const { tables } = await api('GET', '/admin/api/cms/data/tables')
const posts = tables.find((t) => t.id === 'posts')
if (!posts) { console.error('  ! no `posts` table'); process.exit(1) }
if (posts.system !== true || posts.kind !== 'postType') {
  console.error(`  ! posts table is system=${posts.system} kind=${posts.kind} — not the shape this was written against`)
  process.exit(1)
}
const existingField = posts.fields.find((f) => f.id === 'topic')
const fieldSame = existingField && JSON.stringify(existingField) === JSON.stringify(TOPIC_FIELD)
console.log(`field      posts.topic  ${fieldSame ? '= already correct' : existingField ? '~ will be replaced' : '+ will be added'}`)
if (existingField?.builtIn === true) {
  console.error('  ! a BUILT-IN field is already called `topic` — system tables freeze those. Refusing.')
  process.exit(1)
}

// ── 2. the 43 rows ─────────────────────────────────────────────────────────
const { rows: postRows } = await api('GET', '/admin/api/cms/data/tables/posts/rows')
const plan = postRows.map((r) => {
  const title = r.cells.title ?? r.slug
  const id = topicFor(title).id
  return { id: r.id, slug: r.slug, title, topic: id, label: labelFor(id), was: r.cells.topic }
})
const spread = {}
for (const p of plan) spread[p.label] = (spread[p.label] ?? 0) + 1
const toWrite = plan.filter((p) => p.was !== p.label)
console.log(`rows       ${postRows.length} posts, ${toWrite.length} need writing`)
console.log(`           ${Object.entries(spread).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')}`)

/* Only topics some article actually landed in get an <option>. A choice that
   can only ever return the empty state is a dead end, not a filter — and
   blog-filter.js prunes again at runtime against the cards on the page, so the
   published list and the DOM cannot disagree. Taxonomy order, not alphabetical:
   `topicFor` is first-match-wins, so that order is the one that explains the
   assignments. */
const used = new Set(plan.map((p) => p.topic))
const PAGE_OPTIONS = TOPICS.filter((t) => used.has(t.id)).map((t) => ({ value: t.id, label: labelFor(t.id) }))
console.log(`options    ${PAGE_OPTIONS.length} of ${TOPICS.length} topics are in use and will be offered`)

// ── read the shell and the page, LAST, and as late as possible ─────────────
/* Three other agents are writing to this document right now. Everything above
   is read-only planning; the seq taken here is the one quoted back on the write
   a few dozen lines below, so the window stays as small as it can be. */
const { site: shell, seq } = await getSite()
const rules = shell.styleRules ?? (shell.styleRules = {})
const nameOf = (id) => rules[id]?.name

const { rows: pageRows } = await getPages()
const page = pageRows.find((r) => r.slug === 'posts')
if (!page) { console.error('  ! no `posts` page'); process.exit(1) }
const body = page.cells.body
const nodes = body.nodes

const loop = Object.values(nodes).find((n) => n.moduleId === 'base.loop')
if (!loop) { console.error('  ! /posts has no base.loop — the grid is not what this was written against'); process.exit(1) }
if (loop.props?.filters?.tableId !== 'posts') {
  console.error(`  ! the loop iterates ${loop.props?.filters?.tableId}, not posts — refusing`); process.exit(1)
}
/* If the loop ever starts paginating, or its limit drops below the row count,
   the cards stop all being in the DOM and a client-side filter starts lying. */
if (loop.props.pagination !== 'none' || (loop.props.limit ?? 0) < postRows.length) {
  console.error(`  ! loop is pagination=${loop.props.pagination} limit=${loop.props.limit} for ${postRows.length} rows — ` +
    'a client-side filter would only ever see one page. Refusing.')
  process.exit(1)
}
const card = nodes[loop.children[0]]
const wrap = nodes[loop.parentId]
if (!card || !wrap) { console.error('  ! could not resolve the card or its wrap'); process.exit(1) }
console.log(`page       posts seq ${page.seq}, shell seq ${seq}, ${Object.keys(nodes).length} nodes`)

// ── conditions ─────────────────────────────────────────────────────────────
const conds = shell.conditions ?? (shell.conditions = [])
for (const { contexts } of parsed.values()) {
  for (const c of Object.keys(contexts)) {
    if (conds.some((x) => x.id === c)) { console.log(`= condition ${c}`); continue }
    /* Deliberately NOT auto-created here. `site.conditions` emits in ARRAY
       order and only viewport breakpoints get sorted, so a new condition
       inserted in the wrong place emits after everything regardless of width.
       This pin needs only `(min-width: 700px)`, which .bl-grid already uses. */
    console.error(`  ! condition ${c} is not registered. REUSE an existing one — see ` +
      '15-instatic-api-sync.md, "Cascade order". Refusing.')
    process.exit(1)
  }
}

// ── 4. the registry ────────────────────────────────────────────────────────
const pickRule = (all, selector) => all
  .filter((r) => r.selector === selector)
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  .pop()
const all = Object.values(rules)
const bySelector = new Map()
for (const r of all) bySelector.set(r.selector, pickRule(all, r.selector))
const byName = new Map(all.filter((r) => r.kind === 'class').map((r) => [r.name, r]))
let order = Math.max(...all.map((r) => r.order ?? 0))
let added = 0, updated = 0

for (const [selector, { styles, contexts }] of parsed) {
  const single = /^\.([A-Za-z0-9_-]+)$/.exec(selector)
  const kind = single && CLASS_KIND.has(single[1]) ? 'class' : 'ambient'
  const name = kind === 'class' ? single[1] : selector

  const hit = bySelector.get(selector)
  if (hit) {
    const same = JSON.stringify(hit.styles) === JSON.stringify(styles) &&
      JSON.stringify(hit.contextStyles ?? {}) === JSON.stringify(contexts)
    if (same) continue
    /* Upsert IN PLACE — id, order and kind are load-bearing and none change. */
    hit.styles = styles
    hit.contextStyles = contexts
    hit.updatedAt = Date.now()
    updated++
    continue
  }
  const id = nanoid()
  rules[id] = { id, name, kind, selector, order: ++order, styles, contextStyles: contexts,
    createdAt: Date.now(), updatedAt: Date.now() }
  bySelector.set(selector, rules[id])
  if (kind === 'class') byName.set(name, rules[id])
  added++
  console.log(`+ ${selector.padEnd(34)} ${kind}  order ${order}`)
}
/* A class used only in a COMPOUND selector yields no bare rule above, so it
   would have no name for a node to reference. None of this pin's do today, but
   the guard costs nothing and its absence is what made `.bl-ph` emit no class. */
for (const name of CLASS_KIND) {
  if (byName.has(name)) continue
  const id = nanoid()
  rules[id] = { id, name, kind: 'class', selector: `.${name}`, order: ++order,
    styles: {}, contextStyles: {}, createdAt: Date.now(), updatedAt: Date.now() }
  byName.set(name, rules[id]); bySelector.set(`.${name}`, rules[id]); added++
  console.log(`+ .${name}  class (name carrier)  order ${order}`)
}
console.log(`rules      ${added} added, ${updated} updated in place`)
const cls = (n) => {
  const r = byName.get(n)
  if (!r) { console.error(`  ! no class rule .${n}`); process.exit(1) }
  return r.id
}

// ── 3. the nodes ───────────────────────────────────────────────────────────
const made = {}
const node = (moduleId, props, classIds, children) => {
  const id = nanoid()
  made[id] = { id, moduleId, props, breakpointOverrides: {}, children: children ?? [],
    classIds: classIds ?? [], parentId: null }
  for (const c of made[id].children) made[c].parentId = id
  return id
}
const box = (tag, html, classIds, children) =>
  node('base.container', { tag, customTag: '', htmlAttributes: html ?? {} }, classIds, children)
const text = (tag, value, classIds, html) =>
  node('base.text', { text: value, tag, htmlAttributes: html ?? {} }, classIds)

/* `base.label` with targetMode 'explicit' emits `<label for="…">`; the default
   'auto' emits `data-instatic-label-target="auto"` and relies on the form
   runtime, which this page does not load. A real `for` is the point. */
const label = (t, target) => node('base.label',
  { text: t, targetMode: 'explicit', targetId: target }, [cls('bl-f-label')])

const alreadyChip = (card.children ?? []).some((c) =>
  (nodes[c]?.classIds ?? []).some((x) => nameOf(x) === 'bl-topic'))
const alreadyFilter = Object.values(nodes).some((n) => n.props?.htmlAttributes?.id === 'blFilter')

let chipId = null
if (!alreadyChip) {
  chipId = text('span', '{currentEntry.topic}', [cls('bl-topic')])
}

let filterId = null, emptyId = null
if (!alreadyFilter) {
  filterId = box('div', { id: 'blFilter', role: 'search' }, [cls('bl-filter')], [
    box('div', {}, [cls('bl-f-field')], [
      label('Search the journal', 'blSearch'),
      node('base.input', {
        inputType: 'search', fieldId: '', name: 'q', id: 'blSearch',
        placeholder: 'implants, cost, sedation…', value: '',
        required: false, disabled: false, readOnly: false, autocomplete: 'off',
        min: '', max: '', minLength: 0, maxLength: 0, pattern: '',
      }, [cls('bl-f-input')]),
    ]),
    box('div', {}, [cls('bl-f-field')], [
      label('Topic', 'blTopic'),
      node('base.select', { fieldId: '', name: 'topic', id: 'blTopic',
        required: false, disabled: false, multiple: false }, [cls('bl-f-select')],
      [
        node('base.option', { value: '', label: 'All topics', selected: false, disabled: false }, []),
        ...PAGE_OPTIONS.map((o) => node('base.option',
          { value: o.value, label: o.label, selected: false, disabled: false }, [])),
      ]),
    ]),
    /* The count is written by blog-filter.js on load, so the number baked here
       is only what a scripts-off reader sees. It is still correct today and
       cannot go stale by more than the archive grows. */
    text('p', `${postRows.length} articles`,
      [cls('bl-f-count')], { id: 'blCount', role: 'status', 'aria-live': 'polite' }),
  ])

  emptyId = box('div', { id: 'blEmpty', hidden: '' }, [cls('bl-empty')], [
    text('h3', 'Nothing in the archive matches that.', []),
    text('p', 'Try a single word rather than a phrase — or clear the filters and browse the whole archive.', []),
    /* No href -> `<button type="button">`. `.btn` is deliberately not reused:
       it slides a `::after` panel over its own label and depends on a `<span>`
       wrapper to stay legible, and `base.button` emits `props.label` bare. */
    node('base.button', { label: 'Show every article', href: '', target: '_self',
      disabled: false, buttonType: 'button', htmlAttributes: { id: 'blClear' } },
    [cls('bl-clear')]),
  ])
}

if (alreadyChip && alreadyFilter) {
  console.log('\n= chip, filter row and empty state are all already present — nothing to do')
  process.exit(0)
}

/* ANCHOR THE CHIP ON THE MARKUP, NEVER ON AN INDEX. Pin #9 is adding a featured
   image as the card's first child in this same worktree, right now. Splicing in
   front of whichever child renders as the <h2> means their image stays at index
   0, my chip becomes index 1, and neither of us has to know what the other did
   first — the two writes commute. */
if (chipId) {
  const tagOf = (n) => (n?.props?.tag === 'custom' ? n?.props?.customTag : n?.props?.tag)
  const at = (card.children ?? []).findIndex((c) => tagOf(nodes[c]) === 'h2')
  if (at < 0) {
    console.error('  ! no <h2> child on .bl-card to anchor the topic chip against — refusing')
    process.exit(1)
  }
  card.children = [...card.children.slice(0, at), chipId, ...card.children.slice(at)]
  made[chipId].parentId = card.id
  console.log(`\n+ .bl-topic chip at index ${at} of ${card.children.length} in the loop card`)
}
if (filterId) {
  const at = wrap.children.indexOf(loop.id)
  wrap.children = [...wrap.children.slice(0, at), filterId, ...wrap.children.slice(at), emptyId]
  made[filterId].parentId = wrap.id
  made[emptyId].parentId = wrap.id
  console.log(`+ #blFilter before the grid, #blEmpty after it (${Object.keys(made).length} nodes)`)
}
Object.assign(nodes, made)

if (!APPLY) {
  console.log('\nDRY RUN — re-run with --apply')
  process.exit(0)
}

// ── write: the table field ─────────────────────────────────────────────────
if (!fieldSame) {
  const fields = posts.fields.filter((f) => f.id !== 'topic').concat([TOPIC_FIELD])
  const r = await api('PATCH', '/admin/api/cms/data/tables/posts', { fields })
  const back = (r.table?.fields ?? []).find((f) => f.id === 'topic')
  if (!back) { console.error('  ! the topic field did not land'); process.exit(1) }
  console.log(`\nfield      topic landed, ${back.options?.length ?? 0} options`)
}

// ── write: the 43 rows ─────────────────────────────────────────────────────
/* PATCH REPLACES `cells` WHOLESALE despite the verb, so each row is re-read
   immediately before its write and spread. Anything omitted here is erased —
   including whatever pin #9 or pin #11 has just written to `featuredMedia`. */
let wrote = 0
const rowFails = []
for (const p of toWrite) {
  try {
    const before = (await api('GET', `/admin/api/cms/data/rows/${p.id}`)).row
    await api('PATCH', `/admin/api/cms/data/rows/${p.id}`,
      { cells: { ...before.cells, topic: p.label } })
    const after = (await api('GET', `/admin/api/cms/data/rows/${p.id}`)).row
    if (after.cells.title !== before.cells.title || after.cells.slug !== before.cells.slug ||
        JSON.stringify(after.cells.body) !== JSON.stringify(before.cells.body) ||
        after.cells.featuredMedia !== before.cells.featuredMedia) {
      rowFails.push(`${p.slug}: A CELL OTHER THAN topic CHANGED`)
      break
    }
    if (after.cells.topic !== p.label) { rowFails.push(`${p.slug}: not written`); continue }
    wrote++
  } catch (e) { rowFails.push(`${p.slug}: ${e.message.slice(0, 120)}`) }
}
console.log(`rows       topic set on ${wrote}/${toWrite.length}`)
if (rowFails.length) {
  console.error(`  ! ${rowFails.length} row failures:`)
  for (const f of rowFails) console.error(`    ${f}`)
  process.exit(1)
}

// ── write: shell + page, ONE atomic PUT ────────────────────────────────────
/* Re-read for a FRESH seq immediately before writing. Three other agents share
   this document; a stale seq is a 409, and a 409 here means re-run, never force.
   `toChangedPage` carries `template` through — omitting it once turned `post`
   into an ordinary page and 404'd all 43 articles. */
const { site: shellNow, seq: seqNow } = await getSite()
if (seqNow !== seq) {
  console.error(`  ! the shell moved ${seq} -> ${seqNow} while this ran (another agent). ` +
    'Re-run — the plan is cheap and the merge is not worth guessing at.')
  process.exit(1)
}
const { rows: pagesNow } = await getPages()
const pageNow = pagesNow.find((r) => r.slug === 'posts')
if (pageNow.seq !== page.seq) {
  console.error(`  ! /posts moved seq ${page.seq} -> ${pageNow.seq} while this ran (pin #9, probably). Re-run.`)
  process.exit(1)
}

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
console.log(`\nwrite      seq ${seq} -> ${res.seq ?? '?'}`)

// ── verify against a fresh read, subtree-scoped ────────────────────────────
let ok = true
const fail = (m) => { console.error(`  ! ${m}`); ok = false }

const { site: sBack } = await getSite()
const bRules = sBack.styleRules ?? {}
for (const [selector] of parsed) {
  if (!Object.values(bRules).some((r) => r.selector === selector)) fail(`${selector} did not land`)
}
for (const n of CLASS_KIND) {
  if (!Object.values(bRules).some((r) => r.kind === 'class' && r.name === n)) fail(`.${n} has no class-kind rule`)
}

const { rows: back } = await getPages()
const bp = back.find((r) => r.slug === 'posts')
const bn = bp.cells.body.nodes
const bName = (id) => bRules[id]?.name

/* Scope every count to the subtree. The drawer and the footer live in the same
   node tree, and a whole-page grep is what once read 30 links and cried failure
   on a write that was fine. */
const sub = (rootId) => {
  const out = []
  ;(function walk (id) {
    const n = bn[id]; if (!n) return
    out.push(n)
    for (const c of n.children ?? []) walk(c)
  })(rootId)
  return out
}
const bLoop = Object.values(bn).find((n) => n.moduleId === 'base.loop')
const bCard = bn[bLoop?.children?.[0]]
const bFilter = Object.values(bn).find((n) => n.props?.htmlAttributes?.id === 'blFilter')
const bEmpty = Object.values(bn).find((n) => n.props?.htmlAttributes?.id === 'blEmpty')

if (!bFilter) fail('#blFilter is not in the page')
if (!bEmpty) fail('#blEmpty is not in the page')
const chips = (bCard?.children ?? []).map((c) => bn[c])
  .filter((n) => (n?.classIds ?? []).some((x) => bName(x) === 'bl-topic'))
if (chips.length !== 1) fail(`${chips.length} .bl-topic chips on the card, wanted exactly 1`)
if (chips[0] && chips[0].props.text !== '{currentEntry.topic}') fail(`chip text is ${JSON.stringify(chips[0].props.text)}`)

const inFilter = bFilter ? sub(bFilter.id) : []
const opts = inFilter.filter((n) => n.moduleId === 'base.option')
if (opts.length !== PAGE_OPTIONS.length + 1) fail(`${opts.length} <option> nodes, wanted ${PAGE_OPTIONS.length + 1}`)
if (inFilter.filter((n) => n.moduleId === 'base.input').length !== 1) fail('expected exactly 1 input in the filter row')
if (inFilter.filter((n) => n.moduleId === 'base.select').length !== 1) fail('expected exactly 1 select in the filter row')
if (inFilter.filter((n) => n.moduleId === 'base.label' && n.props.targetMode === 'explicit').length !== 2) {
  fail('expected 2 labels with an explicit `for` target')
}
/* The chip is inside the loop, so it must sit AFTER whatever pin #9 put first
   and BEFORE the h2 — not merely "present somewhere". */
const tagOfB = (n) => (n?.props?.tag === 'custom' ? n?.props?.customTag : n?.props?.tag)
const iChip = (bCard?.children ?? []).findIndex((c) => (bn[c]?.classIds ?? []).some((x) => bName(x) === 'bl-topic'))
const iH2 = (bCard?.children ?? []).findIndex((c) => tagOfB(bn[c]) === 'h2')
if (!(iChip >= 0 && iH2 >= 0 && iChip < iH2)) fail(`chip at ${iChip}, h2 at ${iH2} — the chip must precede the title`)

/* The one check that catches the 43 dead articles: an incremental write should
   not touch `post`, but verify rather than assume. */
await assertTemplatesIntact({ post: true })

/* THE ROW CELLS LAND ON THE DRAFT ROWS, AND THAT IS AS FAR AS THIS CAN GO.
   -----------------------------------------------------------------------
   `PATCH /data/rows/:id` saves DRAFT cells. It does not cut a new
   `data_row_versions` row and it does not move `active_version_id` — the
   publish path is a separate `POST /rows/:id/publish` (rows.ts:238 ->
   `persistDataRowPublish`).

   And a SITE publish does not promote them either: `persistSitePublish`
   (`server/repositories/publish.ts`) loops over `input.pages` and its status
   query reads `where data_rows.table_id = 'pages'`. Post-type rows are
   invisible to it. This is NOT the documented "publishing ships the whole
   draft" behaviour — that is true of pages and false of post rows, and the two
   look identical from the outside.

   So verify the DRAFT, which is what this script wrote and all it claims, and
   REPORT the published projection rather than failing on it. */
const draftBack = (await api('GET', '/admin/api/cms/data/tables/posts/rows')).rows
const byId = new Map(draftBack.map((r) => [r.id, r]))
const wrongDraft = plan.filter((p) => byId.get(p.id)?.cells?.topic !== p.label)
if (draftBack.length !== postRows.length) fail(`${draftBack.length} draft rows, expected ${postRows.length}`)
if (wrongDraft.length) fail(`${wrongDraft.length} draft rows do not carry the right topic`)
console.log(`\ndraft rows ${draftBack.length - wrongDraft.length}/${draftBack.length} carry their topic`)

/* `loop-preview` calls the very same `fetchPublishedDataRowItems` the publisher
   does, so it answers "what would published HTML actually contain" without
   publishing anything. `limit=60` to match the loop — the default page is SIX,
   and the first version of this check read that as 37 missing rows. */
const preview = await api('GET', '/admin/api/cms/data/tables/posts/loop-preview?limit=60')
const items = preview.items ?? []
const wantByRow = new Map(plan.map((p) => [p.id, p.label]))
const live = items.filter((it) => (it.fields.topic ?? '') === (wantByRow.get(it.fields.rowId) ?? ''))
if (items.length !== postRows.length) fail(`the publisher sees ${items.length} rows, not ${postRows.length}`)
console.log(`published  ${live.length}/${items.length} rows carry the topic in the PUBLISHED projection`)
if (live.length !== items.length) {
  console.log([
    '',
    '  --------------------------------------------------------------------',
    '  EXPECTED, and it is the one thing left to do.',
    '',
    '  The chip renders from {currentEntry.topic}, which resolves against the',
    "  row's PUBLISHED version. Until the rows are published it resolves to \"\"",
    '  and every chip is empty. `.bl-topic:empty{display:none}` collapses them',
    '  rather than leaving 43 gaps, and blog-filter.js drops a topic no card',
    '  carries — so the control degrades to search-only and nothing looks',
    '  broken. The topic filter is simply not there yet.',
    '',
    '  Publishing 43 rows re-bakes 43 article pages from the current draft.',
    '  That is a publish, so it is not this script\'s call:',
    '',
    '      node publish-post-rows.mjs            # report',
    '      node publish-post-rows.mjs --apply    # publish the 43 rows',
    '',
    '  The same applies to anything pin #11 re-points on `featuredMedia`.',
    '  --------------------------------------------------------------------',
  ].join('\n'))
}

console.log(`\nverified   ${ok}`)
if (!ok) { console.error('WRITE DID NOT FULLY LAND — do not publish'); process.exit(1) }
console.log(`
Draft updated. Nothing published.

Next, and the filter is inert without it:
  node push-script-asset.mjs src/scripts/site.js ../04-design/.tmp/final-site/assets/site.js --apply
`)
