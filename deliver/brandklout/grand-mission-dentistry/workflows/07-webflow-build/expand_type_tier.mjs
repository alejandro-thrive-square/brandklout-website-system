/**
 * expand_type_tier.mjs — make the design's type system convertible.
 *
 * The Grand Mission kit sizes type through three mechanisms Webflow classes
 * cannot express directly:
 *   1. a FLUID ROOT (html font-size is piecewise-linear in vw — the
 *      webzite-house-v1 block at the top of kit.css);
 *   2. a text-scale token `--tx` that switches at 1024px;
 *   3. a display staircase: `--d1`/`--h2` redefined inside media queries.
 *
 * The converter expands var() against the BASE :root only, so every band got
 * the 1440-reference value (correct there by construction — --tx exists to
 * cancel the root curve at desktop — and wrong everywhere else; the tablet
 * hero measured 100.8px against the design's 70.4px).
 *
 * This pass evaluates every base-rule font-size at each Webflow band's
 * evaluation width (same widths resolveFluid uses: 1920/1440/1360/1136/880/
 * 623/400), rewrites the base declaration to the desktop-band px, and appends
 * canonical media overrides for the other six bands. The converter's own
 * variant machinery bakes those; resolveFluid then has no type left to guess.
 *
 * A band override is SKIPPED when the design itself sets font-size for the
 * same selector in a media rule covering that band — the design's explicit
 * intent wins over a derived value.
 *
 * Deliberately NOT handled: rem paddings/margins (the root curve makes them
 * ±14% off at the phone bands; --section/--gutter are vw-clamps and resolve
 * exactly, so only small paddings drift — accepted, recorded in the build
 * report), em/ch/%/vw font-sizes (relative or resolveFluid's job).
 *
 * Usage: node expand_type_tier.mjs <combined.css> <out.css>
 */
import fs from 'node:fs';

const [inPath, outPath] = process.argv.slice(2);
const src = fs.readFileSync(inPath, 'utf8');
if (!src.includes('webzite-house-v1')) {
  console.error('FATAL: fluid root marker (webzite-house-v1) not found — wrong stylesheet?');
  process.exit(1);
}

/* Webflow band evaluation widths — keep identical to webflow-clientfirst
   BREAKPOINTS. base is rewritten in place; the rest append as media blocks. */
const BANDS = [
  { name: 'base', width: 1136, media: null },
  { name: 'xxl', width: 1920, media: '@media (min-width: 1920px)' },
  { name: 'xl', width: 1440, media: '@media (min-width: 1440px)' },
  { name: 'large', width: 1360, media: '@media (min-width: 1280px)' },
  { name: 'medium', width: 880, media: '@media (max-width: 991px)' },
  { name: 'small', width: 623, media: '@media (max-width: 767px)' },
  { name: 'tiny', width: 400, media: '@media (max-width: 479px)' },
];

/* ---- the fluid root, transcribed from the generated block ---------------- */
function rootPx(w) {
  let from, to, vwFrom, vwTo;
  if (w <= 479) { [from, to, vwFrom, vwTo] = [12, 16, 320, 479]; }
  else if (w <= 1440) { [from, to, vwFrom, vwTo] = [16, 16, 479, 1440]; }
  else if (w <= 1920) { [from, to, vwFrom, vwTo] = [16, 18, 1440, 1920]; }
  else { [from, to, vwFrom, vwTo] = [18, 20, 1920, 2400]; }
  const c = (to - from) / (vwTo / 100 - vwFrom / 100);
  return from + c * (w / 100 - vwFrom / 100);
}

/* ---- token environment per width ---------------------------------------- */
/* Parsed from the kit's own blocks rather than re-derived: --tx switches at
   1024; --d1/--h2 staircase = base, max-1199, 1024-1199 (must win over the
   max-1199 block), max-767. Values asserted against the source so a future
   retune of the kit cannot silently diverge from this expansion. */
const need = (re, label) => {
  const m = src.match(re);
  if (!m) { console.error(`FATAL: could not parse ${label} from the stylesheet`); process.exit(1); }
  return parseFloat(m[1]);
};
const TX_DESKTOP = need(/@media \(min-width: 1024px\)[^{]*\{\s*:root\s*\{\s*--tx:\s*([\d.]+)/, '--tx desktop step');
const D1 = {
  base: need(/--d1:\s*calc\(([\d.]+)rem \* var\(--tx\)\);\s*\n\s*--h2/, '--d1 base'),
  max1199: need(/@media \(max-width: 1199px\)\s*\{\s*:root\s*\{\s*--d1:\s*calc\(([\d.]+)rem/, '--d1 max-1199'),
  b1024: need(/@media \(min-width: 1024px\) and \(max-width: 1199px\)\s*\{\s*:root\s*\{\s*--d1:\s*calc\(([\d.]+)rem/, '--d1 1024-1199'),
  max767: need(/@media \(max-width: 767px\)\s*\{\s*:root\s*\{\s*--d1:\s*calc\(([\d.]+)rem/, '--d1 max-767'),
};
const H2 = {
  base: need(/--h2:\s*calc\(([\d.]+)rem \* var\(--tx\)\);/, '--h2 base'),
  max1199: need(/@media \(max-width: 1199px\)\s*\{\s*:root\s*\{\s*--d1:[^;]+;\s*--h2:\s*calc\(([\d.]+)rem/, '--h2 max-1199'),
  b1024: need(/@media \(min-width: 1024px\) and \(max-width: 1199px\)\s*\{\s*:root\s*\{\s*--d1:[^;]+;\s*--h2:\s*calc\(([\d.]+)rem/, '--h2 1024-1199'),
  max767: need(/@media \(max-width: 767px\)\s*\{\s*:root\s*\{\s*--d1:[^;]+;\s*--h2:\s*calc\(([\d.]+)rem/, '--h2 max-767'),
};
const CONST_TOKENS = {};
for (const t of ['h3', 'body-lg', 'body', 'label']) {
  CONST_TOKENS['--' + t] = need(new RegExp(`--${t}:\\s*calc\\(([\\d.]+)rem \\* var\\(--tx\\)\\);`), `--${t}`);
}

function env(w) {
  const tx = w >= 1024 ? TX_DESKTOP : 1;
  const stair = (T) =>
    w <= 767 ? T.max767 : w <= 1023 ? T.max1199 : w <= 1199 ? T.b1024 : T.base;
  const e = { '--tx': String(tx) };
  e['--d1'] = `calc(${stair(D1)}rem * ${tx})`;
  e['--h2'] = `calc(${stair(H2)}rem * ${tx})`;
  for (const [k, rem] of Object.entries(CONST_TOKENS)) e[k] = `calc(${rem}rem * ${tx})`;
  return e;
}

/* ---- tiny calc evaluator: numbers, rem, px, * / + - and var() ------------ */
function evalFont(value, w) {
  let v = value.trim();
  const e = env(w);
  for (let i = 0; i < 4 && v.includes('var('); i++) {
    v = v.replace(/var\((--[\w-]+)(?:\s*,[^)]*)?\)/g, (m, name) => e[name] ?? m);
  }
  if (v.includes('var(')) return null; // unknown token — leave alone
  if (/(em|ch|%|vw|vh|clamp|min\(|max\()/.test(v.replace(/rem/g, ''))) return null;
  // strip calc() wrappers -> plain parenthesised arithmetic
  v = v.replace(/calc\(/g, '(');
  // units -> px numbers
  const root = rootPx(w);
  v = v.replace(/([\d.]+)rem/g, (_, n) => String(parseFloat(n) * root));
  v = v.replace(/([\d.]+)px/g, '$1');
  if (!/^[\d\s+\-*/().]+$/.test(v)) return null;
  try {
    const px = Function('"use strict";return (' + v + ')')();
    return Number.isFinite(px) ? Math.round(px * 100) / 100 : null;
  } catch { return null; }
}

/* ---- walk top-level blocks ---------------------------------------------- */
function* topBlocks(css) {
  let depth = 0, start = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '{') { depth++; }
    else if (c === '}') { depth--; if (depth === 0) { yield css.slice(start, i + 1); start = i + 1; } }
  }
}
const parseCond = (cond) => {
  const min = cond.match(/min-width:\s*(\d+)/); const max = cond.match(/max-width:\s*(\d+)/);
  return { min: min ? +min[1] : 0, max: max ? +max[1] : Infinity };
};

// Design media rules that already set font-size, per selector — those bands skip.
const designOverrides = []; // {min, max, selectors:Set}
for (const block of topBlocks(src)) {
  const m = block.match(/^\s*@media([^{]+)\{([\s\S]*)\}\s*$/);
  if (!m) continue;
  const { min, max } = parseCond(m[1]);
  const sels = new Set();
  for (const inner of topBlocks(m[2])) {
    const im = inner.match(/^\s*([^{]+)\{([\s\S]*)\}\s*$/);
    if (im && /font-size\s*:/.test(im[2])) {
      im[1].split(',').forEach((s) => sels.add(s.trim()));
    }
  }
  if (sels.size) designOverrides.push({ min, max, selectors: sels });
}
const designSets = (sel, w) => designOverrides.some(
  (o) => w >= o.min && w <= o.max && o.selectors.has(sel));

/* ---- rewrite base declarations + collect per-band overrides -------------- */
const perBand = {}; // band name -> lines
let rewritten = 0, skippedDecls = 0;
let out = '';
for (const block of topBlocks(src)) {
  if (/^\s*@media|^\s*@keyframes|^\s*:root|^\s*@import|^\s*@font-face/.test(block)) { out += block; continue; }
  const m = block.match(/^(\s*)([^{@]+)\{([\s\S]*)\}$/);
  if (!m) { out += block; continue; }
  const [, lead, selRaw, body] = m;
  if (!/font-size\s*:/.test(body)) { out += block; continue; }
  const sel = selRaw.trim();
  let newBody = body.replace(/font-size\s*:\s*([^;]+);/g, (whole, value) => {
    const basePx = evalFont(value, 1136);
    if (basePx === null) { skippedDecls++; return whole; }
    rewritten++;
    for (const band of BANDS) {
      if (band.name === 'base') continue;
      if (designSets(sel, band.width)) continue;
      const px = evalFont(value, band.width);
      if (px === null || px === basePx) continue;
      (perBand[band.name] ||= []).push(`${sel} { font-size: ${px}px; }`);
    }
    return `font-size: ${basePx}px;`;
  });
  out += `${lead}${selRaw}{${newBody}}`;
}

out += '\n\n/* ==== TYPE TIER, expanded per Webflow band (expand_type_tier.mjs) ==== */\n';
for (const band of BANDS) {
  if (!perBand[band.name]) continue;
  out += `${band.media} {\n${perBand[band.name].map((l) => '  ' + l).join('\n')}\n}\n`;
}

fs.writeFileSync(outPath, out, 'utf8');
const counts = Object.fromEntries(Object.entries(perBand).map(([k, v]) => [k, v.length]));
console.log(`rewrote ${rewritten} font-size declarations to px (skipped ${skippedDecls} relative/unknown), band overrides: ${JSON.stringify(counts)}`);
