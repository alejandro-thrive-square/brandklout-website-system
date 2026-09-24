export default {
  slug: 'hybrid-dentures',
  title: 'Hybrid Fixed Detachable Dentures in Los Angeles | West LA Implants',
  description: 'Hybrid fixed detachable dentures at West LA Implants: a screw-retained arch on four or more implants that stays in day and night, leaves the palate open, and is unscrewed twice a year for cleaning.',
  image: '/media/img/hybrid-denture-model.jpg',
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Hybrid fixed detachable dentures · Los Angeles',
      title: 'Fixed for you. <em>Detachable</em> for us.',
      lead: 'A hybrid denture is screwed onto four or more implants. You never take it out. Dr. Barriere does, twice a year, for a professional clean, then screws it back.',
      image: { src: '/media/img/hybrid-denture-model.jpg', alt: 'A hybrid fixed denture on its implant framework' },
      actions: [{ href: '#invitation', label: 'Request a Consultation' }, { href: '/zirconia-fixed-bridge.html', label: 'Compare with zirconia', kind: 'text' }],
      meta: [
        { b: '4+', span: 'Implants per arch' },
        { b: 'Screw-retained', span: 'Stays in day and night' },
        { b: 'Open palate', span: 'Taste your food' },
        { b: 'Twice a year', span: 'Professional clean' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/hybrid-denture-model-2.jpg' },
      text: 'A removable denture feels bulky, covers the roof of the mouth, and moves against the ridge until it is sore. A hybrid is the cross between that denture and a fixed bridge.',
      after: ['It suits people who have worn dentures, want fixed teeth, and are not ready for an individual implant for every tooth.'],
    },
    {
      type: 'steps', name: 'The Method', tag: 'The Method', title: 'How a hybrid is <em>built.</em>',
      steps: [
        { title: 'The scan and the plan', text: 'Bone volume decides how many implants the jaw can take and where. A hybrid is often the right answer when there has been considerable bone loss and you do not want more teeth removed than necessary.' },
        { title: 'Implants', text: 'Four or more implants are placed under sedation, guided by the plan. A temporary is worn while they heal.' },
        { title: 'The framework', text: 'Once healed, the implants are fitted with abutments that a metal framework screws onto. The denture teeth are carried on that framework.' },
        { title: 'Fitting and maintenance', text: 'The hybrid is screwed in, the bite is checked, and a small space is left between it and the gum so you can clean underneath. Twice a year it comes out for a professional clean.' },
      ],
      image: { src: '/media/img/surgical-kit.jpg', alt: 'The implant surgical motor used at West LA Implants' },
    },
    {
      type: 'compare', name: 'The Options', tag: 'The Options', title: 'Hybrid, or <em>zirconia?</em>',
      intro: 'Both are fixed full arches. They differ in material and in how they are looked after.',
      columns: [
        { title: 'Removable denture', sub: 'For comparison', rows: ['Rests on gums or snaps on implants', 'Covers the palate', 'Taken out at night', 'Wears and needs relines'], href: '/implant-supported-dentures.html', cta: 'Implant-supported dentures' },
        { title: 'Hybrid fixed denture', sub: 'Acrylic teeth on a metal frame', hot: true, rows: ['Screw-retained on four or more implants', 'Open palate, natural feel', 'Stays in day and night', 'Unscrewed twice a year for cleaning', 'Lower cost than zirconia'] },
        { title: 'Zirconia fixed bridge', sub: 'One solid block', rows: ['Screw-retained on four or more implants', 'Will not stain, chip or wear like acrylic', 'The most natural translucency', 'Highest cost'], href: '/zirconia-fixed-bridge.html', cta: 'Zirconia fixed bridge' },
      ],
    },
    {
      type: 'strip', name: 'The Benefit', tag: 'The Benefit', title: 'Stable, light, and out of the <em>way.</em>',
      lead: 'No movement against the ridge, so no soreness from trapped food and seeds. The upper leaves the roof of the mouth open.',
      body: [
        'Good hygiene is what makes any implant restoration last. The hybrid is designed with that in mind: a gap to clean beneath, and a twice-yearly visit when it comes out entirely.',
      ],
      list: [
        { b: 'No sore spots', span: 'Nothing moves against the ridge' },
        { b: 'Open palate', span: 'Food tastes like food' },
        { b: 'Cleanable', span: 'Space beneath, unscrewed twice a year' },
        { b: 'Stable', span: 'Four or more implants' },
      ],
      photos: [
        { src: '/media/img/patients-eating.jpg', alt: 'Patients enjoying a meal together' },
        { src: '/media/img/implant-post-model.jpg', alt: 'A dental implant post' },
        { src: '/media/img/still-emily-consult.jpg', alt: 'Emily in consultation' },
      ],
      flip: true,
    },
    {
      type: 'faq', name: 'The Questions', title: 'Hybrid <em>questions.</em>',
      items: [
        { q: 'Who is a candidate for a hybrid denture?', a: 'Someone who has worn dentures, wants fixed teeth, and is not ready for an individual implant for every missing tooth. It is also a good answer where there has been considerable bone loss in the jaw.' },
        { q: 'How do I clean it?', a: 'Brush, and clean beneath it with a water flosser or floss threader through the space left for that. Twice a year Dr. Barriere unscrews it for a professional clean.' },
        { q: 'Will it feel like dentures?', a: 'No. It does not cover the palate, it does not move, and it is not taken out. Most patients describe it as feeling like their own teeth.' },
      ],
    },
    {
      type: 'invite', name: 'Invitation', interests: ['Hybrid fixed denture', 'All-on-4 / full arch', 'Implant-supported dentures', 'A second opinion', 'Not sure yet'],
      next: [
        { href: '/zirconia-fixed-bridge.html', label: 'Zirconia fixed bridge', text: 'The premium fixed arch, in one solid block.' },
        { href: '/all-on-4.html', label: 'All-on-4® full arch', text: 'Four implants, a fixed arch, often in a day.' },
        { href: '/implant-cost.html', label: 'What it costs', text: 'The factors, the financing, and the warranty.' },
      ],
    },
  ],
}
