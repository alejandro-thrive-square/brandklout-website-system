/* /the-practice — the hub for everything beyond the chair (BugHerd #60, Asana 1219333478027729), as
   workflows/21-instatic-upload/apply-bugherd-round3.mjs (HUBS) built it on the live site: a split cover,
   the practice pages as photo cards, and the invitation (the sedation page's, which the live page was
   cloned from) with its own "where next". */
import fs from 'node:fs'
import { FILMS, filmHref } from '../lib/site.mjs'

const ORIGIN = JSON.parse(fs.readFileSync(new URL('../seo.json', import.meta.url), 'utf8')).origin.replace(/\/$/, '')
const TITLE = 'The Practice | West LA Implants, Los Angeles'
const CARDS = [
  { href: '/our-practice.html', title: 'Our team', text: 'The people who run the day, and the rooms where the work happens.', image: '/media/img/staff.jpg', pos: '100% 50%' },
  { href: '/what-to-expect.html', title: 'Your first visit', text: 'What happens in the first hour, the implant path, and the instructions for after surgery.', image: '/media/img/doctor-patient-2.jpg', pos: '50% 30%' },
  { href: '/faq.html', title: 'Questions', text: 'The questions the practice hears most about implants, answered plainly.', image: '/media/img/still-emily-consult.jpg', pos: '60% 20%' },
  { href: '/blog.html', title: 'Journal', text: 'Forty-six short entries on what patients ask, from candidacy to recovery.', image: '/media/img/front-desk-emily.jpg', pos: '50% 40%' },
  { href: '/referring-doctors.html', title: 'Referring doctors', text: 'For dentists referring implant, grafting, extraction and sedation cases.', image: '/media/img/barriere_dentalpatient_welcoming_westlaimplants3.jpg', pos: '100% 40%' },
  { href: '/contact.html', title: 'Contact', text: 'Address, hours, both phone lines and online booking.', image: '/media/img/front-desk-leslie.jpg', pos: '50% 40%' },
]

export default {
  slug: 'the-practice',
  title: TITLE,
  description: 'Meet the West LA Implants team, see what happens at a first visit, read the questions and the journal, refer a patient or contact the practice on Wilshire Blvd.',
  image: '/media/img/still-reception-neon.jpg',
  jsonld: [{ '@type': 'CollectionPage', name: TITLE, url: `${ORIGIN}/the-practice`, hasPart: CARDS.map((c) => ({ '@type': 'WebPage', name: c.title, url: ORIGIN + c.href.replace(/\.html$/, '') })) }],
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'The practice · 12301 Wilshire Blvd',
      title: 'The people and <em>the place.</em>',
      lead: 'Who will look after you, what happens at your first visit, the questions patients ask most, and how to reach the front desk.',
      image: { src: '/media/img/still-reception-neon.jpg', pos: '60% 50%', alt: 'The reception at West LA Implants' },
      // the live link has no target: it was cloned from an internal link (js/75-films.js opens Vimeo links in its lightbox)
      actions: [{ href: '#invitation', label: 'Book a Visit' }, { href: filmHref(FILMS.welcome), label: 'Watch: welcome to West LA Implants', kind: 'text' }],
      meta: [
        { b: 'Wilshire', span: 'Suite 205' },
        { b: 'English & Spanish', span: 'Spoken by the team' },
        { b: 'Mon to Fri', span: '9am to 5pm' },
        { b: 'Free', span: 'Second opinions' },
      ],
    },
    {
      type: 'postindex', name: 'The Practice', hub: true, id: 'practice', tag: 'The practice', title: 'Everything beyond <em>the chair.</em>',
      lead: 'The team, the visit, the answers and the way in.',
      cards: CARDS,
    },
    {
      type: 'invite', name: 'Invitation', title: 'Schedule the one you’ll <em>keep.</em>', lead: 'Tell us how you feel about the dentist. The plan starts there.',
      interests: ['IV sedation', 'Dental implants', 'All-on-4 / full arch', 'General dentistry', 'Not sure yet'],
      next: [
        { href: '/dr-tony-barriere.html', label: 'Dr. Barriere', text: 'The surgeon who plans and places every implant.' },
        { href: '/results.html', label: 'Results', text: 'Before and after, and patients on film.' },
        { href: '/surgery-and-care.html', label: 'Surgery & care', text: 'Sedation, grafting, extractions and everyday care.' },
      ],
    },
  ],
}
