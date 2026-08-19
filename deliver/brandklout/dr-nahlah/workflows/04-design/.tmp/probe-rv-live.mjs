/* Does the review block upgrade to the live feed, and does it fall back cleanly?
 *
 * Two runs: one with reputationhub reachable (the upgrade should happen), one
 * with it blocked at the network layer to stand in for Instatic's CSP (the
 * cards should remain and the slot should be gone). A screenshot cannot tell
 * these apart, and "the iframe exists" is not the question: a blocked frame
 * still exists and still fires load.
 *
 *   node probe-rv-live.mjs <url> [--block]
 */
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";

const URL_ = process.argv[2];
const BLOCK = process.argv.includes("--block");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9500 + Math.floor(Math.random() * 200);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-rvl-"));
spawn(CHROME, ["--headless=new","--disable-gpu","--hide-scrollbars",`--remote-debugging-port=${PORT}`,
  "--remote-allow-origins=*","--force-device-scale-factor=1","--window-size=1440,900","--no-first-run",
  "--no-default-browser-check",`--user-data-dir=${profile}`,"about:blank"]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const gj = (p) => new Promise((res, rej) => { http.get({host:"127.0.0.1",port:PORT,path:p},(r)=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)))}).on("error",rej); });
let wsu; for (let i=0;i<150;i++){ try{const v=await gj("/json/version"); if(v.webSocketDebuggerUrl){wsu=v.webSocketDebuggerUrl;break}}catch{} await wait(300); }
const sock = new WebSocket(wsu); let id=0; const pend=new Map();
sock.addEventListener("message", async (ev)=>{ const raw=typeof ev.data==="string"?ev.data:await ev.data.text(); const m=JSON.parse(raw); if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id);} });
await new Promise((r)=>sock.addEventListener("open",r,{once:true}));
const send=(m,p={},sid)=>new Promise((res,rej)=>{const mid=++id;const t=setTimeout(()=>rej(new Error("timeout "+m)),60000);pend.set(mid,x=>{clearTimeout(t);x.error?rej(new Error(x.error.message)):res(x.result)});sock.send(JSON.stringify({id:mid,method:m,params:p,sessionId:sid}))});
const tg=(await gj("/json/list")).find(t=>t.type==="page");
const { sessionId } = await send("Target.attachToTarget",{targetId:tg.id,flatten:true});
const S=(m,p={})=>send(m,p,sessionId);
await S("Page.enable"); await S("Runtime.enable"); await S("Network.enable");
if (BLOCK) await S("Network.setBlockedURLs", { urls: ["*reputationhub.site*"] });
const ev = async (e) => (await S("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true})).result.value;

await S("Page.navigate",{url:URL_});
await wait(6000);
await ev("(async()=>{const el=document.getElementById('reviews'); if(el) el.scrollIntoView(); const H=document.documentElement.scrollHeight; for(let y=0;y<H;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));}})()");
await wait(11000);   // past the 8s fallback deadline

const s = await ev(`(()=>{
  const wall=document.querySelector('.rv-wall'), live=document.querySelector('.rv-live');
  const f=live&&live.querySelector('iframe');
  return {
    cards: document.querySelectorAll('.rv-card').length,
    wallVisible: wall ? !wall.hidden : null,
    liveExists: !!live,
    liveVisible: live ? !live.hidden : null,
    frameHeight: f ? f.getAttribute('height') : null,
    visibleHeight: live && !live.hidden ? Math.round(live.getBoundingClientRect().height) : 0,
  };})()`);

const mode = BLOCK ? "BLOCKED (stands in for Instatic)" : "ALLOWED (local / Webflow)";
console.log(`--- ${mode} ---`);
console.log(JSON.stringify(s));
let pass;
if (BLOCK) pass = s.cards === 6 && s.wallVisible === true && s.liveExists === false;
else       pass = s.liveVisible === true && !!s.frameHeight && s.wallVisible === false && s.cards === 6;
console.log(pass ? "PASS" : "FAIL");
process.exit(pass ? 0 : 1);
