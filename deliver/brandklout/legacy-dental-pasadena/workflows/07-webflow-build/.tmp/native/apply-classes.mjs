#!/usr/bin/env node
/**
 * apply-classes.mjs — make the site's camp_ layer match Marvel's stylesheet.
 *
 *   node apply-classes.mjs --dry     plan only, writes nothing
 *   node apply-classes.mjs           execute
 *
 * The pages were cloned from Arvada, so most of this layer already exists with
 * Arvada's values. Five shapes have to be handled differently, and each one is
 * a trap that reports success while doing the wrong thing:
 *
 *   1. A class that exists         -> update_style, sending ONLY what differs.
 *      Re-sending a value a style already holds returns "[Conflict] … style
 *      block store", so the diff is not an optimisation, it is required.
 *   2. A local global the site stores as a COMBO (`.camp_hero_grid` lives as
 *      `.camp_container.camp_hero_grid`) -> update the combo. Writing the base
 *      instead leaves the combo's Arvada values winning on the page.
 *   3. A combo that does not exist -> create_style with parent_style_names.
 *      Never through whtml_builder: a combo name attaches to ONE base class per
 *      build and the rest are dropped silently.
 *   4. A pseudo state              -> update_style with `pseudo`.
 *   5. A genuinely new global      -> whtml_builder, which parses shorthands
 *      and every breakpoint in one pass.
 *
 * Idempotent: it re-reads the site each run and writes only what still differs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { call, SITES } from './wf.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHARED = path.resolve(HERE, '../../../04-design/.tmp/v1/_shared');
const PAGE = '6a875326a493a891fd87d30a';                       // Emergency Dentist
const SEED_PARENT = null;                                      // resolved below
const DRY = process.argv.includes('--dry');
const BP = { 991: 'medium', 767: 'small', 479: 'tiny' };
const ORDER = ['main', 'medium', 'small', 'tiny'];

/* ------------------------------------------------------- parse the source --- */

const local = new Map();                        // selector -> bp -> {prop: value}
const put = (sel, bp, prop, value) => {
  if (!local.has(sel)) local.set(sel, {});
  ((local.get(sel))[bp] ||= {})[prop] = value.trim();
};
const readRules = (css, bp) => {
  for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    for (const sel of m[1].split(',').map((x) => x.trim()).filter(Boolean)) {
      if (!sel.startsWith('.camp')) continue;
      for (const d of m[2].split(';')) {
        const i = d.indexOf(':');
        if (i < 0) continue;
        put(sel, bp, d.slice(0, i).trim(), d.slice(i + 1));
      }
    }
  }
};
for (const file of ['camp.css', 'camp-convert.css', 'camp-sections.css']) {
  const css = fs.readFileSync(path.join(SHARED, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/@media screen and \(max-width: (\d+)px\) \{([\s\S]*?)\n\}/g)) readRules(m[2], BP[m[1]]);
  readRules(css.replace(/@media[\s\S]*$/, ''), 'main');
}

/* ------------------------------------------------------------ read the site --- */

const query = (needle) => call('data_style_tool', [{
  label: needle,
  query_styles: { queries: [{ label: needle, name_path: [needle], limit: 200, include_properties: true, include_breakpoints: ORDER }] },
}], { site: SITES.legacy, page: PAGE })?.result?.[0]?.matches || [];

const matches = [...query('camp'), ...query('is-')];
if (!matches.length) { console.log('style query came back empty'); process.exit(1); }
const site = new Map(matches.map((m) => [m.selector, m]));

const propsAt = (m, bp) => (bp === 'main' ? m.properties?.base?.properties : m.properties?.breakpoints?.[bp]?.properties) || {};

// Webflow stores longhands. Compare after the same expansion or every shorthand
// reads as a difference for ever, and re-writing an unchanged value earns a
// "[Conflict] … style block store" instead of a no-op.
const EXPAND = {
  padding: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
  margin: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
};
const norm = (v) => String(v).toLowerCase().replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ').trim();
const expand = (props) => {
  const out = {};
  for (const [k, v] of Object.entries(props)) {
    if (EXPAND[k]) {
      const [t, r = t, b = t, l = r] = v.split(/\s+/);
      EXPAND[k].forEach((p, i) => { out[p] = [t, r, b, l][i]; });
    } else if (k === 'border' || k === 'border-top' || k === 'border-left') {
      const [w, style, ...c] = v.split(/\s+/);
      const side = k === 'border' ? ['top', 'right', 'bottom', 'left'] : [k.split('-')[1]];
      for (const sd of side) {
        out[`border-${sd}-width`] = w; out[`border-${sd}-style`] = style; out[`border-${sd}-color`] = c.join(' ');
      }
    } else if (k === 'border-radius') {
      for (const c of ['top-left', 'top-right', 'bottom-left', 'bottom-right']) out[`border-${c}-radius`] = v;
    } else if (k === 'overflow') {
      out['overflow-x'] = v; out['overflow-y'] = v;
    } else if (k === 'flex' && v === 'none') {
      out['flex-grow'] = '0'; out['flex-shrink'] = '0'; out['flex-basis'] = 'auto';
    } else out[k] = v;
  }
  return out;
};

/* --------------------------------------------------------------- resolve --- */

/** A local selector becomes: what to write, and where. */
const plan = { update: [], createCombo: [], newGlobal: [], deferPseudo: [] };

for (const [sel, byBp] of local) {
  const pseudoM = sel.match(/:([a-z-]+)$/);
  const pseudo = pseudoM ? pseudoM[1] : null;
  const bare = pseudo ? sel.slice(0, -pseudo.length - 1) : sel;
  const parts = bare.split('.').filter(Boolean);
  const name = parts[parts.length - 1];
  const parents = parts.slice(0, -1);

  // exact, then "the site keeps this global as a combo"
  let target = site.get(bare);
  let parentNames = parents;
  if (!target && parents.length === 0) {
    const asCombo = [...site.keys()].find((s) => s.endsWith('.' + name) && s.split('.').filter(Boolean).length === 2);
    if (asCombo) { target = site.get(asCombo); parentNames = asCombo.split('.').filter(Boolean).slice(0, -1); }
  }

  if (!target) {
    if (pseudo) plan.deferPseudo.push({ sel, name, parents, pseudo, byBp });
    else if (parents.length) plan.createCombo.push({ sel, name, parents, byBp });
    else plan.newGlobal.push({ sel, name, byBp });
    continue;
  }

  for (const bp of ORDER) {
    const want = expand(byBp[bp] || {});
    if (!Object.keys(want).length) continue;
    const have = pseudo ? {} : propsAt(target, bp);      // pseudo values are not in this payload; write them and let Webflow settle
    const write = [];
    for (const [prop, value] of Object.entries(want)) {
      const cur = have[prop];
      if (cur === undefined || norm(cur) !== norm(value)) write.push({ property_name: prop, property_value: value });
    }
    if (write.length) plan.update.push({ sel, name, parents: parentNames, bp, pseudo, write });
  }
}

const decls = plan.update.reduce((n, u) => n + u.write.length, 0);
console.log(`plan: ${plan.update.length} rule update(s) / ${decls} declaration(s), ` +
  `${plan.createCombo.length} combo(s) to create, ${plan.newGlobal.length} new global(s)`);
if (plan.createCombo.length) console.log('  combos: ' + plan.createCombo.map((c) => c.sel).join(', '));
if (DRY) {
  fs.writeFileSync(path.join(HERE, 'class-plan.json'), JSON.stringify(plan, null, 1));
  console.log('dry run: wrote class-plan.json, nothing sent');
  process.exit(0);
}

/* ------------------------------------------------------- 5. new globals --- */
// whtml_builder creates a style for every rule in the css field, used or not.
// One throwaway element carries the whole batch, then goes away again.

if (plan.newGlobal.length) {
  const byBpCss = { main: [], medium: [], small: [], tiny: [] };
  for (const g of plan.newGlobal) {
    for (const bp of ORDER) {
      const props = g.byBp[bp];
      if (props) byBpCss[bp].push(`${g.sel} { ${Object.entries(props).map(([k, v]) => `${k}: ${v}`).join('; ')} }`);
    }
  }
  const WIDTH = { medium: 991, small: 767, tiny: 479 };
  let css = byBpCss.main.join('\n');
  for (const bp of ['medium', 'small', 'tiny']) {
    if (byBpCss[bp].length) css += `\n@media screen and (max-width: ${WIDTH[bp]}px) {\n${byBpCss[bp].join('\n')}\n}`;
  }
  const tree = call('data_element_tool', [{ label: 'body', get_all_elements: { depth: 0 } }], { site: SITES.legacy, page: PAGE });
  const bodyId = tree?.result?.[0]?.data?.id;
  if (!bodyId) { console.log('could not read the page body'); process.exit(1); }

  const res = call('data_whtml_builder', [{
    build_label: 'camp-missing-classes',
    parent_element_id: bodyId,
    creation_position: 'append',
    html: '<div class="camp_classlayer-seed"></div>',
    css,
    return_element_info: true,
  }], { site: SITES.legacy, page: PAGE });
  console.log('new globals:', JSON.stringify(res).slice(0, 300));

  // remove the seed element again
  const after = call('data_element_tool', [{ label: 'find', query_elements: { queries: [{ label: 'seed', element_filter: { style: 'camp_classlayer-seed' }, limit: 5 }] } }], { site: SITES.legacy, page: PAGE });
  for (const m of after?.result?.[0]?.data?.[0]?.matches || []) {
    call('data_element_tool', [{ label: 'rm', remove_element: { id: m.id } }], { site: SITES.legacy, page: PAGE });
    console.log('  seed element removed');
  }
}

/* --------------------------------- 4b. states on newly created classes --- */

for (const d of plan.deferPseudo) {
  const props = expand(d.byBp.main || {});
  const res = call('data_style_tool', [{
    label: 'state ' + d.sel,
    update_style: {
      style_name: d.name,
      ...(d.parents.length ? { parent_style_names: d.parents.map((p) => p.replace(/^./, '')) } : {}),
      pseudo: d.pseudo,
      properties: Object.entries(props).map(([k, v]) => ({ property_name: k, property_value: v })),
    },
  }], { site: SITES.legacy, page: PAGE });
  console.log('state', d.sel, JSON.stringify(res).slice(0, 160));
}

/* ---------------------------------------------------- 3. missing combos --- */

for (const c of plan.createCombo) {
  const base = expand(c.byBp.main || {});
  const res = call('data_style_tool', [{
    label: 'create ' + c.sel,
    create_style: {
      name: c.name,
      parent_style_names: c.parents.map((p) => p.replace(/^\./, '')),
      properties: Object.entries(base).map(([k, v]) => ({ property_name: k, property_value: v })),
    },
  }], { site: SITES.legacy, page: PAGE });
  console.log('combo', c.sel, JSON.stringify(res).slice(0, 160));
  for (const bp of ['medium', 'small', 'tiny']) {
    const props = expand(c.byBp[bp] || {});
    if (!Object.keys(props).length) continue;
    call('data_style_tool', [{
      label: 'bp ' + c.sel + ' ' + bp,
      update_style: {
        style_name: c.name, parent_style_names: c.parents.map((p) => p.replace(/^\./, '')), breakpoint_id: bp,
        properties: Object.entries(props).map(([k, v]) => ({ property_name: k, property_value: v })),
      },
    }], { site: SITES.legacy, page: PAGE });
  }
}

/* ------------------------------------------------------ 1,2,4. updates --- */

const BATCH = 6;
let done = 0;
for (let i = 0; i < plan.update.length; i += BATCH) {
  const slice = plan.update.slice(i, i + BATCH);
  const actions = slice.map((u, n) => ({
    label: `${u.sel}@${u.bp}${u.pseudo ? ':' + u.pseudo : ''}#${n}`,
    update_style: {
      style_name: u.name,
      ...(u.parents.length ? { parent_style_names: u.parents.map((p) => p.replace(/^\./, '')) } : {}),
      ...(u.bp !== 'main' ? { breakpoint_id: u.bp } : {}),
      ...(u.pseudo ? { pseudo: u.pseudo } : {}),
      properties: u.write,
    },
  }));
  const res = call('data_style_tool', actions, { site: SITES.legacy, page: PAGE });
  const text = JSON.stringify(res);
  const bad = /error|conflict|invalid/i.test(text);
  done += slice.length;
  console.log(`${String(done).padStart(3)}/${plan.update.length} ${bad ? 'CHECK  ' + text.slice(0, 400) : 'ok'}`);
}
console.log('\ndone. re-run diff-classes.mjs to confirm the site matches the stylesheet.');
