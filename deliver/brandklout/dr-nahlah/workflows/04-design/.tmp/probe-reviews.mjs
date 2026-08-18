// What is actually in the review mount on the published Instatic page?
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import http from 'node:http';
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT=9600+Math.floor(Math.random()*200);
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'cdp-rv-'));
const chrome=spawn(CHROME,['--headless=new','--disable-gpu',`--remote-debugging-port=${PORT}`,'--remote-allow-origins=*','--no-first-run',`--user-data-dir=${profile}`,'about:blank']);
const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
const getJSON=(p)=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},(r)=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
let ws;for(let i=0;i<150;i++){try{const v=await getJSON('/json/version');if(v.webSocketDebuggerUrl){ws=v.webSocketDebuggerUrl;break}}catch{}await wait(300)}
const sock=new WebSocket(ws);let id=0;const pend=new Map();const failures=[];
sock.addEventListener('message',async ev=>{const raw=typeof ev.data==='string'?ev.data:await ev.data.text();const m=JSON.parse(raw);
  if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}
  if(m.method==='Network.loadingFailed')failures.push(m.params);
});
await new Promise(r=>sock.addEventListener('open',r));
const send=(method,params={},sessionId)=>new Promise(res=>{const mid=++id;pend.set(mid,res);sock.send(JSON.stringify({id:mid,method,params,sessionId}))});
const {result:t}=await send('Target.createTarget',{url:'about:blank'});
const {result:a}=await send('Target.attachToTarget',{targetId:t.targetId,flatten:true});
const S=a.sessionId;
await send('Page.enable',{},S); await send('Runtime.enable',{},S); await send('Network.enable',{},S);
await send('Page.navigate',{url:'https://encorercm.com/'},S);
await wait(9000);
const q=async(expr)=>(await send('Runtime.evaluate',{expression:expr,returnByValue:true},S)).result?.result?.value;
console.log('mount exists      :', await q(`!!document.querySelector('.rv-mount')`));
console.log('mount built flag  :', await q(`(document.querySelector('.rv-mount')||{dataset:{}}).dataset.built`));
console.log('iframe in mount   :', await q(`document.querySelectorAll('.rv-mount iframe').length`));
console.log('iframe src        :', await q(`(document.querySelector('.rv-mount iframe')||{}).src||'none'`));
console.log('iframe box        :', await q(`(function(){var f=document.querySelector('.rv-mount iframe');if(!f)return 'none';var r=f.getBoundingClientRect();return Math.round(r.width)+'x'+Math.round(r.height)})()`));
console.log('vendor script tag :', await q(`[...document.scripts].some(s=>s.src.indexOf('review-widget.js')>-1)`));
console.log('mount innerHTML   :', (await q(`(document.querySelector('.rv-mount')||{}).innerHTML||''`)||'').slice(0,180));
const rh=failures.filter(f=>/reputationhub/.test(JSON.stringify(f)));
console.log('reputationhub load failures:', rh.length, rh.slice(0,2).map(f=>f.errorText).join(' | '));
console.log('--- width chain ---');
const chain = await q("(function(){var n=document.querySelector('.rv-mount');var out=[];var g=0;while(n&&n.tagName!=='BODY'&&g++<8){var cs=getComputedStyle(n);var lbl=n.id?('#'+n.id):('.'+String(n.className||n.tagName));out.push(lbl.slice(0,26)+' w='+Math.round(n.getBoundingClientRect().width)+' d='+cs.display+(cs.gridTemplateColumns!=='none'?(' cols='+cs.gridTemplateColumns.slice(0,44)):''));n=n.parentElement}return out.join(' || ')})()");
console.log(chain);
sock.close(); chrome.kill();
