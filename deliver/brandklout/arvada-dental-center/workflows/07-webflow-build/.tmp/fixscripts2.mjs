/**
 * fixscripts2.mjs — stop the behaviour script binding twice per control.
 *
 * fixscripts.mjs namespaced the selectors, so `.imp-faq__q` finds elements
 * again. But Webflow copies an embedded element's class onto the `w-embed`
 * wrapper it generates, so `.imp-faq__q` matches BOTH the wrapper div and the
 * button inside it. Both get a click listener; the click on the button bubbles
 * to the wrapper; `item.classList.toggle('is-open')` therefore runs TWICE and
 * nets to nothing.
 *
 * The tell was precise: after namespacing, `aria-expanded` flipped to "true"
 * (so a handler was bound) while the panel height stayed 0 and a second click
 * left it "true" (so the class was toggled an even number of times). The CSS
 * was never at fault — `:scope .imp-faq__item.is-open .imp-faq__a{
 * grid-template-rows:1fr}` is present and correct.
 *
 * Fix: exclude the wrapper. `:not(.w-embed)` rather than `button.` because it
 * is about what the element IS, not what tag it happens to have, and it stays
 * right if a control is ever an <a> or a <label>.
 *
 * Which classes need it is read from the page, not hard-coded: any class that
 * appears on a `... w-embed` wrapper is duplicated and therefore ambiguous.
 *
 *   node fixscripts2.mjs [--apply]
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { callTool } from './wfmcp.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const SITE = '693c51e685b19f0d0c149cab';
const PAGES = {
  implants: { id: '6a79f2aeabc1d37969522293', slug: 'dental-implants-ads-landing' },
  aox: { id: '6a7a21d7f34df29a4defacdf', slug: 'all-on-x-ads-landing' },
  veneers: { id: '6a7a21fef87845352663538f', slug: 'porcelain-veneers-ads-landing' },
  emergency: { id: '6a7a223bf8c58b0aa0c6af2e', slug: 'emergency-dentist-ads-landing' },
  'dentist-near-me': { id: '6a7a2268da766fb28cddb149', slug: 'dentist-near-me-ads-landing' },
  'next-door': { id: '6a7a228d106ed97b8a7885c9', slug: 'next-door-family-ads-landing' },
};
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

/** Classes that appear on a generated w-embed wrapper, i.e. are duplicated. */
function duplicated(html) {
  const set = new Set();
  for (const m of html.matchAll(/class="([^"]*)\bw-embed\b([^"]*)"/g)) {
    `${m[1]} ${m[2]}`.trim().split(/\s+/)
      .filter((c) => c && c !== 'w-embed' && c !== 'w-script')
      .forEach((c) => set.add(c));
  }
  return set;
}

let changed = 0;
for (const [page, { id: pid, slug }] of Object.entries(PAGES)) {
  const html = readFileSync(join(HERE, 'staging', `${slug}.html`), 'utf8');
  const dupes = duplicated(html);

  const tree = await call('data_element_tool', {
    siteId: SITE, pageId: pid,
    context: 'Locating the nav-section script embed that carries the shared page behaviour.',
    actions: [{ label: 't', get_all_elements: { depth: -1 } }],
  }, (o) => o?.result?.[0]?.data);
  await sleep(1500);

  const embeds = [];
  (function walk(n, inNav) {
    const nav = inNav || (n.styleNames || []).some((s) => /sec-nav/.test(s));
    if (n.type === 'HtmlEmbed' && nav) embeds.push(n.id);
    (n.children || []).forEach((c) => walk(c, nav));
  })(tree, false);

  let target = null, code = null;
  for (const eid of embeds) {
    const ms = await call('data_element_settings_tool', {
      siteId: SITE, pageId: pid,
      context: 'Reading a nav-section embed to find the shared behaviour script.',
      actions: [{ label: 's', get_settings: { type: 'all_raw_settings', element_id: eid } }],
    }, (o) => o?.result?.[0]?.data?.matches);
    await sleep(1500);
    const c = ms.find((x) => x.key === 'code')?.value;
    const s = typeof c === 'string' ? c : '';
    if (s.includes('faq__q')) { target = eid; code = s; break; }
  }
  if (!target) { console.log(`${page}: no behaviour script found`); continue; }

  const SEL_CALL = /(\.(?:querySelectorAll|querySelector|closest|matches)\(\s*)(['"])([^'"]+)\2/g;
  const touched = new Set();
  const out = code.replace(SEL_CALL, (whole, head, q, sel) => {
    const next = sel.replace(/\.([A-Za-z_][\w-]*(?:__[\w-]+)?)(?!:not\(\.w-embed\))/g, (m, token) => {
      if (!dupes.has(token)) return m;
      touched.add(token);
      return `${m}:not(.w-embed)`;
    });
    return head + q + next + q;
  });
  if (out === code) { console.log(`${page}: nothing ambiguous, already fine`); continue; }
  console.log(`${page}: disambiguated [${[...touched].join(', ')}]`);
  if (!APPLY) { changed++; continue; }

  const status = await call('data_element_settings_tool', {
    siteId: SITE, pageId: pid,
    context: 'Writing back the behaviour script so each control binds once, not once per w-embed wrapper.',
    actions: [{ label: 'w', set_settings: { operations: [{ label: 'code', element_id: target,
      settings: [{ key: 'code', static_text: { value: out } }] }] } }],
  }, (o) => o?.result?.[0]?.status ?? null);
  console.log(`   ${status === 'success' ? 'WROTE' : 'FAILED'} ${out.length} chars`);
  if (status === 'success') changed++;
  await sleep(1500);
}
console.log(`\n${changed}/${Object.keys(PAGES).length} scripts ${APPLY ? 'rewritten' : 'to rewrite'}`);
