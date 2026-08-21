import { callJson } from './instatic-mcp.mjs';
const docs = await callJson('site_list_documents', {});
const doc = (docs.documents||[]).find(d=>d.slug==='zz-probe');
const back = await callJson('site_read_document', { document: doc.document });
const uid = /uid="([^"]+)"/.exec(/<img[^>]*>/.exec(back.html)[0])[1];
const r = await callJson('site_update_node_props', { nodeId: uid, patch: { htmlAttributes: { alt: 'ALT VIA htmlAttributes' } } });
console.log('patch ->', JSON.stringify(r).slice(0,200));
const b2 = await callJson('site_read_document', { document: doc.document });
console.log('img now:', (/<img[^>]*>/.exec(b2.html)||[''])[0].replace(/\suid="[^"]*"/,''));
// video: id + poster + aria-label
const vt = /<video[^>]*>/.exec(b2.html);
if (vt) {
  const vuid = /uid="([^"]+)"/.exec(vt[0])[1];
  const r2 = await callJson('site_update_node_props', { nodeId: vuid, patch: { htmlAttributes: { id: 'pfilm', 'aria-label': 'test label' } } });
  console.log('video patch ->', JSON.stringify(r2).slice(0,200));
  const b3 = await callJson('site_read_document', { document: doc.document });
  console.log('video now:', (/<video[^>]*>/.exec(b3.html)||[''])[0].replace(/\suid="[^"]*"/,''));
}
