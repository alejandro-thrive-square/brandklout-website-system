// BugHerd round three (2026-09-24): is what the replies promise actually on the published site?
//   node verify-0924.mjs [origin] > log      (default: staging)
// Reads the swap and drop plans straight out of bugherd-0924-images.py, so every photo
// row is checked, not a sample; then the copy, the menu, the layout rules, by page.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = process.argv[2] || 'https://staging.masonparkpediatricdental.com';
const py = fs.readFileSync(path.join(here, 'bugherd-0924-images.py'), 'utf8');
const swaps = [...py.matchAll(/^\s*\((\d+), "([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)"\),/gm)].map(m => ({ n: +m[1], page: m[2], sec: m[3], neu: m[5] }));
const dropBlock = py.slice(py.indexOf('DROP = ['));
const drops = [...dropBlock.matchAll(/^\s*\((\d+), "([^"]+)", "([^"]+)"\),/gm)].map(m => ({ n: +m[1], page: m[2], sec: m[3] }))
  .concat(['financing', 'new-patients', 'services/comprehensive-pediatric-dentistry', 'services/dental-cleanings-and-exams', 'services/invisalign', 'services/orthodontics', 'services/preventive-dentistry'].map(p => ({ n: 141, page: p, sec: 'questions' })));

const TEXT = [
  [42, 'thank-you', ['9am to 6pm'], ['8am to 5pm']],
  [43, 'special-offers', ['Five offers'], ['Four offers']],
  [58, 'our-services', ['Explore our services', 'Find the right care', 'do not know the name of a treatment', 'every care detail with your child'], ['The Map']],
  [68, 'index', ['We tailor each visit to their age, needs and comfort', 'Hear what families have shared about their visits'], []],
  [73, 'services/orthodontics', ['treatment timeline depends on their needs'], ['Sung']],
  [155, 'services/special-needs-patient-care', ['Our doctors have found'], ['Sung']],
  [146, 'blog/clear-orthodontic-braces-in-katy-tx-enhancing-smiles-with-clarity', ['Our team offers modern orthodontic solutions'], ['Sung']],
  [107, 'blog', ['Your go-to dental guide since', 'Five core topics', 'posts in the archive', 'organized by category'], ['Five shelves']],
  [112, 'about-us', ['starting at six months of age', 'As pediatric dentists in Katy', 'months'], []],
  [115, 'our-doctors', ['completed a pediatric dentistry residency', 'Book with Dr. Cho', 'After meeting at dental school in Boston', 'Where our doctors', 'A breakdown of the universities', 'Dr. Nguyen, with her patients'], []],
  [124, 'our-team', ['Familiar faces at', 'two specialists who support our team'], ['same nine faces']],
  [128, 'technology', ['creates a 3D image of your child', 'Chairside, with a young patient'], []],
  [149, 'services/invisalign', ['your child can take them out to eat, brush, and floss'], []],
  [153, 'services/sedation-dentistry', ['Recovery varies by the type of sedation', 'May be used with local anesthesia, when appropriate'], []],
  [166, 'pediatric-dentistry-faqs-katy-tx', ['Jump to a topic', 'Insurance and Booking'], []],
  [140, 'services/preventive-dentistry', ['Learn more'], []],
  [105, 'new-patients', ['>forms</a> to fill out online'], []],
];

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const cache = new Map();
async function open(p) {
  if (cache.has(p)) { await page.goto(cache.get(p), { waitUntil: 'load' }); return; }
  const url = `${ORIGIN}/${p === 'index' ? '' : p}`;
  const r = await page.goto(url, { waitUntil: 'load' });
  if (!r.ok()) console.log(`  ${url} -> ${r.status()}`);
  cache.set(p, url);
  await page.waitForTimeout(400);
}
const byPage = {};
for (const s of swaps) (byPage[s.page] ||= { swaps: [], drops: [], text: [] }).swaps.push(s);
for (const d of drops) (byPage[d.page] ||= { swaps: [], drops: [], text: [] }).drops.push(d);
for (const t of TEXT) (byPage[t[1]] ||= { swaps: [], drops: [], text: [] }).text.push(t);

for (const [p, job] of Object.entries(byPage)) {
  await open(p);
  for (const s of job.swaps) {
    const srcs = await page.$$eval(`section#${s.sec} img`, els => els.map(e => e.getAttribute('src') + ' ' + (e.getAttribute('srcset') || '')));
    ok(srcs.some(x => x.includes(s.neu)), `#${s.n} ${p} #${s.sec}: ${s.neu}`);
  }
  for (const d of job.drops) {
    const n = await page.$$eval(`section#${d.sec} .ch-figure.is-band`, els => els.length);
    ok(n === 0, `#${d.n} ${p} #${d.sec}: band removed (${n} left)`);
  }
  if (job.text.length) {
    const html = await page.content();
    const txt = html.replace(/&rsquo;/g, '\u2019');
    for (const [n, , want, not] of job.text) {
      for (const w of want) ok(txt.includes(w) || txt.includes(w.replace(/'/g, '\u2019')), `#${n} ${p}: has "${w}"`);
      for (const w of not) ok(!txt.includes(w), `#${n} ${p}: no "${w}"`);
    }
  }
}

// the menu, on one page
await open('index');
const cats = await page.$$eval('#masthead-menu > ul > li.has-sub:nth-child(3) > ul > li > a', a => a.map(x => x.textContent));
ok(cats.includes('Cosmetic and gum care'), `#76 menu categories: ${cats.length}`);
const second = await page.$$eval('#masthead-menu > ul > li.has-sub:nth-child(3) > ul > li.has-sub', l => l.length);
ok(second >= 6, `#59 categories with a second level: ${second}`);
// layout rules that shipped in site.css
await open('services/sealants');
const grid = await page.$eval('section#path', s => s.classList.contains('is-grid') && getComputedStyle(s.querySelector('.pa-track')).display);
ok(grid === 'grid', `#79 sealants path is a grid (${grid})`);
const shots = await page.$$eval('section#path .pa-shot', e => e.length);
ok(shots === 0, `#79 sealants path has no photo (${shots})`);
const pad = await page.$eval('section#how', s => getComputedStyle(s).paddingTop);
ok(parseFloat(pad) < 110, `#161 chapter padding at 1440: ${pad}`);
const align = await page.$eval('section#how .lf-split > :not(.lf-head)', e => getComputedStyle(e).alignSelf);
ok(align === 'center', `#51 text column align-self: ${align}`);
await open('about-us');
const unit = await page.$eval('.fig-unit', e => [e.textContent, getComputedStyle(e).fontSize]);
ok(unit[0] === 'months', `#88 unit "${unit[0]}" at ${unit[1]}`);
await open('patient-reviews');
const order = await page.$$eval('main section.ch', s => s.map(x => x.id).join(' '));
ok(/count write wall/.test(order), `#165 order: ${order}`);
const g = await page.$eval('section#write a.button', a => a.href);
ok(g.includes('cid=10994444486808824955'), `#165 Google link: ${g}`);
await browser.close();
console.log(fails ? `${fails} FAILED` : 'all passed');
