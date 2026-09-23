#!/usr/bin/env node
/**
 * check-conversion.mjs - what can fire a conversion on each campaign's thank-you page?
 * New for scenario 3 (2026-09-23). Fetch only, no browser, no Google login.
 *
 * The conversion is a page view of the thank-you URL. It lives in the client's Google Ads, GTM or
 * GA4, which we usually cannot log in to, so this reads what is PUBLIC:
 *   - the tags on the thank-you page: GTM container ids, gtag ids (AW-… Google Ads, G-… GA4);
 *   - each GTM container's public gtm.js: which AW- / G- ids it loads, and whether the thank-you
 *     path appears in it (a GTM trigger on "Page Path equals /ads-landing-pages/thank-you-x").
 * It fails only when the thank-you page carries no Google tag at all. Otherwise it reports one of:
 *   AW tag + path in container -> a Google Ads conversion tag is wired to this page (likely good);
 *   AW tag, path absent        -> the trigger may be a regex/"contains"; confirm in GTM preview;
 *   GA4 only                   -> the conversion must be a GA4 key event imported into Google Ads;
 *                                 confirm with whoever owns the Ads account (Livewell is this case).
 * A green run is NOT proof the conversion counts. The proof is a test lead: submit the form on
 * the live landing page, land on the thank-you page, see the conversion in Google Ads / Tag
 * Assistant (see 03-qa-and-launch.md).
 *
 *   node check-conversion.mjs --combo combo.json [--origin …] > output/conversion.log 2>&1
 */
import { parseArgs, loadCombo, pathOf, get } from '../../../tools/ads-combo/lib/combo.mjs'

const { flags } = parseArgs()
const c = loadCombo(flags.combo, flags.origin)
const containers = new Map()
let bad = 0
for (const k of c.campaigns) {
  const path = pathOf(c, k.thankYou)
  const { status, body } = await get(c.origin + path, { follow: true })
  const gtm = [...new Set([...body.matchAll(/GTM-[A-Z0-9]{5,10}/g)].map((m) => m[0]))]
  const aw = new Set([...body.matchAll(/AW-\d{6,12}/g)].map((m) => m[0]))
  const ga = new Set([...body.matchAll(/\bG-[A-Z0-9]{8,12}\b/g)].map((m) => m[0]))
  let pathInContainer = false
  for (const id of gtm) {
    if (!containers.has(id)) containers.set(id, (await get(`https://www.googletagmanager.com/gtm.js?id=${id}`, { follow: true })).body)
    const js = containers.get(id)
    for (const m of js.matchAll(/AW-\d{6,12}/g)) aw.add(m[0])
    for (const m of js.matchAll(/\bG-[A-Z0-9]{8,12}\b/g)) ga.add(m[0])
    if (js.includes(k.thankYou)) pathInContainer = true
  }
  const verdict = !gtm.length && !aw.size && !ga.size ? 'FAIL no Google tag on the thank-you page'
    : aw.size && pathInContainer ? 'ok   Google Ads tag and a trigger naming this page'
    : aw.size ? 'check Google Ads tag present, this path not named in GTM: confirm the trigger in GTM preview'
    : 'check GA4 only: the conversion must be a GA4 key event imported into Google Ads, confirm with the Ads owner'
  if (verdict.startsWith('FAIL')) bad++
  console.log(`${status} ${path}  [${k.name}]`)
  console.log(`     GTM ${gtm.join(', ') || '-'} · Ads ${[...aw].join(', ') || '-'} · GA4 ${[...ga].join(', ') || '-'}`)
  console.log(`     ${verdict}${k.conversion ? '\n     manifest says: ' + k.conversion : ''}`)
}
process.exitCode = bad ? 1 : 0
