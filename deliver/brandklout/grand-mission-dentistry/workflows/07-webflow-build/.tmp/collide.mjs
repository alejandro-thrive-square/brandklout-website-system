/**
 * collide.mjs — find classes that share a NAME across the three page payloads
 * but carry DIFFERENT definitions.
 *
 * Webflow reconciles pasted classes by name: the first page pasted creates the
 * class, and every later paste of the same name REUSES the existing definition
 * (or forks a `-2` twin). So a same-name-different-def class is invisible on
 * page 1 and breaks pages 2 and 3.
 */
import fs from 'node:fs';

const PAGES = ['implant', 'cosmetic', 'thank-you'];
const defs = {}; // name -> { page -> {styleLess, variants, comb} }

for (const p of PAGES) {
  const doc = JSON.parse(fs.readFileSync(`${p}/final.json`, 'utf8'));
  for (const s of doc.payload.styles) {
    if (!s.name) continue;
    (defs[s.name] ||= {})[p] = {
      comb: s.comb || '',
      styleLess: (s.styleLess || '').trim(),
      variants: JSON.stringify(s.variants || {}),
    };
  }
}

const norm = (d) => `${d.comb}||${d.styleLess}||${d.variants}`;

let identical = 0;
const conflicts = [];
for (const [name, byPage] of Object.entries(defs)) {
  const pages = Object.keys(byPage);
  if (pages.length < 2) continue;
  const sigs = new Set(pages.map((p) => norm(byPage[p])));
  if (sigs.size === 1) { identical++; continue; }
  conflicts.push({ name, pages, byPage });
}

console.log(`classes present on >=2 pages: ${identical + conflicts.length}`);
console.log(`  identical definitions : ${identical}`);
console.log(`  CONFLICTING           : ${conflicts.length}`);
console.log('');

for (const c of conflicts.slice(0, 40)) {
  console.log(`### .${c.name}  (${c.pages.join(', ')})`);
  for (const p of c.pages) {
    const d = c.byPage[p];
    const varKeys = Object.keys(JSON.parse(d.variants));
    console.log(`   ${p.padEnd(10)} comb=${JSON.stringify(d.comb)} variants=[${varKeys.join(',')}]`);
    console.log(`      ${d.styleLess.slice(0, 200)}`);
  }
  console.log('');
}
if (conflicts.length > 40) console.log(`... and ${conflicts.length - 40} more`);

fs.writeFileSync('class-conflicts.json', JSON.stringify(conflicts, null, 1), 'utf8');
