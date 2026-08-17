/* Confirms every published price on every page: it must never display a value
   other than the real one, at any scroll depth, in either motion state. */
import { spawn } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = fileURLToPath(new URL('.', import.meta.url));
const DESIGN = resolve(HERE, '../../04-design/.tmp');
const wait = ms => new Promise(r => setTimeout(r, ms));
const PORT = 9200 + (process.pid % 700);
const proc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  `--remote-debugging-port=${PORT}`, '--user-data-dir=' + join(HERE, '.chrome-price'),
  '--no-first-run','--no-default-browser-check','--allow-file-access-from-files',
  '--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding',
  '--window-size=1440,900','--window-position=-2400,0','about:blank'], { stdio:'ignore' });
let wsUrl;
for (let i=0;i<60;i++){ try{ const r=await fetch(`http://127.0.0.1:${PORT}/json/version`); if(r.ok){wsUrl=(await r.json()).webSocketDebuggerUrl;break;} }catch{} await wait(400); }
const ws=new WebSocket(wsUrl); await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
let id=0; const pend=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){const{res,rej}=pend.get(m.id);pend.delete(m.id);m.error?rej(new Error(m.error.message)):res(m.result);}};
const send=(method,params={},sessionId)=>{const i=++id;ws.send(JSON.stringify({id:i,method,params,sessionId}));return new Promise((res,rej)=>pend.set(i,{res,rej}));};

// Every value each page's price elements are ALLOWED to show.
const ALLOWED = {
  implants:['$18,795'], aox:['$18,795'],
  // textContent includes the <sup>$</sup>, so the offer element reads "$109".
  'dentist-near-me':['$109','—','$0'], 'next-door':['$109'],
  veneers:['Free'], emergency:[],
};
let bad = 0;
for (const [slug, allowed] of Object.entries(ALLOWED)) {
  if (!allowed.length) { console.log(slug.padEnd(16),'no price element — skipped'); continue; }
  const {targetId}=await send('Target.createTarget',{url:'about:blank'});
  const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
  await send('Runtime.enable',{},sessionId); await send('Page.enable',{},sessionId);
  await send('Emulation.setFocusEmulationEnabled',{enabled:true},sessionId);
  await send('Page.bringToFront',{},sessionId);
  await send('Page.navigate',{url:pathToFileURL(join(DESIGN,slug,'index.html')).href},sessionId);
  const ev=async expr=>{const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true},sessionId); return r.exceptionDetails?null:r.result.value;};
  for(let i=0;i<60;i++){ if(await ev(`document.documentElement.getAttribute('data-js')==='on'`))break; await wait(250); }
  await wait(800);
  const seen = new Set();
  // Walk the whole page in fine steps so a scrubbed value cannot hide between samples.
  const h = await ev(`document.documentElement.scrollHeight - innerHeight`);
  for (let y = 0; y <= h; y += Math.round(h/60)) {
    await ev(`window.scrollTo(0, ${y})`); await wait(140);
    const vals = await ev(`Array.from(document.querySelectorAll('.price, .offer__price, #rcptTot'))
      .map(function(e){ return e.textContent.trim(); })`);
    (vals||[]).forEach(v => seen.add(v));
  }
  const unexpected = [...seen].filter(v => !allowed.includes(v));
  if (unexpected.length) { bad++; console.log(slug.padEnd(16),'FAIL  unexpected:',JSON.stringify(unexpected)); }
  else console.log(slug.padEnd(16),'ok   only showed',JSON.stringify([...seen]));
  await send('Target.closeTarget',{targetId});
}
try{ await send('Browser.close'); }catch{} proc.kill();
console.log(bad? '\nFAIL - a price displayed a value it should never show' : '\nAll prices display only their real value, at every scroll depth.');
process.exit(bad?1:0);
