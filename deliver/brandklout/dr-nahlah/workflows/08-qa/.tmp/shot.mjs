import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'; import { tmpdir } from 'node:os'; import http from 'node:http'
const [URL_, OUT, SEL] = process.argv.slice(2)
const CHROME=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'
const wait=ms=>new Promise(r=>setTimeout(r,ms))
const getJson=(p,port)=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)})
const port=9700+Math.floor(Math.random()*200)
const proc=spawn(CHROME,['--headless=new','--hide-scrollbars',`--remote-debugging-port=${port}`,'--remote-allow-origins=*','--no-first-run','--no-default-browser-check',`--user-data-dir=${join(tmpdir(),'cdp-s-'+Date.now())}`,'about:blank'],{stdio:'ignore'})
let ws; for(let i=0;i<150&&!ws;i++){try{ws=(await getJson('/json/version',port)).webSocketDebuggerUrl}catch{await wait(200)}}
const sock=new WebSocket(ws); const pending=new Map(); let id=0
sock.addEventListener('message',async ev=>{const raw=typeof ev.data==='string'?ev.data:await ev.data.text();const m=JSON.parse(raw);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}})
await new Promise(r=>sock.addEventListener('open',r,{once:true}))
const send=(method,params={},sessionId)=>new Promise((res,rej)=>{const i=++id;pending.set(i,m=>m.error?rej(new Error(m.error.message)):res(m.result));sock.send(JSON.stringify({id:i,method,params,sessionId}))})
const t=(await getJson('/json/list',port)).find(x=>x.type==='page')
const {sessionId}=await send('Target.attachToTarget',{targetId:t.id,flatten:true})
const S=(m,p={})=>send(m,p,sessionId)
await S('Page.enable'); await S('Runtime.enable')
await S('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true})
await S('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5})
await S('Page.navigate',{url:URL_}); await wait(7000)
await S('Runtime.evaluate',{expression:`(()=>{const s=document.querySelector('${SEL}');window.scrollTo(0, s.getBoundingClientRect().top+window.scrollY);return 1})()`,returnByValue:true})
await wait(2500)
const {data}=await S('Page.captureScreenshot',{format:'png'})
writeFileSync(OUT, Buffer.from(data,'base64'))
console.log('wrote', OUT)
sock.close(); proc.kill()
