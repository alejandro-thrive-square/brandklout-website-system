#!/usr/bin/env node
/**
 * phone-fix-links.mjs — set every phone Link in the /ads-landing-pages folder.
 *
 * set_link stores the value VERBATIM, and Webflow adds its own `tel:` at
 * render time: passing "tel:+1..." publishes as href="tel:835:+1..." (dead
 * link), while "+1..." publishes as href="tel:+1...". Pass the bare number.
 */
import fs from 'node:fs';
import { call } from './wf.mjs';
import { root } from './phone-report.mjs';

const HREF = '+17204193699';
const trees = JSON.parse(fs.readFileSync('C:/Users/ACER/AppData/Local/Temp/phone-trees.json', 'utf8'));
const PAGES = JSON.parse(fs.readFileSync('phone-pages.json', 'utf8'));
const DRY = process.argv.includes('--dry');

let total = 0;
for (const p of PAGES) {
  const links = [];
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(walk);
    const l = n.settings?.link;
    if (l?.linkType === 'phone' && l.href !== HREF) links.push(n);
    walk(n.children);
  };
  walk(root(trees[p.id]));
  console.log(`${p.slug}: ${links.length} phone links`);
  total += links.length;
  if (DRY || !links.length) continue;
  const actions = links.map((n, i) => ({ label: `l${i}`, set_link: { id: n.id, linkType: 'phone', link: HREF } }));
  for (let i = 0; i < actions.length; i += 12) {
    const batch = actions.slice(i, i + 12);
    const s = JSON.stringify(call('data_element_tool', batch, { page: p.id }));
    const ok = (s.match(/"status":"success"/g) || []).length;
    if (ok !== batch.length) console.log(`  !! ${p.slug} ${ok}/${batch.length}\n${s.slice(0, 500)}`);
  }
}
console.log(`\n${DRY ? 'planned' : 'applied'}: ${total} phone links`);
