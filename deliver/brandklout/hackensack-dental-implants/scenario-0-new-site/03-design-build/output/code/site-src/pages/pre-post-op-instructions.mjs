/* /pre-post-op-instructions. Copy: the live page (scrape/pages/pre-post-op-instructions.md, checked
   against mirror/raw-html/pre-post-op-instructions.html). The live page is its H1, one paragraph and
   three blog cards; it carries no instruction copy of its own (the instructions are the three posts).
   Structure: the paragraph's opening question heads the chapter of post cards and the rest of the
   paragraph is that chapter's intro, so the cards have a heading without one being written. The card
   titles and summaries are the live cards' (the posts' own titles); "Read More" is the live button.
   Too short for scroll-driven chapters: none is possible without writing copy.
   Left out: the link on "Dr. Meskin" in the paragraph (to /dr-alan-meskin), the live cards' images
   (the CMS's post thumbnails; slots here), the stock toothbrush photo, and the footer blocks.
   Facts: no second phone number, no "Arvada", no review count on the live page. */
import { page, hero, links, consult } from '../lib/ui.mjs';

const crumbs = [['/first-visit-expectations', 'Patients'], ['/pre-post-op-instructions', 'Pre-Op & Post-Op Instructions']];

export default page({
  path: '/pre-post-op-instructions',
  crumbs,
  seo: {
    title: 'Implant Post-Op Care in Hackensack, NJ | Hackensack Center',
    description: 'Dental implant pre-op and post-op instructions from Hackensack Center for Dental Implants in Hackensack, NJ. Recovery guidance.',
    image: 'pre-post-op-instructions-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'Before & After Treatment',
      title: 'Pre & Post op Instructions',
      image: { src: 'pre-post-op-instructions-hero.webp', w: 1080, h: 1080, alt: 'A patient handed his paperwork at the front desk' },
    }),
    links({
      name: 'The Guides',
      tagline: 'Aftercare Guides',
      title: 'Have treatment coming up or just had a procedure done?',
      intro: '<p>Clear, step-by-step instructions from Dr. Meskin, so you know exactly what to do before your appointment and how to care for your smile afterward, without guessing.</p>',
      items: [
        {
          href: '/blog/foods-to-eat-and-avoid-after-dental-implant-surgery',
          title: 'Foods To Eat (And Avoid) After Dental Implant Surgery: A Complete Guide',
          text: 'A practical guide to what to eat and avoid after dental implant surgery in Hackensack, NJ, with a week-by-week recovery diet to support healing.',
          label: 'Read More',
          image: { src: 'pre-post-op-card-1.webp', w: 900, h: 700, alt: 'A tray of soft foods and drinks: a banana, a smoothie and milk' },
        },
        {
          href: '/blog/all-on-x-recovery-day-after-same-day-teeth-surgery',
          title: 'All-On-X Recovery: What To Expect The Day After Same-Day Teeth Surgery',
          text: 'A day-by-day All-On-X recovery guide for patients in Hackensack, NJ, covering the first 48 hours after same-day teeth surgery.',
          label: 'Read More',
          image: { src: 'pre-post-op-card-2.webp', w: 900, h: 700, alt: 'A full arch of teeth on implants (3D illustration)' },
        },
        {
          href: '/blog/dental-implant-recovery-week-by-week-aftercare-guide',
          title: 'Dental Implant Recovery: Your Complete Week-By-Week Aftercare Guide',
          text: 'A detailed week-by-week guide to dental implant recovery in Hackensack, NJ. What to expect, what to eat, and how to support successful healing.',
          label: 'Read More',
          image: { src: 'pre-post-op-card-3.webp', w: 900, h: 700, alt: 'An electric toothbrush, cotton pads and swabs' },
        },
      ],
    }),
    consult({}),
  ],
});
