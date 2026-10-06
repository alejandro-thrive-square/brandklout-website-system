#!/usr/bin/env node
/**
 * SEO v2 (2026-10-05): build every structured-data block for production from facts the site
 * already publishes. Writes seo-v2/out/{organization.json,blocks.json}; push-seo-v2.mjs ships them.
 *
 * Shape follows the Hackensack site the team pointed at (Service + FAQPage per treatment page,
 * Person for the doctor, BlogPosting per article), on top of the aeo-schema plugin's generated
 * WebSite / WebPage / BreadcrumbList / Article nodes. A block whose @id matches a generated node
 * extends it (aeo-schema collapses by @id).
 *
 * Inputs (all read-only): seo-v2/meta.json (titles + descriptions), ../.tmp/faq-scan.json (the
 * visible accordions, scraped from the live pages), ../.tmp/post-dates.json (original WordPress
 * publish dates), the live aeo entries + open-graph overrides (post headlines, sections, images).
 * Never IV sedation or an anaesthesiologist (client rule 2026-09-28).
 *
 *   node seo-v2/build-schema.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { api } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const TMP = join(HERE, '..', '.tmp')
const OUT = join(HERE, 'out')
mkdirSync(OUT, { recursive: true })

const S = 'https://www.drnahlah.com'
const ORG = { '@id': `${S}/#organization` }
const PERSON = { '@id': `${S}/meet-dr-nahlah#person` }
const MCLEAN = { '@id': `${S}/contact-mclean#office` }
const ALEX = { '@id': `${S}/contact-alexandria#office` }
const TODAY = '2026-10-05'

const meta = JSON.parse(readFileSync(join(HERE, 'meta.json'), 'utf8'))
const faq = JSON.parse(readFileSync(join(TMP, 'faq-scan.json'), 'utf8'))
const dates = JSON.parse(readFileSync(join(TMP, 'post-dates.json'), 'utf8'))

const AREA = [
  { '@type': 'City', name: 'McLean' }, { '@type': 'Place', name: 'Tysons Corner' },
  { '@type': 'City', name: 'Alexandria' }, { '@type': 'City', name: 'Arlington' },
  { '@type': 'AdministrativeArea', name: 'Fairfax County' }, { '@type': 'AdministrativeArea', name: 'Northern Virginia' },
]
const HOURS = [
  { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], opens: '08:00', closes: '17:00' },
  { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Friday'], opens: '08:00', closes: '14:00' },
]
const SAME_AS_ORG = [
  'https://www.facebook.com/drnahlahprosthodontist/',
  'https://www.instagram.com/drnahlah/',
  'https://maps.google.com/?cid=16584195885077624360',
]
const SAME_AS_PERSON = [
  'https://www.healthgrades.com/dentist/dr-esam-abou-nahlah-26pyg',
  'https://www.vitals.com/doctors/esam-abou-nahlah-gokheu',
  'https://www.realself.com/dr/esam-abou-nahlah-mclean-va',
]
const HEADSHOT = `${S}/uploads/2LB_FQE0Yk3mHR8rlDnxS-dr-headshot.png`

// ── the organisation (aeo-schema setting organizationJson) ────────────────
const office = (o) => ({
  '@type': 'Dentist',
  '@id': o.id,
  name: `Dr. Nahlah Implants and Prosthodontics Specialists, ${o.label}`,
  legalName: o.legal,
  url: o.url,
  image: HEADSHOT,
  telephone: o.tel,
  contactPoint: o.points.map(([type, tel]) => ({ '@type': 'ContactPoint', contactType: type, telephone: tel, areaServed: 'US', availableLanguage: 'English' })),
  address: { '@type': 'PostalAddress', ...o.address, addressRegion: 'VA', addressCountry: 'US' },
  geo: { '@type': 'GeoCoordinates', latitude: o.geo[0], longitude: o.geo[1] },
  hasMap: o.map,
  openingHoursSpecification: HOURS,
  priceRange: '$$$',
  isAcceptingNewPatients: true,
  medicalSpecialty: 'https://schema.org/Dentistry',
  parentOrganization: ORG,
})
const organization = {
  '@type': 'Dentist',
  '@id': ORG['@id'],
  name: 'Dr. Nahlah Implants and Prosthodontics Specialists',
  alternateName: ['Dr. Nahlah Implants & Prosthodontics', 'Dr. Esam Nahlah, DDS, MS'],
  description: 'Implant dentistry and prosthodontics in McLean (Tysons Corner) and Alexandria, Virginia, led by board-certified prosthodontist Dr. Esam Nahlah: dental implants, All-on-4 full arches, full-mouth reconstruction and cosmetic dentistry, with an in-house digital laboratory.',
  url: `${S}/`,
  logo: { '@type': 'ImageObject', url: `${S}/uploads/PhKVdS1R0_xk-mtalvGAw-cropped-nahlah-favicon.png` },
  image: HEADSHOT,
  telephone: '+1-703-448-3312',
  priceRange: '$$$',
  currenciesAccepted: 'USD',
  paymentAccepted: 'Cash, Check, Credit Card, Dental PPO insurance, Financing',
  medicalSpecialty: 'https://schema.org/Dentistry',
  isAcceptingNewPatients: true,
  knowsAbout: ['Prosthodontics', 'Dental implants', 'All-on-4 dental implants', 'Full-mouth reconstruction', 'Implant-supported dentures', 'Porcelain veneers', 'Dental crowns and bridges', 'Bone grafting', 'Sedation dentistry', 'Digital Smile Design'],
  founder: PERSON,
  employee: PERSON,
  sameAs: SAME_AS_ORG,
  areaServed: AREA,
  hasOfferCatalog: { '@id': `${S}/#services` },
  department: [
    office({ id: MCLEAN['@id'], label: 'Tysons Corner, McLean', legal: 'Esam Abou Nahlah, DDS, MS, PLLC', url: `${S}/contact-mclean`, tel: '+1-703-448-3312',
      points: [['new patients', '+1-703-448-3312'], ['existing patients', '+1-703-448-3312']],
      address: { streetAddress: '7901 Jones Branch Drive, Suite 220', addressLocality: 'McLean', postalCode: '22102' },
      geo: [38.9260584, -77.2189653], map: 'https://maps.google.com/?cid=16584195885077624360' }),
    office({ id: ALEX['@id'], label: 'Alexandria', legal: 'Implants And Prosthodontics Specialists, PLLC', url: `${S}/contact-alexandria`, tel: '+1-571-617-7245',
      points: [['new patients', '+1-571-617-7245'], ['existing patients', '+1-703-940-5410']],
      address: { streetAddress: '2855 Duke Street', addressLocality: 'Alexandria', postalCode: '22314' },
      geo: [38.8073027, -77.0787121], map: 'https://www.google.com/maps/dir/?api=1&destination=2855+Duke+Street+Alexandria+VA+22314' }),
  ],
}

// ── the doctor: compact on every page (site-wide block), full on his own page ──
const org = (name, url) => ({ '@type': 'Organization', name, ...(url ? { url } : {}) })
const personCore = {
  '@type': 'Person', '@id': PERSON['@id'],
  name: 'Dr. Esam Nahlah', alternateName: ['Esam Nahlah', 'Esam Abou Nahlah'],
  honorificPrefix: 'Dr.', honorificSuffix: 'DDS, MS',
  jobTitle: 'Board-certified prosthodontist',
  url: `${S}/meet-dr-nahlah`, image: HEADSHOT,
  worksFor: ORG, sameAs: SAME_AS_PERSON,
}
const personFull = {
  ...personCore,
  description: 'Board-certified prosthodontist, Diplomate of the American Board of Prosthodontics and Fellow of the American College of Prosthodontists. In practice since 2003 and in Northern Virginia since 2013; adjunct faculty in the Prosthodontics Postgraduate Program at Virginia Commonwealth University.',
  hasOccupation: { '@type': 'Occupation', name: 'Prosthodontist', occupationLocation: [{ '@type': 'City', name: 'McLean' }, { '@type': 'City', name: 'Alexandria' }] },
  hasCredential: [
    { '@type': 'EducationalOccupationalCredential', name: 'Diplomate, American Board of Prosthodontics', credentialCategory: 'Board certification', recognizedBy: org('American Board of Prosthodontics'), dateCreated: '2013' },
    { '@type': 'EducationalOccupationalCredential', name: 'Certificate in Prosthodontics', credentialCategory: 'Specialty certificate' },
    { '@type': 'EducationalOccupationalCredential', name: 'Master of Science in Oral Biology', credentialCategory: 'degree' },
    { '@type': 'EducationalOccupationalCredential', name: 'Virginia Dental License', credentialCategory: 'license' },
  ],
  memberOf: [
    org('American College of Prosthodontists'), org('International Congress of Oral Implantologists'),
    org('American Academy of Implant Dentistry'), org('Academy of Osseointegration'),
  ],
  affiliation: org('Virginia Commonwealth University', 'https://www.vcu.edu/'),
  knowsAbout: ['Prosthodontics', 'Dental implants', 'All-on-4 dental implants', 'Full-mouth rehabilitation', 'Computer-guided implant surgery', 'Immediate implant placement', 'Smile design', 'Digital impressions'],
  founder: org('Tysons Study Club'),
}
delete personFull.founder   // Person.founder is not a property; the study club stays on the page text

// ── per-page helpers ───────────────────────────────────────────────────────
const url = (slug) => slug === 'index' ? `${S}/` : `${S}/${slug}`
const page = (slug, types, extra = {}) => ({
  '@type': types, '@id': `${url(slug)}#webpage`, url: url(slug),
  name: meta[slug][0], description: meta[slug][1],
  isPartOf: { '@id': `${S}/#website` }, publisher: ORG, inLanguage: 'en-US', ...extra,
})
const reviewed = { reviewedBy: PERSON, lastReviewed: TODAY }
const faqNode = (slug, drop = []) => {
  const qa = (faq[slug]?.qa || []).filter((x) => /\?$/.test(x.q) && !drop.includes(x.q))
  if (!qa.length) return null
  return {
    '@type': 'FAQPage', '@id': `${url(slug)}#faq`, isPartOf: { '@id': `${url(slug)}#webpage` },
    mainEntity: qa.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a.replace(/(?<=[.!?])\s+[^.!?]*→\s*$/, '') } })),   // drop a trailing 'Read more →' link
  }
}
const service = (slug, name, procedure) => {
  const svc = {
    '@type': 'Service', '@id': `${url(slug)}#service`, name, serviceType: name,
    description: meta[slug][1], url: url(slug), provider: ORG, areaServed: AREA,
    availableChannel: [MCLEAN, ALEX].map((o) => ({ '@type': 'ServiceChannel', serviceLocation: o })),
  }
  return svc
}
// SurgicalProcedure is a TYPE (subtype of MedicalProcedure); procedureType only takes the
// MedicalProcedureType enum (NoninvasiveProcedure, PercutaneousProcedure). validator.schema.org.
const procedure = (slug, name, type) => ({
  '@type': type === 'SurgicalProcedure' ? 'SurgicalProcedure' : 'MedicalProcedure',
  '@id': `${url(slug)}#procedure`, name, url: url(slug),
  ...(type === 'NoninvasiveProcedure' ? { procedureType: 'https://schema.org/NoninvasiveProcedure' } : {}),
  description: meta[slug][1],
})

// treatment pages: [slug, service name, procedure name, procedureType]
const TREATMENTS = [
  ['dental-implants', 'Dental implants', 'Dental implant placement', 'SurgicalProcedure'],
  ['all-on-4', 'All-on-4 full-arch dental implants', 'All-on-4 full-arch implant surgery', 'SurgicalProcedure'],
  ['implant-supported-dentures', 'Implant-supported dentures', 'Implant-supported denture', 'SurgicalProcedure'],
  ['crowns-and-bridges', 'Dental crowns and bridges', 'Dental crown and bridge restoration', 'NoninvasiveProcedure'],
  ['veneers', 'Porcelain veneers', 'Porcelain veneer placement', 'NoninvasiveProcedure'],
  ['teeth-whitening', 'Teeth whitening', 'In-office teeth whitening', 'NoninvasiveProcedure'],
  ['smile-makeover', 'Smile makeover', 'Smile makeover with Digital Smile Design', null],
  ['cosmetic-dentistry', 'Cosmetic dentistry', null, null],
  ['oral-surgery', 'Oral surgery', 'Tooth extraction and bone grafting', 'SurgicalProcedure'],
  ['sedation-dentistry', 'Sedation dentistry', 'Nitrous oxide and oral sedation', null],
  ['emergency-dentistry', 'Emergency dental care', null, null],
]

const blocks = {}
for (const [slug, svcName, procName, procType] of TREATMENTS) {
  const nodes = [service(slug, svcName, !!procName)]
  const about = [{ '@id': `${url(slug)}#service` }]
  if (procName) { nodes.push(procedure(slug, procName, procType)); about.push({ '@id': `${url(slug)}#procedure` }) }
  const wp = page(slug, 'MedicalWebPage', { ...reviewed, specialty: 'https://schema.org/Dentistry', audience: { '@type': 'MedicalAudience', audienceType: 'Patient' }, about, mainEntity: { '@id': `${url(slug)}#service` } })
  const f = slug === 'teeth-whitening' ? null : faqNode(slug); if (f) nodes.push(f)   // whitening's only '?' heading is a CTA
  if (slug === 'emergency-dentistry') wp.mentions = (faq[slug]?.qa || []).map((x) => ({ '@type': 'MedicalCondition', name: x.q, description: x.a }))
  blocks[slug] = [wp, ...nodes]
}

// pages that are not a single treatment
blocks['implant-cost'] = [page('implant-cost', 'WebPage', { ...reviewed, about: { '@id': `${S}/dental-implants#service` } }), faqNode('implant-cost')]
blocks['five-year-warranty'] = [page('five-year-warranty', 'WebPage', { about: ORG }), faqNode('five-year-warranty', ['My question is not answered here.'])]
blocks['dental-conditions'] = [page('dental-conditions', 'MedicalWebPage', {
  ...reviewed, specialty: 'https://schema.org/Dentistry', audience: { '@type': 'MedicalAudience', audienceType: 'Patient' },
  about: (faq['dental-conditions'].qa).map((x) => ({ '@type': 'MedicalCondition', name: x.q, description: x.a })),
})]
blocks['meet-dr-nahlah'] = [page('meet-dr-nahlah', ['AboutPage', 'ProfilePage'], { about: PERSON, mainEntity: PERSON }), personFull]
for (const s of ['about', 'our-team', 'our-facility']) blocks[s] = [page(s, 'AboutPage', { about: ORG })]
blocks.contact = [page('contact', 'ContactPage', { about: ORG, mainEntity: [MCLEAN, ALEX] })]
blocks['contact-mclean'] = [page('contact-mclean', 'ContactPage', { about: MCLEAN, mainEntity: MCLEAN })]
blocks['contact-alexandria'] = [page('contact-alexandria', 'ContactPage', { about: ALEX, mainEntity: ALEX })]
blocks['doctor-referral'] = [page('doctor-referral', 'MedicalWebPage', { audience: { '@type': 'MedicalAudience', audienceType: 'Clinician' }, about: ORG })]
blocks['patient-stories'] = [page('patient-stories', 'CollectionPage', { about: ORG })]
blocks['video-library'] = [page('video-library', 'CollectionPage', { about: ORG })]
blocks['patient-center'] = [page('patient-center', 'WebPage', { about: ORG })]
blocks.financing = [page('financing', 'WebPage', { about: ORG })]
blocks.posts = [page('posts', 'CollectionPage', { about: ORG, mainEntity: { '@id': `${S}/posts#blog` } }),
  { '@type': 'Blog', '@id': `${S}/posts#blog`, name: meta.posts[0], url: `${S}/posts`, publisher: ORG, author: PERSON, inLanguage: 'en-US' }]
blocks['dental-implant-faq'] = null   // keep the stored FAQPage block; only gain reviewedBy below

// the home page: the treatments catalogue, now pointing at each page's Service
blocks.index = [page('index', 'WebPage', { about: ORG, mainEntity: ORG }), {
  '@type': 'OfferCatalog', '@id': `${S}/#services`, name: 'Treatments',   // linked from the org's hasOfferCatalog (OfferCatalog has no provider)
  itemListElement: TREATMENTS.map(([slug, name]) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', '@id': `${url(slug)}#service`, name, url: url(slug) } })),
}]

// smile gallery: an ImageGallery of the case photographs the page shows
{
  const h = await (await fetch(`${S}/smile-gallery`)).text()
  const imgs = [...h.split('</head>')[1].matchAll(/<img\b[^>]*>/g)].map((m) => m[0])
    .map((t) => ({ src: (t.match(/\bsrc="([^"]*)"/) || [])[1], alt: (t.match(/\balt="([^"]*)"/) || [])[1] || '' }))
    .filter((x) => x.src && /\/uploads\/.*case-/i.test(x.src) && x.alt)
  const seen = new Set()
  const media = imgs.filter((x) => !seen.has(x.src) && seen.add(x.src)).map((x) => ({
    '@type': 'ImageObject', contentUrl: new URL(x.src, S).href, caption: x.alt.replace(/&#x27;/g, "'").replace(/&amp;/g, '&'),
    creator: ORG, creditText: 'Dr. Nahlah Implants and Prosthodontics Specialists', copyrightNotice: 'Dr. Nahlah Implants and Prosthodontics Specialists',
  }))
  blocks['smile-gallery'] = [page('smile-gallery', 'CollectionPage', { about: ORG, hasPart: { '@id': `${S}/smile-gallery#gallery` } }),
    { '@type': 'ImageGallery', '@id': `${S}/smile-gallery#gallery`, name: 'Before and after cases', about: ORG, associatedMedia: media }]
  console.log('smile gallery images', media.length)
}

// ── articles: extend each stored BlogPosting ──────────────────────────────
const entries = (await api('GET', '/admin/api/cms/plugins/brandklout.aeo-schema/runtime/entries')).entries
const og = Object.fromEntries((await api('GET', '/admin/api/cms/plugins/brandklout.open-graph/runtime/pages')).pages.map((p) => [p.key, p]))
const posts = {}
for (const e of entries.filter((x) => x.kind === 'entry' && x.tableSlug === 'posts')) {
  // a re-run reads back what the last push stored, which is already [BlogPosting, WebPage]
  const parsed = e.block ? JSON.parse(e.block.json) : {}
  const old = Array.isArray(parsed) ? (parsed.find((n) => [].concat(n['@type']).includes('BlogPosting')) || {}) : { ...parsed }
  for (const k of Object.keys(old)) if (/^\d+$/.test(k)) delete old[k]   // repair the 2026-10-05 spread of an array into an object
  const u = `${S}/posts/${e.slug}`
  const d = dates[e.slug] || {}
  const img = og[e.key]?.override?.image
  posts[e.key] = [{
    ...old,
    '@type': 'BlogPosting', '@id': `${u}#article`, url: u,
    headline: e.title.slice(0, 110),
    description: e.seoDescription || old.description,
    ...(img ? { image: [img] } : {}),
    ...(d.pub ? { datePublished: d.pub } : {}),
    author: PERSON, publisher: ORG,
    mainEntityOfPage: { '@id': `${u}#webpage` }, isPartOf: { '@id': `${S}/posts#blog` },
    inLanguage: 'en-US',
  }, { '@type': 'WebPage', '@id': `${u}#webpage`, reviewedBy: PERSON }]
  if (!d.pub) console.log('  no original date:', e.slug)
}

for (const [k, v] of Object.entries(blocks)) if (v) blocks[k] = v.filter(Boolean)
writeFileSync(join(OUT, 'organization.json'), JSON.stringify(organization, null, 2))
writeFileSync(join(OUT, 'blocks.json'), JSON.stringify({ sitewide: [personCore], pages: blocks, posts }, null, 1))
console.log('pages', Object.keys(blocks).length, 'posts', Object.keys(posts).length,
  'faq pages', Object.values(blocks).filter((v) => v && v.some((n) => n['@type'] === 'FAQPage')).length)
