/* audit-report.mjs — turn an audit run's *.json into one readable report.
 *   node audit-report.mjs [--in audit-out] [--out report.md]
 * Groups by DEFECT CLASS, not by page, because that is the order the fixes are
 * applied in: one pass per class across every page beats 77 page-by-page trips.
 */
import fs from 'node:fs';
import path from 'node:path';

const HERE = import.meta.dirname;
const argv = process.argv.slice(2);
const DIR = path.join(HERE, argv.includes('--in') ? argv[argv.indexOf('--in') + 1] : 'audit-out');
const OUT = path.join(HERE, argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : 'audit-report.md');

const recs = fs.readdirSync(DIR).filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')));
const pages = recs.filter((r) => r.kind !== 'post');
const posts = recs.filter((r) => r.kind === 'post');
const L = [];
const say = (s = '') => L.push(s);

say('# Dr. Nahlah — published-site audit');
say('');
say(`Source: the served pages, under headless Chrome. ${recs.length} URLs `
  + `(${pages.length} pages, ${posts.length} posts).`);
say('');

/** One row per defect class: what it is, how many URLs, which ones. */
const classes = [];
const cls = (name, test, detail) => {
  const hit = recs.filter((r) => r.ok && test(r));
  if (hit.length) classes.push({ name, hit, detail });
};

cls('HTTP status is not 200', (r) => r.status && r.status !== 200, (r) => String(r.status));
cls('Page failed to audit', (r) => false);
cls('Duplicate <title> across URLs', () => false);
cls('No meta description', (r) => !r.description);
cls('No canonical link', (r) => !r.canonical);
cls('No Open Graph image', (r) => !r.ogImage);
cls('No JSON-LD', (r) => !(r.jsonld || []).length);
cls('h1 count is not exactly 1', (r) => r.h1Count !== 1, (r) => `${r.h1Count}`);
cls('Broken images', (r) => (r.imgBroken || []).length, (r) => `${r.imgBroken.length}: ${r.imgBroken.slice(0, 3).join(', ')}`);
cls('Images with no alt text', (r) => (r.imgNoAlt || []).length, (r) => `${r.imgNoAlt.length}/${r.imgTotal}`);
cls('Image served far below its display size', (r) => (r.imgLowRes || []).length, (r) => r.imgLowRes.slice(0, 2).join('; '));
cls('Before/after slider does not drive the wipe', (r) => (r.ba || []).some((b) => !b.drives),
  (r) => `${r.ba.filter((b) => !b.drives).length}/${r.baCount} (input type: ${[...new Set(r.ba.map((b) => b.type))].join('/')})`);
cls('Video has no poster', (r) => (r.videos || []).some((v) => !v.poster), (r) => r.videos.filter((v) => !v.poster).map((v) => v.cls || '(unclassed)').join(', '));
cls('Video is not playing', (r) => (r.videos || []).some((v) => !v.playing), (r) => r.videos.filter((v) => !v.playing).map((v) => v.cls || '(unclassed)').join(', '));
cls('JavaScript threw', (r) => (r.jsErrors || []).length, (r) => r.jsErrors[0]);
cls('Console error', (r) => (r.consoleErrors || []).length, (r) => r.consoleErrors[0]);
cls('Sub-resource 4xx/5xx', (r) => (r.badResponses || []).length, (r) => r.badResponses.join('; '));
cls('Horizontal overflow', (r) => r.overflowX > 1, (r) => `${r.overflowX}px`);
cls('GSAP absent', (r) => !r.gsap);
cls('No ScrollTriggers', (r) => r.gsap && r.scrollTriggers === 0);
cls('Reveal stranded at opacity 0', (r) => r.revealsStuck > 0, (r) => `${r.revealsStuck}`);
cls('Burger has no bars', (r) => r.burgerBars === 0);
cls('.btn label span missing', (r) => r.btnCount > 0 && r.btnSpans < r.btnCount, (r) => `${r.btnSpans}/${r.btnCount}`);
cls('Em dash in copy', (r) => r.emDash > 0, (r) => `${r.emDash}`);
cls('Lorem ipsum', (r) => r.loremIpsum);
cls('Build flag left in the page', (r) => (r.buildFlags || []).length, (r) => r.buildFlags.join(', '));
cls('Empty text element', (r) => r.emptyText > 0, (r) => `${r.emptyText}`);
cls('Thin page (<150 words)', (r) => r.words < 150, (r) => `${r.words} words`);

// Duplicate titles / descriptions are a property of the SET, not of one page.
const byTitle = new Map(), byDesc = new Map();
for (const r of recs) {
  if (!r.ok) continue;
  byTitle.set(r.title, (byTitle.get(r.title) || 0) + 1);
  byDesc.set(r.description, (byDesc.get(r.description) || 0) + 1);
}

say('## Site-wide');
say('');
const dupT = [...byTitle.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
const dupD = [...byDesc.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
say(`- distinct \`<title>\` across ${recs.length} URLs: **${byTitle.size}**`);
for (const [t, n] of dupT.slice(0, 5)) say(`  - ${n} URLs share \`${t}\``);
say(`- distinct \`<meta description>\`: **${byDesc.size}**`);
for (const [d, n] of dupD.slice(0, 5)) say(`  - ${n} URLs share \`${(d || '(none)').slice(0, 90)}…\``);
say('');

say('## Defects, by class');
say('');
if (!classes.length) say('None.');
for (const c of classes.sort((a, b) => b.hit.length - a.hit.length)) {
  say(`### ${c.name} — ${c.hit.length} URL${c.hit.length === 1 ? '' : 's'}`);
  say('');
  for (const r of c.hit.slice(0, 12)) {
    say(`- \`${r.slug}\`${c.detail ? ' — ' + c.detail(r) : ''}`);
  }
  if (c.hit.length > 12) say(`- …and ${c.hit.length - 12} more`);
  say('');
}

const failed = recs.filter((r) => !r.ok);
if (failed.length) {
  say('## URLs the audit could not measure');
  say('');
  for (const r of failed) say(`- \`${r.slug}\` — ${r.error}`);
  say('');
}

say('## Per-URL');
say('');
say('| URL | status | words | imgs | no-alt | sliders | STs | h1 |');
say('|---|---|---|---|---|---|---|---|');
for (const r of recs) {
  if (!r.ok) { say(`| \`${r.slug}\` | ERROR | | | | | | |`); continue; }
  const sl = r.baCount ? `${r.ba.filter((b) => b.drives).length}/${r.baCount}` : '';
  say(`| \`${r.slug}\` | ${r.status} | ${r.words} | ${r.imgTotal} | ${r.imgNoAlt.length} | ${sl} | ${r.scrollTriggers} | ${r.h1Count} |`);
}

fs.writeFileSync(OUT, L.join('\n') + '\n');
console.log('wrote', OUT, '(' + L.length + ' lines)');
