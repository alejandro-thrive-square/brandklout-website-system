import { callTool as call } from './wfmcp.mjs';
const SITE='6a60bdc0340e5f1784b4d553', PAGE='6a75f467c7c9e1a0c133edd1';
const ctx='Testing whether update_style can restore a font-family that the clipboard paste stripped.';
const w = await call('data_style_tool', { siteId:SITE, pageId:PAGE, context:ctx, actions:[
  { label:'set', update_style:{ style_name:'inv-h1', properties:[{property_name:'font-family', property_value:'Fraunces'}] } }]});
console.log('WRITE:', JSON.stringify(w.text||w).slice(0,600));
const r = await call('data_style_tool', { siteId:SITE, pageId:PAGE, context:ctx, actions:[
  { label:'read', query_styles:{ queries:[{ label:'h1', name_path:['inv-h1'], include_properties:true }] } }]});
const t = r.text||JSON.stringify(r);
console.log('READBACK font-family:', (t.match(/font-family[^,}]*/)||['(none)'])[0]);
