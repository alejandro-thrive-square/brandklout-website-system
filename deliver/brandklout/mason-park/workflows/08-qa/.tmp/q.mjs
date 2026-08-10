import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe";
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=9866, profile=fs.mkdtempSync(path.join(os.tmpdir(),"cdp-q-"));
const chrome=spawn(CHROME,["--headless=new","--hide-scrollbars","--window-size=1440,1000",
  `--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--force-device-scale-factor=1","--no-first-run",
  `--user-data-dir=${profile}`,"about:blank"]);
const getJSON=p=>new Promise((res,rej)=>{http.get({host:"127.0.0.1",port:PORT,path:p},r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)));}).on("error",rej);});
let wsUrl=null; for(let i=0;i<80&&!wsUrl;i++){try{wsUrl=(await getJSON("/json/version")).webSocketDebuggerUrl;}catch{} if(!wsUrl)await wait(200);}
const ws=new WebSocket(wsUrl); let id=0; const pend=new Map();
ws.addEventListener("message",e=>{const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m.result);pend.delete(m.id);}});
await new Promise(r=>ws.addEventListener("open",r,{once:true}));
const send=(m,p={},s)=>new Promise(res=>{const i=++id;pend.set(i,res);ws.send(JSON.stringify({id:i,method:m,params:p,sessionId:s}));});
const {targetInfos}=await send("Target.getTargets"); const t=targetInfos.find(x=>x.type==="page");
const {sessionId}=await send("Target.attachToTarget",{targetId:t.targetId,flatten:true});
await send("Page.enable",{},sessionId); await send("Runtime.enable",{},sessionId);
await send("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false},sessionId);
const ev=e=>send("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true},sessionId)
  .then(r=>{if(r?.exceptionDetails)throw new Error("in-page: "+(r.exceptionDetails.exception?.description||r.exceptionDetails.text)); return r?.result?.value;});
await send("Page.navigate",{url:"https://mason-park-dental.webflow.io/new-patient-special"},sessionId);
for(let i=0;i<150;i++){const st=await ev("document.documentElement?document.readyState:''").catch(()=>""); if(st==="interactive"||st==="complete")break; await wait(200);}
await ev("new Promise(r=>setTimeout(r,9000))");
console.log(await ev(`(async function(){
  var sleep=function(ms){return new Promise(function(r){setTimeout(r,ms);});};
  await sleep(2000);
  window.scrollTo(0, document.documentElement.scrollHeight);
  await sleep(1500);
  var f=document.querySelector('footer');
  var fr=f.getBoundingClientRect();
  var de=document.documentElement, b=document.body;
  var cs=getComputedStyle(de), bs=getComputedStyle(b);
  return JSON.stringify({
    scrollY: Math.round(window.scrollY),
    maxScroll: Math.round(de.scrollHeight - window.innerHeight),
    docScrollHeight: de.scrollHeight,
    bodyRect: Math.round(b.getBoundingClientRect().height),
    bodyOffsetHeight: b.offsetHeight,
    htmlHeightCss: cs.height, htmlOverflow: cs.overflow + '/' + cs.overflowY,
    bodyMargin: bs.marginTop + ' ' + bs.marginBottom,
    bodyOverflow: bs.overflow + '/' + bs.overflowY + '/' + bs.overflowX,
    footerBottomVsViewport: Math.round(fr.bottom - window.innerHeight),
    footerFullyVisible: fr.bottom <= window.innerHeight + 1
  }, null, 1);
})()`));
ws.close(); chrome.kill();
