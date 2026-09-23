#!/usr/bin/env node
/**
 * sync-combos.mjs — reconcile every combo rule in camp.css against Webflow.
 *
 * WHY THIS EXISTS
 * ---------------
 * data_whtml_builder creates a combo class from `.base.combo`, but only ONCE
 * PER COMBO NAME. When the same `is-*` name is used on more than one base
 * class, the first rule in source order wins and the rest are silently
 * dropped — no warning, no error, and the page then renders with the base
 * class alone. Measured: `.camp_button.is-navy` was created and
 * `.camp_section.is-navy` was not; same for is-on-dark and is-center.
 *
 * `data_style_tool create_style` with `parent_style_names` has no such
 * collision, so the combos are reconciled here instead. Idempotent: it reads
 * the site first and only writes what is missing or wrong.
 *
 *   node sync-combos.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { call, SITES } from './wf.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CSS_FILE = path.resolve(HERE, '../../../04-design/.tmp/v2/_shared/camp.css');
const PAGE = '6a83e962d17d0bfe618c49f7';
const DRY = process.argv.includes('--dry');

const MEDIA_TO_BREAKPOINT = {
  'screen and (max-width: 991px)': 'medium',
  'screen and (max-width: 767px)': 'small',
  'screen and (max-width: 479px)': 'tiny',
  'screen and (min-width: 1280px)': 'large',
  'screen and (min-width: 1440px)': 'xl',
  'screen and (min-width: 1920px)': 'xxl',
};

/* ------------------------------------------------------------------ parse -- */

const css = fs.readFileSync(CSS_FILE, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** [{ base, combo, breakpoint, pseudo, decls: [[prop,value]] }] */
const comboRules = [];

function collect(block, breakpoint) {
  for (const m of block.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = m[1].trim();
    if (!selector || selector.startsWith('@')) continue;
    for (const sel of selector.split(',').map((s) => s.trim())) {
      // .base.combo  with an optional :pseudo-class
      const hit = sel.match(/^\.([\w-]+)\.([\w-]+)(?::([\w-]+))?$/);
      if (!hit) continue;
      const decls = m[2].split(';').map((d) => d.trim()).filter(Boolean)
        .map((d) => { const i = d.indexOf(':'); return [d.slice(0, i).trim(), d.slice(i + 1).trim()]; });
      if (decls.length) comboRules.push({ base: hit[1], combo: hit[2], pseudo: hit[3] || null, breakpoint, decls });
    }
  }
}

let flat = css;
for (const m of css.matchAll(/@media([^{]+)\{([\s\S]*?)\n\}/g)) {
  const bp = MEDIA_TO_BREAKPOINT[m[1].trim()];
  if (!bp) { console.log(`unknown media query: ${m[1].trim()}`); process.exit(1); }
  collect(m[2], bp);
  flat = flat.replace(m[0], '');
}
collect(flat, 'main');

const pairs = [...new Set(comboRules.map((r) => `${r.base}|${r.combo}`))];
console.log(`camp.css declares ${comboRules.length} combo rules over ${pairs.length} base+combo pairs\n`);

/* ------------------------------------------------------- read what exists -- */

const q = call('data_style_tool', [{
  label: 'q',
  query_styles: {
    queries: pairs.map((p) => {
      const [base, combo] = p.split('|');
      return { label: p, name_path: [base, combo], include_properties: true, include_breakpoints: ['main', 'medium', 'small', 'tiny'], limit: 5 };
    }),
  },
}], { site: SITES.arvada, page: PAGE });

const present = new Map();
for (const r of q.result || []) {
  const want = '.' + r.label.split('|').join('.');
  const m = (r.matches || []).find((x) => x.selector === want);
  if (m) present.set(r.label, m);
}

console.log(`${present.size}/${pairs.length} combo pairs already on the site`);
const missing = pairs.filter((p) => !present.has(p));
if (missing.length) console.log('MISSING: ' + missing.map((p) => '.' + p.split('|').join('.')).join(', '));

/* ------------------------------------------------------------------ write -- */

if (DRY) process.exit(0);

const creates = [];
const updates = [];

for (const p of missing) {
  const [base, combo] = p.split('|');
  const mainRule = comboRules.find((r) => r.base === base && r.combo === combo && r.breakpoint === 'main' && !r.pseudo);
  creates.push({
    label: p,
    create_style: {
      name: combo,
      parent_style_names: [base],
      properties: (mainRule?.decls || []).map(([n, v]) => ({ property_name: n, property_value: v })),
    },
  });
}

/**
 * Only write an override that is actually absent or different. Re-sending a
 * value the style already holds is not a harmless no-op: the multiplayer
 * server rejects it with "[Conflict] The operation could not be applied to the
 * style block store", which reads like a failure when nothing is wrong.
 */
function alreadyMatches(r) {
  const m = present.get(`${r.base}|${r.combo}`);
  if (!m || r.pseudo) return false;                       // pseudo state is not in the read
  const have = m.properties?.breakpoints?.[r.breakpoint]?.properties;
  if (!have) return false;
  return r.decls.every(([n, v]) => String(have[n] ?? '').replace(/\s+/g, '') === v.replace(/\s+/g, ''));
}

for (const r of comboRules) {
  if (r.breakpoint === 'main' && !r.pseudo) continue;
  if (alreadyMatches(r)) continue;
  updates.push({
    label: `${r.base}.${r.combo}@${r.breakpoint}${r.pseudo ? ':' + r.pseudo : ''}`,
    update_style: {
      style_name: r.combo,
      parent_style_names: [r.base],
      breakpoint_id: r.breakpoint,
      ...(r.pseudo ? { pseudo: r.pseudo } : {}),
      properties: r.decls.map(([n, v]) => ({ property_name: n, property_value: v })),
    },
  });
}

function run(actions, what) {
  if (!actions.length) { console.log(`\nnothing to ${what}`); return; }
  console.log(`\n${what}: ${actions.length}`);
  for (let i = 0; i < actions.length; i += 8) {
    const chunk = actions.slice(i, i + 8);
    const res = call('data_style_tool', chunk, { site: SITES.arvada, page: PAGE });
    const txt = JSON.stringify(res);
    const bad = chunk.filter((a) => !txt.includes(`"${a.label}"`) || /error/i.test(txt));
    console.log(`  ${chunk.map((a) => a.label).join(', ')} -> ${/\"error\"/.test(txt) ? 'CHECK: ' + txt.slice(0, 300) : 'ok'}`);
  }
}

run(creates, 'create missing combos');
run(updates, 'apply breakpoint/pseudo overrides');

/* ----------------------------------------------------------------- verify -- */

const q2 = call('data_style_tool', [{
  label: 'v',
  query_styles: {
    queries: pairs.map((p) => {
      const [base, combo] = p.split('|');
      return { label: p, name_path: [base, combo], include_properties: true, include_breakpoints: ['main', 'medium', 'small', 'tiny'], limit: 5 };
    }),
  },
}], { site: SITES.arvada, page: PAGE });

const now = new Set();
for (const r of q2.result || []) {
  const want = '.' + r.label.split('|').join('.');
  if ((r.matches || []).some((x) => x.selector === want)) now.add(r.label);
}
const stillMissing = pairs.filter((p) => !now.has(p));
console.log(`\nVERIFY: ${now.size}/${pairs.length} combo pairs present`);
if (stillMissing.length) { console.log('STILL MISSING: ' + stillMissing.join(', ')); process.exit(1); }
