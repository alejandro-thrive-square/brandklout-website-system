import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9533 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-vs-"));
const url = process.argv[2];
const chrome = spawn(CHROME, ["--headless=new","--disable-gpu","--hide-scrollbars",`--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--force-device-scale-factor=1","--window-size=1440,900","--no-first-run","--no-default-browser-check",`--user-data-dir=${profile}`,"about:blank"]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJSON(p){return new Promise((res,rej)=>{http.get({host:"127.0.0.1",port:PORT,path:p},(r)=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)))}).on("error",rej)})}
let wsUrl; for(let i=0;i<50;i++){try{const v=await getJSON("/json/version"); if(v.webSocketDebuggerUrl){wsUrl=v.webSocketDebuggerUrl;break}}catch{} await wait(200)}
const ws = new WebSocket(wsUrl); let id=0; const pending=new Map();
ws.addEventListener("message",(ev)=>{const m=JSON.parse(ev.data); if(m.id&&pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id)}});
await new Promise(r=>ws.addEventListener("open",r,{once:true}));
const send=(method,params={},sessionId)=>new Promise(res=>{const mid=++id;pending.set(mid,res);ws.send(JSON.stringify({id:mid,method,params,sessionId}))});
const {targetInfos}=await send("Target.getTargets");
const {sessionId}=await send("Target.attachToTarget",{targetId:targetInfos.find(t=>t.type==="page").targetId,flatten:true});
await send("Page.enable",{},sessionId);
await send("Page.navigate",{url},sessionId);
await wait(2500);
const ev=async(expr)=>{const r=await send("Runtime.evaluate",{expression:expr,returnByValue:true,awaitPromise:true},sessionId);return r.result?.value ?? r.result};

// dwell at each data-reveal element for 600ms
const report = await ev(`(async () => {
  const out = [];
  const items = [...document.querySelectorAll("[data-reveal]")];
  for (const el of items) {
    const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight/2;
    window.scrollTo(0, Math.max(0, y));
    await new Promise(r => setTimeout(r, 600));
    out.push({ cls: (el.className||"(no class)").toString().slice(0,40), vis: el.classList.contains("is-visible"),
      rect: Math.round(el.getBoundingClientRect().top) });
  }
  await new Promise(r => setTimeout(r, 800));
  const still = items.filter(e=>!e.classList.contains("is-visible")).map(e=>(e.className||"(no class)").toString().slice(0,40));
  return { out, still };
})()`);
console.log(JSON.stringify(report,null,2));
ws.close(); chrome.kill(); process.exit(0);
