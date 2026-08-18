// Does the review iframe actually become a loaded frame on the published page?
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import http from 'node:http';
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT=9700+Math.floor(Math.random()*200);
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'cdp-fr-'));
const chrome=spawn(CHROME,['--headless=new','--disable-gpu','--window-size=1440,900',`--remote-debugging-port=${PORT}`,'--remote-allow-origins=*','--no-first-run',`--user-data-dir=${profile}`,'about:blank']);
const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
const getJSON=(p)=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},(r)=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
let ws;for(let i=0;i<150;i++){try{const v=await getJSON('/json/version');if(v.webSocketDebuggerUrl){ws=v.webSocketDebuggerUrl;break}}catch{}await wait(300)}
const sock=new WebSocket(ws);let id=0;const pend=new Map();const logs=[];const frames=[];
sock.addEventListener('message',async ev=>{const raw=typeof ev.data==='string'?ev.data:await ev.data.text();const m=JSON.parse(raw);
  if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}
  if(m.method==='Log.entryAdded')logs.push(m.params.entry.level+': '+String(m.params.entry.text).slice(0,150));
  if(m.method==='Runtime.consoleAPICalled')logs.push('console: '+(m.params.args||[]).map(a=>String(a.value||a.description||'')).join(' ').slice(0,150));
  if(m.method==='Page.frameNavigated')frames.push(m.params.frame.url.slice(0,90));
});
await new Promise(r=>sock.addEventListener('open',r));
const send=(method,params={},sessionId)=>new Promise(res=>{const mid=++id;pend.set(mid,res);sock.send(JSON.stringify({id:mid,method,params,sessionId}))});
const {result:t}=await send('Target.createTarget',{url:'about:blank'});
const {result:a}=await send('Target.attachToTarget',{targetId:t.targetId,flatten:true});
const S=a.sessionId;
await send('Page.enable',{},S); await send('Log.enable',{},S); await send('Runtime.enable',{},S);
await send('Page.navigate',{url:'https://encorercm.com/'},S);
await wait(12000);
console.log('frames navigated:'); frames.forEach(f=>console.log('   ',f));
console.log('log entries mentioning the widget or security:');
logs.filter(l=>/reputation|frame|refus|blocked|security|X-Frame|CSP/i.test(l)).slice(0,10).forEach(l=>console.log('   ',l));
console.log('total log entries:', logs.length);
sock.close(); chrome.kill();
