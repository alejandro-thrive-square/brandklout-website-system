#!/usr/bin/env node
/**
 * push-site-css.mjs — ship the local build's single `site.css` to Instatic as
 * ONE site-wide stylesheet code asset.
 *
 * WHY
 * ---
 * The import gave every page its own copy of the shared CSS in Instatic's style
 * registry: 27 copies of the same rules, a chip wall in the editor, and one edit
 * to make 27 times. A code asset is a single file, applies to all pages, and
 * survives the publish-time purge that strips "unused" registry classes.
 * `src/styles/runtime-states.css` already proves the mechanism on this site.
 *
 * FOUR THINGS THIS SCRIPT EXISTS TO WORK AROUND
 * ---------------------------------------------
 * 1. The `runtime` config attaches on CREATE only. Overwriting an existing asset
 *    does NOT re-apply it, so the file goes silently unscoped. So: create TINY
 *    with the runtime config, and confirm scope before putting content in it.
 * 2. `priority` is normalized to 100 on write regardless of what you ask for,
 *    and there is no tool to change it afterwards. With both sheets at 100 the
 *    order is the listing order: runtime-states.css, then site.css. That is the
 *    order we want. site.css is the authority for layout (its `.ga-grid` and
 *    `.rv-*` media queries are already in the correct min-width order, which is
 *    what runtime-states was patching), and runtime-states keeps winning for the
 *    JS-applied state classes because those are written at `.in.in.in`
 *    specificity, which no single-class rule in site.css can beat.
 * 3. A large `content` on write is dropped silently. So: fill via
 *    site_patch_code_asset in chunks, each replacing an end sentinel with
 *    `chunk + sentinel`.
 * 4. site_read_code_asset paginates at 12000 chars. Reading back for
 *    verification has to walk `pageInfo.nextPart`, and the hash must be taken
 *    from a read, not assumed.
 *
 *   node push-site-css.mjs [--chunk 10000] [--dry] [--verify]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { callJson, callWrite } from './instatic-mcp.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CSS = path.resolve(HERE, '../../04-design/.tmp/final-site/assets/site.css');
const PATH = 'src/styles/site.css';
const SENTINEL = '/*__wz_end__*/';
const BANNER = '/* Dr. Nahlah design system, one file. Filled in chunks. */\n';
const argv = process.argv.slice(2);
const CHUNK = Number(argv.includes('--chunk') ? argv[argv.indexOf('--chunk') + 1] : 10000);

const css = fs.readFileSync(CSS, 'utf8');
console.log(`local site.css: ${css.length} chars`);
if (argv.includes('--dry')) process.exit(0);

/** Read every page of a code asset and return { content, hash }. */
async function readAll() {
  let out = '', part = 1, hash = null;
  for (;;) {
    const r = await callJson('site_read_code_asset', { path: PATH, part });
    out += r.content ?? '';
    hash = r.hash ?? hash;
    const next = r.pageInfo?.nextPart;
    if (!next) return { content: out, hash };
    part = next;
  }
}

if (argv.includes('--verify')) {
  const { content } = await readAll();
  const got = content.replace(SENTINEL, '').replace(BANNER, '');
  console.log(`remote: ${content.length} chars`);
  console.log(got.trim() === css.trim() ? 'MATCHES local site.css' : 'MISMATCH');
  process.exit(got.trim() === css.trim() ? 0 : 1);
}

// ---- 1. create tiny if absent, and prove the runtime attached --------------
const list = await callJson('site_list_code_assets', {});
if (!(list.assets || []).some((a) => a.path === PATH)) {
  console.log('creating tiny, with runtime attached');
  await callWrite('site_write_code_asset', {
    path: PATH, type: 'style', content: BANNER + SENTINEL + '\n',
    runtime: { enabled: true, scope: { type: 'all-pages' }, priority: 50 },
  });
}
const asset = ((await callJson('site_list_code_assets', {})).assets || []).find((a) => a.path === PATH);
if (!asset) throw new Error('asset absent after write — the create was dropped');
if (asset.runtime?.scope?.type !== 'all-pages' || asset.runtime?.enabled !== true) {
  throw new Error(`runtime did not attach: ${JSON.stringify(asset.runtime)}\n` +
    'Do NOT fill it. Create again under a new path, tiny.');
}
console.log(`runtime ok: scope=all-pages priority=${asset.runtime.priority} (100 is normalized, see header)`);

// ---- 2. reset to the sentinel so re-runs replace rather than append --------
//
// THIS MUST BE VERIFIED, NOT ASSUMED. `site_patch_code_asset` silently drops a
// large `oldText`: on 2026-08-19 a one-shot "replace the whole 82KB file with
// the sentinel" reported success, changed nothing, and the fill then appended a
// SECOND copy of the stylesheet before the sentinel — 163,878 chars, one banner,
// one sentinel, every rule twice. The same call had worked at 81KB that morning,
// so the threshold is not fixed and cannot be designed around. Clear in small
// slices instead, and refuse to fill unless the file reads back clean.
const EMPTY = BANNER + SENTINEL + '\n';
async function resetToSentinel() {
  for (let attempt = 0; attempt < 400; attempt++) {
    const { content, hash } = await readAll();
    if (!content.includes(SENTINEL)) throw new Error('sentinel missing — inspect the file by hand');
    if (content === EMPTY) return hash;
    const body = content.slice(BANNER.length, content.length - (SENTINEL + '\n').length);
    if (!body) {
      // banner or trailing newline differs; rewrite the whole (small) remainder
      await callWrite('site_patch_code_asset', {
        path: PATH, expectedHash: hash,
        replacements: [{ oldText: content, newText: EMPTY }],
      });
      continue;
    }
    const slice = body.slice(0, Math.min(4000, body.length));
    await callWrite('site_patch_code_asset', {
      path: PATH, expectedHash: hash,
      replacements: [{ oldText: slice, newText: '', replaceAll: true }],
    });
    if (attempt % 5 === 0) console.log(`  clearing... ${content.length} chars left`);
  }
  throw new Error('could not clear the asset back to its sentinel — do NOT fill, inspect by hand');
}
let hash = await resetToSentinel();
console.log('reset to sentinel, verified');

// ---- 3. fill ---------------------------------------------------------------
const chunks = [];
for (let i = 0; i < css.length; i += CHUNK) chunks.push(css.slice(i, i + CHUNK));
console.log(`filling in ${chunks.length} chunks of <=${CHUNK}`);
for (let i = 0; i < chunks.length; i++) {
  await callWrite('site_patch_code_asset', {
    path: PATH, expectedHash: hash,
    replacements: [{ oldText: SENTINEL, newText: chunks[i] + SENTINEL }],
  });
  const r = await callJson('site_read_code_asset', { path: PATH, part: 1 });
  hash = r.hash;
  console.log(`  chunk ${i + 1}/${chunks.length} -> ${r.pageInfo?.totalChars} chars on the server`);
}

// ---- 4. verify --------------------------------------------------------------
const { content: finalContent } = await readAll();
const got = finalContent.replace(SENTINEL, '').replace(BANNER, '');
console.log(`final: ${finalContent.length} chars`);
console.log(got.trim() === css.trim() ? 'CONTENT MATCHES local site.css' : 'MISMATCH — inspect before publishing');
