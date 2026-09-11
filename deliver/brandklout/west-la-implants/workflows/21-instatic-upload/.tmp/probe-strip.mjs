import puppeteer from 'puppeteer-core'
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'
const LOCAL='C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-west-la-implants/deliver/brandklout/west-la-implants/workflows/04-design/.tmp/site-src/dist'
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.mp4':'video/mp4','.woff2':'font/woff2'}
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(LOCAL,p);if(!fs.existsSync(f))return r.writeHead(404).end();r.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)})
await new Promise(r=>srv.listen(0,r)); const port=srv.address().port
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox','--hide-scrollbars']})
for(const url of [`http://127.0.0.1:${port}/`,'https://west-la-implants-production.up.railway.app/']){
  const p=await b.newPage(); await p.setJavaScriptEnabled(false); await p.setViewport({width:1440,height:900})
  await p.goto(url,{waitUntil:'networkidle0',timeout:120000})
  console.log(url.slice(0,40), JSON.stringify(await p.evaluate(()=>{
    const el=document.querySelector('.su-strip'); const cs=getComputedStyle(el)
    const chain=[]; let n=el.parentElement
    while(n && n.tagName!=='HTML'){const c=getComputedStyle(n); chain.push(n.tagName+'.'+n.className+' d='+c.display+' w='+c.width+' pad='+c.paddingLeft+'/'+c.paddingRight+' box='+c.boxSizing+' cw='+n.clientWidth); n=n.parentElement}
    const kids=[...el.children].map(k=>{const i=k.querySelector('img');return k.className+' w='+getComputedStyle(k).width+' img='+(i?(i.getAttribute('width')+'x'+i.getAttribute('height')+' nat='+i.naturalWidth+' cw='+getComputedStyle(i).width):'none')})
    return {ml:cs.marginLeft, mr:cs.marginRight, w:cs.width, sw:el.scrollWidth, ow:el.offsetWidth, rect:el.getBoundingClientRect().width, display:cs.display, kids, chain}
  }),null,1))
  await p.close()
}
await b.close(); srv.close()
