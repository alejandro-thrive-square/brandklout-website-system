#!/usr/bin/env node
/**
 * wf-tree-audit.mjs — audit the Webflow DESIGNER tree of one or more pages, not the published
 * HTML. This is where unpublished foreign content, emptied embeds and forked classes hide.
 *
 * Promoted 2026-09-23 and generalised from three client scripts:
 *   - stone-dental-implant-center/workflows/04-design/output/build/build_v2.py `verify`
 *     (re-read every HtmlEmbed's `code`, report empties)
 *   - arvada-dental-center/workflows/07-webflow-build/output/v2-native/extract-v1-sections.mjs
 *     (String.textContent + Image settings walk)
 *   - marvel-dental and legacy-dental-pasadena workflows/08-qa/output/gate.mjs (em dashes,
 *     another client's names, {{tokens}}, placeholders) — moved from the local HTML to the tree.
 *
 * WHY (stone-dental runbook 2026-09-03, gotchas 7, 13, 18, 19; livewell/legacy class forks)
 * - Other clients' sections get pasted in and sit unpublished in the Designer. A fetch of the
 *   live page cannot see them. Stone's thank-you page carried Arvada's FAQ and prices.
 * - An image's altText is a setting, not a text node. A text-only sweep reported Stone clean
 *   while a photo was captioned with another practice's doctor.
 * - Element operations can wipe an HtmlEmbed's `code`; a GHL form went live empty.
 * - whtml_builder with an inline style= or a redefined class mints `inline-section-N` /
 *   `<name>-1` classes; pasting forks `<name> 2` twins.
 * - An en dash inside a phone number stops the GHL number pool from swapping it.
 *
 * BLIND SPOT: rich-text internals are absent from get_all_elements. For a string that must be
 * gone everywhere (a retired phone number, another practice's name), also sweep with
 * data_element_tool query_elements { element_filter: { text } } (arvada v2-native/phone-sweep.mjs).
 *
 * USAGE (read-only; site id from the client docs/mcp-access.md)
 *   node wf-tree-audit.mjs --site <id> --pages <pageId,pageId|slugFragment|all>
 *        [--foreign "arvada,bennett,livewell"] [--foreign-prefixes "lw-,imp-,camp_"]
 *        [--phone 8173838361] [--no-embeds] [--out output/tree-audit.json]
 *   > output/tree-audit.log 2>&1
 * --foreign: names of OTHER clients, doctors, towns. Always pass them.
 * --phone:   the digits this page set must use; any other 10-digit number is reported.
 * Exit 1 on any FAIL.
 */
import fs from 'node:fs';
import { call, result } from './wf.mjs';

const argv = process.argv.slice(2);
const flag = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const site = flag('site') || process.env.WF_SITE_ID;
const want = String(flag('pages', '')).split(',').filter(Boolean);
if (!site || !want.length) { console.error('usage: wf-tree-audit.mjs --site <id> --pages <ids|slugFragment|all> [...]'); process.exit(2); }
const foreign = String(flag('foreign', '')).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const prefixes = String(flag('foreign-prefixes', '')).split(',').map((s) => s.trim()).filter(Boolean);
const phone = flag('phone') ? String(flag('phone')).replace(/\D/g, '').slice(-10) : null;
const readEmbeds = !argv.includes('--no-embeds');

const pages = [];
for (let offset = 0; ; offset += 100) {
  const r = result(await call('data_pages_tool', [{ label: 'p', list_pages: { limit: 100, offset } }], { site }));
  const batch = r.pages || r || [];
  pages.push(...batch);
  if (batch.length < 100) break;
}
const targets = want.includes('all') ? pages
  : pages.filter((p) => want.includes(p.id) || want.some((w) => (p.slug || '').includes(w) || (p.publishedPath || '').includes(w)));
if (!targets.length) { console.error('no page matched --pages'); process.exit(2); }

const PHONE_RE = /\(?\b\d{3}\)?[\s.\-–—]?\d{3}[\s.\-–—]\d{4}\b/g;
const findings = [];
let fails = 0;

for (const pg of targets) {
  const where = pg.publishedPath || '/' + pg.slug;
  const add = (level, what, detail) => { if (level === 'FAIL') fails++; findings.push({ page: where, pageId: pg.id, level, what, detail }); };
  const tree = await call('data_element_tool', [{ label: 't', get_all_elements: {} }], { site, page: pg.id });
  const root = result(tree)?.[0]?.data ?? result(tree)?.data;
  if (!root) { add('FAIL', 'tree', 'could not read the element tree'); continue; }

  const embeds = [];
  const classes = new Set();
  const check = (text, kind) => {
    if (!text) return;
    const low = text.toLowerCase();
    for (const f of foreign) if (low.includes(f)) add('FAIL', `foreign name in ${kind}`, `"${f}" in: ${text.slice(0, 90)}`);
    if (text.includes('—')) add('FAIL', `em dash in ${kind}`, text.slice(0, 90));
    if (/lorem ipsum/i.test(text)) add('FAIL', `placeholder in ${kind}`, text.slice(0, 90));
    if (/\{\{[^}]*\}\}|REPLACE_WITH|TODO|XXX-XXX/.test(text)) add('FAIL', `unfilled token in ${kind}`, text.slice(0, 90));
    for (const m of text.match(PHONE_RE) || []) {
      if (/[–—]/.test(m)) add('FAIL', 'dash in phone number (DNI cannot swap it)', m);
      const d = m.replace(/\D/g, '');
      if (phone && d.length === 10 && d !== phone) add('WARN', `other phone number in ${kind}`, m);
    }
  };
  (function walk(n) {
    for (const c of n.styleNames || []) classes.add(c);
    if (n.type === 'String') check(n.textContent, 'text');
    if (n.type === 'Image') {
      const alt = n.settings?.altText;
      check(alt, 'altText');
      if (!alt) add('WARN', 'image without alt text', (n.styleNames || []).join('.') || n.id?.element);
    }
    if (n.attributes?.href) check(n.attributes.href, 'href');
    if (n.settings?.link?.href) check(n.settings.link.href, 'link setting');
    for (const p of n.instanceDetails?.props || []) if (typeof p.value === 'string') check(p.value, `component prop "${p.name}"`);
    if (n.type === 'HtmlEmbed') embeds.push(n);
    for (const c of n.children || []) walk(c);
  })(root);

  for (const c of classes) {
    if (prefixes.some((p) => c.startsWith(p))) add('FAIL', 'foreign class prefix', c);
    if (/^inline-section-\d+$/.test(c)) add('FAIL', 'builder-minted inline class (inline style= was passed)', c);
    const webflowDefault = /^(Section|Div Block|Text Block|Text Span|Link Block|Heading|Paragraph|Container|Image|Button|Grid|Columns|Form Block|Rich Text Block|Quick Stack|Cell) \d+$/;
    if (/ \d+$/.test(c) && !webflowDefault.test(c)) add('WARN', 'forked class twin (paste merge by name)', c);
  }

  if (readEmbeds) {
    for (const e of embeds) {
      const r = await call('data_element_settings_tool',
        [{ label: 'code', get_settings: { type: 'all_raw_settings', element_id: e.id } }], { site, page: pg.id });
      const kv = Object.fromEntries((result(r)?.[0]?.data?.matches || []).map((m) => [m.key, m.value]));
      const code = kv.code || '';
      const tag = (e.styleNames || []).join('.') || e.id.element;
      if (!code.trim()) add('FAIL', 'empty HtmlEmbed', tag);
      else check(code.replace(/<[^>]+>/g, ' '), 'embed');
      if (code.length > 10000) add('WARN', 'embed over 10,000 chars (Designer cannot edit it)', `${tag} ${code.length}`);
    }
  }
  console.log(`${where}: ${classes.size} classes, ${embeds.length} embeds`);
}

for (const f of findings) console.log(`${f.level.padEnd(4)}  ${f.page}  ${f.what}: ${f.detail}`);
const out = flag('out');
if (out && out !== true) fs.writeFileSync(out, JSON.stringify(findings, null, 1));
console.log(fails ? `\nFAIL (${fails})` : `\nPASS (${findings.length} warnings)`);
process.exit(fails ? 1 : 0);
