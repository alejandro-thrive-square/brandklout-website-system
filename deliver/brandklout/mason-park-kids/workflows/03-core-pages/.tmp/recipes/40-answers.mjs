// The four pages that are nothing but questions.
//
// > [!IMPORTANT]
// > THE QUESTIONS WERE MISSING. The 02 migration imported both topic FAQ pages
// > with the ANSWERS intact and the QUESTIONS gone: the WordPress accordion
// > kept its question text in a widget the recovery mirror never rendered. Live,
// > /pediatric-dentistry-faqs-katy-tx/ is thirty orphaned answers under six
// > section headings, and /invisalign-faqs-katy-tx/ is the same shape. Read
// > either page today and it is a wall of statements with nothing to hang them
// > on.
// >
// > Every `q:` below is the question restored to its own answer. The ANSWER is
// > the practice's, verbatim, by block reference, and it is sitting directly
// > under its question where anyone can check that the two match. The core
// > service page did this for seven of them on 2026-09-02; this finishes it.
// >
// > /faq-page/ is a different problem and got a different answer. It was the
// > PARENT practice's FAQ, start to finish: "Mason Park Family Dental of Katy",
// > "Where is Dr. Sung located?", "Where can I get teeth whitening in Katy?",
// > "Who is the best cosmetic dentist in Katy?". None of that is this practice,
// > and three of those answers describe services this practice does not offer
// > to children. It is rebuilt here as the pediatric FAQ hub, answering the
// > questions this practice actually gets, from its own pediatric FAQ.

const PED = 'pediatric-dentistry-faqs-katy-tx';
const INV = 'invisalign-faqs-katy-tx';

export default [

// -------------------------------------------------- pediatric dentistry FAQ
{
  slug: PED,
  title: 'Pediatric Dentistry FAQs | Mason Park Dental for Kids, Katy TX',
  description: 'Thirty questions parents ask about first visits, cleanings, cavities, fear-free dentistry, special needs care, emergencies and insurance. Answered by the practice.',
  eyebrow: 'Questions',
  h1: 'Thirty questions, answered the way we answer them in the room.',
  em: 'in the room',
  lede: 'At Mason Park Dental for Kids in Katy, TX, we know parents want to feel confident and informed about their child’s dental health. Below are the questions we are asked most.',
  cta: 'Book a visit', cta2: 'Start reading', cta2href: 'general',
  hero: { img: 'team', alt: 'The team at Mason Park Dental for Kids in the waiting room' },
  crumbs: [['Patients', '/new-patients/'], 'Pediatric dentistry FAQs'],
  chapters: [
    { k: 'qa', id: 'general', name: 'The Basics', title: 'First visits, and how often.', theme: 'warm',
      items: [
        { q: 'When should my child first visit the dentist?', a: [3] },
        { q: 'How often should kids come in?', a: [4] },
        { q: 'Why a pediatric dentist rather than a family dentist?', a: [5] },
      ] },
    { k: 'qa', id: 'preventive', name: 'Cleanings', title: 'What happens at a cleaning.', theme: 'sage',
      items: [
        { q: 'What happens during a cleaning?', a: [7] },
        { q: 'Is fluoride safe for children?', a: [8] },
        { q: 'How can I prevent cavities at home?', a: [9] },
      ] },
    { k: 'band', id: 'band-1', name: 'The Practice', img: 'operatory', alt: 'A hygienist at the sink in a treatment room',
      caption: 'The practice’s own treatment room.' },
    { k: 'qa', id: 'cavities', name: 'Cavities', title: 'Decay, fillings, and baby teeth.', theme: 'sky',
      items: [
        { q: 'Why do children get cavities more easily than adults?', a: [11] },
        { q: 'What is a tooth-coloured filling?', a: [12] },
        { q: 'Do baby teeth really matter?', a: [13] },
      ] },
    { k: 'qa', id: 'fear', name: 'The Nervous Child', title: 'Fear, and what to do about it.', theme: 'warm',
      items: [
        { q: 'How do I prepare a nervous child?', a: [15] },
        { q: 'What do you do to help a frightened child?', a: [16] },
        { q: 'Can I stay in the room with my child?', a: [17] },
      ] },
    { k: 'qa', id: 'special', name: 'Special Needs', title: 'Care that is arranged around the child.', theme: 'sage',
      items: [
        { q: 'Do you treat children with special needs?', a: [19] },
        { q: 'What do you do differently for them?', a: [20] },
        { q: 'Can my child be sedated if they need to be?', a: [21] },
      ] },
    { k: 'qa', id: 'emergency', name: 'Emergencies', title: 'When something has already happened.', theme: 'sky',
      items: [
        { q: 'What should I do if my child knocks out a tooth?', a: [23] },
        { q: 'What counts as a dental emergency?', a: [24] },
        { q: 'Do you see emergencies the same day?', a: [25] },
      ] },
    { k: 'qa', id: 'money', name: 'Insurance and Booking', title: 'Paying for it, and getting in.', theme: 'warm',
      items: [
        { q: 'Do you take insurance?', a: [27] },
        { q: 'Is there anything for families without a plan?', a: [28] },
        { q: 'How do I book?', a: [29] },
      ] },
    { k: 'invite', title: 'If your question is not here, ask it.',
      lede: 'Mason Park Dental for Kids provides gentle, compassionate pediatric dentistry for infants, children and teens in Katy, TX. Call and ask, or bring the question to the appointment.',
      shot: { img: 'st-crayons', alt: 'Crayons and a child’s drawing on a table' },
      related: [['Invisalign FAQs', '/invisalign-faqs-katy-tx/'], ['New patients', '/new-patients/'], ['Comprehensive pediatric dentistry', '/services/comprehensive-pediatric-dentistry/']] },
  ],
},

// ---------------------------------------------------------- Invisalign FAQ
{
  slug: INV,
  title: 'Invisalign FAQs for Parents | Mason Park Dental for Kids, Katy TX',
  description: 'Twenty-one questions about Invisalign for kids and teens: safety, the digital scan, wear time, comfort, cleaning, eating, candidacy, cost and insurance.',
  eyebrow: 'Questions',
  h1: 'Straightening your child’s smile is a big decision.',
  em: 'a big decision',
  lede: 'Parents often have many questions before they start. These are the ones we are asked, grouped the way the treatment actually unfolds.',
  cta: 'Book a consultation', cta2: 'Start reading', cta2href: 'general',
  hero: { img: 'st-teen', alt: 'A smiling teenager outdoors' },
  crumbs: [['Services', '/our-services/'], ['Invisalign', '/services/invisalign/'], 'Invisalign FAQs'],
  chapters: [
    { k: 'qa', id: 'general', name: 'The Basics', title: 'What it is, and whether it is safe.', theme: 'warm',
      items: [
        { q: 'What is Invisalign?', a: [3] },
        { q: 'Is it safe for kids and teens?', a: [4] },
        { q: 'How is it different from traditional braces?', a: [5] },
      ] },
    { k: 'qa', id: 'process', name: 'The Process', title: 'From the consultation to the checkups.', theme: 'sage',
      items: [
        { q: 'How does treatment start?', a: [7] },
        { q: 'What is the digital scan for?', a: [8] },
        { q: 'How often will we come in?', a: [9] },
      ] },
    { k: 'band', id: 'band-1', name: 'The Practice', img: 'smile', alt: 'Dr. Nguyen beside a smiling child in a treatment room' },
    { k: 'qa', id: 'duration', name: 'Time', title: 'How long, and how many hours a day.', theme: 'sky',
      items: [
        { q: 'How long does treatment take?', a: [11] },
        { q: 'How many hours a day must they be worn?', a: [12] },
        { q: 'What if my child forgets to wear them?', a: [13] },
      ] },
    { k: 'qa', id: 'comfort', name: 'Comfort and Care', title: 'Does it hurt, and how do we clean them.', theme: 'warm',
      items: [
        { q: 'Does Invisalign hurt?', a: [15] },
        { q: 'How do we clean the aligners?', a: [16] },
        { q: 'Will they irritate my child’s gums or cheeks?', a: [17] },
      ] },
    { k: 'qa', id: 'eating', name: 'Eating and Brushing', title: 'Meals, brushing, and what they can drink.', theme: 'sage',
      items: [
        { q: 'Are there foods my child has to give up?', a: [19] },
        { q: 'What about brushing and flossing?', a: [20] },
        { q: 'Can they drink with the aligners in?', a: [21] },
      ] },
    { k: 'qa', id: 'candidacy', name: 'Candidacy', title: 'Whether it is right for your child.', theme: 'sky',
      items: [
        { q: 'Who is a good candidate?', a: [23] },
        { q: 'Does my child have to be responsible enough?', a: [24] },
        { q: 'What if an aligner is lost or broken?', a: [25] },
      ] },
    { k: 'qa', id: 'cost', name: 'Cost', title: 'Insurance, financing, and afterwards.', theme: 'warm',
      items: [
        { q: 'Does insurance cover Invisalign?', a: [27] },
        { q: 'Do you offer financing?', a: [28] },
        { q: 'Will my child need a retainer afterwards?', a: [29] },
      ] },
    { k: 'invite', title: 'Book the consultation and we will tell you either way.',
      lede: 'Give your child the gift of a confident, aligned smile with Invisalign at Mason Park Dental for Kids in Katy, TX. There is a complimentary Invisalign consultation, and currently $1,000 off treatment.',
      cta: 'Book a consultation',
      shot: { img: 'st-case', alt: 'A small clear case on a bathroom shelf' },
      related: [['Invisalign', '/services/invisalign/'], ['Special offers', '/special-offers/'], ['Retainers', '/services/retainers/']] },
  ],
},

// ------------------------------------------------------------- the FAQ hub
{
  slug: 'faq-page',
  title: 'Frequently Asked Questions | Mason Park Dental for Kids, Katy TX',
  description: 'The questions parents ask most: when to come first, how often, what to bring, what x-rays are for, and how to book. Mason Park Dental for Kids, Katy, TX.',
  eyebrow: 'Questions',
  h1: 'The ten we are asked most, and where the rest of them live.',
  em: 'the rest of them',
  lede: 'Two longer FAQs sit behind this page, one for pediatric dentistry in general and one for Invisalign. These are the questions that come up before either of those.',
  cta: 'Book a visit', cta2: 'The questions', cta2href: 'top',
  hero: { img: 'waiting', alt: 'The waiting room at Mason Park Dental for Kids' },
  crumbs: [['Patients', '/new-patients/'], 'FAQs'],
  chapters: [
    { k: 'qa', id: 'top', name: 'The Ten', title: 'What parents ask before they book.', theme: 'warm',
      lede: 'Every answer here is the practice’s own, from the pediatric dentistry FAQ.',
      items: [
        { q: 'When should my child first visit the dentist?', a: [[PED, 3]] },
        { q: 'How often should kids come in?', a: [[PED, 4]] },
        { q: 'Why a pediatric dentist rather than a family dentist?', a: [[PED, 5]] },
        { q: 'Do you accept new patients?', a: ['Yes. New and existing patients are welcome, from the first tooth through the teenage years. There is a new patient special of $129 for ages 12 and under, which includes a comprehensive exam, necessary x-rays and cleaning, plus a free fluoride treatment.'] },
        { q: 'Why does my child need dental x-rays?', a: ['Digital x-rays magnify and enhance the teeth for better diagnosis and treatment, and let us see the teeth and surrounding structures with remarkable accuracy. They require much less radiation than traditional film x-rays, and we take them only if they are necessary.'] },
        { q: 'What do I need to bring to the first appointment?', a: ['Photo ID and a copy of your insurance details, if you have a plan, plus the patient forms if you filled them in at home. If you have not, arrive twenty minutes early and the front desk will help.'] },
        { q: 'Can I stay in the room with my child?', a: [[PED, 17]] },
        { q: 'How do I prepare a nervous child?', a: [[PED, 15]] },
        { q: 'Do you take insurance?', a: [[PED, 27]] },
        { q: 'How do I book?', a: [[PED, 29]] },
      ] },
    { k: 'links', id: 'more', name: 'More', title: 'The two longer FAQs.', theme: 'sage',
      lede: 'Fifty more questions between them, grouped by topic and all answered by the practice.',
      cols: 2,
      groups: [
        { h: 'Pediatric dentistry FAQs', p: 'Thirty questions on first visits, cleanings, cavities, fear, special needs care, emergencies and insurance.', links: [['Read the pediatric FAQ', '/pediatric-dentistry-faqs-katy-tx/']] },
        { h: 'Invisalign FAQs', p: 'Twenty-one questions on aligners for kids and teens: wear time, comfort, eating, candidacy and cost.', links: [['Read the Invisalign FAQ', '/invisalign-faqs-katy-tx/']] },
      ] },
    { k: 'invite', title: 'Ask us the one that is not here.',
      lede: 'Call the office, or write it down and bring it to the appointment. There is time in the visit for it.',
      shot: { img: 'st-books', alt: 'A stack of children’s picture books' },
      related: [['Pediatric dentistry FAQs', '/pediatric-dentistry-faqs-katy-tx/'], ['Invisalign FAQs', '/invisalign-faqs-katy-tx/'], ['Dental dictionary', '/dental-dictionary/']] },
  ],
},

// -------------------------------------------------------- dental dictionary
{
  slug: 'dental-dictionary',
  title: 'Dental Dictionary | Mason Park Dental for Kids, Katy TX',
  description: 'Plain definitions of the terms you may hear during a dental visit, from abscess to wax, arranged A to W.',
  eyebrow: 'Patient resources',
  h1: 'The words you will hear in the room, in plain English.',
  em: 'in plain English',
  lede: 'This is designed to provide some basic information regarding terms you may hear during your dental visit. If a word is not here, ask us and we will explain it.',
  cta: 'Book a visit', cta2: 'A to W', cta2href: 'a-e',
  hero: { img: 'st-books', alt: 'A stack of children’s picture books' },
  crumbs: [['Patient resources', '/patient-resources/'], 'Dental dictionary'],
  chapters: [
    { k: 'qa', id: 'a-e', name: 'A to E', title: 'Abscess to edentulous.', theme: 'warm',
      items: [
        { q: 'A', a: [2] }, { q: 'B', a: [3] }, { q: 'C', a: [4] }, { q: 'D', a: [5] }, { q: 'E', a: [6] },
      ] },
    { k: 'qa', id: 'g-l', name: 'G to L', title: 'General anesthesia to laminate veneer.', theme: 'sage',
      items: [
        { q: 'G', a: [7] }, { q: 'H', a: [8] }, { q: 'I', a: [9] }, { q: 'J', a: [10] }, { q: 'L', a: [11] },
      ] },
    { k: 'band', id: 'band-1', name: 'The Practice', img: 'chair', alt: 'A clinician and a young patient in a treatment room, a screen on the wall',
      caption: 'Anything said in this room can be said again in plainer words. Ask.' },
    { k: 'qa', id: 'm-r', name: 'M to R', title: 'Malocclusion to radicular.', theme: 'sky',
      items: [
        { q: 'M', a: [12] }, { q: 'N', a: [13] }, { q: 'O', a: [14] }, { q: 'P', a: [15] }, { q: 'R', a: [16] },
      ] },
    { k: 'qa', id: 's-w', name: 'S to W', title: 'Scaling to wax.', theme: 'warm',
      items: [
        { q: 'S', a: [17] }, { q: 'T', a: [18] }, { q: 'U', a: [19] }, { q: 'V', a: [20] }, { q: 'W', a: [21] },
      ] },
    { k: 'invite', title: 'If we use a word you do not know, stop us.',
      lede: 'Nothing in a treatment plan should be a word you have to look up afterwards. Contact Mason Park Dental for Kids in Katy, TX.',
      related: [['Pediatric dentistry FAQs', '/pediatric-dentistry-faqs-katy-tx/'], ['Dental library', '/dental-library/'], ['All services', '/our-services/']] },
  ],
},

];
