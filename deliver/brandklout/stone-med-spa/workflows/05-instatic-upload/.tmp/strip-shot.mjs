import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
await p.goto('https://staging.westlaketxmedspa.com/team', { waitUntil: 'networkidle0', timeout: 120000 });
const r = await p.evaluate(async () => { document.documentElement.style.scrollBehavior='auto'; const img=[...document.querySelectorAll('.strip_frame img')].find(i=>i.src.includes('stone-treatment-room')); img.scrollIntoView({block:'center'}); await new Promise(r=>setTimeout(r,2500)); img.loading='eager'; await img.decode().catch(()=>{}); const q=img.getBoundingClientRect(); return {cur:img.currentSrc, nw:img.naturalWidth, x:q.x,y:q.y,w:q.width,h:q.height}; });
console.log(JSON.stringify(r));
await new Promise(r=>setTimeout(r,1500));
await p.screenshot({ path: process.argv[2] });
await b.close();
