// sup-probe.mjs — how does each registered-trademark mark actually render?
// The converter wraps every <sup> in a verbatim HtmlEmbed div. A div is block
// level and is not phrasing content, so inside a <p> the parser CLOSES the
// paragraph early and the mark plus any text after it fall out of it. This
// prints, per mark: the wrapper's display, whether it starts a new line, and
// what its parent chain looks like on each side.
// Source Asana task GID: 1217040406855582
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import http from "node:http"; import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const DESIGN = path.resolve(here, "../../04-design/.tmp");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
let port = 9990;
async function session(url, fn) {
  const PORT = port++;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-sup-"));
  const chrome = spawn(CHROME, ["--headless=new","--hide-scrollbars","--window-size=1440,1000",
    `--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--no-first-run",
    `--user-data-dir=${profile}`,"about:blank"]);
  const getJSON = p => new Promise((res, rej) => {
    http.get({host:"127.0.0.1",port:PORT,path:p},(r)=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)));}).on("error",rej);
  });
  let wsUrl = null;
  for (let i=0;i<80&&!wsUrl;i++){ try{ wsUrl=(await getJSON("/json/version")).webSocketDebuggerUrl; }catch{} if(!wsUrl) await wait(200); }
  const ws = new WebSocket(wsUrl); let id=0; const pend=new Map();
  ws.addEventListener("message", e => { const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m.result);pend.delete(m.id);} });
  await new Promise(r => ws.addEventListener("open", r, {once:true}));
  const send=(m,p={},s)=>new Promise(res=>{const i=++id;pend.set(i,res);ws.send(JSON.stringify({id:i,method:m,params:p,sessionId:s}));});
  const {targetInfos}=await send("Target.getTargets");
  const t=targetInfos.find(x=>x.type==="page");
  const {sessionId}=await send("Target.attachToTarget",{targetId:t.targetId,flatten:true});
  await send("Page.enable",{},sessionId); await send("Runtime.enable",{},sessionId);
  const evaluate=e=>send("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true},sessionId).then(r=>r?.result?.value);
  await send("Page.navigate",{url},sessionId);
  for(let i=0;i<150;i++){ const st=await evaluate(`document.documentElement?document.readyState:""`).catch(()=>""); if(st==="interactive"||st==="complete")break; await wait(200); }
  try { return await fn({evaluate}); } finally { ws.close(); chrome.kill(); await wait(700); }
}
const READ = `(async () => {
  await new Promise(r=>setTimeout(r,7000));
  return [...document.querySelectorAll("sup")].map((s, i) => {
    const wrap = s.parentElement;
    const cs = getComputedStyle(wrap);
    const r = s.getBoundingClientRect();
    // "Did the mark start a new line?" — compare its top against the top of the
    // text that precedes it. A mark on its own line is the visible symptom.
    let prevTop = null;
    const prev = wrap.previousSibling;
    if (prev) {
      const range = document.createRange();
      try { range.selectNodeContents(prev); prevTop = Math.round(range.getBoundingClientRect().top); } catch (e) {}
    }
    return {
      i,
      parent: wrap.tagName.toLowerCase() + "." + (typeof wrap.className === "string" ? wrap.className.trim().split(/\s+/)[0] : ""),
      grand: wrap.parentElement ? wrap.parentElement.tagName.toLowerCase() : "",
      wrapDisplay: cs.display,
      supTop: Math.round(r.top), prevTop,
      ownLine: prevTop !== null ? Math.abs(Math.round(r.top) - prevTop) > 6 : null,
      near: (wrap.parentElement ? wrap.parentElement.textContent : "").replace(/\s+/g," ").trim().slice(0, 42),
    };
  });
})()`;
const page = process.argv[2] || "invisalign";
const localPath = path.join(DESIGN, page, "index.html").split(path.sep).join("/").split(" ").join("%20");
const local = await session("file:///" + localPath, ({evaluate}) => evaluate(READ));
await wait(3000);
const live = await session(`https://mason-park-dental.webflow.io/${page}`, ({evaluate}) => evaluate(READ));
const show=(t,rows)=>{ console.log("\n-- "+t+" --");
  (rows||[]).forEach(r=>console.log(`  #${String(r.i).padStart(2)} parent=${String(r.parent).padEnd(20)} disp=${String(r.wrapDisplay).padEnd(12)} ownLine=${String(r.ownLine).padEnd(5)} | ${r.near}`)); };
console.log("PAGE " + page);
show("LOCAL DESIGN", local); show("STAGING", live);
const bad = (live||[]).filter(r => r.ownLine === true).length;
const okd = (local||[]).filter(r => r.ownLine === true).length;
console.log(`\nmarks starting their own line — design ${okd}, staging ${bad}`);
