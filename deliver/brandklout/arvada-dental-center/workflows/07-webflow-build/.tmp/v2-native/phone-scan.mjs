#!/usr/bin/env node
/**
 * phone-scan.mjs — find every phone occurrence on the 18 pages inside the
 * Webflow /ads-landing-pages folder, and (with --apply) rewrite them.
 *
 * Occurrences live in three places: String nodes (visible text), Link
 * href/settings (tel:), and element attributes.
 */
import fs from 'node:fs';
import { call } from './wf.mjs';

const PAGES = JSON.parse(fs.readFileSync('phone-pages.json', 'utf8'));
const RE = /(\(?\d{3}\)?[ .\u00a0-]?\d{3}[ .-]\d{4})|(tel:\+?1?\d{10})/g;

const dump = {};
for (const p of PAGES) {
  const res = call('data_element_tool', [{ label: 'all', get_all_elements: {} }], { page: p.id });
  const root = Array.isArray(res) ? res[0] : res;
  const tree = root;
  dump[p.id] = tree;
  const hits = [];
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(walk);
    if (n.type === 'String' && RE.test(n.textContent || '')) { RE.lastIndex = 0; hits.push(['text', n.textContent]); }
    RE.lastIndex = 0;
    const href = n.attributes?.href || n.settings?.link?.href;
    if (href && /tel:/i.test(href)) hits.push(['href', href]);
    for (const [k, v] of Object.entries(n.attributes || {})) {
      if (k !== 'href' && typeof v === 'string' && RE.test(v)) { RE.lastIndex = 0; hits.push([`attr:${k}`, v]); }
      RE.lastIndex = 0;
    }
    walk(n.children);
  };
  walk(tree);
  const tally = {};
  for (const [k, v] of hits) tally[`${k} = ${v}`] = (tally[`${k} = ${v}`] || 0) + 1;
  console.log(`\n${p.slug}  (${hits.length} hits)`);
  for (const [k, n] of Object.entries(tally)) console.log(`   ${String(n).padStart(3)} x  ${k}`);
}
fs.writeFileSync('C:/Users/ACER/AppData/Local/Temp/phone-trees.json', JSON.stringify(dump));
console.log('\ntrees written');
