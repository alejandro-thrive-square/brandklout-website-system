/* /dr-won-sang-lee-dds. Copy: the live page (scrape/pages/dr-won-sang-lee-dds.md; the list and the band
   of three labels placed from mirror/raw-html/dr-won-sang-lee-dds.html), placed, not rewritten.
   Placed: the page's one section, "Training & Surgical Background" (two paragraphs and four lines), is
   the statement, its first sentence written by the scroll and its list kept under the paragraphs (95
   words, no fold). The grey band of three labels under it on the live page ("Columbia-Trained Oral
   Surgeon", ...) is the hero's note. The team chapter's heading is the live About page's own
   ("Exceptional Doctors, Extraordinary Care"): this page has no team section of its own.
   A short page: the live page carries one heading and about 150 words, so it has one scroll-driven
   chapter (statement), not three; no copy was written to fill more. Its two figures (15 years, 30,000
   implants) are left in the text, not set as a numbers chapter (two figures in the four-column row).
   Left out: the bare "Schedule Your Consultation" button of the hero; "Reimagine your dental experience"
   and the footer's address, hours and languages blocks.
   No phone number, practice name or review count needed changing; no fact changes. */
import { page, hero, statement, team, consult, p, ul } from '../lib/ui.mjs';

const crumbs = [['/about', 'About'], ['/dr-won-sang-lee-dds', 'Dr. Won-Sang Lee']];

export default page({
  path: '/dr-won-sang-lee-dds',
  crumbs,
  seo: {
    title: 'Dr. Won-Sang Lee, DDS | Hackensack Center for Dental Implants',
    description: 'Dr. Won-Sang Lee is a Columbia-trained oral and maxillofacial surgeon at Hackensack Center for Dental Implants in Hackensack, NJ.',
    image: 'dr-lee-hero-v2.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'Oral Surgeon',
      title: 'Dr. Won-Sang Lee, DDS',
      lead: 'Columbia-trained oral and maxillofacial surgeon with expertise in extractions, corrective jaw surgery, and dental implant placement. He brings hospital-level surgical precision to every case.',
      note: 'Columbia-Trained Oral Surgeon · Implant Placement and Jaw Surgery · Academic Teaching Attending',
      image: { src: 'dr-lee-hero-v2.webp', w: 905, h: 905, alt: 'Dr. Won-Sang Lee, oral surgeon' },
      card: false,
    }),
    statement({
      name: 'Training',
      tagline: 'His Background',
      title: 'Training &amp; Surgical Background',
      lead: 'Dr. Lee earned his Doctor of Dental Surgery degree from Columbia University and completed his oral and maxillofacial surgery residency at NewYork-Presbyterian/Columbia University.',
      body: p(
        'With more than 15 years of experience, he also serves as an Oral Surgery Attending at Metropolitan Hospital Center, where he supervises oral surgery residents and continues to refine his approach to complex surgical care.',
        'His expertise spans extractions, corrective jaw surgery, and dental implant placement and repairs, with a clinical focus on the face, mouth, and jaw. Having placed more than 30,000 dental implants, Dr. Lee handles the surgical cases that demand precision and experience. At Hackensack Center, he provides compassionate care grounded in advanced training. Dr. Lee is board eligible.',
      ) + ul(['Dental implant placement and surgical repairs', 'Complex and wisdom tooth extractions', 'Corrective jaw surgery', 'Academic attending and resident supervisor']),
    }),
    team({
      name: 'The Team',
      tagline: 'Our Specialists',
      title: 'Exceptional Doctors, Extraordinary Care',
      list: ['meskin', 'srour', 'klass'],
    }),
    consult({}),
  ],
});
