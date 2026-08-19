#!/usr/bin/env node
/**
 * push-all.mjs — push every built local page into the Instatic DRAFT, then
 * verify each one landed whole.
 *
 * Nothing here publishes. `site_replace_node_html` / `site_insert_html` save a
 * draft; the public site only changes on site_publish, which is deliberately
 * not called from this script.
 *
 * VERIFICATION IS THE POINT
 * -------------------------
 * The failure mode on this bridge is not an error, it is a silent partial
 * write: a payload gets dropped and the page is left short, looking fine in a
 * log full of successes. So after every page this reads the document back and
 * compares three counts against the source (elements with a class, <img>, and
 * <section>). A page that does not match is reported and listed in
 * push-report.json rather than being quietly counted as done.
 *
 *   node push-all.mjs                 # every page
 *   node push-all.mjs veneers about   # just these slugs
 *   node push-all.mjs --skip thank-you
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { callJson, callWrite } from './instatic-mcp.mjs';
import { transform, SITE } from './to-instatic.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const skip = new Set();
const only = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--skip') skip.add(argv[++i]);
  else if (!argv[i].startsWith('--')) only.push(argv[i]);
}

const files = fs.readdirSync(SITE).filter((f) => f.endsWith('.html')).sort();
const targets = files.filter((f) => {
  const slug = f === 'index.html' ? 'index' : path.basename(f, '.html');
  if (skip.has(slug)) return false;
  return !only.length || only.includes(slug);
});

const VOID = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'area', 'col', 'embed', 'track', 'wbr']);
function topLevelBlocks(html) {
  const blocks = [];
  let depth = 0, start = -1;
  const tag = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g;
  let m;
  while ((m = tag.exec(html))) {
    const [whole, close, name, attrs] = m;
    if (VOID.has(name.toLowerCase()) || attrs.trimEnd().endsWith('/')) continue;
    if (!close) { if (depth === 0) start = m.index; depth++; }
    else {
      depth--;
      if (depth === 0 && start > -1) { blocks.push(html.slice(start, m.index + whole.length)); start = -1; }
    }
  }
  return blocks.filter((b) => b.trim());
}

const count = (s, re) => (s.match(re) || []).length;
const shape = (s) => ({
  cls: count(s, /\sclass="/g),
  img: count(s, /<img\b/g),
  sec: count(s, /<section\b/g),
});

async function readWhole(document) {
  let html = '', part = 1;
  for (;;) {
    const r = await callJson('site_read_document', { document, part });
    html += r.html ?? '';
    const next = r.pageInfo?.nextPart;
    if (!next) return html;
    part = next;
  }
}

const report = [];
for (const file of targets) {
  const slug = file === 'index.html' ? 'index' : path.basename(file, '.html');
  let entry = { slug, ok: false };
  try {
    const { html, unmapped } = transform(file);
    if (unmapped.length) throw new Error(`unmapped media: ${unmapped.join(', ')}`);
    const blocks = topLevelBlocks(html);
    const covered = blocks.join('').length;
    if (covered / html.length < 0.95) throw new Error(`block split covers only ${(100 * covered / html.length).toFixed(1)}%`);

    let docs = await callJson('site_list_documents', {});
    let doc = (docs.documents || []).find((d) => d.slug === slug);
    if (!doc) {
      // Create it rather than refusing. Five pages were added to the local
      // package on 2026-08-19 (four per-entity legal documents and the video
      // library) and "create it first" just meant every run skipped them.
      const raw = fs.readFileSync(path.resolve(SITE, file), 'utf8');
      const title = (/<title>([^<]+)<\/title>/.exec(raw) || [, slug])[1].trim();
      await callWrite('site_add_page', { title, slug });
      docs = await callJson('site_list_documents', {});
      doc = (docs.documents || []).find((d) => d.slug === slug);
      if (!doc) throw new Error('page still absent after site_add_page');
      process.stdout.write('(created) ');
    }

    process.stdout.write(`${slug}: ${blocks.length} blocks, ${html.length} chars … `);
    await callWrite('site_replace_node_html', { nodeId: doc.rootNodeId, html: blocks[0] });
    for (let i = 1; i < blocks.length; i++) {
      await callWrite('site_insert_html', { parentId: doc.rootNodeId, html: blocks[i], index: i });
    }

    const back = await readWhole(doc.document);
    const want = shape(html), got = shape(back);
    entry = { slug, ok: false, want, got };
    // The reader adds uid="" to every node, so class counts match but never
    // undercount; images and sections must match exactly.
    if (got.img !== want.img || got.sec !== want.sec || got.cls < want.cls) {
      throw new Error(`shape mismatch want ${JSON.stringify(want)} got ${JSON.stringify(got)}`);
    }
    entry.ok = true;
    console.log(`OK  img=${got.img} sec=${got.sec} cls=${got.cls}`);
  } catch (e) {
    entry.error = e.message;
    console.log(`FAIL ${e.message}`);
  }
  report.push(entry);
  fs.writeFileSync(path.join(HERE, 'push-report.json'), JSON.stringify(report, null, 1));
}

const bad = report.filter((r) => !r.ok);
console.log(`\n${report.length - bad.length}/${report.length} pages pushed and verified`);
if (bad.length) { console.log('FAILED:'); for (const b of bad) console.log(`   ${b.slug}: ${b.error}`); }
console.log('Draft only. Nothing published.');
