import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import http from 'node:http'
const URL_ = process.argv[2]
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const wait = ms => new Promise(r => setTimeout(r, ms))
const port = 9450 + Math.floor(Math.random() * 40)
let proc=null, sock=null
try {
  proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--remote-allow-origins=*',
    '--no-first-run','--no-default-browser-check',`--user-data-dir=${join(tmpdir(),`sp-${Date.now()}`)}`,'about:blank'],{stdio:'ignore'})
  const getJson = p => new Promise((res,rej)=>{http.get({host:'127.0.0.1',port,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on('error',rej)})
  let ws; for(let i=0;i<150&&!ws;i++){try{ws=(await getJson('/json/version')).webSocketDebuggerUrl}catch{await wait(200)}}
  sock=new WebSocket(ws); const pending=new Map(); let id=0,sessionId
  sock.onmessage=e=>{const m=JSON.parse(e.data); if(m.id&&pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id)}}
  await new Promise(r=>sock.onopen=r)
  const S=(m,p={},s=sessionId)=>new Promise(res=>{const i=++id;pending.set(i,res);sock.send(JSON.stringify({id:i,method:m,params:p,...(s?{sessionId:s}:{})}))})
  const {targetInfos}=await S('Target.getTargets',{},null)
  ;({sessionId}=await S('Target.attachToTarget',{targetId:targetInfos.find(t=>t.type==='page').targetId,flatten:true},null))
  await S('Page.enable'); await S('Runtime.enable')
  await S('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true})
  await S('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5})
  await S('Page.navigate',{url:URL_}); await wait(9000)
  const ev = async e => (await S('Runtime.evaluate',{expression:e,returnByValue:true})).result?.value
  console.log(URL_)
  console.log('  doc scrollHeight ', await ev('document.documentElement.scrollHeight'))
  console.log('  tPin range       ', await ev("(function(){var t=ScrollTrigger.getAll().find(function(x){return x.pin&&x.trigger&&x.trigger.id==='tPin'});return t?Math.round(t.start)+' -> '+Math.round(t.end)+'  len '+Math.round(t.end-t.start):'(not pinned)'})()"))
  console.log('  tPin spacer H    ', await ev("(function(){var p=document.getElementById('tPin');var sp=p&&p.parentElement;return sp&&sp.classList.contains('pin-spacer')?Math.round(sp.getBoundingClientRect().height)+'  padBottom '+getComputedStyle(sp).paddingBottom:'(no spacer)'})()"))
  console.log('  #path offsetTop  ', await ev("(function(){var s=document.getElementById('path');var t=0,n=s;while(n&&n.id!=='smooth-content'&&n.tagName!=='BODY'){t+=n.offsetTop;n=n.offsetParent}return t})()"))
  console.log('  #proof offsetTop ', await ev("(function(){var s=document.getElementById('proof');var t=0,n=s;while(n&&n.id!=='smooth-content'&&n.tagName!=='BODY'){t+=n.offsetTop;n=n.offsetParent}return t})()"))
} finally { try{sock?.close()}catch{} try{proc?.kill()}catch{} }
