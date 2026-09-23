#!/usr/bin/env node
/**
 * facts.mjs — pull the load-bearing copy out of a previous-build design page.
 *
 * The v2 pages must carry the practice's real numbers, credentials, offers and
 * reviews forward unchanged; those were hard to source and inventing any of
 * them would be a clinical/marketing claim we have no basis for. This prints
 * only the parts that matter — headings, money, questions, named reviews — so
 * a whole page's prose does not have to be read to write its content JSON.
 *
 *   node facts.mjs <slug> [more slugs…]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DESIGN = path.resolve(HERE, '../../../04-design/.tmp');

const clean = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&middot;/g, '·').replace(/&amp;/g, '&')
  .replace(/&larr;/g, '<-').replace(/&rarr;/g, '->').replace(/&#\d+;/g, '').replace(/\s+/g, ' ').trim();

for (const slug of process.argv.slice(2)) {
  const file = path.join(DESIGN, slug, 'index.html');
  if (!fs.existsSync(file)) { console.log(`\n===== ${slug}: no index.html =====`); continue; }
  let h = fs.readFileSync(file, 'utf8')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '');

  const grab = (re) => [...h.matchAll(re)].map((m) => clean(m[1])).filter(Boolean);
  const lines = [...new Set(h.replace(/<[^>]+>/g, '\n').split('\n').map(clean).filter((s) => s.length > 3))];

  console.log(`\n===== ${slug} =====`);
  console.log('TITLE  ', (h.match(/<title>(.*?)<\/title>/s) || [])[1]);
  console.log('H1     ', grab(/<h1[^>]*>([\s\S]*?)<\/h1>/g).join(' ~ '));
  console.log('H2     ', grab(/<h2[^>]*>([\s\S]*?)<\/h2>/g).slice(0, 14).join(' ~ '));
  console.log('H3     ', grab(/<h3[^>]*>([\s\S]*?)<\/h3>/g).slice(0, 22).join(' ~ '));

  const money = lines.filter((t) => /\$\s?[\d,]{3,}/.test(t)).slice(0, 6);
  if (money.length) console.log('MONEY  ', money.join('\n        '));

  const qs = lines.filter((t) => t.endsWith('?') && t.length < 95).slice(0, 10);
  if (qs.length) console.log('ASKS   ', qs.join('\n        '));

  // review attributions read as a short Name line right before a source line
  const revs = lines.filter((t, i) => /^(Google review|Practice video)$/i.test(lines[i + 1] || '') && t.length < 40);
  if (revs.length) console.log('REVIEW ', revs.join(' | '));

  const claims = lines.filter((t) => /(since 20\d\d|certified|sedation|guided|3D|lab|top dentist|years)/i.test(t) && t.length < 80).slice(0, 10);
  if (claims.length) console.log('CLAIMS ', claims.join('\n        '));
}
