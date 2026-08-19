#!/usr/bin/env node
// Open an Instatic page by slug and save its canvas snapshot (PNG + geometry JSON).
// usage: node snap.mjs <slug> [outPrefix] [breakpointId] [nodeId]
import fs from 'node:fs';
import { callTool, callJson } from './instatic-mcp.mjs';

const slug = process.argv[2];
const out = process.argv[3] || `snap-${slug}`;
const bp = process.argv[4] || null;
const nodeId = process.argv[5] || null;

const docs = await callJson('site_list_documents', {});
const list = docs.documents || docs;
const hit = list.find((d) => d.slug === slug || (slug === 'index' && d.isHomepage));
if (!hit) { console.error('no page', slug); process.exit(1); }
console.log('page', hit.slug, hit.document.id, 'root', hit.rootNodeId);

await callJson('site_open_document', { document: hit.document });
await new Promise((r) => setTimeout(r, 2500));

const args = {};
if (bp) args.breakpointId = bp;
if (nodeId) args.nodeId = nodeId;
const { raw, text } = await callTool('site_render_snapshot', args);
let n = 0;
for (const c of raw.content || []) {
  if (c.type === 'image' && c.data) {
    const f = `${out}${n ? '-' + n : ''}.png`;
    fs.writeFileSync(f, Buffer.from(c.data, 'base64'));
    console.log('wrote', f, Buffer.from(c.data, 'base64').length, 'bytes');
    n++;
  }
}
fs.writeFileSync(`${out}.json`, text || '');
console.log('geometry chars', (text || '').length);
