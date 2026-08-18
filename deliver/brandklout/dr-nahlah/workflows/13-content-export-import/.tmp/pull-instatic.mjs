#!/usr/bin/env node
/**
 * pull-instatic.mjs — snapshot every editable page on the Instatic site.
 *
 * Writes `.instatic/<slug>.json` = { title, html, css } with all `part`s of the
 * paginated read joined back together.
 *
 * TRAP THIS GUARDS: `site_read_document`'s `document` argument is NOT marked
 * required. Call it with a misspelled argument and it does not error — it
 * returns whatever page the editor currently has open, so 26 reads can all
 * succeed and all be the same document. The run therefore hashes each body and
 * refuses to finish unless it collected N distinct pages.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { callTool } from './instatic-mcp.mjs';

const OUT = path.join(import.meta.dirname, '.instatic');
fs.mkdirSync(OUT, { recursive: true });

const j = (t) => JSON.parse(t);

const docs = j((await callTool('site_list_documents', {})).text).documents;
console.log(`${docs.length} documents`);

const seen = new Map();
for (const d of docs) {
  const id = d.document.id;
  let html = '', css = '', part = 1, title = d.title, guard = 0;
  for (;;) {
    const res = j((await callTool('site_read_document', { document: { type: 'page', id }, part })).text);
    if (res.document?.id !== id) throw new Error(`read returned ${res.document?.id} for ${id} — wrong document`);
    html += res.html || '';
    if (res.css) css += res.css;
    title = res.title || title;
    const nx = res.pageInfo?.nextPart;
    if (!nx || ++guard > 20) break;
    part = nx;
  }
  const hash = crypto.createHash('sha1').update(html).digest('hex');
  if (seen.has(hash)) throw new Error(`${d.slug} is byte-identical to ${seen.get(hash)} — the read is returning the active document`);
  seen.set(hash, d.slug);
  fs.writeFileSync(path.join(OUT, `${d.slug}.json`),
    JSON.stringify({ slug: d.slug, id, rootNodeId: d.rootNodeId, title, html, css }, null, 1));
  console.log(`  ${d.slug.padEnd(28)} html=${html.length} css=${css.length}`);
}
console.log(`\n${seen.size} distinct pages written -> ${path.relative(process.cwd(), OUT)}`);
