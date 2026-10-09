import { FILMS, filmHref } from '../lib/site.mjs'

export default {
  slug: 'cosmetic-dentistry',
  title: 'Cosmetic Dentistry in Los Angeles: Veneers, Whitening, Invisalign® & Smile Makeovers | West LA Implants',
  description: 'Cosmetic dentistry at West LA Implants: porcelain veneers and Lumineers® in as few as two visits, Zoom teeth whitening in one, Invisalign® clear aligners, crowns, bonding and full smile makeovers, planned with smile simulation.',
  image: '/media/img/veneer-patient.jpg',
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Cosmetic dentistry · Los Angeles',
      title: 'The smile you stopped <em>hiding.</em>',
      lead: 'Veneers, whitening, Invisalign®, crowns and complete makeovers, designed to your face and shown to you on screen before anything begins.',
      image: { src: '/media/img/veneer-patient.jpg', pos: '60% 40%', alt: 'A cosmetic dentistry patient smiling' },
      actions: [{ href: '#invitation', label: 'Request a Smile Evaluation' }, { href: filmHref(FILMS.cosmetic), label: 'Watch: three transformative procedures', kind: 'text', ext: true }],
      meta: [
        { b: 'Two visits', span: 'For veneers or Lumineers®' },
        { b: 'One hour', span: 'Zoom whitening' },
        { b: 'Simulation', span: 'See the after, first' },
        { b: 'AACD', span: 'Dr. Barriere is a member' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/doctor-cosmetic.jpg' },
      text: 'Discoloured, chipped, gapped, uneven, crowded. Most cosmetic flaws are small. What they do to a person’s confidence is not.',
      after: ['A smile makeover is a plan, not a product: the fewest procedures that fix what actually bothers you, in the right order, to a design you have already seen.'],
    },
    {
      type: 'rail', name: 'The Treatments', tag: 'The Treatments', title: 'Seven ways to <em>change</em> a smile.',
      cards: [
        { title: 'Porcelain veneers & Lumineers®', text: 'Thin porcelain shells over the front of the teeth that show when you smile. Chips, gaps, discolouration and worn edges fixed at once, in as few as two visits.', image: { src: '/media/img/ba-veneers-2-after.jpg', alt: 'Upper teeth after porcelain veneers' } },
        { title: 'Zoom teeth whitening', text: 'Professional light-activated gel, gums protected, several shades lighter in about an hour, with little or no sensitivity.', image: { src: '/media/img/whitening-patient.jpg', alt: 'A teeth whitening patient' } },
        { title: 'Invisalign®', text: 'Clear removable aligners worn 20 to 22 hours a day, straightening crooked teeth and closing gaps without brackets or wires.', image: { src: '/media/img/invisalign-patient.jpg', pos: '70% 50%', alt: 'A patient fitting an Invisalign aligner' } },
        { title: 'Crowns & bridges', text: 'Porcelain caps that restore a cracked, broken or misshapen tooth, and fixed bridges to replace missing ones. Same-day crowns are available.', image: { src: '/media/img/implant-crown-model.jpg', alt: 'A crown on an implant' } },
        { title: 'Inlays, onlays & bonding', text: 'Tooth-coloured repairs for teeth that do not need a full crown, and composite fillings that replace the grey of amalgam.', image: { src: '/media/img/hygienist-procedure.jpg', pos: '70% 50%', alt: 'A patient in the chair for a tooth-coloured repair' } },
        { title: 'Gum contouring', text: 'Laser crown lengthening for a gummy smile, reshaping the gum line so the teeth are in proportion.', image: { src: '/media/img/patient-smiling.jpg', pos: '70% 30%', alt: 'A patient smiling after treatment' } },
        { title: 'Smile makeover', text: 'A combination, planned on your scan and photographs, that improves each tooth and the symmetry of the whole smile against your lips and face.', image: { src: '/media/img/emily-makeover.jpg', alt: 'Emily during her smile makeover' } },
      ],
      end: { title: 'Which of these is yours?', label: 'Ask Dr. Barriere', href: '#invitation' },
    },
    {
      type: 'steps', name: 'The Method', tag: 'The Method', title: 'From flawed to <em>finished.</em>',
      steps: [
        { title: 'The evaluation', text: 'What you would change, and what you would not. A scan, photographs, and a look at the symmetry of your smile against your lips, gums and skin tone.' },
        { title: 'The design', text: 'Smile simulation shows the after before you commit. Veneer shade, tooth shape and proportion are chosen with you, not for you.' },
        { title: 'The work', text: 'Veneers in two visits: minimal enamel preparation and a digital scan, then bonding. Whitening in one visit. Invisalign® over months. A makeover in the order that gets you there fastest.' },
        { title: 'The reveal', text: 'Brush and floss as usual, keep your hygiene visits, and expect the result to last for years. Porcelain resists staining; enamel-coloured composite can be refreshed.' },
      ],
      image: { src: '/media/img/patient-smile-portrait-2.jpg', pos: '50% 50%', alt: 'A West LA Implants patient smiling after her treatment' }, // BugHerd #93
    },
    {
      type: 'proof', name: 'The Proof', title: 'Veneers, before and <em>after.</em>',
      before: '/media/img/ba-veneers-1-before.jpg', after: '/media/img/ba-veneers-1-after.jpg', beforeAlt: 'Teeth before porcelain veneers', afterAlt: 'Teeth after porcelain veneers',
      text: 'A porcelain veneer case from the practice’s gallery. Chips, colour and proportion corrected in two visits.',
      film: { href: '/results.html#gallery', label: 'See more cases' },
    },
    {
      type: 'faq', name: 'The Questions', title: 'Cosmetic <em>questions.</em>',
      items: [
        { q: 'Am I a candidate for veneers?', a: 'If chipped, crooked, cracked, gapped, crowded, discoloured or worn teeth make you uncomfortable smiling, almost certainly. Veneers fix cosmetic flaws, not functional ones; the evaluation sorts which is which.' },
        { q: 'How white can whitening go?', a: 'Several shades in one session, with a shade chosen to look natural against your skin and eyes. Results last long-term with good hygiene and some care over staining foods.' },
        { q: 'Does Invisalign work for adults?', a: 'Yes. Virtually all patients without complex bite problems are candidates. Treatment typically runs from a few months to about two years, and the aligners are nearly invisible.' },
        { q: 'What does a smile makeover cost?', a: 'It depends entirely on which treatments the design calls for. The evaluation ends with a written plan and a quote, and the financing page lists the ways patients pay, including a savings plan discount on Invisalign®.' },
        { q: 'Can I see the result before I start?', a: 'Yes. Smile simulation shows your after on screen at the evaluation, for veneers, Invisalign® and implants alike.' },
      ],
    },
    {
      type: 'invite', name: 'Invitation', title: 'Complete a short smile <em>evaluation.</em>', lead: 'Whether you are a candidate, a simulation of the result, pricing and options, and time with Dr. Barriere himself.',
      formTitle: 'Request a smile evaluation',
      interests: ['Veneers or Lumineers®', 'Teeth whitening', 'Invisalign®', 'A smile makeover', 'Not sure yet'],
      next: [
        { href: '/results.html', label: 'Results', text: 'Veneers, whitening and Invisalign® before and after.' },
        { href: '/general-dentistry.html', label: 'General dentistry', text: 'Cleanings, crowns and the everyday care.' },
        { href: '/financing.html', label: 'Financing', text: 'Six lenders and a savings plan with Invisalign® discounts.' },
      ],
    },
  ],
}
