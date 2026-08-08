import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9910 + Math.floor(Math.random()*60);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-"));
const chrome = spawn(CHROME, ["--headless=new","--disable-gpu","--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--window-size=1440,1000",
  "--no-first-run","--no-default-browser-check",`--user-data-dir=${profile}`,"about:blank"]);
const wait = ms => new Promise(r=>setTimeout(r,ms));
const getJSON = p => new Promise((res,rej)=>http.get({host:"127.0.0.1",port:PORT,path:p},r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)))}).on("error",rej));
let wsUrl; for(let i=0;i<40;i++){try{const v=await getJSON("/json/version"); if(v.webSocketDebuggerUrl){wsUrl=v.webSocketDebuggerUrl;break}}catch{} await wait(200)}
const ws = new WebSocket(wsUrl); let id=0; const pending=new Map();
ws.addEventListener("message",ev=>{const m=JSON.parse(ev.data); if(m.id&&pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id)}});
await new Promise(r=>ws.addEventListener("open",r,{once:true}));
const send=(m,p={},s)=>new Promise(res=>{const mid=++id;pending.set(mid,res);ws.send(JSON.stringify({id:mid,method:m,params:p,sessionId:s}))});
const {targetInfos}=await send("Target.getTargets"); const pt=targetInfos.find(t=>t.type==="page");
const {sessionId}=await send("Target.attachToTarget",{targetId:pt.targetId,flatten:true});
await send("Page.enable",{},sessionId);
await send("Page.navigate",{url:process.argv[2]},sessionId);
await wait(Number(process.argv[3])||12000);
const sels = process.argv.slice(4);
const r = await send("Runtime.evaluate",{expression:`(() => ${JSON.stringify(sels)}.map(s => {
  const e = document.querySelector(s);
  if (!e) return [s, 'MISSING'];
  const c = getComputedStyle(e); const b = e.getBoundingClientRect();
  return [s, 'mt='+c.marginTop, 'ml='+c.marginLeft, 'mr='+c.marginRight, 'w='+Math.round(b.width), 'left='+Math.round(b.left)];
}))()`,returnByValue:true},sessionId);
console.log(r.result.value.map(a=>a.join('  ')).join('\n'));
ws.close(); chrome.kill(); process.exit(0);
