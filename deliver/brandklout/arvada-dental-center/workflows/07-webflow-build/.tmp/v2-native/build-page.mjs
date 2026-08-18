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

let html = fs.readFileSync(htmlFile, 'utf8').trim();

/* --------------------------------------------- resolve images to assets --- */
/**
 * The builder binds an <img> to a real Webflow asset ONLY when the src is the
 * asset's own `hostedUrl` (the s3.amazonaws.com one). Given the CDN URL the
 * design carries it answers "does not exist in asset library", inserts an
 * unmanaged image, and the asset has to be attached afterwards with
 * set_image_asset — which toggles, is eventually consistent, and cost this
 * build three passes that each made it worse.
 *
 * Rewriting the src here removes that whole class of failure: the asset is
 * bound at build time, `status: success`, no warning. The design file keeps the
 * readable CDN URLs.
 *
 * The asset id needs no lookup — Webflow prefixes every filename with it.
 */
{
  const ids = new Map();
  for (const m of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
    const file = decodeURIComponent(m[1].split('/').pop() || '');
    const id = (file.match(/^([0-9a-f]{24})_/) || [])[1];
    if (id) ids.set(m[1], id);
  }
  const unique = [...new Set(ids.values())];
  const hosted = new Map();
  for (const id of unique) {
    const r = call('data_assets_tool', [{ label: 'a', get_asset: { asset_id: id } }], o);
    const url = r?.result?.hostedUrl;
    if (url) hosted.set(id, url);
    else console.log(`  could not resolve asset ${id} (rate limit? re-run) — that image will be unmanaged`);
  }
  let swapped = 0;
  for (const [src, id] of ids) {
    if (!hosted.has(id)) continue;
    html = html.split(`"${src}"`).join(`"${hosted.get(id)}"`);
    swapped++;
  }
  console.log(`resolved ${swapped}/${ids.size} image src(s) to their asset hostedUrl`);
}

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
