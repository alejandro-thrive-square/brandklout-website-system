#!/usr/bin/env node
/**
 * extract-v1-sections.mjs — pull the full copy and asset ids of the four v1
 * sections being carried into the v2 pages.
 *
 * The outline view truncates text; this dumps it whole, plus every Image
 * element's bound assetId, so the new sections reuse the same photographs
 * rather than approximations of them.
 *
 *   node extract-v1-sections.mjs <pageId> [sectionClassFragment …]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { call, SITES } from './wf.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [pageId, ...want] = process.argv.slice(2);
const FRAGMENTS = want.length ? want : ['gallery', 'space', 'journey', 'faq'];
const o = { site: SITES.arvada, page: pageId };

const tree = call('data_element_tool', [{ label: 'e', get_all_elements: {} }], o);
const root = tree?.result?.[0]?.data;
if (!root) { console.log(JSON.stringify(tree).slice(0, 400)); process.exit(1); }

/** Collect the sections we care about. */
const sections = [];
(function walk(n) {
  const cls = (n.styleNames || []).join(' ');
  if (/^Section|Block$/.test(n.type) && FRAGMENTS.some((f) => cls.toLowerCase().includes(f))) sections.push({ cls, node: n });
  for (const c of n.children || []) walk(c);
})(root);

const images = [];
function dump(n, depth, out) {
  if (n.type === 'String') { const t = (n.textContent || '').trim(); if (t) out.push('  '.repeat(depth) + t); return; }
  if (n.type === 'Image') { images.push(n.id); out.push('  '.repeat(depth) + '[IMAGE ' + (n.styleNames || []).join('.') + ']'); }
  if (n.type === 'HtmlEmbed') out.push('  '.repeat(depth) + '[HTML EMBED — cannot be carried over]');
  for (const c of n.children || []) dump(c, depth + 1, out);
}

const report = [];
for (const s of sections) {
  report.push(`\n===== ${s.cls} =====`);
  const out = [];
  dump(s.node, 0, out);
  report.push(out.join('\n'));
}

// The images are the point: resolve each one's asset so the v2 sections can
// bind the same files.
report.push('\n===== IMAGE ASSETS =====');
for (const id of images) {
  const r = call('data_element_settings_tool', [{ label: 's', get_settings: { type: 'all_raw_settings', element_id: id } }], o);
  const kv = Object.fromEntries((r?.result?.[0]?.data?.matches || []).map((m) => [m.key, m.value]));
  report.push(`${kv.assetId || 'UNBOUND'}   alt=${JSON.stringify(kv.altText || '')}`);
}

const text = report.join('\n');
fs.writeFileSync(path.join(HERE, `v1-sections-${pageId}.txt`), text);
console.log(text.length > 9000 ? text.slice(0, 9000) + '\n…[truncated, full text in the file]' : text);
