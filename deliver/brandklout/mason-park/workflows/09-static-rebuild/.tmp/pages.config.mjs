// The MAIN pages of bestdentistinkatytx.com — everything the site's own nav and
// footer link to, plus the standalone pages reachable from them. Blog posts,
// blog templates and /category/* are deliberately excluded: the emergency
// rebuild is the site skeleton, not the 180-post archive.
//
// `nav` mirrors the live main menu exactly (order and labels included), so the
// rebuilt header is the real one rather than a guess.

export const NAV = [
  { label: "Home", href: "/" },
  {
    label: "About", href: "/about-us/", children: [
      { label: "Meet Our Doctors", href: "/our-doctors/" },
      { label: "Meet Our Team", href: "/our-team/" },
      // New 2026-08-31 for the core-pages brief. The live menu never had it.
      { label: "Patient Reviews", href: "/patient-reviews/" },
      { label: "Smile Gallery", href: "/before-after/" },
      { label: "Technology", href: "/technology/" },
    ],
  },
  {
    label: "Services", href: "/our-services/", children: [
      { label: "Preventative Dentistry", href: "/services/preventative-dentistry/", children: [
        { label: "Oral Cancer Screening", href: "/services/oral-cancer-screening/" },
        { label: "Dental Hygiene Education", href: "/services/dental-hygiene-education/" },
        { label: "Mouth Guards", href: "/services/mouth-guards/" },
        { label: "Night Guards", href: "/services/night-guards/" },
        { label: "Fluoride Treatment", href: "/services/fluoride-treatment/" },
        { label: "Sealants", href: "/services/sealants/" },
        { label: "Children's Dentistry", href: "/services/pediatric-dental-care/" },
      ] },
      { label: "Cosmetic Dentistry", href: "/services/cosmetic-dentistry/", children: [
        { label: "Bonding", href: "/services/bonding/" },
      ] },
      { label: "Restorative Dentistry", href: "/services/restorative-dentistry/", children: [
        { label: "Dental Implant Restorations", href: "/services/dental-implant-restorations/" },
        { label: "Dentures", href: "/services/dentures/" },
        { label: "Dental Crowns", href: "/services/dental-crowns/" },
        { label: "Composite Fillings", href: "/services/composite-fillings/" },
        { label: "Bridges", href: "/services/bridges/" },
      ] },
      { label: "Hygiene and Periodontics", href: "/services/hygiene-and-periodontics/", children: [
        { label: "Deep Cleaning", href: "/services/comprehensive-care/" },
        { label: "Frenectomy", href: "/services/frenectomy/" },
        { label: "Laser Dentistry", href: "/services/laser-dentistry/" },
        { label: "Emergency Dentist", href: "/services/emergency-dentist/" },
        { label: "AIRFLOW® ONE", href: "/services/airflow-one/" },
      ] },
      { label: "Invisalign", href: "/services/invisalign/", children: [
        { label: "Invisalign® FAQs", href: "/invisalign-faqs-katy-tx/" },
      ] },
      { label: "Root Canal Therapy", href: "/services/root-canal-therapy/" },
      { label: "Oral Surgery", href: "/services/oral-surgery/", children: [
        { label: "Extractions", href: "/services/extractions/" },
        { label: "Dental Implant Placement", href: "/services/dental-implant-placement/" },
        { label: "Dental Implants FAQs", href: "/dental-implants-faqs/" },
        { label: "Crown Lengthening", href: "/services/crown-lengthening/" },
        { label: "Bone Grafting", href: "/services/bone-grafting/" },
      ] },
      { label: "Sedation Dentistry", href: "/services/sedation-dentistry/" },
      { label: "TMJ/TMD", href: "/services/tmj-tmd/" },
    ],
  },
  {
    label: "Patient Resources", href: "/patient-resources/", children: [
      // New 2026-08-31 for the core-pages brief, and first in the list: it is
      // the page a first-time visitor is actually looking for.
      { label: "New Patients", href: "/new-patients/" },
      { label: "Dental Savings Plan", href: "/dental-savings-plan/" },
      { label: "Product Recommendations", href: "/product-recommendations/" },
      { label: "Toothpaste RDA Table", href: "/toothpaste-rda-table/" },
      // Not in the live menu, but the page exists and was unreachable. Added.
      { label: "Toothpaste Chart", href: "/toothpaste-chart/" },
      { label: "PH and Acidity of Food & Beverages", href: "/ph-and-acidity-of-food-beverages/" },
      { label: "Blog", href: "/blog/" },
      { label: "Special Offers", href: "/special-offers/" },
      { label: "Virtual Consultation", href: "/virtual-consultation/" },
    ],
  },
  { label: "Financing", href: "/financing/" },
  { label: "Contacts", href: "/contacts/" },
];

export const FOOTER_LINKS = [
  { label: "FAQ's", href: "/faq-page/" },
  { label: "Dental Library", href: "/dental-library/" },
  { label: "Dental Dictionary", href: "/dental-dictionary/" },
  { label: "Sitemap", href: "/sitemap/" },
  { label: "Town Resources", href: "/town-resource/" },
  { label: "Technology / AI", href: "/technology-ai/" },
];

// Slugs as the crawler named them (crawl.mjs flattens `/services/x/` -> `services-x`).
export const SERVICE_SLUGS = [
  "services-airflow-one", "services-bonding", "services-bone-grafting", "services-bridges",
  "services-composite-fillings", "services-comprehensive-care", "services-cosmetic-dentistry",
  "services-crown-lengthening", "services-dental-crowns", "services-dental-hygiene-education",
  "services-dental-implant-placement", "services-dental-implant-restorations",
  "services-dental-implants", "services-dentures", "services-emergency-dentist",
  "services-extractions", "services-fluoride-treatment", "services-frenectomy",
  "services-hygiene-and-periodontics", "services-invisalign", "services-laser-dentistry",
  "services-mouth-guards", "services-night-guards", "services-oral-cancer-screening",
  "services-oral-surgery", "services-pediatric-dental-care", "services-porcelain-dental-veneers",
  "services-preventative-dentistry", "services-restorative-dentistry", "services-root-canal-therapy",
  "services-sealants", "services-sedation-dentistry", "services-silver-diamine-fluoride",
  "services-tmj-tmd", "services-what-is-tmj",
];

export const TEAM_SLUGS = ["team-dr-cho", "team-dr-sung", "team-tam-nguyen"];

// Everything else in the main set. `bespoke` pages are Elementor-built and get
// hand-authored templates; the rest are ordinary WordPress content pages whose
// `.entry-content` carries the whole page.
export const CORE_SLUGS = [
  "home", "about-us", "our-doctors", "our-team", "our-services", "technology", "technology-ai",
  "patient-resources", "contacts", "financing", "special-offers", "virtual-consultation",
  "appointment", "before-after", "pricing", "thank-you", "privacy-policy", "terms-of-service",
  "sitemap", "faq-page", "dental-library", "dental-dictionary", "town-resource",
  "dental-savings-plan", "product-recommendations", "toothpaste-rda-table", "toothpaste-chart",
  "ph-and-acidity-of-food-beverages", "invisalign-faqs-katy-tx", "dental-implants-faqs",
  "dental-implant-costs", "dental-implant-costs-esp", "pearl-ai", "ceramillmotion3",
];

export const ALL_SLUGS = [...CORE_SLUGS, ...SERVICE_SLUGS, ...TEAM_SLUGS];

export const PRACTICE = {
  name: "Mason Park Dental of Katy",
  phone: "(281) 769-8878",
  phoneHref: "tel:+12817698878",
  // From the practice's own Terms of Service, section 20. The live theme
  // published "info@website.com" - a placeholder that is not restored here.
  email: "office@masonparkdental.com",
  street: "21830 Kingsland Blvd #104A",
  city: "Katy",
  region: "TX",
  postal: "77450",
  maps: "https://www.google.com/maps/place/21830+Kingsland+Blvd+%23104a,+Katy,+TX+77450",
  facebook: "https://www.facebook.com/p/Mason-Park-Dental-100083179359693/",
};
