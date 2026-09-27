#!/usr/bin/env node
/**
 * push-pin30-footer-addresses.mjs — BugHerd #30, site footer: "add both
 * location addresses and phone numbers like the Webflow design".
 *
 *   node push-pin30-footer-addresses.mjs            # report the plan, write nothing
 *   node push-pin30-footer-addresses.mjs --apply    # write the draft (does NOT publish)
 *
 * ## What was actually missing
 *
 * Half of it was already there. The footer's fourth column ends in a two-item
 * list carrying both NEW-PATIENT numbers — "McLean · (571) 702-9900" and
 * "Alexandria · (571) 253-7790". What it has never carried is either street
 * address, which is the half the pin is about, and which matters for local
 * search as much as for a reader.
 *
 * Each list item becomes the standard name/address/phone block instead:
 *
 *     <li><b>McLean</b>
 *         <div>7901 Jones Branch Drive, Suite 220</div>
 *         <div>McLean, VA 22102</div>
 *         <a href="tel:…">(571) 702-9900</a></li>
 *
 * The office name moves out of the link text and into a `b`, which is the idiom
 * the hours list directly above already uses, so the column reads as one thing.
 *
 * ## Why this touches 38 pages
 *
 * The footer is NOT a shared component on this site — every page carries its own
 * copy of the whole subtree under its own node ids. 38 of the 56 rows have it
 * (the ads landing pages deliberately do not). One of the 38 is `post`, the
 * entry template for the posts post-type, so the change reaches all 43 articles
 * through it.
 *
 * Pages are found by shape, never by a hardcoded list: the anchor is the
 * `base.link` whose href is the McLean tel: and whose text still starts
 * "McLean ·". A page whose footer has already been converted no longer matches
 * and is skipped, so an interrupted run can simply be repeated.
 *
 * The addresses are the ones published on /contact-maclean and
 * /contact-alexandria; the script asserts them against those two pages before it
 * writes anything, so the footer cannot drift away from the contact pages.
 *
 * NOTHING HERE PUBLISHES.
 */
import { randomBytes } from 'node:crypto'
import { getPages, getSite, api, toChangedPage } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => {
  const b = randomBytes(n)
  let s = ''
  for (let i = 0; i < n; i++) s += ALPHABET[b[i] & 63]
  return s
}

/** The `.foot-facts` class. `footer.foot .foot-facts` supplies the colour, size
 *  and the `b` weight; `footer.foot .foot-facts b` the brighter office name. */
const FOOT_FACTS = 'dH6xPUHxgevvF2iaxSmVX'

const OFFICES = {
  'tel:+15717029900': {
    name: 'McLean',
    lines: ['7901 Jones Branch Drive, Suite 220', 'McLean, VA 22102'],
    phone: '(571) 702-9900',
  },
  'tel:+15712537790': {
    name: 'Alexandria',
    lines: ['2855 Duke Street', 'Alexandria, VA 22314'],
    phone: '(571) 253-7790',
  },
}

const { rows } = await getPages()

// ── the addresses must match the contact pages, not this file ──────────────

const contactPages = rows.filter((x) => /^contact/.test(x.cells?.slug ?? x.slug))
if (!contactPages.length) throw new Error('no contact page found — cannot verify the addresses')
const contactText = contactPages
  .flatMap((r) => Object.values(r.cells.body.nodes))
  .map((n) => n.props?.text).filter((t) => typeof t === 'string').join(' | ')
for (const o of Object.values(OFFICES)) {
  for (const line of o.lines) {
    if (!contactText.includes(line)) {
      throw new Error(`"${line}" is not on any contact page — check the address before writing it into 38 footers`)
    }
  }
}
console.log('both addresses verified against the contact pages\n')

// ── the edit ───────────────────────────────────────────────────────────────

/** Rebuild one `li` in place: <b>name</b><div>line</div><div>line</div><a>phone</a> */
function convert (nodes, liId, office, linkId) {
  const made = []
  const text = (parentId, s) => {
    const id = nanoid()
    nodes[id] = {
      id,
      moduleId: 'base.text',
      props: { text: s, tag: 'none', htmlAttributes: {} },
      breakpointOverrides: {},
      children: [],
      classIds: [],
      parentId,
    }
    made.push(id)
    return id
  }
  const box = (tag, customTag) => {
    const id = nanoid()
    nodes[id] = {
      id,
      moduleId: 'base.container',
      props: { tag, customTag, htmlAttributes: {} },
      breakpointOverrides: {},
      children: [],
      classIds: [],
      parentId: liId,
    }
    made.push(id)
    return id
  }

  const bId = box('custom', 'b')
  nodes[bId].children = [text(bId, office.name)]

  const lineIds = office.lines.map((line) => {
    const id = box('div', '')
    nodes[id].children = [text(id, line)]
    return id
  })

  // the office name now lives in the `b`, so the link carries the number alone
  nodes[linkId] = { ...nodes[linkId], props: { ...nodes[linkId].props, text: office.phone } }

  nodes[liId] = { ...nodes[liId], children: [bId, ...lineIds, linkId] }
  return made.length
}

const plan = []
for (const row of rows) {
  const nodes = row.cells?.body?.nodes
  if (!nodes) continue
  const slug = row.cells?.slug ?? row.slug

  const anchors = Object.entries(nodes).filter(([, n]) =>
    n.moduleId === 'base.link' && OFFICES[n.props?.href] && /^(McLean|Alexandria) · /.test(n.props?.text || ''))
  if (!anchors.length) continue

  const li = nodes[anchors[0][1].parentId]
  const ul = nodes[li.parentId]
  if (ul.props?.tag !== 'ul') { console.log(`  ${slug}: SKIPPED — anchor is not in a ul`); continue }
  if ((ul.children || []).length !== 2) { console.log(`  ${slug}: SKIPPED — ${ul.children.length} items, expected 2`); continue }
  if (anchors.length !== 2) { console.log(`  ${slug}: SKIPPED — ${anchors.length} office links, expected 2`); continue }

  plan.push({ row, slug, ulId: ul.id, anchors: anchors.map(([id, n]) => ({ id, href: n.props.href, liId: n.parentId })) })
}

console.log(`${plan.length} pages carry the footer phone list\n`)
for (const p of plan.slice(0, 5)) console.log(`  ${p.slug} — ul ${p.ulId}`)
if (plan.length > 5) console.log(`  … and ${plan.length - 5} more`)

if (!APPLY) {
  console.log('\ndry run — nothing written. Re-run with --apply.')
  process.exit(0)
}

const changedPages = []
const baseSeqs = {}
let added = 0

for (const p of plan) {
  const next = structuredClone(p.row.cells.body.nodes)

  for (const a of p.anchors) added += convert(next, a.liId, OFFICES[a.href], a.id)

  /* The list is now facts, not links, so it takes the same class as the hours
     list above it — colour, size and the brighter `b`. The inline margin-top
     stays and gains a row gap, because each item is four lines now. */
  next[p.ulId] = {
    ...next[p.ulId],
    classIds: [...new Set([...(next[p.ulId].classIds || []), FOOT_FACTS])],
    inlineStyles: { ...(next[p.ulId].inlineStyles || {}), marginTop: '1.1rem', rowGap: '1rem' },
  }

  changedPages.push(toChangedPage(p.row, { nodes: next }))
  baseSeqs[p.row.id] = p.row.seq
}

/* `site` and `shellBaseSeq` are BOTH required even for a page-only write, and
   `baseSeqs` must name every page — an empty map 409s the lot as conflicts. */
const { site, seq: shellBaseSeq } = await getSite()

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site,
  changedPages,
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [],
  baseSeqs,
  shellBaseSeq,
})
console.log(`\nsaved ${changedPages.length} pages, ${added} nodes added — seq ${res.seq}`)

/* Read back. This platform reports some write failures as prose with a 200. */
const after = (await getPages()).rows
const bad = []
for (const p of plan) {
  const got = after.find((r) => r.id === p.row.id)?.cells?.body?.nodes
  if (!got) { bad.push(`${p.slug}: row vanished`); continue }
  const ul = got[p.ulId]
  if (!ul?.classIds?.includes(FOOT_FACTS)) bad.push(`${p.slug}: ul missing the foot-facts class`)
  for (const a of p.anchors) {
    const o = OFFICES[a.href]
    if (got[a.id]?.props?.text !== o.phone) bad.push(`${p.slug}: ${o.name} link text is ${JSON.stringify(got[a.id]?.props?.text)}`)
    const kids = (got[a.liId]?.children || []).map((c) => got[c])
    const flat = kids.flatMap((k) => (k?.children || []).map((g) => got[g]?.props?.text)).filter(Boolean)
    for (const line of [o.name, ...o.lines]) {
      if (!flat.includes(line)) bad.push(`${p.slug}: ${o.name} li is missing ${JSON.stringify(line)}`)
    }
  }
}
if (bad.length) throw new Error(`read-back mismatch:\n  ${bad.join('\n  ')}`)

console.log(`verified — ${plan.length} footers carry both offices with street address and phone`)
console.log('\nDRAFT only. Publishing is a separate step.')
