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
    slug: 'types-of-plastic-surgery', seoTitle: 'Types of Plastic Surgery', title: 'Understanding the different types of plastic surgery',
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
    slug: 'dermal-fillers-vs-botox', seoTitle: 'Dermal Fillers vs. Botox', title: 'Dermal fillers vs. Botox: understanding the difference',
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
  },

  /* ---------------------------------------------------------------------
     Recovered from the client's own site backup on 2026-09-09. The three
     records above came from the Wayback Machine and were the only articles
     the intake list exposed; the backup holds thirty-nine. Provenance, and
     what was changed on the way in, is in BLOG-CONTENT.md.

     Every record below is an editorial adaptation of an archived post, not a
     restoration of it. The originals carry statistics that were dated when
     written, two different practice telephone numbers, an agency byline, and
     and, across the `news` tree, speculation about the medical procedures of
     named living people. None of that is reproduced. What survives is the
     subject, the original publication date and the URL.
     --------------------------------------------------------------------- */

  {
    slug: 'maxillofacial-surgery-explained', seoTitle: 'Oral and maxillofacial surgery',
    title: 'What oral and maxillofacial surgery involves',
    category: 'Oral & maxillofacial', date: '2024-05-01', dateLabel: 'May 1, 2024',
    image: 'bh-anatomy-desk.webp', alt: 'A skull scan on a monitor beside an anatomical model and surgical textbooks',
    excerpt: 'A specialty that sits between medicine and dentistry, covering the mouth, jaws, face and neck. What it treats, and who it is for.',
    intro: 'Oral and maxillofacial surgery is often described by its best-known procedure, wisdom tooth removal, which gives an incomplete picture. The specialty covers the mouth, jaws, face and neck, and the training behind it is longer than either a dental or a medical degree alone.',
    takeaway: 'If a concern involves the jaws, the bite or the facial bones, an oral and maxillofacial surgeon is the specialist trained to assess it.',
    source: 'a-quick-guide-to-understanding-maxillofacial-surgery',
    sections: [
      { id: 'what-it-is', title: 'What the specialty covers', paragraphs: [
        'Oral and maxillofacial surgery diagnoses and treats conditions of the mouth, jaws, face and neck. That includes the teeth and the bone that holds them, the jaw joints, and the hard and soft tissue of the face.',
        'Surgeons in this field complete training beyond dental school, and in many cases a medical degree as well. The range is deliberately wide: the same specialty handles a single extraction and a reconstruction of the facial skeleton.'
      ] },
      { id: 'between-two-fields', title: 'Between medicine and dentistry', paragraphs: [
        'Much of the work happens alongside other clinicians. An orthodontist may align the teeth before and after jaw surgery; a restorative dentist may place the crown on an implant the surgeon positioned.',
        'That coordination is the point rather than an inconvenience. A plan that addresses the bite, the bone and the appearance together tends to hold up better than one that treats any of them in isolation.'
      ] },
      { id: 'common-procedures', title: 'The procedures most often involved', paragraphs: [
        'Common reasons for referral include impacted teeth, dental implants and the bone grafting that sometimes precedes them, correction of jaw position where the bite and facial balance are affected, repair of facial injuries, and the assessment of cysts, lesions and other growths.',
        'Not every one of these is offered at every practice. Ask which procedures a surgeon performs regularly, and what they would refer elsewhere.'
      ] },
      { id: 'function-and-appearance', title: 'Function and appearance together', paragraphs: [
        'Many of these procedures change how the face looks as well as how it works, because the bones being treated give the face its shape. Correcting a jaw position to improve chewing also alters the profile.',
        'It is worth saying which of the two matters more to you. A plan built around function and a plan built around appearance can differ, and a surgeon can only weigh them if you have said so.'
      ] }
    ],
    relatedTreatment: { href: 'treatments.html', label: 'Explore facial treatments' },
    references: [{ label: 'AAOMS: what oral and maxillofacial surgeons do', url: 'https://myoms.org/' }, { label: 'AAOMS: corrective jaw surgery', url: 'https://myoms.org/what-we-do/corrective-jaw-surgery/' }]
  },
  {
    slug: 'facial-trauma-repair', seoTitle: 'Facial trauma repair',
    title: 'Facial trauma: how injuries to the face are repaired',
    category: 'Oral & maxillofacial', date: '2024-12-05', dateLabel: 'December 5, 2024',
    image: 'bh-skin-assess-gloves.webp', alt: 'A gloved clinician examining a woman’s cheek',
    excerpt: 'Facial injuries range from a laceration to a complex fracture. What treatment involves, and why the assessment matters as much as the repair.',
    intro: 'The face holds bone, nerve, muscle and the structures behind sight, smell and chewing in a small space. That is why an injury there is assessed carefully even when it looks minor from the outside.',
    takeaway: 'Have a facial injury assessed promptly, even a small one. What is visible on the surface does not always indicate what happened to the bone beneath.',
    source: 'facing-facial-trauma-with-modern-medical-technology',
    sections: [
      { id: 'how-they-happen', title: 'How facial injuries happen', paragraphs: [
        'Falls, road collisions, sport and assault account for most facial trauma. The pattern of injury tends to follow the direction and force of the impact rather than the sport or setting.',
        'Injuries range from a laceration of the skin to fractures of the nose, cheekbone, eye socket or jaw, sometimes several together.'
      ] },
      { id: 'assessment', title: 'The assessment comes first', paragraphs: [
        'Before any repair, the assessment establishes what is injured: whether the bones are displaced, whether the bite still meets correctly, whether vision, sensation or airway are affected. Imaging usually forms part of this.',
        'A wound that looks small can accompany a fracture underneath, and a fracture can be present without an obvious deformity. This is the reason for examining rather than estimating.'
      ] },
      { id: 'repair', title: 'What repair involves', paragraphs: [
        'Some fractures can be reduced without an incision. Others need to be exposed, realigned and held with small plates and screws so the bone heals in the correct position.',
        'Where the bite is involved, restoring it is usually the priority the rest of the plan is built around, since the teeth indicate whether the jaws have been returned to their original relationship.'
      ] },
      { id: 'recovery', title: 'Recovery and what to expect', paragraphs: [
        'Swelling and bruising are expected in the early period and settle over weeks. Diet may be restricted for a time where the jaw is involved, and follow-up appointments check that healing is progressing as planned.',
        'Ask what a realistic result looks like for your particular injury, including how any scar is likely to settle and over what period. Surgery aims to restore function and appearance; it does not always return the face to exactly its previous state.'
      ] }
    ],
    relatedTreatment: { href: 'treatments.html', label: 'Explore facial treatments' },
    references: [{ label: 'AAOMS: facial injury and trauma surgery', url: 'https://myoms.org/what-we-do/facial-injury-trauma-surgery/' }]
  },
  {
    slug: 'v-line-jaw-surgery', seoTitle: 'V-line jaw surgery',
    title: 'V-line jaw surgery and the shape of the lower face',
    category: 'Facial surgery', date: '2021-08-10', dateLabel: 'August 10, 2021',
    image: 'm-jawline.webp', alt: 'Profile study of a defined jawline',
    excerpt: 'A procedure that narrows the lower face by reshaping bone. What it can change, what it cannot, and why it is a considered decision rather than a trend.',
    intro: 'Interest in jawline definition has grown, and with it the language of trends. Reshaping the lower jaw is bone surgery, and it is worth separating what the procedure does from the way it is marketed.',
    takeaway: 'A narrower jaw is a permanent change to the facial skeleton. It deserves a consultation about your anatomy, not a decision made from photographs.',
    source: 'hottest-new-jawline-trend-from-asia-starting-to-dominate-usa-market-v-line-jaw-surgery',
    sections: [
      { id: 'what-it-is', title: 'What the procedure does', paragraphs: [
        'V-line surgery, or reduction mandibuloplasty, narrows the lower face by reshaping the angle and body of the jaw and, in many plans, the chin. The intended result is a narrower, more tapered lower third of the face.',
        'It is distinct from genioplasty, which repositions the chin alone, and from a filler or toxin treatment, which changes soft tissue or muscle without altering bone. The three are sometimes discussed together and produce quite different results.'
      ] },
      { id: 'who-considers-it', title: 'Who considers it', paragraphs: [
        'People who ask about it usually describe a lower face they feel is wide or square relative to the rest of their features. Some are seeking a softer or more feminine facial shape.',
        'What is achievable depends on the underlying bone, the soft tissue over it and the position of the nerve that runs through the jaw. An examination and imaging establish which parts of a request are anatomically possible.'
      ] },
      { id: 'planning', title: 'Planning before the operation', paragraphs: [
        'Bone surgery is planned in advance rather than decided during the procedure. Imaging is used to work out how much bone can safely be removed and where, and to discuss the likely change with you beforehand.',
        'That planning conversation is the right moment to say what you want kept as well as what you want changed. A jawline can be narrowed in ways that read very differently depending on how the chin is handled at the same time.'
      ] },
      { id: 'expectations', title: 'Recovery and expectations', paragraphs: [
        'Swelling after jaw surgery is considerable at first and settles gradually, so the final shape is not apparent for some months. Diet is restricted early on and sensation in the lip and chin can be altered for a period.',
        'Ask about the risks specific to this operation, including nerve injury and asymmetry, and about what revision would involve. Bone that has been removed cannot be replaced in the same form.'
      ] }
    ],
    relatedTreatment: { href: 'treatments.html', label: 'Explore facial treatments' },
    references: [{ label: 'ASPS: chin surgery', url: 'https://www.plasticsurgery.org/cosmetic-procedures/chin-surgery' }, { label: 'AAOMS: corrective jaw surgery', url: 'https://myoms.org/what-we-do/corrective-jaw-surgery/' }]
  },
  {
    slug: 'mandibular-tori', seoTitle: 'Tori: what they are, when to remove',
    title: 'Tori: what they are, and when they need removing',
    category: 'Oral & maxillofacial', date: '2021-11-15', dateLabel: 'November 15, 2021',
    image: 'gen-procedure-room.webp', alt: 'Prepared procedure room, instruments ready',
    excerpt: 'Bony growths in the mouth that are usually harmless. Why they form, whether they keep growing, and the few reasons to remove them.',
    intro: 'Tori are extra deposits of bone in the jaw, and one of the most common questions about them is whether they will keep growing. They are benign, and most people who have them need nothing done.',
    takeaway: 'Tori are usually harmless and usually stable. Removal is considered for a functional reason, not because a torus exists.',
    source: 'one-of-the-most-common-questions-i-get-is-will-my-tori-continue-to-grow',
    sections: [
      { id: 'what-they-are', title: 'What tori are', paragraphs: [
        'A torus is an area of extra bone on the jaw. On the roof of the mouth it is called a torus palatinus; along the inner surface of the lower jaw, mandibular tori. They are covered by normal gum tissue and are not tumours.',
        'They are benign. Finding one is common, and on its own it is not a reason for treatment.'
      ] },
      { id: 'do-they-grow', title: 'Do they keep growing?', paragraphs: [
        'Most tori grow slowly to a point and then stop, typically once the jaws have finished developing. Continued rapid change is not the usual pattern, and is worth mentioning to a clinician if you notice it.',
        'The cause is not settled. Both inherited factors and habits such as heavy clenching or grinding have been proposed, and neither explanation accounts for every case.'
      ] },
      { id: 'when-to-remove', title: 'When removal is considered', paragraphs: [
        'The usual reasons are practical. A torus can prevent a denture from seating properly and cause irritation where the denture rests on it. A large lower torus can trap food beneath it. Occasionally speech is affected.',
        'Removal may also be recommended before other treatment that needs the area to be a particular shape. In each case the reason is a function that is being interfered with.'
      ] },
      { id: 'what-to-ask', title: 'What to ask', paragraphs: [
        'If removal is suggested, ask what specifically it will solve, what the recovery involves and what happens if you leave it. A torus that is causing no trouble can reasonably be left alone and reviewed.',
        'If you have been told you have tori and are simply wondering about them, that is a normal question and a short conversation at a routine appointment.'
      ] }
    ],
    relatedTreatment: { href: 'meet-the-doctor.html', label: 'Meet Dr. Mona Stone' },
    references: [{ label: 'AAOMS: oral pathology', url: 'https://myoms.org/what-we-do/oral-head-and-neck-pathology/oral-pathology-vs-oral-cancer/' }]
  },
  {
    slug: 'oral-and-cosmetic-surgery-types', seoTitle: 'Types of oral and cosmetic surgery',
    title: 'Oral and cosmetic surgery: the procedures explained',
    category: 'Surgical guides', date: '2024-09-01', dateLabel: 'September 1, 2024',
    image: 'ssa-treatment-room.webp', alt: 'Treatment room at Stone Surgical Arts',
    excerpt: 'Surgical and non-surgical, oral and cosmetic. A plain guide to the categories, and where facial procedures sit among them.',
    intro: 'The words used for these procedures overlap in ordinary conversation. Sorting the categories out makes it easier to describe what you are actually asking about.',
    takeaway: 'Describe the concern rather than choosing the procedure name. The category follows from the assessment.',
    source: 'what-are-the-types-of-oral-and-cosmetic-surgery',
    sections: [
      { id: 'categories', title: 'How the categories divide', paragraphs: [
        'The first division is purpose. Reconstructive procedures address structures affected by injury, disease or a condition present from birth. Cosmetic procedures address appearance. Some operations serve both, and the distinction can matter for how treatment is arranged.',
        'The second division is whether the procedure is surgical. Injectable treatments and energy-based skin treatments are not surgery, and comparing them directly with an operation tends to mislead in both directions.'
      ] },
      { id: 'jaw-and-bone', title: 'Procedures involving the jaws and facial bones', paragraphs: [
        'Corrective jaw surgery repositions the upper or lower jaw where the bite, chewing, speech or breathing are affected, and it changes facial proportion as a consequence. Chin procedures adjust the projection or width of the chin.',
        'Facial trauma repair restores bones displaced by injury. These procedures are planned around function first, with appearance considered alongside it.'
      ] },
      { id: 'face-and-neck', title: 'Procedures of the face, neck and eyelids', paragraphs: [
        'A facelift addresses sagging of the facial tissues; a neck lift addresses the area beneath the chin and through the neck. They are sometimes planned together when the change crosses the jawline.',
        'Blepharoplasty addresses excess skin and, where appropriate, fat around the eyelids. Upper and lower eyelids are assessed separately, and an eyelid procedure does not do the work of a lift.'
      ] },
      { id: 'non-surgical', title: 'Where non-surgical treatments fit', paragraphs: [
        'Botulinum toxin relaxes targeted muscles. Dermal fillers add volume. Peels and laser treatments act on the skin surface and its deeper layers. Each addresses something different, and none substitutes for an operation that repositions tissue.',
        'These examples describe the wider field. They are not a list of what is offered at this practice; the treatment guide sets out the facial services available here.'
      ] }
    ],
    relatedTreatment: { href: 'treatments.html', label: 'Explore facial treatments' },
    references: [{ label: 'ASPS: cosmetic procedures', url: 'https://www.plasticsurgery.org/cosmetic-procedures' }, { label: 'ASPS: reconstructive procedures', url: 'https://www.plasticsurgery.org/reconstructive-procedures' }]
  },
  {
    slug: 'sleep-apnoea-treatment', seoTitle: 'Obstructive sleep apnea treatment',
    title: 'Obstructive sleep apnea and the treatments available',
    category: 'Health & wellbeing', date: '2024-07-23', dateLabel: 'July 23, 2024',
    image: 'bh-recovery-bed.webp', alt: 'A woman asleep in bed in soft morning light',
    excerpt: 'A common disorder in which breathing repeatedly stops during sleep. The treatments that exist, and where surgery fits among them.',
    intro: 'Obstructive sleep apnea interrupts breathing during sleep, often many times an hour. It is common, it is treatable, and it is worth diagnosing properly because the effects reach beyond tiredness.',
    takeaway: 'Sleep apnea is diagnosed with a sleep study, not from symptoms alone. Treatment begins with that diagnosis.',
    source: 'a-comprehensive-guide-on-how-to-treat-sleep-apnea',
    sections: [
      { id: 'what-it-is', title: 'What it is, and how it is recognised', paragraphs: [
        'In obstructive sleep apnea the airway narrows or closes repeatedly during sleep, interrupting breathing. Loud snoring, pauses in breathing noticed by someone else, waking unrefreshed and daytime sleepiness are common features.',
        'Symptoms overlap with other conditions, so diagnosis is made with a sleep study rather than from the pattern alone. Untreated, sleep apnea is associated with cardiovascular and metabolic problems, which is the reason for taking it seriously.'
      ] },
      { id: 'first-line', title: 'The usual first treatments', paragraphs: [
        'Continuous positive airway pressure, delivered through a mask, holds the airway open during sleep and is the most established treatment for moderate and severe disease.',
        'Custom oral appliances, which hold the lower jaw forward, are an option in milder cases and for people who cannot tolerate a mask. They are fitted individually rather than bought ready-made.'
      ] },
      { id: 'surgery', title: 'Where surgery comes in', paragraphs: [
        'Surgery is generally considered when other treatments have not worked or cannot be tolerated, and the choice depends on where the obstruction is. Procedures range from work on the soft tissue of the throat to advancement of the upper and lower jaws, which enlarges the airway.',
        'Jaw advancement falls within oral and maxillofacial surgery. Whether it is appropriate depends on your anatomy and your sleep study, and it is assessed alongside the other options rather than instead of them.'
      ] },
      { id: 'alongside', title: 'What helps alongside treatment', paragraphs: [
        'Weight management, sleeping on your side rather than your back, and limiting alcohol and sedatives before bed can each reduce the severity of obstructive sleep apnea. They support treatment rather than replace it.',
        'Discuss any change with the clinician managing your care, particularly if you already use a device, so that treatment is adjusted rather than abandoned.'
      ] }
    ],
    relatedTreatment: { href: 'book.html', label: 'Book a consultation' },
    references: [{ label: 'NHLBI: sleep apnea', url: 'https://www.nhlbi.nih.gov/health/sleep-apnea' }, { label: 'NHLBI: sleep apnea treatment', url: 'https://www.nhlbi.nih.gov/health/sleep-apnea/treatment' }, { label: 'AAOMS: obstructive sleep apnea', url: 'https://myoms.org/what-we-do/obstructive-sleep-apnea-osa/' }]
  },
  {
    slug: 'dental-implants-explained',
    title: 'Dental implants, step by step',
    category: 'Oral & maxillofacial', date: '2024-06-27', dateLabel: 'June 27, 2024',
    image: 'bh-consult-tablet-smile.webp', alt: 'A smiling woman in a consultation with a clinician holding a tablet',
    excerpt: 'What an implant is, how the treatment is staged, and what makes someone a suitable candidate.',
    intro: 'A dental implant replaces the root of a missing tooth with a fixture placed in the jawbone, which then carries a crown. The treatment is staged over months rather than completed in a single visit.',
    takeaway: 'Implant treatment depends on the health of the bone and gums around it. The assessment matters more than the timeline.',
    source: 'permanent-dental-implants-to-refine-your-smile-in-2024',
    sections: [
      { id: 'what-it-is', title: 'What an implant is', paragraphs: [
        'An implant is a small fixture placed into the jawbone to take the place of a tooth root. Once the bone has healed around it, it supports a crown, a bridge or a denture.',
        'Because it is anchored in bone, an implant is fixed rather than removable, and it is cleaned in place. It replaces the root as well as the visible tooth, which is what distinguishes it from a conventional bridge or denture.'
      ] },
      { id: 'assessment', title: 'The assessment', paragraphs: [
        'Suitability depends on general health, the health of the gums, and whether there is enough bone in the right place. Conditions that affect healing, and smoking, are considered because they affect how the bone integrates with the fixture.',
        'Where bone volume is insufficient, grafting may be discussed as a preliminary stage. That adds time to the plan and is a decision in its own right.'
      ] },
      { id: 'stages', title: 'How the treatment is staged', paragraphs: [
        'A tooth may need removing first, and the site allowed to heal. The implant is then placed, and a period follows during which bone integrates with it before anything is loaded onto it.',
        'The crown or other restoration is made and fitted afterwards. The waiting between stages is doing the work, which is why the sequence is not compressed for convenience.'
      ] },
      { id: 'afterwards', title: 'Looking after an implant', paragraphs: [
        'Implants need the same daily cleaning as teeth and regular review. The tissue around an implant can become inflamed and, if that is neglected, the supporting bone can be lost.',
        'Ask what the review schedule is, what the restoration is likely to need over time, and what happens if a component wears or loosens. These are maintainable rather than maintenance-free.'
      ] }
    ],
    relatedTreatment: { href: 'book.html', label: 'Book a consultation' },
    references: [{ label: 'AAOMS: dental implant surgery', url: 'https://myoms.org/what-we-do/dental-implant-surgery/' }, { label: 'ADA MouthHealthy: implants', url: 'https://www.mouthhealthy.org/all-topics-a-z/implants' }]
  },
  {
    slug: 'teen-acne-treatment', seoTitle: 'Acne treatment for teenagers',
    title: 'Acne in the teenage years: what actually helps',
    category: 'Skin', date: '2024-04-01', dateLabel: 'April 1, 2024',
    image: 'ds-peel-brush.webp', alt: 'Treatment brush and preparation dish on a pale surface',
    excerpt: 'Why acne happens, which over-the-counter ingredients have evidence behind them, and when to ask for prescription treatment.',
    intro: 'Acne is one of the most common skin conditions and it is at its most common in the teenage years. It is treatable, and the order in which treatments are tried matters more than any single product.',
    takeaway: 'Give a treatment time to work before changing it, and ask for help early if acne is scarring or affecting how you feel.',
    source: 'what-is-good-for-acne-treatment-for-teens',
    sections: [
      { id: 'why', title: 'Why acne happens', paragraphs: [
        'Acne develops when hair follicles become blocked with skin cells and oil. Bacteria and inflammation follow, producing the range of spots from blackheads and whiteheads to deeper, painful lesions.',
        'It is not caused by poor hygiene, and washing more often does not clear it. Very frequent or vigorous washing tends to irritate the skin and make matters worse.'
      ] },
      { id: 'basics', title: 'The basics that help', paragraphs: [
        'Washing gently twice a day, and after heavy sweating, with lukewarm water is enough. Pat the skin dry rather than rubbing it.',
        'Choose skincare and cosmetics labelled non-comedogenic, and try not to pick or squeeze spots, which increases the chance of scarring.'
      ] },
      { id: 'otc', title: 'Over-the-counter treatments', paragraphs: [
        'Benzoyl peroxide, salicylic acid and topical retinoids are the ingredients most commonly recommended for mild acne, and they work in different ways: reducing bacteria, clearing blocked pores and normalising how the skin sheds cells.',
        'Any of them may cause dryness or irritation at first, so starting with a lower strength and building up is usual. Treatments generally need several weeks of consistent use before the result can be judged.'
      ] },
      { id: 'when-to-ask', title: 'When to ask for more help', paragraphs: [
        'If over-the-counter treatment has not helped after a reasonable trial, if the spots are deep and painful, or if scarring is appearing, that is the point to see a clinician. Prescription options include stronger topical treatments and, in some cases, oral medication.',
        'Acne affects confidence, and that is a legitimate reason to seek treatment rather than wait it out. Say so at the appointment, because it can change what is offered.'
      ] }
    ],
    relatedTreatment: { href: 'treatments.html#nonsurgical', label: 'Explore non-surgical treatments' },
    references: [{ label: 'AAD: acne', url: 'https://www.aad.org/public/diseases/acne' }, { label: 'AAD: how dermatologists treat acne', url: 'https://www.aad.org/public/diseases/acne/derm-treat/treat' }]
  },
  {
    slug: 'weight-loss-injections', seoTitle: 'Weight-loss injections',
    title: 'Weight-loss injections: what they are, and what they are not',
    category: 'Health & wellbeing', date: '2024-08-10', dateLabel: 'August 10, 2024',
    image: 'gen-injectables.webp', alt: 'Injectable vials arranged on a clean tray',
    excerpt: 'The category covers very different products with very different evidence. How to tell them apart, and the questions to ask before starting one.',
    intro: 'Injections marketed for weight loss are not one thing. Some are prescription medicines studied in clinical trials; others are vitamin blends sold on much thinner evidence. The distinction is the most useful thing to understand.',
    takeaway: 'Ask exactly which product is being proposed, whether it is approved for this use, and who is prescribing and monitoring it.',
    source: 'what-is-the-skinny-shot-a-revolutionary-way-to-lose-weight',
    sections: [
      { id: 'two-categories', title: 'Two different categories', paragraphs: [
        'GLP-1 receptor agonists are prescription medicines developed for type 2 diabetes, some of which are also approved for weight management. They act on appetite and on how quickly the stomach empties, and they have been studied in large trials.',
        'Lipotropic or vitamin injections are a separate category, typically combining substances such as B12, choline, inositol and methionine. The evidence that they produce weight loss is not comparable, and the two are often marketed under similar names.'
      ] },
      { id: 'not-a-shortcut', title: 'Not a substitute for the rest', paragraphs: [
        'Where these medicines are prescribed, they are used alongside changes to diet and activity and with medical follow-up, not instead of them.',
        'Expectations set by advertising and by other people’s results are a poor guide. Response varies, and so does tolerance.'
      ] },
      { id: 'risks', title: 'Risks and monitoring', paragraphs: [
        'GLP-1 medicines commonly cause nausea and other digestive effects, and carry more serious risks that require a prescriber to assess your history first. They are not appropriate for everyone.',
        'The FDA has warned about compounded and unapproved versions sold outside the regulated supply chain, where the contents and dose may not be what is claimed. Where a product comes from is a safety question, not a paperwork one.'
      ] },
      { id: 'asking', title: 'What to ask before starting', paragraphs: [
        'Ask for the name of the specific product, whether it is FDA-approved for weight management, who is prescribing it, how you will be monitored and what the plan is if you stop.',
        'A clinician who will not answer those questions directly is telling you something useful.'
      ] }
    ],
    relatedTreatment: { href: 'book.html', label: 'Book a consultation' },
    references: [{ label: 'FDA: concerns with unapproved GLP-1 drugs used for weight loss', url: 'https://www.fda.gov/drugs/drug-alerts-and-statements/fdas-concerns-unapproved-glp-1-drugs-used-weight-loss' }, { label: 'NIDDK: weight management', url: 'https://www.niddk.nih.gov/health-information/weight-management' }]
  },
  {
    slug: 'lipotropic-injections', seoTitle: 'Lipotropic injections',
    title: 'Lipotropic injections, and the claims made for them',
    category: 'Health & wellbeing', date: '2024-11-05', dateLabel: 'November 5, 2024',
    image: 'ds-prp-syringes.webp', alt: 'Prepared syringes on a stainless tray',
    excerpt: 'B12, choline, inositol and methionine, sold as a metabolism boost. What the ingredients do, and how to read the marketing around them.',
    intro: 'Lipotropic injections are marketed as a way to speed up fat metabolism. The ingredients are real nutrients with known roles in the body; the claim that injecting them produces weight loss is a separate question.',
    takeaway: 'A nutrient having a role in metabolism is not the same as an injection of it causing weight loss. Ask what evidence supports the specific claim.',
    source: 'what-are-skinny-shot-injections-and-how-do-they-work',
    sections: [
      { id: 'ingredients', title: 'What is in them', paragraphs: [
        'Formulations vary between providers, which is itself worth noting. Common components include vitamin B12, choline, inositol and methionine.',
        'Each has an established role in normal metabolism. That is the basis of the marketing, and it is not the same as evidence that supplementing them changes body weight in someone who is not deficient.'
      ] },
      { id: 'claims', title: 'Reading the claims', paragraphs: [
        'Descriptions of these injections often move from a mechanism to a promised outcome without anything in between: a nutrient supports liver function, therefore the injection burns fat. The step that is missing is the trial showing the effect in people.',
        'Claims about mood, mental clarity and energy deserve the same scrutiny. Feeling better after starting any programme is common and has several possible explanations.'
      ] },
      { id: 'deficiency', title: 'Where supplementation does matter', paragraphs: [
        'B12 deficiency is a real condition with real consequences, and it is treated with supplementation, sometimes by injection. It is diagnosed with a blood test.',
        'If you have symptoms that suggest a deficiency, the useful step is testing rather than an untargeted injection. Treating a deficiency you have is different from topping up one you do not.'
      ] },
      { id: 'safety', title: 'Safety and sensible questions', paragraphs: [
        'Injections carry the ordinary risks of injection, and excess of some vitamins and minerals is not harmless. Who is administering the treatment, and under what supervision, is a fair question.',
        'If weight is the concern, ask about approaches with evidence behind them, and about what is being measured to tell whether anything is working.'
      ] }
    ],
    relatedTreatment: { href: 'book.html', label: 'Book a consultation' },
    references: [{ label: 'NIDDK: weight management', url: 'https://www.niddk.nih.gov/health-information/weight-management' }]
  },
  {
    slug: 'dental-emergencies', seoTitle: 'Dental emergencies: the first hour',
    title: 'A dental emergency: what to do in the first hour',
    category: 'Safety & recovery', date: '2026-02-13', dateLabel: 'February 13, 2026',
    image: 'bh-emergency-sign.webp', alt: 'A hospital emergency department sign',
    excerpt: 'Which dental problems need to be seen the same day, what to do while you arrange it, and what to avoid.',
    intro: 'Not every dental problem is an emergency, and knowing which are helps you act quickly when it matters. A few situations are genuinely time-critical.',
    takeaway: 'A knocked-out adult tooth is the clearest emergency: handle it by the crown, keep it moist, and get seen immediately.',
    source: 'dental-emergency-what-to-do-calm-simple-steps-to-protect-your-smile',
    sections: [
      { id: 'urgent', title: 'What counts as urgent', paragraphs: [
        'Seek care the same day for a knocked-out adult tooth, a tooth that has been pushed out of position, bleeding that will not stop, or swelling of the face, mouth or neck. Facial swelling with fever, or any difficulty breathing or swallowing, needs emergency medical care rather than a dental appointment.',
        'Severe pain that is not controlled by ordinary painkillers also warrants prompt attention, as it often indicates infection.'
      ] },
      { id: 'knocked-out', title: 'A knocked-out tooth', paragraphs: [
        'Pick the tooth up by the crown, never the root. If it is dirty, rinse it briefly without scrubbing and without removing any attached tissue.',
        'If you are able, reposition it in the socket and hold it there. If not, keep it moist in milk or the person’s own saliva rather than in water, and get to a clinician immediately. Time matters here more than in almost any other dental situation. Baby teeth are not reimplanted, so this advice concerns adult teeth.'
      ] },
      { id: 'meanwhile', title: 'While you arrange to be seen', paragraphs: [
        'For pain and swelling, a cold compress against the outside of the face helps. Rinsing gently with warm salt water can be soothing. Take your usual painkiller according to the label if it is safe for you.',
        'Keep a broken piece of tooth if you have it, and avoid chewing on that side.'
      ] },
      { id: 'avoid', title: 'What to avoid', paragraphs: [
        'Do not place an aspirin tablet against the gum: it burns the tissue rather than easing the pain. Do not use heat on a swollen face, and do not try to drain a swelling yourself.',
        'Leftover antibiotics are not a substitute for treatment, and pain that stops does not mean an infection has resolved. Have it assessed either way.'
      ] }
    ],
    relatedTreatment: { href: 'book.html', label: 'Book a consultation' },
    references: [{ label: 'ADA MouthHealthy: dental emergencies', url: 'https://www.mouthhealthy.org/all-topics-a-z/dental-emergencies' }]
  },
  {
    slug: 'tooth-extraction-and-wisdom-teeth',
    title: 'Tooth extraction and wisdom teeth',
    category: 'Oral & maxillofacial', date: '2026-02-11', dateLabel: 'February 11, 2026',
    image: 'bh-face-hands-spa.webp', alt: 'A smiling woman lying back as hands frame her jaw',
    excerpt: 'When a tooth needs to come out, what removal involves, and how recovery usually goes.',
    intro: 'Extraction is one of the most common procedures in oral surgery, and wisdom teeth account for a large share of it. Whether a tooth needs removing is a clinical judgement rather than a rule.',
    takeaway: 'Not every wisdom tooth needs removing. Ask what specifically is wrong with yours, and what happens if it stays.',
    source: 'oral-surgery-stone-gentle,-expert-care-for-tooth-extractions-and-wisdom-teeth-removal',
    sections: [
      { id: 'why', title: 'Why a tooth might need removing', paragraphs: [
        'Common reasons include decay or damage beyond repair, advanced gum disease affecting the supporting bone, infection, or a tooth positioned so that it damages its neighbour. Extraction is sometimes part of orthodontic planning.',
        'Wisdom teeth are removed when they are impacted and causing problems: repeated infection of the overlying gum, decay that cannot be treated, damage to the tooth in front, or an associated cyst.'
      ] },
      { id: 'when-not', title: 'When removal is not automatic', paragraphs: [
        'A wisdom tooth that has come through, is cleanable and is causing no trouble does not necessarily need removing. Being impacted is not on its own a reason if it is causing no symptoms or damage.',
        'Ask what the specific indication is in your case, and what monitoring would involve if you chose to keep the tooth under review.'
      ] },
      { id: 'procedure', title: 'What the procedure involves', paragraphs: [
        'Most extractions are done with local anaesthetic; sedation is available and is discussed beforehand. A straightforward tooth is loosened and lifted out. An impacted tooth may need an incision in the gum and removal of a small amount of bone, and the tooth may be divided to remove it in pieces.',
        'Imaging beforehand shows the position of the roots and their relationship to the nerve in the lower jaw, which is what the risk discussion is based on.'
      ] },
      { id: 'recovery', title: 'Recovery', paragraphs: [
        'Swelling and discomfort peak in the first two to three days and then settle. Follow the instructions on rinsing, eating and activity: the clot in the socket is what healing depends on, and disturbing it early is the usual cause of problems.',
        'Contact the practice if pain increases after a few days rather than easing, if bleeding does not settle, or if you develop a fever. Altered sensation in the lip or tongue should also be reported.'
      ] }
    ],
    relatedTreatment: { href: 'book.html', label: 'Book a consultation' },
    references: [{ label: 'AAOMS: wisdom teeth management', url: 'https://myoms.org/what-we-do/wisdom-teeth-management/' }]
  },

  /* ---------------------------------------------------------------------
     The `news` tree, twenty-four posts. Every one was built on speculation
     about the procedures of named living people: "many speculate", "experts
     claimed", a list of image URLs hotlinked from gossip sites, and in one
     case an unedited "X celebrities" placeholder.

     A medical practice cannot publish medical claims about identifiable
     individuals who have not disclosed them, so none of that is carried over.
     Each record below keeps the SUBJECT of its original and the URL it was
     published at, and treats the subject as patient education.
     --------------------------------------------------------------------- */

  {
    slug: 'liposuction-explained', seoTitle: 'Liposuction explained',
    title: 'Liposuction: what it does, and what it does not',
    category: 'Surgical guides', date: '2024-07-17', dateLabel: 'July 17, 2024',
    image: 'ssa-neon.webp', alt: 'The green neon sign on the practice wall: Be the best version of you',
    excerpt: 'A contouring procedure that is often mistaken for a weight-loss one. What it treats, who it suits, and where the limits are.',
    intro: 'Liposuction removes localised deposits of fat to change the contour of an area. It is one of the most familiar cosmetic procedures and one of the most commonly misunderstood.',
    takeaway: 'Liposuction reshapes a specific area. It is not a treatment for obesity and it does not tighten loose skin.',
    source: '3-surprising-celebrities-who-have-had-liposuction',
    sections: [
      { id: 'what-it-does', title: 'What it does', paragraphs: [
        'Liposuction removes fat from a defined area through small incisions, to improve the shape of that area. It is a contouring procedure, aimed at deposits that have not responded to diet and exercise.',
        'It is not a treatment for obesity, and it is not a substitute for weight management. The amount that can be removed safely in one procedure is limited.'
      ] },
      { id: 'skin', title: 'Fat, skin and the difference between them', paragraphs: [
        'Removing fat does not tighten the skin over it. Where skin quality is poor or there is significant laxity, taking away the volume beneath can leave the contour looser rather than smoother.',
        'This is why assessment considers skin as well as fat, and why a different procedure, or a combination, is sometimes the better answer.'
      ] },
      { id: 'candidates', title: 'Who it suits', paragraphs: [
        'The usual description is someone near a stable weight with firm, elastic skin and localised deposits that persist despite consistent effort. General health and any conditions affecting healing are assessed as well.',
        'Weight tends to be more stable after the procedure if it was stable before it. Remaining fat cells elsewhere can still enlarge with weight gain.'
      ] },
      { id: 'recovery', title: 'Recovery and results', paragraphs: [
        'Swelling and bruising follow, and compression garments are usually worn for a period. The final contour is not apparent immediately; it emerges over weeks to months as swelling resolves.',
        'Ask what result is realistic for your anatomy, what the scars will be, and what the plan is if the contour is uneven. Contour irregularity is among the recognised outcomes and is worth discussing before rather than after.'
      ] }
    ],
    relatedTreatment: { href: 'treatments.html', label: 'Explore facial treatments' },
    references: [{ label: 'ASPS: liposuction', url: 'https://www.plasticsurgery.org/cosmetic-procedures/liposuction' }, { label: 'ASPS: patient safety', url: 'https://www.plasticsurgery.org/patient-safety' }]
  },
  {
    slug: 'surgery-after-a-diagnosis',
    title: 'When surgery follows a diagnosis',
    category: 'Perspective', date: '2024-07-25', dateLabel: 'July 25, 2024',
    image: 'bh-dr-stone-product-coat.webp', alt: 'Dr. Mona Stone in a white coat holding a product box in a treatment room',
    excerpt: 'Reconstructive and risk-reducing surgery are decisions made under different pressures than elective cosmetic ones. What changes, and what stays the same.',
    intro: 'Some operations are chosen freely and at leisure. Others follow a diagnosis, a genetic test result or an injury, and are decided in a much shorter time and under considerable strain.',
    takeaway: 'A decision made under pressure still deserves the same questions. Ask for the time to ask them.',
    source: 'celebrities-who-had-breast-surgery-share-their-stories',
    sections: [
      { id: 'different-decision', title: 'A different kind of decision', paragraphs: [
        'Reconstructive surgery addresses structures affected by illness, injury or a condition present from birth. Risk-reducing surgery is offered where a diagnosis or a genetic finding raises the likelihood of future disease.',
        'Neither is a cosmetic decision in the ordinary sense, although both may change appearance. The reasoning starts from medical risk and works towards what the person wants to live with.'
      ] },
      { id: 'time', title: 'The pressure of time', paragraphs: [
        'A diagnosis compresses the timeline, and it is easy to feel that every decision must be made at once. Some genuinely are urgent; many are not as urgent as they feel in the first week.',
        'It is reasonable to ask which parts of the plan are time-critical and which can wait until you have had a second opinion or simply slept on it.'
      ] },
      { id: 'questions', title: 'The questions still apply', paragraphs: [
        'What are the alternatives, including doing nothing for now? What does recovery involve, and over what period? What will follow-up look like, and who coordinates it?',
        'Ask what the result is likely to look and feel like, and what further procedures might follow. Staged plans are common, and knowing that in advance changes how the first stage feels.'
      ] },
      { id: 'talking', title: 'On speaking about it', paragraphs: [
        'People who talk publicly about their own surgery have often prompted others to seek advice they were putting off, and that is a real benefit.',
        'It is equally reasonable not to. What you tell people, and when, is a separate decision from the medical one, and it stays yours.'
      ] }
    ],
    relatedTreatment: { href: 'meet-the-doctor.html', label: 'Meet Dr. Mona Stone' },
    references: [{ label: 'ASPS: reconstructive procedures', url: 'https://www.plasticsurgery.org/reconstructive-procedures' }, { label: 'ASPS: patient safety', url: 'https://www.plasticsurgery.org/patient-safety' }]
  },
  {
    slug: 'hair-restoration',
    title: 'Hair restoration: how it works',
    category: 'Surgical guides', date: '2024-10-10', dateLabel: 'October 10, 2024',
    image: 'ds-hair-mark.webp', alt: 'Marking the hairline before a treatment',
    excerpt: 'Transplantation moves hair rather than creating it. What that means for planning, and why the assessment starts with the cause of the loss.',
    intro: 'Hair restoration covers medical treatment and surgical transplantation, and the two are often used together. What suits a particular person depends first on why the hair is thinning.',
    takeaway: 'A transplant redistributes the hair you have. Establishing the cause of the loss comes before deciding how to treat it.',
    source: 'celebrities-who-underwent-hair-restoration-and-how-it-helped-them',
    sections: [
      { id: 'cause-first', title: 'The cause comes first', paragraphs: [
        'Hair loss has many causes, including pattern hair loss, medical conditions, medication, stress and nutritional factors. Some are reversible; some are not; and some will continue regardless of treatment.',
        'That assessment shapes everything after it. Treating pattern loss and treating a temporary shedding are different problems with different answers.'
      ] },
      { id: 'transplant', title: 'What a transplant involves', paragraphs: [
        'Transplantation moves follicles from an area where hair is growing reliably to an area where it is not. It redistributes existing hair rather than adding new hair, so the donor area sets the limit on what is achievable.',
        'Techniques differ in how the follicles are harvested, which affects the pattern of scarring and the recovery. The transplanted hair typically sheds before regrowing, so the result develops over months.'
      ] },
      { id: 'ongoing', title: 'Loss continues around it', paragraphs: [
        'A transplant does not stop the underlying process. Hair that was thinning before may continue to thin around the transplanted area, which can change the appearance over the years.',
        'This is why medical treatment is often continued alongside, and why the hairline is designed with future loss in mind rather than to the pattern of a much younger person.'
      ] },
      { id: 'expectations', title: 'Setting expectations', paragraphs: [
        'Ask how many grafts are realistic, what density that will produce, and how the plan accounts for further loss. Ask to see results at one year rather than at three months.',
        'Density comparable to unaffected hair is rarely the outcome. A well-planned result is one that looks unremarkable, which is a different goal from restoring what was there at twenty.'
      ] }
    ],
    relatedTreatment: { href: 'treatments.html', label: 'Explore facial treatments' },
    references: [{ label: 'ASPS: hair transplantation and restoration', url: 'https://www.plasticsurgery.org/cosmetic-procedures/hair-transplantation-and-restoration' }]
  },
  {
    slug: 'neck-lift-explained',
    title: 'The neck lift, explained',
    category: 'Facial surgery', date: '2024-07-03', dateLabel: 'July 3, 2024',
    image: 'm-neck-soft.webp', alt: 'Soft study of a neck and jawline',
    excerpt: 'What changes in the neck with time, what the operation addresses, and how it differs from a facelift.',
    intro: 'The neck is often where people first notice change, and it is one of the harder areas to influence without surgery. Understanding what is actually causing the appearance helps in deciding what to do about it.',
    takeaway: 'The right procedure depends on whether the problem is skin, muscle, fat or the position of the jaw beneath.',
    source: 'celebrity-neck-lift-the-secret-behind-hollywoods-glamour',
    sections: [
      { id: 'what-changes', title: 'What changes in the neck', paragraphs: [
        'Several things happen at once: skin loses elasticity, fat is redistributed above and below the muscle layer, the platysma muscle can separate into visible bands, and the underlying bone changes shape over the years.',
        'The appearance people describe as a loss of definition is usually a combination of these rather than any single one, which is why assessment matters more than the label put on the procedure.'
      ] },
      { id: 'what-it-does', title: 'What the operation addresses', paragraphs: [
        'A neck lift repositions and tightens the tissues of the neck, and where appropriate addresses the platysma muscle and removes or redistributes fat. Excess skin is trimmed and redraped.',
        'It works on the area beneath the chin and through the neck. A facelift addresses the cheek and jawline; the two are often planned together when the change crosses the jawline, because treating one alone can look incomplete.'
      ] },
      { id: 'alternatives', title: 'When something less is enough', paragraphs: [
        'Where skin quality is good and the concern is a limited fat deposit, a smaller procedure may achieve what is wanted. Where laxity is the main issue, non-surgical tightening generally does less than the marketing suggests.',
        'An honest assessment sometimes concludes that nothing available will produce the result being asked for, and that is a legitimate answer.'
      ] },
      { id: 'recovery', title: 'Recovery', paragraphs: [
        'Bruising and swelling are expected and settle over several weeks; the final contour continues to refine for months. A dressing or garment is usually worn early on, and activity is restricted for a period.',
        'Ask where the scars sit, how sensation is affected and for how long, and what the plan is if a band or irregularity persists.'
      ] }
    ],
    relatedTreatment: { href: 'neck-lift.html', label: 'About the neck lift' },
    references: [{ label: 'ASPS: neck lift', url: 'https://www.plasticsurgery.org/cosmetic-procedures/neck-lift' }]
  },
  {
    slug: 'neck-lift-questions',
    title: 'Questions worth asking before a neck lift',
    category: 'Facial surgery', date: '2024-09-15', dateLabel: 'September 15, 2024',
    image: 'm-neck-outdoor.webp', alt: 'Portrait outdoors, neck and shoulder in profile',
    excerpt: 'A consultation is a conversation you can steer. The questions that tend to be most useful, and the answers worth listening for.',
    intro: 'People often leave a consultation realising they asked about cost and downtime and nothing else. A few questions consistently produce more useful answers.',
    takeaway: 'Ask what the procedure will not change. The answer tells you more than a list of what it will.',
    source: 'celebrity-neck-lift-what-these-icons-had-to-say-about-it',
    sections: [
      { id: 'what-is-causing', title: 'What is actually causing this?', paragraphs: [
        'Ask the surgeon to describe what they see: skin laxity, fat, muscle banding, jaw position, or a combination. The answer determines which procedure is appropriate and how much it can achieve.',
        'If the explanation is only the name of an operation, ask again. The reasoning should come before the recommendation.'
      ] },
      { id: 'what-wont-change', title: 'What will this not change?', paragraphs: [
        'Every procedure has boundaries. A neck lift does not change skin texture, sun damage or the position of the jaw bone, and it does not stop the tissues ageing further.',
        'A surgeon willing to be specific about the limits is usually the one whose account of the benefits can be trusted.'
      ] },
      { id: 'risks', title: 'What are the risks in my case?', paragraphs: [
        'General complication rates are less useful than what applies to you: your health, medications, smoking history and previous surgery all matter. Ask which risks are raised in your particular situation.',
        'Ask what the plan is if something does not go as expected: how it would be managed, by whom, and at whose cost.'
      ] },
      { id: 'timing', title: 'Is this the right time?', paragraphs: [
        'Recovery needs planning around work, family and any events you have in mind. A procedure booked shortly before a significant date rarely leaves enough room.',
        'It is also fair to ask whether waiting would give a better result. Sometimes it would, and a surgeon who says so is worth listening to.'
      ] }
    ],
    relatedTreatment: { href: 'neck-lift.html', label: 'About the neck lift' },
    references: [{ label: 'ASPS: neck lift', url: 'https://www.plasticsurgery.org/cosmetic-procedures/neck-lift' }, { label: 'ASPS: patient safety', url: 'https://www.plasticsurgery.org/patient-safety' }]
  },
  {
    slug: 'rhinoplasty-explained',
    title: 'Rhinoplasty: appearance and breathing',
    category: 'Facial surgery', date: '2024-08-25', dateLabel: 'August 25, 2024',
    image: 'm-profile-light.webp', alt: 'Profile study in bright, even light',
    excerpt: 'Nose surgery changes a structure that also has a job to do. Why the two are assessed together, and what that means for planning.',
    intro: 'Rhinoplasty changes the shape of the nose. Because the nose is also an airway, the same operation can affect breathing, and the assessment considers both.',
    takeaway: 'Shape and airway are one structure. Ask how a proposed change to the outside affects the inside.',
    source: 'celebrity-nose-job-before-and-after-reveals-stir-the-hollywood-industry',
    sections: [
      { id: 'both-at-once', title: 'One structure, two jobs', paragraphs: [
        'The framework of bone and cartilage that gives the nose its outward shape also forms the airway. Altering one has consequences for the other, in both directions.',
        'Some people come for appearance and discover a breathing problem on examination; others come because of obstruction and find the shape changes as a result of correcting it. Both are ordinary.'
      ] },
      { id: 'assessment', title: 'What the assessment covers', paragraphs: [
        'Examination looks at the external shape, the internal structures including the septum, skin thickness, and how the nose relates to the rest of the face. Skin thickness in particular influences how much fine detail is achievable.',
        'A change that suits one face may not suit another. Planning is done in the context of the whole face rather than to a shape chosen from a photograph.'
      ] },
      { id: 'expectations', title: 'What to expect from the result', paragraphs: [
        'Swelling after rhinoplasty resolves slowly, and the final shape can take a year or more to settle, longer at the tip. Judging the outcome early is a common source of unnecessary worry.',
        'Revision surgery is more common after rhinoplasty than after many procedures, and it is usually deferred until the tissues have fully settled. Ask how that would be handled if it were needed.'
      ] },
      { id: 'deciding', title: 'Deciding', paragraphs: [
        'Bring specifics: what you would like changed, and what you would like left alone. A nose that no longer resembles the rest of the face is a poor result even if the shape in isolation is attractive.',
        'If the request is driven by a passing trend, that is worth naming in the conversation. Bone and cartilage do not follow fashion cycles.'
      ] }
    ],
    relatedTreatment: { href: 'treatments.html', label: 'Explore facial treatments' },
    references: [{ label: 'ASPS: rhinoplasty', url: 'https://www.plasticsurgery.org/cosmetic-procedures/rhinoplasty' }]
  },
  {
    slug: 'reading-before-and-after-photographs',
    title: 'How to read a before-and-after photograph',
    category: 'Perspective', date: '2024-08-01', dateLabel: 'August 1, 2024',
    image: 'bh-ba-dental-pair.webp', alt: 'A patient before and after treatment',
    excerpt: 'The most persuasive images are often the least informative. What to look for, and which differences have nothing to do with surgery.',
    intro: 'Before-and-after photographs are the main evidence most people use to choose a surgeon, and they are easy to make misleading without any intent to deceive.',
    takeaway: 'Compare the lighting, angle and expression first. If those differ, the rest of the comparison is unreliable.',
    source: 'celebrity-plastic-surgery-before-and-after-pictures-what-procedures-they-had',
    sections: [
      { id: 'controls', title: 'What should be identical', paragraphs: [
        'The two photographs should match in camera angle, distance, lighting and background. The head should be in the same position, and the expression should be the same, because a relaxed face in one image and a smile in the other are not comparable.',
        'Differences in any of these change the apparent result substantially. So do makeup, hairstyle and the colour of clothing near the face.'
      ] },
      { id: 'timing', title: 'Ask when the after was taken', paragraphs: [
        'Swelling flatters some results and spoils others depending on the procedure and how early the photograph was taken. An image at six weeks and an image at a year can look quite different.',
        'Ask what interval the practice photographs at, and to see results at the longer interval. Consistency across a series matters more than any single striking pair.'
      ] },
      { id: 'selection', title: 'Remember what you are not seeing', paragraphs: [
        'A gallery shows selected results. That is reasonable, but it means the range is not represented, and the cases most similar to yours may not be the ones displayed.',
        'Ask to see results from someone with a starting point like your own, including any where the outcome was less dramatic.'
      ] },
      { id: 'use', title: 'Using photographs well', paragraphs: [
        'Photographs are useful for showing a surgeon what you like and dislike, and for discussing what is achievable on your anatomy. They are poor as a specification of the result you will get.',
        'The most useful conversation begins with what you would like changed about your own face, rather than with a picture of someone else’s.'
      ] }
    ],
    relatedTreatment: { href: 'results.html', label: 'See results' },
    references: [{ label: 'ASPS: patient safety', url: 'https://www.plasticsurgery.org/patient-safety' }]
  },
  {
    slug: 'rhinoplasty-recovery', seoTitle: 'Rhinoplasty recovery',
    title: 'Rhinoplasty recovery, and why it takes a year',
    category: 'Facial surgery', date: '2024-07-10', dateLabel: 'July 10, 2024',
    image: 'm-profile-dark.webp', alt: 'Profile study against a dark ground',
    excerpt: 'The visible recovery is over in weeks. The result takes considerably longer, and knowing that in advance makes the wait easier.',
    intro: 'People generally plan for the first two weeks after rhinoplasty and are surprised by the year that follows. Both parts are normal.',
    takeaway: 'Do not judge the result at three months. The tip of the nose is the last part to settle.',
    source: 'what-do-these-superstars-have-to-say-about-their-celebrity-nose-jobs',
    sections: [
      { id: 'first-weeks', title: 'The first two weeks', paragraphs: [
        'A splint is usually worn for around a week. Bruising around the eyes is common and settles within roughly two weeks, and congestion is expected while the lining is swollen.',
        'Most people are presentable, though not unchanged, by the end of the second week. Strenuous activity and anything risking a knock to the nose are restricted for longer.'
      ] },
      { id: 'months', title: 'The months after', paragraphs: [
        'Swelling reduces steadily but unevenly. The bridge settles relatively early; the tip, where the skin is thickest, takes much longer and is usually the last area to reach its final shape.',
        'Swelling can also vary through the day and with activity, which makes early self-assessment in the mirror unreliable.'
      ] },
      { id: 'patience', title: 'Why patience is the advice', paragraphs: [
        'Judgements made at three months are frequently revised by twelve. Surgeons generally decline to discuss revision until the tissues have settled, for the same reason.',
        'If something worries you during that period, raise it rather than waiting in silence. Being told that what you are seeing is expected is worth the appointment.'
      ] },
      { id: 'helping', title: 'What helps', paragraphs: [
        'Follow the instructions on sleeping position, nasal care and returning to exercise. Protect the nose from sun while it is healing, and avoid glasses resting on the bridge if you have been told to.',
        'Do not smoke, and ask about any medication or supplement that affects bleeding or healing before you resume it.'
      ] }
    ],
    relatedTreatment: { href: 'treatments.html', label: 'Explore facial treatments' },
    references: [{ label: 'ASPS: rhinoplasty', url: 'https://www.plasticsurgery.org/cosmetic-procedures/rhinoplasty' }]
  },
  {
    slug: 'myellevate-explained', seoTitle: 'MyEllevate for the neck',
    title: 'MyEllevate: a suture-based approach to the neck',
    category: 'Facial surgery', date: '2024-09-01', dateLabel: 'September 1, 2024',
    image: 'm-neck-hand.webp', alt: 'Hand resting lightly at the neck',
    excerpt: 'A less invasive way of supporting the neck and jawline. What it can do, and where a lift remains the better answer.',
    intro: 'MyEllevate uses a suture system, placed through very small entry points, to support the tissues of the neck. It sits between non-surgical treatment and a formal neck lift.',
    takeaway: 'It suits a neck with good skin quality that needs support rather than removal of skin.',
    source: 'myellevate-3-celebrities-who-will-love-this-procedure',
    sections: [
      { id: 'what-it-is', title: 'What it is', paragraphs: [
        'The technique places a suture beneath the skin, through small entry points rather than a long incision, to lift and support the structures under the chin and along the jawline.',
        'It is typically performed under local anaesthetic, sometimes with light sedation, and is often combined with treatment of fat in the same area.'
      ] },
      { id: 'who', title: 'Who it suits', paragraphs: [
        'It is best suited to people whose skin still has reasonable elasticity and whose main concern is definition beneath the chin rather than a surplus of skin.',
        'Where there is substantial loose skin, a procedure that supports without removing skin will not address it. In that situation a neck lift is the more appropriate operation, and being told so is a good sign.'
      ] },
      { id: 'compared', title: 'Compared with a neck lift', paragraphs: [
        'The trade-off is scale against scope. Smaller entry points and a quicker recovery come with a more limited change, and results depend heavily on the starting anatomy.',
        'Ask to see results from patients whose necks resembled yours before treatment, and ask what would happen next if the effect were less than hoped.'
      ] },
      { id: 'expectations', title: 'Recovery and durability', paragraphs: [
        'Swelling and bruising are usually less than after a lift, and most people return to normal activity relatively quickly. There is still a recovery period, and instructions about activity matter.',
        'Ask how long the effect is expected to last for someone with your skin quality, and how the tissues are likely to change afterwards. No procedure stops the process that produced the concern.'
      ] }
    ],
    relatedTreatment: { href: 'myellevate-neck-lift.html', label: 'About MyEllevate' },
    references: [{ label: 'ASPS: neck lift', url: 'https://www.plasticsurgery.org/cosmetic-procedures/neck-lift' }]
  },
  {
    slug: 'living-with-dental-implants',
    title: 'Living with dental implants',
    category: 'Oral & maxillofacial', date: '2024-08-18', dateLabel: 'August 18, 2024',
    image: 'bh-dental-mirror-smile.webp', alt: 'A smiling patient checking her teeth in a hand mirror',
    excerpt: 'Once the treatment is finished, an implant needs looking after. What daily care involves and what to watch for.',
    intro: 'Most discussion of implants stops at the point the crown is fitted. The longer part is what happens afterwards, and it is where the outcome is decided.',
    takeaway: 'Implants do not decay, but the tissue and bone around them can be lost. Cleaning and review are what protect them.',
    source: 'stars-with-dental-implants-shine-bright-in-hollywood',
    sections: [
      { id: 'daily', title: 'Daily care', paragraphs: [
        'Implants are cleaned like teeth: brushing twice a day and cleaning between them daily. The area where the restoration meets the gum needs particular attention, and interdental brushes or a floss designed for implants are often recommended.',
        'Your clinician can show you the technique for your particular restoration, which differs between a single crown, a bridge and an implant-retained denture.'
      ] },
      { id: 'watch-for', title: 'What to watch for', paragraphs: [
        'Bleeding when cleaning, swelling, tenderness or a bad taste around an implant should be reported. Inflammation of the tissue around an implant can progress to loss of the supporting bone if it is left.',
        'Any sense of movement in the restoration, or a screw that feels loose, is worth an appointment rather than waiting for the next review.'
      ] },
      { id: 'habits', title: 'Habits that matter', paragraphs: [
        'Smoking is associated with poorer outcomes around implants. Heavy grinding or clenching puts load on the restoration, and a nightguard is sometimes advised.',
        'Diabetes and other conditions affecting healing are relevant to long-term maintenance as well as to the original surgery, so keep the practice informed if your health changes.'
      ] },
      { id: 'review', title: 'Review', paragraphs: [
        'Implants are reviewed regularly, with radiographs at intervals to check the bone level. This is how a problem is caught while it is still small.',
        'Ask what the review schedule is, what the components are expected to need over time, and what is covered if something wears or fractures.'
      ] }
    ],
    relatedTreatment: { href: 'book.html', label: 'Book a consultation' },
    references: [{ label: 'AAOMS: dental implant surgery', url: 'https://myoms.org/what-we-do/dental-implant-surgery/' }, { label: 'ADA MouthHealthy: implants', url: 'https://www.mouthhealthy.org/all-topics-a-z/implants' }]
  },
  {
    slug: 'cosmetic-surgery-conversation', seoTitle: 'The cosmetic surgery conversation',
    title: 'How the conversation about cosmetic surgery changed',
    category: 'Perspective', date: '2024-08-08', dateLabel: 'August 8, 2024',
    image: 'p-eyes-mirror.webp', alt: 'Reflection caught in a hand mirror',
    excerpt: 'More openness has made good information easier to find and bad information easier to spread. How to tell them apart.',
    intro: 'Cosmetic procedures are discussed more openly than they were, which has been a genuine improvement. It has also produced a great deal of confident, unreliable advice.',
    takeaway: 'Openness is useful when it comes with specifics. Treat anonymous certainty about someone else’s face as entertainment, not information.',
    source: 'celebrity-plastic-surgery-shakes-up-the-scene',
    sections: [
      { id: 'what-improved', title: 'What has genuinely improved', paragraphs: [
        'People considering a procedure can now find first-hand accounts of recovery, which used to be very hard to come by. Knowing what the second week actually feels like is valuable and rarely appears in a brochure.',
        'Openness has also made it easier to ask questions without embarrassment, and to admit that appearance matters to you.'
      ] },
      { id: 'what-did-not', title: 'What has not', paragraphs: [
        'Speculation about what other people have had done is now constant, and most of it is guesswork. Lighting, weight, ageing, dentistry, hairstyle and makeup all change a face, and none of them is surgery.',
        'Treating that speculation as a source of information leads to requests built on a false premise, which is a poor way to start a consultation.'
      ] },
      { id: 'trends', title: 'Procedures are not trends', paragraphs: [
        'Named looks come and go on a cycle of a few years. Surgical changes to bone and tissue do not, and reversing them ranges from difficult to impossible.',
        'A useful test is whether you wanted this before you saw it discussed, and whether you would still want it if the conversation moved on.'
      ] },
      { id: 'sources', title: 'Where to get information', paragraphs: [
        'Professional bodies publish plain descriptions of procedures, risks and recovery, and they are a better starting point than a comment thread.',
        'Then have the conversation in person. General information tells you what a procedure is; only an examination tells you what it would do for you.'
      ] }
    ],
    relatedTreatment: { href: 'meet-the-doctor.html', label: 'Meet Dr. Mona Stone' },
    references: [{ label: 'ASPS: cosmetic procedures', url: 'https://www.plasticsurgery.org/cosmetic-procedures' }, { label: 'ASPS: patient safety', url: 'https://www.plasticsurgery.org/patient-safety' }]
  },
  {
    slug: 'recognising-sleep-apnoea',
    title: 'Recognising sleep apnea',
    category: 'Health & wellbeing', date: '2024-12-03', dateLabel: 'December 3, 2024',
    image: 'bh-recovery-bed-night.webp', alt: 'A woman awake in bed at night, a hand at her chest',
    excerpt: 'The signs are easy to dismiss, and often noticed by someone else first. What to look for and what to do next.',
    intro: 'Sleep apnea is common and frequently goes undiagnosed for years, partly because its main symptoms occur while you are asleep and partly because daytime tiredness has many explanations.',
    takeaway: 'If someone has noticed you stop breathing in your sleep, that is worth a conversation with a clinician regardless of how you feel during the day.',
    source: 'famous-people-with-sleep-apnea-and-what-they-did-to-handle-the-disorder',
    sections: [
      { id: 'signs', title: 'The signs', paragraphs: [
        'Loud, habitual snoring; pauses in breathing observed by a partner; gasping or choking on waking; waking unrefreshed despite adequate time in bed; and persistent daytime sleepiness are the common features.',
        'Morning headaches, difficulty concentrating, irritability and low mood are also reported, and are easily attributed to other things.'
      ] },
      { id: 'why-it-matters', title: 'Why it is worth pursuing', paragraphs: [
        'Untreated sleep apnea is associated with high blood pressure, heart disease and other conditions, and with the risks that come from sleepiness, including at the wheel.',
        'It is also treatable. The tiredness that people assume is simply their life often improves substantially once the underlying disorder is addressed.'
      ] },
      { id: 'diagnosis', title: 'How it is diagnosed', paragraphs: [
        'Diagnosis is made with a sleep study, either at home or in a laboratory, which records breathing and oxygen levels through the night. Symptoms alone are not sufficient because they overlap with other conditions.',
        'Start with your own clinician, who can arrange the assessment. Bring an account from whoever sleeps near you, as it is often the most useful part of the history.'
      ] },
      { id: 'after', title: 'After a diagnosis', paragraphs: [
        'Treatment is chosen according to severity and to where the airway is obstructing, and ranges from positional and lifestyle measures to positive airway pressure, oral appliances and, in selected cases, surgery.',
        'Jaw advancement is one of the surgical options and falls within oral and maxillofacial surgery. It is considered alongside the others rather than as a first step.'
      ] }
    ],
    relatedTreatment: { href: 'book.html', label: 'Book a consultation' },
    references: [{ label: 'NHLBI: sleep apnea', url: 'https://www.nhlbi.nih.gov/health/sleep-apnea' }, { label: 'AASM: obstructive sleep apnea', url: 'https://sleepeducation.org/sleep-disorders/obstructive-sleep-apnea/' }]
  },
  {
    slug: 'morpheus8-explained', seoTitle: 'Radiofrequency microneedling',
    title: 'Radiofrequency microneedling, and what it can reach',
    category: 'Non-surgical', date: '2024-11-07', dateLabel: 'November 7, 2024',
    image: 'ds-morpheus-jaw.webp', alt: 'Device applied along the jawline during treatment',
    excerpt: 'A treatment that combines microneedling with radiofrequency energy. What it addresses, and the difference between tightening and lifting.',
    intro: 'Radiofrequency microneedling delivers energy into the skin through fine needles, aiming to stimulate remodelling in the deeper layers. Morpheus8 is one of the devices in this category.',
    takeaway: 'Expect gradual improvement in skin quality and mild tightening. A device that treats skin does not reposition tissue.',
    source: 'morpheus8-celebrities-and-why-they-love-this-skin-treatment',
    sections: [
      { id: 'how', title: 'How it works', paragraphs: [
        'Fine needles create controlled micro-injuries in the skin while radiofrequency energy is delivered at a set depth. The intention is to prompt the skin to remodel collagen as it heals.',
        'Because the depth can be adjusted, treatment can be directed at the more superficial skin or somewhat deeper, which is what distinguishes it from microneedling alone.'
      ] },
      { id: 'what-it-treats', title: 'What it is used for', paragraphs: [
        'It is generally used for skin texture, fine lines, enlarged pores, some acne scarring and mild laxity. Results build over a series of treatments and continue to develop for some months afterwards.',
        'It is not a substitute for surgery. Where the concern is descended tissue or a surplus of skin, an energy device will not produce the change a lift produces, and claims to the contrary should be treated with caution.'
      ] },
      { id: 'experience', title: 'What treatment involves', paragraphs: [
        'Topical anaesthetic is usually applied beforehand. Redness, swelling and a grid-like pattern on the skin are expected afterwards and typically settle within a few days.',
        'A course of treatments spaced several weeks apart is usual, and results are gradual rather than immediate.'
      ] },
      { id: 'suitability', title: 'Suitability and safety', paragraphs: [
        'Skin type matters, as does a history of pigmentation changes, keloid scarring, active infection or recent isotretinoin use. These are the reasons for an assessment before booking a course.',
        'Ask who will perform the treatment, what device settings are being used and why, and what the plan is if the skin reacts unexpectedly.'
      ] }
    ],
    relatedTreatment: { href: 'treatments.html#nonsurgical', label: 'Explore non-surgical treatments' },
    references: [{ label: 'ASPS: laser skin resurfacing', url: 'https://www.plasticsurgery.org/cosmetic-procedures/laser-skin-resurfacing' }]
  },
  {
    slug: 'neck-liposuction',
    title: 'Neck liposuction and the jawline',
    category: 'Facial surgery', date: '2024-09-08', dateLabel: 'September 8, 2024',
    image: 'bh-m-mature-cheek-2.webp', alt: 'A woman in her fifties with silver-blonde hair, a hand at her cheek',
    excerpt: 'Removing fat beneath the chin can sharpen the jawline, when fat is what is blurring it.',
    intro: 'Submental liposuction removes fat from beneath the chin to improve the definition of the jawline. It works well for the right anatomy and disappoints when the cause of the problem is something else.',
    takeaway: 'It suits a defined fat deposit under good-quality skin. Laxity and muscle banding need a different answer.',
    source: 'neck-liposuction-transforming-celebrity-jawlines',
    sections: [
      { id: 'what-it-does', title: 'What it does', paragraphs: [
        'Through very small incisions, fat is removed from beneath the chin and along the upper neck, allowing the skin to redrape closer to the underlying structures and revealing more of the jawline.',
        'It is often performed alone under local anaesthetic, and sometimes as part of a larger procedure.'
      ] },
      { id: 'when-it-works', title: 'When it works well', paragraphs: [
        'The best results come where there is a discrete deposit of fat, skin with good elasticity, and a reasonable underlying jaw and chin position.',
        'Younger patients often fit that description, but age is not the criterion. Skin quality is.'
      ] },
      { id: 'when-it-does-not', title: 'When it is the wrong procedure', paragraphs: [
        'If the skin is lax, removing the volume beneath it can make the looseness more obvious rather than less. If the platysma muscle has separated into bands, liposuction does not address it.',
        'A recessed chin can also make a neck look fuller than it is, and in that case the useful discussion may be about the chin rather than the fat.'
      ] },
      { id: 'recovery', title: 'Recovery', paragraphs: [
        'A compression garment is usually worn for a period. Swelling and firmness under the chin are normal for several weeks, and the final contour appears gradually.',
        'Ask what result is realistic given your skin, and what the options would be if the contour were uneven or the skin did not redrape as hoped.'
      ] }
    ],
    relatedTreatment: { href: 'neck-lift.html', label: 'About the neck lift' },
    references: [{ label: 'ASPS: liposuction', url: 'https://www.plasticsurgery.org/cosmetic-procedures/liposuction' }, { label: 'ASPS: neck lift', url: 'https://www.plasticsurgery.org/cosmetic-procedures/neck-lift' }]
  },
  {
    slug: 'types-of-dental-implants',
    title: 'The types of dental implant',
    category: 'Oral & maxillofacial', date: '2024-09-21', dateLabel: 'September 21, 2024',
    image: 'bh-implant-parts.webp', alt: 'Dental implant components and crowns on a blue surface',
    excerpt: 'Most implants are one type. The alternatives exist for specific situations, usually where bone is limited.',
    intro: 'Implant treatment is often presented as a choice between types. In practice one type covers the great majority of cases, and the others answer particular problems.',
    takeaway: 'The type follows from the bone available. It is a consequence of the assessment rather than a preference.',
    source: 'know-the-types-of-dental-implants-which-ones-for-you',
    sections: [
      { id: 'endosteal', title: 'Implants placed in the bone', paragraphs: [
        'The standard approach places a fixture directly into the jawbone, where bone grows against it over a period of healing before anything is loaded onto it. This accounts for most implant treatment.',
        'It requires sufficient bone in the right position, which is what the assessment and imaging establish.'
      ] },
      { id: 'when-bone-is-short', title: 'When there is not enough bone', paragraphs: [
        'Bone can be lost after teeth are removed, through gum disease or through injury. Where volume is insufficient, grafting to rebuild the site is the common solution, adding a stage and time to the plan.',
        'Alternative designs exist for situations where grafting is not appropriate, including implants that rest on the bone rather than within it and longer implants anchored in the cheekbone for the upper jaw. These are used in specific circumstances and by surgeons experienced with them.'
      ] },
      { id: 'restoration', title: 'What sits on top', paragraphs: [
        'A single implant may carry one crown. Several implants can support a bridge, or retain a denture that clips into place, which is often how a full arch is restored without an implant for every tooth.',
        'The restoration affects how the result is cleaned and maintained, so it is worth discussing alongside the surgery rather than afterwards.'
      ] },
      { id: 'choosing', title: 'How the choice is made', paragraphs: [
        'The decision follows from imaging, the health of the gums, general health and what is being replaced. It is not a menu to choose from in advance.',
        'Ask why the proposed approach suits your case, what the alternatives were, and what the plan is if the bone turns out to be different from what the scan suggested.'
      ] }
    ],
    relatedTreatment: { href: 'book.html', label: 'Book a consultation' },
    references: [{ label: 'AAOMS: dental implant surgery', url: 'https://myoms.org/what-we-do/dental-implant-surgery/' }]
  },
  {
    slug: 'choosing-weight-management',
    title: 'Choosing an approach to weight management',
    category: 'Health & wellbeing', date: '2024-12-12', dateLabel: 'December 12, 2024',
    image: 'bh-diet-clipboard.webp', alt: 'A clinician writing a plan beside fruit and a tape measure',
    excerpt: 'Programmes differ more in how sustainable they are than in how fast they work. What to weigh up before committing.',
    intro: 'Most approaches produce some loss in the short term. The difference between them shows up later, in whether the change can be maintained.',
    takeaway: 'Judge a programme by whether you could still be doing it in a year, not by what it promises in a month.',
    source: 'tips-on-choosing-the-best-weight-loss-program-for-your-lifestyle',
    sections: [
      { id: 'goal', title: 'Start with the goal', paragraphs: [
        'A goal expressed as a health outcome tends to hold up better than one expressed as a number by a date. Improvements in blood pressure, blood sugar, sleep and mobility often appear well before a target weight does.',
        'Be clear about why you want the change. That answer is what carries a programme through the stage where progress slows.'
      ] },
      { id: 'fit', title: 'Fit it to your life', paragraphs: [
        'A plan that requires food you dislike, time you do not have, or a routine incompatible with your work will end, whatever its merits. Fit matters more than theoretical optimality.',
        'Look for something you could continue in a modified form indefinitely, rather than a period of restriction followed by a return to what you did before.'
      ] },
      { id: 'warning-signs', title: 'What should make you cautious', paragraphs: [
        'Very rapid results, whole food groups eliminated without a clinical reason, proprietary products you must keep buying, and any programme that promises a certain outcome are all reasons to look more closely.',
        'Products marketed for weight loss outside the regulated supply chain carry their own risks, and the FDA has warned about unapproved versions of prescription medicines sold this way.'
      ] },
      { id: 'support', title: 'Get clinical input', paragraphs: [
        'A clinician can check whether an underlying condition or a medication is contributing, and can advise on whether prescription treatment is appropriate for you.',
        'That conversation is also the place to raise a history of disordered eating, which changes what approach is safe.'
      ] }
    ],
    relatedTreatment: { href: 'book.html', label: 'Book a consultation' },
    references: [{ label: 'NIDDK: weight management', url: 'https://www.niddk.nih.gov/health-information/weight-management' }, { label: 'FDA: concerns with unapproved GLP-1 drugs used for weight loss', url: 'https://www.fda.gov/drugs/drug-alerts-and-statements/fdas-concerns-unapproved-glp-1-drugs-used-weight-loss' }]
  },
  {
    slug: 'chin-sculpting',
    title: 'Chin sculpting and facial proportion',
    category: 'Facial surgery', date: '2024-12-11', dateLabel: 'December 11, 2024',
    image: 'm-chin.webp', alt: 'Study of a chin and jaw in profile',
    excerpt: 'The chin sets much of the balance of a profile. Small changes to its position can alter how the whole face reads.',
    intro: 'The chin is frequently the structure behind a concern people describe elsewhere: a nose that seems large, a neck that seems full. Assessing the profile as a whole often explains why.',
    takeaway: 'A profile is a set of relationships. Judge a proposed change by how it affects the whole, not the single feature.',
    source: 'who-did-what-101-a-quick-look-at-chin-sculpting-and-reshaping-celebrities',
    sections: [
      { id: 'proportion', title: 'Why proportion matters', paragraphs: [
        'The nose, lips, chin and neck are read together. A chin that sits further back than the rest of the profile can make the nose appear more prominent and the area beneath the chin appear fuller, even where neither is unusual in itself.',
        'This is why a consultation about the nose sometimes turns into a conversation about the chin, and why photographs of the profile are part of the assessment.'
      ] },
      { id: 'options', title: 'How the chin can be changed', paragraphs: [
        'Genioplasty repositions the patient’s own chin bone, allowing it to be advanced, reduced or moved vertically. An implant adds projection using a shaped material placed over the bone.',
        'Non-surgical options using filler can add limited projection temporarily. They suit small changes and are not equivalent to moving bone.'
      ] },
      { id: 'choosing', title: 'Choosing between them', paragraphs: [
        'The choice depends on how much change is needed and in which direction, on the bite, and on the soft tissue over the chin. Repositioning bone can address vertical height and asymmetry in ways an implant cannot.',
        'Where the bite is significantly affected, the discussion may widen to jaw surgery rather than the chin alone.'
      ] },
      { id: 'risks', title: 'Risks worth discussing', paragraphs: [
        'Altered sensation of the lower lip and chin is a recognised risk with procedures in this area and should be discussed specifically. With implants, movement and infection are the issues to ask about.',
        'Ask what revision would involve for the option proposed, and how the result is expected to look as the face changes over the years.'
      ] }
    ],
    relatedTreatment: { href: 'treatments.html', label: 'Explore facial treatments' },
    references: [{ label: 'ASPS: chin surgery', url: 'https://www.plasticsurgery.org/cosmetic-procedures/chin-surgery' }, { label: 'ASPS: facial implants', url: 'https://www.plasticsurgery.org/cosmetic-procedures/facial-implants' }]
  },
  {
    slug: 'preventing-facial-injury',
    title: 'Preventing facial injury',
    category: 'Safety & recovery', date: '2024-12-09', dateLabel: 'December 9, 2024',
    image: 'bh-doctor-exam-cheek.webp', alt: 'A doctor examining a woman’s cheek in a bright clinic',
    excerpt: 'Most facial injuries come from a small number of causes, and the measures that prevent them are unglamorous and effective.',
    intro: 'A surgeon who repairs facial injuries sees the same causes repeatedly. The protective measures are well established and mostly ignored until afterwards.',
    takeaway: 'A mouthguard and a seatbelt prevent more facial injuries than anything a surgeon does afterwards.',
    source: 'tips-on-how-to-protect-yourself-from-facial-trauma',
    sections: [
      { id: 'sport', title: 'Sport', paragraphs: [
        'A properly fitted mouthguard protects the teeth and reduces injury to the soft tissues, and helmets or face guards are appropriate in the sports that specify them. A custom-fitted guard is more comfortable and more likely to be worn than a boil-and-bite one.',
        'Wear the protection in training as well as in matches. A significant share of injuries happen when the stakes seemed low enough to skip it.'
      ] },
      { id: 'vehicles', title: 'On the road', paragraphs: [
        'Seatbelts and correctly fitted child restraints prevent facial injuries as well as more serious ones. Helmets do the same for cyclists and motorcyclists, and a full-face design protects the jaw where an open one does not.',
        'These remain the single largest preventable category.'
      ] },
      { id: 'home', title: 'At home', paragraphs: [
        'Falls account for many facial injuries, particularly among small children and older adults. Stair gates, secured rugs, adequate lighting, grab rails where appropriate and attention to medication that causes dizziness all reduce the risk.',
        'Reviewing balance and eyesight is a practical measure for older family members, and an easier conversation before an injury than after one.'
      ] },
      { id: 'if-it-happens', title: 'If an injury does happen', paragraphs: [
        'Have it assessed, even where the outside looks minor. Damage to bone, teeth, the eye or a nerve is not always visible, and treatment is more straightforward early.',
        'Seek emergency care for loss of consciousness, changes to vision, heavy bleeding, or difficulty breathing or swallowing.'
      ] }
    ],
    relatedTreatment: { href: 'book.html', label: 'Book a consultation' },
    references: [{ label: 'AAOMS: facial injury and trauma surgery', url: 'https://myoms.org/what-we-do/facial-injury-trauma-surgery/' }]
  },
  {
    slug: 'chemical-peels',
    title: 'Chemical peels: depth, downtime and results',
    category: 'Skin', date: '2024-11-11', dateLabel: 'November 11, 2024',
    image: 'ds-peel-lift.webp', alt: 'Peel preparation, gloved hands and dish',
    excerpt: 'Peels vary enormously in strength. Depth is what determines the result, the recovery and the risk.',
    intro: 'A chemical peel applies a solution that removes the outer layers of skin in a controlled way. The word covers everything from a lunchtime treatment to a procedure with a fortnight of recovery.',
    takeaway: 'Ask which depth is being proposed. It determines the result, the downtime and the risk more than the brand name does.',
    source: 'top-3-celebrities-that-had-chemical-peels-know-the-hollywood-secret-to-radiant-skin',
    sections: [
      { id: 'depth', title: 'Depth is the variable that matters', paragraphs: [
        'Superficial peels act on the outermost layer and give a modest freshening with little downtime, usually as a series. Medium peels reach further and address fine lines and pigmentation with a recovery measured in days.',
        'Deep peels produce the greatest change and involve significant recovery, more careful patient selection and greater risk. They are a different proposition from the other two.'
      ] },
      { id: 'what-they-treat', title: 'What they address', paragraphs: [
        'Peels are used for skin texture, dullness, sun damage, some forms of pigmentation and fine lines. Deeper lines and any laxity are not treated by resurfacing the skin.',
        'Results are gradual with superficial peels and more evident with deeper ones, and in every case a course of maintenance and sun protection influences how long the result lasts.'
      ] },
      { id: 'skin-type', title: 'Skin type and risk', paragraphs: [
        'The main risks are pigmentation change, prolonged redness, infection and, with deeper peels, scarring. The risk of pigmentation change is higher in darker skin, and both the agent and the depth are chosen accordingly.',
        'A history of cold sores, recent isotretinoin use, active skin infection and recent sun exposure all affect whether and when a peel is appropriate.'
      ] },
      { id: 'aftercare', title: 'Aftercare', paragraphs: [
        'Sun protection afterwards is not optional; it is the main thing protecting the result and preventing pigmentation problems. Follow the instructions on cleansing and moisturising, and do not pick at peeling skin.',
        'Ask who will perform the treatment, what agent and strength will be used, and what happens if the skin reacts more than expected.'
      ] }
    ],
    relatedTreatment: { href: 'treatments.html#nonsurgical', label: 'Explore non-surgical treatments' },
    references: [{ label: 'ASPS: chemical peel', url: 'https://www.plasticsurgery.org/cosmetic-procedures/chemical-peel' }]
  },
  {
    slug: 'facial-implants',
    title: 'Facial implants: cheek, chin and jaw',
    category: 'Facial surgery', date: '2024-12-02', dateLabel: 'December 2, 2024',
    image: 'bh-filler-chin-gloves.webp', alt: 'A gloved hand treating a smiling woman’s chin',
    excerpt: 'Implants add structure where the underlying bone is the limiting factor. What they can do that soft-tissue treatments cannot.',
    intro: 'Facial implants add permanent projection to the facial skeleton. They address a different problem from fillers or a lift, which is the distinction most worth understanding.',
    takeaway: 'Implants change the structure beneath. Fillers change volume above it, and lifts reposition what is there.',
    source: 'why-are-people-choosing-facial-implants-understanding-the-benefits',
    sections: [
      { id: 'what-they-do', title: 'What they do', paragraphs: [
        'A facial implant is a shaped, biocompatible material placed over the bone to add projection or definition, most commonly at the chin, the jaw angle or the cheek.',
        'Because they sit on the skeleton, they change the underlying shape rather than adding volume to soft tissue. That is why they can achieve definition that filler cannot, and why they are a bigger decision.'
      ] },
      { id: 'versus', title: 'Compared with the alternatives', paragraphs: [
        'Fillers can produce a similar impression in some areas, temporarily and with no operation, and they are a reasonable way to explore whether more projection suits you. Repeated large-volume filler is not an economical or predictable long-term substitute.',
        'Where the patient’s own bone can be repositioned instead, as with genioplasty at the chin, that may be preferable, particularly where height or asymmetry needs correcting.'
      ] },
      { id: 'procedure', title: 'The procedure and recovery', paragraphs: [
        'Implants are usually placed through incisions inside the mouth or in a concealed position, and secured so they cannot move. Swelling is considerable at first and settles over weeks.',
        'Numbness in the area is common early on and usually temporary, though altered sensation can persist.'
      ] },
      { id: 'risks', title: 'Risks and the long view', paragraphs: [
        'The specific risks are infection, movement of the implant and asymmetry, any of which may require a further procedure. Ask what material is being used, how it is fixed and what removal or exchange would involve.',
        'An implant is intended to be permanent, but it is also removable, which is a genuine advantage over irreversible reduction of bone.'
      ] }
    ],
    relatedTreatment: { href: 'treatments.html', label: 'Explore facial treatments' },
    references: [{ label: 'ASPS: facial implants', url: 'https://www.plasticsurgery.org/cosmetic-procedures/facial-implants' }]
  },
  {
    slug: 'co2-laser-resurfacing',
    title: 'CO2 laser resurfacing: what to know',
    category: 'Skin', date: '2024-12-14', dateLabel: 'December 14, 2024',
    image: 'gen-laser-device.webp', alt: 'Laser device in a treatment room',
    excerpt: 'One of the more powerful skin treatments available, with a recovery to match. Who it suits and what it asks of you.',
    intro: 'CO2 laser resurfacing removes the outer layers of skin and heats the layers beneath, prompting remodelling as the skin heals. It produces substantial change and requires substantial recovery.',
    takeaway: 'The recovery is the part to plan for. Ask for the fully ablative timeline, not the fractional one, if that is what is proposed.',
    source: 'co2-laser-skin-resurfacing-top-details-to-know-about-the-procedure',
    sections: [
      { id: 'how', title: 'How it works', paragraphs: [
        'The laser removes the surface layer of skin while delivering heat to the dermis beneath. New skin forms over the treated area, and collagen remodelling continues for months afterwards.',
        'Fractional treatments target columns of skin and leave untreated tissue between them, which shortens recovery at the cost of some intensity. Fully ablative treatment covers the whole surface and does the reverse.'
      ] },
      { id: 'what-it-treats', title: 'What it treats', paragraphs: [
        'It is used for sun damage, uneven pigmentation, fine and deeper lines, and some scarring, particularly around the mouth and eyes where lines are difficult to address otherwise.',
        'Like every resurfacing treatment, it works on the skin. It does not lift or reposition tissue, and a face with significant laxity will not be tightened by it.'
      ] },
      { id: 'recovery', title: 'The recovery', paragraphs: [
        'Expect redness, swelling, oozing and crusting in the first days, with the skin taking one to two weeks to re-epithelialise depending on depth. Redness can persist for weeks to months afterwards.',
        'This needs planning around work and commitments. Diligent aftercare during that period is what determines the result and prevents complications.'
      ] },
      { id: 'risks', title: 'Risks and selection', paragraphs: [
        'Pigmentation change, infection, prolonged redness and scarring are the recognised risks, and pigmentation risk is higher in darker skin types. A history of cold sores usually means antiviral treatment beforehand.',
        'Strict sun avoidance and protection afterwards are essential. Ask who performs the treatment, at what settings, and how complications would be managed.'
      ] }
    ],
    relatedTreatment: { href: 'treatments.html#nonsurgical', label: 'Explore non-surgical treatments' },
    references: [{ label: 'ASPS: laser skin resurfacing', url: 'https://www.plasticsurgery.org/cosmetic-procedures/laser-skin-resurfacing' }]
  },
  {
    slug: 'facial-treatments-for-men',
    title: 'Facial treatments for men',
    category: 'Perspective', date: '2024-10-02', dateLabel: 'October 2, 2024',
    image: 'bh-laser-jaw.webp', alt: 'A device treating the skin along a man’s jaw',
    excerpt: 'The anatomy differs, and so does what most men ask for. What that changes about planning.',
    intro: 'More men are asking about facial treatment, and the useful differences are anatomical rather than a matter of marketing.',
    takeaway: 'The common request is to look less tired rather than different. That is a planning instruction worth stating plainly.',
    source: 'lets-get-to-know-celebrities-with-male-facial-enhancement',
    sections: [
      { id: 'anatomy', title: 'What differs anatomically', paragraphs: [
        'Male skin is generally thicker, with a richer blood supply, and facial hair changes where incisions can be concealed and how skin is redraped. Brow position, jaw width and the pattern of fat differ as well.',
        'These influence technique and planning. A procedure carried out without regard to them can produce a result that reads as feminised, which is usually the opposite of what was asked for.'
      ] },
      { id: 'requests', title: 'What men usually ask for', paragraphs: [
        'The most common requests concern the eyes and the neck: looking tired when rested, heaviness of the upper lids, and loss of definition beneath the chin.',
        'Alongside those sit hair restoration and skin treatment. The stated aim is very often to look like themselves on a good day rather than to look different.'
      ] },
      { id: 'non-surgical', title: 'Non-surgical considerations', paragraphs: [
        'Stronger facial musculature means dosing for botulinum toxin is often different, and a heavy hand produces an obviously treated look that most patients are specifically trying to avoid.',
        'A conservative approach, reviewed and adjusted, is usually the better route for a first treatment.'
      ] },
      { id: 'consultation', title: 'At the consultation', paragraphs: [
        'Say plainly what you do not want as well as what you do. "I do not want anyone to be able to tell" is a legitimate and useful brief.',
        'Ask to see results on men with a similar starting point, and be clear about how much downtime you can actually take.'
      ] }
    ],
    relatedTreatment: { href: 'treatments.html', label: 'Explore facial treatments' },
    references: [{ label: 'ASPS: cosmetic procedures', url: 'https://www.plasticsurgery.org/cosmetic-procedures' }]
  },
  {
    slug: 'glp-1-medicines-and-the-face',
    title: 'GLP-1 medicines and changes in the face',
    category: 'Health & wellbeing', date: '2024-10-14', dateLabel: 'October 14, 2024',
    image: 'ds-dysport-chair.webp', alt: 'Treatment chair prepared in a quiet room',
    excerpt: 'Rapid weight loss shows in the face early. Why that happens, and what is worth doing about it, including waiting.',
    intro: 'People losing weight quickly on GLP-1 medicines often notice the change in their face before anywhere else, and are sometimes unsettled by it.',
    takeaway: 'Let the weight stabilise before deciding on facial treatment. Faces continue to change while the weight is still moving.',
    source: 'oprah-winfrey-and-skinny-shot-or-glp-1-how-the-injections-can-help-with-weight-loss',
    sections: [
      { id: 'why', title: 'Why the face changes', paragraphs: [
        'The face holds distinct compartments of fat that give it fullness and support the overlying skin. Substantial weight loss reduces that volume, and because the face has little spare skin, the loss shows as hollowing and as folds becoming more apparent.',
        'The effect is more noticeable when loss is rapid, and more noticeable with age, as skin elasticity is lower and recovers less.'
      ] },
      { id: 'not-a-side-effect', title: 'It is not a side effect of the drug', paragraphs: [
        'The change reflects the weight loss rather than a specific action of the medicine on the face. The same appears after rapid loss by any means.',
        'That matters, because it makes it a question about timing and about the rate of loss, which a prescriber can discuss with you.'
      ] },
      { id: 'what-helps', title: 'What can be done', paragraphs: [
        'The first advice is to wait. Faces continue to change while weight is still moving, and treatment planned mid-course often needs revisiting.',
        'Once weight is stable, options range from restoring volume with fillers or fat, to skin treatments, to surgery where laxity is the dominant issue. Which is appropriate depends on how much of the change is volume and how much is skin.'
      ] },
      { id: 'safely', title: 'Doing it safely', paragraphs: [
        'Keep the prescriber informed, particularly about any planned procedure, since these medicines slow gastric emptying and that is relevant to sedation and anaesthesia. Tell your surgeon or anaesthetist you are taking one.',
        'Buy only through a regulated route. The FDA has warned about unapproved and compounded versions where the contents and dose may not be as claimed.'
      ] }
    ],
    relatedTreatment: { href: 'book.html', label: 'Book a consultation' },
    references: [{ label: 'FDA: concerns with unapproved GLP-1 drugs used for weight loss', url: 'https://www.fda.gov/drugs/drug-alerts-and-statements/fdas-concerns-unapproved-glp-1-drugs-used-weight-loss' }, { label: 'NIDDK: weight management', url: 'https://www.niddk.nih.gov/health-information/weight-management' }]
  },
  {
    slug: 'tmj-disorder',
    title: 'TMJ disorder: living with jaw pain',
    category: 'Oral & maxillofacial', date: '2024-10-21', dateLabel: 'October 21, 2024',
    image: 'bh-toothache.webp', alt: 'A woman holding her jaw in pain',
    excerpt: 'Jaw pain, clicking and restricted opening are common and often improve with conservative treatment. Surgery is rarely the first answer.',
    intro: 'Disorders of the temporomandibular joint and the muscles around it are common. They are also, in most cases, manageable without surgery, which is worth knowing before the search for a specialist begins.',
    takeaway: 'Most TMJ pain improves with conservative measures. Be cautious of any plan that begins with an irreversible change to your bite.',
    source: 'leann-rimes-and-her-tmj-disorder-how-she-lived-with-it',
    sections: [
      { id: 'what-it-is', title: 'What it covers', paragraphs: [
        'The term covers several conditions affecting the jaw joints and the muscles that move them. Symptoms include pain around the joint or in the muscles, clicking or grating, restricted opening, and headaches or earache with no ear cause.',
        'Clicking without pain or restriction is common and does not by itself require treatment.'
      ] },
      { id: 'causes', title: 'What contributes', paragraphs: [
        'Clenching and grinding, stress, injury, arthritis and habits such as nail biting or heavy chewing can all contribute. Frequently more than one factor is involved and no single cause is identified.',
        'Symptoms often fluctuate, improving and returning in a way that tracks periods of stress or workload.'
      ] },
      { id: 'first-line', title: 'What usually helps first', paragraphs: [
        'Conservative measures are the starting point: a softer diet during flare-ups, avoiding wide opening and hard or chewy foods, heat or cold, gentle jaw exercises, and attention to clenching. Simple analgesia is used short term.',
        'A splint or nightguard may be recommended where grinding is a factor. Addressing sleep and stress is not a token suggestion here; it often makes the clearest difference.'
      ] },
      { id: 'specialist', title: 'When to seek more', paragraphs: [
        'Persistent pain, a jaw that locks open or closed, or a significant change in the bite warrant assessment. Imaging is used selectively rather than routinely.',
        'Surgery is reserved for specific diagnoses that have not responded to conservative care. Be wary of extensive irreversible dental work proposed as a cure; the evidence for permanently altering the bite to treat TMJ symptoms is limited.'
      ] }
    ],
    relatedTreatment: { href: 'book.html', label: 'Book a consultation' },
    references: [{ label: 'AAOMS: TMJ and facial pain', url: 'https://myoms.org/what-we-do/tmj-and-facial-pain/' }]
  }
];
