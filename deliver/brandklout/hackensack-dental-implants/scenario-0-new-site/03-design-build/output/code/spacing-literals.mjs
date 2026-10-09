// Client script, 2026-10-09. Counts the rem spacing literals (padding / margin / gap) in site-src/css the
// way structure-audit.mjs does, grouped by value and file, so the token pass can see what to move.
// Usage (from the step's output/ folder): node code/spacing-literals.mjs > spacing.txt
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CSS = path.join(here, 'site-src', 'css');
const SPACE = /^(padding|margin)(-(top|right|bottom|left|block|inline))?$|^(gap|row-gap|column-gap)$/;
const byValue = new Map();
let literal = 0;
let token = 0;
for (const f of fs.readdirSync(CSS).filter((n) => n.endsWith('.css'))) {
  const src = fs.readFileSync(path.join(CSS, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of src.matchAll(/([a-z-]+)\s*:\s*([^;{}]+);/g)) {
    const prop = m[1].trim();
    if (!SPACE.test(prop)) continue;
    const v = m[2].trim();
    if (!/rem/.test(v)) continue;
    if (/var\(--/.test(v)) { token++; continue; }
    literal++;
    for (const r of v.match(/-?[\d.]+rem/g) || []) {
      const k = r.replace(/^-/, '');
      const e = byValue.get(k) || { n: 0, files: new Set() };
      e.n++;
      e.files.add(f);
      byValue.set(k, e);
    }
  }
}
console.log(`token ${token}, literal ${literal} (${Math.round((100 * token) / (token + literal))}% on tokens)`);
for (const [k, e] of [...byValue].sort((a, b) => b[1].n - a[1].n)) console.log(`${k.padEnd(10)} ${String(e.n).padStart(4)}  ${(parseFloat(k) * 16).toFixed(1).padStart(6)}px  ${[...e.files].join(', ')}`);
