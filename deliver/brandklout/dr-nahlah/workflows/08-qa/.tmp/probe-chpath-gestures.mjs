/**
 * Chapter 05 on a phone, driven by ACTUAL touch gestures.
 *
 * Setting `track.scrollLeft` in JS proves the element is scrollable. It does not
 * prove a finger can scroll it, and it does not prove a vertical drag over the
 * track still scrolls the PAGE. Both have been assumed twice; this dispatches
 * real touch sequences and reports what moved.
 *
 * Cleans up its own Chrome in a finally — never a global taskkill.
 */
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeFileSync } from 'node:fs'
import http from 'node:http'

const URL_ = process.argv[2] ?? 'https://www.drnahlah.com/'
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const wait = ms => new Promise(r => setTimeout(r, ms))
const port = 9770 + Math.floor(Math.random() * 60)
let proc = null, sock = null

try {
  proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--remote-allow-origins=*',
    '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${join(tmpdir(), `gest-${Date.now()}`)}`, 'about:blank'], { stdio: 'ignore' })

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
  await S('Page.navigate', { url: URL_ })
  await wait(10000)
  const ev = async e => (await S('Runtime.evaluate', { expression: e, returnByValue: true })).result?.value

  // Park with the track on screen.
  await ev(`(()=>{const s=document.querySelector('.ch-path');
    let t=0,n=s; while(n && n.id!=='smooth-content'){ t+=n.offsetTop; n=n.offsetParent; }
    window.scrollTo(0, Math.max(0,t-60)); return t })()`)
  await wait(2000)

  const trackBox = await ev(`(()=>{const t=document.getElementById('pathTrack');const r=t.getBoundingClientRect();
    return JSON.stringify({x:Math.round(r.left+r.width/2), y:Math.round(r.top+r.height/2), top:Math.round(r.top), h:Math.round(r.height)})})()`)
  const box = JSON.parse(trackBox)
  console.log('track box       ', trackBox)
  if (box.y < 0 || box.y > 844) console.log('  ! track is off-screen; gestures below are meaningless')

  async function drag (label, from, to, steps = 24) {
    // Record frame deltas across the gesture: the grayscale reveal is a PAINT
    // animation, so its cost shows up here or nowhere.
    await ev(`window.__f=[];(function l(p){requestAnimationFrame(t=>{if(p)window.__f.push(t-p);l(t)})})(0);true`)
    const beforeX = await ev(`document.getElementById('pathTrack').scrollLeft`)
    const beforeY = await ev('Math.round(window.scrollY)')
    await S('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from.x, y: from.y }] })
    for (let i = 1; i <= steps; i++) {
      const x = Math.round(from.x + (to.x - from.x) * (i / steps))
      const y = Math.round(from.y + (to.y - from.y) * (i / steps))
      await S('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] })
      await wait(16)
    }
    await S('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await wait(1400)
    const afterX = await ev(`document.getElementById('pathTrack').scrollLeft`)
    const afterY = await ev('Math.round(window.scrollY)')
    const f = ((await ev('window.__f')) ?? []).filter(x => x > 0).sort((a, b) => a - b)
    const q = pc => f.length ? f[Math.min(f.length - 1, Math.floor(f.length * pc))] : 0
    const long = f.length ? ((f.filter(x => x > 32).length / f.length) * 100).toFixed(0) : '-'
    console.log(`${label.padEnd(26)} trackX ${beforeX} -> ${afterX}   pageY ${beforeY} -> ${afterY}   ` +
      `frames=${f.length} p50=${q(0.5).toFixed(1)}ms long>32ms=${long}%`)
    return { dx: afterX - beforeX, dy: afterY - beforeY }
  }

  console.log('\n--- gestures ---')
  const swipe = await drag('swipe LEFT over track', { x: 320, y: box.y }, { x: 70, y: box.y })
  const vert = await drag('drag UP over track', { x: 195, y: box.y }, { x: 195, y: Math.max(60, box.y - 300) })

  console.log('\n--- verdict ---')
  console.log(`horizontal swipe moves the track : ${swipe.dx > 40 ? 'YES' : 'NO  <-- broken'}`)
  console.log(`vertical drag still scrolls page : ${Math.abs(vert.dy) > 40 ? 'YES' : 'NO  <-- gesture trapped'}`)

  console.log('\n--- what animates in the swipe build ---')
  console.log('card border colors', await ev(`[...document.querySelectorAll('#pathTrack .pa-card')].map(c=>getComputedStyle(c).borderTopColor).join(' | ')`))
  console.log('pa-no opacities   ', await ev(`[...document.querySelectorAll('#pathTrack .pa-no')].map(c=>getComputedStyle(c).opacity).join(' ')`))
  console.log('bar fill scaleX   ', await ev(`(()=>{const i=document.querySelector('.ch-path .pa-bar i');return getComputedStyle(i).transform})()`))
  console.log('scrollTriggers on cards', await ev(`window.ScrollTrigger ? ScrollTrigger.getAll().filter(t=>t.trigger && t.trigger.classList && t.trigger.classList.contains('pa-card')).length : -1`))

  const shot = await S('Page.captureScreenshot', { format: 'jpeg', quality: 80 })
  if (shot?.data) { writeFileSync(process.env.SHOT || 'gest.jpg', Buffer.from(shot.data, 'base64')); console.log('\nscreenshot ->', process.env.SHOT || 'gest.jpg') }
} finally {
  try { sock?.close() } catch {}
  try { proc?.kill() } catch {}   // only OUR child, never a global kill
}
