/**
 * footer-reviews-links.mjs — the footer's "Find Us Online" links, one source for the push
 * (push-footer-reviews.mjs) and its gate (.tmp/social/verify-footer-reviews.mjs).
 *
 * OFFICES: supplied by the practice, Asana 1219087019480243 (description, 2026-10-06). The McLean
 * Yelp link was given with a `?osq=…` search-origin parameter; it is the same business page
 * without it, so the parameter is left off.
 * OTHERS: kept from the 2026-10-05 run (found then, not supplied).
 */
export const OFFICES = [
  ['McLean', [
    ['Facebook', 'https://www.facebook.com/drnahlahprosthodontist/reviews'],
    ['Google', 'https://g.page/r/CSj2i2dK5ibmEAE/review'],
    ['Yelp', 'https://www.yelp.com/biz/nahlah-implants-and-prosthodontics-specialists-mclean-3'],
  ]],
  ['Alexandria', [
    ['Facebook', 'https://www.facebook.com/DrNahlahAlexandria/reviews'],
    ['Google', 'https://g.page/r/CbIvIUIh1cfREAE/review'],
    ['Yelp', 'https://www.yelp.com/biz/dr-nahlah-alexandria-2'],
  ]],
]
export const OTHERS = [
  ['Instagram', 'https://www.instagram.com/drnahlah/'],
  ['RealSelf', 'https://www.realself.com/dr/esam-abou-nahlah-mclean-va'],
  ['Vitals', 'https://www.vitals.com/doctors/esam-abou-nahlah-gokheu'],
  ['Healthgrades', 'https://www.healthgrades.com/dentist/dr-esam-abou-nahlah-26pyg'],
]
