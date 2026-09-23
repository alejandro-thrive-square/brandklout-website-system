import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import http from 'node:http'; import { spawn } from 'node:child_process';
const URL_ = process.argv[2];
const CDP = 9500 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-tick-'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new','--disable-gpu','--hide-scrollbars',
  `--remote-debugging-port=${CDP}`,'--remote-allow-origins=*','--window-size=1440,900','--force-device-scale-factor=1',
  '--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,'about:blank']);
const getJSON=(p)=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:CDP,path:p},(r)=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)));}).on('error',rej);});
let wsUrl; for(let i=0;i<150&&!wsUrl;i++){try{wsUrl=(await getJSON('/json/version')).webSocketDebuggerUrl;}catch{} if(!wsUrl)await wait(300);}
const ws=new WebSocket(wsUrl); let mid=0; const pending=new Map();
ws.addEventListener('message',async(e)=>{const raw=typeof e.data==='string'?e.data:await e.data.text();const m=JSON.parse(raw);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}});
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
const send=(m,p={},s)=>new Promise((res,rej)=>{const i=++mid;pending.set(i,x=>x.error?rej(new Error(x.error.message)):res(x.result));ws.send(JSON.stringify({id:i,method:m,params:p,sessionId:s}));});
const {targetInfos}=await send('Target.getTargets');
const pt=targetInfos.find(t=>t.type==='page');
const {sessionId}=await send('Target.attachToTarget',{targetId:pt.targetId,flatten:true});
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false},sessionId);
await send('Page.navigate',{url:URL_+(URL_.includes('http')?`?cb=${Date.now()}`:'')},sessionId);
await wait(9000);
const EXPR=`(()=>{
 const styled = getComputedStyle(document.querySelector('.gm-header')||document.body).position==='fixed';
 /* Every box the repair could have moved: the list rows themselves, their
    containers, and the document. */
 const SEL='li, dt, dd, ul, ol, dl, [class*="hours"] div';
 const nodes=[...document.querySelectorAll(SEL)];
 const snap=()=>nodes.map(n=>+n.getBoundingClientRect().height.toFixed(2))
   .concat([+document.documentElement.scrollHeight.toFixed(2)]);
 const before=snap();
 /* Undo the repair in the DOM only: every wrapper this run created is an
    unclassed <div> whose sole child is text. Replacing it with a bare text node
    reproduces exactly the markup that shipped before. */
 let unwrapped=0;
 for(const d of [...document.querySelectorAll('div')]){
   if(d.className||d.attributes.length||d.children.length) continue;
   if(!d.parentNode) continue;
   d.parentNode.replaceChild(document.createTextNode(d.textContent), d); unwrapped++;
 }
 void document.body.offsetHeight;
 const after=snap();
 /* A wrapper that WAS the repair is detached by the unwrap and measures 0 —
    that is the probe removing it, not a layout shift. Only boxes still in the
    document are evidence. */
 const moved=before.map((v,i)=>[i,v,after[i],i<nodes.length?nodes[i].isConnected:true])
   .filter(([,a,b,live])=>live&&Math.abs(a-b)>0.02)
   .map(([i,a,b])=>[nodes[i]?(nodes[i].tagName+'.'+nodes[i].className).slice(0,40):'doc',a,b]);
 return JSON.stringify({styled, boxes:nodes.length, unwrapped, moved:moved.length,
   sample:moved.slice(0,8), docBefore:before.at(-1), docAfter:after.at(-1)},null,1);})()`;
const r=await send('Runtime.evaluate',{expression:EXPR,returnByValue:true},sessionId);
console.log(r.result.value);
ws.close(); chrome.kill();
