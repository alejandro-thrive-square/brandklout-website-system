/**
 * fixtermsanchor.mjs — the "see terms" link inside the form embed.
 *
 * fixanchors.mjs repointed 27 in-page anchors by walking Link ELEMENTS. Two
 * survived: on dentist-near-me and next-door the form is a raw HtmlEmbed, so
 * its `<a href="#terms">see terms</a>` is markup inside the embed's code, not a
 * Webflow Link element — invisible to an element walk.
 *
 * The embed is found by its style name (`<pfx>-form`), which Webflow copies
 * onto the generated wrapper, rather than by reading every embed on the page:
 * that costs one settings read instead of fifty against a 60/min rate limit.
 *
 *   node fixtermsanchor.mjs [--apply]
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { callTool } from './wfmcp.mjs';

const SITE = '693c51e685b19f0d0c149cab';
const JOBS = [
  { page: 'dentist-near-me', pid: '6a7a2268da766fb28cddb149', pfx: 'dnm' },
  { page: 'next-door', pid: '6a7a228d106ed97b8a7885c9', pfx: 'nxd' },
];
const APPLY = process.argv.includes('--apply');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(tool, args, pick) {
  for (let i = 0; i < 8; i++) {
    const r = await callTool(tool, args);
    let v;
    try { v = pick(JSON.parse(r.text)); } catch { v = undefined; }
    if (v !== undefined && v !== null) return v;
    const limited = /\b429\b/.test(r.text);
    process.stderr.write(`   …${limited ? '429' : 'no data'}, waiting\n`);
    await sleep(limited ? 20000 : 2500);
  }
  throw new Error(`no usable response from ${tool}`);
}

let fixed = 0;
for (const { page, pid, pfx } of JOBS) {
  const tree = await call('data_element_tool', {
    siteId: SITE, pageId: pid,
    context: 'Locating the form embed whose markup holds an in-page anchor that no longer resolves.',
    actions: [{ label: 't', get_all_elements: { depth: -1 } }],
  }, (o) => o?.result?.[0]?.data);
  await sleep(1200);

  const candidates = [];
  (function walk(n) {
    if (n.type === 'HtmlEmbed' && (n.styleNames || []).some((s) => s === `${pfx}-form`)) candidates.push(n.id);
    (n.children || []).forEach(walk);
  })(tree);
  console.log(`##### ${page}: ${candidates.length} form embed(s)`);

  for (const eid of candidates) {
    const ms = await call('data_element_settings_tool', {
      siteId: SITE, pageId: pid,
      context: 'Reading the form embed markup to repoint its terms anchor.',
      actions: [{ label: 's', get_settings: { type: 'all_raw_settings', element_id: eid } }],
    }, (o) => o?.result?.[0]?.data?.matches);
    await sleep(1200);
    const code = ms.find((x) => x.key === 'code')?.value;
    if (typeof code !== 'string' || !code.includes('href="#terms"')) continue;

    const out = code.replaceAll('href="#terms"', `href="#${pfx}-terms"`);
    console.log(`   found: ${(code.match(/href="#terms"/g) || []).length} occurrence(s)`);
    if (!APPLY) { fixed++; continue; }
    const status = await call('data_element_settings_tool', {
      siteId: SITE, pageId: pid,
      context: 'Writing back the form embed with its terms anchor pointing at the renamed id.',
      actions: [{ label: 'w', set_settings: { operations: [{ label: 'code', element_id: eid,
        settings: [{ key: 'code', static_text: { value: out } }] }] } }],
    }, (o) => o?.result?.[0]?.status ?? null);
    console.log(`   ${status === 'success' ? 'WROTE' : 'FAILED'}`);
    if (status === 'success') fixed++;
    await sleep(1200);
  }
}
console.log(`\n${fixed} embed(s) ${APPLY ? 'patched' : 'to patch'}`);
