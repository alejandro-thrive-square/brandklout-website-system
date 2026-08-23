import { callTool } from './wfmcp.mjs';
const SITE='693c51e685b19f0d0c149cab';
const PAGES={implants:'6a79f2aeabc1d37969522293',aox:'6a7a21d7f34df29a4defacdf',
  veneers:'6a7a21fef87845352663538f',emergency:'6a7a223bf8c58b0aa0c6af2e',
  'dentist-near-me':'6a7a2268da766fb28cddb149','next-door':'6a7a228d106ed97b8a7885c9'};
for(const [page,pid] of Object.entries(PAGES)){
  const {text}=await callTool('data_element_tool',{siteId:SITE,pageId:pid,
    context:'Reading stored link targets to find the ones the publisher renders as malformed URLs.',
    actions:[{label:'l',query_elements:{queries:[{label:'a',element_filter:{type:'Link'}}]}}]});
  const ms=JSON.parse(text).result[0].data[0].matches;
  console.log('##### '+page+'  ('+ms.length+' links)');
  ms.forEach(e=>{
    const L=e.settings?.link;
    const h=L?String(L.href||''):'(no link)';
    if(!L || h.startsWith('#') || h.startsWith('tel:') || h.startsWith('mailto:') || h.startsWith('http')) return;
    console.log('   ', e.id.element, JSON.stringify(L), (e.styleNames||[]).join(','));
  });
}
