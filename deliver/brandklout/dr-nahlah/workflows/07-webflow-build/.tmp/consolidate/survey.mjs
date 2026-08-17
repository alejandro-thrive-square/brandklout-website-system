// Which forks are ACTUALLY gone? The journal says 133 removals succeeded, but
// spot checks show some survived. Ask the API family by family.
import fs from 'node:fs';
import { call } from './api.mjs';
const SITE='6a6b84cc7fe55ddeabc0b314';
const plan=JSON.parse(fs.readFileSync('plan.json','utf8'));
const any=JSON.parse(fs.readFileSync('pages.json','utf8')).find(p=>!p.draft).id;
const HOLD=new Set(['fa-body','pk-more','pk-more-7']);
const fams=plan.families.filter(f=>!HOLD.has(f.canonical));
const rows=[];
for(let i=0;i<fams.length;i+=3){
  const chunk=fams.slice(i,i+3);
  try{
    const [r]=await call('data_style_tool',{siteId:SITE,pageId:any,context:'Surveying which consolidated fork classes remain on the site after the apply run.',
      actions:[{label:'q',query_styles:{queries:chunk.map(f=>({label:f.canonical,name_path:[f.canonical],include_properties:false,limit:60}))}}]},`survey ${i}`);
    for(const q of r.result){
      const f=chunk.find(x=>x.canonical===q.label);
      const globals=q.matches.filter(m=>!m.isComboClass).map(m=>m.name);
      const combos=q.matches.filter(m=>m.isComboClass).map(m=>m.selector);
      const remaining=f.forks.filter(fk=>globals.includes(plan.forkNames[fk]??fk));
      rows.push({canonical:f.canonical,forks:f.forks.length,remaining:remaining.length,remainingNames:remaining,combos});
    }
  }catch(e){ console.error('chunk',i,'failed',String(e.message).slice(0,90)); }
}
rows.sort((a,b)=>b.remaining-a.remaining);
let clean=0,dirty=0;
for(const r of rows){
  const tag = r.remaining===0 ? 'CLEAN' : 'LEFT ';
  if(r.remaining===0) clean++; else dirty++;
  console.log(`${tag} ${r.canonical.padEnd(16)} ${String(r.forks).padStart(2)} forks, ${String(r.remaining).padStart(2)} remaining${r.combos.length?`  combos: ${r.combos.join(', ')}`:''}`);
}
console.log(`\n${clean} families fully consolidated, ${dirty} with forks remaining`);
fs.writeFileSync('survey.json',JSON.stringify(rows,null,2));
