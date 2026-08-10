// Where does the element that actually animates sit among the pin's descendants?
// staging-verify samples only the FIRST 40 when no [data-scrub-probe] exists.
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const CASES = [["invisalign","incPin","incFigure"],["new-patient-special","covPin","covFigure"],["thank-you","findPin","mapFrame"]];
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
let port=9910;
for (const [page,pin,target] of CASES) {
  const PORT=port++;
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),"cdp-idx-"));
  const chrome=spawn(CHROME,["--headless=new",`--remote-debugging-port=${PORT}`,`--user-data-dir=${profile}`,
    "--window-size=1440,900","--no-first-run",`https://mason-park-dental.webflow.io/${page}`],{stdio:"ignore"});
  const getJSON=(p)=>new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error("t")),4000);
    http.get({host:"127.0.0.1",port:PORT,path:p},(r)=>{let b="";r.on("data",d=>b+=d);
    r.on("end",()=>{clearTimeout(t);try{res(JSON.parse(b))}catch(e){rej(e)}})}).on("error",e=>{clearTimeout(t);rej(e)})});
  let ws,id=0; const pending=new Map();
  for(let i=0;i<40;i++){try{const tabs=await getJSON("/json/list");
    const tab=tabs.find(t=>t.type==="page"&&t.webSocketDebuggerUrl);
    if(tab){ws=new WebSocket(tab.webSocketDebuggerUrl);break;}}catch{} await wait(250);}
  await new Promise(r=>(ws.onopen=r));
  ws.onmessage=(e)=>{const m=JSON.parse(e.data); if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}};
  const send=(m,p)=>new Promise(r=>{const i=++id;pending.set(i,r);ws.send(JSON.stringify({id:i,method:m,params:p}))});
  const evaluate=async(x)=>(await send("Runtime.evaluate",{expression:x,returnByValue:true,awaitPromise:true})).result?.result?.value;
  await wait(14000);
  const r = await evaluate(`(function(){
    var p = document.getElementById('${pin}'), t = document.getElementById('${target}');
    if (!p || !t) return { err: 'missing ' + (!p ? '${pin}' : '${target}') };
    var all = [].slice.call(p.querySelectorAll('*'));
    return { total: all.length, index: all.indexOf(t),
             withinFirst40: all.indexOf(t) > -1 && all.indexOf(t) < 40,
             probes: p.querySelectorAll('[data-scrub-probe]').length };
  })()`);
  console.log(`${page.padEnd(20)} #${pin.padEnd(9)} -> #${target.padEnd(10)}`, JSON.stringify(r));
  ws.close(); chrome.kill();
}
process.exit(0);
