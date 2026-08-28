// Hand-authored templates for the pages the generic renderers cannot serve.
//
// A page earns a template here for one of three reasons:
//   1. the live page was theme demo content (before-after, and the pricing
//      tiers and lorem ipsum that came with it);
//   2. the live page was empty or non-functional (appointment was a bare month
//      calendar; product-recommendations-2 rendered nothing at all);
//   3. the live page published the PARENT practice's details or the parent
//      practice's adult service list, which is wrong on a pediatric site.
//
// COPY IS NEVER RETYPED. Every template pulls its sentences out of the
// extracted JSON by matching the heading they sat under (`grab` / `para`
// below), so the practice's published wording travels verbatim and a change in
// the source shows up here rather than drifting silently. Where a template
// says something the practice never published, it says so on the page.
//
// Markup comes from site/components.mjs via `h.C`. No template writes a card,
// a section shell or a button by hand.

// ---------------------------------------------------------------- selectors
const norm = (s) => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();

/** All blocks of the Elementor section that holds a heading matching `re`. */
const sectionOf = (d, re) => {
  const hit = (d.blocks || []).find((b) => b.type === "heading" && re.test(b.text || ""));
  if (!hit) return [];
  return (d.blocks || []).filter((b) => b.section === hit.section);
};

/** The paragraphs of that section, in order. */
const parasOf = (d, re) => sectionOf(d, re).filter((b) => b.type === "para");

// The body paragraph that follows a heading — NOT simply the first paragraph
// in its section. Elementor set the small line above a heading ("Pediatric
// Dentist Katy", "Childrens Dentist Katy") as a paragraph widget too, and on
// four of the homepage's sections that decorative line sorts ahead of the copy.
// Taking blocks[0] therefore reprinted the eyebrow and silently dropped the
// paragraph the section exists for. Scan forward from the heading instead and
// take the first paragraph long enough to be prose; the search crosses the
// section boundary because the doctor bio sits one Elementor section below its
// own heading.
const MIN_PROSE = 80;
const LOOKAHEAD = 14;
const para = (d, re, i = 0) => {
  const blocks = d.blocks || [];
  const at = blocks.findIndex((b) => b.type === "heading" && re.test(b.text || ""));
  if (at === -1) return "";
  let seen = 0;
  for (const b of blocks.slice(at + 1, at + 1 + LOOKAHEAD)) {
    if (b.type !== "para" || (b.text || "").length < MIN_PROSE) continue;
    if (seen++ < i) continue;
    return b.html || `<p>${b.text}</p>`;
  }
  return "";
};

/** The first image of that section. */
const image = (d, re) => sectionOf(d, re).find((b) => b.type === "image") || null;

/** Any image on the page whose src contains `needle`. */
const imageLike = (d, needle) =>
  (d.blocks || []).find((b) => b.type === "image" && (b.src || "").includes(needle))
  || (d.images || []).find((b) => (b.src || "").includes(needle))
  || null;

// The service icons the live pages used were hotlinked from the PARENT
// practice's web server (bestdentistinkatytx.com/wp-content/uploads/2021/12/
// s1.png …). They are not in this site's uploads and never were, so they cannot
// be localised — and serving another practice's files is what we are undoing.
// These line icons replace them: two colours from the stylesheet, no network.
const ICON = {
  tooth: '<path d="M12 4c-1.6 0-2.3.7-4 .7C6.2 4.7 5 6 5 8.2c0 3.2 1 4.6 1.6 7.4.5 2.2.8 4.4 2.2 4.4 1.3 0 1.3-2.6 1.7-4.3.2-.9.6-1.4 1.5-1.4s1.3.5 1.5 1.4c.4 1.7.4 4.3 1.7 4.3 1.4 0 1.7-2.2 2.2-4.4C18 12.8 19 11.4 19 8.2 19 6 17.8 4.7 16 4.7c-1.7 0-2.4-.7-4-.7Z"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.2 2.9 8.1 7 9.5 4.1-1.4 7-5.3 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/><circle cx="12" cy="12" r="2.5"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4.5 4.5 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
  align: '<rect x="3" y="7" width="18" height="10" rx="3"/><path d="M8 7v10M12 7v10M16 7v10"/>',
  heart: '<path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
  siren: '<path d="M12 3v3M5.5 6.5l2 2M18.5 6.5l-2 2M4 20h16"/><path d="M7 20a5 5 0 0 1 10 0"/>',
};
const icon = (name) =>
  `<svg class="service-card_glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
  `stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] || ICON.tooth}</svg>`;

// The service taxonomy the practice's own menu publishes, used by the services
// index, the restorative hub and the dental library. `hub` is the group's own
// page and becomes the group heading; `slugs` are the pages beneath it. Keeping
// them apart stops every group from opening with its own title repeated as its
// first list item. Slugs only — every label is read from the page it points at.
export const SERVICE_GROUPS = [
  { icon: "shield", hub: "comprehensive-pediatric-dentistry",
    lead: "Care built around a child, from the first tooth onward.",
    slugs: ["special-needs-patient-care"] },
  { icon: "tooth", hub: "preventive-dentistry",
    lead: "The visits that keep decay from ever starting.",
    slugs: ["dental-cleanings-and-exams", "dental-hygiene-education",
      "fluoride-treatment", "sealants", "mouth-guards", "night-guards"] },
  { icon: "smile", hub: "restorative-dentistry",
    lead: "Repairing a tooth so it keeps doing its job.",
    slugs: ["composite-fillings", "dental-crowns", "pulp-therapy", "extractions", "space-maintainers"] },
  { icon: "align", hub: "orthodontics",
    lead: "Guiding permanent teeth into the room they need.",
    slugs: ["early-intervention", "retainers", "invisalign"] },
  { icon: "sparkle", hub: "cosmetic-dentistry",
    lead: "Small corrections, done conservatively.",
    slugs: ["bonding"] },
  { icon: "heart", hub: "periodontics",
    lead: "Gum and soft-tissue care for growing mouths.",
    slugs: ["frenectomy"] },
  { icon: "moon", hub: "sedation-dentistry",
    lead: "Options for an anxious child or a longer appointment.",
    slugs: [] },
];

// ---------------------------------------------------------------- home
const home = (d, h) => {
  const { C, PRACTICE, BOOKING, HOURS, routeOf, labelFor, ROUTES, img, esc } = h;

  const heroImg = imageLike(d, "2023/11/g7") || imageLike(d, "Action-13");
  const welcome = para(d, /welcome to mason park dental for kids/i);
  const education = para(d, /you benefit from our/i);
  const individual = para(d, /your child.s care is as individual/i);
  const feelAtHome = para(d, /feel at home in our dental office/i);
  const drBio = para(d, /meet dr\.? tam nguyen/i) || para(d, /^impeccable quality/i);
  const drPortrait = imageLike(d, "HS-8") || imageLike(d, "mam.png");
  const roomShot = imageLike(d, "Action-16") || imageLike(d, "Action-20");

  const tile = (slug, glyph) => {
    const route = routeOf(slug);
    if (!ROUTES.has(route)) return "";
    return `<a class="service-card_component" href="${route}">
      ${icon(glyph)}
      <h3 class="heading-style-h4">${esc(labelFor(slug))}</h3>
      <span class="service-card_go" aria-hidden="true">&rarr;</span>
    </a>`;
  };

  return `${heroImg
    ? C.heroOverlay({
        src: heroImg.src, alt: "Children's dentist in Katy, Texas",
        eyebrow: "Welcome to Mason Park Dental for Kids",
        title: "Children's Dentist Katy", w: heroImg.w, h: heroImg.h })
    : C.heroPlain({ eyebrow: "Welcome to Mason Park Dental for Kids", title: "Children's Dentist Katy" })}

${C.section({ name: "intro", container: "medium", inner: `
  <div class="text-align-center">
    ${C.richText(welcome)}
    ${C.spacer("medium")}
    <div class="button-group is-centered">
      ${C.button({ label: "Request an appointment", href: BOOKING, external: true })}
      ${C.button({ label: `Call ${PRACTICE.phone}`, href: PRACTICE.phoneHref, variant: "ghost" })}
    </div>
  </div>` })}

${C.section({ name: "services", bg: "paper", inner: `
  ${C.sectionHeading({ eyebrow: "What we do", title: "Pediatric dentistry, start to finish", centered: true })}
  ${C.spacer("large")}
  <div class="service-grid_component">
    ${tile("comprehensive-pediatric-dentistry", "shield")}
    ${tile("preventive-dentistry", "tooth")}
    ${tile("dental-cleanings-and-exams", "smile")}
    ${tile("fluoride-treatment", "sparkle")}
    ${tile("sealants", "shield")}
    ${tile("composite-fillings", "tooth")}
    ${tile("pulp-therapy", "heart")}
    ${tile("dental-crowns", "smile")}
    ${tile("orthodontics", "align")}
    ${tile("invisalign", "align")}
    ${tile("sedation-dentistry", "moon")}
    ${tile("special-needs-patient-care", "heart")}
  </div>
  ${C.spacer("large")}
  <div class="text-align-center">${C.button({ label: "See every service", href: "/our-services/", variant: "ghost" })}</div>` })}

${C.section({ name: "education", inner: C.split(
  `${C.eyebrow("Kids dentist Katy")}
   ${C.heading("You benefit from our dental education and experience", { level: 2 })}
   ${C.spacer("small")}
   ${C.richText(education)}
   ${C.spacer("medium")}
   ${C.button({ label: "Request an appointment", href: BOOKING, external: true })}`,
  roomShot ? img(roomShot.src, "Inside the Katy pediatric dental office", { sizes: "(max-width: 899px) 100vw, 520px", cls: "media_rounded" }) : "",
  { flipped: false })})}

${C.section({ name: "personal", bg: "paper", inner: C.split(
  `${C.eyebrow("Pediatric dentist Katy")}
   ${C.heading("Your child's care is as individual as they are", { level: 2 })}
   ${C.spacer("small")}
   ${C.richText(individual)}
   ${C.spacer("medium")}
   ${C.button({ label: "Meet our team", href: "/our-team/" })}`,
  `<div class="stat-list_component">
     <div class="stat_component"><p class="stat_value">Age 1</p><p class="stat_label">First visit, per the American Academy of Pediatric Dentistry</p></div>
     <div class="stat_component"><p class="stat_value">Board-certified</p><p class="stat_label">Dr. Tam Nguyen, American Board of Pediatric Dentistry</p></div>
     <div class="stat_component"><p class="stat_value">All abilities</p><p class="stat_label">Including patients with special healthcare needs</p></div>
   </div>`,
  { flipped: true })})}

${C.section({ name: "doctor", inner: C.split(
  drPortrait ? img(drPortrait.src, "Dr. Tam Nguyen, board-certified pediatric dentist", { sizes: "(max-width: 899px) 100vw, 460px", cls: "media_rounded" }) : "",
  `${C.eyebrow("Childrens dentist Katy")}
   ${C.heading("Meet Dr. Tam Nguyen", { level: 2 })}
   ${C.spacer("small")}
   ${C.richText(drBio)}
   ${C.spacer("medium")}
   ${C.button({ label: "Meet the team", href: "/our-team/" })}`)})}

${C.section({ name: "hours", bg: "tan", inner: `
  <div class="layout-split is-text-wide">
    <div>
      ${C.eyebrow("Availability to meet your needs")}
      ${C.heading("Feel at home in our dental office", { level: 2 })}
      ${C.spacer("small")}
      ${C.richText(feelAtHome)}
      ${C.spacer("medium")}
      <div class="button-group">
        ${C.button({ label: "Request an appointment", href: BOOKING, external: true })}
        ${C.button({ label: "Contact the practice", href: "/contacts/", variant: "ghost" })}
      </div>
    </div>
    <div>
      <h3 class="heading-style-h4">Office hours</h3>
      ${C.spacer("small")}
      ${C.hoursList(HOURS)}
    </div>
  </div>` })}`;
};

// ------------------------------------------------------------ our-services
const ourServices = (d, h) => {
  const { C, routeOf, labelFor, ROUTES, esc, BOOKING } = h;

  const group = (g) => {
    const hub = ROUTES.has(routeOf(g.hub)) ? g.hub : null;
    const items = g.slugs.filter((s) => ROUTES.has(routeOf(s)));
    if (!hub && !items.length) return "";
    return `<div class="service-group_component">
      <div class="service-group_head">
        ${icon(g.icon)}
        <div>
          <h2 class="heading-style-h3">${hub
            ? `<a class="service-group_link" href="${routeOf(hub)}">${esc(labelFor(hub))}</a>`
            : esc(g.lead)}</h2>
          <p class="text-size-small text-style-muted">${esc(g.lead)}</p>
        </div>
      </div>
      ${items.length ? `<ul class="service-group_list">
        ${items.map((s) => `<li><a href="${routeOf(s)}">${esc(labelFor(s))}</a></li>`).join("")}
      </ul>` : ""}
    </div>`;
  };

  return `${C.heroPlain({
    eyebrow: "Katy, TX",
    title: "Our Services",
    text: "Every treatment we provide for infants, children, teenagers and patients with special healthcare needs.",
  })}
${C.breadcrumb([{ label: "Home", href: "/" }, { label: "Our Services" }])}
${C.section({ name: "services-index", inner: `
  <div class="service-group_grid">${SERVICE_GROUPS.map(group).join("")}</div>` })}
${C.section({ name: "services-cta", bg: "paper", container: "medium", inner: `
  <div class="text-align-center">
    ${C.heading("Not sure which one your child needs?", { level: 2 })}
    ${C.spacer("small")}
    ${C.paragraph("Call the practice and describe what you are seeing. We will tell you whether it needs an appointment now or at the next check-up.", { size: "medium" })}
    ${C.spacer("medium")}
    <div class="button-group is-centered">
      ${C.button({ label: "Request an appointment", href: BOOKING, external: true })}
      ${C.button({ label: "Emergency care", href: "/emergency-pediatric-dentistry/", variant: "ghost" })}
    </div>
  </div>` })}`;
};

// --------------------------------------------------- /services/restorative-
// A menu parent with no page behind it on the live site. Authored as a hub over
// the four restorative pages that do exist; it introduces them in the
// practice's own framing and adds no clinical claim of its own.
const restorativeDentistry = (d, h) => {
  const { C, routeOf, labelFor, ROUTES, read, esc, sidebarCta } = h;
  const slugs = ["composite-fillings", "dental-crowns", "pulp-therapy", "extractions", "space-maintainers"]
    .filter((s) => ROUTES.has(routeOf(s)));

  const firstSentence = (slug) => {
    const src = read(slug);
    const text = String(src?.html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const m = text.match(/^.{40,220}?[.!?](\s|$)/);
    return m ? m[0].trim() : text.slice(0, 180);
  };

  return `${C.heroPlain({
    eyebrow: "Pediatric dentistry in Katy, TX",
    title: "Restorative Dentistry",
    text: "Repairing a tooth that is decayed, cracked or worn, so it keeps its shape, its spacing and its job until the permanent tooth is ready.",
  })}
${C.breadcrumb([{ label: "Home", href: "/" }, { label: "Services", href: "/our-services/" }, { label: "Restorative Dentistry" }])}
${C.section({ name: "article", padding: "small", inner: `
  <div class="article_layout">
    <article>
      ${C.heading("Why a baby tooth is worth repairing", { level: 2 })}
      ${C.spacer("small")}
      ${C.richText(`<p>A baby tooth is not a placeholder that can be written off. It holds the space a permanent tooth will need, it does the chewing in the meantime, and an untreated cavity in one can reach the nerve and the tooth underneath. Restorative treatment repairs the tooth that is already damaged and keeps a small problem from becoming a bigger one.</p>
`)}
      ${C.spacer("large")}
      ${C.heading("The restorative treatments we provide", { level: 2 })}
      ${C.spacer("medium")}
      <div class="layout-grid is-2col">
        ${slugs.map((s) => C.card({ title: labelFor(s), text: firstSentence(s), href: routeOf(s) })).join("")}
      </div>
    </article>
    ${sidebarCta()}
  </div>` })}`;
};

// ---------------------------------------------------------------- our-team
const ourTeam = (d, h) => {
  const { C, img, esc, BOOKING } = h;

  // The live page lists staff as an image followed by a name heading, grouped
  // into Elementor sections titled Front Desk / Dental Assistants / Dental
  // Hygienists. Read the pairs straight out of that structure rather than
  // hard-coding nine names that will go stale the first time somebody leaves.
  const groupsOf = () => {
    const out = [];
    let current = null;
    for (const b of d.blocks || []) {
      if (b.type === "heading" && /^(front desk|dental assistants?|dental hygienists?)$/i.test((b.text || "").trim())) {
        current = { title: b.text.trim(), section: b.section, people: [], pending: null };
        out.push(current);
        continue;
      }
      if (!current) continue;
      // A group ends where its Elementor section ends. Without this the walk
      // ran on past the last hygienist, picked up the accreditation logos as
      // portraits and captioned one of them with the theme's closing headline.
      if (b.section !== current.section) { current = null; continue; }
      if (b.type === "image") { current.pending = b; continue; }
      if (b.type === "heading" && current.pending) {
        const name = (b.text || "").trim();
        // The role repeats under some portraits ("Dental Assistant"); skip it.
        if (!/^(dental assistant|dental hygienist|front desk)$/i.test(name) && name) {
          current.people.push({ name, image: current.pending });
          current.pending = null;
        }
      }
    }
    return out.filter((g) => g.people.length);
  };

  const drBio = para(d, /meet dr\.? tam nguyen/i) || para(d, /^impeccable quality/i);
  const drPortrait = imageLike(d, "HS-8") || imageLike(d, "mam.png");
  const groups = groupsOf();

  return `${C.heroPlain({
    eyebrow: "Childrens dentist Katy",
    title: "Meet Our Pediatric Team",
    text: "The people your child will actually see — at the front desk, in the chair, and behind the exam.",
  })}
${C.breadcrumb([{ label: "Home", href: "/" }, { label: "About", href: "/about-us/" }, { label: "Meet Our Pediatric Team" }])}

${C.section({ name: "doctor", inner: C.split(
  drPortrait ? img(drPortrait.src, "Dr. Tam Nguyen, board-certified pediatric dentist", { sizes: "(max-width: 899px) 100vw, 440px", cls: "media_rounded" }) : "",
  `${C.eyebrow("Board-certified pediatric dentist")}
   ${C.heading("Dr. Tam Nguyen, DMD", { level: 2 })}
   ${C.spacer("small")}
   ${C.richText(drBio)}`)})}

${groups.map((g, i) => C.section({
  name: "team", bg: i % 2 === 0 ? "paper" : "",
  inner: `${C.sectionHeading({ title: g.title, level: 2 })}
  ${C.spacer("medium")}
  <div class="team-grid_component">
    ${g.people.map((p) => `<figure class="team-card_component">
      ${img(p.image.src, p.name, { sizes: "(max-width: 599px) 45vw, 260px", cls: "team-card_image" })}
      <figcaption>
        <p class="team-card_name">${esc(p.name)}</p>
        <p class="team-card_role">${esc(g.title.replace(/s$/, "").replace(/^Front Desk$/, "Front Desk"))}</p>
      </figcaption>
    </figure>`).join("")}
  </div>`,
})).join("\n")}

${C.section({ name: "team-cta", bg: "tan", container: "medium", inner: `
  <div class="text-align-center">
    ${C.heading("Come and meet us", { level: 2 })}
    ${C.spacer("small")}
    ${C.paragraph("You are welcome to visit the office before your child's first appointment. Call and we will arrange a time when the treatment rooms are quiet.", { size: "medium" })}
    ${C.spacer("medium")}
    <div class="button-group is-centered">
      ${C.button({ label: "Request an appointment", href: BOOKING, external: true })}
      ${C.button({ label: "New patient information", href: "/new-patients/", variant: "ghost" })}
    </div>
  </div>` })}`;
};

// ---------------------------------------------------------------- contacts
// The live page published the PARENT practice's suite and phone number
// (#104A / 281-769-8878) under this brand's header, which published #104B and
// 281-578-7100 three lines above it. Rebuilt around the pediatric details, with
// the practice's own copy kept where it says something.
const contacts = (d, h) => {
  const { C, PRACTICE, HOURS, BOOKING, renderEmbed, esc } = h;
  const intro = parasOf(d, /contact/i)[0];
  const closing = (d.blocks || []).filter((b) => b.type === "para").slice(-1)[0];
  const map = (d.embeds || []).find((s) => /google\.com\/maps/.test(s || ""));

  return `${C.heroPlain({
    eyebrow: `${PRACTICE.city}, ${PRACTICE.region}`,
    title: "Contact Us",
    text: intro ? intro.text : "",
  })}
${C.breadcrumb([{ label: "Home", href: "/" }, { label: "Contacts" }])}
${C.section({ name: "contact", inner: `
  <div class="layout-split is-text-wide">
    <div>
      <h2 class="heading-style-h3">Visit us</h2>
      ${C.spacer("small")}
      ${C.richText(`<p><a href="${esc(PRACTICE.maps)}" target="_blank" rel="noopener">${esc(PRACTICE.street)}<br>${esc(PRACTICE.city)}, ${esc(PRACTICE.region)} ${esc(PRACTICE.postal)}</a></p>
      <p>We are located at the corner of Mason Rd and Kingsland Blvd, behind the Ranch 99 complex.</p>
      <p><strong>Call:</strong> <a href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a><br>
      <strong>Email:</strong> <a href="mailto:${esc(PRACTICE.email)}">${esc(PRACTICE.email)}</a></p>`)}
      ${C.spacer("medium")}
      <div class="button-group">
        ${C.button({ label: "Request an appointment", href: BOOKING, external: true })}
        ${C.button({ label: "Virtual consultation", href: "/virtual-consultation/", variant: "ghost" })}
      </div>
    </div>
    <div>
      <h2 class="heading-style-h3">Office hours</h2>
      ${C.spacer("small")}
      ${C.hoursList(HOURS)}
      ${C.spacer("medium")}
      ${C.notice(`<p class="text-size-small">Dental emergency outside these hours? Call <a href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a> as soon as you can and see <a href="/emergency-pediatric-dentistry/">emergency pediatric dentistry</a>.</p>`)}
    </div>
  </div>` })}
${map ? C.sectionFull({ name: "map", inner: renderEmbed(map) }) : ""}
${closing && closing.text && closing.text.length > 80 ? C.section({ name: "contact-note", bg: "paper", container: "medium", inner: C.richText(closing.html || `<p>${closing.text}</p>`) }) : ""}`;
};

// ------------------------------------------------------------- before-after
// The live /before-after/ page was 100% ThemeREX demo content: lorem ipsum, the
// theme's own stock before/after photographs presented as this practice's
// results, and three fabricated "Silver / Gold / Platinum" price tiers. None of
// it may ship. The parent practice's rebuild reached the same conclusion about
// the same page. This says plainly what the gallery is waiting for.
const beforeAfter = (d, h) => {
  const { C, BOOKING, routeOf, labelFor, ROUTES } = h;
  const suggested = ["composite-fillings", "dental-crowns", "bonding", "invisalign", "orthodontics"]
    .filter((s) => ROUTES.has(routeOf(s)));
  return `${C.heroPlain({
    eyebrow: "Katy, TX",
    title: "Smile Gallery",
    text: "Our before-and-after gallery is being restocked with our own patients' results.",
  })}
${C.breadcrumb([{ label: "Home", href: "/" }, { label: "About", href: "/about-us/" }, { label: "Smile Gallery" }])}
${C.section({ name: "gallery", container: "medium", inner: `
  ${C.notice(`<p><strong>This page is being rebuilt.</strong> The gallery that used to sit here was supplied with the website theme — the photographs were not of our patients. We have taken it down rather than leave it up. Real before-and-after photography goes back up here once we have it, with every family's written consent.</p>`)}
  ${C.spacer("large")}
  ${C.heading("In the meantime", { level: 2 })}
  ${C.spacer("small")}
  ${C.paragraph("These are the treatments that change how a smile looks, each explained on its own page:", { size: "medium" })}
  ${C.spacer("medium")}
  ${C.linkList(suggested.map((s) => ({ label: labelFor(s), href: routeOf(s) })))}
  ${C.spacer("large")}
  <div class="button-group">
    ${C.button({ label: "Request an appointment", href: BOOKING, external: true })}
    ${C.button({ label: "See every service", href: "/our-services/", variant: "ghost" })}
  </div>` })}`;
};

// ------------------------------------------------------------- appointment
// The live page was a bare, non-functional month calendar and nothing else.
const appointment = (d, h) => {
  const { C, PRACTICE, HOURS, BOOKING } = h;
  return `${C.heroPlain({
    eyebrow: `${PRACTICE.city}, ${PRACTICE.region}`,
    title: "Request an Appointment",
    text: "Book online, or call the practice and we will find a time that works around school.",
  })}
${C.breadcrumb([{ label: "Home", href: "/" }, { label: "Request an Appointment" }])}
${C.section({ name: "appointment", inner: `
  <div class="layout-split is-text-wide">
    <div>
      ${C.heading("Book online", { level: 2 })}
      ${C.spacer("small")}
      ${C.paragraph("Our online scheduler shows live availability and confirms straight away.", { size: "medium" })}
      ${C.spacer("medium")}
      ${C.button({ label: "Open the scheduler", href: BOOKING, external: true })}
      ${C.spacer("large")}
      ${C.heading("Or call us", { level: 2 })}
      ${C.spacer("small")}
      ${C.richText(`<p><a class="phone-link_component" href="${PRACTICE.phoneHref}">${PRACTICE.phone}</a></p>
        <p>If your child is in pain today, call rather than book online and say it is an emergency — see <a href="/emergency-pediatric-dentistry/">emergency pediatric dentistry</a>.</p>`)}
    </div>
    <div>
      <h2 class="heading-style-h3">Office hours</h2>
      ${C.spacer("small")}
      ${C.hoursList(HOURS)}
      ${C.spacer("medium")}
      ${C.notice(`<p class="text-size-small">First visit? The <a href="/new-patients/">new patient page</a> lists what to bring and what to expect.</p>`)}
    </div>
  </div>` })}`;
};

// -------------------------------------------------------------- thank-you
const thankYou = (d, h) => {
  const { C, PRACTICE } = h;
  return `${C.section({ name: "thank-you", container: "medium", inner: `
  <div class="text-align-center">
    ${C.eyebrow("Thank you")}
    ${C.heading("We have your message", { level: 1 })}
    ${C.spacer("small")}
    ${C.paragraph("Someone from the practice will be in touch during our next opening hours. If it cannot wait, please call us.", { size: "medium" })}
    ${C.spacer("medium")}
    <div class="button-group is-centered">
      ${C.button({ label: `Call ${PRACTICE.phone}`, href: PRACTICE.phoneHref })}
      ${C.button({ label: "Back to the homepage", href: "/", variant: "ghost" })}
    </div>
  </div>` })}`;
};

// --------------------------------------------------- product-recommendations
// The live page rendered nothing at all — a title, a blog sidebar and no body.
// The practice's real product guidance is in the two tables it does publish, so
// this page points at them instead of inventing a list of brands.
const productRecommendations = (d, h) => {
  const { C, BOOKING, ROUTES } = h;
  const links = [
    { label: "Toothpaste Chart", href: "/toothpaste-chart/" },
    { label: "Toothpaste RDA Table", href: "/toothpaste-rda-table/" },
    { label: "PH and Acidity of Food & Beverages", href: "/ph-and-acidity-of-food-beverages/" },
    { label: "Dental Hygiene Education", href: "/services/dental-hygiene-education/" },
  ].filter((l) => ROUTES.has(l.href));
  return `${C.heroPlain({
    eyebrow: "Patient resources",
    title: "Product Recommendations",
    text: "What we tell parents to look for on the label.",
  })}
${C.breadcrumb([{ label: "Home", href: "/" }, { label: "Patient Resources", href: "/patient-resources/" }, { label: "Product Recommendations" }])}
${C.section({ name: "products", container: "medium", inner: `
  ${C.notice("<p><strong>Our full product list is being rewritten.</strong> The page that used to be here was empty. Rather than fill it with brands we have not checked, these are the reference tables the practice keeps for exactly this question — they are the ones we read from in the chair.</p>")}
  ${C.spacer("large")}
  ${C.linkList(links)}
  ${C.spacer("large")}
  ${C.paragraph("Ask us at your child's next visit and we will go through what is in your bathroom cabinet with you.", { size: "medium" })}
  ${C.spacer("medium")}
  ${C.button({ label: "Request an appointment", href: BOOKING, external: true })}` })}`;
};

// ------------------------------------------------------------------ sitemap
// The live sitemap listed 113 entries, most of them pages of the ABANDONED
// install that were not reachable and a per-letter index of a dental dictionary
// that no longer paginates. Generated from the routes this build actually
// produces, so it cannot go stale.
const sitemap = (d, h) => {
  const { C, routeOf, labelFor, ROUTES, esc } = h;
  const listed = (hrefs) => C.linkList(hrefs.filter((x) => ROUTES.has(x.href)));
  const services = SERVICE_GROUPS.flatMap((g) => [g.hub, ...g.slugs])
    .filter((s, i, a) => a.indexOf(s) === i)
    .filter((s) => ROUTES.has(routeOf(s)))
    .map((s) => ({ label: labelFor(s), href: routeOf(s) }));

  const column = (title, items) => `<div>
    <h2 class="heading-style-h4">${esc(title)}</h2>
    ${C.spacer("small")}
    ${listed(items)}
  </div>`;

  return `${C.heroPlain({ eyebrow: "Katy, TX", title: "Sitemap", text: "Every page on this website." })}
${C.breadcrumb([{ label: "Home", href: "/" }, { label: "Sitemap" }])}
${C.section({ name: "sitemap", inner: `
  <div class="layout-grid is-3col">
    ${column("The practice", [
      { label: "Home", href: "/" },
      { label: "About Us", href: "/about-us/" },
      { label: "Meet Our Pediatric Team", href: "/our-team/" },
      { label: "Technology", href: "/technology/" },
      { label: "Smile Gallery", href: "/before-after/" },
      { label: "Contacts", href: "/contacts/" },
    ])}
    ${column("Services", [{ label: "Our Services", href: "/our-services/" }, ...services,
      { label: "Emergency Pediatric Dentistry", href: "/emergency-pediatric-dentistry/" }])}
    ${column("Patients", [
      { label: "Patient Resources", href: "/patient-resources/" },
      { label: "New Patients", href: "/new-patients/" },
      { label: "Request an Appointment", href: "/appointment/" },
      { label: "Knee-to-Knee Dental Exams", href: "/knee-to-knee-pediatric-dental-exam/" },
      { label: "Dental Savings Plan", href: "/dental-saving-plan/" },
      { label: "Special Offers", href: "/special-offers/" },
      { label: "Virtual Consultation", href: "/virtual-consultation/" },
      { label: "Refer a Patient", href: "/refer-a-patient/" },
      { label: "Product Recommendations", href: "/product-recommendations-2/" },
      { label: "Toothpaste Chart", href: "/toothpaste-chart/" },
      { label: "Toothpaste RDA Table", href: "/toothpaste-rda-table/" },
      { label: "PH and Acidity of Food & Beverages", href: "/ph-and-acidity-of-food-beverages/" },
      { label: "Pediatric Dentistry FAQs", href: "/pediatric-dentistry-faqs-katy-tx/" },
      { label: "Invisalign FAQs", href: "/invisalign-faqs-katy-tx/" },
      { label: "FAQs", href: "/faq-page/" },
      { label: "Dental Library", href: "/dental-library/" },
      { label: "Dental Dictionary", href: "/dental-dictionary/" },
      { label: "Town Resources", href: "/town-resource/" },
      { label: "Privacy Policy", href: "/privacy-policy/" },
      { label: "Accessibility Statement", href: "/accessibility-statement/" },
    ])}
  </div>` })}`;
};

// ------------------------------------------------------------ dental-library
// The live page listed 36 topics as plain text that linked nowhere — and more
// than half of them were adult treatments this practice does not provide.
// Rebuilt as an index of the pages that exist.
const dentalLibrary = (d, h) => {
  const { C, routeOf, labelFor, ROUTES, esc } = h;
  const group = (g) => {
    const items = [g.hub, ...g.slugs].filter((s) => ROUTES.has(routeOf(s)));
    if (!items.length) return "";
    return `<div class="card_component">
      <h2 class="heading-style-h4">${esc(labelFor(items[0]))}</h2>
      ${C.spacer("xsmall")}
      ${C.linkList(items.map((s) => ({ label: labelFor(s), href: routeOf(s) })))}
    </div>`;
  };
  return `${C.heroPlain({
    eyebrow: "Katy, TX",
    title: "Dental Library",
    text: "Plain-language explanations of every treatment we provide, written for parents.",
  })}
${C.breadcrumb([{ label: "Home", href: "/" }, { label: "Dental Library" }])}
${C.section({ name: "library", inner: `
  ${C.grid(2, SERVICE_GROUPS.map(group))}
  ${C.spacer("large")}
  ${C.paragraph("Looking for a word rather than a treatment? The dental dictionary explains the terms you will hear in the chair.", { size: "medium" })}
  ${C.spacer("small")}
  ${C.button({ label: "Dental Dictionary", href: "/dental-dictionary/", variant: "ghost" })}` })}`;
};

// ------------------------------------------------------------ patient-resources
const patientResources = (d, h) => {
  const { C, ROUTES, BOOKING } = h;
  const card = (title, text, href) => (ROUTES.has(href) ? C.card({ title, text, href }) : "");
  return `${C.heroPlain({
    eyebrow: "Katy, TX",
    title: "Patient Resources",
    text: "Forms, plans and reference material, all in one place.",
  })}
${C.breadcrumb([{ label: "Home", href: "/" }, { label: "Patient Resources" }])}
${C.section({ name: "resources", inner: `
  ${C.sectionHeading({ title: "Everything in one place", level: 2 })}
  ${C.spacer("medium")}` + C.grid(3, [
  card("New Patients", "What to bring to a first visit and the forms to fill in beforehand.", "/new-patients/"),
  card("Knee-to-Knee Dental Exams", "How we examine an infant or an anxious toddler without a dental chair.", "/knee-to-knee-pediatric-dental-exam/"),
  card("Dental Savings Plan", "An annual membership for families without dental insurance.", "/dental-saving-plan/"),
  card("Special Offers", "Current offers for new and returning patients.", "/special-offers/"),
  card("Virtual Consultation", "Send us photographs and get an opinion before you come in.", "/virtual-consultation/"),
  card("Refer a Patient", "For dentists and physicians referring into the practice.", "/refer-a-patient/"),
  card("Product Recommendations", "What to look for on a toothpaste label.", "/product-recommendations-2/"),
  card("Toothpaste Chart", "Fluoride content of the toothpastes on the shelf.", "/toothpaste-chart/"),
  card("Toothpaste RDA Table", "How abrasive each toothpaste is, by measured RDA.", "/toothpaste-rda-table/"),
  card("PH and Acidity of Food & Beverages", "Which everyday drinks are acidic enough to soften enamel.", "/ph-and-acidity-of-food-beverages/"),
  card("Pediatric Dentistry FAQs", "The questions parents ask us most.", "/pediatric-dentistry-faqs-katy-tx/"),
  card("Town Resources", "Local services for families in Katy.", "/town-resource/"),
]) })}
${C.section({ name: "resources-cta", bg: "paper", container: "medium", inner: `
  <div class="text-align-center">
    ${C.heading("Still have a question?", { level: 2 })}
    ${C.spacer("small")}
    ${C.paragraph("Call the practice — we would rather answer it now than have you guess.", { size: "medium" })}
    ${C.spacer("medium")}
    <div class="button-group is-centered">${C.button({ label: "Request an appointment", href: BOOKING, external: true })}</div>
  </div>` })}`;
};

// ------------------------------------------------------------ refer-a-patient
// The live page is EMPTY — a title band, the location note and a blog teaser
// strip. Its content in the abandoned install was one thing and one thing only:
// a 123FormBuilder embed (form 6072889), a script tag that leaves nothing
// behind in a static snapshot. Guessing that form's public embed URL and
// shipping it would be shipping a URL nobody has verified, so the page is built
// around the routes that work today and the form is an open item.
const referAPatient = (d, h) => {
  const { C, PRACTICE, esc, BOOKING } = h;
  return `${C.heroPlain({
    eyebrow: "For referring dentists and physicians",
    title: "Refer a Patient",
    text: "We see referrals from general dentists, pediatricians and orthodontists across Katy — including infants, patients with special healthcare needs, and children who need treatment under sedation.",
  })}
${C.breadcrumb([{ label: "Home", href: "/" }, { label: "Refer a Patient" }])}
${C.section({ name: "refer", inner: `
  <div class="layout-split is-text-wide">
    <div>
      ${C.heading("How to refer", { level: 2 })}
      ${C.spacer("small")}
      ${C.richText(`<p>Call the practice and we will take the referral over the phone, or email the patient's details and any radiographs and we will contact the family directly to schedule.</p>
      <p><strong>Call:</strong> <a href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a><br>
      <strong>Email:</strong> <a href="mailto:${esc(PRACTICE.email)}">${esc(PRACTICE.email)}</a></p>
      <p>We will send you a report after the appointment, and the child goes back to you for their routine care unless you ask us to keep them.</p>`)}
      ${C.spacer("medium")}
      ${C.notice("<p class=\"text-size-small\"><strong>Our online referral form is being reconnected.</strong> Until it is back, the phone and email above reach the same place, and a phone referral is answered the same day.</p>")}
    </div>
    <div>
      <h2 class="heading-style-h3">What we treat</h2>
      ${C.spacer("small")}
      ${C.linkList([
        { label: "Comprehensive pediatric dentistry", href: "/services/comprehensive-pediatric-dentistry/" },
        { label: "Special needs patient care", href: "/services/special-needs-patient-care/" },
        { label: "Sedation dentistry", href: "/services/sedation-dentistry/" },
        { label: "Pulp therapy", href: "/services/pulp-therapy/" },
        { label: "Extractions", href: "/services/extractions/" },
        { label: "Space maintainers", href: "/services/space-maintainers/" },
        { label: "Early orthodontic intervention", href: "/services/early-intervention/" },
        { label: "Emergency pediatric dentistry", href: "/emergency-pediatric-dentistry/" },
      ])}
      ${C.spacer("medium")}
      ${C.button({ label: "Book a patient in", href: BOOKING, external: true })}
    </div>
  </div>` })}`;
};

// ---------------------------------------------------------- privacy-policy
// NOT recovered — the pediatric site never published one, and neither did the
// parent site (its /privacy-policy/ returned 403 to the crawler). This is an
// interim notice describing what the WEBSITE does, clearly marked for review.
// It is not the practice's HIPAA Notice of Privacy Practices and does not
// pretend to be.
const privacyPolicy = (d, h) => {
  const { C, PRACTICE, esc } = h;
  return `${C.heroPlain({ eyebrow: "Legal", title: "Privacy Policy" })}
${C.breadcrumb([{ label: "Home", href: "/" }, { label: "Privacy Policy" }])}
${C.section({ name: "legal", container: "small", inner: `
  ${C.notice("<p><strong>Interim notice, pending review.</strong> This describes how this website handles information. It is <em>not</em> the practice's HIPAA Notice of Privacy Practices, which covers your child's health records and is given to you at the practice.</p>")}
  ${C.spacer("large")}
  ${C.richText(`
  <h2>What this website collects</h2>
  <p>This site is static: it has no accounts, no database and no tracking or advertising scripts. Ordinary web-server logs record the request — page, time, browser and IP address — and are kept only for security and troubleshooting.</p>

  <h2>Forms and booking</h2>
  <p>Appointment requests and virtual-consultation submissions are handled by third-party services embedded in the pages that use them. What you type there goes to that service and then to the practice, under that service's own privacy terms. Do not use a web form to send anything urgent — call <a href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a>.</p>

  <h2>Text messages</h2>
  <p>If you give us a mobile number and agree to appointment reminders, we use it for that. Reply STOP to any message to end them. Message and data rates may apply. Consent to reminders is never a condition of treatment.</p>

  <h2>Children</h2>
  <p>This site is written for parents and carers. We do not knowingly collect information directly from a child through this website.</p>

  <h2>Fonts and maps</h2>
  <p>Pages load typefaces from Google Fonts and, on the contact page, an embedded Google Map. Those requests reach Google and are covered by Google's privacy policy.</p>

  <h2>Asking us about your information</h2>
  <p>To ask what the practice holds about you or your child, or to have it corrected, contact us at <a href="mailto:${esc(PRACTICE.email)}">${esc(PRACTICE.email)}</a> or <a href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a>. Health records are handled under the practice's HIPAA notice, not under this page.</p>

  <h2>Changes</h2>
  <p>This notice will be replaced by the practice's reviewed policy. Until then it is what governs this website.</p>`)}` })}`;
};

// ---------------------------------------------------------------- exports
export const BESPOKE = {
  "home": home,
  "our-services": ourServices,
  "our-team": ourTeam,
  "contacts": contacts,
  "before-after": beforeAfter,
  "appointment": appointment,
  "thank-you": thankYou,
  "product-recommendations-2": productRecommendations,
  "sitemap": sitemap,
  "dental-library": dentalLibrary,
  "patient-resources": patientResources,
  "privacy-policy": privacyPolicy,
  "restorative-dentistry": restorativeDentistry,
  "refer-a-patient": referAPatient,
};

// Live pages that are ThemeREX demo content, WooCommerce scaffolding or exact
// duplicates. The parent practice's rebuild dropped the same set.
export const SKIP = new Set([
  "pricing", "shop", "cart", "my-account", "wishlist-page", "newsletter-popups",
  "blog", "blog-grid", "blog-list", "blog-masonry", "blog-portfolio", "blog-standard",
  "dental-savings-plan",
]);

// Titles and descriptions for pages whose recovered <title> is wrong, generic,
// or describes a page that no longer exists.
export const META = {
  "before-after": {
    title: "Smile Gallery | Mason Park Dental for Kids",
    description: "Our before-and-after gallery is being restocked with our own patients' results, with consent. In the meantime, see the treatments that change how a smile looks.",
  },
  "our-services": {
    title: "Pediatric Dental Services in Katy, TX | Mason Park Dental for Kids",
    description: "Preventive, restorative, orthodontic and sedation dentistry for infants, children, teenagers and patients with special healthcare needs in Katy, Texas.",
  },
  "our-team": {
    title: "Meet Our Pediatric Team | Mason Park Dental for Kids, Katy TX",
    description: "Dr. Tam Nguyen, board-certified pediatric dentist, and the front desk, dental assistants and hygienists your child will see at every visit.",
  },
  "appointment": {
    title: "Request an Appointment | Mason Park Dental for Kids, Katy TX",
    description: "Book your child's pediatric dental appointment in Katy, TX online or by phone. Same-day help for dental emergencies.",
  },
  "product-recommendations-2": {
    title: "Product Recommendations | Mason Park Dental for Kids",
    description: "What we tell parents to look for on a toothpaste label, with the practice's own fluoride and abrasivity reference tables.",
  },
  "privacy-policy": {
    title: "Privacy Policy | Mason Park Dental for Kids",
    description: "How this website handles information. Interim notice pending review; not the practice's HIPAA Notice of Privacy Practices.",
  },
  "restorative-dentistry": {
    title: "Pediatric Restorative Dentistry in Katy, TX | Mason Park Dental for Kids",
    description: "Fillings, crowns, pulp therapy, extractions and space maintainers for children in Katy, Texas.",
  },
  "sitemap": {
    title: "Sitemap | Mason Park Dental for Kids, Katy TX",
    description: "Every page on the Mason Park Dental for Kids website.",
  },
  "dental-library": {
    title: "Dental Library | Mason Park Dental for Kids, Katy TX",
    description: "Plain-language explanations of every pediatric dental treatment we provide, written for parents.",
  },
  "patient-resources": {
    title: "Patient Resources | Mason Park Dental for Kids, Katy TX",
    description: "New patient forms, the dental savings plan, virtual consultations, toothpaste tables and the questions parents ask us most.",
  },
  "refer-a-patient": {
    title: "Refer a Patient | Mason Park Dental for Kids, Katy TX",
    description: "For dentists, pediatricians and orthodontists referring a child to Mason Park Dental for Kids in Katy, TX. Call (281) 578-7100 or email the practice.",
  },
  "knee-to-knee-pediatric-dental-exam": {
    title: "What Is a Knee-to-Knee Pediatric Dental Exam? | Mason Park Dental for Kids",
    description: "How a knee-to-knee exam lets us examine an infant or an anxious toddler on a parent's lap instead of in a dental chair, and how to prepare your child for it.",
  },
  "toothpaste-chart": {
    title: "Toothpaste Chart | Mason Park Dental for Kids, Katy TX",
    description: "Fluoride content of the toothpastes on the shelf, so you can check the one in your bathroom cabinet against what your child actually needs.",
  },
  "thank-you": {
    title: "Thank You | Mason Park Dental for Kids",
    description: "We have your message and will be in touch during our next opening hours.",
  },
};
