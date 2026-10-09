/* /dr-maurice-srour-dds. Copy: the live page (scrape/pages/dr-maurice-srour-dds.md; the list and the band
   of three labels placed from mirror/raw-html/dr-maurice-srour-dds.html), placed, not rewritten.
   Placed: the page's one section, "Training & Surgical Background" (two paragraphs and four lines), is
   the statement, its first sentence written by the scroll; the second paragraph and the list fold
   behind "Read more" (over 110 words). The grey band of three labels under the section on the live
   page ("NYU-Trained Oral Surgeon", ...) is the hero's note. The team chapter's heading is the live
   About page's own ("Exceptional Doctors, Extraordinary Care").
   A short page: the live page carries one heading and about 170 words, so it has one scroll-driven
   chapter (statement), not three; no copy was written to fill more. Its three figures (10 years, 5,000
   full-arch cases, 20,000 implants) stay in the text and are not set as a numbers row: they are the
   practice's own claims, unconfirmed (docs/facts.md), and the row pushed the consultation off its sage
   ground.
   Left out: the NYU and Trinitas logos under the list (the text names both); the bare "Schedule Your
   Consultation" button of the hero; "Reimagine your dental experience" and the footer's address, hours
   and languages blocks.
   No phone number, practice name or review count needed changing; no fact changes. */
import { page, hero, statement, team, consult, p, ul } from '../lib/ui.mjs';

const crumbs = [['/about', 'About'], ['/dr-maurice-srour-dds', 'Dr. Maurice Srour']];

export default page({
  path: '/dr-maurice-srour-dds',
  crumbs,
  seo: {
    title: 'Dr. Maurice Srour, DDS | Hackensack Center for Dental Implants',
    description: 'Dr. Maurice Srour is an NYU-trained oral and maxillofacial surgeon at Hackensack Center for Dental Implants in Hackensack, NJ.',
    image: 'dr-srour-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'Oral Surgeon',
      title: 'Dr. Maurice Srour, DDS',
      lead: 'Board-certified oral and maxillofacial surgeon specializing in surgical implant placement, bone grafting, and complex extractions. NYU-trained, with hospital-based experience in trauma and reconstruction.',
      note: 'NYU-Trained Oral Surgeon · Hospital Surgical Residency · Complex Extractions and Bone Grafting',
      image: { src: 'dr-srour-hero.webp', w: 833, h: 833, alt: 'Dr. Maurice Srour, oral surgeon' },
      card: false,
    }),
    statement({
      name: 'Training',
      tagline: 'His Background',
      title: 'Training &amp; Surgical Background',
      lead: 'Dr. Srour earned his Doctor of Dental Surgery degree from the New York University College of Dentistry, then completed his Oral and Maxillofacial Surgery Certificate at NYU Medical Center and Bellevue Hospital Center.',
      body: p('He is board certified and has more than 10 years of surgical experience. Dr. Srour has completed more than 5,000 full-arch cases and placed more than 20,000 dental implants. He also has advanced training in remote-anchorage implant techniques, including pterygoid, zygomatic, and transnasal implants.'),
      more: p('Dr. Srour has also served as a key member of the team at ClearChoice Dental Implant Centers and remains on staff at Trinitas Regional Medical Center in Elizabeth, NJ, where he continues to serve the community with a focus on trauma, pathology, and reconstruction. His professional affiliations have included the American Association of Oral and Maxillofacial Surgeons, the American College of Oral and Maxillofacial Surgeons, and the American Dental Association. His surgical background allows Hackensack Center to handle extractions, bone grafting, and implant placement in-house, under one roof.')
        + ul(['Surgical implant placement and bone grafting', 'Complex and surgical extractions', 'Oral and maxillofacial surgery', 'Hospital-based trauma and reconstruction experience']),
    }),
    team({
      name: 'The Team',
      tagline: 'Our Specialists',
      title: 'Exceptional Doctors, Extraordinary Care',
      list: ['meskin', 'lee', 'klass'],
    }),
    consult({}),
  ],
});
