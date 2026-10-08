#!/usr/bin/env node
/**
 * push-office-pages.mjs — Scenario 7 step 03 for Dr. Nahlah: /contact-alexandria and /contact-mclean
 * become office pages ON THEIR CURRENT URLS (no sitemap change; the team reviews any URL move first).
 *
 * Per page, built only from this site's own components (fresh-id clones), and only from facts the site
 * or the practice's Google profiles state:
 *   hero      headline about this office, lead, background photo (Alexandria: its own reception),
 *             second button -> "Get directions" (the office's Google Maps listing)
 *   #offices  (an empty section until now) the page's own "Before you come" split, re-written as this
 *             office's details: address, phones, hours, landmarks, directions link, office photo
 *   #inside   Alexandria only: the home page's #invitation gallery (minus its CTA), five interior
 *             photos from the practice's 2025-09-24 shoot of the Alexandria office (matched to the
 *             office's Google profile cover photo, 2026-10-07)
 *   #local-faq five questions about this office (clone of /all-on-4 #faq) -> FAQPage on the next build
 *   #visiting Alexandria only: its photo becomes the Alexandria waiting area (it showed McLean's building)
 *   #next     "Treatments at the <office> office": six treatment links, worded differently per office
 * The two pages are written differently on purpose (Scenario 7: twins share at most 25% of their text).
 *
 *   node output/code/push-office-pages.mjs                          # plan, against INSTATIC_BASE_URL
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com STAGING_HOST=staging.drnahlah.com node output/code/push-office-pages.mjs --apply [--publish]
 * Run from scenario-7-seo-aeo/03-office-pages. Photos from output/assets/alexandria (prep-photos.py).
 */
import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const lib = (p) => import(pathToFileURL(resolve('../../tools/instatic-site', p)).href)
const { api, getSite, getPages, toChangedPage, publish, publishStatus, requestForm, BASE } = await lib('lib/site.mjs')
const { assertStaging } = await lib('lib/staging-guard.mjs')
const APPLY = process.argv.includes('--apply'), PUBLISH = process.argv.includes('--publish')
if (APPLY) assertStaging()
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'
const nanoid = () => [...randomBytes(21)].map((b) => ABC[b & 63]).join('')

// ── the photos (Alexandria) ────────────────────────────────────────────────────
const PHOTOS = {
  reception: ['dr-nahlah-alexandria-office-reception.jpg', 'Reception at Dr. Nahlah\'s Alexandria office, the gold Dr. Nahlah sign above a curved marble counter'],
  entrance: ['dr-nahlah-alexandria-office-entrance.jpg', 'The frosted glass entrance to the treatment area at Dr. Nahlah\'s Alexandria office'],
  waiting: ['dr-nahlah-alexandria-office-waiting-area.jpg', 'The waiting area at Dr. Nahlah\'s Alexandria office, cream and gold chairs along gold-framed panels'],
  room: ['dr-nahlah-alexandria-office-treatment-room.jpg', 'A treatment room at Dr. Nahlah\'s Alexandria office, with a cream dental chair and a wall-mounted screen'],
  consult: ['dr-nahlah-alexandria-office-consultation-room.jpg', 'A consultation room at the Alexandria office, with a white desk, upholstered chairs and a marble feature wall'],
  lounge: ['dr-nahlah-alexandria-office-lounge.jpg', 'The lounge at Dr. Nahlah\'s Alexandria office, with a marble counter, gold-trimmed panels and bar stools'],
  imaging: ['dr-nahlah-alexandria-office-imaging-room.jpg', 'A room at the Alexandria office with a 3D printer and a photography setup for recording smiles'],
  chair: ['dr-nahlah-alexandria-office-treatment-chair.jpg', 'A treatment room at the Alexandria office with a gold and cream dental chair beside the window'],
}

// ── the two offices ─────────────────────────────────────────────────────────────
const OFFICES = {
  'contact-alexandria': {
    name: 'Alexandria',
    headline: ['Alexandria, ', 'on Duke Street', '.'],
    lead: 'Implants, full arches, dentures and veneers at 2855 Duke Street, from Dr. Esam Nahlah, a board-certified prosthodontist. It runs the same way as the Tysons Corner office, by the same team, with its own laboratory in the building.',
    maps: 'https://maps.google.com/?cid=15116285013112467378',
    heroPhoto: 'reception', officePhoto: 'entrance', visitingPhoto: 'waiting', gallery: ['room', 'consult', 'lounge', 'imaging', 'chair'],
    officeTagline: 'The Alexandria office',
    officeHeading: '2855 Duke Street, Alexandria, VA 22314.',
    bullets: [
      'New patients: (571) 617-7245',
      'Current patients: (703) 940-5410',
      'Monday to Thursday, 8 am to 5 pm; Friday, 8 am to 2 pm',
      'Closed on Saturday and Sunday',
      'A laboratory in the building, as at the Tysons Corner office',
    ],
    galleryTagline: 'Inside the office',
    galleryHeading: 'The Alexandria office, room by room.',
    faqHeading: 'About the Alexandria office.',
    faq: [
      ['Where is the Alexandria office?', '2855 Duke Street, Alexandria, VA 22314. The link below opens the office in Google Maps for directions.', ['Directions on Google Maps →', 'MAPS']],
      ['What are the Alexandria office hours?', 'Monday to Thursday, 8 am to 5 pm, and Friday, 8 am to 2 pm. Closed on Saturday and Sunday.', null],
      ['Which number should I call?', 'New patients: (571) 617-7245. Current patients: (703) 940-5410.', null],
      ['Is the Alexandria office the closer one for me?', 'For most patients in Alexandria, yes. Patients in McLean, Tysons, Vienna and Great Falls are usually closer to the Tysons Corner office on Jones Branch Drive.', ['The Tysons Corner office →', '/contact-mclean']],
      ['Is the care the same at both offices?', 'Yes. Both offices run the same way, by the same team, and Dr. Esam Nahlah, a board-certified prosthodontist, treats patients at each.', ['Meet Dr. Nahlah →', '/meet-dr-nahlah']],
    ],
    treatmentsHeading: 'Treatments at the Alexandria office.',
    treatments: [
      ['Treatment', 'Dental Implants', 'One tooth or many, planned on a 3D scan and placed by the prosthodontist.', '/dental-implants'],
      ['Full arch', 'All-on-4', 'A fixed arch on four implants, often with teeth the same day.', '/all-on-4'],
      ['Dentures', 'Implant-Supported Dentures', 'A denture that clips onto implants instead of resting on the gums.', '/implant-supported-dentures'],
      ['Cosmetic', 'Porcelain Veneers', 'Hand-designed in the practice\'s own lab.', '/veneers'],
      ['Rebuild', 'Smile Makeover', 'Every tooth in the smile, in one plan designed by one specialist.', '/smile-makeover'],
      ['Comfort', 'Sedation', 'Nitrous oxide or oral sedation if the chair is the hard part.', '/sedation-dentistry'],
    ],
  },
  'contact-mclean': {
    name: 'Tysons Corner',
    headline: ['Tysons Corner, ', 'on Jones Branch', '.'],
    lead: 'Dr. Nahlah\'s Tysons Corner office is in Suite 220 at 7901 Jones Branch Drive, McLean, close to Vienna, Great Falls and Reston. Implants, full arches, dentures and veneers by a board-certified prosthodontist.',
    maps: 'https://maps.google.com/?cid=16584195885077624360',
    // McLean has two photos of its own (the lounge, already the hero, and the building, which the new
    // office block keeps): "Before you come" takes a consultation photo instead of repeating either
    heroPhoto: null, officePhoto: null, visitingPhoto: '/uploads/wkIrAhTuzZ99LIP9U1k2y-5352.jpg', gallery: null,
    officeTagline: 'The Tysons Corner office',
    officeHeading: '7901 Jones Branch Drive, Suite 220, McLean.',
    bullets: [
      'New and current patients: (703) 448-3312',
      'Suite 220, in the 7901 Jones Branch Drive building in Tysons',
      'Open Monday to Thursday, 8 am to 5 pm, and Friday, 8 am to 2 pm',
      'No weekend hours',
      'The in-house lab designs the teeth on site, not posted out',
    ],
    faqHeading: 'About the Tysons Corner office.',
    faq: [
      ['Where is the Tysons Corner office?', '7901 Jones Branch Drive, Suite 220, McLean, VA 22102, in Tysons. Google Maps has the office listing and directions.', ['Directions on Google Maps →', 'MAPS']],
      ['What are the office hours in McLean?', 'The Tysons Corner office opens Monday to Thursday from 8 am to 5 pm, and Friday from 8 am to 2 pm. There are no weekend hours.', null],
      ['Which number should I call?', '(703) 448-3312, for new patients and current patients alike.', null],
      ['Is the Tysons Corner office the closer one for me?', 'For most patients in McLean, Tysons, Vienna, Great Falls, Falls Church and Reston, yes. Patients in Alexandria usually find the Duke Street office closer.', ['The Alexandria office →', '/contact-alexandria']],
      ['Will I see the same specialist here as in Alexandria?', 'Yes. The same team and the same standards run both offices, and Dr. Esam Nahlah, a board-certified prosthodontist, treats patients in each.', ['Meet Dr. Nahlah →', '/meet-dr-nahlah']],
    ],
    treatmentsHeading: 'Treatments at the Tysons Corner office.',
    treatments: [
      ['Treatment', 'Dental Implants', 'Planned and placed by the same specialist, from one tooth to a full arch.', '/dental-implants'],
      ['Full arch', 'All-on-4', 'Four implants carry a whole fixed arch; you leave with provisional teeth in most cases.', '/all-on-4'],
      ['Dentures', 'Implant-Supported Dentures', 'Implant-retained dentures that will not slip or fall out.', '/implant-supported-dentures'],
      ['Cosmetic', 'Porcelain Veneers', 'Sized, shaped and colored for your face in the in-house laboratory.', '/veneers'],
      ['Rebuild', 'Smile Makeover', 'For teeth that are all there but that you would change.', '/smile-makeover'],
      ['Comfort', 'Sedation', 'Nitrous oxide and oral sedation for patients who dread the chair.', '/sedation-dentistry'],
    ],
  },
}

// ── read ─────────────────────────────────────────────────────────────────────────
const status = await publishStatus()
const rows = (await getPages()).rows
const rowOf = async (slug) => { const r = rows.find((x) => (x.cells?.slug ?? x.slug) === slug); return (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row }
const home = (await rowOf('index')).cells.body.nodes, a4 = (await rowOf('all-on-4')).cells.body.nodes
const byHtmlId = (N, id) => Object.values(N).find((n) => n.props?.htmlAttributes?.id === id)
const under = (N, rootId) => { const out = []; const w = (id) => { if (!N[id]) return; out.push(N[id]); (N[id].children || []).forEach(w) }; w(rootId); return out }
const problems = []
// a library path (starting with /) is used as is; a PHOTOS key stays @key until its upload resolves it
const ref = (k) => (k.startsWith('/') ? k : '@' + k)

// media: the Alexandria photos, uploaded once (matched by file name), alt text from PHOTOS
const media = (await api('GET', '/admin/api/cms/media')).assets ?? []
const srcOf = {}
const toUpload = []
for (const [k, [file, alt]] of Object.entries(PHOTOS)) {
  const a = media.find((x) => (x.publicPath || '').endsWith('-' + file) || (x.publicPath || '').endsWith('/' + file))
  if (a) srcOf[k] = { src: a.publicPath, id: a.id, alt: a.altText, wantAlt: alt }
  else toUpload.push([k, file, alt])
}

const plans = []
for (const [slug, O] of Object.entries(OFFICES)) {
  const row = await rowOf(slug)
  const N0 = row.cells.body.nodes, N = structuredClone(N0)
  const changed = new Set(), added = []
  const mark = (id) => changed.add(id)
  const clone = (S, id, parentId, map = new Map()) => {
    const src = S[id], nid = nanoid()
    map.set(id, nid)
    const n = structuredClone(src); n.id = nid; n.parentId = parentId; n.children = []
    N[nid] = n; added.push(nid)
    for (const c of src.children || []) n.children.push(clone(S, c, nid, map))
    return nid
  }
  const drop = (id) => { for (const n of under(N, id)) { delete N[n.id]; const i = added.indexOf(n.id); if (i >= 0) added.splice(i, 1) } }
  const setText = (n, text, extra = {}) => { n.props = { ...n.props, ...extra, text }; if (N0[n.id]) mark(n.id) }
  const hero = byHtmlId(N, 'hero'), offices = byHtmlId(N, 'offices'), visiting = byHtmlId(N, 'visiting'), next = byHtmlId(N, 'next'), book = byHtmlId(N, 'book')
  const main = Object.values(N).find((n) => n.props?.tag === 'main')
  if (!hero || !offices || !visiting || !next || !book || !main) { problems.push(`${slug}: page structure not as expected`); continue }
  if (byHtmlId(N, 'local-faq')) { problems.push(`${slug}: already has #local-faq — already applied?`); continue }

  // hero
  const hn = under(N, hero.id)
  const headline = hn.find((n) => n.props?.htmlAttributes && 'data-split' in n.props.htmlAttributes && n.props?.customTag === 'p')
  const lead = hn.find((n) => n.moduleId === 'base.text' && n.props?.tag === 'p')
  const heroImg = hn.find((n) => n.moduleId === 'base.image')
  const btn2 = hn.filter((n) => n.moduleId === 'base.button')[1]
  if (!headline || headline.children.length !== 3 || !lead || !heroImg || !btn2) { problems.push(`${slug}: hero parts missing`); continue }
  headline.children.forEach((c, i) => setText(N[c], O.headline[i]))
  setText(lead, O.lead)
  if (O.heroPhoto) { heroImg.props = { ...heroImg.props, src: ref(O.heroPhoto) }; mark(heroImg.id) }
  btn2.props = { ...btn2.props, label: 'Get directions', href: O.maps, target: '_blank' }; mark(btn2.id)

  // #offices: clone this page's #visiting split, rewrite as the office's details
  const split = N0[visiting.children[0]]
  const splitId = clone(N0, split.id, offices.id)
  offices.children = [splitId]; mark(offices.id)
  const sn = under(N, splitId)
  const simg = sn.find((n) => n.moduleId === 'base.image')
  const stag = sn.find((n) => n.moduleId === 'base.text' && n.props?.tag === 'span')
  const sh2 = sn.find((n) => n.moduleId === 'base.text' && n.props?.tag === 'h2')
  const ul = sn.find((n) => n.props?.tag === 'ul')
  const more = sn.find((n) => n.moduleId === 'base.link')
  if (!simg || !stag || !sh2 || !ul || !more) { problems.push(`${slug}: split parts missing`); continue }
  if (O.officePhoto) simg.props = { ...simg.props, src: ref(O.officePhoto) }
  setText(stag, O.officeTagline); setText(sh2, O.officeHeading)
  const li0 = ul.children[0]
  for (const li of ul.children.slice()) if (li !== li0) drop(li)
  ul.children = [li0]
  N[N[li0].children.find((c) => N[c].moduleId === 'base.text')].props.text = O.bullets[0]
  for (const b of O.bullets.slice(1)) {
    const m = new Map(); const nid = clone(N, li0, ul.id, m)
    ul.children.push(nid)
    const t = under(N, nid).find((n) => n.moduleId === 'base.text'); t.props = { ...t.props, text: b }
  }
  more.props = { ...more.props, text: 'Directions on Google Maps', href: O.maps, target: '_blank' }

  // #visiting photo (Alexandria)
  if (O.visitingPhoto) { const vi = under(N, visiting.id).find((n) => n.moduleId === 'base.image'); vi.props = { ...vi.props, src: ref(O.visitingPhoto) }; mark(vi.id) }

  // #inside gallery (Alexandria): home #invitation minus its CTA
  const order = []
  if (O.gallery) {
    const inv = byHtmlId(home, 'invitation')
    const keep = inv.children.filter((c) => home[c].props?.htmlAttributes?.id !== 'cta-locations')
    const secId = nanoid()
    N[secId] = { ...structuredClone(inv), id: secId, parentId: main.id, children: [] }
    const attrs = { ...N[secId].props.htmlAttributes }; for (const k of Object.keys(attrs)) if (k.startsWith('data-chapter')) delete attrs[k]
    N[secId].props = { ...N[secId].props, htmlAttributes: { ...attrs, id: 'inside' } }
    added.push(secId)
    for (const c of keep) N[secId].children.push(clone(home, c, secId))
    const gn = under(N, secId)
    setText(gn.find((n) => n.moduleId === 'base.text' && n.props?.tag === 'span'), O.galleryTagline)
    setText(gn.find((n) => n.moduleId === 'base.text' && n.props?.tag === 'h2'), O.galleryHeading)
    const imgs = gn.filter((n) => n.moduleId === 'base.image')
    if (imgs.length !== O.gallery.length) problems.push(`${slug}: gallery has ${imgs.length} images, plan has ${O.gallery.length}`)
    imgs.forEach((im, i) => { im.props = { ...im.props, src: ref(O.gallery[i]) } })
    order.push(['inside', secId])
  }

  // #local-faq: clone /all-on-4 #faq
  {
    const faq = byHtmlId(a4, 'faq')
    const inFaq = (n) => { for (let p = n; p; p = a4[p.parentId]) if (p.id === faq.id) return true; return false }
    const srcItem = Object.values(a4).find((n) => n.props?.customTag === 'details' && inFaq(n))
    const linkSrc = Object.values(a4).find((n) => n.moduleId === 'base.link' && inFaq(n))
    const secId = clone(a4, faq.id, main.id)
    N[secId].props = { ...N[secId].props, htmlAttributes: { ...N[secId].props.htmlAttributes, id: 'local-faq' } }
    const fn = under(N, secId)
    setText(fn.find((n) => n.moduleId === 'base.text' && n.props?.tag === 'span'), 'Questions')
    setText(fn.find((n) => n.moduleId === 'base.text' && n.props?.tag === 'h2'), O.faqHeading)
    const list = fn.find((n) => (n.children || []).some((c) => N[c]?.props?.customTag === 'details'))
    for (const it of list.children.slice()) drop(it)
    list.children = []
    for (const [q, a, link] of O.faq) {
      const dId = clone(a4, srcItem.id, list.id); const d = N[dId]
      const [sumId, ansId] = d.children
      N[N[sumId].children[0]].props = { ...N[N[sumId].children[0]].props, text: q }
      for (const extra of N[ansId].children.slice(1)) drop(extra)
      N[ansId].children = N[ansId].children.slice(0, 1)
      N[N[ansId].children[0]].props = { ...N[N[ansId].children[0]].props, tag: 'none', text: a }
      if (link) {
        const lid = nanoid()
        N[lid] = { ...structuredClone(linkSrc), id: lid, parentId: ansId, children: [] }
        N[lid].props = { ...N[lid].props, text: link[0], href: link[1] === 'MAPS' ? O.maps : link[1], target: link[1] === 'MAPS' ? '_blank' : '_self' }
        N[ansId].children.push(lid); added.push(lid)
      }
      list.children.push(dId)
    }
    order.push(['local-faq', secId])
  }

  // #next -> treatments at this office
  {
    const nn = under(N, next.id)
    setText(nn.find((n) => n.moduleId === 'base.text' && n.props?.tag === 'h2'), O.treatmentsHeading)
    const nav = nn.find((n) => n.props?.tag === 'nav')
    const l0 = nav.children[0]
    for (const l of nav.children.slice()) if (l !== l0) drop(l)
    nav.children = [l0]; mark(nav.id)
    const fill = (lid, [tag, title, desc, href]) => {
      N[lid].props = { ...N[lid].props, href }
      const spans = N[lid].children.map((c) => N[c])
      spans[0].props = { ...spans[0].props, text: tag }; spans[1].props = { ...spans[1].props, text: title }; spans[2].props = { ...spans[2].props, text: desc }
      if (N0[lid]) { mark(lid); spans.forEach((s) => mark(s.id)) }
    }
    fill(l0, O.treatments[0])
    for (const t of O.treatments.slice(1)) { const nid = clone(N, l0, nav.id); nav.children.push(nid); fill(nid, t) }
  }

  // section order: hero, #offices, [#inside], #local-faq, #book, #visiting, #next
  const mc = main.children.filter((c) => !order.some(([, id]) => id === c))
  const at = mc.indexOf(offices.id) + 1
  mc.splice(at, 0, ...order.map(([, id]) => id))
  main.children = mc; mark(main.id)
  for (const n of Object.values(N)) if (!Array.isArray(n.children)) n.children = []
  plans.push({ slug, row, N0, N, changed: [...changed], added, O })
}

// ── plan ─────────────────────────────────────────────────────────────────────────
console.log(`${APPLY ? 'APPLY' : 'PLAN'} on ${BASE}`)
console.log(`  status   ${JSON.stringify(status)}`)
console.log(`  photos   ${Object.keys(srcOf).length} in the library, ${toUpload.length} to upload: ${toUpload.map((t) => t[1]).join(', ')}`)
for (const p of plans) { const m = Object.values(p.N).find((n) => n.props?.tag === 'main'); console.log(`  ${p.slug.padEnd(20)} ${p.changed.length} nodes changed, ${p.added.length} added; ${m.children.map((c) => '#' + (p.N[c].props?.htmlAttributes?.id || '?')).join(' > ')}`) }
for (const pr of problems) console.log(`  !! ${pr}`)
if (!APPLY) process.exit(problems.length ? 1 : 0)
if (problems.length) { console.error('REFUSING: problems above'); process.exit(1) }
if (status.draftMatchesPublished !== true) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }

// ── upload photos, set their alt text ────────────────────────────────────────────
for (const [k, file, alt] of toUpload) {
  const bytes = readFileSync(resolve('output/assets/alexandria', file))
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: 'image/jpeg' }), file)
  const res = await requestForm('/admin/api/cms/media', form)
  const asset = res.asset ?? res
  if (!asset.publicPath) { console.error(`upload of ${file} returned no publicPath`); process.exit(1) }
  srcOf[k] = { src: asset.publicPath, id: asset.id, alt: asset.altText, wantAlt: alt }
  console.log(`  uploaded ${file} -> ${asset.publicPath}`)
}
for (const [k, m] of Object.entries(srcOf)) if (m.alt !== m.wantAlt) { await api('PATCH', `/admin/api/cms/media/${m.id}`, { altText: m.wantAlt }); console.log(`  alt      ${k}`) }
for (const p of plans) for (const n of Object.values(p.N)) if (n.moduleId === 'base.image' && String(n.props?.src || '').startsWith('@')) n.props.src = srcOf[n.props.src.slice(1)].src

// ── backup, write both pages in one incremental save ─────────────────────────────
const BK = resolve('output/backups'); mkdirSync(BK, { recursive: true })
const bf = join(BK, `office-pages-${new URL(BASE).hostname}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
writeFileSync(bf, JSON.stringify(plans.map((p) => p.row)))
console.log(`  backup   ${bf}`)
const { site: sh, seq } = await getSite()
await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: sh,
  changedPages: plans.map((p) => toChangedPage(p.row, { nodes: p.N })),
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(plans.map((p) => [p.row.id, p.row.seq])), shellBaseSeq: seq,
})
console.log(`  wrote    ${plans.map((p) => p.slug).join(', ')}`)

// ── read back ─────────────────────────────────────────────────────────────────────
const bad = []
for (const p of plans) {
  const keep = Object.fromEntries(['seoTitle', 'seoDescription'].filter((k) => p.row.cells[k] !== undefined).map((k) => [k, p.row.cells[k]]))
  let back = (await api('GET', `/admin/api/cms/data/rows/${p.row.id}`)).row
  if (Object.entries(keep).some(([k, v]) => back.cells[k] !== v)) {
    await api('PATCH', `/admin/api/cms/data/rows/${p.row.id}`, { cells: { ...back.cells, ...keep } })
    back = (await api('GET', `/admin/api/cms/data/rows/${p.row.id}`)).row
  }
  const an = back.cells.body.nodes
  for (const [id, n] of Object.entries(p.N0)) {
    if (!p.N[id]) { if (an[id]) bad.push(`${p.slug}: dropped node ${id} still there`); continue }
    if (p.changed.includes(id)) { if (!isDeepStrictEqual(an[id], p.N[id])) bad.push(`${p.slug}: node ${id} differs from plan`); continue }
    if (!isDeepStrictEqual(an[id], n)) bad.push(`${p.slug}: untouched node ${id} changed`)
  }
  for (const id of p.added) if (!isDeepStrictEqual(an[id], p.N[id])) bad.push(`${p.slug}: new node ${id} not as written`)
  if (Object.keys(an).length !== Object.keys(p.N).length) bad.push(`${p.slug}: node count ${Object.keys(an).length}, planned ${Object.keys(p.N).length}`)
  for (const k of ['title', 'seoTitle', 'seoDescription', 'slug']) if (back.cells[k] !== p.row.cells[k]) bad.push(`${p.slug}: cell ${k} changed`)
}
for (const b of bad.slice(0, 20)) console.log(`  !! ${b}`)
if (bad.length) { console.log(`READ-BACK FAILED (${bad.length}) — restore from ${bf}`); process.exit(1) }
console.log('  readback clean')
if (PUBLISH) { const r = await publish(); console.log(`published ${JSON.stringify(r)}`) } else console.log('draft only — pass --publish after checking')
