import fs from 'node:fs';
import { callTool, callJson } from './instatic-mcp.mjs';
const out = process.argv[2] || 'snap';
const docs = await callJson('site_list_documents', {});
const home = (docs.documents||[]).find(d=>d.isHomepage||d.slug==='index');
await callJson('site_open_document', { document: home.document });
for (let i = 0; i < 25; i++) {
  await new Promise(r=>setTimeout(r, 4000));
  const { raw, text } = await callTool('site_render_snapshot', {});
  const img = (raw.content||[]).find(c=>c.type==='image');
  if (img) { fs.writeFileSync(out+'.png', Buffer.from(img.data,'base64'));
             fs.writeFileSync(out+'.json', text||''); console.log('captured on try', i+1); process.exit(0); }
  if (i % 5 === 0) console.log(`  try ${i+1}: ${(text||'').slice(0,60)}`);
}
console.log('render bridge never came up'); process.exit(1);
