import { spawn } from 'node:child_process'
import { join } from 'node:path'; import { tmpdir } from 'node:os'; import http from 'node:http'
const URL_=process.argv[2]||'http://127.0.0.1:8787/'
const CHROME=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'
const wait=ms=>new Promise(r=>setTimeout(r,ms))
const getJson=(p,port)=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)})
const port=9700+Math.floor(Math.random()*200)
const proc=spawn(CHROME,['--headless=new','--hide-scrollbars',`--remote-debugging-port=${port}`,'--remote-allow-origins=*','--no-first-run','--no-default-browser-check',`--user-data-dir=${join(tmpdir(),'cdp-d-'+Date.now())}`,'about:blank'],{stdio:'ignore'})
let ws; for(let i=0;i<150&&!ws;i++){try{ws=(await getJson('/json/version',port)).webSocketDebuggerUrl}catch{await wait(200)}}
const sock=new WebSocket(ws); const pending=new Map(); let id=0
sock.addEventListener('message',async ev=>{const raw=typeof ev.data==='string'?ev.data:await ev.data.text();const m=JSON.parse(raw);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}})
await new Promise(r=>sock.addEventListener('open',r,{once:true}))
const send=(method,params={},sessionId)=>new Promise((res,rej)=>{const i=++id;pending.set(i,m=>m.error?rej(new Error(m.error.message)):res(m.result));sock.send(JSON.stringify({id:i,method,params,sessionId}))})
const t=(await getJson('/json/list',port)).find(x=>x.type==='page')
const {sessionId}=await send('Target.attachToTarget',{targetId:t.id,flatten:true})
const S=(m,p={})=>send(m,p,sessionId)
await S('Page.enable'); await S('Runtime.enable')
for (const [label, mob] of [['DESKTOP 1440x900 (mouse)', false], ['MOBILE 390x844 (touch)', true]]) {
  await S('Emulation.setDeviceMetricsOverride', mob?{width:390,height:844,deviceScaleFactor:3,mobile:true}:{width:1440,height:900,deviceScaleFactor:1,mobile:false})
  await S('Emulation.setTouchEmulationEnabled',{enabled:mob,maxTouchPoints:5})
  await S('Page.navigate',{url:URL_}); await wait(6000)
  const r=await S('Runtime.evaluate',{expression:`(()=>{
    const sec=document.querySelector('.ch-path'), track=document.getElementById('pathTrack');
    const pinned = ScrollTrigger.getAll().filter(x=>x.pin).map(x=>x.trigger&&x.trigger.id);
    return JSON.stringify({
      isTouch: ScrollTrigger.isTouch,
      chPathClasses: sec.className,
      trackOverflowX: getComputedStyle(track).overflowX,
      scrollSnap: getComputedStyle(track).scrollSnapType,
      pinnedTriggers: pinned,
      grayscaleOnFirstShot: getComputedStyle(document.querySelector('.pa-shot img')).filter,
      totalTriggers: ScrollTrigger.getAll().length
    })})()`,returnByValue:true})
  console.log('\n'+label); console.log('  '+JSON.stringify(JSON.parse(r.result.value),null,2).replace(/\n/g,'\n  '))
}
sock.close(); proc.kill()
