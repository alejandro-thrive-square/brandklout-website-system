/**
 * skipid.mjs — give the restored skip link a DOM id so the CSS can reach it.
 *
 * addskip.mjs created the Link correctly (text and #main href both landed) but
 * its set_style step returned "partial_success": a Webflow style named
 * <pfx>-skip did not exist, so the class was silently not applied and the link
 * rendered VISIBLE at the top of all six pages. set_dom_id does work, and an
 * id is page-scoped so it needs no page prefix.
 *
 * Idempotent on the id, not on a class: re-running finds domId "skip" already
 * set and does nothing.
 */
import { callTool } from './wfmcp.mjs';
const SITE='693c51e685b19f0d0c149cab';
const PAGES={implants:'6a79f2aeabc1d37969522293',aox:'6a7a21d7f34df29a4defacdf',
  veneers:'6a7a21fef87845352663538f',emergency:'6a7a223bf8c58b0aa0c6af2e',
  'dentist-near-me':'6a7a2268da766fb28cddb149','next-door':'6a7a228d106ed97b8a7885c9'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function call(tool,args,pick){
  for(let i=0;i<8;i++){
    const r=await callTool(tool,args);
    let v; try{v=pick(JSON.parse(r.text))}catch{v=undefined}
    if(v!==undefined&&v!==null) return v;
    const lim=/\b429\b/.test(r.text);
    process.stderr.write(`   …${lim?'429':'no data'}, waiting\n`);
    await sleep(lim?20000:2500);
  }
  throw new Error('no usable response from '+tool);
}
let done=0;
for(const [page,pid] of Object.entries(PAGES)){
  const body=await call('data_element_tool',{siteId:SITE,pageId:pid,
    context:'Locating the restored skip link to give it a DOM id.',
    actions:[{label:'t',get_all_elements:{depth:2}}]},o=>o?.result?.[0]?.data);
  await sleep(1200);
  const first=(body.children?.[0]?.children||[])[0];
  if(!first||first.type!=='Link'){console.log(page+': first child is not the skip Link, skipped');continue}
  if((first.attributes||{}).id==='skip'){console.log(page+': already has id=skip');done++;continue}
  const status=await call('data_element_settings_tool',{siteId:SITE,pageId:pid,
    context:'Setting the skip link DOM id so the head CSS can hide it until focus.',
    actions:[{label:'d',set_dom_id:{element_id:first.id,static_value:'skip'}}]},
    o=>o?.result?.[0]?.status??null);
  console.log(`${page}: ${status==='success'?'id set':'FAILED '+status}`);
  if(status==='success')done++;
  await sleep(1200);
}
console.log(`\n${done}/6 skip links identified`);
