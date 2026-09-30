#!/usr/bin/env node
/**
 * build.mjs — the All-on-X "quiz" combo, built from the design attached to
 * Asana task 1218962992162869 ("Make new landing page - AOX").
 *
 * The attachment is ONE self-contained page. The campaign unit here is three
 * pages (landing -> consult -> thank-you), so this script:
 *
 *   1. reads the attachment and keeps its stylesheet, markup and quiz script
 *      as they are, applying only the named patches below (each one asserts
 *      that its anchor exists exactly as expected, so a new version of the
 *      attachment fails loudly instead of building something half-patched);
 *   2. fills every labelled photo slot with the practice's own photograph;
 *   3. writes the consult and thank-you pages in the same classes.
 *
 *   node build.mjs          # writes the three pages and assets/
 *
 * Never hand-edit the generated files; edit this script or src/ and re-run.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const SRC = join(HERE, '../../../01-content-intake/.tmp/asana-aox-sung-2026-09-30/attachments/1218929162756667-all-on-x-landing.html');

/* ---- One place for everything that differs between local files and the site ---- */
const PAGES = {
  landing: 'all-on-x-quiz.html',
  consult: 'all-on-x-quiz-consult.html',
  thanks: 'all-on-x-quiz-thank-you.html',
};
const PHONE = { display: '(720) 419-3699', tel: '+17204193699' };
const PREQUAL_URL = 'https://pay.withcherry.com/arvada-dental-center--implants';

/* The practice's own photographs, served from the Webflow site's asset library. */
const CDN = 'https://cdn.prod.website-files.com/693c51e685b19f0d0c149cab/';
const IMG = {
  logo: CDN + '694375aa3ac6c1ae44dd2194_imgi_62_dental-implants-in-denver-arvada-dentist-1.png.webp',
  chris: CDN + '699c49187176483cf4346bdf_Chris-BEfore-and-After-p-1080.jpg',
  chrisSm: CDN + '699c49187176483cf4346bdf_Chris-BEfore-and-After-p-800.jpg',
  woman: CDN + '69fa9f02c7b6afbf4e832f6c_imgi_12_transformation-image-2-p-800.jpg',
  wickFrame: CDN + '69fa9f02befd419f218b521a_imgi_13_transformation-image-3-p-800.jpg',
  bennett: CDN + '69daece9b0e2d0e6388c5713_BB8A2838-p-800.jpg',
  theresaBefore: CDN + '693c51e685b19f0d0c149e0e_Theresa%2520Before%25201%2520(1)-p-500.webp',
  theresaAfter: CDN + '693c51e685b19f0d0c149e17_Theresa%2520After%25201%2520(1)-p-500.webp',
  // Stills from the practice's own YouTube uploads.
  wick: 'https://i.ytimg.com/vi/n6pB30XJwng/maxresdefault.jpg',
  anna: 'https://i.ytimg.com/vi/IISjxdkk0Ok/maxres3.jpg',
  brittany: 'https://i.ytimg.com/vi/YrMQX7oFzmA/maxresdefault.jpg',
};

/* ---- helpers ---- */
const count = (s, find) => s.split(find).length - 1;
function rep(s, find, to, label, times = 1) {
  const n = count(s, find);
  if (n !== times) throw new Error(`patch "${label}": expected ${times} match(es), found ${n}`);
  return s.split(find).join(to);
}
function between(s, open, close, label) {
  const a = s.indexOf(open);
  const b = s.indexOf(close, a + open.length);
  if (a < 0 || b < 0) throw new Error(`section "${label}" not found`);
  return s.slice(a + open.length, b);
}
const img = (src, alt, w, h, extra = '') =>
  `<img src="${src}" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async"${extra}>`;

const src = readFileSync(SRC, 'utf8');

/* ==========================================================================
   CSS
   ========================================================================== */
let css = between(src, '<style>', '</style>', 'style');

// The attachment switches to a dark theme when the visitor's phone is in dark
// mode. Brandklout builds stay on light grounds, and the photographs and logo
// are chosen for this palette, so the automatic theme is removed and the page
// declares itself light-only.
{
  const a = css.indexOf('@media (prefers-color-scheme: dark){');
  const b = css.indexOf('html{scroll-padding-top');
  if (a < 0 || b < 0 || b < a) throw new Error('dark theme block not found');
  css = css.slice(0, a) + css.slice(b);
  if (css.includes('data-theme') || css.includes('prefers-color-scheme')) throw new Error('dark theme not fully removed');
}
// Brand. The attachment's green-and-yellow palette and Atkinson Hyperlegible
// are its own; the page has to read as Arvada Dental Center's site. Each
// token keeps its role and takes the value the live site renders for that
// role (brand-probe.mjs measured them; brand/*.json is the evidence). The
// design's layout is driven entirely by these tokens, so nothing else moves.
const BRAND_TOKENS = {
  '--paper:#F3F6F5;': '--paper:#fdf8ef;',          // site body ground
  '--ink:#12201B;': '--ink:#222222;',              // site body text
  '--muted:#4A5B55;': '--muted:#5f5f5d;',          // brand silver-900, the site's secondary text
  '--line:#D3DFD9;': '--line:#cccccc;',            // site neutral-lighter
  '--tint:#E6EEEA;': '--tint:#f6f3ee;',            // the cream band on the live ad page
  '--accent:#1F5A4A;': '--accent:#8c6946;',        // brand brown-500: gold, dark enough to be text on light
  '--hero:#163D33;': '--hero:#5f5f5d;',            // the live ad page's hero ground
  '--hero-ink:#F4F8F6;': '--hero-ink:#ffffff;',
  '--hero-muted:#C2D5CD;': '--hero-muted:#eeeeee;',
  '--gold:#F2B632;': '--gold:#c8b282;',            // brand gold
  '--gold-hover:#FFC54A;': '--gold-hover:#f3daa3;',
  '--gold-ink:#241A02;': '--gold-ink:#222222;',
  '--gold-deep:#B07D06;': '--gold-deep:#8c6946;',
  '--ok:#1E7A55;': '--ok:#8c6946;',                // the brand has no green
  '--shadow:rgba(12,48,38,.16);': '--shadow:rgba(34,34,34,.14);',
  '--font:"Atkinson Hyperlegible Next","Atkinson Hyperlegible",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;':
    '--font:Centurygothic,Tahoma,sans-serif;\n  --font-head:"area extended",Verdana,sans-serif;',
};
for (const [from, to] of Object.entries(BRAND_TOKENS)) css = rep(css, from, to, 'brand token ' + from.split(':')[0]);
if (/Atkinson/.test(css)) throw new Error('the attachment typeface is still referenced');

css = css.trim() + '\n' + readFileSync(join(HERE, 'src/extra.css'), 'utf8') + readFileSync(join(HERE, 'src/brand.css'), 'utf8');

// The site's own font files. On the Webflow site these families are already
// installed, so this file is for the local pages only and is not part of the
// Webflow build.
const FONT_CDN = 'https://cdn.prod.website-files.com/693c51e685b19f0d0c149cab/';
const face = (family, weight, file, format) =>
  `@font-face{font-family:"${family}";font-weight:${weight};font-style:normal;font-display:swap;src:url("${FONT_CDN}${file}") format("${format}")}`;
const fontCss = [
  '/* Arvada Dental Center site fonts, as declared in the live site stylesheet. */',
  face('area extended', 700, '6945a86085ce62cb49dbc5fb_fonnts.com-Area_Extended_Bold.otf', 'opentype'),
  face('Centurygothic', 400, '693c51e685b19f0d0c149d2f_centurygothic.ttf', 'truetype'),
  face('Centurygothic', 700, '693c51e685b19f0d0c149d30_centurygothic_bold.ttf', 'truetype'),
].join('\n') + '\n';

/* ==========================================================================
   Quiz script
   ========================================================================== */
// The handoff comment at the top of the file mentions <script> in prose, so
// the real tag is the LAST one.
const SCRIPT_AT = src.lastIndexOf('<script>');
let js = src.slice(SCRIPT_AT + '<script>'.length, src.lastIndexOf('</script>')).trim();

// 1. The headline swap only exists on the landing page.
js = rep(js,
  "if (hl && HEADLINES[hl]) document.getElementById('hl').textContent = HEADLINES[hl];",
  "var hlEl = document.getElementById('hl');\n  if (hl && HEADLINES[hl] && hlEl) hlEl.textContent = HEADLINES[hl];",
  'headline guard');

// 2. A submitted lead goes to the thank-you page (the campaign's conversion
//    page) instead of the inline "request received" state. The first name
//    travels in sessionStorage, not the URL. Without a data-thank-you
//    attribute the quiz behaves exactly as the attachment did.
js = rep(js,
  "      idx = STEPS.length + 1; sending = false; render(true);\n    }).catch(",
  "      var ty = quiz.getAttribute('data-thank-you');\n" +
  "      if (ty) {\n" +
  "        try { sessionStorage.setItem('aox_lead', JSON.stringify({ first_name: contact.first_name, at: Date.now() })); } catch (e) {}\n" +
  "        /* a short pause lets the tag manager send generate_lead before the page changes */\n" +
  "        setTimeout(function(){ location.assign(ty); }, 350);\n" +
  "        return;\n" +
  "      }\n" +
  "      idx = STEPS.length + 1; sending = false; render(true);\n    }).catch(",
  'thank-you redirect');

// 3. Preview mode is silent in the attachment. Say so in the console, so an
//    empty webhook is never mistaken for a working form.
js = rep(js,
  "    if (!LEAD_WEBHOOK_URL) return Promise.resolve();",
  "    if (!LEAD_WEBHOOK_URL) {\n      if (window.console) console.warn('[aox-quiz] LEAD_WEBHOOK_URL is empty: this lead was NOT sent anywhere (preview mode).');\n      return Promise.resolve();\n    }",
  'preview warning');

// 4. Phone, video and prequalify click tracking moves to aox-page.js, which
//    every page loads, so the thank-you page is tracked too and nothing fires twice.
{
  const a = js.indexOf('  /* Phone click tracking for every tel: link');
  const b = js.indexOf('  /* Sticky mobile bar appears');
  if (a < 0 || b < 0 || b < a) throw new Error('click tracking block not found');
  js = js.slice(0, a) + js.slice(b);
}

// 5. The consult page has no sticky bar and no final section.
js = rep(js,
  "  if ('IntersectionObserver' in window) {",
  "  if (sticky && finalSec && 'IntersectionObserver' in window) {",
  'sticky guard');

const pageJs = readFileSync(join(HERE, 'src/aox-page.js'), 'utf8');

/* ==========================================================================
   Landing page markup
   ========================================================================== */
let body = src.slice(src.indexOf('<body>') + '<body>'.length, SCRIPT_AT).trim();

// Logo for the text brand.
const BRAND = `<div class="brand">${img(IMG.logo, 'Arvada Dental Center &amp; Implants', 572, 360, ' class="brand-logo"').replace(' loading="lazy"', '')}</div>`;
body = rep(body,
  '<div class="brand">Arvada Dental Center<small>&amp; Implants, Dr. Gregory Bennett</small></div>',
  BRAND, 'logo');

// Quiz: where a submitted lead lands.
const quizOpen = (thanks) => `<div class="quiz" id="quiz" role="region" aria-labelledby="quiz-title" data-thank-you="${thanks}">`;
body = rep(body, '<div class="quiz" id="quiz" role="region" aria-labelledby="quiz-title">', quizOpen(PAGES.thanks), 'quiz thank-you');

// Patient faces. Three are video tiles, in the attachment's order.
{
  const marker = '<span class="face-ph">Photo slot<span class="face-play">';
  if (count(body, marker) !== 3) throw new Error('expected 3 video face tiles');
  const stills = [
    img(IMG.wick, 'Wick, an Arvada Dental Center implant patient', 1280, 720, ' style="object-position:66% 50%"'),
    img(IMG.anna, 'Anna holding a photo of her smile before treatment', 1280, 720),
    img(IMG.brittany, 'Brittany outside Arvada Dental Center', 1280, 720),
  ];
  const parts = body.split(marker);
  body = parts[0] + parts.slice(1).map((p, i) => `<span class="face-ph has-img">${stills[i]}<span class="face-play">` + p).join('');
}
body = rep(body, ' story on YouTube"', ' story"', 'video labels', 3);
body = rep(body,
  '<span class="face-ph">Photo slot</span><b>Chris</b>',
  `<span class="face-ph has-img">${img(IMG.chrisSm, 'Chris smiling after his All-on-X treatment', 800, 450, ' style="object-position:17% 50%"')}</span><b>Chris</b>`,
  'Chris tile');
body = rep(body,
  '<span class="face-ph">Photo slot</span><b>Theresa</b>',
  `<span class="face-ph has-img">` +
    img(IMG.theresaBefore, 'Theresa before implant treatment', 500, 667, ' class="is-l"') +
    img(IMG.theresaAfter, 'Theresa after implant treatment', 500, 667, ' class="is-r"') +
    `<span class="face-tag">Before</span><span class="face-tag is-r">After</span></span><b>Theresa</b>`,
  'Theresa tile');

// Results. transformation-image-1 is the same photograph as Chris's, so the
// two square slots take images 2 and 3 of the same set.
body = rep(body,
  '<figure class="ph ph-wide"><span class="ph-tag">All-on-X patient</span><figcaption><b>Photo slot</b>Chris holding his before photo<br>Chris-BEfore-and-After.jpg</figcaption></figure>',
  `<figure class="ph ph-wide has-img">${img(IMG.chris, 'Chris, an All-on-X patient, holding a photo of his teeth before treatment', 1080, 608)}<span class="ph-tag">All-on-X patient</span></figure>`,
  'results wide');
body = rep(body,
  '<figure class="ph ph-sq"><figcaption><b>Photo slot</b>transformation-image-1.jpg</figcaption></figure>',
  `<figure class="ph ph-sq has-img">${img(IMG.woman, 'An Arvada Dental Center patient holding a photo of her teeth before treatment', 800, 450, ' style="object-position:78% 50%"')}</figure>`,
  'results square 1');
body = rep(body,
  '<figure class="ph ph-sq"><figcaption><b>Photo slot</b>transformation-image-2.jpg</figcaption></figure>',
  `<figure class="ph ph-sq has-img">${img(IMG.wickFrame, 'Wick holding a photo of his teeth before treatment', 800, 450, ' style="object-position:30% 50%"')}</figure>`,
  'results square 2');

// Doctor.
const DOC_FIG = `<figure class="ph has-img">${img(IMG.bennett, 'Dr. Gregory Bennett', 800, 1199, ' style="object-position:50% 8%"')}</figure>`;
body = rep(body,
  '<figure class="ph"><figcaption><b>Photo slot</b>Dr. Gregory Bennett portrait<br>BB8A2838.jpg</figcaption></figure>',
  DOC_FIG, 'doctor portrait');

if (body.includes('Photo slot')) throw new Error('a photo slot is still empty');

/* Pieces of the landing page that the other two pages reuse verbatim. */
const TOPBAR = '<header class="topbar">' + between(body, '<header class="topbar">', '</header>', 'topbar') + '</header>';
const CREDS = '<section class="creds" aria-label="Ratings and recognition">' + between(body, '<section class="creds" aria-label="Ratings and recognition">', '</section>', 'creds') + '</section>';
const FACES_LIST = between(body, '<ul class="faces-list">', '</ul>', 'faces list');
const QUIZ_INNER = between(body, quizOpen(PAGES.thanks), '\n    </div>\n\n    <ul class="hero-proof">', 'quiz card');
const HERO_PROOF = '<ul class="hero-proof">' + between(body, '<ul class="hero-proof">', '</ul>', 'hero proof') + '</ul>';
const FOOT_GRID = between(body, '<footer class="foot">', '<div class="sticky-space"', 'footer').trim();
const PHONE_SVG = between(TOPBAR, 'data-loc="topbar">', '(720) 419-3699', 'phone icon').trim();
const CK_A = '<svg class="ck-a" viewBox="0 0 24 24" aria-hidden="true">' + between(body, '<svg class="ck-a" viewBox="0 0 24 24" aria-hidden="true">', '</svg>', 'check icon') + '</svg>';
void CK_A;

// The footer's price note points at "the items listed above", which only the
// landing page has. The consult page names them; the thank-you page quotes no
// price, so it carries no price note at all.
const LEGAL_PRICE = '<p>$18,795' + between(FOOT_GRID, '<p>$18,795', '</p>', 'price note') + '</p>';
const FOOT_CONSULT = rep(FOOT_GRID, LEGAL_PRICE,
  rep(rep(LEGAL_PRICE, 'includes the items listed above',
    'includes your exam, 3D CT scan, any extractions, four to six implants, same-day fixed temporary teeth and your final zirconia arch', 'consult price note'),
    ' *Practice’s comparison with national implant chains advertised on TV.', '', 'consult comparison note'),
  'consult footer');
const FOOT_THANKS = rep(FOOT_GRID, LEGAL_PRICE, '', 'thank-you footer');

/* ==========================================================================
   Consult page: the form first, then what the visit is
   ========================================================================== */
const consult = `${TOPBAR}

<main>
<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="kicker">Free All-on-X consultation in Arvada, CO</p>
      <h1>Book your free consultation and 3D scan.</h1>
      <p class="lede">Four quick questions, then our implant coordinator calls to set your visit with Dr. Gregory Bennett. One arch is <strong>$18,795</strong>, confirmed in writing after your scan.</p>
    </div>

    <div class="hero-quiz">
      ${quizOpen(PAGES.thanks)}${QUIZ_INNER}
    </div>

    ${HERO_PROOF}
  </div>
</section>

${CREDS}

<section class="sec" id="visit">
  <div class="wrap">
    <h2>What your free consultation includes</h2>
    <p class="sec-intro">One visit, no cost, and no pressure to book that day.</p>
    <ol class="steps steps-3">
      <li>
        <h3>An exam with Dr. Bennett</h3>
        <p>Dr. Bennett examines you and tells you plainly what’s possible. If implants aren’t right for you, he will tell you.</p>
      </li>
      <li>
        <h3>A cone beam 3D CT scan</h3>
        <p>Every case is planned on a 3D scan. It is how Dr. Bennett decides how many implants to place.</p>
      </li>
      <li>
        <h3>A written plan and price</h3>
        <p>You leave with the full number on paper, with nothing added that hasn’t been explained to you first.</p>
      </li>
    </ol>
  </div>
</section>

<section class="sec final" id="final">
  <div class="wrap">
    <h2>Rather talk it through first?</h2>
    <p>Call and our implant coordinator will answer your questions and book your free consultation.</p>
    <div class="actions">
      <a class="btn btn-gold" href="tel:${PHONE.tel}" data-loc="consult_final">Call ${PHONE.display}</a>
    </div>
    <p class="hours">Monday to Friday, 8am to 5pm. 6695 Wadsworth Blvd, Arvada, CO 80003.</p>
  </div>
</section>
</main>

<footer class="foot">
  ${FOOT_CONSULT}
</footer>`;

/* ==========================================================================
   Thank-you page: the phone number first, no form
   ========================================================================== */
const thanks = `${TOPBAR}

<main>
<section class="ty">
  <div class="wrap">
    <svg class="done-icon" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24.5" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M15 27l7 7 15-16" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <h1 id="ty-title">Request received.</h1>
    <p class="ty-lede">Our implant coordinator will call you from</p>
    <a class="ty-phone" href="tel:${PHONE.tel}" data-loc="thank_you_number">${PHONE.display}</a>
    <p class="ty-save">Save that number so you recognize the call.</p>
    <div class="actions">
      <a class="btn btn-gold" href="tel:${PHONE.tel}" data-loc="thank_you">${PHONE_SVG} Call now instead</a>
      <a class="btn btn-ghost" href="${PREQUAL_URL}" target="_blank" rel="noopener" data-loc="thank_you">Prequalify with Cherry</a>
    </div>
    <p class="ty-hours">Office hours are Monday to Friday, 8am to 5pm. Requests sent after hours get a call the next business morning.</p>
  </div>
</section>

<section class="sec" id="next">
  <div class="wrap">
    <h2>What happens next</h2>
    <p class="sec-intro">Three steps, and you’re never asked to commit before you have the full number in writing.</p>
    <ol class="steps steps-3">
      <li>
        <h3>We call you</h3>
        <span class="when">From ${PHONE.display}</span>
        <p>Our implant coordinator finds a time that works for you. Want to know your monthly payment before your visit? Prequalifying with Cherry takes a few minutes.</p>
      </li>
      <li>
        <h3>Free consultation and 3D scan</h3>
        <span class="when">Your first visit</span>
        <p>Dr. Bennett examines you, takes a cone beam CT scan and tells you plainly what’s possible.</p>
      </li>
      <li>
        <h3>A written plan and price</h3>
        <span class="when">Before you decide anything</span>
        <p>You leave with a written plan and price, and no pressure to book that day.</p>
      </li>
    </ol>
  </div>
</section>

<section class="faces" aria-labelledby="faces-title">
  <div class="wrap faces-head">
    <h2 id="faces-title">While you wait, hear it from patients</h2>
    <p>Tap a photo to watch their story.</p>
  </div>
  <div class="faces-scroll" tabindex="0" role="region" aria-label="Patient stories, scrolls sideways">
    <ul class="faces-list">${FACES_LIST}</ul>
  </div>
</section>
</main>

<footer class="foot">
  ${FOOT_THANKS}
</footer>`;

/* ==========================================================================
   Write
   ========================================================================== */
const FONTS = '<link rel="preconnect" href="https://cdn.prod.website-files.com" crossorigin>\n<link rel="stylesheet" href="assets/brand-fonts.css">';
const page =({ title, description, markup, quiz }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="robots" content="noindex">
<meta name="color-scheme" content="light">
${FONTS}
<link rel="stylesheet" href="assets/aox-quiz.css">
</head>
<body>

${markup}

<script src="assets/aox-page.js"></script>
${quiz ? '<script src="assets/aox-quiz.js"></script>\n' : ''}</body>
</html>
`;

mkdirSync(join(HERE, 'assets'), { recursive: true });
const out = (name, text) => { writeFileSync(join(HERE, name), text); console.log(`  ${name}  ${text.length} bytes`); };

out('assets/brand-fonts.css', fontCss);
out('assets/aox-quiz.css', css + '\n');
out('assets/aox-quiz.js', js + '\n');
out('assets/aox-page.js', pageJs);
out(PAGES.landing, page({
  title: between(src, '<title>', '</title>', 'title'),
  description: between(src, '<meta name="description" content="', '">', 'description'),
  markup: body, quiz: true,
}));
out(PAGES.consult, page({
  title: 'Book a Free All-on-X Consultation in Arvada, CO | Arvada Dental Center &amp; Implants',
  description: 'Four quick questions and our implant coordinator calls to set your free consultation and 3D scan with Dr. Gregory Bennett in Arvada, CO.',
  markup: consult, quiz: true,
}));
out(PAGES.thanks, page({
  title: 'Request Received | Arvada Dental Center &amp; Implants',
  description: 'Your consultation request is in. Our implant coordinator will call you.',
  markup: thanks, quiz: false,
}));
