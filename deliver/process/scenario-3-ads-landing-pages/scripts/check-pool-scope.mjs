#!/usr/bin/env node
/**
 * check-pool-scope.mjs - every URL of the site (sitemap + every combo page) carries exactly the
 * GoHighLevel number pools it should, and the page's CSP lets the pool call home.
 *
 * Origin: dr-nahlah/workflows/22-instatic-api-sync/check-pool-scope.mjs (bk-dr-nahlah,
 * 2026-09-22), generalized from two hardcoded pools and a Tysons-only rule to the manifest's
 * "pools" list: { src, pages: [globs], except: [globs] }, globs over the path without the
 * leading slash, "*" matching anything (the same shape embed-origins 1.8.0 uses for #pages= /
 * #except=). Set "poolsConsentHeld": true in combo.json when the client wants the pools held
 * for consent (Termly type="text/plain"); by default a held pool is a failure.
 *
 * Why the CSP check: on Instatic pages WITHOUT an Embed block the strict CSP refused
 * services.leadconnectorhq.com, so 79 of 97 Dr. Nahlah URLs never swapped while every tested
 * page (all with embeds) did. Put services.leadconnectorhq.com and services.msgsndr.com in the
 * Embed Origins connectOrigins.
 *
 *   node check-pool-scope.mjs --combo combo.json [--origin …] > .tmp/pool-scope.log 2>&1
 */
import { parseArgs, loadCombo, comboUrls, globMatch, UA } from './lib/combo.mjs'

const { flags } = parseArgs()
const c = loadCombo(flags.combo, flags.origin)
if (!c.pools?.length) { console.log('combo.json has no "pools": nothing to check'); process.exit(0) }

const urls = new Set([c.origin + '/'])
const sm = await (await fetch(c.origin + '/sitemap.xml', { headers: { 'user-agent': UA } })).text()
for (const m of sm.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.add(c.origin + new URL(m[1].trim()).pathname)
for (const u of comboUrls(c)) urls.add(u.url) // noindex pages are not in the sitemap

let bad = 0
for (const url of urls) {
  const res = await fetch(url + '?cb=' + Date.now(), { headers: { 'user-agent': UA } })
  const html = await res.text()
  const head = html.split(/<\/head>/i)[0]
  const path = new URL(url).pathname
  const issues = []
  for (const p of c.pools) {
    const want = (p.pages || ['*']).some((g) => globMatch(g, path)) && !(p.except || []).some((g) => globMatch(g, path))
    const n = html.split(p.src).length - 1
    if (want && n !== 1) issues.push(`${p.src.split('/pool/')[1] || p.src}: ${n} copies, want 1`)
    if (!want && n) issues.push(`${p.src.split('/pool/')[1] || p.src}: present, should not be`)
  }
  const held = /<script[^>]*type="text\/plain"[^>]*number_pool/.test(html)
  if (held && !c.poolsConsentHeld) issues.push('pool is consent-held (type="text/plain")')
  const csp = (head.match(/http-equiv="Content-Security-Policy"\s+content="([^"]*)"/i) || [])[1] || ''
  const connect = (csp.split(';').map((d) => d.trim()).find((d) => d.startsWith('connect-src')) || '').split(/\s+/)
  if (csp && !connect.includes('https:') && !connect.includes('https://services.leadconnectorhq.com')) issues.push('CSP connect-src blocks services.leadconnectorhq.com')
  if (res.status !== 200) issues.push('status ' + res.status)
  if (issues.length) { bad++; console.log(`FAIL ${path}  ${issues.join(' · ')}`) }
}
console.log(`${urls.size} URLs, ${bad} failing`)
process.exitCode = bad ? 1 : 0
