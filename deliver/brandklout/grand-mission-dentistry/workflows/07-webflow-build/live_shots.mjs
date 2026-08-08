/** Viewport screenshots at N scroll positions, driven through ScrollSmoother.
 *  A full-page captureBeyondViewport shot is useless here: ScrollSmoother
 *  transforms #smooth-content, so everything below the fold renders black. */
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import http from "node:http"; import { spawn } from "node:child_process";
const URL_ = process.argv[2], OUT = process.argv[3] || ".", N = +(process.argv[4] || 8);
/* Optional 5th arg: viewport width (default 1440). Mobile is roughly half of
   paid dental traffic and these pages switch their whole pin architecture at
   759px, so a desktop-only capture reviews half the build. */
const VW = +(process.argv[5] || 1440), VH = VW < 700 ? 844 : 900;
const PORT = 9700 + Math.floor(Math.random()*300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(),"cdp-shot-"));
const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
const chrome=spawn("C:/Program Files/Google/Chrome/Application/chrome.exe",
 ["--headless=new","--disable-gpu","--hide-scrollbars",`--remote-debugging-port=${PORT}`,
  "--remote-allow-origins=*",`--window-size=${VW},${VH}`,"--force-device-scale-factor=1",
  "--no-first-run","--no-default-browser-check",`--user-data-dir=${profile}`,"about:blank"]);
const getJSON=(p)=>new Promise((res,rej)=>{http.get({host:"127.0.0.1",port:PORT,path:p},(r)=>{
  let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)));}).on("error",rej);});
let w0; for(let i=0;i<150&&!w0;i++){try{w0=(await getJSON("/json/version")).webSocketDebuggerUrl;}catch{} if(!w0)await wait(300);}
const ws=new WebSocket(w0); let mid=0; const pending=new Map();
ws.addEventListener("message",async(e)=>{const raw=typeof e.data==="string"?e.data:await e.data.text();
  const m=JSON.parse(raw); if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}});
await new Promise(r=>ws.addEventListener("open",r,{once:true}));
const send=(m,p={},s)=>new Promise((res,rej)=>{const i=++mid;
  const t=setTimeout(()=>rej(new Error("timeout "+m)),60000);
  pending.set(i,(x)=>{clearTimeout(t);x.error?rej(new Error(x.error.message)):res(x.result);});
  ws.send(JSON.stringify({id:i,method:m,params:p,sessionId:s}));});
const {targetInfos}=await send("Target.getTargets");
const pt=targetInfos.find(t=>t.type==="page")||{targetId:(await send("Target.createTarget",{url:"about:blank"})).targetId};
const {sessionId}=await send("Target.attachToTarget",{targetId:pt.targetId,flatten:true});
await send("Page.enable",{},sessionId);
await send("Runtime.enable",{},sessionId);
await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"no-preference"}]},sessionId);
/* Device metrics, not --window-size: Chrome floors a window at roughly 500px on
   Windows, so a requested 390 silently renders at ~500 and the phone layout is
   never actually captured. */
await send("Emulation.setDeviceMetricsOverride",
  {width:VW,height:VH,deviceScaleFactor:1,mobile:VW<700},sessionId);
await send("Page.navigate",{url:URL_},sessionId); await wait(10000);
const ev=async(expr)=>{try{const r=await send("Runtime.evaluate",{expression:expr,returnByValue:true},sessionId);
  if(r.exceptionDetails){console.log("EVAL ERR:",r.exceptionDetails.text);return null;} return r.result.value;}
 catch(e){console.log("SEND ERR:",e.message);return null;}};
/* REFUSE to write frames from an unstyled render. Headless Chrome on this
   machine intermittently fails the stylesheet fetch, and the result is not
   obviously broken in a thumbnail — it is a plausible-looking page with default
   fonts that reads as a layout defect. That capture has been misdiagnosed twice.
   An unstyled page reports the fixed header as `static`; a styled one does not.
   The file size is NOT a usable signal — an unstyled page renders the hero image
   full-bleed and comes out LARGER. */
for (let attempt = 1; ; attempt++) {
  const styled = await ev('(function(){var h=document.querySelector(".gm-header");'
    + 'return !!h && getComputedStyle(h).position === "fixed";})()');
  if (styled) break;
  if (attempt >= 3) {
    console.log("ABORT: stylesheet never applied after 3 loads — no frames written.");
    console.log("       (the site is fine; re-run. curl the CSS bundle if you doubt it.)");
    try { await send("Browser.close"); } catch {}
    process.exit(3);
  }
  console.log(`  stylesheet not applied, reloading (${attempt}/3) …`);
  await send("Page.navigate", {url: URL_}, sessionId);
  await wait(10000);
}

const max = await ev("document.documentElement.scrollHeight - innerHeight");
for(let i=0;i<N;i++){
  const y = Math.round(max * i/(N-1));
  await ev(`window.WZ&&WZ.smoother? WZ.smoother.scrollTop(${y}) : scrollTo(0,${y})`);
  await wait(1600);
  const label = await ev(`(function(){var s=[...document.querySelectorAll('section[data-chapter]')]
    .filter(function(x){var r=x.getBoundingClientRect();return r.top<innerHeight*0.5&&r.bottom>innerHeight*0.5;});
    return s.length? s[0].id : 'â€”';})()`);
  const shot=await send("Page.captureScreenshot",{format:"png"},sessionId);
  const f = path.join(OUT, `frame-${String(i).padStart(2,"0")}-${label}.png`);
  fs.writeFileSync(f, Buffer.from(shot.data,"base64"));
  console.log(`y=${String(y).padStart(6)}  ${label}`);
}
try{chrome.kill();}catch{} process.exit(0);
