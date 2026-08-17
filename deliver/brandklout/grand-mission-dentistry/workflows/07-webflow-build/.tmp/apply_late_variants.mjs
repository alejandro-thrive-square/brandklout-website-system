/**
 * apply_late_variants.mjs — undo the converter's min-width FOLD on a built page.
 *
 *   node apply_late_variants.mjs <implant|cosmetic|thank-you> [--dry]
 *
 * WHAT THE FOLD IS, AND WHY IT IS VISIBLE
 * ---------------------------------------
 * `data_whtml_builder` accepts only the three max-width breakpoints, so
 * payload_to_whtml.py folds every `large`/`xl`/`xxl` (min-width) variant INTO
 * the base and emits a max-width "restore" underneath. Where it could not read
 * the design's real threshold it assumed 992 and logged the style to
 * `unresolved-min-width.json` — which is a record of assumptions, not a queue of
 * unapplied work, and that is what made it easy to wave through.
 *
 * The result is a whole tier applied one or more bands too early. `ty-div-2` —
 * the wrapper every element on thank-you sits inside — carries the design's
 * **≥1920** font-size (17.46px) in its BASE, where the design has 15.52px, and
 * every child inherits it: 26 font-size and 32 line-height diffs in parity from
 * this one class. The client reviews at 1697.
 *
 * Reconciling the forked classes did NOT fix this. That pass repointed the
 * shared chrome onto implant's clipboard-built classes, which have the bands
 * right; every page-specific `ty-*` / `cos-*` class kept its folded base.
 *
 * WHAT THIS DOES, per style and per property that appears in a late variant:
 *   main            = the payload's true base value, or removed if the base is
 *                     silent about it
 *   large/xl/xxl    = the payload's own variant values (only where declared —
 *                     min-width bands cascade upward, so an undeclared band is
 *                     meant to inherit the one below)
 *   medium          = the payload's medium value, or REMOVED — the fold emitted
 *                     a restore here carrying an intermediate band's value
 *                     rather than the base (it reads `base` after an earlier
 *                     band has already overwritten it), so it is wrong whenever
 *                     the design has no real medium override to mask it
 *
 * Everything comes from `<page>/final.json`, which is the payload the design was
 * converted from and the only source of truth for what each band should hold.
 */
import fs from 'node:fs';
import { call, sleep, SITE, PAGES } from './mcp.mjs';

const name = process.argv[2];
const dry = process.argv.includes('--dry');
const pageId = PAGES[name];
if (!pageId) { console.error(`usage: node apply_late_variants.mjs <${Object.keys(PAGES).join('|')}> [--dry]`); process.exit(2); }

const LATE = ['large', 'xl', 'xxl'];
const styles = JSON.parse(fs.readFileSync(`${name}/final.json`, 'utf8')).payload.styles;
/* A combo name appears ONCE PER PARENT CHAIN in the payload — `ch` has three
   records on thank-you and four on cosmetic, and only one of them carries the
   rules; the rest are empty stubs for the other chains. Keeping the last silently
   dropped `ch` from the plan entirely. Keep the richest record per name. */
const weight = (s) => Object.keys(s.variants || {}).length * 1000 + (s.styleLess || '').length;
const byName = new Map();
for (const s of styles) {
  const prev = byName.get(s.name);
  if (!prev || weight(s) > weight(prev)) byName.set(s.name, s);
}
const affected = [...new Set(JSON.parse(
  fs.readFileSync(`${name}/whtml/unresolved-min-width.json`, 'utf8')).map((e) => e.style))];

/** "a: 1; b: 2" -> Map. Values may contain colons (urls, gradients). */
const decls = (text) => {
  const out = new Map();
  for (const part of String(text || '').split(';')) {
    const i = part.indexOf(':');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (k) out.set(k, part.slice(i + 1).trim());
  }
  return out;
};

/* Combo classes need their parent chain. Take it from the live tree rather than
   reconstructing it: the chain is simply the class names sitting before this one
   on an element that carries it. */
const tree = await call('data_element_tool', {
  siteId: SITE, pageId,
  context: `Reading the ${name} landing page's class usage to resolve the parent chain of each combo class before its breakpoint values are corrected. Read-only.`,
  actions: [{ label: 'tree', get_all_elements: {} }],
});
const chains = new Map();
(function walk(n) {
  if (!n || typeof n !== 'object') return;
  const names = n.styleNames ?? [];
  names.forEach((c, i) => {
    if (!chains.has(c)) chains.set(c, new Set());
    chains.get(c).add(JSON.stringify(names.slice(0, i)));
  });
  (n.children ?? []).forEach(walk);
})(tree[0].result?.[0]?.data ?? tree[0].result?.data);

const plan = [];
const refused = [];
for (const styleName of affected) {
  const s = byName.get(styleName);
  if (!s) { refused.push(`${styleName}: not in the payload`); continue; }
  const seen = chains.get(styleName);
  if (!seen) { refused.push(`${styleName}: not in use on the page`); continue; }
  /* A combo under two different bases is TWO style records in Webflow —
     `.gm-box.ch` and `.ty-section.ch` each carry their own definition — and the
     design means the same thing by both, so each chain gets the same values.
     `ch` is used under three bases on thank-you and four on cosmetic. */
  const allChains = [...seen].map((c) => JSON.parse(c));

  const base = decls(s.styleLess);
  const variants = s.variants || {};
  /* Only the properties the late variants actually touch. */
  const props = new Set();
  for (const [k, v] of Object.entries(variants)) {
    if (!LATE.includes(k.split('_')[0]) || k.includes('_')) continue;   // pseudo bands handled separately below
    for (const p of decls(v?.styleLess).keys()) props.add(p);
  }
  if (!props.size) continue;
  if (Object.keys(variants).some((k) => LATE.includes(k.split('_')[0]) && k.includes('_'))) {
    refused.push(`${styleName}: has a pseudo-state min-width variant — not handled, do it by hand`);
    continue;
  }

  const ops = [];
  /* main: the design's real base for these properties. */
  const setMain = [], rmMain = [];
  for (const p of props) (base.has(p) ? setMain : rmMain).push(p);
  if (setMain.length) ops.push({ bp: 'main', set: setMain.map((p) => [p, base.get(p)]) });
  if (rmMain.length) ops.push({ bp: 'main', remove: rmMain });

  /* medium: the design's own value, or drop the fold's bogus restore. */
  const med = decls(variants.medium?.styleLess);
  const setMed = [], rmMed = [];
  for (const p of props) (med.has(p) ? setMed : rmMed).push(p);
  if (setMed.length) ops.push({ bp: 'medium', set: setMed.map((p) => [p, med.get(p)]) });
  if (rmMed.length) ops.push({ bp: 'medium', remove: rmMed });

  /* the min-width bands themselves, only where the design declares them. */
  for (const bp of LATE) {
    const d = decls(variants[bp]?.styleLess);
    const set = [...props].filter((p) => d.has(p)).map((p) => [p, d.get(p)]);
    if (set.length) ops.push({ bp, set });
  }
  for (const parents of allChains) plan.push({ styleName, parents, ops, props: [...props] });
}

/* Read the LIVE definitions and drop every operation that would change nothing.
   Two reasons this matters. The shared chrome (`gm-header`, `logo-light`,
   `header__actions` …) was reconciled onto implant's CLIPBOARD-built classes,
   which already carry the correct base and the real large/xl/xxl bands — there
   is nothing to fix there, and re-asserting an identical value is what made the
   API answer "[Conflict] The operation could not be applied to the style block
   store" and abort the whole run on its first call. It also keeps this pass off
   implant, which shares those classes. */
const liveDefs = new Map();
const wanted = [...new Set(plan.map((p) => p.styleName))];
for (let i = 0; i < wanted.length; i += 8) {
  const r = await call('data_style_tool', {
    siteId: SITE, pageId,
    context: `Reading the current breakpoint values of ${Math.min(8, wanted.length - i)} classes on the ${name} landing page so only the ones that actually differ from the design are rewritten. Read-only.`,
    actions: [{ label: 'q', query_styles: { queries: wanted.slice(i, i + 8).map((n2) => ({
      label: n2, name_path: [n2], include_properties: true, limit: 30,
      include_breakpoints: ['main', 'medium', 'small', 'tiny', 'large', 'xl', 'xxl'],
    })) } }],
  });
  for (const block of r[0].result ?? []) {
    for (const m of block.matches ?? []) {
      if (!liveDefs.has(m.selector)) liveDefs.set(m.selector, m);
    }
  }
}
const norm = (v) => String(v ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
const liveVal = (p, bp, prop) => {
  const sel = '.' + [...p.parents, p.styleName].join('.');
  const m = liveDefs.get(sel) ?? liveDefs.get('.' + p.styleName);
  return m?.properties?.breakpoints?.[bp]?.properties?.[prop];
};
for (const p of plan) {
  p.ops = p.ops.map((o) => {
    if (o.set) {
      const keep = o.set.filter(([k, v]) => norm(liveVal(p, o.bp, k)) !== norm(v));
      return keep.length ? { bp: o.bp, set: keep } : null;
    }
    const keep = o.remove.filter((k) => liveVal(p, o.bp, k) !== undefined);
    return keep.length ? { bp: o.bp, remove: keep } : null;
  }).filter(Boolean);
}
const skipped = plan.filter((p) => !p.ops.length).length;
plan.splice(0, plan.length, ...plan.filter((p) => p.ops.length));

console.log(`${name}: ${affected.length} style(s) logged, ${plan.length} to correct, ` +
  `${skipped} already correct, ${refused.length} refused`);
for (const p of plan) {
  console.log(`  ${p.styleName}${p.parents.length ? ` (under ${p.parents.join('.')})` : ''} — ${p.props.join(', ')}`);
  for (const o of p.ops) {
    console.log(`      ${o.bp.padEnd(7)}${o.set ? 'set    ' + o.set.map(([k, v]) => `${k}: ${v}`).join('; ')
                                              : 'remove ' + o.remove.join(', ')}`);
  }
}
for (const r of refused) console.log(`  REFUSED ${r}`);
if (dry || !plan.length) { console.log(dry ? 'dry run — nothing written' : 'nothing to do'); process.exit(0); }

let n = 0;
for (const p of plan) {
  for (const o of p.ops) {
    await call('data_style_tool', {
      siteId: SITE, pageId,
      context: `Correcting the ${o.bp} breakpoint of one class on the ${name} landing page. The HTML converter cannot emit min-width media queries, so it folded the design's widest-breakpoint values into the base; this restores each band to what the design actually specifies.`,
      actions: [{
        label: `${p.styleName}-${o.bp}`,
        update_style: {
          style_name: p.styleName,
          breakpoint_id: o.bp,
          ...(p.parents.length ? { parent_style_names: p.parents } : {}),
          ...(o.set ? { properties: o.set.map(([k, v]) => ({ property_name: k, property_value: v })) } : {}),
          ...(o.remove ? { remove_properties: o.remove } : {}),
        },
      }],
    });
    n++;
    await sleep(1100);
  }
  console.log(`  corrected ${p.styleName}`);
}
console.log(`${n} breakpoint update(s) across ${plan.length} style(s) — republish, then re-run parity.mjs`);
