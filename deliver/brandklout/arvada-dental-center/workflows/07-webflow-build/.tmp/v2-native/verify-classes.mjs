#!/usr/bin/env node
/**
 * verify-classes.mjs — the class-layer gate.
 *
 * Reads camp.css, reads the site, and asserts every declaration actually
 * landed, at every breakpoint. This is not a formality: whtml_builder drops
 * things silently (a colliding combo name, a font it thinks is missing, a
 * value it cannot parse) and reports `success` while doing it.
 *
 * Webflow does not store CSS verbatim — it expands shorthands and normalises
 * values — so the comparison happens after the same expansion here.
 *
 *   node verify-classes.mjs [--verbose]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { call, SITES } from './wf.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CSS_FILE = path.resolve(HERE, '../../../04-design/.tmp/v2/_shared/camp.css');
const PAGE = '6a83e962d17d0bfe618c49f7';
const VERBOSE = process.argv.includes('--verbose');

const MEDIA_TO_BREAKPOINT = {
  'screen and (max-width: 991px)': 'medium',
  'screen and (max-width: 767px)': 'small',
  'screen and (max-width: 479px)': 'tiny',
};

/* ------------------------------------------------------- shorthand expand -- */

const SIDES = ['top', 'right', 'bottom', 'left'];

function sides(value) {
  const p = value.trim().split(/\s+/);
  const [t, r, b, l] = p.length === 1 ? [p[0], p[0], p[0], p[0]]
    : p.length === 2 ? [p[0], p[1], p[0], p[1]]
      : p.length === 3 ? [p[0], p[1], p[2], p[1]]
        : p;
  return [t, r, b, l];
}

/** Expand one declaration the way Webflow stores it. */
function expand(prop, value) {
  const out = {};
  if (prop === 'margin' || prop === 'padding') {
    sides(value).forEach((v, i) => { out[`${prop}-${SIDES[i]}`] = v; });
  } else if (prop === 'gap' || prop === 'grid-gap') {
    const p = value.trim().split(/\s+/);
    out['grid-row-gap'] = p[0];
    out['grid-column-gap'] = p[1] || p[0];
  } else if (prop === 'border') {
    const m = value.match(/^(\S+)\s+(\S+)\s+(.+)$/);
    if (m) for (const s of SIDES) {
      out[`border-${s}-width`] = m[1]; out[`border-${s}-style`] = m[2]; out[`border-${s}-color`] = m[3];
    }
  } else if (/^border-(top|right|bottom|left)$/.test(prop)) {
    const s = prop.split('-')[1];
    const m = value.match(/^(\S+)\s+(\S+)\s+(.+)$/);
    if (m) { out[`border-${s}-width`] = m[1]; out[`border-${s}-style`] = m[2]; out[`border-${s}-color`] = m[3]; }
  } else if (prop === 'border-color') {
    for (const s of SIDES) out[`border-${s}-color`] = value;
  } else if (prop === 'border-radius') {
    for (const c of ['top-left', 'top-right', 'bottom-left', 'bottom-right']) out[`border-${c}-radius`] = value;
  } else if (prop === 'overflow') {
    out['overflow-x'] = value; out['overflow-y'] = value;
  } else if (prop === 'font-family') {
    // Webflow keeps only the first family and drops the fallback stack.
    out['font-family'] = value.split(',')[0].trim();
  } else {
    out[prop] = value;
  }
  return out;
}

function norm(v) {
  return String(v).trim().toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/,\s+/g, ',')
    .replace(/^0(px|em|rem|%)$/, '0px')
    .replace(/^\.(\d)/, '0.$1');
}

/** Values Webflow legitimately reports differently from what was sent. */
function equivalent(want, got) {
  if (norm(want) === norm(got)) return true;
  const w = norm(want), g = norm(got);
  if (w.replace(/0px/g, '0') === g.replace(/0px/g, '0')) return true;
  // #fff vs #ffffff
  const hex = (s) => s.replace(/#([0-9a-f])([0-9a-f])([0-9a-f])\b/g, '#$1$1$2$2$3$3');
  if (hex(w) === hex(g)) return true;
  // unitless zero / trailing zeros on decimals
  if (parseFloat(w) === parseFloat(g) && /^[\d.]+(px|em|rem|%)?$/.test(w) && /^[\d.]+(px|em|rem|%)?$/.test(g)) return true;
  return false;
}

/* -------------------------------------------------------------- parse css -- */

const css = fs.readFileSync(CSS_FILE, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
/** selector -> breakpoint -> {prop: value} */
const want = new Map();

function put(sel, bp, decls) {
  if (!want.has(sel)) want.set(sel, {});
  const byBp = want.get(sel);
  byBp[bp] = byBp[bp] || {};
  for (const [p, v] of decls) Object.assign(byBp[bp], expand(p, v));
}

function collect(block, bp) {
  for (const m of block.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = m[1].trim();
    if (!selector || selector.startsWith('@')) continue;
    const decls = m[2].split(';').map((d) => d.trim()).filter(Boolean)
      .map((d) => { const i = d.indexOf(':'); return [d.slice(0, i).trim(), d.slice(i + 1).trim()]; });
    if (!decls.length) continue;
    for (const sel of selector.split(',').map((s) => s.trim())) put(sel, bp, decls);
  }
}

let flat = css;
for (const m of css.matchAll(/@media([^{]+)\{([\s\S]*?)\n\}/g)) {
  collect(m[2], MEDIA_TO_BREAKPOINT[m[1].trim()]);
  flat = flat.replace(m[0], '');
}
collect(flat, 'main');

/* ------------------------------------------------------------- read site -- */

const selectors = [...want.keys()];
const queries = selectors.map((sel) => {
  const parts = sel.replace(/:[\w-]+$/, '').split('.').filter(Boolean);
  return {
    label: sel,
    name_path: parts,
    include_properties: true,
    include_breakpoints: ['main', 'medium', 'small', 'tiny'],
    include_base_pseudos: ['hover'],
    limit: 5,
  };
});

const got = new Map();
for (let i = 0; i < queries.length; i += 40) {
  const res = call('data_style_tool', [{ label: 'q', query_styles: { queries: queries.slice(i, i + 40) } }],
    { site: SITES.arvada, page: PAGE });
  for (const r of res.result || []) {
    const target = r.label.replace(/:[\w-]+$/, '');
    const m = (r.matches || []).find((x) => x.selector === target);
    if (m) got.set(r.label, m);
  }
}

/* ---------------------------------------------------------------- compare -- */

const problems = [];
let checked = 0;

for (const [sel, byBp] of want) {
  const style = got.get(sel);
  if (!style) { problems.push(`MISSING STYLE  ${sel}`); continue; }
  const pseudo = (sel.match(/:([\w-]+)$/) || [])[1];

  for (const [bp, props] of Object.entries(byBp)) {
    const have = pseudo
      ? style.properties?.base?.pseudos?.[pseudo] || {}
      : (bp === 'main'
        ? style.properties?.base?.properties || {}
        : style.properties?.breakpoints?.[bp]?.properties || {});

    for (const [p, v] of Object.entries(props)) {
      checked++;
      if (!(p in have)) { problems.push(`MISSING PROP   ${sel} @${bp}  ${p}: ${v}`); continue; }
      if (!equivalent(v, have[p])) problems.push(`WRONG VALUE    ${sel} @${bp}  ${p}: want ${v}  got ${have[p]}`);
    }
  }
}

console.log(`camp.css: ${selectors.length} selectors, ${checked} declarations checked against the site`);
if (VERBOSE) for (const s of selectors) if (!got.has(s)) console.log('  no style for ' + s);
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log('  ' + p);
  process.exit(1);
}
console.log('\nOK — every declaration in camp.css is present on the site at every breakpoint.');
