/* ==========================================================================
   SITE FACTS — one place for the things every page repeats.
   Phone numbers, address, hours, social, the Zocdoc booking link (Asana
   1216841931530915: "add a second CTA on the site for Zocdoc"), the practice's
   YouTube films, the three named patients. Nothing here is invented: every
   value is on the current site, in the client questionnaire, or in Asana.
   ========================================================================== */
export const SITE = {
  name: 'West LA Implants',
  doctor: 'Dr. Tony Barriere, DDS',
  phoneNew: '(310) 692-9316',
  phoneNewHref: 'tel:+13106929316',
  phoneCurrent: '(310) 481-0111',
  phoneCurrentHref: 'tel:+13104810111',
  /* the ad pages show the MAIN line: the GHL pool 'West LA Implants Tracking Pool' swaps it, and no
     pool swaps the new-patient line (user's choice 2026-10-07, scenario 3 DNI) */
  phoneAds: '(310) 481-0111',
  phoneAdsHref: 'tel:+13104810111',
  address1: '12301 Wilshire Blvd, Suite 205',
  address2: 'Los Angeles, CA 90025',
  mapHref: 'https://www.google.com/maps?q=12301+Wilshire+Blvd+Suite+205+Los+Angeles+CA+90025',
  zocdoc: 'https://www.zocdoc.com/practice/west-la-implants-65990', // the booking-link opened blank (BugHerd #37)
  hours: 'Monday to Friday, 9am to 5pm',
  social: {
    instagram: 'https://www.instagram.com/west_la_implants/',
    facebook: 'https://www.facebook.com/WestLAImplants1/',
    youtube: 'https://www.youtube.com/@westlaimplants', // @westlaimplants892 is a 404 (BugHerd #27, #36)
    yelp: 'https://www.yelp.com/biz/west-la-implants-los-angeles-3',
    google: 'https://www.google.com/maps?q=west+la+implants',
  },
}

/* The twelve films on the practice's channel, titles as YouTube reports them
   (oEmbed, 2026-09-22). Thumbnails are downloaded into media/img/yt-<id>.jpg
   by build.mjs so the published page never hot-links i.ytimg.com. */
/* A film's link: its Vimeo page once it is on the agency's Vimeo (Brandklout's rule: every video
   on Vimeo, its description linking back to the site), else YouTube. js/75-films.js plays the
   Vimeo ones in a lightbox on pages whose CSP allows it. */
export const filmHref = (f) => (f.vimeo ? `https://vimeo.com/${f.vimeo}` : `https://www.youtube.com/watch?v=${f.id}`)

export const FILMS = {
  leslie: { id: 'nH1ST1jo8WQ', vimeo: '1233866645', title: 'Full Arch All-On-4 Gave Me My Confidence Back!' },
  emily: { id: '4skcfz94ZS4', vimeo: '1233866646', title: 'I Felt Like The Old Me Because Of My Crowns & Dental Implants' },
  michael: { id: 'SDVe8k_zQUE', vimeo: '1233866644', title: 'I Have Teeth Again Thanks To My Full Mouth Reconstruction!' },
  welcome: { id: 'KyCD8IhBba4', vimeo: '1233869447', title: "West LA Implants: Transforming People's Lives" },
  experience: { id: 'LElCA_akdM8', vimeo: '1233869449', title: 'Why Does Dental Implant Treatment Experience Matter?' },
  guided: { id: 'S3Y6cgN4jUg', vimeo: '1233869448', title: 'Eliminate The Risk Of Human Error With 3D Guided Dental Implant Surgery' },
  technology: { id: 'toBPnmeEEq4', vimeo: '1233869451', title: 'State-Of-The-Art Dental Technologies For Precise Results' },
  cosmetic: { id: 'Z2EydN7-rMU', vimeo: '1233869511', title: 'Top 3 Transformative Cosmetic Dental Procedures' },
  wisdom: { id: 'VHwvRlKIdIg', vimeo: '1233869516', title: 'What Are The Consequences Of Not Getting Wisdom Teeth Removed?' },
  invisalign: { id: 'DKuc8WTQ3yM', title: 'Straight Talk About Crooked Teeth' },
}
export const yt = (id) => `https://www.youtube.com/watch?v=${id}`

export const PATIENTS = {
  leslie: {
    name: 'Leslie', treatment: 'Full arch All-on-4®', quote: 'Full Arch All-On-4 gave me my confidence back.',
    before: '/media/img/case10_before_westlaimplants_leslie_barriere.jpg', after: '/media/img/case10_after_westlaimplants_leslie_barriere.jpg',
    poster: '/media/img/still-leslie-smile-tablet.jpg', film: FILMS.leslie, clip: '/media/video/leslie-story-1280.mp4',
  },
  emily: {
    name: 'Emily', treatment: 'Crowns & dental implants', quote: 'I felt like the old me because of my crowns and dental implants.',
    before: '/media/img/case11_before_westlaimplants_emily_barriere.jpg', after: '/media/img/case11_after_westlaimplants_emily_barriere.jpg',
    poster: '/media/img/emily_dentalimplant_westlaimplant_barriere2.jpg', film: FILMS.emily, clip: '/media/video/emily-story-1280.mp4',
  },
  michael: {
    name: 'Michael', treatment: 'Full mouth reconstruction', quote: 'I have teeth again thanks to my full mouth reconstruction.',
    before: '/media/img/case12_before_westlaimplants_michael_barriere.jpg', after: '/media/img/case12_after_westlaimplants_michael_barriere.jpg',
    poster: '/media/img/michael-full-mouth.jpg', film: FILMS.michael,
  },
}

/* The site index: what the drawer, the footer and the "where next" rows link
   to. Order is the reading order of the practice, not the alphabet. */
export const INDEX = [
  { group: 'Dental implants', links: [
    ['/dental-implants.html', 'Dental implants'],
    ['/all-on-4.html', 'All-on-4® full arch'],
    ['/implant-supported-dentures.html', 'Implant-supported dentures'],
    ['/hybrid-dentures.html', 'Hybrid fixed dentures'],
    ['/zirconia-fixed-bridge.html', 'Zirconia fixed bridge'],
    ['/failing-dental-implants.html', 'Failing implants'],
    ['/implant-cost.html', 'Implant cost'],
    ['/financing.html', 'Insurance & financing'],
  ]},
  { group: 'Surgery & care', links: [
    ['/technology.html', 'Yomi® robotic surgery & technology'],
    ['/sedation-dentistry.html', 'IV sedation'],
    ['/bone-grafting.html', 'Bone, sinus & ridge grafting'],
    ['/tooth-extractions.html', 'Tooth extractions'],
    ['/periodontics.html', 'Periodontics'],
    ['/missing-teeth.html', 'Missing teeth & loose dentures'],
    ['/cosmetic-dentistry.html', 'Cosmetic dentistry'],
    ['/general-dentistry.html', 'General dentistry'],
  ]},
  { group: 'The practice', links: [
    ['/dr-tony-barriere.html', 'Dr. Tony Barriere'],
    ['/our-practice.html', 'Our practice & team'],
    ['/results.html', 'Results & patient stories'],
    ['/what-to-expect.html', 'Your first visit'],
    ['/faq.html', 'Questions'],
    ['/blog.html', 'Journal'],
    ['/referring-doctors.html', 'Referring doctors'],
    ['/contact.html', 'Contact'],
  ]},
  { group: 'Near you', links: [
    ['/dental-implants-brentwood.html', 'Brentwood'],
    ['/dental-implants-santa-monica.html', 'Santa Monica'],
    ['/dental-implants-westwood.html', 'Westwood'],
    ['/dental-implants-century-city.html', 'Century City'],
    ['/dental-implants-culver-city.html', 'Culver City'],
    ['/dental-implants-beverly-hills.html', 'Beverly Hills'],
  ]},
]
