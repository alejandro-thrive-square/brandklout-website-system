/* ==========================================================================
   BLOCKS — every interior chapter is one of these. A page module lists its
   chapters in order; build.mjs numbers them (data-chapter) and names them
   (data-chapter-name) so the nav readout, the reading progress and the
   journey audit see the same spine the homepage has.

   Markup rules learned the hard way (21-instatic-upload.md):
   - a <button> loses its children on import (trap 15): buttons carry text only,
     or are rebuilt by 90-boot.js (.btn, .faq-q, .burger)
   - an <input> keeps `type` and little else (trap 22): forms are prototypes
   - inline siblings collapse their whitespace (trap 23): flex + gap, never a
     space between two inline elements
   - <video> is restored by push-site.mjs from the payload (trap 35) — one src
     attribute in data-src, hydrated by 90-boot.js
   - no inline `style` on anything that must survive; JS sets what it needs
   ========================================================================== */
import { SITE, PATIENTS, filmHref } from './site.mjs'

const tag = (t) => (t ? `<div class="text-style-tagline"><i></i><span>${t}</span></div>` : '')
/* m.pos = the photo's focal point as 'x% y%' — a class, not an inline style (css/45-focal.css, 08-qa image review) */
const fp = (m) => (m && m.pos ? 'object-position-' + m.pos.split(/\s+/).map((v) => Math.round(parseFloat(v) / 10) * 10).join('-') : '')
const img = (m, cls = '', extra = '') => (m ? `<img${cls || fp(m) ? ` class="${[cls, fp(m)].filter(Boolean).join(' ')}"` : ''} src="${m.src}" alt="${(m.alt || '').replace(/"/g, '&quot;')}" loading="lazy"${extra}>` : '')
const paras = (arr, cls = '') => (arr || []).map((p) => `<p${cls ? ` class="${cls}"` : ''}>${p}</p>`).join('\n')
/* one accordion row: the faq chapter, the invitation's faq, the statement's services list (BugHerd #94) */
const faqItem = (q, a) => `<div class="faq_item"><button class="faq_question" type="button" aria-expanded="false"><span>${q}</span><i></i></button><div class="faq_answer"><p>${a}</p></div></div>`
const action = (a) =>
  a.kind === 'text'
    ? `<a class="arrow-link_component" href="${a.href}"${a.ext ? ' target="_blank" rel="noopener"' : ''}>${a.label} <span class="arrow_icon">&rarr;</span></a>`
    : `<a class="button${a.kind === 'ghost' ? ' is-secondary' : a.kind === 'gold' ? ' is-primary' : ''} is-magnetic" href="${a.href}"${a.ext ? ' target="_blank" rel="noopener"' : ''}><span>${a.label}</span></a>`

/* ---------- 00 cover ---------- */
export function cover(b) {
  const meta = b.meta ? `<ul class="cover_meta" aria-label="At a glance">${b.meta.map((m) => `<li data-anim="hide"><b>${m.b}</b><span>${m.span}</span></li>`).join('')}</ul>` : ''
  const actions = b.actions ? `<div class="cover_actions" data-anim="hide">${b.actions.map(action).join('')}</div>` : ''
  const copy = `<div class="cover_content">
      ${b.kicker ? `<div class="text-style-tagline" data-anim="hide"><i></i><span>${b.kicker}</span></div>` : ''}
      <h1 class="heading-style-display cover_title${b.small ? ' is-small' : ''}" data-anim="hide">${b.title}</h1>
      ${b.lead ? `<p class="text-style-lead cover_lead" data-anim="hide">${b.lead}</p>` : ''}
      ${actions}
    </div>`
  if (b.layout === 'bleed') {
    const media = b.video
      ? `<video class="cover_film" poster="${b.video.poster}" muted loop playsinline preload="metadata" data-src="${b.video.src}"${b.video.srcMobile ? ` data-src-mobile="${b.video.srcMobile}"` : ''} aria-label="${(b.video.label || '').replace(/"/g, '&quot;')}"></video>`
      : img(b.image, 'cover_film')
    return `<section class="section_cover is-full-bleed${b.tone ? ' cv-' + b.tone : ''}" id="${b.id || 'arrival'}">
  <div class="cover_background">${media}<div class="cover_veil"></div></div>
  <div class="container-xlarge cover_grid is-full-bleed-grid">${copy}${meta}</div>
  <div class="cover_scroll-cue" data-anim="hide"><span>Scroll</span><i></i></div>
</section>`
  }
  return `<section class="section_cover is-split" id="${b.id || 'arrival'}">
  <div class="container-xlarge cover_grid">
    ${copy}
    <figure class="media-frame_component cover_image-wrapper" data-wipe>${img(b.image, [b.image.still ? '' : 'parallax_image', b.image.pos ? 'cover_image' : ''].filter(Boolean).join(' '))}${b.image.caption ? `<figcaption>${b.image.caption}</figcaption>` : ''}</figure>
    ${meta}
  </div>
</section>`
}

/* ---------- statement: pinned, the words are written by scroll ---------- */
export function statement(b) {
  /* services beside the statement (BugHerd #38, /dental-implants): [href, label] pairs, the current page marked;
     or (BugHerd #94, /general-dentistry) `items`: [{ title, text }] as an accordion list */
  const services = !b.services
    ? ''
    : b.services.items
      ? `<div class="statement_services"><span class="statement_services-label">${b.services.label}</span><div class="faq_list">${b.services.items.map((it) => faqItem(it.title, it.text)).join('')}</div></div>`
      : `<nav class="statement_services" aria-label="${b.services.label}"><span class="statement_services-label">${b.services.label}</span>${b.services.links.map(([href, label]) => `<a href="${href}.html"${href === b.services.current ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>`
  return `<section class="section_statement${b.theme ? ' st-' + b.theme : ''}" id="${b.id || 'statement'}"${b.services ? ' data-st-services' : ''}>
  ${b.image ? `<div class="statement_background" aria-hidden="true">${img({ src: b.image.src, alt: '' }, 'statement_image')}</div>` : ''}
  <div class="container-large statement_stage">
    ${tag(b.tag)}
    <p class="statement_text text-style-serif">${b.text.replace(/ (\S+)$/, '&nbsp;$1')}</p>
    <div class="statement_after">${paras(b.after)}${b.figure ? `<div class="statement_figure"><b data-count="${b.figure.value}"${b.figure.suffix ? ` data-suffix="${b.figure.suffix}"` : ''}>0</b><span>${b.figure.label}</span></div>` : ''}</div>
    ${services}
  </div>
</section>`
}

/* ---------- steps: pinned vertical stepper ---------- */
export function steps(b) {
  const items = b.steps.map((s, i) => `<li class="steps_step${i === 0 ? ' is-first' : ''}"><span class="steps_step-label">Step ${String(i + 1).padStart(2, '0')}</span><h3 class="heading-style-h3">${s.title}</h3><p>${s.text}</p></li>`).join('\n')
  const dots = b.steps.map((_, i) => `<i${i === 0 ? ' class="is-on"' : ''}></i>`).join('')
  return `<section class="section_steps" id="${b.id || 'steps'}">
  <div class="steps_pin">
    <div class="container-large steps_grid">
      <div class="steps_head">
        ${tag(b.tag)}
        <h2 class="heading-style-h2">${b.title}</h2>
        ${b.intro ? `<p class="text-style-lead">${b.intro}</p>` : ''}
        <div class="steps_counter" aria-hidden="true"><b class="steps_counter-number text-style-serif">01</b><span class="steps_counter-total">of ${String(b.steps.length).padStart(2, '0')}</span><i class="steps_counter-line"><b></b></i></div>
      </div>
      <div class="steps_stage">
        <ol class="steps_list">
          ${items}
        </ol>
        <div class="steps_dots" aria-hidden="true">${dots}</div>
        ${b.image ? `<figure class="media-frame_component steps_image-wrapper" data-wipe>${img(b.image, 'parallax_image')}</figure>` : ''}
      </div>
    </div>
  </div>
</section>`
}

/* ---------- compare: pinned, the columns light one at a time ---------- */
export function compare(b) {
  const cols = b.columns
    .map(
      (c, i) => `<div class="compare_column${c.hot ? ' is-hot' : ''}"><div class="compare_column-head"><span class="text-style-number">${String(i + 1).padStart(2, '0')}</span><h3 class="heading-style-h3">${c.title}</h3>${c.sub ? `<p class="text-size-small">${c.sub}</p>` : ''}</div><ul>${c.rows.map((r) => `<li>${r}</li>`).join('')}</ul>${c.href ? `<a class="arrow-link_component" href="${c.href}">${c.cta || 'Read more'} <span class="arrow_icon">&rarr;</span></a>` : ''}</div>`,
    )
    .join('\n      ')
  return `<section class="section_compare" id="${b.id || 'compare'}">
  <div class="compare_pin">
    <div class="container-large compare_content">
      <div class="compare_head">
        <div>${tag(b.tag)}<h2 class="heading-style-h2">${b.title}</h2></div>
        ${b.intro ? `<p class="text-style-lead">${b.intro}</p>` : ''}
      </div>
      <div class="compare_track" aria-hidden="true"><i></i></div>
      <div class="compare_grid">
      ${cols}
      </div>
      ${b.note ? `<p class="text-size-small compare_note">${b.note}</p>` : ''}
    </div>
  </div>
</section>`
}

/* ---------- strip: copy beside a strip of photographs ---------- */
export function strip(b) {
  /* p.still: no parallax overscan on this photo (BugHerd #95) */
  const photos = (b.photos || []).map((p, i) => `<figure class="media-frame_component photo-strip_photo is-photo-${i + 1}" data-wipe>${img(p, p.still ? '' : 'parallax_image')}${p.caption ? `<figcaption>${p.caption}</figcaption>` : ''}</figure>`).join('\n')
  const list = b.list ? `<ul class="photo-strip_list">${b.list.map((l) => `<li><b>${l.b}</b><span>${l.span}</span></li>`).join('')}</ul>` : ''
  return `<section class="section_photo-strip${b.flip ? ' is-flipped' : ''}${b.theme ? ' ph-' + b.theme : ''}" id="${b.id || 'strip'}">
  <div class="container-large photo-strip_grid">
    <div class="photo-strip_content">
      ${tag(b.tag)}
      <h2 class="heading-style-h2">${b.title}</h2>
      ${b.lead ? `<p class="text-style-lead">${b.lead}</p>` : ''}
      <div class="photo-strip_body">${paras(b.body)}</div>
      ${list}
      ${b.actions ? `<div class="photo-strip_actions">${b.actions.map(action).join('')}</div>` : ''}
    </div>
    <div class="photo-strip_photos">${photos}</div>
  </div>
</section>`
}

/* ---------- ledger: pinned, a figure counts while the list is drawn ---------- */
export function ledger(b) {
  const items = b.items.map((it, i) => `<li><span class="text-style-number">${String(i + 1).padStart(2, '0')}</span><b>${it.b}</b><span class="ledger_description">${it.span}</span></li>`).join('\n')
  return `<section class="section_ledger" id="${b.id || 'ledger'}">
  <div class="ledger_pin">
    <div class="container-large ledger_grid">
      <div class="ledger_head">
        ${tag(b.tag)}
        <h2 class="heading-style-h2">${b.title}</h2>
        ${b.lead ? `<p class="text-style-lead">${b.lead}</p>` : ''}
        ${b.figure ? `<div class="ledger_figure"><b class="text-style-serif" data-count="${b.figure.value}"${b.figure.suffix ? ` data-suffix="${b.figure.suffix}"` : ''}>0</b><span>${b.figure.label}</span></div>` : ''}
      </div>
      <ul class="ledger_list">
        ${items}
      </ul>
    </div>
  </div>
</section>`
}

/* ---------- proof: pinned before/after, the slider IS the scroll ---------- */
export function proof(b) {
  const p = b.patient ? PATIENTS[b.patient] : null
  const before = b.before || p.before
  const after = b.after || p.after
  const quote = b.quote || (p && p.quote)
  const who = b.who || (p && p.name)
  const treat = b.treatment || (p && p.treatment)
  const film = b.film || (p && p.film ? { href: filmHref(p.film), label: `Watch ${p.name}’s story` } : null)
  return `<section class="section_before-after" id="${b.id || 'proof'}" data-theme="light">
  <div class="before-after_pin">
    <div class="container-large before-after_grid">
      <div class="before-after_stage" aria-label="Before and after">
        <div class="before-after_before"><img src="${before}" alt="${b.beforeAlt || (who ? who + ' before treatment' : 'Before')}" loading="lazy"><span class="before-after_label">Before</span></div>
        <div class="before-after_after"><img src="${after}" alt="${b.afterAlt || (who ? who + ' after treatment' : 'After')}" loading="lazy"><span class="before-after_label is-after">After</span></div>
        <div class="before-after_handle" aria-hidden="true"><i></i></div>
      </div>
      <div class="before-after_content">
        ${tag(b.tag || 'The Proof')}
        <h2 class="heading-style-h2">${b.title}</h2>
        ${quote ? `<blockquote class="text-style-serif before-after_quote">&ldquo;${quote}&rdquo;</blockquote>` : ''}
        ${who ? `<div class="before-after_patient"><b>${who}</b><span>${treat}</span></div>` : ''}
        ${b.text ? `<p class="text-style-lead">${b.text}</p>` : ''}
        <div class="before-after_actions">${film ? `<a class="arrow-link_component" href="${film.href}" target="_blank" rel="noopener">${film.label} <span class="arrow_icon">&rarr;</span></a>` : ''}<a class="arrow-link_component" href="/results.html">More results <span class="arrow_icon">&rarr;</span></a></div>
      </div>
    </div>
  </div>
</section>`
}

/* ---------- faq ---------- */
export function faq(b) {
  const items = b.items.map((it) => faqItem(it.q, it.a)).join('\n')
  return `<section class="section_faq" id="${b.id || 'questions'}">
  <div class="container-large faq-section_grid">
    <div class="faq-section_head">${tag(b.tag || 'The Questions')}<h2 class="heading-style-h2">${b.title}</h2>${b.lead ? `<p class="text-style-lead">${b.lead}</p>` : ''}</div>
    <div class="faq_list">
      ${items}
    </div>
  </div>
</section>`
}

/* ---------- rail: pinned horizontal journey through cards ---------- */
export function rail(b) {
  const cards = b.cards
    .map(
      (c, i) => `<article class="card-rail_card${c.image ? '' : ' is-text-card'}">${c.image ? `<figure class="media-frame_component is-tall">${img(c.image)}</figure>` : `<div class="card-rail_glyph text-style-serif">${String(i + 1).padStart(2, '0')}</div>`}<div class="card-rail_card-content"><span class="text-style-number">${String(i + 1).padStart(2, '0')}</span><h3 class="heading-style-h3">${c.title}</h3><p>${c.text}</p>${c.href ? `<a class="arrow-link_component" href="${c.href}">${c.cta || 'Learn more'} <span class="arrow_icon">&rarr;</span></a>` : ''}</div></article>`,
    )
    .join('\n')
  return `<section class="section_card-rail" id="${b.id || 'rail'}">
  <div class="card-rail_pin">
    <div class="card-rail_head container-xlarge">
      <div>${tag(b.tag)}<h2 class="heading-style-h2">${b.title}</h2></div>
      <div class="card-rail_progress" aria-hidden="true"><span class="card-rail_count">01 / ${String(b.cards.length).padStart(2, '0')}</span><i><b></b></i></div>
    </div>
    <div class="card-rail_track">
      ${cards}
      <div class="card-rail_end"><p class="heading-style-h3">${b.end?.title || 'Not sure which is right for you?'}</p><a class="button is-magnetic" href="${b.end?.href || '#invitation'}"><span>${b.end?.label || 'Ask Dr. Barriere'}</span></a></div>
    </div>
  </div>
</section>`
}

/* ---------- gallery: interactive before/after grid ---------- */
export function gallery(b) {
  const cards = b.pairs
    .map(
      (p) => `<figure class="gallery_card"><div class="gallery_stage"><img class="gallery_before" src="${p.before}" alt="${p.label} before" loading="lazy"><div class="gallery_after"><img src="${p.after}" alt="${p.label} after" loading="lazy"></div><div class="gallery_handle" aria-hidden="true"></div></div><figcaption><b>${p.label}</b><span>${p.sub || 'Drag or hover to compare'}</span></figcaption></figure>`,
    )
    .join('\n')
  return `<section class="section_gallery" id="${b.id || 'gallery'}" data-theme="light">
  <div class="container-large gallery_head">${tag(b.tag)}<h2 class="heading-style-h2">${b.title}</h2>${b.lead ? `<p class="text-style-lead">${b.lead}</p>` : ''}</div>
  <div class="container-xlarge gallery_grid">
    ${cards}
  </div>
  ${b.note ? `<div class="container-large"><p class="text-size-small gallery_note">${b.note}</p></div>` : ''}
  ${b.actions ? `<div class="container-large gallery_actions">${b.actions.map(action).join('')}</div>` : ''}
</section>`
}

/* ---------- stories: the three patient films ---------- */
export function stories(b) {
  const items = (b.items || ['leslie', 'emily', 'michael']).map((k) => {
    const p = PATIENTS[k]
    const media = p.clip
      ? `<video class="stories_clip" poster="${p.poster}" muted loop playsinline preload="none" data-src-hover="${p.clip}" aria-label="${p.name}, in her own words"></video>`
      : `<img src="${p.poster}" alt="${p.name} after treatment" loading="lazy">`
    return `<article class="stories_card"><a class="media-frame_component is-tall stories_media" href="${filmHref(p.film)}" target="_blank" rel="noopener" aria-label="Watch ${p.name}’s story${p.film.vimeo ? '' : ' on YouTube'}">${media}<span class="video-play_icon" aria-hidden="true"></span></a><blockquote class="text-style-serif">&ldquo;${p.quote}&rdquo;</blockquote><div class="stories_patient"><b>${p.name}</b><span>${p.treatment}</span></div>${b.ba === false ? '' : `<div class="sy-ba"><img src="${p.before}" alt="${p.name} before" loading="lazy"><img src="${p.after}" alt="${p.name} after" loading="lazy"></div>`}</article>`
  }).join('\n')
  return `<section class="section_stories" id="${b.id || 'stories'}">
  <div class="container-large stories_head">${tag(b.tag || 'The Stories')}<h2 class="heading-style-h2">${b.title}</h2>${b.lead ? `<p class="text-style-lead">${b.lead}</p>` : ''}</div>
  <div class="container-large stories_grid">
    ${items}
  </div>
</section>`
}

/* ---------- videos: the film library ---------- */
export function videos(b) {
  const items = b.items
    .map((f) => `<a class="videos_card" href="${filmHref(f)}" target="_blank" rel="noopener"><figure class="media-frame_component is-wide"><img src="/media/img/yt-${f.id}.jpg" alt="" loading="lazy"><span class="video-play_icon" aria-hidden="true"></span></figure><span class="videos_title">${f.title}</span></a>`)
    .join('\n')
  return `<section class="section_videos" id="${b.id || 'films'}">
  <div class="container-large videos_head">${tag(b.tag || 'The Library')}<h2 class="heading-style-h2">${b.title}</h2>${b.lead ? `<p class="text-style-lead">${b.lead}</p>` : ''}</div>
  <div class="container-large videos_grid">
    ${items}
  </div>
</section>`
}

/* ---------- team ---------- */
export function team(b) {
  const people = b.people
    .map((p) => `<article class="team_card"><figure class="team_photo"><img src="${p.image}" alt="${p.name}" loading="lazy"></figure><div class="team_name"><b>${p.name}</b><span>${p.role}</span></div>${p.bio ? `<p class="text-size-small">${p.bio}</p>` : ''}</article>`)
    .join('\n')
  return `<section class="section_team" id="${b.id || 'team'}">
  <div class="container-large team_head">${tag(b.tag || 'The Team')}<h2 class="heading-style-h2">${b.title}</h2>${b.lead ? `<p class="text-style-lead">${b.lead}</p>` : ''}</div>
  <div class="container-large team_grid">
    ${people}
  </div>
</section>`
}

/* ---------- detail: editorial columns ---------- */
export function detail(b) {
  const cols = (b.columns || []).map((c) => `<div class="detail_column"><h3 class="heading-style-h3 is-detail">${c.h}</h3>${paras(c.text)}</div>`).join('\n')
  const list = b.list ? `<ul class="detail_list">${b.list.map((l) => `<li><b>${l.b}</b><span>${l.span}</span></li>`).join('')}</ul>` : ''
  return `<section class="section_detail${b.theme ? ' section-style-' + b.theme : ''}" id="${b.id || 'detail'}">
  <div class="container-large detail_content">
    <div class="detail_head">${tag(b.tag)}<h2 class="heading-style-h2">${b.title}</h2>${b.lead ? `<p class="text-style-lead">${b.lead}</p>` : ''}</div>
    ${b.body ? `<div class="detail_body">${paras(b.body)}</div>` : ''}
    ${cols ? `<div class="detail_columns">${cols}</div>` : ''}
    ${list}
    ${b.actions ? `<div class="detail_actions">${b.actions.map(action).join('')}</div>` : ''}
  </div>
</section>`
}

/* ---------- tabs: panels switched by text-only buttons ---------- */
export function tabs(b) {
  const btns = b.panels.map((p, i) => `<button class="tabs_button${i === 0 ? ' is-on' : ''}" type="button">${p.label}</button>`).join('')
  const panels = b.panels
    .map((p, i) => `<div class="tabs_panel${i === 0 ? ' is-on' : ''}"><h3 class="heading-style-h3">${p.title}</h3>${(p.sections || []).map((s) => `<div class="tabs_row"><b>${s.h}</b>${paras(s.text)}</div>`).join('')}</div>`)
    .join('\n')
  return `<section class="section_tabs" id="${b.id || 'instructions'}">
  <div class="container-large tabs_content">
    <div class="tabs_head">${tag(b.tag)}<h2 class="heading-style-h2">${b.title}</h2>${b.lead ? `<p class="text-style-lead">${b.lead}</p>` : ''}</div>
    <div class="tabs_menu">${btns}</div>
    <div class="tabs_panels">
      ${panels}
    </div>
    ${b.note ? `<p class="text-size-small tabs_note">${b.note}</p>` : ''}
  </div>
</section>`
}

/* ---------- contact card: address, hours, directions — no iframe (trap: Instatic forbids non-YouTube iframes) ---------- */
export function contactcard(b) {
  return `<section class="section_location" id="${b.id || 'place'}">
  <div class="container-large location_grid">
    <figure class="media-frame_component location_photo" data-wipe>${img(b.image, 'parallax_image')}</figure>
    <div class="location_content">
      ${tag(b.tag || 'The Place')}
      <h2 class="heading-style-h2">${b.title}</h2>
      <ul class="location_list">
        <li><b>Address</b><a href="${SITE.mapHref}" target="_blank" rel="noopener">${SITE.address1}<br>${SITE.address2}</a></li>
        <li><b>New patients</b><a href="${SITE.phoneNewHref}">${SITE.phoneNew}</a></li>
        <li><b>Current patients</b><a href="${SITE.phoneCurrentHref}">${SITE.phoneCurrent}</a></li>
        <li><b>Hours</b><span>Monday to Friday, 9:00am to 5:00pm<br>Saturday and Sunday closed<br>Same-day emergency visits</span></li>
        <li><b>Book online</b><a href="${SITE.zocdoc}" target="_blank" rel="noopener">Choose a time on Zocdoc</a></li>
      </ul>
      ${paras(b.body)}
      <div class="location_actions"><a class="button is-magnetic" href="${SITE.mapHref}" target="_blank" rel="noopener"><span>Directions</span></a><a class="arrow-link_component" href="#invitation">Send a request <span class="arrow_icon">&rarr;</span></a></div>
    </div>
  </div>
</section>`
}

/* ---------- prose: a journal entry ---------- */
export function prose(b) {
  return `<section class="section_prose" id="${b.id || 'article'}">
  <div class="container-large prose_grid">
    <article class="prose_body">${b.html}</article>
    ${b.aside ? `<aside class="prose_aside">${b.aside}</aside>` : ''}
  </div>
</section>`
}

/* ---------- post index ----------
   b.hub (BugHerd #59 #60, /surgery-and-care, /the-practice): the same grid as photo cards of the pages
   a hub links to: `cards` [{ href, title, text, image, pos }], numbered 01.., marked data-hub */
export function postindex(b) {
  const cards = b.hub
    ? b.cards.map((c, i) => `<a class="post-index_card" href="${c.href}"><figure class="media-frame_component is-wide">${img({ src: c.image, alt: '', pos: c.pos })}</figure><span class="post-index_date">${String(i + 1).padStart(2, '0')}</span><h3 class="heading-style-h3">${c.title}</h3><p class="text-size-small">${c.text}</p></a>`).join('\n')
    : b.posts
      .map((p) => `<a class="post-index_card" href="/blog/${p.slug}.html"><figure class="media-frame_component is-wide">${img({ src: p.image, alt: '', pos: p.imagePos })}</figure><span class="post-index_date">${p.dateLabel}</span><h3 class="heading-style-h3 is-post-card">${p.title}</h3><p class="text-size-small">${p.excerpt}</p></a>`)
      .join('\n')
  return `<section class="section_post-index" id="${b.id || 'entries'}"${b.hub ? ' data-hub' : ''}>
  <div class="container-large post-index_head">${tag(b.tag || 'The Journal')}<h2 class="heading-style-h2">${b.title}</h2>${b.lead ? `<p class="text-style-lead">${b.lead}</p>` : ''}</div>
  <div class="container-large post-index_grid">
    ${cards}
  </div>
</section>`
}

/* ---------- invitation: the same chapter the homepage closes on ---------- */
export function invite(b = {}) {
  const options = (b.interests || ['Dental implants', 'All-on-4 / full arch', 'Failing implant or loose denture', 'IV sedation', 'Veneers or cosmetic', 'Not sure yet']).map((o) => `<option>${o}</option>`).join('')
  const next = b.next
    ? `<div class="container-large invitation_next"><div class="text-style-label">Where next</div><div class="invitation_next-grid">${b.next.map((n) => `<a class="invitation_next-card" href="${n.href}"><b class="text-style-serif">${n.label}</b><span>${n.text}</span><i class="arrow_icon">&rarr;</i></a>`).join('')}</div></div>`
    : ''
  const faqPart = b.faq
    ? `<div class="container-large invitation_faq" id="inviteFaq">
    <div class="invitation_faq-head"><div class="text-style-label">Before you call</div><h3 class="heading-style-h3">${b.faq.title || 'Confidence starts with good information.'}</h3></div>
    <div class="faq_list">${b.faq.items.map((it) => faqItem(it.q, it.a)).join('')}</div>
  </div>`
    : ''
  return `<section class="section_invitation" id="invitation">
  <div class="invitation_background" aria-hidden="true"><img class="parallax_image" src="/media/img/footer_cta_barriere.jpg" alt="" loading="lazy"></div>
  <div class="container-large invitation_grid">
    <div class="invitation_content">
      <div class="text-style-tagline"><i></i><span>The Invitation</span></div>
      <h2 class="heading-style-h2" id="inviteTitle">${b.title || 'Make the first step feel <em>clear.</em>'}</h2>
      <p class="text-style-lead">${b.lead || 'A consultation covers candidacy, options, sedation, financing and timing. No pressure, no surprises.'}</p>
      <div class="invitation_contact">
        <div><b>New patients</b><a href="${SITE.phoneNewHref}">${SITE.phoneNew}</a></div>
        <div><b>Current patients</b><a href="${SITE.phoneCurrentHref}">${SITE.phoneCurrent}</a></div>
        <div><b>Visit</b><a href="${SITE.mapHref}" target="_blank" rel="noopener">${SITE.address1}<br>${SITE.address2}</a></div>
        <div><b>Hours</b><span>Monday to Friday, 9am to 5pm<br>Same-day emergency appointments</span></div>
        <div><b>Book online</b><a href="${SITE.zocdoc}" target="_blank" rel="noopener">Pick a time on Zocdoc</a></div>
      </div>
    </div>
    <form class="invitation_form" id="consultForm" action="#" method="post" novalidate>
      <h3 class="heading-style-h3">${b.formTitle || 'Request a consultation'}</h3>
      <div class="invitation_fields">
        <label><span>First name</span><input type="text" name="first" autocomplete="given-name" required></label>
        <label><span>Last name</span><input type="text" name="last" autocomplete="family-name" required></label>
        <label><span>Phone</span><input type="tel" name="phone" autocomplete="tel" required></label>
        <label><span>Email</span><input type="email" name="email" autocomplete="email"></label>
        <label class="is-full-width"><span>What can we help with?</span>
          <select name="interest">${options}</select>
        </label>
        <label class="is-full-width"><span>Preferred contact</span>
          <select name="contact"><option>Phone</option><option>Text</option><option>Email</option></select>
        </label>
      </div>
      <button class="button is-primary is-magnetic" type="submit"><span>Request Consultation</span></button>
      <p class="text-size-small invitation_note">We reply within one business day. Prefer to choose a time yourself? <a href="${SITE.zocdoc}" target="_blank" rel="noopener">Book on Zocdoc</a>.</p>
    </form>
  </div>
  ${faqPart}
  ${next}
</section>`
}

export const BLOCKS = { cover, statement, steps, compare, strip, ledger, proof, faq, rail, gallery, stories, videos, team, detail, tabs, contactcard, prose, postindex, invite }

/** Render a page's chapter list, numbering and naming each one. */
export function renderChapters(chapters) {
  return chapters
    .map((c, i) => {
      const fn = BLOCKS[c.type]
      if (!fn) throw new Error(`unknown block type "${c.type}"`)
      let html = fn(c)
      // number + name the chapter on its opening <section>
      html = html.replace(/^<section /, `<section data-chapter="${i}" data-chapter-name="${c.name || c.tag || c.type}"${c.theme === 'light' && !/data-theme=/.test(html.slice(0, 200)) ? ' data-theme="light"' : ''} `)
      return html
    })
    .join('\n\n')
}

/** FAQPage JSON-LD from every faq block on the page. */
export function faqJsonLd(chapters) {
  const qs = []
  for (const c of chapters) {
    if (c.type === 'faq') qs.push(...c.items)
    if (c.type === 'invite' && c.faq) qs.push(...c.faq.items)
  }
  if (!qs.length) return null
  const strip = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&rsquo;|’/g, "'").replace(/&amp;/g, '&')
  return {
    '@type': 'FAQPage',
    mainEntity: qs.map((q) => ({ '@type': 'Question', name: strip(q.q), acceptedAnswer: { '@type': 'Answer', text: strip(q.a) } })),
  }
}
