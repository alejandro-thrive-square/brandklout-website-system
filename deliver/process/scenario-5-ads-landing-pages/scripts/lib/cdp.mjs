/**
 * cdp.mjs - minimal headless Chrome over the DevTools protocol, no npm dependencies.
 * Lifted from the raw-CDP harness in mason-park/workflows/10-lp-instatic/.tmp/verify-form.mjs
 * and dr-nahlah/workflows/22-instatic-api-sync/dni-proof.mjs (same code in both).
 *
 *   const b = await launch({ width: 1440 })
 *   await b.S('Page.navigate', { url })
 *   const v = await b.evalJs('document.title')
 *   b.on((m) => { ... every CDP event ... })
 *   b.close()
 *
 * Uses CHROME_PATH (default: the Windows Chrome install). Node 22+ for the global WebSocket.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { CHROME, UA } from './combo.mjs'

export const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export async function launch({ width = 1440, height = 900, mobile = false } = {}) {
  const port = 9300 + Math.floor(Math.random() * 400)
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-s5-'))
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
    '--remote-allow-origins=*', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`, 'about:blank'], { stdio: 'ignore' })
  const gj = (p) => new Promise((res, rej) => http.get({ host: '127.0.0.1', port, path: p }, (r) => {
    let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => { try { res(JSON.parse(d)) } catch (e) { rej(e) } })
  }).on('error', rej))
  let wsUrl
  for (let i = 0; i < 150 && !wsUrl; i++) { try { wsUrl = (await gj('/json/version')).webSocketDebuggerUrl } catch { await wait(200) } }
  if (!wsUrl) throw new Error('Chrome did not start: set CHROME_PATH')
  const ws = new WebSocket(wsUrl)
  const pend = new Map()
  const listeners = []
  let id = 0
  ws.addEventListener('message', async (e) => {
    const m = JSON.parse(typeof e.data === 'string' ? e.data : await e.data.text())
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return }
    for (const f of listeners) f(m)
  })
  await new Promise((r) => ws.addEventListener('open', r, { once: true }))
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const i = ++id
    const t = setTimeout(() => rej(new Error('timeout ' + method)), 60000)
    pend.set(i, (m) => { clearTimeout(t); m.error ? rej(new Error(m.error.message)) : res(m.result) })
    ws.send(JSON.stringify({ id: i, method, params, sessionId }))
  })
  const { targetInfos } = await send('Target.getTargets')
  let pt = targetInfos.find((t) => t.type === 'page')
  if (!pt) pt = { targetId: (await send('Target.createTarget', { url: 'about:blank' })).targetId }
  const { sessionId } = await send('Target.attachToTarget', { targetId: pt.targetId, flatten: true })
  const S = (m, p = {}) => send(m, p, sessionId)
  await S('Page.enable'); await S('Runtime.enable'); await S('Network.enable')
  // A real Chrome UA: the HeadlessChrome string is refused by some third parties (Vimeo 401s).
  await S('Network.setUserAgentOverride', { userAgent: UA })
  await S('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile })
  const evalJs = async (expression) => {
    const r = await S('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''))
    return r.result.value
  }
  return { S, send, sessionId, evalJs, on: (f) => listeners.push(f), close: () => { try { ws.close() } catch {} proc.kill() } }
}
