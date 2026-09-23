// Which element actually sets the document's horizontal extent at mobile width?
// body{overflow-x:clip} hides this from scrollWidth, and the earlier scan skipped
// zero-size / hidden boxes, so scan everything and rank by right edge.
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const [, , SLUG, W = "390"] = process.argv; const WIDTH = +W;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://mason-park-dental.webflow.io";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const PORT = 9100 + Math.floor(Math.random()*90);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-wide-"));
const vh = WIDTH <= 430 ? 844 : 900;
const chrome = spawn(CHROME, ["--headless=new","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader",
 "--hide-scrollbars","--force-prefers-reduced-motion","--disable-smooth-scrolling",`--window-size=${WIDTH},${vh}`,
 `--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--force-device-scale-factor=1","--no-first-run",
 `--user-data-dir=${profile}`,"about:blank"]);
const getJSON = (p) => new Promise((res, rej) => { http.get({host:"127.0.0.1",port:PORT,path:p},(r)=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)));}).on("error",rej); });
let wsUrl=null; for(let i=0;i<80&&!wsUrl;i++){try{wsUrl=(await getJSON("/json/version")).webSocketDebuggerUrl;}catch{} if(!wsUrl)await wait(200);}
const ws=new WebSocket(wsUrl); let id=0; const pend=new Map();
ws.addEventListener("message",e=>{const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id);}});
await new Promise(r=>ws.addEventListener("open",r,{once:true}));
const send=(method,params={},sid)=>new Promise((res,rej)=>{const i=++id;pend.set(i,m=>m.error?rej(new Error(method+": "+m.error.message)):res(m.result));ws.send(JSON.stringify({id:i,method,params,sessionId:sid}));});
const {targetInfos}=await send("Target.getTargets"); const t=targetInfos.find(x=>x.type==="page");
const {sessionId}=await send("Target.attachToTarget",{targetId:t.targetId,flatten:true});
await send("Page.enable",{},sessionId); await send("Runtime.enable",{},sessionId);
await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]},sessionId);
await send("Emulation.setDeviceMetricsOverride",{width:WIDTH,height:vh,deviceScaleFactor:1,mobile:WIDTH<=430},sessionId);
const ev=e=>send("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true},sessionId).then(r=>r?.result?.value);
await send("Page.navigate",{url:`${BASE}/${SLUG}`},sessionId);
for(let i=0;i<90;i++){ if(await ev("document.readyState")==="complete") break; await wait(300); }
await ev(`(async()=>{const s=Math.max(300,innerHeight*0.7);for(let y=0;y<document.documentElement.scrollHeight;y+=s){scrollTo(0,y);await new Promise(r=>setTimeout(r,100));}scrollTo(0,0);await new Promise(r=>setTimeout(r,1200));return 1})()`);
console.log(JSON.stringify(await ev(`(function(){
  const de=document.documentElement, vp=de.clientWidth;
  const rows=[];
  for(const el of document.querySelectorAll("body *")){
    const r=el.getBoundingClientRect(); if(r.right<=vp+1) continue;
    const s=getComputedStyle(el);
    rows.push({tag:el.tagName.toLowerCase(),cls:(typeof el.className==='string'?el.className:'').slice(0,55),
      right:Math.round(r.right),w:Math.round(r.width),h:Math.round(r.height),
      display:s.display,ws:s.whiteSpace,pos:s.position,vis:s.visibility});
  }
  rows.sort((a,b)=>b.right-a.right);
  return {layoutViewport:vp,innerWidth,docScrollWidth:de.scrollWidth,count:rows.length,top:rows.slice(0,10)};
})()`),null,1));
ws.close(); chrome.kill(); try{fs.rmSync(profile,{recursive:true,force:true});}catch{}
