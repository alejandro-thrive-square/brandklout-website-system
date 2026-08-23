// Fingerprint a page: for every element carrying a project class, record its
// class stack + key computed properties. Run on local and staging, then diff.
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9400 + Math.floor(Math.random()*90);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-"));
const chrome = spawn(CHROME, ["--headless=new","--disable-gpu","--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--force-device-scale-factor=1",
  `--window-size=1440,1000`,"--no-first-run","--no-default-browser-check",
  `--user-data-dir=${profile}`,"about:blank"]);
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
await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]},sessionId);
await send("Page.navigate",{url:process.argv[2]},sessionId);
await wait(Number(process.argv[3])||14000);
const prefix = process.argv[5];
const res = await send("Runtime.evaluate",{expression:`(() => {
  const PROPS = ['display','position','backgroundColor','color','fontFamily','fontSize','fontWeight',
    'textTransform','letterSpacing','paddingTop','paddingBottom','paddingLeft','marginTop','borderRadius',
    'gridTemplateColumns','maxWidth','textAlign','opacity','flexDirection','justifyContent','alignItems'];
  const out = {};
  document.querySelectorAll('[class]').forEach(el => {
    const own = [...el.classList].filter(c => c.startsWith('${prefix}-') || c.startsWith('lw-')
      || c.startsWith('section_${prefix}-') || c.startsWith('page_'));
    if (!own.length) return;
    const key = own.slice().sort().join('.');
    if (out[key]) return;                 // first instance of each stack
    const cs = getComputedStyle(el);
    const o = {};
    PROPS.forEach(p => o[p] = cs[p]);
    const r = el.getBoundingClientRect();
    o._w = Math.round(r.width);
    out[key] = o;
  });
  return out;
})()`,returnByValue:true},sessionId);
fs.writeFileSync(process.argv[4], JSON.stringify(res.result.value,null,1));
console.log("wrote", process.argv[4], "stacks:", Object.keys(res.result.value).length,
            "| JS errors:", errs.length ? errs.join(" | ") : "none");
ws.close(); chrome.kill(); process.exit(0);
