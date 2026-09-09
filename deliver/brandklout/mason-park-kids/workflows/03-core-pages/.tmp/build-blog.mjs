// ===========================================================================
// THE BLOG: an overview page at /blog/ and one page per post at /blog/<slug>/,
// on the same chrome, the same chapter vocabulary and the same gates as the
// other 57 pages.
//
//   node build-blog.mjs --harvest        content.xml -> blog-content.json (needs the mirror)
//   node build-blog.mjs                  the overview + the SAMPLE posts (six, listed below)
//   node build-blog.mjs --only first-see,pacifier
//   node build-blog.mjs --all            every published post (157)
//   node build-blog.mjs --list           what is harvested, what is built
//   --force                              overwrite a page that has been hand-edited since
//
// Then, as always: node stamp.mjs && node check.mjs
//
// WHERE THE WORDS COME FROM. The old WordPress site published 157 posts between
// 2021-11 and 2026-06. They are in workflow 01's recovery, in content.xml (the
// WXR export, verbatim bodies). `--harvest` normalises them into
// blog-content.json, which is committed, so a worktree without the mirror can
// still build every page. The 2021-2024 posts are Gutenberg paragraphs; the
// 2025-2026 posts are span-wrapped text with blank lines and a pasted author
// bio at the top, a Get Directions link and a disclaimer at the bottom. The
// harvest reads both: the bio becomes the byline, the boilerplate is dropped,
// the SEO suffix ("| Pediatric Dentist Katy TX") comes off the title, links to
// the old domain become root-relative, and a link to a post that is not built
// is unwrapped rather than left to 404.
//
// WHAT IS NOT DECIDED HERE. Which of the 157 the practice wants back is an
// editorial call (about a third are Invisalign pieces written for adults).
// This builds the shape with real posts in it so that call can be made by
// looking at pages, not a spreadsheet; the overview lists all 157 and links
// the ones that exist on disk. Nothing is published by running this.
//
// THE OLD URLS were /<slug>/ at the root. The new ones are /blog/<slug>/. At
// domain cutover every old post URL needs a redirect; `--list` prints the map.
// ===========================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, '..', 'home');
const XML = path.join(HERE, '..', '..', '01-site-recovery', '.tmp', 'recovered', 'content.xml');
const JSON_OUT = path.join(HERE, 'blog-content.json');
const MARKER = '<!-- built by .tmp/build-blog.mjs from blog-content.json; see its header -->';
const argv = process.argv.slice(2);
const flag = f => argv.includes(f);
const opt = f => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : null);

// Nine posts that show the shape: the three newest (so the overview's feature
// spread is clickable), then two eras, four topics, short and long.
const SAMPLE = [
  'why-regular-visits-to-a-kids-dentist-matter',
  'pediatric-dental-clinic-care-keeping-little-smiles-healthy',
  'invisalign-or-braces-pros-cons-and-what-to-expect',
  'when-should-a-child-first-see-a-dentist',
  'pacifiers-and-teeth-development',
  'healthy-transitions-trading-bottles-for-cups',
  'meltdowns-to-smiles',
  'invisalign-for-kids-when-is-the-right-age',
  '4-ways-to-make-oral-hygiene-fun',
];

// ---------------------------------------------------------------------------
// House typography, the same rules build-pages.mjs applies.
const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const txt = s => String(s).replace(/&(?!(?:amp|lt|gt|quot|nbsp|#\d+|#x[0-9a-f]+);)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function type(s) {
  return String(s)
    .replace(/\s*—\s*/g, ', ')
    .replace(/(\d)\s*[–-]\s*(\d)/g, '$1 to $2')
    .replace(/–/g, ', ')
    .replace(/'/g, '’')
    .replace(/&nbsp;/g, ' ')
    .replace(/ /g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
const plain = s => type(String(s).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const words = s => plain(s).split(/\s+/).filter(Boolean).length;
const slugify = s => plain(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);

// ---------------------------------------------------------------------------
// THE HARVEST: content.xml -> blog-content.json
const OLD = 'https://pediatricdentistkatytx.com/';
const PAGE_MAP = { 'about/': 'about-us/', 'contact/': 'contacts/', 'our-team/': 'our-team/', 'blog/': 'blog/' };

function localPages() {
  const set = new Set();
  (function walk(d, rel) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory() && e.name !== 'assets') walk(path.join(d, e.name), rel + e.name + '/');
      else if (e.name === 'index.html') set.add(rel);
    }
  })(SITE, '');
  return set;
}

function topicOf(title, cats) {
  const t = title.toLowerCase();
  if (cats.includes('Invisalign') || /invisalign|aligner|braces|orthodont|retainer/.test(t)) return 'Braces and aligners';
  if (/brush|floss|cavit|sealant|fluoride|sugar|snack|hygiene|toothpaste|decay|clean/.test(t)) return 'Cleanings and prevention';
  if (/baby|infant|teeth stages|pacifier|bottle|thumb|teething|first tooth|toddler|cups/.test(t)) return 'First teeth and habits';
  if (/first (dental )?visit|first see|dentist|clinic|choos|visit|appointment|anxiety|fear|meltdown|sedation|emergency/.test(t)) return 'The visit';
  return 'Dental care';
}

function harvest() {
  if (!fs.existsSync(XML)) throw new Error('no content.xml at ' + XML + ' (the recovery mirror is not in this worktree)');
  const x = fs.readFileSync(XML, 'utf8');
  const items = x.match(/<item>[\s\S]*?<\/item>/g) || [];
  const f = (it, tag) => { const m = it.match(new RegExp('<' + tag + '>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</' + tag + '>')); return m ? m[1].trim() : ''; };
  const posts = [];
  for (const it of items) {
    if (f(it, 'wp:post_type') !== 'post' || f(it, 'wp:status') !== 'publish') continue;
    const rawTitle = f(it, 'title');
    const title = type(rawTitle.split(' | ')[0]);
    const cats = [...it.matchAll(/<category domain="category"[^>]*><!\[CDATA\[(.*?)\]\]>/g)].map(m => m[1]);
    const body = f(it, 'content:encoded');
    posts.push({
      slug: f(it, 'wp:post_name'),
      title,
      date: f(it, 'wp:post_date').slice(0, 10),
      topic: topicOf(title, cats),
      oldUrl: f(it, 'link'),
      blocks: normalise(body),
    });
  }
  posts.sort((a, b) => b.date.localeCompare(a.date));
  for (const p of posts) {
    p.words = p.blocks.reduce((n, b) => n + (b.t === 'p' ? words(b.html) : b.t === 'ul' || b.t === 'ol' ? words(b.items.join(' ')) : 0), 0);
    p.minutes = Math.max(2, Math.round(p.words / 200));
    const first = p.blocks.find(b => b.t === 'p' && words(b.html) > 12);
    p.excerpt = first ? excerptOf(plain(first.html)) : '';
  }
  fs.writeFileSync(JSON_OUT, JSON.stringify(posts, null, 1));
  console.log(`${posts.length} posts -> ${path.relative(HERE, JSON_OUT)}`);
}

function excerptOf(s) {
  if (s.length <= 170) return s;
  const cut = s.slice(0, 170);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  return end > 60 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '') + '…';
}

// Body HTML (either era) -> blocks: {t:'h', text} | {t:'p', html} | {t:'ul'|'ol', items}
function normalise(body) {
  let s = body.replace(/\r/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<figure[^>]*>\s*<\/figure>/g, '')
    .replace(/<img[^>]*>/g, '')
    .replace(/<i>\s*<\/i>/g, '')
    .replace(/<\/?span[^>]*>/g, '')
    .replace(/<\/?i>/g, '')
    .replace(/<b>/g, '<strong>').replace(/<\/b>/g, '</strong>')
    .replace(/<\/?div[^>]*>/g, '\n\n')
    .replace(/<br\s*\/?>/g, '\n');
  // split into top-level pieces: headings, lists, paragraphs, and loose text
  const re = /(<h[1-4][^>]*>[\s\S]*?<\/h[1-4]>|<ul[^>]*>[\s\S]*?<\/ul>|<ol[^>]*>[\s\S]*?<\/ol>|<p[^>]*>[\s\S]*?<\/p>|<blockquote[^>]*>[\s\S]*?<\/blockquote>)/;
  const out = [];
  const pushP = html => {
    const clean = html.replace(/^\s*<p[^>]*>/, '').replace(/<\/p>\s*$/, '').trim();
    const text = plain(clean);
    if (!text) return;
    // the pasted author bio (top of the 2026 posts, bottom of some 2025 ones); the byline carries it
    if (/^Dr[.] (Tam Nguyen|Dave Cho)[ ,]/.test(text) && /Mason Park|dentist|patient/.test(text) && text.length < 700) return;
    if (/^Disclaimer:/i.test(text)) return;                             // boilerplate
    if (/Get Directions/.test(text) && text.length < 220) return;       // the maps CTA
    if (/^-{20,}$/.test(text)) return;                                  // the rule
    out.push({ t: 'p', html: rewriteLinks(clean) });
  };
  for (const piece of s.split(re)) {
    if (!piece || !piece.trim()) continue;
    let m;
    if ((m = piece.match(/^<h([1-4])[^>]*>([\s\S]*?)<\/h\1>$/))) {
      const text = plain(m[2]);
      if (text) out.push({ t: 'h', text });
    } else if ((m = piece.match(/^<(ul|ol)[^>]*>([\s\S]*?)<\/\1>$/))) {
      const items = [...m[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(x => rewriteLinks(x[1].replace(/<\/?p[^>]*>/g, '').trim())).filter(x => plain(x));
      if (items.length) out.push({ t: m[1], items });
    } else if (/^<p\b/.test(piece)) {
      pushP(piece);
    } else if (/^<blockquote/.test(piece)) {
      out.push({ t: 'p', html: '<em>' + rewriteLinks(plain(piece)) + '</em>' });
    } else {
      for (const para of piece.split(/\n\s*\n/)) pushP(para.replace(/\n/g, ' '));
    }
  }
  return out;
}

const KNOWN = localPages();
function rewriteLinks(html) {
  return html.replace(/<a\b([^>]*)href="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/g, (all, a1, href, a2, inner) => {
    if (href.startsWith(OLD)) {
      let p = href.slice(OLD.length).replace(/^\/+/, '');
      if (!p.endsWith('/') && !/[#?]/.test(p)) p += '/';
      if (PAGE_MAP[p]) p = PAGE_MAP[p];
      if (KNOWN.has(p)) return `<a href="/${p}">${inner}</a>`;
      if (/^wp-content\//.test(p)) return inner;
      // a post, or a page that no longer exists: keep the words, drop the link
      return `<span data-old-link="${attr(p)}">${inner}</span>`;
    }
    if (/^https?:\/\//.test(href)) return `<a href="${attr(href)}" target="_blank" rel="noopener">${inner}</a>`;
    return inner;
  });
}

// ---------------------------------------------------------------------------
// THE IMAGE POOL, by topic. Own frames may be captioned; stock never is.
const UPLOADS = path.join(SITE, 'assets', 'uploads');
const POOL = new Map();
for (const f of fs.existsSync(UPLOADS) ? fs.readdirSync(UPLOADS) : []) {
  const m = f.match(/^(.+?)-(\d+)\.webp$/);
  if (!m) continue;
  if (!POOL.has(m[1])) POOL.set(m[1], []);
  POOL.get(m[1]).push(+m[2]);
}
for (const w of POOL.values()) w.sort((a, b) => a - b);
let PREFIX = '';
function img(key, { alt, sizes, eager = false }) {
  const widths = POOL.get(key);
  if (!widths) throw new Error(`no image "${key}" in assets/uploads/`);
  const mid = widths.find(w => w >= 960) || widths[widths.length - 1];
  const srcset = widths.map(w => `${PREFIX}assets/uploads/${key}-${w}.webp ${w}w`).join(', ');
  return `<img src="${PREFIX}assets/uploads/${key}-${mid}.webp" srcset="${srcset}" sizes="${sizes}" alt="${attr(alt)}"` +
    (eager ? ' fetchpriority="high" decoding="async"' : ' loading="lazy" decoding="async"') + '>';
}
const OWN = { 'knee-2': 'A knee-to-knee exam', smile: 'Dr. Nguyen, with a patient', gumball: 'The gumball machine by the front desk', 'gumball-2': 'By the front desk', 'shelf-kid': 'The shelf by the front desk', sofa: 'The waiting room the two practices share', operatory: 'Between patients' };
const FRAMES = {
  'Braces and aligners': [['st-aligner', 'A clear aligner in its case on a bathroom counter'], ['st-teen', 'A smiling teenager outdoors'], ['st-brush', 'A child brushing their teeth at a bathroom sink']],
  'Cleanings and prevention': [['st-brush', 'A child brushing their teeth at a bathroom sink'], ['st-paste', 'Toothpaste being squeezed onto a toothbrush'], ['st-lunchbox', 'A packed school lunch of fruit and vegetables'], ['st-flossbox', 'A container of floss on a marble shelf'], ['st-brushes', 'Children’s toothbrushes in a cup']],
  'First teeth and habits': [['st-bottle', 'A baby bottle and a teddy bear on a table'], ['st-infant', 'A parent holding a smiling baby'], ['st-milk', 'A toddler drinking from a cup in a high chair'], ['knee-2', 'A knee-to-knee exam: an infant on a parent’s lap']],
  'The visit': [['gumball', 'A toddler at the gumball machine by the front desk'], ['shelf-kid', 'A smiling boy at the product shelf by the front desk'], ['smile', 'Dr. Nguyen beside a smiling child in a treatment room'], ['sofa', 'Two parents on the waiting-room sofa with the check-in tablet'], ['st-wave', 'A toddler waving through a doorway']],
  'Dental care': [['st-story', 'A parent and child reading a book in bed'], ['st-family', 'A parent and a young child laughing together at home'], ['st-apple', 'A child holding an apple outdoors'], ['st-crayons', 'Crayons and a child’s drawing on a table'], ['st-gap', 'A laughing boy with a front tooth missing']],
};
const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
function frames(post) {
  const list = FRAMES[post.topic] || FRAMES['Dental care'];
  const i = hash(post.slug) % list.length;
  return { hero: list[i], aside: list[(i + 1) % list.length] };
}

// ---------------------------------------------------------------------------
// THE PAGES
const tag = name => `<p class="chapter-tag"><i></i><b>${txt(name)}</b></p>`;
const monthYear = d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const dayMonth = d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
function headline(h) {
  // one phrase in the display italic: what follows a colon, else the last two words
  const t = txt(type(h));
  const m = t.match(/^(.*?:\s+)(.+)$/);
  if (m) return `${m[1]}<em>${m[2]}</em>`;
  const w = t.split(' ');
  if (w.length < 4) return t;
  return w.slice(0, -2).join(' ') + ' <em>' + w.slice(-2).join(' ') + '</em>';
}

const HOURS = `<dt>Hours</dt><dd>Mon and Wed <b>9am to 6pm</b><br>Tue and Thu <b>8am to 5pm</b><br>Fri to Sun <b>Closed</b></dd>`;
const ADDRESS = `<dt>Address</dt><dd><a href="https://www.google.com/maps/place/21830+Kingsland+Blvd,+Katy,+TX+77450" target="_blank" rel="noopener">21830 Kingsland Blvd #104B<br>Katy, TX 77450</a></dd>`;
const MAP = `<div class="iv-map">
        <div class="embed_component">
          <iframe data-src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3463.0585305167815!2d-95.75121988455305!3d29.775949038160515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86412740e7dd5def%3A0xfa1ab8c6e696e133!2sMason%20Park%20Dental%20-%20Katy%20Dentist!5e0!3m2!1sen!2sus!4v1638807674675!5m2!1sen!2sus" title="Map to Mason Park Dental for Kids" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
      </div>`;
const BADGES = () => `<div class="badges">
  <div class="badges-in">
    <p class="badges-label">Credentialed by</p>
    <ul>
      <li><img src="${PREFIX}assets/uploads/abpd.webp" alt="American Board of Pediatric Dentistry, board certified" loading="lazy" decoding="async"></li>
      <li><img src="${PREFIX}assets/uploads/aapd.webp" alt="American Academy of Pediatric Dentistry" loading="lazy" decoding="async"></li>
      <li><img src="${PREFIX}assets/uploads/agd.webp" alt="Academy of General Dentistry" loading="lazy" decoding="async"></li>
      <li><img src="${PREFIX}assets/uploads/kois.webp" alt="Kois Center" loading="lazy" decoding="async"></li>
      <li><img src="${PREFIX}assets/uploads/ssc.webp" alt="Seattle Study Club" loading="lazy" decoding="async"></li>
    </ul>
  </div>
</div>`;

function invite(n, title, lede, related, shot) {
  const rel = related.map(l => `<a href="${l[1]}">${txt(l[0])}</a>`).join('<br>');
  return `<section class="ch ch-invitation" id="invitation" data-chapter="${n}" data-chapter-name="The Invitation" data-theme="dark">
  <div class="wrap iv-top">
    <div class="iv-copy">
      ${tag('The Invitation')}
      <h2 data-split>${headline(title)}</h2>
      <p class="iv-lede">${type(lede)}</p>
      <div class="iv-actions">
        <a class="button is-sun is-lg" href="https://www.flexbook.me/masonpark/1" target="_blank" rel="noopener">Book a first visit</a>
        <a class="button is-ghost-light is-lg" href="tel:+12815787100">(281) 578-7100</a>
      </div>
      <dl class="iv-facts">
        <div>${ADDRESS}</div>
        <div>${HOURS}</div>
        ${rel ? `<div><dt>Related</dt><dd>${rel}</dd></div>` : ''}
      </dl>
    </div>
    <div class="iv-aside">
      <figure class="iv-shot">
        ${img(shot[0], { alt: shot[1], sizes: '(max-width: 899px) 100vw, 45vw' })}
        <figcaption>${shot[2]}</figcaption>
      </figure>
      ${MAP}
      <a class="link-arrow is-light" href="https://www.google.com/maps/place/21830+Kingsland+Blvd,+Katy,+TX+77450" target="_blank" rel="noopener">Get directions <span aria-hidden="true">&rarr;</span></a>
    </div>
  </div>
</section>`;
}

function shell({ slug, title, description, main, noindex = false }) {
  const canonical = `https://pediatricdentistkatytx.com/${slug}/`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${txt(type(title))}</title>
<meta name="description" content="${attr(type(description))}">
${noindex ? '<meta name="robots" content="noindex, follow">\n' : ''}<link rel="canonical" href="${canonical}">
<meta property="og:type" content="${slug === 'blog' ? 'website' : 'article'}">
<meta property="og:site_name" content="Mason Park Dental for Kids">
<meta property="og:title" content="${attr(type(title))}">
<meta property="og:description" content="${attr(type(description))}">
<meta property="og:url" content="${canonical}">
</head>
<body class="has-journey">
<main class="main-wrapper" id="main">
${MARKER}
${main}
</main>
</body>
</html>
`;
}

// A post's sections: every h2 opens one; a run of paragraphs over the prose
// ceiling (110 words, check.mjs) continues in a second section with no rule
// above it, so the gate measures what a reader sees: one thought at a time.
const CEILING = 110;
function sectionsOf(post) {
  const secs = [];
  let cur = { h: null, blocks: [] };
  for (const b of post.blocks) {
    if (b.t === 'h') { if (cur.blocks.length) secs.push(cur); cur = { h: b.text, blocks: [] }; }
    else cur.blocks.push(b);
  }
  if (cur.blocks.length) secs.push(cur);
  const out = [];
  for (const s of secs) {
    if (s.h && /^introduction$/i.test(s.h)) s.h = null;
    let run = 0, part = { h: s.h, blocks: [], cont: false };
    const blocks = s.blocks.flatMap(b => (b.t === 'p' ? splitLong(b.html).map(h => ({ t: 'p', html: h })) : [b]));
    for (const b of blocks) {
      const n = b.t === 'p' ? words(b.html) : 0;
      if (b.t === 'p' && run > 0 && run + n > CEILING) { out.push(part); part = { h: null, blocks: [], cont: true }; run = 0; }
      part.blocks.push(b);
      run = b.t === 'p' ? run + n : 0;
    }
    out.push(part);
  }
  const used = new Set();
  return out.map((s, i) => {
    let id = s.h ? 's-' + slugify(s.h) : (i ? `s-${i}` : 's-intro');
    while (used.has(id)) id += '-2';
    used.add(id);
    return { ...s, id };
  });
}
// A paragraph over the ceiling is split at sentence ends into paragraphs of
// about a hundred words. The words are the author's; only the breaks are ours.
// Seven of the 157 posts carried single paragraphs of 160 to 290 words, which
// check.mjs fails as a wall of text and a phone shows as one.
function splitLong(html) {
  if (words(html) <= CEILING) return [html];
  const parts = html.split(/(?<=[.!?][”"’)]?)\s+(?=[A-Z“"(])/);
  const out = [];
  let cur = '';
  for (const part of parts) {
    if (cur && words(cur) + words(part) > 100) { out.push(cur.trim()); cur = part; }
    else cur = cur ? cur + ' ' + part : part;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
const renderBlock = b => b.t === 'p' ? `<p>${type(b.html)}</p>`
  : b.t === 'ul' ? `<ul class="lf-ticks">${b.items.map(i => `<li>${type(i)}</li>`).join('')}</ul>`
  : b.t === 'ol' ? `<ol class="lf-steps">${b.items.map(i => `<li>${type(i)}</li>`).join('')}</ol>`
  : '';

function postCard(p, built, { big = false } = {}) {
  const fr = frames(p).hero;
  const linked = built.has(p.slug);
  const href = `/blog/${p.slug}/`;
  const title = linked ? `<a href="${href}">${txt(p.title)}</a>` : `<span class="is-soon">${txt(p.title)}</span>`;
  return `<article class="card bl-card${big ? ' bl-card-big' : ''}">
        <div class="card_media">${img(fr[0], { alt: fr[1], sizes: big ? '(max-width: 899px) 100vw, 55vw' : '(max-width: 899px) 100vw, 30vw' })}</div>
        <p class="bl-kicker"><span>${dayMonth(p.date)}</span><span>${txt(p.topic)}</span><span>${p.minutes} min read</span></p>
        <h3>${title}</h3>
        <p>${txt(p.excerpt)}</p>
        ${linked ? `<a class="link-arrow" href="${href}">Read it <span aria-hidden="true">&rarr;</span></a>` : `<span class="bl-soon">Coming to this site</span>`}
      </article>`;
}

// The name of a local page, from its own <title>, minus the site suffix.
function pageName(route) {
  const file = path.join(SITE, ...route.split('/').filter(Boolean), 'index.html');
  if (!fs.existsSync(file)) return route;
  const m = fs.readFileSync(file, 'utf8').match(/<title>([^<]*)<\/title>/);
  return m ? m[1].split(' | ')[0].trim() : route;
}

function articlePage(post, all, built) {
  PREFIX = '../../';
  const fr = frames(post);
  const secs = sectionsOf(post);
  const toc = secs.filter(s => s.h).map(s => `<li><a href="#${s.id}">${txt(type(s.h))}</a></li>`).join('');
  const body = secs.map(s => `      <section class="lf-section"${s.cont ? ' data-cont' : ''} id="${s.id}">
        ${s.h ? `<h3>${txt(type(s.h))}</h3>` : ''}
        ${s.blocks.map(renderBlock).join('\n        ')}
      </section>`).join('\n');
  // read next: same topic first, then nearest by date, from what is built
  const others = all.filter(p => p.slug !== post.slug && built.has(p.slug));
  const same = others.filter(p => p.topic === post.topic);
  const rest = others.filter(p => p.topic !== post.topic);
  const next = [...same, ...rest].slice(0, 3);
  const links = new Set([...body.matchAll(/href="(\/[a-z0-9-\/]+\/)"/g)].map(m => m[1]));
  const related = [['Every post', '/blog/'], ...[...links].filter(l => l !== '/blog/').slice(0, 2).map(l => [pageName(l), l])];
  const own = OWN[fr.aside[0]];
  const main = `<section class="ch ch-arrival is-compact" id="arrival" data-chapter="0" data-chapter-name="Arrival" data-theme="dark">
  <div class="ar-bg" data-drift>
    ${img(fr.hero[0], { alt: fr.hero[1], sizes: '100vw', eager: true })}
  </div>
  <div class="ar-veil" aria-hidden="true"></div>
  <div class="ar-in">
    ${tag(post.topic)}
    <h1 class="ar-title" data-split>${headline(post.title)}</h1>
    <p class="ar-lede" data-anim="hide">${txt(post.excerpt)}</p>
    <div class="ar-actions" data-anim="hide"><a class="button is-sun is-lg" href="https://www.flexbook.me/masonpark/1" target="_blank" rel="noopener">Book a first visit</a>
      <a class="button is-ghost-light is-lg" href="#article">Read the article</a></div>
    <div class="ar-meta">
      <div data-anim="hide"><b>${monthYear(post.date)}</b><span>Published</span></div>
      <div data-anim="hide"><b>${post.minutes} minutes</b><span>Reading time</span></div>
      <div data-anim="hide"><b>Mason Park Dental for Kids</b><span>Written by</span></div>
    </div>
  </div>
</section>

${BADGES()}

<nav class="crumbs" aria-label="Breadcrumb"><span><a href="/">Home</a></span><span><a href="/blog/">Blog</a></span><span>${txt(post.title)}</span></nav>

<section class="ch ch-article" id="article" data-chapter="1" data-chapter-name="The Article" data-theme="warm">
  <div class="wrap lf-layout lf-split">
    <div class="lf-head">
      ${tag('The Article')}
      <h2 data-split>In this <em>one.</em></h2>
      <ol class="bl-toc">${toc}</ol>
      <dl class="bl-byline">
        <div><dt>Published</dt><dd>${dayMonth(post.date)}</dd></div>
        <div><dt>Topic</dt><dd><a href="/blog/#archive">${txt(post.topic)}</a></dd></div>
        <div><dt>Written by</dt><dd>Mason Park Dental for Kids, the practice of Dr. Tam Nguyen</dd></div>
      </dl>
      <figure class="lf-figure" data-wipe>
        ${img(fr.aside[0], { alt: fr.aside[1], sizes: '(max-width: 899px) 100vw, 30vw' })}
        ${own ? `<figcaption>${own}</figcaption>` : ''}
      </figure>
    </div>
    <div>
${body}
    </div>
  </div>
</section>

<section class="ch ch-next" id="next" data-chapter="2" data-chapter-name="Read Next" data-theme="sage">
  <div class="wrap ch-head is-split">
    <div>
      ${tag('Read Next')}
      <h2 data-split>Three more, on the <em>same shelf.</em></h2>
    </div>
    <p class="lede">Every post is written for a parent, not a dentist. The same topic first, then whatever was published nearest to this one.</p>
  </div>
  <div class="wrap">
    <div class="cards is-3 bl-grid" data-stagger>
      ${next.map(p => postCard(p, built)).join('\n      ')}
    </div>
  </div>
</section>

${invite(3, 'Questions the article did not answer? Bring them.', 'A post is general by nature. The visit is about your child. Book one, and ask the front desk anything this page raised.', related, ['gumball-2', 'A toddler reaching for the gumball machine by the front desk', 'By the front desk. Suite 104B, behind the Ranch 99 complex.'])}`;
  return shell({ slug: `blog/${post.slug}`, title: `${post.title} | Mason Park Dental for Kids`, description: post.excerpt || post.title, main });
}

function overviewPage(all, built) {
  PREFIX = '../';
  const latest = all.slice(0, 3);
  const topics = ['First teeth and habits', 'The visit', 'Cleanings and prevention', 'Braces and aligners', 'Dental care']
    .map(t => ({ t, n: all.filter(p => p.topic === t).length, one: {
      'First teeth and habits': 'Pacifiers, bottles, thumbs, teething, and the first tooth.',
      'The visit': 'What happens in the room, how to prepare a nervous child, and choosing a practice.',
      'Cleanings and prevention': 'Brushing, flossing, fluoride, sealants, snacks, and the cavities they prevent.',
      'Braces and aligners': 'When teeth come in crooked, and what the teenage years can do about it.',
      'Dental care': 'Everything else the practice has written down for parents.',
    }[t] })).filter(x => x.n);
  const years = [...new Set(all.map(p => p.date.slice(0, 4)))].sort().reverse();
  const archive = years.map((y, i) => {
    const rows = all.filter(p => p.date.startsWith(y)).map(p => {
      const linked = built.has(p.slug);
      return `        <div class="bl-row"><time datetime="${p.date}">${dayMonth(p.date)}</time>${linked ? `<a href="/blog/${p.slug}/">${txt(p.title)}</a>` : `<span class="is-soon">${txt(p.title)}</span>`}<em>${txt(p.topic)}</em></div>`;
    }).join('\n');
    return `      <details class="bl-year"${i === 0 ? ' open' : ''}>
        <summary><span>${y}</span><small>${rows.split('\n').length} posts</small></summary>
        <div class="bl-rows">
${rows}
        </div>
      </details>`;
  }).join('\n');
  const main = `<section class="ch ch-arrival is-compact" id="arrival" data-chapter="0" data-chapter-name="Arrival" data-theme="dark">
  <div class="ar-bg" data-drift>
    ${img('st-story', { alt: 'A parent and child reading a book in bed', sizes: '100vw', eager: true })}
  </div>
  <div class="ar-veil" aria-hidden="true"></div>
  <div class="ar-in">
    ${tag('The Blog')}
    <h1 class="ar-title" data-split>Notes from the practice, written <em>for parents.</em></h1>
    <p class="ar-lede" data-anim="hide">${all.length} posts since ${years[years.length - 1]}: first teeth, habits, cleanings, braces, and what actually happens at the visit. Newest first.</p>
    <div class="ar-actions" data-anim="hide"><a class="button is-sun is-lg" href="#latest">Start with the latest</a>
      <a class="button is-ghost-light is-lg" href="#archive">Every post</a></div>
    <div class="ar-meta">
      <div data-anim="hide"><b>${all.length}</b><span>Posts</span></div>
      <div data-anim="hide"><b>${years[years.length - 1]} to ${years[0]}</b><span>Written</span></div>
      <div data-anim="hide"><b>${topics.length}</b><span>Topics</span></div>
    </div>
  </div>
</section>

${BADGES()}

<nav class="crumbs" aria-label="Breadcrumb"><span><a href="/">Home</a></span><span>Blog</span></nav>

<section class="ch ch-latest" id="latest" data-chapter="1" data-chapter-name="The Latest">
  <div class="wrap ch-head is-split">
    <div>
      ${tag('The Latest')}
      <h2 data-split>The three most <em>recent.</em></h2>
    </div>
    <p class="lede">One long read and two shorter ones. Every date is the date the practice published it.</p>
  </div>
  <div class="wrap">
    <div class="bl-feature" data-stagger>
      ${postCard(latest[0], built, { big: true })}
      ${latest.slice(1).map(p => postCard(p, built)).join('\n      ')}
    </div>
  </div>
</section>

<section class="ch ch-topics" id="topics" data-chapter="2" data-chapter-name="By Topic" data-theme="warm">
  <div class="wrap ch-head is-split">
    <div>
      ${tag('By Topic')}
      <h2 data-split>Five shelves, by what a parent is <em>asking about.</em></h2>
    </div>
    <p class="lede">Every post is on exactly one shelf. The archive below carries the shelf beside each title.</p>
  </div>
  <div class="wrap">
    <div class="cards is-3 bl-topics" data-stagger>
      ${topics.map(x => `<a class="card" href="#archive"><span class="card_no">${x.n}</span><h3>${txt(x.t)}</h3><p>${txt(x.one)}</p><span class="link-arrow">The archive <span aria-hidden="true">&rarr;</span></span></a>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="ch ch-archive" id="archive" data-chapter="3" data-chapter-name="Every Post" data-theme="sage">
  <div class="wrap ch-head is-split">
    <div>
      ${tag('Every Post')}
      <h2 data-split>All ${all.length}, by <em>year.</em></h2>
    </div>
    <p class="ch-note">A title without a link is a post that has not been brought across to this site yet.</p>
  </div>
  <div class="wrap">
    <div class="bl-archive">
${archive}
    </div>
  </div>
</section>

${invite(4, 'The visit answers the rest.', 'Reading is a good start. The exam is where a parent’s actual question gets answered, about their own child, by the person who just looked.', [['New patients', '/new-patients/'], ['Every question parents ask', '/pediatric-dentistry-faqs-katy-tx/'], ['All services', '/our-services/']], ['sofa', 'Two parents on the waiting-room sofa with the check-in tablet', 'The waiting room the two practices share. Suite 104B, behind the Ranch 99 complex.'])}`;
  return shell({ slug: 'blog', title: 'Blog | Mason Park Dental for Kids, Katy TX', description: `${all.length} posts for parents from Mason Park Dental for Kids in Katy, TX: first teeth, habits, cleanings, braces and aligners, and what happens at the visit.`, main });
}

// ---------------------------------------------------------------------------
if (flag('--harvest')) { harvest(); process.exit(0); }
if (!fs.existsSync(JSON_OUT)) { console.log('no blog-content.json yet; run with --harvest first'); process.exit(1); }
const ALL = JSON.parse(fs.readFileSync(JSON_OUT, 'utf8'));

const onDisk = slug => fs.existsSync(path.join(SITE, 'blog', slug, 'index.html'));
if (flag('--list')) {
  for (const p of ALL) console.log(`${onDisk(p.slug) ? 'built' : '     '}  ${p.date}  ${p.topic.padEnd(26)}  ${p.title.slice(0, 60)}\n         ${p.oldUrl.replace(OLD, '/')}  ->  /blog/${p.slug}/`);
  process.exit(0);
}

const want = flag('--all') ? ALL.map(p => p.slug)
  : opt('--only') ? ALL.map(p => p.slug).filter(s => opt('--only').split(',').some(k => s.includes(k)))
  : ALL.map(p => p.slug).filter(s => SAMPLE.some(k => s.includes(k)));
const built = new Set([...ALL.map(p => p.slug).filter(onDisk), ...want]);

let wrote = 0, kept = 0;
function writePage(rel, html) {
  const file = path.join(SITE, ...rel.split('/'), 'index.html');
  if (fs.existsSync(file) && !flag('--force') && !fs.readFileSync(file, 'utf8').includes(MARKER)) {
    console.log(`  keep  ${rel}  (hand-edited since it was built; --force to overwrite)`); kept++; return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log(`  wrote ${rel}`); wrote++;
}
for (const p of ALL) if (want.includes(p.slug)) writePage(`blog/${p.slug}`, articlePage(p, ALL, built));
writePage('blog', overviewPage(ALL, built));
console.log(`\n${wrote} written${kept ? `, ${kept} kept` : ''}, ${built.size} of ${ALL.length} posts on disk. Now: node stamp.mjs && node check.mjs`);
