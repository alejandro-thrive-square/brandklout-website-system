/** Scroll the LIVE page and assert the signature interactions actually move. */
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import http from "node:http"; import { spawn } from "node:child_process";
const URL_ = process.argv[2];
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9700 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-live-"));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn(CHROME, ["--headless=new","--disable-gpu","--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--window-size=1440,900",
  "--force-device-scale-factor=1","--no-first-run","--no-default-browser-check",
  `--user-data-dir=${profile}`,"about:blank"]);
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
    let d=""; r.on("data",c=>d+=c); r.on("end",()=>res(JSON.parse(d)));
  }).on("error", rej);
});
let wsUrl; for (let i=0;i<150&&!wsUrl;i++){ try{wsUrl=(await getJSON("/json/version")).webSocketDebuggerUrl;}catch{} if(!wsUrl) await wait(300);}
const ws = new WebSocket(wsUrl); let mid=0; const pending=new Map(); const errs=[];
ws.addEventListener("message", async (ev)=>{ const raw=typeof ev.data==="string"?ev.data:await ev.data.text();
  const m=JSON.parse(raw); if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}
  else if(m.method==="Runtime.exceptionThrown") errs.push((m.params?.exceptionDetails?.exception?.description||"?").split("\n")[0]); });
await new Promise(r=>ws.addEventListener("open",r,{once:true}));
const send=(method,params={},sessionId)=>new Promise((res,rej)=>{const i=++mid;
  const t=setTimeout(()=>rej(new Error("timeout "+method)),60000);
  pending.set(i,(m)=>{clearTimeout(t); m.error?rej(new Error(m.error.message)):res(m.result);});
  ws.send(JSON.stringify({id:i,method,params,sessionId}));});
const {targetInfos}=await send("Target.getTargets");
let pt=targetInfos.find(t=>t.type==="page")||{targetId:(await send("Target.createTarget",{url:"about:blank"})).targetId};
const {sessionId}=await send("Target.attachToTarget",{targetId:pt.targetId,flatten:true});
await send("Runtime.enable",{},sessionId); await send("Page.enable",{},sessionId);
await send("Page.navigate",{url:URL_},sessionId); await wait(9000);
const ev=async(fn,arg)=>{ const r=await send("Runtime.evaluate",
  {expression:`(${fn.toString()})(${JSON.stringify(arg??null)})`,returnByValue:true,awaitPromise:true},sessionId);
  return r.exceptionDetails?{__err:r.exceptionDetails.text}:r.result.value; };

const scrollTo = async (y) => {
  await ev((yy)=>{ if(window.WZ&&WZ.smoother) WZ.smoother.scrollTop(yy); else scrollTo(0,yy);
    return null; }, y);
  await wait(1400);
};

const res = [];
const ck = (n,p,d)=>res.push({n,p,d});

const total = await ev(()=>document.documentElement.scrollHeight);

// Chapter 04 wipe: scroll through the transformation section and watch --pos.
const tPos = await ev(()=>{ const s=document.getElementById("transformation");
  return s? {top: s.offsetTop, h: s.offsetHeight} : null; });
const samples = [];
if (tPos) {
  for (const f of [0.1,0.35,0.6,0.85]) {
    await scrollTo(Math.round(tPos.top + tPos.h*f));
    samples.push(await ev(()=>{ const c=document.getElementById("cmp");
      const h=document.querySelector(".cmp .handle");
      return { pos: c?getComputedStyle(c).getPropertyValue("--pos").trim():null,
               handleLeft: h?getComputedStyle(h).left:null,
               onSlide: [...document.querySelectorAll(".cmp .slide")].findIndex(s=>s.classList.contains("on")) }; }));
  }
}
const posVals = samples.map(s=>s.pos).filter(Boolean);
ck("ch04 wipe: --pos changes while scrolling", new Set(posVals).size > 1, JSON.stringify(samples));

// Nav solid state after scrolling past 40px
await scrollTo(600);
const nav = await ev(()=>{ const n=document.querySelector("header.site-nav");
  return n?{cls:n.className, bg:getComputedStyle(n).backgroundColor}:null; });
ck("nav turns solid on scroll", !!nav && nav.cls.includes("solid"), JSON.stringify(nav));

// Pinning: a pinned section should keep an element fixed in the viewport
const pinned = await ev(()=>{
  const st = window.ScrollTrigger ? ScrollTrigger.getAll() : [];
  return { total: st.length, pinned: st.filter(t=>t.pin).length };
});
ck("ScrollTrigger pins are registered", pinned.pinned > 0, JSON.stringify(pinned));

// Reveals: hero words/lines split by SplitText
const split = await ev(()=>({ lines: document.querySelectorAll(".wz-line").length,
                              words: document.querySelectorAll(".wz-word").length }));
ck("SplitText produced line/word wrappers", split.lines + split.words > 0, JSON.stringify(split));

await scrollTo(0);
ck("no runtime exceptions", errs.length===0, [...new Set(errs)].slice(0,3).join(" | ")||"none");

console.log("page height:", total);
let bad=0; for(const r of res){ if(!r.p) bad++; console.log(`${r.p?"PASS":"FAIL"}  ${r.n}\n        ${r.d}`);}
console.log(`\n${res.length-bad}/${res.length} live checks passed`);
try{chrome.kill();}catch{}
process.exit(0);
