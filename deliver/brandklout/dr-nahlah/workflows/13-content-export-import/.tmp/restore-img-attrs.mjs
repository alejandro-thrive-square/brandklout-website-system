#!/usr/bin/env node
/**
 * restore-img-attrs.mjs — put the FULL attribute set back on every Instatic image.
 *
 * Supersedes restore-alt.mjs. `site_update_node_props` shallow-merges the patch
 * onto props, which means the `htmlAttributes` VALUE is replaced wholesale, not
 * merged key by key. Patching `{htmlAttributes:{alt}}` therefore restored the
 * alt and silently deleted `data-drift` from ~60 images — the hook the parallax
 * drift is wired to. The attribute bag has to be written complete, every time.
 *
 * Source of truth is the local built page: every attribute except the ones the
 * base.image module owns itself (src, class, loading, decoding) is copied over.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { callJson, callWrite } from './instatic-mcp.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '../../04-design/.tmp/final-site');
const MODULE_OWNS = new Set(['src', 'class', 'loading', 'decoding', 'fetchpriority', 'srcset', 'sizes']);
const ENT = (s) => s.replace(/&amp;/g, '&').replace(/&rsquo;/g, '\u2019').replace(/&lsquo;/g, '\u2018')
  .replace(/&mdash;/g, '\u2014').replace(/&ndash;/g, '\u2013').replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&nbsp;/g, '\u00a0').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

/** [{attrs:{…}}] for every <img> in the built page body, in document order. */
function localImgs(slug) {
  let s = fs.readFileSync(path.join(SITE, slug + '.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  s = s.slice(s.indexOf('<body>') + 6, s.lastIndexOf('</body>'));
  return [...s.matchAll(/<img\b[^>]*>/g)].map((m) => {
    const attrs = {};
    for (const a of m[0].matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*"([^"]*)")?/g)) {
      const k = a[1].toLowerCase();
      if (k === 'img' || MODULE_OWNS.has(k)) continue;
      attrs[a[1]] = a[2] === undefined ? '' : ENT(a[2]);
    }
    return attrs;
  });
}

const only = process.argv[2];
const docs = await callJson('site_list_documents', {});
const pages = (docs.documents || []).filter((d) => !only || d.slug === only);

let patched = 0, same = 0;
for (const d of pages) {
  const slug = d.slug;
  if (!fs.existsSync(path.join(SITE, slug + '.html'))) { console.log(`  ${slug}: no local page`); continue; }
  let html = '', part = 1;
  for (;;) {
    const r = await callJson('site_read_document', { document: d.document, part });
    html += r.html || '';
    const nx = r.pageInfo?.nextPart;
    if (!nx) break;
    part = nx;
  }
  const uids = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => ({
    uid: (/uid="([^"]+)"/.exec(m[0]) || [])[1],
    tag: m[0],
  }));
  const want = localImgs(slug);
  if (uids.length !== want.length) { console.log(`  ${slug}: COUNT MISMATCH ${uids.length} vs ${want.length}`); continue; }
  let n = 0;
  for (const [i, img] of uids.entries()) {
    const attrs = want[i];
    if (!img.uid) continue;
    // already correct? every wanted key present with the wanted value, first-wins
    const ok = Object.entries(attrs).every(([k, v]) => {
      const re = new RegExp(`\b${k.replace(/[-:.]/g, '\$&')}="([^"]*)"`);
      const m = re.exec(img.tag);
      return m && m[1] === v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;') || (m && m[1] === v);
    });
    if (ok) { same++; continue; }
    await callWrite('site_update_node_props', { nodeId: img.uid, patch: { htmlAttributes: attrs } });
    n++; patched++;
  }
  console.log(`  ${slug.padEnd(28)} ${n}/${uids.length} images rewritten`);
}
console.log(`\nrewritten ${patched}, already correct ${same}`);
