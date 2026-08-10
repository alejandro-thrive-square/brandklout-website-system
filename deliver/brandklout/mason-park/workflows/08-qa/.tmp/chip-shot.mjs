// chip-shot.mjs — screenshot the chips row on both sides. After several rounds
// of inference this is the cheapest way to see what the boxes actually do.
// Source Asana task GID: 1217040406855582
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import http from "node:http"; import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const DESIGN = path.resolve(here, "../../04-design/.tmp");
const OUT = path.join(here, "parity");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const wait = ms => new Promise(r => setTimeout(r, ms));
let port = 9790;
async function session(url, fn) {
  const PORT = port++;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-shot-"));
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
  await send("Page.navigate",{url},sessionId);
  for(let i=0;i<150;i++){const st=await evaluate("document.documentElement?document.readyState:''").catch(()=>""); if(st==="interactive"||st==="complete")break; await wait(200);}
  const shot = async (clip) => {
    const { data } = await send("Page.captureScreenshot", { format:"png", clip: {...clip, scale:1}, captureBeyondViewport:true }, sessionId);
    return Buffer.from(data, "base64");
  };
  try { return await fn({evaluate, shot}); } finally { ws.close(); chrome.kill(); await wait(700); }
}
const SEL = process.env.MPD_SEL || ".chips";
const PAGE = process.env.MPD_PAGE || "invisalign";
const LOCATE = "(async () => {" +
  "await new Promise(r=>setTimeout(r,9000));" +
  "var u=document.querySelector(" + JSON.stringify(SEL) + "); if(!u) return null;" +
  "u.scrollIntoView({block:'center'}); await new Promise(r=>setTimeout(r,700));" +
  "var r=u.getBoundingClientRect();" +
  "return {x:Math.max(0,r.left-20), y:r.top+scrollY-20, w:Math.min(1400,r.width+40), h:r.height+40};" +
  "})()";
for (const [label, url] of [
  ["design", "file:///" + path.join(DESIGN, PAGE, "index.html").split(path.sep).join("/").split(" ").join("%20")],
  ["staging", "https://mason-park-dental.webflow.io/" + PAGE],
]) {
  const buf = await session(url, async ({ evaluate, shot }) => {
    const c = await evaluate(LOCATE);
    if (!c) return null;
    console.log(label, "chips box", JSON.stringify(c));
    return shot({ x: c.x, y: c.y, width: c.w, height: c.h });
  });
  if (buf) { fs.writeFileSync(path.join(OUT, `shot-${PAGE}-${label}.png`), buf); console.log("wrote chips-" + label + ".png"); }
  await wait(2500);
}
