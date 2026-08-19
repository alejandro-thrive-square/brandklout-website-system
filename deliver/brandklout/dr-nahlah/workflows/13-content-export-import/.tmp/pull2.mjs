#!/usr/bin/env node
// Resilient re-pull of every Instatic page into .instatic2/ (bridge flaps; retry).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { callTool } from './instatic-mcp.mjs';

const OUT = path.join(import.meta.dirname, '.instatic2');
fs.mkdirSync(OUT, { recursive: true });
const BRIDGE = /runs in the Instatic Site editor/i;

async function call(name, args, tries = 10) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const { text } = await callTool(name, args);
      if (BRIDGE.test(text)) { last = new Error('bridge'); }
      else return JSON.parse(text);
    } catch (e) { last = e; }
    await new Promise((r) => setTimeout(r, 1500 + i * 700));
  }
  throw last;
}

const docs = (await call('site_list_documents', {})).documents;
console.log(`${docs.length} documents`);
const seen = new Map();
for (const d of docs) {
  const id = d.document.id;
  const f = path.join(OUT, `${d.slug}.json`);
  if (fs.existsSync(f) && !process.env.FORCE) { console.log(`  ${d.slug} (cached)`); continue; }
  let html = '', css = '', part = 1, title = d.title, guard = 0;
  for (;;) {
    const res = await call('site_read_document', { document: { type: 'page', id }, part });
    if (res.document?.id !== id) throw new Error(`read returned ${res.document?.id} for ${id}`);
    html += res.html || '';
    if (res.css) css += res.css;
    title = res.title || title;
    const nx = res.pageInfo?.nextPart;
    if (!nx || ++guard > 30) break;
    part = nx;
  }
  const hash = crypto.createHash('sha1').update(html).digest('hex');
  if (seen.has(hash)) throw new Error(`${d.slug} identical to ${seen.get(hash)}`);
  seen.set(hash, d.slug);
  fs.writeFileSync(f, JSON.stringify({ slug: d.slug, id, rootNodeId: d.rootNodeId, title, html, css }, null, 1));
  console.log(`  ${d.slug.padEnd(28)} html=${html.length} css=${css.length}`);
}
console.log('done');
