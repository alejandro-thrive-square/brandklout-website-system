#!/usr/bin/env node
/**
 * outline.mjs — print a Webflow page's element tree as a compact indented outline
 * (tag/type + classes + a snip of text), instead of the many-MB JSON the API returns.
 *
 *   node outline.mjs <siteKey|siteId> <pageId> [--depth N] [--out file]
 */
import fs from 'node:fs';
import { call, SITES } from './wf.mjs';

const [siteArg, pageId, ...rest] = process.argv.slice(2);
const flags = {};
for (let i = 0; i < rest.length; i++) if (rest[i].startsWith('--')) flags[rest[i].slice(2)] = rest[i + 1];
const maxDepth = Number(flags.depth || 99);

const res = call('data_element_tool', [{ label: 'e', get_all_elements: {} }],
  { site: SITES[siteArg] || siteArg, page: pageId });

const root = res?.result?.[0]?.data;
if (!root) { console.log(JSON.stringify(res).slice(0, 1500)); process.exit(1); }

const lines = [];
const classCount = new Map();

function walk(node, depth) {
  if (depth > maxDepth) return;
  const cls = node.styleNames || [];
  for (const c of cls) classCount.set(c, (classCount.get(c) || 0) + 1);

  if (node.type === 'String') {
    const t = (node.textContent || '').trim();
    if (t) lines.push('  '.repeat(depth) + '"' + (t.length > 70 ? t.slice(0, 70) + '…' : t) + '"');
  } else {
    const tag = node.settings?.tag ? `<${node.settings.tag}>` : '';
    lines.push('  '.repeat(depth) + node.type + tag + (cls.length ? ' .' + cls.join('.') : ''));
  }
  for (const c of node.children || []) walk(c, depth + 1);
}
walk(root, 0);

const out = [
  lines.join('\n'),
  '',
  `=== ${classCount.size} distinct classes ===`,
  [...classCount.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    .map(([n, c]) => `${n} (${c})`).join('\n'),
].join('\n');

if (flags.out) { fs.writeFileSync(flags.out, out); console.log(`${flags.out}: ${out.length} bytes, ${lines.length} nodes`); }
else console.log(out);
