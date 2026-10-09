import { FILMS, yt } from '../lib/site.mjs'

export default {
  slug: 'dental-implants',
  title: 'Dental Implants in Los Angeles | West LA Implants',
  description: 'Dental implants planned in 3D and placed with Yomi® robotic guidance at West LA Implants on Wilshire Blvd. One tooth, several, or a full arch, under one roof with IV sedation.',
  image: '/media/img/still-doctor-xray-screen.jpg',
  jsonld: [{ '@type': 'MedicalProcedure', name: 'Dental implant surgery', procedureType: 'Surgical', bodyLocation: 'Jaw', howPerformed: 'Robot-guided implant placement planned from a CBCT scan', provider: { '@id': '/#practice' } }],
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Dental implants · Wilshire Blvd, Los Angeles',
      title: 'A tooth that is <em>yours</em> again.',
      lead: 'A dental implant is a titanium root, a connector and a crown. Placed well, it looks, feels and works like the tooth it replaces, for decades.',
      image: { src: '/media/img/stock-index-cosmetic.jpg', pos: '40% 40%', alt: 'A veneer shade guide held against a smile' }, // BugHerd #40
      actions: [{ href: '#invitation', label: 'Request a Consultation' }, { href: '/technology.html', label: 'See how it is placed', kind: 'text' }],
      meta: [
        { b: 'One roof', span: 'Scan, surgery, teeth' },
        { b: 'Yomi®', span: 'Robot-guided placement' },
        { b: 'IV sedation', span: 'Sleep through it' },
        { b: 'Same day', span: 'Temporary teeth, often' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/missing-teeth-model.jpg' },
      text: 'A missing tooth is never only a gap. The bone beneath it starts to recede within months, the neighbours drift, and the bite changes.',
      after: ['An implant is the only replacement that puts a root back in the bone and keeps it alive. That is why it is the standard of care, and why the planning matters more than the drill.'],
      /* BugHerd #38: the dental implant services beside the statement */
      services: { label: 'Dental implant services', current: '/dental-implants', links: [
        ['/dental-implants', 'Dental implants'], ['/all-on-4', 'All-on-4® full arch'], ['/implant-supported-dentures', 'Implant-supported dentures'],
        ['/hybrid-dentures', 'Hybrid fixed dentures'], ['/zirconia-fixed-bridge', 'Zirconia fixed bridge'], ['/failing-dental-implants', 'Failing implants'],
        ['/implant-cost', 'Implant cost'], ['/financing', 'Insurance &amp; financing'],
      ] },
    },
    {
      type: 'steps', name: 'The Method', tag: 'The Method', title: 'Four visits, one <em>plan.</em>',
      intro: 'Every case is planned digitally before anything is touched, then placed along that plan.',
      steps: [
        { title: 'The consultation', text: 'A 3D cone-beam scan, an honest read on your bone and your options, and a plan you can see on screen. Dr. Barriere offers free second opinions, including for cases other offices have declined.' },
        { title: 'Foundation, if needed', text: 'Where bone has receded, a graft or a sinus lift rebuilds it first. Many patients need none.' },
        { title: 'Placement', text: 'Under IV or oral sedation, the implant is placed with Yomi® robotic guidance to the position, angle and depth in the plan. A temporary tooth often goes on the same day.' },
        { title: 'The final tooth', text: 'After three or more months of healing, a custom zirconia or porcelain crown is fitted. From then on you brush it, floss it and forget it.' },
      ],
      image: { src: '/media/img/front-desk-emily.jpg', pos: '60% 40%', alt: 'The front desk at West LA Implants' }, // BugHerd #47
    },
    {
      type: 'compare', name: 'The Options', tag: 'The Options', title: 'How many teeth, how <em>much</em> support.',
      intro: 'Implants replace one tooth, several, or all of them. The design changes with the count.',
      columns: [
        { title: 'Single implant', sub: 'One tooth', rows: ['One root, one crown', 'Neighbouring teeth untouched', 'Keeps the bone alive', 'Brush and floss as usual'] },
        { title: 'Implant bridge', sub: 'Several teeth in a row', rows: ['Two or more implants carry a bridge', 'No healthy teeth ground down', 'Fixed, not removable', 'Fewer implants than teeth'], href: '/zirconia-fixed-bridge.html', cta: 'Zirconia bridges' },
        { title: 'Full arch', sub: 'All upper or lower teeth', hot: true, rows: ['Four or more implants per arch', 'A fixed set of teeth, often the same day', 'Restores nearly all bite force', 'No adhesives, nothing removed at night'], href: '/all-on-4.html', cta: 'All-on-4® full arch' },
      ],
      note: 'Loose or failing dentures can also be stabilised on two or more implants. That is a different design, described on the implant-supported dentures page.',
    },
    {
      type: 'strip', name: 'The Standard', tag: 'The Standard', title: 'Placed by the same hands that <em>plan</em> them.',
      lead: 'Dr. Barriere plans, places and restores every implant himself, with the diagnostics and the lab work in the same suite.',
      body: [
        'That continuity is the point. The person who read your scan is the person holding the handpiece, and the person who fits the final crown.',
        'He trained at The Ohio State University College of Dentistry, completed a yearlong surgical residency at NYU Langone Hospital, and has logged more than a thousand hours of continuing education in implant and cosmetic dentistry.',
      ],
      list: [
        { b: 'CBCT', span: '3D imaging on every case' },
        { b: 'Yomi®', span: 'Robotic guidance, no free-hand guessing' },
        { b: 'One-year warranty', span: 'On every implant the practice places' },
        { b: 'Second opinions', span: 'Free, including declined cases' },
      ],
      actions: [{ href: '/dr-tony-barriere.html', label: 'Meet Dr. Barriere', kind: 'text' }],
      photos: [
        { src: '/media/img/still-doctor-xray-screen.jpg', pos: '70% 40%', alt: 'Dr. Barriere reviewing X-rays on the operatory screen' }, // BugHerd #48
        { src: '/media/img/still-doctor-masked.jpg', alt: 'Dr. Barriere in surgery' },
        { src: '/media/img/implant-crown-model.jpg', alt: 'Two implants supporting a three-tooth bridge' },
      ],
    },
    {
      type: 'proof', name: 'The Proof', patient: 'emily', title: 'The result, in <em>her</em> words.',
      text: 'Emily replaced failing teeth with crowns and dental implants. Her film is on the practice’s channel.',
    },
    {
      type: 'faq', name: 'The Questions', title: 'What people ask <em>first.</em>', lead: 'Short answers. The consultation gives you the long ones, for your own mouth.',
      items: [
        { q: 'Am I a candidate for dental implants?', a: 'Most adults are, or can become one after bone grafting or an extraction. Bone volume, gum health and general health decide it, and a 3D scan settles it in one visit. Dr. Barriere gives free second opinions on cases other dentists have declined.' },
        { q: 'Does the surgery hurt?', a: 'It is done under sedation and local anaesthetic. Most patients report pressure rather than pain, and mild soreness for a few days afterwards that over-the-counter medication handles.' },
        { q: 'How long does the whole process take?', a: 'From a few months to about a year. Placement can often follow the consultation closely. Healing takes three or more months before the final tooth goes on, and a temporary usually fills the gap.' },
        { q: 'What do dental implants cost?', a: 'It depends on how many teeth, the materials, and whether grafting is needed, so the practice quotes after a scan, never before. Six financing partners, most PPO plans and an in-house savings plan are on the financing page.' },
        { q: 'How long do implants last?', a: 'They are designed to last decades and can last a lifetime with normal brushing, flossing and check-ups. The practice backs every implant it places with a one-year warranty on the materials.' },
        { q: 'What if I was told I have too little bone?', a: 'Bone can be rebuilt. Grafting, sinus lifts and ridge augmentation are done here, by the same surgeon, before the implant goes in.' },
      ],
    },
    {
      type: 'invite', name: 'Invitation', interests: ['A single dental implant', 'Several missing teeth', 'All-on-4 / full arch', 'A second opinion', 'Not sure yet'],
      next: [
        { href: '/all-on-4.html', label: 'All-on-4® full arch', text: 'A fixed set of teeth on four implants, often in a day.' },
        { href: '/implant-cost.html', label: 'What implants cost', text: 'The factors, the financing, and the warranty.' },
        { href: '/technology.html', label: 'The technology', text: 'Yomi®, CBCT, guides and the in-house lab.' },
      ],
    },
  ],
}
