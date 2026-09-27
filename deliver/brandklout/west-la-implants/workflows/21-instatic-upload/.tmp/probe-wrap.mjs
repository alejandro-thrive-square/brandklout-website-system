import puppeteer from 'puppeteer-core'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const LOCAL='C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-west-la-implants/deliver/brandklout/west-la-implants/workflows/04-design/.tmp/site-src/dist'
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.mp4':'video/mp4','.woff2':'font/woff2'}
const srv=http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(LOCAL,p);if(!fs.existsSync(f))return res.writeHead(404).end();res.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)})
await new Promise(r=>srv.listen(0,r)); const port=srv.address().port
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox','--hide-scrollbars']})
for(const url of [`http://127.0.0.1:${port}/`,'https://west-la-implants-production.up.railway.app/']){
  const p=await b.newPage(); await p.setJavaScriptEnabled(false); await p.setViewport({width:1440,height:900})
  await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}])
  await p.goto(url,{waitUntil:'networkidle2',timeout:120000})
  const out=await p.evaluate(()=>{
    const el=document.querySelector('.pr-body.wrap'); if(!el) return 'no .pr-body.wrap'
    const all=[...document.querySelectorAll('.wrap,.wrap--wide')].map(e=>e.className+' w='+getComputedStyle(e).width+' ml='+getComputedStyle(e).marginLeft)
    const cs=getComputedStyle(el), par=el.parentElement
    return {tag:el.tagName, cls:el.className, w:cs.width, ml:cs.marginLeft, mi:cs.marginInlineStart, box:cs.boxSizing,
      parent:par.tagName+'.'+par.className, parentW:getComputedStyle(par).width, parentDisplay:getComputedStyle(par).display,
      wrapVar:getComputedStyle(document.documentElement).getPropertyValue('--wrap'), gutter:getComputedStyle(document.documentElement).getPropertyValue('--gutter'),
      rect:el.getBoundingClientRect().width, all,
      inlineStyle: el.getAttribute('style'), parentInline: par.getAttribute('style'),
      matched: [...document.styleSheets].flatMap(sh=>{try{return [...sh.cssRules]}catch(e){return []}}).filter(r=>r.selectorText&&(r.selectorText.includes('.wrap')||r.selectorText.includes('pr-body'))).map(r=>r.cssText.slice(0,160))}
  })
  console.log(url.slice(0,40), JSON.stringify(out))
  await p.close()
}
await b.close(); srv.close()
