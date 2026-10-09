/* /services, the hub of every treatment. Copy: the live page (scrape/pages/services.md; the nine cards
   and the tabbed doctor panel placed from mirror/raw-html/services.html), placed, not rewritten.
   Left out: "4.7 stars on Google with over 1,000 reviews" (the host's listing, not the office's: BugHerd
   #10, #24); the "Explore our services" jump menu (it listed eight of the nine cards and left out Sedation;
   the cards replace it); the Overview / Credentials / Recognition tab labels of the doctor panel; the
   bare "Schedule Your Consultation" button of the hero; "Reimagine your dental experience" and the
   footer's address, hours and languages blocks.
   Changed: the em dash of the doctor panel (between "the whole smile" and "not just one procedure") is
   a comma; the en dashes of "Dr. Alan Meskin, DDS [dash] Credentials" and "[dash] Recognition" are colons. The doctor panel, one
   block of three tabs on the live page, is set as its three panes in turn (statement, index, checks); its
   credential lines are split at their comma into the credential and the school, and the line under the
   photo ("NYU-trained specialist in replacing and restoring teeth.") introduces the credentials. Each
   card keeps its own link label. The live page puts the consultation before the questions; here the
   questions come first and the page ends with the consultation (README).
   Not MESKIN: this panel's overview paragraph is not the one in _shared.mjs. No phone number, practice
   name or review count needed changing. */
import { page, hero, links, statement, index, checks, films, faq, consult, p } from '../lib/ui.mjs';

const crumbs = [['/services', 'Implant Solutions']];
/* Each card shows a photograph of its treatment page (a photo on at most two pages: that page and
   this one): the page's lead, or its second photo where the lead already appears elsewhere. */
const PHOTO = {
  'dental-implants': { src: 'dental-implants-hero.webp', w: 1080, h: 1080, alt: 'A patient and a dentist looking at his 3D scan on a monitor in a treatment room' },
  'single-implant': { src: 'single-implant-hero.webp', w: 1200, h: 1200, alt: 'A dental implant, its abutment and its crown (model)' },
  'all-on-x': { src: 'allonx-hero.webp', w: 1200, h: 1200, alt: 'An upper and a lower full-arch restoration, each fixed on implants (model)' },
  'implant-bridges': { src: 'implant-bridges-hero.webp', w: 1200, h: 1200, alt: 'An implant bridge: joined crowns over two implants (model)' },
  'implant-revision': { src: 'implant-revision-opinion.webp', w: 1100, h: 900, alt: 'Implant parts, screws and crowns laid out in a steel tray' },
  'full-mouth-rehabilitation': { src: 'full-mouth-rehabilitation-hero.webp', w: 1200, h: 1200, alt: 'A complete upper and lower set of new teeth (model)' },
  'smile-makeovers': { src: 'smile-makeovers-hero.webp', w: 1200, h: 1200, alt: 'Porcelain veneer shades in a guide, one lifted out' },
  sedation: { src: 'sedation-statement.webp', w: 1000, h: 900, alt: 'A vital-signs monitor beside the chair in a treatment room' },
  'emergency-dental-care': { src: 'services-card-emergency.webp', w: 900, h: 700, alt: 'A gloved hand holding a dental handpiece' },
};
const card = (key, title, text, label) => ({ href: `/services/${key}`, title, text, label, image: PHOTO[key] });

export default page({
  path: '/services',
  crumbs,
  seo: {
    title: 'Dental Implant & Restorative Services in Hackensack, NJ | Hackensack Center',
    description: 'Explore dental implants, All-on-X, single implants, implant bridges, implant revision, full-mouth rehabilitation, smile makeovers, sedation, and emergency dental care in Hackensack, NJ.',
    image: 'services-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      variant: 'wide',
      tagline: 'All Treatments',
      title: 'Comprehensive Dental Services in Hackensack, NJ',
      lead: 'From replacing one tooth to rebuilding a full smile, our specialist team provides coordinated implant, restorative, emergency, and sedation care under one roof. Explore the service that fits your needs, or start with a consultation and we’ll help you choose the right path.',
      image: { src: 'services-hero.webp', w: 1920, h: 880, alt: 'A patient walking into the reception of the practice' },
    }),
    links({
      name: 'The Treatments',
      tagline: 'Implant Solutions',
      title: 'Specialist Care for Every Stage of Your Smile',
      intro: p('Whether you are replacing one missing tooth, rebuilding an entire arch, correcting previous implant work, or simply trying to get out of pain, our team coordinates your care in one place. Explore each service below to understand your options and find the treatment that fits your needs.'),
      items: [
        card('dental-implants', 'Dental Implants', 'A complete overview of implant treatment for replacing missing or failing teeth with fixed, natural-looking restorations.', 'Explore Dental Implants', 'A dental implant, its abutment and crown on a model of the jaw'),
        card('single-implant', 'Single Tooth Implant', 'Replace one missing tooth without grinding down the healthy teeth beside it.', 'Explore Single Tooth Implants', 'A single implant crown on a model, between two natural teeth'),
        card('all-on-x', 'All-on-X Implants', 'Replace a full upper or lower arch with a fixed set of teeth supported by strategically placed implants.', 'Explore All-on-X', 'A full-arch implant restoration on a model of the jaw'),
        card('implant-bridges', 'Implant Bridges', 'Replace several missing teeth in a row with a fixed bridge supported by dental implants.', 'Explore Implant Bridges', 'An implant-supported bridge of three teeth on a model'),
        card('implant-revision', 'Implant Revision', 'Evaluate and correct loose, painful, failing, or poorly restored implants placed elsewhere.', 'Explore Implant Revision', 'A 3D scan of an existing implant reviewed on screen at the practice'),
        card('full-mouth-rehabilitation', 'Full-Mouth Rehabilitation', 'Rebuild a complex or heavily damaged smile with one coordinated restorative and implant treatment plan.', 'Explore Full-Mouth Rehabilitation', 'A patient of the practice smiling after full-mouth treatment'),
        card('smile-makeovers', 'Smile Makeovers', 'Combine restorative and cosmetic treatments to improve the appearance, balance, and function of your smile.', 'Explore Smile Makeovers', 'Crowns shade-matched in the on-site lab'),
        card('sedation', 'Sedation Dentistry', 'Reduce dental anxiety and stay comfortable during treatment with sedation options tailored to your procedure.', 'Explore Sedation Options', 'A quiet treatment room at the practice, the chair reclined'),
        card('emergency-dental-care', 'Emergency Dental Care', 'Get prompt evaluation for urgent tooth pain, broken teeth, swelling, trauma, or implant-related problems.', 'Explore Emergency Dental Care', 'A treatment room at the practice set up for an examination'),
      ],
    }),
    statement({
      name: 'The Specialist',
      tagline: 'Your Implant Specialist',
      title: 'Meet Dr. Alan Meskin, Prosthodontist',
      lead: 'Specialist-led care, coordinated around you.',
      body: p('Dr. Alan Meskin is an NYU-trained prosthodontist focused on restoring oral health, function, and confidence through carefully coordinated care. From single-tooth replacement and implant restorations to full-mouth rehabilitation and complex restorative cases, he brings each treatment plan together with advanced 3D imaging, an on-site dental lab, and a team of surgical specialists when needed. The goal is comprehensive care built around the whole smile, not just one procedure.'),
    }),
    index({
      name: 'Credentials',
      tagline: 'Education',
      title: 'Dr. Alan Meskin, DDS: Credentials',
      intro: p('NYU-trained specialist in replacing and restoring teeth.'),
      items: [
        { title: 'Doctor of Dental Surgery (DDS)', body: p('NYU College of Dentistry') },
        { title: 'Certificate in Prosthodontics', body: p('NYU College of Dentistry') },
        { title: 'Associate Prosthodontist', body: p('ClearChoice Dental Implant Centers') },
      ],
    }),
    checks({
      name: 'Recognition',
      tagline: 'Reputation',
      title: 'Dr. Alan Meskin, DDS: Recognition',
      intro: p('The work speaks through the patients who wear it.'),
      items: [
        'Patients describe him as an artist with a gentle touch whose restorative work looks so natural no one can tell.',
        'Complex and referred-out cases trusted to him by other dental offices.',
      ],
    }),
    films({
      tagline: 'Patient Stories',
      title: 'Real Patients, Real Stories',
      intro: 'Hear from patients who rebuilt their entire smile and got their comfort and confidence back, in their own words.',
    }),
    faq({
      items: [
        ['Am I too old for dental implants?', 'No. Age itself is not a barrier. Patients in their 70s, 80s, and beyond receive implants every year and heal well, provided general health supports it. What matters is your overall health and the quality of your bone, both of which are checked at your consultation.'],
        ['Do dental implants hurt?', 'Most patients are surprised how comfortable it is. Placement is done under local anesthetic, and sedation is available for anyone who feels anxious. Any soreness afterward is usually managed with simple over-the-counter care.'],
        ['How long does the implant process take?', 'From placement to your final tooth is usually a few months, because the implant needs time to fuse with the bone. Appointments themselves are short. Most of the timeline is quiet healing, not chair time.'],
        ['How much do dental implants cost?', p('Cost depends on the type of case, from a single implant to a full-arch reconstruction. After your 3D scan you receive a clear written estimate with no surprises, plus financing options that spread the cost into monthly payments.', '<a href="/cost-of-dental-implants">Full cost breakdown →</a>')],
        ['What if I do not have enough bone?', 'You may still qualify. Focused bone grafts can rebuild sites where the bone has shrunk, and angled implant designs like All-on-4 are built to work with limited bone. A 3D scan is the only way to know for certain, and many patients who were told no elsewhere still qualify here.'],
        ['How long do dental implants last?', 'With good hygiene and regular check-ups, the implant itself can last for decades, often for life. The crown on top is durable and can be maintained or replaced over the years if needed.'],
        ['Do you offer financing?', 'Yes. We will find a way. We try every avenue, and our dedicated team of treatment coordinators will help you find a plan that fits. We work with Cherry, HFD, Proceed, and CareCredit, and we verify any insurance benefits up front.'],
      ],
    }),
    consult({
      text: 'Schedule your consultation today and see how different implant care can feel. At Hackensack Center for Dental Implants, your comfort, your confidence, and your smile always come first.',
    }),
  ],
});
