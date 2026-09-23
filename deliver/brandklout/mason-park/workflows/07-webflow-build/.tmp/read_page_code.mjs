import { callTool as call } from './wfmcp.mjs';
const PAGES={invisalign:'6a75f467c7c9e1a0c133edd1','new-patient-special':'6a75f468bfddad669aaf8321','thank-you':'6a75f468c490cc1bb6fa6a8c'};
for (const [name,id] of Object.entries(PAGES)) {
  for (const loc of ['head','footer']) {
    const r=await call('data_scripts_tool',{context:'Auditing page-level custom code left over from the retired headless build.',
      actions:[{label:'r', get_page_freeform_code:{page_id:id, location:loc}}]});
    const d=JSON.parse(r.text||JSON.stringify(r));
    const c=d.result?.content ?? d.result?.[0]?.content ?? '';
    console.log(`${name.padEnd(20)} ${loc.padEnd(7)} ${String(c.length).padStart(6)} chars  ${/MPD\.add/.test(c)?'*** CONTAINS MPD.add (duplicate chapter scripts)':''}${/robots/.test(c)?' [has robots meta]':''}`);
  }
}
