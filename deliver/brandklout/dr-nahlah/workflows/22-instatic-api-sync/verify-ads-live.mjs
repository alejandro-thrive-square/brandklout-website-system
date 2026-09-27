#!/usr/bin/env node
/**
 * verify-ads-live.mjs — prove the eighteen ads landing pages on a PUBLISHED host.
 *
 *   node verify-ads-live.mjs https://staging.drnahlah.com
 *   node verify-ads-live.mjs https://www.drnahlah.com
 *
 * Plain fetches, no browser, so it can run anywhere. For each page: the nested
 * URL answers 200 (and the flattened one does NOT), the landing stylesheet is
 * linked and carries the `lp-` rules, this office's LeadConnector form id is in
 * the page inside the embed module's wrapper, the films are YouTube embeds,
 * every in-page link to another ads page is nested, the four site tags are in
 * the head, and the runtime SEO script knows the route (it writes the noindex
 * robots tag at runtime, so the tag itself cannot be seen from here).
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = (process.argv[2] ?? '').replace(/\/$/, '')
if (!BASE) { console.error('usage: verify-ads-live.mjs <https://host>'); process.exit(2) }
const HERE = dirname(fileURLToPath(import.meta.url))
const FORMS = {
  tysons: { 'all-on-4': 'd1IIoFqitmgu2zBvvmfw', 'dental-implants': 'ecngxD8mVLN8RZQBuzfm', veneers: 'o3KMlkYo1PxmoPpzZqwz' },
  alexandria: { 'all-on-4': '8jq7yzSeCzZrIkuA3sSG', 'dental-implants': '9i1Vz7wQjmn7v4NPwp3o', veneers: 'if9TqDr0uPYPs2Hiz3vr' },
}
const TAGS = ['app.termly.io/resource-blocker', 'googletagmanager.com/gtm.js?id=GTM-MR7K64XD', 'number_pool.js', 'user_session.js']
const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36' }
const get = async (p) => { const r = await fetch(BASE + p, { headers: UA, redirect: 'manual' }); return { status: r.status, body: await r.text() } }

let fails = 0
const fail = (m) => { fails++; console.log('  FAIL ' + m) }
const cssCache = new Map()
let seoHead = null

for (const office of ['alexandria', 'tysons']) for (const camp of ['all-on-4', 'dental-implants', 'veneers']) for (const kind of ['', '-consultation', '-thank-you']) {
  const slug = `ads-landing-pages/${office}-${camp}${kind}`
  const { status, body } = await get('/' + slug)
  console.log(`${status} /${slug}`)
  if (status !== 200) { fail('not 200'); continue }
  const flat = await get('/' + slug.replace('/', '-'))
  if (flat.status === 200) fail('flattened path ALSO answers 200')
  if (!/<h1\b/.test(body)) fail('no h1')
  if (!/class="[^"]*lp-nav/.test(body)) fail('no landing header (.lp-nav)')
  const css = [...body.matchAll(/href="(\/_instatic\/css\/userStyles[^"]+)"/g)].map((m) => m[1])
  if (!css.length) fail('no userStyles stylesheet linked (landing.css missing)')
  for (const c of css) {
    if (!cssCache.has(c)) cssCache.set(c, (await get(c)).body)
    if (!/\.lp-hero\{/.test(cssCache.get(c))) fail(`${c} has no .lp-hero rule`)
  }
  if (kind !== '-thank-you') {
    const id = FORMS[office][camp]
    if (!body.includes(`api.leadconnectorhq.com/widget/form/${id}`)) fail(`form ${id} not on the page`)
    if (!/data-wz-embed="auto"/.test(body)) fail('form is not inside the embed module wrapper')
    if (!/youtube\.com\/embed\//.test(body) && camp !== 'veneers') fail('no YouTube embed')
  }
  for (const m of body.matchAll(/href="(\/ads-[^"]+)"/g)) if (!m[1].startsWith('/ads-landing-pages/')) fail(`flat internal link ${m[1]}`)
  for (const t of TAGS) if (!body.includes(t)) fail(`site tag missing: ${t}`)
  const seo = /src="([^"]*seo-head[^"]*)"/.exec(body)?.[1]
  if (!seo) fail('seo-head.js not on the page')
  else {
    if (seoHead === null) seoHead = (await get(seo)).body
    if (!seoHead.includes(`"/${slug}":`)) fail('seo-head.js has no entry for this route (title/robots would be the site defaults)')
    else if (!new RegExp(`"/${slug.replace(/[/-]/g, (c) => '\\' + c)}":\\{[^}]*"r":"noindex`).test(seoHead)) fail('route is not noindex in seo-head.js')
  }
}
console.log(fails ? `\n${fails} failure(s)` : '\nall eighteen pages verified on ' + BASE)
process.exit(fails ? 1 : 0)
