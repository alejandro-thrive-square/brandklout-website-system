// Stepped-scroll probe: IntersectionObserver never sees an element that jumps
// from below the fold to above it in one frame, so reveals must be checked with
// a gradual scroll, the way a visitor actually moves.
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9660 + Math.floor(Math.random()*60);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-"));
const chrome = spawn(CHROME, ["--headless=new","--disable-gpu","--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--window-size=1440,1000",
  "--no-first-run","--no-default-browser-check",`--user-data-dir=${profile}`,"about:blank"]);
const wait = ms => new Promise(r=>setTimeout(r,ms));
const getJSON = p => new Promise((res,rej)=>http.get({host:"127.0.0.1",port:PORT,path:p},r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)))}).on("error",rej));
let wsUrl; for(let i=0;i<40;i++){try{const v=await getJSON("/json/version"); if(v.webSocketDebuggerUrl){wsUrl=v.webSocketDebuggerUrl;break}}catch{} await wait(200)}
const ws = new WebSocket(wsUrl); let id=0; const pending=new Map(); const errs=[];
ws.addEventListener("message",ev=>{const m=JSON.parse(ev.data);
  if(m.id&&pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id)}
  if(m.method==="Runtime.exceptionThrown") errs.push((m.params.exceptionDetails.exception||{}).description||m.params.exceptionDetails.text);});
await new Promise(r=>ws.addEventListener("open",r,{once:true}));
const send=(m,p={},s)=>new Promise(res=>{const mid=++id;pending.set(mid,res);ws.send(JSON.stringify({id:mid,method:m,params:p,sessionId:s}))});
const {targetInfos}=await send("Target.getTargets"); const pt=targetInfos.find(t=>t.type==="page");
const {sessionId}=await send("Target.attachToTarget",{targetId:pt.targetId,flatten:true});
await send("Page.enable",{},sessionId); await send("Runtime.enable",{},sessionId);
await send("Emulation.setEmulatedMedia",{features:[]},sessionId);
await send("Page.navigate",{url:process.argv[2]},sessionId);
await wait(Number(process.argv[3])||12000);
const ev = e => send("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true},sessionId).then(r=>r.result?.value);
const attr = process.argv[4];  // "qz" or "ty"

// gradual scroll top -> bottom -> top
await ev(`(async()=>{const H=document.documentElement.scrollHeight;
  for(let y=0;y<H;y+=Math.round(innerHeight*0.35)){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,190));}
  window.scrollTo(0,0);await new Promise(r=>setTimeout(r,400));})()`);

const out = {};
out.reveals = await ev(`(()=>{const t=[...document.querySelectorAll('[data-${attr}-reveal]')];
  return {total:t.length, stuck:t.filter(e=>!e.classList.contains('in')).length};})()`);

if (attr === 'qz') {
  await ev(`document.querySelector('[data-qz-rail]').scrollIntoView({block:'center'})`);
  const a = await ev(`document.querySelector('[data-qz-rail]').scrollLeft`);
  await wait(2500);
  const b = await ev(`document.querySelector('[data-qz-rail]').scrollLeft`);
  const max = await ev(`(()=>{const r=document.querySelector('[data-qz-rail]');
    return r.querySelector('[data-qz-track]').scrollWidth - r.clientWidth;})()`);
  out.storyRail = { before:a, after:b, scrollable:max, drifted: b > a };
} else {
  out.stepRail = await ev(`(()=>{const w=document.querySelector('[data-ty-steps]');
    w.scrollIntoView({block:'center'});
    return null;})()`);
  await wait(700);
  out.stepRail = await ev(`(()=>{const w=document.querySelector('[data-ty-steps]');
    return {fill:w.querySelector('[data-ty-rail-fill]').style.height,
            lit:[...w.querySelectorAll('[data-ty-step]')].map(s=>s.classList.contains('is--lit'))};})()`);
  out.faq = await ev(`(()=>{const l=document.querySelector('[data-ty-faq]');
    const items=[...l.querySelectorAll('.ty-faq__item')];
    items[0].querySelector('.ty-faq__trigger').click();
    const h1=items[0].querySelector('.ty-faq__panel').style.height;
    items[3].querySelector('.ty-faq__trigger').click();
    const openCount=l.querySelectorAll('.ty-faq__item.is--open').length;
    const h0=items[0].querySelector('.ty-faq__panel').style.height;
    items[3].querySelector('.ty-faq__trigger').click();
    return {firstOpenHeight:h1, openAfterSecond:openCount, firstClosed:h0,
            allClosed:l.querySelectorAll('.ty-faq__item.is--open').length,
            aria:items[3].querySelector('.ty-faq__trigger').getAttribute('aria-expanded')};})()`);
  await ev(`document.querySelector('[data-ty-marks]').scrollIntoView({block:'center'})`);
  const m0 = await ev(`getComputedStyle(document.querySelector('[data-ty-marks-track]')).transform`);
  await wait(2200);
  const m1 = await ev(`getComputedStyle(document.querySelector('[data-ty-marks-track]')).transform`);
  out.marquee = { before:m0, after:m1, advanced: m0 !== m1 };
}
console.log(JSON.stringify(out,null,1));
console.log("JS ERRORS:", errs.length ? errs.join(" | ") : "none");
ws.close(); chrome.kill(); process.exit(0);
