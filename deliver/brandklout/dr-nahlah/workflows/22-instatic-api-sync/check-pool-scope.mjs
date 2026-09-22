#!/usr/bin/env node
/**
 * check-pool-scope.mjs — every sitemap URL carries exactly the GoHighLevel
 * number pool it should, in the <head>: Alexandria's everywhere except the
 * Tysons ads landing pages, Tysons' on those nine only (2026-09-22). And
 * every LeadConnector tag must be a live `<script>`, never consent-held
 * `type="text/plain"`: the pools run whether or not the banner is accepted.
 *
 *   node check-pool-scope.mjs > .tmp/pool-scope.txt
 */
const ORIGIN = 'https://www.drnahlah.com'
const ALX = 'loc/2TREkW8S3atQcs063Pqq/pool/JwgT5kbiwBqLqoz0SpUl/number_pool.js'
const TYS = 'loc/xJDu1mFoW5jFYTNqmuk7/pool/YeoEOlrWx1ugHvOq8qoB/number_pool.js'
const isTysonsLp = (path) => /^\/ads-landing-pages\/tysons-/.test(path)

const urls = new Set([ORIGIN + '/'])
const sm = await (await fetch(ORIGIN + '/sitemap.xml')).text()
for (const m of sm.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.add(m[1].trim())
// The ads pages are noindex and may be absent from the sitemap; add all 18.
for (const o of ['alexandria', 'tysons']) for (const c of ['all-on-4', 'dental-implants', 'veneers'])
  for (const s of ['', '-consultation', '-thank-you']) urls.add(`${ORIGIN}/ads-landing-pages/${o}-${c}${s}`)

let bad = 0, n = 0, tys = 0
for (const url of urls) {
  const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'cb=' + Date.now())
  const html = await res.text()
  const head = html.split(/<\/head>/i)[0]
  const path = new URL(url).pathname
  const want = isTysonsLp(path) ? TYS : ALX
  const other = want === ALX ? TYS : ALX
  const inHead = head.split(want).length - 1
  const held = /<script[^>]*type="text\/plain"[^>]*leadconnectorhq/.test(head)
  // The pool's assign-number call must be allowed by the page's own CSP.
  const csp = (head.match(/http-equiv="Content-Security-Policy"\s+content="([^"]*)"/i) || [])[1] || ''
  const connect = (csp.split(';').map((d) => d.trim()).find((d) => d.startsWith('connect-src')) || '').split(/\s+/)
  const canCall = !csp || connect.includes('https:') || connect.includes('https://services.leadconnectorhq.com')
  const ok = res.status === 200 && inHead === 1 && !html.includes(other) && !held && canCall
  n++; if (isTysonsLp(path)) tys++
  if (!ok) { bad++; console.log(`FAIL ${res.status} ${path} want=${want === ALX ? 'alexandria' : 'tysons'} inHead=${inHead} other=${html.includes(other)} held=${held} canCall=${canCall}`) }
}
console.log(`${n} URLs, ${tys} Tysons LP, ${bad} failing`)
process.exit(bad ? 1 : 0)
