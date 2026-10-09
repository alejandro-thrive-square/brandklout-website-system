export default {
  slug: 'bone-grafting',
  title: 'Bone Grafting, Sinus Lift & Ridge Augmentation in Los Angeles | West LA Implants',
  description: 'Bone grafting at West LA Implants rebuilds the jaw before implants: socket preservation after extraction, ridge augmentation, ridge splitting and sinus lifts, all done by the same surgeon who places the implant.',
  image: '/media/img/bone-graft-model.jpg',
  jsonld: [{ '@type': 'MedicalProcedure', name: 'Dental bone grafting', procedureType: 'Surgical', bodyLocation: 'Jaw', provider: { '@id': '/#practice' } }],
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Bone grafting · sinus lift · ridge augmentation',
      title: 'Rebuild the foundation <em>first.</em>',
      lead: 'Bone shrinks where a tooth is missing. Grafting puts it back, so an implant has something solid to hold, and so a smile has a natural gum line to emerge from.',
      image: { src: '/media/img/bone-graft-model.jpg', alt: 'A model of bone graft material placed in the jaw' },
      actions: [{ href: '#invitation', label: 'Request a Consultation' }, { href: '/failing-dental-implants.html', label: 'Told you have too little bone?', kind: 'text' }],
      meta: [
        { b: 'Socket', span: 'Preservation after extraction' },
        { b: 'Ridge', span: 'Augmentation and splitting' },
        { b: 'Sinus', span: 'Lift for the upper back jaw' },
        { b: 'Same surgeon', span: 'Graft and implant' },
      ],
    },
    {
      type: 'steps', name: 'The Method', tag: 'The Method', title: 'From scan to solid <em>bone.</em>', // BugHerd #82: moved up to sit right after the cover
      steps: [
        { title: 'The scan', text: 'A cone-beam CT measures bone height, width and density and shows where the sinuses and nerves sit. That decides whether grafting is needed at all, and which kind.' },
        { title: 'The graft', text: 'Under local anaesthetic or sedation, the gum is lifted, graft material is placed where bone has receded, and the site is closed. A membrane often protects it while it heals.' },
        { title: 'Healing', text: 'The graft fuses with your own bone over a few months. Instructions cover cold foods and fluids on the first day, no spitting or straws, no strenuous exercise for 48 hours, and no dentures on the site for two weeks.' },
        { title: 'The implant', text: 'Once the scan shows solid bone, the implant is placed with Yomi® guidance, by the same surgeon, in the same suite.' },
      ],
      image: { src: '/media/img/ridge-augmentation-model.jpg', alt: 'A 3D model of a ridge augmentation' },
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/jaw-bone-loss.jpg' },
      text: 'Roots keep the jaw alive. Without them the bone resorbs, the ridge thins, the lips lose their support and the face ages ahead of its time.',
      after: ['Many patients arrive having been told they no longer qualify for implants. Bone loss is reversible. It is a matter of rebuilding it, and of a surgeon who does that routinely.'],
    },
    {
      type: 'compare', name: 'The Procedures', tag: 'The Procedures', title: 'Three ways to rebuild bone <em>support.</em>',
      intro: 'Chosen from the scan. Some patients need one, some none, some a combination.',
      columns: [
        { title: 'Socket preservation', sub: 'At the time of extraction', rows: ['Graft material packed into the empty socket', 'Slows resorption where the tooth was', 'Keeps the site ready for an implant', 'Done in the same visit as the extraction'] },
        { title: 'Ridge augmentation', sub: 'Height and width', hot: true, rows: ['Rebuilds the contour of the jaw ridge', 'Gum tissue lifted, graft placed, ridge reshaped', 'Also ridge splitting for a ridge too narrow to hold an implant', 'Implant placed once healed, usually after a few months'] },
        { title: 'Sinus lift', sub: 'Upper back jaw', rows: ['The sinus floor migrates down after upper molars are lost', 'The membrane is gently elevated and graft placed beneath it', 'A minimally invasive technique', 'Implants placed at the same time or later'] },
      ],
      note: 'Graft material comes from you, from a donor bank, or is synthetic. Dr. Barriere explains which at the consultation.',
    },
    {
      type: 'strip', name: 'The Standard', tag: 'The Standard', title: 'One surgeon for the graft <em>and</em> the implant.',
      lead: 'The person who rebuilds the bone is the person who places the implant into it. Nothing is handed off.',
      body: [
        'Grafting is the reason the practice can take cases other offices decline, and the reason its full-arch work is not limited to patients with perfect bone.',
        'Post-operative guidelines for grafting and sinus lifts are on the first-visit page, and the office answers after-hours calls for surgical patients.',
      ],
      list: [
        { b: 'Declined elsewhere?', span: 'Free second opinion' },
        { b: 'Sedation', span: 'IV or oral, for any graft' },
        { b: 'After-hours line', span: 'For surgical patients' },
        { b: 'Insurance', span: 'Most PPO plans, claims filed' },
      ],
      actions: [{ href: '/what-to-expect.html#instructions', label: 'Post-operative guidelines', kind: 'text' }],
      photos: [
        { src: '/media/img/hygienist-procedure.jpg', pos: '80% 40%', alt: 'A hygiene visit at West LA Implants' }, // BugHerd #83
        { src: '/media/img/cbct-emily.jpg', pos: '90% 40%', alt: 'A patient positioned for a 3D cone-beam scan' }, // BugHerd #84
        { src: '/media/img/sinus-lift-graphic.jpg', pos: '80% 50%', alt: 'Illustration of a sinus lift adding bone beneath the sinus' }, // BugHerd #85
      ],
      flip: true,
    },
    {
      type: 'faq', name: 'The Questions', title: 'Grafting <em>questions.</em>',
      items: [
        { q: 'Do I need a bone graft?', a: 'Only the scan can say. Many patients need none; others need a small socket graft at extraction; a few need a ridge or sinus procedure before a full arch. All three are done here.' },
        { q: 'Where does the graft material come from?', a: 'From your own bone, from a donor bone bank, or from a synthetic material, depending on the site and the volume needed. Donor and synthetic grafts are processed to be safe and are the norm for sinus lifts.' },
        { q: 'Does a sinus lift hurt?', a: 'It is done under local anaesthetic or sedation and most patients report pressure rather than pain, with some swelling for a few days. The guidelines ask you not to blow your nose or fly for a short period while it heals.' },
        { q: 'How long until the implant?', a: 'A socket graft may allow the implant in the same visit or a few months later. Ridge and sinus grafts usually heal for several months before the implant is placed.' },
      ],
    },
    {
      type: 'invite', name: 'Invitation', title: 'Bring the scan, or get one <em>here.</em>', lead: 'If you have been told there is not enough bone, a second opinion is free.',
      interests: ['Bone grafting', 'A sinus lift', 'A second opinion', 'Dental implants', 'Not sure yet'],
      next: [
        { href: '/dental-implants.html', label: 'Dental implants', text: 'What comes after the graft.' },
        { href: '/tooth-extractions.html', label: 'Tooth extractions', text: 'Where socket preservation begins.' },
        { href: '/missing-teeth.html', label: 'Bone loss', text: 'Why it happens and what it does to a face.' },
      ],
    },
  ],
}
