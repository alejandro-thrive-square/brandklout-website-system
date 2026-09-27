/**
 * Is the SMOOTHER what makes mobile scrolling stutter? Frame delivery, not work.
 *
 * `mobile-pin-profile.mjs` says total main-thread work barely moves when the
 * smoother is disabled — which is true and beside the point. Smoothness is
 * whether frames get PRESENTED on time. Native scrolling is compositor-driven
 * and survives a busy main thread; a JS-driven scroll model does not, so the
 * same main-thread congestion that a native page shrugs off becomes visible
 * stutter once scroll position itself is computed in JS.
 *
 * So: synthesize the same touch scroll through a chapter, record rAF deltas,
 * and report the distribution. Repeated, because this machine is bimodal on
 * single runs (see the session-14 note in the runbook) — the median of several
 * runs is what gets quoted, never one run.
 *
 *   node smoothness-ab.mjs --url https://www.drnahlah.com/ --from transformation --runs 3
 */
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import http from 'node:http'

const argv = process.argv.slice(2)
const arg = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d)
const URL_ = arg('--url', 'https://www.drnahlah.com/')
const FROM = arg('--from', 'transformation')
const RUNS = Number(arg('--runs', 3))
const CPU = Number(arg('--cpu', 6))
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const wait = ms => new Promise(r => setTimeout(r, ms))

async function run (noSmoother) {
  const port = 9700 + Math.floor(Math.random() * 250)
  const proc = spawn(CHROME, ['--headless=new', '--hide-scrollbars', `--remote-debugging-port=${port}`,
    '--remote-allow-origins=*', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${join(tmpdir(), `sm-${Date.now()}-${port}`)}`, 'about:blank'], { stdio: 'ignore' })
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
  if (noSmoother) {
    await S('Page.addScriptToEvaluateOnNewDocument', {
      /* The true Webflow-equivalent is TWO things, not one. Stubbing the
         plugin alone leaves `#smooth-wrapper{overflow:hidden}` (baked into the
         site CSS) clipping the page, so nothing scrolls at all and the run
         measures an IDLE page at a flattering 16.7ms. Webflow has no wrapper
         element whatsoever; reproduce that by neutralising the clip too. */
      source: "Object.defineProperty(window,'ScrollSmoother',{get(){return undefined},set(){},configurable:true});" +
        "document.addEventListener('DOMContentLoaded',function(){var s=document.createElement('style');" +
        "s.textContent='#smooth-wrapper{overflow:visible!important;position:static!important;height:auto!important}" +
        "#smooth-content{transform:none!important}';document.head.appendChild(s)});",
    })
  }
  await S('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true })
  await S('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  await S('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' })
  await S('Emulation.setCPUThrottlingRate', { rate: CPU })
  await S('Page.navigate', { url: URL_ })
  await wait(8000)

  const ev = async expr => (await S('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value

  const smoother = await ev('!!(window.ScrollSmoother && ScrollSmoother.get())')

  // Park just above the chapter.
  await ev(`(() => { const s=document.querySelector('.ch-${FROM}');
    let t=0,n=s; while(n && n.id!=='smooth-content'){ t+=n.offsetTop; n=n.offsetParent; }
    const y=Math.max(0,t-200);
    if (window.ScrollSmoother && ScrollSmoother.get()) ScrollSmoother.get().scrollTo(y); else window.scrollTo(0,y);
    return y })()`)
  await wait(1500)

  // Start recording rAF deltas.
  await ev(`window.__f=[]; (function loop(p){ requestAnimationFrame(t=>{ if(p) window.__f.push(t-p); loop(t) }) })(0); true`)

  // One synthesized flick-and-drag through the chapter.
  const steps = 90
  let y = 700
  await S('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y }] })
  for (let i = 0; i < steps; i++) {
    y -= 6
    if (y < 120) { // lift and re-place, like a real repeated swipe
      await S('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      y = 700
      await S('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y }] })
    }
    await S('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y }] })
    await wait(16)
  }
  await S('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await wait(900)

  const frames = (await ev('window.__f')) ?? []
  const moved = await ev('Math.round(window.scrollY)')
  sock.close(); proc.kill()
  return { frames, smoother, moved }
}

function stats (frames) {
  const f = frames.filter(x => x > 0).sort((a, b) => a - b)
  if (!f.length) return null
  const q = p => f[Math.min(f.length - 1, Math.floor(f.length * p))]
  return {
    n: f.length,
    p50: +q(0.5).toFixed(1),
    p95: +q(0.95).toFixed(1),
    long: +((f.filter(x => x > 32).length / f.length) * 100).toFixed(1),
  }
}

for (const [label, off] of [['smoother ON  (live today)', false], ['smoother OFF (Webflow-like)', true]]) {
  const rows = []
  for (let i = 0; i < RUNS; i++) {
    const r = await run(off)
    const s = r.moved > 1000 ? stats(r.frames) : null
    if (!s) { console.log(`${label}  run${i + 1}  INVALID — page travelled ${r.moved}px, not a scrolling measurement`); continue }
    rows.push(s)
    console.log(`${label}  run${i + 1}  smootherActive=${r.smoother}  scrolled=${r.moved}px  ` +
      (s ? `frames=${s.n} p50=${s.p50}ms p95=${s.p95}ms long>32ms=${s.long}%` : 'NO FRAMES'))
  }
  const ok = rows.filter(Boolean)
  if (ok.length) {
    const med = k => ok.map(r => r[k]).sort((a, b) => a - b)[Math.floor(ok.length / 2)]
    console.log(`  => MEDIAN OF ${ok.length} RUNS: p50 ${med('p50')}ms | p95 ${med('p95')}ms | long ${med('long')}%\n`)
  }
}
