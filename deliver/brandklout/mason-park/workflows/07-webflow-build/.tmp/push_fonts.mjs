/* Restore the font-family declarations the clipboard paste stripped.
   The Designer paste drops font-family for families not registered in Site
   Settings; the Data API does not validate, so update_style can put them back.
   Failures are reported PER ACTION inside a 200 response — check every one. */
import fs from 'node:fs';
import { callTool as call } from './wfmcp.mjs';
const SITE='6a60bdc0340e5f1784b4d553', PAGE='6a75f467c7c9e1a0c133edd1';
const ctx='Restoring font-family declarations that the Designer paste stripped because the families were unregistered.';
const rows=JSON.parse(fs.readFileSync('.tmp/font-actions.json','utf8'));
const CHUNK=8, PACE=1200;
let ok=0; const problems=[];
for (let i=0;i<rows.length;i+=CHUNK) {
  const slice=rows.slice(i,i+CHUNK);
  const actions=slice.map((r,n)=>({ label:`f${i+n}`, update_style:{
    style_name:r.chain[r.chain.length-1],
    ...(r.chain.length>1?{parent_style_names:r.chain.slice(0,-1)}:{}),
    properties:[{property_name:'font-family', property_value:r.fam}],
  }}));
  let res;
  try { res = await call('data_style_tool', { siteId:SITE, pageId:PAGE, context:ctx, actions }); }
  catch (e) { problems.push(`chunk@${i} threw ${e.message}`); continue; }
  const t = res.text || JSON.stringify(res);
  for (const r of slice) {
    const sel='.'+r.chain.join('.');
    if (/Too Many Requests|429/.test(t)) problems.push(`${sel} RATE-LIMITED`);
  }
  const errs=(t.match(/"error"[^,}]*/g)||[]).concat(t.match(/\[Conflict\][^"]*/g)||[]);
  if (errs.length) problems.push(`chunk@${i}: ${[...new Set(errs)].slice(0,2).join(' | ')}`);
  ok+=slice.length;
  process.stdout.write(`\r  pushed ${ok}/${rows.length}`);
  await new Promise(r=>setTimeout(r,PACE));
}
console.log(`\npushed ${ok} font-family declarations`);
console.log(problems.length?('PROBLEMS:\n'+problems.join('\n')):'no per-action errors reported');
