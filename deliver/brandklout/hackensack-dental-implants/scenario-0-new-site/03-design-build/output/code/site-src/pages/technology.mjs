/* /technology. Copy: the live page (scrape/pages/technology.md; lists placed from
   mirror/raw-html/technology.html), placed, not rewritten.
   Placed: each of the eight technologies (an H2, a paragraph and three lines on the live page) is its own
   chapter, in the live order, the layout varied: split, checks, statement, split, index, statement,
   checks, split. In a statement the paragraph's first sentence is the scroll-written lead; in checks and
   index the paragraph is the intro and the three lines the items. The closing section ("Ready to
   Experience State of the Art Dental Care for Yourself?") is the consultation chapter: its heading, its
   sentence, and its three bold lead-ins with their text as the three reasons (the lead-ins' colons
   dropped, the bold already sets them apart).
   Left out: the "Jump to section" menu (the chapters replace it); the "Start Your Virtual Consultation"
   button (to /contact; the consultation form is on this page now); "Reimagine your dental experience"
   and the footer's address, hours and languages blocks.
   No phone number, practice name or review count needed changing; no fact changes. */
import { page, hero, split, checks, statement, index, consult, p, ul } from '../lib/ui.mjs';

const crumbs = [['/about', 'About'], ['/technology', 'Our Technology']];

export default page({
  path: '/technology',
  crumbs,
  seo: {
    title: 'Our Dental Technology in Hackensack, NJ | Hackensack Center',
    description: 'The dental technology behind precise implant care in Hackensack, NJ: on-site lab, 3D cone beam imaging, CAD/CAM, and same-day restorations at Hackensack Center.',
    image: 'technology-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'Inside The Practice',
      title: 'Our Technology',
      lead: 'Modern implant and restorative work depends on precision, and precision depends on the tools. At Hackensack Center, we invest in the equipment that lets Dr. Meskin diagnose more accurately, plan every case in detail, and finish treatment with a level of fit and comfort that older systems cannot match.',
      image: { src: 'technology-hero.webp', w: 768, h: 768, alt: 'The CAD/CAM milling unit beside its design screen' },
    }),
    split({
      name: 'The Lab',
      tagline: 'In-House',
      title: 'On-Site Dental Lab',
      body: p('Most dental practices ship your crown, bridge, or full-arch restoration to an outside lab and wait weeks for it to come back. We do it in-house. Dr. Meskin works alongside the lab technician in the same room, adjusting your case together instead of sending it out and hoping the fit is right when it returns.'),
      list: ['Faster turnaround, including same-day restorations where appropriate', 'Direct communication between the doctor and the lab, so no detail gets lost', 'Custom shade and shape matching done with your teeth in front of us, not from a photo'],
      image: { src: 'technology-lab.webp', w: 571, h: 675, alt: 'The on-site dental lab: a design screen and an articulator holding a model' },
    }),
    checks({
      name: '3D Printers',
      tagline: 'In-Office Printing',
      title: '3D Printers',
      intro: p('An in-office 3D printer produces the physical parts of your case on demand. Surgical guides that translate the 3D plan for your implant surgery into a precise physical template. Temporary teeth so you never leave with a gap. Study models used to try in and refine your final restoration before it is made permanent.'),
      items: ['Custom surgical guides printed to make implant placement more precise', 'Same-day temporary teeth built to fit while your final work is being made', 'Accurate physical models for try-in and adjustment before anything permanent'],
      image: { src: 'technology-3d-printers.webp', w: 939, h: 768, alt: 'A technician lifting a printed jaw model out of a 3D printer' },
    }),
    statement({
      name: 'Cone Beam CT',
      tagline: '3D Imaging',
      title: '3D Imaging (Cone Beam CT)',
      lead: 'A cone beam CT scan captures a full three-dimensional view of your teeth, jaw, and the structures around them in a single quick pass.',
      body: p('For implant work, this is the most important piece of technology in the office. Every implant Dr. Meskin places is planned against your actual anatomy, not against a flat picture of it.')
        + ul(['Every implant planned in 3D around your bone, nerves, and sinuses', 'Bone quantity and quality measured precisely, so we know what your site can hold', 'Painless, quick, and delivered at a fraction of the radiation of a medical CT scan']),
      image: { src: 'technology-cone-beam.webp', w: 1000, h: 900, alt: 'A patient positioned in the cone beam CT scanner' },
    }),
    split({
      name: 'Photogrammetry',
      tagline: 'Full-Arch Cases',
      title: 'Photogrammetry',
      body: p('Photogrammetry uses a specialized camera to capture the exact 3D position of your implants down to a fraction of a millimeter. For full-arch cases like All-on-X, that level of precision is the difference between a restoration that fits comfortably from day one and one that has to come back for adjustment after adjustment.'),
      list: ['Captures implant position with far greater accuracy than traditional impressions', 'Especially important for full-arch cases, where the smallest error compounds across every tooth', 'Fewer follow-up visits to adjust the fit of your final teeth'],
      image: { src: 'technology-photogrammetry.webp', w: 650, h: 768, alt: 'The iCam4D photogrammetry camera' },
      reverse: true,
    }),
    index({
      name: 'CAD / CAM',
      tagline: 'Digital Design',
      title: 'CAD / CAM',
      intro: p('CAD/CAM combines computer design with automated manufacturing to produce restorations with a precision the human hand cannot match. Your crown, bridge, or veneer is designed digitally against a scan of your mouth, then milled from a solid block of ceramic to those exact specifications.'),
      items: [
        { title: 'Fit and finish designed digitally, milled to exact specifications' },
        { title: 'Solid ceramic construction that is stronger and more natural-looking than layered materials' },
        { title: 'Many restorations can be finished in-house without shipping out and waiting' },
      ],
    }),
    statement({
      name: 'Intra-Oral Camera',
      tagline: 'Chairside Imaging',
      title: 'Intra-Oral Camera',
      lead: 'A small, pen-shaped camera reaches areas of your mouth that a regular mirror cannot show clearly and puts the images up on a screen so you can see them too.',
      body: p('It turns your visit into a conversation, because you see exactly what Dr. Meskin sees when he explains what a tooth needs.')
        + ul(['Detailed views of cracks, wear, and old restorations that a mirror misses', 'Real-time images on screen, so you understand what is happening in your own mouth', 'Better documentation for your records and insurance claims']),
    }),
    checks({
      name: 'Intra-Oral Scanner',
      tagline: 'Digital Impressions',
      title: 'Intra-Oral Scanner',
      intro: p('A digital scanner replaces the tray of putty most people remember from old impressions. A small wand captures a full 3D image of your teeth in a few minutes, comfortable enough that patients often do not realize the impression is finished. The scan feeds straight into the plan for your crown, bridge, or implant restoration.'),
      items: ['No more gagging on impression putty or waiting for it to set', 'Fully digital, so your case moves straight to the lab without shipping delays', 'More accurate impressions, especially for implant crowns and bridges'],
      image: { src: 'technology-intraoral-scanner.webp', w: 707, h: 578, alt: 'An intra-oral scanner and its 3D scan on screen' },
    }),
    split({
      name: 'Digital X-Ray',
      tagline: 'Diagnostics',
      title: 'Digital X-Ray',
      body: p('Digital sensors capture detailed images of your teeth almost instantly, with a fraction of the radiation of traditional film. Because the images appear on screen right away, Dr. Meskin can point directly to what he sees and explain it, rather than sending you home to wait for results.'),
      list: ['Roughly 90 percent less radiation than older film-based systems', 'Images available on screen within seconds', 'Enhanced clarity for earlier detection of decay, cracks, and hidden infection'],
      image: { src: 'technology-digital-x-ray.webp', w: 1100, h: 1300, alt: 'A digital scan of the teeth and jaw on a screen' },
    }),
    consult({
      tagline: 'Your Visit',
      title: 'Ready to Experience State of the Art Dental Care for Yourself?',
      text: 'Better tools mean less time in the chair, more accurate work, and results built to last. Here is what that adds up to at your visit.',
      reasons: [
        ['Enhanced Diagnostics', '3D imaging and intra-oral cameras find problems older tools miss, so we can catch them earlier and treat them more conservatively.'],
        ['Comfortable Experience', 'Digital scanning, laser tools, and precise printed guides cut both the number of visits and the discomfort at each one.'],
        ['Lasting Results', 'Every implant planned in 3D, every crown milled to fit, every restoration matched by hand. Work that fits right, lasts.'],
      ],
    }),
  ],
});
