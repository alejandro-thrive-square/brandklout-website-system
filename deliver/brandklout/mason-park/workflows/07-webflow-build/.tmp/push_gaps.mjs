/* Push the remaining property gaps: breakpoint variants and hover/active
   states for the combo records create_style could only give base props to.
   Shorthands are expanded to longhands — Webflow stores longhands and
   update_style merges by property NAME, so sending a shorthand ADDS a
   second, competing declaration instead of replacing the stored one. */
import fs from 'node:fs';
import { callTool as call } from './wfmcp.mjs';
import { SITE, PAGE } from './wfstyles.mjs';
const ctx='Restoring breakpoint variants and hover states on combo records rebuilt after the paste.';
const EXPAND={
  'padding-block':['padding-top','padding-bottom'],
  'padding-inline':['padding-left','padding-right'],
  'margin-block':['margin-top','margin-bottom'],
  'margin-inline':['margin-left','margin-right'],
  'border-color':['border-top-color','border-right-color','border-bottom-color','border-left-color'],
};
const props=(miss)=>{
  const out=[];
  for (let [k,v] of Object.entries(miss)) {
    if (k==='font-family') v=v.split(',')[0].trim().replace(/^["']|["']$/g,'');
    if (EXPAND[k]) for (const lk of EXPAND[k]) out.push({property_name:lk, property_value:v});
    else out.push({property_name:k, property_value:v});
  }
  return out;
};
const rows=JSON.parse(fs.readFileSync('.tmp/prop-gaps.json','utf8'));
const problems=[]; let done=0;
for (let i=0;i<rows.length;i+=6) {
  const slice=rows.slice(i,i+6);
  const actions=slice.map((r,n)=>{
    const [bp,pseudo]=r.slot==='base'?['main',null]:r.slot.split('_');
    return { label:`g${i+n}`, update_style:{
      style_name:r.chain[r.chain.length-1],
      ...(r.chain.length>1?{parent_style_names:r.chain.slice(0,-1)}:{}),
      ...(bp!=='main'?{breakpoint_id:bp}:{}),
      ...(pseudo?{pseudo}:{}),
      properties:props(r.miss),
    }};
  });
  try {
    const res=await call('data_style_tool',{siteId:SITE,pageId:PAGE,context:ctx,actions});
    const t=res.text||JSON.stringify(res);
    const errs=[...new Set(t.match(/"message":"[^"]{0,80}/g)||[])];
    if (errs.length) problems.push(`@${i} ${errs.slice(0,2).join(' | ')}`);
  } catch(e){ problems.push(`@${i} threw ${e.message}`); }
  done+=slice.length;
  process.stdout.write(`\r  pushed ${done}/${rows.length}`);
  await new Promise(r=>setTimeout(r,1200));
}
console.log(`\nissued ${done} update_style actions`);
console.log(problems.length?('REPORTED:\n'+problems.slice(0,6).join('\n')):'no per-action errors reported');
