// Does the document height ever hold still? Samples every 300ms for 24s and
// reports the distinct values and where the change comes from.
//   node height-oscillation.mjs [url]
// Source Asana task GID: 1217040406855582
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const URL_ = process.argv[2] || "https://mason-park-dental.webflow.io/invisalign";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9897;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-osc-"));
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

const seq = [];
for (let i = 0; i < 80; i++) {
  await wait(300);
  const s = await evaluate(`(function(){ try { return {
      h: Math.round(document.documentElement.scrollHeight),
      body: Math.round(document.body.scrollHeight),
      rs: document.readyState,
      tallest: (function(){
        var best = null, bh = 0;
        [].slice.call(document.body.querySelectorAll('*')).forEach(function(el){
          var r = el.getBoundingClientRect();
          if (r.height > bh) { bh = r.height; best = (el.id||el.className||el.tagName).toString().slice(0,40); }
        });
        return best + ' @' + Math.round(bh);
      })()
    }; } catch(e){ return null; } })()`);
  if (s) seq.push(s);
}
const uniq = [...new Set(seq.map(s => s.h))];
console.log('samples:', seq.length, ' distinct scrollHeights:', uniq.length);
console.log('values:', uniq.join(', '));
console.log('\nlast 12 samples:');
for (const s of seq.slice(-12)) console.log(`  h=${s.h} body=${s.body} rs=${s.rs} tallest=${s.tallest}`);
ws.close(); chrome.kill(); process.exit(0);
