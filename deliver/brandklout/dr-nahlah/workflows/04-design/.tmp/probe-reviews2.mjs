/* What is the reviews embed actually doing? Iframe present, sized, loaded,
   what the vendor resizer did, and whether anything was blocked. */
import { spawn } from "node:child_process"; import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const URL_=process.argv[2];
const CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT=9300+Math.floor(Math.random()*90);
const profile=fs.mkdtempSync(path.join(os.tmpdir(),"cdp-rv-"));
spawn(CHROME,["--headless=new","--disable-gpu","--hide-scrollbars",`--remote-debugging-port=${PORT}`,
 "--remote-allow-origins=*","--force-device-scale-factor=1","--window-size=1440,900","--no-first-run",
 "--no-default-browser-check",`--user-data-dir=${profile}`,"about:blank"]);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const gj=p=>new Promise((res,rej)=>{http.get({host:"127.0.0.1",port:PORT,path:p},r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)))}).on("error",rej)});
let wsu; for(let i=0;i<150;i++){try{const v=await gj("/json/version"); if(v.webSocketDebuggerUrl){wsu=v.webSocketDebuggerUrl;break}}catch{} await wait(300)}
const sock=new WebSocket(wsu); let id=0; const pend=new Map(); const events=[];
sock.addEventListener("message",async ev=>{const raw=typeof ev.data==="string"?ev.data:await ev.data.text();const m=JSON.parse(raw);
 if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id);return}
 if(m.method) events.push(m);});
await new Promise(r=>sock.addEventListener("open",r,{once:true}));
const send=(m,p={},sid)=>new Promise((res,rej)=>{const mid=++id;const t=setTimeout(()=>rej(new Error("timeout "+m)),60000);pend.set(mid,x=>{clearTimeout(t);x.error?rej(new Error(x.error.message)):res(x.result)});sock.send(JSON.stringify({id:mid,method:m,params:p,sessionId:sid}))});
const tg=(await gj("/json/list")).find(t=>t.type==="page");
const {sessionId}=await send("Target.attachToTarget",{targetId:tg.id,flatten:true});
const S=(m,p={})=>send(m,p,sessionId);
await S("Page.enable"); await S("Runtime.enable"); await S("Log.enable"); await S("Network.enable");
const ev=async e=>(await S("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true})).result.value;
await S("Page.navigate",{url:URL_});
await wait(6000);
await ev("(async()=>{const el=document.getElementById('reviews'); if(el) el.scrollIntoView(); await new Promise(r=>setTimeout(r,500)); const H=document.documentElement.scrollHeight; for(let y=0;y<H;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));} })()");
await wait(9000);
console.log(JSON.stringify(await ev(`(()=>{
  const box=document.querySelector('.rv-embed');
  const f=box&&box.querySelector('iframe');
  const r=f&&f.getBoundingClientRect();
  return {
    boxExists: !!box,
    boxChildren: box? [...box.children].map(c=>c.tagName+'.'+c.className).join(',') : null,
    boxHeight: box? Math.round(box.getBoundingClientRect().height) : null,
    iframe: !!f,
    iframeAttrHeight: f? f.getAttribute('height') : null,
    iframeStyleHeight: f? f.style.height : null,
    iframeRect: r? Math.round(r.width)+'x'+Math.round(r.height) : null,
    iframeSrc: f? f.src.slice(0,80) : null,
    vendorScript: !!document.querySelector('script[src*="review-widget.js"]'),
    minHeightCss: f? getComputedStyle(f).minHeight : null,
  };})()`),null,1));
const net=events.filter(e=>/Network\.(loadingFailed|responseReceived)/.test(e.method))
  .map(e=>e.params).filter(p=>/reputationhub/.test(JSON.stringify(p)));
console.log("--- reputationhub network ---");
for(const p of net) console.log(" ", p.errorText||((p.response&&p.response.status)+" "+(p.response&&p.response.url||"").slice(0,90)));
console.log("--- console/log entries ---");
for(const e of events.filter(e=>e.method==="Log.entryAdded")) console.log(" ", (e.params.entry.text||"").slice(0,160));
process.exit(0);
