// Confirms the doctor portrait fully decodes and paints (img.complete=false in a
// capture is a decode-timing artifact, not a broken image — QA report §7 note 3).
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe";
const slug=process.argv[2], outPng=process.argv[3];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=9900+Math.floor(Math.random()*80);
const profile=fs.mkdtempSync(path.join(os.tmpdir(),"cdp-dec-"));
const chrome=spawn(CHROME,["--headless=new","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--hide-scrollbars","--force-prefers-reduced-motion","--window-size=1440,900",`--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--force-device-scale-factor=1","--no-first-run",`--user-data-dir=${profile}`,"about:blank"]);
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
const ev=e=>send("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true},sessionId).then(r=>r?.result?.value);
await send("Page.navigate",{url:`https://mason-park-dental.webflow.io/${slug}`},sessionId);
for(let i=0;i<100;i++){ if(await ev("document.readyState")==="complete") break; await wait(300); }
await ev(`(async()=>{const s=Math.max(300,innerHeight*0.7);for(let y=0;y<document.documentElement.scrollHeight;y+=s){scrollTo(0,y);await new Promise(r=>setTimeout(r,150));}return 1})()`);
const res=await ev(`(async()=>{
  const img=document.querySelector('img.lp_doctor_image');
  if(!img) return {err:'no img'};
  img.scrollIntoView({block:'center'});
  await new Promise(r=>setTimeout(r,1500));
  let decoded=null; try{ await img.decode(); decoded=true;}catch(e){decoded='ERR '+e.message;}
  const r=img.getBoundingClientRect();
  return {src:img.currentSrc, complete:img.complete, decoded,
          natural:[img.naturalWidth,img.naturalHeight],
          rendered:[Math.round(r.width),Math.round(r.height)],
          topAbs:Math.round(r.top+scrollY)};
})()`);
console.log(JSON.stringify(res));
await wait(1200);
const shotY = res.topAbs;
await send("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false},sessionId);
await ev(`scrollTo(0,${Math.max(0,shotY-60)})`);
await wait(1000);
const {data}=await send("Page.captureScreenshot",{format:"png"},sessionId);
fs.writeFileSync(outPng,Buffer.from(data,"base64"));
console.log("shot written",outPng);
sock.close(); chrome.kill(); await wait(600);
try{fs.rmSync(profile,{recursive:true,force:true})}catch{}
