/**
 * fixscripts.mjs — namespace the selectors in the shared behaviour script.
 *
 * THE DEFECT. The packager renames every class to a page-prefixed one and
 * rewrites the selector strings inside the chapter scripts to match. It missed
 * the nav section's `section-js` embed, which carries the WZSR runtime AND all
 * the shared page behaviour. So on every page:
 *     root.querySelectorAll('.faq__q')      // elements are .imp-faq__q
 * matches nothing, forEach does nothing, and the feature is silently dead —
 * the FAQ accordion, the lead-capture quiz, form validation and the magnetic
 * buttons, on all six pages. Nothing throws. The style gate passes, the copy
 * gate passes, the link gate passes.
 *
 * THE RULE FOR WHAT TO RENAME. Only a class that HAS a prefixed counterpart in
 * the published page. That matters:
 *   - `.faq__q`, `.quiz`, `.field`, `.magnetic` … exist as `imp-*`  -> rename.
 *   - `is-open` and `is-bad` are STATE classes. The packager deliberately left
 *     them bare (the CSS keeps them as scope conditions), so renaming them
 *     would break the very toggles this script drives -> leave alone.
 * Deriving the rule from the DOM rather than a hand-list means it cannot rot.
 *
 * Only selector-string ARGUMENTS are rewritten, never the whole script:
 * `document.head`, `s.nav` and similar property accesses look identical to a
 * naive `.token` regex and must not be touched.
 *
 *   node fixscripts.mjs [--apply]
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { callTool } from './wfmcp.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const SITE = '693c51e685b19f0d0c149cab';
const PAGES = {
  implants: { id: '6a79f2aeabc1d37969522293', slug: 'dental-implants-ads-landing', pfx: 'imp' },
  aox: { id: '6a7a21d7f34df29a4defacdf', slug: 'all-on-x-ads-landing', pfx: 'aox' },
  veneers: { id: '6a7a21fef87845352663538f', slug: 'porcelain-veneers-ads-landing', pfx: 'vnr' },
  emergency: { id: '6a7a223bf8c58b0aa0c6af2e', slug: 'emergency-dentist-ads-landing', pfx: 'emg' },
  'dentist-near-me': { id: '6a7a2268da766fb28cddb149', slug: 'dentist-near-me-ads-landing', pfx: 'dnm' },
  'next-door': { id: '6a7a228d106ed97b8a7885c9', slug: 'next-door-family-ads-landing', pfx: 'nxd' },
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

/** Rewrite class tokens inside selector-string arguments only. */
function namespaceSelectors(code, pfx, html) {
  const SEL_CALL = /(\.(?:querySelectorAll|querySelector|closest|matches)\(\s*)(['"])([^'"]+)\2/g;
  const renamed = new Set();
  const out = code.replace(SEL_CALL, (whole, head, q, sel) => {
    const next = sel.replace(/\.([A-Za-z_][\w-]*(?:__[\w-]+)?)/g, (m, token) => {
      if (token.startsWith(`${pfx}-`)) return m;                 // already done
      // WORD-BOUNDED. A bare `includes` is a substring test, so `vnr-quiz`
      // "exists" on a page whose only match is `vnr-quiz__opt` — which renamed
      // `.quiz` on three pages that have no quiz container at all. Harmless
      // there (dead before, dead after) but it is not a check, it is a
      // coincidence.
      if (!new RegExp(`\\b${pfx}-${token}\\b`).test(html)) return m;
      renamed.add(token);
      return `.${pfx}-${token}`;
    });
    return head + q + next + q;
  });
  return { out, renamed: [...renamed] };
}

let changed = 0;
for (const [page, { id: pid, slug, pfx }] of Object.entries(PAGES)) {
  const html = readFileSync(join(HERE, 'staging', `${slug}.html`), 'utf8');

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
  if (!target) { console.log(`${page}: no behaviour script found among ${embeds.length} nav embeds`); continue; }

  const { out, renamed } = namespaceSelectors(code, pfx, html);
  if (out === code) { console.log(`${page}: already namespaced, nothing to do`); continue; }
  console.log(`${page}: ${renamed.length} classes -> ${pfx}-  [${renamed.join(', ')}]`);
  if (!APPLY) { changed++; continue; }

  const status = await call('data_element_settings_tool', {
    siteId: SITE, pageId: pid,
    context: 'Writing the namespaced behaviour script back so the FAQ, quiz and form validation bind again.',
    actions: [{ label: 'w', set_settings: { operations: [{ label: 'code', element_id: target,
      settings: [{ key: 'code', static_text: { value: out } }] }] } }],
  }, (o) => o?.result?.[0]?.status ?? null);
  console.log(`   ${status === 'success' ? 'WROTE' : 'FAILED'} ${out.length} chars`);
  if (status === 'success') changed++;
  await sleep(1500);
}
console.log(`\n${changed}/${Object.keys(PAGES).length} scripts ${APPLY ? 'rewritten' : 'to rewrite'}`);
