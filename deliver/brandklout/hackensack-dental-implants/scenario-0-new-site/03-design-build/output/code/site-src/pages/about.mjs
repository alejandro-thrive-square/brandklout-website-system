/* /about. Copy: the live page (scrape/pages/about.md; the letter, the doctor cards, the technology tabs
   and the "why choose" grid placed from mirror/raw-html/about.html), placed, not rewritten.
   Placed: the letter under the hero has no heading on the live page, so its own first sentence is the
   chapter's heading and its last paragraph, signed "-Dr. Alan Meskin", is set as his quote. The
   technology tabs (five labels, a text each) are a numbered index rather than a split: the page needs
   three scroll-driven chapters (README) and the five texts stay visible; its "Explore Our Technology"
   button is the link after them. The numbers are the home page's own four, labels verbatim.
   Left out: the one-line blurb under each doctor's photo and the "More About Dr. ..." buttons (team()
   cards carry name, role and school and link to each doctor's page); the bare "Schedule Your
   Consultation" buttons; "Start Your Journey to Better Dental Health Today / Request an Appointment and
   Start Your Smile Journey Today." (a bare call to action under the grid; the consultation chapter
   follows); the links three grid items carried on the live page (lab to /technology, sedation to
   /services/sedation, financing to /insurance-financing): features() items are not links;
   "Reimagine your dental experience" and the footer's address, hours and languages blocks.
   Changed: the heading "WHY CHOOSE HACKENSACK CENTER / for DENTAL IMPLANTS", typed in capitals with a
   line break, is set in title case; "every treatment room has its own TV for longer appointments" takes
   a capital and a full stop; the doctors appear in the live page's order (Meskin, Srour, Lee, Klass).
   Fact change: "163 Main Street, Suite A" in the location answer is "Suite A1", the suite on every other
   page and in docs/facts.md. No phone number, practice name or review count needed changing. */
import { page, hero, statement, quote, numbers, team, index, features, films, faq, consult, p } from '../lib/ui.mjs';

const crumbs = [['/about', 'About']];

export default page({
  path: '/about',
  crumbs,
  seo: {
    title: 'About Our Implant Practice | Hackensack Center, NJ',
    description: 'Learn about Hackensack Center for Dental Implants in Hackensack, NJ, led by prosthodontist Dr. Alan Meskin.',
    image: 'about-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      variant: 'wide',
      tagline: 'Hackensack, New Jersey',
      title: 'About Hackensack Center for Dental Implants',
      lead: 'Hackensack Center for Dental Implants is a specialist practice built around one focus: replacing and restoring teeth exceptionally well. Led by prosthodontist Dr. Alan Meskin, we combine advanced technology, an on-site lab, and genuinely personal care to rebuild smiles that look natural and last.',
      image: { src: 'about-hero.webp', w: 2400, h: 1100, alt: 'The curved reception desk of the practice under a round ceiling light' },
    }),
    statement({
      name: 'The Practice',
      tagline: 'From Dr. Meskin',
      title: 'Dr. Alan Meskin built this practice on a simple idea: that rebuilding a smile is as much about the person as the teeth.',
      lead: 'As a prosthodontist, he completed years of specialty training at NYU focused entirely on replacing and restoring teeth, and he has devoted his career to the work a lot of general offices refer out, from full-arch implants to complex, full-mouth reconstruction.',
      body: p('That experience adds up. Three decades of implant and reconstructive work, with thousands of implants placed and over 1,000 full-arch cases completed. Every one of them was planned in 3D before it began, and the teeth themselves were designed and crafted in our own on-site lab, so nothing gets shipped out and lost in a handoff. It means fewer visits, tighter quality control, and a result made to fit your face rather than pulled from a catalog.'),
      more: p('Just as important is how the practice feels. Many of the people who come to us have put off care for years, often because a past experience left them anxious or embarrassed. We built the opposite of that: a calm, judgment-free place on Main Street where questions are welcome, comfort comes first, and care is offered in English, Spanish, and Russian.'),
      image: { src: 'about-letter.webp', w: 1000, h: 900, alt: 'The waiting-room lounge: dark tufted seating and flowers on the table' },
    }),
    quote({
      name: 'The Pledge',
      text: 'Our pledge is straightforward. We will help you understand your options honestly, plan the path that genuinely fits your needs and your budget, and stay with you from the first consultation to the final smile. Thank you for visiting, and we look forward to meeting you.',
      cite: 'Dr. Alan Meskin',
    }),
    numbers({
      name: 'In Numbers',
      items: [
        { count: 5, decimals: 1, value: '5.0', label: 'Five-star Google rating' },
        { count: 50000, suffix: '+', value: '50,000+', label: 'Implants placed by our surgeons' },
        { count: 30, suffix: '+', value: '30+', label: 'Years of combined implant experience' },
        { count: 4, value: '4', label: 'Implant specialists under one roof' },
      ],
    }),
    team({
      name: 'The Doctors',
      tagline: 'Our Specialists',
      title: 'Exceptional Doctors, Extraordinary Care',
      intro: p('Complex implant cases are rarely a one-person job. Our team brings together a prosthodontist, two oral and maxillofacial surgeons, and a periodontist, each trained at a top dental school and each focused on a different part of your treatment. You get specialist-level care at every stage, coordinated under one roof, without being sent across town between offices.'),
      list: ['meskin', 'srour', 'lee', 'klass'],
    }),
    index({
      name: 'The Technology',
      tagline: 'Digital Planning',
      title: 'The Technology Behind Better Implant Results',
      intro: p('Precision is what separates an implant that lasts decades from one that fails early. Every case here is planned digitally before any treatment begins, which means fewer surprises, fewer appointments, and a result that fits the way it was designed to.'),
      items: [
        { title: 'Cone Beam 3D Imaging', body: p('A three-dimensional scan of your jaw that shows exactly where the bone is, where the nerves and sinuses sit, and where each implant can be placed safely. This is where your treatment is planned, before anything else happens.') },
        { title: 'Digital X-rays', body: p('Detailed images captured in seconds with significantly less radiation than traditional film. Dr. Meskin can show you what he sees on screen during your visit, so you understand your diagnosis rather than just hearing it.') },
        { title: 'Intraoral Scanners', body: p('A small handheld scanner takes a precise digital impression of your mouth without the mess of putty trays. Faster, far more comfortable, and accurate down to the detail your final teeth depend on.') },
        { title: '3D Printing', body: p('Surgical guides, models, and provisional teeth printed in-house in our own lab. It is what allows us to place implants exactly where they were planned and hand you a new smile the same day.') },
        { title: 'CAD/CAM Design', body: p('Your new teeth are designed digitally, down to the shape, shade, and how they meet your bite, then produced with computer-guided precision rather than by hand. It is what lets us match a result to your face instead of pulling from a catalog.') },
      ],
      after: p('<a href="/technology">Explore Our Technology →</a>'),
    }),
    features({
      name: 'Why Choose Us',
      tagline: 'The Difference',
      title: 'Why Choose Hackensack Center for Dental Implants',
      intro: p('We are a specialist practice, not a general office that also does implants. That difference shows up in how your case is planned, who performs your treatment, and how you are treated while you are here.'),
      image: { src: 'about-features.webp', w: 1920, h: 800, alt: 'A patient sees her new smile in a hand mirror in the treatment chair' },
      items: [
        { title: 'Decades of Combined Experience', text: 'Three decades of implant and reconstructive work, with thousands of implants placed and over 1,000 full-arch cases completed. This is advanced specialty care from people who do it every day, not occasionally.' },
        { title: 'Specialist-Led at Every Stage', text: 'Your surgery is performed by an oral surgeon or periodontist. Your restoration is designed and finished by a prosthodontist. You are never handed to a generalist for the part that matters most.' },
        { title: 'Our Own On-Site Lab', text: 'Your teeth are designed and crafted in our own lab, in the same building, by a technician who works directly with Dr. Meskin. That means fewer visits, tighter control over the result, and adjustments made in hours rather than weeks.' },
        { title: 'Comprehensive Care Under One Roof', text: 'Implants, full-mouth rehabilitation, periodontal treatment, oral surgery, Invisalign, and routine hygiene. Whatever your mouth needs, it is handled here, by our own team.' },
        { title: 'Care in Three Languages', text: 'Dr. Meskin and our team provide care in English, Spanish, and Russian, so you can ask questions and understand your options in the language you think in.' },
        { title: 'Sedation for Anxious Patients', text: 'A full range of sedation options is available, up to IV sedation. If fear is the reason you have been putting off care, tell us when you book and we will plan around it.' },
        { title: 'Flexible Financing', text: 'We will find a way. We work with Cherry, CareCredit, Proceed, and HFD, and our treatment coordinators will help you find a plan that fits your budget.' },
        { title: 'A TV in Every Room', text: 'Every treatment room has its own TV for longer appointments.' },
        { title: 'Aromatherapy Throughout the Office', text: 'No clinical smell. Aromatherapy runs throughout the office, so walking in does not immediately remind you of every appointment you have been dreading.' },
      ],
    }),
    films({
      tagline: 'Patient Stories',
      title: 'Real Patients, Real Stories',
      intro: 'Hear from patients who rebuilt their entire smile and got their comfort and confidence back, in their own words.',
    }),
    faq({
      items: [
        ['What makes Hackensack Center different?', 'We are a specialist practice focused on implants and restorative dentistry, led by a prosthodontist, with an on-site lab and care in three languages. That combination is unusual, and it is what lets us take on the complex cases many general offices refer out.'],
        ['What is a prosthodontist?', 'A prosthodontist is a dental specialist who completed years of additional training beyond dental school, focused specifically on replacing and restoring teeth. For implants, full-arch work, and cosmetic reconstruction, that specialization means more predictable, natural-looking results.'],
        ['Do you only do implants?', 'No. Implants are our primary focus, but Dr. Meskin also does full-mouth reconstruction and cosmetic smile makeovers. Whatever your smile needs, it can be handled under one roof.'],
        ['Where are you located?', 'We are at 163 Main Street, Suite A1, in Hackensack, serving the greater Bergen County area.'],
        ['Do you offer financing?', 'Yes. We work with Cherry, HFD, Proceed, and CareCredit, and our treatment coordinators will help you find a plan that fits. We also verify any insurance benefits up front.'],
      ],
    }),
    consult({
      text: 'Schedule your consultation today and see how different dental care can feel. At Hackensack Center for Dental Implants, your comfort, your confidence, and your smile are always our priority.',
    }),
  ],
});
