export default {
  slug: 'implant-supported-dentures',
  title: 'Implant-Supported Dentures in Los Angeles | West LA Implants',
  description: 'Implant-supported dentures at West LA Implants: a denture secured to two or more implants so it cannot slip, with no adhesives and less bone loss. Removable or fixed, planned in 3D on Wilshire Blvd.',
  image: '/media/img/denture-patient-renewed.jpg',
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Implant-supported dentures · Los Angeles',
      title: 'A denture that <em>stays</em> where you put it.',
      lead: 'Two or more implants in the jaw hold the denture by a ball or bar attachment. It clicks on, it does not slide, and you never buy adhesive again.',
      image: { src: '/media/img/denture-patient-renewed.jpg', alt: 'A denture patient smiling after treatment at West LA Implants' },
      actions: [{ href: '#invitation', label: 'Request a Consultation' }, { href: '/all-on-4.html', label: 'Compare with a fixed arch', kind: 'text' }],
      meta: [
        { b: '2+', span: 'Implants per arch' },
        { b: 'No paste', span: 'Ever again' },
        { b: 'Removable', span: 'Or fixed, your choice' },
        { b: 'Often', span: 'Your own denture, reused' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/dentures-patient-eating.jpg' },
      text: 'A denture that rests on the gums has nothing to hold on to, and the bone under it keeps shrinking, so the fit only gets worse.',
      after: ['Implants change both halves of that. They anchor the denture, and they give the bone a root to hold on to.'],
    },
    {
      type: 'compare', name: 'The Options', tag: 'The Options', title: 'Conventional or <em>supported.</em>',
      intro: 'The same denture shape, a different foundation.',
      columns: [
        { title: 'Traditional denture', sub: 'Rests on the gums', rows: ['Removable', 'Lasts five years or more', 'Eventually needs adhesives', 'Allows bone recession', 'Limits food choices'] },
        { title: 'Implant-supported denture', sub: 'Snaps onto implants', hot: true, rows: ['Removable or fixed', 'Lasts ten years or more', 'Secured by two or more implants', 'Limits bone recession', 'Expands food choices'] },
        { title: 'Fixed full arch', sub: 'All-on-4®', rows: ['Fixed, never removed', 'Lasts decades', 'Four or more implants', 'Prevents bone recession', 'No dietary limits'], href: '/all-on-4.html', cta: 'All-on-4® full arch' },
      ],
    },
    {
      type: 'steps', name: 'The Method', tag: 'The Method', title: 'How the denture gets its <em>roots.</em>',
      steps: [
        { title: 'Consultation', text: 'A scan and impressions, a conversation about what your current denture does and does not let you do, and a plan. Most patients qualify already; the rest usually can after grafting.' },
        { title: 'Placement', text: 'Implants go where the jaw is densest, usually toward the front. Sedation keeps it comfortable. In many cases your existing denture is adapted to fit them.' },
        { title: 'Healing', text: 'Three or more months while the implants integrate. A temporary denture, or your adapted one, is worn throughout.' },
        { title: 'The attachment', text: 'Ball or bar attachments are fitted and the final denture clicks on. It can be made removable for cleaning or permanently attached.' },
      ],
      image: { src: '/media/img/still-doctor-xray-screen.jpg', alt: 'Dr. Barriere planning an implant case on screen' },
    },
    {
      type: 'strip', name: 'The Benefit', tag: 'The Benefit', title: 'Bite, chew, laugh, <em>forget</em> about it.',
      lead: 'Biting pressure moves from the gums to the implants, so the denture stops rubbing and the bone stops receding.',
      body: [
        'Patients describe the same thing in different words: a meal without thinking about the denture, a conversation without a hand near the mouth.',
        'The upfront cost is higher than a conventional denture and lower than a fixed arch. Over the years it usually saves the relines, the adjustments and the replacements.',
      ],
      list: [
        { b: 'No slipping', span: 'Anchored by implants' },
        { b: 'No adhesives', span: 'Snaps into place' },
        { b: 'Less bone loss', span: 'Implants stimulate the jaw' },
        { b: 'Wider diet', span: 'Chew with confidence' },
      ],
      photos: [
        { src: '/media/img/older-couple-smiling.jpg', alt: 'A couple smiling together' },
        { src: '/media/img/hybrid-denture-model.jpg', alt: 'An implant-retained denture on its bar' },
        { src: '/media/img/still-front-desk-handshake.jpg', alt: 'A patient greeted at the front desk' },
      ],
    },
    {
      type: 'proof', name: 'The Proof', patient: 'michael', title: 'From loose to <em>fixed.</em>',
      text: 'Michael’s full mouth reconstruction replaced failing teeth with a stable arch. His film is on the practice’s channel.',
    },
    {
      type: 'faq', name: 'The Questions', title: 'Denture <em>questions.</em>',
      items: [
        { q: 'Can my existing denture be used?', a: 'Often, yes. Many dentures can be adapted to snap onto the new implants, which keeps the cost down and the shape you are used to.' },
        { q: 'How many implants does it take?', a: 'Two or more per arch for a removable design. More implants give more support and open the door to a fixed arch instead.' },
        { q: 'Removable or fixed?', a: 'A removable design is taken out for cleaning; a fixed one stays in and is cleaned like teeth. Dr. Barriere will recommend one based on your bone, your hygiene and what you want.' },
        { q: 'What does it cost?', a: 'More upfront than a conventional denture, less than All-on-4®, and quoted after a scan. Insurance, six financing partners and the in-house savings plan are on the financing page.' },
      ],
    },
    {
      type: 'invite', name: 'Invitation', interests: ['Loose or failing dentures', 'Implant-supported dentures', 'All-on-4 / full arch', 'A second opinion', 'Not sure yet'],
      next: [
        { href: '/missing-teeth.html', label: 'Loose dentures', text: 'Why they slip, and the ways to stop it.' },
        { href: '/hybrid-dentures.html', label: 'Hybrid fixed dentures', text: 'Screw-retained, fixed, with an open palate.' },
        { href: '/financing.html', label: 'Financing', text: 'Six lenders, most PPO plans, a savings plan.' },
      ],
    },
  ],
}
