/* /contact. Copy: the live page (scrape/pages/contact.md): its H1, its one sentence, its address and
   working hours. The form is the live page's own GoHighLevel booking form (PJjhjcpMEQU8MMCTRpLV) and
   the map its own Google Maps embed; both become Embed blocks on Instatic (embeds.json). The phone,
   languages and service area are the live footer's (docs/facts.md). */
import { page, hero, visit, map } from '../lib/ui.mjs';
import { FACTS, BOOKING_FORM } from '../lib/site.mjs';

const crumbs = [['/contact', 'Contact']];
const tel = `tel:${FACTS.phoneE164}`;

export default page({
  path: '/contact',
  crumbs,
  seo: {
    title: 'Contact Hackensack Center for Dental Implants | Hackensack, NJ',
    description: 'Contact Hackensack Center for Dental Implants in Hackensack, NJ to schedule a consultation, ask about treatment, financing, or directions to our office.',
    image: 'contact-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'Hackensack, New Jersey',
      title: 'Contact Us',
      lead: 'Tell us a little about what brings you in and how you would like us to reach you.',
      image: { src: 'contact-hero.webp', w: 1080, h: 1080, alt: 'The front of the building on Main Street in Hackensack that houses the practice' },
      actions: [{ label: 'Schedule Your Consultation', href: '#consultation' }, { label: `Call ${FACTS.phone}`, href: tel, kind: 'link' }],
    }),
    visit({
      title: FACTS.name,
      details: [
        ['Address', `<a class="visit_link" href="${FACTS.map}" target="_blank" rel="noopener">${FACTS.street}<br>${FACTS.city}, ${FACTS.region} ${FACTS.zip}</a>`],
        ['Phone', `<a class="visit_link" href="${tel}">${FACTS.phone}</a>`],
        ['Working Hours', 'Monday to Friday: 10:00 AM to 6:00 PM<br>Saturday and Sunday: closed'],
        ['Languages', FACTS.languages.join(' · ')],
        ['Serving', FACTS.area],
      ],
      acts: [{ label: 'Get Directions', href: FACTS.map }, { label: `Call ${FACTS.phone}`, href: tel, kind: 'link' }],
      cardTitle: 'Schedule Your Consultation',
      snippet: BOOKING_FORM,
      embedKey: 'ghl-booking',
    }),
    map({}),
  ],
});
