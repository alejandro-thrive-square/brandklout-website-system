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
import { SITE, PATIENTS, filmHref } from './site.mjs'
import { compare, steps, gallery, stories, rail, faq, strip } from './blocks.mjs'

export const PREFIX = 'ads-landing-pages'
const url = (slug) => `/${PREFIX}/${slug}.html`
const esc = (s) => String(s || '').replace(/"/g, '&quot;')
/* m.pos = the focal point as 'x% y%': a class, never an inline style (css/45-focal.css) */
const fp = (m) => (m && m.pos ? 'object-position-' + m.pos.split(/\s+/).map((v) => Math.round(parseFloat(v) / 10) * 10).join('-') : '')
const img = (m, cls = '') => `<img${cls || fp(m) ? ` class="${[cls, fp(m)].filter(Boolean).join(' ')}"` : ''} src="${m.src}" alt="${esc(m.alt)}" loading="lazy">`
const tag = (t) => `<div class="text-style-tagline"><i></i><span>${t}</span></div>`

/* what every page of the set repeats */
export const CREDS = [
  { b: 'Ohio State', span: 'College of Dentistry' },
  { b: 'NYU Langone', span: 'Yearlong surgical residency' },
  { b: '1,000+ hours', span: 'Continuing education' },
  { b: 'AACD · AAID · ADA', span: 'Memberships' },
]
export const AREA = 'Serving West Los Angeles, Brentwood, Santa Monica, Westwood, Century City, Culver City and Beverly Hills.'
const creds = (cls = '') => `<ul class="landing_credentials${cls ? ' ' + cls : ''}" aria-label="Dr. Barriere’s training">${CREDS.map((c) => `<li><b>${c.b}</b><span>${c.span}</span></li>`).join('')}</ul>`
const review = (r) => `<figure class="landing_review"><blockquote>&ldquo;${r.text}&rdquo;</blockquote><figcaption><b>${r.who}</b><span>Google review</span></figcaption></figure>`

/* ---------- the form card ---------- */
function formCard(c, o = {}) {
  const slot = c.formSnippet
    ? `<div class="landing_form-slot wz-embed" data-wz-embed="auto" data-embed="form-${c.key}">${c.formSnippet}</div>`
    : `<div class="landing_form-slot" data-lp-next="/${PREFIX}/${c.thankYou}">
        <form class="landing_form" action="#" method="post" novalidate>
          <div class="invitation_fields">
            <label><span>First name</span><input type="text" name="first" autocomplete="given-name" required></label>
            <label><span>Last name</span><input type="text" name="last" autocomplete="family-name" required></label>
            <label><span>Phone</span><input type="tel" name="phone" autocomplete="tel" required></label>
            <label><span>Email</span><input type="email" name="email" autocomplete="email"></label>
            <label class="is-full-width"><span>What would you like to talk about?</span>
              <select name="interest">${c.interests.map((i) => `<option>${i}</option>`).join('')}</select>
            </label>
          </div>
          <button class="button is-primary" type="submit">Request Consultation</button>
        </form>
      </div>`
  return `<div class="landing_form-card" id="book">
      <div class="landing_form-card-head"><span class="landing_form-card-tagline">${o.kicker || c.offer}</span><h2 class="heading-style-h3 is-landing-heading">${o.title || 'Request your consultation'}</h2><p class="text-size-small">${o.text || 'A 3D scan, an honest read on candidacy, and a written plan.'}</p></div>
      ${slot}
      <p class="text-size-small landing_form-card-note">We reply within one business day. Prefer to talk? <a href="${SITE.phoneAdsHref}">${SITE.phoneAds}</a></p>
    </div>`
}

/* ==========================================================================
   LANDING
   ========================================================================== */

/* 1 · hero: the offer, a review, three checks, Book + Call, the doctor on film, the form */
function hero(c) {
  const h = c.hero
  return `<section class="section_landing-hero" id="top">
  <div class="landing-hero_background" aria-hidden="true"><video class="landing-hero_film" poster="/media/img/still-yomi-robot-team.jpg" muted loop playsinline preload="metadata" data-src="/media/video/dr-barriere-yomi-1920.mp4" aria-label="Dr. Barriere and his assistant operating the Yomi surgical robot"></video><div class="landing-hero_veil"></div></div>
  <div class="container-xlarge landing-hero_grid">
    <div class="landing-hero_content">
      <div class="text-style-tagline" data-anim="hide"><i></i><span>${h.kicker}</span></div>
      <h1 class="heading-style-display landing_title" data-anim="hide">${h.title}</h1>
      <p class="text-style-lead landing_lead" data-anim="hide">${h.lead}</p>
      <ul class="landing_checklist" data-anim="hide">${h.checks.map((k) => `<li>${k}</li>`).join('')}</ul>
      <div class="landing_actions" data-anim="hide"><a class="button is-primary is-magnetic" href="${url(c.consultation)}"><span>Book a Consultation</span></a><a class="button is-secondary is-magnetic" href="${SITE.phoneAdsHref}"><span>Call ${SITE.phoneAds}</span></a></div>
      <div class="landing_proof" data-anim="hide">${review(h.review)}<p class="text-size-small landing_area">${AREA}</p></div>
    </div>
    <div class="landing_form-wrapper" data-anim="hide">${formCard(c)}</div>
    ${creds('is-hero')}
  </div>
</section>`
}

/* 2 · one patient's real journey: the slider, life before / after, four beats in their words */
function journey(c) {
  const j = c.journey
  const p = PATIENTS[j.patient]
  const ba = j.ba || p /* the sharper WordPress _large pair where the template names one */
  return `<section class="section_journey" id="journey" data-theme="light">
  <div class="container-large journey_top">
    <div class="journey_head">
      ${tag('One patient’s real journey')}
      <h2 class="heading-style-h2">${j.title}</h2>
      <p class="text-style-lead">${j.lead}</p>
      <div class="journey_patient"><figure class="landing_portrait">${img(j.portrait)}</figure><div><b>${p.name}</b><span>${j.treatment}</span><a class="arrow-link_component" href="${filmHref(p.film)}" target="_blank" rel="noopener">Watch ${p.name}’s film <span class="arrow_icon">&rarr;</span></a></div></div>
    </div>
    <figure class="journey_before-after" aria-label="${p.name}, before and after">
      <div class="journey_stage"><img class="journey_before" src="${ba.before}" alt="${p.name} before treatment" loading="lazy"><div class="journey_after"><img src="${ba.after}" alt="${p.name} after treatment" loading="lazy"></div><div class="journey_handle" aria-hidden="true"></div><span class="journey_label">Before</span><span class="journey_label is-after-label">After</span></div>
      <figcaption>Drag to compare. ${p.name} is a patient of this practice; results vary.</figcaption>
    </figure>
  </div>
  <div class="container-large journey_lists">
    <div class="journey_list"><h3 class="heading-style-h3 is-landing-heading">Life <em>before</em></h3><ul>${j.before.map((t) => `<li>${t}</li>`).join('')}</ul></div>
    <div class="journey_list is-after-list"><h3 class="heading-style-h3 is-landing-heading">Life <em>after</em></h3><ul>${j.after.map((t) => `<li>${t}</li>`).join('')}</ul></div>
  </div>
  <div class="container-large journey_beats">
    <div class="journey_beats-line" aria-hidden="true"><i></i></div>
    <ol class="journey_beats-grid">${j.beats.map((b, i) => `<li class="journey_beat"><span class="text-style-number">${String(i + 1).padStart(2, '0')}</span><b>${b.label}</b><blockquote class="text-style-serif">&ldquo;${b.quote}&rdquo;</blockquote><span class="journey_beat-person">${b.who}</span></li>`).join('')}</ol>
  </div>
</section>`
}

/* 3 · why patients drive past other offices: four reasons (the films follow as the site's stories block) */
function why(c) {
  const w = c.why
  return `<section class="section_why" id="why">
  <div class="container-large why_grid">
    <div class="why_head">
      ${tag('The difference')}
      <h2 class="heading-style-h2">${w.title}</h2>
      <p class="text-style-lead is-why">${w.lead}</p>
      <figure class="media-frame_component why_image-wrapper" data-wipe>${img(w.image, 'parallax_image')}</figure>
    </div>
    <ol class="why_reasons">${w.reasons.map((r, i) => `<li class="why_reason"><span class="text-style-number">${String(i + 1).padStart(2, '0')}</span><h3 class="heading-style-h3 is-landing-heading">${r.title}</h3><p>${r.text}</p></li>`).join('')}</ol>
  </div>
</section>`
}

/* 10 · the final call */
function final(c, o = {}) {
  const f = o.copy || c.final
  const book = o.noBook ? '' : `<a class="button is-primary is-magnetic" href="${url(c.consultation)}"><span>Book a Consultation</span></a>`
  return `<section class="section_landing-final" id="${o.id || 'start'}">
  <div class="landing-final_background" aria-hidden="true">${img({ src: f.image, alt: '' }, 'parallax_image')}</div>
  <div class="container-large landing-final_content">
    ${tag(f.tag || 'The invitation')}
    <h2 class="heading-style-h2">${f.title}</h2>
    <p class="text-style-lead is-landing-final">${f.lead}</p>
    <div class="landing_actions">${book}<a class="button ${o.noBook ? 'is-primary' : 'is-secondary'} is-magnetic" href="${SITE.phoneAdsHref}"><span>Call ${SITE.phoneAds}</span></a></div>
    <ul class="landing-final_facts">
      <li><b>Prefer to talk?</b><a href="${SITE.phoneAdsHref}">${SITE.phoneAds}</a></li>
      <li><b>Visit</b><a href="${SITE.mapHref}" target="_blank" rel="noopener">${SITE.address1}, ${SITE.address2}</a></li>
      <li><b>Hours</b><span>${SITE.hours}</span></li>
    </ul>
    ${creds()}
  </div>
</section>`
}

/* 11 · the foot: address, legal links, the disclaimer. A <footer>, not a chapter. */
export function foot(c) {
  return `<footer class="landing-footer_component">
  <div class="container-large landing-footer_grid">
    <div class="landing-footer_brand"><div class="nav_logo"><img src="/media/img/logo-icon-white.png" alt=""><span class="brand_wordmark">West LA <em>Implants</em></span></div><p>${SITE.doctor}</p></div>
    <p class="landing-footer_address">${SITE.address1}<br>${SITE.address2}<br><a href="${SITE.phoneAdsHref}">${SITE.phoneAds}</a><br>${SITE.hours}</p>
    <p class="landing-footer_legal">${c.disclaimer}</p>
  </div>
  <div class="container-large landing-footer_bottom"><span>&copy; West LA Implants &middot; Tony Barriere, DDS</span><div class="landing-footer_links"><a href="/privacy-policy.html">Privacy</a><a href="/hipaa-disclosure.html">HIPAA Disclosure</a><a href="/accessibility.html">Accessibility</a></div></div>
</footer>`
}

/* ==========================================================================
   CONSULTATION — form first, nothing competes with it
   ========================================================================== */
function consultHero(c) {
  const z = c.consult
  return `<section class="section_consultation" id="top">
  <div class="container-xlarge consultation_grid">
    <div class="consultation_content">
      <div class="text-style-tagline" data-anim="hide"><i></i><span>${z.kicker}</span></div>
      <h1 class="heading-style-display landing_title is-form-page-title" data-anim="hide">${z.title}</h1>
      <p class="text-style-lead landing_lead" data-anim="hide">${z.lead}</p>
      <div class="consultation_byline" data-anim="hide"><figure class="landing_portrait">${img({ src: '/media/img/doctor-headshot-square.png', alt: 'Dr. Tony Barriere' })}</figure><div><b>Reviewed by ${SITE.doctor}</b><span>He plans, places and restores every implant himself.</span></div></div>
      <ul class="landing_checklist" data-anim="hide">${z.covers.map((k) => `<li>${k}</li>`).join('')}</ul>
      <div class="landing_proof" data-anim="hide">${review(z.review)}</div>
    </div>
    <div class="landing_form-wrapper" data-anim="hide">${formCard(c, { title: 'Tell us where to reach you', text: 'The front desk calls to find a time and checks your benefits before you come in.' })}</div>
  </div>
</section>`
}

/* one dentist, start to finish: reviews and credentials */
function proof(c) {
  const z = c.consult
  return `<section class="section_landing-proof" id="proof">
  <div class="container-large landing-proof_grid">
    <div class="landing-proof_head">${tag('One dentist, start to finish')}<h2 class="heading-style-h2">${z.proofTitle}</h2><p class="text-style-lead">${z.proofLead}</p><figure class="media-frame_component landing-proof_image-wrapper" data-wipe>${img(z.proofImage, 'parallax_image')}</figure></div>
    <div class="landing-proof_quotes">${z.reviews.map((r) => `<blockquote class="landing-proof_quote"><p>&ldquo;${r.text}&rdquo;</p><footer><b>${r.who}</b><span>${r.src || 'Google review'}</span></footer></blockquote>`).join('')}</div>
  </div>
  <div class="container-large">${creds('is-band')}</div>
</section>`
}

/* ==========================================================================
   THANK YOU — phone first, no form. The conversion fires on this URL.
   ========================================================================== */
function tyHero(c) {
  const t = c.thanks
  return `<section class="section_thank-you" id="top">
  <div class="container-xlarge thank-you_grid">
    <div class="thank-you_content">
      <div class="text-style-tagline" data-anim="hide"><i></i><span>${t.kicker || 'Request received'}</span></div>
      <h1 class="heading-style-display landing_title is-form-page-title" data-anim="hide">${t.title}</h1>
      <p class="text-style-lead landing_lead" data-anim="hide">${t.lead}</p>
      <div class="landing_actions" data-anim="hide"><a class="button is-primary is-magnetic is-thank-you" href="${SITE.phoneAdsHref}"><span>Call ${SITE.phoneAds}</span></a></div>
      <p class="text-size-small thank-you_note" data-anim="hide">${t.note}</p>
      <div class="landing_proof" data-anim="hide">${review(t.review)}</div>
    </div>
    <figure class="media-frame_component thank-you_image-wrapper" data-wipe>${img(t.image, 'parallax_image')}</figure>
  </div>
</section>`
}

/* three cards: what the call covers / why the practice */
function cards(b) {
  return `<section class="section_landing-cards${b.theme === 'light' ? ' is-light' : ''}" id="${b.id}"${b.theme === 'light' ? ' data-theme="light"' : ''}>
  <div class="container-large landing-cards_head">${tag(b.tag)}<h2 class="heading-style-h2">${b.title}</h2>${b.lead ? `<p class="text-style-lead">${b.lead}</p>` : ''}</div>
  <div class="container-large landing-cards_grid">${b.items.map((it, i) => `<article class="landing-cards_card">${it.image ? `<figure class="media-frame_component landing-cards_image-wrapper">${img(it.image)}</figure>` : ''}<span class="text-style-number">${String(i + 1).padStart(2, '0')}</span><h3 class="heading-style-h3 is-landing-heading">${it.title}</h3><p>${it.text}</p></article>`).join('')}</div>
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
