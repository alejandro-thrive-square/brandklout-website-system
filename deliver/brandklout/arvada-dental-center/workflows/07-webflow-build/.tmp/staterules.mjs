/**
 * staterules.mjs — design rules keyed on RUNTIME STATE that the packager
 * tree-shook away.
 *
 * The packager keeps a rule only if its selector matches something in the
 * static markup. A rule keyed on a state that only exists after a user acts —
 * [aria-expanded="true"], [data-active="true"], [aria-pressed="true"] — matches
 * nothing at package time and is dropped, so the page renders correctly at rest
 * and gives no feedback the moment someone interacts.
 *
 * Found this way: the FAQ chevron never rotates on open.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const kit = readFileSync(resolve(HERE, '../../04-design/.tmp/_shared/journey.css'), 'utf8');
const PFX = {
  'dental-implants-ads-landing': 'imp', 'all-on-x-ads-landing': 'aox',
  'porcelain-veneers-ads-landing': 'vnr', 'emergency-dentist-ads-landing': 'emg',
  'dentist-near-me-ads-landing': 'dnm', 'next-door-family-ads-landing': 'nxd',
};

// Rules whose selector carries a state attribute or state class.
const STATE = /\[(?:aria-expanded|aria-pressed|data-active|data-open|data-rail|data-theme)[^\]]*\]|\.is-[a-z-]+|\.solid\b/;
const rules = [];
for (const m of kit.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const sel = m[1].trim().replace(/\s+/g, ' ');
  if (sel.startsWith('@') || !STATE.test(sel)) continue;
  rules.push({ sel, body: m[2].trim().replace(/\s+/g, ' ') });
}
console.log(`design rules keyed on runtime state: ${rules.length}\n`);

let missing = 0;
for (const [slug, pfx] of Object.entries(PFX)) {
  const html = readFileSync(join(HERE, 'staging', `${slug}.html`), 'utf8');
  const gone = [];
  for (const r of rules) {
    // map class tokens to the page prefix; leave state attrs and state classes bare
    const mapped = r.sel.replace(/\.([A-Za-z_][\w-]*)/g, (mm, c) =>
      (/^(is-|solid$)/.test(c) ? mm : `.${pfx}-${c}`));
    // does ANY rule with this selector exist on the page?
    const needle = mapped.replace(/\s+/g, '').slice(0, 60);
    const flat = html.replace(/\s+/g, '');
    if (!flat.includes(needle)) gone.push(mapped);
  }
  // only report those whose base element actually exists on this page
  const real = gone.filter((sel) => {
    const first = (sel.match(/\.[A-Za-z_][\w-]*/) || [])[0];
    return first ? html.includes(first.slice(1)) : false;
  });
  missing += real.length;
  console.log(`${slug.padEnd(34)} state rules missing ${real.length}${real.length ? '' : '  clean'}`);
  real.slice(0, 6).forEach((s) => console.log(`    ${s}`));
}
console.log(`\n${missing} state-keyed rule(s) missing across the six pages`);
process.exit(missing ? 1 : 0);
