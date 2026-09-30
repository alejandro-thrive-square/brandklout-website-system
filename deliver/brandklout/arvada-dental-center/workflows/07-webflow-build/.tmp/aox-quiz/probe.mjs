#!/usr/bin/env node
/**
 * probe.mjs — what does data_whtml_builder do with a fragment? Inserts it into a
 * DRAFT scratch page (never published), prints the builder's own report and the
 * resulting element tree, then removes it again.
 *
 *   node probe.mjs <fragment.html> [fragment.css] [--keep]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wf, must, SITE } from './wfq.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const STATE = join(HERE, 'probe-page.json');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const KEEP = process.argv.includes('--keep');

let st = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : null;
if (!st) {
  const [r] = must(await wf('data_pages_tool', [{ label: 'create', create_page: { site_id: SITE, title: 'AQ build probe (draft, safe to delete)', slug: 'aq-build-probe', draft: true } }]), 'create probe page');
  st = { pageId: r.result?.id ?? r.result?.page?.id };
  writeFileSync(STATE, JSON.stringify(st));
}
const [tree] = must(await wf('data_element_tool', [{ label: 'tree', get_all_elements: { depth: 0 } }], { pageId: st.pageId }), 'tree');
const body = tree.result[0].data.id;

const html = readFileSync(args[0], 'utf8');
const css = args[1] ? readFileSync(args[1], 'utf8') : undefined;
const res = await wf('data_whtml_builder', [{ build_label: 'probe', parent_element_id: body, creation_position: 'append', html, ...(css ? { css } : {}), return_element_info: true }], { pageId: st.pageId });
console.log('=== builder');
console.log(JSON.stringify(res, null, 1).slice(0, 6000));

const [after] = await wf('data_element_tool', [{ label: 'tree', get_all_elements: { depth: -1 } }], { pageId: st.pageId });
console.log('=== tree');
const walk = (n, d = 0) => {
  if (!n || typeof n !== 'object') return;
  if (n.type) console.log('  '.repeat(d) + [n.type, n.tag ?? '', (n.styles ?? n.style_names ?? []).map?.((s) => s.name ?? s).join('.') ?? '', n.domId ? '#' + n.domId : '', n.text ? JSON.stringify(String(n.text).slice(0, 40)) : '', n.attributes ? JSON.stringify(n.attributes).slice(0, 120) : ''].filter(Boolean).join(' '));
  for (const c of n.children ?? []) walk(c, d + 1);
};
const root = after.result?.[0]?.data;
walk(root);
if (process.argv.includes('--raw')) console.log(JSON.stringify(root, null, 1).slice(0, 8000));

if (!KEEP) {
  for (const c of root?.children ?? []) await wf('data_element_tool', [{ label: 'rm', remove_element: { id: c.id } }], { pageId: st.pageId });
  console.log('=== removed');
}
