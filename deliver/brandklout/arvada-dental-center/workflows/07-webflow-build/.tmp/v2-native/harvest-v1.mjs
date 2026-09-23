#!/usr/bin/env node
/**
 * harvest-v1.mjs — pull the four carried-over sections out of an archived v1
 * page into structured JSON.
 *
 *   gallery  "Real Patients. Real Results."   eyebrow, heading, copy, 3 photos
 *   space    "A Space Designed For Your…"     eyebrow, heading, copy, 5 photos
 *   story    "From Failing Teeth To…"         heading, before/after, two
 *                                             outcome columns, a 4-step story
 *   faq      "Any questions before you call?" 7 items, held as component
 *                                             instance props, not page text
 *
 * Saves `v1-harvest/<topic>.json`. Run once per topic; the API rate-limits, so
 * do two at a time.
 *
 *   node harvest-v1.mjs <topic> <v1PageId>
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { call, SITES } from './wf.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'v1-harvest');
fs.mkdirSync(OUT, { recursive: true });

const [topic, pageId] = process.argv.slice(2);
const o = { site: SITES.arvada, page: pageId };

const tree = call('data_element_tool', [{ label: 'e', get_all_elements: {} }], o);
const root = tree?.result?.[0]?.data;
if (!root) { console.log('could not read ' + pageId + ': ' + JSON.stringify(tree).slice(0, 300)); process.exit(1); }

const find = (frag) => {
  let hit = null;
  (function walk(n) {
    if (!hit && (n.styleNames || []).some((c) => c.toLowerCase().includes(frag))) hit = n;
    for (const c of n.children || []) if (!hit) walk(c);
  })(root);
  return hit;
};

const texts = (n) => { const out = []; (function w(x) { if (x.type === 'String') { const t = (x.textContent || '').trim(); if (t) out.push(t); } for (const c of x.children || []) w(c); })(n || {}); return out; };
const imgs = (n) => { const out = []; (function w(x) { if (x.type === 'Image') out.push(x.id); for (const c of x.children || []) w(c); })(n || {}); return out; };

const assetOf = (id) => {
  const r = call('data_element_settings_tool', [{ label: 's', get_settings: { type: 'all_raw_settings', element_id: id } }], o);
  const kv = Object.fromEntries((r?.result?.[0]?.data?.matches || []).map((m) => [m.key, m.value]));
  return { assetId: kv.assetId || null, alt: kv.altText || '' };
};

const data = { topic, v1PageId: pageId };

for (const [key, frag] of [['gallery', 'gallery'], ['space', 'space'], ['story', 'journey']]) {
  const node = find(frag);
  if (!node) { data[key] = null; console.log(`${topic}: no ${key} section`); continue; }
  data[key] = { text: texts(node), images: imgs(node).map(assetOf) };
}

// The FAQ lives in accordion component instances, not in the page's text.
const list = find('faq__list') || find('faq');
const inst = [];
if (list) (function w(n) { if (n.type === 'ComponentInstance') inst.push(n); for (const c of n.children || []) w(c); })(list);
data.faq = inst.map((i) => {
  const r = call('data_component_props_tool', [{ label: 'p', get_component_instance_props: { element_id: i.id } }], o);
  const props = Object.fromEntries((r.result || []).map((p) => [p.name, p.value]));
  return { q: props.Text || '', a: (props.Content && props.Content.innerText) || props.Content || '' };
}).filter((f) => f.q);

fs.writeFileSync(path.join(OUT, `${topic}.json`), JSON.stringify(data, null, 1));
console.log(`${topic}: gallery ${data.gallery ? data.gallery.images.length + ' imgs' : '-'} | space ${data.space ? data.space.images.length + ' imgs' : '-'} | story ${data.story ? data.story.images.length + ' imgs' : '-'} | faq ${data.faq.length} items`);
