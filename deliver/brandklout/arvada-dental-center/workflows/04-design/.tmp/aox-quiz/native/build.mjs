#!/usr/bin/env node
/**
 * native/build.mjs — the All-on-X quiz combo as NATIVE Webflow pages.
 *
 * The first Webflow build put each page in one Embed. It rendered correctly
 * and could not be edited in the Designer, which is the whole point of having
 * the page in Webflow. This build is elements and classes instead:
 *
 *   wf.css     every visual rule, in the dialect that becomes Webflow styles
 *   markup     below, one class per element, in the shape data_whtml_builder
 *              turns into Designer elements (headings, paragraphs, link
 *              blocks, a native form, list items, images)
 *   code.css   the few things a style cannot hold      -> page head code
 *   site.js    behaviour only; it reads all copy from the page -> page footer code
 *
 * One source, two renderings of it:
 *   local    out/<page>.html, in the markup Webflow will publish (its own
 *            w- classes, its form wrapper) and under the live site's
 *            stylesheet, so the local page is the staging page
 *   webflow  ../../../../07-webflow-build/.tmp/aox-quiz/native/<key>.body.html
 *            etc., for push-native.mjs
 *
 *   node native/build.mjs [--refresh-host]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const OUT = join(HERE, 'out');
const WF = join(HERE, '../../../../07-webflow-build/.tmp/aox-quiz/native');
const SITE = 'https://www.arvadadentalcenter.com/';

/* ---- facts that appear in more than one place ---- */
const PHONE = { display: '(720) 419-3699', tel: '+17204193699' };
const PRICE = { one: '$18,795', oneMo: '$235', both: '$37,590', bothMo: '$471' };
const PREQUAL = 'https://pay.withcherry.com/arvada-dental-center--implants';
const SLUG = { landing: 'all-on-x-quiz', consult: 'all-on-x-quiz-consult', thanks: 'all-on-x-quiz-thank-you' };
const FOLDER = '/ads-landing-pages/';

const CDN = 'https://cdn.prod.website-files.com/693c51e685b19f0d0c149cab/';
const IMG = {
  logo: CDN + '694375aa3ac6c1ae44dd2194_imgi_62_dental-implants-in-denver-arvada-dentist-1.png.webp',
  chris: CDN + '699c49187176483cf4346bdf_Chris-BEfore-and-After.jpg',
  woman: CDN + '69fa9f02c7b6afbf4e832f6c_imgi_12_transformation-image-2.jpg',
  wickFrame: CDN + '69fa9f02befd419f218b521a_imgi_13_transformation-image-3.jpg',
  bennett: CDN + '69daece9b0e2d0e6388c5713_BB8A2838.jpg',
  theresaBefore: CDN + '693c51e685b19f0d0c149e0e_Theresa%20Before%201%20(1).webp',
  theresaAfter: CDN + '693c51e685b19f0d0c149e17_Theresa%20After%201%20(1).webp',
  // Stills from the practice's own YouTube uploads; push-native.mjs adds them to the asset library.
  wick: 'https://i.ytimg.com/vi/n6pB30XJwng/maxresdefault.jpg',
  anna: 'https://i.ytimg.com/vi/IISjxdkk0Ok/maxres3.jpg',
  brittany: 'https://i.ytimg.com/vi/YrMQX7oFzmA/maxresdefault.jpg',
};

/* ==========================================================================
   Markup. `T` is the rendering: 'local' writes what Webflow publishes,
   'wf' writes what data_whtml_builder is given. They differ only where
   Webflow adds something of its own.
   ========================================================================== */
function markup(T) {
  const L = T === 'local';
  const linkBlock = (cls) => (L ? `${cls} w-inline-block` : cls);      // a link with element children
  const list = L ? ' role="list"' : '';
  const img = (cls, src, alt, lazy = true) => `<img class="${cls}" src="${src}" alt="${alt}"${lazy ? ' loading="lazy"' : ''}>`;

  const svgPhone = `<svg class="aq-icon-phone" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.12.37 2.33.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"></path></svg>`;
  const svgCheck = (cls, stroke) => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="currentColor"></circle><path d="M6.8 12.4l3.4 3.4 7-7.4" fill="none" stroke="${stroke}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
  const svgPlay = `<svg class="aq-face-play-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4l14 8-14 8z"></path></svg>`;

  const topbar = `<header class="aq-topbar">
  <div class="aq-topbar-in">
    <div class="aq-brand">${img('aq-logo', IMG.logo, 'Arvada Dental Center &amp; Implants', false)}</div>
    <div class="aq-top-actions">
      <div class="aq-top-rating"><div class="aq-top-stars" aria-hidden="true">★★★★★</div><div class="aq-top-score">4.8</div><div class="aq-top-source">on Google</div></div>
      <a class="${linkBlock('aq-top-call')}" href="tel:${PHONE.tel}" data-loc="topbar">${svgPhone}<div class="aq-top-call-text">${PHONE.display}</div></a>
    </div>
  </div>
</header>`;

  /* ---- the quiz: every step is on the page, the script shows one at a time ---- */
  const opt = (label, extra = '') => `<a class="${linkBlock('aq-opt')}" href="#"${extra}><div class="aq-opt-dot"></div><div class="aq-opt-label">${label}</div></a>`;
  const step = (key, q, opts) => `<div class="aq-qstep" data-step="${key}">
          <h3 class="aq-q">${q}</h3>
          <div class="aq-opts">
            ${opts.join('\n            ')}
          </div>
        </div>`;
  const field = (id, name, label, type, extra = '') => `<div class="aq-field"><label class="aq-label" for="${id}">${label}</label><input class="${L ? 'aq-input w-input' : 'aq-input'}" id="${id}" name="${name}"${L ? ` data-name="${name}" maxlength="256" placeholder=""` : ''} type="${type}"${extra}><p class="aq-err" id="${id}-err">This field needs a second look.</p></div>`;
  const CONSENT = 'Text me about my consultation. Message and data rates may apply. Reply STOP to opt out. Consent isn’t required to book.';
  const SUBMIT = 'Request my free consultation';
  // Webflow builds the checkbox label itself; push-native.mjs sets its text and class afterwards.
  const checkbox = L
    ? `<label class="w-checkbox aq-check"><input type="checkbox" name="sms_consent" id="f-sms" data-name="sms_consent" class="w-checkbox-input aq-checkbox"><span class="aq-check-text w-form-label" for="f-sms">${CONSENT}</span></label>`
    : `<input type="checkbox" name="sms_consent" id="f-sms" class="aq-checkbox">`;
  const submit = L
    ? `<input type="submit" data-wait="Sending your request…" class="aq-submit w-button" value="${SUBMIT}">`
    : `<input type="submit" class="aq-submit" value="${SUBMIT}">`;
  const formInner = `${field('f-name', 'first_name', 'First name', 'text', ' autocomplete="given-name" required')}
              ${field('f-phone', 'phone', 'Mobile phone', 'tel', ' autocomplete="tel-national" inputmode="tel" required')}
              ${field('f-email', 'email', 'Email (optional)', 'email', ' autocomplete="email" inputmode="email"')}
              ${checkbox}
              ${submit}
              <p class="aq-form-err" id="form-err" role="alert">Your request didn’t go through. Try again, or call <a class="aq-foot-link" href="tel:${PHONE.tel}" data-loc="form_error">${PHONE.display}</a> and we’ll book you directly.</p>
              <p class="aq-fine">No cost and no obligation. Our implant coordinator will call you.</p>`;
  const form = L
    ? `<div class="aq-form-wrap w-form"><form id="lead-form" name="wf-form-All-on-X-quiz" data-name="All-on-X quiz" method="get" class="aq-form">
              ${formInner}
            </form><div class="w-form-done"><div>Thank you! Your submission has been received!</div></div><div class="w-form-fail"><div>Oops! Something went wrong while submitting the form.</div></div></div>`
    : `<form id="lead-form" name="All-on-X quiz" class="aq-form">
              ${formInner}
            </form>`;

  const quiz = `<div class="aq-quiz" id="quiz" role="region" aria-labelledby="quiz-title" data-lead-webhook="" data-thank-you="${L ? SLUG.thanks + '.html' : FOLDER + SLUG.thanks}">
      <div class="aq-quiz-head">
        <h2 class="aq-quiz-title" id="quiz-title">See if you qualify</h2>
        <p class="aq-quiz-sub">Four quick questions. Free, with no obligation.</p>
      </div>
      <div class="aq-progress">
        <p class="aq-progress-meta" id="q-count">Question 1 of 4</p>
        <div class="aq-track" role="progressbar" aria-labelledby="q-count" aria-valuemin="0" aria-valuemax="100" aria-valuenow="17"><div class="aq-fill" id="q-fill"></div></div>
      </div>
      <div class="aq-quiz-body" id="quiz-body">
        ${step('situation', 'What’s going on with your teeth right now?', [
          opt('I’m missing most or all of my teeth'), opt('I have several failing or broken teeth'),
          opt('I wear dentures and I’m tired of them'), opt('I’m not sure, I’d like an expert opinion')])}
        ${step('arch', 'Which teeth would you like to replace?', [
          opt('My upper teeth', ' data-arch="upper"'), opt('My lower teeth', ' data-arch="lower"'),
          opt('Both upper and lower', ' data-arch="both"'), opt('I’m not sure yet', ' data-arch="unsure"')])}
        ${step('timeline', 'When would you like to have new teeth?', [
          opt('As soon as possible'), opt('Within the next 3 months'), opt('In 3 to 6 months'), opt('I’m just researching for now')])}
        ${step('payment', 'How would you like to pay for treatment?', [
          opt('Monthly payments'), opt('Cash or savings'), opt('Insurance plus financing'), opt('I’d like to talk it through')])}
        <div class="aq-qstep" data-step="contact">
          <h3 class="aq-q">Your next step is a free consultation and 3D scan.</h3>
          <div class="aq-est" data-label-upper="Published fee, upper arch" data-label-lower="Published fee, lower arch" data-label-both="Published fee, both arches" data-total-both="${PRICE.both}" data-note-both="or from ${PRICE.bothMo}/mo with approved financing. Confirmed in writing after your scan.">
            <p class="aq-est-l">Published fee, one arch</p>
            <p class="aq-est-n">${PRICE.one}</p>
            <p class="aq-est-m">or from ${PRICE.oneMo}/mo with approved financing. Confirmed in writing after your scan.</p>
          </div>
          ${form}
        </div>
      </div>
      <div class="aq-quiz-foot"><a class="aq-back" href="#">Back</a><div class="aq-time">Takes about 30 seconds</div></div>
    </div>`;

  const proof = `<ul${list} class="aq-hero-proof">
      <li class="aq-proof-item">${svgCheck('aq-ck', '#5f5f5d')}<div class="aq-proof-text">Free consultation, 3D CT scan and a written plan</div></li>
      <li class="aq-proof-item">${svgCheck('aq-ck', '#5f5f5d')}<div class="aq-proof-text">IV sedation, given by Dr. Bennett himself</div></li>
      <li class="aq-proof-item">${svgCheck('aq-ck', '#5f5f5d')}<div class="aq-proof-text">Most patients leave surgery day with fixed teeth</div></li>
    </ul>`;

  const hero = (kicker, h1, lede) => `<section class="aq-hero">
  <div class="aq-hero-grid">
    <div class="aq-hero-copy">
      <div class="aq-kicker">${kicker}</div>
      ${h1}
      <p class="aq-lede">${lede}</p>
    </div>
    <div class="aq-hero-quiz">
    ${quiz}
    </div>
    ${proof}
  </div>
</section>`;

  const cred = (...parts) => `<li class="aq-cred">${parts.join('')}</li>`;
  const creds = `<section class="aq-creds" aria-label="Ratings and recognition">
  <div class="aq-wrap">
    <ul${list} class="aq-creds-list">
      ${cred('<div class="aq-cred-stars" aria-hidden="true">★★★★★</div>', '<div class="aq-cred-main">4.8 on Google</div>', '<div class="aq-cred-sub">1,200+ reviews</div>')}
      ${cred('<div class="aq-cred-main">4.9 on Healthgrades</div>', '<div class="aq-cred-sub">Dr. Bennett</div>')}
      ${cred('<div class="aq-cred-main">5280 Magazine Top Dentist</div>')}
      ${cred('<div class="aq-cred-main">In Arvada since 2003</div>')}
    </ul>
  </div>
</section>`;

  const videoTile = (id, name, imgCls, src, alt) => `<li class="aq-face-item"><a class="${linkBlock('aq-face')}" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener" data-yt="${id}" aria-label="Watch ${name}’s story"><div class="aq-face-ph">${img(imgCls, src, alt)}<div class="aq-face-play">${svgPlay}</div></div><div class="aq-face-name">${name}</div><div class="aq-face-sub">Watch their story</div></a></li>`;
  const faces = (title) => `<section class="aq-faces" aria-labelledby="faces-title">
  <div class="aq-faces-head">
    <h2 class="aq-h2-faces" id="faces-title">${title}</h2>
    <p class="aq-faces-hint">Tap a photo to watch their story.</p>
  </div>
  <div class="aq-faces-scroll" tabindex="0" role="region" aria-label="Patient stories, scrolls sideways">
    <div class="aq-wrap">
      <ul${list} class="aq-faces-list">
        ${videoTile('n6pB30XJwng', 'Wick', 'aq-face-img-wick', IMG.wick, 'Wick, an Arvada Dental Center implant patient')}
        ${videoTile('IISjxdkk0Ok', 'Anna', 'aq-face-img', IMG.anna, 'Anna holding a photo of her smile before treatment')}
        ${videoTile('YrMQX7oFzmA', 'Brittany', 'aq-face-img', IMG.brittany, 'Brittany outside Arvada Dental Center')}
        <li class="aq-face-item"><div class="aq-face-static"><div class="aq-face-ph">${img('aq-face-img-chris', IMG.chris, 'Chris smiling after his All-on-X treatment')}</div><div class="aq-face-name">Chris</div><div class="aq-face-sub">All-on-X patient</div></div></li>
        <li class="aq-face-item"><div class="aq-face-static"><div class="aq-face-ph">${img('aq-face-img-l', IMG.theresaBefore, 'Theresa before implant treatment')}${img('aq-face-img-r', IMG.theresaAfter, 'Theresa after implant treatment')}<div class="aq-face-tag">Before</div><div class="aq-face-tag-r">After</div></div><div class="aq-face-name">Theresa</div><div class="aq-face-sub">Before and after</div></div></li>
      </ul>
    </div>
  </div>
</section>`;

  const rRow = (item) => `<div class="aq-r-row"><div class="aq-r-item">${item}</div><div class="aq-r-val">Included</div></div>`;
  const price = `<section class="aq-sec" id="price">
  <div class="aq-price-grid">
    <div class="aq-price-copy">
      <h2 class="aq-h2">One arch, one price, written down.</h2>
      <p class="aq-price-p">Most full-arch offices won’t give you a number until you’re in the chair. We publish ours, and at your free consultation you get it on paper, with nothing added that hasn’t been explained to you first.</p>
      <p class="aq-price-p">The practice’s published fee is more than $10,000 below the national implant chains advertised on TV.*</p>
      <div class="aq-partners">
        <div class="aq-partners-title">Monthly payments</div>
        <p class="aq-partners-p">CareCredit, Cherry, Sunbit, PatientFi, Proceed Finance and LendingClub, plus cash, check and card.</p>
      </div>
      <div class="aq-budget">
        <div class="aq-budget-title">Working with a tighter budget?</div>
        <p class="aq-budget-p">Snap-on implant dentures start at $5,995 for the lower arch. They’re removable, but much more stable than regular dentures. Ask about them at your consultation.</p>
      </div>
      <div class="aq-price-cta"><a class="aq-btn-gold" href="#quiz" data-to-quiz="1" data-loc="price">See if I qualify</a></div>
    </div>
    <div class="aq-receipt-wrap">
      <div class="aq-receipt">
        <div class="aq-r-title">Written treatment estimate</div>
        <div class="aq-r-sub">Fixed full arch, upper or lower</div>
        <div class="aq-r-list">
          ${['Exam with Dr. Bennett', 'Cone beam 3D CT scan', 'Extractions, if needed', 'Four to six implants', 'Same-day fixed temporary teeth', 'Final zirconia arch'].map(rRow).join('\n          ')}
        </div>
        <div class="aq-r-total"><div class="aq-r-total-l">Per arch</div><div class="aq-r-total-n">${PRICE.one}</div></div>
        <div class="aq-r-month">or from ${PRICE.oneMo}/mo with approved financing</div>
        <div class="aq-r-both">Both arches: ${PRICE.both}, or from ${PRICE.bothMo}/mo</div>
        <div class="aq-r-note">Priced separately, and only if your scan shows you need them: bone grafting and IV sedation.</div>
      </div>
    </div>
  </div>
</section>`;

  const cmpRow = (q, us, chains, general) => `<div class="aq-cmp-row" role="row"><div class="aq-cmp-q" role="rowheader">${q}</div><div class="aq-cmp-cell-us" role="cell"><div class="aq-cmp-label-us">Arvada</div><div class="aq-cmp-val">${us}</div></div><div class="aq-cmp-cell" role="cell"><div class="aq-cmp-label">National chains</div><div class="aq-cmp-val">${chains}</div></div><div class="aq-cmp-cell" role="cell"><div class="aq-cmp-label">General dentists</div><div class="aq-cmp-val">${general}</div></div></div>`;
  const compare = `<section class="aq-sec-alt" id="compare">
  <div class="aq-wrap">
    <h2 class="aq-h2">How Arvada Dental Center compares</h2>
    <p class="aq-sec-intro">Questions worth asking any office before you commit to full-arch implants.</p>
    <div class="aq-cmp" role="table" aria-label="How Arvada Dental Center compares">
      <div class="aq-cmp-head" role="row"><div class="aq-cmp-hcell" role="columnheader">Question</div><div class="aq-cmp-hcell-us" role="columnheader">Arvada Dental Center</div><div class="aq-cmp-hcell" role="columnheader">National implant chains</div><div class="aq-cmp-hcell" role="columnheader">Most general dentists</div></div>
      ${cmpRow('Is the price published?', `Yes, ${PRICE.one} per arch`, 'Often only quoted in person', 'Varies')}
      ${cmpRow('Who does your surgery and final teeth?', 'Dr. Bennett, every phase', 'Often split between a surgeon and a restoring dentist', 'Surgery is often referred out')}
      ${cmpRow('Who gives IV sedation?', 'Dr. Bennett, in the office', 'Usually available', 'Often not offered')}
      ${cmpRow('Is surgery planned on a 3D scan?', 'Every case, with a surgical guide', 'Usually', 'Varies')}
      ${cmpRow('Where are your teeth made?', 'The practice’s own lab', 'Varies', 'Usually an outside lab')}
      ${cmpRow('Who cares for you afterward?', 'The same full-service office, here since 2003', 'Mostly implant-focused', 'Your regular dentist')}
    </div>
    <p class="aq-cmp-note">A general comparison of common practice models. Individual offices vary.</p>
  </div>
</section>`;

  const quote = (text, name) => `<div class="aq-quote"><p class="aq-quote-p">${text}</p><p class="aq-quote-by"><strong class="aq-quote-name">${name}</strong>, Google review</p></div>`;
  const results = `<section class="aq-sec" id="results">
  <div class="aq-wrap">
    <h2 class="aq-h2">Real Arvada patients, real full-arch results</h2>
    <p class="aq-sec-intro">These cases come from the practice’s own patient gallery. Your result depends on your scan, your bone and your health, which is exactly what the free consultation tells you.</p>
    <div class="aq-results-grid">
      <div class="aq-ba">
        <div class="aq-ph-wide">${img('aq-ph-img', IMG.chris, 'Chris, an All-on-X patient, holding a photo of his teeth before treatment')}<div class="aq-ph-tag">All-on-X patient</div></div>
        <div class="aq-ph-sq">${img('aq-ph-img-woman', IMG.woman, 'An Arvada Dental Center patient holding a photo of her teeth before treatment')}</div>
        <div class="aq-ph-sq">${img('aq-ph-img-wick', IMG.wickFrame, 'Wick holding a photo of his teeth before treatment')}</div>
        <p class="aq-ba-cap">Arvada Dental Center patients. Individual results vary.</p>
      </div>
      <div class="aq-quotes">
        ${quote('“My first visit and I was extremely impressed. A clear plan was put together, including personal input from Dr. Bennett. Pricing was fully transparent, no hidden surprises expected.”', 'Rick Willcox')}
        ${quote('“Came in for consultation about an implant. The employee who helped me, Justeen, was very accommodating and helpful.”', 'Dean Brancucci')}
      </div>
    </div>
  </div>
</section>`;

  const stepItem = (n, title, when, text, last) => `<li class="${last ? 'aq-step-last' : 'aq-step'}"><div class="aq-step-num">${n}</div>${last ? '' : '<div class="aq-step-line"></div>'}<h3 class="aq-step-title">${title}</h3>${when ? `<div class="aq-when">${when}</div>` : ''}<p class="aq-step-p">${text}</p></li>`;
  const steps = (cls, items) => `<ol${list} class="${cls}">
      ${items.map((s, i) => stepItem(i + 1, s[0], s[1], s[2], i === items.length - 1)).join('\n      ')}
    </ol>`;
  const process = `<section class="aq-sec-alt" id="process">
  <div class="aq-wrap">
    <h2 class="aq-h2">From first call to final smile</h2>
    <p class="aq-sec-intro">Two main visits with healing in between. You’re never without teeth at any stage.</p>
    ${steps('aq-steps', [
      ['Free consultation and 3D scan', 'Your first visit', 'Dr. Bennett examines you, takes a cone beam CT scan and tells you plainly what’s possible. You leave with a written plan and price, and no pressure to book that day.'],
      ['Surgery day', 'One appointment, under sedation', 'Any failing teeth are removed and four or more implants are placed from a guided plan. Most patients go home the same day with fixed temporary teeth.'],
      ['Healing', 'About 3 to 5 months', 'Expect mild soreness for three to five days and a soft diet at first. We check in as the implants fuse with your jawbone.'],
      ['Your final zirconia arch', 'After healing', 'Your permanent arch is finished in the practice’s in-house lab, matched to your face and smile, and fitted by Dr. Bennett.'],
    ])}
  </div>
</section>`;

  const docItem = (t) => `<li class="aq-doc-item">${svgCheck('aq-ck-a', '#ffffff')}<div class="aq-doc-item-text">${t}</div></li>`;
  const doctor = `<section class="aq-sec" id="doctor">
  <div class="aq-doc">
    <div class="aq-doc-ph">${img('aq-doc-img', IMG.bennett, 'Dr. Gregory Bennett')}</div>
    <div class="aq-doc-copy">
      <h2 class="aq-h2">The doctor who plans your case is the one who places it</h2>
      <p class="aq-doc-p">Dr. Gregory Bennett has practiced since 2001 and has cared for patients on Wadsworth Blvd since 2003. He handles every phase of a full-arch case himself, so you’re never handed between offices.</p>
      <ul${list} class="aq-doc-list">
        ${['University of Iowa dental graduate, 2001', 'Certified in moderate IV sedation, with annual ACLS renewal', 'Thousands of implants placed and restored', '5280 Magazine Top Dentist', 'Cone beam 3D imaging and an in-house lab'].map(docItem).join('\n        ')}
      </ul>
      <div class="aq-doc-quote"><p class="aq-doc-quote-p">“Most dentists tell you what you need. I’d rather help you understand why.”</p><div class="aq-doc-quote-by">Dr. Gregory Bennett</div></div>
    </div>
  </div>
</section>`;

  const qa = (q, a) => `<details class="aq-faq-item"><summary class="aq-faq-q"><div class="aq-faq-q-text">${q}</div><div class="aq-faq-chev"></div></summary><div class="aq-faq-a">${a}</div></details>`;
  const faq = `<section class="aq-sec-alt" id="faq">
  <div class="aq-wrap">
    <h2 class="aq-h2">Questions people ask before they call</h2>
    <div class="aq-faq">
      ${[
        ['Will I ever be without teeth?', 'No. Extractions and implant placement happen in the same visit, and most patients go home with fixed temporary teeth that day. Your permanent zirconia arch goes in after three to five months of healing.'],
        ['Some offices advertise permanent teeth in 24 hours. Why is my final arch made later?', 'Your gums and bone change shape as they heal after extractions and implant placement. Making your final zirconia arch after that healing means it’s fitted to your mouth as it will be long-term. Until then you wear fixed temporary teeth, so you’re never without a smile.'],
        ['Does it hurt?', 'Dr. Bennett gives IV sedation himself, so you’re comfortable and relaxed during surgery. Most patients have mild soreness and swelling for three to five days, managed with medication.'],
        ['I’ve been told I don’t have enough bone. Can I still get implants?', 'Often, yes. Implants can be angled to use the bone you have, and Dr. Bennett decides how many to place from your 3D scan. For severe upper-jaw bone loss, zygomatic implants are another option. The scan at your free consultation gives you a real answer.'],
        [`What does ${PRICE.one} include?`, 'Your exam, 3D CT scan, any extractions, four to six implants, same-day fixed temporary teeth and your final zirconia arch. Bone grafting and IV sedation are priced separately, and only if you need them. You’ll have the full number in writing before you commit to anything.'],
        ['Can I pay monthly?', `Yes. With approved financing, one arch starts at about ${PRICE.oneMo} a month. The practice works with CareCredit, Cherry, Sunbit, PatientFi, Proceed Finance and LendingClub, and your coordinator will talk through options at your consultation.`],
        ['Will my insurance help?', 'Some dental plans contribute toward implant treatment. The team checks your benefits before treatment and applies whatever your plan covers.'],
        ['Am I too old for this?', 'There’s no upper age limit. Patients in their 70s and 80s have this treatment regularly. Your general health and bone matter far more than your age.'],
        ['How long does it last?', 'With good care and regular checkups, the implants are designed to last decades. The zirconia arch may need an evaluation after 15 to 20 years of normal wear.'],
      ].map(([q, a]) => qa(q, a)).join('\n      ')}
    </div>
  </div>
</section>`;

  const HOURS = 'Monday to Friday, 8am to 5pm. 6695 Wadsworth Blvd, Arvada, CO 80003.';
  const LEGAL_NOTE = '<p class="aq-legal-p">The free consultation is for new implant patients. Individual results vary. Nothing on this page is a diagnosis; candidacy is determined at a clinical exam with 3D imaging.</p>';
  const foot = (legalPrice, sticky) => `<footer class="aq-foot">
  <div class="aq-foot-grid">
    <div class="aq-foot-col"><div class="aq-foot-title">Arvada Dental Center &amp; Implants</div><div class="aq-foot-text">6695 Wadsworth Blvd</div><div class="aq-foot-text">Arvada, CO 80003</div></div>
    <div class="aq-foot-col"><div class="aq-foot-title">Hours</div><div class="aq-foot-text">Monday to Friday, 8am to 5pm</div><a class="aq-foot-link" href="tel:${PHONE.tel}" data-loc="footer">${PHONE.display}</a></div>
    <div class="aq-legal">
      ${legalPrice ? `<p class="aq-legal-p">${legalPrice}</p>` : ''}${LEGAL_NOTE}
      <div class="aq-legal-links"><a class="aq-foot-link" href="https://www.arvadadentalcenter.com/privacy-policy" target="_blank" rel="noopener">Privacy policy</a><a class="aq-foot-link" href="https://www.arvadadentalcenter.com/sms-terms-and-conditions" target="_blank" rel="noopener">SMS terms</a></div>
    </div>
  </div>${sticky ? '\n  <div class="aq-sticky-space" aria-hidden="true"></div>' : ''}
</footer>`;
  const PRICE_NOTE = (items, star) => `${PRICE.one} is the practice’s published fee for one fixed full arch, upper or lower, and includes ${items}. Bone grafting and IV sedation are not included and are quoted only if needed. Monthly amounts are estimates with approved financing; terms vary by lender.${star ? ' *Practice’s comparison with national implant chains advertised on TV.' : ''}`;

  const page = (inner) => `<div class="aq-page">\n${inner}\n</div>`;

  const landing = page(`${topbar}
<main class="aq-main">
${hero('All-on-X implants in Arvada, CO',
    `<h1 class="aq-h1" id="hl" data-hl-dentures="Done with dentures? Fixed teeth in a day." data-hl-failing="Failing teeth? Leave with a fixed smile the same day." data-hl-price="Full-arch implants for ${PRICE.one} per arch, in writing." data-hl-monthly="Fixed teeth in a day, from ${PRICE.oneMo} a month.">Fixed teeth in a day. A real price before you sit down.</h1>`,
    `Dr. Gregory Bennett plans, places and restores your new smile under one roof. One arch is <strong class="aq-lede-strong">${PRICE.one}</strong>, or from <strong class="aq-lede-strong">${PRICE.oneMo} a month</strong> with approved financing.`)}
${creds}
${faces('Patients who were where you are now')}
${price}
${compare}
${results}
${process}
${doctor}
${faq}
<section class="aq-final" id="final">
  <div class="aq-wrap">
    <h2 class="aq-h2-final">Find out what your new smile would cost, in writing.</h2>
    <p class="aq-final-p">A free consultation, a 3D scan and a written plan. If implants aren’t right for you, Dr. Bennett will tell you.</p>
    <div class="aq-actions"><a class="aq-btn-gold" href="#quiz" data-to-quiz="1" data-loc="final">See if I qualify</a><a class="aq-btn-ghost" href="tel:${PHONE.tel}" data-loc="final">Call ${PHONE.display}</a></div>
    <p class="aq-final-hours">${HOURS}</p>
  </div>
</section>
</main>
${foot(PRICE_NOTE('the items listed above', true), true)}
<div class="aq-sticky" id="sticky"><a class="${linkBlock('aq-sticky-call')}" href="tel:${PHONE.tel}" data-loc="sticky" aria-label="Call ${PHONE.display}">${svgPhone}<div class="aq-btn-text">Call</div></a><a class="aq-sticky-cta" href="#quiz" data-to-quiz="1" data-loc="sticky">See if I qualify</a></div>`);

  const consult = page(`${topbar}
<main class="aq-main">
${hero('Free All-on-X consultation in Arvada, CO',
    '<h1 class="aq-h1">Book your free consultation and 3D scan.</h1>',
    `Four quick questions, then our implant coordinator calls to set your visit with Dr. Gregory Bennett. One arch is <strong class="aq-lede-strong">${PRICE.one}</strong>, confirmed in writing after your scan.`)}
${creds}
<section class="aq-sec" id="visit">
  <div class="aq-wrap">
    <h2 class="aq-h2">What your free consultation includes</h2>
    <p class="aq-sec-intro">One visit, no cost, and no pressure to book that day.</p>
    ${steps('aq-steps-3', [
      ['An exam with Dr. Bennett', '', 'Dr. Bennett examines you and tells you plainly what’s possible. If implants aren’t right for you, he will tell you.'],
      ['A cone beam 3D CT scan', '', 'Every case is planned on a 3D scan. It is how Dr. Bennett decides how many implants to place.'],
      ['A written plan and price', '', 'You leave with the full number on paper, with nothing added that hasn’t been explained to you first.'],
    ])}
  </div>
</section>
<section class="aq-final" id="final">
  <div class="aq-wrap">
    <h2 class="aq-h2-final">Rather talk it through first?</h2>
    <p class="aq-final-p">Call and our implant coordinator will answer your questions and book your free consultation.</p>
    <div class="aq-actions"><a class="aq-btn-gold" href="tel:${PHONE.tel}" data-loc="consult_final">Call ${PHONE.display}</a></div>
    <p class="aq-final-hours">${HOURS}</p>
  </div>
</section>
</main>
${foot(PRICE_NOTE('your exam, 3D CT scan, any extractions, four to six implants, same-day fixed temporary teeth and your final zirconia arch', false), false)}`);

  const thanks = page(`${topbar}
<main class="aq-main">
<section class="aq-ty">
  <div class="aq-wrap">
    <svg class="aq-done-icon" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24.5" fill="none" stroke="currentColor" stroke-width="2.5"></circle><path d="M15 27l7 7 15-16" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
    <h1 class="aq-h1-center" id="ty-title">Request received.</h1>
    <p class="aq-ty-lede">Our implant coordinator will call you to set your free consultation.</p>
    <p class="aq-ty-save">Rather not wait? Call us.</p>
    <a class="aq-ty-phone" href="tel:${PHONE.tel}" data-loc="thank_you_number">${PHONE.display}</a>
    <div class="aq-actions"><a class="${linkBlock('aq-btn-gold')}" href="tel:${PHONE.tel}" data-loc="thank_you">${svgPhone}<div class="aq-btn-text">Call now instead</div></a><a class="aq-btn-ghost" href="${PREQUAL}" target="_blank" rel="noopener" data-loc="thank_you">Prequalify with Cherry</a></div>
    <p class="aq-ty-hours">Office hours are Monday to Friday, 8am to 5pm. Requests sent after hours get a call the next business morning.</p>
  </div>
</section>
<section class="aq-sec" id="next">
  <div class="aq-wrap">
    <h2 class="aq-h2">What happens next</h2>
    <p class="aq-sec-intro">Three steps, and you’re never asked to commit before you have the full number in writing.</p>
    ${steps('aq-steps-3', [
      ['We call you', 'During office hours', 'Our implant coordinator finds a time that works for you. Want to know your monthly payment before your visit? Prequalifying with Cherry takes a few minutes.'],
      ['Free consultation and 3D scan', 'Your first visit', 'Dr. Bennett examines you, takes a cone beam CT scan and tells you plainly what’s possible.'],
      ['A written plan and price', 'Before you decide anything', 'You leave with a written plan and price, and no pressure to book that day.'],
    ])}
  </div>
</section>
${faces('While you wait, hear it from patients')}
</main>
${foot('', false)}`);

  return { landing, consult, thanks };
}

/* ==========================================================================
   Checks on the source, before anything is written
   ========================================================================== */
const css = readFileSync(join(HERE, 'wf.css'), 'utf8');
const codeCss = readFileSync(join(HERE, 'code.css'), 'utf8');
const js = readFileSync(join(HERE, 'site.js'), 'utf8');
const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');

// The dialect. Each of these is an outright error in data_whtml_builder, or worse, a silent drop.
const problems = [];
for (const m of bare.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
  const sel = m[1].trim(), body = m[2];
  if (!/^\.aq-[\w-]+(:hover|:focus)?$/.test(sel)) problems.push(`selector is not a single class: ${sel}`);
  if (/\b(var|clamp|min|max|calc)\(/.test(body.replace(/minmax\(/g, ''))) problems.push(`CSS function in ${sel}`);
  for (const d of body.split(';')) {
    const v = d.split(':').slice(1).join(':').trim();
    if (/\s/.test(v) && v.replace(/\([^)]*\)/g, '').split(/[\s,]+/).includes('0')) problems.push(`bare 0 in a multi-value property: ${sel} {${d.trim()}}`);
  }
}
for (const m of bare.matchAll(/@media([^{]+)\{/g)) if (!/^ screen and \(max-width: (991|767|479)px\) $/.test(m[1])) problems.push(`media query not in the accepted form: @media${m[1]}`);
const defined = new Set([...bare.matchAll(/\.(aq-[\w-]+)/g)].map((m) => m[1]));

const wf = markup('wf'), local = markup('local');
// One class per element, and every class has a rule: a class with no rule is dropped without a word.
const used = new Set();
for (const [key, html] of Object.entries(wf)) {
  for (const m of html.matchAll(/class="([^"]*)"/g)) {
    const c = m[1].trim().split(/\s+/);
    if (c.length !== 1) problems.push(`${key}: element with ${c.length} classes: ${m[1]}`);
    for (const x of c) { used.add(x); if (!defined.has(x)) problems.push(`${key}: class ${x} has no rule in wf.css`); }
  }
  if (/style="/.test(html)) problems.push(`${key}: inline style`);
}
// Webflow builds the form wrapper and the checkbox label itself; push-native.mjs puts these three on them.
const POST = new Set(['aq-form-wrap', 'aq-check', 'aq-check-text']);
for (const d of defined) if (!used.has(d) && !POST.has(d)) problems.push(`wf.css rule .${d} is used by no element`);
if (problems.length) { console.error([...new Set(problems)].join('\n')); process.exit(1); }

/* ==========================================================================
   Write
   ========================================================================== */
mkdirSync(join(OUT, 'assets'), { recursive: true });
mkdirSync(WF, { recursive: true });
const put = (dir, name, text) => { writeFileSync(join(dir, name), text); console.log(`  ${name}  ${text.length} bytes`); };

// The live site's stylesheet, so the local page sits in the same document the
// published one does. Not committed; re-fetch with --refresh-host.
const HOST = join(OUT, 'assets/host.css');
if (!existsSync(HOST) || process.argv.includes('--refresh-host')) {
  const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' };
  const home = await (await fetch(SITE, { headers: UA })).text();
  const href = home.match(/https:\/\/cdn\.prod\.website-files\.com\/[^"]+\.css[^"]*/)?.[0];
  if (!href) throw new Error('site stylesheet link not found on ' + SITE);
  // Our own classes are in the published sheet once this build has been pushed; drop them so
  // the local page is styled by wf.css alone and a stale published rule cannot mask an edit.
  const sheet = (await (await fetch(href, { headers: UA })).text()).replace(/\.aq-[\w-]+(?::[\w-]+)?\{[^}]*\}/g, '');
  put(join(OUT, 'assets'), 'host.css', sheet);
}

const META = {
  landing: { slug: SLUG.landing, title: 'All-on-X Full-Arch Implants in Arvada, CO | Arvada Dental Center & Implants',
    description: `Fixed full-arch teeth, often in a single day. ${PRICE.one} per arch, in writing. Free consultation and 3D scan with Dr. Gregory Bennett in Arvada, CO.` },
  consult: { slug: SLUG.consult, title: 'Book a Free All-on-X Consultation in Arvada, CO | Arvada Dental Center & Implants',
    description: 'Four quick questions and our implant coordinator calls to set your free consultation and 3D scan with Dr. Gregory Bennett in Arvada, CO.' },
  thanks: { slug: SLUG.thanks, title: 'Request Received | Arvada Dental Center & Implants',
    description: 'Your consultation request is in. Our implant coordinator will call you.' },
};
const esc = (s) => s.replace(/&/g, '&amp;');

put(join(OUT, 'assets'), 'wf.css', css);
put(join(OUT, 'assets'), 'code.css', codeCss);
put(join(OUT, 'assets'), 'site.js', js);
put(WF, 'classes.css', bare.replace(/\n\s*\n/g, '\n').trim() + '\n');

const head = `<meta name="robots" content="noindex">\n<style>\n${codeCss.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n\s*\n/g, '\n').trim()}\n</style>`;
const footer = `<script>\n${js.trim()}\n</script>`;
for (const key of Object.keys(META)) {
  const m = META[key];
  put(OUT, m.slug + '.html', `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(m.title)}</title>
<meta name="description" content="${esc(m.description)}">
<meta name="robots" content="noindex">
<link rel="stylesheet" href="assets/host.css">
<link rel="stylesheet" href="assets/wf.css">
<link rel="stylesheet" href="assets/code.css">
</head>
<body>
${local[key]}
<script src="assets/site.js"></script>
</body>
</html>
`);
  put(WF, `${key}.body.html`, wf[key] + '\n');
}
put(WF, 'head.html', head);
put(WF, 'footer.html', footer);
put(WF, 'manifest.json', JSON.stringify({ pages: META, consent: 'Text me about my consultation. Message and data rates may apply. Reply STOP to opt out. Consent isn’t required to book.', submit: 'Request my free consultation', wait: 'Sending your request…', images: IMG }, null, 1) + '\n');
