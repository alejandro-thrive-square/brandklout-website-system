/* /first-visit-expectations. Copy: the live page (scrape/pages/first-visit-expectations.md, checked
   against mirror/raw-html/first-visit-expectations.html), placed and folded, not rewritten.
   Structure: the five paragraphs that sat under the H1 with no heading of their own are headed by the
   page's own h2 "It’s a whole new experience.", moved up from the office-photo band further down (that
   band had no copy but the practice quote, which keeps its place as the quote chapter). The FAQ moves
   above the consultation form, which closes the page.
   Left out: the h3 "Start Your Journey to Better Dental Health Today" and "Request an Appointment and
   Start Your Smile Journey Today." (a bare call to action; the hero buttons and the form replace it),
   the "Schedule Your Consultation" / "View All Testimonials" buttons, the links on three feature tiles
   (to /technology, /services/sedation, /services/implant-revision: index rows carry no link), and the
   footer blocks ("Reimagine your dental experience", address, hours, languages).
   Facts: no changes needed (no second phone number, no "Arvada", no review count on the live page). */
import { page, hero, statement, index, quote, films, faq, consult, p } from '../lib/ui.mjs';

const crumbs = [['/first-visit-expectations', 'Patients'], ['/first-visit-expectations', 'Your First Visit']];

export default page({
  path: '/first-visit-expectations',
  crumbs,
  seo: {
    title: 'Your First Visit in Hackensack, NJ | Hackensack Center',
    description: 'What to expect at your first visit to Hackensack Center for Dental Implants in Hackensack, NJ. Meet Dr. Alan Meskin.',
    image: 'first-visit-expectations-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'New Patients',
      title: 'First Visit Expectations',
      lead: 'Your first visit is a relaxed, no-pressure conversation and exam, not a hard sell. Here is exactly what to expect, so there are no surprises when you walk in.',
      image: { src: 'first-visit-expectations-hero.webp', w: 1080, h: 1080, alt: 'A new patient filling in his forms in the waiting room' },
    }),
    statement({
      name: 'The First Visit',
      tagline: 'What to Expect',
      title: 'It’s a whole new experience.',
      lead: 'Your first visit is not only about our team getting to know you, but about you getting to know us too.',
      body: p(
        'In the time we spend together, we want you to ask questions, share what has been on your mind, and tell us anything you want us to know that will help make your care fit you specifically.',
        'Part of getting to know you means reviewing your medical history in detail. Certain conditions and medications can affect implant healing and treatment planning, so you will be asked for a list of your medications and dosages, including vitamins and supplements. This is not paperwork for the sake of paperwork. It is how we keep your care safe.',
      ),
      more: p(
        'A comprehensive oral exam is performed, along with digital x-rays and, where the case calls for it, a 3D cone beam scan. If it has been a while since your last dental visit, do not worry about it. You have made the decision to come in, which is the part that matters.',
        'Once the exam is complete, Dr. Meskin walks you through what he sees, in plain language, on the same screen you are looking at. Together you build a treatment plan that fits your dental needs and your life, phased and paced in a way you can afford. You leave with a written estimate and a clear plan, not with pressure to commit.',
        'Above all, we want you to feel comfortable, physically and emotionally. That is not a marketing line. It is the whole point of a first visit at Hackensack Center.',
      ),
      image: { src: 'first-visit-expectations-statement.webp', w: 1000, h: 900, alt: 'The curved reception desk of the practice' },
    }),
    index({
      name: 'Specialist Care',
      tagline: 'Our Approach',
      title: 'Specialist Care From the First Appointment.',
      intro: p('At Hackensack Center, every part of your visit is designed around one thing: giving you specialist-level implant and restorative care in an office that actually feels calm. Dr. Meskin plans and delivers your treatment personally, from the first scan to the final restoration.'),
      items: [
        { title: 'NYU-Trained Prosthodontist', body: p('Dr. Meskin earned his dental degree and his prosthodontics specialty at NYU.') },
        { title: 'On-Site Dental Lab', body: p('Your crown, bridge, or full-arch restoration is designed and finished in-house, so Dr. Meskin and the lab technician work together on your case rather than shipping it out and hoping the fit comes back right.') },
        { title: 'Every Case Planned in 3D', body: p('Every implant and restorative case is planned against a cone beam CT scan of your jaw. Better diagnostics means fewer surprises and more predictable results.') },
        { title: 'Same-Day Temporary Teeth', body: p('For full-arch cases, most patients leave surgery with a fixed set of temporary teeth the same day. You are never sent home with a visible gap.') },
        { title: 'Sedation Available', body: p('If dental anxiety is a concern, tell us. We offer a full range of sedation options, up to IV sedation, so your comfort is not a limiting factor in your care.') },
        { title: 'Flexible Financing', body: p('We will find a way. Our coordinators help you build a plan that fits your budget, with financing through Cherry, HFD, Proceed, and CareCredit.') },
        { title: 'Care in Three Languages', body: p('Dr. Meskin cares for patients in English, Spanish, and Russian, so you can discuss your treatment comfortably in your own words.') },
        { title: 'Second Opinions Welcome', body: p('Many first visits at Hackensack Center are second opinions. If you were quoted a big treatment plan somewhere else, or told an implant could not be saved, come in for an honest specialist review before you commit.') },
      ],
    }),
    quote({
      name: 'The Practice',
      text: 'At our practice, we see beauty and oral health as inseparable. Our dedication to health, inspired by the art of creating beautiful smiles, is at the heart of our success.',
      image: { src: 'first-visit-expectations-quote.webp', w: 900, h: 1100, alt: 'The waiting-room lounge: grey sofas, abstract paintings and flowers' },
    }),
    films({
      title: 'Watch Our Patient Video Diaries',
      intro: 'Hear the real stories of patients who were right where you are, in their own words.',
    }),
    faq({
      items: [
        ['What should I expect at my first visit?', 'Your first visit is focused on understanding what brought you in and building the right plan. Dr. Alan Meskin will review your concerns and goals, evaluate your oral health, review your health history, and use appropriate diagnostic imaging to understand your case before recommending treatment.'],
        ['What should I bring to my first appointment?', 'Please bring a current list of your medications and dosages, including vitamins and supplements. If you already have recent dental records or imaging from another office, bringing those can also help the team understand your history and avoid unnecessary repetition.'],
        ['Will I get a 3D scan at my first visit?', 'For implant and restorative cases, treatment planning is based on cone beam CT imaging of your jaw. This 3D information helps Dr. Meskin evaluate the area carefully and plan treatment with fewer surprises and more predictable results.'],
        ['Will I meet with Dr. Alan Meskin personally?', 'Yes. Dr. Meskin personally plans and delivers treatment at Hackensack Center, so your first visit is built around a direct specialist evaluation and a treatment plan designed for your specific needs.'],
        ['Can I come in for a second opinion?', 'Absolutely. Many first visits at Hackensack Center are second opinions. If you were given a large treatment plan elsewhere or told an implant could not be saved, Dr. Meskin can review the situation and give you a specialist perspective before you commit.'],
        ['Will I receive a treatment plan at my first visit?', 'After your evaluation and diagnostic review, the team will explain the findings, appropriate treatment options, and recommended next steps. More complex cases may require additional planning before every detail of the final treatment plan is confirmed.'],
        ['Can we review costs, insurance, and financing at my first visit?', 'Yes. Once the recommended options are clear, the team can review estimated treatment costs, available insurance benefits, and financing options so you understand the financial side before deciding how to move forward.'],
      ],
    }),
    consult({
      title: 'Experience Exceptional Dental Care',
      text: 'If an implant has let you down, book a consultation and get an honest, specialist opinion on what can be done. At Hackensack Center for Dental Implants, your comfort, your confidence, and your smile always come first.',
    }),
  ],
});
