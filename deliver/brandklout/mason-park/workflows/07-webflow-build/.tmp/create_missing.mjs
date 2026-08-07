/* Create the combo-class records the 2nd and 3rd clipboard pastes could not.
   Webflow merges a pasted class by NAME only when combo-ness matches: once
   `btn` exists as a combo under `inv-a`, pasting `nps-a btn` attaches `btn` as
   a bare token and creates NO record, so those elements paint nothing.
   create_style with parent_style_names builds the record the paste skipped.
   Depth order matters — a combo cannot be created before its parent chain. */
import fs from 'node:fs';
import { callTool as call } from './wfmcp.mjs';
import { SITE, PAGE } from './wfstyles.mjs';
const ctx='Creating combo-class records that the second and third page pastes failed to produce.';
const rows=JSON.parse(fs.readFileSync('.tmp/missing-selectors.json','utf8'))
  .sort((a,b)=>a.chain.length-b.chain.length);
const props=(o)=>Object.entries(o).map(([property_name,property_value])=>({property_name,property_value}));
const problems=[]; let made=0;
for (let i=0;i<rows.length;i+=6) {
  const slice=rows.slice(i,i+6);
  const actions=slice.map((r,n)=>({ label:`c${i+n}`, create_style:{
    name:r.chain[r.chain.length-1],
    parent_style_names:r.chain.slice(0,-1),
    properties:props(r.base),
  }}));
  try {
    const res=await call('data_style_tool',{siteId:SITE,pageId:PAGE,context:ctx,actions});
    const t=res.text||JSON.stringify(res);
    const errs=[...new Set((t.match(/"message":"[^"]{0,90}/g)||[]))];
    if (errs.length) problems.push(`@${i} ${errs.slice(0,2).join(' | ')}`);
  } catch(e){ problems.push(`@${i} threw ${e.message}`); }
  made+=slice.length;
  process.stdout.write(`\r  created ${made}/${rows.length}`);
  await new Promise(r=>setTimeout(r,1200));
}
console.log(`\nissued ${made} create_style actions`);
console.log(problems.length?('REPORTED:\n'+problems.slice(0,8).join('\n')):'no per-action errors reported');
