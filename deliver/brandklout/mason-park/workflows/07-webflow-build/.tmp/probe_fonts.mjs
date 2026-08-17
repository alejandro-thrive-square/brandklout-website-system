import { callTool as call } from './wfmcp.mjs';
const SITE='6a60bdc0340e5f1784b4d553', PAGE='6a75f467c7c9e1a0c133edd1';
const r = await call('data_style_tool', {
  siteId: SITE, pageId: PAGE, context: 'Probe live style records for stripped font-family after the clipboard paste.',
  actions: [{ label:'q', query_styles: { queries: [
    { label:'h1',  name_path:['inv-h1'],  include_properties:true },
    { label:'arr', name_path:['arr-in'],  include_properties:true },
    { label:'lead',name_path:['lead'],    include_properties:true, limit:5 },
  ]}}],
});
console.log(JSON.stringify(r).slice(0, 4000));
