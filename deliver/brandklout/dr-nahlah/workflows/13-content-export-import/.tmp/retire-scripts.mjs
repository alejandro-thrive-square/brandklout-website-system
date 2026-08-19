#!/usr/bin/env node
/**
 * retire-scripts.mjs — actually retire the dead code assets.
 *
 * The 2026-08-19 pass emptied 109 per-page inline scripts but left every one of
 * them `runtime.enabled: true`, on the belief that a stored runtime config could
 * not be rewritten. It can: `site_write_code_asset` merges `runtime`, and
 * `{enabled:false}` sticks (verified by read-back). So the site was still
 * emitting ~200 <script> tags per page, all of them stubs or probes.
 *
 * Anything not on KEEP is emptied AND disabled AND unscoped.
 */
import fs from 'node:fs';
import { callJson, callWrite } from './instatic-mcp.mjs';

const KEEP = new Set(['src/scripts/gsap-head-i.js', 'src/scripts/site.js']);
const keepPath = (p) =>
  KEEP.has(p) || (p.startsWith('src/scripts/jsonld/') && !p.includes('ztest'));

const list = await callJson('site_list_code_assets', {});
const assets = list.codeAssets || list.assets || list;
const dead = assets.filter((a) => a.type === 'script' && !keepPath(a.path));
const live = assets.filter((a) => a.type !== 'script' || keepPath(a.path));

console.log(`${assets.length} assets: ${live.length} kept, ${dead.length} to retire`);
console.log('KEEPING:', live.map((a) => a.path).join(', '));

const NOTE = (why) => `/* Retired 2026-08-19: ${why}\n   Emptied, disabled and unscoped. Instatic has no delete tool for code assets,\n   so this is as removed as it gets; delete by hand in the editor if you like. */\n`;

const why = (p) =>
  /\.html-inline-script-/.test(p) ? 'per-page inline script, superseded by src/scripts/site.js'
  : /zprobe|ztest|zs-|zp\d|zpnone|zsz|zqb|zraw|zrtcheck|zp0/.test(p) ? 'debugging probe, never part of the build'
  : /favicon-/.test(p) ? 'duplicate favicon shim'
  : /gsap-head-\w+\.js$|gsap-classic|gsap-umd|gsap-bootstrap|gsap-head\.js/.test(p) ? 'empty GSAP shim, superseded by src/scripts/gsap-head-i.js'
  : /pagekit-/.test(p) ? 'superseded by src/scripts/site.js'
  : 'superseded by src/scripts/site.js';

let ok = 0, skip = 0, fail = 0;
for (const [i, a] of dead.entries()) {
  if (a.runtime && a.runtime.enabled === false) { skip++; continue; }
  try {
    await callWrite('site_write_code_asset', {
      path: a.path, type: 'script', content: NOTE(why(a.path)),
      runtime: { enabled: false, runInCanvas: false, scope: { type: 'pages', pageIds: [] } },
    });
    ok++;
  } catch (e) { fail++; console.log(`  FAIL ${a.path}: ${e.message.slice(0, 120)}`); }
  if ((i + 1) % 25 === 0) console.log(`  ${i + 1}/${dead.length} (${ok} disabled, ${skip} already, ${fail} failed)`);
}
console.log(`\nretired ${ok}, already-off ${skip}, failed ${fail}`);

// verify by reading the list back
const after = await callJson('site_list_code_assets', {});
const arr = after.codeAssets || after.assets || after;
const stillOn = arr.filter((a) => a.runtime?.enabled !== false);
console.log(`\nstill enabled: ${stillOn.length}`);
for (const a of stillOn) console.log('  ' + a.path + '  ' + a.contentChars);
fs.writeFileSync('retire-verify.json', JSON.stringify(stillOn.map(a => a.path), null, 1));
