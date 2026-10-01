/* ==========================================================================
   LP — the paid-traffic combo (scenario 3, Asana 1218556641026733 and
   1218513737115127). Three pages per campaign under /ads-landing-pages/:

     landing (form in the hero)  ->  consultation (form first)  ->  thank you

   The ORDER of the beats is Livewell's, beat for beat (02-build-the-combo.md);
   the shapes are this site's. Options, method, results, the rooms and the
   questions reuse the site's own blocks (lib/blocks.mjs), so their motion is
   the motion the client approved. The hero, the journey, the reasons, the
   close and the foot are the ad set's own shapes (css/60-lp.css,
   sections/lp.js).

   Naming: everything here is `lp-*`. Never `ad`, `ads`, `ad-*`, `is-ad`: ad
   blockers collapse those on http(s) only, so every local gate stays green
   while the published hero and its form are 0px tall.

   The form: one Go High Level form per campaign. Until Brandklout sends a
   campaign's snippet (`formSnippet`, pasted verbatim), the slot carries the
   site's own prototype fields and forwards to the campaign's thank-you page so
   the flow can be reviewed. With a snippet the slot becomes the Embed marker
   place-embeds.mjs swaps for the brandklout Embed block.
   ========================================================================== */
import { SITE, PATIENTS } from './site.mjs'
import { compare, steps, gallery, stories, rail, faq, strip } from './blocks.mjs'

export const PREFIX = 'ads-landing-pages'
const url = (slug) => `/${PREFIX}/${slug}.html`
const esc = (s) => String(s || '').replace(/"/g, '&quot;')
/* m.pos = the focal point as 'x% y%': a class, never an inline style (css/45-focal.css) */
const fp = (m) => (m && m.pos ? 'fp-' + m.pos.split(/\s+/).map((v) => Math.round(parseFloat(v) / 10) * 10).join('-') : '')
const img = (m, cls = '') => `<img${cls || fp(m) ? ` class="${[cls, fp(m)].filter(Boolean).join(' ')}"` : ''} src="${m.src}" alt="${esc(m.alt)}" loading="lazy">`
const tag = (t) => `<div class="chapter-tag"><i></i><span>${t}</span></div>`

/* what every page of the set repeats */
export const CREDS = [
  { b: 'Ohio State', span: 'College of Dentistry' },
  { b: 'NYU Langone', span: 'Yearlong surgical residency' },
  { b: '1,000+ hours', span: 'Continuing education' },
  { b: 'AACD · AAID · ADA', span: 'Memberships' },
]
export const AREA = 'Serving West Los Angeles, Brentwood, Santa Monica, Westwood, Century City, Culver City and Beverly Hills.'
const creds = (cls = '') => `<ul class="lp-creds${cls ? ' ' + cls : ''}" aria-label="Dr. Barriere’s training">${CREDS.map((c) => `<li><b>${c.b}</b><span>${c.span}</span></li>`).join('')}</ul>`
const review = (r) => `<figure class="lp-review"><blockquote>&ldquo;${r.text}&rdquo;</blockquote><figcaption><b>${r.who}</b><span>Google review</span></figcaption></figure>`

/* ---------- the form card ---------- */
function formCard(c, o = {}) {
  const slot = c.formSnippet
    ? `<div class="lp-slot wz-embed" data-wz-embed="auto" data-embed="form-${c.key}">${c.formSnippet}</div>`
    : `<div class="lp-slot" data-lp-next="/${PREFIX}/${c.thankYou}">
        <form class="lp-proto" action="#" method="post" novalidate>
          <div class="in-fields">
            <label><span>First name</span><input type="text" name="first" autocomplete="given-name" required></label>
            <label><span>Last name</span><input type="text" name="last" autocomplete="family-name" required></label>
            <label><span>Phone</span><input type="tel" name="phone" autocomplete="tel" required></label>
            <label><span>Email</span><input type="email" name="email" autocomplete="email"></label>
            <label class="full"><span>What would you like to talk about?</span>
              <select name="interest">${c.interests.map((i) => `<option>${i}</option>`).join('')}</select>
            </label>
          </div>
          <button class="btn btn-gold" type="submit">Request Consultation</button>
        </form>
      </div>`
  return `<div class="lp-card" id="book">
      <div class="lp-card-head"><span class="lp-card-k">${o.kicker || c.offer}</span><h2 class="h3">${o.title || 'Request your consultation'}</h2><p class="small">${o.text || 'A 3D scan, an honest read on candidacy, and a written plan.'}</p></div>
      ${slot}
      <p class="small lp-card-note">We reply within one business day. Prefer to talk? <a href="${SITE.phoneNewHref}">${SITE.phoneNew}</a></p>
    </div>`
}

/* ==========================================================================
   LANDING
   ========================================================================== */

/* 1 · hero: the offer, a review, three checks, Book + Call, the doctor on film, the form */
function hero(c) {
  const h = c.hero
  return `<section class="lp-hero" id="top">
  <div class="lp-hero-bg" aria-hidden="true"><video class="lp-film" poster="/media/img/still-yomi-robot-team.jpg" muted loop playsinline preload="metadata" data-src="/media/video/dr-barriere-yomi-1920.mp4" aria-label="Dr. Barriere and his assistant operating the Yomi surgical robot"></video><div class="lp-veil"></div></div>
  <div class="wrap--wide lp-hero-in">
    <div class="lp-hero-copy">
      <div class="chapter-tag" data-anim="hide"><i></i><span>${h.kicker}</span></div>
      <h1 class="display lp-title" data-anim="hide">${h.title}</h1>
      <p class="lead lp-lead" data-anim="hide">${h.lead}</p>
      <ul class="lp-checks" data-anim="hide">${h.checks.map((k) => `<li>${k}</li>`).join('')}</ul>
      <div class="lp-actions" data-anim="hide"><a class="btn btn-gold magnetic" href="${url(c.consultation)}"><span>Book a Consultation</span></a><a class="btn btn-ghost magnetic" href="${SITE.phoneNewHref}"><span>Call ${SITE.phoneNew}</span></a></div>
      <div class="lp-hero-proof" data-anim="hide">${review(h.review)}<p class="small lp-area">${AREA}</p></div>
    </div>
    <div class="lp-hero-form" data-anim="hide">${formCard(c)}</div>
    ${creds('lp-creds--hero')}
  </div>
</section>`
}

/* 2 · one patient's real journey: the slider, life before / after, four beats in their words */
function journey(c) {
  const j = c.journey
  const p = PATIENTS[j.patient]
  return `<section class="lp-journey" id="journey" data-theme="light">
  <div class="wrap lp-jr-top">
    <div class="lp-jr-head">
      ${tag('One patient’s real journey')}
      <h2 class="h2">${j.title}</h2>
      <p class="lead">${j.lead}</p>
      <div class="lp-jr-who"><figure class="lp-jr-face">${img(j.portrait)}</figure><div><b>${p.name}</b><span>${j.treatment}</span><a class="textlink" href="https://www.youtube.com/watch?v=${p.film.id}" target="_blank" rel="noopener">Watch ${p.name}’s film <span class="arrow">&rarr;</span></a></div></div>
    </div>
    <figure class="lp-ba" aria-label="${p.name}, before and after">
      <div class="lp-ba-stage"><img class="lp-ba-before" src="${p.before}" alt="${p.name} before treatment" loading="lazy"><div class="lp-ba-after"><img src="${p.after}" alt="${p.name} after treatment" loading="lazy"></div><div class="lp-ba-handle" aria-hidden="true"></div><span class="lp-ba-label">Before</span><span class="lp-ba-label lp-ba-label--after">After</span></div>
      <figcaption>Drag to compare. ${p.name} is a patient of this practice; results vary.</figcaption>
    </figure>
  </div>
  <div class="wrap lp-jr-lists">
    <div class="lp-jr-list"><h3 class="h3">Life <em>before</em></h3><ul>${j.before.map((t) => `<li>${t}</li>`).join('')}</ul></div>
    <div class="lp-jr-list lp-jr-list--after"><h3 class="h3">Life <em>after</em></h3><ul>${j.after.map((t) => `<li>${t}</li>`).join('')}</ul></div>
  </div>
  <div class="wrap lp-beats">
    <div class="lp-beats-line" aria-hidden="true"><i></i></div>
    <ol class="lp-beats-grid">${j.beats.map((b, i) => `<li class="lp-beat"><span class="num">${String(i + 1).padStart(2, '0')}</span><b>${b.label}</b><blockquote class="serif">&ldquo;${b.quote}&rdquo;</blockquote><span class="lp-beat-who">${b.who}</span></li>`).join('')}</ol>
  </div>
</section>`
}

/* 3 · why patients drive past other offices: four reasons (the films follow as the site's stories block) */
function why(c) {
  const w = c.why
  return `<section class="lp-why" id="why">
  <div class="wrap lp-why-grid">
    <div class="lp-why-head">
      ${tag('The difference')}
      <h2 class="h2">${w.title}</h2>
      <p class="lead">${w.lead}</p>
      <figure class="frame lp-why-shot" data-wipe>${img(w.image, 'par')}</figure>
    </div>
    <ol class="lp-reasons">${w.reasons.map((r, i) => `<li class="lp-reason"><span class="num">${String(i + 1).padStart(2, '0')}</span><h3 class="h3">${r.title}</h3><p>${r.text}</p></li>`).join('')}</ol>
  </div>
</section>`
}

/* 10 · the final call */
function final(c, o = {}) {
  const f = o.copy || c.final
  const book = o.noBook ? '' : `<a class="btn btn-gold magnetic" href="${url(c.consultation)}"><span>Book a Consultation</span></a>`
  return `<section class="lp-final" id="${o.id || 'start'}">
  <div class="lp-final-bg" aria-hidden="true">${img({ src: f.image, alt: '' }, 'par')}</div>
  <div class="wrap lp-final-in">
    ${tag(f.tag || 'The invitation')}
    <h2 class="h2">${f.title}</h2>
    <p class="lead">${f.lead}</p>
    <div class="lp-actions">${book}<a class="btn ${o.noBook ? 'btn-gold' : 'btn-ghost'} magnetic" href="${SITE.phoneNewHref}"><span>Call ${SITE.phoneNew}</span></a></div>
    <ul class="lp-final-facts">
      <li><b>Prefer to talk?</b><a href="${SITE.phoneNewHref}">${SITE.phoneNew}</a></li>
      <li><b>Visit</b><a href="${SITE.mapHref}" target="_blank" rel="noopener">${SITE.address1}, ${SITE.address2}</a></li>
      <li><b>Hours</b><span>${SITE.hours}</span></li>
    </ul>
    ${creds()}
  </div>
</section>`
}

/* 11 · the foot: address, legal links, the disclaimer. A <footer>, not a chapter. */
export function foot(c) {
  return `<footer class="lp-foot">
  <div class="wrap lp-foot-in">
    <div class="lp-foot-brand"><div class="nav-logo"><img src="/media/img/logo-icon-white.png" alt=""><span class="wordmark">West LA <em>Implants</em></span></div><p>${SITE.doctor}</p></div>
    <p class="lp-foot-where">${SITE.address1}<br>${SITE.address2}<br><a href="${SITE.phoneNewHref}">${SITE.phoneNew}</a><br>${SITE.hours}</p>
    <p class="lp-foot-legal">${c.disclaimer}</p>
  </div>
  <div class="wrap lp-foot-bottom"><span>&copy; West LA Implants &middot; Tony Barriere, DDS</span><div class="lp-foot-links"><a href="/privacy-policy.html">Privacy</a><a href="/hipaa-disclosure.html">HIPAA Disclosure</a><a href="/accessibility.html">Accessibility</a></div></div>
</footer>`
}

/* ==========================================================================
   CONSULTATION — form first, nothing competes with it
   ========================================================================== */
function consultHero(c) {
  const z = c.consult
  return `<section class="lp-cz" id="top">
  <div class="wrap--wide lp-cz-in">
    <div class="lp-cz-copy">
      <div class="chapter-tag" data-anim="hide"><i></i><span>${z.kicker}</span></div>
      <h1 class="display lp-title lp-title--cz" data-anim="hide">${z.title}</h1>
      <p class="lead lp-lead" data-anim="hide">${z.lead}</p>
      <div class="lp-cz-by" data-anim="hide"><figure class="lp-jr-face">${img({ src: '/media/img/doctor-headshot-square.png', alt: 'Dr. Tony Barriere' })}</figure><div><b>Reviewed by ${SITE.doctor}</b><span>He plans, places and restores every implant himself.</span></div></div>
      <ul class="lp-checks" data-anim="hide">${z.covers.map((k) => `<li>${k}</li>`).join('')}</ul>
      <div class="lp-hero-proof" data-anim="hide">${review(z.review)}</div>
    </div>
    <div class="lp-hero-form" data-anim="hide">${formCard(c, { title: 'Tell us where to reach you', text: 'The front desk calls to find a time and checks your benefits before you come in.' })}</div>
  </div>
</section>`
}

/* one dentist, start to finish: reviews and credentials */
function proof(c) {
  const z = c.consult
  return `<section class="lp-proof" id="proof">
  <div class="wrap lp-proof-in">
    <div class="lp-proof-head">${tag('One dentist, start to finish')}<h2 class="h2">${z.proofTitle}</h2><p class="lead">${z.proofLead}</p><figure class="frame lp-proof-shot" data-wipe>${img(z.proofImage, 'par')}</figure></div>
    <div class="lp-quotes">${z.reviews.map((r) => `<blockquote class="lp-quote"><p>&ldquo;${r.text}&rdquo;</p><footer><b>${r.who}</b><span>${r.src || 'Google review'}</span></footer></blockquote>`).join('')}</div>
  </div>
  <div class="wrap">${creds('lp-creds--band')}</div>
</section>`
}

/* ==========================================================================
   THANK YOU — phone first, no form. The conversion fires on this URL.
   ========================================================================== */
function tyHero(c) {
  const t = c.thanks
  return `<section class="lp-ty" id="top">
  <div class="wrap--wide lp-ty-in">
    <div class="lp-ty-copy">
      <div class="chapter-tag" data-anim="hide"><i></i><span>Request received</span></div>
      <h1 class="display lp-title lp-title--cz" data-anim="hide">${t.title}</h1>
      <p class="lead lp-lead" data-anim="hide">${t.lead}</p>
      <div class="lp-actions" data-anim="hide"><a class="btn btn-gold magnetic" href="${SITE.phoneNewHref}"><span>Call ${SITE.phoneNew}</span></a></div>
      <p class="small lp-ty-note" data-anim="hide">${t.note}</p>
      <div class="lp-hero-proof" data-anim="hide">${review(t.review)}</div>
    </div>
    <figure class="frame lp-ty-shot" data-wipe>${img(t.image, 'par')}</figure>
  </div>
</section>`
}

/* three cards: what the call covers / why the practice */
function cards(b) {
  return `<section class="lp-cards${b.theme === 'light' ? ' lp-cards--light' : ''}" id="${b.id}"${b.theme === 'light' ? ' data-theme="light"' : ''}>
  <div class="wrap lp-cards-head">${tag(b.tag)}<h2 class="h2">${b.title}</h2>${b.lead ? `<p class="lead">${b.lead}</p>` : ''}</div>
  <div class="wrap lp-cards-grid">${b.items.map((it, i) => `<article class="lp-cardx">${it.image ? `<figure class="frame lp-cardx-shot">${img(it.image)}</figure>` : ''}<span class="num">${String(i + 1).padStart(2, '0')}</span><h3 class="h3">${it.title}</h3><p>${it.text}</p></article>`).join('')}</div>
</section>`
}

/* ==========================================================================
   ASSEMBLY
   ========================================================================== */
/** Number the beats that are chapters. journey-audit caps a page at eight, so
    the films, the rooms and the questions ride inside their neighbours' span
    (they carry no data-chapter) — the order on the page is still the eleven. */
function assemble(parts) {
  let n = 0
  return parts
    .filter(Boolean)
    .map(([html, name]) => (name ? html.replace(/^<section /, `<section data-chapter="${n++}" data-chapter-name="${name}" `) : html))
    .join('\n\n')
}

export function landingBody(c) {
  const book = url(c.consultation)
  return assemble([
    [hero(c), 'Arrival'],
    [journey(c), 'The Journey'],
    [why(c), 'The Difference'],
    [stories({ id: 'films', tag: 'In their own words', title: c.films.title, lead: c.films.lead, ba: false })],
    [strip({ id: 'surgeon', tag: 'The surgeon', flip: true, ...c.doctor, actions: [{ href: book, label: 'Meet Dr. Barriere' }] }), 'The Surgeon'],
    [compare({ id: 'options', tag: 'Your options', ...c.options }), 'The Options'],
    [steps({ id: 'method', tag: 'How it works', ...c.method }), 'The Method'],
    [gallery({ id: 'results', tag: 'Real patients. Real results.', ...c.results, actions: [{ href: book, label: 'Book a Consultation', kind: 'gold' }] }), 'The Results'],
    [rail({ id: 'rooms', tag: 'The space', ...c.rooms, end: { title: 'Come and see it for yourself.', href: book, label: 'Book a Consultation' } })],
    [faq({ id: 'questions', tag: 'Before you book', ...c.questions })],
    [final(c), 'The Invitation'],
  ])
}

export function consultBody(c) {
  return assemble([
    [consultHero(c), 'Arrival'],
    [stories({ id: 'films', tag: 'Hear from our patients', title: c.films.title, lead: c.films.lead, ba: false }), 'The Stories'],
    [proof(c), 'The Proof'],
  ])
}

export function thanksBody(c) {
  const t = c.thanks
  return assemble([
    [tyHero(c), 'Arrival'],
    [cards({ id: 'expect', tag: 'What the call covers', ...t.expect }), 'The Call'],
    [cards({ id: 'why', tag: 'Why West LA Implants', theme: 'light', ...t.why }), 'The Practice'],
    [faq({ id: 'questions', tag: 'Any questions before you call?', ...t.questions }), 'The Questions'],
    [final(c, { id: 'next', noBook: true, copy: t.cta }), 'The Next Step'],
  ])
}

/** The three page objects build.mjs writes for one campaign. */
export function combo(c) {
  const chrome = (role) => ({ type: 'lp', role, home: url(c.landing), book: url(c.consultation), foot: foot(c) })
  const base = { noindex: true, robots: 'noindex, follow', image: c.image }
  return [
    { ...base, slug: `${PREFIX}/${c.landing}`, title: c.seo.landing.title, description: c.seo.landing.description, body: landingBody(c), chrome: chrome('landing') },
    { ...base, slug: `${PREFIX}/${c.consultation}`, title: c.seo.consultation.title, description: c.seo.consultation.description, body: consultBody(c), chrome: chrome('consultation') },
    { ...base, slug: `${PREFIX}/${c.thankYou}`, title: c.seo.thankYou.title, description: c.seo.thankYou.description, body: thanksBody(c), chrome: chrome('thank-you') },
  ]
}
