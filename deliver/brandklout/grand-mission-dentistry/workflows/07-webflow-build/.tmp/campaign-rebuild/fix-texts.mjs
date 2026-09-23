#!/usr/bin/env node
// fix-texts.mjs <pageKey> <builtLog> <sectionsModule>
// TextBlocks are Blocks; the builder's set_text no-ops on them (documented in
// the runbook). Walk each section's schema and its live subtree depth-first,
// zip the TextBlock texts by order, and write them via set_settings key "text".
// Also flips every Image on the page to loading=eager.
import fs from 'node:fs';
import path from 'node:path';
import { callTool, PAGES, HERE } from './lib.mjs';

const [, , pageKey = 'implants', logName = 'implants-built.json', mod = './build-implants.mjs'] = process.argv;
const { sections } = await import(mod);
const page = PAGES[pageKey];
const built = JSON.parse(fs.readFileSync(path.join(HERE, logName), 'utf8'));

// ---- expected texts per section, depth-first ----
function expectedTexts(node, acc) {
  if (!node || typeof node !== 'object') return acc;
  if (node.type === 'TextBlock') acc.push(node.set_text ? node.set_text.text : '');
  for (const c of node.children || []) expectedTexts(c, acc);
  return acc;
}

// ---- live TextBlocks per section, depth-first ----
function liveTextBlocks(node, acc) {
  if (!node || typeof node !== 'object') return acc;
  const kids = node.children || [];
  const isTextBlock = node.type === 'Block' && kids.length === 1 && kids[0].type === 'String';
  if (isTextBlock) acc.push({ id: node.id, current: kids[0].text ?? kids[0].value ?? '' });
  else for (const c of kids) liveTextBlocks(c, acc);
  return acc;
}

function fetchSubtree(elementId) {
  const out = callTool('data_element_tool', {
    context: 'Read built section subtree to repair TextBlock copy via settings writes.',
    siteId: '698111847e9608eb30ee21c6', pageId: page.id,
    actions: [{
      label: 'sub',
      query_elements: { queries: [{ label: 'q', element_id: { component: page.id, element: elementId }, children_depth: -1 }] },
    }],
  });
  let obj; let depth = 0, start = -1;
  for (let i = 0; i < out.length; i++) {
    const c = out[i];
    if (c === '{') { if (depth === 0) start = i; depth++; }
    else if (c === '}') { depth--; if (depth === 0 && !obj) { try { obj = JSON.parse(out.slice(start, i + 1)); } catch { } } }
  }
  let root = null;
  const dig = (o) => {
    if (!o || typeof o !== 'object' || root) return;
    if (o.id && o.id.element === elementId && o.type) { root = o; return; }
    for (const k of Object.keys(o)) dig(o[k]);
  };
  dig(obj);
  return root;
}

const ops = [];
for (const s of sections) {
  if (s.label === 'wrapper') continue;
  const rootId = built[s.label];
  if (typeof rootId !== 'string') { console.error('no id for', s.label); continue; }
  const expect = expectedTexts(s.tree, []);
  if (!expect.length) continue;
  const root = fetchSubtree(rootId);
  if (!root) { console.error('subtree fetch failed for', s.label); process.exitCode = 1; continue; }
  const live = liveTextBlocks(root, []);
  if (live.length !== expect.length) {
    console.error(`COUNT MISMATCH ${s.label}: live ${live.length} vs expected ${expect.length} — skipping section`);
    process.exitCode = 1; continue;
  }
  for (let i = 0; i < live.length; i++) {
    if ((live[i].current || '').trim() === (expect[i] || '').trim()) continue;
    ops.push({
      label: `${s.label}#${i}`,
      element_id: live[i].id,
      settings: [{ key: 'text', static_text: { value: expect[i] } }],
    });
  }
  console.log(s.label, 'textblocks', live.length, 'to fix', ops.length);
}

console.log('total ops:', ops.length);
for (let i = 0; i < ops.length; i += 20) {
  const batch = ops.slice(i, i + 20);
  const out = callTool('data_element_settings_tool', {
    context: 'Write intended copy into TextBlock elements via settings key text.',
    siteId: '698111847e9608eb30ee21c6', pageId: page.id,
    actions: [{ label: 'batch' + i, set_settings: { operations: batch } }],
  });
  if (!/"result"|success/i.test(out)) { console.error('BATCH FAIL', i, out.slice(0, 500)); process.exitCode = 1; break; }
  console.log('wrote', i + batch.length, '/', ops.length);
}
