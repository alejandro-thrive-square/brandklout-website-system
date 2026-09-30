/* Assemble site-src into dist/: every page in pages/, one stylesheet, one script, vendored GSAP,
   media and fonts copied through. Run: node build.mjs   (never pipe Node on Windows)

   Layout the push toolkit expects (tools/instatic-site/lib/paths.mjs):
     dist/<page>.html, dist/assets/site.css, dist/assets/site.js, dist/assets/gsap/,
     dist/media/img, dist/media/video, dist/fonts
   css/ is joined in filename order (cascade order); js/ likewise. seo.json is the one source for
   each page's title, description and canonical. Facts come from docs/facts.md. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, 'dist');
const read = (...p) => fs.readFileSync(path.join(here, ...p), 'utf8');
const list = (dir, ext) => fs.readdirSync(path.join(here, dir)).filter((f) => f.endsWith(ext)).sort();
const seo = JSON.parse(read('seo.json'));
const ORIGIN = seo.origin.replace(/\/$/, '');

fs.rmSync(dist, { recursive: true, force: true });
for (const d of ['assets/gsap', 'media/img', 'media/video', 'fonts']) fs.mkdirSync(path.join(dist, d), { recursive: true });

const css = list('css', '.css').map((f) => `/* ==== ${f} ==== */\n${read('css', f)}`).join('\n\n');
fs.writeFileSync(path.join(dist, 'assets', 'site.css'), css);
const js = list('js', '.js').map((f) => `/* ==== ${f} ==== */\n${read('js', f)}`).join('\n\n');
fs.writeFileSync(path.join(dist, 'assets', 'site.js'), js);
const copyDir = (from, to, keep = () => true) => {
  for (const f of fs.readdirSync(path.join(here, from))) if (keep(f)) fs.copyFileSync(path.join(here, from, f), path.join(dist, to, f));
};
copyDir('vendor/gsap', 'assets/gsap');
copyDir('fonts', 'fonts', (f) => f.endsWith('.woff2'));
copyDir('media/img', 'media/img');
copyDir('media/video', 'media/video');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const F = seo.facts;
const practice = {
  '@type': 'Dentist',
  '@id': `${ORIGIN}/#practice`,
  name: F.name,
  url: `${ORIGIN}/`,
  telephone: F.phoneE164,
  image: `${ORIGIN}/media/img/hero.webp`,
  logo: `${ORIGIN}/media/img/logo-round.png`,
  address: { '@type': 'PostalAddress', streetAddress: F.street, addressLocality: F.city, addressRegion: F.region, postalCode: F.zip, addressCountry: 'US' },
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '10:00', closes: '18:00' }],
  areaServed: 'Hackensack and the Greater Bergen County Area',
  knowsLanguage: F.languages,
  hasMap: F.map,
  sameAs: F.sameAs,
};

const header = read('partials', 'header.html');
const footer = read('partials', 'footer.html');
const callbar = `<div class="mobile-cta">
  <a href="tel:${F.phoneE164}">Call Now</a>
  <a href="#consult">Book Consultation</a>
</div>`;

let built = 0;
for (const file of list('pages', '.html')) {
  const slug = file.replace(/\.html$/, '');
  const meta = seo.pages[slug];
  if (!meta) throw new Error(`seo.json has no entry for pages/${file}`);
  const body = read('pages', file);
  const canonical = ORIGIN + (slug === 'index' ? '/' : `/${slug}`);
  /* FAQ schema is read off the markup, so the answers on the page and in the schema cannot drift */
  const faq = [...body.matchAll(/<summary>([^<]+)<\/summary>\s*<p[^>]*>([\s\S]*?)<\/p>/g)]
    .map((m) => ({ '@type': 'Question', name: m[1].trim(), acceptedAnswer: { '@type': 'Answer', text: m[2].replace(/<[^>]+>/g, '').trim() } }));
  const graph = [practice, { '@type': 'WebPage', '@id': `${canonical}#page`, url: canonical, name: meta.title, description: meta.description, about: { '@id': `${ORIGIN}/#practice` } }];
  if (faq.length) graph.push({ '@type': 'FAQPage', '@id': `${canonical}#faq`, mainEntity: faq });
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ORIGIN}/media/img/${meta.image}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/media/img/logo-icon-dark.png">
<link rel="stylesheet" href="/assets/site.css">
<!-- GSAP is vendored: Instatic publishes script-src 'self', so no CDN. Plugins are registered at
     the end of <body> by site.js, never here. ScrollToPlugin and Observer are vendored too
     (push-site.mjs bundles all six) but this build does not use them. -->
<script src="/assets/gsap/gsap.min.js"></script>
<script src="/assets/gsap/ScrollTrigger.min.js"></script>
<script src="/assets/gsap/ScrollSmoother.min.js"></script>
<script src="/assets/gsap/SplitText.min.js"></script>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>
</head>
<body>
${header}
<div id="smooth-wrapper"><div id="smooth-content">
${body}
${footer}
</div></div>
${callbar}
<script src="/assets/site.js"></script>
</body>
</html>
`;
  const out = path.join(dist, `${slug}.html`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  /* A copy that opens by double-click. dist/ uses root-relative paths (what Instatic serves), so
     dist/index.html shows unstyled from file://; this one points at the same files relatively. */
  if (slug === 'index') {
    const rel = 'code/site-src/dist/';
    fs.writeFileSync(path.resolve(here, '..', '..', 'OPEN-home.html'),
      html.replace(/(src|href|srcset)="\/(assets|media|fonts)\//g, `$1="${rel}$2/`).replace('<head>', '<head>\n<!-- Generated by build.mjs for local viewing. Do not edit; do not push. -->'));
  }
  built++;
  console.log(`built ${slug}.html  ${(html.length / 1024).toFixed(0)} KB, ${faq.length} FAQ pairs in schema`);
}
console.log(`${built} page(s); site.css ${(css.length / 1024).toFixed(0)} KB, site.js ${(js.length / 1024).toFixed(0)} KB`);
