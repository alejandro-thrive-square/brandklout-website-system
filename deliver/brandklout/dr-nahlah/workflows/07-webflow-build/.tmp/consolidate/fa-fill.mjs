// One-off: capture the four fa-body-2 elements on Implant Cost.
// A style filter on "fa-body" 429s on this page every time, and even 4 text
// queries in one call 429s — so each text is looked up alone, with wide spacing.
import fs from 'node:fs';
import { call, collectElements } from './api.mjs';
const SITE='6a6b84cc7fe55ddeabc0b314', IC='6a7198a872eeb266fa217f3b';
const texts=['Because an honest one cannot exist','Some plans offer limited coverage','In most cases yes, through CareCredit','Yes, on implant surgery'];
const els=JSON.parse(fs.readFileSync('elements.json','utf8'));
const m=new Map((els[IC].elements||[]).map(e=>[e.id.component+'/'+e.id.element,e]));
let ok=0;
for(const t of texts){
  try{
    const [r]=await call('data_element_tool',{siteId:SITE,pageId:IC,context:'Locating one FAQ answer container on implant cost for the class consolidation snapshot.',
      actions:[{label:'q',query_elements:{queries:[{label:'p',element_filter:{text:t},return_parent:'parent',limit:5}]}}]},t.slice(0,20));
    const fa=collectElements(r).filter(x=>x.styleNames.some(n=>/fa-body/i.test(n)));
    fa.forEach(e=>m.set(e.id.component+'/'+e.id.element,e));
    ok+=fa.length; console.log('OK',t.slice(0,32),'->',fa.length);
  }catch(e){ console.error('FAIL',t.slice(0,32),String(e.message).slice(0,90)); }
  els[IC].elements=[...m.values()];
  fs.writeFileSync('elements.json',JSON.stringify(els,null,2));
}
const got=[...m.values()].filter(x=>x.styleNames.some(n=>/fa-body/i.test(n))).length;
if(got>=4){ els[IC].stemsDone=[...new Set([...(els[IC].stemsDone||[]),'fa-body'])].sort();
  els[IC].notes='fa-body captured via text->parent lookup; a style filter on "fa-body" 429s on this page every time';
  fs.writeFileSync('elements.json',JSON.stringify(els,null,2)); }
console.log('fa-body elements now captured:',got,'of 4 expected');
