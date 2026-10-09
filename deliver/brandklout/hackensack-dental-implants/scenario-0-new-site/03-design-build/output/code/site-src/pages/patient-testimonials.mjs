/* /patient-testimonials. Copy: the live page (scrape/pages/patient-testimonials.md, checked against
   mirror/raw-html/patient-testimonials.html): its H1, its one paragraph, the two patient films (Isaac,
   Daniel) and a Google reviews widget under them. The live page quotes no patient in its own text,
   so there is no quote chapter, and it is too short for scroll-driven chapters without writing copy.
   The films chapter takes the site's films heading ("Watch Our Patient Video Diaries"): the live h2
   over the films repeats the H1, "Patient Testimonials". The reviews chapter is the site's live Google
   feed with its standard heading; the live page's widget was labelled "Aesthetic Dental Center" in the
   markup (another practice's widget).
   Left out: the "Schedule Your Consultation" button under the paragraph (the hero buttons replace it),
   the films chapter's "View all testimonials" link (it would point at this page), and the footer.
   Facts: no second phone number, no "Arvada", no review count on the live page. */
import { page, hero, films, reviews, consult } from '../lib/ui.mjs';

const crumbs = [['/gallery', 'Results'], ['/patient-testimonials', 'Patient Testimonials']];

export default page({
  path: '/patient-testimonials',
  crumbs,
  seo: {
    title: 'Patient Testimonials in Hackensack, NJ | Hackensack Center',
    description: 'Read patient reviews of Hackensack Center for Dental Implants in Hackensack, NJ and the implant care from Dr. Alan Meskin.',
    image: 'patient-testimonials-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'Patient Stories',
      title: 'Patient Testimonials',
      lead: 'At Hackensack Center for Dental Implants, led by prosthodontist, Dr. Alan Meskin, our patients are the best measure of our work. We focus on doing one thing exceptionally well, replacing and restoring teeth, and on treating every person with the care and honesty we would want ourselves. The stories below are theirs, in their own words.',
      image: { src: 'patient-testimonials-hero.webp', w: 1080, h: 1080, alt: 'Isaac, a patient of the practice, smiling outdoors' },
    }),
    films({
      title: 'Watch Our Patient Video Diaries',
      link: null,
    }),
    reviews({}),
    consult({}),
  ],
});
