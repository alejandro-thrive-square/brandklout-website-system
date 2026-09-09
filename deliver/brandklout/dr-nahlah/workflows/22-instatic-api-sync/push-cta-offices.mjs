#!/usr/bin/env node
/**
 * push-cta-offices.mjs — put BOTH offices in every call-to-action band on
 * Instatic, headlessly, over the REST API.
 *
 *   node push-cta-offices.mjs            # report the plan, write nothing
 *   node push-cta-offices.mjs --apply    # write the draft (does NOT publish)
 *
 * The local counterpart is 04-design/.tmp/site-src/add-cta-offices.mjs, which
 * makes the same change to the package. Run that, rebuild and gate FIRST; this
 * script assumes the local build is the reference and mirrors it.
 *
 * ## Why
 *
 * Every CTA band ended in one button, and the two practices keep SEPARATE
 * Flexbook calendars, so that button sent every reader to whichever office was
 * hardcoded in it — Alexandria, as it happened, on all 24 of them. The Webflow
 * build replaced the button with its two office cards, each with its own
 * booking link. This does the same here.
 *
 * ## What it changes
 *
 * STYLE REGISTRY (3 changes, all reasoned in css/20-pagekit.css):
 *   + `.cta-offices`            class,   the two-up grid
 *   + `.cta-offices .ct-office` ambient, the white card on the gold band
 *   ~ `.iv-cta .btn` becomes `.iv-cta .cta-offices`
 *
 * That last one is not cosmetic. `.iv-cta .btn { margin-top: 2rem }` existed to
 * space the ONE button that used to close the home page. Leave it and it now
 * matches the "Book now" button inside each card instead, pushing both of them
 * 2rem down inside their card. The rule has to move to the block that replaced
 * the button, not merely be left alone.
 *
 * PAGES (24): in each band the lone `.btn-dark` and the `.cta-phones` row after
 * it are removed and a `.cta-offices` grid is inserted in their place. The two
 * cards are DEEP-CLONED from /contact-maclean's `.ct-office` articles under
 * fresh ids, so the addresses, both labelled numbers, Directions and the
 * per-office booking link are one source rather than 24 hand-built copies.
 * On the home page the standalone `.iv-locs` strip is removed as well — the
 * offices now live in the band, and showing them twice in a row is not what the
 * Webflow build does.
 *
 * Idempotent: a band that already carries `.cta-offices` is skipped, so a run
 * interrupted part-way can simply be repeated.
 *
 * NOTHING HERE PUBLISHES.
 */
import { randomBytes } from 'node:crypto'
import { api, getSite, getPages } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => {
  const b = randomBytes(n)
  let s = ''
  for (let i = 0; i < n; i++) s += ALPHABET[b[i] & 63]
  return s
}

const site = await getSite()
const shell = site.site
const rules = shell.styleRules

const byName = (name, kind = 'class') =>
  Object.values(rules).find((r) => r.name === name && r.kind === kind)
const bySelector = (sel) => Object.values(rules).find((r) => r.selector === sel)

// ── 1. the style registry ──────────────────────────────────────────────────

const ruleChanges = []

if (!bySelector('.cta-offices')) {
  const id = nanoid(21)
  rules[id] = {
    id,
    name: 'cta-offices',
    kind: 'class',
    selector: '.cta-offices',
    order: 6690,
    styles: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(19rem,1fr))',
      gap: '10px',
      width: '100%',
      maxWidth: '64rem',
      marginInline: 'auto',
      marginInlineStart: 'auto',
      marginInlineEnd: 'auto',
      textAlign: 'left',
      justifySelf: 'stretch',
    },
    contextStyles: {},
    createdAt: site.seq,
    updatedAt: site.seq,
  }
  ruleChanges.push('+ .cta-offices (class)')
}

if (!bySelector('.cta-offices .ct-office')) {
  const id = nanoid(16)
  rules[id] = {
    id,
    name: '.cta-offices .ct-office',
    kind: 'ambient',
    selector: '.cta-offices .ct-office',
    order: 6691,
    styles: { background: 'var(--card)', color: 'var(--fg)' },
    contextStyles: {},
    createdAt: site.seq,
    updatedAt: site.seq,
  }
  ruleChanges.push('+ .cta-offices .ct-office (ambient)')
}

const ivBtn = bySelector('.iv-cta .btn')
if (ivBtn) {
  ivBtn.selector = '.iv-cta .cta-offices'
  ivBtn.name = '.iv-cta .cta-offices'
  ruleChanges.push('~ .iv-cta .btn -> .iv-cta .cta-offices (it now matched the buttons INSIDE the cards)')
} else if (!bySelector('.iv-cta .cta-offices')) {
  throw new Error('neither .iv-cta .btn nor .iv-cta .cta-offices is in the registry')
}

const CTA_OFFICES = bySelector('.cta-offices').id
const CT_OFFICE = byName('ct-office').id

// ── 2. the cards, cloned from /contact-maclean ─────────────────────────────

const rows = (await getPages()).rows
const source = rows.find((r) => r.slug === 'contact-maclean')
if (!source) throw new Error('contact-maclean is not on the site; run push-contact-split.mjs first')
const srcNodes = source.cells.body.nodes

/* The two office cards, in page order, from the FIRST .ct-office-grid on that
   page — the one under "Where to go.". */
const srcCards = Object.values(srcNodes)
  .filter((n) => (n.classIds ?? []).includes(CT_OFFICE))
  .sort((a, b) => {
    const p = srcNodes[a.parentId]
    return p.children.indexOf(a.id) - p.children.indexOf(b.id)
  })
if (srcCards.length !== 2) throw new Error(`expected 2 .ct-office cards on contact-maclean, found ${srcCards.length}`)

/* Sanity: the cards must be the ones that carry a booking link, not a stripped
   copy. Each office books its own calendar and that is the entire point. */
const bookHrefs = srcCards.map((c) =>
  c.children.map((id) => srcNodes[id]).find((n) => n.moduleId === 'base.button')?.props?.href)
if (bookHrefs.some((h) => !h || !/flexbook/.test(h)) || bookHrefs[0] === bookHrefs[1]) {
  throw new Error(`source cards do not carry two distinct Flexbook links: ${JSON.stringify(bookHrefs)}`)
}

/** Deep-clone a subtree under fresh ids, reparented onto `parentId`. */
function cloneSubtree(nodes, rootId, parentId, into) {
  const map = new Map()
  const walk = (id) => { map.set(id, nanoid(21)); for (const c of nodes[id].children ?? []) walk(c) }
  walk(rootId)
  for (const [oldId, newId] of map) {
    const n = nodes[oldId]
    into[newId] = {
      ...structuredClone(n),
      id: newId,
      parentId: oldId === rootId ? parentId : map.get(n.parentId),
      children: (n.children ?? []).map((c) => map.get(c)),
    }
  }
  return map.get(rootId)
}

// ── 3. the pages ───────────────────────────────────────────────────────────

/** Remove a node and everything under it. */
function cut(nodes, id) {
  const stack = [id]
  while (stack.length) {
    const cur = stack.pop()
    for (const c of nodes[cur]?.children ?? []) stack.push(c)
    delete nodes[cur]
  }
}

const writes = []
const skipped = []

for (const row of rows) {
  const nodes = row.cells.body.nodes
  if (!nodes || Object.keys(nodes).length < 2) continue
  const V = Object.values(nodes)

  if (V.some((n) => (n.classIds ?? []).includes(CTA_OFFICES))) { skipped.push([row.slug, 'already done']); continue }

  /* The band's lone button: a base.button whose only classes are the btn set and
     which sits inside .cta-in (interior pages) or .iv-cta's wrap (home). Matched
     by the class the design gives it, `btn-dark`, which nothing else uses. */
  const btnDark = byName('btn-dark')
  if (!btnDark) throw new Error('no btn-dark class rule')
  const button = V.find((n) => n.moduleId === 'base.button' && (n.classIds ?? []).includes(btnDark.id))
  if (!button) continue

  const parent = nodes[button.parentId]
  const at = parent.children.indexOf(button.id)

  // the phone row that followed it, if this band has one
  const phonesCls = byName('cta-phones')
  const phones = phonesCls
    ? parent.children.map((id) => nodes[id]).find((n) => (n.classIds ?? []).includes(phonesCls.id))
    : null

  // the standalone locations strip, home page only
  const locsCls = byName('iv-locs')
  const locs = locsCls
    ? V.find((n) => (n.classIds ?? []).includes(locsCls.id))
    : null

  const grid = {
    props: { tag: 'div', customTag: '', htmlAttributes: { 'data-rv': 'stagger' } },
    breakpointOverrides: {},
    children: [],
    id: nanoid(21),
    moduleId: 'base.container',
    classIds: [CTA_OFFICES],
    parentId: parent.id,
  }
  nodes[grid.id] = grid
  for (const card of srcCards) grid.children.push(cloneSubtree(srcNodes, card.id, grid.id, nodes))

  // swap the button out for the grid, in place
  parent.children = parent.children.map((id) => (id === button.id ? grid.id : id))
  cut(nodes, button.id)
  if (phones) { parent.children = parent.children.filter((id) => id !== phones.id); cut(nodes, phones.id) }
  if (locs) {
    const lp = nodes[locs.parentId]
    lp.children = lp.children.filter((id) => id !== locs.id)
    cut(nodes, locs.id)
  }

  writes.push({
    id: row.id, slug: row.slug, title: row.cells.title,
    nodes, rootNodeId: row.cells.body.rootNodeId, seq: row.seq,
    note: `button@${at}${phones ? ' + phones' : ''}${locs ? ' + iv-locs' : ''}`,
  })
}

console.log('style registry:')
for (const c of ruleChanges) console.log('  ', c)
console.log(`\npages (${writes.length}):`)
for (const w of writes) console.log(`   ${w.slug.padEnd(28)} ${w.note}`)
if (skipped.length) console.log(`\nskipped (${skipped.length}): ${skipped.map(([s]) => s).join(', ')}`)

if (!writes.length && !ruleChanges.length) { console.log('\nnothing to do'); process.exit(0) }
if (!APPLY) { console.log('\ndry run — nothing written. re-run with --apply'); process.exit(0) }

// ── write ──────────────────────────────────────────────────────────────────

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site: shell,
  changedPages: writes.map(({ seq, note, ...p }) => p),
  deletedPageIds: [],
  changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(writes.map((w) => [w.id, w.seq])),
  shellBaseSeq: site.seq,
})
console.log('\nwritten:', JSON.stringify(res).slice(0, 160))

// ── verify, against a fresh read ───────────────────────────────────────────

const after = await getSite()
const afterRules = after.site.styleRules
const okRules = !!Object.values(afterRules).find((r) => r.selector === '.cta-offices') &&
  !!Object.values(afterRules).find((r) => r.selector === '.cta-offices .ct-office') &&
  !!Object.values(afterRules).find((r) => r.selector === '.iv-cta .cta-offices') &&
  !Object.values(afterRules).find((r) => r.selector === '.iv-cta .btn')
console.log(`${okRules ? 'OK  ' : 'BAD '} style registry`)

const fresh = (await getPages()).rows
let bad = okRules ? 0 : 1
for (const w of writes) {
  const row = fresh.find((r) => r.slug === w.slug)
  const V = Object.values(row.cells.body.nodes)
  const grid = V.find((n) => (n.classIds ?? []).includes(CTA_OFFICES))
  const cards = V.filter((n) => (n.classIds ?? []).includes(CT_OFFICE))
  const books = V.filter((n) => n.moduleId === 'base.button' && /flexbook/.test(n.props?.href ?? ''))
    .map((n) => n.props.href).sort()
  const stillDark = V.some((n) => n.moduleId === 'base.button' &&
    (n.classIds ?? []).includes(byName('btn-dark').id))
  const ok = !!grid && cards.length === 2 && books.length === 2 &&
    books[0] !== books[1] && !stillDark
  if (!ok) { bad++; console.log(`BAD  ${w.slug}: grid=${!!grid} cards=${cards.length} books=${books.length} loneDark=${stillDark}`) }
}
console.log(`${bad ? 'BAD ' : 'OK  '} ${writes.length - (bad - (okRules ? 0 : 1))}/${writes.length} pages carry both offices`)
if (bad) { console.error('\ndo NOT publish.'); process.exit(1) }
console.log('\nEvery CTA band carries both offices. Nothing published.')
