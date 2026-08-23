// Reusable CDP driver: node cdp.mjs <url> <exprFile.js> [width] [height]
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
export async function open(url, W=1440, H=900){
  const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
  const PORT = 9300 + Math.floor(Math.random()*400);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-probe-"));
  const chrome = spawn(CHROME, ["--headless=new","--disable-gpu","--hide-scrollbars",
    `--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--force-device-scale-factor=1",
    `--window-size=${W},${H}`,"--no-first-run","--no-default-browser-check",
    "--autoplay-policy=no-user-gesture-required",`--user-data-dir=${profile}`,"about:blank"]);
  const wait = (ms)=>new Promise(r=>setTimeout(r,ms));
  const getJSON = (p)=>new Promise((res,rej)=>{http.get({host:"127.0.0.1",port:PORT,path:p},(r)=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)));}).on("error",rej);});
  let wsUrl; for(let i=0;i<150;i++){ try{const v=await getJSON("/json/version"); if(v.webSocketDebuggerUrl){wsUrl=v.webSocketDebuggerUrl;break;}}catch{} await wait(300); }
  if(!wsUrl) throw new Error("no CDP");
  const ws = new WebSocket(wsUrl);
  let id=0; const pending=new Map();
  ws.addEventListener("message", async ev=>{ const raw = typeof ev.data==="string"?ev.data:await ev.data.text(); const m=JSON.parse(raw); if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);} });
  await new Promise(r=>ws.addEventListener("open",r,{once:true}));
  const send=(method,params={},sessionId)=>new Promise((res,rej)=>{const mid=++id;const t=setTimeout(()=>rej(new Error("timeout "+method)),90000);pending.set(mid,(m)=>{clearTimeout(t);m.error?rej(new Error(m.error.message)):res(m.result);});ws.send(JSON.stringify({id:mid,method,params,sessionId}));});
  const targets = await getJSON("/json/list");
  const page = targets.find(t=>t.type==="page");
  const { sessionId } = await send("Target.attachToTarget",{targetId:page.id,flatten:true});
  const S=(m,p={})=>send(m,p,sessionId);
  await S("Page.enable"); await S("Runtime.enable");
  await S("Emulation.setDeviceMetricsOverride",{width:W,height:H,deviceScaleFactor:1,mobile:false});
  await S("Page.navigate",{url});
  await wait(9000);
  const evalx = async (expression, awaitPromise=false)=>{
    const r = await S("Runtime.evaluate",{expression,awaitPromise,returnByValue:true});
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  const shot = async (out, clip)=>{ const s = await S("Page.captureScreenshot",clip?{format:"png",clip:{...clip,scale:1}}:{format:"png"}); fs.writeFileSync(out, Buffer.from(s.data,"base64")); };
  return { S, evalx, shot, wait, close: ()=>{ try{chrome.kill();}catch{} } };
}
