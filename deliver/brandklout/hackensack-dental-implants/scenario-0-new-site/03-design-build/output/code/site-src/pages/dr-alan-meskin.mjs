/* /dr-alan-meskin. Copy: the live page (scrape/pages/dr-alan-meskin.md; lists placed from
   mirror/raw-html/dr-alan-meskin.html), placed, not rewritten.
   Placed: "Meet Dr. Meskin" is the statement (its first sentence written by the scroll; the second
   paragraph and the four focus lines fold behind "Read more", over 110 words). "EDUCATION AND TRAINING"
   (typed in capitals on the live page, set in title case) is the specialist chapter: its "Education:"
   lines are the credentials, split at the comma before the school; the photograph of Dr. Meskin with a
   colleague that sat under that heading is its portrait. The memberships row repeats the home page's
   own line: on the live page they are four logos (NYU Dentistry, ADA, AAID, ACP), not text. Its
   "Specialty Training:" and "Areas of Expertise:" lists are their own chapters (index, checks), the
   colons dropped from the headings. The team chapter's heading is the live About page's own ("Exceptional
   Doctors, Extraordinary Care"): this page has no team section of its own.
   Left out: the bare "Schedule Your Consultation" button of the hero; "Reimagine your dental experience"
   and the footer's address, hours and languages blocks. The specialist chapter's button is the site's
   "Book A Consultation" (its default link points to this page).
   No phone number, practice name or review count needed changing; no fact changes. */
import { page, hero, statement, specialist, index, checks, team, consult, p, ul, BOOK } from '../lib/ui.mjs';

const crumbs = [['/about', 'About'], ['/dr-alan-meskin', 'Dr. Alan Meskin']];

export default page({
  path: '/dr-alan-meskin',
  crumbs,
  seo: {
    title: 'Prosthodontist in Hackensack, NJ | Dr. Alan Meskin',
    description: 'Dr. Alan Meskin is an NYU-trained prosthodontist in Hackensack, NJ leading Hackensack Center for Dental Implants.',
    image: 'dr-meskin-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'Prosthodontist',
      title: 'Dr. Alan Meskin, Prosthodontist and Implant Specialist',
      lead: 'NYU-trained and focused entirely on replacing and restoring teeth, Dr. Alan Meskin specializes in dental implants, full-mouth reconstruction, and cosmetic smile design, including the complex cases other offices refer out.',
      image: { src: 'dr-meskin-hero.webp', w: 1200, h: 1200, alt: 'Dr. Alan Meskin in navy scrubs at the practice' },
    }),
    statement({
      name: 'Meet Dr. Meskin',
      tagline: 'His Story',
      title: 'Meet Dr. Meskin',
      lead: 'Dr. Alan Meskin is a prosthodontist, a dental specialist trained specifically in replacing and restoring teeth.',
      body: p('He earned his Doctor of Dental Surgery from NYU College of Dentistry in 2019, then completed a further certificate in prosthodontics at NYU in 2022, focusing on implant restoration and full-mouth reconstruction. Dr. Meskin describes himself simply: a prosthodontist dedicated to smile design and full-mouth rehabilitation, with a focus on implant prosthetics. That focus is deliberate. By concentrating on replacing and restoring teeth rather than spreading across every area of dentistry, he is able to bring real depth to the cases that need it most.'),
      more: p('His work centers on one goal: rebuilding smiles so naturally that no one can tell. Patients describe him as gentle and thorough, a dentist who takes the time to explain, listens first, and puts anxious patients at ease. He provides care in English, Spanish, and Russian. His philosophy is patient-first and detail-driven. Every plan begins by listening to what the patient actually wants, and every restoration is designed to look and function like a natural tooth. He is committed to continuing education, regularly taking courses and bringing the newest techniques in digital and implant dentistry back to his patients.')
        + ul(['Dental implants, from a single tooth to a full arch', 'Full-mouth reconstruction and rehabilitation', 'Cosmetic smile design and makeovers', 'Implant revision and complex, referred-out cases']),
    }),
    specialist({
      name: 'Education',
      tagline: 'Credentials',
      title: 'Education and Training',
      credentials: [
        ['Doctor of Dental Surgery (DDS)', 'NYU College of Dentistry, 2019'],
        ['Certificate in Prosthodontics', 'NYU College of Dentistry, 2022'],
        ['Memberships', 'American College of Prosthodontists · American Academy of Implant Dentistry · American Dental Association'],
      ],
      image: { src: 'dr-meskin-training.webp', w: 900, h: 1100, alt: 'Dr. Alan Meskin with a colleague outside the practice' },
      link: BOOK,
    }),
    index({
      name: 'Specialty Training',
      tagline: 'Residency',
      title: 'Specialty Training',
      items: [
        { title: 'Three-year accredited prosthodontics residency at NYU' },
        { title: 'Clinical training in implant restorations and full-mouth reconstruction' },
        { title: 'Advanced training in digital dentistry and CAD/CAM workflows' },
      ],
    }),
    checks({
      name: 'Expertise',
      tagline: 'His Focus',
      title: 'Areas of Expertise',
      items: ['Implant prosthetics', 'Full-mouth rehabilitation', 'Cosmetic smile design', 'Restorative dentistry (crowns, bridges, veneers)'],
    }),
    team({
      name: 'The Team',
      tagline: 'The Surgical Team',
      title: 'Exceptional Doctors, Extraordinary Care',
      list: ['lee', 'srour', 'klass'],
    }),
    consult({}),
  ],
});
