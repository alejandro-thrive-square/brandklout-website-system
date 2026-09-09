/**
 * Does CDP mobile emulation actually flip the POINTER media features?
 *
 * It matters for reading every number this folder produces: `.ch-path`'s swipe
 * build is gated on `(hover:none) and (pointer:coarse)`, and `.wz-fine` (which
 * gates the grayscale repaint) on `(hover:hover) and (pointer:fine)`. If raw
 * `Emulation.setTouchEmulationEnabled` leaves those matching the HOST pointer,
 * the harness has been measuring the desktop build under a phone's CPU budget —
 * a fair worst case, but not what a phone actually runs.
 */
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import http from 'node:http'

const URL_ = process.argv[2] ?? 'https://www.drnahlah.com/'
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const port = 9333 + Math.floor(Date.now() % 500)
const wait = ms => new Promise(r => setTimeout(r, ms))
const getJson = path => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port, path }, r => {
    let d = ''; r.on('data', c => (d += c)); r.on('end', () => { try { res(JSON.parse(d)) } catch (e) { rej(e) } })
  }).on('error', rej)
})

const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`,
  '--remote-allow-origins=*', '--no-first-run', '--no-default-browser-check',
  `--user-data-dir=${join(tmpdir(), `cdp-ptr-${Date.now()}`)}`, 'about:blank'], { stdio: 'ignore' })

let ws
for (let i = 0; i < 150 && !ws; i++) {
  try { ws = (await getJson('/json/version')).webSocketDebuggerUrl } catch { await wait(200) }
}
const sock = new WebSocket(ws)
const pending = new Map()
let id = 0, sessionId
sock.onmessage = e => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
}
await new Promise(r => (sock.onopen = r))
const S = (method, params = {}, sid = sessionId) => new Promise(res => {
  const i = ++id; pending.set(i, res)
  sock.send(JSON.stringify({ id: i, method, params, ...(sid ? { sessionId: sid } : {}) }))
})

const { targetInfos } = await S('Target.getTargets', {}, null)
const page = targetInfos.find(t => t.type === 'page')
;({ sessionId } = await S('Target.attachToTarget', { targetId: page.targetId, flatten: true }, null))

await S('Page.enable')
await S('Runtime.enable')
await S('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true })
await S('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
await S('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' })

await S('Page.navigate', { url: URL_ })
await wait(6000)

const ev = async expr => (await S('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.value
console.log('url                     ', URL_)
console.log('innerWidth              ', await ev('innerWidth'))
console.log('maxTouchPoints          ', await ev('navigator.maxTouchPoints'))
console.log('(pointer:coarse)        ', await ev(`matchMedia('(pointer:coarse)').matches`))
console.log('(hover:none)            ', await ev(`matchMedia('(hover:none)').matches`))
console.log('TOUCH gate for ch-path  ', await ev(`matchMedia('(hover:none) and (pointer:coarse)').matches`))
console.log('wz-fine gate            ', await ev(`matchMedia('(hover:hover) and (pointer:fine)').matches`))
console.log('<html> class            ', await ev('document.documentElement.className'))
console.log('.ch-path classes        ', await ev(`(document.querySelector('.ch-path')||{}).className`))
console.log('pin-spacers on page     ', await ev(`document.querySelectorAll('.pin-spacer').length`))
console.log('ScrollTriggers          ', await ev('window.ScrollTrigger ? ScrollTrigger.getAll().length : -1'))
console.log('#smooth-content willChange', await ev(`(()=>{const c=document.getElementById('smooth-content');return c?getComputedStyle(c).willChange+' | transform:'+getComputedStyle(c).transform:'(none)'})()`))
console.log('#smooth-wrapper computed', await ev(`(()=>{const w=document.getElementById('smooth-wrapper');return w?getComputedStyle(w).overflow+' / '+getComputedStyle(w).position+' / h:'+getComputedStyle(w).height:'(none)'})()`))
console.log('tPin position           ', await ev(`(()=>{const p=document.getElementById('tPin');return p?getComputedStyle(p).position+' | parent:'+(p.parentElement.className||''):'(none)'})()`))
console.log('body scrollHeight       ', await ev('document.body.scrollHeight'))
console.log('doc scrollHeight        ', await ev('document.documentElement.scrollHeight'))

sock.close(); proc.kill()
