// Viewport-only capture at a given scroll depth, for checking sticky/docked UI
// that a full-page capture cannot show (the offer chip, the mobile action bar).
// Usage: node shot-at.mjs <slug> <width> <fraction 0-1> <outName>
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const [, , slug, widthArg, fracArg, outName] = process.argv;
const width = Number(widthArg) || 1440;
const frac = Number(fracArg) || 0.5;

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9200 + Math.floor(Math.random() * 200);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-at-"));
spawn(CHROME, ["--headless=new","--disable-gpu","--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--force-device-scale-factor=1",
  `--window-size=${width},900`,"--no-first-run","--no-default-browser-check",
  `--user-data-dir=${profile}`,"about:blank"]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJSON(p){return new Promise((res,rej)=>{http.get({host:"127.0.0.1",port:PORT,path:p},(r)=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)))}).on("error",rej)})}
let wsUrl; for(let i=0;i<40&&!wsUrl;i++){try{wsUrl=(await getJSON("/json/version")).webSocketDebuggerUrl}catch{} if(!wsUrl)await wait(200)}
const ws=new WebSocket(wsUrl); let id=0; const pending=new Map();
ws.addEventListener("message",(e)=>{const m=JSON.parse(e.data); if(m.id&&pending.has(m.id)){pending.get(m.id)(m.result??m.error);pending.delete(m.id)}});
await new Promise(r=>ws.addEventListener("open",r,{once:true}));
const send=(method,params={},sid)=>new Promise(res=>{const mid=++id;pending.set(mid,res);ws.send(JSON.stringify({id:mid,method,params,sessionId:sid}))});
const {targetInfos}=await send("Target.getTargets");
const t=targetInfos.find(x=>x.type==="page");
const {sessionId}=await send("Target.attachToTarget",{targetId:t.targetId,flatten:true});
await send("Page.enable",{},sessionId); await send("Runtime.enable",{},sessionId);
await send("Emulation.setFocusEmulationEnabled",{enabled:true},sessionId);
await send("Page.bringToFront",{},sessionId);
await send("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:width<700},sessionId);
const ev=async(e)=>(await send("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true},sessionId))?.result?.value;
await send("Page.navigate",{url:pathToFileURL(path.join(root,slug,"index.html")).href},sessionId);
for(let i=0;i<60;i++){if(await ev("document.documentElement.getAttribute('data-js')==='on'"))break;await wait(100)}
await ev("document.fonts?document.fonts.ready.then(()=>1):1");
await ev(`(async()=>{const max=document.documentElement.scrollHeight-innerHeight;
  const step=innerHeight*0.5, target=Math.round(max*${frac});
  for(let y=0;y<=target;y+=step){scrollTo(0,y);await new Promise(r=>setTimeout(r,150));}
  scrollTo(0,target); await new Promise(r=>setTimeout(r,900));})()`);
const shot=await send("Page.captureScreenshot",{format:"png"},sessionId);
const out=path.join(root,slug,outName||`at-${Math.round(frac*100)}-${width}.png`);
fs.writeFileSync(out,Buffer.from(shot.data,"base64"));
console.log("wrote",path.relative(root,out));
console.log("  chip docked:",await ev("!!document.querySelector('.offer-chip.is-on')"),
  "| action bar on:",await ev("!!document.querySelector('.actionbar.is-on')"));
process.exit(0);
