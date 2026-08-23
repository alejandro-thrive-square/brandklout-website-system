import { callJson } from './instatic-mcp.mjs';
const PROBE = `<section class="pk" id="probeSec" data-theme="dark"><button class="burger" id="pburger" type="button"><span></span><span></span></button><a class="btn magnetic" href="/contact"><span>Label in a span</span></a><img src="/uploads/V1ex_8TusqaQntDvRqdSX-logo.png" alt="ALT SHOULD SURVIVE" width="40" height="40" loading="lazy"><video class="ar-film" id="pfilm" muted playsinline></video><p>Count <b>54</b> here</p><iframe class="lc_probe" title="t" src="https://example.com/x" frameborder="0" scrolling="no" height="100"></iframe></section>`;
const docs = await callJson('site_list_documents', {});
let doc = (docs.documents||[]).find(d=>d.slug==='zz-probe');
if (!doc) { const a = await callJson('site_add_page',{title:'zz probe',slug:'zz-probe'}); console.log('created', JSON.stringify(a).slice(0,200));
  const docs2 = await callJson('site_list_documents', {}); doc=(docs2.documents||[]).find(d=>d.slug==='zz-probe'); }
console.log('root', doc.rootNodeId);
await callJson('site_replace_node_html', { nodeId: doc.rootNodeId, html: PROBE });
const back = await callJson('site_read_document', { document: doc.document });
const h = (back.html||'').replace(/\suid="[^"]*"/g,'');
console.log('--- READ BACK ---');
console.log(h.slice(0, 3000));
