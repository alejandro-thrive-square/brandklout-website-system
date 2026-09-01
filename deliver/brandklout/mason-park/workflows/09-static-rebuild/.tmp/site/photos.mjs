// ===========================================================================
// THE PICTURE POOL.
//
// WHY THIS FILE EXISTS. The 35 treatment pages carry exactly ONE image each in
// their own content — the featured photograph, which the hero already uses. So
// below the hero a treatment page had no picture at all for two thousand words,
// which is the second half of the client's note on /services/invisalign/: "To
// add more images overall. This is not a good services page right now."
//
// WHERE THE PICTURES COME FROM, and the rule that governs it. Every photograph
// here is one the practice already publishes on its own site, and every one of
// them shows THE PRACTICE — the rooms, the team, a patient in the chair — not a
// treatment. That distinction is the whole rule:
//
//   A photograph on a treatment page may show the practice. It may NOT be
//   presented as showing that treatment, that treatment's result, or that
//   treatment's patient.
//
// Which is why the captions below talk about the building and the visit and
// never about the procedure. A stock photograph captioned as a clinical outcome
// is a claim about a real medical practice that nobody at the practice made,
// and the site carries 35 treatment pages that would each need their own. The
// blog's topical imagery is deliberately NOT used: matching "Invisalign" in a
// filename to the Invisalign page is exactly how a stock photo of somebody
// else's teeth ends up captioned as this practice's work.
//
// If the practice supplies real treatment photography, it belongs on the page
// it documents, with a caption saying so, and not in this pool.
// ===========================================================================

/** Practice photography, safe on any page. Ordered so that consecutive picks
 *  are visually different: a room, then people, then a room. */
export const PRACTICE_PHOTOS = [
  {
    src: "/wp-content/uploads/2022/09/Dentist-in-Katy-1024x683-1.webp",
    alt: "A patient in the chair looking at her own teeth in a hand mirror",
    caption: "Everything is shown to you on a screen you can see too.",
  },
  {
    src: "/wp-content/uploads/2023/11/Dentist-in-Katy-Office.webp",
    alt: "The waiting area at Mason Park Dental, with a pale wood wall and a white sofa",
    caption: "Suite 104A on Kingsland Boulevard. Free parking at the door.",
  },
  {
    src: "/wp-content/uploads/2023/08/AdobeStock_613444649-1-1536x1024.jpeg",
    alt: "A dentist explaining treatment with a model of the upper and lower arch",
    caption: "The plan and the price are written out before anything begins.",
  },
  {
    src: "/wp-content/uploads/2023/11/g7-1536x1024.jpg",
    alt: "The team at Mason Park Dental of Katy",
    caption: "One team for the whole family, in one building.",
  },
  {
    src: "/wp-content/uploads/2023/08/AdobeStock_118631127-1536x1024.jpeg",
    alt: "A patient smiling after treatment",
    caption: "A recall you do not have to remember, with the same hygienist.",
  },
];

/** The portrait beside the lead review. Not a named patient: it illustrates the
 *  quote block, and the quote itself carries the reviewer's own name. */
export const REVIEW_PORTRAIT = {
  src: "/wp-content/uploads/2023/08/AdobeStock_388565488-scaled.jpeg",
  alt: "A long standing patient of the practice",
};

/**
 * A stable, varied set of photographs for one page.
 *
 * DETERMINISTIC, and it has to be. Picking at random gives a different site on
 * every build, so a screenshot gate compares two different pages and every
 * visual diff is noise. The offset is derived from the slug, so a given page
 * always gets the same pictures in the same order, and neighbouring pages in
 * the navigation do not all open on the same one.
 */
export function photosFor(slug, count) {
  let h = 0;
  for (let i = 0; i < String(slug).length; i++) h = (h * 31 + String(slug).charCodeAt(i)) >>> 0;
  const start = h % PRACTICE_PHOTOS.length;
  const out = [];
  for (let i = 0; i < Math.min(count, PRACTICE_PHOTOS.length); i++) {
    out.push(PRACTICE_PHOTOS[(start + i) % PRACTICE_PHOTOS.length]);
  }
  return out;
}

export default { PRACTICE_PHOTOS, REVIEW_PORTRAIT, photosFor };
