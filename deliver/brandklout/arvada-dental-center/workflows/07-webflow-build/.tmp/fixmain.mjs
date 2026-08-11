/**
 * fixmain.mjs — give the pasted page a #main target.
 *
 * The design wraps its chapters in <main id="main"> and both the skip link and
 * the nav logo point at it. The packager packages SECTIONS, and <main> is not
 * one, so neither it nor its id survived: the logo's href="#main" lands on
 * nothing on all six pages.
 *
 * The single-root paste wrapper is the right home for that id. It currently
 * carries domId "imp-nav" — a DUPLICATE of the nav section's own id, and the
 * only duplicate id on the page, so `#imp-nav` resolves to the wrapper rather
 * than the nav. Nothing in any script or stylesheet references it (checked, 0
 * occurrences), so renaming it to `main` fixes the dead logo link and removes
 * the duplicate in one move.
 */
import { callTool } from './wfmcp.mjs';
const SITE='693c51e685b19f0d0c149cab';
const PAGES={implants:'6a79f2aeabc1d37969522293',aox:'6a7a21d7f34df29a4defacdf',
  veneers:'6a7a21fef87845352663538f',emergency:'6a7a223bf8c58b0aa0c6af2e',
  'dentist-near-me':'6a7a2268da766fb28cddb149','next-door':'6a7a228d106ed97b8a7885c9'};
const APPLY=process.argv.includes('--apply');
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
    context:'Locating the single-root paste wrapper to give it the #main target id.',
    actions:[{label:'t',get_all_elements:{depth:1}}]},o=>o?.result?.[0]?.data);
  await sleep(1200);
  const wrap=(body.children||[])[0];
  if(!wrap){console.log(page+': no wrapper');continue}
  const cur=wrap.attributes&&wrap.attributes.id;
  console.log(`${page}: wrapper domId=${JSON.stringify(cur)} -> "main"`);
  if(!APPLY){done++;continue}
  const status=await call('data_element_settings_tool',{siteId:SITE,pageId:pid,
    context:'Setting the paste wrapper DOM id to main so the nav logo and skip link resolve.',
    actions:[{label:'d',set_dom_id:{element_id:wrap.id,static_value:'main'}}]},
    o=>o?.result?.[0]?.status??null);
  console.log(`   ${status==='success'?'SET':'FAILED'}`);
  if(status==='success')done++;
  await sleep(1200);
}
console.log(`\n${done}/6 wrappers ${APPLY?'set':'to set'}`);
