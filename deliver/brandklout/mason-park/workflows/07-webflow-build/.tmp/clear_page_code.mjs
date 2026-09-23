/* The retired headless build kept each page's chapter scripts in PAGE-level
   footer custom code. The component build ships them inside the sections, so
   both copies now run: every chapter registers twice and scrub-proof sees 6
   pins where 3 are expected, with pins that never release.
   Clear the footers; keep only the robots meta in the heads (the new SITE head
   block already carries the runtime-state CSS and the 1439 display rung).
   Byte-for-byte copies of what is removed live in .tmp/_installed/. */
import fs from 'node:fs';
import { callTool as call } from './wfmcp.mjs';
const ctx='Clearing page-level custom code duplicated by the component build, preserving each page robots meta.';
const PAGES={invisalign:'6a75f467c7c9e1a0c133edd1','new-patient-special':'6a75f468bfddad669aaf8321','thank-you':'6a75f468c490cc1bb6fa6a8c'};
const read=async(id,loc)=>{
  const r=await call('data_scripts_tool',{context:ctx,actions:[{label:'r',get_page_freeform_code:{page_id:id,location:loc}}]});
  const d=JSON.parse(r.text||JSON.stringify(r));
  return d.result?.content ?? d.result?.[0]?.content ?? '';
};
const FOOTER='<!-- Chapter scripts ride inside their sections (pasteable components). Site footer holds the shared runtime. -->';
for (const [name,id] of Object.entries(PAGES)) {
  const head=await read(id,'head');
  const robots=(head.match(/<meta[^>]*name=["']robots["'][^>]*>/i)||[])[0];
  if(!robots) throw new Error(`${name}: no robots meta found — refusing to overwrite the head blindly`);
  fs.writeFileSync(`.tmp/_installed/${name}.page-head.pre-components.html`, head);
  fs.writeFileSync(`.tmp/_installed/${name}.page-footer.pre-components.html`, await read(id,'footer'));
  await call('data_scripts_tool',{context:ctx,actions:[
    {label:'head', set_page_freeform_code:{page_id:id, location:'head',   content:robots}},
    {label:'foot', set_page_freeform_code:{page_id:id, location:'footer', content:FOOTER}}]});
  const h=await read(id,'head'), f=await read(id,'footer');
  console.log(`${name.padEnd(20)} head ${String(h.length).padStart(5)}  footer ${String(f.length).padStart(5)}  MPD.add gone: ${!/MPD\.add/.test(h+f)}`);
}
