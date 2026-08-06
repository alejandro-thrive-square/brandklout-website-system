/**
 * Mobile viewport QA shots.
 *
 * verify.mjs captures full-page screenshots, which on the implant page runs to
 * ~18,000px tall at 390px wide — unreadable, and it flattens exactly the
 * details you want to judge. This takes real 390x844 viewport shots at the
 * moments that matter, at 2x for legibility.
 *
 *   node qa-viewports.mjs      # writes verify-shots/qa-*.png
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { tmpdir } from 'node:os'
const ROOT = process.cwd()
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.png':'image/png','.jpeg':'image/jpeg','.svg':'image/svg+xml'}
const server=createServer(async(q,s)=>{try{const p=join(ROOT,decodeURIComponent(q.url.split('?')[0]));const b=await readFile(p);s.writeHead(200,{'Content-Type':MIME[extname(p)]??'application/octet-stream'});s.end(b)}catch{s.writeHead(404).end()}})
await new Promise(r=>server.listen(8953,r))
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-port=9353','--disable-gpu','--no-first-run','--disable-renderer-backgrounding','--user-data-dir='+join(tmpdir(),'gmd-qa'),'--window-size=390,844','about:blank'],{stdio:'ignore'})
let t;for(let i=0;i<60;i++){try{const l=await(await fetch('http://127.0.0.1:9353/json/list')).json();t=l.find(x=>x.type==='page');if(t)break}catch{}await new Promise(r=>setTimeout(r,250))}
const ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}))
let id=0;const pend=new Map()
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){const{ok,fail}=pend.get(m.id);pend.delete(m.id);m.error?fail(new Error(m.error.message)):ok(m.result)}})
const send=(mm,p={})=>new Promise((ok,fail)=>{const i=++id;pend.set(i,{ok,fail});ws.send(JSON.stringify({id:i,method:mm,params:p}))})
const ev=async e=>{const r=await send('Runtime.evaluate',{expression:e,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value}
await send('Runtime.enable');await send('Page.enable')
await send('Emulation.setFocusEmulationEnabled',{enabled:true});await send('Page.bringToFront')
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true})

const jobs = [
  ['implant-landing-page', [['hero', 0], ['track', '.track'], ['financing', '#financing']]],
  ['cosmetic-landing-page', [['hero', 0], ['ribbon', '.ribbon'], ['pillars', '#pillars']]],
]
for (const [slug, shots] of jobs) {
  await send('Page.navigate',{url:`http://127.0.0.1:8953/${slug}/index.html`})
  await new Promise(r=>setTimeout(r,4200))
  await ev(`document.querySelectorAll('img[loading="lazy"]').forEach(i=>i.loading='eager')`)
  for (const [name, target] of shots) {
    if (target === 0) { await ev(`WZ.smoother ? WZ.smoother.scrollTo(0,false) : window.scrollTo(0,0)`) }
    else {
      await ev(`(async()=>{const el=document.querySelector('${target}');const y=el.getBoundingClientRect().top+window.scrollY;
        WZ.smoother ? WZ.smoother.scrollTo(y+120,false) : window.scrollTo(0,y+120);
        await new Promise(r=>setTimeout(r,400)); if(window.ScrollTrigger) ScrollTrigger.update();})()`)
    }
    await new Promise(r=>setTimeout(r,1600))
    const {data}=await send('Page.captureScreenshot',{format:'png'})
    const file = `verify-shots/qa-${slug.split('-')[0]}-mobile-${name}.png`
    await writeFile(file, Buffer.from(data,'base64'))
    console.log('wrote', file)
  }
}
ws.close();chrome.kill();server.close()
