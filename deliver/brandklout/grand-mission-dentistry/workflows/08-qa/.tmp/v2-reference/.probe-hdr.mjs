import { spawn } from "node:child_process"; import fs from "node:fs"; import os from "node:os";
import path from "node:path"; import http from "node:http";
const CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT=9911, profile=fs.mkdtempSync(path.join(os.tmpdir(),"cdp-hdr-"));
const ch=spawn(CHROME,["--headless=new","--hide-scrollbars",`--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--no-first-run",`--user-data-dir=${profile}`,"--window-size=1440,900","about:blank"]);
const wait=(m)=>new Promise(r=>setTimeout(r,m));
const gj=(p)=>new Promise((res,rej)=>http.get({host:"127.0.0.1",port:PORT,path:p},r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)))}).on("error",rej));
let ws=null; for(let i=0;i<80&&!ws;i++){try{ws=(await gj("/json/version")).webSocketDebuggerUrl}catch{} if(!ws)await wait(200);}
const s=new WebSocket(ws); let id=0; const p=new Map();
s.addEventListener("message",e=>{const m=JSON.parse(e.data); if(m.id&&p.has(m.id)){p.get(m.id)(m);p.delete(m.id)}});
await new Promise(r=>s.addEventListener("open",r,{once:true}));
const send=(m,q={},sid)=>new Promise((res,rej)=>{const i=++id;p.set(i,x=>x.error?rej(new Error(m+": "+x.error.message)):res(x.result));s.send(JSON.stringify({id:i,method:m,params:q,sessionId:sid}))});
const {targetInfos}=await send("Target.getTargets"); const t=targetInfos.find(x=>x.type==="page");
const {sessionId}=await send("Target.attachToTarget",{targetId:t.targetId,flatten:true});
await send("Page.enable",{},sessionId); await send("Runtime.enable",{},sessionId);
const ev=(e)=>send("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true},sessionId).then(r=>r?.result?.value);
await send("Page.navigate",{url:"https://grandmissiondentistry.webflow.io/ads-landing-pages/cosmetic?hdr=1"},sessionId);
for(let k=0;k<300;k++){if(await ev("document.readyState==='complete'"))break;await wait(100);}
await wait(2000);
console.log(JSON.stringify(await ev(`(() => {
  const h=document.querySelector('.header');
  const cs=getComputedStyle(h);
  const chain=[]; let n=h;
  while(n && n!==document.body){const c=getComputedStyle(n);chain.push({cls:n.className,bg:c.backgroundColor,bgi:c.backgroundImage.slice(0,90),pos:c.position,z:c.zIndex,h:Math.round(n.getBoundingClientRect().height)});n=n.parentElement;}
  const kids=[...h.querySelectorAll('*')].slice(0,8).map(k=>({cls:k.className,bg:getComputedStyle(k).backgroundColor,bgi:getComputedStyle(k).backgroundImage.slice(0,60),h:Math.round(k.getBoundingClientRect().height)}));
  return {header:{bg:cs.backgroundColor,bgi:cs.backgroundImage.slice(0,140),pos:cs.position,top:cs.top,z:cs.zIndex,h:Math.round(h.getBoundingClientRect().height),pt:cs.paddingTop,pb:cs.paddingBottom}, chain, kids};
})()`),null,1));
s.close(); ch.kill(); try{fs.rmSync(profile,{recursive:true,force:true})}catch{}
