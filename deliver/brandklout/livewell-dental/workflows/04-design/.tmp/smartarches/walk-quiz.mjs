// Walk the Gravity Forms multi-page quiz, recording each step's question + options.
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9800 + Math.floor(Math.random()*150);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-"));
const chrome = spawn(CHROME, ["--headless=new","--disable-gpu","--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,"--remote-allow-origins=*","--window-size=1440,1200",
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
await send("Page.navigate",{url:"https://smartarchesdental.com/quiz/"},sessionId);
await wait(13000);

const ev = expr => send("Runtime.evaluate",{expression:expr,returnByValue:true,awaitPromise:true},sessionId)
  .then(r => r.result?.value);

const READ = `(() => {
  const form = document.querySelector('form[id^="gform_"]');
  if (!form) return {err:'no form'};
  const cur = document.querySelector('.gf_step_current_page')?.textContent;
  const tot = document.querySelector('.gf_step_page_count')?.textContent;
  const fields = [...form.querySelectorAll('.gfield')].filter(f => f.offsetParent !== null);
  return {
    page: cur, total: tot,
    intro: [...form.querySelectorAll('.gform_page:not([style*="none"]) h2, .gform_page:not([style*="none"]) h3')].map(h=>h.innerText.trim()),
    fields: fields.map(f => ({
      label: (f.querySelector('.gfield_label, legend')?.innerText||'').trim(),
      type: (f.className.match(/gfield--type-(\S+)/)||[])[1] || '',
      desc: (f.querySelector('.gfield_description')?.innerText||'').trim(),
      choices: [...f.querySelectorAll('label')].map(l=>l.innerText.trim()).filter(t=>t && t !== (f.querySelector('.gfield_label')?.innerText||'').trim()),
      inputs: [...f.querySelectorAll('input,select,textarea')].map(i=>({t:i.type||i.tagName,ph:i.placeholder||'',name:i.name}))
    })),
    nextLabel: (form.querySelector('.gform_next_button, .gform_button')||{}).value || (form.querySelector('.gform_next_button')||{}).innerText || ''
  };
})()`;

const steps = [];
for (let i = 0; i < 14; i++) {
  const s = await ev(READ);
  if (!s || s.err) { steps.push({i, err: s?.err || 'null'}); break; }
  steps.push(s);
  console.log(`--- step ${s.page}/${s.total} ---`);
  for (const f of s.fields) console.log(' Q:', f.label, '|', f.type, '|', JSON.stringify(f.choices));
  if (String(s.page) === String(s.total) || i === 13) break;
  // answer visible fields then advance
  await ev(`(() => {
    const form = document.querySelector('form[id^="gform_"]');
    const vis = [...form.querySelectorAll('.gfield')].filter(f=>f.offsetParent!==null);
    for (const f of vis) {
      const r = f.querySelector('input[type=radio], input[type=checkbox]');
      if (r) { r.click(); continue; }
      const t = f.querySelector('input[type=text],input[type=email],input[type=tel],textarea');
      if (t) { t.value = t.type==='email'?'a@b.com':(t.type==='tel'?'7035550100':'Test'); t.dispatchEvent(new Event('input',{bubbles:true})); t.dispatchEvent(new Event('change',{bubbles:true})); }
      const sel = f.querySelector('select');
      if (sel && sel.options.length>1) { sel.selectedIndex=1; sel.dispatchEvent(new Event('change',{bubbles:true})); }
    }
    const nb = form.querySelector('.gform_next_button');
    if (nb) nb.click();
    return !!nb;
  })()`);
  await wait(4500);
}
fs.writeFileSync("smartarches/refs/quiz-steps.json", JSON.stringify(steps,null,2));
console.log("\nwrote smartarches/refs/quiz-steps.json");
ws.close(); chrome.kill(); process.exit(0);
