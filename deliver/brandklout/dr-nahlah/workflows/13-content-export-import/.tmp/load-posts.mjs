#!/usr/bin/env node
/**
 * load-posts.mjs — load the 43 extracted WordPress posts into the Instatic
 * `posts` collection, and publish them.
 *
 * Idempotent: existing slugs are skipped, so an interrupted run resumes rather
 * than duplicating. The bridge flaps, so every document is READ BACK and its
 * body compared to the local one before the post counts as loaded. A create
 * that reports an id but stores a truncated body is exactly the failure this
 * platform produces silently, and a count of 43 would hide it.
 *
 *   node load-posts.mjs [--limit N]
 */
import fs from 'node:fs';
import { callJson, callWrite } from './instatic-mcp.mjs';

const posts = JSON.parse(fs.readFileSync('posts.json', 'utf8'));
const argv = process.argv.slice(2);
const LIMIT = argv.includes('--limit') ? Number(argv[argv.indexOf('--limit') + 1]) : Infinity;

const existing = new Map();
for (let offset = 0; ; offset += 200) {
  const l = await callJson('content_list_documents', { tableId: 'posts', limit: 200, offset });
  const rows = l.documents || l.rows || [];
  rows.forEach((d) => existing.set(d.slug, d.id));
  if (rows.length < 200) break;
}
console.log(`${existing.size} posts already in the collection, ${posts.length} to reconcile`);

let made = 0, skipped = 0, fixed = 0;
const bad = [];
for (const p of posts.slice(0, LIMIT === Infinity ? posts.length : LIMIT)) {
  let id = existing.get(p.slug);
  if (!id) {
    const r = await callWrite('content_create_document', {
      tableId: 'posts',
      fields: { title: p.title, slug: p.slug, body: p.body,
                seoTitle: p.seoTitle, seoDescription: p.seoDescription },
    });
    id = r.documentId || r.id;
    if (!id) { bad.push(`${p.slug}: create returned no id`); continue; }
    made++;
  } else skipped++;

  // read back and compare, then publish
  const back = await callJson('content_get_document', { tableId: 'posts', documentId: id });
  const f = back.document?.fields || back.fields || {};
  if (String(f.body || '') !== p.body) {
    // one repair attempt: rewrite the field, then re-read
    await callWrite('content_set_document_fields', { documentId: id, fields: { body: p.body } });
    const again = await callJson('content_get_document', { tableId: 'posts', documentId: id });
    const f2 = again.document?.fields || again.fields || {};
    if (String(f2.body || '') !== p.body) {
      bad.push(`${p.slug}: body ${String(f2.body || '').length} chars vs local ${p.body.length}`);
      continue;
    }
    fixed++;
  }
  await callWrite('content_set_document_status', { documentId: id, status: 'published' });
  if ((made + skipped) % 10 === 0) console.log(`  ${made + skipped}/${posts.length}`);
}

console.log(`\ncreated ${made}, already present ${skipped}, bodies repaired ${fixed}, failed ${bad.length}`);
if (bad.length) { console.log('FAILURES:'); bad.forEach((b) => console.log('  ' + b)); process.exitCode = 1; }
