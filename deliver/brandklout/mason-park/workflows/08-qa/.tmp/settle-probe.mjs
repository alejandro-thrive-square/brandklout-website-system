// Does the document keep changing height AFTER ScrollTrigger has measured it?
// Samples scrollHeight and every pin's cached start over the first ~15s.
//   node settle-probe.mjs [url]
// Source Asana task GID: 1217040406855582
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const URL_ = process.argv[2] || "https://mason-park-dental.webflow.io/thank-you";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9895;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-settle-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, "--window-size=1440,900", "--no-first-run", URL_], { stdio: "ignore" });
const getJSON = (p) => new Promise((res, rej) => { const t=setTimeout(()=>rej(new Error("t")),4000);
  http.get({host:"127.0.0.1",port:PORT,path:p},(r)=>{let b="";r.on("data",d=>b+=d);
  r.on("end",()=>{clearTimeout(t);try{res(JSON.parse(b))}catch(e){rej(e)}})}).on("error",e=>{clearTimeout(t);rej(e)})});
let ws,id=0; const pending=new Map();
for (let i=0;i<40;i++){ try{ const tabs=await getJSON("/json/list");
  const tab=tabs.find(t=>t.type==="page"&&t.webSocketDebuggerUrl);
  if(tab){ws=new WebSocket(tab.webSocketDebuggerUrl);break;} }catch{} await wait(250); }
await new Promise(r=>(ws.onopen=r));
ws.onmessage=(e)=>{const m=JSON.parse(e.data); if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}};
const send=(m,p)=>new Promise(r=>{const i=++id;pending.set(i,r);ws.send(JSON.stringify({id:i,method:m,params:p}))});
const evaluate=async(x)=>(await send("Runtime.evaluate",{expression:x,returnByValue:true,awaitPromise:true})).result?.result?.value;

console.log(" t(ms)  scrollHeight  readyState  imgs(loaded/total)  iframes  pins(start…)");
for (let i = 0; i < 16; i++) {
  await wait(1000);
  const s = await evaluate(`(function(){
    try{
      var imgs = [].slice.call(document.images);
      return { h: Math.round(document.documentElement.scrollHeight),
        rs: document.readyState,
        imgs: imgs.filter(function(x){return x.complete;}).length + '/' + imgs.length,
        frames: document.querySelectorAll('iframe').length,
        pins: (window.ScrollTrigger ? ScrollTrigger.getAll() : []).filter(function(x){return x.pin;})
                .map(function(x){ return (x.trigger&&x.trigger.id)+':'+Math.round(x.start); }).join(' ') };
    }catch(e){ return {h:-1, rs:'err', imgs:'-', frames:-1, pins:e.message}; }
  })()`);
  if (!s) { console.log(`${String((i+1)*1000).padStart(6)}  (no reading)`); continue; }
  console.log(`${String((i+1)*1000).padStart(6)}  ${String(s.h).padStart(12)}  ${s.rs.padEnd(10)}  ${String(s.imgs).padEnd(18)}  ${String(s.frames).padStart(7)}  ${s.pins}`);
}
ws.close(); chrome.kill(); process.exit(0);
