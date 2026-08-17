/* Full structural diff: every class CHAIN the three payloads expect vs every
   selector the site actually holds. Webflow merges a pasted class by NAME only
   when combo-ness matches, so a second page pasting `btn` under a different
   parent silently attaches an unstyled token instead of creating the combo. */
import fs from 'node:fs';
import { liveStyles, SITE, PAGE } from './wfstyles.mjs';
const PAGES=['invisalign','new-patient-special','thank-you'];

const want=new Map(); // selector -> {chain, base:{}, variants:{}, pages:Set}
for (const pg of PAGES) {
  const p=JSON.parse(fs.readFileSync(`.tmp/pc/${pg}/final.json`,'utf8')).payload;
  const parentsOf=new Map();
  for (const s of p.styles) for (const k of s.children||[]) {
    if(!parentsOf.has(k)) parentsOf.set(k,[]); parentsOf.get(k).push(s);
  }
  const chains=(s)=>{ if(s.comb!=='&') return [[s.name]];
    const ps=parentsOf.get(s._id)||[]; if(!ps.length) return [[s.name]];
    return ps.flatMap(par=>chains(par).map(c=>[...c,s.name])); };
  const decls=(less)=>Object.fromEntries((less||'').split(';').map(d=>d.trim()).filter(Boolean)
    .map(d=>{const i=d.indexOf(':'); return [d.slice(0,i).trim(), d.slice(i+1).trim()];}));
  for (const s of p.styles) for (const chain of chains(s)) {
    const sel='.'+chain.join('.');
    if(!want.has(sel)) want.set(sel,{chain,base:{},variants:{},pages:new Set()});
    const e=want.get(sel);
    Object.assign(e.base, decls(s.styleLess));
    for (const [bp,v] of Object.entries(s.variants||{})) {
      e.variants[bp]={...(e.variants[bp]||{}), ...decls(v.styleLess)};
    }
    e.pages.add(pg);
  }
}
const list=await liveStyles('Reading all site styles to diff live selectors against the three payload class chains.');
const live=new Map(list.filter(s=>s.selector).map(s=>[s.selector,s]));

const missing=[...want.entries()].filter(([sel])=>!live.has(sel));
const present=[...want.keys()].filter(sel=>live.has(sel));
console.log(`payload selectors: ${want.size} | live: ${live.size} | present: ${present.length} | MISSING: ${missing.length}`);
const byPage={}; for (const [,e] of missing) for (const pg of e.pages) byPage[pg]=(byPage[pg]||0)+1;
console.log('missing by page:', JSON.stringify(byPage));
console.log('missing by depth:', JSON.stringify(missing.reduce((a,[,e])=>(a[e.chain.length]=(a[e.chain.length]||0)+1,a),{})));
console.log('sample:', missing.slice(0,12).map(([s])=>s).join(' , '));
fs.writeFileSync('.tmp/missing-selectors.json', JSON.stringify(
  missing.map(([sel,e])=>({sel,chain:e.chain,base:e.base,variants:e.variants,pages:[...e.pages]})),null,1));
console.log('-> .tmp/missing-selectors.json');
