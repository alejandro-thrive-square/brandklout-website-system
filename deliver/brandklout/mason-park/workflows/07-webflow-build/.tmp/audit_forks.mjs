/* Fetch each page's element tree. ASSERTS a non-empty response: a transient
   empty read silently wrote a 0KB tree once and reported "no forks" on pages
   that were still full of them. */
import fs from 'node:fs';
import { callTool as call } from './wfmcp.mjs';
import { SITE } from './wfstyles.mjs';
const PAGES={invisalign:'6a75f467c7c9e1a0c133edd1','new-patient-special':'6a75f468bfddad669aaf8321','thank-you':'6a75f468c490cc1bb6fa6a8c'};
for (const [name,id] of Object.entries(PAGES)) {
  let t='';
  for (let a=0; a<3 && t.length<5000; a++) {
    if (a) await new Promise(r=>setTimeout(r,3000));
    const r=await call('data_element_tool',{siteId:SITE,pageId:id,
      context:'Reading the page element tree to audit which elements still carry forked duplicate classes.',
      actions:[{label:'tree', get_all_elements:{depth:-1}}]});
    t=r.text||'';
  }
  if (t.length<5000) throw new Error(`${name}: element tree read empty after 3 attempts — refusing to report`);
  fs.writeFileSync(`.tmp/live/${name}.tree.json`, t);
  console.log(`${name.padEnd(20)} tree ${(t.length/1024).toFixed(0)}KB`);
  await new Promise(r=>setTimeout(r,2000));
}
