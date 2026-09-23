#!/usr/bin/env node
/**
 * restore-alt.mjs — put the alt text back on every Instatic image.
 *
 * Instatic maps <img> onto its `base.image` module, whose prop schema has no
 * `alt` at all; the importer therefore drops whatever alt came in and the
 * module template emits a hardcoded alt="". Every one of the ~370 images on the
 * site shipped with an empty alt, which is a straight accessibility and SEO
 * regression against the local package where each one is written by hand.
 *
 * The only route back in is the module's `htmlAttributes` bag. That does work,
 * with one cosmetic wart: the emitted tag carries alt twice —
 *   <img alt="the real text" src="..." alt="">
 * The HTML parsing spec keeps the FIRST occurrence of a duplicated attribute
 * and ignores later ones, so browsers and crawlers read the real text. It is
 * ugly in view-source and it is the only thing this platform offers.
 *
 *   node restore-alt.mjs            # every page
 *   node restore-alt.mjs index      # one page
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { callJson } from './instatic-mcp.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '../../04-design/.tmp/final-site');

/** alt texts of every <img> in the built page body, in document order. */
function localAlts(slug) {
  const file = path.join(SITE, (slug === 'index' ? 'index' : slug) + '.html');
  let s = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const o = s.indexOf('<body>'), c = s.lastIndexOf('</body>');
  s = s.slice(o + 6, c);
  return [...s.matchAll(/<img\b[^>]*>/g)].map((m) => {
    const a = /\balt="([^"]*)"/.exec(m[0]);
    return a ? a[1].replace(/&amp;/g, '&').replace(/&rsquo;/g, '\u2019').replace(/&mdash;/g, '\u2014') : '';
  });
}

const only = process.argv[2];
const docs = await callJson('site_list_documents', {});
const pages = (docs.documents || []).filter((d) => !only || d.slug === only);

let patched = 0, skipped = 0, mismatch = [];
for (const d of pages) {
  const slug = d.slug;
  if (!fs.existsSync(path.join(SITE, slug + '.html'))) { console.log(`  ${slug}: no local page, skipped`); continue; }
  let html = '', part = 1;
  for (;;) {
    const r = await callJson('site_read_document', { document: d.document, part });
    if (r.document?.id !== d.document.id) throw new Error(`read drifted to ${r.document?.id}`);
    html += r.html || '';
    const nx = r.pageInfo?.nextPart;
    if (!nx) break;
    part = nx;
  }
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => ({
    uid: (/uid="([^"]+)"/.exec(m[0]) || [])[1],
    has: (/\balt="([^"]*)"/.exec(m[0]) || [, ''])[1],
  }));
  const alts = localAlts(slug);
  if (imgs.length !== alts.length) {
    mismatch.push(`${slug}: instatic ${imgs.length} imgs vs local ${alts.length}`);
    console.log(`  ${slug}: COUNT MISMATCH ${imgs.length} vs ${alts.length} — skipped`);
    continue;
  }
  let n = 0;
  for (const [i, img] of imgs.entries()) {
    const want = alts[i];
    if (!want || !img.uid) { skipped++; continue; }
    if (img.has === want) { skipped++; continue; }
    await callJson('site_update_node_props', { nodeId: img.uid, patch: { htmlAttributes: { alt: want } } });
    n++; patched++;
  }
  console.log(`  ${slug.padEnd(28)} ${n}/${imgs.length} alts written`);
}
console.log(`\npatched ${patched}, already-correct/empty ${skipped}`);
if (mismatch.length) { console.log('MISMATCHES:'); mismatch.forEach((m) => console.log('  ' + m)); }
