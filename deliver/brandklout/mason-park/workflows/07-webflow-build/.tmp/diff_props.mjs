/* Property-level diff, slot-correct.
   live: properties.base.properties            <- payload slot "base"
         properties.base.pseudos.<p>.properties<- payload slot "main_<p>"
         properties.breakpoints.<bp>.properties<- payload slot "<bp>" */
import fs from 'node:fs';
import { liveStyles } from './wfstyles.mjs';
const PAGES=['invisalign','new-patient-special','thank-you'];
const norm=(v)=>String(v).trim().replace(/\s+/g,' ')
  .replace(/#([0-9a-fA-F]{3,8})/g,(m,h)=>'#'+h.toLowerCase());
// Webflow stores logical/box shorthands as LONGHANDS, so a shorthand is
// satisfied when every longhand it expands to carries the value.
const EXPAND={'padding-block':['padding-top','padding-bottom'],
  'padding-inline':['padding-left','padding-right'],
  'margin-block':['margin-top','margin-bottom'],
  'margin-inline':['margin-left','margin-right'],
  'border-color':['border-top-color','border-right-color','border-bottom-color','border-left-color']};
const decls=(less)=>Object.fromEntries((less||'').split(';').map(d=>d.trim()).filter(Boolean)
  .map(d=>{const i=d.indexOf(':'); return [d.slice(0,i).trim(), d.slice(i+1).trim()];}));
const want=new Map();
for (const pg of PAGES) {
  const p=JSON.parse(fs.readFileSync(`.tmp/pc/${pg}/final.json`,'utf8')).payload;
  const parentsOf=new Map();
  for (const s of p.styles) for (const k of s.children||[]) {
    if(!parentsOf.has(k)) parentsOf.set(k,[]); parentsOf.get(k).push(s); }
  const chains=(s)=>{ if(s.comb!=='&') return [[s.name]];
    const ps=parentsOf.get(s._id)||[]; if(!ps.length) return [[s.name]];
    return ps.flatMap(par=>chains(par).map(c=>[...c,s.name])); };
  for (const s of p.styles) for (const chain of chains(s)) {
    const sel='.'+chain.join('.');
    if(!want.has(sel)) want.set(sel,{chain,slots:{}});
    const e=want.get(sel);
    e.slots.base={...(e.slots.base||{}), ...decls(s.styleLess)};
    for (const [bp,v] of Object.entries(s.variants||{})) e.slots[bp]={...(e.slots[bp]||{}), ...decls(v.styleLess)};
  }
}
const list=await liveStyles('Slot-correct property verification of every pasted and repaired style against the payloads.');
const live=new Map(list.filter(s=>s.selector).map(s=>[s.selector,s]));
const liveSlot=(L,slot)=>{
  if (slot==='base') return L.properties?.base?.properties||{};
  const [bp,pseudo]=slot.split('_');
  // pseudo slots hold the property map DIRECTLY (no nested .properties)
  if (pseudo) return (bp==='main'?L.properties?.base?.pseudos:L.properties?.breakpoints?.[bp]?.pseudos)?.[pseudo]||{};
  return L.properties?.breakpoints?.[bp]?.properties||{};
};
const gaps=[];
for (const [sel,e] of want) {
  const L=live.get(sel);
  if(!L){ gaps.push({sel,chain:e.chain,slot:'base',miss:e.slots.base,absent:true}); continue; }
  for (const [slot,props] of Object.entries(e.slots)) {
    const got=liveSlot(L,slot), miss={};
    for (const [k,v] of Object.entries(props)) {
      if (k.startsWith('--')) continue;
      // Webflow stores ONE font family, never the source stack
      if (EXPAND[k]) {
        // Webflow keeps some shorthands verbatim and expands others to
        // longhands — either form satisfies the payload's declaration.
        const asShorthand = got[k]!==undefined && norm(got[k])===norm(v);
        const asLonghands = EXPAND[k].every(lk=>got[lk]!==undefined && norm(got[lk])===norm(v));
        if (asShorthand || asLonghands) continue;
        miss[k]=v; continue;
      }
      const eq = k==='font-family'
        ? String(got[k]||'')===v.split(',')[0].trim().replace(/^["']|["']$/g,'')
        : got[k]!==undefined && norm(got[k])===norm(v);
      if (!eq) miss[k]=v;
    }
    if (Object.keys(miss).length) gaps.push({sel,chain:e.chain,slot,miss});
  }
}
const byslot={}, propcount={};
for (const g of gaps){ byslot[g.slot]=(byslot[g.slot]||0)+1; for(const k of Object.keys(g.miss)) propcount[k]=(propcount[k]||0)+1; }
console.log(`selectors ${want.size} | gap records ${gaps.length} | declarations to fix ${gaps.reduce((a,g)=>a+Object.keys(g.miss).length,0)}`);
console.log('by slot:', JSON.stringify(byslot));
console.log('top properties:', JSON.stringify(Object.entries(propcount).sort((a,b)=>b[1]-a[1]).slice(0,10)));
fs.writeFileSync('.tmp/prop-gaps.json', JSON.stringify(gaps,null,1));
