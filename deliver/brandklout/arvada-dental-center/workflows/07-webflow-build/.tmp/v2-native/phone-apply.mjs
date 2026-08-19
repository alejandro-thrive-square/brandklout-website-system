#!/usr/bin/env node
/**
 * phone-apply.mjs — rewrite every phone instance on the 18 pages inside the
 * Webflow /ads-landing-pages folder to one number.
 *
 * Reads the element trees phone-scan.mjs cached, so the plan is auditable
 * before anything is written. `--dry` prints the plan and writes nothing.
 *
 * Three places carry a number: String nodes (visible copy), Link settings
 * (`tel:` href — a phone Link stores the href VERBATIM, so the `tel:` prefix
 * must be passed in), and one page's SEO description.
 */
import fs from 'node:fs';
import { call } from './wf.mjs';
import { scan, root } from './phone-report.mjs';

const DISPLAY = '(720) 419-3699';
const HREF = 'tel:+17204193699';
const PHONE = /\(?\d{3}\)?[ .\u00a0-]?\d{3}[ .-]\d{4}/g;

const DRY = process.argv.includes('--dry');
const trees = JSON.parse(fs.readFileSync('C:/Users/ACER/AppData/Local/Temp/phone-trees.json', 'utf8'));
const PAGES = JSON.parse(fs.readFileSync('phone-pages.json', 'utf8'));

let planned = 0;
for (const p of PAGES) {
  const hits = scan(root(trees[p.id]));
  const actions = [];
  const seen = new Set();
  for (const h of hits) {
    const key = `${h.kind}:${h.id.element}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (h.kind === 'text') {
      const text = h.value.replace(PHONE, DISPLAY);
      if (text !== h.value) actions.push({ label: `t-${actions.length}`, set_text: { id: h.id, text } });
    } else if (h.kind === 'href') {
      const isPhone = h.linkType === 'phone' || /^tel:/i.test(h.value);
      if (!isPhone) { console.log(`  !! non-phone href skipped: ${h.value}`); continue; }
      if (h.value !== HREF) actions.push({ label: `h-${actions.length}`, set_link: { id: h.id, linkType: 'phone', link: HREF } });
    } else {
      console.log(`  !! unhandled ${h.kind} ${h.name}: ${h.value}`);
    }
  }
  planned += actions.length;
  console.log(`${p.slug}: ${actions.length} writes`);
  if (DRY || !actions.length) continue;
  // Chunk so one oversized request cannot fail a whole page.
  for (let i = 0; i < actions.length; i += 12) {
    const batch = actions.slice(i, i + 12);
    const r = call('data_element_tool', batch, { page: p.id });
    const s = JSON.stringify(r);
    const ok = (s.match(/"status":"success"/g) || []).length;
    if (ok !== batch.length) console.log(`  !! ${p.slug}: ${ok}/${batch.length} succeeded\n${s.slice(0, 600)}`);
  }
}
console.log(`\n${DRY ? 'planned' : 'applied'}: ${planned} writes`);
