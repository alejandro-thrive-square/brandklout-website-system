#!/usr/bin/env node
/**
 * extras.mjs — properties the SITE holds that Marvel's stylesheet does not.
 *
 * apply-classes only writes what the stylesheet says. Anything Arvada left
 * behind on a shared class stays, invisible to a value-by-value diff — and
 * `display: none` on the announce bar is exactly that: the bar is on all three
 * pages, correct in the local render, and not on screen.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { call, SITES } from './wf.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHARED = path.resolve(HERE, '../../../04-design/.tmp/v1/_shared');
const PAGE = '6a875326a493a891fd87d30a';
const BP = { 991: 'medium', 767: 'small', 479: 'tiny' };
const ORDER = ['main', 'medium', 'small', 'tiny'];

const local = new Map();
const put = (sel, bp, prop) => { if (!local.has(sel)) local.set(sel, {}); ((local.get(sel))[bp] ||= new Set()).add(prop); };
const read = (css, bp) => {
  for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g))
    for (const sel of m[1].split(',').map((x) => x.trim()).filter(Boolean)) {
      if (!sel.startsWith('.camp')) continue;
      for (const d of m[2].split(';')) { const i = d.indexOf(':'); if (i > 0) put(sel, bp, d.slice(0, i).trim()); }
    }
};
for (const f of ['camp.css', 'camp-convert.css', 'camp-sections.css']) {
  const css = fs.readFileSync(path.join(SHARED, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/@media screen and \(max-width: (\d+)px\) \{([\s\S]*?)\n\}/g)) read(m[2], BP[m[1]]);
  read(css.replace(/@media[\s\S]*$/, ''), 'main');
}

// a shorthand in the source stands in for the longhands Webflow stores
const FAMILY = (p) => p.replace(/^(padding|margin|border|overflow|flex|grid|background|font|box-shadow)[-a-z]*$/, '$1');

const query = (needle) => call('data_style_tool', [{ label: needle, query_styles: { queries: [{ label: needle, name_path: [needle], limit: 200, include_properties: true, include_breakpoints: ORDER }] } }], { site: SITES.legacy, page: PAGE })?.result?.[0]?.matches || [];
const matches = [...query('camp'), ...query('is-')];

const rows = [];
for (const m of matches) {
  const key = [...local.keys()].find((s) => s === m.selector || m.selector.endsWith(s));
  if (!key) continue;
  for (const bp of ORDER) {
    const have = (bp === 'main' ? m.properties?.base?.properties : m.properties?.breakpoints?.[bp]?.properties) || {};
    const want = local.get(key)[bp] || new Set();
    const wantFam = new Set([...want].map(FAMILY));
    const extra = Object.keys(have).filter((p) => !want.has(p) && !wantFam.has(FAMILY(p)));
    if (extra.length) rows.push({ selector: m.selector, name: m.name, combo: m.isComboClass, bp, extra: extra.map((p) => `${p}: ${have[p]}`) });
  }
}
fs.writeFileSync(path.join(HERE, 'class-extras.json'), JSON.stringify(rows, null, 1));
console.log(`${rows.length} rule(s) carry properties the stylesheet does not, ${rows.reduce((n, r) => n + r.extra.length, 0)} declaration(s)`);
for (const r of rows.slice(0, 20)) console.log(`  ${r.selector} @${r.bp}: ${r.extra.join(', ').slice(0, 150)}`);
