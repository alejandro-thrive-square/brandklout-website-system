/* Read every expected font-family back OFF THE SITE. The push reports errors
   per action and [Conflict] is usually a no-op on an already-correct style —
   so the site read-back, not the push result, is the gate. */
import fs from 'node:fs';
import { callTool as call } from './wfmcp.mjs';
const SITE='6a60bdc0340e5f1784b4d553', PAGE='6a75f467c7c9e1a0c133edd1';
const rows=JSON.parse(fs.readFileSync('.tmp/font-actions.json','utf8'));
const want=new Map(rows.map(r=>['.'+r.chain.join('.'), r.fam]));
const res=await call('data_style_tool',{siteId:SITE,pageId:PAGE,
  context:'Reading every style back off the site to verify the restored font-family declarations.',
  actions:[{label:'all', get_styles:{query:'all', include_properties:true}}]});
const t=res.text||JSON.stringify(res);
const d=JSON.parse(t);
const list=d.result?.data?.matches||d.result?.matches||d.result||[];
const live=new Map();
for (const s of (Array.isArray(list)?list:[])) {
  const fam=s.properties?.base?.properties?.['font-family'];
  if (s.selector) live.set(s.selector, fam);
}
let good=0; const bad=[];
for (const [sel,fam] of want) {
  const got=live.get(sel);
  if (got===fam) good++;
  else bad.push(`${sel}  want ${fam}  got ${got===undefined?(live.has(sel)?'(no font-family)':'(selector absent)'):got}`);
}
console.log(`font-family verified on the SITE: ${good}/${want.size}`);
if (bad.length) console.log('MISSING:\n'+bad.slice(0,25).join('\n'));
const stray=[...live.entries()].filter(([s,f])=>f && !want.has(s));
console.log(`styles carrying a font-family that the payload does not expect: ${stray.length}`);
if (stray.length) console.log(stray.slice(0,10).map(([s,f])=>`${s} = ${f}`).join('\n'));
