#!/usr/bin/env node
/**
 * configure-seo-plugins.mjs — the BRANDKLOUT values for `brandklout.open-graph`
 * and `brandklout.aeo-schema`.
 *
 *   node configure-seo-plugins.mjs --to https://brandklout.ai            # diff only
 *   node configure-seo-plugins.mjs --to https://brandklout.ai --apply
 *   node configure-seo-plugins.mjs --to https://staging.brandklout.ai --apply
 *
 * The plugins ship with empty defaults on purpose — an address and a phone
 * number are facts about ONE business and have no place in a package another
 * client installs. This file is where the Brandklout facts live. It is
 * idempotent: a re-run prints `=` and writes nothing.
 *
 * ## Where these facts came from
 *
 * The address, the telephone and the YouTube channel are read off the site's
 * own published footer — the same strings a visitor sees. A LocalBusiness block
 * that disagrees with the page under it is worse than none, because it is the
 * machine-readable copy a directory will trust.
 *
 * ## Why the organisation is hand-written JSON
 *
 * The plugin's scalar fields have no ADDRESS. Brandklout has one, on every
 * page, so `organizationJson` is the field that can express it. It also lets
 * the type be `ProfessionalService` — a marketing agency, not a `Dentist`,
 * which is what the scalar `organizationType` list is built around.
 *
 * ## STAGING IS DIFFERENT, DELIBERATELY
 *
 * On a staging host `emitCanonical` is OFF **and `siteUrl` is the staging
 * host**. Staging is served `X-Robots-Tag: noindex` at the Cloudflare edge, and
 * `noindex` plus a link pointing at production is the one pairing Google can
 * resolve AGAINST production. A canonical is the obvious one; **`og:url` is the
 * one that gets missed**, because it is written from `siteUrl` and survives
 * `emitCanonical: false`. `verify-staging-clean.mjs` caught exactly that here on
 * 2026-09-22 and failed all three paths.
 *
 * The module doc's older note — "siteUrl copied verbatim is deliberate, it stops
 * Google indexing staging as a separate site" — is superseded by this. It was
 * written before the rendered-DOM gate existed. Never promote these settings
 * back to production: `configure-seo-plugins.mjs --to <production>` is how
 * production gets its own, and it derives them from the host it is given.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i === -1 ? d : argv[i + 1] }
const APPLY = argv.includes('--apply')
const TO = flag('to')
if (!TO) { console.error('usage: node configure-seo-plugins.mjs --to <url> [--apply]'); process.exit(2) }
const IS_STAGING = /^staging\./i.test(new URL(TO).hostname)

let dir = HERE
for (let i = 0; i < 10 && !existsSync(join(dir, '.env')); i++) dir = dirname(dir)
for (const line of readFileSync(join(dir, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const PRODUCTION = 'https://brandklout.ai'   // apex, matching PUBLIC_ORIGIN[0]
// On staging every emitted URL must point at STAGING, never at production —
// see the header. On production this is production.
const SITE = IS_STAGING ? TO.replace(/\/$/, '') : PRODUCTION
const NAME = 'BrandKlout'
const LOGO = '/uploads/IRnZUHyHfX3_bIIzkQF9q-BKFavIcon.jpg'
const DESC = 'BrandKlout helps dental practices become easier to find, trust and choose across Google, AI search, reputation, website conversion and paid growth.'

/** One office, as the published footer states it. */
const ORGANIZATION = {
  '@type': ['Organization', 'ProfessionalService'],
  '@id': `${SITE}/#organization`,
  name: NAME,
  url: `${SITE}/`,
  description: DESC,
  logo: { '@type': 'ImageObject', url: SITE + LOGO },
  image: SITE + LOGO,
  telephone: '+1-949-620-6929',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '15911 Pomona Rincon Rd, Suite 120B',
    addressLocality: 'Chino Hills',
    addressRegion: 'CA',
    postalCode: '91709',
    addressCountry: 'US',
  },
  areaServed: { '@type': 'Country', name: 'United States' },
  sameAs: ['https://www.youtube.com/@BrandKlout'],
}

const OPEN_GRAPH = {
  enabled: true,
  siteUrl: SITE,
  siteName: NAME,
  defaultImage: LOGO,
  defaultImageAlt: 'BrandKlout',
  defaultType: 'website',
  articleType: true,
  locale: 'en_US',
  twitterCard: 'summary_large_image',
  deriveFromPage: true,
  syncMetaDescription: true,
  // See the header: never on a noindexed host.
  emitCanonical: !IS_STAGING,
}

const AEO_SCHEMA = {
  enabled: true,
  siteUrl: SITE,
  siteName: NAME,
  organizationType: 'Organization',
  organizationName: NAME,
  logo: LOGO,
  telephone: '+1-949-620-6929',
  sameAs: 'https://www.youtube.com/@BrandKlout',
  organizationJson: JSON.stringify(ORGANIZATION, null, 2),
  emitOrganization: true,
  emitWebSite: true,
  emitWebPage: true,
  emitBreadcrumbs: true,
  emitArticle: true,
}

async function session(base) {
  const r = await fetch(base + '/admin/api/cms/login', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: base },
    body: JSON.stringify({ email: process.env.INSTATIC_EMAIL, password: process.env.INSTATIC_PASSWORD }),
  })
  if (!r.ok) throw new Error(`login ${r.status}`)
  let cookie = (r.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ')
  const su = await fetch(base + '/admin/api/cms/auth/step-up', {
    method: 'POST', headers: { 'content-type': 'application/json', cookie, origin: base },
    body: JSON.stringify({ password: process.env.INSTATIC_PASSWORD }),
  })
  const rot = (su.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0])
  if (rot.length) cookie = rot.join('; ')
  return cookie
}

const cookie = await session(TO)
console.log(`${TO}${IS_STAGING ? '   (staging: emitCanonical forced OFF)' : ''}\n`)

for (const [id, wanted] of [['brandklout.open-graph', OPEN_GRAPH], ['brandklout.aeo-schema', AEO_SCHEMA]]) {
  const cur = await (await fetch(`${TO}/admin/api/cms/plugins/${id}/settings`, { headers: { cookie, origin: TO } })).json()
  const have = cur.settings ?? cur ?? {}
  console.log(id)
  let changes = 0
  for (const [k, v] of Object.entries(wanted)) {
    const same = JSON.stringify(have[k]) === JSON.stringify(v)
    if (!same) changes++
    const shown = typeof v === 'string' && v.length > 60 ? v.slice(0, 57) + '…' : JSON.stringify(v)
    console.log(`  ${same ? '=' : '+'} ${k.padEnd(20)} ${String(shown).replace(/\n/g, ' ')}`)
  }
  if (!APPLY) { console.log(`  (${changes} change(s) — re-run with --apply)\n`); continue }
  const r = await fetch(`${TO}/admin/api/cms/plugins/${id}/settings`, {
    method: 'PUT', headers: { 'content-type': 'application/json', cookie, origin: TO },
    body: JSON.stringify({ settings: { ...have, ...wanted } }),
  })
  console.log(`  PUT ${r.status} ${r.ok ? 'OK' : (await r.text()).slice(0, 200)}\n`)
}
console.log('Settings take effect on the next PUBLISH — the tags are written into published pages.')
