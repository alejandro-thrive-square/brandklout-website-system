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
// Home
// ===========================================================================
// Section order follows the Figma "Handoff — Page Overview": hero, credentials,
// value props, services, retention, doctors, reviews, virtual consult, FAQ,
// financing, scheduling, footer. What differs from the comps is the *shape* of
// each one — see the notes in site/components.mjs and theme/site.css. The comps
// stack thirteen full-width bands of equal weight; here the page alternates
// between wide, full-bleed moments and quiet measured ones, so scrolling it
// feels like moving through a place rather than past a list.
function home(d, h) {
  const C = h.C;
  const hero = imgs(d, 2)[0];
  const introHead = heads(d, 5).find((t) => t.startsWith("Experience"))
    || "Experience Exceptional Dentistry at Mason Park Dental of Katy";
  const introParas = paras(d, 5).filter((p) => p.text !== "Dentist in Katy, TX");
  const servicesParas = paras(d, 7);
  const doctorsParas = paras(d, 8);
  const vcParas = paras(d, 10);
  // The live theme shouted the consult heading and title-cased its three steps.
  // Sentence case restores them; the wording itself is untouched.
  const sentence = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const vcSteps = heads(d, 10)
    .filter((t) => t !== "GET A FREE VIRTUAL DENTAL CONSULT")
    .map((t) => sentence(fixTypos(t)));
  const cherryLogo = imgs(d, 11)[0];
  const cherryPara = paras(d, 11)[0];
  const flexPara = paras(d, 13)[0];
  const flexImg = imgs(d, 13)[0];

  // Reviews: quote and attribution arrive as consecutive blocks. The live page
  // repeats one twice with different trailing punctuation, so dedupe on a
  // normalised prefix and drop any quote with no attribution.
  const rb = inSection(d, 15);
  const seen = new Set();
  const key = (q) => q.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
  const reviews = [];
  for (let i = 0; i < rb.length; i++) {
    if (rb[i].type !== "para") continue;
    const next = rb[i + 1];
    // Quotes arrive with the theme's own smart quotes still attached, sometimes
    // with a space in front of the closing one. Strip both ends completely.
    const quote = rb[i].text.trim().replace(/^[“”"'\s]+/, "").replace(/[“”"'\s]+$/, "");
    const author = next && next.type === "heading" ? next.text.replace(/^-\s*/, "") : "";
    if (author && !seen.has(key(quote))) { seen.add(key(quote)); reviews.push({ quote, author }); }
  }

  // The four homepage questions. The comps name four questions but carry no
  // answers, so these are four the practice has already answered in its own
  // words on /faq-page/ — the Figma's four are logged for the client to answer.
  const faqSource = h.read("faq-page");
  const wanted = [
    "do you accept new patients",
    "what do i need to bring to my first dental appointment",
    "how often should i visit the dentist",
    "what services does a general dentist offer",
  ];
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const homeFaqs = wanted
    .map((w) => (faqSource?.blocks || []).find((b) => b.type === "faq" && norm(b.question) === w))
    .filter(Boolean)
    .map((b) => ({ question: b.question, html: h.rewrite(b.html) }));

  return [
    C.heroSplit({
      eyebrow: "Katy, Texas",
      title: "One practice for the whole family",
      lede: "Cosmetic and restorative care for adults, gentle first visits for kids, under one roof on Kingsland Boulevard.",
      actions: C.buttonGroup([
        { label: "Schedule online", href: BOOK, external: true },
        { label: "Meet our doctors", href: "/our-doctors/", variant: "secondary" },
      ]),
      image: hero?.src || "/wp-content/uploads/2023/11/g7-1024x683.jpg",
      alt: "The team at Mason Park Dental of Katy",
      w: hero?.w || 1024, h: hero?.h || 683,
      plate: { value: "Mon–Thu", label: "Appointments" },
      facts: [
        ["Adults and kids", "Care under one roof"],
        ["Board certified", "Pediatric dentistry"],
        ["0% APR", "Financing available"],
      ],
    }),

    C.badgeStrip(h.ACCREDITATIONS),

    C.section({ name: "intro", inner: `
      ${C.sectionHeading({ eyebrow: "Two practices, one address", title: introHead })}
      <div class="max-width-large">${introParas.map((p) => C.paragraph(p.text, { size: "medium" })).join(C.spacer("small"))}</div>
      ${C.spacer("xlarge")}
      ${C.grid(2, [
        C.propCard({
          image: "/wp-content/uploads/2023/08/AdobeStock_118631127-scaled.jpeg",
          alt: "A patient being treated in one of the practice's operatories",
          tag: "For adults", title: "Cosmetic and restorative",
          text: "Veneers, implants, Invisalign and the everyday work that keeps a smile lasting — planned with you before anything is prepared.",
          linkLabel: "Adult services", href: "/our-services/",
        }),
        C.propCard({
          image: "/wp-content/uploads/2023/08/AdobeStock_398040894-scaled.jpeg",
          alt: "A child at a check-up with a pediatric dentist",
          tag: "For kids", kids: true, title: "The dentist they ask to go back to",
          text: "Board certified pediatric care from the first tooth through the teenage years, from a dentist who trained specifically for it.",
          linkLabel: "Children's dentistry", href: "/services/pediatric-dental-care/",
        }),
      ])}` }),

    C.section({ name: "services", bg: "paper", inner: `
      ${C.sectionHeading({ eyebrow: "What we do", title: "Care for every age, in one building" })}
      ${SERVICE_GROUPS.map(([label, items]) => C.svcGroup({
        label,
        cols: items.length > 4 ? 3 : 4,
        items: items.map(([icon, name, text, href]) => ({ icon, label: name, text, href })),
      })).join("")}
      ${C.spacer("xlarge")}
      ${C.split(
        servicesParas.map((p) => C.paragraph(p.text)).join(C.spacer("xsmall")),
        `${C.buttonGroup([
           { label: "Request an appointment", href: BOOK, external: true },
           { label: "All services", href: "/our-services/", variant: "secondary" },
         ])}
         ${C.spacer("small")}
         <p class="card_meta">Or call <a href="${h.PRACTICE.phoneHref}">${h.esc(h.PRACTICE.phone)}</a></p>`,
        { textWide: true },
      )}` }),

    C.section({ name: "retention", bg: "slate", padding: "medium", inner: C.quoteBand({
      eyebrow: "Why families stay",
      title: "You'll see the same faces next time",
      text: "Low turnover is not a marketing line — it is why your child's hygienist remembers the trick that worked last time, and why your crown matches the shade we recorded three years ago.",
    }) }),

    C.section({ name: "doctors", inner: `
      ${C.sectionHeading({ eyebrow: "Who you'll see", title: heads(d, 8)[0] || "Meet the doctors",
        text: doctorsParas[0]?.text })}
      ${C.grid(3, DOCTORS.map(([image, name, role, href, blurb]) => C.doctorCard({ image, name, role, href, blurb })))}
      ${C.spacer("large")}
      ${C.linkArrow({ label: "Read the full profiles", href: "/our-doctors/" })}` }),

    C.section({ name: "reviews", bg: "paper", inner: `
      ${C.sectionHeading({ eyebrow: "From Katy families", title: "What patients say" })}
      ${C.reviewList(reviews.slice(0, 6))}` }),

    C.section({ name: "virtual-consult", bg: "ink", inner: C.split(
      `${C.eyebrow("Before you take time off work")}
       ${C.heading("Get a free virtual consult in three steps")}
       ${C.spacer("small")}
       ${vcParas.map((p) => C.paragraph(p.text)).join(C.spacer("xsmall"))}
       ${C.spacer("medium")}
       ${C.button({ label: "Start a virtual consult", href: "/virtual-consultation/" })}`,
      C.stepList(vcSteps),
    ) }),

    homeFaqs.length ? C.section({ name: "faq", inner: C.faqLayout({
      eyebrow: "Before you come in",
      title: "Questions we get every week",
      aside: C.spacer("medium") + C.linkArrow({ label: "All questions", href: "/faq-page/" }),
      items: homeFaqs,
    }) }) : "",

    C.section({ name: "financing", bg: "paper", padding: "large", inner: C.financePanel({
      eyebrow: "Paying for it",
      title: "Pay monthly at 0% APR, with no hard credit check",
      text: cherryPara?.text,
      actions: C.spacer("xsmall") + C.button({ label: "See financing options", href: "/financing/" }),
      logo: cherryLogo?.src, logoAlt: "Cherry",
      note: "Applications are handled by Cherry. Ask the front desk which account your application should go through.",
    }) }),

    C.ctaSplit({
      eyebrow: "Book a visit",
      title: heads(d, 13)[0] || "Flexible Scheduling and Emergency Care",
      text: flexPara?.text,
      actions: C.buttonGroup([
        { label: "Request an appointment", href: BOOK, external: true },
        { label: "Dental emergency?", href: "/services/emergency-dentist/", variant: "secondary" },
      ]),
      image: flexImg?.src, alt: "A team member taking a call at the practice",
      w: flexImg?.w, h: flexImg?.h,
    }),

    // "Find us in Katy" — the map that sat between the reviews and the footer's
    // contact band on the previous build. The redesign dropped it, so shipping
    // the redesign would have taken the homepage map away; restored here.
    //
    // The street address is set in TEXT above the frame on purpose. A map pin
    // is not readable by a screen reader, the frame is lazy and may never load
    // on a slow connection, and the address is the thing a visitor copies into
    // their own phone. The frame is the illustration, not the content.
    C.section({ name: "map", padding: "small", inner: `
      ${C.sectionHeading({
        eyebrow: "Find us",
        title: "Find us in Katy",
        text: `${h.PRACTICE.street}, ${h.PRACTICE.city}, ${h.PRACTICE.region} ${h.PRACTICE.postal}`,
        centered: true,
      })}
      ${h.renderEmbed(MAP_EMBED)}
      ${C.spacer("small")}
      <div class="text-align-center">
        ${C.paragraph(LOCATION_NOTE)}
        ${C.spacer("xsmall")}
        ${C.button({ label: "Get directions", href: h.PRACTICE.maps, variant: "ghost", external: true })}
      </div>` }),
  ].filter(Boolean).join("\n");
}

// ===========================================================================
// Our services — the live page was an icon carousel that named no service in
// text, so this lists every treatment page the site actually has.
// ===========================================================================
function ourServices(d, h) {
  const C = h.C;
  const menuServices = NAV.find((i) => i.label === "Services")?.children || [];
  const inMenu = new Set();
  (function collect(items) {
    for (const it of items) { inMenu.add(it.href); if (it.children) collect(it.children); }
  })(menuServices);
  const unlisted = SERVICE_SLUGS_REF.filter((sl) => !inMenu.has(h.routeOf(sl)));

  const groupCard = (g) => C.card({
    title: g.label, href: g.href,
    html: g.children?.length
      ? `<ul class="sidebar_list">${g.children.map((c) => `<li>${h.esc(c.label)}</li>`).join("")}</ul>`
      : "",
  });

  return [
    openPage(h, "Our Services", "Family, cosmetic, restorative and pediatric dentistry, all under one roof in Katy, Texas."),
    C.section({ name: "service-tiles", inner: `
      ${C.sectionHeading({ eyebrow: "What we do", title: "Care for every age, in one building" })}
      ${SERVICE_GROUPS.map(([label, items]) => C.svcGroup({
        label,
        cols: items.length > 4 ? 3 : 4,
        items: items.map(([icon, name, text, href]) => ({ icon, label: name, text, href })),
      })).join("")}` }),
    C.section({ name: "service-index", bg: "paper", inner: `
      ${C.sectionHeading({ title: "Every service, A to Z", text: "Each treatment has its own page explaining what it is, who it suits and what to expect." })}
      ${C.grid(3, [
        ...menuServices.map(groupCard),
        unlisted.length ? C.card({
          title: "Also offered",
          html: `<p class="card_meta">Treatment pages the old menu never linked to.</p>
                 <ul class="sidebar_list">${unlisted.map((s) => `<li><a href="${h.routeOf(s)}">${h.esc(h.labelFor(s))}</a></li>`).join("")}</ul>`,
        }) : "",
        C.card({
          title: "Technology",
          html: `<ul class="sidebar_list">
            <li><a href="/technology/">Our technology</a></li>
            <li><a href="/technology-ai/">Technology / AI</a></li>
            <li><a href="/pearl-ai/">Pearl AI</a></li>
            <li><a href="/ceramillmotion3/">Ceramill Motion 3</a></li></ul>`,
        }),
        C.card({
          title: "Costs and offers",
          html: `<ul class="sidebar_list">
            <li><a href="/dental-implant-costs/">Dental implant costs</a></li>
            <li><a href="/dental-implant-costs-esp/">Costos de implantes dentales (Espa&ntilde;ol)</a></li>
            <li><a href="/special-offers/">Special offers</a></li>
            <li><a href="/financing/">Financing and insurance</a></li></ul>`,
        }),
      ])}` }),
    bookingSection(h),
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
// Meet our doctors — the long-form bios. The live page stacked three portraits
// at their natural sizes with the bios below in a different order again.
// ===========================================================================
function ourDoctors(d, h) {
  const C = h.C;
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

  return [
    openPage(h, "Meet Our Doctors", "The three dentists who look after Katy families at Mason Park Dental."),
    ...doctors.map((doc, i) => C.section({
      name: "doctor", bg: i % 2 === 1 ? "paper" : "",
      inner: C.split(
        doc.portrait ? h.img(doc.portrait, doc.name, { sizes: "(max-width: 899px) 100vw, 560px" }) : "",
        `${C.eyebrow(doc.role)}
         ${C.heading(doc.name)}
         ${C.spacer("small")}
         ${doc.bio.map((p) => C.paragraph(p)).join(C.spacer("xsmall"))}
         ${doc.personal ? C.spacer("medium") + C.notice(`<p>${h.esc(doc.personal)}</p>`) : ""}
         ${doc.href ? C.spacer("small") + C.button({ label: "Full profile", href: doc.href, variant: "ghost" }) : ""}`,
        { flipped: i % 2 === 1 },
      ),
    })),
    bookingSection(h),
  ].join("\n");
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
export const BESPOKE = {
  home,
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
};
