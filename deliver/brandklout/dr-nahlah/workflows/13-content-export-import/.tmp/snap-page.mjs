import fs from 'node:fs';
import { callTool, callJson } from './instatic-mcp.mjs';
const slug = process.argv[2], out = process.argv[3] || ('snap-' + slug);
const docs = await callJson('site_list_documents', {});
const d = (docs.documents || []).find((x) => x.slug === slug);
if (!d) { console.error('no page', slug); process.exit(1); }
await callJson('site_open_document', { document: d.document });
for (let i = 0; i < 20; i++) {
  await new Promise((r) => setTimeout(r, 3500));
  const { raw, text } = await callTool('site_render_snapshot', {});
  const img = (raw.content || []).find((c) => c.type === 'image');
  if (img) {
    fs.writeFileSync(out + '.png', Buffer.from(img.data, 'base64'));
    fs.writeFileSync(out + '.json', text || '');
    console.log('captured on try', i + 1);
    process.exit(0);
  }
  if (i % 4 === 0) console.log(`  try ${i + 1}: ${(text || '').slice(0, 70)}`);
}
console.log('render bridge never came up');
process.exit(1);
