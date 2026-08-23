#!/usr/bin/env node
// eager-images.mjs <pageKey> — set loading=eager on every Image of a page.
import { callTool, PAGES } from './lib.mjs';
const pageKey = process.argv[2];
const page = PAGES[pageKey];
const out = callTool('data_element_tool', {
  context: 'List image elements to set eager loading for design parity.',
  siteId: '698111847e9608eb30ee21c6', pageId: page.id,
  actions: [{ label: 'imgs', query_elements: { queries: [{ label: 'imgs', element_filter: { type: 'Image' }, limit: 80 }] } }],
});
const ids = [];
{
  let depth = 0, start = -1;
  const objs = [];
  for (let i = 0; i < out.length; i++) {
    const c = out[i];
    if (c === '{') { if (depth === 0) start = i; depth++; }
    else if (c === '}') { depth--; if (depth === 0) { try { objs.push(JSON.parse(out.slice(start, i + 1))); } catch { } } }
  }
  const dig = (x) => {
    if (!x || typeof x !== 'object') return;
    if (x.label === 'imgs' && Array.isArray(x.matches)) { for (const m of x.matches) ids.push(m.id.element); }
    for (const k of Object.keys(x)) dig(x[k]);
  };
  for (const o of objs) dig(o);
}
console.log('images:', ids.length);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
for (let i = 0; i < ids.length; i += 10) {
  const batch = ids.slice(i, i + 10);
  const call = () => callTool('data_element_tool', {
    context: 'Set eager loading attribute on campaign page images for parity with the local design.',
    siteId: '698111847e9608eb30ee21c6', pageId: page.id,
    actions: batch.map((id, j) => ({ label: 'img' + (i + j), set_attributes: { id: { component: page.id, element: id }, attributes: [{ name: 'loading', value: 'eager' }] } })),
  });
  let o = call();
  if (/429/.test(o)) { console.log('429, waiting 65s'); await sleep(65000); o = call(); }
  const fails = (o.match(/"error"/g) || []).length;
  console.log('batch', i, 'errors:', fails);
  if (fails) console.log(o.slice(0, 300));
}
