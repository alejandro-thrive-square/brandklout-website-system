import { FILMS } from '../lib/site.mjs'

export default {
  slug: 'dr-tony-barriere',
  title: 'Dr. Tony Barriere, DDS: Implant & Cosmetic Dentist in Los Angeles | West LA Implants',
  description: 'Meet Dr. Tony Barriere, DDS. Ohio State College of Dentistry, a yearlong surgical residency at NYU Langone, more than 1,000 hours of continuing education, and a practice built around robot-guided implant surgery on Wilshire Blvd.',
  image: '/media/img/tonybarrerie_headshot_dentist_westlaimplants_frontfacing.jpg',
  jsonld: [{ '@type': 'Person', name: 'Tony Barriere', honorificSuffix: 'DDS', jobTitle: 'Implant and cosmetic dentist', worksFor: { '@id': '/#practice' }, alumniOf: [{ '@type': 'CollegeOrUniversity', name: 'The Ohio State University College of Dentistry' }, { '@type': 'Hospital', name: 'NYU Langone Hospital' }], memberOf: [{ '@type': 'Organization', name: 'American Academy of Cosmetic Dentistry' }, { '@type': 'Organization', name: 'American Academy of Implant Dentistry' }, { '@type': 'Organization', name: 'American Dental Association' }] }],
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Tony Barriere, DDS · implant & cosmetic dentist',
      title: 'Complex dentistry deserves <em>focused</em> experience.',
      lead: 'Dr. Barriere plans, places and restores every implant himself. He trained as a surgeon, keeps training, and built the practice around the tools that make the work predictable.',
      image: { src: '/media/img/tonybarrerie_headshot_dentist_westlaimplants_frontfacing.jpg', alt: 'Dr. Tony Barriere, DDS', caption: 'Tony Barriere, DDS' },
      actions: [{ href: '#invitation', label: 'Meet With Dr. Barriere' }, { href: `https://www.youtube.com/watch?v=${FILMS.experience.id}`, label: 'Watch: why experience matters', kind: 'text', ext: true }],
      meta: [
        { b: 'Ohio State', span: 'College of Dentistry' },
        { b: 'NYU Langone', span: 'Yearlong surgical residency' },
        { b: '1,000+ hours', span: 'Continuing education' },
        { b: 'AACD · AAID · ADA', span: 'Memberships' },
      ],
    },
    {
      type: 'statement', name: 'The Philosophy', tag: 'The Philosophy', image: { src: '/media/img/doctor-explaining.jpg' },
      text: 'No matter how much experience he gains, he has committed to never stop learning. In one recent year that meant more than three hundred hours of it.',
      after: ['Most recently that training was on the Yomi® robot, which now assists in his implant surgeries. Continuing education is not a line on a page here. It is the practice’s operating principle.'],
      figure: { value: 1000, suffix: '+', label: 'hours of continuing education' },
    },
    {
      type: 'steps', name: 'The Training', tag: 'The Training', title: 'How a dentist becomes a <em>surgeon.</em>',
      steps: [
        { title: 'Dental school', text: 'Dr. Barriere completed his dental training at The Ohio State University College of Dentistry.' },
        { title: 'Surgical residency', text: 'He then chose an optional yearlong surgical residency through NYU Langone Hospital, the training that underpins the grafting, extraction and implant work the practice is known for.' },
        { title: 'Continuing education', text: 'More than a thousand hours since, in implant and cosmetic dentistry: full-arch protocols, guided and robotic surgery, sedation, laser periodontics and digital smile design.' },
        { title: 'The memberships', text: 'The American Academy of Cosmetic Dentistry, the American Academy of Implant Dentistry and the American Dental Association.' },
      ],
      image: { src: '/media/img/still-doctor-xray-screen.jpg', alt: 'Dr. Barriere reviewing X-rays on the operatory screen' },
    },
    {
      type: 'ledger', name: 'The Standard', tag: 'The Standard', title: 'What he insists <em>on.</em>',
      lead: 'The habits of the practice, in the order a patient meets them.',
      figure: { value: 6, label: 'standing commitments' },
      items: [
        { b: 'A 3D scan before any plan', span: 'Nothing is decided from a flat X-ray or a guess.' },
        { b: 'Guided placement', span: 'Yomi® robotic guidance or a printed guide. No free-hand implants.' },
        { b: 'One surgeon, start to finish', span: 'The person who plans places, and the person who places restores.' },
        { b: 'Comfort as a clinical goal', span: 'Sedation, blankets, headphones, and a team that expects nervous patients.' },
        { b: 'Honest candidacy', span: 'Free second opinions, including telling you when to wait.' },
        { b: 'A warranty', span: 'One year on the materials of every implant placed.' },
      ],
    },
    {
      type: 'strip', name: 'The Person', tag: 'The Person', title: 'On your team, not just in your <em>chart.</em>',
      lead: '“Dr. Barriere is a dentist who sees a long-term vision for my dental health. He’s on my team, advising me on my behalf.” Peter Chang, Google review.',
      body: [
        'Patients drive from Central California for their implants. Others come after a failing implant placed elsewhere, or after being told there was not enough bone. The consultation is the same for all of them: a scan, an honest read, and a plan you can see on screen.',
        'He invites you to come and experience the West LA Implants difference for yourself.',
      ],
      list: [
        { b: 'Implants', span: 'Single, full arch, failing implants' },
        { b: 'Cosmetic', span: 'Veneers, whitening, Invisalign®, makeovers' },
        { b: 'Surgery', span: 'Grafting, sinus lifts, extractions, laser perio' },
        { b: 'General', span: 'The everyday care, same standard' },
      ],
      actions: [{ href: '/our-practice.html', label: 'Meet the team', kind: 'text' }],
      photos: [
        { src: '/media/img/still-doctor-patient-hug.jpg', alt: 'Dr. Barriere greeting a patient' },
        { src: '/media/img/doctor-handshake.jpg', pos: '70% 30%', alt: 'Dr. Barriere greeting a patient' },
        { src: '/media/img/still-doctor-masked.jpg', alt: 'Dr. Barriere in surgery' },
      ],
      flip: true,
    },
    {
      type: 'proof', name: 'The Proof', patient: 'leslie', title: 'His work, in <em>her</em> words.',
      text: 'Leslie’s full arch on All-on-4®. Her film, and Emily’s and Michael’s, are on the practice’s channel.',
    },
    {
      type: 'invite', name: 'Invitation', title: 'Meet with Dr. <em>Barriere.</em>', lead: 'A consultation is a scan, an honest read on candidacy, and a plan. A second opinion is free.',
      interests: ['Dental implants', 'All-on-4 / full arch', 'A second opinion', 'Veneers or cosmetic', 'Not sure yet'],
      next: [
        { href: '/technology.html', label: 'The technology', text: 'Yomi®, CBCT and the in-house lab.' },
        { href: '/our-practice.html', label: 'The practice', text: 'The team, the rooms, the comforts.' },
        { href: '/results.html', label: 'Results', text: 'Before and after, and three patients on film.' },
      ],
    },
  ],
}
