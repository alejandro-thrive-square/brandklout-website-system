/**
 * Open Graph on STAGING: the share card is the practice's logo on white, not the first photo on the
 * page (the plugin's derived "lead image" was a patient's smile).
 *
 *   1. upload the card made by og-card.mjs (a new basename per re-cut — Instatic keeps media by name)
 *   2. configure brandklout.open-graph (installed from ../../16-instatic-plugins/open-graph)
 *   3. override `index` with the card, so the lead-image derivation never wins on the home page
 *   4. publish
 *
 * siteUrl is the STAGING host and emitCanonical is off: nothing on staging may point at production.
 *
 * Usage: INSTATIC_BASE_URL=https://staging.ifadentistry.com node home/set-og.mjs <card.png> [--apply]
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { api, requestForm, publish, BASE } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'
import { assertStaging } from './staging-only.mjs'

assertStaging(BASE)
const card = process.argv[2]
const apply = process.argv.includes('--apply')
if (!card) { console.error('usage: node home/set-og.mjs <card.png> [--apply]'); process.exit(2) }

const ID = 'brandklout.open-graph'
const ALT = 'Institute for Advanced Dentistry, Implant and Cosmetic Prosthodontics'
const name = path.basename(card)

const listed = await api('GET', '/admin/api/cms/media')
const assets = listed.assets ?? listed.rows ?? listed.items ?? []
let image = assets.find((a) => a.filename === name)?.publicPath
console.log(`card       ${image ?? `(not uploaded) ${name}`}`)
if (!apply) { console.log('dry run — re-run with --apply'); process.exit(0) }

if (!image) {
  const form = new FormData()
  form.append('file', new Blob([readFileSync(card)], { type: 'image/png' }), name)
  const res = await requestForm('/admin/api/cms/media', form)
  image = (res.asset ?? res).publicPath
  if (!image) throw new Error(`upload returned no publicPath: ${JSON.stringify(res).slice(0, 160)}`)
  console.log(`uploaded   ${image}`)
}

const want = {
  enabled: true,
  siteUrl: BASE,
  siteName: 'Institute for Advanced Dentistry',
  defaultImage: image,
  defaultImageAlt: ALT,
  defaultType: 'website',
  locale: 'en_US',
  twitterCard: 'summary_large_image',
  twitterSite: '',
  deriveFromPage: true,
  syncMetaDescription: true,
  emitCanonical: false,
}
const current = (await api('GET', `/admin/api/cms/plugins/${ID}/settings`)).settings ?? {}
const back = (await api('PUT', `/admin/api/cms/plugins/${ID}/settings`, { settings: { ...current, ...want } })).settings ?? {}
const missed = Object.keys(want).filter((k) => JSON.stringify(back[k]) !== JSON.stringify(want[k]))
if (missed.length) { console.error(`settings did not land: ${missed.join(', ')}`); process.exit(1) }
console.log('settings   written and read back')

const ov = await api('POST', `/admin/api/cms/plugins/${ID}/runtime/override`, { key: 'index', image, imageAlt: ALT })
console.log(`override   index saved=${ov.saved}`)

console.log(`publish    ${JSON.stringify(await publish())}`)
