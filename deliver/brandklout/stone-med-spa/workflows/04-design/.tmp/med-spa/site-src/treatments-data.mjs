// THE MENU. Seven treatments, and the boundary they sit inside.
//
// WHERE THIS LIST COMES FROM. The client sent two screenshots on 2026-09-03,
// archived at 01-content-intake/.tmp/client-references/menu-surgical.png and
// menu-med-spa.png. They are the practice's own two category images and they
// draw the line themselves:
//
//   SURGICAL (stays on Stone Surgical Arts)   MED SPA (this site)
//   MyEllevate(R) Facelift                    Dermal Fillers
//   Neck Lift                                 Botox | Xeomin
//   Facelift | Easy Lift                      Morpheus8
//   FaceTite                                  Hair Restoration
//   Facial Implants                           PRP Treatment
//   Chin Sculpting & Reshaping                Chemical Peels
//   Buccal Fat Removal                        Dysport & Jeuveau
//   Blepharoplasty
//   Neck Liposuction
//   Skin Lesion Removal
//   Male Facial Enhancement
//   Facial Fat Transfer
//
// This settles the blocker recorded in docs/project-overview.md and in
// .claude/RUNBOOK.md: it is the modality split, and the client drew it. The cut
// is at the incision, not at the price. FaceTite is minimally invasive but it
// is still an incision under local anaesthetic, so it is surgical; Morpheus8
// delivers radiofrequency through microneedles and is not, so it is here.
//
// TWO CONSEQUENCES, BOTH REAL:
//
//   1. Stone Surgical Arts currently publishes a fee schedule covering ALL
//      SEVEN of these plus Sculptra, CO2 resurfacing, HydraFacial MD,
//      microneedling, SkinPen and Cosmelan. That page has to lose them, and a
//      301 map from those URLs to these has to exist before either domain
//      goes live. It is a task on the bk-stone worktree, not this one.
//
//   2. Six treatments the sibling sells are on NEITHER list the client sent:
//      Sculptra, CO2 laser resurfacing, HydraFacial MD, microneedling, SkinPen
//      and Cosmelan. They are non-surgical, so by the rule they belong here,
//      but the client did not name them. They are NOT in this file. Ask before
//      adding them; do not infer a menu the client did not write.
//
// NO PRICES ANYWHERE. Brandklout is a partner engagement (CLAUDE.md). Every
// number below is a duration or an interval, never a fee.
//
// CLINICAL REVIEW IS OUTSTANDING. Every onset, longevity and downtime figure
// here is the standard published range for the product, not a claim about this
// practice's protocol. Dr. Stone signs these off before the site goes live.

/** The three shelves the ledger groups by. Order is the order they render.
    Each carries the instrument still life that heads its block on /treatments. */
export const CATEGORIES = [
  {
    id: "injectables",
    name: "Injectables",
    image: "gen-injectables.webp",
    blurb:
      "Neuromodulators relax the muscle that folds the skin; fillers replace the volume that time takes out. Both are placed by Dr. Stone.",
  },
  {
    id: "skin",
    name: "Skin & Resurfacing",
    image: "gen-laser-device.webp",
    blurb:
      "Controlled injury, then repair. These treatments work by asking the skin to rebuild itself, which is why they run as a series and improve for months after the last one.",
  },
  {
    id: "restoration",
    name: "Restoration",
    image: "gen-iclight-wand.webp",
    blurb:
      "Your own platelets, concentrated and returned to the tissue that needs them. The slowest results on the menu and the longest-lasting.",
  },
];

/** The concern axis. A patient searches for the problem, not the product. */
export const CONCERNS = [
  { id: "lines", name: "Fine lines & wrinkles" },
  { id: "volume", name: "Volume loss" },
  { id: "texture", name: "Texture & pores" },
  { id: "pigment", name: "Pigmentation & tone" },
  { id: "laxity", name: "Laxity & jawline" },
  { id: "scarring", name: "Acne scarring" },
  { id: "hair", name: "Hair thinning" },
];

/**
 * The seven.
 *
 * `cadence` VS `lasts`. They are not the same fact, and the hero rail is what
 * proved it. `lasts` is how long ONE treatment holds — "Months, as a series" —
 * and belongs in the ledger's Lasts column. `cadence` is how often you come
 * back, phrased short enough to sit in a rail item without wrapping. The rail
 * shipped showing `lasts` under a heading reading "what we do, and how often",
 * which answered a different question from the one it asked.
 *
 * IMAGERY. Each treatment carries a `portrait` and nothing else: the model
 * photograph that fills its ledger row when the row is opened. The instrument
 * still lifes moved UP to CATEGORIES above, one per shelf, because there were
 * seven of them and only three shelves and the four spare ones were shipping
 * unreferenced — audit.mjs catches exactly that.
 *
 * THE RULE FOR A MODEL PORTRAIT, carried over from the sibling build and worth
 * restating: a model appears as a PERSON, never as a patient and never as a
 * result. Nothing on this site captions a model photograph as an outcome. The
 * before-and-after frames on /results and /botox are deliberately empty instead.
 *
 * `page` is set only where a detail page exists — the eleven-page
 * brief funds one (Botox), and the ledger renders the other six as expandable
 * rows rather than dead links. When a page is written, add its slug here and
 * the ledger row grows a link with no other change.
 */
export const TREATMENTS = [
  {
    slug: "botox",
    page: "botox.html",
    name: "Botox | Xeomin",
    category: "injectables",
    concerns: ["lines"],
    lede: "The two neuromodulators Dr. Stone keeps in the room. Same molecule, different formulation — Xeomin carries no accessory proteins, which matters if you have stopped responding to Botox.",
    appointment: "15–20 min",
    onset: "3–7 days",
    cadence: "every 3–4 months",
    lasts: "3–4 months",
    downtime: "None",
    area: "Forehead, glabella, crow's feet",
    portrait: "m-injectables.webp",
  },
  {
    slug: "dysport-jeuveau",
    page: null,
    name: "Dysport & Jeuveau",
    category: "injectables",
    concerns: ["lines"],
    lede: "Two more neuromodulators, held because patients differ. Dysport spreads a little further from the injection point, which suits a broad forehead; Jeuveau is the newest of the four.",
    appointment: "15–20 min",
    onset: "2–5 days",
    cadence: "every 3–4 months",
    lasts: "3–4 months",
    downtime: "None",
    area: "Forehead, glabella, crow's feet",
    portrait: "m-eyes-young.webp",
  },
  {
    slug: "dermal-fillers",
    page: null,
    name: "Dermal Fillers",
    category: "injectables",
    concerns: ["volume", "laxity"],
    lede: "Hyaluronic acid, placed on the bone or in the mid-face to rebuild a structure that has flattened. An oral and maxillofacial surgeon plans this from the skeleton up, which is the difference.",
    appointment: "30–45 min",
    onset: "Immediate, settles at 2 weeks",
    cadence: "every 6–18 months",
    lasts: "6–18 months",
    downtime: "1–3 days",
    area: "Lips, cheeks, chin, jawline, tear trough",
    portrait: "m-lips.webp",
  },
  {
    slug: "morpheus8",
    page: null,
    name: "Morpheus8",
    category: "skin",
    concerns: ["laxity", "texture", "scarring"],
    lede: "Radiofrequency delivered below the surface through microneedles, so the heat lands in the layer that holds the jawline and the surface is left largely intact.",
    appointment: "45–60 min",
    onset: "3 weeks, building to 3 months",
    cadence: "3, then yearly",
    lasts: "12+ months",
    downtime: "2–4 days",
    area: "Lower face, jawline, neck",
    portrait: "m-jawline.webp",
  },
  {
    slug: "chemical-peels",
    page: null,
    name: "Chemical Peels",
    category: "skin",
    concerns: ["pigment", "texture"],
    lede: "Depth is the whole decision. A superficial peel is a lunch hour and a glow; a medium one is a week indoors and a genuine change in tone. Dr. Stone picks the depth against your calendar.",
    appointment: "30–45 min",
    onset: "5–7 days",
    cadence: "2–4 a year",
    lasts: "Months, as a series",
    downtime: "3–7 days",
    area: "Face, neck, décolleté, hands",
    portrait: "m-skin-glow.webp",
  },
  {
    slug: "prp",
    page: null,
    name: "PRP Treatment",
    category: "restoration",
    concerns: ["texture", "hair"],
    lede: "Your blood is drawn, spun to concentrate the platelets, and the plasma is returned to the tissue. Nothing foreign goes in, which is why it is the treatment for people who will not have filler.",
    appointment: "45–60 min",
    onset: "4–6 weeks",
    cadence: "3, then 2 a year",
    lasts: "A series of 3, then maintenance",
    downtime: "1–2 days",
    area: "Under-eye, face, scalp",
    portrait: "m-freckles.webp",
  },
  {
    slug: "hair-restoration",
    page: null,
    name: "Hair Restoration",
    category: "restoration",
    concerns: ["hair"],
    lede: "PRP into the scalp, on a schedule, for thinning that has not yet become baldness. It works on follicles that are still alive, so the honest advice is to come early.",
    appointment: "45–60 min",
    onset: "3–4 months",
    cadence: "every 6–12 months",
    lasts: "Maintenance every 6–12 months",
    downtime: "Minimal",
    area: "Crown, hairline, part line",
    portrait: "m-man-suit.webp",
  },
];

/** Treatments on a shelf, in menu order. */
export const byCategory = (id) => TREATMENTS.filter((t) => t.category === id);

/** Treatments that address a concern, in menu order. */
export const byConcern = (id) => TREATMENTS.filter((t) => t.concerns.includes(id));
