import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe";
const slug=process.argv[2], outPng=process.argv[3];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=9950+Math.floor(Math.random()*40);
const profile=fs.mkdtempSync(path.join(os.tmpdir(),"cdp-faq-"));
const chrome=spawn(CHROME,["--headless=new","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--hide-scrollbars","--force-prefers-reduced-motion","--window-size=390,844",`--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--force-device-scale-factor=1","--no-first-run",`--user-data-dir=${profile}`,"about:blank"]);
const getJSON=p=>new Promise((res,rej)=>{http.get({host:"127.0.0.1",port:PORT,path:p},r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)))}).on("error",rej)});
let ws=null; for(let i=0;i<80&&!ws;i++){try{ws=(await getJSON("/json/version")).webSocketDebuggerUrl}catch{} if(!ws)await wait(200);}
const sock=new WebSocket(ws); let id=0; const pend=new Map();
sock.addEventListener("message",e=>{const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}});
await new Promise(r=>sock.addEventListener("open",r,{once:true}));
const send=(m,p={},s)=>new Promise((res,rej)=>{const i=++id;pend.set(i,x=>x.error?rej(new Error(m+": "+x.error.message)):res(x.result));sock.send(JSON.stringify({id:i,method:m,params:p,sessionId:s}))});
const {targetInfos}=await send("Target.getTargets");
const t=targetInfos.find(x=>x.type==="page");
const {sessionId}=await send("Target.attachToTarget",{targetId:t.targetId,flatten:true});
await send("Page.enable",{},sessionId); await send("Runtime.enable",{},sessionId);
await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true},sessionId);
const ev=e=>send("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true},sessionId).then(r=>r?.result?.value);
await send("Page.navigate",{url:`https://mason-park-dental.webflow.io/${slug}`},sessionId);
for(let i=0;i<100;i++){ if(await ev("document.readyState")==="complete") break; await wait(300); }
await ev(`(async()=>{const s=Math.max(300,innerHeight*0.7);for(let y=0;y<document.documentElement.scrollHeight;y+=s){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}return 1})()`);
const info=await ev(`(()=>{
 const q=[...document.querySelectorAll('[class*="faq_question"]')];
 if(!q.length) return {err:'none'};
 q[0].scrollIntoView({block:'start'}); scrollBy(0,-40);
 const cw=document.documentElement.clientWidth;
 return {n:q.length, clientWidth:cw, innerWidth:window.innerWidth,
  rows:q.map(e=>{const r=e.getBoundingClientRect();return {right:Math.round(r.right+scrollX),h:Math.round(r.height),ws:getComputedStyle(e).whiteSpace,txt:e.textContent.replace(/\s+/g,' ').trim().slice(0,46)}})};
})()`);
console.log(JSON.stringify(info,null,1));
await wait(900);
const {data}=await send("Page.captureScreenshot",{format:"png"},sessionId);
fs.writeFileSync(outPng,Buffer.from(data,"base64"));
sock.close(); chrome.kill(); await wait(600);
try{fs.rmSync(profile,{recursive:true,force:true})}catch{}
