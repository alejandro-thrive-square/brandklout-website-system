// The 26 elements whose set_style failed. Their fork classes were reported
// removed by the same run, so confirm each element still HAS a class.
import fs from 'node:fs';
import { call, collectElements } from './api.mjs';
const SITE='6a6b84cc7fe55ddeabc0b314';
const j=fs.readFileSync('journal.jsonl','utf8').split('\n').filter(Boolean).map(JSON.parse);
const last=new Map(); j.forEach(x=>last.set(x.key,x));
const failed=[...last.values()].filter(x=>x.kind==='set-style'&&!x.ok);
const plan=JSON.parse(fs.readFileSync('plan.json','utf8'));
const byKey=new Map(plan.rewrites.map(r=>[`el:${r.id.component}/${r.id.element}`,r]));
const byPage={};
for(const f of failed){ const r=byKey.get(f.key); if(r) (byPage[r.pageId] ||= []).push(r); }
console.log('failed elements:',failed.length,'across',Object.keys(byPage).length,'pages');
const out=[];
for(const [pageId,rs] of Object.entries(byPage)){
  for(const r of rs){
    try{
      const [res]=await call('data_element_tool',{siteId:SITE,pageId,context:'Confirming that elements whose restyle failed still carry a class after the consolidation run.',
        actions:[{label:'q',query_elements:{queries:[{label:'e',element_id:{component:r.id.component,element:r.id.element}}]}}]},r.id.element.slice(0,8));
      const el=collectElements(res)[0];
      const names=el?.styleNames??null;
      const orphaned = !names || names.length===0;
      out.push({page:r.page,el:r.id.element,intended:r.after,now:names,orphaned});
      console.log(`${orphaned?'ORPHANED':'ok      '} ${r.page.padEnd(18)} ${r.id.element.slice(0,10)} now=${JSON.stringify(names)} wanted=${JSON.stringify(r.after)}`);
    }catch(e){ console.error('  query failed',r.id.element.slice(0,10),String(e.message).slice(0,80)); out.push({page:r.page,el:r.id.element,error:String(e.message).slice(0,120)}); }
  }
}
fs.writeFileSync('check26.json',JSON.stringify(out,null,2));
const orph=out.filter(o=>o.orphaned).length;
console.log(`\nORPHANED (no class at all): ${orph} of ${out.length} checked`);
