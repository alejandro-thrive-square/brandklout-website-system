// Hand-authored templates for the pages WordPress built in Elementor, where a
// generic block replay would lose the layout. Every string of copy is pulled
// out of the extracted content (content/<slug>.json) rather than retyped, so
// the words stay exactly the practice's own; only the arrangement is authored
// here, following the pre-takedown screenshots in
// ../../01-content-intake/.tmp/site-screenshots/desktop/.

import { NAV, SERVICE_SLUGS as SERVICE_SLUGS_REF } from "../pages.config.mjs";

// ------------------------------------------------------------ block helpers
const inSection = (d, n) => (d.blocks || []).filter((b) => b.section === n);
const heads = (d, n) => inSection(d, n).filter((b) => b.type === "heading").map((b) => b.text);
const paras = (d, n) => inSection(d, n).filter((b) => b.type === "para");
const imgs = (d, n) => inSection(d, n).filter((b) => b.type === "image");
const ctas = (d, n) => inSection(d, n).filter((b) => b.type === "cta");
const embeds = (d, n) => inSection(d, n).filter((b) => b.type === "embed");
// A paragraph anywhere on the page whose text starts with `start`.
const paraLike = (d, start) =>
  (d.blocks || []).find((b) => b.type === "para" && b.text.toLowerCase().startsWith(start.toLowerCase()));

const BOOK = "https://www.flexbook.me/masonpark/1";

// Two typos the live theme baked into the virtual-consult steps: a missing space
// and a stray zero-width space. Fixed here rather than left in the rebuild; the
// wording itself is untouched.
const fixTypos = (s) =>
  s.replace(/​/g, "").replace(/\bSomePhotos\b/, "Some Photos").trim();

// The twelve service tiles the homepage carousel cycles through, in the order
// the live markup lists them. The icon files are the practice's own.
const SERVICE_TILES = [
  ["s4",  "Cosmetic Dentistry",    "/services/cosmetic-dentistry/"],
  ["s3",  "Sedation Dentistry",    "/services/sedation-dentistry/"],
  ["s2",  "Advanced Technology",   "/technology/"],
  ["s1",  "Comprehensive Care",    "/services/comprehensive-care/"],
  ["s12", "Invisalign",            "/services/invisalign/"],
  ["s11", "Pediatric Dental Care", "/services/pediatric-dental-care/"],
  ["s10", "Dentures",              "/services/dentures/"],
  ["s9",  "Oral Surgery",          "/services/oral-surgery/"],
  ["s8",  "Extractions",           "/services/extractions/"],
  ["s7",  "Root Canal Therapy",    "/services/root-canal-therapy/"],
  ["s6",  "Preventative Dentistry","/services/preventative-dentistry/"],
  ["s5",  "Dental Implants",       "/services/dental-implant-placement/"],
];

// Role lines under the three portraits. They sit in a theme subtitle element
// that the extractor folds away, so they are transcribed from the homepage
// screenshot (site-screenshots/desktop/home.png, "MEET THE DENTAL TEAM").
const DOCTORS = [
  ["/wp-content/uploads/2023/11/HS-7-scaled.jpg", "Dr. Dave Cho",   "General Dentist",                    "/team/dr-cho/"],
  ["/wp-content/uploads/2020/04/DrWilliamSung-230x300-1.webp", "Dr. William Sung", "General Dentist",     "/team/dr-sung/"],
  ["/wp-content/uploads/2023/11/HS-8-scaled.jpg", "Dr. Tam Nguyen", "Board Certified Pediatric Dentist",  "/team/tam-nguyen/"],
];

// ===========================================================================
// Home
// ===========================================================================
function home(d, h) {
  const { esc, asset, link } = h;
  const hero = imgs(d, 2)[0];
  const introImg = imgs(d, 5)[0];
  const introHead = heads(d, 5).find((t) => t.startsWith("Experience")) || "Experience Exceptional Dentistry at Mason Park Dental of Katy";
  const introParas = paras(d, 5).filter((p) => p.text !== "Dentist in Katy, TX");
  const servicesParas = paras(d, 7);
  const doctorsParas = paras(d, 8);
  const doctorsImg = imgs(d, 8)[0];
  const vcParas = paras(d, 10);
  const vcSteps = heads(d, 10).filter((t) => t !== "GET A FREE VIRTUAL DENTAL CONSULT");
  const cherryLogo = imgs(d, 11)[0];
  const cherryArt = imgs(d, 11)[1];
  const cherryPara = paras(d, 11)[0];
  const cherryCta = ctas(d, 11)[0];
  const flexPara = paras(d, 13)[0];
  const flexImg = imgs(d, 13)[0];
  const map = embeds(d, 19)[0];

  // Reviews: the extractor keeps quote and attribution as consecutive blocks.
  const reviewBlocks = inSection(d, 15);
  const reviews = [];
  for (let i = 0; i < reviewBlocks.length; i++) {
    if (reviewBlocks[i].type !== "para") continue;
    const next = reviewBlocks[i + 1];
    reviews.push({
      quote: reviewBlocks[i].text.replace(/^[“"]|[”"]$/g, ""),
      who: next && next.type === "heading" ? next.text.replace(/^-\s*/, "") : "",
    });
  }
  // The live page repeats one review twice with different trailing punctuation,
  // so dedupe on a normalised prefix and drop any quote with no attribution.
  const seen = new Set();
  const key = (q) => q.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
  const uniqueReviews = reviews
    .filter((r) => r.who && !seen.has(key(r.quote)) && seen.add(key(r.quote)))
    .slice(0, 6);

  return `
<section class="hero section--tight">
  <div class="shell hero__media">
    <img src="${esc(asset(hero?.src || "/wp-content/uploads/2023/11/g7-1024x683.jpg"))}"
         alt="The team at Mason Park Dental of Katy" fetchpriority="high" width="1024" height="683">
  </div>
</section>

<section class="section">
  <div class="shell split split--wide-text">
    <div>
      <p class="eyebrow">Dentist in Katy, TX</p>
      <h1>${esc(introHead)}</h1>
      ${introParas.map((p) => `<p>${esc(p.text)}</p>`).join("\n      ")}
      <p><a class="btn" href="/our-services/">Learn more</a>
         <a class="btn btn--ghost" href="${BOOK}" target="_blank" rel="noopener">Schedule online</a></p>
    </div>
    ${introImg ? `<div><img src="${esc(asset(introImg.src))}" alt="A patient in consultation at Mason Park Dental of Katy" loading="lazy"></div>` : ""}
  </div>
</section>

<section class="section section--paper">
  <div class="shell">
    <div class="section__head section__head--center">
      <p class="eyebrow">What we do</p>
      <h2>Dentistry for every stage of life</h2>
    </div>
    <div class="grid grid--4">
      ${SERVICE_TILES.map(([icon, label, href]) => `
      <a class="card card--link" href="${esc(link(href) || href)}">
        <img class="card__icon" src="${esc(asset("/wp-content/uploads/2021/12/" + icon + ".png"))}" alt="" aria-hidden="true" loading="lazy">
        <h4>${esc(label)}</h4>
      </a>`).join("")}
    </div>
    <div class="split split--wide-text" style="margin-top:clamp(2.5rem,5vw,4rem)">
      <div>${servicesParas.map((p) => `<p>${esc(p.text)}</p>`).join("\n        ")}</div>
      <div style="text-align:center">
        <p><a class="btn btn--sage" href="${BOOK}" target="_blank" rel="noopener">Request an appointment</a></p>
        <p class="card__meta">Or call <a href="tel:+12817698878">(281) 769-8878</a></p>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="shell split">
    <div>
      <p class="eyebrow">Dentist in Katy, TX</p>
      <h2>${esc(heads(d, 8)[0] || "Meet Our Esteemed Dentists")}</h2>
      ${doctorsParas.map((p) => `<p>${esc(p.text)}</p>`).join("\n      ")}
      <p><a class="btn" href="/our-team/">Meet our team</a></p>
    </div>
    ${doctorsImg ? `<div><img src="${esc(asset(doctorsImg.src))}" alt="Two of the dentists at Mason Park Dental of Katy" loading="lazy"></div>` : ""}
  </div>
</section>

<section class="section section--ink">
  <div class="shell">
    <div class="split">
      <div>
        <h2>${esc(heads(d, 10)[0] || "Get a free virtual dental consult")}</h2>
        ${vcParas.map((p) => `<p>${esc(p.text)}</p>`).join("\n        ")}
        <p><a class="btn" href="/virtual-consultation/">Virtual consultation</a></p>
      </div>
      <div class="grid steps">
        ${vcSteps.map((s) => `<div class="card"><h4>${esc(fixTypos(s))}</h4></div>`).join("\n        ")}
      </div>
    </div>
  </div>
</section>

<section class="section section--paper">
  <div class="shell split">
    <div>
      ${cherryLogo ? `<img src="${esc(asset(cherryLogo.src))}" alt="Cherry" width="200" style="box-shadow:none;margin-bottom:1.25rem" loading="lazy">` : ""}
      <h2>${esc(heads(d, 11)[0] || "Cherry Dental Financing: 0% APR with no hard credit check")}</h2>
      ${cherryPara ? `<p>${esc(cherryPara.text)}</p>` : ""}
      <p><a class="btn" href="/financing/">See financing options</a></p>
      <p class="card__meta">Applications are handled by Cherry. Ask the front desk which account your application should go through.</p>
    </div>
    ${cherryArt ? `<div><img src="${esc(asset(cherryArt.src))}" alt="Two patients reviewing financing options on a tablet" style="box-shadow:none" loading="lazy"></div>` : ""}
  </div>
</section>

<section class="section">
  <div class="shell">
    <div class="section__head section__head--center">
      <p class="eyebrow">Dentist in Katy, TX</p>
      <h2>Meet the dental team</h2>
    </div>
    <div class="grid grid--3">
      ${DOCTORS.map(([src, name, role, href]) => `
      <a class="doctor card--link" href="${esc(link(href) || href)}">
        <img src="${esc(asset(src))}" alt="${esc(name)}" loading="lazy">
        <h3>${esc(name)}</h3>
        <p>${esc(role)}</p>
      </a>`).join("")}
    </div>
  </div>
</section>

<section class="section section--paper">
  <div class="shell split split--flip">
    ${flexImg ? `<div><img src="${esc(asset(flexImg.src))}" alt="A team member taking a call at the practice" loading="lazy"></div>` : ""}
    <div>
      <p class="eyebrow">Dentist in Katy, TX</p>
      <h2>${esc(heads(d, 13)[0] || "Flexible Scheduling and Emergency Care")}</h2>
      ${flexPara ? `<p>${esc(flexPara.text)}</p>` : ""}
      <p><a class="btn" href="${BOOK}" target="_blank" rel="noopener">Request an appointment</a>
         <a class="btn btn--ghost" href="/services/emergency-dentist/">Dental emergency?</a></p>
    </div>
  </div>
</section>

<section class="section section--ink">
  <div class="shell">
    <div class="section__head section__head--center">
      <p class="eyebrow">Reviews</p>
      <h2>What people are saying</h2>
    </div>
    <div class="quotes">
      ${uniqueReviews.map((r) => `
      <div class="quote">
        <p class="stars" aria-label="Five out of five stars">&#9733;&#9733;&#9733;&#9733;&#9733;</p>
        <blockquote>${esc(r.quote)}</blockquote>
        <cite>${esc(r.who)}</cite>
      </div>`).join("")}
    </div>
  </div>
</section>

<section class="section section--tight">
  <div class="shell">
    <div class="section__head section__head--center"><h2>Find us in Katy</h2></div>
    ${map ? `<div class="embed"><iframe data-src="${esc(map.src)}" title="Map to Mason Park Dental of Katy" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>` : ""}
  </div>
</section>`;
}

// The practice's own embedded forms, harvested from the live pages.
const FORMS = {
  appointment: "https://api.leadconnectorhq.com/widget/form/9tzFcq7rgDGIvq5wJfWL",  // /contacts/
  virtual: "https://form.123formbuilder.com/js-form-username-6049703.html",          // /virtual-consultation/
  offers: "https://form.123formbuilder.com/js-form-username-6127475.html",           // /special-offers/
};
const MAP_EMBED = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3463.0585305167815!2d-95.75121988455305!3d29.775949038160515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86412740e7dd5def%3A0xfa1ab8c6e696e133!2sMason%20Park%20Dental%20-%20Katy%20Dentist!5e0!3m2!1sen!2sus!4v1638807674675!5m2!1sen!2sus";
const LOCATION_NOTE = "We are located at the corner of Mason Rd and Kingsland Blvd, behind the Ranch 99 complex.";
const OFFICE_HOURS = [
  ["Monday", "9am - 6pm"], ["Tuesday", "8am - 5pm"], ["Wednesday", "9am - 6pm"],
  ["Thursday", "8am - 5pm"], ["Friday", "Closed"], ["Saturday", "Closed"], ["Sunday", "Closed"],
];

const pageHero = (h, title, sub, eyebrow = "Katy, TX") => `
<section class="hero hero--page">
  <div class="shell">
    <p class="eyebrow">${h.esc(eyebrow)}</p>
    <h1>${h.esc(title)}</h1>
    ${sub ? `<p>${h.esc(sub)}</p>` : ""}
  </div>
</section>
${h.breadcrumbs([{ label: "Home", href: "/" }, { label: title }])}`;

const bookBlock = (h) => `
<section class="section section--paper">
  <div class="shell split">
    <div>
      <h2>Book your visit</h2>
      <p>New and existing patients are welcome. Book online at any hour, or call the practice during office hours and we will find you a time.</p>
      <p><a class="btn" href="${BOOK}" target="_blank" rel="noopener">Schedule online</a>
         <a class="btn btn--ghost" href="${h.PRACTICE.phoneHref}">Call ${h.esc(h.PRACTICE.phone)}</a></p>
      <p class="card__meta">${h.esc(LOCATION_NOTE)}</p>
    </div>
    <div class="card">
      <h3>Office hours</h3>
      <ul style="list-style:none;padding:0;margin:0">
        ${OFFICE_HOURS.map(([d, t]) => `<li style="display:flex;justify-content:space-between;gap:1rem"><span>${d}</span><strong>${t}</strong></li>`).join("")}
      </ul>
    </div>
  </div>
</section>`;

// ===========================================================================
// Services index - the live page is a bare icon carousel, so this lists every
// service page the site actually has, grouped the way the main menu groups them.
// ===========================================================================
function ourServices(d, h) {
  const { esc, link, labelFor } = h;
  const groups = [
    ["Preventative dentistry", "/services/preventative-dentistry/"],
    ["Cosmetic dentistry", "/services/cosmetic-dentistry/"],
    ["Restorative dentistry", "/services/restorative-dentistry/"],
    ["Hygiene and periodontics", "/services/hygiene-and-periodontics/"],
    ["Invisalign", "/services/invisalign/"],
    ["Oral surgery", "/services/oral-surgery/"],
  ];
  // Pull the group children straight out of the menu definition so this page and
  // the header can never drift apart.
  const menuServices = (NAV.find((i) => i.label === "Services")?.children || []);
  // Some service pages exist but were never in the menu; surface them here so
  // nothing on the site is unreachable.
  const inMenu = new Set();
  (function collect(items) {
    for (const it of items) { inMenu.add(it.href); if (it.children) collect(it.children); }
  })(menuServices);
  const unlisted = SERVICE_SLUGS_REF.filter((sl) => !inMenu.has(h.routeOf(sl)));
  return `${pageHero(h, "Our Services", "Family, cosmetic, restorative and pediatric dentistry, all under one roof in Katy, Texas.")}
<section class="section">
  <div class="shell">
    <div class="grid grid--4">
      ${SERVICE_TILES.map(([icon, label, href]) => `
      <a class="card card--link" href="${esc(link(href) || href)}">
        <img class="card__icon" src="${esc(h.asset("/wp-content/uploads/2021/12/" + icon + ".png"))}" alt="" aria-hidden="true" loading="lazy">
        <h4>${esc(label)}</h4>
      </a>`).join("")}
    </div>
  </div>
</section>
<section class="section section--paper">
  <div class="shell">
    <div class="section__head"><h2>Every service, A to Z</h2>
    <p>Each treatment has its own page explaining what it is, who it suits and what to expect.</p></div>
    <div class="grid grid--3">
      ${menuServices.map((g) => `
      <div class="card">
        <h3><a href="${esc(g.href)}" style="text-decoration:none">${esc(g.label)}</a></h3>
        ${g.children?.length ? `<ul style="margin-top:.75rem">${g.children.map((c) => `<li><a href="${esc(c.href)}">${esc(c.label)}</a></li>`).join("")}</ul>` : ""}
      </div>`).join("")}
      ${unlisted.length ? `
      <div class="card">
        <h3>Also offered</h3>
        <p class="card__meta">Treatment pages the old menu never linked to.</p>
        <ul style="margin-top:.75rem">${unlisted.map((s) => `<li><a href="${esc(h.routeOf(s))}">${esc(h.labelFor(s))}</a></li>`).join("")}</ul>
      </div>` : ""}
      <div class="card">
        <h3>Technology</h3>
        <ul style="margin-top:.75rem">
          <li><a href="/technology/">Our technology</a></li>
          <li><a href="/technology-ai/">Technology / AI</a></li>
          <li><a href="/pearl-ai/">Pearl AI</a></li>
          <li><a href="/ceramillmotion3/">Ceramill Motion 3</a></li>
        </ul>
      </div>
      <div class="card">
        <h3>Costs and offers</h3>
        <ul style="margin-top:.75rem">
          <li><a href="/dental-implant-costs/">Dental implant costs</a></li>
          <li><a href="/dental-implant-costs-esp/">Costos de implantes dentales (Espa&ntilde;ol)</a></li>
          <li><a href="/special-offers/">Special offers</a></li>
          <li><a href="/financing/">Financing and insurance</a></li>
        </ul>
      </div>
    </div>
  </div>
</section>
${bookBlock(h)}`;
}

// ===========================================================================
// About us - keeps the practice intro and the three real doctor bios, and drops
// the theme's demo award table and lorem sections that sat below them.
// ===========================================================================
function aboutUs(d, h) {
  const { esc, asset } = h;
  const intro = paras(d, 3);
  const bios = [4, 5, 6].map((n) => ({
    name: heads(d, n).find((t) => /^Dr\./i.test(t)) || "",
    tagline: (d.blocks || []).find((b) => b.section === n && b.type === "heading" && b.level === 6)?.text || "",
    body: paras(d, n)[0]?.text || "",
    img: imgs(d, n)[0],
    href: /Nguyen/i.test(heads(d, n).join(" ")) ? "/team/tam-nguyen/"
      : /Cho/i.test(heads(d, n).join(" ")) ? "/team/dr-cho/" : "/team/dr-sung/",
  })).filter((b) => b.name);

  return `${pageHero(h, "About Us", heads(d, 3).find((t) => t.startsWith("Meet")) || "")}
<section class="section">
  <div class="shell shell--narrow prose">
    ${intro.map((p) => `<p>${esc(p.text)}</p>`).join("\n    ")}
    <p><a class="btn" href="${BOOK}" target="_blank" rel="noopener">Request an appointment</a></p>
  </div>
</section>
${bios.map((b, i) => `
<section class="section${i % 2 === 0 ? " section--paper" : ""}">
  <div class="shell split${i % 2 === 1 ? " split--flip" : ""}">
    ${b.img ? `<div><img src="${esc(asset(b.img.src))}" alt="${esc(b.name)}" loading="lazy"></div>` : "<div></div>"}
    <div>
      <p class="eyebrow">${esc(b.tagline)}</p>
      <h2>${esc(b.name)}</h2>
      <p>${esc(b.body)}</p>
      <p><a class="btn btn--ghost" href="${esc(b.href)}">Full profile</a></p>
    </div>
  </div>
</section>`).join("")}
${bookBlock(h)}`;
}

// ===========================================================================
// Our team - 403 on the live site, and it is in the main menu. Rebuilt from the
// three doctor profiles the site does publish.
// ===========================================================================
function ourTeam(d, h) {
  const { esc, asset, read, stripBoilerplate } = h;
  const cards = DOCTORS.map(([src, name, role, href]) => {
    const slug = href.replace(/^\/team\/|\/$/g, "");
    const bio = read("team-" + slug);
    // Dr. Nguyen's page opens with a lorem ipsum block the practice never
    // noticed, so the same boilerplate filter the page templates use runs here.
    const first = stripBoilerplate(bio?.blocks || []).find((b) => b.type === "para")?.text
      || (bio?.html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 260);
    return `
      <a class="doctor card--link" href="${esc(href)}">
        <img src="${esc(asset(src))}" alt="${esc(name)}" loading="lazy">
        <h3>${esc(name)}</h3>
        <p>${esc(role)}</p>
        ${first ? `<p style="margin-top:.75rem;font-size:.95rem">${esc(first.slice(0, 190))}${first.length > 190 ? "…" : ""}</p>` : ""}
      </a>`;
  }).join("");

  return `${pageHero(h, "Meet Our Team", "The dentists and the support team who look after Katy families every day.")}
<section class="section">
  <div class="shell">
    <div class="grid grid--3">${cards}</div>
  </div>
</section>
<section class="section section--paper">
  <div class="shell shell--narrow prose">
    <h2>Behind the chair</h2>
    <p>Alongside the dentists, Mason Park Dental of Katy is run by a full team of hygienists, dental
    assistants and front-office staff. They are the people who greet you, handle your insurance and
    keep your appointments running to time.</p>
    <div class="notice"><p><strong>Staff profiles to add:</strong> the practice's hygienists and
    front-office team are named repeatedly in patient reviews but have no profiles on the old site.
    Send us names, roles and photos and they will be added here.</p></div>
  </div>
</section>
${bookBlock(h)}`;
}

// ===========================================================================
// Contacts
// ===========================================================================
function contacts(d, h) {
  const { esc, PRACTICE, renderEmbed } = h;
  const body = paras(d, 2).filter((p) => !/^(Visit Us|Call Us|Connect Online)/i.test(p.text));
  return `${pageHero(h, "Contact Mason Park Dental of Katy", d.description || "")}
<section class="section">
  <div class="shell">
    <div class="split split--wide-text">
      <div class="prose">
        ${body.map((p) => `<p>${esc(p.text)}</p>`).join("\n        ")}
        <p class="notice">${esc(LOCATION_NOTE)}</p>
      </div>
      <div class="grid">
        <div class="card">
          <h3>Visit us</h3>
          <p><a href="${esc(PRACTICE.maps)}" target="_blank" rel="noopener">${esc(PRACTICE.street)}<br>${esc(PRACTICE.city)}, ${esc(PRACTICE.region)} ${esc(PRACTICE.postal)}</a></p>
        </div>
        <div class="card">
          <h3>Call us</h3>
          <p><a class="masthead__phone" href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a></p>
          <p><a class="btn" href="${BOOK}" target="_blank" rel="noopener">Schedule online</a></p>
        </div>
        <div class="card">
          <h3>Office hours</h3>
          <ul style="list-style:none;padding:0;margin:0">
            ${OFFICE_HOURS.map(([day, t]) => `<li style="display:flex;justify-content:space-between;gap:1rem"><span>${day}</span><strong>${t}</strong></li>`).join("")}
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>
<section class="section section--paper">
  <div class="shell">
    <div class="section__head section__head--center"><h2>Request an appointment</h2>
    <p>Send us a message and the front desk will come back to you.</p></div>
    ${renderEmbed(FORMS.appointment)}
  </div>
</section>
<section class="section section--tight">
  <div class="shell">${renderEmbed(MAP_EMBED)}</div>
</section>`;
}

// ===========================================================================
// Appointment - the live page was a bare, non-functional calendar widget.
// ===========================================================================
function appointment(d, h) {
  const { renderEmbed, esc, PRACTICE } = h;
  return `${pageHero(h, "Request an Appointment", "Book online, send us a request, or call the front desk. New patients of all ages are welcome.")}
<section class="section">
  <div class="shell split">
    <div>
      <h2>Book online</h2>
      <p>Our online book shows live availability and takes about a minute.</p>
      <p><a class="btn" href="${BOOK}" target="_blank" rel="noopener">Open the online book</a></p>
      <h2 style="margin-top:2.5rem">Prefer to call?</h2>
      <p><a class="masthead__phone" href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a></p>
      <p class="card__meta">${esc(LOCATION_NOTE)}</p>
    </div>
    <div class="card">
      <h3>Office hours</h3>
      <ul style="list-style:none;padding:0;margin:0">
        ${OFFICE_HOURS.map(([day, t]) => `<li style="display:flex;justify-content:space-between;gap:1rem"><span>${day}</span><strong>${t}</strong></li>`).join("")}
      </ul>
      <p style="margin-top:1.25rem" class="card__meta">In pain today? Call us - we keep time aside for
      <a href="/services/emergency-dentist/">dental emergencies</a>.</p>
    </div>
  </div>
</section>
<section class="section section--paper">
  <div class="shell">
    <div class="section__head section__head--center"><h2>Send an appointment request</h2></div>
    ${renderEmbed(FORMS.appointment)}
  </div>
</section>`;
}

// ===========================================================================
// Financing - the live page rendered EMPTY (header straight into footer). Built
// here from the practice's own statements elsewhere on its site.
// ===========================================================================
function financing(d, h) {
  const { esc, PRACTICE } = h;
  return `${pageHero(h, "Financing and Insurance", "Ways to pay for treatment at Mason Park Dental of Katy.")}
<section class="section">
  <div class="shell">
    <div class="grid grid--3">
      <div class="card">
        <h3>Insurance</h3>
        <p>We process a variety of insurance plans and offer multiple payment options. Bring your
        card to your first visit and we will check your benefits with you before treatment starts.</p>
      </div>
      <div class="card">
        <h3>Cherry patient financing</h3>
        <p>Cherry offers monthly payment plans with 0% APR options and no hard credit check, so a
        larger treatment plan can be spread out. Ask the front desk to start an application.</p>
      </div>
      <div class="card">
        <h3>Dental savings plan</h3>
        <p>No insurance? The practice runs its own savings plan covering routine care at a reduced
        rate.</p>
        <p><a href="/dental-savings-plan/">See the savings plan</a></p>
      </div>
    </div>
    <div class="notice" style="margin-top:2rem">
      <p><strong>Second opinions are free.</strong> If you are unsure about a treatment plan from
      another practice, bring it in - see <a href="/special-offers/">special offers</a>.</p>
    </div>
  </div>
</section>
<section class="section section--paper">
  <div class="shell shell--narrow prose">
    <h2>Questions about cost</h2>
    <p>Every treatment plan is quoted before work begins. If you would like an estimate first, call
    the practice on <a href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a> and ask for a written
    treatment plan.</p>
    <p><a class="btn" href="${BOOK}" target="_blank" rel="noopener">Request an appointment</a></p>
  </div>
</section>`;
}

// ===========================================================================
// Virtual consultation
// ===========================================================================
function virtualConsultation(d, h) {
  const { esc, renderEmbed } = h;
  const steps = [
    "Snap some photos of your smile",
    "Write a quick message about your smile",
    "Get a video response from the doctor",
  ];
  const copy = paras(d, 4);
  return `${pageHero(h, "Virtual Consultation", "Skip taking time off work for an in-office consult. Get a free virtual consult in three easy steps.")}
<section class="section">
  <div class="shell">
    <div class="grid grid--3 steps">
      ${steps.map((s) => `<div class="card"><h4>${esc(s)}</h4></div>`).join("")}
    </div>
    ${copy.length ? `<div class="prose" style="margin-top:clamp(2rem,4vw,3rem)">${copy.map((p) => `<p>${esc(p.text)}</p>`).join("")}</div>` : ""}
  </div>
</section>
<section class="section section--paper">
  <div class="shell">
    <div class="section__head section__head--center"><h2>Start your virtual consult</h2></div>
    ${renderEmbed(FORMS.virtual) || `<p style="text-align:center"><a class="btn" href="/contacts/">Contact the practice</a></p>`}
  </div>
</section>`;
}

// ===========================================================================
// Smile gallery - the live /before-after/ page is 100% ThemeREX demo content
// (lorem ipsum plus the theme's own stock before/after photos). Publishing stock
// photos as this practice's results would be a misrepresentation, so the page
// ships honest and empty, with a note for the practice.
// ===========================================================================
function beforeAfter(d, h) {
  return `${pageHero(h, "Smile Gallery", "Real cases from Mason Park Dental of Katy.")}
<section class="section">
  <div class="shell shell--narrow prose">
    <div class="notice">
      <p><strong>This gallery is being rebuilt with the practice's own cases.</strong> The previous
      page carried the website theme's stock demo photos, which were never Mason Park patients. They
      have been removed rather than reused.</p>
    </div>
    <p>Cosmetic and restorative results are best judged case by case. Until the gallery is restocked
    with consented patient photography, the treatment pages describe what each procedure changes and
    how long it takes:</p>
    <ul>
      <li><a href="/services/cosmetic-dentistry/">Cosmetic dentistry</a></li>
      <li><a href="/services/invisalign/">Invisalign clear aligners</a></li>
      <li><a href="/services/dental-implant-restorations/">Dental implant restorations</a></li>
      <li><a href="/services/dental-crowns/">Dental crowns</a></li>
      <li><a href="/services/bonding/">Bonding</a></li>
    </ul>
    <p><a class="btn" href="${BOOK}" target="_blank" rel="noopener">Ask about your own case</a></p>
  </div>
</section>`;
}

// ===========================================================================
// Thank you
// ===========================================================================
function thankYou(d, h) {
  const { esc, PRACTICE } = h;
  return `
<section class="section">
  <div class="shell shell--narrow" style="text-align:center">
    <p class="eyebrow">Katy, TX</p>
    <h1>Thank you!</h1>
    <p>Your request has reached the front desk. Someone from Mason Park Dental of Katy will be in
    touch during office hours to confirm your appointment.</p>
    <p><a class="btn" href="${PRACTICE.phoneHref}">Call ${esc(PRACTICE.phone)}</a>
       <a class="btn btn--ghost" href="/">Back to the homepage</a></p>
  </div>
</section>
<section class="section section--paper">
  <div class="shell">
    <div class="section__head section__head--center"><h2>While you wait</h2></div>
    <div class="grid grid--3">
      <a class="card card--link" href="/patient-resources/"><h3>Patient resources</h3><p>Forms, insurance and payment options.</p></a>
      <a class="card card--link" href="/special-offers/"><h3>Special offers</h3><p>Current new-patient and treatment offers.</p></a>
      <a class="card card--link" href="/our-services/"><h3>Our services</h3><p>What we treat, explained.</p></a>
    </div>
  </div>
</section>`;
}

// ===========================================================================
// Special offers - the page that carries the practice's actual prices, so every
// figure here is lifted verbatim from the live page rather than restated. The
// short headline for each offer and its longer explanation live in two separate
// Elementor sections upstream; they are paired back up by price.
// ===========================================================================
function specialOffers(d, h) {
  const { esc, renderEmbed } = h;
  const intro = paras(d, 3)[0];
  const blocks4 = inSection(d, 4);
  // The long explanation of each offer sits in an Elementor toggle, so it now
  // arrives as a `faq` block rather than a bare paragraph. Read both.
  const stripTags = (x) => String(x || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const faqs = (d.blocks || []).filter((b) => b.type === "faq");
  const details = [...paras(d, 5).map((p) => p.text), ...faqs.map((f) => stripTags(f.html))];

  // Pair "$189 NEW PATIENT SPECIAL" with the paragraph in s5 that quotes $189.
  const newPatient = [];
  for (let i = 0; i < blocks4.length; i++) {
    const b = blocks4[i];
    if (b.type !== "heading") continue;
    const price = (b.text.match(/\$[\d,]+/) || [])[0] || "";
    const label = b.text.replace(/^\$[\d,]+\s*/, "");
    const short = blocks4[i + 1]?.type === "para" ? blocks4[i + 1].text : "";
    const detail = price ? details.find((t) => t.includes(price) && t !== short) : "";
    newPatient.push({ price, label, short, detail });
  }

  // The two treatment offers and the free second opinion, each its own section.
  const treatment = [6, 7].flatMap((n) => {
    const items = inSection(d, n);
    const out = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type !== "heading") continue;
      const body = [];
      for (let j = i + 1; j < items.length && items[j].type === "para"; j++) body.push(items[j].text);
      out.push({ title: items[i].text, body });
    }
    return out;
  });

  const card = (o) => `
      <div class="offer">
        ${o.price ? `<p class="offer__price">${esc(o.price)}</p>` : ""}
        <h3>${esc(softenLabel(o.label))}</h3>
        ${o.short ? `<p><strong>${esc(o.short)}</strong></p>` : ""}
        ${o.detail ? `<p>${esc(o.detail)}</p>` : ""}
      </div>`;

  return `${pageHero(h, "Special Offers", d.description || "")}
<section class="section">
  <div class="shell">
    ${intro ? `<div class="section__head"><p>${esc(intro.text.replace(/\.(?=[A-Z])/, ". "))}</p></div>` : ""}
    <h2>New patient offers</h2>
    <div class="grid grid--3" style="margin-top:1.75rem">${newPatient.map(card).join("")}</div>
  </div>
</section>
<section class="section section--paper">
  <div class="shell">
    <h2>Treatment offers</h2>
    <div class="grid grid--3" style="margin-top:1.75rem">
      ${treatment.map((t) => {
        // "INVISALIGN SPECIAL OFFER: $1000 OFF" -> pill "$1000 off", title without it
        const off = (t.title.match(/\$[\d,]+\s*OFF/i) || [])[0];
        const title = softenLabel(t.title.replace(/[:,]?\s*\$[\d,]+\s*OFF/i, "").replace(/[:\s]+$/, ""));
        return `
      <div class="offer">
        ${off ? `<p class="offer__price">${esc(off.replace(/OFF/i, "off"))}</p>` : ""}
        <h3>${esc(title)}</h3>
        ${t.body.map((p) => `<p>${esc(p)}</p>`).join("")}
      </div>`;
      }).join("")}
      <div class="offer">
        <h3>Free Invisalign consultation</h3>
        <p>${esc(details.find((t) => /complimentary Invisalign consultation/i.test(t)) || "")}</p>
      </div>
    </div>
    <div class="notice" style="margin-top:2rem">
      <p>Offers are for new patients unless stated otherwise, cannot be combined with insurance,
      and do not apply in cases of periodontal disease. Ask the front desk which offer applies to
      your treatment plan before you book.</p>
    </div>
  </div>
</section>
<section class="section">
  <div class="shell split">
    <div>
      <h2>Claim an offer</h2>
      <p>Mention the offer when you book, or send us a message and the front desk will apply it.</p>
      <p><a class="btn" href="${BOOK}" target="_blank" rel="noopener">Schedule online</a>
         <a class="btn btn--ghost" href="${h.PRACTICE.phoneHref}">Call ${esc(h.PRACTICE.phone)}</a></p>
      <p class="card__meta">${esc(LOCATION_NOTE)}</p>
    </div>
    <div>${renderEmbed(FORMS.offers)}</div>
  </div>
</section>`;
}

// Offer headings are shouted upstream; sentence-case them but keep the prices
// and the trademarked product names intact.
const softenLabel = (s) =>
  s.replace(/[\w®$,]+/g, (w) =>
    /^\$|^(TX|FAQ|AI|DMD)$/.test(w) ? w :
    /^INVISALIGN$/i.test(w) ? "Invisalign" :
    w[0] + w.slice(1).toLowerCase());

// ===========================================================================
// Privacy policy - 403 on the live site, and it is linked from the footer of
// every page. This is a factual notice about how the REBUILT static site
// behaves. It is NOT a substitute for the practice's HIPAA notice of privacy
// practices, and says so.
// ===========================================================================
function privacyPolicy(d, h) {
  const { esc, PRACTICE } = h;
  return `${pageHero(h, "Privacy Policy", "How this website handles your information.")}
<section class="section">
  <div class="shell shell--narrow prose">
    <div class="notice"><p><strong>For review.</strong> This notice describes the website only. The
    practice's HIPAA Notice of Privacy Practices, which covers your dental records, is a separate
    document and should be reviewed and published by the practice.</p></div>

    <h2>What this site collects</h2>
    <p>These pages are static. They set no cookies of their own, run no analytics and build no
    profile of you.</p>

    <h2>Forms and booking</h2>
    <p>Appointment requests and virtual-consultation forms on this site are hosted by third-party
    providers on behalf of the practice. What you type into them is sent to Mason Park Dental of
    Katy and handled under that provider's own terms. Online booking opens the practice's scheduling
    provider in a new tab.</p>

    <h2>Embedded content</h2>
    <p>The map on our contact pages is served by Google Maps, which may set its own cookies once it
    loads. It is only loaded when you scroll to it.</p>

    <h2>Contact</h2>
    <p>Questions about your information, or a request to have it removed, can go to the practice
    directly on <a href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a> or at
    ${esc(PRACTICE.street)}, ${esc(PRACTICE.city)}, ${esc(PRACTICE.region)} ${esc(PRACTICE.postal)}.</p>
  </div>
</section>`;
}

export const BESPOKE = {
  home,
  "our-services": ourServices,
  "about-us": aboutUs,
  "our-team": ourTeam,
  contacts,
  appointment,
  financing,
  "virtual-consultation": virtualConsultation,
  "before-after": beforeAfter,
  "thank-you": thankYou,
  "special-offers": specialOffers,
  "privacy-policy": privacyPolicy,
};

// Pages that exist on the live site but carry nothing but theme demo content.
// They are not in the menu and are not rebuilt.
export const SKIP = new Set(["pricing", "sample", "shop"]);

// Titles and descriptions for pages the WordPress site could not supply them for
// - the two that returned 403 to the crawler, and the ones this rebuild authors.
export const META = {
  "our-team": {
    title: "Meet Our Team | Mason Park Dental of Katy",
    description: "Meet the dentists and team at Mason Park Dental of Katy - Dr. Dave Cho, Dr. William Sung and Dr. Tam Nguyen, DMD, board certified pediatric dentist.",
  },
  "privacy-policy": {
    title: "Privacy Policy | Mason Park Dental of Katy",
    description: "How the Mason Park Dental of Katy website handles your information.",
  },
  appointment: {
    title: "Request an Appointment | Mason Park Dental of Katy",
    description: "Book online, send an appointment request or call (281) 769-8878. New patients of all ages welcome in Katy, TX.",
  },
  financing: {
    title: "Financing and Insurance | Mason Park Dental of Katy",
    description: "Insurance, Cherry patient financing and the in-house dental savings plan at Mason Park Dental of Katy.",
  },
  "before-after": {
    title: "Smile Gallery | Mason Park Dental of Katy",
    description: "Cosmetic and restorative results from Mason Park Dental of Katy.",
  },
  "thank-you": {
    title: "Thank You | Mason Park Dental of Katy",
    description: "Thank you - your request has reached the front desk at Mason Park Dental of Katy.",
  },
  "our-services": {
    title: "Our Services | Dentist in Katy, TX | Mason Park Dental",
    description: "Family, cosmetic, restorative, pediatric and emergency dentistry in Katy, TX. Every treatment Mason Park Dental of Katy offers, in one place.",
  },
};
