import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.argv[2];
const page = process.argv[3] || 'index.html';
const out  = process.argv[4];
const width = Number(process.argv[5] || 1440);
const MIME = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.avif':'image/avif','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json'};
const srv = http.createServer((req,res)=>{
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(root, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, {'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream'});
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => srv.listen(8799, r));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args:['--no-sandbox','--hide-scrollbars'] });
const pg = await browser.newPage();
await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await pg.setViewport({ width, height: 900, deviceScaleFactor: 1 });
await pg.goto(`http://127.0.0.1:8799/${page}`, { waitUntil: 'networkidle0', timeout: 60000 });
await pg.evaluate(async () => { await new Promise(r => { let y=0; const t=setInterval(()=>{ window.scrollBy(0,600); y+=600; if(y>document.body.scrollHeight){clearInterval(t);r();} },40); }); window.scrollTo(0,0); });
await new Promise(r=>setTimeout(r,1200));
await pg.screenshot({ path: out, fullPage: true });
const h = await pg.evaluate(()=>document.documentElement.scrollHeight);
console.log('height', h);
await browser.close(); srv.close();
