/**
 * faqnative.mjs — replace each FAQ Code Embed with a native button element.
 *
 * WHAT IS WRONG
 * -------------
 * The packager shipped every accordion question as an HtmlEmbed:
 *
 *   div.faq__item > h3 > div.faq__q.w-embed  ->  <button class="faq__q" …>
 *
 * A Code Embed inside a Heading. It renders and, since the pseudo-element and
 * state-rule fixes, it behaves — but in the Designer the row is an opaque
 * code block, so the client cannot edit their own FAQ copy, and the h3 has no
 * text of its own. The design's markup is plain:
 *
 *   <h3><button class="faq__q" aria-controls="fq1" aria-expanded="false">…</button></h3>
 *
 * WHAT THIS DOES
 * --------------
 * Per row: create a real <button> as a child of the h3 (BY_CUSTOM_TAG, so it
 * is a genuine button element rather than Webflow's Button, which is an <a>),
 * carry over the class and both aria attributes, write the question as text,
 * VERIFY the text landed, and only then delete the embed. If any step fails
 * the embed stays and the row is reported — a half-converted row would be a
 * question with no text.
 *
 * The accordion script binds to `.<pfx>-faq__q:not(.w-embed)`, which the new
 * button matches and the old wrapper did not, so the wiring survives the swap.
 *
 *   node faqnative.mjs            # dry run, all six pages
 *   node faqnative.mjs --apply    # convert
 *   node faqnative.mjs --apply --page implants --limit 1
 */
import { callTool } from './wfmcp.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
// indexOf returns -1 when the flag is absent, and argv[0] is the node binary —
// truthy, so an unguarded lookup silently filters every page out and the run
// reports "0 rows" as if the work were already done.
const ONLY = process.argv.includes('--page')
  ? process.argv[process.argv.indexOf('--page') + 1] : null;
const LIMIT = process.argv.includes('--limit')
  ? Number(process.argv[process.argv.indexOf('--limit') + 1]) : Infinity;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * A 429 comes back as a success-shaped envelope with no data, so "no data" is
 * never evidence of nothing to do — it is retried, and exhaustion throws.
 */
async function call(tool, args, pick) {
  for (let i = 0; i < 8; i++) {
    const r = await callTool(tool, args);
    let v; try { v = pick(JSON.parse(r.text)); } catch { v = undefined; }
    if (v !== undefined && v !== null) return v;
    const lim = /\b429\b/.test(r.text);
    process.stderr.write(`      …${lim ? '429' : 'no data'}, waiting\n`);
    await sleep(lim ? 20000 : 3000);
  }
  throw new Error('no usable response from ' + tool);
}

/** Published-page buttons, in document order — the source of truth for copy. */
function questionsFromStaging(slug, pfx) {
  const html = readFileSync(join(HERE, 'staging', `${slug}.html`), 'utf8');
  const out = [];
  const re = new RegExp(`<button[^>]*class="[^"]*${pfx}-faq__q[^"]*"[^>]*>([\\s\\S]*?)</button>`, 'g');
  for (const m of html.matchAll(re)) {
    const tag = m[0].slice(0, m[0].indexOf('>') + 1);
    const controls = /aria-controls="([^"]+)"/.exec(tag)?.[1];
    // Entity-decode; the questions contain apostrophes and en dashes.
    const text = m[1].replace(/<[^>]+>/g, '')
      .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ').trim();
    out.push({ controls, text });
  }
  return out;
}

/** Flatten the tree, keeping each node's parent. ids are {component,element}. */
function index(root) {
  const byId = new Map();
  (function walk(n, parent) {
    if (!n?.id) return;
    byId.set(n.id.element, { node: n, parent });
    (n.children || []).forEach((c) => walk(c, n));
  })(root, null);
  return byId;
}

let converted = 0, failed = 0, skipped = 0;
for (const [page, cfg] of Object.entries(PAGES)) {
  if (ONLY && ONLY !== page) continue;
  console.log(`\n=== ${page} ===`);
  const qs = questionsFromStaging(cfg.slug, cfg.pfx);

  const body = await call('data_element_tool', { siteId: SITE, pageId: cfg.id,
    context: 'Reading the FAQ rows before replacing their Code Embeds with native buttons.',
    actions: [{ label: 't', get_all_elements: {} }] }, (o) => o?.result?.[0]?.data);
  await sleep(1200);
  const byId = index(body);

  // The embed rows, in tree order — same document order as the staging buttons.
  const rows = [];
  for (const [, { node, parent } ] of byId) {
    if (node.type !== 'HtmlEmbed') continue;
    if (!(node.styleNames || []).some((s) => s === `${cfg.pfx}-faq__q`)) continue;
    rows.push({ embed: node.id, h3: parent?.id, h3Tag: parent?.settings?.tag });
  }

  if (rows.length !== qs.length) {
    console.log(`  MISMATCH: ${rows.length} embeds in the tree vs ${qs.length} buttons on the published page — not touching this page.`);
    failed += Math.max(rows.length, qs.length);
    continue;
  }
  console.log(`  ${rows.length} rows`);

  for (let i = 0; i < rows.length && i < LIMIT; i++) {
    const r = rows[i], q = qs[i];
    if (r.h3Tag !== 'h3') { console.log(`  ${i + 1}. parent is ${r.h3Tag}, not h3 — skipped`); skipped++; continue; }
    console.log(`  ${i + 1}. ${JSON.stringify(q.text.slice(0, 58))}  -> #${q.controls}`);
    if (!APPLY) continue;

    // 1. the native button, with class and both aria attributes in one shot
    const made = await call('data_element_builder', { siteId: SITE, pageId: cfg.id,
      context: 'Replacing an FAQ Code Embed with a native button so the question is editable in the Designer.',
      actions: [{ build_label: 'btn', parent_element_id: r.h3, creation_position: 'append',
        element_schema: { type: 'BY_CUSTOM_TAG', custom_tag: 'button',
          set_style: { style_names: [`${cfg.pfx}-faq__q`] },
          set_attributes: { attributes: [
            { name: 'aria-controls', value: q.controls },
            { name: 'aria-expanded', value: 'false' }] } } }] },
      (o) => o?.result?.[0] ?? null);
    const newId = made?.data?.id || made?.id || made?.element?.id;
    if (!newId?.element) { console.log(`     CREATE FAILED: ${JSON.stringify(made).slice(0, 300)}`); failed++; continue; }
    await sleep(1200);

    // 2. the question copy. A DOM element takes text through set_settings, not
    //    set_text — set_text silently no-ops on anything that is not one of
    //    Webflow's own text types.
    await call('data_element_settings_tool', { siteId: SITE, pageId: cfg.id,
      context: 'Writing the FAQ question onto the new native button.',
      actions: [{ label: 'txt', set_settings: { operations: [{ label: 'w', element_id: newId,
        settings: [{ key: 'text', static_text: { value: q.text } }] }] } }] },
      (o) => o?.result?.[0]?.status ?? null);
    await sleep(1200);

    // 3. did the copy actually land? "partial_success" has lied before, and a
    //    button with no text is worse than the embed it replaced.
    const back = await call('data_element_tool', { siteId: SITE, pageId: cfg.id,
      context: 'Confirming the question text is on the new button before deleting the embed.',
      actions: [{ label: 'q', query_elements: { queries: [{ label: 'h3',
        element_id: r.h3, children_depth: -1 }] } }] }, (o) => o?.result?.[0]?.data ?? null);
    const flat = JSON.stringify(back);
    const ok = flat.includes(q.text.slice(0, 24).replace(/"/g, '\\"'));
    if (!ok) {
      console.log(`     TEXT DID NOT LAND — leaving the embed in place. New button ${newId.element.slice(-8)} is empty; delete it by hand or re-run.`);
      failed++; await sleep(1200); continue;
    }
    await sleep(1200);

    // 4. only now is the embed redundant
    const del = await call('data_element_tool', { siteId: SITE, pageId: cfg.id,
      context: 'Deleting the FAQ Code Embed now that a native button carries the question.',
      actions: [{ label: 'rm', remove_element: { id: r.embed } }] },
      (o) => o?.result?.[0]?.status ?? null);
    if (del !== 'success') { console.log(`     embed delete: ${del}`); failed++; }
    else { console.log(`     converted`); converted++; }
    await sleep(1200);
  }
}
console.log(`\n${APPLY ? 'converted' : 'would convert'} ${converted}  failed ${failed}  skipped ${skipped}`);
