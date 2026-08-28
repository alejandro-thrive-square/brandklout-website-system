// The page set and menu of pediatricdentistkatytx.com, for the static rebuild.
//
// TWO SOURCES, and the reason is in db-pages.mjs: the live WordPress install
// publishes the 40 pages listed in CORE_SLUGS but NOT ONE of the 17 /services/
// pages its own main menu links to. Those live in the abandoned `hni_` install
// in the same database, as clean paragraph HTML. So:
//
//   CORE_SLUGS         -> rendered snapshots  (extract.mjs -> content/)
//   DB_SERVICE_PAGES   -> the database dump   (db-pages.mjs -> content-db/)
//
// `NAV` mirrors the live main menu exactly — order, nesting and labels — so the
// rebuilt header is the practice's own menu rather than a guess. The three
// deviations are marked inline and each closes a link that was dead on the
// live site.

export const NAV = [
  { label: "Home", href: "/" },
  {
    label: "About", href: "/about-us/", children: [
      { label: "Meet Our Pediatric Team", href: "/our-team/" },
      { label: "Technology", href: "/technology/" },
      // Not in the live menu; the page exists and was reachable from nowhere.
      { label: "Smile Gallery", href: "/before-after/" },
    ],
  },
  {
    // Live menu had `#` here, so the whole Services column was unclickable on
    // touch. The practice has a real services index — point at it.
    label: "Services", href: "/our-services/", children: [
      { label: "Comprehensive Pediatric Dentistry", href: "/services/comprehensive-pediatric-dentistry/", children: [
        { label: "Special Needs Patient Care", href: "/services/special-needs-patient-care/" },
        { label: "Pediatric Dentistry FAQs", href: "/pediatric-dentistry-faqs-katy-tx/" },
      ] },
      { label: "Preventive Dentistry", href: "/services/preventive-dentistry/", children: [
        { label: "Dental Cleanings and Exams", href: "/services/dental-cleanings-and-exams/" },
        { label: "Dental Hygiene Education", href: "/services/dental-hygiene-education/" },
        { label: "Mouth Guards", href: "/services/mouth-guards/" },
        { label: "Night Guards", href: "/services/night-guards/" },
        { label: "Fluoride Treatment", href: "/services/fluoride-treatment/" },
        { label: "Sealants", href: "/services/sealants/" },
      ] },
      { label: "Cosmetic Dentistry", href: "/services/cosmetic-dentistry/", children: [
        { label: "Bonding", href: "/services/bonding/" },
      ] },
      { label: "Restorative Dentistry", href: "/services/restorative-dentistry/", children: [
        { label: "Composite Fillings", href: "/services/composite-fillings/" },
        { label: "Dental Crowns", href: "/services/dental-crowns/" },
        { label: "Pulp Therapy", href: "/services/pulp-therapy/" },
        { label: "Extractions", href: "/services/extractions/" },
        { label: "Space Maintainers", href: "/services/space-maintainers/" },
      ] },
      { label: "Periodontics", href: "/services/periodontics/", children: [
        { label: "Frenectomy", href: "/services/frenectomy/" },
      ] },
      { label: "Orthodontics", href: "/services/orthodontics/", children: [
        { label: "Early Intervention", href: "/services/early-intervention/" },
        { label: "Retainers", href: "/services/retainers/" },
      ] },
      { label: "Invisalign", href: "/services/invisalign/", children: [
        { label: "Invisalign FAQs", href: "/invisalign-faqs-katy-tx/" },
      ] },
      { label: "Sedation Dentistry", href: "/services/sedation-dentistry/" },
      { label: "Emergency Pediatric Dentistry", href: "/emergency-pediatric-dentistry/" },
    ],
  },
  {
    // Live menu had `#` here too. The abandoned install had a real Patient
    // Resources page; it is restored and the column now leads somewhere.
    label: "Patient Resources", href: "/patient-resources/", children: [
      { label: "New Patients", href: "/new-patients/" },
      { label: "Knee-to-Knee Dental Exams", href: "/knee-to-knee-pediatric-dental-exam/" },
      { label: "Dental Savings Plan", href: "/dental-saving-plan/" },
      { label: "Special Offers", href: "/special-offers/" },
      { label: "Virtual Consultation", href: "/virtual-consultation/" },
      { label: "Product Recommendations", href: "/product-recommendations-2/" },
      { label: "Toothpaste RDA Table", href: "/toothpaste-rda-table/" },
      { label: "Toothpaste Chart", href: "/toothpaste-chart/" },
      { label: "PH and Acidity of Food & Beverages", href: "/ph-and-acidity-of-food-beverages/" },
    ],
  },
  { label: "Refer a Patient", href: "/refer-a-patient/" },
  { label: "Contacts", href: "/contacts/" },
];

export const FOOTER_LINKS = [
  { label: "FAQ's", href: "/faq-page/" },
  { label: "Dental Library", href: "/dental-library/" },
  { label: "Dental Dictionary", href: "/dental-dictionary/" },
  { label: "Sitemap", href: "/sitemap/" },
  { label: "Town Resources", href: "/town-resource/" },
  { label: "Accessibility Statement", href: "/accessibility-statement/" },
];

// ---------------------------------------------------------------------------
// Pages recovered as rendered snapshots from the LIVE install.
// The demo pages the ThemeREX theme ships are NOT here: blog-masonry,
// blog-portfolio, blog-list, blog-standard, blog-grid, shop, cart, my-account,
// wishlist-page, pricing, newsletter-popups. The main site's rebuild dropped
// the same set. `dental-savings-plan` is dropped as a duplicate of the menu's
// `dental-saving-plan`; `our-team-copy` is not in this list because it is not a
// page of this name at all — see RETITLED below.
// ---------------------------------------------------------------------------
export const CORE_SLUGS = [
  "home", "about-us", "our-team", "technology", "our-services", "before-after",
  "contacts", "appointment", "thank-you",
  "new-patients", "special-offers", "refer-a-patient", "virtual-consultation",
  "emergency-pediatric-dentistry", "dental-saving-plan", "product-recommendations-2",
  "toothpaste-rda-table", "toothpaste-chart", "ph-and-acidity-of-food-beverages",
  "pediatric-dentistry-faqs-katy-tx", "invisalign-faqs-katy-tx", "faq-page",
  "dental-library", "dental-dictionary", "sitemap", "town-resource",
];

// `our-team-copy` is NOT a duplicate of `/our-team/`, whatever its slug says:
// it is a 1,000-word parent guide to the knee-to-knee infant dental exam,
// sitting on a page title that no menu links to, so nobody could read it. It is
// good, on-brand copy about a technique this practice actually uses. Republished
// under a slug that describes it.
export const RETITLED = {
  "our-team-copy": {
    route: "/knee-to-knee-pediatric-dental-exam/",
    label: "Knee-to-Knee Dental Exams",
    title: "What Is a Knee-to-Knee Pediatric Dental Exam? | Mason Park Dental for Kids",
    description: "How a knee-to-knee exam lets us examine an infant or an anxious toddler on a parent's lap instead of in a dental chair, and how to prepare your child for it.",
  },
};

// Snapshots to extract that are not in CORE_SLUGS.
export const EXTRA_EXTRACT = Object.keys(RETITLED);

// ---------------------------------------------------------------------------
// Pages recovered from the database dump (`hni_` prefix).
//
// `dbId` pins the row when a slug appears more than once. The service set built
// for THIS practice occupies ids 216-270; the lower and 5xx ids are leftovers
// from a general-dentistry install and several of them are adult-only, which is
// why they are pinned rather than picked by length.
// ---------------------------------------------------------------------------
export const DB_SERVICE_PAGES = {
  "comprehensive-pediatric-dentistry": { dbId: 225 },
  "special-needs-patient-care": { dbId: 230 },
  "preventive-dentistry": { dbId: 232 },
  "dental-cleanings-and-exams": { dbId: 216 },
  "dental-hygiene-education": { dbId: 240 },
  "mouth-guards": { dbId: 234 },
  "night-guards": { dbId: 523 },
  "fluoride-treatment": { dbId: 238 },
  "sealants": { dbId: 236 },
  "cosmetic-dentistry": { dbId: 242 },
  "bonding": { dbId: 244 },
  "composite-fillings": { dbId: 84 },
  "dental-crowns": { dbId: 252 },
  "pulp-therapy": { dbId: 268 },
  "extractions": { dbId: 458 },
  "space-maintainers": { dbId: 53 },
  "periodontics": { dbId: 254 },
  "frenectomy": { dbId: 256 },
  "orthodontics": { dbId: 260 },
  "early-intervention": { dbId: 262 },
  "retainers": { dbId: 266 },
  // NOT 264. That row is the abandoned install's Invisalign LANDING PAGE: a
  // "$1000 OFF / lowest price of $3,610" promotion, a Trustindex shortcode and
  // a bare YouTube link. Republishing a stale price the practice has not
  // confirmed — on a page a parent could hold us to — is not something a
  // rebuild gets to decide. 528 is the same practice's clinical explanation of
  // what Invisalign is, which is what this page is for.
  "invisalign": { dbId: 528, title: "Invisalign" },
  "sedation-dentistry": { dbId: 270 },
};

// Non-service pages taken from the same dump, at their own top-level routes.
export const DB_CORE_PAGES = {
  "patient-resources": { dbId: 74 },
  "accessibility-statement": { dbId: 409 },
};

export const SERVICE_SLUGS = Object.keys(DB_SERVICE_PAGES);

// `/services/restorative-dentistry/` is in the menu and exists in neither
// source — it was a menu parent with no page behind it. It is authored as a hub
// over the four restorative pages that DO exist. See site/pages.mjs.
export const AUTHORED_SERVICE_SLUGS = ["restorative-dentistry"];

// ---------------------------------------------------------------------------
// The practice.
//
// TWO SETS OF DETAILS are published on the live site and they disagree. The
// pediatric brand's own chrome — top bar, header, contact band — says suite
// #104B and (281) 578-7100 (88 occurrences). The footer block, copied wholesale
// from the parent practice's site, says #104A and (281) 769-8878 (57). The
// pediatric set is used throughout here; the practice still has to confirm it.
// ---------------------------------------------------------------------------
export const PRACTICE = {
  name: "Mason Park Dental for Kids",
  shortName: "Mason Park Dental for Kids",
  parentName: "Mason Park Dental of Katy",
  parentUrl: "https://bestdentistinkatytx.com/",
  tagline: "Pediatric Dentist Katy",
  phone: "(281) 578-7100",
  phoneHref: "tel:+12815787100",
  // The pediatric site published no email address anywhere. This is the
  // practice's real address, recovered from the parent site's Terms of Service.
  email: "office@masonparkdental.com",
  street: "21830 Kingsland Blvd #104B",
  city: "Katy",
  region: "TX",
  postal: "77450",
  maps: "https://www.google.com/maps/place/21830+Kingsland+Blvd,+Katy,+TX+77450",
  facebook: "https://www.facebook.com/p/Mason-Park-Dental-100083179359693/",
  booking: "https://www.flexbook.me/masonpark/1",
};

// Office hours exactly as the live footer and homepage publish them.
export const HOURS = [
  ["Monday", "9am - 6pm"], ["Tuesday", "8am - 5pm"], ["Wednesday", "9am - 6pm"],
  ["Thursday", "8am - 5pm"], ["Friday", "Closed"], ["Saturday", "Closed"], ["Sunday", "Closed"],
];

export const LOGO = "/wp-content/uploads/2023/12/Childrens-Dentist-Katy-Logo-1.png";
