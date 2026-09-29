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
//      dermaplaning and skin boosters — and a fourth category. The
//      HydraFacial's 45–90 minutes is the client's figure.
//
//   3. 2026-09-15, later: the teammate's "Web Dev Brief - WMA" (client call,
//      01-content-intake/.tmp/client-references/). Category order is now
//      Injectables, Skin Rejuvenation, Facials, Restoration; Sculptra sits
//      under a "Biostimulators" sub-item (`group`); HydraFacial comes in
//      several versions; skin boosters are "offered with the HydraFacial", so
//      they are HydraFacial booster serums, not injections.
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
      "Neuromodulators soften the lines that come from movement, fillers restore volume, and biostimulators like Sculptra help your skin build its own collagen over time. Every injection is done by our nurse practitioner.",
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
    id: "facials",
    name: "Facials",
    image: "gen-skincare-shelf.webp",
    portrait: "m-cheek.webp",
    blurb:
      "Regular facials keep skin clear, smooth and hydrated between treatments. Members get one every month as part of their plan.",
    // BugHerd #34, 2026-09-22: "Add a CTA or link to the page about the membership".
    cta: { href: "membership.html", label: "See the membership" },
  },
  {
    id: "restoration",
    name: "Restoration",
    image: "gen-iclight-wand.webp",
    portrait: "m-freckles.webp",
    blurb:
      "PRP uses a concentrate of your own platelets to support skin and hair. Results come on gradually, and nothing synthetic is involved.",
  },
];

/** The concern axis. A patient searches for the problem, not the product.
 * `desc` is the hover description on /treatments (BugHerd #51, 2026-09-28:
 * "convert these to links and send to the proper section. Upon hover, display
 * the description"); the treatments that address it are appended by
 * build-site.mjs from each treatment's `concerns`, so the two cannot disagree. */
export const CONCERNS = [
  { id: "lines", name: "Fine lines & wrinkles", desc: "Creases from expression and time, around the eyes, forehead and mouth." },
  { id: "volume", name: "Volume loss", desc: "Hollowing and flattening in the cheeks, temples and lips." },
  { id: "texture", name: "Texture & pores", desc: "Rough, uneven skin and enlarged pores." },
  { id: "pigment", name: "Pigmentation & tone", desc: "Sun spots, uneven tone and discoloration." },
  { id: "laxity", name: "Laxity & jawline", desc: "Loosening skin and a softer jawline as collagen declines." },
  { id: "scarring", name: "Acne scarring", desc: "Pitted or uneven marks left behind by acne." },
  { id: "dullness", name: "Dryness & dullness", desc: "Dry, tired-looking skin that has lost its glow." },
  { id: "hair", name: "Hair thinning", desc: "Thinning hair on the scalp, in men and women." },
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
 * `page` is the detail page. Botox is hand-written; the other thirteen are
 * generated from treatment-pages.mjs (2026-09-23). A row with page null opens
 * in place with no link.
 */
export const TREATMENTS = [
  /* --- Injectables -------------------------------------------------------- */
  {
    slug: "botox",
    page: "botox.html",
    name: "Botox",
    category: "injectables",
    concerns: ["lines"],
    lede: "Botox relaxes the muscles that crease the skin, softening forehead lines, frown lines and crow's feet. It has the longest track record of the four and is very predictable in small areas.",
    appointment: "15–20 min",
    onset: "3–7 days",
    cadence: "every 3–4 months",
    lasts: "3–4 months",
    downtime: "None",
    area: "Forehead, frown lines, crow's feet",
    portrait: "m-injectables.webp",
  },
  {
    slug: "xeomin",
    page: "xeomin.html",
    name: "Xeomin",
    category: "injectables",
    concerns: ["lines"],
    lede: "The same active ingredient as Botox with no accessory proteins, which can help if Botox seems to wear off faster than it used to.",
    appointment: "15–20 min",
    onset: "3–7 days",
    cadence: "every 3–4 months",
    lasts: "3–4 months",
    downtime: "None",
    area: "Forehead, frown lines, crow's feet",
    portrait: "stock-xeomin-portrait.webp",
  },
  {
    slug: "dysport",
    page: "dysport.html",
    name: "Dysport",
    category: "injectables",
    concerns: ["lines"],
    lede: "Works the same way as Botox but spreads a little further, which can suit a larger area like the forehead. It often starts a day or two sooner.",
    appointment: "15–20 min",
    onset: "2–5 days",
    cadence: "every 3–4 months",
    lasts: "3–4 months",
    downtime: "None",
    area: "Forehead, frown lines, crow's feet",
    portrait: "m-eyes-young.webp",
  },
  {
    slug: "jeuveau",
    page: "jeuveau.html",
    name: "Jeuveau",
    category: "injectables",
    concerns: ["lines"],
    lede: "A neuromodulator made only for cosmetic use, most often chosen for the frown lines between the eyebrows.",
    appointment: "15–20 min",
    onset: "2–5 days",
    cadence: "every 3–4 months",
    lasts: "3–4 months",
    downtime: "None",
    area: "Frown lines, forehead, crow's feet",
    portrait: "stock-dysport-portrait.webp",
  },
  {
    slug: "dermal-fillers",
    page: "dermal-fillers.html",
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
    page: "sculptra.html",
    name: "Sculptra",
    category: "injectables",
    group: "Biostimulators", // a sub-item of Injectables, per the WMA web dev brief
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
    page: "morpheus8.html",
    name: "Morpheus8",
    category: "skin",
    concerns: ["laxity", "texture", "scarring"],
    lede: "Radiofrequency energy delivered through fine microneedles tightens and smooths the deeper layers of the skin while leaving the surface largely intact. It works well on the jawline, the neck and acne scarring.",
    appointment: "45–60 min",
    onset: "3 weeks, building to 3 months",
    cadence: "3 sessions, then yearly",
    lasts: "12+ months",
    downtime: "2–4 days",
    area: "Face, jawline, neck",
    portrait: "m-jawline.webp",
  },
  {
    slug: "chemical-peels",
    page: "chemical-peels.html",
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
    page: "skinpen.html",
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

  /* --- Facials ------------------------------------------------------------ */
  {
    slug: "hydrafacial",
    page: "hydrafacial.html",
    name: "HydraFacial",
    category: "facials",
    concerns: ["texture", "dullness", "pigment"],
    lede: "Cleansing, exfoliation, extractions and hydration in a single treatment. We offer several versions, from 45 to 90 minutes, so your aesthetician can match the facial to your skin, and you can go straight back to your day.",
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
    page: "dermaplaning.html",
    name: "Dermaplaning",
    category: "facials",
    concerns: ["texture", "dullness"],
    lede: "Dermaplaning is a gentle exfoliation. Your aesthetician glides a sterile blade across the skin to lift away dead surface cells and fine facial hair, the peach fuzz, leaving skin smoother and brighter. Makeup and skincare go on more evenly afterward.",
    appointment: "30–45 min",
    onset: "Immediate",
    cadence: "every 4–6 weeks",
    lasts: "3–4 weeks",
    downtime: "None",
    area: "Face",
    portrait: "m-street-brunette.webp",
  },
  {
    // The brief: "Skin Boosters (offered with the HydraFacial)". So these are
    // the targeted serums added to a HydraFacial, not injected hyaluronic acid,
    // which is what this row described until the brief arrived.
    slug: "skin-boosters",
    page: "skin-boosters.html",
    name: "Skin Boosters",
    category: "facials",
    concerns: ["dullness", "pigment", "lines"],
    lede: "Boosters are targeted serums added to your HydraFacial, chosen for what your skin needs that day, whether that's brightening, firming or extra hydration. They're infused during the facial, so there's nothing extra to book.",
    appointment: "Added to a HydraFacial",
    onset: "Immediate",
    cadence: "with your HydraFacial",
    lasts: "About a month",
    downtime: "None",
    area: "Face, neck",
    portrait: "p-eyes-mirror.webp",
  },

  /* --- Restoration -------------------------------------------------------- */
  {
    slug: "prp",
    page: "prp.html",
    name: "PRP Treatment",
    category: "restoration",
    concerns: ["texture", "hair"],
    lede: "A small amount of your blood is drawn and spun to concentrate the platelets, which are then returned to the skin. It's a good choice if you'd rather avoid fillers or synthetic products.",
    appointment: "45–60 min",
    onset: "4–6 weeks",
    cadence: "3 sessions, then 2 a year",
    lasts: "A series of 3, then maintenance",
    downtime: "1–2 days",
    area: "Under-eyes, face, scalp",
    portrait: "m-freckles.webp",
  },
  {
    slug: "hair-restoration",
    page: "hair-restoration.html",
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
];

/** Treatments in a category, in menu order. */
export const byCategory = (id) => TREATMENTS.filter((t) => t.category === id);

/** Treatments that address a concern, in menu order. */
export const byConcern = (id) => TREATMENTS.filter((t) => t.concerns.includes(id));
