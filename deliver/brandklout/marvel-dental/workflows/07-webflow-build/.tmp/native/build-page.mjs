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
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { call, SITES } from './wf.mjs';

const [pageId, htmlFile] = process.argv.slice(2);
const CLEAR = process.argv.includes('--clear');
if (!pageId || !htmlFile) { console.log('usage: build-page.mjs <pageId> <html-file> [--clear]'); process.exit(1); }

const o = { site: SITES.marvel, page: pageId };

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
  // Cache the id -> hostedUrl map on disk. `GET /v2/assets` 429s quickly, and
  // the 18 pages share the same handful of images — re-asking per page is what
  // burned the rate limit and silently left three images unmanaged.
  const CACHE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'asset-urls.json');
  const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};

  const unique = [...new Set(ids.values())];
  const hosted = new Map(Object.entries(cache));
  let fetched = 0;
  for (const id of unique) {
    if (hosted.has(id)) continue;
    const r = call('data_assets_tool', [{ label: 'a', get_asset: { asset_id: id } }], o);
    const url = r?.result?.hostedUrl;
    if (url) { hosted.set(id, url); cache[id] = url; fetched++; }
    else console.log(`  could not resolve asset ${id} (rate limit? re-run) — that image will be unmanaged`);
  }
  if (fetched) fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1));
  let swapped = 0;
  for (const [src, id] of ids) {
    if (!hosted.has(id)) continue;
    html = html.split(`"${src}"`).join(`"${hosted.get(id)}"`);
    swapped++;
  }
  console.log(`resolved ${swapped}/${ids.size} image src(s) to their asset hostedUrl`);
}

/**
 * data_whtml_builder has an undocumented size ceiling. A 19KB page inserts in
 * one call; 29KB comes back `{"error":""}` — an EMPTY error, having cleared the
 * page and created nothing. So a large page is inserted in pieces: the wrapper
 * first, then its children appended into it, recursing wherever a child is
 * itself too big.
 */
const LIMIT = 18000;

/** Split a fragment into [openTag, children[], closeTag], or null if atomic. */
function split(frag) {
  const m = frag.match(/^\s*<([a-zA-Z][\w-]*)\b([^>]*)>([\s\S]*)<\/\1>\s*$/);
  if (!m) return null;
  const [, tag, attrs, inner] = m;
  const kids = [];
  let depth = 0, start = 0;
  for (const t of inner.matchAll(/<(\/?)([a-zA-Z][\w-]*)\b[^>]*?(\/?)>/g)) {
    const [whole, slash, name, selfClose] = t;
    if (VOID.has(name.toLowerCase()) || selfClose) { if (depth === 0) { kids.push(inner.slice(start, t.index + whole.length)); start = t.index + whole.length; } continue; }
    if (!slash) { if (depth === 0) start = Math.min(start, t.index); depth++; }
    else { depth--; if (depth === 0) { kids.push(inner.slice(start, t.index + whole.length)); start = t.index + whole.length; } }
  }
  const tail = inner.slice(start);
  if (tail.trim()) kids.push(tail);
  return kids.length > 1 || (kids.length === 1 && kids[0].length < inner.length)
    ? { open: `<${tag}${attrs}></${tag}>`, kids: kids.filter((k) => k.trim()) }
    : null;
}
const VOID = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source']);

function insert(fragment, parentId, label) {
  if (fragment.length <= LIMIT) {
    const res = call('data_whtml_builder',
      [{ build_label: label, parent_element_id: parentId, creation_position: 'append', html: fragment, return_element_info: true }], o);
    // The response is either one object or an array of them, one per action.
    const first = Array.isArray(res) ? res[0] : res;
    const r = Array.isArray(first) ? first[0] : first;
    if (!r?.data?.id) { console.log(`  FAILED ${label} (${fragment.length}B): ${JSON.stringify(r).slice(0, 200)}`); return null; }
    return r.data.id;
  }
  const parts = split(fragment);
  if (!parts) { console.log(`  ${label} is ${fragment.length}B and cannot be split further`); return null; }
  const shellId = insert(parts.open, parentId, label + ':shell');
  if (!shellId) return null;
  parts.kids.forEach((k, i) => insert(k, shellId, `${label}.${i}`));
  return shellId;
}

console.log(`inserting ${html.length} bytes of markup${html.length > LIMIT ? ' (chunked)' : ''}…`);
const rootId = insert(html.trim(), body.id, 'page');
console.log('root: ' + (rootId ? JSON.stringify(rootId) : 'FAILED'));

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
