#!/usr/bin/env node
/**
 * push-native.mjs — build the All-on-X quiz pages on the Arvada Dental Center
 * site as native Webflow elements and classes.
 *
 * Source: native/ (written by 04-design/.tmp/aox-quiz/native/build.mjs)
 *   classes.css        -> Webflow styles (one call; the builder creates a style per rule)
 *   <key>.body.html    -> elements, inserted section by section
 *   head.html          -> page head code: noindex and the handful of rules a style cannot hold
 *   footer.html        -> page footer code: the behaviour script
 *
 *   node push-native.mjs classes          # create the aq- class layer (once)
 *   node push-native.mjs assets           # stills that are not yet in the asset library
 *   node push-native.mjs pages [key ...]  # rebuild page bodies, head and footer code
 *   node push-native.mjs check [key ...]  # read each page back: classes, images, form settings
 *   node push-native.mjs publish          # webflow.io subdomain ONLY
 *
 * It never publishes to a custom domain.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { wf, must, SITE } from './wfq.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const SRC = join(HERE, 'native');
const STATE = join(HERE, 'pages-built.json');
const state = JSON.parse(readFileSync(STATE, 'utf8'));
const save = () => writeFileSync(STATE, JSON.stringify(state, null, 1) + '\n');
const manifest = JSON.parse(readFileSync(join(SRC, 'manifest.json'), 'utf8'));
const [cmd, ...rest] = process.argv.slice(2);
const keys = rest.length ? rest : ['thanks', 'consult', 'landing'];
const read = (name) => readFileSync(join(SRC, name), 'utf8');

const walk = (n, fn, parent = null) => { if (!n || typeof n !== 'object') return; if (n.type) fn(n, parent); for (const c of n.children ?? []) walk(c, fn, n); };
const tree = async (pageId) => must(await wf('data_element_tool', [{ label: 'tree', get_all_elements: { depth: -1 } }], { pageId }), 'tree')[0].result[0].data;
const report = (results, what) => {
  for (const r of results) {
    const s = JSON.stringify(r);
    if (r.status === 'error' || r.name === 'Error' || r.error) throw new Error(`${what}: ${s.slice(0, 900)}`);
    // `missing_font` is a false alarm for the site's own fonts and `.text-style-tagline parent` is a
    // pre-existing duplicate on this site, as is the builder's own `_w-input` combo attempt; anything
    // else in the warnings is ours.
    const warns = (r.data?.warnings ?? []).filter((w) => w.code !== 'missing_font' && !/text-style-tagline|_w-input/.test(w.message));
    if (warns.length) console.log(`   warning (${what}): ` + JSON.stringify(warns).slice(0, 500));
    if (r.data?.image_warnings?.length) console.log(`   image not bound (${what}): ` + r.data.image_warnings.map((w) => w.src.split('/').pop()).join(', '));
  }
  return results;
};

/* ---------------------------------------------------------------------- classes */
if (cmd === 'classes') {
  const css = read('classes.css');
  // A throwaway element on the draft probe page carries the stylesheet in.
  const probe = JSON.parse(readFileSync(join(HERE, 'probe-page.json'), 'utf8')).pageId;
  const body = (await tree(probe)).id;
  const res = report(await wf('data_whtml_builder', [{ build_label: 'classes', parent_element_id: body, creation_position: 'append', html: '<div class="aq-page"></div>', css, return_element_info: true }], { pageId: probe }), 'class layer');
  console.log('class layer sent: ' + res[0].status + ' — ' + String(res[0].message).slice(0, 200));
  must(await wf('data_element_tool', [{ label: 'rm', remove_element: { id: res[0].data.id } }], { pageId: probe }), 'remove carrier');
}

/* ---------------------------------------------------------------------- assets */
if (cmd === 'assets') {
  state.assets ??= {};
  for (const [name, url] of Object.entries(manifest.images)) {
    if (url.includes('cdn.prod.website-files.com') || state.assets[url]) continue;
    // asset_tool's upload-by-URL needs an open Designer session. The Data API does not:
    // create_asset hands back a presigned S3 POST, and the bytes go there. Its field names come
    // back camelCased and must be sent under the names the policy was signed with.
    const bytes = Buffer.from(await (await fetch(url)).arrayBuffer());
    const md5 = createHash('md5').update(bytes).digest('hex');
    const file = `aox-quiz-${name}.jpg`;
    const [r] = must(await wf('data_assets_tool', [{ label: name, create_asset: { site_id: SITE, file_name: file, file_hash: md5 } }]), 'create_asset ' + name);
    const { uploadUrl, uploadDetails, id } = r.result ?? {};
    if (!uploadUrl || !id) throw new Error(`create_asset ${name}: ${JSON.stringify(r).slice(0, 500)}`);
    const S3 = { xAmzAlgorithm: 'X-Amz-Algorithm', xAmzCredential: 'X-Amz-Credential', xAmzDate: 'X-Amz-Date', xAmzSignature: 'X-Amz-Signature', policy: 'Policy', successActionStatus: 'success_action_status', contentType: 'Content-Type', cacheControl: 'Cache-Control' };
    const form = new FormData();
    for (const [k, v] of Object.entries(uploadDetails)) if (v != null) form.append(S3[k] ?? k, String(v));
    form.append('file', new Blob([bytes], { type: 'image/jpeg' }), file);
    const up = await fetch(uploadUrl, { method: 'POST', body: form });
    if (!(up.ok || up.status === 201 || up.status === 204)) throw new Error(`S3 upload ${name}: ${up.status} ${(await up.text()).slice(0, 300)}`);
    state.assets[url] = id; save();
    console.log(`uploaded ${name} (${Math.round(bytes.length / 1024)} KB) -> asset ${id}`);
  }
}

/* A design image URL -> the asset's hostedUrl, which is the only src the builder binds to an asset. */
const hosted = {};
async function hostedUrl(src) {
  if (hosted[src]) return hosted[src];
  const id = state.assets?.[src] ?? src.match(/\/([0-9a-f]{24})_/)?.[1];
  if (!id) throw new Error('no asset id for ' + src);
  const [r] = must(await wf('data_assets_tool', [{ label: 'a', get_asset: { asset_id: id } }]), 'get_asset ' + id);
  const url = r.result?.hostedUrl;
  if (!url) throw new Error('no hostedUrl for ' + id + ': ' + JSON.stringify(r).slice(0, 300));
  return (hosted[src] = url);
}

/* The body file is written with each top-level block starting in column 0. */
function blocks(html) {
  const out = []; let cur = null;
  for (const line of html.split('\n')) {
    if (/^<(header|section|footer|div class="aq-sticky")/.test(line)) { cur = { where: null, html: line }; out.push(cur); if (/^<div class="aq-sticky"/.test(line)) cur = null; continue; }
    if (cur) { cur.html += '\n' + line; if (/^<\/(header|section|footer)>/.test(line)) cur = null; }
  }
  return out;
}

/* ---------------------------------------------------------------------- pages */
if (cmd === 'pages') {
  for (const key of keys) {
    const st = state[key]; const pageId = st.pageId;
    console.log(`\n── ${key}  ${manifest.pages[key].slug}  ${pageId}`);

    for (const [location, file] of [['head', 'head.html'], ['footer', 'footer.html']]) {
      const content = read(file);
      must(await wf('data_scripts_tool', [{ label: location, set_page_freeform_code: { page_id: pageId, location, content } }]), `set ${location}`);
      console.log(`  ${location} code  ${content.length} chars`);
    }

    // Clear the body: the Embed from the first build, or a previous native build.
    const before = await tree(pageId);
    for (const c of before.children ?? []) must(await wf('data_element_tool', [{ label: 'rm', remove_element: { id: c.id } }], { pageId }), 'clear body');
    console.log(`  body cleared (${(before.children ?? []).length} element(s))`);

    let html = read(`${key}.body.html`);
    for (const src of new Set([...html.matchAll(/<img[^>]* src="([^"]+)"/g)].map((m) => m[1]))) html = html.split(`src="${src}"`).join(`src="${await hostedUrl(src)}"`);

    const insert = async (parent, fragment, label) => {
      if (fragment.length > 18000) throw new Error(`${label} is ${fragment.length} chars; the builder fails silently above ~19 KB`);
      const [r] = report(await wf('data_whtml_builder', [{ build_label: label, parent_element_id: parent, creation_position: 'append', html: fragment, return_element_info: true }], { pageId }), label);
      return r.data;
    };
    const page = await insert(before.id, '<div class="aq-page"></div>', 'page');
    let main = null, n = 0;
    for (const b of blocks(html)) {
      const isSection = b.html.startsWith('<section');
      if (isSection && !main) main = await insert(page.id, '<main class="aq-main"></main>', 'main');
      await insert(isSection ? main.id : page.id, b.html, `${key} block ${++n}`);
      process.stdout.write(`  block ${n} (${b.html.length})`);
    }
    console.log('');

    // Webflow builds the form wrapper, the checkbox label and the submit itself; give them their class and words.
    const after = await tree(pageId);
    const ops = [];
    walk(after, (el) => {
      if (el.type === 'FormWrapper') ops.push({ label: 'wrap', set_style: { id: el.id, style_names: ['aq-form-wrap'] } });
      if (el.type === 'FormForm') ops.push({ label: 'form', set_style: { id: el.id, style_names: ['aq-form'] } });
      if (el.type === 'FormCheckboxInput') ops.push({ label: 'checkbox', set_style: { id: el.id, style_names: ['aq-checkbox'] } });
      if (el.type === 'FormCheckboxWrapper') ops.push({ label: 'check', set_style: { id: el.id, style_names: ['aq-check'] } });
      if (el.type === 'FormInlineLabel') {
        ops.push({ label: 'checktext', set_style: { id: el.id, style_names: ['aq-check-text'] } });
        ops.push({ label: 'consent', set_text: { id: el.id, text: manifest.consent } });
      }
    });
    for (const op of ops) must(await wf('data_element_tool', [op], { pageId }), op.label);
    const buttons = []; walk(after, (el) => { if (el.type === 'FormButton') buttons.push(el); });
    for (const b of buttons) must(await wf('data_element_settings_tool', [{ label: 'submit', set_settings: { operations: [{ label: 'submit', element_id: b.id, settings: [
      { key: 'buttonText', static_text: { value: manifest.submit } }, { key: 'loadingText', static_text: { value: manifest.wait } },
    ] }] } }], { pageId }), 'submit label');
    if (ops.length || buttons.length) console.log(`  form: ${ops.length} class/text writes, ${buttons.length} submit label`);
    st.native = new Date().toISOString(); delete st.embedId; save();
  }
}

/* ---------------------------------------------------------------------- check */
if (cmd === 'check') {
  let bad = 0;
  for (const key of keys) {
    const want = {}; for (const m of read(`${key}.body.html`).matchAll(/class="([^"]+)"/g)) want[m[1]] = (want[m[1]] ?? 0) + 1;
    const got = {}; let images = 0, els = 0;
    walk(await tree(state[key].pageId), (el) => { els++; for (const c of el.styleNames ?? []) got[c] = (got[c] ?? 0) + 1; if (el.type === 'Image') images++; });
    const post = { 'aq-form-wrap': 1, 'aq-check': 1, 'aq-check-text': 1, 'aq-page': 1, 'aq-main': 1 };
    const hasForm = 'aq-form' in want;
    const diffs = [];
    for (const c of new Set([...Object.keys(want), ...Object.keys(got)])) {
      const w = (want[c] ?? 0) + ((c in post && !(c in want) && (hasForm || c === 'aq-page' || c === 'aq-main')) ? 1 : 0);
      if (w !== (got[c] ?? 0)) diffs.push(`${c}: want ${w}, page has ${got[c] ?? 0}`);
    }
    const wantImgs = (read(`${key}.body.html`).match(/<img /g) ?? []).length;
    if (images !== wantImgs) diffs.push(`images: want ${wantImgs}, page has ${images}`);
    bad += diffs.length;
    console.log(`${diffs.length ? 'DIFF' : 'ok  '} ${key}: ${els} elements, ${Object.keys(got).length} classes, ${images} images`);
    for (const d of diffs) console.log('      ' + d);
  }
  process.exitCode = bad ? 1 : 0;
}

/* ---------------------------------------------------------------------- publish */
if (cmd === 'publish') {
  const [r] = must(await wf('data_sites_tool', [{ label: 'publish', publish_site: { site_id: SITE, publishToWebflowSubdomain: true, customDomains: [] } }]), 'publish');
  console.log('published to the webflow.io subdomain only: ' + JSON.stringify(r.result ?? r).slice(0, 200));
}
