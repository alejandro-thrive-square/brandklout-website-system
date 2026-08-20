import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import http from 'node:http';
const [URL_, OUT, THEME] = process.argv.slice(2);
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9400 + Math.floor(Math.random()*90);
const profile = fs.mkdtempSync(path.join(os.tmpdir(),'cdp-shot-'));
spawn(CHROME,['--headless=new','--disable-gpu','--hide-scrollbars',`--remote-debugging-port=${PORT}`,'--remote-allow-origins=*','--force-device-scale-factor=1','--window-size=1440,1000','--no-first-run',`--user-data-dir=${profile}`,'about:blank']);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const gj=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
let wsu; for(let i=0;i<200;i++){try{const v=await gj('/json/version');if(v.webSocketDebuggerUrl){wsu=v.webSocketDebuggerUrl;break}}catch{} await wait(300)}
const sock=new WebSocket(wsu); let id=0; const pend=new Map();
sock.addEventListener('message',async e=>{const raw=typeof e.data==='string'?e.data:await e.data.text();const m=JSON.parse(raw);if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}});
await new Promise(r=>sock.addEventListener('open',r,{once:true}));
const send=(method,params={},sid)=>new Promise((res,rej)=>{const mid=++id;const t=setTimeout(()=>rej(new Error('timeout '+method)),90000);pend.set(mid,m=>{clearTimeout(t);m.error?rej(new Error(m.error.message)):res(m.result)});sock.send(JSON.stringify({id:mid,method,params,sessionId:sid}))});
const tg=(await gj('/json/list')).find(t=>t.type==='page');
const {sessionId}=await send('Target.attachToTarget',{targetId:tg.id,flatten:true});
const S=(m,p={})=>send(m,p,sessionId);
await S('Page.enable'); await S('Runtime.enable');
const feats = [];
if (THEME) feats.push({ name: 'prefers-color-scheme', value: THEME });
/* Reduced motion turns the pinned chapters into ordinary static sections, which
   is the only way a full-page capture can photograph them at all: a pin works
   by pulling its content out of flow behind a spacer, so captureBeyondViewport
   renders the spacer and the chapter comes out blank. The LAYOUT is the same in
   both branches, so this is a fair check of alignment (not of the scrub). */
if (process.argv.includes('--reduced')) feats.push({ name: 'prefers-reduced-motion', value: 'reduce' });
if (feats.length) await S('Emulation.setEmulatedMedia', { features: feats });
const wI = process.argv.indexOf('--width');
if (wI > -1) await S('Emulation.setDeviceMetricsOverride',{width:Number(process.argv[wI+1]),height:Number(process.argv[wI+2]||1200),deviceScaleFactor:1,mobile:false});
await S('Page.navigate',{url:URL_}); await wait(3500);
await S('Runtime.evaluate',{expression:'document.fonts.ready',awaitPromise:true});
await wait(600);
const {data}=await S('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
fs.writeFileSync(OUT, Buffer.from(data,'base64'));
console.log('wrote', OUT);
process.exit(0);
