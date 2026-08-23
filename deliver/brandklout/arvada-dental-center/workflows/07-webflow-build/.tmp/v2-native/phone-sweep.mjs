#!/usr/bin/env node
/**
 * phone-sweep.mjs — safety net for strings get_all_elements cannot see.
 * Rich-text internals are absent from the element tree but ARE returned by
 * query_elements, so sweep every page for the retired numbers by substring.
 */
import fs from 'node:fs';
import { call } from './wf.mjs';
const PAGES = JSON.parse(fs.readFileSync('phone-pages.json', 'utf8'));
const NEEDLES = ['7611', '5419', '0102', '421-', '(303)', '303-'];
for (const p of PAGES) {
  const r = call('data_element_tool', [{
    label: 'q',
    query_elements: { queries: NEEDLES.map(n => ({ label: n, element_filter: { text: n }, limit: 50 })) },
  }], { page: p.id });
  const data = (Array.isArray(r) ? r[0] : r)?.result?.[0]?.data;
  if (!data) { console.log(`${p.slug}: ERROR ${JSON.stringify(r).slice(0, 200)}`); continue; }
  const found = data.filter(d => d.total_matches > 0);
  console.log(`${p.slug}: ${found.length ? '' : 'clean'}`);
  for (const d of found) for (const m of d.matches) console.log(`   [${d.label}] ${m.type} ${m.id.element} :: ${(m.textContent || '').slice(0, 120)}`);
}
