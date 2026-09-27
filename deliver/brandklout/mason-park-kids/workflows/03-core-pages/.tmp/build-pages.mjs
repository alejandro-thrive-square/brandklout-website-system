// ===========================================================================
// build-pages.mjs — scaffolds the 46 migrated pages into the new design.
//
//   node build-pages.mjs              build every recipe in recipes/
//   node build-pages.mjs invisalign   build the ones whose slug matches
//   node build-pages.mjs --list       what is recipe'd and what is not
//
// WHY THIS EXISTS. On 2026-09-09 the client opened /services/invisalign and
// found the OLD chrome: the 02 migration's navbar and footer, on a page whose
// eleven siblings had been redesigned a week earlier. The eleven core pages
// were the only ones with local source; the other forty-six lived on Instatic
// as node trees and nothing on this disk could re-render them. That is why
// they were never redesigned, and why the chrome could drift.
//
// So: `harvest-migrated.mjs` pulled their CONTENT down into
// migrated-content.json, one entry per page with the prose as numbered
// blocks. A recipe in `recipes/` says which blocks go into which chapter of
// the new design, and this file writes `home/<slug>/index.html` from the two.
//
// WHAT THIS IS NOT. Not a runtime, and not a template the pages depend on.
// It writes a file ONCE and then gets out of the way: the output is committed,
// the output is the source, and from then on you edit the page's <main> in
// place exactly like the eleven. Re-running it OVERWRITES hand edits, so it
// refuses to touch a page whose file no longer carries the generated marker
// unless you pass --force.
//
// THE PROSE IS THE PRACTICE'S. A recipe may re-order blocks, drop one, or
// give a run of them a heading the editor implied but never typed. It may not
// rewrite them: every `b:` reference below resolves to the harvested HTML
// verbatim. Copy a recipe writes itself (a lede, a card, a question restored
// to its orphaned answer) is written out in full in the recipe, where it can
// be read and checked, never generated from a pattern.
//
// The chrome is NOT written here. Every page comes out with the homepage's
// head and a stub body, and `stamp.mjs` — which has been the one source of
// the chrome since 2026-09-02 — puts the real masthead and footer on. Run:
//
//     node build-pages.mjs && node stamp.mjs && node check.mjs
// ===========================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, '..', 'home');
// Inside <main>, deliberately: stamp.mjs keeps a page's <main> verbatim and
// replaces everything around it, so a marker anywhere else does not survive
// the first stamp and every page then reads as hand-edited.
const MARKER = '<!-- built by .tmp/build-pages.mjs from a recipe; see its header -->';

const argv = process.argv.slice(2);
const force = argv.includes('--force');
const list = argv.includes('--list');
const filter = argv.find(a => !a.startsWith('--'));

const harvest = JSON.parse(fs.readFileSync(path.join(HERE, 'migrated-content.json'), 'utf8'));
const CONTENT = new Map(harvest.pages.map(p => [p.slug, p]));

// --- the recipes -----------------------------------------------------------
const RECIPE_DIR = path.join(HERE, 'recipes');
const recipes = [];
for (const f of fs.readdirSync(RECIPE_DIR).filter(n => n.endsWith('.mjs')).sort()) {
  const mod = await import('file://' + path.join(RECIPE_DIR, f));
  for (const r of mod.default) recipes.push({ ...r, from: f });
}

if (list) {
  const done = new Set(recipes.map(r => r.slug));
  console.log(`${recipes.length} recipes, ${CONTENT.size} harvested pages\n`);
  for (const slug of [...CONTENT.keys()].sort()) console.log((done.has(slug) ? '  ok  ' : '  --  ') + slug);
  const extra = recipes.filter(r => !CONTENT.has(r.slug) && !r.standalone);
  if (extra.length) console.log('\nrecipes with no harvest:', extra.map(r => r.slug).join(', '));
  process.exit(0);
}

// ---------------------------------------------------------------------------
// The image pool. A recipe names a key ("chair", "st-lunchbox"); this resolves
// it to the widths that actually exist on disk, so a srcset never points at a
// file prep-images.py did not write.
const UPLOADS = path.join(SITE, 'assets', 'uploads');
const POOL = new Map();
for (const f of fs.existsSync(UPLOADS) ? fs.readdirSync(UPLOADS) : []) {
  const m = f.match(/^(.+?)-(\d+)\.webp$/);
  if (!m) continue;
  if (!POOL.has(m[1])) POOL.set(m[1], []);
  POOL.get(m[1]).push(+m[2]);
}
for (const w of POOL.values()) w.sort((a, b) => a - b);

function img(key, { alt, sizes, cls = '', eager = false, ratio }) {
  const widths = POOL.get(key);
  if (!widths) throw new Error(`no image "${key}" in assets/uploads/`);
  const mid = widths.find(w => w >= 960) || widths[widths.length - 1];
  const srcset = widths.map(w => `${PREFIX}assets/uploads/${key}-${w}.webp ${w}w`).join(', ');
  return `<img src="${PREFIX}assets/uploads/${key}-${mid}.webp" srcset="${srcset}" sizes="${sizes}"` +
    (cls ? ` class="${cls}"` : '') + ` alt="${attr(alt)}"` +
    (eager ? ' fetchpriority="high" decoding="async"' : ' loading="lazy" decoding="async"') + '>';
}

let PREFIX = ''; // set per page, from its depth

// ---------------------------------------------------------------------------
const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const txt = s => String(s).replace(/&(?!(?:amp|lt|gt|quot|#\d+|#x[0-9a-f]+);)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Typographic house rules, applied to every string that reaches the page.
// The em dash is banned by check.mjs; the migrated prose is full of them, and
// of the straight quotes WordPress left behind.
function type(s) {
  return String(s)
    .replace(/\s*—\s*/g, ', ')      // em dash -> a comma, the way the eleven read
    // A phone number is not a range. Without this guard the rule below turned
    // (281) 578-7100 into "(281) 578 to 7100" on 18 pages, and the schema block
    // a WP post carried into "281 to 578 to 7100". Both shapes are parked:
    // 281-578-7100 and the bare local 578-7100. A three-then-four digit run is
    // a phone number on this site; no real range is written that way.
    .replace(/(?<!\d)(\d{3})[–-](\d{3})[–-](\d{4})(?!\d)/g, '$1\x01$2\x01$3')
    .replace(/(?<!\d)(\d{3})[–-](\d{4})(?!\d)/g, '$1\x01$2')
    .replace(/(\d)\s*[–-]\s*(\d)/g, '$1 to $2') // 6-18 months -> 6 to 18 months
    .replace(/\x01/g, '-')
    .replace(/–/g, ', ')            // any other en dash
    .replace(/'/g, '’')
    .replace(/ /g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// A harvested block reference. `b: [0, 1]` is blocks 0 and 1 of this page's
// harvest; `b: ['other-slug', 3]` reaches into another page's, which is how a
// treatment page borrows the answer that lives on the FAQ page.
function blockOf(page, ref) {
  if (Array.isArray(ref)) {
    const src = CONTENT.get(ref[0]);
    if (!src) throw new Error(`${page.slug}: no harvested page "${ref[0]}"`);
    const b = src.body[ref[1]];
    if (!b) throw new Error(`${page.slug}: ${ref[0]} has no block ${ref[1]}`);
    return b;
  }
  const b = page.body[ref];
  if (!b) throw new Error(`${page.slug}: no block ${ref} (has ${page.body.length})`);
  return b;
}

// Render a list of block refs (or literal strings, which are treated as one
// paragraph of already-written HTML) into prose.
function prose(page, refs) {
  return (refs || []).map(ref => {
    if (typeof ref === 'string') return `<p>${type(ref)}</p>`;
    if (ref && ref.raw) return ref.raw;
    return render(page, blockOf(page, ref));
  }).join('\n        ');
}

// One harvested block as markup. Split out of prose() so a `faq` block, whose
// answer is itself a list of blocks, can render its own contents: the dental
// dictionary arrives as twenty-one of those, one <details> per letter.
function render(page, b) {
  switch (b.t) {
    case 'p': return `<p>${type(b.html).replace(/<br>\s*$/, '')}</p>`;
    case 'h': return `<h3>${txt(type(b.text))}</h3>`;
    case 'ul': return `<ul class="lf-ticks">${b.items.map(i => `<li>${type(i)}</li>`).join('')}</ul>`;
    case 'ol': return `<ol class="lf-steps">${b.items.map(i => `<li>${type(i)}</li>`).join('')}</ol>`;
    case 'quote': return `<blockquote>${type(b.html)}</blockquote>`;
    case 'faq': return (b.a || []).map(x => render(page, x)).join('\n        ');
    default: throw new Error(`${page.slug}: block type "${b.t}" has no prose form`);
  }
}

// The plain text of a block, for a lede or a card.
function plain(page, ref) {
  if (typeof ref === 'string') return type(ref);
  const b = blockOf(page, ref);
  const s = b.t === 'h' ? b.text : b.t === 'p' ? b.html.replace(/<[^>]+>/g, '') : (b.items || []).join('. ');
  return type(s);
}

// A headline with one phrase set in the display italic. `h1: "..."`, `em: "..."`
function headline(h, em) {
  const t = txt(type(h));
  if (!em) return t;
  const e = txt(type(em));
  if (!t.includes(e)) throw new Error(`em "${em}" is not in headline "${h}"`);
  return t.replace(e, `<em>${e}</em>`);
}

// ---------------------------------------------------------------------------
// THE CHAPTERS. One function per shape, all drawing on the vocabulary already
// in site.css. `n` is the chapter number the journey layer counts with.

const tag = name => `<p class="chapter-tag"><i></i><b>${txt(name)}</b></p>`;
const themeAttr = t => (t && t !== 'plain' ? ` data-theme="${t}"` : '');

function chArrival(page, r, n) {
  const hero = r.hero;
  return `<section class="ch ch-arrival is-compact" id="arrival" data-chapter="${n}" data-chapter-name="Arrival" data-theme="dark">
  <div class="ar-bg${hero.pos ? ' is-' + hero.pos : ''}" data-drift>
    ${img(hero.img, { alt: hero.alt, sizes: '100vw', eager: true })}
  </div>
  <div class="ar-veil" aria-hidden="true"></div>
  <div class="ar-in">
    ${tag(r.eyebrow)}
    <h1 class="ar-title" data-split>${headline(r.h1, r.em)}</h1>
    <p class="ar-lede" data-anim="hide">${type(r.lede)}</p>
    <div class="ar-actions" data-anim="hide"><a class="button is-sun is-lg" href="https://www.flexbook.me/masonpark/1" target="_blank" rel="noopener">${txt(r.cta || 'Book a visit')}</a>
      <a class="button is-ghost-light is-lg" href="#${r.cta2href || (r.chapters[0] && r.chapters[0].id) || 'invitation'}">${txt(r.cta2 || 'Read on')}</a></div>
  </div>
</section>`;
}

const BADGES = `<div class="badges">
  <div class="badges-in">
    <p class="badges-label">Credentialed by</p>
    <ul>
      <li>{{abpd}}</li>
      <li>{{aapd}}</li>
      <li>{{agd}}</li>
      <li>{{kois}}</li>
      <li>{{ssc}}</li>
    </ul>
  </div>
</div>`;

const BADGE_ALT = {
  abpd: 'American Board of Pediatric Dentistry, board certified',
  aapd: 'American Academy of Pediatric Dentistry',
  agd: 'Academy of General Dentistry',
  kois: 'Kois Center',
  ssc: 'Seattle Study Club',
};
const badges = () => BADGES.replace(/\{\{(\w+)\}\}/g, (_, k) =>
  `<img src="${PREFIX}assets/uploads/${k}.webp" alt="${BADGE_ALT[k]}" loading="lazy" decoding="async">`);

const crumbs = r => `<nav class="crumbs" aria-label="Breadcrumb"><span><a href="/">Home</a></span>` +
  (r.crumbs || []).map(c => Array.isArray(c) ? `<span><a href="${c[1]}">${txt(c[0])}</a></span>` : `<span>${txt(c)}</span>`).join('') +
  `</nav>`;

function chProse(page, c, n) {
  const figure = c.figure ? `
      <figure class="lf-figure" data-wipe>
        ${img(c.figure.img, { alt: c.figure.alt, sizes: '(max-width: 899px) 100vw, 30vw' })}
        ${c.figure.caption ? `<figcaption>${type(c.figure.caption)}</figcaption>` : ''}
      </figure>` : '';
  const sections = c.sections.map(s => `      <section class="lf-section"${s.id ? ` id="${s.id}"` : ''}>
        ${s.h ? `<h3>${txt(type(s.h))}</h3>` : ''}
        ${prose(page, s.b)}
      </section>`).join('\n');
  return `<section class="ch ch-${c.id}" id="${c.id}" data-chapter="${n}" data-chapter-name="${txt(c.name)}"${themeAttr(c.theme)}>
  <div class="wrap lf-layout lf-split">
    <div class="lf-head">
      ${tag(c.name)}
      <h2 data-split>${headline(c.title, c.em)}</h2>
      ${c.note ? `<p class="ch-note">${type(c.note)}</p>` : ''}${figure}
    </div>
    <div>
${sections}
    </div>
  </div>
</section>`;
}

function chCards(page, c, n) {
  const mods = ['', ' is-sky', ' is-sun'];
  const cards = c.cards.map((k, i) => `      <div class="sq-card${k.mod !== undefined ? (k.mod ? ' ' + k.mod : '') : mods[i % 3]}">` +
    (c.numbered === false ? '' : `<span class="cf-glyph" aria-hidden="true">${i + 1}</span>`) +
    `<h3>${txt(type(k.h))}</h3><p>${type(k.p)}</p></div>`).join('\n');
  return `<section class="ch ch-${c.id}" id="${c.id}" data-chapter="${n}" data-chapter-name="${txt(c.name)}"${themeAttr(c.theme)}>
  <div class="wrap ch-head is-split">
    <div>
      ${tag(c.name)}
      <h2 data-split>${headline(c.title, c.em)}</h2>
    </div>
    ${c.lede ? `<p class="lede">${type(c.lede)}</p>` : ''}
  </div>
  <div class="wrap">
    <div class="sq-grid" data-stagger>
${cards}
    </div>
  </div>
</section>`;
}

function chOverlap(page, c, n) {
  return `<section class="ch ch-${c.id}" id="${c.id}" data-chapter="${n}" data-chapter-name="${txt(c.name)}"${themeAttr(c.theme)}>
  <div class="wrap ch-head is-split">
    <div>
      ${tag(c.name)}
      <h2 data-split>${headline(c.title, c.em)}</h2>
    </div>
    ${c.lede ? `<p class="lede">${type(c.lede)}</p>` : ''}
  </div>
  <div class="wrap">
    <div class="sw-overlap">
      <figure class="sw-overlap_shot" data-drift>
        ${img(c.shot.img, { alt: c.shot.alt, sizes: '(max-width: 899px) 100vw, 58vw' })}
      </figure>
      <div class="sw-overlap_panel" data-stagger>
        <h3>${txt(type(c.h3))}</h3>
        <ul>${c.items.map(i => `<li>${type(i)}</li>`).join('')}</ul>
        ${c.link ? `<a class="link-arrow" href="${c.link[1]}">${txt(c.link[0])} <span aria-hidden="true">&rarr;</span></a>` : ''}
      </div>
    </div>
  </div>
</section>`;
}

function chQuestions(page, c, n) {
  const items = c.items.map(q => {
    const a = typeof q.a === 'string' ? `<p>${type(q.a)}</p>` : prose(page, q.a);
    return `      <details class="faq_item"><summary class="faq_question">${txt(type(q.q))}</summary><div class="faq_answer">${a}</div></details>`;
  }).join('\n');
  const figure = c.figure ? `
  <div class="wrap">
    <figure class="ch-figure is-band" data-wipe data-drift>${img(c.figure.img, { alt: c.figure.alt, sizes: '(max-width: 899px) 100vw, 75vw' })}</figure>
  </div>` : '';
  return `<section class="ch ch-${c.id}" id="${c.id}" data-chapter="${n}" data-chapter-name="${txt(c.name)}"${themeAttr(c.theme)}>
  <div class="wrap lf-layout lf-split">
    <div class="lf-head">
      ${tag(c.name)}
      <h2 data-split>${headline(c.title, c.em)}</h2>
      ${c.note ? `<p class="ch-note">${c.note}</p>` : ''}
    </div>
    <div class="faq_list">
${items}
    </div>
  </div>${figure}
</section>`;
}

// The open Q and A: no accordion, every answer visible. For a page that IS
// its questions, where hiding them behind a summary hides the whole page.
function chOpenQa(page, c, n) {
  const rows = c.items.map(q =>
    `      <div class="np-qa_row"><h3>${txt(type(q.q))}</h3>${typeof q.a === 'string' ? `<p>${type(q.a)}</p>` : prose(page, q.a)}</div>`).join('\n');
  return `<section class="ch ch-${c.id}" id="${c.id}" data-chapter="${n}" data-chapter-name="${txt(c.name)}"${themeAttr(c.theme)}>
  <div class="wrap ch-head is-split">
    <div>
      ${tag(c.name)}
      <h2 data-split>${headline(c.title, c.em)}</h2>
    </div>
    ${c.lede ? `<p class="lede">${type(c.lede)}</p>` : ''}
  </div>
  <div class="wrap">
    <div class="np-qa" data-stagger>
${rows}
    </div>
  </div>
</section>`;
}

function chTable(page, c, n) {
  // `from: <block>` takes the rows out of a harvested <table> instead of the
  // recipe. `pairs: k` un-doubles a table that was laid out as k side-by-side
  // copies of the same columns to save vertical space in print - the RDA table
  // is two - so the result is one honest column pair that reads on a phone.
  if (c.from !== undefined) {
    const b = blockOf(page, c.from);
    if (b.t !== 'table') throw new Error(`${page.slug}: block ${c.from} is a "${b.t}", not a table`);
    const width = c.head.length;
    const copies = c.pairs || 1;
    const body = b.skipHead === false ? b.rows : b.rows.slice(1);
    const rows = [];
    for (const r of body) {
      for (let i = 0; i < copies; i++) {
        const cells = r.slice(i * width, i * width + width).map(x => x.html);
        if (cells.some(x => x && x.trim())) rows.push(cells);
      }
    }
    // `sortBy: i` orders the result by column i, numerically. The RDA table
    // needs it: un-doubling a two-pair layout row by row interleaves the low
    // column with the high one, so "lowest first" came out 0, 91, 4, 93. The
    // values are untouched; only the order is ours.
    if (c.sortBy !== undefined) {
      const num = (r) => { const v = parseFloat(String(r[c.sortBy]).replace(/[^\d.-]/g, '')); return Number.isFinite(v) ? v : Infinity; };
      rows.sort((a, b) => num(a) - num(b));
    }
    c = { ...c, rows };
  }
  const head = `<thead><tr>${c.head.map(h => `<th scope="col">${txt(type(h))}</th>`).join('')}</tr></thead>`;
  const rows = c.rows.map(r => `<tr>${r.map((cell, i) =>
    `<td${i ? ` data-label="${attr(c.head[i])}"` : ''}>${type(cell)}</td>`).join('')}</tr>`).join('\n        ');
  return `<section class="ch ch-${c.id}" id="${c.id}" data-chapter="${n}" data-chapter-name="${txt(c.name)}"${themeAttr(c.theme)}>
  <div class="wrap ch-head is-split">
    <div>
      ${tag(c.name)}
      <h2 data-split>${headline(c.title, c.em)}</h2>
    </div>
    ${c.lede ? `<p class="lede">${type(c.lede)}</p>` : ''}
  </div>
  <div class="wrap">
    <table class="fi-matrix">
      ${head}
      <tbody>
        ${rows}
      </tbody>
    </table>
    ${c.note ? `<p class="ch-note">${type(c.note)}</p>` : ''}
  </div>
</section>`;
}

// A grid of link cards: the index pages (sitemap, the library, resources).
function chLinks(page, c, n) {
  const groups = c.groups.map(g => `      <div class="card">
        <h3>${txt(type(g.h))}</h3>
        ${g.p ? `<p>${type(g.p)}</p>` : ''}
        <ul class="lf-ticks">${g.links.map(l => `<li><a href="${l[1]}">${txt(type(l[0]))}</a></li>`).join('')}</ul>
      </div>`).join('\n');
  return `<section class="ch ch-${c.id}" id="${c.id}" data-chapter="${n}" data-chapter-name="${txt(c.name)}"${themeAttr(c.theme)}>
  <div class="wrap ch-head is-split">
    <div>
      ${tag(c.name)}
      <h2 data-split>${headline(c.title, c.em)}</h2>
    </div>
    ${c.lede ? `<p class="lede">${type(c.lede)}</p>` : ''}
  </div>
  <div class="wrap">
    <div class="cards ${c.cols === 2 ? '' : 'is-3'}" data-stagger>
${groups}
    </div>
  </div>
</section>`;
}

// One sentence, written word by word as it arrives.
function chStatement(page, c, n) {
  return `<section class="ch ch-${c.id}" id="${c.id}" data-chapter="${n}" data-chapter-name="${txt(c.name)}"${themeAttr(c.theme)}>
  <div class="wrap">
    <div class="manifesto">
      <span class="kicker">${txt(type(c.kicker))}</span>
      <p class="statement" data-write>${type(c.text)}</p>
      ${c.by ? `<p class="oneword figcaption ch-foot"><span class="kicker">${txt(type(c.by))}</span></p>` : ''}
    </div>
    ${c.link ? `<p class="oneword-foot ch-foot"><a class="link-arrow" href="${c.link[1]}">${txt(c.link[0])} <span aria-hidden="true">&rarr;</span></a></p>` : ''}
  </div>
</section>`;
}

// The counted figures.
function chFigures(page, c, n) {
  return `<section class="ch ch-${c.id}" id="${c.id}" data-chapter="${n}" data-chapter-name="${txt(c.name)}"${themeAttr(c.theme)}>
  <div class="wrap ch-head is-split">
    <div>
      ${tag(c.name)}
      <h2 data-split>${headline(c.title, c.em)}</h2>
    </div>
    ${c.lede ? `<p class="lede">${type(c.lede)}</p>` : ''}
  </div>
  <div class="wrap">
    <div class="figures" data-stagger>
      ${c.figures.map(f => `<div><b data-count="${attr(f.n)}">${txt(f.n)}</b><span>${txt(type(f.label))}</span><small>${type(f.note)}</small></div>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

// The pinned path: a run of steps the page travels sideways through.
function chPath(page, c, n) {
  const cards = c.steps.map((s, i) => `      <article class="pa-card${s.cta ? ' is-cta' : ''}">` +
    (s.img ? `<div class="pa-shot">${img(s.img, { alt: s.alt, sizes: '24rem' })}</div>` : '') +
    (s.cta ? '' : `<span class="pa-no">${i + 1}</span>`) +
    `<h3>${txt(type(s.h))}</h3><p>${type(s.p)}</p>` +
    (s.cta ? `<a class="button" href="${s.cta[1]}"${s.cta[1].startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${txt(s.cta[0])}</a>` : '') +
    `</article>`).join('\n');
  return `<section class="ch ch-path" id="${c.id}" data-chapter="${n}" data-chapter-name="${txt(c.name)}"${themeAttr(c.theme)}>
  <div class="pa-pin" id="pathPin">
    <div class="pa-head">
      ${tag(c.name)}
      <h2 data-split>${headline(c.title, c.em)}</h2>
    </div>
    <div class="pa-track" id="pathTrack">
${cards}
    </div>
    <div class="pa-bar" aria-hidden="true"><i id="pathBar"></i></div>
  </div>
</section>`;
}

// A full-width photograph, on its own, between two chapters.
function chBand(page, c, n) {
  return `<section class="ch ch-${c.id}" id="${c.id}" data-chapter="${n}" data-chapter-name="${txt(c.name)}"${themeAttr(c.theme)}>
  <div class="wrap">
    <figure class="ch-figure is-band" data-wipe data-drift>${img(c.img, { alt: c.alt, sizes: '(max-width: 899px) 100vw, 75vw' })}${c.caption ? `<figcaption>${type(c.caption)}</figcaption>` : ''}</figure>
  </div>
</section>`;
}

const HOURS = `<dt>Hours</dt><dd>Mon to Thu <b>9am to 6pm</b><br>Fri to Sun <b>Closed</b></dd>`;
const ADDRESS = `<dt>Address</dt><dd><a href="https://www.google.com/maps/place/Mason+Park+Dental+for+Kids+-+Pediatric+Dentist+Katy+TX/@29.7759444,-95.7490312,17z/data=!4m6!3m5!1s0x8641277706112ec1:0x98941d027afdec7b!8m2!3d29.7759444!4d-95.7490312!16s%2Fg%2F11sff9c67k" target="_blank" rel="noopener">21830 Kingsland Blvd #104B<br>Katy, TX 77450</a></dd>`;
const MAP = `<div class="iv-map">
        <div class="embed_component">
          <iframe data-src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3463.0585305167815!2d-95.7490312!3d29.7759444!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8641277706112ec1%3A0x98941d027afdec7b!2sMason%20Park%20Dental%20for%20Kids%20-%20Pediatric%20Dentist%20Katy%20TX!5e0!3m2!1sen!2sus!4v1638807674675!5m2!1sen!2sus" title="Map to Mason Park Dental for Kids" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
      </div>`;

function chInvite(page, c, n) {
  const shot = c.shot || { img: 'waiting', alt: 'The waiting room at Mason Park Dental', caption: 'Suite 104B, behind the Ranch 99 complex. Free parking at the door.' };
  const related = (c.related || []).map(l => `<a href="${l[1]}">${txt(l[0])}</a>`).join('<br>');
  return `<section class="ch ch-invitation" id="invitation" data-chapter="${n}" data-chapter-name="The Invitation" data-theme="dark">
  <div class="wrap iv-top">
    <div class="iv-copy">
      ${tag('The Invitation')}
      <h2 data-split>${headline(c.title, c.em)}</h2>
      <p class="iv-lede">${type(c.lede)}</p>
      <div class="iv-actions">
        <a class="button is-sun is-lg" href="https://www.flexbook.me/masonpark/1" target="_blank" rel="noopener">${txt(c.cta || 'Book a visit')}</a>
        <a class="button is-ghost-light is-lg" href="tel:+12815787100">(281) 578-7100</a>
      </div>
      <dl class="iv-facts">
        <div>${ADDRESS}</div>
        <div>${HOURS}</div>
        ${related ? `<div><dt>Related</dt><dd>${related}</dd></div>` : ''}
      </dl>
    </div>
    <div class="iv-aside">
      <figure class="iv-shot">
        ${img(shot.img, { alt: shot.alt, sizes: '(max-width: 899px) 100vw, 45vw' })}
        ${shot.caption ? `<figcaption>${type(shot.caption)}</figcaption>` : ''}
      </figure>
      ${MAP}
      <a class="link-arrow is-light" href="https://www.google.com/maps/dir/?api=1&amp;destination=Mason%20Park%20Dental%20for%20Kids%20-%20Pediatric%20Dentist%20Katy%20TX%2C%2021830%20Kingsland%20Blvd%20%23104B%2C%20Katy%2C%20TX%2077450" target="_blank" rel="noopener">Get directions <span aria-hidden="true">&rarr;</span></a>
    </div>
  </div>
</section>`;
}

const CHAPTERS = {
  prose: chProse, cards: chCards, overlap: chOverlap, questions: chQuestions,
  qa: chOpenQa, table: chTable, links: chLinks, statement: chStatement,
  figures: chFigures, path: chPath, band: chBand, invite: chInvite,
};

// ---------------------------------------------------------------------------
function build(r) {
  const page = CONTENT.get(r.slug) || { slug: r.slug, body: [] };
  const depth = r.slug.split('/').length;
  PREFIX = '../'.repeat(depth);

  const parts = [chArrival(page, r, 0)];
  if (r.badges !== false) parts.push(badges());
  parts.push(crumbs(r));
  r.chapters.forEach((c, i) => {
    const fn = CHAPTERS[c.k];
    if (!fn) throw new Error(`${r.slug}: no chapter kind "${c.k}"`);
    parts.push(fn(page, c, i + 1));
  });

  const canonical = `https://pediatricdentistkatytx.com/${r.slug}/`;
  const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${txt(type(r.title))}</title>
<meta name="description" content="${attr(type(r.description))}">
${r.noindex ? '<meta name="robots" content="noindex, follow">\n' : ''}<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Mason Park Dental for Kids">
<meta property="og:title" content="${attr(type(r.title))}">
<meta property="og:description" content="${attr(type(r.ogDescription || r.description))}">
<meta property="og:url" content="${canonical}">
</head>
<body class="has-journey">
<main class="main-wrapper" id="main">
${MARKER}
${parts.join('\n\n')}
</main>
</body>
</html>
`;
  return head;
}

// ---------------------------------------------------------------------------
let wrote = 0, skipped = 0;
for (const r of recipes) {
  if (filter && !r.slug.includes(filter)) continue;
  const file = path.join(SITE, ...r.slug.split('/'), 'index.html');
  if (fs.existsSync(file) && !force) {
    const cur = fs.readFileSync(file, 'utf8');
    if (!cur.includes(MARKER)) {
      console.log(`  keep  ${r.slug}  (hand-edited since it was built; --force to overwrite)`);
      skipped++;
      continue;
    }
  }
  let html;
  try { html = build(r); }
  catch (e) { console.log(`  FAIL  ${r.slug}: ${e.message}`); process.exitCode = 1; continue; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log(`  wrote ${r.slug}`);
  wrote++;
}
console.log(`\n${wrote} written${skipped ? `, ${skipped} kept` : ''}. Now: node stamp.mjs && node check.mjs`);
