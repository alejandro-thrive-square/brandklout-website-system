// chip-experiment.mjs — try candidate rules against the LIVE page and measure.
// Inference has been wrong three times about why the chip is tall; this applies
// each candidate in a real browser and reports the resulting box, so the answer
// comes from the renderer instead of from reasoning about the cascade.
// Target: design chip is 165x43 with the tick inline before the text.
// Source Asana task GID: 1217040406855582
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import http from "node:http";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const wait = ms => new Promise(r => setTimeout(r, ms));
const PORT = 9812;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-exp-"));
const chrome = spawn(CHROME, ["--headless=new","--use-gl=angle","--use-angle=swiftshader",
  "--enable-unsafe-swiftshader","--hide-scrollbars","--window-size=1440,1000",
  `--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--force-device-scale-factor=1",
  "--no-first-run",`--user-data-dir=${profile}`,"about:blank"]);
const getJSON = p => new Promise((res, rej) => {
  http.get({host:"127.0.0.1",port:PORT,path:p},(r)=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)));}).on("error",rej);
});
let wsUrl=null;
for(let i=0;i<80&&!wsUrl;i++){ try{wsUrl=(await getJSON("/json/version")).webSocketDebuggerUrl;}catch{} if(!wsUrl) await wait(200); }
const ws=new WebSocket(wsUrl); let id=0; const pend=new Map();
ws.addEventListener("message",e=>{const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m.result);pend.delete(m.id);}});
await new Promise(r=>ws.addEventListener("open",r,{once:true}));
const send=(m,p={},s)=>new Promise(res=>{const i=++id;pend.set(i,res);ws.send(JSON.stringify({id:i,method:m,params:p,sessionId:s}));});
const {targetInfos}=await send("Target.getTargets");
const t=targetInfos.find(x=>x.type==="page");
const {sessionId}=await send("Target.attachToTarget",{targetId:t.targetId,flatten:true});
await send("Page.enable",{},sessionId); await send("Runtime.enable",{},sessionId);
await send("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false},sessionId);
const evaluate=e=>send("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true},sessionId)
  .then(r=>{ if(r?.exceptionDetails) throw new Error("in-page: "+(r.exceptionDetails.exception?.description||r.exceptionDetails.text)); return r?.result?.value; });
await send("Page.navigate",{url:"https://mason-park-dental.webflow.io/invisalign"},sessionId);
for(let i=0;i<150;i++){const st=await evaluate("document.documentElement?document.readyState:''").catch(()=>""); if(st==="interactive"||st==="complete")break; await wait(200);}
await evaluate("new Promise(r=>setTimeout(r,9000))");

const CANDIDATES = [
  ["(current: contents)", ""],
  ["chip flex",              ".chip{display:flex!important;align-items:center!important}"],
  ["chip flex + nowrap",     ".chip{display:flex!important;align-items:center!important;white-space:nowrap!important}"],
  ["chip inline-flex",       ".chip{display:inline-flex!important;align-items:center!important}"],
  ["chip flex, tick shrink0",".chip{display:flex!important;align-items:center!important}.chip .tick{flex:none!important}"],
];
const MEASURE = "(function(){var c=document.querySelectorAll('.chip');var u=document.querySelector('.chips');" +
  "var out=[];for(var i=0;i<c.length;i++){var r=c[i].getBoundingClientRect();out.push(Math.round(r.width)+'x'+Math.round(r.height));}" +
  "return {chips:out.join(' '), ul:Math.round(u.getBoundingClientRect().height)};})()";

console.log("TARGET (design): 165x43 213x43 196x43 213x43   ul=94\n");
for (const [name, css] of CANDIDATES) {
  await evaluate("(function(){var e=document.getElementById('exp');if(e)e.remove();" +
    "if(" + JSON.stringify(css) + "){var s=document.createElement('style');s.id='exp';" +
    "s.textContent=" + JSON.stringify(css) + ";document.head.appendChild(s);}return true;})()");
  await wait(500);
  const m = await evaluate(MEASURE);
  console.log(name.padEnd(24), "ul=" + String(m.ul).padStart(4), " ", m.chips);
}
ws.close(); chrome.kill();
