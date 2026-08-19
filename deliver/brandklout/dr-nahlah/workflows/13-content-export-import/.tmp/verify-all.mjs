/**
 * verify-all.mjs — read every Instatic page back and compare its shape to the
 * local build. Push scripts verify as they go, but a run that partially fails
 * leaves a mixed state, and reading a report file that is still being written
 * gives a partial answer: on 2026-08-19 that showed 6 failures out of 14.
 * This asks the server, once, for all of them.
 */
import fs from 'node:fs';
import path from 'node:path';
import { callJson } from './instatic-mcp.mjs';
import { transform, SITE } from './to-instatic.mjs';

const shape = (h) => ({
  img: (h.match(/<img\b/g) || []).length,
  sec: (h.match(/<section\b/g) || []).length,
  cls: (h.match(/class="/g) || []).length,
});

const docs = await callJson('site_list_documents', {});
const bySlug = new Map((docs.documents || []).map((d) => [d.slug, d]));
const files = fs.readdirSync(SITE).filter((f) => f.endsWith('.html')).sort();

let ok = 0; const bad = [];
for (const f of files) {
  const slug = f === 'index.html' ? 'index' : path.basename(f, '.html');
  const doc = bySlug.get(slug);
  if (!doc) { bad.push(`${slug}: ABSENT on Instatic`); continue; }
  const want = shape(transform(f).html);
  let html = '', part = 1;
  for (;;) {
    const r = await callJson('site_read_document', { document: doc.document, part });
    html += r.html || '';
    const n = r.pageInfo?.nextPart; if (!n) break; part = n;
  }
  const got = shape(html);
  if (got.img !== want.img || got.sec !== want.sec || got.cls < want.cls) {
    bad.push(`${slug}: want ${JSON.stringify(want)} got ${JSON.stringify(got)}`);
  } else { ok++; process.stdout.write('.'); }
}
console.log(`\n\n${ok}/${files.length} pages match the local build`);
if (bad.length) { console.log('MISMATCHED:'); bad.forEach((b) => console.log('  ' + b)); process.exitCode = 1; }
