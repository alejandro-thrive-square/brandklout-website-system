import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const [, , fileUrl] = process.argv;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9333 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-"));
const chrome = spawn(CHROME, ["--headless=new","--disable-gpu","--hide-scrollbars",`--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--force-device-scale-factor=1","--window-size=1440,1000","--no-first-run","--no-default-browser-check",`--user-data-dir=${profile}`,"about:blank"]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJSON(p){return new Promise((res,rej)=>{http.get({host:"127.0.0.1",port:PORT,path:p},(r)=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)))}).on("error",rej)})}
async function findWs(){for(let i=0;i<40;i++){try{const v=await getJSON("/json/version");if(v.webSocketDebuggerUrl)return v.webSocketDebuggerUrl}catch{}await wait(200)}throw new Error("no CDP")}
const ws=new WebSocket(await findWs());let id=0;const pending=new Map();
ws.addEventListener("message",(ev)=>{const m=JSON.parse(ev.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id)}});
await new Promise(r=>ws.addEventListener("open",r,{once:true}));
function send(method,params={},sessionId){return new Promise(res=>{const mid=++id;pending.set(mid,res);ws.send(JSON.stringify({id:mid,method,params,sessionId}))})}
const {targetInfos}=await send("Target.getTargets");
const pt=targetInfos.find(t=>t.type==="page");
const {sessionId}=await send("Target.attachToTarget",{targetId:pt.targetId,flatten:true});
await send("Page.enable",{},sessionId);
await send("Page.navigate",{url:fileUrl},sessionId);
await wait(3000);
const {result}=await send("Runtime.evaluate",{expression:`(() => {
  const rule = document.querySelector('.eq-rule');
  rule.style.transition = 'none';           // kill transition so we read the resolved START state
  rule.classList.remove('is-visible');
  const start = getComputedStyle(rule).transform;
  rule.classList.add('is-visible');
  const end = getComputedStyle(rule).transform;
  rule.style.transition = '';
  return { start, end, transformOrigin: getComputedStyle(rule).transformOrigin, height: getComputedStyle(rule).height };
})()`,returnByValue:true},sessionId);
console.log(JSON.stringify(result.value));
ws.close();chrome.kill();process.exit(0);
