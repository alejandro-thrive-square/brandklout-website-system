// chip-probe.mjs — one question: what is inside a .chip and how big is each part?
// Source Asana task GID: 1217040406855582
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import http from "node:http"; import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const DESIGN = path.resolve(here, "../../04-design/.tmp");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const wait = ms => new Promise(r => setTimeout(r, ms));
let port = 9760;
async function session(url, fn) {
  const PORT = port++;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-chip-"));
  const chrome = spawn(CHROME, ["--headless=new","--hide-scrollbars","--window-size=1440,1000",
    `--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--no-first-run",
    `--user-data-dir=${profile}`,"about:blank"]);
  const getJSON = p => new Promise((res, rej) => {
    http.get({host:"127.0.0.1",port:PORT,path:p},(r)=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)));}).on("error",rej);
  });
  let wsUrl=null;
  for(let i=0;i<80&&!wsUrl;i++){ try{wsUrl=(await getJSON("/json/version")).webSocketDebuggerUrl;}catch{} if(!wsUrl) await wait(200); }
  const ws=new WebSocket(wsUrl); let id=0; const pend=new Map();
  ws.addEventListener("message",e=>{const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m.result);pend.delete(m.id);}});
  await new Promise(r=>ws.addEventListener("open",r,{once:true}));
  const send=(m,p={},s)=>new Promise(res=>{const i=++id;pend.set(i,res);ws.send(JSON.stringify({id:i,method:m,params:p,sessionId:s}));});
  const {targetInfos}=await send("Target.getTargets");
  const t=targetInfos.find(x=>x.type==="page");
  const {sessionId}=await send("Target.attachToTarget",{targetId:t.targetId,flatten:true});
  await send("Page.enable",{},sessionId); await send("Runtime.enable",{},sessionId);
  await send("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false},sessionId);
  const evaluate=e=>send("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true},sessionId)
    .then(r=>{ if(r?.exceptionDetails) throw new Error("in-page: "+(r.exceptionDetails.exception?.description||r.exceptionDetails.text)); return r?.result?.value; });
  await send("Page.navigate",{url},sessionId);
  for(let i=0;i<150;i++){const st=await evaluate("document.documentElement?document.readyState:''").catch(()=>""); if(st==="interactive"||st==="complete")break; await wait(200);}
  try { return await fn({evaluate}); } finally { ws.close(); chrome.kill(); await wait(700); }
}
const READ = "(async () => {" +
  "await new Promise(r=>setTimeout(r,8000));" +
  "var out=[];" +
  "var chips=document.querySelectorAll('.chip');" +
  "for (var i=0;i<Math.min(chips.length,4);i++){" +
  "  var c=chips[i]; var rows=[]; " +
  "  var walk=function(el,d){ var cs=getComputedStyle(el); var r=el.getBoundingClientRect();" +
  "    rows.push('  '.repeat(d)+'<'+el.tagName.toLowerCase()+'.'+(String(el.className&&el.className.baseVal!==undefined?el.className.baseVal:el.className||'').trim().split(/\s+/)[0])+'> '+Math.round(r.width)+'x'+Math.round(r.height)+' disp='+cs.display+' pos='+cs.position+' float='+cs.cssFloat+' va='+cs.verticalAlign+' mr='+cs.marginRight);" +
  "    for (var j=0;j<el.children.length;j++) walk(el.children[j],d+1); };" +
  "  var anc=[]; for (var a=c.parentElement; a && a.tagName!=='BODY'; a=a.parentElement){    var acs=getComputedStyle(a); var ar=a.getBoundingClientRect();    anc.push('<'+a.tagName.toLowerCase()+'.'+(String(a.className||'').trim().split(/\s+/)[0])+'> '      +Math.round(ar.width)+'x'+Math.round(ar.height)+' disp='+acs.display+' ai='+acs.alignItems      +' as='+acs.alignSelf+' minh='+acs.minHeight+' h='+acs.height);    if (anc.length>=5) break; }  walk(c,0);" +
  "  out.push({anc:anc, i:i, box:Math.round(c.getBoundingClientRect().width)+'x'+Math.round(c.getBoundingClientRect().height), tree:rows});" +
  "} return out; })()";
const page = "invisalign";
const localPath = path.join(DESIGN, page, "index.html").split(path.sep).join("/").split(" ").join("%20");
const L = await session("file:///" + localPath, ({evaluate}) => evaluate(READ));
await wait(3000);
const S = await session("https://mason-park-dental.webflow.io/" + page, ({evaluate}) => evaluate(READ));
const show=(t,arr)=>{ console.log("\n===== "+t+" ====="); (arr||[]).slice(0,4).forEach(c=>{ console.log(" chip #"+c.i+"  "+c.box); c.tree.forEach(r=>console.log("   "+r)); if(c.i===0){ console.log('   -- ancestors --'); (c.anc||[]).forEach(a=>console.log('     '+a)); } }); };
show("LOCAL DESIGN", L); show("STAGING", S);
