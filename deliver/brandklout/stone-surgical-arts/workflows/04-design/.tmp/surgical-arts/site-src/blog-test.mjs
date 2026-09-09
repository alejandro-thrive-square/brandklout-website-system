// End-to-end blog journeys against either the local build or the published Instatic site.
// Usage: node blog-test.mjs [--live]. Reports and screenshots stay in 04-design/.tmp/blog-qa/.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import { posts } from './blog-data.mjs';
import { related } from './blog-render.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../final-site');
const OUT = path.resolve(HERE, '../../blog-qa');
fs.mkdirSync(OUT, {recursive:true});
const live = process.argv.includes('--live');
const mode = live ? 'instatic' : 'local';
const mime = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.avif':'image/avif','.woff2':'font/woff2'};
const server = live ? null : http.createServer((req,res)=>{
  const pathname = decodeURIComponent(new URL(req.url,'http://local').pathname);
  const file = path.join(ROOT,pathname==='/'?'index.html':pathname);
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
if(server) await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base = live ? 'https://stone-surgical-arts-production.up.railway.app' : `http://127.0.0.1:${server.address().port}`;
const url = slug => `${base}/${slug==='index' ? (live?'':'index.html') : slug+(live?'':'.html')}`;
const browser = await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--hide-scrollbars']});
const results=[]; const failures=[];
async function run(name,fn){try{await fn();results.push(name);console.log('PASS '+name);}catch(e){failures.push({name,error:e.message});console.log('FAIL '+name+': '+e.message);}}
async function settle(page){await page.evaluate(async()=>{await document.fonts.ready; document.querySelectorAll('img').forEach(i=>i.loading='eager'); await Promise.race([Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))),new Promise((_,reject)=>setTimeout(()=>reject(Error('Image loading timed out')),15000))]);});}
try {
  for(const width of [320,390,768,1024,1440,1920]) for(const slug of ['blog',...posts.map(p=>p.slug)]){
    await run(`${slug} at ${width}`,async()=>{
      const page=await browser.newPage(); const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.setViewport({width,height:900,deviceScaleFactor:1});
      await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
      try {
        const response=await page.goto(url(slug),{waitUntil:'networkidle0',timeout:60000});assert.equal(response.status(),200);await settle(page);
        const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,h1:document.querySelectorAll('h1').length,missing:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),anchors:[...document.querySelectorAll('.journal_page a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash),fonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family)}));
        assert.ok(state.overflow<=1,`horizontal overflow ${state.overflow}`);assert.equal(state.h1,1);assert.deepEqual(state.missing,[]);assert.deepEqual(state.anchors,[]);assert.deepEqual(errors,[]);
        assert.ok(state.fonts.some(f=>f.includes('Cormorant')));assert.ok(state.fonts.some(f=>f.includes('Inter')));
        if(width===390||width===1440) await page.screenshot({path:path.join(OUT,`${mode}-${slug}-${width}.png`),fullPage:true});
      } finally {await page.close();}
    });
  }
  for(const width of [390,1440]) await run(`navigation, anchors and related posts at ${width}`,async()=>{
    const page=await browser.newPage();await page.setViewport({width,height:900});
    try {
      await page.goto(url('index'),{waitUntil:'networkidle0'});
      if(width<992){await page.click('.navbar_burger');await page.waitForSelector('.drawer_component.is-open');}
      const selector=width<992?'.drawer_nav a[href*="blog"]':'.navbar_menu a[href*="blog"]';
      await page.focus(selector);await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.keyboard.press('Enter')]);assert.equal(new URL(page.url()).pathname,new URL(url('blog')).pathname);
      // The overview lists every article except the featured one. Derived, not
      // hard-coded: this assertion said 2 until the journal went from 3 to 39.
      assert.equal(await page.$$eval('.journal_card',cards=>cards.length),posts.length-1);
      await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click('.journal_feature-copy .journal_read')]);
      assert.equal(await page.$eval('h1',e=>e.textContent),posts[0].title);
      const last=posts[0].sections.at(-1);await page.click(`.journal_toc a[href="#${last.id}"]`);
      await page.waitForFunction(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.top>=0&&r.top<window.innerHeight/2;},{timeout:8000},last.id);
      await page.waitForFunction(id=>document.querySelector(`.journal_toc a[href="#${id}"]`).getAttribute('aria-current')==='location',{},last.id);
      await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click('.journal_related .journal_card-link')]);assert.ok(new URL(page.url()).pathname.includes(related(posts[0])[0].slug));
      await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click('.journal_article-head .journal_back')]);assert.ok(new URL(page.url()).pathname.includes('blog'));
      await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click('.section_cta a.button')]);assert.ok(new URL(page.url()).pathname.includes('book'));
    }finally{await page.close();}
  });
  await run('article remains readable without JavaScript',async()=>{
    const page=await browser.newPage();try{await page.setJavaScriptEnabled(false);await page.goto(url(posts[0].slug),{waitUntil:'networkidle0'});assert.equal(await page.$$eval('.journal_section',s=>s.length),4);await page.click('.journal_toc-link');assert.ok(page.url().endsWith('#appearance'));}finally{await page.close();}
  });
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
fs.writeFileSync(path.join(OUT,`${mode}-results.json`),JSON.stringify({mode,base,passed:results.length,results,failures},null,2)+'\n');
console.log(`${mode}: ${results.length} passed, ${failures.length} failed`);if(failures.length)process.exitCode=1;
