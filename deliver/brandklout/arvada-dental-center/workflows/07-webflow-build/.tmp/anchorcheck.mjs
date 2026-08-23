/**
 * anchorcheck.mjs — does every in-page anchor land on an element that exists?
 *
 * verify_links.mjs compares the design's hrefs against the published ones and
 * strips the page prefix first, because `#terms` publishing as `#imp-terms` is
 * a correct rename. That normalisation means it can never notice an href
 * pointing at an id that does not exist on the page at all — a CTA that scrolls
 * nowhere reads as a perfect match.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const DIR = join(HERE, 'staging');

let total = 0, dead = 0;
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.html'))) {
  const html = readFileSync(join(DIR, f), 'utf8');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const anchors = [...new Set([...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]))]
    .filter(Boolean);
  const missing = anchors.filter((a) => !ids.has(a));
  total += anchors.length; dead += missing.length;
  console.log(`${f.replace('.html', '').padEnd(34)} ${String(anchors.length).padStart(2)} anchors  ` +
    (missing.length ? `DEAD: ${missing.join(', ')}` : 'all resolve'));
}
console.log(`\n${total - dead}/${total} in-page anchors resolve`);
process.exit(dead ? 1 : 0);
