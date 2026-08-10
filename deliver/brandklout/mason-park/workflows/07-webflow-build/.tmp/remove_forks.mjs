/* Delete the orphaned fork classes now that no element references them.
   Only names of the form "<canonical> <n>" whose canonical exists in the
   payloads are touched, and only after the element trees show zero uses. */
import fs from 'node:fs';
import { callTool as call } from './wfmcp.mjs';
import { liveStyles, SITE, PAGE } from './wfstyles.mjs';
const PAGES=['invisalign','new-patient-special','thank-you'];
const want=new Set();
for (const pg of PAGES) {
  const p=JSON.parse(fs.readFileSync(`.tmp/pc/${pg}/final.json`,'utf8')).payload;
  for (const s of p.styles) want.add(s.name);
}
// safety: no element anywhere may still reference a fork
const used=new Set();
for (const pg of PAGES) {
  const d=JSON.parse(fs.readFileSync(`.tmp/live/${pg}.tree.json`,'utf8'));
  (function walk(n){ for(const s of n.styleNames||[]) used.add(s); for(const c of n.children||[]) walk(c); })(d.result[0].data);
}
const list=await liveStyles('Listing site styles to remove fork duplicates that no element references any more.');
const forks=list.filter(s=>{
  const m=(s.name||'').match(/^(.*) (\d+)$/);
  return m && want.has(m[1]) && !want.has(s.name);
});
const stillUsed=forks.filter(f=>used.has(f.name));
console.log(`fork styles on site: ${forks.length} | still referenced by an element: ${stillUsed.length}`);
if (stillUsed.length) { console.log('ABORT — still in use:', stillUsed.map(f=>f.name).slice(0,10).join(', ')); process.exit(1); }
const ctx='Removing fork duplicate classes that no element references, after re-pointing.';
let done=0; const problems=[];
for (let i=0;i<forks.length;i+=6) {
  const slice=forks.slice(i,i+6);
  const actions=slice.map((f,n)=>({label:`d${i+n}`, remove_style:{ style_name:f.name }}));
  try {
    const r=await call('data_style_tool',{siteId:SITE,pageId:PAGE,context:ctx,actions});
    const t=r.text||'';
    const errs=[...new Set(t.match(/"message":"[^"]{0,70}/g)||[])].filter(m=>!/success|removed/i.test(m));
    if (errs.length) problems.push(`@${i} ${errs.slice(0,2).join(' | ')}`);
  } catch(e){ problems.push(`@${i} threw ${e.message}`); }
  done+=slice.length;
  process.stdout.write(`\r  removed ${done}/${forks.length}`);
  await new Promise(r=>setTimeout(r,1100));
}
console.log(`\nissued ${done} remove_style actions${problems.length?'\nREPORTED: '+problems.slice(0,4).join(' ; '):' | no errors reported'}`);
const after=await liveStyles('Verifying the fork duplicate classes are gone from the site.');
const left=after.filter(s=>{ const m=(s.name||'').match(/^(.*) (\d+)$/); return m && want.has(m[1]) && !want.has(s.name); });
console.log(`fork styles remaining: ${left.length}${left.length?' -> '+left.map(f=>f.name).slice(0,8).join(', '):''}`);
console.log(`total styles on site now: ${after.length}`);
