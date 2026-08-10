// Hypothesis: the page grows AFTER ScrollTrigger's last refresh (the map iframe
// and images land late), so every trigger below the growth keeps a stale
// start/end and never advances. Compare cached geometry with reality, then
// refresh and re-measure.  Source Asana task GID: 1217040406855582
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const URL_ = process.argv[2] || "https://mason-park-dental.webflow.io/thank-you";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9873;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-ref-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, "--window-size=1440,900", "--no-first-run", URL_], { stdio: "ignore" });
const getJSON = (p) => new Promise((res, rej) => { const t=setTimeout(()=>rej(new Error("t")),4000);
  http.get({host:"127.0.0.1",port:PORT,path:p},(r)=>{let b="";r.on("data",d=>b+=d);
  r.on("end",()=>{clearTimeout(t);try{res(JSON.parse(b))}catch(e){rej(e)}})}).on("error",e=>{clearTimeout(t);rej(e)})});
let ws,id=0; const pending=new Map();
for (let i=0;i<40;i++){ try{ const tabs=await getJSON("/json/list");
  const tab=tabs.find(t=>t.type==="page"&&t.webSocketDebuggerUrl);
  if(tab){ws=new WebSocket(tab.webSocketDebuggerUrl);break;} }catch{} await wait(300); }
await new Promise(r=>(ws.onopen=r));
ws.onmessage=(e)=>{const m=JSON.parse(e.data); if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}};
const send=(method,params)=>new Promise(r=>{const i=++id;pending.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
const evaluate=async(x)=>(await send("Runtime.evaluate",{expression:x,returnByValue:true,awaitPromise:true})).result?.result?.value;

const REPORT = `(function(){
  return { docHeight: Math.round(document.documentElement.scrollHeight),
    pins: ScrollTrigger.getAll().filter(function(s){return s.pin;}).map(function(s){
      var el = s.trigger, real = Math.round(el.getBoundingClientRect().top + scrollY);
      return { id: el.id, cachedStart: Math.round(s.start), realTop: real,
               drift: real - Math.round(s.start), progress: +s.progress.toFixed(3) };
    }) };
})()`;

await wait(7000);
console.log("=== as the page loads it (no refresh) ===");
console.log(JSON.stringify(await evaluate(REPORT), null, 1));

await evaluate(`ScrollTrigger.refresh()`); await wait(1500);
console.log("\n=== after an explicit ScrollTrigger.refresh() ===");
console.log(JSON.stringify(await evaluate(REPORT), null, 1));

const info = await evaluate(`(function(){var s=ScrollTrigger.getAll().filter(x=>x.trigger&&x.trigger.id==='findPin')[0];
  return {start:Math.round(s.start),end:Math.round(s.end)};})()`);
console.log("\n=== map clip across findPin, post-refresh ===  range", JSON.stringify(info));
for (const f of [0, 0.5, 1]) {
  const y = Math.round(info.start + (info.end-info.start)*f);
  await evaluate(`window.scrollTo(0, ${y})`);
  await wait(1200);
  const s = await evaluate(`(function(){
    var t = ScrollTrigger.getAll().filter(x=>x.trigger&&x.trigger.id==='findPin')[0];
    return { asked: ${y}, scrollY: Math.round(scrollY),
             stScroll: Math.round(ScrollTrigger.getAll()[0].scroller === window ? scrollY : -1),
             maxScroll: Math.round(document.documentElement.scrollHeight - innerHeight),
             prog: +t.progress.toFixed(3), isActive: t.isActive,
             clip: getComputedStyle(document.getElementById('mapFrame')).clipPath };
  })()`);
  console.log('  ' + JSON.stringify(s));
}
ws.close(); chrome.kill(); process.exit(0);
