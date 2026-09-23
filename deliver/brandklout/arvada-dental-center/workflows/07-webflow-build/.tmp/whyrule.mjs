import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, resolve, extname } from 'node:path';
const DESIGN = resolve(process.cwd(), '../04-design/.tmp');
const MIME={'.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.css':'text/css'};
const full = readFileSync('.tmp/sections/next-door/page.html','utf8');
let host='';
const server=createServer((req,res)=>{const u=decodeURIComponent(req.url.split('?')[0]);
 if(u==='/host'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(host);}
 for(const [p,d] of [['/gsap/',join(DESIGN,'_shared','vendor','gsap')],['/assets/',join(DESIGN,'_shared','assets')]]){
  if(u.startsWith(p)){const f=join(d,u.slice(p.length)); if(existsSync(f)){res.writeHead(200,{'Content-Type':MIME[extname(f)]||'application/octet-stream'});return res.end(readFileSync(f));}}}
 res.writeHead(404);res.end();});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const PORT=server.address().port;
const body = full.slice(full.indexOf('<body>')+6, full.lastIndexOf('</body>'))
  .replaceAll('src="',`src="http://127.0.0.1:${PORT}/assets/`).replaceAll(`src="http://127.0.0.1:${PORT}/assets/http`,'src="http');
host=`<!doctype html><meta charset="utf-8"><script>window.WZSR_CDN='http://127.0.0.1:${PORT}/gsap/';</script><body><div id="slot"></div>`;
const CHROME=['C:/Program Files/Google/Chrome/Application/chrome.exe'].find(p=>existsSync(p));
const DBG=9500+(process.pid%150);
const proc=spawn(CHROME,[`--remote-debugging-port=${DBG}`,'--user-data-dir='+join(process.cwd(),'.tmp','.chrome-why'),'--no-first-run','--no-default-browser-check','--window-size=1440,900','--window-position=-2400,0','about:blank'],{stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let wsUrl; for(let i=0;i<60;i++){try{const r=await fetch(`http://127.0.0.1:${DBG}/json/version`);if(r.ok){wsUrl=(await r.json()).webSocketDebuggerUrl;break;}}catch{} await wait(400);}
const ws=new WebSocket(wsUrl); await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
let id=0;const pend=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){const{res,rej}=pend.get(m.id);pend.delete(m.id);m.error?rej(new Error(m.error.message)):res(m.result);}};
const send=(me,p={},s)=>{const i=++id;ws.send(JSON.stringify({id:i,method:me,params:p,sessionId:s}));return new Promise((res,rej)=>pend.set(i,{res,rej}));};
const {targetId}=await send('Target.createTarget',{url:'about:blank'});
const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false},sessionId);
await send('Page.navigate',{url:`http://127.0.0.1:${PORT}/host`},sessionId);
const ev=async x=>{const r=await send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true},sessionId);return r.exceptionDetails?{__err:r.exceptionDetails.exception?.description?.slice(0,300)}:r.result.value;};
for(let i=0;i<60;i++){ if(await ev(`!!document.getElementById('slot')`)) break; await wait(150);}
await ev(`document.getElementById('slot').innerHTML=${JSON.stringify(body)}`);
await wait(1200);
console.log(JSON.stringify(await ev(`(function(){
  var el=document.querySelector('.nxd-yr-note'); if(!el) return 'no element';
  var hits=[];
  function scan(rules, ctx){
    for (var i=0;i<rules.length;i++){ var r=rules[i];
      if (r.cssRules) { scan(r.cssRules, (r.conditionText||r.cssText.split('{')[0])); continue; }
      if (!r.selectorText) continue;
      r.selectorText.split(',').forEach(function(s){
        s=s.trim();
        try { if (el.matches(s.replace(/:scope/g,'.nxd-years'))) hits.push({ctx:ctx||'', sel:s, css:(r.style.cssText||'').slice(0,90)}); } catch(e){}
      });
    }
  }
  for (var i=0;i<document.styleSheets.length;i++){
    try { scan(document.styleSheets[i].cssRules, ''); } catch(e){}
  }
  return { computedFontSize:getComputedStyle(el).fontSize, matched:hits };})()`), null, 2));
try{await send('Browser.close');}catch{} proc.kill(); server.close();
