/**
 * runtimeclasses.mjs — classes the scripts create at RUNTIME whose CSS the
 * packager tree-shook away.
 *
 * The packager keeps a rule only if its selector matches something in the
 * static markup. A class that no element carries until JS creates it therefore
 * looks unused and is dropped — the same family as the `.is-open` /
 * `[data-rail="on"]` runtime-state rules already documented, but harder to see,
 * because the element does not exist at all until a user acts.
 *
 * Found this way: `.form-ok`, the green success box the design shows after a
 * form submission. `done.className = 'form-ok'` in the script, zero
 * `form-ok` rules on the published page — so the moment a lead converts, the
 * confirmation renders as unstyled plain text on all six pages.
 *
 *   node runtimeclasses.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const DESIGN = resolve(HERE, '../../04-design/.tmp');
const PFX = {
  'dental-implants-ads-landing': 'imp', 'all-on-x-ads-landing': 'aox',
  'porcelain-veneers-ads-landing': 'vnr', 'emergency-dentist-ads-landing': 'emg',
  'dentist-near-me-ads-landing': 'dnm', 'next-door-family-ads-landing': 'nxd',
};
const kit = readFileSync(join(DESIGN, '_shared', 'journey.css'), 'utf8');

let problems = 0;
for (const [slug, pfx] of Object.entries(PFX)) {
  const html = readFileSync(join(HERE, 'staging', `${slug}.html`), 'utf8');
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');

  // Class names written by script rather than present in markup.
  const created = new Set();
  for (const m of scripts.matchAll(/\.className\s*=\s*'([^']+)'/g)) m[1].split(/\s+/).forEach((c) => created.add(c));
  for (const m of scripts.matchAll(/classList\.(?:add|toggle)\('([^']+)'/g)) created.add(m[1]);
  for (const m of scripts.matchAll(/class="([^"]+)"/g)) m[1].split(/\s+/).forEach((c) => created.add(c));

  const bad = [];
  for (const c of created) {
    if (!c || c.startsWith(`${pfx}-`)) continue;
    // Does the DESIGN style it? If the kit never styles it, losing it costs nothing.
    const styledInDesign = new RegExp(`\\.${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b[^{]*\\{`).test(kit);
    if (!styledInDesign) continue;
    // Is there ANY rule for it on the published page, bare or prefixed?
    const onPage = new RegExp(`\\.(?:${pfx}-)?${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b[^{]*\\{`).test(html);
    if (!onPage) bad.push(c);
  }
  problems += bad.length;
  console.log(`${slug.padEnd(34)} runtime classes ${String(created.size).padStart(3)}  styled-in-design-but-missing-on-page ${bad.length}` +
    (bad.length ? `  -> ${bad.join(', ')}` : '  clean'));
}
console.log(`\n${problems} runtime-created class(es) lost their CSS`);
process.exit(problems ? 1 : 0);
