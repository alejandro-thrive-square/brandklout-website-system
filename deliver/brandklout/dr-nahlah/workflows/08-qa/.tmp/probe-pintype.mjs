/**
 * HOW is the chapter pinned — natively, or by JavaScript every frame?
 *
 * ScrollTrigger has two pinning strategies. `pinType: 'fixed'` hands the element
 * to the browser: it stays put with no per-frame work. `pinType: 'transform'`
 * repositions it from JS on every scroll update, and ScrollTrigger switches to
 * that automatically when a ScrollSmoother is present, because `position:fixed`
 * cannot be trusted inside a smoothed container.
 *
 * That is the difference this probe is looking for, measured while the pin is
 * ACTUALLY ACTIVE rather than at rest — at the top of the page a pin-spacer
 * exists but the element is not yet pinned, so reading it there says nothing.
 */
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import http from 'node:http'

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const wait = ms => new Promise(r => setTimeout(r, ms))

async function probe (label, url, pinId) {
  const port = 9950 + Math.floor(Math.random() * 40)
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--remote-allow-origins=*',
    '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${join(tmpdir(), `pt-${Date.now()}-${port}`)}`, 'about:blank'], { stdio: 'ignore' })
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
  /* DESKTOP=1 checks the other half of the fix: the smoother must still be
     created for a mouse, so the change is mobile-only and desktop is untouched. */
  if (process.env.DESKTOP) {
    await S('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  } else {
    await S('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true })
    await S('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  }
  await S('Page.navigate', { url })
  await wait(8000)
  const ev = async e => (await S('Runtime.evaluate', { expression: e, returnByValue: true })).result?.value

  // Scroll INTO the pinned range, then read.
  await ev(`(() => { const t=window.ScrollTrigger.getAll().find(x=>x.pin);
    if(!t) return -1; const y=t.start+ (t.end-t.start)*0.5;
    if (window.ScrollSmoother && ScrollSmoother.get()) ScrollSmoother.get().scrollTo(y, false); else window.scrollTo(0,y);
    return y })()`)
  await wait(1800)

  const out = {
    smoother: await ev('!!(window.ScrollSmoother && ScrollSmoother.get())'),
    pinnedNow: await ev(`(()=>{const t=ScrollTrigger.getAll().find(x=>x.pin);return t?t.isActive:null})()`),
    pinType: await ev(`(()=>{const t=ScrollTrigger.getAll().find(x=>x.pin);return t?(t.pinType||t.vars.pinType||'(auto)'):null})()`),
    pinnedElPosition: await ev(`(()=>{const p=document.getElementById('${pinId}');return p?getComputedStyle(p).position:'(no el)'})()`),
    pinnedElTransform: await ev(`(()=>{const p=document.getElementById('${pinId}');return p?getComputedStyle(p).transform:'(no el)'})()`),
    scrollY: await ev('Math.round(window.scrollY)'),
    htmlClass: await ev('document.documentElement.className'),
    wrapperOverflow: await ev(`(()=>{const w=document.getElementById('smooth-wrapper');return w?getComputedStyle(w).overflow:'(none)'})()`),
  }
  sock.close(); proc.kill()
  console.log(`--- ${label}`)
  for (const [k, v] of Object.entries(out)) console.log(`    ${k.padEnd(20)} ${v}`)
  return out
}

const targets = process.argv.slice(2)
if (targets.length) { for (const t of targets) await probe(t, t, 'tPin') }
else {
  await probe('WEBFLOW  (no smoother)', 'https://dr-nahlah.webflow.io/', 'tPin')
  await probe('INSTATIC (smoother on)', 'https://www.drnahlah.com/', 'tPin')
}
