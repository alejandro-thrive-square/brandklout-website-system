#!/usr/bin/env node
/**
 * populate-seo.mjs — give every page of the site an explicit Open Graph
 * override and an explicit schema block, so both are visible and editable in
 * the admin rather than implied by the plugins' defaults.
 *
 *   node populate-seo.mjs                  # the whole plan, writes nothing
 *   node populate-seo.mjs --apply
 *   node populate-seo.mjs --only og        # or --only aeo
 *
 * Everything is written through the plugins' own routes, never into their
 * storage — so this exercises the same API a person or a script would use.
 *
 * ## Idempotent by design, because it is also the re-sync
 *
 * Materialising a derived value has one real cost: it stops tracking its
 * source. Once `og:title` is stored, editing the page title in the CMS no
 * longer changes the share card. **This script IS the fix for that** — running
 * it again refreshes every stored value from the current CMS content, so
 * "re-sync after a content change" is one command, not eighty edits. Say so
 * to whoever maintains the site.
 *
 * ## What is written, and what is deliberately left derived
 *
 * | field | written from | why |
 * | :-- | :-- | :-- |
 * | `og:title` | `seoTitle` → `title` | the curated title, per page |
 * | `og:description` | `seoDescription` | **only when the page has one** — see below |
 * | `og:image` / `og:image:alt` | the page's own first content picture, via the plugin's `/preview` | the picture that is actually on the page |
 * | `og:type` | `article` for a journal entry, `website` otherwise | |
 * | canonical URL | **not written** | it is derived from the site-address setting; storing 80 absolute URLs would make a domain change an 80-row edit |
 *
 * **`og:description` is skipped where the page has no `seoDescription`.** The
 * derived value there is the site-wide sentence, and freezing that onto a page
 * as an explicit override would re-create the exact defect the Open Graph
 * plugin was written to remove — except worse, because it would then no longer
 * follow the site setting. Those pages are listed at the end so someone can
 * write them a description; until then they keep deriving.
 *
 * Likewise `og:image` is skipped when the page derives the fallback image:
 * storing the fallback 80 times would turn one knob into eighty.
 *
 * ## The schema blocks
 *
 * Every page gets a block whose `@type` is true of that page. The map below is
 * hand-written, not pattern-matched, because the correct type is a judgement:
 * `/dental-conditions` is conditions and not a procedure, `/doctor-referral`
 * addresses clinicians rather than patients, and `/financing` is neither.
 *
 * The 43 journal articles get a block carrying `articleSection` — the row's own
 * `topic` cell, the same taxonomy the /posts filter uses — plus `isPartOf` the
 * Blog. The generator already emits `Article` for them with headline, dates and
 * publisher; what it cannot know is which section an article belongs to.
 */
import { api, BASE } from '../15-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')
const oi = process.argv.indexOf('--only')
const ONLY = oi > -1 ? process.argv[oi + 1] : null

const OG = '/admin/api/cms/plugins/webzite.open-graph/runtime'
const AEO = '/admin/api/cms/plugins/webzite.aeo-schema/runtime'
const PUBLIC = 'https://www.drnahlah.com'
const ORG = `${PUBLIC}/#organization`
const SITE = `${PUBLIC}/#website`

const tagOf = (block, prop) =>
  (new RegExp(`<meta property="${prop}" content="([^"]*)">`).exec(block || '') || [])[1] ?? ''

const decode = (s) => String(s || '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#x27;/gi, "'").replace(/&#39;/g, "'").replace(/&amp;/g, '&')

// ── read the site through the plugins ──────────────────────────────────────
const pagesRes = await api('GET', `${OG}/pages`)
const rows = pagesRes.pages ?? []
const ogSettings = pagesRes.settings ?? {}
const DEFAULT_IMAGE = String(ogSettings.defaultImage || '')

const { rows: postRows } = await api('GET', '/admin/api/cms/data/tables/posts/rows')
const topicOf = new Map(postRows.map((r) => [r.slug, r.cells.topic || '']))

console.log(`${rows.length} pages and articles`)

/* ── Open Graph ─────────────────────────────────────────────────────────── */

const pathOf = (row) => {
  const u = String(row.url || '')
  if (!u.startsWith(PUBLIC)) return row.kind === 'page' ? `/${row.slug}` : `/posts/${row.slug}`
  const p = u.slice(PUBLIC.length)
  return p === '' ? '/' : p
}

const ogPlan = []
const noDescription = []

if (ONLY !== 'aeo') {
  console.log('\nOpen Graph — deriving each page, then freezing it\n')
  for (const row of rows) {
    const path = pathOf(row)
    const had = row.override || {}
    let image = '', imageAlt = ''

    /* A hand-set picture WINS over anything derived, and this is not a nicety.
       `/preview` applies the existing override, so the home page — deliberately
       pointed at the doctor's portrait, which is also the fallback image —
       derives a value equal to the fallback, gets suppressed by the rule below,
       and comes out of this script with NO image at all. It would then fall
       back to the first picture on the page: a patient's before photograph, as
       the card for the practice's front door. Measured in the dry run. */
    if (had.image) {
      image = had.image
      imageAlt = had.imageAlt || ''
    } else {
      try {
        const html = await (await fetch(BASE + path)).text()
        const preview = await api('POST', `${OG}/preview`, { html, slug: row.slug })
        const derivedImage = decode(tagOf(preview.tags, 'og:image'))
        // Skip the fallback: eighty copies of one knob is not configuration.
        if (derivedImage && DEFAULT_IMAGE && !derivedImage.endsWith(DEFAULT_IMAGE)) {
          image = derivedImage
          imageAlt = decode(tagOf(preview.tags, 'og:image:alt'))
        }
      } catch (e) {
        console.log(`  !     ${path} — could not derive an image (${String(e.message).slice(0, 60)})`)
      }
    }

    const override = { key: row.key, title: row.seoTitle || row.title || '' }
    if (row.seoDescription) override.description = row.seoDescription
    else noDescription.push(row.key)
    if (image) { override.image = image; if (imageAlt) override.imageAlt = imageAlt }
    // Fields with no source in the CMS are a person's to set, so an existing
    // value survives a re-sync. Title and description are refreshed, because
    // refreshing them from the CMS is what this script is for.
    if (had.url) override.url = had.url
    override.type = had.type || (row.kind === 'entry' ? 'article' : 'website')

    ogPlan.push(override)
    console.log(`  ${override.image ? 'img' : '   '}  ${row.key.slice(0, 46).padEnd(48)} ` +
      `${(override.description ? 'desc' : 'NO DESC').padEnd(8)} ${override.type}`)
  }
}

/* ── schema ─────────────────────────────────────────────────────────────── */

/** Pages whose block was written by `push-aeo-content.mjs` — left alone. */
const KEEP = new Set([
  'dental-implant-faq',
  'dental-implants', 'all-on-4', 'implant-supported-dentures', 'crowns-and-bridges',
  'veneers', 'teeth-whitening', 'smile-makeover', 'cosmetic-dentistry',
  'oral-surgery', 'sedation-dentistry', 'emergency-dentistry',
])

const OFFICES = {
  'contact-maclean': `${PUBLIC}/contact-maclean#office`,
  'contact-alexandria': `${PUBLIC}/contact-alexandria#office`,
}

/** The block for one PAGE (not an article). `null` means "nothing to add". */
function pageBlock (row) {
  const url = row.url || `${PUBLIC}/${row.slug}`
  const name = row.seoTitle || row.title || row.slug
  /* `#webpage` is the id the GENERATOR already gives this page's WebPage node,
     and reusing it is deliberate. Two nodes sharing an `@id` in one graph are
     merged by every consumer, so this block EXTENDS the generated node instead
     of sitting beside it as a second one. Without that, `/privacy-policy`
     published `WebPage, WebPage` — not invalid, but two half-descriptions of
     one page where there should be one whole. The merged `@type` becomes
     `["WebPage", "AboutPage"]`, which is exactly right: AboutPage is a subtype
     of WebPage and the page is both. */
  const base = (type, extra) => Object.assign(
    { '@type': type, '@id': `${url}#webpage`, url, name, isPartOf: { '@id': SITE }, publisher: { '@id': ORG }, inLanguage: 'en-US' },
    extra || {},
  )

  switch (row.slug) {
    case 'index':
      // What the practice offers, as one catalogue. The single most useful
      // thing an answer engine can read off a clinic's home page.
      return {
        '@type': 'OfferCatalog',
        '@id': `${PUBLIC}/#services`,
        name: 'Treatments',
        provider: { '@id': ORG },
        itemListElement: [
          ['Dental implants', '/dental-implants'],
          ['All-on-4 full-arch implants', '/all-on-4'],
          ['Implant-supported dentures', '/implant-supported-dentures'],
          ['Crowns and bridges', '/crowns-and-bridges'],
          ['Porcelain veneers', '/veneers'],
          ['Teeth whitening', '/teeth-whitening'],
          ['Smile makeover', '/smile-makeover'],
          ['Oral surgery', '/oral-surgery'],
          ['Sedation dentistry', '/sedation-dentistry'],
          ['Emergency dental care', '/emergency-dentistry'],
        ].map(([label, href]) => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'MedicalProcedure', name: label, url: PUBLIC + href },
        })),
      }

    case 'about':
    case 'our-team':
    case 'our-facility':
      return base('AboutPage', { about: { '@id': ORG } })

    case 'meet-dr-nahlah':
      return [
        base('AboutPage', { about: { '@id': `${PUBLIC}/meet-dr-nahlah#person` } }),
        {
          '@type': 'Person',
          '@id': `${PUBLIC}/meet-dr-nahlah#person`,
          name: 'Dr. Esam Nahlah',
          honorificSuffix: 'DDS, MS',
          jobTitle: 'Board-certified prosthodontist',
          url: `${PUBLIC}/meet-dr-nahlah`,
          worksFor: { '@id': ORG },
          // Only what the site states on this page in prose.
          knowsAbout: ['Dental implants', 'Prosthodontics', 'Full-mouth reconstruction'],
        },
      ]

    case 'contact':
      return base('ContactPage', { about: { '@id': ORG } })
    case 'contact-maclean':
    case 'contact-alexandria':
      return base('ContactPage', { about: { '@id': OFFICES[row.slug] } })

    case 'posts':
      return base('CollectionPage', { about: { '@id': ORG }, mainEntity: { '@type': 'Blog', '@id': `${PUBLIC}/posts#blog`, name, publisher: { '@id': ORG } } })

    case 'patient-stories':
    case 'smile-gallery':
    case 'video-library':
      return base('CollectionPage', { about: { '@id': ORG } })

    case 'dental-conditions':
      return base('MedicalWebPage', { specialty: 'Prosthodontics', audience: { '@type': 'MedicalAudience', audienceType: 'Patient' } })

    case 'doctor-referral':
      // The one page written for clinicians rather than patients.
      return base('MedicalWebPage', { specialty: 'Prosthodontics', audience: { '@type': 'MedicalAudience', audienceType: 'Physician' } })

    case 'implant-cost':
    case 'financing':
    case 'patient-center':
      return base('WebPage', { about: { '@id': ORG } })

    default:
      // Legal and utility pages. `dateModified` is real data the generator does
      // not emit for pages, and it is the one thing worth saying about a
      // privacy policy.
      return base('WebPage')
  }
}

/** The block for one journal article. */
function articleBlock (row) {
  const url = row.url || `${PUBLIC}/posts/${row.slug}`
  const topic = topicOf.get(row.slug) || ''
  const block = {
    // Same `@id` as the generated Article node, on purpose: the two merge into
    // one entity typed `["Article", "BlogPosting"]` rather than publishing the
    // same article twice under two ids. BlogPosting is a subtype of Article.
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    url,
    headline: String(row.seoTitle || row.title || '').slice(0, 110),
    mainEntityOfPage: { '@id': `${url}#webpage` },
    isPartOf: { '@id': `${PUBLIC}/posts#blog` },
    publisher: { '@id': ORG },
    author: { '@id': ORG },
    inLanguage: 'en-US',
  }
  if (row.seoDescription) block.description = row.seoDescription
  // The section is the row's own `topic` cell — the taxonomy the /posts filter
  // already uses, so the schema and the visible chip cannot disagree.
  if (topic) block.articleSection = topic
  return block
}

const aeoPlan = []
if (ONLY !== 'og') {
  console.log('\nSchema — one block per page\n')
  for (const row of rows) {
    if (KEEP.has(row.key)) { console.log(`  keep  ${row.key.padEnd(48)} ${(row.types || []).join(', ')}`); continue }
    const json = row.kind === 'entry' ? articleBlock(row) : pageBlock(row)
    if (!json) continue
    const types = (Array.isArray(json) ? json : [json]).map((n) => n['@type'])
    aeoPlan.push({ key: row.key, json, note: 'populate-seo, session 21' })
    console.log(`   +    ${row.key.slice(0, 46).padEnd(48)} ${types.join(', ')}`)
  }
}

/* ── report / write ─────────────────────────────────────────────────────── */

console.log(`\n${ogPlan.length} Open Graph overrides · ${aeoPlan.length} schema blocks`)
if (noDescription.length) {
  console.log(`\n${noDescription.length} page(s) have NO seoDescription, so their og:description is left ` +
    'deriving rather than frozen to the site-wide sentence:')
  for (const k of noDescription) console.log(`  ${k}`)
}

if (!APPLY) { console.log('\nDRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }

let ogOk = 0
const failed = []
for (const o of ogPlan) {
  try {
    const res = await api('POST', `${OG}/override`, o)
    if (res.saved !== 1) throw new Error(JSON.stringify(res).slice(0, 120))
    ogOk++
  } catch (e) { failed.push(`og ${o.key}: ${String(e.message).slice(0, 120)}`) }
}
if (ogPlan.length) console.log(`\nOpen Graph  ${ogOk}/${ogPlan.length} written`)

let aeoOk = 0
for (const a of aeoPlan) {
  try {
    const res = await api('POST', `${AEO}/entry`, { key: a.key, json: JSON.stringify(a.json), note: a.note, enabled: true })
    if (res.saved !== 1) throw new Error(JSON.stringify(res).slice(0, 120))
    aeoOk++
  } catch (e) { failed.push(`aeo ${a.key}: ${String(e.message).slice(0, 160)}`) }
}
if (aeoPlan.length) console.log(`Schema      ${aeoOk}/${aeoPlan.length} written`)

if (failed.length) {
  console.error(`\n${failed.length} failure(s):`)
  for (const f of failed) console.error(`  ${f}`)
  process.exit(1)
}

// Read back through the same surfaces.
const back = await api('GET', `${OG}/pages`)
const withOverride = (back.pages ?? []).filter((p) => p.override).length
const audit = await api('GET', `${AEO}/audit`)
console.log(`\nread back   ${withOverride}/${(back.pages ?? []).length} pages carry an Open Graph override`)
console.log(`            ${audit.withBlock}/${audit.total} pages carry a schema block`)
console.log(`            types: ${Object.entries(audit.types).map(([k, v]) => `${k} ${v}`).join(' · ')}`)
if (audit.withoutBlock.length) console.log(`            without a block: ${audit.withoutBlock.join(', ')}`)

console.log('\nWritten to both plugins. Publish to put it on the live pages.')
