import { spawn } from "node:child_process"; import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const url=process.argv[2], out=process.argv[3];
const CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT=9800+Math.floor(Math.random()*150);
const profile=fs.mkdtempSync(path.join(os.tmpdir(),"cdp-fig-"));
spawn(CHROME,["--headless=new","--disable-gpu","--hide-scrollbars",`--remote-debugging-port=${PORT}`,
 "--remote-allow-origins=*","--force-device-scale-factor=1","--window-size=2000,900","--no-first-run",
 "--no-default-browser-check",`--user-data-dir=${profile}`,"about:blank"]);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const gj=p=>new Promise((res,rej)=>{http.get({host:"127.0.0.1",port:PORT,path:p},r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)))}).on("error",rej)});
let ws; for(let i=0;i<150;i++){try{const v=await gj("/json/version"); if(v.webSocketDebuggerUrl){ws=v.webSocketDebuggerUrl;break}}catch{} await wait(300)}
const sock=new WebSocket(ws); let id=0; const pend=new Map();
sock.addEventListener("message",async ev=>{const raw=typeof ev.data==="string"?ev.data:await ev.data.text();const m=JSON.parse(raw); if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}});
await new Promise(r=>sock.addEventListener("open",r,{once:true}));
const send=(method,params={},sid)=>new Promise((res,rej)=>{const mid=++id;const t=setTimeout(()=>rej(new Error("timeout "+method)),60000);pend.set(mid,m=>{clearTimeout(t);m.error?rej(new Error(m.error.message)):res(m.result)});sock.send(JSON.stringify({id:mid,method,params,sessionId:sid}))});
const tg=(await gj("/json/list")).find(t=>t.type==="page");
const {sessionId}=await send("Target.attachToTarget",{targetId:tg.id,flatten:true});
const S=(m,p={})=>send(m,p,sessionId);
await S("Page.enable"); await S("Runtime.enable");
await S("Emulation.setDefaultBackgroundColorOverride",{color:{r:0,g:0,b:0,a:0}});
await S("Page.navigate",{url}); await wait(4500);
await S("Runtime.evaluate",{expression:"document.fonts.ready",awaitPromise:true});
await wait(600);
const {result:{value:box}}=await S("Runtime.evaluate",{expression:"JSON.stringify((r=>({x:0,y:0,width:Math.ceil(r.width),height:Math.ceil(r.bottom)}))(document.querySelector('.fig').getBoundingClientRect()))"});
const clip={...JSON.parse(box),scale:1};
await S("Emulation.setDeviceMetricsOverride",{width:2000,height:clip.height+40,deviceScaleFactor:1,mobile:false});
await wait(400);
const shot=await S("Page.captureScreenshot",{format:"png",clip,captureBeyondViewport:true});
fs.writeFileSync(out,Buffer.from(shot.data,"base64"));
console.log("wrote",out,JSON.stringify(clip));
process.exit(0);
