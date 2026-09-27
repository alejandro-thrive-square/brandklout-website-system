#!/usr/bin/env node
/**
 * configure-seo-plugins.mjs — the Dr Nahlah values for `webzite.open-graph`
 * and `webzite.aeo-schema`.
 *
 *   node configure-seo-plugins.mjs            # show the diff, write nothing
 *   node configure-seo-plugins.mjs --apply
 *
 * The plugins ship with empty defaults on purpose: a share image, a telephone
 * number and a street address are facts about ONE practice and have no place in
 * a package that another client installs. This script is where the Dr Nahlah
 * facts live, in the client's own workflow folder, and it is idempotent — a
 * re-run reports `=` and writes nothing.
 *
 * ## Where these facts came from
 *
 * The two addresses, the four numbers and the hours are read off the published
 * `/contact-maclean` and `/contact-alexandria` pages — the same strings a
 * patient sees, which is the point: a `LocalBusiness` whose NAP disagrees with
 * the page it sits on is worse than none, because it is the machine-readable
 * copy that a directory will trust.
 *
 * ## Why the organisation is hand-written JSON and not the scalar fields
 *
 * This is a TWO-OFFICE practice. The plugin's flat fields describe one
 * business, and filling them in would put one address on eighty pages and
 * silently drop the other. `organizationJson` exists for exactly this, and it
 * emits the accepted shape: one `Dentist` for the practice with a `department`
 * per office, each with its own `address`, `telephone`, `geo`-free
 * `openingHoursSpecification` and `@id`.
 *
 * ## The share image
 *
 * `og:image` falls back to the first content picture on a page, which for the
 * home page is a patient's before photograph — accurate for the page, wrong as
 * the thing that appears when somebody pastes the practice's address into
 * WhatsApp. `defaultImage` is set to the doctor's portrait, and the home page
 * gets an explicit override so it never inherits a case photo.
 */
import { api } from '../15-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')

const SITE = 'https://www.drnahlah.com'
const NAME = 'Dr. Nahlah Implants and Prosthodontics Specialists'
const LOGO = '/uploads/PhKVdS1R0_xk-mtalvGAw-cropped-nahlah-favicon.png'
const SHARE = '/uploads/2LB_FQE0Yk3mHR8rlDnxS-dr-headshot.png'

const HOURS = [
  { '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], opens: '08:00', closes: '17:00' },
  { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Friday'], opens: '08:00', closes: '14:00' },
]

/** Both offices, as the published contact pages state them. */
const ORGANIZATION = {
  '@type': 'Dentist',
  '@id': `${SITE}/#organization`,
  name: NAME,
  alternateName: 'Dr. Esam Nahlah, DDS, MS',
  url: `${SITE}/`,
  logo: { '@type': 'ImageObject', url: SITE + LOGO },
  image: SITE + SHARE,
  telephone: '+1-571-702-9900',
  priceRange: '$$$',
  medicalSpecialty: 'Prosthodontics',
  founder: {
    '@type': 'Person',
    name: 'Dr. Esam Nahlah',
    honorificSuffix: 'DDS, MS',
    jobTitle: 'Board-certified prosthodontist',
    url: `${SITE}/meet-dr-nahlah`,
  },
  areaServed: [
    { '@type': 'City', name: 'McLean' },
    { '@type': 'City', name: 'Tysons Corner' },
    { '@type': 'City', name: 'Alexandria' },
    { '@type': 'City', name: 'Arlington' },
  ],
  department: [
    {
      '@type': 'Dentist',
      '@id': `${SITE}/contact-maclean#office`,
      name: `${NAME} — McLean`,
      url: `${SITE}/contact-maclean`,
      telephone: '+1-571-702-9900',
      faxNumber: '+1-703-448-3312',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '7901 Jones Branch Drive, Suite 220',
        addressLocality: 'McLean',
        addressRegion: 'VA',
        postalCode: '22102',
        addressCountry: 'US',
      },
      openingHoursSpecification: HOURS,
    },
    {
      '@type': 'Dentist',
      '@id': `${SITE}/contact-alexandria#office`,
      name: `${NAME} — Alexandria`,
      url: `${SITE}/contact-alexandria`,
      telephone: '+1-571-253-7790',
      faxNumber: '+1-703-940-5410',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '2855 Duke Street',
        addressLocality: 'Alexandria',
        addressRegion: 'VA',
        postalCode: '22314',
        addressCountry: 'US',
      },
      openingHoursSpecification: HOURS,
    },
  ],
}

const PLAN = {
  'webzite.open-graph': {
    enabled: true,
    siteUrl: SITE,
    siteName: 'Dr. Nahlah Implants & Prosthodontics',
    defaultImage: SHARE,
    defaultImageAlt: 'Dr. Esam Nahlah, board-certified prosthodontist',
    defaultType: 'website',
    articleType: true,
    locale: 'en_US',
    twitterCard: 'summary_large_image',
    // No handle to point at. Left empty so the tag is omitted rather than
    // emitted blank — an empty twitter:site is a validation error, not a no-op.
    twitterSite: '',
    deriveFromPage: true,
    syncMetaDescription: true,
    emitCanonical: true,
  },
  'webzite.aeo-schema': {
    enabled: true,
    siteUrl: SITE,
    siteName: 'Dr. Nahlah Implants & Prosthodontics',
    organizationType: 'Dentist',
    organizationName: NAME,
    logo: LOGO,
    telephone: '+1-571-702-9900',
    priceRange: '$$$',
    sameAs: '',
    organizationJson: JSON.stringify(ORGANIZATION, null, 2),
    emitOrganization: true,
    emitWebSite: true,
    emitWebPage: true,
    emitBreadcrumbs: true,
    emitArticle: true,
  },
}

/** The home page must not inherit a patient's before photograph as its card. */
const OG_OVERRIDES = [
  {
    key: 'index',
    image: SHARE,
    imageAlt: 'Dr. Esam Nahlah, board-certified prosthodontist',
  },
]

const short = (v) => {
  const s = typeof v === 'string' ? v : JSON.stringify(v)
  return s.length > 72 ? `${s.slice(0, 69)}…` : s
}

let changed = 0
for (const [id, want] of Object.entries(PLAN)) {
  console.log(`\n${id}`)
  const current = (await api('GET', `/admin/api/cms/plugins/${id}/settings`)).settings ?? {}
  const diff = []
  for (const [k, v] of Object.entries(want)) {
    const now = current[k]
    if (JSON.stringify(now) === JSON.stringify(v)) { console.log(`  =  ${k}`); continue }
    diff.push(k)
    console.log(`  ~  ${k}\n       was  ${short(now === undefined ? '(unset)' : now)}\n       now  ${short(v)}`)
  }
  if (diff.length === 0) continue
  changed += diff.length
  if (!APPLY) continue

  const res = await api('PUT', `/admin/api/cms/plugins/${id}/settings`, { settings: { ...current, ...want } })
  const back = res.settings ?? {}
  const bad = Object.entries(want).filter(([k, v]) => JSON.stringify(back[k]) !== JSON.stringify(v))
  if (bad.length) {
    console.error(`  ! did not land: ${bad.map(([k]) => k).join(', ')}`)
    process.exit(1)
  }
  console.log(`  ok  ${diff.length} setting(s) written and read back`)
}

// The per-page overrides go through the plugin's own route, which is the same
// path the admin page uses — so this exercises the API it ships rather than
// writing to its storage behind its back.
console.log('\nwebzite.open-graph — per-page overrides')
for (const ov of OG_OVERRIDES) {
  if (!APPLY) { console.log(`  ~  ${ov.key}  ${short(ov.image)}`); changed++; continue }
  const res = await api('POST', '/admin/api/cms/plugins/webzite.open-graph/runtime/override', ov)
  console.log(`  ok  ${ov.key}  saved=${res.saved}`)
}

if (!APPLY) {
  console.log(`\nDRY RUN — ${changed} change(s). Re-run with --apply.`)
} else {
  console.log('\nSettings written. They take effect on the next publish.')
}
