#!/usr/bin/env node
/**
 * verify-combo-live.mjs - prove every campaign combo on a PUBLISHED host with plain fetches
 * (no browser, runs anywhere). Works for Instatic and Webflow sites.
 *
 * Origin: dr-nahlah/workflows/22-instatic-api-sync/verify-ads-live.mjs (bk-dr-nahlah,
 * 2026-09-18), generalized from its hardcoded 18-page FORMS map to the combo manifest, plus the
 * checks later runs showed were missing: AdsBot crawlability (Stone Dental 2026-09-16), ad-named
 * classes (Mason Park 2026-09-18), thank-you with no form and a tel: link, sitemap exclusion,
 * DNI-safe phone formats (Dr. Nahlah 2026-09-22) and the form's redirect (check-ghl-form).
 *
 * Per page of every campaign:
 *   - answers 200 to a browser AND to AdsBot-Google with ?gclid=test&gad_source=1
 *     (a 404 or off-host redirect is "Destination not crawlable" in Google Ads);
 *   - noindex: a robots meta in the HTML, or (Instatic) a "r":"noindex" entry for the route in
 *     the runtime seo-head script; absent from /sitemap.xml;
 *   - landing + consultation carry this campaign's form id, the thank-you page carries NO form
 *     and at least one tel: link;
 *   - the landing page links to its consultation page (every CTA does on the reference);
 *   - no class or id named ad / ad-* / is-ad / *-ad (ad blockers collapse them);
 *   - every manifest tag string is in the page;
 *   - the manifest phone appears in a DNI-swappable format; a spaced or en-dash copy is flagged.
 * Per form: redirects to its campaign's thank-you on the production origin, save-and-exit off.
 *
 *   node verify-combo-live.mjs --combo combo.json [--origin https://staging.example.com] > output/verify-combo.log 2>&1
 *
 * On a staging origin the form-redirect check still expects the PRODUCTION thank-you URL.
 */
import { parseArgs, loadCombo, comboUrls, get, readGhlForm, pathOf, sameUrl, ADSBOT_UA } from '../../../tools/ads-combo/lib/combo.mjs'

const { flags } = parseArgs()
const c = loadCombo(flags.combo, flags.origin)
let fails = 0
const fail = (m) => { fails++; console.log('  FAIL ' + m) }
const warn = (m) => console.log('  warn ' + m)

const sitemap = (await get(c.origin + '/sitemap.xml', { follow: true })).body
const seoCache = new Map()
const digits = (c.phone || '').replace(/\D/g, '').slice(-10)

for (const u of comboUrls(c)) {
  const { status, location, body } = await get(u.url)
  console.log(`${status} ${u.path}  [${u.campaign.name} · ${u.kind}]`)
  if (status !== 200) { fail(`not 200${location ? ' (redirects to ' + location + ')' : ''}`); continue }
  const bot = await get(u.url + '?gclid=test&gad_source=1', { ua: ADSBOT_UA })
  if (bot.status !== 200) fail(`AdsBot-Google with ?gclid gets ${bot.status}${bot.location ? ' -> ' + bot.location : ''}`)
  if (!/<h1\b/i.test(body)) fail('no h1')

  // noindex: raw meta, or Instatic's runtime seo-head route map.
  const rawNoindex = /<meta[^>]*name="robots"[^>]*content="[^"]*noindex|<meta[^>]*content="[^"]*noindex[^"]*"[^>]*name="robots"/i.test(body)
  let runtimeNoindex = false
  const seo = /src="([^"]*seo-head[^"]*)"/.exec(body)?.[1]
  if (seo) {
    const src = new URL(seo, c.origin).href
    if (!seoCache.has(src)) seoCache.set(src, (await get(src, { follow: true })).body)
    const esc = u.path.replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&')
    runtimeNoindex = new RegExp(`"${esc}":\\{[^}]*"r":"noindex`).test(seoCache.get(src))
  }
  if (!rawNoindex && !runtimeNoindex) fail('not noindex (no robots meta, no seo-head route entry)')
  if (sitemap.includes(u.path + '<') || sitemap.includes(u.path + '/<')) fail('listed in /sitemap.xml')

  const form = `widget/form/${u.campaign.formId}`
  const anyForm = /leadconnectorhq\.com\/widget\/form\/|msgsndr\.com\/widget\/form\//.test(body)
  if (u.kind === 'thankYou') {
    if (anyForm) fail('thank-you page carries a lead form (it must be phone first, no form)')
    if (!/href="tel:/i.test(body)) fail('thank-you page has no tel: link')
  } else {
    if (!body.includes(form)) fail(`form ${u.campaign.formId} is not on the page`)
    const others = c.campaigns.filter((k) => k.formId !== u.campaign.formId && body.includes('widget/form/' + k.formId))
    if (others.length) fail(`carries another campaign's form: ${others.map((k) => k.name).join(', ')}`)
  }
  if (u.kind === 'landing') {
    const consult = pathOf(c, u.campaign.consultation)
    if (!body.includes(`href="${consult}"`) && !body.includes(`href="${c.origin}${consult}"`) && !body.includes(`href="${c.productionOrigin}${consult}"`))
      fail(`no link to its consultation page ${consult}`)
  }

  // Class and id names ad blockers hide.
  const bad = new Set()
  for (const m of body.matchAll(/\s(?:class|id)="([^"]*)"/g))
    for (const t of m[1].split(/\s+/)) if (/^(ads?|is-ads?|ads?[-_].*|.*[-_]ads?)$/i.test(t)) bad.add(t)
  if (bad.size) fail(`ad-blocker bait class/id names: ${[...bad].slice(0, 8).join(', ')} (rename to lp-*)`)

  for (const t of c.tags || []) if (!body.includes(t)) fail(`tag missing: ${t}`)

  if (digits) {
    const text = body.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ')
    const a = digits.slice(0, 3), b = digits.slice(3, 6), d = digits.slice(6)
    const swappable = [`(${a}) ${b}-${d}`, `${a}-${b}-${d}`, `${a}.${b}.${d}`, `(${a})${b}-${d}`]
    if (!swappable.some((f) => text.includes(f))) warn(`phone ${c.phone} not shown in a DNI-swappable format`)
    if (new RegExp(`${a}\\)?(\\s| )${b}(\\s| )${d}|${b}–${d}|\\(${a}\\) `).test(text)) warn('phone written with spaces, nbsp or an en dash: the number pool will not swap it')
  }
  const canon = /<link[^>]*rel="canonical"[^>]*href="([^"]+)"|<link[^>]*href="([^"]+)"[^>]*rel="canonical"/i.exec(body)
  if (canon) console.log(`       canonical ${canon[1] || canon[2]}`)
}

console.log('\nforms')
for (const k of c.campaigns) {
  const f = await readGhlForm(k.formId)
  const expect = c.productionOrigin + pathOf(c, k.thankYou)
  console.log(`  ${k.formId}  "${f.name ?? '?'}"  -> ${f.redirectUrl || '(no redirect)'}`)
  if (!f.ok) { fail('form payload not found'); continue }
  if (f.actionType !== '1' || !sameUrl(f.redirectUrl, expect)) fail(`${k.name}: form must redirect to ${expect}`)
  if (f.saveExit) fail(`${k.name}: save-and-exit is ON in GoHighLevel`)
}

console.log(fails ? `\n${fails} failure(s) on ${c.origin}` : `\nall ${c.campaigns.length} combo(s) verified on ${c.origin}`)
process.exitCode = fails ? 1 : 0
