/* The practice's facts and the site map: one source for the shell, every page and the schema.
   Facts are read off the live site (docs/facts.md); the menu keeps the live site's sections and
   every one of its URLs, so the move needs no redirects. */

export const ORIGIN = 'https://www.hackensackdentalimplants.com';

export const FACTS = {
  name: 'Hackensack Center for Dental Implants',
  phone: '(551) 368-2476',
  phoneE164: '+15513682476',
  street: '163 Main Street, Suite A1',
  city: 'Hackensack',
  region: 'NJ',
  regionName: 'New Jersey',
  zip: '07601',
  area: 'Hackensack and the Greater Bergen County Area',
  hours: [
    { days: 'Monday to Friday', time: '10:00 AM to 6:00 PM' },
    { days: 'Saturday and Sunday', time: 'Closed' },
  ],
  languages: ['English', 'Español', 'Русский', 'Portuguese', 'Korean'],
  map: 'https://maps.app.goo.gl/2tAH78yFoiGHmE5F6',
  instagram: 'https://www.instagram.com/adcsmiles_',
  sameAs: ['https://www.instagram.com/adcsmiles_', 'https://www.healthgrades.com/dentist/dr-alan-meskin-1n6gtpui20'],
  rating: '5.0',
};

/* the menu. A group's first link is its overview page. */
export const NAV = [
  {
    label: 'About',
    id: 'about',
    links: [
      ['/about', 'About Us'],
      ['/dr-alan-meskin', 'Dr. Alan Meskin'],
      ['/dr-won-sang-lee-dds', 'Dr. Won-Sang Lee'],
      ['/dr-maurice-srour-dds', 'Dr. Maurice Srour'],
      ['/dr-dmitriy-klass-dds-msd', 'Dr. Dmitriy Klass'],
      ['/technology', 'Our Technology'],
      ['/office-gallery', 'Office Gallery'],
      ['/referring-doctors', 'Doctor Referrals'],
    ],
  },
  {
    label: 'Implant Solutions',
    id: 'solutions',
    wide: true,
    links: [
      ['/services', 'All Implant Solutions'],
      ['/services/dental-implants', 'Dental Implants'],
      ['/services/single-implant', 'Single Tooth Implants'],
      ['/services/implant-bridges', 'Implant Bridges'],
      ['/services/all-on-x', 'All-on-X'],
      ['/services/full-mouth-rehabilitation', 'Full Mouth Rehabilitation'],
      ['/services/implant-revision', 'Implant Revision'],
      ['/services/smile-makeovers', 'Smile Makeovers'],
      ['/services/sedation', 'Sedation Dentistry'],
      ['/services/emergency-dental-care', 'Emergency Dental Care'],
    ],
  },
  {
    label: 'Patients',
    id: 'patients',
    links: [
      ['/first-visit-expectations', 'Your First Visit'],
      ['/cost-of-dental-implants', 'Cost of Dental Implants'],
      ['/insurance-financing', 'Insurance & Financing'],
      ['/pre-post-op-instructions', 'Pre-Op & Post-Op Instructions'],
      ['/dental-implant-faqs', 'Dental Implant FAQs'],
      ['/blog', 'Blog'],
    ],
  },
  {
    label: 'Results',
    id: 'results',
    links: [
      ['/gallery', 'Smile Gallery'],
      ['/patient-testimonials', 'Patient Testimonials'],
    ],
  },
  { label: 'Contact', href: '/contact' },
];

export const FOOTER = [
  { title: 'Implant Solutions', links: NAV[1].links.slice(1, 8) },
  { title: 'About', links: NAV[0].links.slice(0, 1).concat([['/technology', 'Our Technology'], ['/office-gallery', 'Office Gallery'], ['/referring-doctors', 'Doctor Referrals'], ['/contact', 'Contact']]) },
  { title: 'Patients', links: NAV[2].links.concat(NAV[3].links) },
];

export const LEGAL = [
  ['/privacy-policy', 'Privacy Policy'],
  ['/terms-conditions', 'Terms of Service'],
  ['/cookie-policy', 'Cookie Policy'],
  ['/hipaa-disclosure', 'HIPAA Disclosure'],
];

/* the GoHighLevel consultation survey, verbatim from the live site; place-embeds.mjs swaps the
   marker for an Embed block on Instatic (embeds.json: ghl-survey) */
export const SURVEY = '<iframe src="https://api.leadconnectorhq.com/widget/survey/6CLNUlXI06FDHLD9XKBJ" style="border:none;width:100%;" scrolling="no" id="6CLNUlXI06FDHLD9XKBJ" title="survey"></iframe> <script src="https://link.msgsndr.com/js/form_embed.js"></script>';
export const REVIEWS = '<!-- Elfsight Google Reviews | Hackensack Center for Dental Implants --><script src="https://elfsightcdn.com/platform.js" async></script><div class="elfsight-app-948f2cd1-3863-46db-a63b-689bfc31ace0"></div>';

/* the live contact page's booking form and the referral page's form, verbatim (one line each); and
   the contact page's map. Each becomes an Embed block on Instatic (embeds.json). */
const ghl = (id, name, height) => `<iframe src="https://api.leadconnectorhq.com/widget/form/${id}" style="width:100%;height:100%;border:none;border-radius:8px" id="inline-${id}" data-layout="{'id':'INLINE'}" data-trigger-type="alwaysShow" data-trigger-value="" data-activation-type="alwaysActivated" data-activation-value="" data-deactivation-type="neverDeactivate" data-deactivation-value="" data-form-name="${name}" data-height="${height}" data-layout-iframe-id="inline-${id}" data-form-id="${id}" title="${name}"></iframe> <script src="https://link.msgsndr.com/js/form_embed.js"></script>`;
export const BOOKING_FORM = ghl('PJjhjcpMEQU8MMCTRpLV', 'Booking Form', 1145);
export const REFERRAL_FORM = ghl('SHs2QaddefZy9lixAea9', 'Form 2', 757);
export const MAP = '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3016.473157462833!2d-74.0433101!3d40.88343469999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c2fb3857335bb5%3A0x835a89e4bb9858bd!2sHackensack%20Center%20for%20Dental%20Implants!5e0!3m2!1ses!2sus!4v1789076258078!5m2!1ses!2sus" width="600" height="450" style="border:0;" allowfullscreen="" referrerpolicy="strict-origin-when-cross-origin" title="Map: Hackensack Center for Dental Implants"></iframe>';
