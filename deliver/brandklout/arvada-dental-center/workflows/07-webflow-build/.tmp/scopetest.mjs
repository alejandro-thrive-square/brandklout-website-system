import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
const CHROME=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p=>existsSync(p));
const DBG=9700+(process.pid%200);
const proc=spawn(CHROME,[`--remote-debugging-port=${DBG}`,'--user-data-dir='+join(process.cwd(),'.tmp','.chrome-scope'),'--no-first-run','--no-default-browser-check','--window-size=800,600','--window-position=-2400,0','about:blank'],{stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let wsUrl; for(let i=0;i<60;i++){try{const r=await fetch(`http://127.0.0.1:${DBG}/json/version`);if(r.ok){const j=await r.json();wsUrl=j.webSocketDebuggerUrl;console.log('Chrome:',j.Browser);break;}}catch{} await wait(400);}
const ws=new WebSocket(wsUrl); await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
let id=0;const pend=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){const{res,rej}=pend.get(m.id);pend.delete(m.id);m.error?rej(new Error(m.error.message)):res(m.result);}};
const send=(me,p={},s)=>{const i=++id;ws.send(JSON.stringify({id:i,method:me,params:p,sessionId:s}));return new Promise((res,rej)=>pend.set(i,{res,rej}));};
const {targetId}=await send('Target.createTarget',{url:'about:blank'});
const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
const ev=async x=>{const r=await send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true},sessionId);return r.exceptionDetails?{__err:r.exceptionDetails.exception?.description}:r.result.value;};
console.log('supports @scope :', await ev(`CSS.supports('selector(:scope)') && (function(){try{var s=new CSSStyleSheet();s.replaceSync('@scope (.a){:scope{color:red}}');return s.cssRules.length>0&&s.cssRules[0].constructor.name;}catch(e){return 'ERR '+e.message}})()`));
console.log('applies         :', await ev(`(function(){
  var d=document.createElement('div'); d.className='a';
  var inner=document.createElement('p'); inner.className='b'; d.appendChild(inner);
  var st=document.createElement('style');
  st.textContent='@scope (.a){:scope{display:flex;background:rgb(1,2,3)} .b{color:rgb(9,8,7)}}';
  document.head.appendChild(st); document.body.appendChild(d);
  var cs=getComputedStyle(d), ci=getComputedStyle(inner);
  return {rootDisplay:cs.display, rootBg:cs.backgroundColor, innerColor:ci.color};})()`));
try{await send('Browser.close');}catch{} proc.kill();
