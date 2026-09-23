/**
 * wiringcheck.mjs — self-consistency checks on the published page.
 *
 * Every defect the last three passes found (dead cross-sell links, a dead
 * FAQ/quiz/validation, 29 dead CTAs) was invisible to design-vs-staging
 * comparison and obvious to a question the page can answer about ITSELF. This
 * is the rest of that family:
 *
 *   - aria-controls / aria-labelledby / aria-describedby pointing at ids that
 *     do not exist — same failure mode as the dead anchors, and it silently
 *     breaks screen-reader association on an accordion that otherwise works.
 *   - <button> inside a <form> with no type: HTML defaults it to SUBMIT, so a
 *     quiz "Back" or an accordion toggle submits the form instead.
 *   - page <title> / meta description missing or left at a placeholder, on
 *     pages bought traffic lands on.
 *   - external hrefs that 404 (the Google Maps short link in particular —
 *     goo.gl short links were sunset).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const DIR = join(HERE, 'staging');
let problems = 0;

const external = new Map();
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.html'))) {
  const html = readFileSync(join(DIR, f), 'utf8');
  const page = f.replace('.html', '');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const out = [];

  // 1. ARIA references must resolve
  for (const attr of ['aria-controls', 'aria-labelledby', 'aria-describedby']) {
    for (const m of html.matchAll(new RegExp(`${attr}="([^"]+)"`, 'g'))) {
      for (const ref of m[1].trim().split(/\s+/)) {
        if (ref && !ids.has(ref)) out.push(`${attr}="${ref}" -> no such id`);
      }
    }
  }

  // 2. A <button> with no type inside a form defaults to submit
  for (const fm of html.matchAll(/<form\b[\s\S]*?<\/form>/g)) {
    for (const b of fm[0].matchAll(/<button\b([^>]*)>/g)) {
      if (!/\btype=/.test(b[1])) out.push(`<button> in <form> with no type= (defaults to submit)`);
    }
  }

  // 3. Title and description
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const desc = (html.match(/<meta\s+content="([^"]*)"\s+name="description"/) ||
                html.match(/<meta\s+name="description"\s+content="([^"]*)"/) || [])[1] || '';
  if (!title.trim()) out.push('empty <title>');
  if (!desc.trim()) out.push('no meta description');

  // 4. Collect external links for a liveness check
  for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    const u = m[1];
    if (/website-files\.com|fonts\.googleapis|jsdelivr|gstatic|googletagmanager/.test(u)) continue;
    if (!external.has(u)) external.set(u, new Set());
    external.get(u).add(page);
  }

  problems += out.length;
  const uniq = [...new Set(out)];
  console.log(`${page.padEnd(34)} ${uniq.length ? uniq.length + ' issue(s)' : 'clean'}` +
    `   title=${JSON.stringify(title.slice(0, 44))}`);
  uniq.forEach((o) => console.log(`    ${o}${out.filter((x) => x === o).length > 1 ? ` (x${out.filter((x) => x === o).length})` : ''}`));
}

console.log(`\n=== external links (${external.size}) ===`);
for (const [u, pages] of external) {
  let status = 'ERR';
  try {
    const r = await fetch(u, { method: 'GET', redirect: 'follow' });
    status = r.status;
  } catch (e) { status = 'ERR ' + e.message.slice(0, 40); }
  const bad = status !== 200;
  if (bad) problems++;
  console.log(`  ${String(status).padEnd(6)} ${u.slice(0, 72)}  [${[...pages].length} page(s)]`);
}

console.log(`\n${problems} problem(s)`);
process.exit(problems ? 1 : 0);
