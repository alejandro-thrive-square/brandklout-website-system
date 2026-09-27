export default {
  slug: 'faq',
  title: 'Dental Implant FAQ: Cost, Pain, Recovery, Candidacy | West LA Implants, Los Angeles',
  description: 'Straight answers to the questions patients ask West LA Implants about dental implants: what they are, who qualifies, what surgery and recovery are like, how long they last, and how to care for them.',
  image: '/media/img/emily-practice.jpg',
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Questions · Los Angeles',
      title: 'Know what to <em>expect.</em>',
      lead: 'Implants are the most involved treatment in dentistry and the one with the most questions attached. These are the ones the practice hears most, answered plainly.',
      image: { src: '/media/img/emily-practice.jpg', pos: '90% 50%', alt: 'Emily in consultation at West LA Implants' },
      actions: [{ href: '#invitation', label: 'Ask Your Own' }, { href: '/implant-cost.html', label: 'The cost question, in full', kind: 'text' }],
      meta: [
        { b: '12', span: 'Questions answered' },
        { b: 'Over 95%', span: 'Implant success rate' },
        { b: 'Decades', span: 'How long they last' },
        { b: 'Free', span: 'Second opinions' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/implant-post-model.jpg' },
      text: 'A dental implant is three parts: a titanium or ceramic post, an abutment, and a restoration. Built to work like a root, it supports a crown, a bridge, a denture or a whole arch.',
      after: ['Everything else is detail. The details are below.'],
    },
    {
      type: 'ledger', name: 'The Numbers', tag: 'The Numbers', title: 'Five numbers that <em>frame</em> it.',
      figure: { value: 95, suffix: '%+', label: 'implant success rate, over decades of use' },
      items: [
        { b: 'Three parts', span: 'A post, an abutment and a restoration make one implant.' },
        { b: 'Over 95 percent', span: 'The success rate implants have held since their introduction.' },
        { b: 'Three months or more', span: 'The integration period before the final tooth goes on.' },
        { b: 'Decades', span: 'How long a well-placed implant is designed to last.' },
        { b: 'One year', span: 'The warranty on the materials of every implant placed here.' },
      ],
    },
    {
      type: 'faq', name: 'The Basics', tag: 'The Basics', title: 'What they <em>are.</em>',
      items: [
        { q: 'What is a dental implant?', a: 'A titanium or ceramic post placed in the jawbone, an abutment that connects to it, and a restoration on top. Built to function like a natural root, it gives bone support and a stable foundation for a crown, a bridge, a denture or a full-arch prosthesis.' },
        { q: 'What makes implants “the gold standard”?', a: 'They are the only permanent tooth replacement and are designed to last decades. Because they sit in the jawbone, they give health and functional benefits comparable to natural teeth, including keeping the bone alive.' },
        { q: 'What is the success rate?', a: 'Consistently over 95 percent since their introduction decades ago. Surgical technology, high-quality materials, clinical experience and long-term maintenance all push it higher.' },
        { q: 'Who is a candidate?', a: 'Many patients already are, or can be after preparatory treatment such as bone grafting or extractions. Candidacy is decided after a comprehensive consultation and a 3D scan with an implant dentist.' },
      ],
    },
    {
      type: 'faq', name: 'The Surgery', tag: 'The Surgery', title: 'What it is <em>like.</em>',
      items: [
        { q: 'What is dental implant surgery like?', a: 'With modern surgical technology, placement is efficient and precise, often completed in a few hours with patient-fitted guides or robotic guidance. The length depends on the case; your comfort does not.' },
        { q: 'Will surgery be painful?', a: 'It is completed under sedation. You feel no pain and may sleep lightly through it; most patients have no memory of the appointment or the procedure.' },
        { q: 'What is the recovery like?', a: 'Rest for a few days. Minor discomfort, handled with over-the-counter medication, and normal activities after about a week. A soft diet for the following months while the implants integrate.' },
        { q: 'How long is the whole treatment?', a: 'From a few months to over a year. Implants are often placed soon after the plan is complete. Bone grafting, when needed, is a separate procedure with several months of healing first. After placement, three or more months of integration before the final restoration, usually with a temporary in place.' },
      ],
    },
    {
      type: 'faq', name: 'The Life After', tag: 'The Life After', title: 'What comes <em>next.</em>',
      items: [
        { q: 'How much does treatment cost?', a: 'It depends on how many teeth are missing and for how long, the materials, and any additional procedures. The practice helps you apply for financing and files insurance claims on your behalf. The full answer is on the implant cost page.' },
        { q: 'How do I care for dental implants?', a: 'Like natural teeth: brush twice a day, floss once. Depending on the restoration, a water flosser helps clear everything beneath it.' },
        { q: 'Do I still need check-ups?', a: 'Yes. Implant restorations do not decay, but the gums around them can develop peri-implantitis from plaque and tartar. Keep your routine and see the dentist every six months.' },
        { q: 'How long can I expect implants to last?', a: 'They are designed to last decades and can last a lifetime. Surgical technology, clinical experience and your own habits decide it, which is why an experienced implant team matters. Every implant the practice places carries a one-year warranty on the materials.' },
      ],
    },
    {
      type: 'proof', name: 'The Proof', patient: 'leslie', title: 'The answer that <em>counts.</em>',
      text: 'Leslie, Emily and Michael tell their stories on the practice’s channel.',
    },
    {
      type: 'invite', name: 'Invitation', title: 'Have another <em>question?</em>', lead: 'Ask it here, or at a consultation with the implant team.',
      interests: ['Dental implants', 'All-on-4 / full arch', 'A second opinion', 'Cost or financing', 'Not sure yet'],
      next: [
        { href: '/implant-cost.html', label: 'Implant cost', text: 'The six factors, the financing, the warranty.' },
        { href: '/what-to-expect.html', label: 'Your first visit', text: 'What happens, and the post-op guidelines.' },
        { href: '/dental-implants.html', label: 'Dental implants', text: 'The treatment, step by step.' },
      ],
    },
  ],
}
