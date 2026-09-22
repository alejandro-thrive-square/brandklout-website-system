/* Dental implants × six Westside neighbourhoods. The gap analysis (§1) found
   the competitor across the street running 31 of these and the client none.
   These are not doorway pages: each carries the full implant journey plus a
   genuinely local chapter (the drive, the landmarks, the parking) and a
   local set of questions. The method and options chapters are shared, on
   purpose: the surgery does not change with the zip code. */

const HOODS = [
  {
    slug: 'brentwood', name: 'Brentwood', prep: 'in',
    drive: 'The practice sits on Brentwood’s southern edge, at Wilshire and Bundy. From San Vicente or Barrington it is a few minutes down the hill; from the VA side, straight along Wilshire.',
    minutes: '5', route: 'down Bundy or Barrington to Wilshire',
    landmarks: 'Brentwood Country Mart, San Vicente Blvd, the Brentwood Village',
    faqLocal: [{ q: 'Where exactly is the office from Brentwood?', a: 'At 12301 Wilshire Blvd, Suite 205, at the corner of Wilshire and Bundy, on Brentwood’s southern edge. Most Brentwood patients are here in about five minutes.' }],
    photo: '/media/img/still-reception-neon.jpg', photoAlt: 'The reception at West LA Implants', patient: 'leslie',
  },
  {
    slug: 'santa-monica', name: 'Santa Monica', prep: 'in',
    drive: 'Wilshire runs straight from Santa Monica to the practice. From Montana Avenue or Ocean Avenue it is a single road east, past the 26th Street shops, to the corner of Bundy.',
    minutes: '10 to 15', route: 'east along Wilshire, with no freeway',
    landmarks: 'Montana Avenue, Santa Monica Pier, Third Street Promenade',
    faqLocal: [{ q: 'Is it easier than driving to a Santa Monica office?', a: 'Often, yes. Wilshire is a straight run east with parking at the building, which avoids the beach traffic and the meters downtown.' }],
    photo: '/media/img/still-front-desk-handshake.jpg', photoAlt: 'A patient greeted at the front desk', patient: 'emily',
  },
  {
    slug: 'westwood', name: 'Westwood', prep: 'in',
    drive: 'From Westwood Village or UCLA, head west on Wilshire past the Federal Building and the practice is on the right at Bundy, before the freeway.',
    minutes: '5 to 10', route: 'west along Wilshire from Westwood Blvd',
    landmarks: 'UCLA, Westwood Village, the Hammer Museum',
    faqLocal: [{ q: 'Do you see UCLA students and staff?', a: 'Yes. Westwood is a few minutes east, most PPO plans are accepted, and the savings plan covers patients without dental insurance.' }],
    photo: '/media/img/waiting-room.jpg', photoAlt: 'The waiting room at West LA Implants', patient: 'michael',
  },
  {
    slug: 'century-city', name: 'Century City', prep: 'in',
    drive: 'From Century City, take Santa Monica Blvd or Wilshire west through Westwood; the practice is at Wilshire and Bundy, just east of the 405.',
    minutes: '15', route: 'west along Wilshire or Santa Monica Blvd',
    landmarks: 'Westfield Century City, Avenue of the Stars, Fox Studios',
    faqLocal: [{ q: 'Can I come from a Century City office at lunch?', a: 'For a consultation or a hygiene visit, easily: about fifteen minutes each way along Wilshire. Surgery under sedation needs a driver and the rest of the day off.' }],
    photo: '/media/img/still-cbct-suite.jpg', photoAlt: 'The CBCT imaging suite at West LA Implants', patient: 'leslie',
  },
  {
    slug: 'culver-city', name: 'Culver City', prep: 'in',
    drive: 'From Culver City, the 405 north to Wilshire is the direct route; Sepulveda or Bundy north work when the freeway does not. The practice is at Wilshire and Bundy.',
    minutes: '15 to 20', route: 'north on the 405 or Sepulveda to Wilshire',
    landmarks: 'Downtown Culver City, the Culver Steps, Sony Pictures',
    faqLocal: [{ q: 'Is there a closer implant office to Culver City?', a: 'There may be nearer chairs. The reasons patients make the drive are the robot-guided surgery, the surgeon who does the grafting and the placement himself, and the free second opinion on cases that were declined elsewhere.' }],
    photo: '/media/img/still-yomi-robot-team.jpg', photoAlt: 'Dr. Barriere and his assistant with the Yomi surgical robot', patient: 'michael',
  },
  {
    slug: 'beverly-hills', name: 'Beverly Hills', prep: 'in',
    drive: 'Wilshire connects Beverly Hills directly to the practice: west past Century City and Westwood to the corner of Bundy. One boulevard, no turns.',
    minutes: '15 to 20', route: 'west along Wilshire the whole way',
    landmarks: 'Rodeo Drive, the Beverly Wilshire, Beverly Gardens Park',
    faqLocal: [{ q: 'Why go west from Beverly Hills for implants?', a: 'For the technology and the surgeon. Yomi® robotic guidance is not something most offices have, and full-arch cases with grafting are done here by one person from scan to final teeth.' }],
    photo: '/media/img/emily-mirror-portrait.jpg', photoAlt: 'Emily seeing her new smile', patient: 'emily',
  },
]

export default HOODS.map((h) => ({
  slug: `dental-implants-${h.slug}`,
  title: `Dental Implants near ${h.name}, CA | West LA Implants on Wilshire Blvd`,
  description: `Dental implants about ${h.minutes} minutes from ${h.name} at West LA Implants, 12301 Wilshire Blvd: robot-guided placement, All-on-4® full arch, grafting and IV sedation.`,
  image: h.photo,
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: `Dental implants near ${h.name} · Wilshire Blvd`,
      title: `Dental implants, <em>minutes</em> from ${h.name}.`,
      lead: `West LA Implants is at Wilshire and Bundy, about ${h.minutes} minutes ${h.route}. Robot-guided implant surgery, full-arch All-on-4®, grafting and IV sedation, all in one suite.`,
      image: { src: h.photo, alt: h.photoAlt },
      actions: [{ href: '#invitation', label: 'Request a Consultation' }, { href: '/dental-implants.html', label: 'How implants work here', kind: 'text' }],
      meta: [
        { b: `${h.minutes} min`, span: `From ${h.name}` },
        { b: 'Yomi®', span: 'Robot-guided placement' },
        { b: 'Parking', span: 'At the building' },
        { b: 'Free', span: 'Second opinions' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/missing-teeth-model.jpg' },
      text: `${h.name} has no shortage of dentists. It has very few rooms with a surgical robot, a CBCT scanner, an in-house lab and a surgeon who does the grafting and the placement himself.`,
      after: ['That is what the short drive along Wilshire buys: one plan, one surgeon, one roof, from the first scan to the final tooth.'],
    },
    {
      type: 'strip', name: 'The Drive', tag: 'The Drive', title: `From ${h.name} to the <em>chair.</em>`,
      lead: h.drive,
      body: [
        `Landmarks on the way or nearby: ${h.landmarks}. The building has parking; the front desk will tell you the current arrangement when you book.`,
        'Sedation patients need a driver home, which for most of ' + h.name + ' means a short ride for a friend or family member.',
      ],
      list: [
        { b: '12301 Wilshire Blvd', span: 'Suite 205, at Bundy' },
        { b: 'Mon to Fri', span: '9am to 5pm' },
        { b: '(310) 692-9316', span: 'New patients' },
        { b: 'Zocdoc', span: 'Book a time online' },
      ],
      actions: [{ href: '/contact.html', label: 'Directions and hours', kind: 'text' }],
      photos: [
        { src: '/media/img/practice-full.jpg', alt: 'Dr. Barriere at West LA Implants' },
        { src: '/media/img/still-reception-neon.jpg', alt: 'The reception' },
        { src: '/media/img/still-cbct-suite.jpg', alt: 'The CBCT suite' },
      ],
    },
    {
      type: 'steps', name: 'The Method', tag: 'The Method', title: 'The same four visits, <em>wherever</em> you live.',
      intro: 'Every implant here is planned on a 3D scan and placed along that plan with robotic guidance.',
      steps: [
        { title: 'The consultation', text: 'A cone-beam CT scan, an honest read on your bone and your options, and a plan you can see on screen. Second opinions are free, including on cases declined elsewhere.' },
        { title: 'Foundation, if needed', text: 'Where bone has receded, grafting or a sinus lift rebuilds it first, in the same suite, by the same surgeon.' },
        { title: 'Placement', text: 'Under IV or oral sedation, the implant is placed with Yomi® robotic guidance to the position, angle and depth in the plan. Temporary teeth often go on the same day.' },
        { title: 'The final tooth', text: 'After three or more months of healing, the custom crown, bridge or zirconia arch is fitted. Every implant carries a one-year warranty on the materials.' },
      ],
      image: { src: '/media/img/still-yomi-closeup.jpg', alt: 'The Yomi robotic guidance arm' },
    },
    {
      type: 'compare', name: 'The Options', tag: 'The Options', title: 'One tooth, several, or an <em>arch.</em>',
      columns: [
        { title: 'Single implant', sub: 'One tooth', rows: ['One root, one crown', 'Neighbouring teeth untouched', 'Keeps the bone alive'] },
        { title: 'Implant bridge', sub: 'Several teeth', rows: ['Two or more implants carry a bridge', 'No healthy teeth ground down', 'Fixed, not removable'], href: '/zirconia-fixed-bridge.html', cta: 'Zirconia bridges' },
        { title: 'Full arch', sub: 'All-on-4®', hot: true, rows: ['Four or more implants per arch', 'A fixed set of teeth, often the same day', 'Nearly all bite force restored'], href: '/all-on-4.html', cta: 'All-on-4® full arch' },
      ],
      note: 'Loose dentures can also be stabilised on two or more implants; see implant-supported dentures.',
    },
    {
      type: 'proof', name: 'The Proof', patient: h.patient, title: 'A patient, in <em>their</em> words.',
      text: 'One of the three patients who agreed to be filmed for the practice’s channel.',
    },
    {
      type: 'faq', name: 'The Questions', title: `Questions from <em>${h.name}.</em>`,
      items: [
        ...h.faqLocal,
        { q: 'Do you accept my insurance?', a: 'Most PPO carriers, in network, with the claim filed for you. Six financing partners and an in-house savings plan cover the rest. The front desk checks your benefits before the visit.' },
        { q: 'Can I get a second opinion on a quote from another office?', a: 'Yes, and it is free. Bring the plan or the scan; Dr. Barriere reads it and tells you what he would do differently.' },
        { q: 'What if I am nervous?', a: 'Most patients are. IV, oral and nitrous sedation are available, along with blankets, headphones and Netflix in the chair. The team speaks English and Spanish.' },
      ],
    },
    {
      type: 'invite', name: 'Invitation', title: `A short drive from ${h.name}, a long way from <em>guesswork.</em>`, lead: 'A consultation is a scan, an honest read, and a plan. Request one, or call.',
      interests: ['Dental implants', 'All-on-4 / full arch', 'A second opinion', 'IV sedation', 'Not sure yet'],
      next: [
        { href: '/dental-implants.html', label: 'Dental implants', text: 'The treatment, step by step.' },
        { href: '/implant-cost.html', label: 'What implants cost', text: 'The factors, the financing, the warranty.' },
        { href: '/contact.html', label: 'Directions', text: 'Address, hours and parking.' },
      ],
    },
  ],
}))
