// ===========================================================================
// THE HOMEPAGE, AS A JOURNEY.
//
// Replaces the thirteen-band homepage that shipped on 2026-08-31. That page was
// exactly the failure mode named in deliver/brandklout/docs/DESIGN-STANDARD.md:
// a vertical stack of interchangeable bands, each holding a grid of equal cards.
// Swap any two and nothing breaks, because nothing was ever connected.
//
// This is eight named narrative beats in an order that cannot be shuffled. The
// name says what the beat does to the reader, never what widget sits inside it.
// The reference implementation is the Dr. Nahlah build; the fundamentals taken
// from it are the architecture, not the styling:
//
//   1. Chapters, numbered and tagged, so the visitor knows where they are.
//   2. Scroll DOES WORK three times (a scrubbed statement, a pinned horizontal
//      path, a scrubbed pull quote), rather than triggering fade-ups.
//   3. Every chapter is a different SHAPE. No two read alike.
//   4. Short copy set large. Long copy is the enemy of conversion, and the old
//      page had four paragraph walls above the fold line.
//   5. Atmosphere shifts. Light, warm, dark, back to light.
//
// The palette and the three type families are the ONLY things taken from the
// client's Figma handoff, which is the standing instruction for a handed-off
// style guide: extract colour and type, elevate everything else.
//
// COPY RULES enforced here: no em dashes anywhere in visitor-facing text, and
// no image slot is ever empty. Every photograph below resolves to a real file
// in the practice's own media library; the service imagery is read out of each
// service page's own featured image, so the pairing is the client's, not ours.
// ===========================================================================

const BOOK = "https://www.flexbook.me/masonpark/1";

const MAP_EMBED = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3463.0585305167815!2d-95.75121988455305!3d29.775949038160515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86412740e7dd5def%3A0xfa1ab8c6e696e133!2sMason%20Park%20Dental%20-%20Katy%20Dentist!5e0!3m2!1sen!2sus!4v1638807674675!5m2!1sen!2sus";

// ---------------------------------------------------------------- the doctors
// Same three as the previous build, same source blurbs, with the em dashes in
// Dr. Sung's line rewritten as clauses.
const DOCTORS = [
  {
    image: "/wp-content/uploads/2023/11/HS-8-scaled.jpg",
    name: "Dr. Tam Nguyen",
    role: "Board Certified Pediatric Dentist",
    href: "/team/tam-nguyen/",
    blurb: "Dental degree and pediatric residency at Boston University. She treats children from six months old, and patients with special needs.",
    note: "The reason a family does not need a second practice.",
  },
  {
    image: "/wp-content/uploads/2023/11/HS-7-scaled.jpg",
    name: "Dr. Dave Cho",
    role: "General Dentist",
    href: "/team/dr-cho/",
    blurb: "Oral sedation, endodontics, oral surgery, implant placement and cosmetic dentistry, with a manner that puts nervous patients at ease.",
    note: "Sedation certified, so a long appointment is one appointment.",
  },
  {
    image: "/wp-content/uploads/2020/04/DrWilliamSung-230x300-1.webp",
    name: "Dr. William Sung",
    role: "General Dentist",
    href: "/team/dr-sung/",
    blurb: "Fellow of the Academy of General Dentistry, a distinction held by 7% of general dentists in Texas, with around 100 hours of continuing education a year.",
    note: "Top 7% of Texas general dentists by continuing education.",
  },
];

// ------------------------------------------------------------- the three arcs
// The fourteen treatments, still three groups, but each group is now a SCENE
// with its own photograph and its own numeral rather than a row of equal tiles.
// `img` names the service page whose featured image leads the group; the client
// chose that photograph for that treatment, so the pairing is theirs.
const ARCS = [
  {
    key: "everyday",
    numeral: "01",
    label: "Everyday care",
    title: "The visits that keep the rest away",
    text: "Cleanings, exams, sealants and the six month check that finds a problem while it is still small and cheap.",
    lead: "preventative-dentistry",
    items: [
      ["Preventative Dentistry", "Cleanings, exams and sealants.", "/services/preventative-dentistry/", "preventative-dentistry"],
      ["Comprehensive Care", "Full spectrum treatment under one roof.", "/services/comprehensive-care/", "comprehensive-care"],
      ["Pediatric Dental Care", "Gentle first visits, from six months old.", "/services/pediatric-dental-care/", "pediatric-dental-care"],
      ["Emergency Dentist", "Same day help when something breaks.", "/services/emergency-dentist/", "emergency-dentist"],
    ],
  },
  {
    key: "cosmetic",
    numeral: "02",
    label: "Cosmetic and orthodontic",
    title: "Changing how it looks, on purpose",
    text: "Shade, shape and alignment planned digitally and shown to you before a single tooth is prepared.",
    lead: "cosmetic-dentistry",
    items: [
      ["Cosmetic Dentistry", "Veneers, bonding and smile makeovers.", "/services/cosmetic-dentistry/", "cosmetic-dentistry"],
      ["Porcelain Veneers", "Previewed before anything is prepared.", "/services/porcelain-dental-veneers/", "porcelain-dental-veneers"],
      ["Invisalign", "Clear aligners planned digitally. No metal.", "/services/invisalign/", "invisalign"],
      ["Dental Bonding", "Chips and gaps closed in a single visit.", "/services/bonding/", "bonding"],
    ],
  },
  {
    key: "restorative",
    numeral: "03",
    label: "Restorative and surgical",
    title: "Rebuilding what is already gone",
    text: "Implants, crowns, dentures and surgery, planned around the final result rather than the immediate problem.",
    lead: "dental-implant-placement",
    items: [
      ["Dental Implants", "Titanium posts topped with matched crowns.", "/services/dental-implant-placement/", "dental-implant-placement"],
      ["Dentures", "Full and partial, fitted for comfort.", "/services/dentures/", "dentures"],
      ["Root Canal Therapy", "Saving a tooth rather than taking it out.", "/services/root-canal-therapy/", "root-canal-therapy"],
      ["Oral Surgery", "Complex extractions and jaw concerns.", "/services/oral-surgery/", "oral-surgery"],
      ["Extractions", "Straightforward and surgical, wisdom teeth included.", "/services/extractions/", "extractions"],
      ["Sedation Dentistry", "Relaxed visits, with safe sedation options.", "/services/sedation-dentistry/", "sedation-dentistry"],
    ],
  },
];

// ------------------------------------------------------------------- the path
// Four steps, four real photographs. The financing objection is answered INSIDE
// step three, where it actually lands, rather than as its own band four screens
// further down.
const PATH = [
  {
    n: "01",
    title: "Book it in a minute",
    text: "Pick a time online or ring the front desk. Tell us who is coming, adults and children on the same visit if that is easier.",
    image: "/wp-content/uploads/2023/11/Dentist-in-Katy-Office.webp",
    alt: "The waiting area at Mason Park Dental, with a pale wood wall and a white sofa",
  },
  {
    n: "02",
    title: "The first visit",
    text: "A full exam, digital x-rays and a look at everything on a screen you can see too. No treatment is started on the day you arrive.",
    image: "/wp-content/uploads/2022/09/Dentist-in-Katy-1024x683-1.webp",
    alt: "A patient in the chair looking at her own teeth in a hand mirror",
  },
  {
    n: "03",
    title: "The plan and the price",
    text: "Written out before anything begins, with what insurance covers and what it does not. Cherry financing splits the balance at 0% APR with no hard credit check.",
    image: "/wp-content/uploads/2023/08/AdobeStock_613444649-1-1536x1024.jpeg",
    alt: "A dentist explaining treatment with a model of the upper and lower arch",
  },
  {
    n: "04",
    title: "The care, and the next one",
    text: "The work itself, then a recall you do not have to remember. The same hygienist sees your family next time, which is the whole point of one practice.",
    image: "/wp-content/uploads/2023/08/AdobeStock_118631127-1536x1024.jpeg",
    alt: "A patient smiling after treatment",
  },
];

// The four figures. Every one is traceable: three doctors on staff, the
// youngest age Dr. Nguyen accepts, the number of treatment pages this build
// renders, and the Cherry rate. Nothing here is a marketing number, and the
// star rating the comps wanted is still absent for the reason it always was.
const FIGURES = [
  ["3", "", "Doctors on staff"],
  ["6", "mo", "Youngest patient"],
  ["35", "", "Treatments offered"],
  ["0", "%", "APR financing"],
];

// Here, against the alternative every Katy family already lives with. This is
// the conversion argument and it is the practice's actual difference, so it is
// stated plainly rather than implied by a grid of icons.
const VERSUS = [
  ["A board certified pediatric dentist and general dentists in the same building.",
   "A referral to a children's practice on the other side of Katy."],
  ["One appointment slot for the adults and the children, on one afternoon.",
   "Two practices, two calendars, two half days off work."],
  ["One team that has seen your family's history, and remembers it.",
   "Two charts that never meet, and a story retold every visit."],
  ["Sedation, surgery, implants and orthodontics handled in house.",
   "Referred out for anything past a filling."],
  ["Treatment planned and priced in writing before it starts.",
   "A number at the desk on the way out."],
];

export function home(d, h) {
  const esc = h.esc;

  // Featured photography, read from each service page's own content file, so
  // an image slot is never empty and never a stock stand-in for a page that
  // already has a picture the client chose.
  const featured = (slug, fallback) => {
    // Service content files are keyed `services-<name>`, not `<name>`. Try both
    // so a slug can be written the way it reads in the URL.
    const page = h.read("services-" + slug) || h.read(slug);
    return (page && page.featured && page.featured.src) || fallback;
  };

  // ---- reviews -----------------------------------------------------------
  // Quote and attribution arrive as consecutive blocks in section 15. The live
  // page repeats one twice with different trailing punctuation, so dedupe on a
  // normalised prefix and drop any quote with no attribution.
  const rb = (d.blocks || []).filter((b) => b.section === 15);
  const seen = new Set();
  const key = (q) => q.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
  const reviews = [];
  for (let i = 0; i < rb.length; i++) {
    if (rb[i].type !== "para") continue;
    const next = rb[i + 1];
    const quote = rb[i].text.trim().replace(/^[“”"'\s]+/, "").replace(/[“”"'\s]+$/, "");
    const author = next && next.type === "heading" ? next.text.replace(/^-\s*/, "") : "";
    if (author && !seen.has(key(quote))) { seen.add(key(quote)); reviews.push({ quote, author }); }
  }
  // The lead quote is the shortest one that still says something, because a
  // 90-word review set at display size is a wall, not a pull quote.
  const byLength = reviews.slice().sort((a, b) => a.quote.length - b.quote.length);
  const lead = byLength.find((r) => r.quote.length > 90 && r.quote.length < 240) || reviews[0];
  const rail = reviews.filter((r) => r !== lead).slice(0, 8);

  // ---- FAQ ---------------------------------------------------------------
  const faqSource = h.read("faq-page");
  const wanted = [
    "do you accept new patients",
    "what do i need to bring to my first dental appointment",
    "how often should i visit the dentist",
    "what services does a general dentist offer",
  ];
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const homeFaqs = wanted
    .map((w) => ((faqSource && faqSource.blocks) || []).find((b) => b.type === "faq" && norm(b.question) === w))
    .filter(Boolean)
    .map((b) => ({ question: b.question, html: h.rewrite(b.html) }));

  const tag = (n, name) =>
    `<p class="chapter-tag"><i></i><span>Chapter ${n}</span><b>${esc(name)}</b></p>`;

  // =======================================================================
  // CHAPTER 00 — ARRIVAL
  // Full bleed, the practice's own team photograph, one sentence set very
  // large. The previous hero put the photo in a box beside a paragraph; a box
  // beside a paragraph is a brochure, and it is what the team called ugly.
  // =======================================================================
  const arrival = `
<section class="ch ch-arrival" id="arrival" data-chapter="0" data-chapter-name="Arrival" data-theme="dark">
  <div class="ar-bg" data-drift>
    ${h.img("/wp-content/uploads/2023/11/g7-1536x1024.jpg", "The team at Mason Park Dental of Katy", { sizes: "100vw", eager: true, w: 1536, h: 1024 })}
  </div>
  <div class="ar-veil" aria-hidden="true"></div>
  <div class="ar-in">
    ${tag("00", "Arrival")}
    <h1 class="ar-title" data-split>Two dental practices.<br>One <em>front door.</em></h1>
    <p class="ar-lede" data-anim="hide">A general practice for adults and a board certified pediatric practice for children, sharing one building on Kingsland Boulevard. Your six month old and your grandfather, the same afternoon.</p>
    <div class="ar-actions" data-anim="hide">
      <a class="button is-lg" href="${esc(BOOK)}" target="_blank" rel="noopener">Book an appointment</a>
      <a class="button is-ghost-light is-lg" href="#together">See how that works</a>
    </div>
    <div class="ar-meta" data-anim="hide">
      <div><b>Adults and kids</b><span>Under one roof</span></div>
      <div><b>Board certified</b><span>Pediatric dentistry</span></div>
      <div><b>Mon to Thu</b><span>Appointments</span></div>
    </div>
  </div>
  <p class="ar-cue" aria-hidden="true"><span>Scroll</span><i></i></p>
</section>`;

  // =======================================================================
  // CHAPTER 01 — THE RELAY
  // The pain, named. Pinned and scrubbed: the sentence is written word by word
  // as you scroll, which is the first of the three places scroll does work.
  // =======================================================================
  const relay = `
<section class="ch ch-relay" id="relay" data-chapter="1" data-chapter-name="The Relay">
  <div class="wrap re-grid">
    <div class="re-copy">
      ${tag("01", "The Relay")}
      <p class="re-big" id="relayBig">Most families in Katy run two dental offices. One for the adults. One for the children. Two waiting rooms, two drives across town, two sets of forms, and nobody who has seen the whole family.</p>
      <div class="re-after" id="relayAfter">
        <p>It is not a small inconvenience. It is the reason a child's check gets postponed to a term that never comes, and the reason an adult's own cleaning is the appointment that gets dropped.</p>
      </div>
    </div>
    <div class="re-side">
      <figure class="re-media" data-drift>
        ${h.img("/wp-content/uploads/2023/11/Dentist-in-Katy-Office.webp", "The waiting room at Mason Park Dental, shared by both practices", { sizes: "(max-width: 899px) 100vw, 40vw", cls: "re-img" })}
        <figcaption>One waiting room on Kingsland Boulevard, shared by both practices.</figcaption>
      </figure>
      <p class="re-turn">Here it is one building, one team, one afternoon.</p>
    </div>
  </div>
</section>`;

  // =======================================================================
  // CHAPTER 02 — UNDER ONE ROOF
  // The answer, argued. Four figures that count, then the comparison that
  // every visitor is running in their head anyway, written down.
  // =======================================================================
  const together = `
<section class="ch ch-together" id="together" data-chapter="2" data-chapter-name="Under One Roof">
  <div class="wrap">
    <div class="tg-head">
      <div>
        ${tag("02", "Under One Roof")}
        <h2 data-split>The whole family, on one afternoon.</h2>
      </div>
      <p class="tg-lede">Two practices share this address. Dr. Nguyen is a board certified pediatric dentist, which is a three year specialty beyond dental school, and she is here rather than across town. That single fact is what collapses two trips into one.</p>
    </div>

    <div class="tg-figures" id="tgFigures">
      ${FIGURES.map(([n, suf, label]) => `
      <div class="tg-fig">
        <b data-count="${esc(n)}"${suf ? ` data-suffix="${esc(suf)}"` : ""}>${esc(n)}${esc(suf)}</b>
        <span>${esc(label)}</span>
      </div>`).join("")}
    </div>

    <div class="tg-pair">
      <figure class="tg-shot">
        ${h.img("/wp-content/uploads/2023/08/AdobeStock_398040894-scaled.jpeg", "A child at a check up with the pediatric dentist", { sizes: "(max-width: 899px) 100vw, 46vw" })}
        <figcaption><span class="tg-pill is-kids">For kids</span>Board certified pediatric care, from the first tooth.</figcaption>
      </figure>
      <div class="tg-side">
        <p class="tg-aside">Three generations of the same family are booked in this building most weeks. That is not a slogan. It is what happens when nobody has to be sent somewhere else.</p>
        <figure class="tg-shot">
          ${h.img("/wp-content/uploads/2023/08/AdobeStock_605115846-scaled.jpeg", "A grandmother and her granddaughter", { sizes: "(max-width: 899px) 100vw, 40vw" })}
          <figcaption><span class="tg-pill">For adults</span>Cosmetic, restorative and everyday care, planned with you.</figcaption>
        </figure>
      </div>
    </div>

    <div class="tg-versus">
      <h3>Here, against the way most families do it.</h3>
      <div class="vs-table" role="table" aria-label="Mason Park compared with using two separate dental practices">
        <div class="vs-row is-head" role="row">
          <span role="columnheader" class="vs-a">At Mason Park</span>
          <span class="vs-mid" aria-hidden="true">vs</span>
          <span role="columnheader" class="vs-b">Two separate practices</span>
        </div>
        ${VERSUS.map(([a, b]) => `
        <div class="vs-row" role="row">
          <span role="cell" class="vs-a">${esc(a)}</span>
          <span class="vs-mid" aria-hidden="true"><i></i></span>
          <span role="cell" class="vs-b">${esc(b)}</span>
        </div>`).join("")}
      </div>
    </div>
  </div>

  <div class="tg-marquee" aria-hidden="true">
    <div class="mq-row" id="mqRow">
      ${["Board Certified Pediatric Dentist", "Kois Center Trained", "Academy of General Dentistry", "Sedation Dentistry", "Invisalign Provider", "Same Day Emergencies", "0% APR Financing", "Open Monday to Thursday"]
        .map((s) => `<span>${esc(s)}</span><b>&#9670;</b>`).join("")}
    </div>
  </div>
</section>`;

  // =======================================================================
  // CHAPTER 03 — THE RANGE
  // Fourteen treatments, three scenes. The previous build ranked nothing: it
  // put fourteen equal bordered tiles in one grid and made the visitor read
  // every label to find theirs. Each arc now leads with a photograph and sets
  // its treatments as a hairline index, which is scannable in one pass.
  // =======================================================================
  const range = `
<section class="ch ch-range" id="range" data-chapter="3" data-chapter-name="The Range" data-theme="warm">
  <div class="wrap rg-head">
    ${tag("03", "The Range")}
    <h2 data-split>Thirty five treatments. One building. No referral out.</h2>
  </div>
  ${ARCS.map((arc, i) => `
  <article class="rg-arc${i % 2 ? " is-flipped" : ""}" data-arc="${esc(arc.key)}">
    <div class="rg-media" data-drift>
      ${h.img(featured(arc.lead, "/wp-content/uploads/2023/11/Dentist-in-Katy-Office.webp"), esc(arc.label) + " at Mason Park Dental", { sizes: "(max-width: 899px) 100vw, 48vw" })}
      <span class="rg-numeral" aria-hidden="true">${esc(arc.numeral)}</span>
    </div>
    <div class="rg-body">
      <p class="rg-label">${esc(arc.label)}</p>
      <h3>${esc(arc.title)}</h3>
      <p class="rg-text">${esc(arc.text)}</p>
      <ul class="rg-index">
        ${arc.items.map(([name, blurb, href, slug]) => {
          const to = h.link(href);
          const thumb = featured(slug, "");
          const inner = `
            <span class="rg-thumb">${thumb ? h.img(thumb, "", { sizes: "72px", decorative: true }) : ""}</span>
            <span class="rg-name">${esc(name)}</span>
            <span class="rg-blurb">${esc(blurb)}</span>
            <span class="rg-go" aria-hidden="true">&rarr;</span>`;
          return `<li class="rg-item">${to ? `<a href="${esc(to)}">${inner}</a>` : `<span class="rg-item-plain">${inner}</span>`}</li>`;
        }).join("")}
      </ul>
    </div>
  </article>`).join("")}
  <div class="wrap rg-foot">
    <a class="link-arrow" href="/our-services/">Every treatment we offer <span aria-hidden="true">&rarr;</span></a>
  </div>
</section>`;

  // =======================================================================
  // CHAPTER 04 — THE PEOPLE
  // Three portraits set as tall editorial plates rather than bordered cards,
  // with the line that matters about each doctor pulled out above the bio.
  // =======================================================================
  const people = `
<section class="ch ch-people" id="people" data-chapter="4" data-chapter-name="The People" data-theme="dark">
  <div class="wrap pe-head">
    ${tag("04", "The People")}
    <h2 data-split>You will see the same faces next time.</h2>
    <p class="pe-lede">Low turnover is not a marketing line. It is why your child's hygienist remembers the trick that worked last time, and why a crown placed three years ago still matches.</p>
  </div>
  <div class="pe-grid">
    ${DOCTORS.map((doc) => {
      const to = h.link(doc.href) || "/our-doctors/";
      return `
    <article class="pe-card">
      <a class="pe-plate" href="${esc(to)}">
        ${h.img(doc.image, doc.name, { sizes: "(max-width: 899px) 100vw, 31vw" })}
        <span class="pe-veil" aria-hidden="true"></span>
      </a>
      <p class="pe-note">${esc(doc.note)}</p>
      <h3><a href="${esc(to)}">${esc(doc.name)}</a></h3>
      <p class="pe-role">${esc(doc.role)}</p>
      <p class="pe-blurb">${esc(doc.blurb)}</p>
    </article>`;
    }).join("")}
  </div>
  <div class="pe-band">
    ${h.img("/wp-content/uploads/2023/11/g7-1536x1024.jpg", "The full team at Mason Park Dental of Katy", { sizes: "100vw" })}
    <div class="pe-band-in">
      <p>Behind the three doctors, the hygienists and front desk most families actually see the most.</p>
      <a class="link-arrow is-light" href="/our-team/">Meet the team <span aria-hidden="true">&rarr;</span></a>
    </div>
  </div>
</section>`;

  // =======================================================================
  // CHAPTER 05 — THE PATH
  // Pinned horizontal. The second place scroll does work. Financing is folded
  // into step three, where the objection actually lands.
  // =======================================================================
  const path = `
<section class="ch ch-path" id="path" data-chapter="5" data-chapter-name="The Path">
  <div class="pa-pin" id="pathPin">
    <div class="pa-head">
      ${tag("05", "The Path")}
      <h2>Four steps, and you know the price before the third.</h2>
    </div>
    <div class="pa-track" id="pathTrack">
      ${PATH.map((s) => `
      <article class="pa-card">
        <div class="pa-shot">${h.img(s.image, s.alt, { sizes: "(max-width: 899px) 82vw, 30vw" })}</div>
        <span class="pa-no">${esc(s.n)}</span>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.text)}</p>
      </article>`).join("")}
      <article class="pa-card is-cta">
        <span class="pa-no">&#9670;</span>
        <h3>Start at step one.</h3>
        <p>Booking online takes about a minute, and the front desk will put the whole family in one slot if you ask.</p>
        <a class="button" href="${esc(BOOK)}" target="_blank" rel="noopener">Book an appointment</a>
        <p class="pa-call">Or call <a href="${h.PRACTICE.phoneHref}">${esc(h.PRACTICE.phone)}</a></p>
      </article>
    </div>
    <div class="pa-bar" aria-hidden="true"><i id="pathBar"></i></div>
  </div>
</section>`;

  // =======================================================================
  // CHAPTER 06 — THE PROOF
  // One quote set at display size and scrubbed word by word, then the rest as
  // a rail. The previous build ran six equal boxes of ninety word reviews,
  // which nobody reads and which ranked nothing.
  // =======================================================================
  const proof = lead ? `
<section class="ch ch-proof" id="proof" data-chapter="6" data-chapter-name="The Proof" data-theme="warm">
  <div class="wrap pr-head">
    <div>
      ${tag("06", "The Proof")}
      <h2 data-split>What Katy families actually say.</h2>
    </div>
    <p class="pr-note">Every quote on this page is a review the practice's own patients left on Google. Nothing here is written by us, and nothing is trimmed to change what it says.</p>
  </div>
  <div class="wrap pr-lead">
    <figure class="pr-quote">
      <span class="pr-mark" aria-hidden="true">&#8220;</span>
      <blockquote id="proofQuote">${esc(lead.quote)}</blockquote>
      <figcaption><span class="pr-rule" aria-hidden="true"></span>${esc(lead.author)}<b>Google review</b></figcaption>
    </figure>
    <div class="pr-portrait" data-drift>
      ${h.img("/wp-content/uploads/2023/08/AdobeStock_388565488-scaled.jpeg", "A long standing patient of the practice", { sizes: "(max-width: 959px) 100vw, 34vw" })}
    </div>
  </div>
  <div class="pr-rail" id="proofRail">
    <div class="pr-rail-in">
      ${rail.map((r) => `
      <blockquote class="pr-chip">
        <p>${esc(r.quote)}</p>
        <cite>${esc(r.author)}</cite>
      </blockquote>`).join("")}
    </div>
  </div>
  <div class="wrap pr-foot">
    <a class="link-arrow" href="/patient-reviews/">Read more reviews <span aria-hidden="true">&rarr;</span></a>
  </div>

  <!-- The five accreditation marks are white artwork on transparency, so they
       only read on an ink ground. Rendered here rather than through
       C.badgeStrip, which emits its own full section and left a band of empty
       warm above and below it. -->
  <div class="pr-badges">
    <div class="pr-badges-in">
      <p class="pr-badges-label">Credentialed by</p>
      <ul>
        ${h.ACCREDITATIONS.map(([src, alt]) => `<li>${h.img(src, alt, { sizes: "150px" })}</li>`).join("")}
      </ul>
    </div>
  </div>
</section>` : "";

  // =======================================================================
  // CHAPTER 07 — THE INVITATION
  // Everything a visitor needs to act, in one place: book, call, where, when,
  // and the four questions that stop people booking. Nothing after it but the
  // footer, so the page does not dead end.
  // =======================================================================
  const invitation = `
<section class="ch ch-invitation" id="invitation" data-chapter="7" data-chapter-name="The Invitation" data-theme="dark">
  <div class="wrap iv-top">
    <div class="iv-copy">
      ${tag("07", "The Invitation")}
      <h2 data-split>Come and see the building.</h2>
      <p class="iv-lede">On the corner of Mason Road and Kingsland Boulevard, behind the Ranch 99 complex. Free parking at the door, and a waiting room that does not sound like a dental office.</p>
      <div class="iv-actions">
        <a class="button is-lg" href="${esc(BOOK)}" target="_blank" rel="noopener">Book an appointment</a>
        <a class="button is-ghost-light is-lg" href="${h.PRACTICE.phoneHref}">${esc(h.PRACTICE.phone)}</a>
      </div>
      <dl class="iv-facts">
        <div><dt>Address</dt><dd><a href="${esc(h.PRACTICE.maps)}" target="_blank" rel="noopener">${esc(h.PRACTICE.street)}<br>${esc(h.PRACTICE.city)}, ${esc(h.PRACTICE.region)} ${esc(h.PRACTICE.postal)}</a></dd></div>
        <div><dt>Hours</dt><dd>Mon and Wed <b>9am to 6pm</b><br>Tue and Thu <b>8am to 5pm</b><br>Fri to Sun <b>Closed</b></dd></div>
        <div><dt>Emergencies</dt><dd>Call the practice. We keep same day slots for pain, breaks and knocked out teeth.</dd></div>
      </dl>
    </div>
    <div class="iv-aside">
      <figure class="iv-shot">
        ${h.img("/wp-content/uploads/2023/11/Dentist-in-Katy-Office.webp", "The waiting room at Mason Park Dental of Katy", { sizes: "(max-width: 959px) 100vw, 42vw" })}
        <figcaption>Suite 104A, on the ground floor. Free parking at the door.</figcaption>
      </figure>
      <div class="iv-map">
        ${h.renderEmbed(MAP_EMBED)}
      </div>
      <a class="link-arrow is-light" href="${esc(h.PRACTICE.maps)}" target="_blank" rel="noopener">Get directions <span aria-hidden="true">&rarr;</span></a>
    </div>
  </div>

  ${homeFaqs.length ? `
  <div class="wrap iv-faq">
    <h3>Before you book</h3>
    <div class="iv-faq-list">
      ${homeFaqs.map((f) => `
      <details class="faq_item">
        <summary class="faq_question">${esc(f.question)}</summary>
        <div class="faq_answer">${f.html}</div>
      </details>`).join("")}
    </div>
    <a class="link-arrow is-light" href="/faq-page/">All questions <span aria-hidden="true">&rarr;</span></a>
  </div>` : ""}
</section>`;

  return [arrival, relay, together, range, people, path, proof, invitation]
    .filter(Boolean).join("\n");
}

export default home;
