/* Shared reader. TWO traps live here:
   1. get_styles and query_styles nest results DIFFERENTLY; a wrong path returns
      [] which looks exactly like "the site has no styles".
   2. get_styles returns ONLY the base breakpoint and NO pseudo states unless
      you opt in. Omitting them makes every breakpoint override look missing —
      1009 phantom "gaps" on a site that was largely correct. */
import { callTool as call } from './wfmcp.mjs';
export const SITE='6a60bdc0340e5f1784b4d553', PAGE='6a75f467c7c9e1a0c133edd1';
export const BPS=['main','small','medium','large','xl','xxl','tiny'];
export const PSEUDOS=['noPseudo','hover','active','focus'];
export async function liveStyles(context,{full=true}={}) {
  const res=await call('data_style_tool',{siteId:SITE,pageId:PAGE,context,
    actions:[{label:'all', get_styles:{query:'all', include_properties:true,
      ...(full?{include_breakpoints:BPS, include_base_pseudos:PSEUDOS}:{})}}]});
  const d=JSON.parse(res.text||JSON.stringify(res));
  const r=d.result;
  const list=r?.data?.matches||r?.matches||(Array.isArray(r)?r:null)
    ||(Array.isArray(r?.styles)?r.styles:null)||[];
  if(!list.length) throw new Error('liveStyles parsed 0 records — parse path changed, refusing to proceed');
  return list;
}
