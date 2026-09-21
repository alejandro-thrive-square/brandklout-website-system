#!/usr/bin/env node
/**
 * toggle-ads-warranty-claim.mjs — take the five-year warranty claim OFF the
 * eighteen ads landing pages while the practice confirms the terms, and put it
 * back in one command when they do.
 *
 *   node toggle-ads-warranty-claim.mjs --hide              # plan
 *   node toggle-ads-warranty-claim.mjs --hide --apply
 *   node toggle-ads-warranty-claim.mjs --restore --apply   # when approved
 *
 * ## Scope: the paid pages ONLY
 *
 * The client's instruction on 2026-09-21 was to hide it "just in the landing
 * pages". /five-year-warranty stays live and indexed so it can be sent to
 * Dr. Nahlah's team for review, and /about, /our-team and the editorial implant
 * copy keep the claim they have carried since the old WordPress site. Nothing
 * here touches them.
 *
 * ## Twelve places, not ten
 *
 * Ten are the sentences that carry the linked phrase. The other two are a HERO
 * STAT on both dental implants pages: `5 years / Warranty on implant work, with
 * Precare`, one cell of a 2x2 `.lp-hero-facts` grid. Deleting it would leave a
 * hole in the grid, so it is SWAPPED for another fact the practice already
 * publishes ("An in-house digital lab in each of the two practices", /about)
 * and swapped back on restore. Searching for the linked phrase alone misses it.
 *
 * ## Why this edits the live tree instead of rebuilding
 *
 * The local package still carries the YouTube embeds the 2026-09-21 Vimeo
 * migration replaced, so any ads page pushed from the package reverts its films.
 * See push-warranty-links.mjs for the same reasoning and the evidence.
 *
 * The package sources ARE updated alongside, by hand, so that a future rebuild
 * does not reintroduce the claim.
 *
 * ## Restoring
 *
 * `--restore` puts the original sentences and the stat back. It does NOT
 * re-create the links, because that is `push-warranty-links.mjs`'s job and it
 * is idempotent — run it straight afterwards:
 *
 *   node toggle-ads-warranty-claim.mjs --restore --apply
 *   node push-warranty-links.mjs --apply
 *
 * NOTHING HERE PUBLISHES.
 */
import { getPages, getSite, api, toChangedPage } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const argv = process.argv.slice(2)
const APPLY = argv.includes('--apply')
const HIDE = argv.includes('--hide')
const RESTORE = argv.includes('--restore')
if (HIDE === RESTORE) { console.error('pass exactly one of --hide / --restore'); process.exit(2) }

/* The three sentence patterns, `with` the claim and `without` it. The `without`
   copy keeps everything that is independently supported and drops only the
   promise: the success rate stays, the free second opinions stay, the six-month
   cleanings stay where they stand on their own as maintenance advice. */
const SENTENCES = [
  { // dental implants, the body claim
    with: 'Implants have held a published success rate above 95% since they were introduced. '
      + 'The practice backs its implant work with a five-year warranty, conditional on the Precare '
      + 'cleanings every six months, and gives second opinions on implant surgery free.',
    without: 'Implants have held a published success rate above 95% since they were introduced. '
      + 'The practice gives second opinions on implant surgery free.',
  },
  { // dental implants, the FAQ answer and its thank-you twin
    with: 'The post is designed as a lifetime replacement root, and implants have held a published '
      + 'success rate above 95% since they were introduced. The crown on top may need maintenance '
      // NB STRAIGHT apostrophe in "practice's": that is what the live node holds
      // (U+0027), despite the site's curly-quote rule. A curly one here matched
      // nothing and silently skipped four of the twelve edits.
      + "over time, like any tooth. The practice's implant work carries a five-year warranty, "
      + 'conditional on the Precare cleanings every six months.',
    without: 'The post is designed as a lifetime replacement root, and implants have held a published '
      + 'success rate above 95% since they were introduced. The crown on top may need maintenance '
      + 'over time, like any tooth.',
  },
  { // dental implants thank-you — the FAQ answer WITHOUT the crown sentence.
    // Nearly the same paragraph as the one above and not the same string; a
    // pattern list has to carry both or two pages are silently skipped.
    with: 'The post is designed as a lifetime replacement root, and implants have held a published '
      + "success rate above 95% since they were introduced. The practice's implant work carries a "
      + 'five-year warranty, conditional on the Precare cleanings every six months.',
    without: 'The post is designed as a lifetime replacement root, and implants have held a published '
      + 'success rate above 95% since they were introduced.',
  },
  { // all-on-4 and its thank-you twin
    with: 'Implants have held a published success rate above 95% since they were introduced. '
      + 'The practice backs its implant work with a five-year warranty, conditional on the Precare '
      + 'cleanings every six months that keep the arch healthy.',
    without: 'Implants have held a published success rate above 95% since they were introduced. '
      + 'General cleanings every six months are what keep a full arch healthy.',
  },
]

/* The hero stat. `b` is the figure, `span` the label. */
const STAT = {
  with: { figure: '5 years', label: 'Warranty on implant work, with Precare' },
  without: { figure: '2 labs', label: 'Digital lab in each office' },
}

const FROM = HIDE ? 'with' : 'without'
const TO = HIDE ? 'without' : 'with'
const PHRASE = 'five-year warranty'

/** The sentence as it currently reads, whether it is one text node or three. */
function sentenceOf (N, holderId) {
  const h = N[holderId]
  if (h.moduleId === 'base.text') return h.props.text
  return (h.children ?? []).map((c) => {
    const k = N[c]
    return k?.moduleId === 'base.link' ? k.props.text : (k?.props?.text ?? '')
  }).join('')
}

const { rows } = await getPages()
const plan = []

for (const row of rows) {
  const N = row.cells?.body?.nodes
  if (!N) continue
  const slug = row.cells?.slug ?? row.slug
  if (!slug.startsWith('ads-landing-pages/')) continue

  const edits = []

  // ── the sentences ──────────────────────────────────────────────────────
  for (const [id, n] of Object.entries(N)) {
    /* A sentence lives either as one base.text, or, once linked, as a holder
       whose children are text + link + text. Both are found from the holder. */
    const isSplitHolder = (n.children ?? []).some((c) => N[c]?.props?.href === '/five-year-warranty')
    const isPlainText = n.moduleId === 'base.text' && typeof n.props?.text === 'string'
    if (!isSplitHolder && !isPlainText) continue
    if (isPlainText && n.props.text.includes(PHRASE) && N[n.parentId]?.children?.some(
      (c) => N[c]?.props?.href === '/five-year-warranty')) continue // a fragment of a split

    const current = sentenceOf(N, id)
    const match = SENTENCES.find((s) => s[FROM] === current)
    if (!match) continue
    edits.push({ kind: 'sentence', id, to: match[TO], split: isSplitHolder })
  }

  // ── the hero stat ──────────────────────────────────────────────────────
  for (const [id, n] of Object.entries(N)) {
    if (n.moduleId !== 'base.text' || n.props?.tag !== 'span') continue
    if (n.props.text !== STAT[FROM].label) continue
    const cell = N[n.parentId]
    const bold = (cell?.children ?? []).map((c) => N[c]).find((k) => k?.props?.customTag === 'b')
    const figureId = (bold?.children ?? [])[0]
    if (!figureId || N[figureId]?.props?.text !== STAT[FROM].figure) continue
    edits.push({ kind: 'stat', labelId: id, figureId, label: STAT[TO].label, figure: STAT[TO].figure })
  }

  if (edits.length) plan.push({ row, slug, edits })
}

console.log(`${HIDE ? 'HIDING' : 'RESTORING'} the warranty claim on the ads landing pages`)
console.log(`${plan.length} pages, ${plan.reduce((a, p) => a + p.edits.length, 0)} edits\n`)
for (const p of plan) {
  for (const e of p.edits) {
    if (e.kind === 'stat') console.log(`  ${p.slug.padEnd(52)} STAT     ${STAT[FROM].figure} / ${STAT[FROM].label}\n${' '.repeat(56)}      -> ${e.figure} / ${e.label}`)
    else console.log(`  ${p.slug.padEnd(52)} SENTENCE ${e.split ? '(unlink + rewrite)' : '(rewrite)'}  ${e.to.slice(0, 64)}…`)
  }
}
if (!plan.length) { console.log('nothing to do — already in the requested state'); process.exit(0) }
if (!APPLY) { console.log('\ndry run — nothing written. Re-run with --apply.'); process.exit(0) }

const changedPages = []
const baseSeqs = {}

for (const p of plan) {
  const N = structuredClone(p.row.cells.body.nodes)
  for (const e of p.edits) {
    if (e.kind === 'stat') {
      N[e.labelId] = { ...N[e.labelId], props: { ...N[e.labelId].props, text: e.label } }
      N[e.figureId] = { ...N[e.figureId], props: { ...N[e.figureId].props, text: e.figure } }
      continue
    }
    const h = N[e.id]
    if (!e.split) {
      N[e.id] = { ...h, props: { ...h.props, text: e.to } }
      continue
    }
    /* Collapse text+link+text back to a single text node. The holder is either
       the paragraph itself (a container that used to BE a base.text) or a
       wrapper div whose only child was the text. */
    const kids = h.children ?? []
    const firstText = kids.find((c) => N[c]?.moduleId === 'base.text')
    const wasParagraph = h.moduleId === 'base.container' && h.props?.tag === 'custom'
      && /^(p|h[1-6])$/.test(h.props?.customTag ?? '')
    for (const c of kids) if (c !== firstText) delete N[c]
    N[firstText] = { ...N[firstText], props: { ...N[firstText].props, text: e.to } }
    if (wasParagraph) {
      /* it became a container only to hold the link; give it back its text form */
      delete N[firstText]
      N[e.id] = {
        ...h,
        moduleId: 'base.text',
        props: { text: e.to, tag: h.props.customTag, htmlAttributes: h.props.htmlAttributes ?? {} },
        children: [],
      }
    } else {
      N[e.id] = { ...h, children: [firstText] }
    }
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
console.log(`\nsaved ${changedPages.length} pages — seq ${res.seq}`)

/* Read back. This platform reports some write failures as prose with a 200. */
const after = (await getPages()).rows
const bad = []
for (const p of plan) {
  const N = after.find((r) => r.id === p.row.id)?.cells?.body?.nodes
  if (!N) { bad.push(`${p.slug}: row vanished`); continue }
  const blob = Object.values(N).map((n) => n.props?.text).filter((t) => typeof t === 'string').join(' | ')
  const links = Object.values(N).filter((n) => n.props?.href === '/five-year-warranty').length
  if (HIDE) {
    if (blob.includes(PHRASE)) bad.push(`${p.slug}: the phrase is still on the page`)
    if (links) bad.push(`${p.slug}: ${links} link(s) to the terms page remain`)
    if (blob.includes(STAT.with.label)) bad.push(`${p.slug}: the warranty stat is still there`)
  } else if (!blob.includes(PHRASE)) bad.push(`${p.slug}: the claim did not come back`)
}
if (bad.length) throw new Error(`read-back mismatch:\n  ${bad.join('\n  ')}`)
console.log(`verified — ${plan.length} pages are now ${HIDE ? 'free of the warranty claim' : 'carrying the claim again'}`)
if (RESTORE) console.log('\nNow re-link them:  node push-warranty-links.mjs --apply')
console.log('\nDRAFT only. Publishing is a separate step.')
