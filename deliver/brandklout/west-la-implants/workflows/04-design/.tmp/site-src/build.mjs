/* Assemble site-src into dist/ — every page, one CSS file, one JS file,
   vendored GSAP, media and fonts copied through.  Run: node build.mjs

   Pages come from three places, in this order:
     1. index.html            the approved homepage (its <main> is lifted out and
                              wrapped in the shared shell — nav, index, footer)
     2. pages/*.mjs           one module per designed page: export default
                              { slug, title, description, chapters:[…] }
     3. templates/*.mjs       generated sets: export default [ …pages ]
                              (the six neighbourhood pages, the journal)

   Every page's <title>/description also lands in seo.json, which the upload
   toolkit reads (build-import-input.mjs), so a page's SEO has one source. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { page as shell } from './lib/layout.mjs';
import { renderChapters, faqJsonLd } from './lib/blocks.mjs';
import { applyImageMap } from './lib/image-map.mjs';
import { SITE } from './lib/site.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, 'dist');
const list = (dir, ext) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith(ext)).sort().map(f => path.join(dir, f)) : []);
const seoJson = JSON.parse(fs.readFileSync(path.join(here, 'seo.json'), 'utf8'));
const ORIGIN = seoJson.origin.replace(/\/$/, '');

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'assets', 'gsap'), { recursive: true });
fs.mkdirSync(path.join(dist, 'blog'), { recursive: true });

// CSS — filename order is cascade order; font paths are rewritten for dist
let css = list(path.join(here, 'css'), '.css').map(f => `/* ==== ${path.basename(f)} ==== */\n` + fs.readFileSync(f, 'utf8')).join('\n\n');
css = css.replace(/url\('\.\.\/fonts\//g, "url('/fonts/");
fs.writeFileSync(path.join(dist, 'assets', 'site.css'), css);

// JS — runtime, then every section, then the late modules (80-seo, 90-boot)
const js = [
  ...list(path.join(here, 'js'), '.js').filter(f => /^00-/.test(path.basename(f))),
  ...list(path.join(here, 'sections'), '.js'),
  ...list(path.join(here, 'js'), '.js').filter(f => /^[1-9]\d-/.test(path.basename(f))),
].map(f => `/* ==== ${path.basename(f)} ==== */\n` + fs.readFileSync(f, 'utf8')).join('\n\n');
fs.writeFileSync(path.join(dist, 'assets', 'site.js'), js);

for (const f of fs.readdirSync(path.join(here, 'vendor', 'gsap'))) fs.copyFileSync(path.join(here, 'vendor', 'gsap', f), path.join(dist, 'assets', 'gsap', f));
fs.mkdirSync(path.join(dist, 'fonts'), { recursive: true });
for (const f of fs.readdirSync(path.join(here, 'fonts')).filter(f => f.endsWith('.woff2'))) fs.copyFileSync(path.join(here, 'fonts', f), path.join(dist, 'fonts', f));

/* ---------- the SEO object every page carries (js/80-seo.js reads it) ---------- */
const DENTIST = {
  '@type': 'Dentist',
  '@id': ORIGIN + '/#practice',
  name: SITE.name,
  url: ORIGIN + '/',
  telephone: '+1-310-692-9316',
  image: ORIGIN + '/media/img/tonybarrerie_headshot_dentist_westlaimplants_frontfacing.jpg',
  address: { '@type': 'PostalAddress', streetAddress: '12301 Wilshire Blvd, Suite 205', addressLocality: 'Los Angeles', addressRegion: 'CA', postalCode: '90025', addressCountry: 'US' },
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '17:00' }],
  founder: { '@type': 'Person', name: 'Tony Barriere', honorificSuffix: 'DDS', jobTitle: 'Implant and cosmetic dentist' },
  sameAs: Object.values(SITE.social).filter(u => !/google/.test(u)),
};
function seoFor(p, chapters) {
  const canonical = p.slug === 'index' ? ORIGIN + '/' : `${ORIGIN}/${p.slug}`;
  const jsonld = [{ ...DENTIST, '@context': 'https://schema.org' }];
  const faq = chapters ? faqJsonLd(chapters) : null;
  if (faq) jsonld.push({ '@context': 'https://schema.org', ...faq });
  if (p.jsonld) jsonld.push(...p.jsonld.map(j => ({ '@context': 'https://schema.org', ...j })));
  return { canonical, title: p.title, description: p.description, image: ORIGIN + (p.image || '/media/img/still-reception-neon.jpg'), type: p.type || 'website', noindex: !!p.noindex, ...(p.robots ? { robots: p.robots } : {}), jsonld };
}

/* ---------- 1. the homepage ---------- */
const pages = [];
{
  const raw = fs.readFileSync(path.join(here, 'index.html'), 'utf8');
  const title = raw.match(/<title>([^<]*)<\/title>/)[1];
  const description = raw.match(/<meta name="description" content="([^"]*)"/)[1];
  let body = raw.slice(raw.indexOf('<main>') + 6, raw.indexOf('</main>'));
  body = body.replace(/(src|poster|data-src|data-src-mobile)="media\//g, '$1="/media/');
  // the second CTA the agency asked for (Asana 1216841931530915): Zocdoc, in
  // the invitation's contact grid and under the form
  body = body.replace(
    /(<div><b>Hours<\/b><span>[^<]*<br>[^<]*<\/span><\/div>)/,
    `$1\n        <div><b>Book online</b><a href="${SITE.zocdoc}" target="_blank" rel="noopener">Pick a time on Zocdoc</a></div>`,
  );
  body = body.replace(
    /We reply within one business day\. Financing options are reviewed at your consultation\./,
    `We reply within one business day. Prefer to choose a time yourself? <a href="${SITE.zocdoc}" target="_blank" rel="noopener">Book on Zocdoc</a>.`,
  );
  // the eyebrow-only labels the agency asked for stay; nav links now go to pages
  body = body.replace(/href="#answer"/g, 'href="/dental-implants.html"').replace(/href="#precision"/g, 'href="/technology.html"');
  pages.push({ slug: 'index', title, description, body, image: '/media/img/still-reception-neon.jpg' });
}

/* ---------- 2. designed pages, 3. generated sets ---------- */
async function load(dir) {
  const out = [];
  for (const f of list(path.join(here, dir), '.mjs')) {
    const mod = await import(pathToFileURL(f).href + '?t=' + Date.now());
    const v = mod.default;
    for (const p of Array.isArray(v) ? v : [v]) out.push(p);
  }
  return out;
}
for (const p of [...(await load('pages')), ...(await load('templates'))]) {
  if (!p.slug || !p.title || !p.description) throw new Error(`page is missing slug/title/description: ${JSON.stringify(p).slice(0, 120)}`);
  if (p.description.length > 165) console.warn(`  description over 160 chars on ${p.slug} (${p.description.length})`);
  const body = p.body ?? renderChapters(p.chapters);
  pages.push({ ...p, body, seo: seoFor(p, p.chapters) });
}

/* the image-to-copy map (lib/image-map.mjs) — after every page has rendered, before anything is written */
{
  const misses = applyImageMap(pages, (f) => fs.existsSync(path.join(here, 'media', 'img', f)));
  // second pass: rows without an alt take the one this photo carries on the finished site
  const alts = {};
  for (const p of pages) for (const m of p.body.matchAll(/<img[^>]*src="\/media\/img\/([^"]+)"[^>]*alt="([^"]*)"/g)) {
    if (m[2] !== '__ALT__' && m[2].length > (alts[m[1]] || '').length) alts[m[1]] = m[2];
  }
  for (const p of pages) p.body = p.body.replace(/(<img[^>]*src="\/media\/img\/([^"]+)"[^>]*?)alt="__ALT__"/g, (_, pre, f) => `${pre}alt="${(alts[f] || '').replace(/"/g, '&quot;')}"`);
  // one alt per photo: Instatic stores alt on the asset, so two different captions means one page is wrong
  const seenAlt = {};
  for (const p of pages) for (const m of p.body.matchAll(/<img[^>]*src="\/media\/img\/([^"]+)"[^>]*alt="([^"]+)"/g)) (seenAlt[m[1]] ||= new Set()).add(m[2]);
  const multi = Object.entries(seenAlt).filter(([, v]) => v.size > 1).map(([f, v]) => `${f}: ${[...v].join(' | ')}`);
  if (multi.length) console.warn('PHOTOS WITH MORE THAN ONE ALT (Instatic keeps the longest):\n  ' + multi.join('\n  '));
  if (misses.length) {
    console.error('IMAGE MAP rows that did not apply:\n  ' + misses.join('\n  '));
    if (process.argv.includes('--strict')) process.exit(1);
  }
}

// media is copied AFTER the templates ran: the journal copies its hero images into media/img as it loads
fs.cpSync(path.join(here, 'media'), path.join(dist, 'media'), { recursive: true });

/* ---------- write ---------- */
const seen = new Set();
const seoOut = { origin: ORIGIN, pages: {} };
for (const p of pages) {
  if (seen.has(p.slug)) throw new Error(`duplicate slug ${p.slug}`);
  seen.add(p.slug);
  const seo = p.seo ?? seoFor(p, null);
  const html = shell({ slug: p.slug, title: p.title, description: p.description, body: p.body, seo, bodyClass: p.bodyClass || '', chrome: p.chrome || null });
  const file = path.join(dist, p.slug + '.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  seoOut.pages[p.slug] = { title: p.title, description: p.description };
}
fs.writeFileSync(path.join(here, 'seo.json'), JSON.stringify(seoOut, null, 2) + '\n');

/* every internal link must resolve to a page we just wrote */
{
  const problems = [];
  for (const p of pages) {
    for (const m of p.body.matchAll(/href="\/([a-z0-9\-\/]+)\.html(#[^"]*)?"/g)) {
      if (!seen.has(m[1])) problems.push(`${p.slug} -> /${m[1]}.html`);
    }
    for (const m of p.body.matchAll(/(?:src|poster|data-src|data-src-mobile|data-src-hover)="\/(media\/[^"]+)"/g)) {
      if (!fs.existsSync(path.join(dist, m[1]))) problems.push(`${p.slug} -> missing ${m[1]}`);
    }
  }
  if (problems.length) {
    console.error('BROKEN REFERENCES:\n  ' + [...new Set(problems)].join('\n  '));
    process.exit(1);
  }
}

const size = p => (fs.statSync(p).size / 1024).toFixed(1) + ' KB';
console.log('dist/assets/site.css', size(path.join(dist, 'assets', 'site.css')));
console.log('dist/assets/site.js ', size(path.join(dist, 'assets', 'site.js')));
console.log(`pages: ${pages.length} (${pages.filter(p => !p.slug.startsWith('blog/')).length} designed, ${pages.filter(p => p.slug.startsWith('blog/')).length} journal entries)`);
