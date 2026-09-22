#!/usr/bin/env node
/**
 * dni-proof.mjs — does the GoHighLevel dynamic-number pool actually swap a
 * telephone number on this site, or does the tag merely load?
 *
 * The two LeadConnector tags have been in the Embed Origins plugin's
 * `siteScripts` since 2026-09-17 (see set-site-tags.mjs), so every page serves
 * them. That proves delivery and nothing else. The swap only happens if:
 *
 *   1. the pool script executes (it is `async`, and it reads
 *      `document.currentScript.src` to find its own locationId/poolId);
 *   2. POST services.leadconnectorhq.com/phone-system/number-pools/assign-number
 *      answers with `isActive: true` and a `forwardingNumber` list;
 *   3. one of those forwarding numbers is rendered on the page in a format its
 *      `replaceNumber` recognises. In TEXT it understands:
 *        (555) 123-4567   555-123-4567   555.123.4567   (555)123-4567
 *      plus the raw `national` / `international` strings GHL returns. It does
 *      NOT understand `555 123 4567` (spaces) or bare digits in text. In an
 *      `<a href>` it also matches bare digits, so `tel:+15551234567` works.
 *      Anything inside an element with class `noswap` is left alone.
 *
 * This drives real Chrome over CDP, snapshots every number on the page before
 * and after the pool has had its say, and reports the delta plus whatever the
 * script logged. A page that swaps nothing and logs "no swap" is a pool that is
 * switched off in GoHighLevel, not a tag that is missing from the site.
 *
 *   node dni-proof.mjs                       # production home page
 *   node dni-proof.mjs <url> [<url> ...]
 *   node dni-proof.mjs --accept <url> ...  # click the cookie banner's Accept first
 *   node dni-proof.mjs --relay <url> ...   # a visitor who never answers the banner
 *
 * UPDATE, later on 2026-09-22: by client instruction the tags are NO LONGER
 * consent-held, so `--relay` (no consent step) is the normal run on this
 * workstation. `--accept` is kept for a site that does hold them.
 * Since the Termly rollout (2026-09-22) both LeadConnector tags publish as
 * `type="text/plain" data-categories="advertising"`: they do not run at all
 * until the visitor accepts. Without --accept a fresh visitor proves only that
 * the hold works. With it, the harness accepts on the first page, as a person
 * would, and the rest of the walk carries that consent.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URLS = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const ACCEPT = process.argv.includes('--accept')
// --relay: only the Node relay for LeadConnector calls (see below), no consent step.
const RELAY = ACCEPT || process.argv.includes('--relay')
const TARGETS = URLS.length ? URLS : ['https://www.drnahlah.com/']

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const PORT = 9800 + Math.floor(Math.random() * 150)
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-dni-'))
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--remote-debugging-port=' + PORT, '--remote-allow-origins=*',
  '--window-size=1440,900', '--no-first-run', '--no-default-browser-check',
  '--user-data-dir=' + profile, 'about:blank',
])
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
    let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d)))
  }).on('error', rej)
})
let wsUrl
for (let i = 0; i < 150; i++) {
  try { const v = await getJSON('/json/version'); if (v.webSocketDebuggerUrl) { wsUrl = v.webSocketDebuggerUrl; break } } catch {}
  await wait(300)
}
const ws = new WebSocket(wsUrl)
let id = 0
const pending = new Map()
const logs = []
const calls = []
const reqUrls = new Map()
ws.addEventListener('message', async (ev) => {
  const raw = typeof ev.data === 'string' ? ev.data : await ev.data.text()
  const m = JSON.parse(raw)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return }
  /* --accept / --relay relay the pool's LeadConnector calls through Node: NordVPN
     Threat Protection fails them inside Chrome ("TypeError: Failed to fetch")
     while Node reaches them fine. The real request goes out and the real
     answer comes back; only the transport changes. */
  if (m.method === 'Fetch.requestPaused') {
    const q = m.params.request
    try {
      const r = await fetch(q.url, { method: q.method, headers: { 'content-type': 'application/json', origin: 'https://www.drnahlah.com' }, body: q.postData })
      const body = Buffer.from(await r.arrayBuffer())
      calls.push(r.status + ' ' + q.url + ' (relayed through Node)')
      await send('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: r.status,
        responseHeaders: [{ name: 'content-type', value: r.headers.get('content-type') || 'application/json' },
          { name: 'access-control-allow-origin', value: '*' },
          // The pool POSTs JSON, so Chrome preflights it; answer that too.
          { name: 'access-control-allow-headers', value: 'content-type' },
          { name: 'access-control-allow-methods', value: 'GET, POST, OPTIONS' }], body: body.toString('base64') }, m.sessionId)
    } catch (e) {
      calls.push('RELAY FAILED ' + q.url + ' ' + e.message)
      await send('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'Failed' }, m.sessionId)
    }
    return
  }
  if (m.method === 'Runtime.consoleAPICalled') {
    logs.push(m.params.args.map((a) => a.value ?? a.description ?? JSON.stringify(a.preview ?? '')).join(' '))
  }
  if (m.method === 'Network.responseReceived') {
    const u = m.params.response.url
    if (/leadconnectorhq|number-pools|user_session/.test(u)) calls.push(m.params.response.status + ' ' + u)
  }
  if (m.method === 'Network.requestWillBeSent') reqUrls.set(m.params.requestId, m.params.request.url)
  if (m.method === 'Network.loadingFailed') {
    const rid = m.params.requestId
    const u = reqUrls.get(rid) || ''
    if (m.params.type === 'Script' || /leadconnectorhq|msgsndr/.test(u))
      calls.push('FAILED ' + m.params.type + ' ' + (m.params.errorText || '') + ' ' + (m.params.blockedReason || '') + ' ' + (m.params.corsErrorStatus ? JSON.stringify(m.params.corsErrorStatus) : '') + ' ' + (u || 'req=' + rid))
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
await send('Page.enable', {}, sessionId)
await send('Runtime.enable', {}, sessionId)
await send('Network.enable', {}, sessionId)
if (RELAY) await send('Fetch.enable', { patterns: [{ urlPattern: 'https://services.leadconnectorhq.com/*' }] }, sessionId)
// A real Chrome UA: the HeadlessChrome string is refused by some of the third
// parties this site loads (see the Vimeo note in the runbook).
await send('Network.setUserAgentOverride', {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
}, sessionId)

const evalJs = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId)
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text)
  return r.result.value
}

/* Every telephone number visible as text, and every tel: href, with a count. */
const SNAPSHOT = [
  '(function(){',
  '  var rx = /(?:\\+?1[ .-]?)?\\(?\\d{3}\\)?[ .\\u00a0-]?\\d{3}[ .-]?\\d{4}/g;',
  '  var text = {}, href = {};',
  '  var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);',
  '  var n; while ((n = w.nextNode())) {',
  '    var m = n.nodeValue.match(rx);',
  '    if (m) m.forEach(function(x){ text[x] = (text[x]||0)+1 });',
  '  }',
  '  [].forEach.call(document.querySelectorAll(\'a[href^="tel:"]\'), function(a){',
  '    var h = a.getAttribute("href"); href[h] = (href[h]||0)+1;',
  '  });',
  '  return { text: text, href: href, poolScript: !!document.querySelector(\'script[src*="number_pool"]\'),',
  '           hasNumberPool: typeof window.numberPool !== "undefined" };',
  '})()',
].join('\n')

const diff = (a, b) => {
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  return keys.filter((k) => (a[k] || 0) !== (b[k] || 0))
    .map((k) => k + ': ' + (a[k] || 0) + ' -> ' + (b[k] || 0))
}

/* The baseline is the SERVER's markup, fetched out of band. Taking it from the
   live DOM is a trap: on a second page view the pool answers from its own
   localStorage cache and swaps before any wait you can sensibly pick, so the
   baseline already carries the swapped number and the page reads as inert. */
const serverNumbers = async (url) => {
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0.0.0 Safari/537.36' } })
  const html = await r.text()
  const body = html.slice(html.indexOf('<body'))
  const text = {}
  const href = {}
  for (const m of body.matchAll(/(?:\+?1[ .-]?)?\(?\d{3}\)?[ . -]?\d{3}[ .-]?\d{4}/g)) {
    // only count it as page text if it is not inside a tag
    const lt = body.lastIndexOf('<', m.index)
    const gt = body.lastIndexOf('>', m.index)
    if (gt > lt) text[m[0]] = (text[m[0]] || 0) + 1
  }
  for (const m of body.matchAll(/href="(tel:[^"]+)"/g)) href[m[1]] = (href[m[1]] || 0) + 1
  return { text, href }
}

/* ONE visitor for the whole run. Clearing cookies between pages makes the pool
   treat each page view as a new visitor and hand out a NEW tracking number, and
   a pool holds only a handful: three runs of five pages will exhaust it and
   every later assign-number is refused at the network layer, which reads as a
   broken swap when it is only this harness burning the inventory. Clear once,
   then walk the site the way a person does. */
await send('Network.clearBrowserCookies', {}, sessionId)

/* Termly's banner Accept, found by its test id or its label. Returns what it
   clicked, or null when there was no banner (consent already given). */
const CLICK_ACCEPT = `(function(){
  var b = document.querySelector('[data-tid="banner-accept"]');
  if (!b) b = [].find.call(document.querySelectorAll('button'), function(x){ return /^\\s*accept( all)?\\s*$/i.test(x.textContent) });
  if (!b) return null;
  b.click(); return b.outerHTML.slice(0, 120);
})()`

let anySwap = false
let accepted = false
for (const url of TARGETS) {
  logs.length = 0
  calls.length = 0
  const before = await serverNumbers(url)
  await send('Page.navigate', { url }, sessionId)
  if (ACCEPT && !accepted) {
    let clicked = null
    for (let i = 0; i < 20 && !clicked; i++) { await wait(500); clicked = await evalJs(CLICK_ACCEPT) }
    console.log('\n  consent           : ' + (clicked ? 'accepted via ' + clicked : 'NO BANNER FOUND'))
    accepted = !!clicked
  }
  /* No banner means Termly never ran (NordVPN Threat Protection blocks it in
     Chrome on the workstation), so nothing will ever release the held tags.
     Release them the way Termly does on Accept: a live copy of each
     `type="text/plain"` advertising script. That proves the pools and the
     page, not the banner. Done on every page, since without Termly no consent
     is remembered either. */
  if (ACCEPT && !accepted) {
    const released = await evalJs(`(function(){
      var n = 0;
      [].forEach.call(document.querySelectorAll('script[type="text/plain"][data-categories*="advertising"]'), function(s){
        var r = document.createElement('script'); r.src = s.getAttribute('src'); r.async = false;
        s.parentNode.insertBefore(r, s); n++;
      });
      return n;
    })()`)
    console.log('  released by hand  : ' + released + ' held advertising script(s)')
  }
  await wait(11000)                          // the assign-number round trip
  const after = await evalJs(SNAPSHOT)

  const dText = diff(before.text, after.text)
  const dHref = diff(before.href, after.href)
  console.log('\n=== ' + url)
  console.log('  pool tag present  : ' + after.poolScript + '   window.numberPool: ' + after.hasNumberPool)
  console.log('  numbers in markup : ' + (Object.keys(before.text).sort().join(', ') || '(none)'))
  console.log('  tel: hrefs        : ' + (Object.keys(before.href).sort().join(', ') || '(none)'))
  console.log('  pool network      : ' + (calls.length ? calls.join('\n                      ') : '(no LeadConnector request)'))
  console.log('  pool console      : ' + (logs.filter((l) => /swap|cache|new data|active|pool/i.test(l)).join(' | ') || '(silent)'))
  if (dText.length || dHref.length) {
    anySwap = true
    console.log('  SWAPPED text      : ' + (dText.join(', ') || '(none)'))
    console.log('  SWAPPED href      : ' + (dHref.join(', ') || '(none)'))
  } else {
    console.log('  SWAPPED           : NOTHING — every number on the page is unchanged')
  }
}
console.log('\n' + (anySwap
  ? 'the pool is swapping'
  : 'the pool changed nothing: the tags deliver, GoHighLevel is not returning an active swap'))
ws.close()
chrome.kill()
