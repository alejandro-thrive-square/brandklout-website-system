#!/usr/bin/env node
/**
 * push-site-js.mjs — ship the local build's single `site.js` as ONE site-wide
 * script asset, and empty the 212 per-page inline scripts it replaces.
 *
 * WHY THE OLD ONES CANNOT SIMPLY BE LEFT
 * --------------------------------------
 * They are not merely duplicated, they are for a DIFFERENT PAGE. The import
 * split the pre-2026-08-17 build's runtime into four scripts and copied all four
 * onto each of 27 pages. They drive the old vocabulary (`[data-anim="hide"]`,
 * the old section names); the pages now carry the current one (`[data-rv]`,
 * `[data-drift]`, `[data-split]`). Left in place they would run alongside
 * site.js, register a second ScrollSmoother, and fight it for the scroll.
 *
 * Instatic has no delete tool for code assets, and a stored `runtime` cannot be
 * changed by overwriting. So the retirement is: overwrite the CONTENT with a
 * one-line note. The file still loads and does nothing, which is the most that
 * can be done from here. Deleting them properly is a manual pass in the editor.
 *
 * Ordering that matters:
 *   gsap-head-i.js   head,     classic, blocking  -> GSAP globals exist
 *   site.js          body-end, classic, dom-ready -> registers plugins, boots
 *   before-after.js  body-end, module,  dom-ready -> re-wires the sliders that
 *                    Instatic's base.input module turns from range into text
 *
 *   node push-site-js.mjs [--chunk 10000] [--no-retire] [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { callJson } from './instatic-mcp.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const JS = path.resolve(HERE, '../../04-design/.tmp/final-site/assets/site.js');
const PATH = 'src/scripts/site.js';
const SENTINEL = '/*__wz_end__*/';
const BANNER = '/* Dr. Nahlah runtime: WZ, every section module, the boot sequence. One file. */\n';
const argv = process.argv.slice(2);
const CHUNK = Number(argv.includes('--chunk') ? argv[argv.indexOf('--chunk') + 1] : 10000);

const js = fs.readFileSync(JS, 'utf8');
console.log(`local site.js: ${js.length} chars`);

async function readAll(p) {
  let out = '', part = 1, hash = null;
  for (;;) {
    const r = await callJson('site_read_code_asset', { path: p, part });
    out += r.content ?? '';
    hash = r.hash ?? hash;
    if (!r.pageInfo?.nextPart) return { content: out, hash };
    part = r.pageInfo.nextPart;
  }
}

if (!argv.includes('--dry')) {
  // ---- 1. create tiny, with the runtime config, and prove it attached ------
  const list = await callJson('site_list_code_assets', {});
  if (!(list.assets || []).some((a) => a.path === PATH)) {
    console.log('creating tiny, with runtime attached');
    await callJson('site_write_code_asset', {
      path: PATH, type: 'script', content: BANNER + SENTINEL + '\n',
      runtime: {
        enabled: true, runInCanvas: true, format: 'classic',
        placement: 'body-end', timing: 'dom-ready',
        scope: { type: 'all-pages' }, priority: 50,
      },
    });
  }
  const asset = ((await callJson('site_list_code_assets', {})).assets || []).find((a) => a.path === PATH);
  if (!asset) throw new Error('asset absent after write');
  const rt = asset.runtime || {};
  // `format` is FORCED to "module" on every newly created script asset. Asking
  // for classic is ignored, and it is not sniffed from content either: tested
  // with a bare comment and with 9KB of real UMD-shaped JS, both came back
  // module. gsap-head-i.js is classic only because it predates this behaviour.
  //
  // Module is correct here anyway, and the distinction is the one that broke
  // this site on 2026-08-13: back then a MODULE was trying to *define*
  // window.gsap while classic page scripts tested for it during parse, so the
  // definition landed too late. site.js is the CONSUMER, and GSAP is loaded
  // head/classic/blocking by gsap-head-i.js, so the globals exist long before a
  // deferred module runs. Verified by rendering, not assumed.
  if (rt.scope?.type !== 'all-pages' || rt.enabled !== true || rt.placement !== 'body-end') {
    throw new Error(`runtime wrong and NOT changeable afterwards: ${JSON.stringify(rt)}\n` +
      'Create again under a new path rather than filling this one.');
  }
  console.log(`runtime ok: ${rt.format}/${rt.placement}/${rt.timing} scope=${rt.scope.type}`);

  // ---- 2. reset then fill in chunks ---------------------------------------
  let { content, hash } = await readAll(PATH);
  if (!content.includes(SENTINEL)) throw new Error('sentinel missing');
  if (content !== BANNER + SENTINEL + '\n') {
    await callJson('site_patch_code_asset', {
      path: PATH, expectedHash: hash,
      replacements: [{ oldText: content, newText: BANNER + SENTINEL + '\n' }],
    });
    ({ hash } = await readAll(PATH));
  }
  const chunks = [];
  for (let i = 0; i < js.length; i += CHUNK) chunks.push(js.slice(i, i + CHUNK));
  console.log(`filling in ${chunks.length} chunks`);
  for (let i = 0; i < chunks.length; i++) {
    await callJson('site_patch_code_asset', {
      path: PATH, expectedHash: hash,
      replacements: [{ oldText: SENTINEL, newText: chunks[i] + SENTINEL }],
    });
    const r = await callJson('site_read_code_asset', { path: PATH, part: 1 });
    hash = r.hash;
    console.log(`  chunk ${i + 1}/${chunks.length} -> ${r.pageInfo?.totalChars}`);
  }
  const { content: final } = await readAll(PATH);
  const got = final.replace(SENTINEL, '').replace(BANNER, '');
  console.log(got.trim() === js.trim() ? 'CONTENT MATCHES local site.js' : 'MISMATCH — do not publish');
}

// ---- 3. retire what it replaces --------------------------------------------
if (argv.includes('--no-retire')) process.exit(0);

const NOTE = (why) => `/* Retired 2026-08-19: ${why}\n` +
  `   Emptied rather than disabled, because Instatic has no delete tool for code\n` +
  `   assets and a stored runtime config cannot be changed by overwriting.\n` +
  `   Safe to delete by hand in the Instatic editor. */\n`;

const all = (await callJson('site_list_code_assets', { type: 'script' })).assets || [];
const perPage = all.filter((a) => /\.html-inline-script-\d+\.js$/.test(a.path) && a.bytes > 400);
const debris = all.filter((a) => /^src\/scripts\/(zprobe-|ztest|zp\d|zpnone|zqb-|zraw|zrtcheck|zs-|zsz-|favicon-[b-l]\.js)/.test(a.path) && a.bytes > 400);

console.log(`\nretiring ${perPage.length} per-page inline scripts and ${debris.length} leftover probes`);
if (argv.includes('--dry')) {
  for (const a of [...perPage, ...debris]) console.log(`   ${a.path} (${a.bytes} B)`);
  process.exit(0);
}

let done = 0; const failed = [];
for (const a of perPage) {
  try {
    await callJson('site_write_code_asset', { path: a.path, type: 'script',
      content: NOTE('superseded by src/scripts/site.js, and written for the pre-2026-08-17 markup vocabulary this page no longer uses') });
    done++;
    if (done % 20 === 0) console.log(`  ${done}/${perPage.length}`);
  } catch (e) { failed.push([a.path, e.message]); }
}
for (const a of debris) {
  try {
    await callJson('site_write_code_asset', { path: a.path, type: 'script',
      content: NOTE('leftover diagnostic probe from an earlier session') });
    done++;
  } catch (e) { failed.push([a.path, e.message]); }
}
console.log(`\nretired ${done}, failed ${failed.length}`);
for (const [p, e] of failed) console.log(`   ${p}: ${e}`);
