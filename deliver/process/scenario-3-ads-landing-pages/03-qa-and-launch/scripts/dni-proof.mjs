#!/usr/bin/env node
/**
 * dni-proof.mjs - does the GoHighLevel number pool actually SWAP a phone number on these pages,
 * or does the tag merely load?
 *
 * Origin: dr-nahlah/workflows/22-instatic-api-sync/dni-proof.mjs (bk-dr-nahlah, 2026-09-22).
 * Generalized: no hardcoded origin or Chrome path (CHROME_PATH), the relay's Origin header comes
 * from the page being tested, and --combo walks every campaign page as ONE visitor.
 *
 * The swap needs: the pool script to execute; POST services.leadconnectorhq.com/phone-system/
 * number-pools/assign-number to answer isActive with forwarding numbers; and one of those numbers
 * to be on the page in a format it recognises. In TEXT: (555) 123-4567, 555-123-4567,
 * 555.123.4567, (555)123-4567. NOT 555 123 4567, a nbsp after the area code, an en dash, or bare
 * digits. In an <a href> bare digits match, so tel:+15551234567 is fine. class="noswap" opts out.
 *
 * Rules this harness keeps (each one cost a day):
 *   - ONE visitor for the whole run. Clearing cookies per page claims a new pool number each time
 *     and exhausts the pool; later assign-number calls are refused and it reads as a broken swap.
 *   - The before-baseline is a separate fetch of the server HTML, never the live DOM (a cached
 *     second view swaps before any sensible wait).
 *   - --relay: NordVPN Threat Protection fails the pool's calls inside Chrome ("Failed to fetch")
 *     while Node reaches them. The real request goes out through Node; only transport changes.
 *   - --accept: click Termly's Accept first, for a site that consent-holds the pool tags.
 *
 *   node dni-proof.mjs [--relay|--accept] <url> [url...]                  > output/dni.log 2>&1
 *   node dni-proof.mjs [--relay|--accept] --combo combo.json [--origin …]  > output/dni.log 2>&1
 */
import { parseArgs, loadCombo, comboUrls, UA } from '../../../tools/ads-combo/lib/combo.mjs'
import { launch, wait } from '../../../tools/ads-combo/lib/cdp.mjs'

const { flags, rest } = parseArgs()
const TARGETS = flags.combo ? comboUrls(loadCombo(flags.combo, flags.origin)).map((u) => u.url) : rest
if (!TARGETS.length) { console.error('usage: dni-proof.mjs [--relay|--accept] <url>... | --combo combo.json'); process.exit(2) }
const ACCEPT = !!flags.accept
const RELAY = ACCEPT || !!flags.relay

const b = await launch({ width: 1440 })
const logs = [], calls = [], reqUrls = new Map()
let pageOrigin = new URL(TARGETS[0]).origin
b.on(async (m) => {
  if (m.method === 'Fetch.requestPaused') {
    const q = m.params.request
    try {
      const r = await fetch(q.url, { method: q.method, headers: { 'content-type': 'application/json', origin: pageOrigin }, body: q.postData })
      const body = Buffer.from(await r.arrayBuffer())
      calls.push(r.status + ' ' + q.url + ' (relayed through Node)')
      await b.send('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: r.status, responseHeaders: [
        { name: 'content-type', value: r.headers.get('content-type') || 'application/json' },
        { name: 'access-control-allow-origin', value: '*' },
        { name: 'access-control-allow-headers', value: 'content-type' }, // the pool POSTs JSON: answer the preflight too
        { name: 'access-control-allow-methods', value: 'GET, POST, OPTIONS' }], body: body.toString('base64') }, m.sessionId)
    } catch (e) {
      calls.push('RELAY FAILED ' + q.url + ' ' + e.message)
      await b.send('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'Failed' }, m.sessionId)
    }
    return
  }
  if (m.method === 'Runtime.consoleAPICalled') logs.push(m.params.args.map((a) => a.value ?? a.description ?? '').join(' '))
  if (m.method === 'Network.responseReceived' && /leadconnectorhq|number-pools|user_session/.test(m.params.response.url)) calls.push(m.params.response.status + ' ' + m.params.response.url)
  if (m.method === 'Network.requestWillBeSent') reqUrls.set(m.params.requestId, m.params.request.url)
  if (m.method === 'Network.loadingFailed') {
    const u = reqUrls.get(m.params.requestId) || ''
    if (/leadconnectorhq|msgsndr/.test(u)) calls.push(`FAILED ${m.params.type} ${m.params.errorText || ''} ${m.params.blockedReason || ''} ${u}`)
  }
})
if (RELAY) await b.S('Fetch.enable', { patterns: [{ urlPattern: 'https://services.leadconnectorhq.com/*' }] })

const SNAPSHOT = `(function(){
  var rx = /(?:\\+?1[ .-]?)?\\(?\\d{3}\\)?[ .\\u00a0-]?\\d{3}[ .-]?\\d{4}/g, text = {}, href = {};
  var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
  while ((n = w.nextNode())) { var m = n.nodeValue.match(rx); if (m) m.forEach(function(x){ text[x] = (text[x]||0)+1 }) }
  [].forEach.call(document.querySelectorAll('a[href^="tel:"]'), function(a){ var h = a.getAttribute('href'); href[h] = (href[h]||0)+1 });
  return { text: text, href: href, poolScript: !!document.querySelector('script[src*="number_pool"]') };
})()`
const CLICK_ACCEPT = `(function(){
  var b = document.querySelector('[data-tid="banner-accept"]');
  if (!b) b = [].find.call(document.querySelectorAll('button'), function(x){ return /^\\s*accept( all)?\\s*$/i.test(x.textContent) });
  if (!b) return null; b.click(); return b.outerHTML.slice(0, 120);
})()`
const diff = (a, c) => [...new Set([...Object.keys(a), ...Object.keys(c)])].sort().filter((k) => (a[k] || 0) !== (c[k] || 0)).map((k) => `${k}: ${a[k] || 0} -> ${c[k] || 0}`)
const serverNumbers = async (url) => {
  const html = await (await fetch(url, { headers: { 'user-agent': UA } })).text()
  const body = html.slice(html.indexOf('<body'))
  const text = {}, href = {}
  for (const m of body.matchAll(/(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}/g)) {
    if (body.lastIndexOf('>', m.index) > body.lastIndexOf('<', m.index)) text[m[0]] = (text[m[0]] || 0) + 1
  }
  for (const m of body.matchAll(/href="(tel:[^"]+)"/g)) href[m[1]] = (href[m[1]] || 0) + 1
  return { text, href }
}

await b.S('Network.clearBrowserCookies') // once, then walk as one visitor
let anySwap = false, accepted = false
for (const url of TARGETS) {
  logs.length = 0; calls.length = 0
  pageOrigin = new URL(url).origin
  const before = await serverNumbers(url)
  await b.S('Page.navigate', { url })
  if (ACCEPT && !accepted) {
    let clicked = null
    for (let i = 0; i < 20 && !clicked; i++) { await wait(500); clicked = await b.evalJs(CLICK_ACCEPT) }
    console.log('\n  consent           : ' + (clicked ? 'accepted via ' + clicked : 'NO BANNER FOUND (Termly blocked on this network?)'))
    accepted = !!clicked
  }
  if (ACCEPT && !accepted) {
    const n = await b.evalJs(`(function(){ var n = 0; [].forEach.call(document.querySelectorAll('script[type="text/plain"][data-categories*="advertising"]'), function(s){
      var r = document.createElement('script'); r.src = s.getAttribute('src'); r.async = false; s.parentNode.insertBefore(r, s); n++ }); return n })()`)
    console.log('  released by hand  : ' + n + ' held advertising script(s)')
  }
  await wait(11000) // the assign-number round trip
  const after = await b.evalJs(SNAPSHOT)
  const dT = diff(before.text, after.text), dH = diff(before.href, after.href)
  console.log('\n=== ' + url)
  console.log('  pool tag present  : ' + after.poolScript)
  console.log('  numbers in markup : ' + (Object.keys(before.text).sort().join(', ') || '(none)'))
  console.log('  tel: hrefs        : ' + (Object.keys(before.href).sort().join(', ') || '(none)'))
  console.log('  pool network      : ' + (calls.length ? calls.join('\n                      ') : '(no LeadConnector request)'))
  console.log('  pool console      : ' + (logs.filter((l) => /swap|cache|new data|active|pool/i.test(l)).join(' | ') || '(silent)'))
  if (dT.length || dH.length) { anySwap = true; console.log('  SWAPPED text      : ' + (dT.join(', ') || '(none)') + '\n  SWAPPED href      : ' + (dH.join(', ') || '(none)')) }
  else console.log('  SWAPPED           : NOTHING, every number on the page is unchanged')
}
console.log('\n' + (anySwap ? 'the pool is swapping' : 'the pool changed nothing: the tags deliver, GoHighLevel is not returning an active swap (or connect-src blocks services.leadconnectorhq.com)'))
b.close()
process.exitCode = anySwap ? 0 : 1
