import { callJson } from './instatic-mcp.mjs';
const docs = await callJson('site_list_documents', {});
const doc = (docs.documents||[]).find(d=>d.slug==='zz-probe');
const back = await callJson('site_read_document', { document: doc.document });
const h = back.html||'';
const img = /<img[^>]*uid="([^"]+)"[^>]*>/.exec(h) || /<img[^>]*>/.exec(h);
console.log('img tag:', img && img[0]);
const uid = /uid="([^"]+)"/.exec(img[0])[1];
for (const patch of [{alt:'ALT VIA PROPS'},{altText:'ALT VIA PROPS'}]) {
  try { const r = await callJson('site_update_node_props', { nodeId: uid, patch });
        console.log('patch', JSON.stringify(patch), '->', JSON.stringify(r).slice(0,300)); }
  catch(e){ console.log('patch', JSON.stringify(patch), 'ERR', e.message.slice(0,200)); }
}
const back2 = await callJson('site_read_document', { document: doc.document });
console.log('after:', (/<img[^>]*>/.exec(back2.html)||[''])[0].replace(/\suid="[^"]*"/,''));
