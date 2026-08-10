import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const html = readFileSync('.tmp/sections/implants/arrival.html','utf8');
const css = html.match(/<style data-embed[^>]*>([\s\S]*?)<\/style>/)[1];
const CHROME=['C:/Program Files/Google/Chrome/Application/chrome.exe'].find(p=>existsSync(p));
const DBG=9600+(process.pid%150);
const proc=spawn(CHROME,[`--remote-debugging-port=${DBG}`,'--user-data-dir='+join(process.cwd(),'.tmp','.chrome-css'),'--no-first-run','--no-default-browser-check','--window-size=800,600','--window-position=-2400,0','about:blank'],{stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let wsUrl; for(let i=0;i<60;i++){try{const r=await fetch(`http://127.0.0.1:${DBG}/json/version`);if(r.ok){wsUrl=(await r.json()).webSocketDebuggerUrl;break;}}catch{} await wait(400);}
const ws=new WebSocket(wsUrl); await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
let id=0;const pend=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){const{res,rej}=pend.get(m.id);pend.delete(m.id);m.error?rej(new Error(m.error.message)):res(m.result);}};
const send=(me,p={},s)=>{const i=++id;ws.send(JSON.stringify({id:i,method:me,params:p,sessionId:s}));return new Promise((res,rej)=>pend.set(i,{res,rej}));};
const {targetId}=await send('Target.createTarget',{url:'about:blank'});
const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
const ev=async x=>{const r=await send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true},sessionId);return r.exceptionDetails?{__err:r.exceptionDetails.exception?.description?.slice(0,300)}:r.result.value;};
console.log(await ev(`(function(){
  var s=new CSSStyleSheet();
  s.replaceSync(${JSON.stringify(css)});
  var top=Array.from(s.cssRules).map(function(r){return r.constructor.name+' :: '+(r.cssText||'').slice(0,70)});
  var scope=Array.from(s.cssRules).find(function(r){return r.constructor.name==='CSSScopeRule'});
  return { topLevelRules: top.slice(0,6), topCount: s.cssRules.length,
           scopeInner: scope ? scope.cssRules.length : null,
           scopePreview: scope ? Array.from(scope.cssRules).slice(0,4).map(function(r){return (r.cssText||'').slice(0,90)}) : null };})()`));
try{await send('Browser.close');}catch{} proc.kill();
