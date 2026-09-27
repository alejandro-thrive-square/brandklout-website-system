import puppeteer from 'puppeteer-core'
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'
const LOCAL='C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-west-la-implants/deliver/brandklout/west-la-implants/workflows/04-design/.tmp/site-src/dist'
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.mp4':'video/mp4','.woff2':'font/woff2'}
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(LOCAL,p);if(!fs.existsSync(f))return r.writeHead(404).end();r.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)})
await new Promise(r=>srv.listen(0,r)); const port=srv.address().port
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox','--hide-scrollbars']})
const RM = process.argv.includes('--rm')
for(const url of [`http://127.0.0.1:${port}/index.html`,'https://west-la-implants-production.up.railway.app/']){
  const p=await b.newPage(); await p.setJavaScriptEnabled(false)
  if(RM) await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}])
  await p.setViewport({width:Number(process.env.W||1440),height:Number(process.env.W||1440)<700?844:900})
  await p.goto(url,{waitUntil:'networkidle0',timeout:120000})
  await new Promise(r=>setTimeout(r,500))
  console.log(RM?'[rm]':'[--]', url.slice(0,34), JSON.stringify(await p.evaluate(()=>{
    const out={}
    for(const sel of ['.pr-body','.su-grid','.su-strip','.tr-grid']){
      const el=document.querySelector(sel); if(!el){out[sel]='none';continue}
      const cs=getComputedStyle(el)
      out[sel]=cs.marginLeft+' w='+cs.width+' x='+Math.round(el.getBoundingClientRect().x)
    }
    out.docSW=document.documentElement.scrollWidth; out.bodySW=document.body.scrollWidth
    return out
  })))
  await p.close()
}
await b.close(); srv.close()
