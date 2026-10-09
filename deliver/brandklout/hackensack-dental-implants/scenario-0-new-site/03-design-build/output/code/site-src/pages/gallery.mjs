/* /gallery. Copy: the live page (scrape/pages/gallery.md): H1 "Our Smile Gallery", "Before & after
   results" and the consent sentence. The live page showed four cases; the client's drive ("Before and
   Afters", 2026-09-08 and 09-20, every photo watermarked "Alan Meskin DDS") holds those four plus two
   more, all six here. The films and reviews chapters reuse the site's own headings and sentence
   (the treatment pages' "Real Patients, Real Stories", the home page's "In their own words."). */
import { page, hero, cases, films, reviews, consult } from '../lib/ui.mjs';

const crumbs = [['/gallery', 'Smile Gallery']];
const pair = (n, w, h, tag) => ({
  before: { src: `gallery-case-${n}-before.webp`, w, h, alt: `Patient ${n} before treatment` },
  after: { src: `gallery-case-${n}-after.webp`, w, h, alt: `Patient ${n} after treatment` },
  tag,
});

export default page({
  path: '/gallery',
  crumbs,
  seo: {
    title: 'Dental Implant Before & After Gallery | Hackensack, NJ',
    description: 'View before-and-after dental implant and smile restoration results from Hackensack Center for Dental Implants in Hackensack, NJ.',
    image: 'gallery-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      variant: 'wide',
      tagline: 'Before & after results',
      title: 'Our Smile Gallery',
      lead: 'Actual patients of Hackensack Center for Dental Implants, photographed before and after treatment and published with written consent. Every case is different; individual results vary.',
      image: { src: 'gallery-hero.webp', w: 1920, h: 860, alt: 'A patient sees her new smile in a hand mirror in the treatment chair' },
    }),
    cases({
      name: 'The Results',
      tagline: 'Before & after results',
      title: 'Real work should speak for itself.',
      list: [
        pair(1, 1112, 1500, 'Before / After'),
        pair(2, 1112, 1500, 'Smile Transformation'),
        pair(3, 1112, 1500, 'Patient Result'),
        pair(4, 1112, 1500, 'Before / After'),
        pair(5, 852, 1150, 'Smile Transformation'),
        pair(6, 1112, 1500, 'Patient Result'),
      ],
    }),
    films({
      title: 'Real Patients, Real Stories',
      intro: 'Hear from patients who rebuilt their entire smile and got their comfort and confidence back, in their own words.',
    }),
    reviews({}),
    consult({}),
  ],
});
