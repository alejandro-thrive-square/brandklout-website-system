#!/usr/bin/env node
/**
 * Empirical test: what actually happens when the LeadConnector / ReputationHub
 * review widget is placed on a published Instatic page.
 *
 * The snippet is two separate things, and they fail for two separate reasons:
 *   <script src="https://reputationhub.site/.../review-widget.js">
 *   <iframe class="lc_reviews_widget" src="https://reputationhub.site/...">
 *
 * Injecting them at runtime is a faithful test of the CSP half — the policy is
 * a document-level `<meta>`, so a node created by script is governed by exactly
 * the same directives as one baked into the HTML. It needs no test page and
 * touches nothing on the site.
 *
 *   node test-embed.mjs [slug]
 */
import { spawn } from 'node:child_process'
import http from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BASE = (process.env.INSTATIC_BASE_URL || 'https://encorercm.com').replace(/\/$/, '')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const SCRIPT_URL = 'https://reputationhub.site/reputation/assets/review-widget.js'
const FRAME_URL = 'https://reputationhub.site/reputation/widgets/review_widget/xJDu1mFoW5jFYTNqmuk7?widgetId=6a7340db2bbe7819cc3536f4'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const gj = (p, port) => new Promise((res, rej) => http.get({ host: '127.0.0.1', port, path: p }, (r) => {
  let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d)))
}).on('error', rej))

const port = 9600 + Math.floor(Math.random() * 200)
const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`,
  '--remote-allow-origins=*', '--no-first-run', `--user-data-dir=${join(tmpdir(), 'emb' + Date.now())}`, 'about:blank'], { stdio: 'ignore' })
let ws
for (let i = 0; i < 150 && !ws; i++) { try { ws = (await gj('/json/version', port)).webSocketDebuggerUrl } catch { await wait(200) } }
const sock = new WebSocket(ws)
const pend = new Map(); let id = 0
const events = []
sock.addEventListener('message', async (e) => {
  const m = JSON.parse(typeof e.data === 'string' ? e.data : await e.data.text())
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return }
  if (m.method === 'Log.entryAdded') events.push(['log', m.params.entry.level, m.params.entry.text])
  if (m.method === 'Runtime.consoleAPICalled') events.push(['console', m.params.type, (m.params.args ?? []).map((a) => a.value).join(' ')])
  if (m.method === 'Network.loadingFailed') events.push(['net', 'failed', `${m.params.blockedReason ?? m.params.errorText}`])
})
await new Promise((r) => sock.addEventListener('open', r, { once: true }))
const send = (me, p = {}, sid) => new Promise((res, rej) => {
  const i = ++id; pend.set(i, (m) => m.error ? rej(new Error(m.error.message)) : res(m.result))
  sock.send(JSON.stringify({ id: i, method: me, params: p, sessionId: sid }))
})
const tg = (await gj('/json/list', port)).find((t) => t.type === 'page')
const { sessionId } = await send('Target.attachToTarget', { targetId: tg.id, flatten: true })
const S = (m, p = {}) => send(m, p, sessionId)
await S('Page.enable'); await S('Runtime.enable'); await S('Log.enable'); await S('Network.enable')

const slug = process.argv[2] ?? ''
await S('Page.navigate', { url: `${BASE}/${slug}` })
await wait(4000)

const csp = (await S('Runtime.evaluate', {
  expression: `(document.querySelector('meta[http-equiv="Content-Security-Policy"]')||{}).content || '(none)'`,
  returnByValue: true,
})).result.value
console.log(`page: ${BASE}/${slug}`)
console.log(`CSP : ${csp}\n`)

events.length = 0
const result = (await S('Runtime.evaluate', {
  expression: `(async () => {
    const out = {};
    // 1. the third-party script
    await new Promise((done) => {
      const s = document.createElement('script');
      s.src = ${JSON.stringify(SCRIPT_URL)};
      s.onload = () => { out.script = 'LOADED'; done(); };
      s.onerror = () => { out.script = 'BLOCKED'; done(); };
      document.body.appendChild(s);
      setTimeout(() => { out.script = out.script || 'TIMEOUT'; done(); }, 5000);
    });
    // 2. the iframe
    const f = document.createElement('iframe');
    f.className = 'lc_reviews_widget';
    f.src = ${JSON.stringify(FRAME_URL)};
    document.body.appendChild(f);
    await new Promise((r) => setTimeout(r, 4000));
    out.iframeInDom = !!document.querySelector('iframe.lc_reviews_widget');
    try {
      out.iframeLocation = f.contentWindow ? (f.contentWindow.location.href || '(opaque)') : '(no contentWindow)';
    } catch (e) { out.iframeLocation = 'cross-origin (a document did load)'; }
    out.iframeDocEmpty = (() => { try { return f.contentDocument ? f.contentDocument.body.innerHTML.length : 'inaccessible'; } catch (e) { return 'inaccessible'; } })();
    return out;
  })()`,
  returnByValue: true, awaitPromise: true,
})).result.value

console.log('RESULT')
for (const [k, v] of Object.entries(result)) console.log(`  ${k}: ${v}`)
console.log('\nBROWSER EVENTS')
const seen = new Set()
for (const [kind, level, text] of events) {
  const line = `  [${kind}/${level}] ${String(text).slice(0, 220)}`
  if (seen.has(line)) continue
  seen.add(line)
  console.log(line)
}
process.exit(0)
