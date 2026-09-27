/**
 * The three things that USED the smoother, checked on a phone now that there
 * isn't one. Each already had an `else` branch; this proves the branches work
 * rather than assuming they do.
 *
 *   1. in-page anchors  — boot fell back to gsap ScrollToPlugin
 *   2. the drawer lock  — fell back to `body.is-locked{overflow:hidden}`
 *   3. the article TOC  — fell back to scrollIntoView
 */
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import http from 'node:http'

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const wait = ms => new Promise(r => setTimeout(r, ms))
const port = 9890 + Math.floor(Math.random() * 40)

const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--remote-allow-origins=*',
  '--no-first-run', '--no-default-browser-check',
  `--user-data-dir=${join(tmpdir(), `rg-${Date.now()}`)}`, 'about:blank'], { stdio: 'ignore' })
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
const ev = async e => (await S('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.value

async function check (label, url, fn) {
  await S('Page.navigate', { url })
  await wait(7000)
  console.log(`\n=== ${label} ===`)
  console.log('  smoother active     ', await ev('!!(window.ScrollSmoother && ScrollSmoother.get())'))
  await fn()
}

await check('home — anchors + drawer', 'https://www.drnahlah.com/', async () => {
  // 1. anchor: click a nav/drawer link that targets an in-page id
  const before = await ev('Math.round(window.scrollY)')
  const clicked = await ev(`(() => { const a=[...document.querySelectorAll('a[href^="#"]')].find(x=>x.getAttribute('href').length>2 && document.querySelector(x.getAttribute('href')));
    if(!a) return null; a.click(); return a.getAttribute('href') })()`)
  await wait(2500)
  const after = await ev('Math.round(window.scrollY)')
  console.log(`  anchor ${clicked}  scrollY ${before} -> ${after}   ${after !== before ? 'OK' : 'DID NOT MOVE'}`)

  // 2. drawer: open it and confirm the page is locked, then close
  await ev(`window.scrollTo(0,0); true`)
  await wait(400)
  const opened = await ev(`(() => { const b=document.getElementById('burger'); if(!b) return null; b.click(); return true })()`)
  await wait(900)
  const lockedBody = await ev(`document.body.classList.contains('is-locked') + ' / overflow:' + getComputedStyle(document.body).overflow`)
  const drawerOpen = await ev(`(document.getElementById('drawer')||{}).className`)
  console.log(`  drawer opened=${opened}  body ${lockedBody}  drawer="${drawerOpen}"`)
  await ev(`(() => { const b=document.getElementById('burger'); if(b) b.click(); return true })()`)
  await wait(700)
  console.log(`  after close        body is-locked=${await ev(`document.body.classList.contains('is-locked')`)}`)
})

await check('article — TOC anchor', 'https://www.drnahlah.com/posts/are-dental-implants-worth-the-cost', async () => {
  const toc = await ev(`!!document.querySelector('.bl-toc')`)
  const before = await ev('Math.round(window.scrollY)')
  await ev(`(() => { const a=document.querySelector('.bl-toc a'); if(a) a.click(); return true })()`)
  await wait(2500)
  const after = await ev('Math.round(window.scrollY)')
  console.log(`  toc present=${toc}  scrollY ${before} -> ${after}   ${after !== before ? 'OK' : 'DID NOT MOVE'}`)
  console.log(`  hero img            ${await ev(`!!document.querySelector('.bl-hero img')`)}`)
  console.log(`  related cards       ${await ev(`document.querySelectorAll('.bl-rel-card').length`)}`)
})

sock.close(); proc.kill()
