// Hand-authored page templates.
//
// LAYOUT comes from the pre-takedown screenshots in
// ../../01-content-intake/.tmp/site-screenshots/desktop/ — not from the old
// site's markup, which was Elementor soup wrapped around theme demo content.
//
// COPY comes verbatim out of content/<slug>.json. Nothing here retypes a
// sentence, a price or a credential: those are the practice's published words
// and a transcription step is exactly where a wrong digit would get in.
//
// STRUCTURE is composed from site/components.mjs. No template writes a card, a
// section shell or a button by hand — if one looks wrong everywhere, it is one
// fix in the library.

import { NAV, SERVICE_SLUGS as SERVICE_SLUGS_REF } from "../pages.config.mjs";
import { LEGAL_PAGES } from "./legal.mjs";
// The homepage moved out on 2026-08-31 when it was rebuilt as eight named
// chapters. `home()` below is retained under `homeLegacy` purely as the record
// of the band layout it replaced; nothing renders it.
import { home as homeJourney } from "./home.mjs";
import { makeChapters } from "./chapters.mjs";
import { ARCS } from "./catalogue.mjs";

// ------------------------------------------------------------ block helpers
const inSection = (d, n) => (d.blocks || []).filter((b) => b.section === n);
const heads = (d, n) => inSection(d, n).filter((b) => b.type === "heading").map((b) => b.text);
const paras = (d, n) => inSection(d, n).filter((b) => b.type === "para");
const imgs = (d, n) => inSection(d, n).filter((b) => b.type === "image");
const embeds = (d, n) => inSection(d, n).filter((b) => b.type === "embed");
const faqs = (d) => (d.blocks || []).filter((b) => b.type === "faq");
const stripTags = (x) => String(x || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const BOOK = "https://www.flexbook.me/masonpark/1";

// Two typos the live theme baked into the virtual-consult steps: a missing space
// and a stray zero-width space. Fixed here; the wording itself is untouched.
const fixTypos = (s) => s.replace(/​/g, "").replace(/\bSomePhotos\b/, "Some Photos").trim();

// Offer and service headings are shouted upstream. Sentence-case them, but keep
// prices and trademarked product names intact.
const softenLabel = (s) =>
  s.replace(/[\w®$,]+/g, (w) =>
    /^\$|^(TX|FAQ|AI|DMD)$/.test(w) ? w
      : /^INVISALIGN$/i.test(w) ? "Invisalign"
      : w[0] + w.slice(1).toLowerCase());

// The practice's own embedded forms, harvested from the live pages.
const FORMS = {
  // The practice's own "Contact form" in Brandklout's GoHighLevel, supplied by
  // the client on 2026-08-28. It replaces the form the crawler harvested off
  // the old WordPress /contacts/ page (9tzFcq7rgDGIvq5wJfWL, still used by
  // /appointment/), which belongs to the previous agency's GHL location — leads
  // from it do not reach this pipeline.
  contact: "https://api.leadconnectorhq.com/widget/form/JuzM9SxuJMPDMwfO6cgj",
  appointment: "https://api.leadconnectorhq.com/widget/form/9tzFcq7rgDGIvq5wJfWL",  // /appointment/
  virtual: "https://form.123formbuilder.com/js-form-username-6049703.html",          // /virtual-consultation/
  offers: "https://form.123formbuilder.com/js-form-username-6127475.html",           // /special-offers/
};
const MAP_EMBED = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3463.0585305167815!2d-95.75121988455305!3d29.775949038160515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86412740e7dd5def%3A0xfa1ab8c6e696e133!2sMason%20Park%20Dental%20-%20Katy%20Dentist!5e0!3m2!1sen!2sus!4v1638807674675!5m2!1sen!2sus";
const LOCATION_NOTE = "We are located at the corner of Mason Rd and Kingsland Blvd, behind the Ranch 99 complex.";

// The service index, grouped. The live homepage cycled twelve identical icon
// tiles through a carousel and the Figma comps replaced that with fourteen
// identical bordered tiles in one 4-column grid — both rank nothing, so a
// visitor has to read every label to find the one they came for. These are the
// same fourteen treatments, in three groups a person can scan.
//
// [icon, label, one-line description, href]. Icon names resolve in
// site/icons.mjs; descriptions come from the Figma comps where the comps have
// them and are written in the same register where they do not.
const SERVICE_GROUPS = [
  ["Everyday care", [
    ["brush", "Preventative Dentistry", "Cleanings, exams, sealants and the appointments that keep the rest away.", "/services/preventative-dentistry/"],
    ["care", "Comprehensive Care", "Full-spectrum dental services under one roof for the whole family.", "/services/comprehensive-care/"],
    ["child", "Pediatric Dental Care", "Gentle, kid-friendly exams and cleanings in a familiar space.", "/services/pediatric-dental-care/"],
    ["emergency", "Emergency Dentist", "Same-day help when something breaks, aches or comes loose.", "/services/emergency-dentist/"],
  ]],
  ["Cosmetic and orthodontic", [
    ["sparkle", "Cosmetic Dentistry", "Veneers, bonding and smile makeovers tailored to your goals.", "/services/cosmetic-dentistry/"],
    ["tooth", "Veneers", "Shade and shape previewed before anything is prepared.", "/services/porcelain-dental-veneers/"],
    ["aligner", "Invisalign", "Clear aligners planned digitally, checked in person, no metal.", "/services/invisalign/"],
    ["scan", "Advanced Technology", "Digital imaging, 3D scans and laser treatment for precision care.", "/technology/"],
  ]],
  ["Restorative and surgical", [
    ["implant", "Dental Implants", "Permanent titanium posts topped with crowns for missing teeth.", "/services/dental-implant-placement/"],
    ["dentures", "Dentures", "Custom-fitted full and partial dentures for natural comfort and fit.", "/services/dentures/"],
    ["rootcanal", "Root Canal Therapy", "Saving a tooth that is infected rather than taking it out.", "/services/root-canal-therapy/"],
    ["surgery", "Oral Surgery", "Expert surgical care for complex extractions and jaw concerns.", "/services/oral-surgery/"],
    ["extraction", "Extractions", "Straightforward and surgical removals, wisdom teeth included.", "/services/extractions/"],
    ["sedation", "Sedation Dentistry", "Relaxed, anxiety-free visits with safe sedation options.", "/services/sedation-dentistry/"],
  ]],
];
const SERVICE_TILES = SERVICE_GROUPS.flatMap(([, items]) => items);

// Role lines under the three portraits. They sit in a theme subtitle element the
// extractor folds away, so they come from the homepage screenshot
// (site-screenshots/desktop/home.png, "MEET THE DENTAL TEAM"). The blurbs are
// condensed from each dentist's own bio page — nothing here is invented.
const DOCTORS = [
  ["/wp-content/uploads/2023/11/HS-8-scaled.jpg", "Dr. Tam Nguyen", "Board Certified Pediatric Dentist", "/team/tam-nguyen/",
    "Dental degree and pediatric residency at Boston University. She treats children from six months old, and patients with special needs."],
  ["/wp-content/uploads/2023/11/HS-7-scaled.jpg", "Dr. Dave Cho", "General Dentist", "/team/dr-cho/",
    "Experienced in oral sedation, endodontics, oral surgery, implant placement and cosmetic dentistry, with a manner that puts patients at ease."],
  ["/wp-content/uploads/2020/04/DrWilliamSung-230x300-1.webp", "Dr. William Sung", "General Dentist", "/team/dr-sung/",
    "Fellow of the Academy of General Dentistry — a distinction held by 7% of general dentists in Texas — and around 100 hours of continuing education a year."],
];

// ------------------------------------------------------------ shared blocks
/** Standard page opening: plain hero + breadcrumb. */
const openPage = (h, title, sub, eyebrow = "Katy, TX") =>
  h.C.heroPlain({ eyebrow, title, text: sub }) + "\n" +
  h.C.breadcrumb([{ label: "Home", href: "/" }, { label: title }]);

/** The booking block that closes most pages, over the credential strip. */
const bookingSection = (h) => {
  const C = h.C;
  return C.badgeStrip(h.ACCREDITATIONS) + "\n" + C.section({ name: "booking", bg: "paper", inner: C.split(
    `${C.heading("Book your visit")}
     ${C.spacer("small")}
     ${C.paragraph("New and existing patients are welcome. Book online at any hour, or call the practice during office hours and we will find you a time.")}
     ${C.spacer("small")}
     ${C.buttonGroup([
        { label: "Schedule online", href: BOOK, external: true },
        { label: `Call ${h.PRACTICE.phone}`, href: h.PRACTICE.phoneHref, variant: "ghost" },
      ])}
     ${C.spacer("small")}
     <p class="card_meta">${h.esc(LOCATION_NOTE)}</p>`,
    `<div class="card_component">
       ${C.heading("Office hours", { level: 3, style: 4 })}
       ${C.hoursList(h.HOURS)}
     </div>`,
  ) });
};
// ===========================================================================
// The homepage lives in site/home.mjs.
//
// It used to live here, as `home()`, and was thirteen full width bands of equal
// weight. It was replaced on 2026-09-01 by eight named chapters, for the reason
// recorded at the top of that file and in DESIGN-STANDARD.md. The old function
// is deleted rather than kept commented out: a dead page template is the thing
// that gets copied forward by mistake, and git has it.
// ===========================================================================

// ===========================================================================
// Our services — the live page was an icon carousel that named no service in
// text, so this lists every treatment page the site actually has.
// ===========================================================================
function ourServices(d, h) {
  const K = makeChapters(h);
  const esc = h.esc;

  // Featured imagery comes from each service page's own content file, so a
  // treatment brings its own photograph and no image slot is a placeholder.
  const featured = (slug, fallback) => {
    const page = h.read("services-" + slug) || h.read(slug);
    return (page && page.featured && page.featured.src) || fallback;
  };

  // THE COMPLETE INDEX. The homepage shows the three arcs as a teaser; this
  // page is where a visitor comes to see everything, so every service route the
  // build actually renders is listed, grouped by the same three arcs plus the
  // treatments that belong to none of them. Nothing is hand-typed: the groups
  // are read off the catalogue and the remainder is whatever is left over, so
  // adding a service page cannot silently fail to appear here.
  const inArcs = new Set(ARCS.flatMap((a) => a.items.map(([, , href]) => href)));
  const arcLabels = new Set(ARCS.flatMap((a) => a.items.map(([name]) => name.toLowerCase())));
  const rest = SERVICE_SLUGS_REF
    .map((sl) => ({ name: h.labelFor(sl), href: h.routeOf(sl) }))
    .filter((x) => !inArcs.has(x.href))
    // A label collision here means two pages reduce to the same words, which on
    // an index pointing at two URLs is indistinguishable to a reader. Dropping
    // one ORPHANS it, which audit.mjs correctly refuses. The fix belongs
    // upstream, in the catalogue: each arc item is named for the page it
    // actually opens. This assertion is what keeps it that way.
    .filter((x) => {
      if (arcLabels.has(x.name.toLowerCase())) {
        throw new Error(`our-services: "${x.name}" (${x.href}) collides with an arc label. ` +
          `Name the arc item for its own destination in site/catalogue.mjs rather than dropping ` +
          `this page, which would orphan it.`);
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const groups = ARCS.map((a) => ({
    label: a.label,
    items: a.items.map(([name, , href]) => ({ name, href })),
  })).concat(rest.length ? [{ label: "Everything else we offer", items: rest, wide: true }] : []);

  return [
    K.arrival({
      n: 0, name: "The Range", compact: true,
      image: featured("cosmetic-dentistry", "/wp-content/uploads/2023/11/Dentist-in-Katy-Office.webp"),
      alt: "Treatment at Mason Park Dental of Katy",
      title: "Thirty five treatments. <em>No</em> referral out.",
      lede: "Everyday care, cosmetic and orthodontic work, and the restorative and surgical treatment most practices send you somewhere else for. All of it in one building on Kingsland Boulevard.",
      actions: K.button({ label: "Book an appointment", href: BOOK, large: true, external: true }),
    }),

    K.chapter({
      n: 1, name: "The Range", cls: "ch-range", id: "range", theme: "warm",
      inner: `
  <div class="wrap rg-head">
    ${K.tag("The Range")}
    <h2 data-split>Three kinds of appointment, and what each one covers.</h2>
  </div>
  ${ARCS.map((a, i) => K.arc({
    key: a.key, numeral: a.numeral, label: a.label, title: a.title, text: a.text,
    image: featured(a.lead, "/wp-content/uploads/2023/11/Dentist-in-Katy-Office.webp"),
    imageAlt: a.label + " at Mason Park Dental",
    items: a.items.map(([name, blurb, href, slug]) => ({ name, blurb, href, thumb: featured(slug, "") })),
    flipped: i % 2 === 1,
  })).join("")}`,
    }),

    K.chapter({
      n: 2, name: "Everything", cls: "ch-catalogue", id: "catalogue",
      inner: `
  <div class="wrap rg-head">
    ${K.tag("Everything")}
    <h2 data-split>Every treatment, with a page of its own.</h2>
    <p class="pe-lede">Each one explains what it is, who it suits and what to expect on the day. If you are not sure which you need, book and ask: that is what the first visit is for.</p>
  </div>
  ${K.columnIndex(groups)}`,
    }),

    K.chapter({
      n: 3, name: "The Cost", cls: "ch-cost", id: "cost", theme: "warm",
      inner: `
  <div class="wrap rg-head">
    ${K.tag("The Cost")}
    <h2 data-split>What it costs, before it starts.</h2>
    <p class="pe-lede">Treatment is planned and priced in writing before any work begins, with what insurance covers and what it does not. Cherry splits the balance at 0% APR with no hard credit check.</p>
  </div>
  ${K.columnIndex([
    { label: "Prices and plans", items: [
      { name: "Dental implant costs", href: "/dental-implant-costs/" },
      { name: "Costos de implantes dentales", href: "/dental-implant-costs-esp/" },
      { name: "Financing and insurance", href: "/financing/" },
      { name: "Dental savings plan", href: "/dental-savings-plan/" },
      { name: "Special offers", href: "/special-offers/" },
    ] },
    { label: "The technology behind it", items: [
      { name: "Our technology", href: "/technology/" },
      { name: "Technology and AI", href: "/technology-ai/" },
      { name: "Pearl AI", href: "/pearl-ai/" },
      { name: "Ceramill Motion 3", href: "/ceramillmotion3/" },
    ] },
  ])}`,
    }),

    K.chapter({
      n: 4, name: "The Invitation", cls: "ch-invitation", id: "invitation", theme: "dark",
      inner: `
  <div class="wrap iv-top">
    <div class="iv-copy">
      ${K.tag("The Invitation")}
      <h2 data-split>Not sure which one you need?</h2>
      <p class="iv-lede">Book a first visit and say what is bothering you. A full exam, digital x-rays and a plan you can see are what that appointment is for, and nothing is started on the day you arrive.</p>
      <div class="iv-actions">
        ${K.button({ label: "Book an appointment", href: BOOK, large: true, external: true })}
        ${K.button({ label: h.PRACTICE.phone, href: h.PRACTICE.phoneHref, ghost: true, large: true })}
      </div>
      ${K.facts([
        ["In pain today", `Call the practice. We keep same day slots for pain, breaks and knocked out teeth. <a href="/services/emergency-dentist/">Emergency dentistry</a>.`],
        ["Hours", "Mon and Wed <b>9am to 6pm</b><br>Tue and Thu <b>8am to 5pm</b><br>Fri to Sun <b>Closed</b>"],
        ["Bringing children", `Dr. Nguyen is board certified in pediatric dentistry. <a href="/our-doctors/">Meet the doctors</a>.`],
      ])}
    </div>
    <div class="iv-aside">
      <figure class="iv-shot">
        ${h.img("/wp-content/uploads/2023/11/Dentist-in-Katy-Office.webp", "The waiting room at Mason Park Dental of Katy", { sizes: "(max-width: 899px) 100vw, 42vw" })}
        <figcaption>Suite 104A, on the ground floor. Free parking at the door.</figcaption>
      </figure>
    </div>
  </div>`,
    }),
  ].join("\n");
}

// ===========================================================================
// About us — the practice intro and three real bios. The theme's demo award
// table and lorem sections that sat below them are dropped.
// ===========================================================================
function aboutUs(d, h) {
  const C = h.C;
  const intro = paras(d, 3);
  const bios = [4, 5, 6].map((n) => ({
    name: heads(d, n).find((t) => /^Dr\./i.test(t)) || "",
    tagline: (d.blocks || []).find((b) => b.section === n && b.type === "heading" && b.level === 6)?.text || "",
    body: paras(d, n)[0]?.text || "",
    img: imgs(d, n)[0],
    href: /Nguyen/i.test(heads(d, n).join(" ")) ? "/team/tam-nguyen/"
      : /Cho/i.test(heads(d, n).join(" ")) ? "/team/dr-cho/" : "/team/dr-sung/",
  })).filter((b) => b.name);

  return [
    openPage(h, "About Us", heads(d, 3).find((t) => t.startsWith("Meet")) || ""),
    C.section({ name: "intro", container: "medium", inner: `
      ${intro.map((p) => C.paragraph(p.text, { size: "medium" })).join(C.spacer("small"))}
      ${C.spacer("medium")}
      ${C.button({ label: "Request an appointment", href: BOOK, external: true })}` }),
    ...bios.map((b, i) => C.section({
      name: "doctor-bio", bg: i % 2 === 0 ? "paper" : "",
      inner: C.split(
        b.img ? h.img(b.img.src, b.name, { sizes: "(max-width: 899px) 100vw, 560px" }) : "",
        `${C.eyebrow(b.tagline)}
         ${C.heading(b.name)}
         ${C.spacer("small")}
         ${C.paragraph(b.body)}
         ${C.spacer("small")}
         ${C.button({ label: "Full profile", href: b.href, variant: "ghost" })}`,
        { flipped: i % 2 === 1 },
      ),
    })),
    bookingSection(h),
  ].join("\n");
}

// ===========================================================================
// Meet our team — 403 on the live site, and it is in the main menu.
// ===========================================================================
function ourTeam(d, h) {
  const C = h.C;
  const cards = DOCTORS.map(([image, name, role, href]) => {
    const bio = h.read("team-" + href.replace(/^\/team\/|\/$/g, ""));
    // Dr. Nguyen's page opens with a lorem ipsum block the practice never
    // noticed, so the same boilerplate filter the page templates use runs here.
    const first = h.stripBoilerplate(bio?.blocks || []).find((b) => b.type === "para")?.text
      || stripTags(bio?.html).slice(0, 260);
    const blurb = first ? first.slice(0, 190) + (first.length > 190 ? "…" : "") : "";
    return C.doctorCard({ image, name, role, href, blurb });
  });

  return [
    openPage(h, "Meet Our Team", "The dentists and the support team who look after Katy families every day."),
    C.section({ name: "team", inner: `
      ${C.sectionHeading({ title: "Our dentists", centered: true })}
      ${C.grid(3, cards)}` }),
    C.section({ name: "behind-the-chair", bg: "paper", container: "medium", inner: `
      ${C.heading("Behind the chair")}
      ${C.spacer("small")}
      ${C.paragraph("Alongside the dentists, Mason Park Dental of Katy is run by a full team of hygienists, dental assistants and front-office staff. They are the people who greet you, handle your insurance and keep your appointments running to time.")}
      ${C.spacer("medium")}
      ${C.notice("<p><strong>Staff profiles to add:</strong> the practice's hygienists and front-office team are named repeatedly in patient reviews but have no profiles on the old site. Send us names, roles and photos and they will be added here.</p>")}` }),
    bookingSection(h),
  ].join("\n");
}

// ===========================================================================
// Meet the doctors — the second page carried onto the chapter system.
//
// It was three alternating split sections and a booking band: the same
// architecture the homepage was rebuilt out of, and the same failure. Swapping
// two doctors changed nothing, because nothing connected them.
//
// The order is an argument now. Dr. Nguyen leads ALONE, in her own chapter,
// because a board certified pediatric dentist in the building is the thing that
// makes this practice different from every other one in Katy. The two general
// dentists follow as a pair, because their story is the range they cover
// between them. Then what all three hold in common, then the invitation.
//
// Every part comes from site/chapters.mjs. Nothing here writes markup, and the
// copy is still verbatim out of the crawled page: the chapter system changes
// the arrangement, never the practice's own words.
// ===========================================================================
function ourDoctors(d, h) {
  const K = makeChapters(h);
  const esc = h.esc;
  const PERSONAL = /^When (not in the office|he'?s not in the office|she'?s not in the office)/i;

  const doctors = [3, 4, 5].map((n) => {
    const items = inSection(d, n);
    const name = (items.find((b) => b.type === "heading" && b.level === 2)?.text || "").trim();
    const role = items.find((b) => b.type === "heading" && b.level > 2)?.text || "";
    const all = items.filter((b) => b.type === "para").map((b) => b.text);
    const match = DOCTORS.find(([, dn]) => dn.toLowerCase() === name.toLowerCase());
    return {
      name,
      role: (role || match?.[2] || "").replace(/​/g, "").trim(),
      portrait: match?.[0] || items.find((b) => b.type === "image")?.src,
      href: match?.[3],
      bio: all.filter((t) => !PERSONAL.test(t)),
      personal: all.find((t) => PERSONAL.test(t)),
    };
  }).filter((x) => x.name);

  // The crawler returns Dr. Nguyen's personal line and her philosophy statement
  // as ONE paragraph, run together with no space: `...national parks.“My
  // philosophy focuses on...`. fixRunOn cannot repair it because the sentence
  // boundary has a quotation mark sitting in it. They are two different things
  // anyway, and setting ninety words as one display-size aside is a wall, so
  // they are split at the opening quote and set as an aside and a pull quote.
  const splitPersonal = (t) => {
    if (!t) return { note: "", quote: "" };
    const i = t.search(/[“"]/);
    if (i === -1) return { note: t.trim(), quote: "" };
    return {
      note: t.slice(0, i).trim(),
      quote: t.slice(i).replace(/^[“"]\s*/, "").replace(/[”"]\s*$/, "").trim(),
    };
  };

  const pediatric = doctors.find((x) => x.name.toLowerCase().includes("nguyen"));
  const general = doctors.filter((x) => x !== pediatric);

  const spreadFor = (doc, i) => K.spread({
    image: doc.portrait,
    alt: doc.name + ", " + doc.role,
    title: doc.name,
    role: doc.role,
    body: doc.bio,
    note: splitPersonal(doc.personal).note,
    quote: splitPersonal(doc.personal).quote,
    link: doc.href ? K.linkArrow({ label: "Full profile", href: doc.href }) : "",
    flipped: i % 2 === 1,
  });

  return [
    K.arrival({
      n: 0, name: "The People", compact: true,
      image: "/wp-content/uploads/2023/11/g7-1536x1024.jpg",
      alt: "The team at Mason Park Dental of Katy", w: 1536, height: 1024,
      title: "Three dentists. <em>One</em> building.",
      lede: "A board certified pediatric dentist and two general dentists, sharing one practice on Kingsland Boulevard, so a family never has to be split between two.",
      actions: K.button({ label: "Book an appointment", href: BOOK, large: true, external: true }),
    }),

    pediatric ? K.chapter({
      n: 1, name: "The Specialist", cls: "ch-specialist", id: "specialist",
      inner: `
  <div class="wrap pe-head">
    ${K.tag("The Specialist")}
    <h2 data-split>The reason a family does not need a second practice.</h2>
    <p class="pe-lede">Pediatric dentistry is one of the recognised dental specialties and it takes three years beyond dental school. Most practices in Katy refer children out to somebody who has done it. This one does not.</p>
  </div>
  ${spreadFor(pediatric, 0)}`,
    }) : "",

    general.length ? K.chapter({
      n: 2, name: "The Range", cls: "ch-generalists", id: "generalists", theme: "warm",
      inner: `
  <div class="wrap pe-head">
    ${K.tag("The Range")}
    <h2 data-split>Between them, almost nothing gets referred out.</h2>
    <p class="pe-lede">Sedation, endodontics, oral surgery, implant placement and cosmetic work are handled in this building rather than passed to somebody else's calendar.</p>
  </div>
  ${general.map((doc, i) => spreadFor(doc, i + 1)).join("")}`,
    }) : "",

    K.chapter({
      n: 3, name: "The Standard", cls: "ch-standard", id: "standard", theme: "dark",
      inner: `
  <div class="wrap pe-head">
    ${K.tag("The Standard")}
    <h2 data-split>What all three keep doing after they qualified.</h2>
    <p class="pe-lede">Continuing education is the difference between a dentist who trained once and one who is still training. These are the bodies whose programmes this practice takes part in.</p>
  </div>
  ${K.badges(h.ACCREDITATIONS)}`,
    }),

    K.chapter({
      n: 4, name: "The Invitation", cls: "ch-invitation", id: "invitation", theme: "dark",
      inner: `
  <div class="wrap iv-top">
    <div class="iv-copy">
      ${K.tag("The Invitation")}
      <h2 data-split>Ask for whichever one you want.</h2>
      <p class="iv-lede">Tell the front desk who you would like to see and they will book it. If you are bringing a child and an adult on the same visit, say so and both go in one slot.</p>
      <div class="iv-actions">
        ${K.button({ label: "Book an appointment", href: BOOK, large: true, external: true })}
        ${K.button({ label: h.PRACTICE.phone, href: h.PRACTICE.phoneHref, ghost: true, large: true })}
      </div>
      ${K.facts([
        ["Address", `<a href="${esc(h.PRACTICE.maps)}" target="_blank" rel="noopener">${esc(h.PRACTICE.street)}<br>${esc(h.PRACTICE.city)}, ${esc(h.PRACTICE.region)} ${esc(h.PRACTICE.postal)}</a>`],
        ["Hours", "Mon and Wed <b>9am to 6pm</b><br>Tue and Thu <b>8am to 5pm</b><br>Fri to Sun <b>Closed</b>"],
        ["The whole team", `Hygienists and front desk are on the <a href="/our-team/">team page</a>.`],
      ])}
    </div>
    <div class="iv-aside">
      <figure class="iv-shot">
        ${h.img("/wp-content/uploads/2023/11/Dentist-in-Katy-Office.webp", "The waiting room at Mason Park Dental of Katy", { sizes: "(max-width: 899px) 100vw, 42vw" })}
        <figcaption>Suite 104A, on the ground floor. Free parking at the door.</figcaption>
      </figure>
    </div>
  </div>`,
    }),
  ].filter(Boolean).join("\n");
}

// ===========================================================================
// Contacts
// ===========================================================================
function contacts(d, h) {
  const C = h.C;
  const body = paras(d, 2).filter((p) => !/^(Visit Us|Call Us|Connect Online)/i.test(p.text));

  return [
    openPage(h, "Contact Mason Park Dental of Katy", d.description || ""),
    C.section({ name: "contact", inner: C.sectionHeading({ title: "How to reach us" }) + C.split(
      `${body.map((p) => C.paragraph(p.text)).join(C.spacer("small"))}
       ${C.spacer("medium")}
       ${C.notice(`<p>${h.esc(LOCATION_NOTE)}</p>`)}`,
      C.grid(1, [
        C.card({ title: "Visit us", html: `<p><a href="${h.esc(h.PRACTICE.maps)}" target="_blank" rel="noopener">${h.esc(h.PRACTICE.street)}<br>${h.esc(h.PRACTICE.city)}, ${h.esc(h.PRACTICE.region)} ${h.esc(h.PRACTICE.postal)}</a></p>` }),
        C.card({ title: "Call or email us", html: `<p><a class="phone-link_component" href="${h.PRACTICE.phoneHref}">${h.esc(h.PRACTICE.phone)}</a></p><p><a href="mailto:${h.esc(h.PRACTICE.email)}">${h.esc(h.PRACTICE.email)}</a></p>${C.button({ label: "Schedule online", href: BOOK, external: true })}` }),
        C.card({ title: "Office hours", html: C.hoursList(h.HOURS) }),
      ]),
      { textWide: true },
    ) }),
    C.section({ name: "contact-form", bg: "paper", inner: `
      ${C.sectionHeading({ title: "Request an appointment", text: "Send us a message and the front desk will come back to you.", centered: true })}
      ${h.renderEmbed(FORMS.contact)}` }),
    C.section({ name: "map", padding: "small", inner: h.renderEmbed(MAP_EMBED) }),
  ].join("\n");
}

// ===========================================================================
// Appointment — the live page was a bare, non-functional calendar widget.
// ===========================================================================
function appointment(d, h) {
  const C = h.C;
  return [
    openPage(h, "Request an Appointment", "Book online, send us a request, or call the front desk. New patients of all ages are welcome."),
    C.section({ name: "booking", inner: C.split(
      `${C.heading("Book online")}
       ${C.spacer("small")}
       ${C.paragraph("Our online book shows live availability and takes about a minute.")}
       ${C.spacer("small")}
       ${C.button({ label: "Open the online book", href: BOOK, external: true })}
       ${C.spacer("large")}
       ${C.heading("Prefer to call?", { level: 3 })}
       ${C.spacer("xsmall")}
       <p><a class="phone-link_component" href="${h.PRACTICE.phoneHref}">${h.esc(h.PRACTICE.phone)}</a></p>
       ${C.spacer("small")}
       <p class="card_meta">${h.esc(LOCATION_NOTE)}</p>`,
      `<div class="card_component">
         ${C.heading("Office hours", { level: 3, style: 4 })}
         ${C.hoursList(h.HOURS)}
         ${C.spacer("small")}
         <p class="card_meta">In pain today? Call us — we keep time aside for <a href="/services/emergency-dentist/">dental emergencies</a>.</p>
       </div>`,
    ) }),
    C.section({ name: "appointment-form", bg: "paper", inner: `
      ${C.sectionHeading({ title: "Send an appointment request", centered: true })}
      ${h.renderEmbed(FORMS.appointment)}` }),
  ].join("\n");
}

// ===========================================================================
// Financing — the live page rendered EMPTY, header straight into footer. Built
// from the practice's own statements elsewhere on its site.
// ===========================================================================
function financing(d, h) {
  const C = h.C;
  return [
    openPage(h, "Financing and Insurance", "Ways to pay for treatment at Mason Park Dental of Katy."),
    C.section({ name: "options", inner: `
      ${C.sectionHeading({ title: "Ways to pay" })}
      ${C.grid(3, [
        C.card({ title: "Insurance", text: "We process a variety of insurance plans and offer multiple payment options. Bring your card to your first visit and we will check your benefits with you before treatment starts." }),
        C.card({ title: "Cherry patient financing", text: "Cherry offers monthly payment plans with 0% APR options and no hard credit check, so a larger treatment plan can be spread out. Ask the front desk to start an application." }),
        C.card({ title: "Dental savings plan", text: "No insurance? The practice runs its own savings plan covering routine care at a reduced rate.", html: '<p><a href="/dental-savings-plan/">See the savings plan</a></p>' }),
      ])}
      ${C.spacer("large")}
      ${C.notice('<p><strong>Second opinions are free.</strong> If you are unsure about a treatment plan from another practice, bring it in — see <a href="/special-offers/">special offers</a>.</p>')}` }),
    C.section({ name: "cost", bg: "paper", container: "medium", inner: `
      ${C.heading("Questions about cost")}
      ${C.spacer("small")}
      <p class="text-size-regular">Every treatment plan is quoted before work begins. If you would like an estimate first, call the practice on <a href="${h.PRACTICE.phoneHref}">${h.esc(h.PRACTICE.phone)}</a> and ask for a written treatment plan.</p>
      ${C.spacer("medium")}
      ${C.button({ label: "Request an appointment", href: BOOK, external: true })}` }),
  ].join("\n");
}

// ===========================================================================
// Virtual consultation
// ===========================================================================
function virtualConsultation(d, h) {
  const C = h.C;
  const steps = ["Snap some photos of your smile", "Write a quick message about your smile", "Get a video response from the doctor"];
  const copy = paras(d, 4);
  return [
    openPage(h, "Virtual Consultation", "Skip taking time off work for an in-office consult. Get a free virtual consult in three easy steps."),
    C.section({ name: "steps", inner: `
      ${C.sectionHeading({ title: "How it works" })}
      ${C.stepList(steps)}
      ${copy.length ? C.spacer("xlarge") + copy.map((p) => C.paragraph(p.text)).join(C.spacer("small")) : ""}` }),
    C.section({ name: "consult-form", bg: "paper", inner: `
      ${C.sectionHeading({ title: "Start your virtual consult", centered: true })}
      ${h.renderEmbed(FORMS.virtual)}` }),
  ].join("\n");
}

// ===========================================================================
// Smile gallery — the live /before-after/ was 100% ThemeREX demo content: lorem
// ipsum plus the theme's own stock before/after photos. Publishing stock photos
// as this practice's results would be a misrepresentation.
// ===========================================================================
function beforeAfter(d, h) {
  const C = h.C;
  return [
    openPage(h, "Smile Gallery", "Real cases from Mason Park Dental of Katy."),
    C.section({ name: "gallery", container: "medium", inner: `
      ${C.notice("<p><strong>This gallery is being rebuilt with the practice's own cases.</strong> The previous page carried the website theme's stock demo photos, which were never Mason Park patients. They have been removed rather than reused.</p>")}
      ${C.spacer("medium")}
      ${C.paragraph("Cosmetic and restorative results are best judged case by case. Until the gallery is restocked with consented patient photography, the treatment pages describe what each procedure changes and how long it takes:")}
      ${C.spacer("small")}
      ${C.linkList([
        { href: "/services/cosmetic-dentistry/", label: "Cosmetic dentistry" },
        { href: "/services/invisalign/", label: "Invisalign clear aligners" },
        { href: "/services/dental-implant-restorations/", label: "Dental implant restorations" },
        { href: "/services/dental-crowns/", label: "Dental crowns" },
        { href: "/services/bonding/", label: "Bonding" },
      ])}
      ${C.spacer("medium")}
      ${C.button({ label: "Ask about your own case", href: BOOK, external: true })}` }),
  ].join("\n");
}

// ===========================================================================
// Thank you
// ===========================================================================
function thankYou(d, h) {
  const C = h.C;
  return [
    C.section({ name: "thanks", container: "medium", inner: `
      <div class="text-align-center">
        ${C.eyebrow("Katy, TX")}
        ${C.heading("Thank you!", { level: 1 })}
        ${C.spacer("small")}
        ${C.paragraph("Your request has reached the front desk. Someone from Mason Park Dental of Katy will be in touch during office hours to confirm your appointment.", { size: "medium" })}
        ${C.spacer("medium")}
        <div class="button-group" style="justify-content:center">
          ${C.button({ label: `Call ${h.PRACTICE.phone}`, href: h.PRACTICE.phoneHref })}
          ${C.button({ label: "Back to the homepage", href: "/", variant: "ghost" })}
        </div>
      </div>` }),
    C.section({ name: "next", bg: "paper", inner: `
      ${C.sectionHeading({ title: "While you wait", centered: true })}
      ${C.grid(3, [
        C.card({ title: "Patient resources", text: "Forms, insurance and payment options.", href: "/patient-resources/" }),
        C.card({ title: "Special offers", text: "Current new-patient and treatment offers.", href: "/special-offers/" }),
        C.card({ title: "Our services", text: "What we treat, explained.", href: "/our-services/" }),
      ])}` }),
  ].join("\n");
}

// ===========================================================================
// Legal — Privacy Policy, Terms of Service and Cookie Policy.
//
// All three render from the SAME template because they are the same shape: a
// plain hero, a breadcrumb, and one column of rich text. The copy itself lives
// in site/legal.mjs, which is also what the live-site publisher reads, so the
// two designs can never end up saying different things about the practice.
//
// The old Privacy Policy that stood here was a five-paragraph placeholder about
// the rebuilt website; the old Terms came through the crawler and silently lost
// three of its bullet lists, leaving "which may include:" with nothing after
// it. Both are replaced. See site/legal.mjs for what changed and why.
// ===========================================================================
function legalPage(slug) {
  return (d, h) => {
    const doc = LEGAL_PAGES[slug];
    return [
      openPage(h, doc.heading, doc.sub),
      h.C.section({ name: "legal", container: "medium", inner: h.C.richText(doc.body()) }),
    ].join("\n");
  };
}

// ===========================================================================
// Special offers — the page that carries the practice's actual prices, so every
// figure is lifted verbatim rather than restated.
// ===========================================================================
function specialOffers(d, h) {
  const C = h.C;
  const intro = paras(d, 3)[0];
  const blocks4 = inSection(d, 4);
  // The long explanation of each offer sits in an Elementor toggle, so it
  // arrives as a `faq` block rather than a bare paragraph. Read both.
  const details = [...paras(d, 5).map((p) => p.text), ...faqs(d).map((f) => stripTags(f.html))];

  const newPatient = [];
  for (let i = 0; i < blocks4.length; i++) {
    const b = blocks4[i];
    if (b.type !== "heading") continue;
    const price = (b.text.match(/\$[\d,]+/) || [])[0] || "";
    const short = blocks4[i + 1]?.type === "para" ? blocks4[i + 1].text : "";
    newPatient.push({
      price,
      title: softenLabel(b.text.replace(/^\$[\d,]+\s*/, "")),
      body: [short, price ? details.find((t) => t.includes(price) && t !== short) : ""],
    });
  }

  const treatment = [6, 7].flatMap((n) => {
    const items = inSection(d, n);
    const out = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type !== "heading") continue;
      const body = [];
      for (let j = i + 1; j < items.length && items[j].type === "para"; j++) body.push(items[j].text);
      // "INVISALIGN SPECIAL OFFER: $1000 OFF" -> pill "$1000 off", title without it
      const off = (items[i].text.match(/\$[\d,]+\s*OFF/i) || [])[0];
      out.push({
        price: off ? off.replace(/OFF/i, "off") : "",
        title: softenLabel(items[i].text.replace(/[:,]?\s*\$[\d,]+\s*OFF/i, "").replace(/[:\s]+$/, "")),
        body,
      });
    }
    return out;
  });

  return [
    openPage(h, "Special Offers", d.description || ""),
    C.section({ name: "new-patient-offers", inner: `
      ${intro ? C.sectionHeading({ title: "New patient offers", text: intro.text }) : C.sectionHeading({ title: "New patient offers" })}
      ${C.grid(3, newPatient.map(C.offerCard))}` }),
    C.section({ name: "treatment-offers", bg: "paper", inner: `
      ${C.sectionHeading({ title: "Treatment offers" })}
      ${C.grid(3, [
        ...treatment.map(C.offerCard),
        C.offerCard({ title: "Free Invisalign consultation", body: [details.find((t) => /complimentary Invisalign consultation/i.test(t)) || ""] }),
      ])}
      ${C.spacer("large")}
      ${C.notice("<p>Offers are for new patients unless stated otherwise, cannot be combined with insurance, and do not apply in cases of periodontal disease. Ask the front desk which offer applies to your treatment plan before you book.</p>")}` }),
    C.section({ name: "claim", inner: C.split(
      `${C.heading("Claim an offer")}
       ${C.spacer("small")}
       ${C.paragraph("Mention the offer when you book, or send us a message and the front desk will apply it.")}
       ${C.spacer("small")}
       ${C.buttonGroup([
          { label: "Schedule online", href: BOOK, external: true },
          { label: `Call ${h.PRACTICE.phone}`, href: h.PRACTICE.phoneHref, variant: "ghost" },
        ])}
       ${C.spacer("small")}
       <p class="card_meta">${h.esc(LOCATION_NOTE)}</p>`,
      h.renderEmbed(FORMS.offers),
    ) }),
  ].join("\n");
}

// ===========================================================================
// Patient resources — a main-menu page whose live version was one paragraph, a
// bullet list with no links, and three orphan icon captions.
// ===========================================================================
function patientResources(d, h) {
  const C = h.C;
  const body = paras(d, 4);
  const intro = body[0];
  const bullets = inSection(d, 4).find((b) => b.type === "list")?.items || [];
  const explain = body.slice(1);
  // One link per bullet, matched to what the bullet is about. The "giving back"
  // bullet describes the Parks Youth Ranch initiative, which has no page of its
  // own, so it points at the practice story instead.
  const targets = ["/appointment/", "/about-us/", "/financing/", "/our-services/"];
  const labels = ["Request an appointment", "About our practice", "Financing and insurance", "See all services"];

  const RESOURCES = [
    ["Dental Savings Plan", "/dental-savings-plan/", "Reduced rates on routine care for patients without insurance."],
    ["Product Recommendations", "/product-recommendations/", "The brushes, pastes and rinses the hygienists actually recommend."],
    ["Toothpaste RDA Table", "/toothpaste-rda-table/", "How abrasive your toothpaste is, by brand."],
    ["Toothpaste Chart", "/toothpaste-chart/", "A fuller comparison across common toothpastes."],
    ["PH and Acidity of Food &amp; Beverages", "/ph-and-acidity-of-food-beverages/", "Which everyday drinks put enamel most at risk."],
    ["Dental Library", "/dental-library/", "Plain-language explanations of common procedures."],
    ["Dental Dictionary", "/dental-dictionary/", "What the terms on your treatment plan mean."],
    ["Frequently Asked Questions", "/faq-page/", "The questions the front desk hears most."],
    ["Town Resources", "/town-resource/", "Local information for Katy families."],
  ];

  return [
    openPage(h, "Patient Resources", d.description || ""),
    C.section({ name: "resources-intro", inner: `
      ${C.sectionHeading({
        eyebrow: "Dentist Katy, TX",
        title: heads(d, 3).find((t) => t.startsWith("Patient")) || "Patient-Centric Care at Mason Park Dental of Katy",
        text: intro?.text,
      })}
      ${C.grid(2, bullets.map((b, i) => C.card({
        title: b,
        text: explain[i]?.text,
        html: `<p><a href="${targets[i] || "/contacts/"}">${labels[i] || "Find out more"}</a></p>`,
      })))}` }),
    C.section({ name: "reference", bg: "paper", inner: `
      ${C.sectionHeading({ title: "Resources and reference", text: "Everything the practice publishes for patients, in one place." })}
      ${C.grid(3, RESOURCES.map(([label, href, blurb]) => C.card({ title: label, text: blurb, href })))}` }),
    bookingSection(h),
  ].join("\n");
}

// ===========================================================================
// New Patients — NEW PAGE, authored for the 2026-08-31 core-pages brief
// (Asana `Build Core Pages` 1217892732561687). The old site had no such page:
// a first-time visitor had to assemble the answer from /appointment/,
// /special-offers/, /financing/ and two questions buried in /faq-page/.
//
// Every figure and every answer below is the practice's OWN published wording,
// lifted from those pages rather than invented.
// ===========================================================================
function newPatients(d, h) {
  const C = h.C;

  // The three new-patient offers, from /special-offers/. Prices are the
  // practice's own commercial terms, so they are quoted rather than restated.
  const OFFERS = [
    { price: "$189", title: "New patient special", body: [
      "A comprehensive dental exam, x-rays, a cleaning, and a full treatment plan for just $189, saving you $328.",
      "Exclusive to new patients. Cannot be used with insurance, or in cases of periodontal disease.",
    ] },
    { price: "$129", title: "Children's new patient exam", body: [
      "A new patient exam for children under 13, priced at $129 — the gentle first visit that sets the tone for every one after it.",
    ] },
    { price: "$350", title: "New patient whitening", body: [
      "Kor Whitening with at-home trays for $350, available to new patients alongside the first visit.",
    ] },
  ];

  const STEPS = [
    "Book online or call the front desk",
    "Send your forms and insurance details ahead",
    "Exam, x-rays and a cleaning on the day",
    "Leave with a written treatment plan",
  ];

  const BRING = [
    ["A photo ID", "Any government photo ID. The front desk takes a copy once, at the first visit."],
    ["Your insurance card, if you have one", "We process a variety of plans and will check your benefits with you before treatment starts."],
    ["Your new patient forms", "You can complete them ahead of time — ask the front desk when you book and we will send them over."],
    ["A list of medications", "Bring anything you take regularly, including supplements, so the doctor can plan around it."],
  ];

  // The questions the practice has already answered about first visits, taken
  // from /faq-page/ rather than rewritten. The fourth is ours and is marked as
  // such in REDESIGN-2026-08-28.md — the practice needs to confirm the hour.
  const QA = [
    { question: "Do you accept new patients?",
      html: "<p>Yes. Mason Park Dental of Katy welcomes new patients of every age, from a child's first tooth through adult restorative work. Book online at any hour, or call the front desk during office hours.</p>" },
    { question: "What do I need to bring to my first dental appointment?",
      html: "<p>Typically you will be asked to bring a photo ID and a copy of your insurance details, if you have any. Sometimes you can complete your new patient forms ahead of time — ask when you book.</p>" },
    { question: "How often should I visit the dentist?",
      html: "<p>The American Dental Association recommends that most people visit the dentist every six months. Specific needs may call for more frequent visits, and the doctor will tell you which applies to you at the first exam.</p>" },
    { question: "Can I book a child and a parent on the same trip?",
      html: "<p>Yes — adults and children are treated in the same building, which is the point of the practice. Say so when you book and the front desk will put the appointments together.</p>" },
  ];

  return [
    openPage(h, "New Patients", "What a first visit at Mason Park Dental of Katy involves — what to bring, what it costs, and how long it takes."),

    C.section({ name: "first-visit", inner: `
      ${C.sectionHeading({ eyebrow: "Your first visit", title: "Four steps, one appointment",
        text: "New patients of every age are welcome. Here is what happens, so nothing about the first appointment is a surprise." })}
      ${C.stepList(STEPS)}` }),

    C.section({ name: "offers", bg: "paper", inner: `
      ${C.sectionHeading({ eyebrow: "New patient offers", title: "What the first visit costs",
        text: "Three offers apply to first visits. Mention the one you want when you book and the front desk will apply it." })}
      ${C.grid(3, OFFERS.map((o) => C.offerCard(o)))}
      ${C.spacer("large")}
      ${C.notice('<p>Offers are for new patients, cannot be combined with insurance, and do not apply in cases of periodontal disease. Every treatment plan is quoted before work begins — see <a href="/special-offers/">all current offers</a>.</p>')}` }),

    C.section({ name: "bring", inner: `
      ${C.sectionHeading({ title: "What to bring" })}
      ${C.grid(2, BRING.map(([title, text]) => C.card({ title, text })))}` }),

    C.section({ name: "paying", bg: "paper", inner: C.split(
      `${C.eyebrow("Paying for it")}
       ${C.heading("Insurance, financing, or neither")}
       ${C.spacer("small")}
       ${C.paragraph("We process a variety of insurance plans. Without insurance, the practice runs its own savings plan for routine care, and Cherry spreads larger treatment plans over monthly payments at 0% APR with no hard credit check.")}
       ${C.spacer("medium")}
       ${C.buttonGroup([
          { label: "Financing and insurance", href: "/financing/" },
          { label: "Dental savings plan", href: "/dental-savings-plan/", variant: "secondary" },
        ])}`,
      `<div class="card_component">
         ${C.heading("Office hours", { level: 3, style: 4 })}
         ${C.hoursList(h.HOURS)}
         ${C.spacer("small")}
         <p class="card_meta">In pain today? Call us — we keep time aside for <a href="/services/emergency-dentist/">dental emergencies</a>.</p>
       </div>`,
    ) }),

    C.section({ name: "faq", inner: C.faqLayout({
      eyebrow: "Before you come in",
      title: "Questions new patients ask",
      aside: C.spacer("medium") + C.linkArrow({ label: "All questions", href: "/faq-page/" }),
      items: QA,
    }) }),

    C.section({ name: "request", bg: "paper", inner: `
      ${C.sectionHeading({ title: "Request an appointment", centered: true })}
      ${h.renderEmbed(FORMS.appointment)}` }),

    bookingSection(h),
  ].join("\n");
}

// ===========================================================================
// Patient reviews and testimonials — NEW PAGE, same brief.
//
// The comps ask for "a Google reviews screenshot with scroll indicators". A
// screenshot cannot be read by a screen reader, does not reflow on a phone, and
// is wrong the day a review is added. These are the practice's own published
// reviews as markup — read out of the homepage's own content so the two pages
// can never drift apart.
//
// NO NUMERIC RATING IS PRINTED. `reviewLockup()` is in the component library
// ready for one, but a star average set as static text is a claim that is wrong
// the moment it moves, and the client has still not supplied a figure to
// publish. The Google link is a Maps SEARCH url, not a listing deep link: the
// practice has never published its listing URL, and a guessed CID that lands on
// the wrong business is worse than a search that cannot.
// ===========================================================================
function patientReviews(d, h) {
  const C = h.C;
  const GOOGLE = "https://www.google.com/maps/search/?api=1&query=Mason+Park+Dental+Katy+TX";

  const home = h.read("home");
  const list = [];
  if (home) {
    const rb = home.blocks.filter((b) => b.section === 15);
    const seen = new Set();
    const key = (q) => q.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
    for (let i = 0; i < rb.length; i++) {
      if (rb[i].type !== "para") continue;
      const next = rb[i + 1];
      const quote = rb[i].text.trim().replace(/^[“”"'\s]+/, "").replace(/[“”"'\s]+$/, "");
      const author = next && next.type === "heading" ? next.text.replace(/^-\s*/, "") : "";
      if (author && !seen.has(key(quote))) { seen.add(key(quote)); list.push({ quote, author }); }
    }
  }

  return [
    openPage(h, "Patient Reviews", "What Katy families say about Mason Park Dental, in their own words."),

    C.section({ name: "reviews", inner: `
      ${C.sectionHeading({ eyebrow: "From Katy families", title: "What patients say",
        text: "Every review below was left publicly by a patient of this practice, and is reproduced as written." })}
      ${list.length ? C.reviewList(list) : C.notice("<p>Reviews are being republished.</p>")}
      ${C.spacer("large")}
      ${C.buttonGroup([
        { label: "Read every review on Google", href: GOOGLE, external: true },
        { label: "Meet the team", href: "/our-team/", variant: "ghost" },
      ])}` }),

    C.section({ name: "themes", bg: "slate", padding: "medium", inner: C.quoteBand({
      eyebrow: "What comes up most",
      title: "Named, not numbered",
      text: "Patients name the hygienists and the doctors individually rather than rating the building. That only happens where the same people are still there the next time you come in.",
    }) }),

    C.section({ name: "leave", bg: "paper", inner: C.split(
      `${C.eyebrow("Already a patient?")}
       ${C.heading("Tell the next family what to expect")}
       ${C.spacer("small")}
       ${C.paragraph("A review takes a minute and is the most useful thing a patient can do for a practice. If something was not right, tell us first — the front desk would rather fix it than read about it.")}
       ${C.spacer("medium")}
       ${C.buttonGroup([
          { label: "Leave a Google review", href: GOOGLE, external: true },
          { label: `Call ${h.PRACTICE.phone}`, href: h.PRACTICE.phoneHref, variant: "ghost" },
        ])}`,
      `<div class="card_component">
         ${C.heading("Where to find us", { level: 3, style: 4 })}
         ${C.spacer("xsmall")}
         <p class="card_meta">${h.esc(LOCATION_NOTE)}</p>
         ${C.spacer("small")}
         ${C.hoursList(h.HOURS)}
       </div>`,
    ) }),

    bookingSection(h),
  ].join("\n");
}

// ===========================================================================
export const BESPOKE = {
  home: homeJourney,
  "our-services": ourServices,
  "about-us": aboutUs,
  "our-team": ourTeam,
  "our-doctors": ourDoctors,
  contacts,
  appointment,
  financing,
  "virtual-consultation": virtualConsultation,
  "before-after": beforeAfter,
  "thank-you": thankYou,
  "privacy-policy": legalPage("privacy-policy"),
  "terms-of-service": legalPage("terms-of-service"),
  "cookie-policy": legalPage("cookie-policy"),
  "special-offers": specialOffers,
  "patient-resources": patientResources,
  // Both new for the 2026-08-31 core-pages brief; neither existed on the old site.
  "new-patients": newPatients,
  "patient-reviews": patientReviews,
};

// Pages that exist on the live site but carry nothing but theme demo content.
// Not in any menu, and not rebuilt.
export const SKIP = new Set(["pricing", "sample", "shop"]);

// Titles and descriptions for pages WordPress could not supply them for — the
// two that returned 403 to the crawler, and the ones this rebuild authors.
export const META = {
  "our-team": {
    title: "Meet Our Team | Mason Park Dental of Katy",
    description: "Meet the dentists and team at Mason Park Dental of Katy - Dr. Dave Cho, Dr. William Sung and Dr. Tam Nguyen, DMD, board certified pediatric dentist.",
  },
  // The three legal documents carry their own title and description next to
  // the copy they describe, so a wording change cannot leave the meta behind.
  "privacy-policy": LEGAL_PAGES["privacy-policy"],
  "terms-of-service": LEGAL_PAGES["terms-of-service"],
  "cookie-policy": LEGAL_PAGES["cookie-policy"],
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
  "new-patients": {
    title: "New Patients | Mason Park Dental of Katy",
    description: "What a first visit at Mason Park Dental of Katy involves - what to bring, the $189 new patient special, and how insurance and financing work.",
  },
  "patient-reviews": {
    title: "Patient Reviews | Mason Park Dental of Katy",
    description: "What Katy families say about Mason Park Dental, in their own words - published reviews from patients of this practice.",
  },
};
