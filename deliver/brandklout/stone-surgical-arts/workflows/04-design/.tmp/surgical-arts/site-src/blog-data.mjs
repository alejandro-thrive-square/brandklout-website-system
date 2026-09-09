// Recovered from the client's archive; provenance and editorial changes are in BLOG-CONTENT.md.
// One content collection feeds the overview, article template, SEO and import route manifest.
export const posts = [
  {
    slug: 'why-do-people-get-plastic-surgery',
    title: 'Why do people get plastic surgery?',
    category: 'Perspective', date: '2024-06-01', dateLabel: 'June 1, 2024',
    image: 'p-mirror.webp', alt: 'Woman looking thoughtfully at her reflection in a mirror',
    excerpt: 'A personal decision, with more than one reason behind it. A closer look at appearance, function and the expectations you bring to a consultation.',
    intro: 'The reason to consider surgery is rarely the same for two people. For one person, it is a change they have thought about for years. For another, it is the wish to restore something an injury, illness or time has changed.',
    takeaway: 'Begin with what matters to you. A good consultation makes room for your reasons, your questions and the option to wait.',
    source: 'why-do-people-get-plastic-surgery-here-are-the-top-reasons',
    sections: [
      { id: 'appearance', title: 'Feeling more like yourself', paragraphs: [
        'Some people seek cosmetic surgery to change a feature that has always concerned them. Others want to address changes that have appeared gradually, such as loose skin around the jaw or heaviness in the eyelids.',
        'The useful starting point is specific: what would you like to change, and what would you like to keep? Bringing that distinction to a consultation helps turn a broad wish into a conversation about what a procedure can reasonably achieve.'
      ] },
      { id: 'function', title: 'Restoring form and function', paragraphs: [
        'Cosmetic and reconstructive surgery have different aims, although they can overlap. Cosmetic surgery focuses on appearance. Reconstructive surgery addresses structures affected by injury, illness or conditions present from birth, with attention to both appearance and function.',
        'Some concerns also have a functional component. For example, excess upper-eyelid skin may interfere with vision. An examination is needed to understand the cause and whether surgery is appropriate.'
      ] },
      { id: 'expectations', title: 'Keeping expectations grounded', paragraphs: [
        'People sometimes hope a change in appearance will also change how they feel at work, in relationships or in social situations. Those feelings are worth discussing, but surgery cannot promise career success, repair a relationship or resolve emotional distress.',
        'If worries about appearance are taking over daily life, tell your clinician. Additional support or a psychological assessment may be more helpful than a procedure. The decision should come from you, without pressure from another person or a passing trend.'
      ] },
      { id: 'consultation', title: 'Making the consultation count', paragraphs: [
        'Write down your main concern, the result you hope for and anything that makes you hesitant. Bring your medical history and a list of medications and supplements. Ask about alternatives, possible complications, recovery and follow-up care.',
        'A consultation is a place to gather information. You can take time to consider it, seek another opinion or decide that now is not the right moment.'
      ] }
    ],
    relatedTreatment: { href: 'meet-the-doctor.html', label: 'Meet Dr. Mona Stone' },
    references: [{ label: 'ASPS: patient safety', url: 'https://www.plasticsurgery.org/patient-safety' }, { label: 'ASPS: body dysmorphic disorder and cosmetic procedures', url: 'https://www.plasticsurgery.org/news/press-releases/body-dysmorphic-disorder-may-be-under-diagnosed-in-patients-seeking-cosmetic-procedures' }]
  },
  {
    slug: 'types-of-plastic-surgery', title: 'Understanding the different types of plastic surgery',
    category: 'Surgical guides', date: '2024-09-05', dateLabel: 'September 5, 2024',
    image: 'gen-surgical-loupes.webp', alt: 'Surgical loupes arranged on a light surface',
    excerpt: 'Cosmetic, reconstructive, surgical and non-surgical: what the terms mean, and how facial procedures fit into the wider picture.',
    intro: 'Plastic surgery covers a broad field. Understanding the purpose of each approach is more useful than choosing a procedure because it is popular.',
    takeaway: 'Choose a conversation before you choose a procedure. The right approach depends on your anatomy, health and goals.',
    source: 'what-are-the-top-types-of-plastic-surgery-in-the-world',
    sections: [
      { id: 'two-aims', title: 'Two different aims', paragraphs: [
        'Reconstructive surgery aims to restore structures affected by injury, disease or conditions present from birth. Cosmetic surgery aims to change appearance. Both require an individual assessment, and some procedures can serve both purposes.',
        'Understanding the distinction helps you describe what you hope to change. At Stone Surgical Arts, that conversation focuses on the face, neck and the concerns you bring to your consultation.'
      ] },
      { id: 'face-neck', title: 'The face, neck and eyelids', paragraphs: [
        'A facelift addresses sagging facial tissues. A neck lift focuses on the area beneath the chin and through the neck. They may be considered together when changes cross the jawline, but the plan depends on the individual.',
        'Blepharoplasty addresses excess skin and, where appropriate, fat around the eyelids. Upper- and lower-eyelid concerns need separate assessment. An eyelid procedure and a face or neck lift address different parts of the face.'
      ] },
      { id: 'wider-field', title: 'The wider field of plastic surgery', paragraphs: [
        'Rhinoplasty changes the shape of the nose and may also address breathing concerns. Body procedures include breast surgery, liposuction and abdominoplasty. Each has its own indications, limitations and recovery requirements.',
        'These examples explain the wider field; they are not a list of procedures offered at this practice. Start with our treatment guide for the facial services available here.'
      ] },
      { id: 'non-surgical', title: 'Where non-surgical treatments fit', paragraphs: [
        'Injectable treatments such as botulinum toxin and dermal fillers are not surgery. They work differently from a lift and from each other. They may address specific lines or volume concerns, but they do not offer an interchangeable result.',
        'Non-surgical does not mean risk-free. Discuss the potential benefits, risks, duration of results and alternatives with a qualified clinician before deciding.'
      ] },
      { id: 'choosing', title: 'Choosing an approach', paragraphs: [
        'A procedure name is only the beginning. Your medical history, anatomy, priorities and ability to plan for recovery all matter. Ask which concerns a proposed treatment would address, which it would leave unchanged and what follow-up involves.',
        'You do not need to arrive at a consultation knowing which procedure you want. Describing what concerns you is enough to begin.'
      ] }
    ],
    relatedTreatment: { href: 'treatments.html', label: 'Explore facial treatments' },
    references: [{ label: 'ASPS: cosmetic procedures', url: 'https://www.plasticsurgery.org/cosmetic-procedures' }]
  },
  {
    slug: 'dermal-fillers-vs-botox', title: 'Dermal fillers vs. Botox: understanding the difference',
    category: 'Non-surgical', date: '2024-10-01', dateLabel: 'October 1, 2024',
    image: 'ds-botox-brow.webp', alt: 'Clinician preparing an injectable treatment at a patient’s brow',
    excerpt: 'One relaxes targeted muscles. The other adds volume. Understanding the distinction helps you ask better questions about injectable treatments.',
    intro: 'Botox and dermal fillers are often mentioned in the same conversation about facial lines. They work in different ways, and the choice depends on the concern being treated.',
    takeaway: 'The starting point is an assessment of your face at rest and in motion, followed by a discussion of the benefits and risks.',
    source: 'dermal-fillers-vs-botox-comparing-the-two-top-treatments',
    sections: [
      { id: 'botox', title: 'What Botox does', paragraphs: [
        'Botox is a brand of botulinum toxin. It temporarily reduces activity in targeted muscles. In cosmetic use, this can soften certain expression lines, such as those associated with frowning or squinting.',
        'It does not add volume. The areas that can be treated, the dose and whether treatment is suitable depend on the product and your clinician’s assessment.'
      ] },
      { id: 'fillers', title: 'What dermal fillers do', paragraphs: [
        'Dermal fillers are injected to add volume in specific areas. Some are made with hyaluronic acid; others use different materials. Approved uses vary by product and treatment area.',
        'A filler does not relax a muscle in the way botulinum toxin does. A line visible at rest, a volume concern and a line caused by expression may call for different approaches.'
      ] },
      { id: 'results', title: 'Results and maintenance', paragraphs: [
        'Neither treatment should be chosen on a promise of a fixed result or timeline. Onset, duration and the need for further treatment vary by product, area and individual response.',
        'Ask when your clinician would assess the result, what normal recovery may look like and how to get advice if something does not feel right.'
      ] },
      { id: 'safety', title: 'Both are medical procedures', paragraphs: [
        'Injectables carry risks. Fillers may cause swelling, bruising or infection. Accidental injection into a blood vessel can cause tissue damage, vision loss or stroke. Some complications can be permanent.',
        'Botulinum toxin products also carry serious warnings, including the possibility of effects spreading beyond the injection site. Treatment should use an appropriate approved product administered by a licensed healthcare professional.',
        'Share your medical history, allergies, medications and any previous injectable treatments. Ask about product-specific risks, alternatives and the plan for managing a complication.'
      ] },
      { id: 'decision', title: 'A decision made in consultation', paragraphs: [
        'The useful question is not which treatment is better in general. It is what is causing the concern you see, and whether a treatment can address it safely.',
        'A clinician can explain whether an injectable, another approach or no treatment is the most appropriate next step for you.'
      ] }
    ],
    relatedTreatment: { href: 'treatments.html#nonsurgical', label: 'Explore non-surgical treatments' },
    references: [{ label: 'FDA: dermal fillers', url: 'https://www.fda.gov/medical-devices/aesthetic-cosmetic-devices/dermal-fillers-soft-tissue-fillers' }, { label: 'FDA: botulinum toxin products', url: 'https://www.fda.gov/news-events/press-announcements/fda-warns-companies-over-illegal-marketing-botox-and-related-products' }]
  }
];
