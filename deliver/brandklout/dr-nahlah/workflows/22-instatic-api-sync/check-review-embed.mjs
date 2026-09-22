#!/usr/bin/env node
/**
 * check-review-embed.mjs — is the ReputationHub embed on the home page actually
 * SHOWING reviews, or is it a collapsed empty frame?
 *
 * This matters more since 2026-09-22, when the card wall came off the home page
 * and the embed became the only reviews there. On 2026-09-21 the widget's own
 * server-rendered payload was returning `reviews: []` — no review source
 * connected at the vendor — and the frame collapsed to about 91px. With the
 * cards gone there is nothing behind it, so an empty widget is now a visibly
 * empty section rather than a harmless upgrade that did not happen.
 *
 * Two independent readings, because either alone can mislead:
 *   1. the widget URL fetched directly, counting itemprop="reviewBody" in the
 *      server-rendered microdata — the vendor's own answer, no browser;
 *   2. the rendered height of the iframe on the live page, which is what a
 *      visitor sees, and the height of the section around it.
 *
 *   node check-review-embed.mjs [url]
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'

const PAGE = process.argv[2] || 'https://www.drnahlah.com/'
const WIDGET = 'https://reputationhub.site/reputation/widgets/review_widget/' +
  'xJDu1mFoW5jFYTNqmuk7?widgetId=6a7340db2bbe7819cc3536f4'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

// ── 1. the vendor's own payload ────────────────────────────────────────────
const r = await fetch(WIDGET, { headers: { 'user-agent': UA } })
const html = await r.text()
const bodies = [...html.matchAll(/itemprop="reviewBody"/g)].length
const authors = [...html.matchAll(/itemprop="author"/g)].length
console.log('widget payload  : ' + r.status + ', ' + html.length + ' bytes, ' +
  bodies + ' reviewBody, ' + authors + ' author')
if (!bodies) {
  console.log('                  NO REVIEWS IN THE PAYLOAD — the frame will render empty')
}

// ── 2. what it looks like on the page ──────────────────────────────────────
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const wait = (ms) => new Promise((res) => setTimeout(res, ms))
const PORT = 9400 + Math.floor(Math.random() * 150)
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-rve-'))
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--remote-debugging-port=' + PORT, '--remote-allow-origins=*',
  '--window-size=1440,900', '--no-first-run', '--no-default-browser-check',
  '--user-data-dir=' + profile, 'about:blank',
])
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (x) => {
    let d = ''; x.on('data', (c) => (d += c)); x.on('end', () => res(JSON.parse(d)))
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
ws.addEventListener('message', async (ev) => {
  const raw = typeof ev.data === 'string' ? ev.data : await ev.data.text()
  const m = JSON.parse(raw)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
})
await new Promise((res) => ws.addEventListener('open', res, { once: true }))
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
await send('Network.setUserAgentOverride', { userAgent: UA }, sessionId)
const evalJs = async (expr) => {
  const x = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId)
  if (x.exceptionDetails) throw new Error(x.exceptionDetails.text)
  return x.result.value
}
await send('Page.navigate', { url: PAGE }, sessionId)
await wait(3000)
await evalJs('document.documentElement.style.scrollBehavior="auto";' +
  '(document.querySelector("#reviews")||document.body).scrollIntoView()')
await wait(7000)

const seen = await evalJs([
  '(function(){',
  '  var f = document.querySelector(\'iframe[src*="reputationhub"]\');',
  '  var sec = document.querySelector("#reviews") || document.querySelector(".pf-reviews");',
  '  var box = function(el){ if(!el) return null; var r = el.getBoundingClientRect();',
  '    return { w: Math.round(r.width), h: Math.round(r.height) }; };',
  '  return { iframe: box(f), section: box(sec),',
  '           sectionText: sec ? sec.innerText.replace(/\\s+/g," ").trim().slice(0,160) : null };',
  '})()',
].join('\n'))

console.log('iframe on page  : ' + JSON.stringify(seen.iframe))
console.log('section on page : ' + JSON.stringify(seen.section))
console.log('section text    : ' + JSON.stringify(seen.sectionText))

const h = seen.iframe && seen.iframe.h
const verdict = !seen.iframe ? 'NO IFRAME — the section has no reviews at all'
  : !bodies ? 'EMPTY WIDGET — the vendor is serving no reviews; the section is a hole'
  : h < 200 ? 'COLLAPSED — the frame is ' + h + 'px, too short to be showing reviews'
  : 'the embed is showing reviews (' + bodies + ' in the payload, frame ' + h + 'px)'
console.log('\n' + verdict)
ws.close()
chrome.kill()
process.exit(seen.iframe && bodies && h >= 200 ? 0 : 1)
