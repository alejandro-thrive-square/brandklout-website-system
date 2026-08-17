// Did remove_style actually delete anything? The journal says 133 removals
// succeeded, but pg-hero/pk-head forks were still listed afterwards.
import { call } from './api.mjs';
import fs from 'node:fs';
const SITE='6a6b84cc7fe55ddeabc0b314';
const any=JSON.parse(fs.readFileSync('pages.json','utf8')).find(p=>!p.draft).id;
await new Promise(r=>setTimeout(r,120000));           // let the window reopen
for (const stem of ['chapter-tag','ph-lead','pk-quote-mark','nx-k']) {
  try {
    const [r]=await call('data_style_tool',{siteId:SITE,pageId:any,context:'Confirming whether classes reported as removed during consolidation are actually gone.',
      actions:[{label:'q',query_styles:{queries:[{label:stem,name_path:[stem],include_properties:false,limit:40}]}}]},stem);
    const names=r.result[0].matches.map(m=>m.name).sort();
    console.log(stem.padEnd(14), names.length, '->', names.join(', '));
  } catch(e){ console.error(stem,'FAILED',String(e.message).slice(0,100)); }
}
