/* Functional check of the runtime rehydration against the REAL Instatic markup.
   Screenshots cannot see any of this: the burger bars, the button label span,
   the filter counts, the slider type and whether the films are reachable. */
import { spawn } from "node:child_process"; import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const BASE = process.argv[2] || "http://127.0.0.1:8907";
const CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT=9900+Math.floor(Math.random()*90);
const profile=fs.mkdtempSync(path.join(os.tmpdir(),"cdp-sim-"));
spawn(CHROME,["--headless=new","--disable-gpu","--hide-scrollbars",`--remote-debugging-port=${PORT}`,
 "--remote-allow-origins=*","--force-device-scale-factor=1","--window-size=1440,900","--no-first-run",
 "--no-default-browser-check","--autoplay-policy=no-user-gesture-required",`--user-data-dir=${profile}`,"about:blank"]);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const gj=p=>new Promise((res,rej)=>{http.get({host:"127.0.0.1",port:PORT,path:p},r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)))}).on("error",rej)});
let wsu; for(let i=0;i<150;i++){try{const v=await gj("/json/version"); if(v.webSocketDebuggerUrl){wsu=v.webSocketDebuggerUrl;break}}catch{} await wait(300)}
const sock=new WebSocket(wsu); let id=0; const pend=new Map();
sock.addEventListener("message",async ev=>{const raw=typeof ev.data==="string"?ev.data:await ev.data.text();const m=JSON.parse(raw); if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}});
await new Promise(r=>sock.addEventListener("open",r,{once:true}));
const send=(method,params={},sid)=>new Promise((res,rej)=>{const mid=++id;const t=setTimeout(()=>rej(new Error("timeout "+method)),60000);pend.set(mid,m=>{clearTimeout(t);m.error?rej(new Error(m.error.message)):res(m.result)});sock.send(JSON.stringify({id:mid,method,params,sessionId:sid}))});
const tg=(await gj("/json/list")).find(t=>t.type==="page");
const {sessionId}=await send("Target.attachToTarget",{targetId:tg.id,flatten:true});
const S=(m,p={})=>send(m,p,sessionId);
await S("Page.enable"); await S("Runtime.enable");
const ev = async (expr) => (await S("Runtime.evaluate",{expression:expr,returnByValue:true,awaitPromise:true})).result.value;

let pass=0, fail=0;
const check=(name,ok,detail)=>{ (ok?pass++:fail++); console.log(`${ok?"PASS":"FAIL"}  ${name}${detail!==undefined?"  — "+detail:""}`); };

async function page(slug, tests){
  await S("Page.navigate",{url:`${BASE}/${slug}`});
  await wait(5000);
  await ev("(async()=>{const H=document.documentElement.scrollHeight;for(let y=0;y<H;y+=800){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,40));}window.scrollTo(0,0);await new Promise(r=>setTimeout(r,600));})()");
  await wait(1200);
  for (const [name, expr, want] of tests) {
    const got = await ev(expr);
    check(`[${slug}] ${name}`, typeof want==="function"? want(got) : got===want, JSON.stringify(got));
  }
}

await page("index.html", [
  ["burger bars rebuilt", "document.querySelectorAll('.burger span').length", 2],
  ["burger bars are painted", "(()=>{const s=document.querySelector('.burger span'); if(!s) return 'none'; const c=getComputedStyle(s); return c.width+'/'+c.height;})()", v=>/^24px\/1\.5px$/.test(v)],
  [".btn labels re-wrapped", "document.querySelectorAll('.btn > span').length", v=>v>=3],
  [".btn span sits above the fill", "(()=>{const s=document.querySelector('.btn>span'); return s?getComputedStyle(s).zIndex:'none';})()", "1"],
  ["hero film reachable by class", "!!document.querySelector('.ar-film')", true],
  ["hero film has its poster", "!!(document.querySelector('.ar-film')||{}).poster", true],
  ["hero film is playing", "(()=>{const v=document.querySelector('.ar-film'); return v? (!v.paused||v.currentTime>0) : 'none';})()", true],
  ["proof film reachable by class", "!!document.querySelector('.pf-film video')", true],
  ["no JS errors on load", "window.__errs||0", 0],
  ["hero headline is visible", "(()=>{const h=document.getElementById('heroTitle'); return h?getComputedStyle(h).opacity:'none';})()", v=>parseFloat(v)>0.9],
  ["chapter 07 reads light", "getComputedStyle(document.getElementById('proof')).backgroundColor", "rgb(250, 248, 243)"],
  ["chapter 08 reads light", "getComputedStyle(document.getElementById('invitation')).backgroundColor", "rgb(250, 248, 243)"],
  ["location cards are white", "getComputedStyle(document.querySelector('.iv-loc')).backgroundColor", "rgb(255, 255, 255)"],
  ["review wall renders 6 cards", "document.querySelectorAll('#reviews .rv-wall .rv-card').length", 6],
  ["review cards are styled, not raw text", "getComputedStyle(document.querySelector('.rv-card')).backgroundColor", "rgb(255, 255, 255)"],
  ["review wall is a grid at desktop", "getComputedStyle(document.querySelector('.rv-wall')).gridTemplateColumns.split(' ').length", 3],
  /* The frame check belongs to the LIVE audit, not here. Instatic blocks
     reputationhub.site in its per-page CSP, so ch-proof.js rehydrates a frame
     that never sizes and removes it after 8s. A plain local server has no such
     CSP, the widget mounts, and the frame legitimately stays. audit-site.mjs
     records `iframes` on the real origin, which is where it means something. */
  ["headline score is the client's 4.9", "document.getElementById('rvScore').textContent.trim()", "4.9"],
  ["FP figure loaded", "(()=>{const i=[...document.images].find(x=>/fp1-fp3/.test(x.src)); return i?i.naturalWidth+'x'+i.naturalHeight:'missing';})()", "2000x387"],
  ["every image decoded", "[...document.images].filter(i=>i.complete&&i.naturalWidth===0).length", 0],
]);

await page("veneers.html", [
  ["before/after slider is a range again", "[...document.querySelectorAll('.pk-ba input')].map(i=>i.type).join(',')", v=>v.split(',').every(t=>t==='range')],
  ["slider drives the clip", "(()=>{const ba=document.querySelector('.pk-ba'),r=ba.querySelector('input');r.value=20;r.dispatchEvent(new Event('input'));return ba.style.getPropertyValue('--pos');})()", "20%"],
  ["slider has a label again", "!!document.querySelector('.pk-ba input').getAttribute('aria-label')", true],
  ["burger bars rebuilt", "document.querySelectorAll('.burger span').length", 2],
  ["alt text survived", "[...document.images].filter(i=>!i.alt).length", v=>v<=2],
]);

await page("smile-gallery.html", [
  ["filter counts re-wrapped", "document.querySelectorAll('.ga-filters button b').length", v=>v>=5],
  ["count text is right", "[...document.querySelectorAll('.ga-filters button')].slice(0,3).map(b=>b.textContent.trim()).join(' | ')", v=>/Allcases54/.test(v.replace(/\s+/g,''))],
  ["filtering still works", "(()=>{const b=[...document.querySelectorAll('.ga-filters button')].find(x=>/Veneers$/.test(x.firstChild.textContent.trim())); if(!b) return 'no button'; b.click(); return document.querySelectorAll('.ga-item:not([hidden])').length;})()", v=>typeof v==='number'&&v>0],
]);

console.log(`\n${pass}/${pass+fail} checks passed`);
process.exit(fail?1:0);
