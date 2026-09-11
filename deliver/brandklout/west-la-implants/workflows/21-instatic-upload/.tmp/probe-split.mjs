import { createRequire } from 'node:module'
const puppeteer = createRequire('C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-stone/node_modules/')('puppeteer-core')
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'
const root='C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-west-la-implants/deliver/brandklout/west-la-implants/workflows/04-design/.tmp/site-src/dist'
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mp4':'video/mp4','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'}
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(root,p);if(!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)}).listen(0)
const port=srv.address().port
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']})
for(const url of [`http://127.0.0.1:${port}/index.html`,'https://west-la-implants-production.up.railway.app/']){
  const p=await b.newPage(); await p.setViewport({width:1440,height:900})
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR '+e.message))
  p.on('response',r=>{ if(r.status()>=400) errs.push(r.status()+' '+r.url()) })
  await p.goto(url,{waitUntil:'networkidle0',timeout:120000}); await new Promise(r=>setTimeout(r,3000))
  console.log(url.slice(0,40), JSON.stringify(await p.evaluate(()=>({
    hasSplitText: typeof window.SplitText, registered: !!(window.gsap&&gsap.core&&gsap.core.globals&&gsap.core.globals().SplitText),
    realityBigHtml: document.getElementById('realityBig').innerHTML.slice(0,180),
    wzWords: document.querySelectorAll('.wz-word').length,
    inReality: document.querySelectorAll('#realityBig .wz-word').length,
    wzLines: document.querySelectorAll('.wz-line').length,
  }))))
  console.log('   errs:', errs.join(' | ') || 'none')
  await p.close()
}
await b.close(); srv.close()
