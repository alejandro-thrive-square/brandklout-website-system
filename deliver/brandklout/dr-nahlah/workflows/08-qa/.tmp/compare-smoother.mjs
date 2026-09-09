/**
 * Webflow vs Instatic, same emulated phone, same questions.
 *
 * The create() options are identical in both sources, so if mobile scrolling
 * genuinely differs the divergence is in what actually gets INSTANTIATED and
 * what the page does around it — plugin versions, whether the smoother exists
 * at all, how many things end up pinned, and what the content wrapper is doing.
 * Source comparison already failed to explain the report; this asks the runtime.
 */
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import http from 'node:http'

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const wait = ms => new Promise(r => setTimeout(r, ms))

async function probe (url) {
  const port = 9500 + Math.floor(Math.random() * 400)
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`,
    '--remote-allow-origins=*', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${join(tmpdir(), `cmp-${Date.now()}-${port}`)}`, 'about:blank'], { stdio: 'ignore' })

  const getJson = p => new Promise((res, rej) => {
    http.get({ host: '127.0.0.1', port, path: p }, r => {
      let d = ''; r.on('data', c => (d += c)); r.on('end', () => { try { res(JSON.parse(d)) } catch (e) { rej(e) } })
    }).on('error', rej)
  })
  let ws
  for (let i = 0; i < 150 && !ws; i++) { try { ws = (await getJson('/json/version')).webSocketDebuggerUrl } catch { await wait(200) } }
  const sock = new WebSocket(ws)
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
  await S('Page.navigate', { url })
  await wait(7000)

  const ev = async expr => (await S('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.value
  const out = {
    url,
    gsap: await ev('window.gsap && gsap.version'),
    hasScrollSmootherPlugin: await ev('!!window.ScrollSmoother'),
    scrollTriggerVersion: await ev('window.ScrollTrigger && ScrollTrigger.version'),
    smootherInstance: await ev('!!(window.ScrollSmoother && ScrollSmoother.get())'),
    smootherPaused: await ev('(window.ScrollSmoother && ScrollSmoother.get()) ? ScrollSmoother.get().paused() : null'),
    // With smoothTouch:false the smoother should NOT be transforming content on touch.
    contentTransform: await ev(`(() => { const c=document.getElementById('smooth-content'); return c ? getComputedStyle(c).transform : '(no #smooth-content)' })()`),
    wrapperOverflow: await ev(`(() => { const w=document.getElementById('smooth-wrapper'); return w ? getComputedStyle(w).overflow + ' / pos:' + getComputedStyle(w).position : '(no #smooth-wrapper)' })()`),
    bodyOverflowX: await ev(`getComputedStyle(document.body).overflowX`),
    htmlClass: await ev('document.documentElement.className'),
    pinSpacers: await ev(`document.querySelectorAll('.pin-spacer').length`),
    scrollTriggers: await ev('window.ScrollTrigger ? ScrollTrigger.getAll().length : -1'),
    pinnedTriggers: await ev(`window.ScrollTrigger ? ScrollTrigger.getAll().filter(t=>t.pin).map(t=>{const e=t.trigger; return (e&&(e.id||e.className))||'?'}).join(' | ') : ''`),
    transformationPinned: await ev(`!!document.querySelector('#transformation .pin-spacer, .ch-transformation .pin-spacer')`),
    pathClasses: await ev(`(document.querySelector('.ch-path')||document.querySelector('#path')||{}).className`),
    filmWillChange: await ev(`(() => { const f=document.querySelector('.ch-arrival .film, .ch-arrival video, #film'); return f ? getComputedStyle(f).willChange + ' / bfv:' + getComputedStyle(f).backfaceVisibility : '(none)' })()`),
    iframes: await ev(`document.querySelectorAll('iframe').length`),
  }
  sock.close(); proc.kill()
  return out
}

const sites = [
  ['WEBFLOW ', 'https://dr-nahlah.webflow.io/'],
  ['INSTATIC', 'https://www.drnahlah.com/'],
]
const results = []
for (const [label, url] of sites) results.push([label, await probe(url)])

const keys = Object.keys(results[0][1]).filter(k => k !== 'url')
console.log(`${'field'.padEnd(24)} ${'WEBFLOW'.padEnd(38)} INSTATIC`)
console.log('-'.repeat(100))
for (const k of keys) {
  const a = String(results[0][1][k]).slice(0, 36)
  const b = String(results[1][1][k]).slice(0, 36)
  const flag = a === b ? '  ' : '**'
  console.log(`${flag}${k.padEnd(22)} ${a.padEnd(38)} ${b}`)
}
