#!/usr/bin/env node
/**
 * diff-classes.mjs — what the site's camp_ layer holds vs what Marvel's says.
 *
 * The three campaign pages were cloned from Arvada, so every camp_ class ALREADY
 * exists on this site carrying Arvada's values (h1 74px, sections 104px, brown
 * #403830). They therefore have to be UPDATED, not created: data_whtml_builder
 * creates a style only when the name is free, so re-pushing the stylesheet would
 * leave the old values sitting exactly where they are and report success.
 *
 *   node diff-classes.mjs            -> class-diff.json + a summary
 *
 * Read-only. Writes nothing to Webflow.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { call, SITES } from './wf.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHARED = path.resolve(HERE, '../../../04-design/.tmp/v1/_shared');
const PAGE = '6a875326a493a891fd87d30a';                       // Emergency Dentist
const BP = { base: 'main', 991: 'medium', 767: 'small', 479: 'tiny' };

/* ---------------------------------------------------------- parse local --- */

/** selector -> breakpoint -> { prop: value } */
const local = new Map();
const put = (sel, bp, prop, value) => {
  if (!local.has(sel)) local.set(sel, {});
  const s = local.get(sel);
  (s[bp] ||= {})[prop] = value.trim();
};

const readRules = (css, bp) => {
  for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const selectors = m[1].split(',').map((x) => x.trim()).filter(Boolean);
    for (const sel of selectors) {
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
  let css = fs.readFileSync(path.join(SHARED, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  // pull the media blocks out first, then read what is left as the base
  for (const m of css.matchAll(/@media screen and \(max-width: (\d+)px\) \{([\s\S]*?)\n\}/g)) {
    readRules(m[2], BP[m[1]] || m[1]);
  }
  readRules(css.replace(/@media[\s\S]*$/, ''), 'main');
}

/* ----------------------------------------------------------- read site --- */

// name_path matches a style's OWN name and does not walk combos, so a combo
// called "is-light" never comes back from a search for "camp". Ask twice.
const query = (needle) => call('data_style_tool', [{
  label: needle, query_styles: {
    queries: [{
      label: needle, name_path: [needle], limit: 200, include_properties: true,
      include_breakpoints: ['main', 'medium', 'small', 'tiny'],
    }],
  },
}], { site: SITES.legacy, page: PAGE })?.result?.[0]?.matches || [];

const matches = [...query('camp'), ...query('is-')];
if (!matches.length) { console.log('the style query came back empty:', JSON.stringify(res).slice(0, 300)); process.exit(1); }
const site = new Map(matches.map((m) => [m.selector, m]));
console.log(`site: ${matches.length} camp styles   local: ${local.size} camp selectors`);

/* -------------------------------------------------------------- compare --- */

// Webflow expands shorthands, so compare only what it can hold verbatim and
// let the longhand it produced answer for the shorthand we wrote.
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

const report = { missing: [], changed: [], same: 0 };
for (const [sel, byBp] of local) {
  // Webflow gives the write to the COMBO when a class owns one: updating
  // .camp_proof_grid lands on .camp_container.camp_proof_grid, and the bare
  // global stays empty. Read both, combo last, or every such rule reads as
  // missing for ever.
  const bare = site.get(sel);
  const name = sel.replace(/^./, '');
  const comboSel = [...site.keys()].find((k) => k !== sel && k.endsWith('.' + name) && k.split('.').filter(Boolean).length === 2);
  const combo = comboSel ? site.get(comboSel) : null;
  const s = bare || combo;
  if (!s) { report.missing.push(sel); continue; }
  for (const [bp, props] of Object.entries(byBp)) {
    // the payload nests: properties.base.properties for the desktop rule, and
    // properties.breakpoints.<bp>.properties for each override
    const at = (m) => (m ? (bp === 'main' ? m.properties?.base?.properties : m.properties?.breakpoints?.[bp]?.properties) : null) || {};
    const have = { ...at(bare), ...at(combo) };
    const want = expand(props);
    const diffs = [];
    for (const [prop, value] of Object.entries(want)) {
      const cur = have[prop];
      if (cur === undefined) diffs.push({ prop, from: null, to: value });
      else if (norm(cur) !== norm(value)) diffs.push({ prop, from: cur, to: value });
      else report.same++;
    }
    if (diffs.length) report.changed.push({ selector: sel, name: s.name, combo: s.isComboClass, bp, diffs });
  }
}

fs.writeFileSync(path.join(HERE, 'class-diff.json'), JSON.stringify({ report, siteSelectors: [...site.keys()] }, null, 1));

const declarations = report.changed.reduce((n, c) => n + c.diffs.length, 0);
console.log(`\n${report.missing.length} class(es) not on the site yet`);
if (report.missing.length) console.log('  ' + report.missing.join('\n  '));
console.log(`${report.changed.length} rule(s) differ, ${declarations} declaration(s) to write, ${report.same} already correct`);
for (const c of report.changed.slice(0, 12)) {
  console.log(`  ${c.selector} @${c.bp}: ` + c.diffs.slice(0, 4).map((d) => `${d.prop} ${d.from ?? '(unset)'} -> ${d.to}`).join(', '));
}
if (report.changed.length > 12) console.log(`  … and ${report.changed.length - 12} more, in class-diff.json`);
