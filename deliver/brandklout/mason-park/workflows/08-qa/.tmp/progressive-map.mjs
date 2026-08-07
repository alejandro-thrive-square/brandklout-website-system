// Does the map un-crop for a user who scrolls PROGRESSIVELY (as opposed to the
// gate, which teleports to an absolute y and gets clamped)?
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9891;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-prog-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, "--window-size=1440,900", "--no-first-run",
  "https://mason-park-dental.webflow.io/thank-you"], { stdio: "ignore" });
const getJSON = (p) => new Promise((res, rej) => { const t=setTimeout(()=>rej(new Error("t")),4000);
  http.get({host:"127.0.0.1",port:PORT,path:p},(r)=>{let b="";r.on("data",d=>b+=d);
  r.on("end",()=>{clearTimeout(t);try{res(JSON.parse(b))}catch(e){rej(e)}})}).on("error",e=>{clearTimeout(t);rej(e)})});
let ws,id=0; const pending=new Map();
for (let i=0;i<40;i++){ try{ const tabs=await getJSON("/json/list");
  const tab=tabs.find(t=>t.type==="page"&&t.webSocketDebuggerUrl);
  if(tab){ws=new WebSocket(tab.webSocketDebuggerUrl);break;} }catch{} await wait(300); }
await new Promise(r=>(ws.onopen=r));
ws.onmessage=(e)=>{const m=JSON.parse(e.data); if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}};
const send=(m,p)=>new Promise(r=>{const i=++id;pending.set(i,r);ws.send(JSON.stringify({id:i,method:m,params:p}))});
const evaluate=async(x)=>(await send("Runtime.evaluate",{expression:x,returnByValue:true,awaitPromise:true})).result?.result?.value;
await wait(7000);

// walk down in 400px steps, the way a person scrolls
let last = -1, seen = new Set();
for (let i = 0; i < 60; i++) {
  await evaluate(`window.scrollBy(0, 400)`);
  await wait(220);
  const s = await evaluate(`(function(){
    var t = ScrollTrigger.getAll().filter(x=>x.trigger&&x.trigger.id==='findPin')[0];
    return { y: Math.round(scrollY), max: Math.round(document.documentElement.scrollHeight-innerHeight),
             prog: +t.progress.toFixed(2),
             clip: getComputedStyle(document.getElementById('mapFrame')).clipPath };
  })()`);
  seen.add(s.clip);
  if (s.prog > 0 && s.prog < 1) console.log(`  y=${String(s.y).padStart(5)} max=${s.max} findPin prog=${s.prog}  clip=${s.clip}`);
  if (s.y === last) break;
  last = s.y;
}
console.log('\ndistinct clip values seen while scrolling:', seen.size);
console.log([...seen].join('\n  '));
ws.close(); chrome.kill(); process.exit(0);
