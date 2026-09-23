/* Does that Elfsight app render AT ALL, off the client's site?
 *
 * A bare page served from localhost with NO Content-Security-Policy, carrying
 * the exact snippet pasted onto the home page. If the widget is empty here too,
 * nothing about Instatic or the plugin is responsible — the app itself renders
 * nothing on this domain, which is an Elfsight account question.
 *
 * Same shape of argument as probe-widget-postmessage.mjs: answer the question
 * away from the site so the site cannot be blamed either way.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'

const APP = '5b4f0a1d-1329-4668-b2c8-2054900227c5'
const SNIPPET =
  '<script src="https://elfsightcdn.com/platform.js" async></script>' +
  `<div class="elfsight-app-${APP}" data-elfsight-app-lazy></div>`

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>bare</title></head>
<body style="margin:0;padding:40px;font:16px system-ui"><h1>bare host, no CSP</h1>${SNIPPET}</body></html>`

const server = http.createServer((_, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
  res.end(PAGE)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const PAGE_URL = `http://127.0.0.1:${server.address().port}/`

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9400 + Math.floor(Math.random() * 90)
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-elf-'))
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*', '--window-size=1440,900',
  '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, 'about:blank'])

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const gj = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
    let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d)))
  }).on('error', rej)
})
let wsu
for (let i = 0; i < 150; i++) {
  try { const v = await gj('/json/version'); if (v.webSocketDebuggerUrl) { wsu = v.webSocketDebuggerUrl; break } } catch {}
  await wait(300)
}
const sock = new WebSocket(wsu)
let id = 0
const pend = new Map()
const reqs = []
sock.addEventListener('message', async (ev) => {
  const raw = typeof ev.data === 'string' ? ev.data : await ev.data.text()
  const m = JSON.parse(raw)
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return }
  if (m.method === 'Network.responseReceived' && /elfsight/.test(m.params.response.url)) {
    reqs.push(`${m.params.response.status} ${m.params.response.url.slice(0, 90)}`)
  }
})
await new Promise((r) => sock.addEventListener('open', r, { once: true }))
const send = (m, p = {}, sid) => new Promise((res, rej) => {
  const mid = ++id
  const t = setTimeout(() => rej(new Error('timeout ' + m)), 60000)
  pend.set(mid, (x) => { clearTimeout(t); x.error ? rej(new Error(x.error.message)) : res(x.result) })
  sock.send(JSON.stringify({ id: mid, method: m, params: p, sessionId: sid }))
})
const tg = (await gj('/json/list')).find((t) => t.type === 'page')
const { sessionId } = await send('Target.attachToTarget', { targetId: tg.id, flatten: true })
const S = (m, p = {}) => send(m, p, sessionId)
await S('Page.enable'); await S('Runtime.enable'); await S('Network.enable')
const ev2 = async (e) =>
  (await S('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.value

await S('Page.navigate', { url: PAGE_URL })
await wait(20000)

const out = await ev2(`(() => {
  const el = document.querySelector('[class*="elfsight-app-"]');
  return {
    height: el ? Math.round(el.getBoundingClientRect().height) : 0,
    innerBytes: el ? el.innerHTML.length : 0,
    text: el ? (el.innerText || '').trim().slice(0, 200) : '',
    imgs: el ? el.querySelectorAll('img').length : 0,
    reviewish: el ? el.querySelectorAll('[class*="review" i], [class*="Review"]').length : 0,
  };
})()`)

console.log(`\n--- ${PAGE_URL} (no CSP) — Elfsight app ${APP} ---`)
console.log(JSON.stringify(out, null, 2))
console.log('\nelfsight requests:')
for (const r of reqs) console.log('  ' + r)
console.log(out.innerBytes > 500 || out.imgs > 0
  ? '\nRENDERS on a bare host — so an empty widget on the live site is the site\'s problem.'
  : '\nEMPTY on a bare host too — nothing to do with Instatic, the plugin or the CSP.')
try { chrome.kill() } catch {}
server.close()
process.exit(0)
