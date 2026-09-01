// ===========================================================================
// THE TREATMENT CATALOGUE.
//
// The three arcs the practice's fourteen headline treatments are grouped into.
// It lives here rather than in a page because two pages need it and neither
// owns it: the homepage shows the arcs as the scannable index of what is
// offered, and /our-services/ shows the same three arcs and then the complete
// A to Z beneath them.
//
// `lead` and the fourth element of each item are SERVICE SLUGS. The imagery is
// read out of each service page's own featured image at build time, so a
// treatment brings its own photograph and no slot here is ever a placeholder.
// ===========================================================================

// ------------------------------------------------------------- the three arcs
// The fourteen treatments, still three groups, but each group is now a SCENE
// with its own photograph and its own numeral rather than a row of equal tiles.
// `img` names the service page whose featured image leads the group; the client
// chose that photograph for that treatment, so the pairing is theirs.
export const ARCS = [
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
      // Named for its destination, not for the search term. The site carries
      // TWO implant pages, `/services/dental-implants/` and
      // `/services/dental-implant-placement/`, both of which reduce to the
      // label "Dental Implants" and both of which have zero content blocks.
      // Calling this one by its own page title is what stops /our-services/
      // listing the same words twice against two different URLs, or orphaning
      // one of them. The duplication itself is a client question, logged in
      // JOURNEY-2026-09-01.md; it is not something to fix by inventing a label.
      ["Dental Implant Placement", "Titanium posts topped with matched crowns.", "/services/dental-implant-placement/", "dental-implant-placement"],
      ["Dentures", "Full and partial, fitted for comfort.", "/services/dentures/", "dentures"],
      ["Root Canal Therapy", "Saving a tooth rather than taking it out.", "/services/root-canal-therapy/", "root-canal-therapy"],
      ["Oral Surgery", "Complex extractions and jaw concerns.", "/services/oral-surgery/", "oral-surgery"],
      ["Extractions", "Straightforward and surgical, wisdom teeth included.", "/services/extractions/", "extractions"],
      ["Sedation Dentistry", "Relaxed visits, with safe sedation options.", "/services/sedation-dentistry/", "sedation-dentistry"],
    ],
  },
];

