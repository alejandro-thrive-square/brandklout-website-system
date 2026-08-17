// Full-resolution crop capture. Usage: node crop.mjs <fileUrl> <outPng> <width> <y> <h> [reduced] [settleMs]
import { spawn } from "node:child_process"; import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const [, , fileUrl, outPng, wArg, yArg, hArg, reduced, settleArg] = process.argv;
const width = Number(wArg) || 1440;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9500 + Math.floor(Math.random()*400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-"));
const chrome = spawn(CHROME, ["--headless=new","--disable-gpu","--hide-scrollbars",`--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--force-device-scale-factor=1",`--window-size=${width},1000`,"--no-first-run",`--user-data-dir=${profile}`,"about:blank"]);
const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
async function getJSON(p){return new Promise((res,rej)=>{http.get({host:"127.0.0.1",port:PORT,path:p},r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)))}).on("error",rej)})}
let wsUrl; for(let i=0;i<40;i++){try{const v=await getJSON("/json/version");if(v.webSocketDebuggerUrl){wsUrl=v.webSocketDebuggerUrl;break}}catch{} await wait(200)}
const ws=new WebSocket(wsUrl); let id=0; const pending=new Map();
ws.addEventListener("message",ev=>{const m=JSON.parse(ev.data); if(m.id&&pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id)}});
await new Promise(r=>ws.addEventListener("open",r,{once:true}));
const send=(method,params={},sessionId)=>new Promise(res=>{const mid=++id;pending.set(mid,res);ws.send(JSON.stringify({id:mid,method,params,sessionId}))});
const {targetInfos}=await send("Target.getTargets"); const pt=targetInfos.find(t=>t.type==="page");
const {sessionId}=await send("Target.attachToTarget",{targetId:pt.targetId,flatten:true});
await send("Page.enable",{},sessionId);
await send("Emulation.setEmulatedMedia",{features: reduced==="reduced"?[{name:"prefers-reduced-motion",value:"reduce"}]:[]},sessionId);
await send("Page.navigate",{url:fileUrl},sessionId);
await wait(Number(settleArg)||13000);

await send("Runtime.evaluate", { expression: `(async () => {
  document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
  const step = window.innerHeight;
  for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
    window.scrollTo(0, y); await new Promise(r => setTimeout(r, 90));
  }
  window.scrollTo(0, 0);
  await Promise.all([...document.images].map(i => Promise.race([
    i.complete && i.naturalWidth > 0 ? Promise.resolve() : new Promise(r => { i.onload = r; i.onerror = r; }),
    new Promise(r => setTimeout(r, 8000)),
  ])));
  await new Promise(r => setTimeout(r, 700));
  return [...document.images].filter(i => !i.naturalWidth).length;
})()`, awaitPromise: true, returnByValue: true }, sessionId).then(r => console.log("broken images:", r.result.value));
const walk=await send("Runtime.evaluate",{expression:`(async()=>{document.querySelectorAll('img[loading="lazy"]').forEach(i=>{i.loading='eager'});const s=window.innerHeight;for(let y=0;y<document.documentElement.scrollHeight;y+=s){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,90));}window.scrollTo(0,0);await Promise.all([...document.images].map(i=>Promise.race([i.complete?Promise.resolve():new Promise(r=>{i.onload=r;i.onerror=r;}),new Promise(r=>setTimeout(r,6000))])));await new Promise(r=>setTimeout(r,600));return document.documentElement.scrollHeight;})()`,awaitPromise:true,returnByValue:true},sessionId);
const full=Math.min(Number(walk&&walk.result&&walk.result.value)||1000,16000);
await send("Emulation.setDeviceMetricsOverride",{width,height:full,deviceScaleFactor:1,mobile:false},sessionId);
await wait(1200);
const {data}=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:true,clip:{x:0,y:Number(yArg),width,height:Number(hArg),scale:1}},sessionId);
fs.writeFileSync(outPng,Buffer.from(data,"base64")); console.log("wrote",outPng);
ws.close(); chrome.kill(); process.exit(0);
