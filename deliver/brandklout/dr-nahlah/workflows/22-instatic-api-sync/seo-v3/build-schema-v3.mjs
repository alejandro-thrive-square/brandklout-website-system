#!/usr/bin/env node
/**
 * SEO v3 (2026-10-05): structured data built from what each page SAYS.
 *
 * v2 gave every page the right entities (Dentist, offices, Person, Service, FAQPage,
 * BlogPosting) but described each treatment with its meta description. v3 reads the live
 * sections (seo-v3/scan-sections.mjs → out/sections.json) and lifts the visible copy into the
 * graph: the options a page lists become the Service's OfferCatalog, its timeline a HowTo, its
 * steps the procedure's preparation / howPerformed / followup, its lists ItemLists, its
 * before-and-after cases ImageObjects, its accordions the FAQPage, its films VideoObjects, its
 * financing partners LoanOrCredit, its warranty a WarrantyPromise. Every concept names its
 * Wikipedia / Wikidata entry (out/facts.json) so an answer engine can resolve it.
 *
 * Also: the BreadcrumbList repeats the breadcrumb each page SHOWS (the plugin's generated one
 * named the last crumb with the full SEO title; push-seo-v3 turns emitBreadcrumbs off).
 *
 * No text here is written for the schema: a value is a page string or a fact the page states.
 * Client rules: never IV sedation or an anaesthesiologist (the credential list's "IV Sedation
 * Certificate" is left out of the graph); no AggregateRating/Review from on-site quotes
 * (self-serving reviews are ignored by Google and a policy risk); no numbers the site states
 * two different ways (implants placed: 18,000+ on /meet-dr-nahlah, 7,000+ on /about).
 *
 * Base: seo-v2/out (organization.json, blocks.json) + the live aeo entries for pages v2 did not
 * build. Output: seo-v3/out/{organization.json,blocks.json} in the v2 shape.
 *
 *   node seo-v3/build-schema-v3.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { api } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'
import { OFFICES, OTHERS } from '../footer-reviews-links.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, 'out')
const V2 = join(HERE, '..', 'seo-v2')
const S = 'https://www.drnahlah.com'
const ORG = { '@id': `${S}/#organization` }
const PERSON = { '@id': `${S}/meet-dr-nahlah#person` }
const MCLEAN = { '@id': `${S}/contact-mclean#office` }
const ALEX = { '@id': `${S}/contact-alexandria#office` }

const pages = JSON.parse(readFileSync(join(OUT, 'sections.json'), 'utf8'))
const { videos: VID, wiki: W } = JSON.parse(readFileSync(join(OUT, 'facts.json'), 'utf8'))
const meta = JSON.parse(readFileSync(join(V2, 'meta.json'), 'utf8'))
const POST_DESC = JSON.parse(readFileSync(join(HERE, 'post-descriptions.json'), 'utf8'))
const organization = JSON.parse(readFileSync(join(V2, 'out', 'organization.json'), 'utf8'))
const v2 = JSON.parse(readFileSync(join(V2, 'out', 'blocks.json'), 'utf8'))
const live = (await api('GET', '/admin/api/cms/plugins/brandklout.aeo-schema/runtime/entries')).entries

const url = (slug) => (slug === 'index' ? `${S}/` : `${S}/${slug}`)
const ref = (id) => ({ '@id': id })
const clone = (x) => JSON.parse(JSON.stringify(x))
const sameAs = (...keys) => { const s = keys.flatMap((k) => (W[k] ? [W[k].url, W[k].wikidata] : [])); return s.length ? { sameAs: s } : {} }
const thing = (k, name) => ({ '@type': 'Thing', name: name || W[k].title, ...sameAs(k) })
const abs = (src) => new URL(src, S).href
const join_ = (a) => a.join(' ').replace(/\s+/g, ' ').trim()
const used = []   // every section a builder reads, so a copy change that renames a heading fails loudly

function sec (slug, re) {
  const s = pages[slug]?.sections.find((x) => re.test(x.h2 || x.h1 || ''))
  if (!s) throw new Error(`${slug}: no section matching ${re}`)
  used.push(`${slug}: ${s.h2 || s.h1}`)
  return s
}
const intro = (slug) => pages[slug].sections[0].lead[0]   // the hero line under the H1

// ── reusable node shapes ───────────────────────────────────────────────────
const howTo = (slug, s, id = 'process', extra = {}) => ({
  '@type': 'HowTo', '@id': `${url(slug)}#${id}`, name: s.h2,
  ...(s.lead[0] ? { description: s.lead[0] } : {}),
  step: s.items.map((it, i) => ({ '@type': 'HowToStep', position: i + 1, name: it.h3, text: join_(it.text) })),
  ...extra,
})
// ItemList has no 'about': what a list is about goes on its items (an ImageObject's about) or in its name
const list = (slug, id, name, entries, { about, ...extra } = {}) => ({
  '@type': 'ItemList', '@id': `${url(slug)}#${id}`, name, numberOfItems: entries.length,
  itemListElement: entries.map((e, i) => ({ '@type': 'ListItem', position: i + 1, ...(typeof e === 'string' ? { name: e } : e) })),
  ...extra,
})
const catalog = (slug, s, items, extra = {}) => ({
  '@type': 'OfferCatalog', '@id': `${url(slug)}#options`, name: s.h2,
  itemListElement: items.map(({ name, description, wiki, url: u }) => ({
    '@type': 'Offer', itemOffered: { '@type': 'Service', name, description, ...(u ? { url: u } : {}), provider: ORG },
  })),
  ...extra,
})
// before/after photographs: every image the case section shows (it holds nothing else), captioned by its own alt text
const cases = (slug, s, about) => list(slug, 'cases', s.h2, s.images.filter((im) => im.alt).map((im) => ({
  item: { '@type': 'ImageObject', contentUrl: abs(im.src), caption: im.alt, about, creator: ORG, creditText: 'Dr. Nahlah Implants and Prosthodontics Specialists', copyrightNotice: 'Dr. Nahlah Implants and Prosthodontics Specialists' },
})))
const faqOf = (slug, id = `${url(slug)}#faq`, types = 'FAQPage') => {
  const qa = pages[slug].sections.flatMap((s) => s.qa).filter((x) => /\?$/.test(x.q) && x.a)
  if (!qa.length) return null
  return { '@type': types, '@id': id, ...(types === 'FAQPage' ? { isPartOf: ref(`${url(slug)}#webpage`) } : {}), mainEntity: qa.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) }
}
// a film's description is the platform's text (YouTube/Vimeo), not the site's: sentences that break a
// client rule (IV sedation) or state practice numbers the site states differently are left out
const RULE_BREAK = /\bIV\b|intravenous|an(a)?esthesi|\d[\d,]* (dental )?(implants|arches)|since (19|20)\d\d|\d+ years of experience|https?:\/\//i
const platformText = (t) => (t || '').split(/(?<=[.!?])\s+|\n+/).map((x) => x.trim()).filter((x) => x && !RULE_BREAK.test(x)).join(' ').slice(0, 2000)
const iso = (sec) => `PT${Math.floor(sec / 60) ? Math.floor(sec / 60) + 'M' : ''}${sec % 60}S`
const video = (id, about) => {
  const v = VID[id]; if (!v) throw new Error('no facts for video ' + id)
  const yt = id.startsWith('yt:')
  return {
    '@type': 'VideoObject', '@id': `${S}/#video-${yt ? id.slice(3) : id}`, name: v.name,
    description: platformText((v.description || '').replace(/^Dr\. Esam Nahlah\s*\S*\s*-{3,}\s*/u, '')) || v.name,
    thumbnailUrl: v.thumbnail, uploadDate: v.uploadDate, duration: iso(v.duration),
    embedUrl: yt ? `https://www.youtube.com/embed/${id.slice(3)}` : `https://player.vimeo.com/video/${id}`,
    ...(yt ? { url: `https://www.youtube.com/watch?v=${id.slice(3)}` } : {}),
    ...(yt ? {} : { publisher: ORG }), inLanguage: 'en-US', ...(about ? { about } : {}),   // the YouTube films sit on a third-party channel
  }
}
// "The post Titanium, into the bone": a label pill whose first words are its name
const pill = (line, names) => { const n = names.find((x) => line.startsWith(x)); return n ? { name: n, description: line.slice(n.length).trim() } : { name: line } }

// ── the blocks: start from v2, extend ──────────────────────────────────────
const blocks = clone(v2.pages)
const node = (slug, idSuffix) => blocks[slug].find((n) => n['@id'] === `${url(slug)}#${idSuffix}`)
const add = (slug, ...nodes) => {
  const wp = node(slug, 'webpage')
  for (const n of nodes.filter(Boolean)) {
    blocks[slug].push(n)
    if (n['@id'] && !/#(faq|service|procedure)$/.test(n['@id'])) (wp.hasPart ||= []).push(ref(n['@id']))
  }
}

// treatment pages: the Service and the procedure carry the page's own description
const TREAT_WIKI = {
  'dental-implants': ['dentalImplant'], 'all-on-4': ['allOn4'], 'implant-supported-dentures': ['dentures'], 'crowns-and-bridges': ['crown', 'bridge'],
  veneers: ['veneer'], 'teeth-whitening': ['whitening'], 'smile-makeover': ['cosmetic'], 'cosmetic-dentistry': ['cosmetic'],
  'oral-surgery': ['oralSurgery'], 'sedation-dentistry': ['sedation'], 'emergency-dentistry': ['emergency'],
}
for (const [slug, keys] of Object.entries(TREAT_WIKI)) {
  const svc = node(slug, 'service')
  Object.assign(svc, { description: intro(slug), disambiguatingDescription: meta[slug][1], category: 'Prosthodontics and implant dentistry' })
  const wpT = node(slug, 'webpage'); wpT.about = [...[].concat(wpT.about || []), ...keys.map((k) => thing(k))]
  const proc = node(slug, 'procedure')
  if (proc) Object.assign(proc, { description: intro(slug), ...sameAs(...keys) })
  node(slug, 'webpage').breadcrumb = ref(`${url(slug)}#breadcrumb`)
  // the designed hero line, now a <p> under the keyword H1 (2026-10-06)
  const headline = pages[slug].sections[0].headline
  if (headline) node(slug, 'webpage').alternativeHeadline = headline
  const f = slug === 'teeth-whitening' ? null : faqOf(slug)   // v2 rule: whitening's only '?' heading is a CTA
  blocks[slug] = blocks[slug].filter((n) => !String(n['@id']).endsWith('#faq'))
  if (f) blocks[slug].push(f)
}

// the five-year warranty, offered with the implant and cosmetic work it covers
const WARRANTY = `${S}/five-year-warranty#warranty`
const warrantyOffer = { '@type': 'Offer', warranty: ref(WARRANTY), availableAtOrFrom: [MCLEAN, ALEX] }
for (const slug of ['dental-implants', 'all-on-4', 'implant-supported-dentures', 'veneers', 'crowns-and-bridges', 'cosmetic-dentistry', 'smile-makeover']) node(slug, 'service').offers = warrantyOffer

// /dental-implants
{
  const slug = 'dental-implants'
  const parts = sec(slug, /^Three parts/), options = sec(slug, /^One tooth, several/), steps = sec(slug, /^What actually happens/)
  const vs = sec(slug, /^Dentures rest on you/), gallery = sec(slug, /^Drag the line/)
  const svc = node(slug, 'service'), proc = node(slug, 'procedure')
  svc.hasOfferCatalog = catalog(slug, options, options.items.map((it) => ({ name: it.h3, description: join_(it.text), wiki: /Dentures/.test(it.h3) ? 'dentures' : /Bridge/.test(it.h3) ? 'bridge' : undefined })))
  Object.assign(proc, {
    howPerformed: join_(steps.items.slice(1, 3).map((it) => `${it.h3}: ${join_(it.text)}`)),
    preparation: `${steps.items[0].h3}: ${join_(steps.items[0].text)}`,
    followup: `${steps.items[3].h3}: ${join_(steps.items[3].text)}`,
    bodyLocation: 'Jawbone', ...sameAs('dentalImplant'),
  })
  add(slug,
    list(slug, 'anatomy', parts.h2, parts.lead.slice(1, 4).map((l) => pill(l, ['The post', 'The abutment', 'The restoration'])), { description: parts.lead[0], about: thing('osseointegration') }),
    howTo(slug, steps, 'process', { about: ref(`${url(slug)}#procedure`) }),
    list(slug, 'benefits', vs.h2, vs.lead.slice(1), { description: vs.lead[0] }),
    cases(slug, gallery, ref(`${url(slug)}#service`)))
}

// /all-on-4
{
  const slug = 'all-on-4'
  const angled = sec(slug, /^Angled posts/), fp = sec(slug, /^FP1, FP2, FP3/), steps = sec(slug, /^Four visits/)
  const night = sec(slug, /^Nothing comes out/), gallery = sec(slug, /^Drag the line/), commit = sec(slug, /^The commitments/)
  const proc = node(slug, 'procedure')
  Object.assign(proc, {
    howPerformed: join_([angled.lead[0], `${steps.items[1].h3}: ${join_(steps.items[1].text)}`]),
    preparation: `${steps.items[0].h3}: ${join_(steps.items[0].text)}`,
    followup: join_(steps.items.slice(2).map((it) => `${it.h3}: ${join_(it.text)}`)),
    bodyLocation: 'Upper and lower jaw (full arch)',
  })
  const FP = ['FP1', 'FP2', 'FP3']
  add(slug,
    list(slug, 'prosthesis-types', fp.h2, fp.items.map((it, i) => ({ name: `${FP[i]}: ${it.h3}`, description: join_(it.text.slice(0, i === 2 ? 4 : undefined)) })), { description: fp.lead[0] }),
    howTo(slug, steps, 'process', { about: ref(`${url(slug)}#procedure`) }),
    list(slug, 'benefits', night.h2, night.lead.slice(1), { description: night.lead[0] }),
    list(slug, 'commitments', commit.h2, commit.items.map((it) => ({ name: it.h3, description: join_(it.text) }))),
    cases(slug, gallery, ref(`${url(slug)}#service`)))
}

// /implant-supported-dentures
{
  const slug = 'implant-supported-dentures'
  const fixed = sec(slug, /^Fixed, or removable/), tiers = sec(slug, /^Three tiers/), steps = sec(slug, /^Four stages/), gallery = sec(slug, /full-arch cases/)
  node(slug, 'service').hasOfferCatalog = catalog(slug, tiers, tiers.items.map((it) => ({ name: it.h3, description: it.text[0], wiki: /Traditional/.test(it.h3) ? 'dentures' : undefined })))
  Object.assign(node(slug, 'procedure'), {
    preparation: join_(steps.items.slice(0, 2).map((it) => `${it.h3}: ${join_(it.text)}`)),
    howPerformed: `${steps.items[2].h3}: ${join_(steps.items[2].text)}`,
    followup: `${steps.items[3].h3}: ${join_(steps.items[3].text)}`, bodyLocation: 'Jawbone',
  })
  add(slug,
    list(slug, 'comparison', tiers.h2, tiers.items.map((it) => ({ name: it.h3, description: join_(it.text) })), { description: join_([fixed.lead[0], tiers.lead[0]]) }),
    howTo(slug, steps, 'process', { about: ref(`${url(slug)}#procedure`) }),
    cases(slug, gallery, ref(`${url(slug)}#service`)))
}

// /crowns-and-bridges
{
  const slug = 'crowns-and-bridges'
  const repair = sec(slug, /^Repair a damaged/), replace = sec(slug, /^Replace a missing/), cost = sec(slug, /^What decides the number/)
  node(slug, 'service').hasOfferCatalog = catalog(slug, { h2: 'Crowns and bridges' }, [
    { name: 'Dental crown', description: join_([repair.lead[0], repair.lead.at(-1)]), wiki: 'crown' },
    { name: 'Dental bridge', description: join_([replace.lead[0], replace.lead.at(-1)]), wiki: 'bridge' },
  ])
  add(slug,
    list(slug, 'crown-uses', repair.h2, repair.lead.slice(1, -1), { about: thing('crown', 'Dental crown') }),
    list(slug, 'bridge-benefits', replace.h2, replace.lead.slice(1, -1), { about: thing('bridge', 'Dental bridge') }),
    list(slug, 'cost-factors', cost.h2, cost.lead.slice(1, 3), { description: join_([cost.lead[0], cost.lead[3]]) }))
}

// /veneers
{
  const slug = 'veneers'
  const cand = sec(slug, /^Cosmetic problems/), steps = sec(slug, /^A minimally invasive prep/), gallery = sec(slug, /veneer cases/)
  Object.assign(node(slug, 'procedure'), {
    preparation: `${steps.items[1].h3}: ${join_(steps.items[1].text)}`,
    howPerformed: join_(steps.items.slice(2).map((it) => `${it.h3}: ${join_(it.text)}`)),
    followup: steps.items[3].text.at(-1),
  })
  add(slug,
    list(slug, 'indications', cand.h2, cand.lead.slice(1, -1), { description: join_([cand.lead[0], cand.lead.at(-1)]) }),
    howTo(slug, steps, 'process', { about: ref(`${url(slug)}#procedure`) }),
    cases(slug, gallery, ref(`${url(slug)}#service`)))
}

// /teeth-whitening
{
  const slug = 'teeth-whitening'
  const why = sec(slug, /^You have almost certainly/), table = sec(slug, /^Three ways/), gallery = sec(slug, /whitening cases/), keep = sec(slug, /^Keeping it/)
  const [head, ...rows] = table.table
  Object.assign(node(slug, 'procedure'), { howPerformed: intro(slug), followup: keep.lead[0], bodyLocation: 'Tooth enamel' })
  add(slug,
    { '@type': 'Table', '@id': `${url(slug)}#comparison`, name: table.h2, about: thing('whitening'),
      text: rows.map((r) => `${r[0]}: ${head.slice(1).map((h, i) => `${h}, ${r[i + 1]}`).join('; ')}.`).join(' ') },
    list(slug, 'benefits', keep.h2, keep.lead.slice(1, 6), { description: join_([why.lead[0], keep.lead[6] || ''].filter(Boolean)) }),
    cases(slug, gallery, ref(`${url(slug)}#service`)))
}

// /smile-makeover
{
  const slug = 'smile-makeover'
  const tools = sec(slug, /^Five ways to get there/), steps = sec(slug, /^How a makeover actually runs/), gallery = sec(slug, /^Drag the line/)
  const WK = { 'Porcelain veneers': 'veneer', 'Dental crowns': 'crown', 'Dental bridges': 'bridge', 'Professional whitening': 'whitening', 'Dental implants': 'dentalImplant' }
  node(slug, 'service').hasOfferCatalog = catalog(slug, tools, tools.items.map((it) => ({ name: it.h3, description: join_(it.text), wiki: WK[it.h3] })))
  Object.assign(node(slug, 'procedure'), { preparation: join_(steps.items.slice(0, 2).map((it) => `${it.h3}: ${join_(it.text)}`)), howPerformed: join_(steps.items.slice(2).map((it) => `${it.h3}: ${join_(it.text)}`)) })
  add(slug, howTo(slug, steps, 'process', { about: ref(`${url(slug)}#procedure`) }), cases(slug, gallery, ref(`${url(slug)}#service`)))
}

// /cosmetic-dentistry
{
  const slug = 'cosmetic-dentistry'
  const six = sec(slug, /^Six things/), tools = sec(slug, /^Five tools/), gallery = sec(slug, /^Two from this practice/), evalS = sec(slug, /^Four things, before/)
  const WK = { 'Porcelain veneers': 'veneer', 'Dental crowns': 'crown', 'Dental bridges': 'bridge', 'Teeth whitening': 'whitening', 'Inlays & onlays': 'inlay' }
  node(slug, 'service').hasOfferCatalog = catalog(slug, tools, tools.items.filter((it) => WK[it.h3]).map((it) => ({ name: it.h3, description: join_(it.text), wiki: WK[it.h3] })))
  add(slug,
    list(slug, 'concerns', six.h2, six.lead.slice(1, 7), { description: join_([six.lead[0], six.lead[7]]) }),
    list(slug, 'smile-evaluation', evalS.h2, evalS.lead.slice(1, 5), { description: evalS.lead[0] }),
    cases(slug, gallery, ref(`${url(slug)}#service`)))
}

// /oral-surgery
{
  const slug = 'oral-surgery'
  const three = sec(slug, /^Three procedures/), nerves = sec(slug, /^Being nervous/)
  const WK = { 'Tooth extraction': 'extraction', 'Bone grafting': 'boneGraft', 'Implant surgery': 'dentalImplant' }
  node(slug, 'service').hasOfferCatalog = catalog(slug, three, three.items.map((it) => ({ name: it.h3, description: join_(it.text), wiki: WK[it.h3] })))
  Object.assign(node(slug, 'procedure'), { howPerformed: join_(three.items.map((it) => `${it.h3}: ${join_(it.text)}`)), ...sameAs('extraction', 'boneGraft') })
  add(slug, list(slug, 'comfort', nerves.h2, nerves.lead.slice(1, 5), { description: nerves.lead[0] }))
}

// /sedation-dentistry
{
  const slug = 'sedation-dentistry'
  const who = sec(slug, /^Avoiding the chair/), kinds = sec(slug, /^Two kinds of sedation/), safe = sec(slug, /^Kept to what is safe/)
  const WK = { 'Nitrous oxide': 'nitrous' }
  node(slug, 'service').hasOfferCatalog = catalog(slug, kinds, kinds.items.slice(0, 2).map((it) => ({ name: it.h3, description: join_(it.text), wiki: WK[it.h3] })))
  Object.assign(node(slug, 'procedure'), { howPerformed: join_(kinds.items.map((it) => `${it.h3}: ${join_(it.text)}`)), preparation: safe.lead[0] })
  add(slug, list(slug, 'indications', who.h2, who.lead.slice(1), { description: who.lead[0] }))
}

// /emergency-dentistry
{
  const slug = 'emergency-dentistry'
  const reasons = sec(slug, /^Eight reasons/), five = sec(slug, /^Five situations/)
  const WK = { 'A knocked-out tooth': null, 'A toothache that will not go away': 'toothache', 'A broken tooth': 'crackedTooth', 'An abscess': 'abscess', 'Dry socket, after an extraction': 'drySocket' }
  node(slug, 'webpage').mentions = five.qa.map((x) => ({ '@type': 'MedicalCondition', name: x.q, description: x.a, ...(WK[x.q] ? sameAs(WK[x.q]) : {}) }))
  add(slug, list(slug, 'when-to-call', reasons.h2, reasons.lead.slice(1, 9), { description: join_([reasons.lead[0], reasons.lead[9]]) }))
}

// /dental-conditions: each condition the accordion names, with what is done about it
{
  const slug = 'dental-conditions'
  const ten = sec(slug, /^Ten things/)
  const WK = { 'Bad Breath': 'halitosis', 'Bleeding Gums': 'periodontal', 'Cracked Teeth': 'crackedTooth', 'Crooked Teeth': 'malocclusion', 'Gum Disease': 'periodontal', 'Missing or Failing Teeth': 'edentulism', 'Toothache': 'toothache', 'Yellow or Discolored Teeth': 'toothDiscoloration' }
  Object.assign(node(slug, 'webpage'), { about: ten.qa.map((x) => ({ '@type': 'MedicalCondition', name: x.q, description: x.a, ...(WK[x.q] ? sameAs(WK[x.q]) : {}) })), breadcrumb: ref(`${url(slug)}#breadcrumb`) })
}

// /implant-cost
{
  const slug = 'implant-cost'
  const five = sec(slug, /^Five things decide/), cheap = sec(slug, /^The cheapest option/)
  add(slug,
    list(slug, 'cost-factors', five.h2, five.items.filter((it) => !/^Bring another/.test(it.h3)).map((it) => ({ name: it.h3, description: join_(it.text) })), { description: five.lead[0], about: ref(`${S}/dental-implants#service`) }),
    list(slug, 'options-by-cost', cheap.h2, [
      { name: 'Traditional dentures', description: cheap.lead[0], item: thing('dentures') },
      { name: 'Implant-supported dentures', description: cheap.lead[1], item: ref(`${S}/implant-supported-dentures#service`) },
      { name: 'Full-arch implants', description: cheap.lead[2], item: ref(`${S}/all-on-4#service`) },
    ]),
    ...lenders('implant-cost'))
  blocks[slug].push(faqOf(slug))
  blocks[slug] = blocks[slug].filter((n, i, a) => !(n && String(n['@id']).endsWith('#faq') && a.findIndex((m) => m && m['@id'] === n['@id']) !== i))
}

// financing partners: the terms the page publishes. One definition, shared by /financing and /implant-cost
function lenders (slug) {
  const s = sec('financing', /^Three partners/)
  const site = (it) => (join_(it.text).match(/([a-z]+\.com)/) || [])[1]
  const tel = (it) => (join_(it.text).match(/\((\d{3})\) (\d{3})-(\d{4})/) || []).slice(1).join('-')
  return s.items.map((it) => ({
    '@type': 'LoanOrCredit', '@id': `${S}/financing#${it.h3.toLowerCase().replace(/[^a-z]+/g, '-')}`, name: `${it.h3} patient financing`,
    description: it.text[0],
    provider: { '@type': 'Organization', name: it.h3, url: `https://www.${site(it)}`, ...(tel(it) ? { telephone: `+1-${tel(it)}` } : {}) },
    ...(/up to \$60,000/.test(it.text[0]) ? { amount: { '@type': 'MonetaryAmount', maxValue: 60000, currency: 'USD' } } : {}),
    ...(/up to 96 months/.test(it.text[0]) ? { loanTerm: { '@type': 'QuantitativeValue', maxValue: 96, unitCode: 'MON' } } : {}),
    ...(/No-collateral/i.test(it.text[0]) ? { requiredCollateral: 'None' } : {}),
    areaServed: { '@type': 'Country', name: 'United States' },
  }))
}

// /financing
{
  const slug = 'financing'
  const forms = sec(slug, /^Five accepted forms/)
  add(slug, list(slug, 'payment-methods', forms.h2, forms.lead.slice(0, 5), { description: forms.lead[5] }), ...lenders(slug))
}

// /five-year-warranty
{
  const slug = 'five-year-warranty'
  const cover = sec(slug, /^Any part that fails/), pre = sec(slug, /^Precare/)
  blocks[slug] = blocks[slug].filter((n) => !String(n['@id']).endsWith('#faq'))
  add(slug,
    { '@type': 'WarrantyPromise', '@id': WARRANTY, name: cover.h2, description: join_([cover.lead[0], ...cover.items.map((it) => `${it.h3}: ${join_(it.text)}`), pre.lead[0]]),
      durationOfWarranty: { '@type': 'QuantitativeValue', value: 5, unitCode: 'ANN' } },
    { '@type': 'Service', '@id': `${url(slug)}#precare`, name: 'Precare', serviceType: 'Dental maintenance program', description: join_(pre.lead.slice(0, 2)), provider: ORG, areaServed: [MCLEAN, ALEX] })
  blocks[slug].push(faqOf(slug))
}

// /dental-implant-faq: the page IS the FAQPage (v2 kept the stored block; rebuilt from the accordions)
{
  const slug = 'dental-implant-faq'
  const stored = JSON.parse(live.find((e) => e.key === slug).block.json)
  const wp = [].concat(stored).find((n) => String(n['@id']).endsWith('#webpage'))
  const parts = sec(slug, /^Three parts, one tooth/)
  blocks[slug] = [{ ...wp, mainEntity: faqOf(slug, `${url(slug)}#webpage`, 'FAQPage').mainEntity, about: ref(`${S}/dental-implants#service`), breadcrumb: ref(`${url(slug)}#breadcrumb`) }]
  add(slug, list(slug, 'anatomy', parts.h2, parts.lead.slice(1, 4).map((l) => pill(l, ['The post', 'The abutment', 'The restoration'])), { description: parts.lead[0] }))
}

// home: the process, the FP types, the films, the treatment cards' own text
{
  const slug = 'index'
  const steps = sec(slug, /^Four visits, not four years/), fp = sec(slug, /^Four things you will not find/), all = sec(slug, /^Everything the practice does/)
  const cat = blocks[slug].find((n) => n['@type'] === 'OfferCatalog')
  for (const o of cat.itemListElement) {
    const card = all.items.find((it) => it.h3.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '').startsWith(o.itemOffered.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)))
    if (card) o.itemOffered.description = join_(card.text)
  }
  cat.description = all.lead[0]
  const FP = ['FP1', 'FP2', 'FP3']
  add(slug,
    howTo(slug, steps, 'process'),
    cases(slug, sec(slug, /^Keep scrolling/), ORG),
    list(slug, 'prosthesis-types', 'FP1, FP2, FP3: the three full-arch prosthesis types', fp.items.map((it, i) => ({ name: `${FP[i]}: ${it.h3}`, description: join_(it.text.slice(0, i === 2 ? 3 : undefined)) })), { description: fp.lead[1] }),
    ...pages[slug].sections.flatMap((s) => s.videos).map((v) => video(v, ORG)))
}

// /meet-dr-nahlah: the full credential record, the techniques, the study club, the film
{
  const slug = 'meet-dr-nahlah'
  const record = sec(slug, /^All fourteen/), teach = sec(slug, /^He teaches/), tech = sec(slug, /^Techniques he brought/), three = sec(slug, /^Three more years/)
  const person = blocks[slug].find((n) => n['@type'] === 'Person')
  const BY = { 'American Board of Prosthodontics': 'Board certification', 'Fellow': 'Fellowship', 'License': 'license', 'Certificate': 'Specialty certificate', 'Master': 'degree' }
  const creds = record.lead.slice(1).map((l) => l.replace(/^\d{2}\s+/, '')).filter((l) => !/\bIV\b/.test(l) && !/Adjunct Faculty/.test(l))
  person.hasCredential = creds.map((name) => ({
    '@type': 'EducationalOccupationalCredential', name,
    credentialCategory: Object.entries(BY).find(([k]) => name.includes(k))?.[1] || 'certification',
    ...(/American Board of Prosthodontics/.test(name) ? { recognizedBy: { '@type': 'Organization', name: 'American Board of Prosthodontics' }, dateCreated: '2013' } : {}),
    ...(/American College of Prosthodontists/.test(name) ? { recognizedBy: { '@type': 'Organization', name: 'American College of Prosthodontists', ...sameAs('acp') } } : {}),
    ...(/International Congress of Oral Implantologists/.test(name) ? { recognizedBy: { '@type': 'Organization', name: 'International Congress of Oral Implantologists', ...sameAs('icoi') } } : {}),
  }))
  person.memberOf = [
    { '@type': 'Organization', name: 'American College of Prosthodontists', ...sameAs('acp') },
    { '@type': 'Organization', name: 'International Congress of Oral Implantologists', ...sameAs('icoi') },
    { '@type': 'Organization', name: 'American Academy of Implant Dentistry' },
    { '@type': 'Organization', name: 'Academy of Osseointegration' },
  ]
  person.affiliation = { '@type': 'CollegeOrUniversity', name: 'Virginia Commonwealth University', url: 'https://www.vcu.edu/', ...sameAs('vcu') }
  person.description = join_([pages[slug].sections[0].lead[0], three.lead[0], teach.lead[0], teach.lead[1]])
  person.knowsAbout = [thing('prosthodontics'), thing('dentalImplant'), thing('allOn4'), ...tech.items.map((it) => ({ '@type': 'Thing', name: it.h3, description: join_(it.text) })), thing('cbct')]
  person.subjectOf = ref(`${S}/#video-${teach.videos[0]}`)
  add(slug,
    { '@type': 'Organization', '@id': `${S}/meet-dr-nahlah#tysons-study-club`, name: 'Tysons Study Club', founder: PERSON, foundingDate: '2018', description: teach.lead[2].replace(/^In 2018 he founded the Tysons Study Club, /, '').replace(/^a /, 'A ') },
    video(teach.videos[0], ref(`${S}/meet-dr-nahlah#tysons-study-club`)))
}

// /about: the standing commitments and what sets the practice apart
{
  const slug = 'about'
  const four = sec(slug, /^Four things you will not be asked/), skill = sec(slug, /^Skill, experience/)
  add(slug,
    list(slug, 'commitments', four.h2, four.items.map((it) => ({ name: it.h3, description: join_(it.text) })), { description: four.lead[0] }),
    list(slug, 'distinctions', skill.h2, skill.lead.slice(1).filter((l) => !/7,000/.test(l)), { description: skill.lead[0] }))
}

// /our-team: the five people, as the practice publishes them
const TEAM = []
{
  const slug = 'our-team'
  const meet = sec(slug, /^Meet the team/)
  for (const l of meet.lead.slice(1)) {
    const m = l.match(/^(\S+) (Office Manager|Digital Lab Designer|Treatment Coordinator|Dental Assistant|Dental Hygienist) (.*)$/)
    if (!m) throw new Error('our-team: unparsed line ' + l)
    const img = meet.images.find((im) => im.alt.startsWith(m[1]))
    TEAM.push({ '@type': 'Person', '@id': `${S}/our-team#${m[1].toLowerCase()}`, name: m[1], jobTitle: m[2], description: m[3], worksFor: ORG, ...(img ? { image: abs(img.src) } : {}) })
  }
  add(slug, ...TEAM)
  node(slug, 'webpage').mentions = TEAM.map((p) => ref(p['@id']))
}

// /our-facility: the equipment, as the McLean office's amenities (organizationJson below)
const facility = sec('our-facility', /^Six machines/)

// /patient-center: the first visit, eight steps
{
  const slug = 'patient-center'
  add(slug, howTo(slug, sec(slug, /^Eight steps/), 'first-visit'))
}

// films: every page that embeds one describes it
{
  const ABOUT = {
    '1222231749': `${S}/all-on-4#service`, '1222232372': `${S}/dental-implants#service`, '1222231994': `${S}/implant-supported-dentures#service`,
    '1222231322': `${S}/dental-implants#service`, '1222231716': `${S}/dental-implants#procedure`, '1222232076': `${S}/dental-implants#service`,
    '1222231763': `${S}/all-on-4#service`, '1222232339': `${S}/our-facility#webpage`, '1222231321': `${S}/our-facility#webpage`,
    'yt:A9wuNvIfFEw': `${S}/oral-surgery#service`, 'yt:yo1gLUGnRbM': `${S}/crowns-and-bridges#service`, 'yt:938agcztJjs': `${S}/implant-supported-dentures#service`,
    'yt:fx6eztXBVqQ': `${S}/dental-implants#service`, 'yt:zjvRSifApBs': `${S}/sedation-dentistry#service`, 'yt:btCwe4wry5o': `${S}/veneers#service`,
    'yt:um69fjRjTHs': `${S}/dental-implants#service`, 'yt:xgOBrrKQjeU': `${S}/smile-makeover#service`,
  }
  for (const slug of ['patient-stories', 'video-library']) {
    const vids = pages[slug].sections.flatMap((s) => s.videos)
    add(slug, ...vids.map((v) => video(v, ABOUT[v] ? ref(ABOUT[v]) : ORG)))
    node(slug, 'webpage').mainEntity = list(slug, 'films', pages[slug].sections[0].h1, vids.map((v) => ({ item: ref(`${S}/#video-${v.replace(/^yt:/, '')}`) })))
  }
}

// /contact-*: what to bring to a first consultation
for (const slug of ['contact-mclean', 'contact-alexandria']) {
  const s = sec(slug, /^What to bring/)
  add(slug, list(slug, 'what-to-bring', s.h2, s.lead.slice(0, 5)))
}

// /posts: the blog lists its articles
{
  const posts = Object.keys(pages).filter((k) => k.startsWith('posts/'))
  blocks.posts.find((n) => n['@type'] === 'Blog').blogPost = posts.map((k) => ref(`${S}/${k}#article`))
}

// ── breadcrumbs: exactly the trail each page shows ─────────────────────────
const crumbList = (slug, trail) => ({
  '@type': 'BreadcrumbList', '@id': `${url(slug)}#breadcrumb`,
  itemListElement: trail.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.href ? abs(c.href) : url(slug) })),
})
for (const [slug, p] of Object.entries(pages)) {
  if (slug === 'index' || slug.startsWith('posts/')) continue
  // /contact shows no trail of its own; its children name it "Contact"
  const trail = p.crumb.length ? p.crumb : slug === 'contact' ? [{ name: 'Home', href: '/' }, { name: 'Contact', href: null }] : null
  if (!trail) throw new Error(`${slug}: the page shows no breadcrumb`)
  if (!blocks[slug]) {
    // pages v2 did not build (legal, thank-you): keep their stored nodes, add the trail
    const e = live.find((x) => x.key === slug)
    blocks[slug] = e?.block ? [].concat(JSON.parse(e.block.json)) : [{ '@type': 'WebPage', '@id': `${url(slug)}#webpage` }]
  }
  let wp = blocks[slug].find((n) => String(n['@id']).endsWith('#webpage'))
  if (!wp) { wp = { '@type': 'WebPage', '@id': `${url(slug)}#webpage` }; blocks[slug].unshift(wp) }
  wp.breadcrumb = ref(`${url(slug)}#breadcrumb`)
  blocks[slug] = blocks[slug].filter((n) => n['@type'] !== 'BreadcrumbList')
  blocks[slug].push(crumbList(slug, trail))
}

// ── articles ────────────────────────────────────────────────────────────────
const TOPIC = [
  [/all-on-4|all-on-four|full-mouth|whole-set|full mouth/i, 'all-on-4', 'All-on-4 and full-arch implants'],
  [/veneer/i, 'veneers', 'Porcelain veneers'],
  [/denture/i, 'implant-supported-dentures', 'Implant-supported dentures'],
  [/sedation/i, 'sedation-dentistry', 'Sedation dentistry'],
  [/cost/i, 'dental-implants', 'Dental implant cost'],
  [/./, 'dental-implants', 'Dental implants'],
]
const MENTION = [
  ['osseointegration', /osseointegrat|fuse[sd]? (with|to) the (jaw)?bone/i], ['boneGraft', /bone graft/i], ['periImplantitis', /peri-?implantitis/i],
  ['cbct', /cone[- ]beam|CBCT|3D scan/i], ['zirconia', /zirconia/i], ['dentures', /denture/i], ['allOn4', /all-on-(4|four)/i],
  ['nitrous', /nitrous/i], ['sedation', /sedation/i], ['extraction', /extraction/i], ['crown', /\bcrown/i], ['bridge', /\bbridge/i], ['veneer', /veneer/i],
]
const posts = clone(v2.posts)
let postFaqs = 0
for (const [key, nodes] of Object.entries(posts)) {
  const slug = 'posts/' + key.replace(/^posts:/, '')
  const p = pages[slug]?.post
  if (!p) { console.log('  no scan for', slug); continue }
  const a = nodes.find((n) => [].concat(n['@type']).includes('BlogPosting'))
  const wp = nodes.find((n) => String(n['@id']).endsWith('#webpage'))
  const text = join_([...p.intro, ...p.parts.flatMap((x) => [x.h2, ...x.text])])
  const [, svc, section] = TOPIC.find(([re]) => re.test(slug + ' ' + p.h1))
  Object.assign(a, {
    headline: p.h1.slice(0, 110), wordCount: p.words, articleSection: section,
    ...(POST_DESC[slug.slice(6)] ? { description: POST_DESC[slug.slice(6)] } : {}),   // = the meta description push-posts-v3 writes
    ...(p.intro[0] ? { abstract: p.intro[0] } : {}),
    about: ref(`${S}/${svc}#service`),
    mentions: MENTION.filter(([, re]) => re.test(text)).map(([k]) => thing(k)),
  })
  wp.breadcrumb = ref(`${url(slug)}#breadcrumb`)
  nodes.push(crumbList(slug, [{ name: 'Home', href: '/' }, { name: 'Journal', href: '/posts' }, { name: p.h1, href: null }]))
  // question-led articles: each "?" heading and the paragraphs under it (navigation lines dropped)
  const qa = p.parts.filter((x) => /\?$/.test(x.h2)).map((x) => ({ q: x.h2, a: join_(x.text.filter((t) => !/^click here/i.test(t)).map((t) => t.replace(/\s*Click here[^.]*\.?$/i, ''))) })).filter((x) => x.a)
  if (qa.length >= 3) {
    postFaqs++
    nodes.push({ '@type': 'FAQPage', '@id': `${url(slug)}#faq`, isPartOf: ref(`${url(slug)}#webpage`), mainEntity: qa.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) })
    ;(wp.hasPart ||= []).push(ref(`${url(slug)}#faq`))
  }
}

// ── the organisation: entities it knows, the McLean office's equipment, the team ──
const org = clone(organization)
org.knowsAbout = ['prosthodontics', 'dentalImplant', 'allOn4', 'dentures', 'veneer', 'crown', 'bridge', 'whitening', 'boneGraft', 'extraction', 'sedation', 'cosmetic', 'emergency', 'cbct'].map((k) => thing(k))
// "Credit card: most major cards accepted" → "Credit card (most major cards accepted)"; "the three
// partners below" is page-relative, so it becomes the partners' names
const LENDERS = sec('financing', /^Three partners/).items.map((it) => it.h3).join(', ')
org.paymentAccepted = sec('financing', /^Five accepted forms/).lead.slice(0, 5)
  .map((l) => l.replace(/^([^:]+): (.+)$/, (m, a, b) => `${a} (${/partners below/.test(b) ? LENDERS : b})`)).join(', ')
org.employee = [PERSON, ...TEAM.map((p) => ref(p['@id']))]
const mclean = org.department.find((d) => d['@id'] === MCLEAN['@id'])
mclean.amenityFeature = facility.items.map((it) => ({ '@type': 'LocationFeatureSpecification', name: it.h3, value: true, description: join_(it.text) }))
const reception = pages['our-facility'].sections.flatMap((s) => s.images).find((im) => /^The reception desk/.test(im.alt))
if (reception) mclean.image = abs(reception.src)
// each office's own profiles = the footer's "Find Us Online" links (footer-reviews-links.mjs, supplied
// by the practice). Profiles, not their review forms: /reviews dropped, a g.page link resolved to the
// Maps place id it redirects to (CID), which is also the office's map.
const CID = { McLean: '16584195885077624360', Alexandria: '15116285013112467378' }
const profile = (name, u) => name === 'Google' ? `https://maps.google.com/?cid=${CID[u.office]}` : u.href.replace(/\/reviews\/?$/, '/')
for (const [office, links] of OFFICES) {
  const d = org.department.find((x) => x['@id'] === (office === 'McLean' ? MCLEAN : ALEX)['@id'])
  d.sameAs = links.map(([name, href]) => profile(name, { office, href }))
  d.hasMap = `https://maps.google.com/?cid=${CID[office]}`
}
// + the practice's own YouTube channel ("Dr. Esam Nahlah", from the WordPress-era seo.json; the
// library's films sit on a third-party channel, The Wellness Hour)
org.sameAs = [...new Set([...org.department.flatMap((d) => d.sameAs.filter((u) => /facebook|instagram/.test(u))), ...OTHERS.filter(([n]) => n === 'Instagram').map(([, u]) => u),
  'https://www.youtube.com/channel/UCKAbJ7TTUB-rFOTQ57DEq9g'])]

for (const [k, v] of Object.entries(blocks)) if (v) blocks[k] = v.filter(Boolean)
writeFileSync(join(OUT, 'organization.json'), JSON.stringify(org, null, 2))
writeFileSync(join(OUT, 'blocks.json'), JSON.stringify({ sitewide: v2.sitewide, pages: blocks, posts }, null, 1))
writeFileSync(join(OUT, 'sections-used.txt'), used.join('\n') + '\n')
const count = (o) => JSON.stringify(o).length
console.log('pages', Object.keys(blocks).length, 'posts', Object.keys(posts).length, 'post FAQs', postFaqs,
  '| bytes v2→v3', count(v2.pages) + count(v2.posts), '→', count(blocks) + count(posts), '| sections read', used.length)
