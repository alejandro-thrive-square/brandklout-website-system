/**
 * Build the six paid-traffic routes under /ads-landing-pages/.
 *
 * The information flow is Livewell's ads-landing-pages set (the agency's
 * reference), rebuilt in Mason Park's own design system:
 *
 *   landing       hero with the form in it -> the journey (four moves, pinned)
 *                 -> why here (+ who it is for) -> the dentist -> the path
 *                 (pinned, sideways) -> the proof (+ the rooms) -> questions
 *                 -> the invitation (offer, phone, map, credentials, disclaimer)
 *   consultation  the form, first -> hear from our patients -> one dentist,
 *                 start to finish (+ credentials, disclaimer) -> the invitation
 *   thank you     the phone, first -> what to expect on the call (+ why not to
 *                 wait) -> why Mason Park -> questions -> the invitation
 *
 * Every CTA on a landing page goes to its consultation page, as Livewell's
 * do; the hero form is there for the visitor who is already decided. Both
 * thank-you pages carry no form.
 *
 *   node .tmp/build-ads-landing-pages.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOME = path.join(HERE, "..", "home");
const OUT = path.join(HOME, "ads-landing-pages");
const A = "../../assets/"; // every route sits two folders under home/
const BASE = "/ads-landing-pages/";
const PHONE = "(281) 769-8878";
const TEL = "tel:+12817698878";
const MAPS = "https://www.google.com/maps/place/21830+Kingsland+Blvd+%23104a,+Katy,+TX+77450";
const MAP_EMBED = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3463.0585305167815!2d-95.75121988455305!3d29.775949038160515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86412740e7dd5def%3A0xfa1ab8c6e696e133!2sMason%20Park%20Dental%20-%20Katy%20Dentist!5e0!3m2!1sen!2sus!4v1638807674675!5m2!1sen!2sus";

// ---------------------------------------------------------------- frames
// Every photograph on these pages is one the site already ships, at the four
// srcset widths frame.mjs writes. Alt text comes from the album manifest; the
// stock frames the treatment pages use carry their own here.
const UPLOADS = path.join(HOME, "assets", "uploads", "2026", "09");
const FR = {};
for (const f of fs.readdirSync(UPLOADS)) {
  const m = f.match(/^mp-(.+)-(\d+)x(\d+)\.(jpg|png|webp)$/);
  if (!m) continue;
  (FR[m[1]] ??= { ext: m[4], sizes: [] }).sizes.push([+m[2], +m[3]]);
}
for (const k in FR) FR[k].sizes.sort((a, b) => a[0] - b[0]);
// The manifest is an object keyed by frame, not a list.
for (const [key, it] of Object.entries(JSON.parse(fs.readFileSync(path.join(HERE, "album-manifest.json"), "utf8")))) {
  if (FR[key]) FR[key].alt = it.alt;
}
Object.assign(FR["stock-aligner-fit"], { alt: "A clear aligner being seated over the teeth" });
Object.assign(FR["stock-aligner"], { alt: "A clear aligner held up to the light" });

function img(key, sizes, o = {}) {
  const f = FR[key];
  if (!f) throw new Error(`no frame ${key}`);
  const alt = o.alt || f.alt;
  if (!alt) throw new Error(`no alt for ${key}`);
  const [W, H] = f.sizes[f.sizes.length - 1];
  const file = (w, h) => `${A}uploads/2026/09/mp-${key}-${w}x${h}.${f.ext}`;
  const srcset = f.sizes.map(([w, h]) => `${file(w, h)} ${w}w`).join(", ");
  const load = o.eager ? `fetchpriority="high"` : `loading="lazy"`;
  return `<img src="${file(W, H)}" srcset="${srcset}" sizes="${sizes}" alt="${alt}" width="${W}" height="${H}" ${load} decoding="async">`;
}

const BADGES = `<div class="pr-badges">
    <div class="pr-badges-in">
      <p class="pr-badges-label">Credentialed by</p>
      <ul>
        <li><img src="${A}uploads/2023/08/kois-1.webp" alt="Kois Center" loading="lazy" decoding="async"></li><li class="is-mark"><img src="${A}uploads/2023/08/ssc-1.webp" alt="Seattle Study Club" loading="lazy" decoding="async"></li><li class="is-mark"><img src="${A}uploads/2023/08/aapd.webp" alt="American Academy of Pediatric Dentistry" loading="lazy" decoding="async"></li><li><img src="${A}uploads/2023/08/abpd-1.webp" alt="American Board of Pediatric Dentistry - Board Certified" loading="lazy" decoding="async"></li>
      </ul>
    </div>
  </div>`;

// --------------------------------------------------------------- reviews
// Google reviews the practice's own patients left, shown whole and under
// their own names, as the reviews page shows them.
const R = {
  metheVee: ["MeTheVee", "Amazing and attentive care from all the staff! Really felt valued during my visit. The cleaning and exams were quick and efficient. Also got info on invisalign which looks way comfortable and easy. Can&rsquo;t wait to start my treatment and keep coming back for routine cleanings!"],
  amy: ["Amy P", "Dr. Cho and his team are fantastic. They are thoughtful and kind. Always making sure you are okay. It&rsquo;s easy to see how much they care about their patients. The attention to detail is impressive, whether it&rsquo;s for invisalign or teeth whitening. Recently got dental veneers, and I&rsquo;m loving the new smile. They really go above and beyond to make sure of your comfort."],
  toyin: ["Oluwatoyin Dominic", "Had my cleaning and exams today, and the staff was super friendly. They explained everything in detail and made me feel at ease. Not just a routine visit, more like a mini spa for my teeth. A great feeling knowing they really look after your health too. Highly suggest making this place your go to."],
  glenn: ["Glenn Adrian De La Garza", "Had a very good time at the dental office. The cleaning was thorough and Genevieve did an amazing job! The high tech tools made me feel at ease. It&rsquo;s a calm atmosphere, which is just what anyone needs before a visit. Definitely a convenient place for dental care. Highly recommend it for anyone needing cleaning and exams."],
  gabriel: ["Gabriel Sanchez", "Very friendly staff and were willing to help in every way! Felt more comfortable here than at any other dentist office in the past, highly recommend!"],
  jocelyne: ["Jocelyne Lara", "I was recommend by another dentist who didn&rsquo;t accept my insurance anymore. First time experience was amazing, went in for a cleaning with Genevieve and she was amazing. She was very informing and kind with what she was doing. Will continue to keep coming back :)"],
  melissa: ["Melissa Merino", "Found our family dentist!"],
  reem: ["Reem Almekhlafi", "The staff here is super friendly and informative. Just had my cleaning and exams done, and they were thorough without being rough. The dental filling went really well, didn&rsquo;t hurt one bit, and they took extra care to ensure it looked great. Overall, a very clear and calm vibe in the office. Highly recommend checking them out for your family dentistry needs."],
  md: ["MD The Cooking Doctor", "Tiffany was &ldquo;extremely&rdquo; informative with regards to providing critical information for my dental care. She kept me informed with everything she was doing and answered all my questions. This was one of the BEST dental experience I&rsquo;ve had. Thanks for the exceptional services provided!!!!"],
  anjana: ["anjana dade", "Really quick and easy, i was in and out for a teeth cleaning and loved every second. i am i first time customer and i will be returning soon. Doctor Tiffany and Dr Cho were VERY helpful and nice, accommodating my needs and request!"],
};

// ---------------------------------------------------------------- shared
const plain = (s) => s
  .replace(/<[^>]+>/g, "")
  .replace(/&rsquo;/g, "’").replace(/&lsquo;/g, "‘").replace(/&ldquo;/g, "“").replace(/&rdquo;/g, "”")
  .replace(/&reg;/g, "®").replace(/&ndash;/g, "–").replace(/&ouml;/g, "ö").replace(/&amp;/g, "&").replace(/&#8209;/g, "-")
  .replace(/\s+/g, " ").trim();

const jsonld = (o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;

const ORG = {
  "@context": "https://schema.org", "@type": "Dentist", "name": "Mason Park Dental of Katy",
  "url": "https://www.masonparkdental.com/", "telephone": PHONE,
  "address": { "@type": "PostalAddress", "streetAddress": "21830 Kingsland Blvd #104A", "addressLocality": "Katy", "addressRegion": "Texas", "postalCode": "77450", "addressCountry": "US" },
  "openingHoursSpecification": [
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday"], "opens": "09:00", "closes": "18:00" },
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Thursday"], "opens": "09:00", "closes": "17:00" },
  ],
  "sameAs": ["https://www.facebook.com/p/Mason-Park-Dental-100083179359693/"],
};

const faqLd = (faq) => jsonld({
  "@context": "https://schema.org", "@type": "FAQPage",
  "mainEntity": faq.map(([q, a]) => ({ "@type": "Question", "name": plain(q), "acceptedAnswer": { "@type": "Answer", "text": plain(a) } })),
});

function head({ slug, title, description, extraLd = "" }) {
  const canonical = `https://www.masonparkdental.com${BASE}${slug}/`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="noindex, follow">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${canonical}">

<meta name="theme-color" content="#8c6349">
<link rel="icon" href="${A}uploads/2026/09/mp-favicon-48.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Karla:wght@500;700&amp;family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;1,6..72,300;1,6..72,400&amp;family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700&amp;display=swap">
<link rel="stylesheet" href="${A}site.css">
${jsonld(ORG)}
${extraLd}
</head>
<body class="has-journey is-lp-page">
<div class="page-wrapper">
<a class="visually-hidden" href="#main">Skip to content</a>
<div class="topbar_component">
  <span><a href="${MAPS}" target="_blank" rel="noopener">21830 Kingsland Blvd #104A, Katy TX</a></span>
  <span class="topbar_note">Mon&ndash;Wed 9-6 &middot; Thu 9-5 &middot; Fri&ndash;Sun closed</span>
  <span><a href="${TEL}">${PHONE}</a></span>
</div>`;
}

function header({ ctaHref, ctaLabel, ctaShort }) {
  return `<header class="navbar_component">
  <div class="padding-global"><div class="container-xlarge">
    <div class="navbar_container">
      <a class="navbar_logo-link" href="/" aria-label="Mason Park Dental of Katy home">
        <img src="${A}uploads/2026/09/mp-logo-nav-422x180.png" class="navbar_logo" alt="Mason Park Dental of Katy" width="422" height="180" fetchpriority="high" decoding="async">
      </a>
      <div class="navbar_actions">
        <a class="navbar_phone" href="${TEL}">${PHONE}</a>
        <a class="button lp-nav_cta" href="${ctaHref}"><span class="lp-cta_long">${ctaLabel}</span><span class="lp-cta_short">${ctaShort}</span></a>
      </div>
    </div>
  </div></div>
</header>
<main class="main-wrapper" id="main">`;
}

function footer({ bookHref, bookLabel }) {
  return `</main>

<footer class="footer_component section_footer">
  <div class="padding-global"><div class="container-xlarge"><div class="padding-section-large">
    <div class="footer_grid">
      <div>
        <img src="${A}uploads/2023/08/Dentist-Katy-TX-Logo-2.webp" srcset="${A}uploads/2023/08/Dentist-Katy-TX-Logo-2-300x115.webp 300w, ${A}uploads/2023/08/Dentist-Katy-TX-Logo-2-370x142.webp 370w" sizes="176px" class="footer_logo" alt="Mason Park Dental of Katy" width="406" height="156" loading="lazy" decoding="async">
        <ul class="footer_list">
          <li><a href="${MAPS}" target="_blank" rel="noopener">21830 Kingsland Blvd #104A<br>Katy, TX 77450</a></li>
          <li><a href="${TEL}">${PHONE}</a></li>
          <li><a href="mailto:office@masonparkdental.com">office@masonparkdental.com</a></li>
          <li><a href="https://www.facebook.com/p/Mason-Park-Dental-100083179359693/" target="_blank" rel="noopener">Facebook</a></li>
        </ul>
      </div>
      <div>
        <h3 class="footer_heading">Care</h3>
        <ul class="footer_list"><li><a href="/our-services/">All services</a></li><li><a href="/services/invisalign/">Invisalign&reg; Treatment</a></li><li><a href="/new-patients/">New patients</a></li><li><a href="/our-doctors/">Meet the doctors</a></li><li><a href="/technology/">Technology</a></li><li><a href="/about-us/">About the practice</a></li></ul>
      </div>
      <div>
        <h3 class="footer_heading">Patients</h3>
        <ul class="footer_list"><li><a href="/financing/">Financing</a></li><li><a href="/dental-savings-plan/">Dental savings plan</a></li><li><a href="/patient-reviews/">Patient reviews</a></li><li><a href="/special-offers/">Special offers</a></li><li><a href="/patient-resources/">Patient resources</a></li><li><a href="${bookHref}">${bookLabel}</a></li></ul>
      </div>
      <div>
        <h3 class="footer_heading">Hours</h3>
        <ul class="hours_list">
    <li class="hours_row"><span>Monday</span><strong>9am - 6pm</strong></li><li class="hours_row"><span>Tuesday</span><strong>9am - 6pm</strong></li><li class="hours_row"><span>Wednesday</span><strong>9am - 6pm</strong></li><li class="hours_row"><span>Thursday</span><strong>9am - 5pm</strong></li><li class="hours_row"><span>Friday</span><strong>Closed</strong></li><li class="hours_row"><span>Saturday</span><strong>Closed</strong></li><li class="hours_row"><span>Sunday</span><strong>Closed</strong></li>
  </ul>
      </div>
    </div>
    <div class="footer_legal">
      &copy; 2026 Mason Park Dental of Katy &middot; <a href="/privacy-policy/">Privacy Policy</a> &middot; <a href="/terms-of-service/">Terms of Service</a> &middot; <a href="/faq/">FAQs</a> &middot; <a href="/sitemap/">Sitemap</a> &middot; <a href="/contacts/">Contact</a>
    </div>
  </div></div></div>
</footer>`;
}

function rail(label, primaryHref, primaryLabel, single = false) {
  return single
    ? `<aside class="lp-rail is-single" aria-label="Call the practice">
  <span>${label}</span>
  <a class="button" href="${TEL}">Call ${PHONE}</a>
</aside>`
    : `<aside class="lp-rail" aria-label="Consultation actions">
  <span>${label}</span>
  <a href="${TEL}">Call</a>
  <a class="button" href="${primaryHref}">${primaryLabel}</a>
</aside>`;
}

const SCRIPTS = `<a class="callbar_component" href="${TEL}">Call ${PHONE}</a>
</div>
<script src="${A}site.js" defer></script>
<script src="${A}gsap/gsap.min.js" defer></script>
<script src="${A}gsap/ScrollTrigger.min.js" defer></script>
<script src="${A}gsap/SplitText.min.js" defer></script>
<script src="${A}journey.js" defer></script>
<script src="${A}elevate.js" defer></script>
</body>
</html>
`;

const tag = (name) => `<p class="chapter-tag"><i></i><b>${name}</b></p>`;

function formCard(c) {
  return `<div class="lp-form-card" id="form">
      <p class="lp-form-kicker">${c.form.kicker}</p>
      <h3 class="lp-form-title">${c.form.title}</h3>
      <p class="lp-form-lede">${c.form.lede}</p>
      <div class="lp-form-slot" data-ghl-form="${c.formId}" data-ghl-name="${c.formName}" data-ghl-height="${c.formHeight}">
        <p>Contact form</p>
        <small>The live form is inserted by Instatic at import.</small>
      </div>
      <p class="lp-form-note">By submitting, you agree that Mason Park Dental may contact you about this request. No obligation, and nothing is booked until you say so.</p>
    </div>`;
}

const chip = ([name, text]) => `<blockquote class="pr-chip">
        <p>${text}</p>
        <cite>${name}</cite>
      </blockquote>`;

function proofChapter(n, c, { lead, rail: chips, place = true, note = false, headline }) {
  return `<section class="ch ch-proof" id="proof" data-chapter="${n}" data-chapter-name="The Proof" data-theme="warm">
  <div class="wrap rg-head">
    ${tag("The Proof")}
    <h2 data-split>${headline}</h2>
  </div>
  <div class="wrap pr-lead">
    <figure class="pr-quote">
      <span class="pr-mark" aria-hidden="true">&#8220;</span>
      <blockquote id="proofQuote">${lead[1]}</blockquote>
      <figcaption><span class="pr-rule" aria-hidden="true"></span>${lead[0]}<b>Google review</b></figcaption>
    </figure>
    <div class="pr-portrait" data-drift>
      ${img(c.proofImg, "(max-width: 959px) 100vw, 34vw")}
    </div>
  </div>
  <div class="pr-rail" id="serviceRail">
    <div class="pr-rail-in">
      ${chips.map(chip).join("\n      ")}
    </div>
  </div>
  <div class="wrap pr-foot">
    <a class="link-arrow" href="/patient-reviews/">All 1,037 Google reviews <span aria-hidden="true">&rarr;</span></a>${note ? `
    <p class="pr-note">Individual results vary. Every review here is a Mason Park patient&rsquo;s own words, from the practice&rsquo;s Google profile, shown whole.</p>` : ""}
  </div>${place ? `
  <div class="wrap lp-place">
    <div class="lp-place_head">
      <h3>A space designed <em>for your comfort.</em></h3>
      <p>${c.placeLede}</p>
    </div>
    <div class="el-mosaic">
      <figure class="el-mosaic_tile is-a" data-el="mask">${img(c.place[0][0], "(max-width: 767px) 100vw, 58vw")}<figcaption>${c.place[0][1]}</figcaption></figure>
      <figure class="el-mosaic_tile is-b" data-el="mask">${img(c.place[1][0], "(max-width: 767px) 58vw, 42vw")}<figcaption>${c.place[1][1]}</figcaption></figure>
      <p class="el-mosaic_copy">Suite 104A, on the ground floor. Free parking at the door.</p>
      <figure class="el-mosaic_tile is-e" data-el="mask">${img(c.place[2][0], "(max-width: 767px) 50vw, 33vw")}<figcaption>${c.place[2][1]}</figcaption></figure>
      <figure class="el-mosaic_tile is-f" data-el="mask">${img(c.place[3][0], "(max-width: 767px) 50vw, 33vw")}<figcaption>${c.place[3][1]}</figcaption></figure>
      <figure class="el-mosaic_tile is-g" data-el="mask">${img(c.place[4][0], "(max-width: 767px) 100vw, 33vw")}<figcaption>${c.place[4][1]}</figcaption></figure>
    </div>
  </div>` : ""}
</section>`;
}

function questionsChapter(n, c, headline, faq) {
  return `<section class="ch ch-questions" id="questions" data-chapter="${n}" data-chapter-name="Questions">
  <div class="wrap rg-head">
    ${tag("Questions")}
    <h2 data-split>${headline}</h2>
  </div>
  <div class="wrap iv-faq">
    <div class="iv-faq-list">
      ${faq.map(([q, a]) => `<details class="faq_item">
        <summary class="faq_question">${q}</summary>
        <div class="faq_answer">${a}</div>
      </details>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

function invitationChapter(n, c, { headline, lede, primaryHref, primaryLabel, offer, shot, legal = true }) {
  return `<section class="ch ch-invitation" id="invitation" data-chapter="${n}" data-chapter-name="The Invitation" data-theme="dark">
  <div class="wrap iv-top">
    <div class="iv-copy">
      ${tag("The Invitation")}
      <h2 data-split>${headline}</h2>
      <p class="iv-lede">${lede}</p>
      <div class="iv-actions">
        <a class="button is-lg" href="${primaryHref}">${primaryLabel}</a>
        <a class="button is-ghost-light is-lg" href="${TEL}">${PHONE}</a>
      </div>
      <dl class="iv-facts">
        <div><dt>Address</dt><dd><a href="${MAPS}" target="_blank" rel="noopener">21830 Kingsland Blvd #104A<br>Katy, TX 77450</a></dd></div><div><dt>Hours</dt><dd>Mon to Wed <b>9am to 6pm</b><br>Thu <b>9am to 5pm</b><br>Fri to Sun <b>Closed</b></dd></div><div><dt>The offer</dt><dd>${offer}</dd></div>
      </dl>
    </div>
    <div class="iv-aside">
      <figure class="iv-shot" data-el="mask">
        ${img(shot[0], "(max-width: 959px) 100vw, 42vw")}
        <figcaption>${shot[1]}</figcaption>
      </figure>
      <div class="iv-map">
        <div class="embed_component">
    <iframe data-src="${MAP_EMBED}" title="Map to Mason Park Dental of Katy" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
  </div>
      </div>
      <a class="link-arrow is-light" href="${MAPS}" target="_blank" rel="noopener">Get directions <span aria-hidden="true">&rarr;</span></a>
    </div>
  </div>${legal ? `
  ${BADGES}
  <div class="wrap lp-legal">
    <p class="lp-disclaimer">${c.disclaimer}</p>
    <p class="lp-legal_links"><a href="/privacy-policy/">Privacy Policy</a> &middot; <a href="/terms-of-service/">Terms of Service</a> &middot; <a href="/contacts/">Contact</a> &middot; <a href="/">masonparkdental.com</a></p>
  </div>` : ""}
</section>`;
}

// ------------------------------------------------------------- campaigns
const campaigns = [
  {
    key: "invisalign",
    consult: "invisalign-consultation",
    thanks: "invisalign-thank-you",
    formId: "jRr3J74MVYjrYAsp4zZD",
    formName: "Contact Form Invisalign",
    formHeight: 1583,
    railLabel: "$1,000 off Invisalign",
    cta: "Book a free consultation",
    serviceHref: "/services/invisalign/",
    serviceLabel: "Read about Invisalign treatment",
    title: "Invisalign in Katy, TX | $1,000 Off, All-Inclusive | Mason Park Dental",
    description: "Invisalign clear aligners planned on a 3D scan of your own teeth, and a free consultation with Dr. Dave Cho in Katy. $1,000 off the all-inclusive price, a further $500 when prepaid, 0% APR financing.",
    heroImg: "scanner-screen",
    hero: {
      tag: "Invisalign in Katy",
      h1: "Straighter teeth. No wires. <em>$1,000 off.</em>",
      lede: "Clear aligners planned on a 3D scan of your own teeth, and a free consultation with Dr. Dave Cho, a Tufts trained dentist experienced in cosmetic dentistry. One all-inclusive price, in writing, before you start.",
      meta: [["4.9", "Google rating"], ["$3,800", "All-inclusive"], ["0% APR", "Financing"]],
    },
    form: {
      kicker: "Free Invisalign consultation",
      title: "Start your Invisalign consultation.",
      lede: "Tell us a little about your smile. Our team will call during office hours to arrange your visit and explain the offer.",
    },
    journey: {
      h2: "From hiding it <em>to forgetting it.</em>",
      lede: "The reasons people put this off are the same in every consultation. Here is how it actually goes, in four moves.",
      stages: [
        { img: "hygienist-loupes", cap: "An adult patient in the chair, Mason Park", h3: "Life before", p: "You smile with your mouth closed. You angle away in photos. You have thought about braces, more than once, and decided you are too old for them." },
        { img: "scanner-screen-2", cap: "The scanner, and the screen you watch it on", h3: "The scan", p: "A digital scan of your teeth, no putty, and a preview of the finished smile on the screen before a single aligner is made. You see the end before the start.", q: "Got info on invisalign which looks way comfortable and easy.", by: "MeTheVee" },
        { img: "stock-aligner-fit", cap: "A clear aligner, seated", h3: "The wearing", p: "Clear trays, changed about every two weeks, out for meals and brushing. Twenty to twenty-two hours a day. Most people around you never notice.", q: "The attention to detail is impressive, whether it&rsquo;s for invisalign or teeth whitening.", by: "Amy P" },
        { img: "desk-patient-2", cap: "At the front desk, Mason Park", h3: "The finish", p: "Most patients finish in twelve to eighteen months, some in six. A retainer keeps the teeth where the aligners put them, and you stop thinking about it." },
      ],
    },
    seal: ["$1,000 off Invisalign · $500 more prepaid · 0% APR · ", "$"],
    why: {
      h2: "Why Katy patients choose Mason Park <em>for Invisalign.</em>",
      lede: "Every Invisalign office has the aligners. What differs is who plans the case, what the price includes, and whether you were shown the result before you paid for it.",
      cards: [
        ["One price, everything in it", "$3,800 after the $1,000 offer, and it includes the scan, x-rays, every aligner, refinements, retainers and K&ouml;r whitening gel. Nothing is added later."],
        ["A consultation with Dr. Dave Cho", "Your free consultation is with Dr. Dave Cho, a Tufts trained dentist experienced in cosmetic dentistry, whose calm manner puts nervous patients at ease. He tells you plainly whether Invisalign suits your teeth."],
        ["A scan, not a mouthful of putty", "The intraoral scanner maps your teeth in minutes and shows the finished smile on screen before an aligner is made."],
        ["Insurance and 0% financing, handled", "We check your orthodontic benefit before you commit. Cherry splits the balance at 0% APR with no hard credit check."],
      ],
    },
    doors: {
      h3: "Teens, adults, <em>and the honest answer.</em>",
      p: "The consultation decides which of these you are. It is free, and it is where you find out whether Invisalign is the right tool for your teeth.",
      items: [
        { img: "desk-family-2", h: "Teens", p: "Clear enough for school photos, out for sport and brushing, no brackets or wires to break. Many teens finish in less time than with braces." },
        { img: "clinical-pair-chair", h: "Adults", p: "Crowding, spacing, and teeth that drifted years after the braces came off. Invisalign treats most of what walks in." },
        { img: "checkin-screen", h: "Severe cases", p: "Some alignment needs something else. If yours does, Dr. Dave Cho says so at the consultation, and it has cost you nothing to find out." },
      ],
    },
    dentist: {
      h2: "The dentist you meet <em>at the consultation.</em>",
      lede: "Your free consultation is with Dr. Dave Cho. He looks at your scan with you, answers every question, and tells you plainly whether Invisalign is the right tool for your teeth.",
      kicker: "Cosmetic, restorative and general dentistry",
      name: "Dr. Dave Cho",
      caption: "Dr. Dave Cho, DMD",
      quote: "Dr. Dave Cho came to dentistry after a degree in biochemistry and five years at a pharmaceutical company, and took his dental degree at Tufts. Cosmetic dentistry is part of his everyday work, and his laid back, calm manner puts nervous patients at ease.",
      dl: [["Trained", "Tufts University, Boston (DMD)"], ["Experience", "Cosmetic dentistry, implants, root canals and oral surgery"], ["Sedation", "Certified, to make a long appointment one appointment"]],
      after: "He sees patients of every age, and his favourite part of the work is the long relationship that follows the first visit.",
      figures: [
        ['<b data-count="4.9" data-decimals="1">4.9</b>', "Google rating", "Across 1,037 reviews left by the practice&rsquo;s own patients."],
        ['<b>$1,000</b>', "Off Invisalign", "Off the regular $4,800 price, and a further $500 when treatment is prepaid in full."],
        ['<b>0%</b>', "APR financing", "Cherry splits the balance with no hard credit check."],
        ['<b>12&ndash;18</b>', "Months, typically", "Most patients finish in twelve to eighteen months. Some in as little as six."],
      ],
    },
    path: {
      h2: "What happens, step by step.",
      steps: [
        ["desk-family-3", "Free consultation", "Dr. Dave Cho assesses your teeth, your history, and what you want from a straighter smile. You leave with a price in writing."],
        ["scanner-screen-3", "Scan and plan", "A 3D scan of your teeth, and a plan that maps each step, with a preview of the result on screen."],
        ["hygienist-working-4", "The first set", "Your aligners, made to fit. Worn 20 to 22 hours a day, out for meals and brushing."],
        ["girl-chair-2", "Checkups", "Every 4 to 6 weeks, a look at the movement and the next set of trays."],
        ["desk-patient", "Retainers", "A retainer keeps the teeth where the aligners put them. Included."],
      ],
      cta: ["Start at step one.", "The consultation is where you find out whether Invisalign is right for your teeth, and exactly what it would cost."],
    },
    proofHeadline: "What Katy patients say <em>about being here.</em>",
    proofLead: R.metheVee,
    proofRail: [R.amy, R.toyin, R.glenn, R.gabriel],
    proofImg: "n179-desk-tablet-family",
    placeLede: "The scanner is in the treatment room, the screen is on the ceiling, and the front desk answers the phone. These are the rooms, not a rendering.",
    place: [["patient-chair-team", "A treatment room"], ["ceiling-screen", "The view from the chair"], ["scanner-chair", "The scanner"], ["sterilizer", "Instruments out of the sterilizer"], ["team-front-desk", "The team at the front desk"]],
    faqHeadline: "Everything patients ask <em>before booking.</em>",
    faq: [
      ["What does Invisalign&reg; cost at Mason Park?", "<p>The regular price is $4,800. With the current offer it is $3,800, and a further $500 comes off when treatment is prepaid in full. That price includes the consultation, the 3D scan and x-rays, every aligner, refinements, retainers and K&ouml;r whitening gel. Cherry financing splits the balance at 0% APR with no hard credit check.</p>"],
      ["How long does Invisalign&reg; treatment take?", "<p>Most patients complete treatment in 12 to 18 months, but some may see results in as little as 6 months.</p>"],
      ["Is Invisalign&reg; painful?", "<p>Some patients experience mild discomfort as their teeth adjust, but it is far less painful than traditional braces.</p>"],
      ["Can I eat and drink while wearing Invisalign&reg;?", "<p>You should remove aligners before eating or drinking anything other than water to prevent damage or staining.</p>"],
      ["How often do I need to visit during treatment?", "<p>You will need check-ups every 4 to 6 weeks to monitor progress and receive new aligners.</p>"],
      ["Does Invisalign&reg; work for severe misalignment?", "<p>Invisalign&reg; can treat most cases, but severe alignment issues may require alternative treatments. The consultation is where you find out, and it costs nothing.</p>"],
      ["Why is Invisalign&reg; a good option for teens?", "<p>Aligners are clear and discreet, comfortable, removable for brushing and sports, carry no brackets or wires to break, and many teens finish in less time than with traditional braces.</p>"],
      ["Does dental insurance cover Invisalign&reg; treatment?", "<p>Many dental insurance plans cover Invisalign&reg; as part of their orthodontic benefits. Coverage varies by plan, and we check yours and explain any out-of-pocket cost before treatment starts. With the offer, insurance reimbursements are returned directly to you.</p>"],
    ],
    final: {
      h2: "Stop hiding <em>your smile.</em>",
      lede: "Every month you wait is a month you wear them later. The consultation is free, the scan happens on the day, and you leave with a price in writing.",
      offer: "$1,000 off Invisalign&reg;, and $500 more when prepaid in full. Insurance reimbursements returned to you.",
      shot: ["n120-building-exterior", "Suite 104A, on the ground floor. Free parking at the door."],
    },
    consultPage: {
      title: "Book Your Free Invisalign Consultation | Mason Park Dental, Katy",
      description: "Request a free Invisalign consultation at Mason Park Dental in Katy, TX. 3D scan on the day, $1,000 off the all-inclusive price, 0% APR financing available.",
      tag: "Free consultation",
      h1: "Book your free <em>Invisalign consultation.</em>",
      lede: "Tell us a little about your smile. Our team calls during office hours to arrange the visit, and the 3D scan happens on the day.",
      chips: ["Free consultation", "$1,000 off", "3D scan on the day", "0% APR available"],
      byline: ["dr-cho-portrait", "Dr. Dave Cho, DMD", "Your free Invisalign consultation is with him"],
      heroImg: "scanner-chair",
      proofHeadline: "Hear from <em>our patients.</em>",
      dentistH2: "Meet the dentist <em>before you commit.</em>",
      dentistLede: "The free consultation is with Dr. Dave Cho: a look at your scan, a straight answer on whether Invisalign suits your teeth, and a price in writing before anything is made.",
      inviteH2: "Prefer <em>to talk?</em>",
      inviteLede: "Call and say it is for Invisalign. The front desk will find a consultation time and explain the offer before you commit to anything.",
    },
    thanksPage: {
      title: "Thank You | Invisalign Consultation Request | Mason Park Dental",
      description: "Your Invisalign consultation request has reached Mason Park Dental in Katy. Here is what happens on the call, and why not to wait.",
      heroImg: "desk-call-5",
      tag: "Request received",
      h1: "Thank you. <em>Let&rsquo;s talk about your smile.</em>",
      lede: "Your request is with our front desk, and we will call during office hours. If you would rather not wait, call us now and a member of the team will get your free consultation on the calendar.",
      note: "A two-minute call to talk through the offer and find a time that suits you.",
      callH2: "What to expect <em>on the call.</em>",
      callLede: "Three things, in order. Nothing else is needed from you until the phone rings.",
      steps: [
        ["First", "Your options", "What you would like to change, and whether Invisalign fits. If Dr. Dave Cho would recommend something else for your teeth, the front desk says so now."],
        ["Then", "Your payment options", "The $1,000 offer, the further $500 for prepaying, what your insurance is likely to cover and the 0% APR plan, explained plainly."],
        ["Finally", "Your free consultation", "A time for the visit itself: the 3D scan, the preview of the finished smile, and a price in writing before anything is made."],
      ],
      risksH3: "Why not to wait",
      risks: [
        "Crowded teeth are harder to clean, so the gums and enamel around them pay for it over time.",
        "Teeth keep drifting. A plan that would take a year now takes longer later.",
        "The $1,000 offer is current. Offers change; the consultation locks yours in.",
        "Every month you wait is a month you wear the aligners later.",
      ],
      whyH2: "Why <em>Mason Park?</em>",
      pillars: [
        ["Experience", "Your consultation is with Dr. Dave Cho, a Tufts trained dentist experienced in cosmetic dentistry, with a calm manner that puts nervous patients at ease."],
        ["Personalized care", "A 3D scan instead of putty, a preview of the result before it starts, and Dr. Dave Cho&rsquo;s sedation certification for anyone who needs it."],
        ["Clear costs", "One all-inclusive price in writing: scan, x-rays, every aligner, refinements, retainers and whitening gel. Insurance checked first, 0% APR available."],
      ],
      faqHeadline: "Any questions <em>before you call?</em>",
      inviteH2: "Ready to take <em>the next step?</em>",
      inviteLede: "Talk to the Mason Park team and get your free consultation with Dr. Dave Cho on the calendar today.",
    },
    disclaimer: "Individual results vary with each patient&rsquo;s teeth, bite and how consistently the aligners are worn. Nothing on this page is a diagnosis or a promise of a specific outcome; candidacy for Invisalign&reg; is confirmed at a clinical examination. The $1,000 offer applies to comprehensive Invisalign&reg; treatment at the regular price of $4,800; the further $500 applies only when treatment is prepaid in full, and insurance reimbursements are returned directly to you. The consultation is free for new Invisalign&reg; patients. Invisalign&reg; is a registered trademark of Align Technology, Inc.",
  },
  {
    key: "new-patient-special",
    consult: "new-patient-special-consultation",
    thanks: "new-patient-thank-you",
    formId: "jEXtvRc1ObkKd1QvmSGn",
    formName: "Contact Form New Patient Special",
    formHeight: 1587,
    railLabel: "$189 first visit",
    cta: "Claim the $189 visit",
    serviceHref: "/new-patients/",
    serviceLabel: "Read about your first visit",
    title: "$189 New Patient Special in Katy, TX | Exam, X-Rays, Cleaning | Mason Park Dental",
    description: "A comprehensive exam, digital x-rays, a cleaning and a written treatment plan for $189 at Mason Park Dental of Katy. Dr. Dave Cho and the team, a pediatric dentist across the hall, same-day slots for pain.",
    heroImg: "desk-checkin-pair",
    hero: {
      tag: "New patients",
      h1: "Your whole first visit, <em>$189.</em>",
      lede: "A comprehensive exam, digital x-rays, a cleaning and a written treatment plan, for $189 instead of $517. Dr. Dave Cho and the team in Katy, and a front desk that answers the phone.",
      meta: [["4.9", "Google rating"], ["$328", "Saved"], ["Same day", "Slots for pain"]],
    },
    form: {
      kicker: "$189 new patient special",
      title: "Claim your $189 first visit.",
      lede: "Tell us what brings you in. Our team will call during office hours to book the visit and confirm what the $189 includes.",
    },
    journey: {
      h2: "From putting it off <em>to &ldquo;found our family dentist.&rdquo;</em>",
      lede: "Most first visits start the same way: it has been too long, and nobody wants a surprise. Here is how it actually goes, in four moves.",
      stages: [
        { img: "sofa-forms", cap: "The waiting room sofa, Mason Park", h3: "It has been a while", p: "You know it has been too long. You are not sure what it will cost, or what they will find, and that is exactly why you keep not booking.", q: "Felt more comfortable here than at any other dentist office in the past.", by: "Gabriel Sanchez" },
        { img: "checkin-screen", cap: "The plan, turned so you can see it", h3: "Someone explains it", p: "An exam, digital x-rays and the camera, on a screen you can see too. Everything the doctor sees, in plain words, before anything is decided.", q: "They explained everything in detail and made me feel at ease.", by: "Oluwatoyin Dominic" },
        { img: "desk-family-3", cap: "A plan reviewed at the front desk", h3: "The price, in writing", p: "A written plan with what insurance covers and what it does not, before anything is started. Nothing happens today that you did not agree to.", q: "Not just a routine visit, more like a mini spa for my teeth.", by: "Oluwatoyin Dominic" },
        { img: "hygienist-loupes", cap: "A cleaning, Mason Park", h3: "The cleaning, and the next one", p: "Then the cleaning, a recall you do not have to remember, and the same hygienist next time.", q: "Found our family dentist!", by: "Melissa Merino" },
      ],
    },
    seal: ["New patients · $189 · Exam · X-rays · Cleaning · Plan · ", "$"],
    why: {
      h2: "Why Katy families choose Mason Park <em>for their first visit.</em>",
      lede: "A first visit is a test of the whole practice: whether the price holds, whether someone explains what they found, and whether you would send your family.",
      cards: [
        ["$189 covers the whole visit", "Exam, x-rays, cleaning and a written plan. That is $328 off the regular price, and nothing is added at the desk."],
        ["Adults and children, one building", "Dr. Dave Cho and the team for the adults. Dr. Tam Nguyen, a board certified pediatric dentist, across the hall for the children. Sedation, implants and root canals without being sent across town."],
        ["You see what the doctor sees", "Digital x-rays and the intraoral camera on a screen in front of you, so the plan is something you watched being made."],
        ["Insurance or the savings plan, whichever is better", "Most major plans accepted and checked before you commit. No insurance? The membership plan covers routine care for a flat annual fee."],
      ],
    },
    doors: {
      h3: "Three reasons people book, <em>and one front desk.</em>",
      p: "Say which one you are when you call, or on the form. The $189 visit is the same either way.",
      items: [
        { img: "hygienist-working-2", h: "Just a checkup", p: "It has been six months, or six years. The exam, x-rays and cleaning are the same visit, and nobody asks how long it has been." },
        { img: "dentist-handheld-2", h: "Something hurts", p: "Same-day slots for pain, breaks and knocked out teeth. Say it is urgent and the front desk finds the time." },
        { img: "desk-family-2", h: "The whole family", p: "One front desk books both sides of the address. Children under 13 see Dr. Tam Nguyen across the hall, with a $129 first exam of their own." },
      ],
    },
    dentist: {
      h2: "A dentist <em>you can ask for by name.</em>",
      lede: "Dr. Dave Cho trained at Tufts, sees patients of every age, and his favourite part of the work is the relationship that follows the first visit.",
      kicker: "Cosmetic, restorative and general dentistry",
      name: "Dr. Dave Cho",
      caption: "Dr. Dave Cho, DMD",
      quote: "A laid back manner that puts nervous patients at ease, and the sedation certification to make a long appointment one appointment. Before dentistry, a degree in biochemistry and five years at a pharmaceutical company.",
      dl: [["Trained", "Tufts University, Boston (DMD)"], ["Experience", "Sedation, root canals, oral surgery, implants and cosmetic dentistry"], ["Children", "Dr. Tam Nguyen, board certified pediatric dentist, across the hall"]],
      after: "He attends several continuing education courses every year.",
      figures: [
        ['<b data-count="4.9" data-decimals="1">4.9</b>', "Google rating", "Across 1,037 reviews left by the practice&rsquo;s own patients."],
        ['<b data-count="189" data-prefix="$">$189</b>', "The first visit", "Exam, digital x-rays, cleaning and a written plan, regularly $517."],
        ['<b data-count="328" data-prefix="$">$328</b>', "Saved", "Against the regular price of the same exam, x-rays, cleaning and plan."],
        ['<b>Same day</b>', "Slots for pain", "For pain, breaks and knocked out teeth. Say it is urgent when you call."],
      ],
    },
    path: {
      h2: "What happens, in order.",
      steps: [
        ["desk-call", "Book it", "Online, or ring the front desk. The whole family can share one afternoon."],
        ["sofa-forms-2", "Forms, ahead of time", "Ask for them when you book, and the visit starts in the chair rather than on a clipboard."],
        ["team-corridor", "Arrive", "Photo ID, insurance card if you have one, your medications. Free parking at the door."],
        ["scanner-chair", "The exam", "Teeth, gums, digital x-rays and the camera, on a screen you can see too."],
        ["desk-family", "The plan and the price", "Written out with what insurance covers and what it does not. Nothing is started today."],
        ["hygienist-working-4", "The cleaning", "Then a recall you do not have to remember. The same hygienist next time."],
      ],
      cta: ["Start at step one.", "Booking takes about a minute, and the front desk will put the whole family in one slot if you ask."],
    },
    proofHeadline: "First visits, <em>in the visitors&rsquo; words.</em>",
    proofLead: R.jocelyne,
    proofRail: [R.toyin, R.glenn, R.gabriel, R.melissa, R.anjana],
    proofImg: "n179-desk-tablet-family",
    placeLede: "The waiting room, the treatment rooms, the sterilizer and the front desk, photographed on an ordinary weekday. These are the rooms, not a rendering.",
    place: [["team-huddle-smile", "The team at the front desk"], ["treatment-room", "A treatment room"], ["sofa-forms-3", "The waiting room"], ["sterilizer", "Instruments out of the sterilizer"], ["ceiling-screen", "The view from the chair"]],
    faqHeadline: "What first visits <em>ask.</em>",
    faq: [
      ["What does the $189 new patient special include?", "<p>A comprehensive dental exam, x-rays, a cleaning and a full treatment plan in writing, regularly $517. It is for new patients only, cannot be combined with dental insurance, and does not apply in cases of periodontal (gum) disease, where a different cleaning is needed and is quoted before it is done.</p>"],
      ["Can I use the $189 special with my insurance?", "<p>No. The special cannot be combined with insurance, and that is not a catch: using your insurance is usually the better deal. Tell the front desk which plan you have and they will tell you which way round works out best for you.</p>"],
      ["What should I expect during my first visit?", "<p>You begin with some paperwork that includes your health history, sent ahead if you ask for it. Then Dr. Dave Cho or another Mason Park dentist conducts a thorough dental exam: checking your teeth and gums, evaluating your oral health, and discussing any concerns you may have.</p>"],
      ["What if the exam finds something?", "<p>You get a written plan and a price, with what insurance covers and what it does not. Nothing is started the same day unless you ask for it, and a free second opinion on a plan you were given elsewhere is always available.</p>"],
      ["What should I bring to my first appointment?", "<p>Your insurance card if you have one, a valid photo ID, and a list of the medications you currently take, including anything over the counter.</p>"],
      ["Can I request a tour of the practice first?", "<p>Yes. There is no fee to tour the practice. Call and ask for a quiet weekday hour to see the rooms and meet the team before you become a patient.</p>"],
      ["How does Dr. Dave Cho approach new patient care?", "<p>He takes the time to listen to your concerns, answer your questions, and discuss the best treatment options for you. The aim is a welcoming visit that builds trust and open communication about your dental health.</p>"],
    ],
    final: {
      h2: "Start at <em>step one.</em>",
      lede: "Book in about a minute, or call. Ask for the forms and they arrive before you do. The $189 covers the whole visit, and nothing is started on the day unless you ask.",
      offer: "$189 for the exam, x-rays, cleaning and written plan. New patients, not combined with insurance, not for periodontal cases.",
      shot: ["n120-building-exterior", "Suite 104A, on the ground floor. Free parking at the door."],
    },
    consultPage: {
      title: "Claim Your $189 First Visit | Mason Park Dental, Katy",
      description: "Request the $189 new patient visit at Mason Park Dental of Katy: exam, digital x-rays, cleaning and a written treatment plan. Dr. Dave Cho for adults, kids across the hall.",
      tag: "$189 new patient special",
      h1: "Claim your <em>$189 first visit.</em>",
      lede: "Tell us what brings you in. Our team calls during office hours to book the visit, send the forms ahead, and confirm what the $189 includes.",
      chips: ["$189, $328 saved", "Exam, x-rays, cleaning, plan", "Dr. Dave Cho for adults", "Kids across the hall"],
      byline: ["team-desk-morning", "The Mason Park front desk", "Answers the phone Mon to Thu, and calls you back"],
      heroImg: "team-huddle-smile",
      proofHeadline: "Hear from <em>our patients.</em>",
      dentistH2: "Meet Dr. Dave Cho <em>before your first visit.</em>",
      dentistLede: "Dr. Dave Cho trained at Tufts and sees patients of every age. The children see Dr. Tam Nguyen, a board certified pediatric dentist, across the hall.",
      inviteH2: "Prefer <em>to talk?</em>",
      inviteLede: "Call and say it is your first visit. The front desk will find the time, send the forms ahead, and tell you whether the special or your insurance works out better.",
    },
    thanksPage: {
      title: "Thank You | $189 New Patient Request | Mason Park Dental",
      description: "Your $189 new patient request has reached Mason Park Dental of Katy. Here is what happens on the call, and what to bring.",
      heroImg: "desk-call-5",
      tag: "Request received",
      h1: "Thank you. <em>Your first visit is next.</em>",
      lede: "Your request is with our front desk, and we will call during office hours to find a time. In pain today? Do not wait for the call: ring us and say it is urgent.",
      note: "A two-minute call to find a time, send the forms ahead and confirm the $189.",
      callH2: "What to expect <em>on the call.</em>",
      callLede: "Three things, in order. Nothing else is needed from you until the phone rings.",
      steps: [
        ["First", "Your time", "A slot that suits you. The whole family can share one afternoon, and the children are booked across the hall in the same call."],
        ["Then", "Your forms", "Sent to you ahead of the visit, so it starts in the chair rather than on a clipboard. Bring photo ID, your insurance card if you have one, and your medications."],
        ["Finally", "Your $189 visit", "The exam, digital x-rays, the cleaning and a written plan with a price. Nothing is started on the day unless you ask for it."],
      ],
      risksH3: "Why not to wait",
      risks: [
        "Small problems are cheap to fix. The same problems a year later are not.",
        "Gum disease shows no pain until it is well advanced. The exam is how it gets caught.",
        "Same-day slots exist for pain, breaks and knocked out teeth. Do not sit with it.",
        "The $189 special is current. Offers change; your visit locks yours in.",
      ],
      whyH2: "Why <em>Mason Park?</em>",
      pillars: [
        ["Experience", "Dr. Dave Cho, a Tufts trained general dentist with a sedation certification, and a board certified pediatric dentist across the hall."],
        ["Personalized care", "The x-rays and the camera on a screen you can see, a plan explained in plain words, and the same hygienist next time."],
        ["Clear costs", "$189 for the whole first visit, a written plan before anything is started, insurance checked first, and a savings plan if you have none."],
      ],
      faqHeadline: "Any questions <em>before you call?</em>",
      inviteH2: "Ready to take <em>the next step?</em>",
      inviteLede: "Talk to the Mason Park front desk and get your first visit on the calendar today.",
    },
    disclaimer: "The $189 new patient special covers a comprehensive exam, x-rays, a cleaning and a written treatment plan, regularly $517. It is for new patients only, cannot be combined with dental insurance, and does not apply in cases of periodontal (gum) disease, where a different cleaning is clinically required and is quoted before it is done. Nothing on this page is a diagnosis; what your visit finds, and what it would cost to treat, is set out in writing before anything is started. Individual results vary.",
  },
];

// ------------------------------------------------------------------ pages
function landing(c) {
  const consultHref = `${BASE}${c.consult}`;
  let n = 0;
  const stages = c.journey.stages;
  const html = `${head({ slug: c.key, title: c.title, description: c.description, extraLd: faqLd(c.faq) })}
${header({ ctaHref: consultHref, ctaLabel: c.cta, ctaShort: "Book" })}
<section class="ch ch-arrival is-lp" id="arrival" data-chapter="${n++}" data-chapter-name="Arrival" data-theme="dark">
  <div class="ar-bg" data-drift>
    ${img(c.heroImg, "100vw", { eager: true })}
  </div>
  <div class="ar-veil" aria-hidden="true"></div>
  <div class="ar-in lp-hero">
    <div class="lp-hero_copy">
      ${tag(c.hero.tag)}
      <h1 class="ar-title" data-split>${c.hero.h1}</h1>
      <p class="ar-lede" data-anim="hide">${c.hero.lede}</p>
      <div class="ar-actions" data-anim="hide"><a class="button is-lg" href="${consultHref}">${c.cta}</a>
        <a class="button is-ghost-light is-lg" href="${TEL}">Call ${PHONE}</a></div>
      <div class="ar-meta" data-anim="hide">${c.hero.meta.map(([b, s]) => `<div><b>${b}</b><span>${s}</span></div>`).join("")}</div>
      <p class="lp-hero_area">Serving Katy, Cinco Ranch, Fulshear and West Houston</p>
    </div>
    ${formCard(c)}
  </div>
</section>

<!-- THE JOURNEY. Livewell's "from hiding your smile to living well" beat:
     four moves, one photograph each, pinned on desktop and scrubbed by the
     scroll; on a phone the photograph holds at the top while the moves pass
     under it. The review lines are the practice's own patients' words. -->
<section class="ch ch-journey" id="journey" data-chapter="${n++}" data-chapter-name="The Journey" data-theme="dark">
  <div class="wrap lp-journey_head">
    ${tag("The Journey")}
    <h2 data-split>${c.journey.h2}</h2>
    <p class="pe-lede">${c.journey.lede}</p>
  </div>
  <div class="lp-journey_stage" id="lpJourneyStage">
    <div class="lp-journey_frames">
      ${stages.map((s, i) => `<figure class="lp-journey_frame${i === 0 ? " is-on" : ""}" data-stage="${i}">${img(s.img, "(max-width: 899px) 100vw, 46vw")}<figcaption>${s.cap}</figcaption></figure>`).join("\n      ")}
    </div>
    <ol class="lp-journey_steps">
      ${stages.map((s, i) => `<li class="lp-journey_step${i === 0 ? " is-on" : ""}" data-stage="${i}">
        <span class="lp-journey_no">0${i + 1}</span>
        <div>
          <h3>${s.h3}</h3>
          <div class="lp-journey_more"><div>
            <p>${s.p}</p>${s.q ? `
            <blockquote class="lp-journey_quote"><p>&ldquo;${s.q}&rdquo;</p><cite>${s.by}, Google review</cite></blockquote>` : ""}
          </div></div>
        </div>
      </li>`).join("\n      ")}
    </ol>
    <div class="lp-journey_bar" aria-hidden="true"><i id="lpJourneyBar"></i></div>
  </div>
</section>

<!-- WHY HERE. Livewell's "why patients drive past other offices": four
     reasons, the head holding beside them on desktop, then who it is for. -->
<section class="ch ch-why" id="why" data-chapter="${n++}" data-chapter-name="Why Here" data-theme="warm" data-no-depart>
  <div class="wrap lp-why">
    <div class="lp-why_head">
      ${tag("Why Here")}
      <h2 data-split>${c.why.h2}</h2>
      <p class="pe-lede">${c.why.lede}</p>
      <a class="button" href="${consultHref}">${c.cta}</a>
    </div>
    <div class="lp-why_grid" data-stagger>
      ${c.why.cards.map(([h, p], i) => `<article class="lp-why_card">
        <span class="lp-why_no">0${i + 1}</span>
        <div>
          <h3>${h}</h3>
          <p>${p}</p>
        </div>
      </article>`).join("\n      ")}
    </div>
  </div>
  <div class="wrap lp-doors_wrap">
    <div class="el-seal" data-text="${c.seal[0]}" data-mark="${c.seal[1]}"></div>
    <div class="lp-doors_head">
      <h3>${c.doors.h3}</h3>
      <p>${c.doors.p}</p>
    </div>
    <div class="lp-doors" data-stagger>
      ${c.doors.items.map((d) => `<article class="lp-door">
        <figure data-el="mask">${img(d.img, "(max-width: 759px) 100vw, 32vw")}</figure>
        <h3>${d.h}</h3>
        <p>${d.p}</p>
      </article>`).join("\n      ")}
    </div>
  </div>
</section>

<!-- THE DENTIST. Livewell's "the dentist other dentists learn from". -->
<section class="ch ch-dentist" id="dentist" data-chapter="${n++}" data-chapter-name="The Dentist">
  <div class="wrap cp-head is-split">
    <div>
      ${tag("The Dentist")}
      <h2 data-split>${c.dentist.h2}</h2>
    </div>
    <p class="pe-lede">${c.dentist.lede}</p>
  </div>
  ${c.dentist.duo ? `<div class="wrap">
    <div class="cp-duo">
      ${c.dentist.duo.map((d) => `<article class="cp-dossier">
        <figure class="cp-dossier_shot" data-el="mask">${img(d.img, "15rem")}</figure>
        <p class="cp-kicker">${d.kicker}</p>
        <h3>${d.name}</h3>
        <p data-write>${d.p}</p>
      </article>`).join("\n      ")}
    </div>
  </div>` : `<div class="cp-split">
    <figure class="cp-split_ink" data-el="mask">
      ${img("dr-cho-portrait", "(max-width: 899px) 100vw, 45vw")}
      <figcaption>${c.dentist.caption}</figcaption>
    </figure>
    <div class="cp-split_warm">
      <p class="cp-kicker">${c.dentist.kicker}</p>
      <h3 class="lp-dentist_name">${c.dentist.name}</h3>
      <p class="cp-split_quote" data-write>${c.dentist.quote}</p>
      <dl class="cp-dl">${c.dentist.dl.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("")}</dl>
      <p>${c.dentist.after}</p>
    </div>
  </div>`}
  <div class="wrap lp-dentist_figures">
    <div class="cp-figures" data-counters>
      ${c.dentist.figures.map(([b, s, p]) => `<div class="cp-figure">${b}<span>${s}</span><p>${p}</p></div>`).join("\n      ")}
    </div>
  </div>
</section>

<!-- THE PATH, pinned. The class has to be ch-path: journey.js binds the
     scene to it. The photographs are the practice's own. -->
<section class="ch ch-path" id="process" data-chapter="${n++}" data-chapter-name="The Path">
  <div class="pa-pin" id="pathPin">
    <div class="pa-head">
      ${tag("The Path")}
      <h2>${c.path.h2}</h2>
    </div>
    <div class="pa-track" id="pathTrack">
      ${c.path.steps.map(([k, h, p], i) => `<article class="pa-card">
        <div class="pa-shot">${img(k, "(max-width: 899px) 82vw, 30vw")}</div>
        <span class="pa-no">0${i + 1}</span>
        <h3>${h}</h3>
        <p>${p}</p>
      </article>`).join("\n      ")}
      <article class="pa-card is-cta">
        <span class="pa-no">&#9670;</span>
        <h3>${c.path.cta[0]}</h3>
        <p>${c.path.cta[1]}</p>
        <a class="button" href="${consultHref}">${c.cta}</a>
        <p class="pa-call">Or call <a href="${TEL}">${PHONE}</a></p>
      </article>
    </div>
    <div class="pa-bar" aria-hidden="true"><i id="pathBar"></i></div>
  </div>
</section>

<!-- THE PROOF, then the rooms. Livewell runs a gallery of its own patients
     and then its space; the practice's proof is its 1,037 Google reviews. -->
${proofChapter(n++, c, { lead: c.proofLead, rail: c.proofRail, headline: c.proofHeadline })}

${questionsChapter(n++, c, c.faqHeadline, c.faq)}

${invitationChapter(n++, c, { headline: c.final.h2, lede: c.final.lede, primaryHref: consultHref, primaryLabel: c.cta, offer: c.final.offer, shot: c.final.shot })}
${footer({ bookHref: consultHref, bookLabel: c.cta })}
${rail(c.railLabel, consultHref, c.cta)}
${SCRIPTS}`;
  return html;
}

function consultation(c) {
  const p = c.consultPage;
  let n = 0;
  const dossier = c.dentist.duo
    ? `<div class="wrap">
    <div class="cp-duo">
      ${c.dentist.duo.map((d) => `<article class="cp-dossier">
        <figure class="cp-dossier_shot" data-el="mask">${img(d.img, "15rem")}</figure>
        <p class="cp-kicker">${d.kicker}</p>
        <h3>${d.name}</h3>
        <p data-write>${d.p}</p>
      </article>`).join("\n      ")}
    </div>
  </div>`
    : `<div class="cp-split">
    <figure class="cp-split_ink" data-el="mask">
      ${img("dr-cho-portrait", "(max-width: 899px) 100vw, 45vw")}
      <figcaption>${c.dentist.caption}</figcaption>
    </figure>
    <div class="cp-split_warm">
      <p class="cp-kicker">${c.dentist.kicker}</p>
      <h3 class="lp-dentist_name">${c.dentist.name}</h3>
      <p class="cp-split_quote" data-write>${c.dentist.quote}</p>
      <dl class="cp-dl">${c.dentist.dl.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("")}</dl>
    </div>
  </div>`;
  return `${head({ slug: c.consult, title: p.title, description: p.description })}
${header({ ctaHref: "#form", ctaLabel: "Start the form", ctaShort: "Form" })}
<section class="ch ch-arrival is-lp is-consult" id="arrival" data-chapter="${n++}" data-chapter-name="Arrival" data-theme="dark">
  <div class="ar-bg" data-drift>
    ${img(p.heroImg, "100vw", { eager: true })}
  </div>
  <div class="ar-veil" aria-hidden="true"></div>
  <div class="ar-in lp-hero">
    <div class="lp-hero_copy">
      ${tag(p.tag)}
      <h1 class="ar-title" data-split>${p.h1}</h1>
      <p class="ar-lede" data-anim="hide">${p.lede}</p>
      <ul class="lp-chips">${p.chips.map((x) => `<li>${x}</li>`).join("")}</ul>
      <div class="lp-byline">
        <span class="lp-byline_face">${img(p.byline[0], "4.2rem")}</span>
        <span><b>${p.byline[1]}</b><small>${p.byline[2]}</small></span>
      </div>
      <p class="lp-hero_note">Prefer to talk? Call <a href="${TEL}">${PHONE}</a>, Monday to Thursday.</p>
    </div>
    ${formCard(c)}
  </div>
</section>

${proofChapter(n++, c, { lead: c.proofLead, rail: c.proofRail, headline: p.proofHeadline, place: false, note: true })}

<section class="ch ch-dentist" id="dentist" data-chapter="${n++}" data-chapter-name="The Dentist" data-theme="warm">
  <div class="wrap cp-head is-split">
    <div>
      ${tag("The Dentist")}
      <h2 data-split>${p.dentistH2}</h2>
    </div>
    <p class="pe-lede">${p.dentistLede}</p>
  </div>
  ${dossier}
  ${BADGES.replace('class="pr-badges"', 'class="pr-badges is-on-warm"')}
  <div class="wrap lp-legal">
    <p class="lp-disclaimer">${c.disclaimer}</p>
  </div>
</section>

${invitationChapter(n++, c, { headline: p.inviteH2, lede: p.inviteLede, primaryHref: "#form", primaryLabel: "Back to the form", offer: c.final.offer, shot: c.final.shot, legal: false })}
${footer({ bookHref: "#form", bookLabel: c.cta })}
${rail(c.railLabel, "#form", "Start the form")}
${SCRIPTS}`;
}

function thankYou(c) {
  const p = c.thanksPage;
  let n = 0;
  return `${head({ slug: c.thanks, title: p.title, description: p.description, extraLd: faqLd(c.faq) })}
${header({ ctaHref: TEL, ctaLabel: "Call", ctaShort: "Call" })}
<section class="ch ch-arrival is-lp is-thanks" id="arrival" data-chapter="${n++}" data-chapter-name="Arrival" data-theme="dark">
  <div class="ar-bg" data-drift>
    ${img(p.heroImg, "100vw", { eager: true })}
  </div>
  <div class="ar-veil" aria-hidden="true"></div>
  <div class="ar-in">
    ${tag(p.tag)}
    <h1 class="ar-title" data-split>${p.h1}</h1>
    <p class="ar-lede" data-anim="hide">${p.lede}</p>
    <div class="ar-actions" data-anim="hide"><a class="button is-lg" href="${TEL}">Call ${PHONE}</a>
      <a class="button is-ghost-light is-lg" href="#call">What happens next</a></div>
    <p class="lp-hero_note">${p.note}</p>
  </div>
</section>

<!-- THE CALL. Livewell's "what to expect on the call, and why acting now
     matters": three moments down a rule, and the reasons not to wait. -->
<section class="ch ch-call" id="call" data-chapter="${n++}" data-chapter-name="The Call" data-theme="warm">
  <div class="wrap cp-head is-split">
    <div>
      ${tag("The Call")}
      <h2 data-split>${p.callH2}</h2>
    </div>
    <p class="pe-lede">${p.callLede}</p>
  </div>
  <div class="wrap lp-call">
    <ol class="cp-timeline">
      ${p.steps.map(([w, h, t]) => `<li>
        <span class="cp-timeline_when">${w}</span>
        <h3>${h}</h3>
        <p>${t}</p>
      </li>`).join("\n      ")}
    </ol>
    <aside class="lp-risks">
      <h3>${p.risksH3}</h3>
      <ul>
        ${p.risks.map((r, i) => `<li><b>0${i + 1}</b><span>${r}</span></li>`).join("\n        ")}
      </ul>
    </aside>
  </div>
</section>

<section class="ch ch-pillars" id="why" data-chapter="${n++}" data-chapter-name="Why Mason Park">
  <div class="wrap cp-head">
    ${tag("Why Mason Park")}
    <h2 data-split>${p.whyH2}</h2>
  </div>
  <div class="wrap">
    <div class="lp-pillars" data-stagger>
      ${p.pillars.map(([h, t], i) => `<article class="lp-pillar">
        <span class="lp-pillar_no">0${i + 1}</span>
        <h3>${h}</h3>
        <p>${t}</p>
      </article>`).join("\n      ")}
    </div>
  </div>
</section>

${questionsChapter(n++, c, p.faqHeadline, c.faq)}

<section class="ch ch-invitation" id="invitation" data-chapter="${n++}" data-chapter-name="The Invitation" data-theme="dark">
  <div class="wrap cp-head">
    ${tag("The Invitation")}
    <h2 data-split>${p.inviteH2}</h2>
    <p class="pe-lede">${p.inviteLede}</p>
  </div>
  <div class="wrap">
    <div class="cp-callbox">
      <div class="cp-callbox_main">
        <a class="cp-callbox_tel" href="${TEL}">${PHONE}</a>
        <p>We will walk through your options in about two minutes. In pain today? Say it is urgent.</p>
      </div>
      <ul class="cp-callbox_hours">
        <li><span>Monday</span><b>9am to 6pm</b></li>
        <li><span>Tuesday</span><b>9am to 6pm</b></li>
        <li><span>Wednesday</span><b>9am to 6pm</b></li>
        <li><span>Thursday</span><b>9am to 5pm</b></li>
        <li class="is-shut"><span>Friday to Sunday</span><b>Closed</b></li>
      </ul>
    </div>
  </div>
  <div class="wrap iv-top">
    <div class="iv-copy">
      <dl class="iv-facts">
        <div><dt>Call</dt><dd><a href="${TEL}">${PHONE}</a></dd></div><div><dt>Visit</dt><dd><a href="${MAPS}" target="_blank" rel="noopener">21830 Kingsland Blvd #104A<br>Katy, TX 77450</a></dd></div><div><dt>Meanwhile</dt><dd><a href="${c.serviceHref}">${c.serviceLabel}</a></dd></div>
      </dl>
    </div>
    <div class="iv-aside">
      <div class="iv-map">
        <div class="embed_component">
    <iframe data-src="${MAP_EMBED}" title="Map to Mason Park Dental of Katy" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
  </div>
      </div>
      <a class="link-arrow is-light" href="${MAPS}" target="_blank" rel="noopener">Get directions <span aria-hidden="true">&rarr;</span></a>
    </div>
  </div>
  ${BADGES}
  <div class="wrap lp-legal">
    <p class="lp-disclaimer">${c.disclaimer}</p>
    <p class="lp-legal_links"><a href="/privacy-policy/">Privacy Policy</a> &middot; <a href="/terms-of-service/">Terms of Service</a> &middot; <a href="/contacts/">Contact</a> &middot; <a href="/">masonparkdental.com</a></p>
  </div>
</section>
${footer({ bookHref: TEL, bookLabel: "Call to book" })}
${rail("Talk to the front desk", TEL, "", true)}
${SCRIPTS}`;
}

// -------------------------------------------------------------------- run
function write(slug, html) {
  const dir = path.join(OUT, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  const chapters = (html.match(/data-chapter="/g) || []).length;
  console.log(`wrote ${BASE}${slug}/  ${chapters} chapters, ${(html.length / 1024).toFixed(0)} KB`);
}
for (const c of campaigns) {
  write(c.key, landing(c));
  write(c.consult, consultation(c));
  write(c.thanks, thankYou(c));
}
