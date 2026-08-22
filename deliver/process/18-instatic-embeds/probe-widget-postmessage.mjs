#!/usr/bin/env node
/**
 * Does the ReputationHub review widget report its own height WITHOUT the vendor's
 * parent-side script?
 *
 * ## Why this question decides the security posture
 *
 * The site already ships the upgrade path: `site.js` renders native `.rv-card`
 * markup, injects the widget iframe into `.rv-live`, and swaps the cards out only
 * when the vendor posts `lc.setHeight`. It also injects the vendor's
 * `review-widget.js` and wires `sc.onerror = reject` — so with `frame-src` widened
 * but `script-src` NOT, the blocked script fires an error, `reject()` runs, and the
 * widget is torn down again. The low-risk half of the allowlist is useless as the
 * code stands.
 *
 * That matters because granting `script-src https://reputationhub.site` lets that
 * origin run arbitrary JavaScript on encorercm.com, with full access to the DOM and
 * to same-origin storage. A cross-origin iframe can do none of that. So: if the
 * iframe posts its height on its own, we can keep `frame-src` alone, apply the
 * height ourselves, and never grant the script origin.
 *
 * This probe answers that empirically, off the client's site. It serves a bare page
 * from localhost with NO CSP and NO vendor script, embeds the widget, and records
 * every message the frame posts.
 *
 *   node probe-widget-postmessage.mjs
 *
 * Exit 0 means the widget is self-reporting and `frame-src` alone is sufficient.
 */
import { spawn } from 'node:child_process'
import http from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const FRAME_URL = process.env.WIDGET_URL ||
  'https://reputationhub.site/reputation/widgets/review_widget/xJDu1mFoW5jFYTNqmuk7?widgetId=6a7340db2bbe7819cc3536f4'
const SETTLE_MS = Number(process.env.SETTLE_MS || 12000)

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// A real http origin, because a file:// or about:blank parent is not a faithful
// stand-in: postMessage and referrer handling both differ.
const PAGE = `<!doctype html><meta charset="utf-8"><title>probe</title>
<body style="margin:0">
<script>
  window.__msgs = [];
  addEventListener('message', function (e) {
    try { if (!/reputationhub\\.site$/.test(new URL(e.origin).hostname)) return } catch (_) { return }
    window.__msgs.push({ origin: e.origin, data: e.data })
  });
</script>
<iframe class="lc_reviews_widget" title="Patient reviews" src="${FRAME_URL}"
        frameborder="0" scrolling="no" style="min-width:100%;width:100%;height:200px"></iframe>
</body>`

const server = http.createServer((_, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
  res.end(PAGE)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const origin = `http://127.0.0.1:${server.address().port}`

const gj = (p, port) => new Promise((res, rej) => http.get({ host: '127.0.0.1', port, path: p }, (r) => {
  let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d)))
}).on('error', rej))

const port = 9600 + Math.floor(Math.random() * 200)
const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`,
  '--remote-allow-origins=*', '--no-first-run',
  `--user-data-dir=${join(tmpdir(), 'probe' + Date.now())}`, 'about:blank'], { stdio: 'ignore' })

let ws
for (let i = 0; i < 150 && !ws; i++) {
  try { ws = (await gj('/json/version', port)).webSocketDebuggerUrl } catch { await wait(200) }
}
const sock = new WebSocket(ws)
const pend = new Map(); let id = 0
const failures = []
sock.addEventListener('message', async (e) => {
  const m = JSON.parse(typeof e.data === 'string' ? e.data : await e.data.text())
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return }
  if (m.method === 'Network.loadingFailed') failures.push(m.params.blockedReason ?? m.params.errorText)
})
await new Promise((r) => sock.addEventListener('open', r, { once: true }))
const send = (me, p = {}, sid) => new Promise((res, rej) => {
  const i = ++id; pend.set(i, (m) => m.error ? rej(new Error(m.error.message)) : res(m.result))
  sock.send(JSON.stringify({ id: i, method: me, params: p, sessionId: sid }))
})
const tg = (await gj('/json/list', port)).find((t) => t.type === 'page')
const { sessionId } = await send('Target.attachToTarget', { targetId: tg.id, flatten: true })
const S = (m, p = {}) => send(m, p, sessionId)
await S('Page.enable'); await S('Runtime.enable'); await S('Network.enable')

await S('Page.navigate', { url: origin })
await wait(SETTLE_MS)

const evalJs = async (expr) =>
  (await S('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value

const msgs = await evalJs('JSON.stringify(window.__msgs || [])').then(JSON.parse)
const frame = await evalJs(`(function(){
  var f = document.querySelector('iframe');
  return JSON.stringify({ rendered: f.getBoundingClientRect().height, hasDoc: !!f.contentWindow });
})()`).then(JSON.parse)

console.log(`parent origin      ${origin}   (no CSP, no vendor script)`)
console.log(`widget             ${FRAME_URL.slice(0, 78)}…`)
console.log(`messages received  ${msgs.length}`)
for (const m of msgs.slice(0, 8)) console.log(`  ${m.origin}  ${JSON.stringify(m.data).slice(0, 140)}`)
if (failures.length) console.log(`network failures   ${[...new Set(failures)].join(', ')}`)

const height = msgs
  .map((m) => (Array.isArray(m.data) && m.data[0] === 'lc.setHeight' ? m.data[1] : null))
  .find(Boolean)

console.log('')
if (height) {
  console.log(`RESULT  the widget self-reports: lc.setHeight ${JSON.stringify(height)}`)
  console.log('        `frame-src` alone is sufficient; the parent can apply this height itself,')
  console.log('        and `script-src https://reputationhub.site` need never be granted.')
} else {
  console.log('RESULT  no lc.setHeight arrived without the vendor script.')
  console.log('        A live widget therefore needs `--script` too, which grants that origin')
  console.log('        arbitrary JavaScript on the site. Weigh that against keeping the native cards.')
}

sock.close(); proc.kill(); server.close()
process.exit(height ? 0 : 1)
