/**
 * Is Chapter 05's PINNED build now viable on a phone?
 *
 * It was abandoned in session 14 because it measured a sustained ~30fps. But
 * the dominant cost was never the scrub itself — it was that ScrollSmoother
 * forced `pinType:'transform'`, so the pinned element was repositioned from JS
 * every frame. The smoother is gone on touch now and pinning is native
 * `position:fixed`, so the premise of that decision no longer holds and the
 * measurement has to be redone rather than inherited.
 *
 * Drives a real vertical touch scroll THROUGH the chapter and reports frame
 * delivery plus whether the section actually sticks.
 */
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeFileSync } from 'node:fs'
import http from 'node:http'

const URL_ = process.argv[2] ?? 'http://127.0.0.1:8932/'
const CPU = Number(process.env.CPU || 6)
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const wait = ms => new Promise(r => setTimeout(r, ms))
const port = 9600 + Math.floor(Math.random() * 60)
let proc = null, sock = null

try {
  proc = spawn(CHROME, ['--headless=new', '--hide-scrollbars', `--remote-debugging-port=${port}`,
    '--remote-allow-origins=*', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${join(tmpdir(), `pin-${Date.now()}`)}`, 'about:blank'], { stdio: 'ignore' })
  const getJson = p => new Promise((res, rej) => {
    http.get({ host: '127.0.0.1', port, path: p }, r => {
      let d = ''; r.on('data', c => (d += c)); r.on('end', () => { try { res(JSON.parse(d)) } catch (e) { rej(e) } })
    }).on('error', rej)
  })
  let ws
  for (let i = 0; i < 150 && !ws; i++) { try { ws = (await getJson('/json/version')).webSocketDebuggerUrl } catch { await wait(200) } }
  sock = new WebSocket(ws)
  const pending = new Map(); let id = 0, sessionId
  sock.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) } }
  await new Promise(r => (sock.onopen = r))
  const S = (method, params = {}, sid = sessionId) => new Promise(res => {
    const i = ++id; pending.set(i, res); sock.send(JSON.stringify({ id: i, method, params, ...(sid ? { sessionId: sid } : {}) }))
  })
  const { targetInfos } = await S('Target.getTargets', {}, null)
  const page = targetInfos.find(t => t.type === 'page')
  ;({ sessionId } = await S('Target.attachToTarget', { targetId: page.targetId, flatten: true }, null))
  await S('Page.enable'); await S('Runtime.enable')
  await S('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true })
  await S('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  await S('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' })
  await S('Emulation.setCPUThrottlingRate', { rate: CPU })
  await S('Page.navigate', { url: URL_ })
  await wait(9000)
  const ev = async e => (await S('Runtime.evaluate', { expression: e, returnByValue: true })).result?.value

  console.log('url            ', URL_, `(cpu ${CPU}x)`)
  console.log('smoother       ', await ev('!!(window.ScrollSmoother && ScrollSmoother.get())'))
  console.log('ch-path class  ', await ev(`(document.querySelector('.ch-path')||{}).className`))
  console.log('path pinned    ', await ev(`(()=>{const t=ScrollTrigger.getAll().find(x=>x.pin && x.trigger && x.trigger.id==='pathPin');return !!t})()`))

  const start = await ev(`(()=>{const t=ScrollTrigger.getAll().find(x=>x.pin && x.trigger && x.trigger.id==='pathPin');
    return t?Math.round(t.start):-1})()`)
  const end = await ev(`(()=>{const t=ScrollTrigger.getAll().find(x=>x.pin && x.trigger && x.trigger.id==='pathPin');
    return t?Math.round(t.end):-1})()`)
  console.log('pin range      ', start, '->', end, `(${end - start}px of travel)`)

  // Park above the chapter. In the swipe build there is no pin, so fall back to
  // the section's own offset — the comparison must scroll the same content.
  const parkAt = start > 0
    ? Math.max(0, start - 300)
    : await ev(`(()=>{const s=document.querySelector('.ch-path');let t=0,n=s;
        while(n && n.id!=='smooth-content'){t+=n.offsetTop;n=n.offsetParent;}return Math.max(0,t-300)})()`)
  await ev(`window.scrollTo(0, ${parkAt}); true`)
  await wait(1500)
  await ev(`window.__f=[];(function l(p){requestAnimationFrame(t=>{if(p)window.__f.push(t-p);l(t)})})(0);true`)

  let y = 720
  await S('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y }] })
  for (let i = 0; i < 140; i++) {
    y -= 7
    if (y < 110) {
      await S('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      y = 720
      await S('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y }] })
    }
    await S('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y }] })
    await wait(16)
  }
  await S('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await wait(1200)

  const f = ((await ev('window.__f')) ?? []).filter(x => x > 0).sort((a, b) => a - b)
  const q = pc => f.length ? f[Math.min(f.length - 1, Math.floor(f.length * pc))] : 0
  const long = f.length ? ((f.filter(x => x > 32).length / f.length) * 100).toFixed(1) : '-'
  console.log('\nscrolled to    ', await ev('Math.round(window.scrollY)'))
  console.log('pinned el pos  ', await ev(`(()=>{const p=document.getElementById('pathPin');return getComputedStyle(p).position})()`))
  console.log('track x        ', await ev(`(()=>{const t=document.getElementById('pathTrack');return getComputedStyle(t).transform})()`))
  console.log(`frames         ${f.length}  p50 ${q(0.5).toFixed(1)}ms  p95 ${q(0.95).toFixed(1)}ms  long>32ms ${long}%`)

  console.log('--- pinned triggers BEFORE refresh ---')
  console.log(await ev("ScrollTrigger.getAll().filter(t=>t.pin).map(function(t){var id=(t.trigger&&t.trigger.id)||'?';return id+' start '+Math.round(t.start)+' end '+Math.round(t.end)+' active '+t.isActive;}).join(' || ')"))
  await ev('ScrollTrigger.refresh(); true')
  await wait(2500)
  console.log('--- AFTER refresh ---')
  console.log(await ev("ScrollTrigger.getAll().filter(t=>t.pin).map(function(t){var id=(t.trigger&&t.trigger.id)||'?';return id+' start '+Math.round(t.start)+' end '+Math.round(t.end)+' active '+t.isActive;}).join(' || ')"))
  console.log('scrollY now', await ev('Math.round(window.scrollY)'))
  const shot = await S('Page.captureScreenshot', { format: 'jpeg', quality: 80 })
  if (shot?.data) { writeFileSync(process.env.SHOT || 'pinned.jpg', Buffer.from(shot.data, 'base64')); console.log('screenshot ->', process.env.SHOT || 'pinned.jpg') }
} finally {
  try { sock?.close() } catch {}
  try { proc?.kill() } catch {}
}
