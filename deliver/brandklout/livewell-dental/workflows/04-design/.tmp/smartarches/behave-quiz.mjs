// Behaviour probe, motion ENABLED. Walks the quiz to the result screen, checks
// validation gating, the story rail and the credential marquee.
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9600 + Math.floor(Math.random()*80);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-"));
const chrome = spawn(CHROME, ["--headless=new","--disable-gpu","--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--window-size=1440,1000",
  "--no-first-run","--no-default-browser-check",`--user-data-dir=${profile}`,"about:blank"]);
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
await send("Emulation.setEmulatedMedia",{features:[]},sessionId);   // motion ON
await send("Page.navigate",{url:process.argv[2]},sessionId);
await wait(13000);
const ev = e => send("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true},sessionId).then(r=>r.result?.value);

const out = {};
// 1. gating: Next with no answer must not advance
out.gate = await ev(`(()=>{const c=document.querySelector('[data-qz-card]');
  c.querySelector('[data-qz-next]').click();
  return {count:c.querySelector('[data-qz-count]').textContent.trim(),
          err:c.querySelector('[data-qz-err]').classList.contains('is--visible')};})()`);

// 2. walk all eleven steps
const walk = [];
for (let i = 0; i < 11; i++) {
  const step = await ev(`(()=>{const c=document.querySelector('[data-qz-card]');
    const s=c.querySelector('.qz-step.is--visible'); if(!s) return null;
    const n=s.getAttribute('data-qz-step'), mode=s.getAttribute('data-qz-mode');
    if(mode==='form'){
      s.querySelectorAll('[data-qz-req]').forEach(f=>{
        f.value = f.type==='email'?'pat@example.com' : f.type==='tel'?'7035550100' : 'Test';
      });
      c.querySelector('[data-qz-consent]').click();
    } else {
      const opts=[...s.querySelectorAll('.qz-opt')];
      opts[0].click(); if(mode==='many') opts[1].click();
    }
    const picked=s.querySelectorAll('.qz-opt.is--picked').length;
    const fill=c.querySelector('[data-qz-fill]').style.width;
    c.querySelector('[data-qz-next]').click();
    return {step:n,mode,picked,fill,
            after:c.querySelector('[data-qz-count]').textContent.trim(),
            done:c.querySelector('[data-qz-done]').classList.contains('is--visible')};})()`);
  walk.push(step); await wait(320);
  if (step && step.done) break;
}
out.walk = walk;

// 3. result state + captured answers
out.result = await ev(`(()=>{const c=document.querySelector('[data-qz-card]');
  return {done:c.querySelector('[data-qz-done]').classList.contains('is--visible'),
          navHidden:c.querySelector('[data-qz-nav]').style.display==='none',
          fill:c.querySelector('[data-qz-fill]').style.width,
          answers:Object.keys(JSON.parse(c.getAttribute('data-qz-answers')||'{}')).length,
          stepsVisible:c.querySelectorAll('.qz-step.is--visible').length};})()`);

// 4. back button from a mid step (reload first)
await send("Page.navigate",{url:process.argv[2]},sessionId); await wait(11000);
out.back = await ev(`(()=>{const c=document.querySelector('[data-qz-card]');
  c.querySelector('.qz-step.is--visible .qz-opt').click();
  c.querySelector('[data-qz-next]').click();
  const at2=c.querySelector('[data-qz-count]').textContent.trim();
  c.querySelector('[data-qz-back]').click();
  return {at2, at1:c.querySelector('[data-qz-count]').textContent.trim(),
          backHiddenAtStart:c.querySelector('[data-qz-back]').classList.contains('is--off')};})()`);

// 5. story rail drift + credential marquee advance
const t0 = await ev(`[document.querySelector('[data-qz-rail]').scrollLeft,
  getComputedStyle(document.querySelector('[data-qz-marks-track]')).transform]`);
await ev(`document.querySelector('[data-qz-rail]').scrollIntoView({block:'center'});
  document.querySelector('[data-qz-marks]').scrollIntoView({block:'center'});`);
await wait(2600);
const t1 = await ev(`[document.querySelector('[data-qz-rail]').scrollLeft,
  getComputedStyle(document.querySelector('[data-qz-marks-track]')).transform]`);
out.motion = { railBefore:t0[0], railAfter:t1[0], marksBefore:t0[1], marksAfter:t1[1] };

// 6. click-to-play injects a player and no video/iframe ships in static markup
out.play = await ev(`(()=>{const before=document.querySelectorAll('video,iframe').length;
  document.querySelector('.qz-story__play').click();
  const st=document.querySelector('.qz-story__stage');
  return {staticPlayers:before, playing:st.classList.contains('is--playing'),
          injected:document.querySelectorAll('.qz-story__frame').length};})()`);

// 7. reveals resolved
out.reveals = await ev(`(()=>{const t=[...document.querySelectorAll('[data-qz-reveal]')];
  return {total:t.length, stuck:t.filter(e=>!e.classList.contains('in')&&e.getBoundingClientRect().top<innerHeight).length};})()`);

console.log(JSON.stringify(out,null,1));
console.log("JS ERRORS:", errs.length ? errs.join(" | ") : "none");
ws.close(); chrome.kill(); process.exit(0);
