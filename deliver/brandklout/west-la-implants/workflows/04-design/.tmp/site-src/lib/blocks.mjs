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

const tag = (t) => (t ? `<div class="chapter-tag"><i></i><span>${t}</span></div>` : '')
/* m.pos = the photo's focal point as 'x% y%' — a class, not an inline style (css/45-focal.css, 08-qa image review) */
const fp = (m) => (m && m.pos ? 'fp-' + m.pos.split(/\s+/).map((v) => Math.round(parseFloat(v) / 10) * 10).join('-') : '')
const img = (m, cls = '', extra = '') => (m ? `<img${cls || fp(m) ? ` class="${[cls, fp(m)].filter(Boolean).join(' ')}"` : ''} src="${m.src}" alt="${(m.alt || '').replace(/"/g, '&quot;')}" loading="lazy"${extra}>` : '')
const paras = (arr, cls = '') => (arr || []).map((p) => `<p${cls ? ` class="${cls}"` : ''}>${p}</p>`).join('\n')
const action = (a) =>
  a.kind === 'text'
    ? `<a class="textlink" href="${a.href}"${a.ext ? ' target="_blank" rel="noopener"' : ''}>${a.label} <span class="arrow">&rarr;</span></a>`
    : `<a class="btn${a.kind === 'ghost' ? ' btn-ghost' : a.kind === 'gold' ? ' btn-gold' : ''} magnetic" href="${a.href}"${a.ext ? ' target="_blank" rel="noopener"' : ''}><span>${a.label}</span></a>`

/* ---------- 00 cover ---------- */
export function cover(b) {
  const meta = b.meta ? `<ul class="cv-meta" aria-label="At a glance">${b.meta.map((m) => `<li data-anim="hide"><b>${m.b}</b><span>${m.span}</span></li>`).join('')}</ul>` : ''
  const actions = b.actions ? `<div class="cv-actions" data-anim="hide">${b.actions.map(action).join('')}</div>` : ''
  const copy = `<div class="cv-copy">
      ${b.kicker ? `<div class="chapter-tag" data-anim="hide"><i></i><span>${b.kicker}</span></div>` : ''}
      <h1 class="display cv-title${b.small ? ' cv-title--small' : ''}" data-anim="hide">${b.title}</h1>
      ${b.lead ? `<p class="lead cv-lead" data-anim="hide">${b.lead}</p>` : ''}
      ${actions}
    </div>`
  if (b.layout === 'bleed') {
    const media = b.video
      ? `<video class="cv-film" poster="${b.video.poster}" muted loop playsinline preload="metadata" data-src="${b.video.src}"${b.video.srcMobile ? ` data-src-mobile="${b.video.srcMobile}"` : ''} aria-label="${(b.video.label || '').replace(/"/g, '&quot;')}"></video>`
      : img(b.image, 'cv-film')
    return `<section class="b-cover b-cover--bleed${b.tone ? ' cv-' + b.tone : ''}" id="${b.id || 'arrival'}">
  <div class="cv-bg">${media}<div class="cv-veil"></div></div>
  <div class="wrap--wide cv-in cv-in--bleed">${copy}${meta}</div>
  <div class="cv-cue" data-anim="hide"><span>Scroll</span><i></i></div>
</section>`
  }
  return `<section class="b-cover b-cover--split" id="${b.id || 'arrival'}">
  <div class="wrap--wide cv-in">
    ${copy}
    <figure class="frame cv-media" data-wipe>${img(b.image, [b.image.still ? '' : 'par', b.image.pos ? 'cv-pos' : ''].filter(Boolean).join(' '))}${b.image.caption ? `<figcaption>${b.image.caption}</figcaption>` : ''}</figure>
    ${meta}
  </div>
</section>`
}

/* ---------- statement: pinned, the words are written by scroll ---------- */
export function statement(b) {
  /* services beside the statement (BugHerd #38, /dental-implants): [href, label] pairs, the current page marked */
  const services = b.services
    ? `<nav class="st-services" aria-label="${b.services.label}"><span class="st-services-k">${b.services.label}</span>${b.services.links.map(([href, label]) => `<a href="${href}.html"${href === b.services.current ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>`
    : ''
  return `<section class="b-statement${b.theme ? ' st-' + b.theme : ''}" id="${b.id || 'statement'}"${b.services ? ' data-st-services' : ''}>
  ${b.image ? `<div class="st-bg" aria-hidden="true">${img({ src: b.image.src, alt: '' }, 'st-img')}</div>` : ''}
  <div class="wrap st-stage">
    ${tag(b.tag)}
    <p class="st-big serif">${b.text.replace(/ (\S+)$/, '&nbsp;$1')}</p>
    <div class="st-after">${paras(b.after)}${b.figure ? `<div class="st-figure"><b data-count="${b.figure.value}"${b.figure.suffix ? ` data-suffix="${b.figure.suffix}"` : ''}>0</b><span>${b.figure.label}</span></div>` : ''}</div>
    ${services}
  </div>
</section>`
}

/* ---------- steps: pinned vertical stepper ---------- */
export function steps(b) {
  const items = b.steps.map((s, i) => `<li class="sp-step${i === 0 ? ' is-first' : ''}"><span class="sp-k">Step ${String(i + 1).padStart(2, '0')}</span><h3 class="h3">${s.title}</h3><p>${s.text}</p></li>`).join('\n')
  const dots = b.steps.map((_, i) => `<i${i === 0 ? ' class="is-on"' : ''}></i>`).join('')
  return `<section class="b-steps" id="${b.id || 'steps'}">
  <div class="sp-pin">
    <div class="wrap sp-grid">
      <div class="sp-head">
        ${tag(b.tag)}
        <h2 class="h2">${b.title}</h2>
        ${b.intro ? `<p class="lead">${b.intro}</p>` : ''}
        <div class="sp-counter" aria-hidden="true"><b class="sp-num serif">01</b><span class="sp-of">of ${String(b.steps.length).padStart(2, '0')}</span><i class="sp-line"><b></b></i></div>
      </div>
      <div class="sp-stage">
        <ol class="sp-list">
          ${items}
        </ol>
        <div class="sp-dots" aria-hidden="true">${dots}</div>
        ${b.image ? `<figure class="frame sp-shot" data-wipe>${img(b.image, 'par')}</figure>` : ''}
      </div>
    </div>
  </div>
</section>`
}

/* ---------- compare: pinned, the columns light one at a time ---------- */
export function compare(b) {
  const cols = b.columns
    .map(
      (c, i) => `<div class="cp-col${c.hot ? ' is-hot' : ''}"><div class="cp-col-head"><span class="num">${String(i + 1).padStart(2, '0')}</span><h3 class="h3">${c.title}</h3>${c.sub ? `<p class="small">${c.sub}</p>` : ''}</div><ul>${c.rows.map((r) => `<li>${r}</li>`).join('')}</ul>${c.href ? `<a class="textlink" href="${c.href}">${c.cta || 'Read more'} <span class="arrow">&rarr;</span></a>` : ''}</div>`,
    )
    .join('\n      ')
  return `<section class="b-compare" id="${b.id || 'compare'}">
  <div class="cp-pin">
    <div class="wrap cp-in">
      <div class="cp-head">
        <div>${tag(b.tag)}<h2 class="h2">${b.title}</h2></div>
        ${b.intro ? `<p class="lead">${b.intro}</p>` : ''}
      </div>
      <div class="cp-track" aria-hidden="true"><i></i></div>
      <div class="cp-grid">
      ${cols}
      </div>
      ${b.note ? `<p class="small cp-note">${b.note}</p>` : ''}
    </div>
  </div>
</section>`
}

/* ---------- strip: copy beside a strip of photographs ---------- */
export function strip(b) {
  const photos = (b.photos || []).map((p, i) => `<figure class="frame ph-shot ph-shot--${i}" data-wipe>${img(p, 'par')}${p.caption ? `<figcaption>${p.caption}</figcaption>` : ''}</figure>`).join('\n')
  const list = b.list ? `<ul class="ph-list">${b.list.map((l) => `<li><b>${l.b}</b><span>${l.span}</span></li>`).join('')}</ul>` : ''
  return `<section class="b-strip${b.flip ? ' ph-flip' : ''}${b.theme ? ' ph-' + b.theme : ''}" id="${b.id || 'strip'}">
  <div class="wrap ph-grid">
    <div class="ph-copy">
      ${tag(b.tag)}
      <h2 class="h2">${b.title}</h2>
      ${b.lead ? `<p class="lead">${b.lead}</p>` : ''}
      <div class="ph-body">${paras(b.body)}</div>
      ${list}
      ${b.actions ? `<div class="ph-actions">${b.actions.map(action).join('')}</div>` : ''}
    </div>
    <div class="ph-strip">${photos}</div>
  </div>
</section>`
}

/* ---------- ledger: pinned, a figure counts while the list is drawn ---------- */
export function ledger(b) {
  const items = b.items.map((it, i) => `<li><span class="num">${String(i + 1).padStart(2, '0')}</span><b>${it.b}</b><span class="lg-what">${it.span}</span></li>`).join('\n')
  return `<section class="b-ledger" id="${b.id || 'ledger'}">
  <div class="lg-pin">
    <div class="wrap lg-grid">
      <div class="lg-head">
        ${tag(b.tag)}
        <h2 class="h2">${b.title}</h2>
        ${b.lead ? `<p class="lead">${b.lead}</p>` : ''}
        ${b.figure ? `<div class="lg-figure"><b class="serif" data-count="${b.figure.value}"${b.figure.suffix ? ` data-suffix="${b.figure.suffix}"` : ''}>0</b><span>${b.figure.label}</span></div>` : ''}
      </div>
      <ul class="lg-list">
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
  return `<section class="b-proof" id="${b.id || 'proof'}" data-theme="light">
  <div class="ba-pin">
    <div class="wrap ba-grid">
      <div class="ba-stage" aria-label="Before and after">
        <div class="ba-before"><img src="${before}" alt="${b.beforeAlt || (who ? who + ' before treatment' : 'Before')}" loading="lazy"><span class="ba-label">Before</span></div>
        <div class="ba-after"><img src="${after}" alt="${b.afterAlt || (who ? who + ' after treatment' : 'After')}" loading="lazy"><span class="ba-label ba-label--after">After</span></div>
        <div class="ba-handle" aria-hidden="true"><i></i></div>
      </div>
      <div class="ba-copy">
        ${tag(b.tag || 'The Proof')}
        <h2 class="h2">${b.title}</h2>
        ${quote ? `<blockquote class="serif ba-quote">&ldquo;${quote}&rdquo;</blockquote>` : ''}
        ${who ? `<div class="ba-who"><b>${who}</b><span>${treat}</span></div>` : ''}
        ${b.text ? `<p class="lead">${b.text}</p>` : ''}
        <div class="ba-actions">${film ? `<a class="textlink" href="${film.href}" target="_blank" rel="noopener">${film.label} <span class="arrow">&rarr;</span></a>` : ''}<a class="textlink" href="/results.html">More results <span class="arrow">&rarr;</span></a></div>
      </div>
    </div>
  </div>
</section>`
}

/* ---------- faq ---------- */
export function faq(b) {
  const items = b.items.map((it) => `<div class="faq-item"><button class="faq-q" type="button" aria-expanded="false"><span>${it.q}</span><i></i></button><div class="faq-a"><p>${it.a}</p></div></div>`).join('\n')
  return `<section class="b-faq" id="${b.id || 'questions'}">
  <div class="wrap fq-grid">
    <div class="fq-head">${tag(b.tag || 'The Questions')}<h2 class="h2">${b.title}</h2>${b.lead ? `<p class="lead">${b.lead}</p>` : ''}</div>
    <div class="faq">
      ${items}
    </div>
  </div>
</section>`
}

/* ---------- rail: pinned horizontal journey through cards ---------- */
export function rail(b) {
  const cards = b.cards
    .map(
      (c, i) => `<article class="rl-card${c.image ? '' : ' rl-card--text'}">${c.image ? `<figure class="frame frame--tall">${img(c.image)}</figure>` : `<div class="rl-glyph serif">${String(i + 1).padStart(2, '0')}</div>`}<div class="rl-copy"><span class="num">${String(i + 1).padStart(2, '0')}</span><h3 class="h3">${c.title}</h3><p>${c.text}</p>${c.href ? `<a class="textlink" href="${c.href}">${c.cta || 'Learn more'} <span class="arrow">&rarr;</span></a>` : ''}</div></article>`,
    )
    .join('\n')
  return `<section class="b-rail" id="${b.id || 'rail'}">
  <div class="rl-pin">
    <div class="rl-head wrap--wide">
      <div>${tag(b.tag)}<h2 class="h2">${b.title}</h2></div>
      <div class="rl-progress" aria-hidden="true"><span class="rl-count">01 / ${String(b.cards.length).padStart(2, '0')}</span><i><b></b></i></div>
    </div>
    <div class="rl-track">
      ${cards}
      <div class="rl-end"><p class="h3">${b.end?.title || 'Not sure which is right for you?'}</p><a class="btn magnetic" href="${b.end?.href || '#invitation'}"><span>${b.end?.label || 'Ask Dr. Barriere'}</span></a></div>
    </div>
  </div>
</section>`
}

/* ---------- gallery: interactive before/after grid ---------- */
export function gallery(b) {
  const cards = b.pairs
    .map(
      (p) => `<figure class="ga-card"><div class="ga-stage"><img class="ga-before" src="${p.before}" alt="${p.label} before" loading="lazy"><div class="ga-after"><img src="${p.after}" alt="${p.label} after" loading="lazy"></div><div class="ga-handle" aria-hidden="true"></div></div><figcaption><b>${p.label}</b><span>${p.sub || 'Drag or hover to compare'}</span></figcaption></figure>`,
    )
    .join('\n')
  return `<section class="b-gallery" id="${b.id || 'gallery'}" data-theme="light">
  <div class="wrap ga-head">${tag(b.tag)}<h2 class="h2">${b.title}</h2>${b.lead ? `<p class="lead">${b.lead}</p>` : ''}</div>
  <div class="wrap--wide ga-grid">
    ${cards}
  </div>
  ${b.note ? `<div class="wrap"><p class="small ga-note">${b.note}</p></div>` : ''}
  ${b.actions ? `<div class="wrap ga-actions">${b.actions.map(action).join('')}</div>` : ''}
</section>`
}

/* ---------- stories: the three patient films ---------- */
export function stories(b) {
  const items = (b.items || ['leslie', 'emily', 'michael']).map((k) => {
    const p = PATIENTS[k]
    const media = p.clip
      ? `<video class="sy-clip" poster="${p.poster}" muted loop playsinline preload="none" data-src-hover="${p.clip}" aria-label="${p.name}, in her own words"></video>`
      : `<img src="${p.poster}" alt="${p.name} after treatment" loading="lazy">`
    return `<article class="sy-card"><a class="frame frame--tall sy-media" href="${filmHref(p.film)}" target="_blank" rel="noopener" aria-label="Watch ${p.name}’s story${p.film.vimeo ? '' : ' on YouTube'}">${media}<span class="sy-play" aria-hidden="true"></span></a><blockquote class="serif">&ldquo;${p.quote}&rdquo;</blockquote><div class="sy-who"><b>${p.name}</b><span>${p.treatment}</span></div>${b.ba === false ? '' : `<div class="sy-ba"><img src="${p.before}" alt="${p.name} before" loading="lazy"><img src="${p.after}" alt="${p.name} after" loading="lazy"></div>`}</article>`
  }).join('\n')
  return `<section class="b-stories" id="${b.id || 'stories'}">
  <div class="wrap sy-head">${tag(b.tag || 'The Stories')}<h2 class="h2">${b.title}</h2>${b.lead ? `<p class="lead">${b.lead}</p>` : ''}</div>
  <div class="wrap sy-grid">
    ${items}
  </div>
</section>`
}

/* ---------- videos: the film library ---------- */
export function videos(b) {
  const items = b.items
    .map((f) => `<a class="vd-card" href="${filmHref(f)}" target="_blank" rel="noopener"><figure class="frame frame--wide"><img src="/media/img/yt-${f.id}.jpg" alt="" loading="lazy"><span class="sy-play" aria-hidden="true"></span></figure><span class="vd-title">${f.title}</span></a>`)
    .join('\n')
  return `<section class="b-videos" id="${b.id || 'films'}">
  <div class="wrap vd-head">${tag(b.tag || 'The Library')}<h2 class="h2">${b.title}</h2>${b.lead ? `<p class="lead">${b.lead}</p>` : ''}</div>
  <div class="wrap vd-grid">
    ${items}
  </div>
</section>`
}

/* ---------- team ---------- */
export function team(b) {
  const people = b.people
    .map((p) => `<article class="tm-card"><figure class="tm-photo"><img src="${p.image}" alt="${p.name}" loading="lazy"></figure><div class="tm-who"><b>${p.name}</b><span>${p.role}</span></div>${p.bio ? `<p class="small">${p.bio}</p>` : ''}</article>`)
    .join('\n')
  return `<section class="b-team" id="${b.id || 'team'}">
  <div class="wrap tm-head">${tag(b.tag || 'The Team')}<h2 class="h2">${b.title}</h2>${b.lead ? `<p class="lead">${b.lead}</p>` : ''}</div>
  <div class="wrap tm-grid">
    ${people}
  </div>
</section>`
}

/* ---------- detail: editorial columns ---------- */
export function detail(b) {
  const cols = (b.columns || []).map((c) => `<div class="dt-col"><h3 class="h3">${c.h}</h3>${paras(c.text)}</div>`).join('\n')
  const list = b.list ? `<ul class="dt-list">${b.list.map((l) => `<li><b>${l.b}</b><span>${l.span}</span></li>`).join('')}</ul>` : ''
  return `<section class="b-detail${b.theme ? ' dt-' + b.theme : ''}" id="${b.id || 'detail'}">
  <div class="wrap dt-in">
    <div class="dt-head">${tag(b.tag)}<h2 class="h2">${b.title}</h2>${b.lead ? `<p class="lead">${b.lead}</p>` : ''}</div>
    ${b.body ? `<div class="dt-body">${paras(b.body)}</div>` : ''}
    ${cols ? `<div class="dt-cols">${cols}</div>` : ''}
    ${list}
    ${b.actions ? `<div class="dt-actions">${b.actions.map(action).join('')}</div>` : ''}
  </div>
</section>`
}

/* ---------- tabs: panels switched by text-only buttons ---------- */
export function tabs(b) {
  const btns = b.panels.map((p, i) => `<button class="tb-btn${i === 0 ? ' is-on' : ''}" type="button">${p.label}</button>`).join('')
  const panels = b.panels
    .map((p, i) => `<div class="tb-panel${i === 0 ? ' is-on' : ''}"><h3 class="h3">${p.title}</h3>${(p.sections || []).map((s) => `<div class="tb-sec"><b>${s.h}</b>${paras(s.text)}</div>`).join('')}</div>`)
    .join('\n')
  return `<section class="b-tabs" id="${b.id || 'instructions'}">
  <div class="wrap tb-in">
    <div class="tb-head">${tag(b.tag)}<h2 class="h2">${b.title}</h2>${b.lead ? `<p class="lead">${b.lead}</p>` : ''}</div>
    <div class="tb-bar">${btns}</div>
    <div class="tb-panels">
      ${panels}
    </div>
    ${b.note ? `<p class="small tb-note">${b.note}</p>` : ''}
  </div>
</section>`
}

/* ---------- contact card: address, hours, directions — no iframe (trap: Instatic forbids non-YouTube iframes) ---------- */
export function contactcard(b) {
  return `<section class="b-place" id="${b.id || 'place'}">
  <div class="wrap pl-grid">
    <figure class="frame pl-photo" data-wipe>${img(b.image, 'par')}</figure>
    <div class="pl-copy">
      ${tag(b.tag || 'The Place')}
      <h2 class="h2">${b.title}</h2>
      <ul class="pl-list">
        <li><b>Address</b><a href="${SITE.mapHref}" target="_blank" rel="noopener">${SITE.address1}<br>${SITE.address2}</a></li>
        <li><b>New patients</b><a href="${SITE.phoneNewHref}">${SITE.phoneNew}</a></li>
        <li><b>Current patients</b><a href="${SITE.phoneCurrentHref}">${SITE.phoneCurrent}</a></li>
        <li><b>Hours</b><span>Monday to Friday, 9:00am to 5:00pm<br>Saturday and Sunday closed<br>Same-day emergency visits</span></li>
        <li><b>Book online</b><a href="${SITE.zocdoc}" target="_blank" rel="noopener">Choose a time on Zocdoc</a></li>
      </ul>
      ${paras(b.body)}
      <div class="pl-actions"><a class="btn magnetic" href="${SITE.mapHref}" target="_blank" rel="noopener"><span>Directions</span></a><a class="textlink" href="#invitation">Send a request <span class="arrow">&rarr;</span></a></div>
    </div>
  </div>
</section>`
}

/* ---------- prose: a journal entry ---------- */
export function prose(b) {
  return `<section class="b-prose" id="${b.id || 'article'}">
  <div class="wrap pr2-in">
    <article class="pr2-body">${b.html}</article>
    ${b.aside ? `<aside class="pr2-aside">${b.aside}</aside>` : ''}
  </div>
</section>`
}

/* ---------- post index ---------- */
export function postindex(b) {
  const cards = b.posts
    .map((p) => `<a class="px-card" href="/blog/${p.slug}.html"><figure class="frame frame--wide">${img({ src: p.image, alt: '', pos: p.imagePos })}</figure><span class="px-date">${p.dateLabel}</span><h3 class="h3">${p.title}</h3><p class="small">${p.excerpt}</p></a>`)
    .join('\n')
  return `<section class="b-postindex" id="${b.id || 'entries'}">
  <div class="wrap px-head">${tag(b.tag || 'The Journal')}<h2 class="h2">${b.title}</h2>${b.lead ? `<p class="lead">${b.lead}</p>` : ''}</div>
  <div class="wrap px-grid">
    ${cards}
  </div>
</section>`
}

/* ---------- invitation: the same chapter the homepage closes on ---------- */
export function invite(b = {}) {
  const options = (b.interests || ['Dental implants', 'All-on-4 / full arch', 'Failing implant or loose denture', 'IV sedation', 'Veneers or cosmetic', 'Not sure yet']).map((o) => `<option>${o}</option>`).join('')
  const next = b.next
    ? `<div class="wrap in-next"><div class="kicker">Where next</div><div class="in-next-grid">${b.next.map((n) => `<a class="in-next-card" href="${n.href}"><b class="serif">${n.label}</b><span>${n.text}</span><i class="arrow">&rarr;</i></a>`).join('')}</div></div>`
    : ''
  const faqPart = b.faq
    ? `<div class="wrap in-faq" id="inviteFaq">
    <div class="in-faq-head"><div class="kicker">Before you call</div><h3 class="h3">${b.faq.title || 'Confidence starts with good information.'}</h3></div>
    <div class="faq">${b.faq.items.map((it) => `<div class="faq-item"><button class="faq-q" type="button" aria-expanded="false"><span>${it.q}</span><i></i></button><div class="faq-a"><p>${it.a}</p></div></div>`).join('')}</div>
  </div>`
    : ''
  return `<section class="ch-invitation" id="invitation">
  <div class="in-bg" aria-hidden="true"><img class="par" src="/media/img/footer_cta_barriere.jpg" alt="" loading="lazy"></div>
  <div class="wrap in-grid">
    <div class="in-copy">
      <div class="chapter-tag"><i></i><span>The Invitation</span></div>
      <h2 class="h2" id="inviteTitle">${b.title || 'Make the first step feel <em>clear.</em>'}</h2>
      <p class="lead">${b.lead || 'A consultation covers candidacy, options, sedation, financing and timing. No pressure, no surprises.'}</p>
      <div class="in-contact">
        <div><b>New patients</b><a href="${SITE.phoneNewHref}">${SITE.phoneNew}</a></div>
        <div><b>Current patients</b><a href="${SITE.phoneCurrentHref}">${SITE.phoneCurrent}</a></div>
        <div><b>Visit</b><a href="${SITE.mapHref}" target="_blank" rel="noopener">${SITE.address1}<br>${SITE.address2}</a></div>
        <div><b>Hours</b><span>Monday to Friday, 9am to 5pm<br>Same-day emergency appointments</span></div>
        <div><b>Book online</b><a href="${SITE.zocdoc}" target="_blank" rel="noopener">Pick a time on Zocdoc</a></div>
      </div>
    </div>
    <form class="in-form" id="consultForm" action="#" method="post" novalidate>
      <h3 class="h3">${b.formTitle || 'Request a consultation'}</h3>
      <div class="in-fields">
        <label><span>First name</span><input type="text" name="first" autocomplete="given-name" required></label>
        <label><span>Last name</span><input type="text" name="last" autocomplete="family-name" required></label>
        <label><span>Phone</span><input type="tel" name="phone" autocomplete="tel" required></label>
        <label><span>Email</span><input type="email" name="email" autocomplete="email"></label>
        <label class="full"><span>What can we help with?</span>
          <select name="interest">${options}</select>
        </label>
        <label class="full"><span>Preferred contact</span>
          <select name="contact"><option>Phone</option><option>Text</option><option>Email</option></select>
        </label>
      </div>
      <button class="btn btn-gold magnetic" type="submit"><span>Request Consultation</span></button>
      <p class="small in-note">We reply within one business day. Prefer to choose a time yourself? <a href="${SITE.zocdoc}" target="_blank" rel="noopener">Book on Zocdoc</a>.</p>
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
