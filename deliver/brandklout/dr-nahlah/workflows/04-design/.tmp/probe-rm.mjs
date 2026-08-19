// Ad-hoc CDP probe: scroll to a y offset and evaluate an expression there.
// Usage: node probe.mjs <url> <y> "<js expression>"
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const [url, y, expr] = process.argv.slice(2);
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9800 + Math.floor(Math.random() * 190);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-probe-"));
const chrome = spawn(CHROME, ["--headless=new","--disable-gpu","--hide-scrollbars","--force-prefers-reduced-motion",
  `--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--force-device-scale-factor=1",
  "--window-size=1440,900","--no-first-run","--no-default-browser-check",
  "--autoplay-policy=no-user-gesture-required",`--user-data-dir=${profile}`,"about:blank"]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (p) => new Promise((res, rej) => { http.get({host:"127.0.0.1",port:PORT,path:p},(r)=>{
  let d=""; r.on("data",c=>d+=c); r.on("end",()=>res(JSON.parse(d))); }).on("error",rej); });
let wsUrl; for (let i=0;i<150;i++){ try{ const v=await getJSON("/json/version"); if(v.webSocketDebuggerUrl){wsUrl=v.webSocketDebuggerUrl;break;} }catch{} await wait(300); }
const ws = new WebSocket(wsUrl); let id=0; const pending=new Map();
ws.addEventListener("message", async (ev)=>{ const raw = typeof ev.data==="string"?ev.data:await ev.data.text();
  const m=JSON.parse(raw); if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);} });
await new Promise(r=>ws.addEventListener("open",r,{once:true}));
const send=(method,params={},sessionId)=>new Promise((res,rej)=>{ const mid=++id;
  const t=setTimeout(()=>rej(new Error("timeout "+method)),30000);
  pending.set(mid,(m)=>{clearTimeout(t); m.error?rej(new Error(m.error.message)):res(m.result);});
  ws.send(JSON.stringify({id:mid,method,params,sessionId})); });
const {targetInfos}=await send("Target.getTargets");
const pt=targetInfos.find(t=>t.type==="page");
const {sessionId}=await send("Target.attachToTarget",{targetId:pt.targetId,flatten:true});
await send("Page.enable",{},sessionId); await send("Runtime.enable",{},sessionId);
const ev1=async(e)=>{ const r=await send("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true},sessionId);
  if(r.exceptionDetails) throw new Error(r.exceptionDetails.text+" :: "+e.slice(0,90)); return r.result.value; };
await send("Page.navigate",{url},sessionId); await wait(3500);
await ev1(`document.fonts?document.fonts.ready.then(()=>1):1`); await wait(800);
if (y && +y > 0) {
  await ev1(`(function(){var s=window.WZ&&WZ.smoother; if(s&&s.scrollTo)s.scrollTo(${+y},false); else window.scrollTo(0,${+y}); if(window.ScrollTrigger)ScrollTrigger.update(); return 1})()`);
  await wait(1100);
}
console.log(JSON.stringify(await ev1(expr), null, 2));
ws.close(); chrome.kill(); process.exit(0);
