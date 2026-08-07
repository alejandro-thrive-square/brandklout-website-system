import { callTool as call } from './wfmcp.mjs';
const SITE='6a60bdc0340e5f1784b4d553', PAGE='6a75f467c7c9e1a0c133edd1';
const res=await call('data_style_tool',{siteId:SITE,pageId:PAGE,
  context:'Locating real selectors for combo classes whose expected chain was not found during verification.',
  actions:[{label:'all', get_styles:{query:'all', include_properties:true}}]});
const d=JSON.parse(res.text||JSON.stringify(res));
const list=d.result?.data?.matches||d.result?.matches||(Array.isArray(d.result)?d.result:[]);
console.log('records:',list.length, 'sample selector:', list[0]?.selector, '| combos:', list.filter(s=>s.isComboClass).length);
const want=['nps-a','ty-a','nps-p','inv-a','inv-p'];
for (const w of want) {
  const hits=list.filter(s=>(s.selector||'').split('.').filter(Boolean).includes(w));
  console.log(`${w}: ${hits.length} ->`, hits.slice(0,6).map(s=>s.selector).join(' , '));
}
