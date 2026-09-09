#!/usr/bin/env node
/**
 * Mobile pin diagnostic — Chapters 04 (transformation) and 05 (path).
 *
 * Reproduces the reported "flickering" on a phone rather than reasoning about
 * it. Headless Chrome with REAL touch emulation (so ScrollTrigger.isTouch === 1
 * and the ScrollSmoother resolves to smooth: 0, exactly as on a phone), then a
 * synthesized touch scroll gesture with momentum — not window.scrollTo, which
 * is synchronous and hides every async-scroll artefact.
 *
 * What it records, per frame, while the gesture runs:
 *   - which .tf-slide carries .is-on          (slide flip-flop = the flicker)
 *   - the --pos custom property on #cmp       (wipe position)
 *   - the pin spacer's transform / position   (pin judder)
 *   - rAF frame intervals                     (dropped frames)
 *
 *   node mobile-pin-diagnose.mjs [--url https://www.drnahlah.com/] [--keep]
 */
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import http from 'node:http'

const HERE = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const arg = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d)
const URL_ = arg('--url', 'https://www.drnahlah.com/')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
/**
 * An unthrottled headless run on a desktop CPU is not a phone, and it reports
 * a clean 16.7ms p50 for a page that judders on a real handset. 6x is what
 * Lighthouse uses to stand in for a mid-tier Android; 1 disables it.
 */
const CPU = Number(arg('--cpu', 6))
const FROM = arg('--from', 'tf')   // tf | path — which chapter to start above

const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 3 }

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const getJson = (path, port) =>
  new Promise((res, rej) => {
    http.get({ host: '127.0.0.1', port, path }, (r) => {
      let d = ''
      r.on('data', (c) => (d += c))
      r.on('end', () => res(JSON.parse(d)))
    }).on('error', rej)
  })

async function browser() {
  const port = 9700 + Math.floor(Math.random() * 200)
  const profile = join(tmpdir(), `cdp-pin-${Date.now()}`)
  const proc = spawn(CHROME, [
    '--headless=new', '--hide-scrollbars',
    `--remote-debugging-port=${port}`, '--remote-allow-origins=*',
    '--force-device-scale-factor=1', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: 'ignore' })

  let wsUrl
  for (let i = 0; i < 150 && !wsUrl; i++) {
    try { wsUrl = (await getJson('/json/version', port)).webSocketDebuggerUrl } catch { await wait(200) }
  }
  if (!wsUrl) throw new Error('Chrome did not expose a debugger socket')

  const sock = new WebSocket(wsUrl)
  const pending = new Map()
  let nextId = 0
  sock.addEventListener('message', async (ev) => {
    const raw = typeof ev.data === 'string' ? ev.data : await ev.data.text()
    const msg = JSON.parse(raw)
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id) }
  })
  await new Promise((r) => sock.addEventListener('open', r, { once: true }))

  const send = (method, params = {}, sessionId) =>
    new Promise((res, rej) => {
      const id = ++nextId
      const timer = setTimeout(() => rej(new Error(`timeout ${method}`)), 120000)
      pending.set(id, (m) => { clearTimeout(timer); m.error ? rej(new Error(m.error.message)) : res(m.result) })
      sock.send(JSON.stringify({ id, method, params, sessionId }))
    })

  const target = (await getJson('/json/list', port)).find((t) => t.type === 'page')
  const { sessionId } = await send('Target.attachToTarget', { targetId: target.id, flatten: true })
  const S = (m, p = {}) => send(m, p, sessionId)
  await S('Page.enable')
  await S('Runtime.enable')
  // A phone, not a narrow desktop. mobile:true + touch emulation is what makes
  // ScrollTrigger.isTouch resolve to 1, which is the whole point of the run.
  await S('Emulation.setDeviceMetricsOverride', { ...VIEWPORT, mobile: true })
  await S('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  await S('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' })
  await S('Emulation.setUserAgentOverride', {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 '
      + '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  })

  const evaluate = async (expression) => {
    const r = await S('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'eval failed')
    return r.result.value
  }

  return { S, evaluate, close: () => { try { sock.close() } catch {} ; proc.kill() } }
}

const PROBE = `(() => {
  const st = window.ScrollTrigger, sm = window.ScrollSmoother && ScrollSmoother.get();
  const pin = document.getElementById('tPin');
  const sec = document.querySelector('.ch-transformation');
  return {
    isTouch: st ? st.isTouch : null,
    smootherSmooth: sm ? sm.smooth() : null,
    wrapperPosition: getComputedStyle(document.getElementById('smooth-wrapper')).position,
    pinSpacerFound: !!document.querySelector('.pin-spacer'),
    pinPosition: pin ? getComputedStyle(pin).position : null,
    triggers: st ? st.getAll().length : 0,
    pinnedTriggers: st ? st.getAll().filter(t => t.pin).map(t => ({
      id: t.trigger && t.trigger.id, start: Math.round(t.start), end: Math.round(t.end),
      pinType: t.pinType || (t.pinnedContainer ? 'container' : (getComputedStyle(t.pin.parentNode).position === 'fixed' ? '?' : '?'))
    })) : [],
    docHeight: document.documentElement.scrollHeight,
    tfTop: sec ? Math.round(sec.getBoundingClientRect().top + window.scrollY) : null,
    pathTop: (() => { const s = document.querySelector('.ch-path'); return s ? Math.round(s.getBoundingClientRect().top + window.scrollY) : null })(),
  };
})()`

const RECORDER = `(() => {
  window.__rec = { frames: [], slideFlips: [], posChanges: 0, started: performance.now() };
  const cmp = document.getElementById('cmp');
  const slides = [...document.querySelectorAll('.tf-slide')];
  const track = document.getElementById('pathTrack');
  let last = performance.now(), lastOn = -1, lastPos = null, lastX = null;
  function tick(now) {
    const dt = now - last; last = now;
    const on = slides.findIndex(s => s.classList.contains('is-on'));
    const pos = cmp ? cmp.style.getPropertyValue('--pos') : '';
    // The pinned elements BY ID. '.pin-spacer > *' picks whichever spacer comes
    // first in the document, which is not necessarily the one being scrolled
    // through, and reading a dormant pin reports "static" forever.
    const tp = document.getElementById('tPin'), pp = document.getElementById('pathPin');
    const st = tp ? getComputedStyle(tp) : null, sp = pp ? getComputedStyle(pp) : null;
    const f = {
      t: Math.round(now - window.__rec.started), dt: Math.round(dt * 10) / 10,
      y: Math.round(window.scrollY), on, pos,
      tfPos: st ? st.position : null, tfTop: tp ? Math.round(tp.getBoundingClientRect().top) : null,
      tfXf: st && st.transform !== 'none' ? st.transform : null,
      paPos: sp ? sp.position : null, paTop: pp ? Math.round(pp.getBoundingClientRect().top) : null,
      trackX: track ? getComputedStyle(track).transform : null,
    };
    window.__rec.frames.push(f);
    if (on !== lastOn) { window.__rec.slideFlips.push({ t: f.t, y: f.y, from: lastOn, to: on }); lastOn = on; }
    if (pos !== lastPos) { window.__rec.posChanges++; lastPos = pos; }
    if (window.__rec.recording) requestAnimationFrame(tick);
  }
  window.__rec.recording = true;
  requestAnimationFrame(tick);
  return true;
})()`

async function main() {
  const b = await browser()
  try {
    await b.S('Page.navigate', { url: URL_ })
    await wait(6000)
    const probe = await b.evaluate(PROBE)
    console.log('--- environment ---')
    console.log(JSON.stringify(probe, null, 1))

    // Land just above the chapter under test so the gesture scrolls into the pin.
    const startY = argv.includes('--at')
      ? Number(arg('--at'))
      : (FROM === 'path' ? probe.pathTop : probe.tfTop) - 400
    await b.evaluate(`window.scrollTo(0, ${startY}); true`)
    await wait(1200)
    // Throttle only now: a throttled load takes minutes and tells us nothing.
    if (CPU > 1) await b.S('Emulation.setCPUThrottlingRate', { rate: CPU })
    await b.evaluate(RECORDER)

    // Flicks with momentum, the way a thumb actually scrolls a phone. Raw touch
    // dispatch rather than synthesizeScrollGesture: the latter silently moves
    // nothing in headless=new, which reads as "no jank" when in fact no scroll
    // happened at all. Assert movement below so that failure can never pass.
    const flick = async (dy, steps = 14, stepMs = 12) => {
      const x = 195
      let y = 640
      await b.S('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
      for (let s = 1; s <= steps; s++) {
        y += dy / steps
        await b.S('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(y) }] })
        await wait(stepMs)
      }
      await b.S('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    }
    for (let i = 0; i < 8; i++) { await flick(-420); await wait(350) }
    await wait(1200)
    await b.evaluate('window.__rec.recording = false; true')
    const rec = await b.evaluate('({frames: window.__rec.frames, slideFlips: window.__rec.slideFlips, posChanges: window.__rec.posChanges})')

    const frames = rec.frames
    const travelled = Math.abs((frames[frames.length - 1]?.y ?? 0) - (frames[0]?.y ?? 0))
    if (travelled < 500) {
      throw new Error(`the gesture moved the page ${travelled}px — nothing was measured. `
        + `A run that does not scroll reports zero jank for the wrong reason.`)
    }
    const dts = frames.map((f) => f.dt).filter((d) => d > 0 && d < 2000)
    dts.sort((a, b) => a - b)
    const pct = (p) => dts[Math.min(dts.length - 1, Math.floor(dts.length * p))]
    const long = dts.filter((d) => d > 32).length

    console.log(`\n--- gesture recording (CPU throttle ${CPU}x, from ${FROM}) ---`)
    console.log(`frames         ${frames.length}`)
    console.log(`scrollY        ${frames[0]?.y} -> ${frames[frames.length - 1]?.y}`)
    console.log(`frame dt p50   ${pct(0.5)}ms   p95 ${pct(0.95)}ms   max ${dts[dts.length - 1]}ms`)
    console.log(`frames >32ms   ${long} of ${dts.length} (${(100 * long / dts.length).toFixed(1)}%)`)
    console.log(`--pos writes   ${rec.posChanges}`)
    console.log(`slide flips    ${rec.slideFlips.length}`)
    for (const f of rec.slideFlips) console.log(`   t=${f.t}ms y=${f.y}  slide ${f.from} -> ${f.to}`)

    const backAndForth = rec.slideFlips.filter((f, i, a) => i > 0 && a[i - 1].from === f.to)
    console.log(`\nreversals (A->B->A within the run): ${backAndForth.length}`)
    for (const f of backAndForth) console.log(`   t=${f.t}ms y=${f.y}  back to slide ${f.to}`)

    console.log(`tPin    position values seen: ${JSON.stringify([...new Set(frames.map((f) => f.tfPos).filter(Boolean))])}`)
    console.log(`pathPin position values seen: ${JSON.stringify([...new Set(frames.map((f) => f.paPos).filter(Boolean))])}`)

    /* While a pin is held, its viewport-relative top must not move. Any drift
       IS the judder, and it is invisible in an average frame time. */
    for (const [name, posK, topK] of [['tPin', 'tfPos', 'tfTop'], ['pathPin', 'paPos', 'paTop']]) {
      const held = frames.filter((f) => f[posK] === 'fixed')
      if (!held.length) { console.log(`${name}: never observed pinned in this pass`); continue }
      const tops = held.map((f) => f[topK])
      const drift = Math.max(...tops) - Math.min(...tops)
      const jumps = held.filter((f, i) => i > 0 && Math.abs(f[topK] - held[i - 1][topK]) > 1).length
      console.log(`${name}: pinned for ${held.length} frames, top drift ${drift}px, `
        + `${jumps} frames where it moved >1px while pinned`)
    }

    mkdirSync(HERE, { recursive: true })
    const out = join(HERE, 'mobile-pin-diagnose.json')
    writeFileSync(out, JSON.stringify({ url: URL_, viewport: VIEWPORT, probe, ...rec }, null, 1))
    console.log(`\nwrote ${out}`)
  } finally {
    if (!argv.includes('--keep')) b.close()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
