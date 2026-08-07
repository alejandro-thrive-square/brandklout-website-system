/* .grid--3 declared only its widest value (3 columns). A combo outranks its
   base class in EVERY media query, so once the converter baked the min-width
   rule to base it kept 3 columns down to 320px — three review cards side by
   side on a phone, which is the horizontal overflow root-proof reported.
   Give the combo the same ladder .grid has. Design source fixed too, so a
   regenerated payload carries this without the patch. */
import { callTool as call } from './wfmcp.mjs';
import { liveStyles, SITE, PAGE } from './wfstyles.mjs';
const ctx='Giving the three-column grid combo its narrow-width overrides so phones show one column.';
const LADDER={ medium:'1fr 1fr', small:'1fr', tiny:'1fr' };
const list=await liveStyles('Finding every three-column grid combo that needs narrow-width overrides.');
const targets=list.filter(s=>/\.grid\.grid--3$/.test(s.selector||''));
console.log('grid--3 combos:', targets.map(t=>t.selector).join(', '));
for (const t of targets) {
  const chain=t.selector.split('.').filter(Boolean);
  for (const [bp,val] of Object.entries(LADDER)) {
    await call('data_style_tool',{siteId:SITE,pageId:PAGE,context:ctx,actions:[{label:`${t.selector}@${bp}`,
      update_style:{ style_name:chain[chain.length-1], parent_style_names:chain.slice(0,-1),
        breakpoint_id:bp, properties:[{property_name:'grid-template-columns',property_value:val}] }}]});
    await new Promise(r=>setTimeout(r,900));
  }
  console.log('  patched', t.selector);
}
const after=await liveStyles('Verifying the grid combo ladder was stored.');
for (const s of after.filter(x=>/\.grid\.grid--3$/.test(x.selector||''))) {
  const bp=Object.entries(s.properties?.breakpoints||{})
    .map(([k,v])=>k+':'+(v.properties?.['grid-template-columns']||'-')).join(' ');
  console.log(s.selector, '|', bp);
}
