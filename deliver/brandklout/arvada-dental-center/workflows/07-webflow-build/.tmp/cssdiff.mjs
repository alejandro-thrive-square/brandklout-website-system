#!/usr/bin/env node
/**
 * cssdiff.mjs — which CSS rules did the paste lose or change?
 *
 * Chasing one computed-style difference at a time keeps landing on rules that
 * survived perfectly well. This compares the two stylesheets directly: every
 * rule the design page carries (journey.css + its per-chapter <style> blocks)
 * against every rule the published page carries, with the page prefix and
 * @scope wrapper normalised away so the two are directly comparable.
 *
 *   node cssdiff.mjs <design-dir> <staging-slug> <prefix>
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const [page, slug, prefix] = process.argv.slice(2);
const DESIGN = join(HERE, '../../04-design/.tmp');

const designHtml = readFileSync(join(DESIGN, page, 'index.html'), 'utf8');
const kit = readFileSync(join(DESIGN, '_shared', 'journey.css'), 'utf8');
const stagingHtml = readFileSync(join(HERE, 'staging', `${slug}.html`), 'utf8');

const styleBlocks = (html) => [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);

/** Strip comments, collapse whitespace, drop @scope/@media wrappers to bare rules. */
function rules(css) {
  const out = new Map();
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // Flatten one level of at-rule nesting by removing the wrapper braces of
  // @scope/@media/@supports; the inner rules are what we want to compare.
  const flat = clean.replace(/@(scope|media|supports|layer)[^{]*\{/g, '');
  for (const m of flat.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    let sel = m[1].trim().replace(/\s+/g, ' ');
    let body = m[2].trim().replace(/\s+/g, ' ').replace(/;\s*$/, '');
    if (!sel || sel.startsWith('@')) continue;
    out.set(norm(sel), { sel, body });
  }
  return out;
}

const norm = (s) => s
  .replace(/:scope\s*/g, '')
  .replace(new RegExp(`\\.${prefix}-`, 'g'), '.')
  .replace(new RegExp(`#${prefix}-`, 'g'), '#')
  .replace(/\s+/g, ' ')
  .trim();

const normBody = (b) => b
  // The design writes rem; the packager rewrites each one to a multiple of
  // --wz-root. Same value, different spelling — compare the coefficient.
  .replace(/calc\(([\d.]+) \* var\(--wz-root, 16px\)\)/g, '$1rem')
  .replace(new RegExp(`\\.${prefix}-`, 'g'), '.')
  .replace(/\s*([:;,])\s*/g, '$1')
  .replace(/;$/, '')
  .split(';').sort().join(';');

const A = rules(kit + '\n' + styleBlocks(designHtml).join('\n'));
const B = rules(styleBlocks(stagingHtml).join('\n'));

const missing = [], changed = [];
for (const [k, v] of A) {
  const b = B.get(k);
  if (!b) { missing.push(v); continue; }
  if (normBody(v.body) !== normBody(b.body)) changed.push({ sel: v.sel, design: v.body, staging: b.body });
}

console.log(`design rules ${A.size}   staging rules ${B.size}`);
console.log(`\n=== ${missing.length} rules in the design with NO counterpart on staging ===`);
for (const m of missing.slice(0, 60)) console.log(`  ${m.sel.slice(0, 90)}\n      { ${m.body.slice(0, 120)} }`);
console.log(`\n=== ${changed.length} rules whose declarations differ ===`);
for (const c of changed.slice(0, 40)) {
  console.log(`  ${c.sel.slice(0, 90)}`);
  console.log(`      design : ${c.design.slice(0, 150)}`);
  console.log(`      staging: ${c.staging.slice(0, 150)}`);
}
