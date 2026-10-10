/* The inner pages' component library. Every page under pages/ is `page({...})` over a list of
   chapters made by the functions below; each returns { cls, name, ground, id, html } and page()
   wraps it in its section (section_<beat>, a light ground, data-chapter and its name).

   Rules the components keep, so the pages cannot break them:
   - Copy is the practice's own (the live site), placed, never rewritten. A run of prose longer than
     about 110 words folds into a <details data-fold> (DESIGN-STANDARD, "No wall of text").
   - One class per styled element (CLASS-STANDARD); rich bodies use text-rich-text, the one place
     children are styled by context. Scripts find everything by data- attributes.
   - Neighbouring chapters never share a ground; the hero is always the sand of the home page.
   - Images are /media/img/<file>, cut to the slot's aspect by code/prep-images.py, so no
     object-position is needed. */
import { FACTS, SURVEY, REVIEWS, MAP } from './site.mjs';
import { esc } from './shell.mjs';

export { esc };
const tel = `tel:${FACTS.phoneE164}`;
/* the light grounds, in the order chapters take them; a neighbour never shares a tone family */
const GROUNDS = ['white', 'sand', 'primary', 'sage', 'linen', 'white', 'stone', 'primary'];
const FAMILY = { white: 'light', primary: 'light', alternate: 'beige', linen: 'beige', stone: 'beige', sand: 'deep', sage: 'green' };

/* ---------- small helpers ---------- */
export const img = (m, cls, eager = false) => m ? `<img class="${cls}" src="/media/img/${m.src}" width="${m.w || 1200}" height="${m.h || 900}"${eager ? '' : ' loading="lazy"'} alt="${esc(m.alt || '')}">` : '';
const tagline = (t, center) => t ? `<div class="text-style-tagline${center ? ' text-align-center' : ''}" data-type>${t}</div>` : '';
const words = (html) => String(html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
/* a rich body: paragraphs and lists as given. A long tail folds: `more` is the copy past the fold. */
export const rich = (html, cls, more, moreLabel = 'Read more') => {
  if (!html && !more) return '';
  const fold = more ? `<details class="fold_component" data-fold><summary class="fold_summary">${esc(moreLabel)}</summary><div class="fold_body text-rich-text">${more}</div></details>` : '';
  return `<div class="${cls} text-rich-text">${html || ''}</div>${fold}`;
};
export const p = (...xs) => xs.map((x) => `<p>${x}</p>`).join('');
export const ul = (items) => `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
const actions = (list = [], cls = '') => list.length ? `<div class="button-group${cls ? ' ' + cls : ''}">${list.map((a) => a.kind === 'link'
  ? `<a class="button is-link" href="${a.href}">${esc(a.label)}</a>`
  : `<a class="button${a.kind === 'secondary' ? ' is-secondary' : ''}" href="${a.href}"${a.kind === 'secondary' ? '' : ' data-button'}>${esc(a.label)}</a>`).join('')}</div>` : '';
export const BOOK = { label: 'Book A Consultation', href: '#consultation' };
export const CALL = { label: `Call ${FACTS.phone}`, href: tel, kind: 'link' };
const num = (i) => String(i + 1).padStart(2, '0');

/* ---------- the page ---------- */
/* A page is six to eight chapters (DESIGN-STANDARD). A long treatment page has more blocks than that,
   so blocks that answer the same question share a chapter, in this order of preference, until the page
   has eight: the recovery timeline joins the treatment steps, the comparison joins the options, the
   films join the specialist, the checks join the answer, and the closing run (financing, questions,
   consultation) becomes one invitation. Each block keeps its own ground; the chapter is the beat. */
const JOINS = [['section_path', 'section_timeline'], ['section_cards', 'section_compare'], ['section_faq', 'section_consultation'], ['section_financing', 'section_faq'], ['section_specialist', 'section_films'], ['section_statement', 'section_checks'], ['section_index', 'section_specialist'], ['section_checks', 'section_index']];
function chapterise(list) {
  let groups = list.map((c) => [c]);
  for (const [a, b] of JOINS) {
    if (groups.length <= 8) break;
    for (let i = 0; i < groups.length - 1 && groups.length > 8; i++) {
      const tail = groups[i][groups[i].length - 1];
      if (tail.cls === a && groups[i + 1][0].cls === b) { groups[i] = groups[i].concat(groups[i + 1]); groups.splice(i + 1, 1); }
    }
  }
  /* still more than eight: a supporting block (a quote, the numbers, the films, a timeline, notes, a
     photograph and its copy) joins the chapter before it, the smallest chapter first; never the hero */
  const SUPPORT = ['section_quote', 'section_numbers', 'section_films', 'section_timeline', 'section_features', 'section_split', 'section_checks', 'section_index'];
  while (groups.length > 8) {
    let best = -1;
    let score = Infinity;
    for (let i = 1; i < groups.length - 1; i++) {
      const rank = SUPPORT.indexOf(groups[i + 1][0].cls);
      if (rank < 0) continue;
      const s = rank * 10 + groups[i].length + groups[i + 1].length;
      if (s < score) { score = s; best = i; }
    }
    if (best < 0) break;
    groups[best] = groups[best].concat(groups[best + 1]);
    groups.splice(best + 1, 1);
  }
  return groups;
}

export function page({ path, seo, crumbs, chapters, schema }) {
  let last = 'alternate';
  let k = 0;
  const ground = (c, first) => {
    let g = c.ground;
    if (!g || FAMILY[g] === FAMILY[last]) { do { g = GROUNDS[k++ % GROUNDS.length]; } while (FAMILY[g] === FAMILY[last]); }
    if (first) g = c.ground || 'alternate';
    last = g;
    return g;
  };
  const html = chapterise(chapters.filter(Boolean)).map((group, i) => {
    if (group.length === 1) {
      const c = group[0];
      const id = c.id ? ` id="${c.id}"` : '';
      return `<!-- ============ ${c.name.toUpperCase()} ============ -->
<section class="${c.cls} background-color-${ground(c, i === 0)}"${id} data-chapter="${i}" data-chapter-name="${esc(c.name)}"${c.attrs || ''}>
${c.html}
</section>`;
    }
    /* a chapter of several blocks: the section is the beat, each block keeps its folder and ground */
    const name = group.some((c) => c.cls === 'section_consultation') ? 'The Invitation' : group[0].name;
    const blocks = group.map((c) => `<div class="${c.cls} background-color-${ground(c, false)}"${c.id ? ` id="${c.id}"` : ''}${c.attrs || ''}>
${c.html}
</div>`).join('\n');
    return `<!-- ============ ${name.toUpperCase()} ============ -->
<section class="section_chapter" data-chapter="${i}" data-chapter-name="${esc(name)}">
${blocks}
</section>`;
  }).join('\n\n');
  const form = /data-form/.test(html);
  return { seo, crumbs, body: html, form, schema };
}
const wrap = (inner, pad = 'padding-section-large') => `  <div class="padding-global"><div class="container-large"><div class="${pad}">
${inner}
  </div></div></div>`;

/* ---------- arrival: the page's header ----------
   variant 'photo' (default): headline left, a tall photograph to the right edge with the doctor's
   card on it. 'wide': headline across, the photograph as a wide band under it. 'plain': no photo. */
export function hero({ crumbs = [], tagline: tg, title, lead, image, actions: acts = [BOOK, CALL], variant = 'photo', card = true, name = 'Arrival', note }) {
  const crumb = crumbs.length ? `<nav class="header_breadcrumb" aria-label="Breadcrumb"><a class="header_breadcrumb-link" href="/">Home</a>${crumbs.map(([h, t], i) => `<span class="header_breadcrumb-divider" aria-hidden="true">/</span>${i === crumbs.length - 1 ? `<span class="header_breadcrumb-current" aria-current="page">${esc(t)}</span>` : `<a class="header_breadcrumb-link" href="${h}">${esc(t)}</a>`}`).join('')}</nav>` : '';
  const doctor = card ? `<div class="header_card" data-hero-hold>
          <img class="header_card-image" src="/media/img/doctor-face-v2.webp" width="192" height="192" alt="Portrait of Dr. Alan Meskin">
          <div class="header_card-who"><span class="header_card-name">Dr. Alan Meskin</span><span class="header_card-role">NYU-trained prosthodontist</span></div>
          <div class="header_card-rating"><strong class="header_card-value">${FACTS.rating}</strong><span class="header_card-stars" aria-hidden="true">★★★★★</span><span>Google rating</span></div>
        </div>` : '';
  const isWide = variant === 'wide' && image;
  const head = `${tg ? `<div class="text-style-tagline" data-hero-hold>${tg}</div>` : ''}
        <h1 class="header_heading${isWide ? ' is-wide' : String(title).replace(/<[^>]+>/g, '').length > 44 ? ' is-long' : ''}" data-split="hero">${title}</h1>`;
  const side = `${lead ? `<p class="header_lead" data-hero-hold>${lead}</p>` : ''}
        ${note ? `<p class="header_note" data-hero-hold>${note}</p>` : ''}
        ${acts.length ? `<div class="header_actions" data-hero-hold>${actions(acts)}</div>` : ''}`;
  const copy = isWide
    ? `<div class="header_content is-wide">
        ${crumb}
        <div class="header_split">
          <div class="header_main">${head}</div>
          <div class="header_side">${side}</div>
        </div>
      </div>`
    : `<div class="header_content${variant === 'plain' || !image ? ' is-plain' : ''}">
        ${crumb}
        ${head}
        ${side}
      </div>`;
  let inner;
  if (variant === 'plain' || !image) {
    inner = `  <div class="padding-global"><div class="container-large"><div class="header_grid is-plain">
      ${copy}
  </div></div></div>`;
  } else if (variant === 'wide') {
    inner = `  <div class="padding-global"><div class="container-large"><div class="header_grid is-wide">
      ${copy}
  </div></div></div>
  <div class="header_band" data-hero-media>
    <div class="header_band-frame">${img(image, 'header_band-image', true)}</div>
    ${doctor.replace('class="header_card"', 'class="header_card is-band"')}
  </div>`;
  } else {
    inner = `  <div class="padding-global"><div class="container-large"><div class="header_grid">
      ${copy}
      <div class="header_media" data-hero-media>
        <div class="header_frame">${img(image, 'header_image', true)}</div>
        ${doctor}
      </div>
  </div></div></div>`;
  }
  return { cls: 'section_header', name, ground: 'alternate', html: inner, attrs: ' data-page-hero' };
}

/* ---------- the answer: a heading, its first sentence written by the scroll, the rest beside ---------- */
export function statement({ name = 'The Answer', tagline: tg, title, lead, body, more, drawing, image, id }) {
  const media = image ? `<div class="statement_photo" data-reveal="wipe" data-parallax>${img(image, 'statement_image')}</div>` : drawing ? `<div class="statement_drawing" data-drawing="${drawing}"></div>` : '';
  return { cls: 'section_statement', name, id, html: wrap(`    <div class="statement_grid">
      <div class="statement_head">
        ${tagline(tg)}
        <h2 class="statement_heading" data-split>${title}</h2>
        ${media}
      </div>
      <div class="statement_body" data-scene="statement">
        ${lead ? `<p class="statement_lead" data-words>${lead}</p>` : ''}
        ${rich(body, 'statement_text', more)}
      </div>
    </div>`) };
}

/* ---------- what it fixes: short lines in two columns, a gold mark drawn beside each ---------- */
export function checks({ name = 'What It Fixes', tagline: tg, title, intro, items = [], image, id, after }) {
  return { cls: 'section_checks', name, id, html: wrap(`    <div class="checks_grid${image ? '' : ' is-text'}">
      <div class="checks_head${image ? '' : ' is-text'}">
        ${tagline(tg)}
        <h2 class="checks_heading" data-split>${title}</h2>
        ${intro ? `<div class="checks_intro text-rich-text" data-reveal="rise">${intro}</div>` : ''}
        ${image ? `<div class="checks_photo" data-reveal="wipe" data-parallax>${img(image, 'checks_image')}</div>` : ''}
      </div>
      <ul class="checks_list${image ? '' : ' is-text'}" data-scene="checks">
        ${items.map((t) => `<li class="checks_item" data-check><span class="checks_mark" aria-hidden="true" data-check-mark></span><span class="checks_text">${t}</span></li>`).join('\n        ')}
      </ul>
    </div>${after ? `\n    <div class="checks_after text-rich-text" data-reveal="rise">${after}</div>` : ''}`) };
}

/* ---------- a numbered index: one row per reason, the numeral slides in from further out ---------- */
export function index({ name = 'Who It Is For', tagline: tg, title, intro, items = [], after, id }) {
  return { cls: 'section_index', name, id, html: wrap(`    <div class="index_head">
      <div class="index_title">
        ${tagline(tg)}
        <h2 class="index_heading" data-split>${title}</h2>
      </div>
      ${intro ? `<div class="index_intro text-rich-text" data-reveal="rise">${intro}</div>` : ''}
    </div>
    <div class="index_list" data-scene="index">
      ${items.map((it, i) => `<article class="index_item" data-index-row>
        <span class="index_number" data-index-number>${num(i)}</span>
        <h3 class="index_name" data-index-part>${it.title}</h3>
        <div class="index_body" data-index-part>${rich(it.body, 'index_text', it.more)}</div>
      </article>`).join('\n      ')}
    </div>${after ? `\n    <div class="index_after text-rich-text" data-reveal="rise">${after}</div>` : ''}`) };
}

/* ---------- the specialist: Dr. Meskin, set in type (his portraits stay on his own page and the home) ---------- */
export function specialist({ name = 'The Specialist', tagline: tg = 'Your Implant Specialist', title, lead, body, credentials = [], recognition = [], image, link = { href: '/dr-alan-meskin', label: "Read Dr. Meskin's story →" } }) {
  const creds = credentials.length ? `<dl class="credentials_list">${credentials.map(([t, v]) => `<div class="credentials_item"><dt class="credentials_term">${t}</dt><dd class="credentials_value">${v}</dd></div>`).join('')}</dl>` : '';
  const rec = recognition.length ? `<ul class="specialist_recognition">${recognition.map((r) => `<li class="specialist_note">${r}</li>`).join('')}</ul>` : '';
  return { cls: 'section_specialist', name, html: wrap(`    <div class="specialist_grid" data-name-mark="Meskin" data-scene="specialist">
      <div class="specialist_aside">
        ${image ? `<div class="specialist_portrait" data-reveal="wipe">${img(image, 'specialist_image')}<span class="tag is-bottom-left">Prosthodontist · Implant Specialist</span></div>` : `<p class="specialist_name" data-reveal="rise">Dr. Alan Meskin</p><p class="specialist_role" data-reveal="rise">Prosthodontist and implant specialist · NYU College of Dentistry</p>`}
        ${rec}
      </div>
      <div class="specialist_content">
        ${tagline(tg)}
        <h2 class="specialist_heading" data-split>${title}</h2>
        ${lead ? `<p class="specialist_lead" data-reveal="rise">${lead}</p>` : ''}
        ${rich(body, 'specialist_text')}
        ${creds}
        <a class="button is-link" href="${link.href}" data-reveal="rise">${esc(link.label)}</a>
      </div>
    </div>`) };
}

/* ---------- the path: the steps of treatment; the numeral beside them follows the scroll ---------- */
export function path({ name = 'The Path', tagline: tg = 'Your Treatment Journey', title, intro, steps = [], after, id }) {
  return { cls: 'section_path', name, id, html: wrap(`    <div class="path_grid" data-scene="path">
      <div class="path_aside" data-path-aside>
        ${tagline(tg)}
        <h2 class="path_heading" data-split>${title}</h2>
        ${intro ? `<div class="path_intro text-rich-text" data-reveal="rise">${intro}</div>` : ''}
        <div class="path_counter" aria-hidden="true"><span class="path_current" data-path-current>01</span><span class="path_total">/ ${num(steps.length - 1)}</span></div>
        <div class="path_progress" aria-hidden="true"><span class="path_progress-fill" data-path-fill></span></div>
      </div>
      <ol class="path_steps">
        ${steps.map((s, i) => `<li class="path_step" data-path-step>
          <span class="path_step-number">${num(i)}</span>
          <h3 class="path_step-title">${s.title}</h3>
          ${rich(s.body, 'path_step-text', s.more)}
        </li>`).join('\n        ')}
      </ol>
    </div>${after ? `\n    <div class="path_after text-rich-text" data-reveal="rise">${after}</div>` : ''}`) };
}

/* ---------- the timeline: stages along a gold line the scroll draws ---------- */
export function timeline({ name = 'Recovery', tagline: tg, title, intro, subtitle, stages = [], after, id }) {
  return { cls: 'section_timeline', name, id, html: wrap(`    <div class="timeline_head">
      <div class="timeline_title">
        ${tagline(tg)}
        <h2 class="timeline_heading" data-split>${title}</h2>
      </div>
      ${intro ? `<div class="timeline_intro text-rich-text" data-reveal="rise">${intro}</div>` : ''}
    </div>
    ${subtitle ? `<h3 class="timeline_subtitle" data-reveal="rise">${subtitle}</h3>` : ''}
    <ol class="timeline_list${stages.length > 5 ? ' is-six' : ''}" data-scene="timeline">
      <li class="timeline_rule" aria-hidden="true"><span class="timeline_rule-fill" data-timeline-fill></span></li>
      ${stages.map((s) => `<li class="timeline_item" data-timeline-item>
        <span class="timeline_dot" aria-hidden="true" data-timeline-dot></span>
        <h4 class="timeline_when">${s.when}</h4>
        ${s.text ? `<p class="timeline_text">${s.text}</p>` : ''}
      </li>`).join('\n      ')}
    </ol>${after ? `\n    <div class="timeline_after text-rich-text" data-reveal="rise">${after}</div>` : ''}`) };
}

/* ---------- options: tall numbered cards, then a second row of plain notes ---------- */
export function cards({ name = 'The Options', tagline: tg, title, intro, items = [], sub = [], subTitle, action, id, columns }) {
  const n = columns || (items.length % 3 === 0 && items.length !== 6 ? 3 : items.length >= 4 ? 4 : items.length);
  return { cls: 'section_cards', name, id, html: wrap(`    <div class="cards_head">
      <div class="cards_title">
        ${tagline(tg)}
        <h2 class="cards_heading" data-split>${title}</h2>
      </div>
      ${intro ? `<div class="cards_intro text-rich-text" data-reveal="rise">${intro}</div>` : ''}
    </div>
    <div class="cards_list is-${n}" data-scene="cards">
      ${items.map((c, i) => `<article class="cards_item" data-card>
        <span class="cards_number">${num(i)}</span>
        ${c.image ? `<div class="cards_photo">${img(c.image, 'cards_image')}</div>` : ''}
        <h3 class="cards_name">${c.title}</h3>
        ${rich(c.text, 'cards_text', c.more)}
        ${c.href ? `<a class="button is-link cards_link" href="${c.href}">${esc(c.label || 'Learn more →')}</a>` : ''}
      </article>`).join('\n      ')}
    </div>
    ${sub.length ? `${subTitle ? `<h3 class="cards_subtitle" data-reveal="rise">${subTitle}</h3>` : ''}<div class="cards_notes" data-reveal="stagger">${sub.map((s) => `<div class="cards_note"><h4 class="cards_note-title">${s.title}</h4><p class="cards_note-text">${s.text}</p></div>`).join('')}</div>` : ''}
    ${action ? `<div class="cards_action" data-reveal="rise">${actions([action])}</div>` : ''}`) };
}

/* ---------- a comparison: our column on a white card, the other in grey, row by row ---------- */
export function compare({ name = 'The Comparison', tagline: tg, title, intro, columns, rows = [], action, id }) {
  const [a, b] = columns;
  return { cls: 'section_compare', name, id, html: wrap(`    <div class="compare_head">
      <div class="compare_title">
        ${tagline(tg)}
        <h2 class="compare_heading" data-split>${title}</h2>
      </div>
      ${intro ? `<div class="compare_intro text-rich-text" data-reveal="rise">${intro}</div>` : ''}
    </div>
    <div class="compare_table" role="table" aria-label="${esc(String(title).replace(/<[^>]+>/g, ''))}" data-scene="compare">
      <div class="compare_row is-head" role="row"><span class="compare_label" role="columnheader"></span><span class="compare_cell is-head is-ours" role="columnheader">${a}</span><span class="compare_cell is-head" role="columnheader">${b}</span></div>
      ${rows.map(([l, x, y]) => `<div class="compare_row" role="row" data-compare-row><span class="compare_label" role="rowheader">${l}</span><span class="compare_cell is-ours" role="cell"><span class="compare_mobile-label">${a}</span>${x}</span><span class="compare_cell" role="cell"><span class="compare_mobile-label">${b}</span>${y}</span></div>`).join('\n      ')}
    </div>
    ${action ? `<div class="compare_action" data-reveal="rise">${actions([action])}</div>` : ''}`) };
}

/* ---------- patient films: posters that open the film with sound ---------- */
export const FILMS = {
  isaac: { title: "Isaac's story", meta: 'A patient film · 1:42', src: '/media/video/isaac-story.mp4', poster: { src: 'film-isaac.webp', w: 1280, h: 720, alt: 'Isaac, a patient of the practice, in his story film' } },
  daniel: { title: "Daniel's story", meta: 'A patient film', src: '/media/video/daniel-story.mp4', poster: { src: 'film-daniel.webp', w: 1280, h: 720, alt: 'Daniel, a patient of the practice, in his story film' } },
};
export function films({ name = 'The Proof', tagline: tg = 'Real Patients, Real Stories', title, intro, list = ['isaac', 'daniel'], link = { href: '/patient-testimonials', label: 'View all testimonials →' }, id }) {
  return { cls: 'section_films', name, id, html: wrap(`    <div class="films_head">
      <div class="films_title">
        ${tagline(tg)}
        <h2 class="films_heading" data-split>${title}</h2>
      </div>
      ${intro ? `<p class="films_intro" data-reveal="rise">${intro}</p>` : ''}
    </div>
    <div class="films_list" data-scene="films">
      ${list.map((k, i) => { const f = FILMS[k]; return `<a class="films_card${i % 2 ? ' is-offset' : ''}" href="${f.src}" data-film="${esc(f.title)}" aria-label="Watch ${esc(f.title)}, with sound">
        <span class="films_frame" data-reveal="wipe">${img(f.poster, 'films_image')}</span>
        <span class="films_play" aria-hidden="true"><span class="films_play-icon"></span></span>
        <span class="films_caption"><span class="films_name">${esc(f.title)}</span><span class="films_meta">${esc(f.meta)}</span></span>
      </a>`; }).join('\n      ')}
    </div>
    ${link ? `<a class="button is-link films_link" href="${link.href}" data-reveal="rise">${esc(link.label)}</a>` : ''}`) };
}

/* ---------- financing: the four lenders the practice works with ---------- */
export const LENDERS = {
  cherry: { name: 'Cherry Payment Plans', logo: { src: 'logo-cherry.webp', w: 480, h: 133, alt: 'Cherry' } },
  hfd: { name: 'Healthcare Finance Direct', logo: { src: 'logo-hfd.svg', w: 480, h: 160, alt: 'Healthcare Finance Direct' } },
  proceed: { name: 'Proceed Finance', logo: { src: 'logo-proceed.webp', w: 480, h: 112, alt: 'Proceed Finance' } },
  carecredit: { name: 'CareCredit', logo: { src: 'logo-carecredit.webp', w: 480, h: 62, alt: 'CareCredit' } },
};
export function financing({ name = 'Financing', tagline: tg = 'Smile Now, Pay Later', title, intro, lenders = [], action, id }) {
  return { cls: 'section_financing', name, id, html: wrap(`    <div class="financing_head">
      <div class="financing_title">
        ${tagline(tg)}
        <h2 class="financing_heading" data-split>${title}</h2>
      </div>
      ${intro ? `<div class="financing_intro text-rich-text" data-reveal="rise">${intro}</div>` : ''}
    </div>
    <div class="financing_list" data-scene="financing">
      ${lenders.map((l) => { const L = LENDERS[l.key] || {}; return `<article class="financing_card">
        <div class="financing_logo-frame">${L.logo ? img(L.logo, 'financing_logo') : ''}</div>
        <h3 class="financing_name">${l.title || L.name}</h3>
        <p class="financing_text">${l.text}</p>
        ${l.features && l.features.length ? `<ul class="financing_features">${l.features.map((f) => `<li class="financing_feature">${f}</li>`).join('')}</ul>` : ''}
      </article>`; }).join('\n      ')}
    </div>
    ${action ? `<div class="financing_action" data-reveal="rise">${actions([action])}</div>` : ''}`) };
}

/* ---------- questions: one answer open at a time ---------- */
export function faq({ name = 'Questions', tagline: tg = 'Common Questions', title = 'Frequently Asked Questions', intro, items = [], link = { href: '#consultation', label: 'Ask us your questions →' }, id = 'faq' }) {
  return { cls: 'section_faq', name, id, html: wrap(`    <div class="faq_grid">
      <div class="faq_side">
        ${tagline(tg)}
        <h2 class="faq_heading is-page" data-split>${title}</h2>
        ${intro ? `<p class="faq_text" data-reveal="rise">${intro}</p>` : ''}
        ${link ? `<a class="button is-link faq_link" href="${link.href}">${esc(link.label)}</a>` : ''}
      </div>
      <div class="faq_list" data-faq>
        ${items.map(([q, a], i) => `<details class="faq_item${i === items.length - 1 ? ' is-last' : ''}"${i === 0 ? ' open' : ''}>
          <summary class="faq_question">${q}</summary>
          <div class="faq_answer text-rich-text">${/^\s*</.test(a) ? a : `<p>${a}</p>`}</div>
        </details>`).join('\n        ')}
      </div>
    </div>`) };
}

/* ---------- the conversation: the consultation survey (never pinned, never faded, never moved) ---------- */
export function consult({ name = 'The Invitation', tagline: tg = 'It Starts With A Conversation', title = 'Experience Exceptional Dental Care', text, reasons = true, cardTitle = 'Tell us what you want to change', embedKey = 'ghl-survey', snippet = SURVEY, id = 'consult' }) {
  const rs = reasons === true ? [['No pressure.', 'Start by getting answers.'], ['No guessing.', 'Your treatment is based on your actual needs.'], ['No one-size-fits-all.', 'The plan is personalized to you.']] : reasons || [];
  return { cls: 'section_consultation', name, id, ground: 'sage', html: wrap(`    <div class="consultation_grid">
      <div class="consultation_content">
        ${tagline(tg)}
        <h2 class="consultation_heading is-page" data-light>${title}</h2>
        ${text ? `<p class="consultation_text" data-reveal="rise">${text}</p>` : ''}
        ${rs.length ? `<div class="consultation_reasons" data-reveal="stagger">${rs.map(([b, s]) => `<div class="consultation_reason"><span class="consultation_reason-title">${b}</span><span class="consultation_reason-text">${s}</span></div>`).join('')}</div>` : ''}
        <div class="consultation_contact" data-reveal="rise">
          <a class="consultation_phone" href="${tel}">${FACTS.phone}</a>
          <span class="consultation_address">${esc(FACTS.street)}, ${FACTS.city}, ${FACTS.region} ${FACTS.zip}</span>
        </div>
      </div>
      <div class="consultation_card" id="consultation" data-form>
        <h3 class="consultation_card-title">${cardTitle}</h3>
        <div class="wz-embed consultation_embed" data-wz-embed="auto" data-embed="${embedKey}">${snippet}</div>
      </div>
    </div>`) };
}

/* ---------- a photograph and its copy, side by side; the photograph bleeds to the window edge ---------- */
export function split({ name, tagline: tg, title, lead, body, more, image, reverse = false, list, action, id, quote }) {
  return { cls: 'section_split', name, id, html: wrap(`    <div class="split_grid${reverse ? ' is-reverse' : ''}">
      <div class="split_photo${reverse ? ' is-reverse' : ''}" data-reveal="wipe" data-parallax>${img(image, 'split_image')}${quote ? `<p class="split_caption">${quote}</p>` : ''}</div>
      <div class="split_content${reverse ? ' is-reverse' : ''}">
        ${tagline(tg)}
        <h2 class="split_heading" data-split>${title}</h2>
        ${lead ? `<p class="split_lead" data-reveal="rise">${lead}</p>` : ''}
        ${rich(body, 'split_text', more)}
        ${list ? `<ul class="split_list" data-reveal="stagger">${list.map((x) => `<li class="split_list-item">${x}</li>`).join('')}</ul>` : ''}
        ${action ? actions([action], 'split_actions') : ''}
      </div>
    </div>`) };
}

/* ---------- features: a grid of short titled notes (why choose us, what to expect) ---------- */
export function features({ name, tagline: tg, title, intro, items = [], image, id, action }) {
  return { cls: 'section_features', name, id, html: wrap(`    <div class="features_head">
      <div class="features_title">
        ${tagline(tg)}
        <h2 class="features_heading" data-split>${title}</h2>
      </div>
      ${intro ? `<div class="features_intro text-rich-text" data-reveal="rise">${intro}</div>` : ''}
    </div>
    ${image ? `<div class="features_photo" data-reveal="wipe" data-parallax>${img(image, 'features_image')}</div>` : ''}
    <div class="features_list${items.length === 2 || items.length === 4 ? ' is-2' : ''}" data-reveal="stagger">
      ${items.map((f) => `<div class="features_item"><h3 class="features_name">${f.title}</h3>${f.text ? `<div class="features_text text-rich-text">${/^\s*</.test(f.text) ? f.text : `<p>${f.text}</p>`}</div>` : ''}</div>`).join('\n      ')}
    </div>
    ${action ? `<div class="features_action" data-reveal="rise">${actions([action])}</div>` : ''}`) };
}

/* ---------- long text: legal pages and articles ---------- */
export function prose({ name = 'The Text', tagline: tg, title, body, aside, id, intro }) {
  return { cls: 'section_prose', name, id, html: wrap(`    <div class="prose_grid${aside ? '' : ' is-single'}">
      ${aside ? `<aside class="prose_aside">${aside}</aside>` : ''}
      <div class="prose_main${aside ? '' : ' is-single'}">
        ${tg ? tagline(tg) : ''}
        ${title ? `<h2 class="prose_heading" data-split>${title}</h2>` : ''}
        ${intro ? `<p class="prose_intro">${intro}</p>` : ''}
        <div class="prose_body text-rich-text">${body}</div>
      </div>
    </div>`) };
}

/* ---------- the doctors ---------- */
export const DOCTORS = {
  meskin: { name: 'Dr. Alan Meskin', role: 'Prosthodontist and Implant Specialist', school: 'NYU College of Dentistry', href: '/dr-alan-meskin', image: { src: 'team-meskin.webp', w: 900, h: 1100, alt: 'Dr. Alan Meskin, prosthodontist' } },
  lee: { name: 'Dr. Won-Sang Lee, DDS', role: 'Oral Surgeon', school: 'Columbia University', href: '/dr-won-sang-lee-dds', image: { src: 'team-lee-v2.webp', w: 900, h: 1100, alt: 'Dr. Won-Sang Lee, oral surgeon' } },
  srour: { name: 'Dr. Maurice Srour, DDS', role: 'Oral Surgeon, Full Arch', school: 'NYU / Bellevue', href: '/dr-maurice-srour-dds', image: { src: 'team-srour-v2.webp', w: 900, h: 1100, alt: 'Dr. Maurice Srour, oral surgeon' } },
  klass: { name: 'Dr. Dmitriy Klass, DDS, MSD', role: 'Periodontist', school: 'Boston University', href: '/dr-dmitriy-klass-dds-msd', image: { src: 'team-klass-v2.webp', w: 900, h: 1100, alt: 'Dr. Dmitriy Klass, periodontist' } },
};
export function team({ name = 'The People', tagline: tg, title, intro, list = ['meskin', 'lee', 'srour', 'klass'], id, photos = true }) {
  return { cls: 'section_team', name, id, html: wrap(`    <div class="team_head">
      <div class="team_title">
        ${tagline(tg)}
        <h2 class="team_heading" data-split>${title}</h2>
      </div>
      ${intro ? `<div class="team_intro text-rich-text" data-reveal="rise">${intro}</div>` : ''}
    </div>
    <div class="team_list${photos ? (list.length === 3 ? ' is-3' : '') : ' is-text'}" data-scene="team">
      ${list.map((k) => { const d = DOCTORS[k]; return `<a class="team_card" href="${d.href}">
        ${photos ? `<span class="team_frame">${img(d.image, 'team_image')}</span>` : ''}
        <span class="team_name">${esc(d.name)}</span>
        <span class="team_role">${esc(d.role)} · ${esc(d.school)}</span>
      </a>`; }).join('\n      ')}
    </div>`) };
}

/* ---------- reviews: the live Google feed ---------- */
export function reviews({ name = 'In Their Words', tagline: tg = 'Patient Reviews', title = 'In their own words.', intro, embedKey = 'google-reviews', id = 'reviews' }) {
  return { cls: 'section_reviews', name, id, html: wrap(`    <div class="reviews_head">
      ${tagline(tg)}
      <h2 class="reviews_heading" data-split>${title}</h2>
      ${intro ? `<p class="reviews_intro" data-reveal="rise">${intro}</p>` : ''}
    </div>
    <div class="wz-embed reviews_embed" data-wz-embed="auto" data-embed="${embedKey}">${REVIEWS}</div>`) };
}

/* ---------- before and after cases, dragged or wiped ---------- */
export function cases({ name = 'The Results', tagline: tg, title, intro, list = [], note = 'Every case is different; individual results vary.', id }) {
  return { cls: 'section_cases', name, id, html: wrap(`    <div class="cases_head">
      <div class="cases_title">
        ${tagline(tg)}
        <h2 class="cases_heading" data-split>${title}</h2>
      </div>
      ${intro ? `<div class="cases_intro text-rich-text" data-reveal="rise">${intro}</div>` : ''}
    </div>
    <div class="cases_list">
      ${list.map((c, i) => `<figure class="cases_item${i % 3 === 1 ? ' is-offset' : ''}">
        <div class="case_component is-draggable" data-case>
          ${img(c.before, 'case_image')}
          <div class="case_after" data-case-after>${img(c.after, 'case_image')}</div>
          <span class="case_line" aria-hidden="true" data-case-line></span>
          <span class="tag is-bottom-left">${esc(c.tag || 'Before / After')}</span>
        </div>
        ${c.caption ? `<figcaption class="cases_caption">${c.caption}</figcaption>` : ''}
      </figure>`).join('\n      ')}
    </div>
    ${note ? `<p class="cases_note">${note}</p>` : ''}`) };
}

/* ---------- a wall of photographs, set at their own sizes ---------- */
export function photos({ name = 'The Rooms', tagline: tg, title, intro, list = [], id }) {
  return { cls: 'section_photos', name, id, html: wrap(`    <div class="photos_head">
      ${tagline(tg)}
      <h2 class="photos_heading" data-split>${title}</h2>
      ${intro ? `<p class="photos_intro" data-reveal="rise">${intro}</p>` : ''}
    </div>
    <div class="photos_grid">
      ${list.map((m, i) => `<figure class="photos_item is-${['tall', 'wide', 'square', 'square', 'wide', 'tall'][i % 6]}" data-reveal="wipe">${img(m, 'photos_image')}${m.caption ? `<figcaption class="photos_caption">${m.caption}</figcaption>` : ''}</figure>`).join('\n      ')}
    </div>`) };
}

/* ---------- links to other pages, as photographed cards ---------- */
export function links({ name, tagline: tg, title, intro, items = [], id, columns = 3 }) {
  return { cls: 'section_links', name, id, html: wrap(`    <div class="links_head">
      <div class="links_title">
        ${tagline(tg)}
        <h2 class="links_heading" data-split>${title}</h2>
      </div>
      ${intro ? `<div class="links_intro text-rich-text" data-reveal="rise">${intro}</div>` : ''}
    </div>
    <div class="links_list is-${columns}" data-reveal="stagger">
      ${items.map((l) => `<a class="links_card" href="${l.href}">
        ${l.image ? `<span class="links_frame">${img(l.image, 'links_image')}</span>` : ''}
        <span class="links_name">${l.title}</span>
        ${l.text ? `<span class="links_text">${l.text}</span>` : ''}
        <span class="links_more">${esc(l.label || 'Learn more')} →</span>
      </a>`).join('\n      ')}
    </div>`) };
}

/* ---------- a quote, large ---------- */
export function quote({ name = 'A Patient', text, cite, image, id }) {
  return { cls: 'section_quote', name, id, html: wrap(`    <figure class="quote_grid${image ? '' : ' is-text'}" data-scene="quote">
      ${image ? `<div class="quote_photo" data-reveal="wipe" data-parallax>${img(image, 'quote_image')}</div>` : ''}
      <blockquote class="quote_text${image ? '' : ' is-text'}" data-words>${text}</blockquote>
      ${cite ? `<figcaption class="quote_cite${image ? '' : ' is-text'}" data-reveal="rise">${cite}</figcaption>` : ''}
    </figure>`) };
}

/* ---------- numbers ---------- */
export function numbers({ name = 'In Numbers', tagline: tg, title, items = [], id }) {
  return { cls: 'section_numbers', name, id, html: wrap(`    ${title ? `<div class="numbers_head">${tagline(tg)}<h2 class="numbers_heading" data-split>${title}</h2></div>` : ''}
    <div class="stats_component${items.length === 3 ? ' is-three' : ''}" data-stats>
      ${items.map((s) => `<div class="stats_item" data-stat><strong class="stats_number" data-count="${s.count}"${s.decimals ? ` data-decimals="${s.decimals}"` : ''}${s.suffix ? ` data-suffix="${esc(s.suffix)}"` : ''}>${s.value}</strong><span class="stats_label">${s.label}</span></div>`).join('\n      ')}
    </div>`, 'padding-section-medium') };
}

/* ---------- articles: the blog index ---------- */
export function articles({ name = 'The Articles', tagline: tg, title, intro, posts = [], id }) {
  return { cls: 'section_articles', name, id, html: wrap(`    <div class="articles_head">
      ${tagline(tg)}
      ${title ? `<h2 class="articles_heading" data-split>${title}</h2>` : ''}
      ${intro ? `<p class="articles_intro" data-reveal="rise">${intro}</p>` : ''}
    </div>
    <div class="articles_list" data-reveal="stagger">
      ${posts.map((a, i) => `<a class="articles_card${i === 0 && posts.length % 3 === 2 ? ' is-lead' : ''}" href="${a.href}">
        <span class="articles_frame">${img(a.image, 'articles_image')}</span>
        <span class="articles_meta">${esc(a.meta || '')}</span>
        <span class="articles_name">${a.title}</span>
        ${a.text ? `<span class="articles_text">${a.text}</span>` : ''}
        <span class="articles_more">Read the article →</span>
      </a>`).join('\n      ')}
    </div>`) };
}

/* ---------- a closing call when the page carries no form ---------- */
export function cta({ name = 'The Invitation', tagline: tg = 'Imagine The Everyday Things', title, text, image, acts = [{ label: 'Schedule Your Consultation', href: '/contact#consultation' }, CALL] }) {
  return { cls: 'section_cta', name, html: wrap(`    <div class="cta_grid${image ? '' : ' is-text'}">
      <div class="cta_content${image ? '' : ' is-text'}">
        ${tagline(tg)}
        <h2 class="cta_heading" data-light>${title}</h2>
        ${text ? `<p class="cta_text" data-reveal="rise">${text}</p>` : ''}
        ${actions(acts)}
      </div>
      ${image ? `<div class="cta_photo" data-reveal="wipe" data-parallax>${img(image, 'cta_image')}</div>` : ''}
    </div>`) };
}

/* ---------- visit: where, when, how to reach the office, beside a form ---------- */
export function visit({ name = 'The Visit', tagline: tg = 'Visit Us', title, details = [], acts = [], cardTitle, snippet, embedKey, id = 'visit' }) {
  return { cls: 'section_visit', name, id, html: wrap(`    <div class="visit_grid">
      <div class="visit_details">
        ${tagline(tg)}
        <h2 class="visit_heading" data-split>${title}</h2>
        <dl class="visit_list" data-reveal="stagger">${details.map(([t, v]) => `<div class="visit_item"><dt class="visit_term">${t}</dt><dd class="visit_value">${v}</dd></div>`).join('')}</dl>
        ${actions(acts, 'visit_actions')}
      </div>
      <div class="consultation_card" id="consultation" data-form>
        <h3 class="consultation_card-title">${cardTitle}</h3>
        <div class="wz-embed consultation_embed" data-wz-embed="auto" data-embed="${embedKey}">${snippet}</div>
      </div>
    </div>`) };
}

/* ---------- the map, wide (an Embed block on the published page) ---------- */
export function map({ name = 'The Map', embedKey = 'google-map', id = 'map' }) {
  return { cls: 'section_map', name, id, html: `  <div class="map_frame">
    <div class="wz-embed map_embed" data-wz-embed="auto" data-embed="${embedKey}">${MAP}</div>
  </div>` };
}

/* ---------- raw: a chapter whose markup a page writes itself ---------- */
export const raw = ({ cls, name, html, id, ground }) => ({ cls, name, id, ground, html: wrap(html) });

export { words, tagline, actions, wrap, num };
