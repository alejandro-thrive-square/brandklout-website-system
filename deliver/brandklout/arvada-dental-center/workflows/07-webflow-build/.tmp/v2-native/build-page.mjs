#!/usr/bin/env node
/**
 * build-page.mjs — insert a page's markup into a v2 Webflow page.
 *
 * MARKUP ONLY. No `css` field is sent: every camp_ class already exists on the
 * site, and data_whtml_builder applies an existing class by name. Sending the
 * stylesheet again would only risk re-forking classes and tripping the
 * multiplayer conflict on unchanged values.
 *
 *   node build-page.mjs <pageId> <html-file> [--clear]
 */
import fs from 'node:fs';
import { call, SITES } from './wf.mjs';

const [pageId, htmlFile] = process.argv.slice(2);
const CLEAR = process.argv.includes('--clear');
if (!pageId || !htmlFile) { console.log('usage: build-page.mjs <pageId> <html-file> [--clear]'); process.exit(1); }

const o = { site: SITES.arvada, page: pageId };

/* ------------------------------------------------------- empty the page --- */

const tree = call('data_element_tool', [{ label: 'e', get_all_elements: {} }], o);
const body = tree?.result?.[0]?.data;
if (!body) { console.log('could not read the page tree: ' + JSON.stringify(tree).slice(0, 400)); process.exit(1); }

const kids = (body.children || []).map((c) => c.id);
if (kids.length) {
  if (!CLEAR) { console.log(`page already has ${kids.length} root element(s); pass --clear to replace`); process.exit(1); }
  call('data_element_tool', kids.map((id, i) => ({ label: 'rm' + i, remove_element: { id } })), o);
  console.log(`cleared ${kids.length} root element(s)`);
}

/* ------------------------------------------------------------- insert ----- */

const html = fs.readFileSync(htmlFile, 'utf8').trim();
console.log(`inserting ${html.length} bytes of markup…`);

const res = call('data_whtml_builder', [{
  build_label: 'page',
  parent_element_id: body.id,
  creation_position: 'append',
  html,
  return_element_info: true,
}], o);

const r = (Array.isArray(res) ? res[0] : res)?.[0] || res;
console.log('status: ' + JSON.stringify(r).slice(0, 1200));

/* -------------------------------------------------------------- verify ---- */

const after = call('data_element_tool', [{ label: 'e', get_all_elements: {} }], o);
let nodes = 0; const used = new Map();
(function walk(n) {
  nodes++;
  for (const c of n.styleNames || []) used.set(c, (used.get(c) || 0) + 1);
  for (const c of n.children || []) walk(c);
})(after.result[0].data);

const wantClasses = new Map();
for (const m of html.matchAll(/class="([^"]+)"/g)) for (const c of m[1].split(/\s+/)) wantClasses.set(c, (wantClasses.get(c) || 0) + 1);

const dropped = [...wantClasses.keys()].filter((c) => !used.has(c));
const short = [...wantClasses.entries()].filter(([c, n]) => used.has(c) && used.get(c) < n);

console.log(`\n${nodes} elements on the page; ${used.size}/${wantClasses.size} distinct classes applied`);
if (dropped.length) console.log('CLASSES DROPPED ENTIRELY: ' + dropped.join(', '));
if (short.length) console.log('APPLIED FEWER TIMES THAN THE MARKUP ASKS:\n  ' +
  short.map(([c, n]) => `${c}: want ${n}, got ${used.get(c)}`).join('\n  '));
if (!dropped.length && !short.length) console.log('every class in the markup landed on the right number of elements.');
