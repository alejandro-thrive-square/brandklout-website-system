/* Re-point every element off its forked duplicate class onto the canonical one.
   set_style REPLACES the whole style list, so each action carries the element's
   full stack with only the forked names rewritten — order preserved, because
   the first name is the combo base. */
import fs from 'node:fs';
import { callTool as call } from './wfmcp.mjs';
import { SITE } from './wfstyles.mjs';
const PAGES={invisalign:'6a75f467c7c9e1a0c133edd1','new-patient-special':'6a75f468bfddad669aaf8321','thank-you':'6a75f468c490cc1bb6fa6a8c'};
const ctx='Re-pointing elements from forked duplicate classes onto the canonical shared classes.';
const plan=JSON.parse(fs.readFileSync('.tmp/repoint-plan.json','utf8'));
for (const [pg,items] of Object.entries(plan)) {
  if(!items.length) { console.log(`${pg}: nothing to do`); continue; }
  const problems=[]; let done=0;
  for (let i=0;i<items.length;i+=6) {
    const slice=items.slice(i,i+6);
    const actions=slice.map((it,n)=>({label:`r${i+n}`, set_style:{ id:it.id, style_names:it.to }}));
    try {
      const res=await call('data_element_tool',{siteId:SITE,pageId:PAGES[pg],context:ctx,actions});
      const t=res.text||JSON.stringify(res);
      const errs=[...new Set(t.match(/"message":"[^"]{0,70}/g)||[])].filter(m=>!/success|updated/i.test(m));
      if (errs.length) problems.push(`@${i} ${errs.slice(0,2).join(' | ')}`);
    } catch(e){ problems.push(`@${i} threw ${e.message}`); }
    done+=slice.length;
    process.stdout.write(`\r  ${pg}: ${done}/${items.length}`);
    await new Promise(r=>setTimeout(r,1100));
  }
  console.log(`\n${pg}: re-pointed ${done} elements${problems.length?' | REPORTED: '+problems.slice(0,3).join(' ; '):' | no errors reported'}`);
}
