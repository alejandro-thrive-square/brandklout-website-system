export default {
  slug: 'all-on-4',
  title: 'All-on-4® Full Arch Dental Implants in Los Angeles | West LA Implants',
  description: 'All-on-4® full mouth dental implants at West LA Implants: a fixed arch of zirconia teeth on four or more implants, planned in 3D, placed with Yomi® guidance, with temporary teeth the same day.',
  image: '/media/img/still-leslie-smile-tablet.jpg',
  jsonld: [{ '@type': 'MedicalProcedure', name: 'All-on-4 full arch dental implants', procedureType: 'Surgical', howPerformed: 'Four or more implants per arch carrying a fixed zirconia bridge, placed with robotic guidance', provider: { '@id': '/#practice' } }],
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'All-on-4® full arch · Los Angeles',
      title: 'A whole arch of teeth, <em>fixed</em> in place.',
      lead: 'When most or all of the teeth in a jaw are failing, four or more implants can carry a complete, fixed set. You leave surgery with temporary teeth and come back for the final zirconia arch.',
      image: { src: '/media/img/still-leslie-smile-tablet.jpg', alt: 'Leslie holding up a photo of her new full-arch smile' },
      actions: [{ href: '#invitation', label: 'Request a Consultation' }, { href: '/implant-cost.html', label: 'What it costs', kind: 'text' }],
      meta: [
        { b: '4+', span: 'Implants per arch' },
        { b: 'Same day', span: 'Temporary teeth' },
        { b: 'Zirconia', span: 'Final fixed bridge' },
        { b: 'IV sedation', span: 'For the surgery' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/painful-dentures.jpg' },
      text: 'Covering your mouth when you smile. Avoiding the photograph. Cutting the steak into pieces. A failing arch takes small things first.',
      after: ['All-on-4® gives the arch back at once. It is the treatment the practice is built around, and it is the one Leslie, Emily and Michael chose.'],
    },
    {
      type: 'compare', name: 'The Options', tag: 'The Options', title: 'Three ways to replace an <em>arch.</em>',
      intro: 'Dr. Barriere offers all three and will say plainly which one fits your bone, your health and your budget.',
      columns: [
        { title: 'Traditional dentures', sub: 'Removable', rows: ['Rest on the gums', 'Last five years or more', 'Usually need adhesives', 'Allow the bone to recede', 'Limit what you can eat'] },
        { title: 'Implant-supported dentures', sub: 'Removable or fixed', rows: ['Secured by two or more implants', 'Last ten years or more', 'Limit bone recession', 'Expand food choices', 'Lower cost than a fixed arch'], href: '/implant-supported-dentures.html', cta: 'Implant-supported dentures' },
        { title: 'All-on-4® full arch', sub: 'Fixed', hot: true, rows: ['Secured by four or more implants', 'Last decades to a lifetime', 'Prevent bone recession', 'No dietary limits', 'Nearly all bite force restored'] },
      ],
    },
    {
      type: 'steps', name: 'The Method', tag: 'The Method', title: 'The West LA Implants <em>process.</em>',
      intro: 'Planned from a 3D scan, placed along the plan, restored in the same suite.',
      steps: [
        { title: 'Your first visit', text: 'A cone-beam CT scan of your mouth and jaw shows where the bone is strongest and what needs treating first. From the scan the plan is built and, where a guide is used, a 3D-printed chrome guide is made to fit only you.' },
        { title: 'The day of surgery', text: 'Under IV, oral or nitrous sedation, any remaining teeth are removed and four or more titanium or zirconia implants are placed into the chosen sites, with Yomi® robotic guidance. TeethToday® means you leave with temporary nanoceramic teeth.' },
        { title: 'Healing', text: 'Over three to four months the implants fuse with the bone. You eat soft foods, then everything else. The temporary teeth stay in the whole time.' },
        { title: 'The final teeth', text: 'A fixed zirconia bridge, milled from a single block, is fitted and checked for bite and comfort. It will not stain, chip or come out at night.' },
      ],
      image: { src: '/media/img/still-yomi-robot-team.jpg', alt: 'Dr. Barriere and his assistant with the Yomi surgical robot' },
    },
    {
      type: 'strip', name: 'The Standard', tag: 'The Standard', title: 'Difficult cases are the <em>usual</em> ones here.',
      lead: 'Patients arrive having been declined elsewhere. Severe bone loss, failed grafts, failing implants placed by someone else.',
      body: [
        'Dr. Barriere offers a free second opinion on every full-arch case. If the bone is not there, it is rebuilt first, in the same suite.',
        'The practice backs every implant it places with a one-year warranty on the materials.',
      ],
      list: [
        { b: 'Free second opinion', span: 'Including declined cases' },
        { b: 'Bone rebuilt in house', span: 'Grafts, sinus lifts, ridge work' },
        { b: 'Zirconia', span: 'One solid block, no acrylic base' },
        { b: 'One-year warranty', span: 'On every implant placed' },
      ],
      actions: [{ href: '/failing-dental-implants.html', label: 'Failing implants', kind: 'text' }],
      photos: [
        { src: '/media/img/full-arch-model.jpg', alt: 'A full-arch implant bridge on its four implants' },
        { src: '/media/img/still-doctor-masked.jpg', alt: 'Dr. Barriere in surgery' },
        { src: '/media/img/zirconia-model.jpg', alt: 'A zirconia fixed bridge' },
      ],
      flip: true,
    },
    {
      type: 'proof', name: 'The Proof', patient: 'leslie', title: 'Leslie’s <em>arch.</em>',
      text: 'A full arch on All-on-4®. Her film is on the practice’s channel.',
    },
    {
      type: 'faq', name: 'The Questions', title: 'Before you <em>decide.</em>',
      items: [
        { q: 'Can I really get teeth the same day?', a: 'In most full-arch cases, yes. Temporary nanoceramic teeth are fitted at the end of surgery, and the final zirconia bridge follows after three to four months of healing.' },
        { q: 'Is All-on-4 the same as full mouth dental implants?', a: 'Yes. All-on-4® is the name for a fixed full-arch bridge on four or more implants. Some cases use five or six implants, which is the same idea with more support.' },
        { q: 'What if I have severe bone loss?', a: 'Implants are angled to use the strongest bone, and where that is not enough the bone is rebuilt with grafting or a sinus lift first. Being declined elsewhere is a reason to come, not a reason to stay away.' },
        { q: 'How do I clean a fixed arch?', a: 'Like teeth. Brush, floss under the bridge with a water flosser or floss threader, and keep your hygiene visits. The bridge does not decay; the gums around it still need care.' },
        { q: 'How much does All-on-4 cost?', a: 'It is quoted after a scan, because implant count, grafting and materials change it. The financing page lists six lenders, the insurance carriers the practice is in network with, and the in-house savings plan.' },
      ],
    },
    {
      type: 'invite', name: 'Invitation', interests: ['All-on-4 / full arch', 'Loose or failing dentures', 'A second opinion', 'IV sedation', 'Not sure yet'],
      next: [
        { href: '/zirconia-fixed-bridge.html', label: 'Zirconia fixed bridge', text: 'The material the final arch is made from.' },
        { href: '/implant-supported-dentures.html', label: 'Implant-supported dentures', text: 'The removable alternative, on two or more implants.' },
        { href: '/results.html', label: 'Results', text: 'Before and after, and three patients on film.' },
      ],
    },
  ],
}
