/* /office-gallery. Copy: the live page (scrape/pages/office-gallery.md): its H1 and its one paragraph.
   The live page showed four photographs; this one shows the practice's own rooms from the client's
   drive (2026-09-14), the live site and stills from the two patient films. "Take a look inside" is the
   live page's own meta description. */
import { page, hero, photos, consult } from '../lib/ui.mjs';

const crumbs = [['/about', 'About'], ['/office-gallery', 'Office Gallery']];
const ph = (src, w, h, alt) => ({ src, w, h, alt });

export default page({
  path: '/office-gallery',
  crumbs,
  seo: {
    title: 'Office Gallery in Hackensack, NJ | Hackensack Center for Dental Implants',
    description: 'Take a look inside Hackensack Center for Dental Implants in Hackensack, NJ, from our reception and treatment rooms to our on-site dental lab.',
    image: 'office-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      variant: 'wide',
      tagline: 'Hackensack, New Jersey',
      title: 'Office Gallery',
      lead: 'Located in the heart of Hackensack, NJ, our office is built around one goal: making specialist-level dental care feel calm, comfortable, and unhurried.',
      image: { src: 'office-hero.webp', w: 2400, h: 1100, alt: 'The lounge of the waiting area, with grey sofas, flowers and blue abstract paintings' },
      actions: [],
    }),
    photos({
      name: 'The Rooms',
      tagline: 'From Reception To The Lab',
      title: 'Take a look inside.',
      intro: 'Every space, from the reception area to the treatment rooms to our on-site dental lab, is designed for the kind of precise, focused work Dr. Meskin does.',
      list: [
        ph('office-reception.webp', 1600, 1100, 'The curved reception desk under a round ceiling light'),
        ph('office-waiting.webp', 1080, 1080, 'The waiting room by the front windows'),
        ph('office-operatory.webp', 1080, 1080, 'A treatment room with an orange dental chair'),
        ph('office-surgery.webp', 1600, 1080, 'A treatment room set up for implant surgery'),
        ph('office-scanner.webp', 1080, 1080, 'A patient positioned in the 3D cone beam CT scanner'),
        ph('office-lab.webp', 675, 675, 'The on-site dental lab with a design screen and an articulator'),
        ph('office-exterior.webp', 1600, 1100, 'The building on Main Street in Hackensack'),
        ph('office-room.webp', 1080, 1080, 'A treatment room with two orange chairs and a screen on the wall'),
      ],
    }),
    consult({}),
  ],
});
