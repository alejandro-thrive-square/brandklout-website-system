#!/usr/bin/env node
/**
 * audit-spacing.mjs — find spacing inconsistencies in the shared stylesheets.
 *
 * Two different questions, both worth asking:
 *
 * 1. SCALE. How many distinct values does the design actually use for each
 *    spacing property? A design with 30 one-off paddings has no rhythm; the
 *    numbers were picked per element rather than from a scale. Values used only
 *    once are the suspects.
 * 2. SYMMETRY. Paddings and margins that are almost-but-not-quite equal on
 *    opposing sides, and section paddings that differ from their neighbours by
 *    a few px — the kind of thing that reads as "slightly off" without ever
 *    looking obviously broken.
 *
 *   node audit-spacing.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHARED = path.resolve(HERE, '../../../04-design/.tmp/v2/_shared');
const FILES = ['camp.css', 'camp-convert.css'];

const SPACING = /^(margin|padding|grid-row-gap|grid-column-gap|gap|top|right|bottom|left)/;

/** rule records: { file, media, selector, prop, value } */
const decls = [];

for (const f of FILES) {
  const css = fs.readFileSync(path.join(SHARED, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  let flat = css;
  const blocks = [];
  for (const m of css.matchAll(/@media([^{]+)\{([\s\S]*?)\n\}/g)) {
    blocks.push([m[1].trim(), m[2]]);
    flat = flat.replace(m[0], '');
  }
  blocks.push([null, flat]);

  for (const [media, body] of blocks) {
    for (const m of body.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = m[1].trim();
      if (!selector || selector.startsWith('@')) continue;
      for (const d of m[2].split(';')) {
        const i = d.indexOf(':');
        if (i < 0) continue;
        const prop = d.slice(0, i).trim();
        const value = d.slice(i + 1).trim();
        if (SPACING.test(prop)) decls.push({ file: f, media, selector, prop, value });
      }
    }
  }
}

/* --------------------------------------------------------------- 1. scale -- */

const px = (v) => [...v.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => Number(m[1]));
const usage = new Map();                       // value -> [where…]
for (const d of decls) {
  for (const n of px(d.value)) {
    if (n === 0) continue;
    const k = String(n);
    if (!usage.has(k)) usage.set(k, []);
    usage.get(k).push(`${d.selector}{${d.prop}}${d.media ? ' @' + d.media.replace(/screen and \(|\)/g, '') : ''}`);
  }
}

const sorted = [...usage.entries()].sort((a, b) => Number(a[0]) - Number(b[0]));
console.log(`SPACING SCALE — ${sorted.length} distinct px values across ${decls.length} declarations\n`);
console.log(sorted.map(([v, w]) => `${String(v).padStart(5)}px x${String(w.length).padStart(3)}`).join('   '));

const once = sorted.filter(([, w]) => w.length === 1);
console.log(`\n${once.length} value(s) used exactly once — each is a rhythm break unless it is deliberate:`);
for (const [v, w] of once) console.log(`  ${String(v).padStart(5)}px  ${w[0]}`);

/* ------------------------------------------------------------ 2. symmetry -- */

console.log('\nNEAR-MISS PAIRS — values within 4px of a more common neighbour:');
const counts = new Map(sorted.map(([v, w]) => [Number(v), w.length]));
const nearMiss = [];
for (const [v, w] of sorted) {
  const n = Number(v);
  for (const [other, oc] of counts) {
    if (other === n) continue;
    if (Math.abs(other - n) <= 4 && oc > w.length * 2) {
      nearMiss.push(`  ${n}px (x${w.length}) sits ${Math.abs(other - n)}px from ${other}px (x${oc}) — ${w[0]}`);
      break;
    }
  }
}
console.log(nearMiss.length ? nearMiss.join('\n') : '  none');

/* --------------------------------------------- 3. asymmetric box paddings -- */

console.log('\nASYMMETRIC PADDING — left/right or top/bottom that differ:');
const bySel = new Map();
for (const d of decls) {
  const k = `${d.selector}${d.media ? '@' + d.media : ''}`;
  if (!bySel.has(k)) bySel.set(k, {});
  bySel.get(k)[d.prop] = d.value;
  if (/^(padding|margin)$/.test(d.prop)) {
    const p = d.value.split(/\s+/);
    const [t, r, b, l] = p.length === 1 ? [p[0], p[0], p[0], p[0]]
      : p.length === 2 ? [p[0], p[1], p[0], p[1]]
        : p.length === 3 ? [p[0], p[1], p[2], p[1]] : p;
    Object.assign(bySel.get(k), { [`${d.prop}-top`]: t, [`${d.prop}-right`]: r, [`${d.prop}-bottom`]: b, [`${d.prop}-left`]: l });
  }
}
const asym = [];
for (const [sel, props] of bySel) {
  for (const kind of ['padding', 'margin']) {
    const l = props[`${kind}-left`], r = props[`${kind}-right`];
    if (l && r && l !== r && !/auto/.test(l + r)) asym.push(`  ${sel}  ${kind} L ${l} / R ${r}`);
  }
}
console.log(asym.length ? asym.join('\n') : '  none');
