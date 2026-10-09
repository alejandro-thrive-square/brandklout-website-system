/* /dental-implant-faqs. Copy: the live page (scrape/pages/dental-implant-faqs.md; all thirteen
   question and answer pairs checked against mirror/raw-html/dental-implant-faqs.html), verbatim.
   The live page is its H1 and the FAQ list, with no intro copy of its own, so this page has no
   statement or checks chapter and no scroll-driven chapter at all: adding one would mean writing copy.
   Left out: the "Schedule Your Consultation" button under the H1 (the hero buttons replace it) and
   the footer blocks.
   Facts: no second phone number, no "Arvada", no review count on the live page. The cost answer's
   figures are the live page's: $3,599, $8,999 and $13,999 per arch. */
import { page, hero, faq, consult } from '../lib/ui.mjs';

const crumbs = [['/first-visit-expectations', 'Patients'], ['/dental-implant-faqs', 'Dental Implant FAQs']];

export default page({
  path: '/dental-implant-faqs',
  crumbs,
  seo: {
    title: 'Dental Implant FAQs | Hackensack Center for Dental Implants',
    description: 'Answers to common questions about dental implants in Hackensack, NJ. Cost, pain, recovery, candidacy, and financing at Hackensack Center for Dental Implants.',
    image: 'dental-implant-faqs-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'Patient Questions',
      title: 'Dental Implant FAQs',
      image: { src: 'dental-implant-faqs-hero.webp', w: 1080, h: 1080, alt: 'Isaac, a patient of the practice, talking about his treatment' },
    }),
    faq({
      items: [
        ['Do dental implants hurt?', 'The procedure itself is painless. Your mouth is fully numbed before anything begins, and sedation is available up to IV level. Afterward, soreness is usually mild, peaks around days one to three, and most patients manage it with over-the-counter pain relief. Most people describe the whole experience as far easier than they expected.'],
        ['Will I have temporary teeth during healing?', 'In most cases, yes. For full-arch treatment, most patients leave with fixed temporary teeth the same day. For a single implant in a visible area, a temporary solution keeps you smiling while the implant heals. You are never sent home with a gap.'],
        ['Do dental implants feel like real teeth?', 'Yes. Once fully healed and restored, most patients cannot tell the difference. They are fixed in place, so there is nothing to remove, no adhesive, and no slipping.'],
        ['How long do dental implants last?', 'With proper care, dental implants can last a lifetime. The titanium implant integrates permanently with your bone. The crown or bridge on top is designed to last many years and can be replaced without disturbing the implant.'],
        ['How do I care for my implants?', 'The same way you care for natural teeth: brush twice a day, floss daily, and keep up with regular check-ups. Dr. Meskin and the team schedule maintenance visits to keep everything healthy long term.'],
        ['Will I need to miss work?', 'A single implant may only need a day. Full-arch surgery typically means a few days of rest, with most patients back to work within four to seven days. Your timeline is discussed in advance so you can plan around it.'],
        ['What if I am missing a lot of teeth?', 'We treat everything from a single missing tooth to the complete loss of all teeth in one or both arches. All-on-X replaces a full arch with four to six implants, often with fixed teeth the same day.'],
        ['I was told I do not have enough bone. Can I still get implants?', 'Often yes. Bone loss that would have ruled someone out years ago can frequently be worked around today with grafting and 3D-guided planning. A scan is the only way to know for sure.'],
        ['What are the risks?', 'Dental implants have a very high success rate. As with any surgical procedure, there is a small chance of complications. If an implant does not integrate, it can usually be replaced successfully. Every case is planned with 3D imaging to minimize risk.'],
        ['Is sedation available?', 'Yes. We offer a full range of sedation up to IV level. Your health history and suitability are evaluated before any sedation is recommended, and you are monitored continuously throughout.'],
        ['How much do dental implants cost?', 'It depends on the treatment. A single tooth implant starts at $3,599, an implant bridge at $8,999, and full-arch All-on-X at $13,999 per arch. You receive a clear written estimate at your consultation.'],
        ['Do you offer financing?', 'Yes. We work with Cherry, HFD, Proceed, and CareCredit. Our treatment coordinators will help you find a plan that fits, and we verify any insurance benefits up front.'],
        ['Why see a prosthodontist for implants?', 'A prosthodontist completes years of specialty training focused entirely on replacing and restoring teeth. For full-arch, cosmetic, or complex cases, that depth of training means a more predictable, natural-looking result.'],
      ],
    }),
    consult({}),
  ],
});
