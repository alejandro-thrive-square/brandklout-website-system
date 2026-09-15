// THE MENU. Twelve treatments in four categories.
//
// WHERE THIS LIST COMES FROM. Two sources, in order:
//
//   1. 2026-09-03: the client's two category images (archived at
//      01-content-intake/.tmp/client-references/), which drew the line between
//      this site and Stone Surgical Arts at the incision. Seven treatments.
//
//   2. 2026-09-15: the client's website feedback, Asana task 1218408530306236,
//      subtask "Treatment structure" (1218433345526564), verbatim:
//
//        "Services reorganized into four categories: Injectables (including
//        biostimulators like Sculptra), Skin Rejuvenation (Morpheus8, chemical
//        peels, SkinPen microneedling), Restoration, and Facials (HydraFacials
//        at 45–90 minutes, dermaplaning, and skin boosters)."
//
//      That added five treatments — Sculptra, SkinPen, HydraFacial,
//      dermaplaning and skin boosters — and a fourth category. Skin boosters
//      are an injection, but the client filed them under Facials and that is
//      where they sit. The HydraFacial's 45–90 minutes is the client's figure.
//
// WHO TREATS. Not Dr. Stone. The same feedback ("Consultation language",
// 1218433345526570) says patients are assessed by the practice's medical
// providers and that Dr. Stone neither assesses nor injects. The providers are
// Brooke, Nurse Practitioner Injector, and Abby, Medical Esthetician (subtask
// "Team page"). No lede below names Dr. Stone.
//
// NO FEES. Treatment prices are quoted at the consultation. The only price on
// the site is the membership's, which the client supplied (membership.html).
//
// CLINICAL REVIEW IS OUTSTANDING. Every onset, longevity and downtime figure
// here is the standard published range for the product, not a claim about this
// practice's protocol. The practice signs these off before they are relied on.

/** The four categories the menu groups by, in the client's order. Each carries
    the still life that heads its block on /treatments and fills its panel on
    the home page's shelf. */
export const CATEGORIES = [
  {
    id: "injectables",
    name: "Injectables",
    image: "gen-injectables.webp",
    portrait: "m-injectables.webp",
    blurb:
      "Neuromodulators soften the lines that come from movement, fillers restore volume, and Sculptra helps your skin build its own collagen over time. Every injection is done by our nurse practitioner.",
  },
  {
    id: "skin",
    name: "Skin Rejuvenation",
    image: "gen-laser-device.webp",
    portrait: "m-jawline.webp",
    blurb:
      "These treatments prompt your skin to repair and renew itself. Most are done as a short series, and results keep improving for a few months after the last session.",
  },
  {
    id: "restoration",
    name: "Restoration",
    image: "gen-iclight-wand.webp",
    portrait: "m-freckles.webp",
    blurb:
      "PRP uses a concentrate of your own platelets to support skin and hair. Results come on gradually, and nothing synthetic is involved.",
  },
  {
    id: "facials",
    name: "Facials",
    image: "gen-skincare-shelf.webp",
    portrait: "m-cheek.webp",
    blurb:
      "Regular facials keep skin clear, smooth and hydrated between treatments. Members get one every month as part of their plan.",
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
  { id: "dullness", name: "Dryness & dullness" },
  { id: "hair", name: "Hair thinning" },
];

/**
 * The twelve.
 *
 * `cadence` VS `lasts`. They are not the same fact. `lasts` is how long ONE
 * treatment holds and belongs in the menu's Lasts column. `cadence` is how
 * often you come back, phrased short enough to sit in the home ticker.
 *
 * IMAGERY. Each treatment carries a `portrait`: the model photograph in its
 * menu row. A model appears as a PERSON, never as a patient and never as a
 * result. Nothing on this site captions a model photograph as an outcome.
 *
 * `page` is set only where a detail page exists. Botox is the only one; the
 * other rows open in place. When a page is written, set its slug here and the
 * row grows a link with no other change.
 */
export const TREATMENTS = [
  /* --- Injectables -------------------------------------------------------- */
  {
    slug: "botox",
    page: "botox.html",
    name: "Botox | Xeomin",
    category: "injectables",
    concerns: ["lines"],
    lede: "Botox and Xeomin relax the muscles that crease the skin, softening forehead lines, frown lines and crow's feet. Xeomin has no accessory proteins, which can help if Botox seems to wear off faster than it used to.",
    appointment: "15–20 min",
    onset: "3–7 days",
    cadence: "every 3–4 months",
    lasts: "3–4 months",
    downtime: "None",
    area: "Forehead, frown lines, crow's feet",
    portrait: "m-injectables.webp",
  },
  {
    slug: "dysport-jeuveau",
    page: null,
    name: "Dysport & Jeuveau",
    category: "injectables",
    concerns: ["lines"],
    lede: "Two more neuromodulators that work the same way as Botox. Dysport spreads a little further, which can suit a larger area like the forehead, and Jeuveau is often chosen for frown lines.",
    appointment: "15–20 min",
    onset: "2–5 days",
    cadence: "every 3–4 months",
    lasts: "3–4 months",
    downtime: "None",
    area: "Forehead, frown lines, crow's feet",
    portrait: "m-eyes-young.webp",
  },
  {
    slug: "dermal-fillers",
    page: null,
    name: "Dermal Fillers",
    category: "injectables",
    concerns: ["volume", "laxity"],
    lede: "Hyaluronic acid filler restores shape and volume to the lips, cheeks, chin and jawline, and can soften hollows under the eyes. Placement is planned around your facial structure so the result looks like you.",
    appointment: "30–45 min",
    onset: "Immediate, settles at 2 weeks",
    cadence: "every 6–18 months",
    lasts: "6–18 months",
    downtime: "1–3 days",
    area: "Lips, cheeks, chin, jawline, under-eyes",
    portrait: "m-lips.webp",
  },
  {
    slug: "sculptra",
    page: null,
    name: "Sculptra",
    category: "injectables",
    concerns: ["volume", "laxity", "texture"],
    lede: "Sculptra is a biostimulator. Instead of filling a space, it prompts your skin to rebuild collagen, so results appear gradually over a few months and can last two years or more.",
    appointment: "30–45 min",
    onset: "6–8 weeks, building",
    cadence: "2–3 sessions, then every 2 years",
    lasts: "Up to 2 years",
    downtime: "1–2 days",
    area: "Cheeks, temples, jawline",
    portrait: "p-neck-profile.webp",
  },

  /* --- Skin Rejuvenation -------------------------------------------------- */
  {
    slug: "morpheus8",
    page: null,
    name: "Morpheus8",
    category: "skin",
    concerns: ["laxity", "texture", "scarring"],
    lede: "Radiofrequency energy delivered through fine microneedles tightens and smooths the deeper layers of the skin while leaving the surface largely intact. It works well on the jawline, the neck and acne scarring.",
    appointment: "45–60 min",
    onset: "3 weeks, building to 3 months",
    cadence: "3, then yearly",
    lasts: "12+ months",
    downtime: "2–4 days",
    area: "Face, jawline, neck",
    portrait: "m-jawline.webp",
  },
  {
    slug: "chemical-peels",
    page: null,
    name: "Chemical Peels",
    category: "skin",
    concerns: ["pigment", "texture", "dullness"],
    lede: "A peel lifts away damaged surface skin to even out tone, fade sun spots and refine texture. Light peels have almost no downtime, deeper ones need about a week, and we'll help you pick one that fits your schedule.",
    appointment: "30–45 min",
    onset: "5–7 days",
    cadence: "2–4 a year",
    lasts: "Months, as a series",
    downtime: "0–7 days",
    area: "Face, neck, chest, hands",
    portrait: "m-skin-glow.webp",
  },
  {
    slug: "skinpen",
    page: null,
    name: "SkinPen Microneedling",
    category: "skin",
    concerns: ["texture", "scarring", "lines"],
    lede: "SkinPen creates thousands of tiny channels in the skin, which starts its natural repair process and boosts collagen. It's a good fit for acne scars, enlarged pores and early fine lines.",
    appointment: "45–60 min",
    onset: "2–4 weeks",
    cadence: "3–4 sessions, a month apart",
    lasts: "Months, as a series",
    downtime: "1–3 days of redness",
    area: "Face, neck",
    portrait: "m-chin.webp",
  },

  /* --- Restoration -------------------------------------------------------- */
  {
    slug: "prp",
    page: null,
    name: "PRP Treatment",
    category: "restoration",
    concerns: ["texture", "hair"],
    lede: "A small amount of your blood is drawn and spun to concentrate the platelets, which are then returned to the skin. It's a good choice if you'd rather avoid fillers or synthetic products.",
    appointment: "45–60 min",
    onset: "4–6 weeks",
    cadence: "3, then 2 a year",
    lasts: "A series of 3, then maintenance",
    downtime: "1–2 days",
    area: "Under-eyes, face, scalp",
    portrait: "m-freckles.webp",
  },
  {
    slug: "hair-restoration",
    page: null,
    name: "Hair Restoration",
    category: "restoration",
    concerns: ["hair"],
    lede: "PRP injected into the scalp to support thinning hair. It works best on follicles that are still active, so starting early tends to give better results.",
    appointment: "45–60 min",
    onset: "3–4 months",
    cadence: "every 6–12 months",
    lasts: "Maintenance every 6–12 months",
    downtime: "Minimal",
    area: "Crown, hairline, part line",
    portrait: "m-man-suit.webp",
  },

  /* --- Facials ------------------------------------------------------------ */
  {
    slug: "hydrafacial",
    page: null,
    name: "HydraFacial",
    category: "facials",
    concerns: ["texture", "dullness", "pigment"],
    lede: "Cleansing, exfoliation, extractions and hydration in a single treatment. Sessions run from 45 to 90 minutes depending on what your skin needs, and you can go straight back to your day.",
    appointment: "45–90 min",
    onset: "Immediate",
    cadence: "monthly",
    lasts: "About a month",
    downtime: "None",
    area: "Face, neck",
    portrait: "m-cheek.webp",
  },
  {
    slug: "dermaplaning",
    page: null,
    name: "Dermaplaning",
    category: "facials",
    concerns: ["texture", "dullness"],
    lede: "A sterile blade gently removes dead skin and fine facial hair, leaving skin smoother and brighter. Makeup and skincare go on more evenly afterward.",
    appointment: "30–45 min",
    onset: "Immediate",
    cadence: "every 4–6 weeks",
    lasts: "3–4 weeks",
    downtime: "None",
    area: "Face",
    portrait: "m-street-brunette.webp",
  },
  {
    slug: "skin-boosters",
    page: null,
    name: "Skin Boosters",
    category: "facials",
    concerns: ["dullness", "lines", "texture"],
    lede: "Very fine injections of hyaluronic acid spread through the skin to improve hydration and glow. Unlike filler, they don't add volume or change your shape.",
    appointment: "30–45 min",
    onset: "2–4 weeks",
    cadence: "3, then every 6 months",
    lasts: "About 6 months",
    downtime: "1–2 days",
    area: "Face, neck, hands",
    portrait: "p-eyes-mirror.webp",
  },
];

/** Treatments in a category, in menu order. */
export const byCategory = (id) => TREATMENTS.filter((t) => t.category === id);

/** Treatments that address a concern, in menu order. */
export const byConcern = (id) => TREATMENTS.filter((t) => t.concerns.includes(id));
