#!/usr/bin/env node
// jq.mjs <file> <mode> — tiny extractor for wfmcp outputs.
// Recursively finds arrays under a given key and prints selected fields.
import fs from 'node:fs';
const [, , file, mode] = process.argv;
const raw = fs.readFileSync(file, 'utf8');
let root;
try { root = JSON.parse(raw); } catch { const i = raw.indexOf('{'); root = JSON.parse(raw.slice(i)); }
const found = [];
function dig(o, key) {
  if (!o) return;
  if (typeof o === 'string') {
    if (o.includes('"' + key + '"')) { try { dig(JSON.parse(o), key); } catch { } }
    return;
  }
  if (typeof o !== 'object') return;
  if (Array.isArray(o[key])) found.push(...o[key]);
  for (const k of Object.keys(o)) dig(o[k], key);
}
if (mode === 'pages') {
  dig(root, 'pages');
  const seen = new Set();
  for (const p of found) { if (seen.has(p.id)) continue; seen.add(p.id); console.log([p.id, p.slug, p.title, p.parentId || ''].join(' | ')); }
} else if (mode === 'styles') {
  dig(root, 'styles');
  const seen = new Set();
  for (const s of found) { const n = s.name ?? s.styleName ?? JSON.stringify(s).slice(0, 80); if (seen.has(n)) continue; seen.add(n); console.log(n); }
} else if (mode === 'raw') {
  console.log(JSON.stringify(root, null, 1).slice(0, 6000));
} else {
  // generic: mode is the key of the array to extract; print each item as one JSON line
  dig(root, mode);
  for (const x of found) console.log(JSON.stringify(x));
}
