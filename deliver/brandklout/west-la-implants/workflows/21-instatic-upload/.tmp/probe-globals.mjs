import { createRequire } from 'node:module'
const puppeteer = createRequire('C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-stone/node_modules/')('puppeteer-core')
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']})
const p=await b.newPage(); await p.setViewport({width:1440,height:900})
await p.goto('https://west-la-implants-production.up.railway.app/',{waitUntil:'networkidle0',timeout:120000})
await new Promise(r=>setTimeout(r,2500))
console.log(JSON.stringify(await p.evaluate(()=>{
  const out={}
  for(const k of ['gsap','ScrollTrigger','ScrollToPlugin','ScrollSmoother','SplitText','Observer','Draggable']) out[k]=typeof window[k]
  out.gsapPlugins = window.gsap ? Object.keys(gsap.core.globals()) : null
  return out
}),null,1))
await b.close()
