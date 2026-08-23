import { callJson, callTool } from './instatic-mcp.mjs';
const docs = await callJson('site_list_documents', {});
const probe = (docs.documents||[]).find(d=>d.slug==='zz-probe');
// A. what would the PUBLISHED page emit for the patched img?
const b = await callJson('site_read_document', { document: probe.document });
const uid = /uid="([^"]+)"/.exec(/<img[^>]*>/.exec(b.html)[0])[1];
const emitted = await callTool('site_get_node_html', { nodeId: uid });
console.log('EMITTED IMG:', (emitted.text||'').slice(0,400));
// C. modules that can carry raw html / embeds
const mods = await callJson('site_list_modules', {});
const arr = mods.modules||mods;
console.log('MODULE IDS:', arr.map(m=>m.id).join(' '));
