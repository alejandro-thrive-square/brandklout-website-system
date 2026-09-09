#!/usr/bin/env node
/**
 * push-pin14-review-widget.mjs — BugHerd #14, `/patient-stories` → `#score`.
 * DRAFT ONLY, NEVER PUBLISHES.
 *
 *   node push-pin14-review-widget.mjs            # dry run
 *   node push-pin14-review-widget.mjs --apply
 *
 * > "Add review widget here"  — pinned on `section#score > div.wrap.section`
 *
 * ## The widget is the one already on the site
 *
 * `/` carries the practice's live LeadConnector / reputationhub review widget
 * inside a `webzite.embed-origins.embed` block. This copies that block —
 * the same widget id, the same snippet, byte for byte, read off the home page
 * at run time rather than pasted here, so the two can never drift.
 *
 * ## Where it goes, and why not at the end
 *
 * `#score` reads: chapter tag, "Five out of five, and what that is worth.", a
 * paragraph claiming **4.9 out of 5 stars**, then a four-photo mosaic and a link
 * on. The widget is the EVIDENCE for that claim, so it belongs immediately under
 * the paragraph that makes it — index 1, right after `.pk-head` — not below the
 * mosaic where a reader has already moved on.
 *
 * `.pk-head` carries `margin-bottom: clamp(2rem,4.5vw,3.5rem)`, so the space
 * above is already right. Below it there is none: `.mz` has no `margin-top`, and
 * the widget would butt straight into the photographs. Hence one new class,
 * `.pk-reviews`, whose entire job is that bottom margin.
 *
 * ## It needs no new CSP origin
 *
 * `reputationhub.site` is already in `frame-src` on every published page — the
 * Embed Origins plugin's compatible mode widens any page that CONTAINS an embed
 * block, and `/` proves the widget renders under it. Nothing to configure.
 */
import { randomBytes } from 'node:crypto'
import { getSite, getPages, api, toChangedPage, assertTemplatesIntact } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')

const SRC_SLUG = 'index'
const SRC_NODE = 'LyaZgc_elGm_1zmUugTsb'     // the review widget on the home page
const DST_SLUG = 'patient-stories'
const SECTION = 'score'
const CLASS = 'pk-reviews'

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => {
  const b = randomBytes(n)
  let s = ''
  for (let i = 0; i < n; i++) s += ALPHABET[b[i] & 63]
  return s
}

// ── read the widget off the home page ──────────────────────────────────────
const { rows: pages0 } = await getPages()
const src = pages0.find((r) => r.slug === SRC_SLUG)
const widget = src?.cells.body.nodes[SRC_NODE]
if (!widget) throw new Error(`the review widget ${SRC_NODE} is no longer on /${SRC_SLUG}`)
if (widget.moduleId !== 'webzite.embed-origins.embed') throw new Error(`${SRC_NODE} is a ${widget.moduleId}`)
if (!/reputationhub\.site/.test(widget.props?.snippet ?? '')) {
  throw new Error(`${SRC_NODE} no longer holds the reputationhub snippet — refusing to copy something else`)
}
console.log(`source     /${SRC_SLUG} ${SRC_NODE}  ${widget.props.snippet.length} chars of snippet`)

// ── the destination ────────────────────────────────────────────────────────
const dst = pages0.find((r) => r.slug === DST_SLUG)
if (!dst) throw new Error(`/${DST_SLUG} not found`)
const nodes = dst.cells.body.nodes
const section = Object.values(nodes).find((n) => n.props?.htmlAttributes?.id === SECTION)
if (!section) throw new Error(`#${SECTION} is not on /${DST_SLUG}`)

const { site: shell, seq } = await getSite()
const rules = shell.styleRules ?? (shell.styleRules = {})
const nameOf = (id) => rules[id]?.name

const wrap = nodes[(section.children ?? [])
  .find((c) => (nodes[c]?.classIds ?? []).some((x) => nameOf(x) === 'wrap'))]
if (!wrap) throw new Error(`#${SECTION} has no .wrap child — the section was restructured`)

const already = (wrap.children ?? []).some((c) => nodes[c]?.moduleId === 'webzite.embed-origins.embed')
if (already) { console.log('a review widget is already in #score — nothing to do'); process.exit(0) }

const headIdx = (wrap.children ?? []).findIndex((c) => (nodes[c]?.classIds ?? []).some((x) => nameOf(x) === 'pk-head'))
if (headIdx < 0) throw new Error('no .pk-head in #score — refusing to guess where the widget goes')
const at = headIdx + 1
console.log(`target     /${DST_SLUG} #${SECTION} > .wrap  — insert at index ${at} of ${wrap.children.length}, after .pk-head`)

// ── the spacing class ──────────────────────────────────────────────────────
const all = Object.values(rules)
let classRule = all.filter((r) => r.kind === 'class' && r.name === CLASS)
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).pop()
const STYLES = { marginBottom: 'clamp(2rem,4.5vw,3.5rem)' }
if (!classRule) {
  const order = Math.max(...all.map((r) => r.order ?? 0)) + 1
  const id = nanoid()
  classRule = { id, name: CLASS, kind: 'class', selector: `.${CLASS}`, order,
    styles: STYLES, contextStyles: {}, createdAt: Date.now(), updatedAt: Date.now() }
  console.log(`rules      + .${CLASS}  order ${order}  ${JSON.stringify(STYLES)}`)
} else {
  console.log(`rules      = .${CLASS} already exists (${JSON.stringify(classRule.styles)})`)
}

// ── the node ───────────────────────────────────────────────────────────────
const newId = nanoid()
const made = {
  id: newId,
  moduleId: 'webzite.embed-origins.embed',
  // Copied wholesale: `fit`, `height` and `ratio` are what make the widget size
  // itself, and reproducing them by hand is how two copies of one embed end up
  // behaving differently.
  props: JSON.parse(JSON.stringify(widget.props)),
  breakpointOverrides: {},
  children: [],
  classIds: [classRule.id],
  parentId: wrap.id,
}

if (!APPLY) {
  console.log(`\nwould add  ${newId} (embed) with class .${CLASS}`)
  console.log('\nDRY RUN — nothing written. Re-run with --apply.')
  process.exit(0)
}

// ── write: shell + page, ONE atomic PUT ────────────────────────────────────
/* The rule and the node have to land together: a rule with no node is
   tree-shaken at publish, and a node with no rule renders unspaced. */
if (!rules[classRule.id]) rules[classRule.id] = classRule
nodes[newId] = made
wrap.children = [...wrap.children.slice(0, at), newId, ...wrap.children.slice(at)]

const { site: shellNow, seq: seqNow } = await getSite()
if (seqNow !== seq) {
  console.error(`  ! the shell moved ${seq} -> ${seqNow} while this ran. Re-run.`)
  process.exit(1)
}
const { rows: pagesNow } = await getPages()
const dstNow = pagesNow.find((r) => r.slug === DST_SLUG)
if (dstNow.seq !== dst.seq) {
  console.error(`  ! /${DST_SLUG} moved seq ${dst.seq} -> ${dstNow.seq} while this ran. Re-run.`)
  process.exit(1)
}
void shellNow

const seo = { seoTitle: dst.cells.seoTitle, seoDescription: dst.cells.seoDescription }
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site: shell,
  changedPages: [toChangedPage(dst, { nodes, rootNodeId: dst.cells.body.rootNodeId })],
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: { [dst.id]: dst.seq },
  shellBaseSeq: seq,
})
console.log(`\nwrite      seq ${seq} -> ${res.seq ?? '?'}`)

if (seo.seoTitle || seo.seoDescription) {
  const before = (await api('GET', `/admin/api/cms/data/rows/${dst.id}`)).row
  await api('PATCH', `/admin/api/cms/data/rows/${dst.id}`, { cells: { ...before.cells, ...seo } })
  console.log(`  seo      restored on /${DST_SLUG}`)
}

// ── verify against a fresh read ────────────────────────────────────────────
let ok = true
const fail = (m) => { console.error(`  ! ${m}`); ok = false }
const { site: sBack } = await getSite()
const bRules = sBack.styleRules ?? {}
if (!Object.values(bRules).some((r) => r.kind === 'class' && r.name === CLASS)) fail(`.${CLASS} did not land`)

const { rows: back } = await getPages()
const bp = back.find((r) => r.slug === DST_SLUG)
const bn = bp.cells.body.nodes
const bName = (id) => bRules[id]?.name
const bSection = Object.values(bn).find((n) => n.props?.htmlAttributes?.id === SECTION)
const bWrap = bn[(bSection?.children ?? []).find((c) => (bn[c]?.classIds ?? []).some((x) => bName(x) === 'wrap'))]
const embeds = (bWrap?.children ?? []).filter((c) => bn[c]?.moduleId === 'webzite.embed-origins.embed')
if (embeds.length !== 1) fail(`${embeds.length} embed blocks in #${SECTION}, wanted exactly 1`)
const iEmbed = (bWrap?.children ?? []).indexOf(embeds[0])
const iHead = (bWrap?.children ?? []).findIndex((c) => (bn[c]?.classIds ?? []).some((x) => bName(x) === 'pk-head'))
if (!(iHead >= 0 && iEmbed === iHead + 1)) fail(`embed at ${iEmbed}, .pk-head at ${iHead} — it must sit directly after the head`)
if (bn[embeds[0]]?.props?.snippet !== widget.props.snippet) fail('the snippet did not copy byte for byte')
if (!(bn[embeds[0]]?.classIds ?? []).some((x) => bName(x) === CLASS)) fail(`the embed does not carry .${CLASS}`)

await assertTemplatesIntact({ post: true })
console.log(`verified   ${ok}`)
if (!ok) { console.error('WRITE DID NOT LAND CLEANLY — do not publish'); process.exit(1) }
console.log('\nDRAFT ONLY. Nothing published.')
