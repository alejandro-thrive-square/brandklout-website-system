#!/usr/bin/env node
/**
 * Where the frame time actually GOES in a pinned chapter, on a phone-class CPU.
 *
 * `mobile-pin-diagnose.mjs` says the frames are long. It cannot say why, and
 * the obvious answer was wrong once already: gating the grayscale filter behind
 * (hover:hover) — a real repaint cost, on four images, inside a transformed
 * ancestor — moved Chapter 05 from 67.3% long frames to 61.5% and left p50
 * exactly where it was. A theory that survives a code review and dies on a
 * trace is the normal case, so trace first.
 *
 * Records a devtools timeline trace across the same synthetic touch scroll and
 * aggregates it two ways: total main-thread time by event, and self-time by JS
 * function. Between them, "is this script, style, layout or paint" has an
 * answer rather than an opinion.
 *
 *   node mobile-pin-profile.mjs --url http://127.0.0.1:8787/ --from path
 */
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import http from 'node:http'

const HERE = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const arg = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d)
const URL_ = arg('--url', 'http://127.0.0.1:8787/')
const FROM = arg('--from', 'path')
const CPU = Number(arg('--cpu', 6))
/* --no-smoother: stub the plugin BEFORE any page script runs, so the boot
   sequence takes its "ScrollSmoother unavailable" path and the page scrolls
   natively. This is how we A/B the smoother itself without touching the site. */
const NO_SMOOTHER = argv.includes('--no-smoother')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
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

const b = await (async function browser() {
  const port = 9700 + Math.floor(Math.random() * 200)
  const proc = spawn(CHROME, [
    '--headless=new', '--hide-scrollbars', `--remote-debugging-port=${port}`,
    '--remote-allow-origins=*', '--force-device-scale-factor=1', '--no-first-run',
    '--no-default-browser-check', `--user-data-dir=${join(tmpdir(), `cdp-prof-${Date.now()}`)}`,
    'about:blank',
  ], { stdio: 'ignore' })

  let wsUrl
  for (let i = 0; i < 150 && !wsUrl; i++) {
    try { wsUrl = (await getJson('/json/version', port)).webSocketDebuggerUrl } catch { await wait(200) }
  }
  if (!wsUrl) throw new Error('Chrome did not expose a debugger socket')

  const sock = new WebSocket(wsUrl)
  const pending = new Map()
  const events = []
  let nextId = 0
  sock.addEventListener('message', async (ev) => {
    const raw = typeof ev.data === 'string' ? ev.data : await ev.data.text()
    const msg = JSON.parse(raw)
    if (msg.method === 'Tracing.dataCollected') events.push(...msg.params.value)
    if (msg.method === 'Tracing.tracingComplete') pending.get('__trace')?.()
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
  await S('Page.enable'); await S('Runtime.enable')
  if (NO_SMOOTHER) {
    await S('Page.addScriptToEvaluateOnNewDocument', {
      source: "Object.defineProperty(window,'ScrollSmoother',{get(){return undefined},set(){},configurable:true});",
    })
  }
  await S('Emulation.setDeviceMetricsOverride', { ...VIEWPORT, mobile: true })
  await S('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  await S('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' })

  const evaluate = async (expression) => {
    const r = await S('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'eval failed')
    return r.result.value
  }
  const onTraceDone = () => new Promise((r) => pending.set('__trace', r))
  return { S, send, evaluate, events, onTraceDone, close: () => { try { sock.close() } catch {} ; proc.kill() } }
})()

try {
  await b.S('Page.navigate', { url: URL_ })
  await wait(6000)
  const top = await b.evaluate(`(() => { const s = document.querySelector('${FROM === 'path' ? '.ch-path' : '.ch-transformation'}');
    return Math.round(s.getBoundingClientRect().top + window.scrollY) })()`)
  await b.evaluate(`window.scrollTo(0, ${top - 400}); true`)
  await wait(1200)
  if (CPU > 1) await b.S('Emulation.setCPUThrottlingRate', { rate: CPU })

  await b.send('Tracing.start', {
    transferMode: 'ReportEvents',
    traceConfig: { includedCategories: ['disabled-by-default-devtools.timeline', 'devtools.timeline'] },
  })

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
  await wait(800)

  const done = b.onTraceDone()
  await b.send('Tracing.end')
  await done

  /* Aggregate. `dur` on a complete ('X') event is INCLUSIVE of children, so
     summing every event double-counts wildly. Self time = dur minus the dur of
     events nested inside it on the same thread. */
  const X = b.events.filter((e) => e.ph === 'X' && typeof e.dur === 'number')
  X.sort((a, b2) => a.ts - b2.ts || b2.dur - a.dur)
  const self = new Map()
  const stack = []
  for (const e of X) {
    while (stack.length && stack[stack.length - 1].end <= e.ts) stack.pop()
    const end = e.ts + e.dur
    if (stack.length) stack[stack.length - 1].childDur += e.dur
    stack.push({ name: e.name, end, childDur: 0, dur: e.dur, e })
  }
  // Re-walk to collect: rebuild with a proper close pass.
  const closed = []
  const st2 = []
  for (const e of X) {
    while (st2.length && st2[st2.length - 1].end <= e.ts) closed.push(st2.pop())
    const frame = { name: e.name, ts: e.ts, end: e.ts + e.dur, dur: e.dur, childDur: 0, args: e.args }
    if (st2.length) st2[st2.length - 1].childDur += e.dur
    st2.push(frame)
  }
  while (st2.length) closed.push(st2.pop())

  for (const f of closed) {
    const s = Math.max(0, f.dur - f.childDur)
    self.set(f.name, (self.get(f.name) ?? 0) + s)
  }

  const totalSelf = [...self.values()].reduce((a, c) => a + c, 0)
  console.log(`\n=== main-thread self time by event (${FROM}, cpu ${CPU}x, ${(totalSelf / 1000).toFixed(0)}ms total) ===`)
  for (const [name, us] of [...self].sort((a, c) => c[1] - a[1]).slice(0, 18)) {
    console.log(`  ${(us / 1000).toFixed(0).padStart(6)}ms  ${(100 * us / totalSelf).toFixed(1).padStart(5)}%  ${name}`)
  }

  /* JS functions, from the timeline's own FunctionCall/ProfileChunk data. */
  const fns = new Map()
  for (const f of closed) {
    if (f.name !== 'FunctionCall' && f.name !== 'TimerFire' && f.name !== 'EventDispatch') continue
    const d = f.args?.data ?? {}
    const key = `${f.name}:${d.functionName || d.type || '?'} ${(d.url || '').split('/').pop()}:${d.lineNumber ?? ''}`
    fns.set(key, (fns.get(key) ?? 0) + Math.max(0, f.dur - f.childDur))
  }
  console.log(`\n=== JS entry points by self time ===`)
  for (const [k, us] of [...fns].sort((a, c) => c[1] - a[1]).slice(0, 12)) {
    console.log(`  ${(us / 1000).toFixed(0).padStart(6)}ms  ${k}`)
  }

  const counts = new Map()
  for (const f of closed) counts.set(f.name, (counts.get(f.name) ?? 0) + 1)
  console.log(`\n=== event counts (selected) ===`)
  for (const n of ['Layout', 'UpdateLayoutTree', 'Paint', 'PrePaint', 'Commit', 'RasterTask',
                   'UpdateLayerTree', 'ParseAuthorStyleSheet', 'ScheduleStyleRecalculation', 'HitTest']) {
    if (counts.has(n)) console.log(`  ${String(counts.get(n)).padStart(6)}  ${n}`)
  }

  writeFileSync(join(HERE, `mobile-pin-profile-${FROM}${NO_SMOOTHER ? '-nosmoother' : ''}.json`), JSON.stringify(
    { url: URL_, from: FROM, cpu: CPU, self: [...self].sort((a, c) => c[1] - a[1]) }, null, 1))
} finally {
  b.close()
}
