#!/usr/bin/env node
/**
 * prune-css.mjs — drop stylesheet rules no rendered page uses.
 *
 *   node prune-css.mjs --dry    list what would go
 *   node prune-css.mjs          rewrite the three stylesheets
 *
 * WHY. `data_whtml_builder` creates a Webflow style for EVERY rule in the css
 * field, not only the ones the markup references. The class layer therefore
 * ships exactly what this stylesheet contains — and this is the client's live
 * 78-page site, not a sandbox. Twenty-six dead classes here are twenty-six dead
 * styles a designer has to scroll past for ever.
 *
 * They are dead for two good reasons, both of them deliberate decisions:
 * the story-chapter section was removed from the landing template (it needed
 * patient-chronicle quotes that do not exist and must not be invented), and the
 * native form was replaced by a documented seam because installing the form is
 * not ours to do.
 *
 * A rule is kept if ANY class in its selector is used. That is the conservative
 * direction: it prefers keeping a rule to dropping a live one.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const V1 = path.resolve(HERE, '../../../04-design/.tmp/v1');
const SHARED = path.join(V1, '_shared');
const FILES = ['camp.css', 'camp-convert.css', 'camp-sections.css'];
const DRY = process.argv.includes('--dry');

const used = new Set();
for (const dir of fs.readdirSync(V1)) {
  const body = path.join(V1, dir, 'body.html');
  if (!fs.existsSync(body)) continue;
  for (const m of fs.readFileSync(body, 'utf8').matchAll(/class="([^"]+)"/g)) {
    for (const c of m[1].split(/\s+/)) used.add(c);
  }
}
if (!used.size) { console.log('no rendered pages found — refusing to prune against an empty set'); process.exit(1); }
console.log(`${used.size} class(es) used across the rendered pages`);

let dropped = 0;
for (const file of FILES) {
  const before = dropped;
  const p = path.join(SHARED, file);
  const css = fs.readFileSync(p, 'utf8');
  const out = [];
  let i = 0;

  /* Walk the file rule by rule, carrying comments along with the rule that
     follows them, so a dropped rule takes its explanation with it rather than
     leaving an orphaned paragraph about something that is no longer there. */
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open === -1) { out.push(css.slice(i)); break; }
    const head = css.slice(i, open);

    // An at-rule block (@media) — recurse into its body by keeping it whole and
    // pruning the inner rules with the same test.
    if (/@media[^{]*$/.test(head)) {
      let depth = 1, j = open + 1;
      while (j < css.length && depth) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
      const inner = css.slice(open + 1, j - 1);
      const kept = [];
      for (const m of inner.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
        if (keep(m[1])) kept.push(m[0]);
        else dropped++;
      }
      if (kept.length) out.push(head + '{' + kept.join('\n') + '\n}');
      i = j;
      continue;
    }

    const close = css.indexOf('}', open);
    if (close === -1) { out.push(css.slice(i)); break; }
    const rule = css.slice(i, close + 1);
    if (keep(head)) out.push(rule);
    else { dropped++; }
    i = close + 1;
  }

  /* Only rewrite a file this pass actually pruned. Reassembling an @media block
     re-joins its rules and adds a blank line between each, so a file that lost
     nothing still comes back 49 bytes larger and churns the diff for no reason.
     A tool that edits files it had no work to do in is a tool you stop trusting. */
  if (dropped === before) { console.log(`${file}: nothing to drop, left untouched`); continue; }
  const next = out.join('').replace(/\n{3,}/g, '\n\n');
  if (!DRY) fs.writeFileSync(p, next);
  console.log(`${file}: ${css.length} -> ${next.length} bytes, ${dropped - before} rule(s) dropped`);
}

/** Keep a rule if any class in its selector is used by a rendered page. */
function keep(selectorBlob) {
  const sel = selectorBlob.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (!sel || sel.startsWith('@')) return true;
  const classes = [...sel.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
  if (!classes.length) return true;            // bare-tag or :root — not ours to judge
  const hit = classes.some((c) => used.has(c));
  if (!hit) console.log(`  drop  ${sel.split('\n').pop().trim()}`);
  return hit;
}

console.log(`\n${dropped} rule(s) ${DRY ? 'would be' : ''} dropped`);
