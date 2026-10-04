#!/usr/bin/env node
/**
 * dni-proof.mjs - does the GoHighLevel dynamic-number pool actually SWAP a telephone number on
 * these pages, or does the tag merely load?
 *
 * One gate since 2026-09-28, merging tools/instatic-site/gates/dni-proof.mjs and the scenario 3
 * copy (which added --combo). Origin: bk-dr-nahlah, workflows/22-instatic-api-sync/dni-proof.mjs
 * (2026-09-22). No hardcoded origin: CHROME_PATH is honoured and the relay's Origin header is the
 * page being tested. Proving DNI burns real pool numbers: never clear cookies per page, and prove on
 * the deployed domain (a staging subdomain passes production host gates).
 *
 * The two LeadConnector tags reach every page through the site's scripts (Instatic: the Embed
 * Origins plugin's siteScripts; Webflow: registered scripts). That proves delivery and nothing
 * else. The swap only happens if:
 *   1. the pool script executes (it is async, and reads document.currentScript.src to find its
 *      own locationId/poolId);
 *   2. POST services.leadconnectorhq.com/phone-system/number-pools/assign-number answers with
 *      isActive: true and a forwardingNumber list;
 *   3. one of those numbers is on the page in a format replaceNumber recognises. In TEXT:
 *        (555) 123-4567   555-123-4567   555.123.4567   (555)123-4567
 *      plus the raw national / international strings GHL returns. NOT 555 123 4567 (spaces), a
 *      nbsp after the area code, an en dash, or bare digits in text. In an <a href> bare digits
 *      match, so tel:+15551234567 works. Anything inside class="noswap" is left alone.
 * A page that swaps nothing and logs "no swap" is a pool switched off in GoHighLevel (or a
 * connect-src missing services.leadconnectorhq.com), not a tag missing from the site.
 *
 * Rules this harness keeps (each one cost a day):
 *   - ONE visitor for the whole run. Clearing cookies per page claims a new pool number each time
 *     and exhausts the pool; later assign-number calls are refused and it reads as a broken swap.
 *   - The before-baseline is a separate fetch of the server HTML, never the live DOM: a cached
 *     second view swaps before any sensible wait.
 *   - --relay: NordVPN Threat Protection fails the pool's calls inside Chrome ("Failed to fetch")
 *     while Node reaches them. The real request goes out through Node; only the transport changes.
 *     Since 2026-09-22 the tags are no longer consent-held by client instruction, so --relay is
 *     the normal run on this workstation.
 *   - --accept: click Termly's Accept first, for a site that consent-holds the pool tags
 *     (type="text/plain" data-categories="advertising"). With no banner (Termly blocked on this
 *     network) it releases the held scripts by hand, the way Termly does on Accept.
 *
 *   node dni-proof.mjs [--relay|--accept] <url> [url...]                    > output/dni.log 2>&1
 *   node dni-proof.mjs [--relay|--accept] --combo combo.json [--origin ...]  > output/dni.log 2>&1   (needs tools/ads-combo)
 *
 * Redirect stdout to a file, never pipe it. Exit 1 when nothing swapped.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

const argv = process.argv.slice(2)
const val = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null }
const ACCEPT = argv.includes('--accept')
const RELAY = ACCEPT || argv.includes('--relay')
let TARGETS
if (val('--combo')) {
  const { loadCombo, comboUrls } = await import('../../ads-combo/lib/combo.mjs')
  TARGETS = comboUrls(loadCombo(val('--combo'), val('--origin'))).map((u) => u.url)
} else TARGETS = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--origin')
if (!TARGETS.length) { console.error('usage: dni-proof.mjs [--relay|--accept] <url> [url...] | --combo combo.json [--origin ...]'); process.exit(2) }

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const PORT = 9800 + Math.floor(Math.random() * 150)
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-dni-'))
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--remote-debugging-port=' + PORT, '--remote-allow-origins=*',
  '--window-size=1440,900', '--no-first-run', '--no-default-browser-check',
  '--user-data-dir=' + profile, 'about:blank',
], { stdio: 'ignore' })
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
    let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => { try { res(JSON.parse(d)) } catch (e) { rej(e) } })
  }).on('error', rej)
})
let wsUrl
for (let i = 0; i < 150 && !wsUrl; i++) {
  try { wsUrl = (await getJSON('/json/version')).webSocketDebuggerUrl } catch { await wait(300) }
}
if (!wsUrl) { console.error('Chrome did not start: set CHROME_PATH'); chrome.kill(); process.exit(2) }
const ws = new WebSocket(wsUrl)
let id = 0
let pageOrigin = new URL(TARGETS[0]).origin
const pending = new Map()
const logs = []
const calls = []
const reqUrls = new Map()
ws.addEventListener('message', async (ev) => {
  const m = JSON.parse(typeof ev.data === 'string' ? ev.data : await ev.data.text())
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return }
  if (m.method === 'Fetch.requestPaused') {
    const q = m.params.request
    try {
      const r = await fetch(q.url, { method: q.method, headers: { 'content-type': 'application/json', origin: pageOrigin }, body: q.postData })
      const body = Buffer.from(await r.arrayBuffer())
      calls.push(r.status + ' ' + q.url + ' (relayed through Node)')
      await send('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: r.status, responseHeaders: [
        { name: 'content-type', value: r.headers.get('content-type') || 'application/json' },
        { name: 'access-control-allow-origin', value: '*' },
        { name: 'access-control-allow-headers', value: 'content-type' }, // the pool POSTs JSON: answer the preflight too
        { name: 'access-control-allow-methods', value: 'GET, POST, OPTIONS' }], body: body.toString('base64') }, m.sessionId)
    } catch (e) {
      calls.push('RELAY FAILED ' + q.url + ' ' + e.message)
      await send('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'Failed' }, m.sessionId)
    }
    return
  }
  if (m.method === 'Runtime.consoleAPICalled') logs.push(m.params.args.map((a) => a.value ?? a.description ?? JSON.stringify(a.preview ?? '')).join(' '))
  if (m.method === 'Network.responseReceived' && /leadconnectorhq|number-pools|user_session/.test(m.params.response.url)) calls.push(m.params.response.status + ' ' + m.params.response.url)
  if (m.method === 'Network.requestWillBeSent') reqUrls.set(m.params.requestId, m.params.request.url)
  if (m.method === 'Network.loadingFailed') {
    const u = reqUrls.get(m.params.requestId) || ''
    if (m.params.type === 'Script' || /leadconnectorhq|msgsndr/.test(u))
      calls.push(`FAILED ${m.params.type} ${m.params.errorText || ''} ${m.params.blockedReason || ''} ${m.params.corsErrorStatus ? JSON.stringify(m.params.corsErrorStatus) : ''} ${u || 'req=' + m.params.requestId}`)
  }
})
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
const send = (method, params = {}, sid) => new Promise((res, rej) => {
  const mid = ++id
  const t = setTimeout(() => rej(new Error('timeout ' + method)), 60000)
  pending.set(mid, (m) => { clearTimeout(t); m.error ? rej(new Error(m.error.message)) : res(m.result) })
  ws.send(JSON.stringify({ id: mid, method, params, sessionId: sid }))
})
const { targetInfos } = await send('Target.getTargets')
let pt = targetInfos.find((t) => t.type === 'page')
if (!pt) pt = { targetId: (await send('Target.createTarget', { url: 'about:blank' })).targetId }
const { sessionId } = await send('Target.attachToTarget', { targetId: pt.targetId, flatten: true })
const S = (m, p = {}) => send(m, p, sessionId)
await S('Page.enable'); await S('Runtime.enable'); await S('Network.enable')
if (RELAY) await S('Fetch.enable', { patterns: [{ urlPattern: 'https://services.leadconnectorhq.com/*' }] })
// A real Chrome UA: the HeadlessChrome string is refused by some third parties (Vimeo 401s).
await S('Network.setUserAgentOverride', { userAgent: UA })
const evalJs = async (expression) => {
  const r = await S('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text)
  return r.result.value
}

/* Every telephone number visible as text, and every tel: href, with a count. */
const SNAPSHOT = `(function(){
  var rx = /(?:\\+?1[ .-]?)?\\(?\\d{3}\\)?[ .\\u00a0-]?\\d{3}[ .-]?\\d{4}/g, text = {}, href = {};
  var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
  while ((n = w.nextNode())) { var m = n.nodeValue.match(rx); if (m) m.forEach(function(x){ text[x] = (text[x]||0)+1 }) }
  [].forEach.call(document.querySelectorAll('a[href^="tel:"]'), function(a){ var h = a.getAttribute('href'); href[h] = (href[h]||0)+1 });
  return { text: text, href: href, poolScript: !!document.querySelector('script[src*="number_pool"]'),
           hasNumberPool: typeof window.numberPool !== 'undefined' };
})()`
/* Termly's banner Accept, by test id or label. Returns what it clicked, or null (no banner). */
const CLICK_ACCEPT = `(function(){
  var b = document.querySelector('[data-tid="banner-accept"]');
  if (!b) b = [].find.call(document.querySelectorAll('button'), function(x){ return /^\\s*accept( all)?\\s*$/i.test(x.textContent) });
  if (!b) return null; b.click(); return b.outerHTML.slice(0, 120);
})()`
const RELEASE_HELD = `(function(){ var n = 0;
  [].forEach.call(document.querySelectorAll('script[type="text/plain"][data-categories*="advertising"]'), function(s){
    var r = document.createElement('script'); r.src = s.getAttribute('src'); r.async = false; s.parentNode.insertBefore(r, s); n++ });
  return n })()`
const diff = (a, c) => [...new Set([...Object.keys(a), ...Object.keys(c)])].sort()
  .filter((k) => (a[k] || 0) !== (c[k] || 0)).map((k) => `${k}: ${a[k] || 0} -> ${c[k] || 0}`)
const serverNumbers = async (url) => {
  const html = await (await fetch(url, { headers: { 'user-agent': UA } })).text()
  const body = html.slice(html.indexOf('<body'))
  const text = {}, href = {}
  for (const m of body.matchAll(/(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}/g)) {
    if (body.lastIndexOf('>', m.index) > body.lastIndexOf('<', m.index)) text[m[0]] = (text[m[0]] || 0) + 1 // page text, not inside a tag
  }
  for (const m of body.matchAll(/href="(tel:[^"]+)"/g)) href[m[1]] = (href[m[1]] || 0) + 1
  return { text, href }
}

await S('Network.clearBrowserCookies') // once, then walk the site as one visitor
let anySwap = false, accepted = false
for (const url of TARGETS) {
  logs.length = 0; calls.length = 0
  pageOrigin = new URL(url).origin
  const before = await serverNumbers(url)
  await S('Page.navigate', { url })
  if (ACCEPT && !accepted) {
    let clicked = null
    for (let i = 0; i < 20 && !clicked; i++) { await wait(500); clicked = await evalJs(CLICK_ACCEPT) }
    console.log('\n  consent           : ' + (clicked ? 'accepted via ' + clicked : 'NO BANNER FOUND (Termly blocked on this network?)'))
    accepted = !!clicked
  }
  // Without Termly nothing remembers consent either, so release by hand on every page.
  if (ACCEPT && !accepted) console.log('  released by hand  : ' + (await evalJs(RELEASE_HELD)) + ' held advertising script(s)')
  await wait(11000) // the assign-number round trip
  const after = await evalJs(SNAPSHOT)
  const dT = diff(before.text, after.text), dH = diff(before.href, after.href)
  console.log('\n=== ' + url)
  console.log('  pool tag present  : ' + after.poolScript + '   window.numberPool: ' + after.hasNumberPool)
  console.log('  numbers in markup : ' + (Object.keys(before.text).sort().join(', ') || '(none)'))
  console.log('  tel: hrefs        : ' + (Object.keys(before.href).sort().join(', ') || '(none)'))
  console.log('  pool network      : ' + (calls.length ? calls.join('\n                      ') : '(no LeadConnector request)'))
  console.log('  pool console      : ' + (logs.filter((l) => /swap|cache|new data|active|pool/i.test(l)).join(' | ') || '(silent)'))
  if (dT.length || dH.length) { anySwap = true; console.log('  SWAPPED text      : ' + (dT.join(', ') || '(none)') + '\n  SWAPPED href      : ' + (dH.join(', ') || '(none)')) }
  else console.log('  SWAPPED           : NOTHING, every number on the page is unchanged')
}
console.log('\n' + (anySwap ? 'the pool is swapping' : 'the pool changed nothing: the tags deliver, GoHighLevel is not returning an active swap (or connect-src blocks services.leadconnectorhq.com)'))
ws.close()
chrome.kill()
process.exitCode = anySwap ? 0 : 1
