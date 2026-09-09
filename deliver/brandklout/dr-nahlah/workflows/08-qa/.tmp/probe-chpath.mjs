/**
 * What state is Chapter 05 (#path) actually in on a phone?
 *
 * It has three builds — swipe (touch), pinned (desktop with travel) and static
 * (nothing to scroll) — and the swipe one is a horizontal scroll-snap track.
 * Removing ScrollSmoother changed what clips the page, so this checks the
 * geometry that build depends on rather than guessing at it.
 */
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import http from 'node:http'

const URL_ = process.argv[2] ?? 'https://www.drnahlah.com/'
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const wait = ms => new Promise(r => setTimeout(r, ms))
const port = 9820 + Math.floor(Math.random() * 60)

const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--remote-allow-origins=*',
  '--no-first-run', '--no-default-browser-check',
  `--user-data-dir=${join(tmpdir(), `cp-${Date.now()}`)}`, 'about:blank'], { stdio: 'ignore' })
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
await S('Runtime.consoleAPICalled') // no-op, keeps shape
await S('Page.navigate', { url: URL_ })
await wait(10000)
const ev = async e => (await S('Runtime.evaluate', { expression: e, returnByValue: true })).result?.value

console.log('url', URL_)
console.log('smoother        ', await ev('!!(window.ScrollSmoother && ScrollSmoother.get())'))
console.log('ch-path class   ', await ev(`(document.querySelector('.ch-path')||{}).className`))
console.log('section height  ', await ev(`(()=>{const s=document.querySelector('.ch-path');return s?Math.round(s.getBoundingClientRect().height):null})()`))
console.log('pa-pin height   ', await ev(`(()=>{const p=document.getElementById('pathPin');return p?Math.round(p.getBoundingClientRect().height)+' / css:'+getComputedStyle(p).height:null})()`))
console.log('track overflowX ', await ev(`(()=>{const t=document.getElementById('pathTrack');return t?getComputedStyle(t).overflowX+' snap:'+getComputedStyle(t).scrollSnapType+' w:'+getComputedStyle(t).width:null})()`))
console.log('track scrollW/cW', await ev(`(()=>{const t=document.getElementById('pathTrack');return t?t.scrollWidth+' / '+t.clientWidth:null})()`))
console.log('track transform ', await ev(`(()=>{const t=document.getElementById('pathTrack');return t?getComputedStyle(t).transform:null})()`))
console.log('cards           ', await ev(`document.querySelectorAll('#pathTrack .pa-card').length`))
console.log('card width      ', await ev(`(()=>{const c=document.querySelector('#pathTrack .pa-card');return c?Math.round(c.getBoundingClientRect().width):null})()`))
console.log('pin-spacers     ', await ev(`document.querySelectorAll('.pin-spacer').length`))
console.log('path pinned?    ', await ev(`!!document.querySelector('#path .pin-spacer, .ch-path .pin-spacer')`))
console.log('doc scrollWidth ', await ev('document.documentElement.scrollWidth + " vs innerWidth " + innerWidth'))
console.log('body overflowX  ', await ev('getComputedStyle(document.body).overflowX'))
console.log('bar scaleX      ', await ev(`(()=>{const b=document.querySelector('.ch-path .pa-bar i');return b?getComputedStyle(b).transform:null})()`))

// Can the track actually be swiped?
await ev(`(()=>{const t=document.getElementById('pathTrack'); if(t) t.scrollLeft = 400; return true})()`)
await wait(600)
console.log('after scrollLeft', await ev(`(()=>{const t=document.getElementById('pathTrack');return t?t.scrollLeft:null})()`))

// Scroll the chapter into view and photograph it.
await ev(`(()=>{const s=document.querySelector('.ch-path');
  let t=0,n=s; while(n && n.id!=='smooth-content'){ t+=n.offsetTop; n=n.offsetParent; }
  window.scrollTo(0, Math.max(0,t-60)); return t })()`)
await wait(2500)
const shot = await S('Page.captureScreenshot', { format: 'jpeg', quality: 80 })
if (shot?.data) {
  const { writeFileSync } = await import('node:fs')
  writeFileSync(process.env.SHOT || 'chpath.jpg', Buffer.from(shot.data, 'base64'))
  console.log('screenshot ->', process.env.SHOT || 'chpath.jpg')
}
console.log('reveal states   ', await ev(`[...document.querySelectorAll('#pathTrack .pa-card')].map(c=>Math.round(getComputedStyle(c).opacity*100)+'%').join(' ')`))
console.log('pa-no opacity   ', await ev(`[...document.querySelectorAll('#pathTrack .pa-no')].map(c=>Math.round(getComputedStyle(c).opacity*100)+'%').join(' ')`))
console.log('track visible h ', await ev(`(()=>{const t=document.getElementById('pathTrack');const r=t.getBoundingClientRect();return Math.round(r.height)+' top:'+Math.round(r.top)})()`))
console.log('head visible    ', await ev(`(()=>{const h=document.querySelector('.ch-path .pa-head');if(!h)return 'none';const r=h.getBoundingClientRect();return Math.round(r.height)+' top:'+Math.round(r.top)+' op:'+getComputedStyle(h).opacity})()`))

console.log('--- the bar ---')
console.log('pa-bar position ', await ev(`(()=>{const b=document.querySelector('.ch-path .pa-bar');return b?getComputedStyle(b).position:null})()`))
console.log('pa-bar rect     ', await ev(`(()=>{const b=document.querySelector('.ch-path .pa-bar');const r=b.getBoundingClientRect();return Math.round(r.width)+'x'+Math.round(r.height)})()`))
console.log('bar i offsetPar ', await ev(`(()=>{const i=document.querySelector('.ch-path .pa-bar i');const p=i.offsetParent;return p?(p.className||p.id||p.tagName):'(none)'})()`))
console.log('bar i rect      ', await ev(`(()=>{const i=document.querySelector('.ch-path .pa-bar i');const r=i.getBoundingClientRect();return Math.round(r.width)+'x'+Math.round(r.height)+' at '+Math.round(r.left)+','+Math.round(r.top)})()`))
console.log('bar i transform ', await ev(`(()=>{const i=document.querySelector('.ch-path .pa-bar i');return getComputedStyle(i).transform})()`))
console.log('bar i bg        ', await ev(`(()=>{const i=document.querySelector('.ch-path .pa-bar i');return getComputedStyle(i).backgroundColor})()`))
sock.close(); proc.kill()
