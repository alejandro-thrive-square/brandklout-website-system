// The practice pages: the building, the equipment, the offers, and the four
// ways of getting hold of the office.
//
// > [!IMPORTANT]
// > THE ADULT PRACTICE IS NOT THIS PRACTICE. Several of these pages arrived in
// > the 02 migration still carrying the PARENT practice's copy: Dr. William
// > Sung, who is not a doctor of this practice, is named on /technology/ and
// > /town-resource/; /virtual-consultation/ gives the parent practice's phone
// > number and calls itself "Mason Park Dental of Katy"; /town-resource/ signs
// > off as "BMason Park Family Dental" and lists teeth whitening and wisdom
// > tooth removal. This site's doctors are Dr. Tam Nguyen and Dr. Dave Cho and
// > its number is (281) 578-7100.
// >
// > Where a sentence names only Dr. Sung it is re-attributed to the practice,
// > and the changed sentence is written out here in full rather than referenced
// > by block, so the change is visible in this file and not buried in a diff.
// > The clinical content of those sentences is untouched.

export default [

// ---------------------------------------------------------------- contacts
{
  slug: 'contacts',
  title: 'Contact Mason Park Dental for Kids | Pediatric Dentist in Katy, TX',
  description: 'Suite 104B at 21830 Kingsland Blvd, behind the Ranch 99 complex. Call (281) 578-7100, email the office, or book online. Open Monday to Thursday.',
  eyebrow: 'Contact',
  h1: 'The corner of Mason Rd and Kingsland Blvd, behind the Ranch 99 complex.',
  em: 'behind the Ranch 99 complex',
  lede: 'Free parking at the door, and the practice is on the ground floor. Call, email, or book a time online, whichever suits.',
  cta: 'Book online', cta2: 'Ways to reach us', cta2href: 'ways',
  hero: { img: 'waiting', alt: 'The waiting room at Mason Park Dental for Kids' },
  crumbs: ['Contact'],
  chapters: [
    { k: 'cards', id: 'ways', name: 'Four Ways', title: 'Pick whichever is easiest.', theme: 'warm',
      numbered: false,
      cards: [
        { h: 'Call', p: '<a href="tel:+12815787100">(281) 578-7100</a>. Monday and Wednesday 9am to 6pm, Tuesday and Thursday 8am to 5pm. If your child is in pain today, call rather than book online.' },
        { h: 'Email', p: '<a href="mailto:office@masonparkdental.com">office@masonparkdental.com</a>. Best for forms, insurance questions and anything that is not urgent.' },
        { h: 'Book online', p: 'Request a time through <a href="https://www.flexbook.me/masonpark/1" target="_blank" rel="noopener">the booking page</a> and the front desk will confirm it with you.' },
        { h: 'Come in', p: '21830 Kingsland Blvd #104B, Katy, TX 77450. Free parking at the door, and the suite is on the ground floor.' },
      ] },
    { k: 'table', id: 'hours', name: 'The Hours', title: 'When the practice is open.', theme: 'sage',
      head: ['Day', 'Open', 'Note'],
      rows: [
        ['Monday', '9am to 6pm', 'The late day. Good for after school.'],
        ['Tuesday', '8am to 5pm', 'The early day.'],
        ['Wednesday', '9am to 6pm', 'The late day.'],
        ['Thursday', '8am to 5pm', 'The early day.'],
        ['Friday', 'Closed', 'For an emergency, call and leave a message.'],
        ['Saturday', 'Closed', ''],
        ['Sunday', 'Closed', ''],
      ],
      note: 'If your child is in pain outside these hours, call the office anyway and follow the message. See <a href="/emergency-pediatric-dentistry/">emergency pediatric dentistry</a> for what to do in the first ten minutes.' },
    { k: 'invite', title: 'Book a time, or just ring and ask.',
      lede: 'New and existing patients welcome, from the first tooth through the teenage years.',
      cta: 'Book online',
      related: [['New patients', '/new-patients/'], ['Insurance and financing', '/financing/'], ['Emergency care', '/emergency-pediatric-dentistry/']] },
  ],
},

// ------------------------------------------------------------- appointment
{
  slug: 'appointment',
  title: 'Request an Appointment | Mason Park Dental for Kids, Katy TX',
  description: 'Book your child’s dental appointment at Mason Park Dental for Kids. New patient special: $129 for ages 12 and under, including exam, x-rays and cleaning.',
  eyebrow: 'Book a visit',
  h1: 'Two minutes online, or one phone call.',
  em: 'one phone call',
  lede: 'Request a time and the front desk will confirm it with you. If your child is in pain today, call rather than book online and say it is an emergency.',
  cta: 'Book online', cta2: 'Before you come', cta2href: 'before',
  hero: { img: 'st-calendar', alt: 'A calendar and a pen on a desk' },
  crumbs: [['Patients', '/new-patients/'], 'Request an appointment'],
  chapters: [
    { k: 'cards', id: 'before', name: 'Before You Come', title: 'Three things worth doing first.', theme: 'warm',
      cards: [
        { h: 'Fill the forms in at home', p: 'Our patient forms can be filled out online, or downloaded and filled out at home. If you cannot, arrive twenty minutes early and the front desk will help.' },
        { h: 'Bring the insurance card', p: 'And the details of anyone else on the policy. We accept most PPO plans and Medicaid for qualified patients.' },
        { h: 'Write your questions down', p: 'Whatever you thought of at 2am. There is time in the appointment for them, and they get forgotten otherwise.' },
      ] },
    { k: 'statement', id: 'offer', name: 'The Offer', theme: 'sage', kicker: 'New patient special',
      text: '$129 for ages 12 and under: a comprehensive exam, necessary x-rays and cleaning, plus a free fluoride treatment.',
      link: ['All current offers', '/special-offers/'] },
    { k: 'overlap', id: 'urgent', name: 'If It Is Urgent', title: 'Call. Do not book online.', theme: 'sky',
      lede: 'The online form goes to a queue. A phone call goes to a person, and today’s emergency slots are not on the booking page.',
      shot: { img: 'waiting', alt: 'The waiting room at Mason Park Dental for Kids' },
      h3: 'What counts as today.',
      items: [
        'A knocked-out tooth, which is the one where minutes matter.',
        'A chipped or cracked tooth, especially with bleeding or a sharp edge.',
        'Swelling in the face or gums, or a fever with a toothache.',
        'Any pain that stopped your child sleeping.',
      ],
      link: ['Emergency pediatric dentistry', '/emergency-pediatric-dentistry/'] },
    { k: 'invite', title: 'Request a time and we will confirm it.',
      lede: 'New and existing patients welcome, from the first tooth through the teenage years.',
      cta: 'Book online',
      shot: { img: 'st-desk', alt: 'A clipboard and a pen on a desk' },
      related: [['New patients', '/new-patients/'], ['Contact', '/contacts/'], ['Special offers', '/special-offers/']] },
  ],
},

// ---------------------------------------------------------- refer a patient
{
  slug: 'refer-a-patient',
  title: 'Refer a Patient | Mason Park Dental for Kids, Katy TX',
  description: 'For dentists and physicians referring a child to a board certified pediatric dentist in Katy, TX. Call or email the details and we contact the family directly.',
  eyebrow: 'For referring clinicians',
  h1: 'Send us the details and we will call the family.',
  em: 'call the family',
  lede: 'For dentists, pediatricians and lactation consultants referring a child to a board certified pediatric dentist. The child goes back to you afterwards unless you ask us to keep them.',
  cta: 'Call the practice', cta2: 'How to refer', cta2href: 'how',
  hero: { img: 'team', alt: 'The team at Mason Park Dental for Kids in the waiting room' },
  crumbs: [['Patients', '/new-patients/'], 'Refer a patient'],
  chapters: [
    { k: 'prose', id: 'how', name: 'How', title: 'Two ways, and what happens next.', theme: 'warm',
      figure: { img: 'st-desk', alt: 'A clipboard and a pen on a desk' },
      sections: [
        { h: 'Sending the referral', b: [0, 1] },
        { h: 'After the appointment', b: [2] },
      ] },
    { k: 'cards', id: 'for', name: 'What For', title: 'What we most often see on referral.', theme: 'sage',
      numbered: false,
      cards: [
        { h: 'Infants and tongue-tie', p: 'A frenectomy takes less than fifteen minutes, and Dr. Nguyen’s residency covered children as young as six months.' },
        { h: 'Special needs patients', p: 'Sensory-friendly, routine-based care, longer appointments and desensitization visits, with sedation where it is the kind option.' },
        { h: 'Children who need sedation', p: 'Nitrous oxide, oral and IV sedation, and general anesthesia in a hospital setting at HCA West Houston.' },
        { h: 'The child who will not open', p: 'Knee-to-knee exams, and a practice arranged around the children other practices find difficult.' },
      ] },
    { k: 'invite', title: 'Call and we will take it over the phone.',
      lede: 'Or email the patient’s details and any radiographs to office@masonparkdental.com and we will contact the family directly to schedule.',
      cta: 'Call (281) 578-7100',
      shot: { img: 'st-hands', alt: 'An adult and a child holding hands' },
      related: [['Special needs care', '/services/special-needs-patient-care/'], ['Frenectomy', '/services/frenectomy/'], ['Sedation dentistry', '/services/sedation-dentistry/']] },
  ],
},

// -------------------------------------------------------------- technology
{
  slug: 'technology',
  title: 'Dental Technology at Mason Park Dental for Kids | Katy, TX',
  description: 'Digital and panoramic x-rays at lower radiation, an intra-oral camera, soft tissue lasers, a digital scanner instead of impression trays, and a cordless hand-held x-ray.',
  eyebrow: 'The practice',
  h1: 'Most of this equipment exists to make the appointment shorter.',
  em: 'shorter',
  lede: 'Our state-of-the-art technologies ensure accuracy, efficiency, and comfort. Our dental equipment is safe, effective, and well-maintained.',
  cta: 'Book a visit', cta2: 'What is in the rooms', cta2href: 'imaging',
  hero: { img: 'operatory', alt: 'A hygienist at the sink in a treatment room' },
  crumbs: [['About', '/about-us/'], 'Technology'],
  chapters: [
    { k: 'prose', id: 'imaging', name: 'Imaging', title: 'Seeing it without guessing at it.', theme: 'warm',
      figure: { img: 'chair', alt: 'A clinician and a young patient in a treatment room, a screen on the wall', caption: 'The screen on the wall is part of the equipment.' },
      sections: [
        { h: 'Digital x-rays', id: 'digital', b: [3, 4, 5] },
        // The practice's own sentence names Dr. William Sung, who is the parent
        // practice's dentist and not a doctor of this one. Re-attributed; the
        // clinical description is untouched.
        { h: 'Panoramic x-ray', id: 'panoramic', b: ['A panoramic x-ray machine rotates around the entire head to take a 360-degree view of the teeth, sinuses, and the bone structure of the head and jaws. This provides a more complete image than standard x-rays, and it is a valuable resource in diagnosis and treatment planning.'] },
        { h: 'Hand-held x-ray', id: 'handheld', b: [24] },
      ] },
    { k: 'prose', id: 'chairside', name: 'Chairside', title: 'The two things your child will actually see.', theme: 'sage',
      figure: { img: 'st-laptop', alt: 'An open laptop on a kitchen table' },
      sections: [
        { h: 'Intra-oral camera', id: 'camera', b: [9, 10] },
        // Split in two: as one section this ran to 158 words and check.mjs
        // fails a prose run over 110. The break is where the copy changes
        // subject anyway, from the tool to what you see on the monitor.
        { h: 'Intra-oral scanner', id: 'scanner', b: [17, 18] },
        { h: 'No more impression trays', id: 'impressions', b: [20, 21] },
      ] },
    { k: 'prose', id: 'lasers', name: 'Lasers', title: 'Less bleeding, less swelling, less recovery.', theme: 'sky',
      figure: { img: 'st-window', alt: 'Sunlight through a window in a quiet room' },
      sections: [
        // Two more sentences that named the parent practice's dentist.
        { h: 'Soft tissue lasers', b: [
          'With soft tissue lasers at our disposal, our doctors can provide precise high-quality treatments that are relatively pain-free, less invasive, and useful for a wide variety of dental treatments.',
          13,
          'With the highly versatile soft tissue laser, our doctors can seal nerve endings and blood vessels and treat soft tissues simultaneously. This creates less stress on the gums, which significantly reduces both swelling and bleeding, minimises discomfort both during and after the treatment, and lessens recovery time.',
        ] },
      ] },
    { k: 'figures', id: 'count', name: 'Why It Matters', title: 'Three things the equipment buys.', theme: 'warm',
      figures: [
        { n: 'Less', label: 'radiation', note: 'Digital x-rays require much less radiation than traditional film x-rays, and the hand-held system less than most conventional ones.' },
        { n: 'No trays', label: 'for impressions', note: 'A hand-held scanning wand takes accurate digital impressions quickly, without tripping your child’s gag reflex.' },
        { n: 'On screen', label: 'while you watch', note: 'As we complete the scan you can view the impression on the monitor with us, and see why a restoration has been recommended.' },
      ] },
    { k: 'invite', title: 'Come and see the room before you decide.',
      lede: 'We look forward to seeing you at your next appointment. Contact Mason Park Dental for Kids in Katy, TX.',
      related: [['Meet the doctors', '/our-doctors/'], ['Knee-to-knee exams', '/knee-to-knee-pediatric-dental-exam/'], ['Comprehensive pediatric dentistry', '/services/comprehensive-pediatric-dentistry/']] },
  ],
},

// ------------------------------------------------------------ knee to knee
{
  slug: 'knee-to-knee-pediatric-dental-exam',
  title: 'Knee-to-Knee Pediatric Dental Exams in Katy, TX | Mason Park Dental for Kids',
  description: 'How an infant or anxious toddler is examined on a parent’s lap rather than in the chair, why it lowers anxiety, and how to prepare your child for the first visit.',
  eyebrow: 'The practice',
  h1: 'Your child stays on your lap, and their head rests on our knees.',
  em: 'stays on your lap',
  lede: 'Unlike a traditional exam where the child sits alone in a high chair, the knee-to-knee approach brings the dentist down to the child’s eye level, with you holding them the whole time.',
  cta: 'Book a first visit', cta2: 'What it is', cta2href: 'what',
  hero: { img: 'knee', alt: 'An infant on a parent’s lap during a knee-to-knee exam' },
  crumbs: [['About', '/about-us/'], 'Knee-to-knee exams'],
  chapters: [
    { k: 'prose', id: 'what', name: 'The Method', title: 'What it is, and how it is done.', theme: 'warm',
      figure: { img: 'knee-2', alt: 'A second frame of a knee-to-knee exam', caption: 'The practice’s own room, and its own patients.' },
      sections: [
        { h: 'Why children dread the chair', b: [1] },
        { h: 'The position', b: [4] },
        { h: 'How the exam runs', b: [15] },
      ] },
    { k: 'cards', id: 'benefits', name: 'What It Changes', title: 'Four things that follow from being held.', theme: 'sage',
      cards: [
        { h: 'It reduces anxiety and fear', p: 'The position minimises the child’s fear by removing the feeling of being overpowered. That relaxed posture lowers anxiety and makes the visit a positive one.' },
        { h: 'It builds trust', p: 'Being on the same level as the child allows the dentist to engage properly, so the child feels safe enough to say what is worrying them.' },
        { h: 'It improves cooperation', p: 'A child who feels less threatened cooperates, and a cooperative exam is a thorough one. Problems get found while they are small.' },
        { h: 'It sets the pattern', p: 'Positive early experiences at the dentist set the foundation for a lifetime of good oral health habits.' },
      ] },
    { k: 'cards', id: 'who', name: 'Who It Is For', title: 'Three groups it helps most.', theme: 'sky',
      numbered: false,
      cards: [
        { h: 'Young children', p: 'Toddlers and preschoolers, just starting to develop their independence, benefit greatly. The equal interaction helps them associate dental visits with positive emotions rather than fear.' },
        { h: 'Children with dental anxiety', p: 'Kids with a history of anxiety, or a bad experience somewhere else, find relief in the relaxed environment and build a better outlook on dental care.' },
        { h: 'Children with special needs', p: 'Where a traditional exam is overwhelming, this approach is more accommodating and can be tailored to what a particular child needs.' },
      ] },
    { k: 'prose', id: 'prepare', name: 'Before You Come', title: 'Three things that help on the day.', theme: 'warm',
      figure: { img: 'st-books', alt: 'A stack of children’s picture books' },
      sections: [
        { h: 'Explain it in simple terms', b: [28] },
        { h: 'Reinforce a positive attitude', b: [30] },
        { h: 'Pick the time carefully', b: [32] },
      ] },
    { k: 'invite', title: 'Book the first one before the first birthday.',
      lede: 'The American Academy of Pediatric Dentistry recommends a first visit within six months of the first tooth, or by the first birthday. Contact Mason Park Dental for Kids in Katy, TX.',
      cta: 'Book a first visit',
      shot: { img: 'st-infant', alt: 'A parent holding a smiling baby' },
      related: [['Special needs care', '/services/special-needs-patient-care/'], ['New patients', '/new-patients/'], ['Comprehensive pediatric dentistry', '/services/comprehensive-pediatric-dentistry/']] },
  ],
},

// ----------------------------------------------------------- special offers
{
  slug: 'special-offers',
  title: 'Special Offers | Mason Park Dental for Kids, Katy TX',
  description: 'New patient special from $129, a limited emergency exam at $85, $1000 off Invisalign, and a free second opinion. Current offers at Mason Park Dental for Kids.',
  eyebrow: 'Patients',
  h1: 'Four offers, and the small print for each of them.',
  em: 'the small print',
  lede: 'Current offers at the practice. The conditions are set out beside each one rather than at the bottom of the page.',
  cta: 'Book an appointment', cta2: 'The offers', cta2href: 'offers',
  hero: { img: 'st-brushes', alt: 'Children’s toothbrushes in a cup' },
  crumbs: [['Patients', '/new-patients/'], 'Special offers'],
  chapters: [
    { k: 'table', id: 'offers', name: 'The Offers', title: 'What each one includes.', theme: 'warm',
      head: ['Offer', 'Price', 'What it includes'],
      rows: [
        ['New patient, 12 and under', '$129', 'A comprehensive exam, necessary x-rays and cleaning, plus a free fluoride treatment.'],
        ['New patient, 13 and up', '$189', 'A comprehensive exam, necessary x-rays and cleaning, plus a free fluoride treatment.'],
        ['Limited emergency exam', '$85', 'A focused exam of the tooth or area that hurts, with any x-ray that is needed to see it.'],
        ['Invisalign', '$3,800', 'Regular price $4,800, so $1,000 off. Prepay in full for a further 5% discount.'],
        ['Second opinion', 'Free', 'A consultation on a treatment plan you have been given elsewhere.'],
      ],
      note: 'The new patient specials cannot be combined with insurance, are for new patients only, and are not valid in cases of periodontal disease.' },
    { k: 'cards', id: 'terms', name: 'The Detail', title: 'Three things worth knowing before you book.', theme: 'sage',
      numbered: false,
      cards: [
        { h: 'The Invisalign consult is free', p: 'A complimentary Invisalign consultation is available. Insurance payments would be reimbursed back to the patient, and in-office and third-party payment plans are available.' },
        { h: 'The second opinion really is free', p: 'Are you confused about a treatment plan, or skeptical about a doctor’s opinion? At Mason Park Dental, educating our patients is a top priority. See a doctor you can trust.' },
        { h: 'Insurance, or the special, not both', p: 'The new patient price is an alternative to running it through your plan. Ask the front desk which comes out cheaper for you.' },
      ] },
    { k: 'statement', id: 'plan', name: 'No Insurance', theme: 'sky', kicker: 'If you have no plan',
      text: 'The dental savings plan is the other way in, and it covers the visits rather than discounting one of them.',
      link: ['Dental savings plan', '/dental-saving-plan/'] },
    { k: 'invite', title: 'Mention the offer when you book.',
      lede: 'Contact Mason Park Dental for Kids in Katy, TX and tell the front desk which one applies.',
      cta: 'Book an appointment',
      related: [['Insurance and financing', '/financing/'], ['Dental savings plan', '/dental-saving-plan/'], ['New patients', '/new-patients/']] },
  ],
},

// ----------------------------------------------------- virtual consultation
{
  slug: 'virtual-consultation',
  title: 'Virtual Dental Consultation | Mason Park Dental for Kids, Katy TX',
  description: 'Send photographs of your child’s teeth and get an opinion before you come in. A virtual consultation with Mason Park Dental for Kids in Katy, TX.',
  eyebrow: 'Patients',
  h1: 'Send us a photograph before you take an afternoon off.',
  em: 'before you take an afternoon off',
  lede: 'Some questions do not need a chair. Send images of your child’s teeth, tell us what you are worried about, and we will call you back to say whether it needs an appointment.',
  cta: 'Call the practice', cta2: 'How it works', cta2href: 'how',
  hero: { img: 'st-laptop', alt: 'An open laptop on a kitchen table' },
  crumbs: [['Patients', '/new-patients/'], 'Virtual consultation'],
  chapters: [
    { k: 'path', id: 'how', name: 'The Path', title: 'Three steps, and a call back.', theme: 'warm',
      steps: [
        { h: 'Get in touch.', p: 'Call (281) 578-7100 or email office@masonparkdental.com and say you would like a virtual consultation.' },
        { h: 'Send the images.', p: 'Photographs of your child’s teeth, and anything else that will help: a treatment plan from another practice, or a radiograph if you have one.', img: 'st-laptop', alt: 'An open laptop on a kitchen table' },
        { h: 'We call you back.', p: 'To arrange the online appointment, or to tell you straight away that this is one to bring in.' },
        { cta: ['Call (281) 578-7100', 'tel:+12815787100'], h: 'It is an opinion, not a diagnosis.', p: 'Anything that needs looking at properly still needs looking at properly. What this saves is the trip that turns out not to have been necessary.' },
      ] },
    { k: 'cards', id: 'good', name: 'What It Is Good For', title: 'Three questions that answer well over a photograph.', theme: 'sage',
      numbered: false,
      cards: [
        { h: 'A second opinion', p: 'On a treatment plan your child has been given somewhere else. The practice also offers a free second opinion in person.' },
        { h: 'Is this urgent?', p: 'A chip, a mark on a tooth, or a gum that looks wrong, where the real question is whether it can wait until the next visit.' },
        { h: 'Is my child a candidate?', p: 'For Invisalign in particular, where the honest answer often needs the mouth in front of us, but the first pass can be done from photographs.' },
      ] },
    { k: 'statement', id: 'urgent', name: 'Not For', theme: 'sky', kicker: 'One exception',
      text: 'If your child is in pain, or a tooth has been knocked out, do not use this. Call the office.',
      link: ['Emergency pediatric dentistry', '/emergency-pediatric-dentistry/'] },
    { k: 'invite', title: 'Call and ask for a virtual consultation.',
      lede: 'For expert dental guidance at your fingertips, reach out to Mason Park Dental for Kids in Katy, TX on (281) 578-7100.',
      cta: 'Call (281) 578-7100',
      related: [['Invisalign', '/services/invisalign/'], ['Special offers', '/special-offers/'], ['Contact', '/contacts/']] },
  ],
},

// ------------------------------------------------------------- before after
{
  slug: 'before-after',
  title: 'Smile Gallery | Mason Park Dental for Kids, Katy TX',
  description: 'Our before-and-after gallery is being restocked with our own patients’ results, photographed with written consent. What is here in the meantime.',
  noindex: true,
  eyebrow: 'The practice',
  h1: 'We took the old gallery down rather than leave it up.',
  em: 'rather than leave it up',
  lede: 'The photographs that used to sit here were supplied with the website theme. They were not of our patients, and a before-and-after is a claim about a real result.',
  cta: 'Book a consultation', cta2: 'What is here instead', cta2href: 'instead',
  hero: { img: 'highfive', alt: 'A child and an adult high-fiving' },
  crumbs: [['About', '/about-us/'], 'Smile gallery'],
  chapters: [
    { k: 'statement', id: 'why', name: 'Why', theme: 'warm', kicker: 'The reason',
      text: 'Real before-and-after photography goes back up here once we have it, with every family’s written consent.',
      link: ['Patient reviews', '/patient-reviews/'] },
    { k: 'links', id: 'instead', name: 'In The Meantime', title: 'Three things that are actually ours.', theme: 'sage',
      lede: 'Words from our own patients, our own rooms and our own team, all of which we can stand behind.',
      groups: [
        { h: 'What families wrote', p: 'Every review on the site is a real one, quoted whole and attributed.', links: [['All patient reviews', '/patient-reviews/'], ['Meet the team', '/our-team/']] },
        { h: 'The rooms and the people', p: 'Our own photographs of the practice, the team and the treatment rooms.', links: [['About the practice', '/about-us/'], ['Meet the doctors', '/our-doctors/'], ['Technology', '/technology/']] },
        { h: 'What the treatments are', p: 'Written out plainly, without a stock photograph standing in for a result.', links: [['All services', '/our-services/'], ['Cosmetic dentistry', '/services/cosmetic-dentistry/'], ['Orthodontics', '/services/orthodontics/']] },
      ] },
    { k: 'invite', title: 'Ask us what a treatment actually looks like.',
      lede: 'We will show you cases in the room, with the consent that goes with them. Contact Mason Park Dental for Kids in Katy, TX.',
      cta: 'Book a consultation',
      related: [['Patient reviews', '/patient-reviews/'], ['Cosmetic dentistry', '/services/cosmetic-dentistry/'], ['About the practice', '/about-us/']] },
  ],
},

];
