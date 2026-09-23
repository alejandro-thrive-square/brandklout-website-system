// Full-page screenshot via CDP. usage: node fullshot.mjs <url> <out.png> [width] [--nojs]
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const url = process.argv[2], out = process.argv[3], W = +(process.argv[4] || 1440);
const NOJS = process.argv.includes("--nojs");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9700 + Math.floor(Math.random() * 200);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-full-"));
const chrome = spawn(CHROME, ["--headless=new","--disable-gpu","--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--force-device-scale-factor=1",
  `--window-size=${W},1000`,"--no-first-run","--no-default-browser-check",
  "--autoplay-policy=no-user-gesture-required",`--user-data-dir=${profile}`,"about:blank"]);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const getJSON = (p) => new Promise((res, rej) => { http.get({host:"127.0.0.1",port:PORT,path:p},(r)=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)));}).on("error",rej); });
async function findWs(){ for(let i=0;i<150;i++){ try{const v=await getJSON("/json/version"); if(v.webSocketDebuggerUrl) return v.webSocketDebuggerUrl;}catch{} await wait(300);} throw new Error("no CDP"); }
const ws = new WebSocket(await findWs());
let id=0; const pending=new Map();
ws.addEventListener("message", async ev => { const raw = typeof ev.data==="string"?ev.data:await ev.data.text(); const m=JSON.parse(raw); if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);} });
await new Promise(r=>ws.addEventListener("open",r,{once:true}));
function send(method,params={},sessionId){ return new Promise((res,rej)=>{ const mid=++id; const t=setTimeout(()=>rej(new Error("timeout "+method)),90000); pending.set(mid,(m)=>{clearTimeout(t); m.error?rej(new Error(m.error.message)):res(m.result);}); ws.send(JSON.stringify({id:mid,method,params,sessionId})); }); }
const targets = await getJSON("/json/list");
const page = targets.find(t=>t.type==="page");
const { sessionId } = await send("Target.attachToTarget",{targetId:page.id,flatten:true});
const S=(m,p={})=>send(m,p,sessionId);
await S("Page.enable"); await S("Runtime.enable"); await S("Emulation.setDeviceMetricsOverride",{width:W,height:1000,deviceScaleFactor:1,mobile:false});
if (NOJS) await S("Emulation.setScriptExecutionDisabled",{value:true});
await S("Page.navigate",{url});
await wait(NOJS?4000:9000);
if (!NOJS) {
  // walk the page so scrubbed/scroll-triggered timelines settle
  await S("Runtime.evaluate",{expression:`(async()=>{const H=document.documentElement.scrollHeight;for(let y=0;y<H;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));}window.scrollTo(0,0);await new Promise(r=>setTimeout(r,800));})()`,awaitPromise:true});
  await wait(1500);
}
const { result:{ value: h } } = await S("Runtime.evaluate",{expression:"Math.ceil(Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, (document.querySelector('#smooth-content')||{}).scrollHeight||0))"});
await S("Emulation.setDeviceMetricsOverride",{width:W,height:Math.min(h,30000),deviceScaleFactor:1,mobile:false});
await wait(2500);
const shot = await S("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
fs.writeFileSync(out, Buffer.from(shot.data,"base64"));
console.log("wrote",out,"height",h);
chrome.kill(); process.exit(0);
