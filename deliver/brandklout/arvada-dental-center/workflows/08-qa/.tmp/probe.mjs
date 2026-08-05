// Find what actually overflows next-door at 320px, including elements whose own
// content is wider than their box (a long unbreakable word in a grid item).
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const design = path.resolve(here, "../../04-design/.tmp");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9750 + Math.floor(Math.random() * 150);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-probe-"));
spawn(CHROME, ["--headless=new","--disable-gpu","--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--window-size=1440,1000",
  "--no-first-run","--no-default-browser-check",`--user-data-dir=${profile}`,"about:blank"]);
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
const ev=async(e)=>(await send("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true},sessionId))?.result?.value;

const PROBE = `(() => {
  const docW = document.documentElement.clientWidth;
  const out = [];
  document.querySelectorAll('*').forEach(el => {
    const cs = getComputedStyle(el);
    const scrolls = cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowX === 'hidden';
    const selfOver = el.scrollWidth > el.clientWidth + 1 && !scrolls;
    const r = el.getBoundingClientRect();
    if (selfOver || r.right > docW + 0.5) {
      out.push({
        tag: el.tagName,
        cls: (typeof el.className === 'string' ? el.className : '').slice(0, 44),
        right: Math.round(r.right), w: Math.round(r.width),
        scrollW: el.scrollWidth, clientW: el.clientWidth,
        txt: (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 34)
      });
    }
  });
  return JSON.stringify({ docW, scrollW: document.documentElement.scrollWidth, bodyScrollW: document.body.scrollWidth, out }, null, 1);
})()`;

for (const w of [320, 360]) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: 800, deviceScaleFactor: 1, mobile: true }, sessionId);
  await send("Page.navigate", { url: pathToFileURL(path.join(design, "next-door", "index.html")).href }, sessionId);
  await wait(2000);
  await ev("document.fonts ? document.fonts.ready.then(()=>1) : 1");
  await wait(400);
  console.log(`\n=== next-door @${w}px`);
  console.log(await ev(PROBE));
}
process.exit(0);
