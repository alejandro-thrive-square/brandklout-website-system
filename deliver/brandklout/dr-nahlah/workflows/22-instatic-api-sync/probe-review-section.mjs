#!/usr/bin/env node
/**
 * probe-review-section.mjs — what does chapter 07 of the live home page
 * actually show a visitor: the six hand-built `.rv-card`s, the ReputationHub
 * embed, or both?
 *
 * The build ships both on purpose: cards first, and `.rv-live` upgrades over
 * them wherever the host allows a third-party frame (`ch-proof.js`). On
 * Instatic the frame was historically impossible, so the widget was removed
 * without trace and the cards were what stayed. That reasoning predates the
 * Embed Origins plugin's `frameOrigins`, so it has to be re-checked against the
 * live page rather than assumed.
 *
 *   node probe-review-section.mjs [url]
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'

const URL_ = process.argv[2] || 'https://www.drnahlah.com/'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const PORT = 9600 + Math.floor(Math.random() * 150)
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-rv-'))
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
const violations = []
const rhCalls = []
ws.addEventListener('message', async (ev) => {
  const raw = typeof ev.data === 'string' ? ev.data : await ev.data.text()
  const m = JSON.parse(raw)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return }
  if (m.method === 'Runtime.consoleAPICalled') {
    const t = m.params.args.map((a) => a.value ?? '').join(' ')
    if (/Content Security Policy|refused|blocked/i.test(t)) violations.push(t.slice(0, 200))
  }
  if (m.method === 'Network.responseReceived' && /reputationhub/.test(m.params.response.url)) {
    rhCalls.push(m.params.response.status + ' ' + m.params.response.url.slice(0, 120))
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
await send('Log.enable', {}, sessionId).catch(() => {})
await send('Network.setUserAgentOverride', {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
}, sessionId)
const evalJs = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId)
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text)
  return r.result.value
}

await send('Page.navigate', { url: URL_ }, sessionId)
await wait(3000)
// the wall reveals on scroll; bring the chapter into view the way a reader does
await evalJs('document.documentElement.style.scrollBehavior="auto";' +
  '(document.querySelector(".rv-wall,.rv-live,#proof")||document.body).scrollIntoView()')
await wait(6000)

const report = await evalJs([
  '(function(){',
  '  var box = function(el){ if(!el) return null; var r = el.getBoundingClientRect();',
  '    var cs = getComputedStyle(el);',
  '    return { w: Math.round(r.width), h: Math.round(r.height), display: cs.display,',
  '             visibility: cs.visibility, opacity: cs.opacity }; };',
  '  var wall = document.querySelector(".rv-wall");',
  '  var live = document.querySelector(".rv-live");',
  '  return {',
  '    cards: document.querySelectorAll(".rv-card").length,',
  '    wall: box(wall),',
  '    live: box(live),',
  '    liveHtmlLen: live ? live.innerHTML.length : -1,',
  '    liveIframes: live ? live.querySelectorAll("iframe").length : -1,',
  '    anyRhIframe: document.querySelectorAll(\'iframe[src*="reputationhub"]\').length,',
  '    rhScript: !!document.querySelector(\'script[src*="reputationhub"]\'),',
  '    proofText: (document.querySelector("#proof")||document.body).innerText.length',
  '  };',
  '})()',
].join('\n'))

console.log('=== ' + URL_)
console.log(JSON.stringify(report, null, 2))
console.log('reputationhub requests: ' + (rhCalls.join('\n                        ') || '(none)'))
console.log('CSP / blocked messages : ' + (violations.slice(0, 5).join('\n                         ') || '(none)'))
ws.close()
chrome.kill()
