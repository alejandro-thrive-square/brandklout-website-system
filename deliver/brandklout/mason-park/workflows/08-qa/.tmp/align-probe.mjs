// align-probe.mjs — which ancestor centres the testimonial captions on staging?
// The design leaves them start-aligned; 24/33/9 elements inherit centre on the
// built pages. text-align is inherited, so the culprit is an ancestor, not the
// element the diff named. Prints the ancestor chain with each one's own
// text-align on BOTH sides.
// Source Asana task GID: 1217040406855582
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import http from "node:http"; import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const DESIGN = path.resolve(here, "../../04-design/.tmp");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const wait = ms => new Promise(r => setTimeout(r, ms));
let port = 9970;
async function session(url, fn) {
  const PORT = port++;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-align-"));
  const chrome = spawn(CHROME, ["--headless=new","--hide-scrollbars","--window-size=1440,1000",
    `--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--no-first-run",
    `--user-data-dir=${profile}`,"about:blank"]);
  const getJSON = p => new Promise((res, rej) => {
    http.get({host:"127.0.0.1",port:PORT,path:p},(r)=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)));}).on("error",rej);
  });
  let wsUrl=null;
  for (let i=0;i<80&&!wsUrl;i++){ try{wsUrl=(await getJSON("/json/version")).webSocketDebuggerUrl;}catch{} if(!wsUrl) await wait(200); }
  const ws=new WebSocket(wsUrl); let id=0; const pend=new Map();
  ws.addEventListener("message",e=>{const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m.result);pend.delete(m.id);}});
  await new Promise(r=>ws.addEventListener("open",r,{once:true}));
  const send=(m,p={},s)=>new Promise(res=>{const i=++id;pend.set(i,res);ws.send(JSON.stringify({id:i,method:m,params:p,sessionId:s}));});
  const {targetInfos}=await send("Target.getTargets");
  const t=targetInfos.find(x=>x.type==="page");
  const {sessionId}=await send("Target.attachToTarget",{targetId:t.targetId,flatten:true});
  await send("Page.enable",{},sessionId); await send("Runtime.enable",{},sessionId);
  const evaluate=e=>send("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true},sessionId).then(r=>r?.result?.value);
  await send("Page.navigate",{url},sessionId);
  for(let i=0;i<150;i++){const st=await evaluate(`document.documentElement?document.readyState:""`).catch(()=>"" );
    if(st==="interactive"||st==="complete")break; await wait(200);}
  try { return await fn({evaluate}); } finally { ws.close(); chrome.kill(); await wait(700); }
}
const CHAIN = `(async () => {
  await new Promise(r=>setTimeout(r,6000));
  const el = document.querySelector(".who") || document.querySelector("figcaption");
  if (!el) return "no .who / figcaption found";
  const rows = [];
  for (let p = el; p && p.tagName !== "HTML"; p = p.parentElement) {
    const cs = getComputedStyle(p);
    // inline-style and stylesheet origin both matter; report the computed value
    // plus whether this node is where the value first appears going up.
    const parentAlign = p.parentElement ? getComputedStyle(p.parentElement).textAlign : "(root)";
    rows.push({
      tag: p.tagName.toLowerCase(),
      cls: (typeof p.className === "string" ? p.className : "").trim().slice(0, 80),
      id: p.id || "",
      align: cs.textAlign,
      declaresIt: cs.textAlign !== parentAlign,
    });
  }
  return rows;
})()`;
const page = process.argv[2] || "invisalign";
const localPath = path.join(DESIGN, page, "index.html").split(path.sep).join("/").split(" ").join("%20");
const local = await session("file:///" + localPath, ({ evaluate }) => evaluate(CHAIN));
await wait(3000);
const live = await session(`https://mason-park-dental.webflow.io/${page}`, ({evaluate}) => evaluate(CHAIN));
const show = (label, rows) => {
  console.log("\n-- " + label + " --");
  if (!Array.isArray(rows)) return console.log("  " + rows);
  rows.forEach(r => console.log(`  ${r.declaresIt ? ">>" : "  "} <${r.tag}${r.id?"#"+r.id:""}.${r.cls}>  text-align=${r.align}`));
};
console.log("PAGE " + page + "   ('>>' = this element is where the value changes)");
show("LOCAL DESIGN", local);
show("STAGING", live);
