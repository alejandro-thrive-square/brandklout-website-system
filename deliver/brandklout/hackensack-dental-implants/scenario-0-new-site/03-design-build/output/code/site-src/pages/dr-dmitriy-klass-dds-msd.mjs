/* /dr-dmitriy-klass-dds-msd. Copy: the live page (scrape/pages/dr-dmitriy-klass-dds-msd.md; the list and
   the band of three labels placed from mirror/raw-html/dr-dmitriy-klass-dds-msd.html), placed, not
   rewritten.
   Placed: the page's one section, "Training & Surgical Background" (two paragraphs and four lines), is
   the statement, its first sentence written by the scroll; the second paragraph and the list fold
   behind "Read more" (over 110 words). The grey band of three labels under the section on the live page
   ("NYU and Boston University Trained", ...) is the hero's note. The team chapter's heading is the live
   About page's own ("Exceptional Doctors, Extraordinary Care").
   A short page: the live page carries one heading and about 190 words, so it has one scroll-driven
   chapter (statement), not three; no copy was written to fill more.
   Left out: the NYU and Boston University logos under the list (the text names both; the Boston
   University logo linked to "#"); the bare "Schedule Your Consultation" button of the hero;
   "Reimagine your dental experience" and the footer's address, hours and languages blocks.
   No phone number, practice name or review count needed changing; no fact changes. */
import { page, hero, statement, team, consult, p, ul } from '../lib/ui.mjs';

const crumbs = [['/about', 'About'], ['/dr-dmitriy-klass-dds-msd', 'Dr. Dmitriy Klass']];

export default page({
  path: '/dr-dmitriy-klass-dds-msd',
  crumbs,
  seo: {
    title: 'Dr. Dmitriy Klass, DDS, MSD | Hackensack Center for Dental Implants',
    description: 'Dr. Dmitriy Klass is an NYU and Boston University-trained periodontist and implant surgeon at Hackensack Center for Dental Implants in Hackensack, NJ.',
    image: 'dr-klass-hero-v2.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'Periodontist',
      title: 'Dr. Dmitriy Klass, DDS, MSD',
      lead: 'NYU-trained periodontist and implant surgeon with a Master of Science in Dentistry from Boston University. He specializes in advanced implant procedures, bone and gum grafting, and minimally invasive periodontal care.',
      note: 'NYU and Boston University Trained · Periodontist and Implant Surgeon · Philadelphia Top Doctor 2025',
      image: { src: 'dr-klass-hero-v2.webp', w: 1200, h: 1200, alt: 'Dr. Dmitriy Klass, periodontist' },
      card: false,
    }),
    statement({
      name: 'Training',
      tagline: 'His Background',
      title: 'Training &amp; Surgical Background',
      lead: 'Dr. Klass earned his Doctor of Dental Surgery degree from New York University College of Dentistry, where he was part of the Honors in Prosthodontics clinic and received the Carl E. Misch Award for Excellence at the Greater New York Dental Meeting World Implant Expo in 2018.',
      body: p('He then completed his specialty residency in Periodontics and earned a Master of Science in Dentistry at Boston University’s Henry M. Goldman School of Dental Medicine. During his residency, he conducted one of the world’s first clinical trials evaluating the accuracy of a robotic dental implant system, research that was later published. That dual training in clinical periodontics and academic research gives him a deep foundation in how bone and gum tissue support long-term implant success.'),
      more: p("Recognized among Philadelphia's Top Doctors in 2025, Dr. Klass focuses on advanced implant procedures, gum and bone grafting, orthodontic acceleration, and regenerative treatment for periodontal disease. He uses the latest evidence-based, minimally invasive techniques to provide comfortable, high-quality care, and his work at Hackensack Center ensures that every implant is placed in a healthy, well-prepared foundation. Dr. Klass is board eligible.")
        + ul(['Advanced dental implant procedures', 'Bone grafting and sinus augmentation', 'Gum grafting and periodontal regeneration', 'Minimally invasive periodontal treatment']),
    }),
    team({
      name: 'The Team',
      tagline: 'Our Specialists',
      title: 'Exceptional Doctors, Extraordinary Care',
      list: ['meskin', 'lee', 'srour'],
    }),
    consult({}),
  ],
});
