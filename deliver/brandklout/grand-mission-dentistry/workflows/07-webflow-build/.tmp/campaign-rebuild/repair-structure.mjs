#!/usr/bin/env node
// repair-structure.mjs — re-apply class lists that set_style dropped when two
// unrelated globals were stacked. Targets are addressed by position under each
// section root recorded in implants-built.json.
import fs from 'node:fs';
import path from 'node:path';
import { callTool, PAGES, HERE } from './lib.mjs';

const pageKey = process.argv[2] || 'implants';
const logName = process.argv[3] || 'implants-built.json';
const page = PAGES[pageKey];
const built = JSON.parse(fs.readFileSync(path.join(HERE, logName), 'utf8'));

function fetchSubtree(elementId) {
  const out = callTool('data_element_tool', {
    context: 'Read section subtree to reapply class lists dropped by stacked-global set_style.',
    siteId: '698111847e9608eb30ee21c6', pageId: page.id,
    actions: [{ label: 'sub', query_elements: { queries: [{ label: 'q', element_id: { component: page.id, element: elementId }, children_depth: -1 }] } }],
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

// path: array of child indexes from the section root; styles to apply
const FIXES = {
  announce: [ { path: [0], styles: ['campaign-announce_inner'] }, { path: [0, 0], styles: ['campaign-announce_lead'] } ],
  header: [ { path: [0], styles: ['campaign-header_inner'] }, { path: [0, 1, 2, 0], styles: ['campaign-button', 'is-white', 'is-small'] } ],
  hero: [ { path: [1], styles: ['campaign-hero_grid'] } ],
  proof: [ { path: [0], styles: ['campaign-proof_grid'] } ],
  offer: [ { path: [0], styles: ['campaign-split', 'is-offer'] } ],
  story: [ { path: [0], styles: ['campaign-split'] } ],
  result: [ { path: [0], styles: ['campaign-split', 'is-result'] } ],
  provider: [ { path: [0], styles: ['campaign-split', 'is-provider'] } ],
  video: [ { path: [0], styles: ['campaign-split', 'is-video'] } ],
  faq: [ { path: [0], styles: ['campaign-split', 'is-faq'] } ],
  cta: [ { path: [0], styles: ['campaign-cta_inner'] } ],
  footer: [
    { path: [0], styles: ['campaign-footer_grid'] },
    { path: [1], styles: ['campaign-footer_bottom'] },
    { path: [0, 3, 1], styles: ['campaign-button', 'is-white', 'is-small'] },
  ],
};

const actions = [];
for (const [label, fixes] of Object.entries(FIXES)) {
  const rootId = built[label];
  if (typeof rootId !== 'string') { console.error('no root id for', label); continue; }
  const root = fetchSubtree(rootId);
  if (!root) { console.error('subtree failed', label); process.exitCode = 1; continue; }
  for (const f of fixes) {
    let node = root;
    for (const idx of f.path) {
      const kids = node.children || [];
      node = kids[idx];
      if (!node) break;
    }
    if (!node) { console.error('path miss', label, JSON.stringify(f.path)); process.exitCode = 1; continue; }
    actions.push({ label: label + ':' + f.path.join('.'), set_style: { id: { component: page.id, element: node.id.element }, style_names: f.styles } });
    console.log('will set', label, f.path.join('.'), '→', f.styles.join(' '), 'on', node.type, JSON.stringify(node.styleNames || []));
  }
}

for (let i = 0; i < actions.length; i += 8) {
  const out = callTool('data_element_tool', {
    context: 'Reapply the intended class lists to elements left classless by the stacked-globals set_style failure.',
    siteId: '698111847e9608eb30ee21c6', pageId: page.id,
    actions: actions.slice(i, i + 8),
  });
  const errs = (out.match(/"error"/g) || []).length;
  console.log('batch', i, 'errors:', errs, errs ? out.slice(0, 400) : '');
}
