/* Assemble site-src into dist/: every page, one stylesheet, one script, vendored GSAP, media and
   fonts copied through. Run: node build.mjs   (never pipe Node on Windows)

   Pages:
     pages/index.html          the home page body, written by hand (its SEO is HOME below)
     pages/<path>.mjs          every other page: `export default { seo, body, form }`, composed from
                               lib/ui.mjs. Nested files keep their path: pages/services/all-on-x.mjs
                               builds dist/services/all-on-x.html, served at /services/all-on-x.
   Layout the push toolkit expects (tools/instatic-site/lib/paths.mjs):
     dist/<slug>.html, dist/assets/site.css, dist/assets/site.js, dist/assets/gsap/,
     dist/media/img, dist/media/video, dist/fonts
   css/ and js/ are joined in filename order (cascade order). seo.json is WRITTEN here from the
   pages (build-import-input.mjs reads each page's title and description from it). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ORIGIN, FACTS } from './lib/site.mjs';
import { before, header, footer, callbar, esc } from './lib/shell.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, 'dist');
const read = (...p) => fs.readFileSync(path.join(here, ...p), 'utf8');
const list = (dir, ext) => fs.readdirSync(path.join(here, dir)).filter((f) => f.endsWith(ext)).sort();

const HOME = {
  title: 'Dental Implants in Hackensack, NJ | Hackensack Center',
  description: 'Rebuild your smile at Hackensack Center for Dental Implants. Dr. Alan Meskin offers All-on-X, single implants & full mouth restoration.',
  image: 'hero.webp',
};

fs.rmSync(dist, { recursive: true, force: true });
for (const d of ['assets/gsap', 'media/img', 'media/video', 'fonts']) fs.mkdirSync(path.join(dist, d), { recursive: true });

const css = list('css', '.css').map((f) => `/* ==== ${f} ==== */\n${read('css', f)}`).join('\n\n');
fs.writeFileSync(path.join(dist, 'assets', 'site.css'), css);
const js = list('js', '.js').map((f) => `/* ==== ${f} ==== */\n${read('js', f)}`).join('\n\n');
fs.writeFileSync(path.join(dist, 'assets', 'site.js'), js);
const copyDir = (from, to, keep = () => true) => {
  if (!fs.existsSync(path.join(here, from))) return;
  for (const f of fs.readdirSync(path.join(here, from))) if (keep(f) && fs.statSync(path.join(here, from, f)).isFile()) fs.copyFileSync(path.join(here, from, f), path.join(dist, to, f));
};
copyDir('vendor/gsap', 'assets/gsap');
copyDir('fonts', 'fonts', (f) => f.endsWith('.woff2'));
copyDir('media/img', 'media/img');
copyDir('media/video', 'media/video');

const practice = {
  '@type': 'Dentist',
  '@id': `${ORIGIN}/#practice`,
  name: FACTS.name,
  url: `${ORIGIN}/`,
  telephone: FACTS.phoneE164,
  image: `${ORIGIN}/media/img/hero.webp`,
  logo: `${ORIGIN}/media/img/logo-round.png`,
  address: { '@type': 'PostalAddress', streetAddress: FACTS.street, addressLocality: FACTS.city, addressRegion: FACTS.region, postalCode: FACTS.zip, addressCountry: 'US' },
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '10:00', closes: '18:00' }],
  areaServed: FACTS.area,
  hasMap: FACTS.map,
  sameAs: FACTS.sameAs,
};

/* every page: [{ slug, route, seo, body, form }] */
const pages = [{ slug: 'index', route: '/', seo: HOME, body: read('pages', 'index.html'), form: true }];
const walk = (dir, pre = '') => fs.readdirSync(path.join(here, dir)).sort().flatMap((e) => {
  const p = path.join(here, dir, e);
  if (fs.statSync(p).isDirectory()) return walk(path.join(dir, e), pre + e + '/');
  return e.endsWith('.mjs') && !e.startsWith('_') ? [{ file: p, slug: pre + e.replace(/\.mjs$/, '') }] : [];
});
for (const { file, slug } of walk('pages')) {
  const mod = (await import(pathToFileURL(file).href)).default;
  const page = typeof mod === 'function' ? await mod() : mod;
  if (!page?.seo?.title || !page?.seo?.description) throw new Error(`pages/${slug}.mjs has no seo.title / seo.description`);
  pages.push({ slug, route: `/${slug}`, ...page });
}

/* The patient-film posters: every page that shows the films gets its own stills (film-isaac-<k>,
   film-daniel-<k>, cut from different moments of the two films by code/cut-images.py), so no photo
   repeats across the treatment pages (IMAGES.md section 3). k follows the page order, so it is stable. */
{
  let k = 0;
  for (const p of pages) {
    if (!p.body.includes('/media/img/film-isaac.webp') && !p.body.includes('/media/img/film-daniel.webp')) continue;
    k++;
    p.body = p.body.replaceAll('/media/img/film-isaac.webp', `/media/img/film-isaac-${k}.webp`).replaceAll('/media/img/film-daniel.webp', `/media/img/film-daniel-${k}.webp`);
  }
}

/* LOCAL_GATES=1: the vendor snippets (GoHighLevel, Elfsight, Google Maps) are left out of the markers,
   so the local browser gates run offline and fast: GHL's Turnstile answers 401 on localhost and
   Elfsight keeps the network busy, so networkidle never settles. The live gates see the real blocks.
   Never push a LOCAL_GATES build: the import reads the snippets out of dist/. */
const emptyMarkers = (html) => {
  /* each marker is emptied up to the </div> that balances it: vendor snippets carry divs of their own */
  const open = /<div[^>]*\sdata-embed="[^"]*"[^>]*>/g;
  let out = '';
  let cursor = 0;
  let m;
  while ((m = open.exec(html))) {
    const start = m.index + m[0].length;
    const tag = /<\/?div\b[^>]*>/g;
    tag.lastIndex = start;
    let depth = 1;
    let t;
    while ((t = tag.exec(html))) { depth += t[0].startsWith('</') ? -1 : 1; if (depth === 0) break; }
    out += html.slice(cursor, start);
    cursor = t ? t.index : start;
    open.lastIndex = cursor;
  }
  return out + html.slice(cursor);
};
if (process.env.LOCAL_GATES) for (const p of pages) p.body = emptyMarkers(p.body);

const seoOut = { origin: ORIGIN, note: 'Written by build.mjs from the pages. Do not edit by hand.', pages: {} };
let built = 0;
for (const p of pages) {
  const canonical = ORIGIN + p.route.replace(/^\/$/, '/');
  const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  /* FAQ schema is read off the markup, so the answers on the page and in the schema cannot drift */
  const faq = [...p.body.matchAll(/<summary class="faq_question"[^>]*>([\s\S]*?)<\/summary>\s*<div class="faq_answer[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/details>|<summary class="faq_question"[^>]*>([\s\S]*?)<\/summary>\s*<p class="faq_answer[^"]*"[^>]*>([\s\S]*?)<\/p>/g)]
    .map((m) => ({ '@type': 'Question', name: strip(m[1] ?? m[3]), acceptedAnswer: { '@type': 'Answer', text: strip(m[2] ?? m[4]) } }));
  const graph = [practice, { '@type': 'WebPage', '@id': `${canonical}#page`, url: canonical, name: p.seo.title, description: p.seo.description, about: { '@id': `${ORIGIN}/#practice` } }];
  if (p.crumbs) graph.push({ '@type': 'BreadcrumbList', itemListElement: [['/', 'Home'], ...p.crumbs].map(([h, n], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: ORIGIN + h })) });
  if (p.schema) graph.push(...[].concat(p.schema));
  if (faq.length) graph.push({ '@type': 'FAQPage', '@id': `${canonical}#faq`, mainEntity: faq });
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.seo.title)}</title>
<meta name="description" content="${esc(p.seo.description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(p.seo.title)}">
<meta property="og:description" content="${esc(p.seo.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ORIGIN}/media/img/${p.seo.image || 'hero.webp'}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/media/img/logo-icon-dark.png">
<link rel="stylesheet" href="/assets/site.css">
<!-- GSAP is vendored: Instatic publishes script-src 'self', so no CDN. Plugins are registered at
     the end of <body> by site.js, never here. -->
<script src="/assets/gsap/gsap.min.js"></script>
<script src="/assets/gsap/ScrollTrigger.min.js"></script>
<script src="/assets/gsap/ScrollSmoother.min.js"></script>
<script src="/assets/gsap/SplitText.min.js"></script>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>
</head>
<body>
${before()}
<div id="smooth-wrapper"><div id="smooth-content"><div class="page-wrapper">
${header(p.route)}
<main class="main-wrapper" id="main">
${p.body}
</main>
${footer()}
</div></div></div>
${callbar(p.form)}
<script src="/assets/site.js"></script>
</body>
</html>
`;
  const out = path.join(dist, `${p.slug}.html`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  seoOut.pages[p.slug] = { title: p.seo.title, description: p.seo.description, image: p.seo.image || 'hero.webp' };
  /* A copy of the home page that opens by double-click. dist/ uses root-relative paths (what
     Instatic serves), so dist/index.html shows unstyled from file://; this one is relative. */
  if (p.slug === 'index') {
    const rel = 'code/site-src/dist/';
    fs.writeFileSync(path.resolve(here, '..', '..', 'OPEN-home.html'),
      html.replace(/(src|href|srcset|poster|data-src|data-src-mobile)="\/(assets|media|fonts)\//g, `$1="${rel}$2/`).replace('<head>', '<head>\n<!-- Generated by build.mjs for local viewing. Do not edit; do not push. For every page run code/serve.mjs. -->'));
  }
  built++;
  console.log(`built ${(p.slug + '.html').padEnd(48)} ${(html.length / 1024).toFixed(0).padStart(3)} KB, ${faq.length} FAQ pairs`);
}
fs.writeFileSync(path.join(here, 'seo.json'), JSON.stringify(seoOut, null, 2) + '\n');
console.log(`${built} page(s); site.css ${(css.length / 1024).toFixed(0)} KB, site.js ${(js.length / 1024).toFixed(0)} KB`);
