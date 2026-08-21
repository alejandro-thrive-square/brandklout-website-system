#!/usr/bin/env node
/**
 * check-images.mjs — gate every image a rendered page uses.
 *
 *   node check-images.mjs <topic> [more ...]     default: all three
 *
 * Three failures this catches, all of which were real on this build:
 *
 * 1. THE PAGE CLAIMS NO STOCK PHOTOGRAPHY. Legacy's asset library holds at
 *    least seven `AdobeStock_*` files sitting right beside the practice's own
 *    photographs, and the landing page says in as many words that none are
 *    used. That sentence has to be enforced by something other than good
 *    intentions, because the next person to swap an image will not read it.
 *
 * 2. AN ASSET ID THAT DOES NOT EXIST still renders as a plausible-looking URL.
 *    Two gallery URLs on the first draft were reconstructed from a filename
 *    pattern rather than read from `list_assets`, and both 404ed while looking
 *    entirely correct in the JSON.
 *
 * 3. A PATIENT NAME IN A FILENAME. The practice's own before-and-after files
 *    include `B&A Invisalign Richard.webp` and `Rosa Before and After
 *    Invisalign...`. The client settled on 2026-08-20 that no patient name
 *    appears in a caption, in alt text, or in a filename. We cannot rename
 *    their assets — that would mutate the live site — so the rule here is
 *    simply that those files are not used, and any alt text carrying a first
 *    name is refused.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const V1 = path.resolve(HERE, '../../../04-design/.tmp/v1');
const topics = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const PAGES = topics.length ? topics : ['invisalign', 'invisalign-consult', 'invisalign-ty'];

const assets = new Map(
  JSON.parse(fs.readFileSync(path.join(HERE, 'assets.json'), 'utf8')).map((a) => [a.id, a]),
);

/** First names that appear in the practice's own asset filenames. */
const PATIENT_NAMES = ['richard', 'rosa', 'shaniesha', 'seham', 'paul hahn', 'linda kyle', 'rocio'];

let errors = 0;
const seen = new Set();

for (const page of PAGES) {
  const file = path.join(V1, page, 'body.html');
  if (!fs.existsSync(file)) { console.log(`${page}: not rendered yet, skipping`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  console.log(`\n${page}: ${imgs.length} image(s)`);

  for (const tag of imgs) {
    const src = (tag.match(/\bsrc="([^"]*)"/) || [])[1] || '';
    const alt = (tag.match(/\balt="([^"]*)"/) || [])[1];
    const id = (decodeURIComponent(src.split('/').pop() || '').match(/^([0-9a-f]{24})_/) || [])[1];
    const label = src.split('/').pop()?.slice(0, 44);

    if (alt === undefined || alt.trim() === '') {
      console.log(`  MISSING ALT  ${label}`); errors++;
    }
    if (!id) {
      console.log(`  NOT A WEBFLOW ASSET URL  ${src.slice(0, 70)}`); errors++; continue;
    }
    const a = assets.get(id);
    if (!a) { console.log(`  NO SUCH ASSET ${id}  ${label}`); errors++; continue; }
    if (a.hostedUrl !== src) {
      console.log(`  URL DOES NOT MATCH THE ASSET LIBRARY  ${id}\n     used ${src}\n     real ${a.hostedUrl}`);
      errors++; continue;
    }
    const name = (a.displayName || a.originalFileName || '').toLowerCase();
    if (name.includes('adobestock') || name.includes('shutterstock') || name.includes('istock')) {
      console.log(`  STOCK PHOTOGRAPHY  ${id}  ${a.displayName}`); errors++;
    }
    for (const n of PATIENT_NAMES) {
      if (name.includes(n)) { console.log(`  PATIENT NAME IN FILENAME  ${id}  ${a.displayName}`); errors++; }
      if ((alt || '').toLowerCase().includes(n)) { console.log(`  PATIENT NAME IN ALT  ${id}  ${alt}`); errors++; }
    }
    seen.add(id);
  }
}

console.log(`\n${seen.size} distinct asset(s) used, ${errors} problem(s)`);
if (errors) process.exit(1);
console.log('every image resolves to a real Legacy asset, none is stock, no patient name appears.');
