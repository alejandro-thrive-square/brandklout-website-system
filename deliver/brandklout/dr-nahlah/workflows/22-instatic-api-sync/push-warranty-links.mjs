#!/usr/bin/env node
/**
 * push-warranty-links.mjs — BugHerd #47: every "five-year warranty" on the paid
 * pages becomes a link to /five-year-warranty.
 *
 *   node push-warranty-links.mjs            # report the plan, write nothing
 *   node push-warranty-links.mjs --apply    # write the draft (does NOT publish)
 *
 * ## Why this is surgery and not a rebuild
 *
 * The obvious route is to add the anchor in `site-src`, rebuild and re-push the
 * pages through `ads-to-nodes.py` + `push-ads-pages.mjs`. **That would undo the
 * Vimeo migration.** The 2026-09-21 YouTube -> Vimeo swap was applied to the
 * live Instatic document only; the local package still carries the YouTube
 * embeds, so any ads page pushed from the package today reverts its films.
 * Verified before writing this: /ads-landing-pages/alexandria-dental-implants
 * serves `data-vimeo` four times, and the package build of the same page serves
 * `youtube.com/embed`.
 *
 * So the link is inserted into the LIVE node tree instead, and the package keeps
 * its own copy of the change for whenever the two are reconciled.
 *
 * ## The two node shapes, both taken from what the converter produces
 *
 * A `base.text` cannot contain a link, so the sentence has to be split.
 *
 *   tag:'p'     the text node IS the paragraph. It becomes
 *               `base.container {tag:'custom', customTag:'p'}` keeping its id,
 *               classIds and parent, with three children: text, link, text.
 *   tag:'none'  the text node is the only child of a wrapper (`.fa-body`).
 *               The WRAPPER takes the three children in its place.
 *
 * Idempotent: a sentence whose paragraph already contains a link to
 * /five-year-warranty is skipped, so an interrupted run can be repeated.
 *
 * ## Why the link opens in a new tab
 *
 * These are noindex paid landing pages that deliberately do not leak a click
 * into the site (see the PAGES note in build-site.mjs). #47 asks for the proof
 * link on them all the same, and the reviewer is right that a warranty claim
 * needs one. `target="_blank"` gives both: the terms are one click away, and
 * the landing page is not navigated away from, so a part-filled form survives.
 *
 * NOTHING HERE PUBLISHES.
 */
import { randomBytes } from 'node:crypto'
import { getPages, getSite, api, toChangedPage } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = () => { const b = randomBytes(21); let s = ''; for (let i = 0; i < 21; i++) s += ALPHABET[b[i] & 63]; return s }

const PHRASE = 'five-year warranty'
const HREF = '/five-year-warranty'

const textNode = (text, parentId) => ({
  id: nanoid(), moduleId: 'base.text',
  props: { text, tag: 'none', htmlAttributes: {} },
  breakpointOverrides: {}, classIds: [], children: [], parentId,
})
const linkNode = (parentId) => ({
  id: nanoid(), moduleId: 'base.link',
  props: { href: HREF, target: '_blank', htmlAttributes: { rel: 'noopener' }, text: PHRASE },
  breakpointOverrides: {}, classIds: [], children: [], parentId,
})

const { rows } = await getPages()

/* The terms page has to exist before anything links to it. */
const target = rows.find((r) => (r.cells?.slug ?? r.slug) === 'five-year-warranty')
if (!target) { console.error('/five-year-warranty is not in the draft — push it first'); process.exit(1) }
console.log(`/five-year-warranty exists (row ${target.id})\n`)

const plan = []
const leftAlone = []
for (const row of rows) {
  const nodes = row.cells?.body?.nodes
  if (!nodes) continue
  const slug = row.cells?.slug ?? row.slug
  if (slug === 'five-year-warranty') continue

  const hits = []
  const held = []
  for (const [id, n] of Object.entries(nodes)) {
    if (n.moduleId !== 'base.text') continue
    const t = n.props?.text
    if (typeof t !== 'string' || !t.includes(PHRASE)) continue

    /* Already linked? The sibling set is where the link would be. */
    const holder = n.props.tag === 'none' ? nodes[n.parentId] : n
    const siblings = n.props.tag === 'none' ? (holder?.children ?? []) : (n.children ?? [])
    if (siblings.some((c) => nodes[c]?.props?.href === HREF)) continue

    /* Two places the phrase appears that must NOT become a link, and both are
       real on this site:

        - A HEADING. /about's card is headed "A five-year warranty" and carries
          its own "Read the warranty terms" link underneath. A linked heading
          would be a second link to the same page in the same card.
        - INSIDE AN EXISTING LINK. /our-team's mention is the description line
          of a teaser that is itself an <a> to /about. An anchor inside an
          anchor is invalid HTML and the browser unnests it unpredictably.

       These are left alone by design, not refused. */
    if (/^h[1-6]$/.test(n.props.tag)) { held.push({ id, why: 'a heading' }); continue }
    let up = n.parentId, inLink = false
    while (up && nodes[up]) {
      if (nodes[up].moduleId === 'base.link') { inLink = true; break }
      up = nodes[up].parentId
    }
    if (inLink) { held.push({ id, why: 'already inside a link' }); continue }

    if (t.split(PHRASE).length > 2) { hits.push({ id, skip: 'phrase appears twice in one node' }); continue }
    hits.push({ id, tag: n.props.tag })
  }
  if (held.length) for (const h of held) leftAlone.push(`${slug}  ${h.id}  ${h.why}`)
  if (hits.length) plan.push({ row, slug, hits })
}

console.log(`${plan.length} pages carry an unlinked "${PHRASE}"`)
for (const p of plan) {
  for (const h of p.hits) console.log(`  ${p.slug.padEnd(52)} ${h.id}  ${h.skip ? 'SKIP: ' + h.skip : 'tag:' + h.tag}`)
}
if (leftAlone.length) {
  console.log(`
${leftAlone.length} mention(s) deliberately left unlinked:`)
  for (const l of leftAlone) console.log('  ' + l)
}
const blocked = plan.flatMap((p) => p.hits.filter((h) => h.skip))
if (blocked.length) { console.error('\nrefusing: the split is ambiguous on the nodes marked SKIP'); process.exit(1) }
if (!plan.length) { console.log('\nnothing to do'); process.exit(0) }
if (!APPLY) { console.log('\ndry run — nothing written. Re-run with --apply.'); process.exit(0) }

const changedPages = []
const baseSeqs = {}
let made = 0

for (const p of plan) {
  const N = structuredClone(p.row.cells.body.nodes)
  for (const h of p.hits) {
    const n = N[h.id]
    const [before, after] = n.props.text.split(PHRASE)

    if (n.props.tag === 'none') {
      // the wrapper keeps its identity; the single text child becomes three
      const par = N[n.parentId]
      const b = textNode(before, par.id)
      const l = linkNode(par.id)
      const a = textNode(after, par.id)
      N[b.id] = b; N[l.id] = l; N[a.id] = a
      delete N[h.id]
      N[par.id] = { ...par, children: par.children.flatMap((c) => (c === h.id ? [b.id, l.id, a.id] : [c])) }
    } else {
      // the text node itself becomes the paragraph container, same id
      const tag = n.props.tag
      const b = textNode(before, h.id)
      const l = linkNode(h.id)
      const a = textNode(after, h.id)
      N[b.id] = b; N[l.id] = l; N[a.id] = a
      N[h.id] = {
        ...n,
        moduleId: 'base.container',
        props: { tag: 'custom', customTag: tag, htmlAttributes: n.props.htmlAttributes ?? {} },
        children: [b.id, l.id, a.id],
      }
    }
    made += 3
  }
  changedPages.push(toChangedPage(p.row, { nodes: N }))
  baseSeqs[p.row.id] = p.row.seq
}

const { site, seq: shellBaseSeq } = await getSite()
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site, changedPages, deletedPageIds: [],
  changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs, shellBaseSeq,
})
console.log(`\nsaved ${changedPages.length} pages, ${made} nodes added — seq ${res.seq}`)

/* Read back: this platform reports some write failures as prose with a 200. */
const after = (await getPages()).rows
const bad = []
for (const p of plan) {
  const N = after.find((r) => r.id === p.row.id)?.cells?.body?.nodes
  if (!N) { bad.push(`${p.slug}: row vanished`); continue }
  const links = Object.values(N).filter((n) => n.props?.href === HREF)
  if (links.length !== p.hits.length) bad.push(`${p.slug}: ${links.length} links, expected ${p.hits.length}`)
  const stillWhole = Object.values(N).some((n) => n.moduleId === 'base.text' && String(n.props?.text).includes(PHRASE))
  if (stillWhole) bad.push(`${p.slug}: a text node still holds the phrase unsplit`)
}
if (bad.length) throw new Error(`read-back mismatch:\n  ${bad.join('\n  ')}`)
console.log(`verified — ${plan.length} pages link the claim to ${HREF}`)
console.log('\nDRAFT only. Publishing is a separate step.')
