export default {
  slug: 'referring-doctors',
  title: 'Referring Doctors: Refer a Patient for Implants or Surgery | West LA Implants',
  description: 'For general dentists and specialists referring patients to West LA Implants for implants, full-arch treatment, bone grafting, sinus lifts, extractions or sedation. How to refer, what to send, and how the patient comes back to you.',
  image: '/media/img/doctor-explaining.jpg',
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Referring doctors · Los Angeles',
      title: 'Your patient, our <em>surgery</em>, back to you.',
      lead: 'Dr. Barriere accepts referrals for implant placement, full-arch treatment, grafting and sinus lifts, extractions and sedation cases. The restorative work stays with you if you want it to.',
      image: { src: '/media/img/doctor-explaining.jpg', alt: 'Dr. Barriere explaining a case' },
      actions: [{ href: '#invitation', label: 'Refer a Patient' }, { href: '/technology.html', label: 'The surgical suite', kind: 'text' }],
      meta: [
        { b: 'Yomi®', span: 'Robot-guided placement' },
        { b: 'CBCT', span: 'Scans shared on request' },
        { b: 'IV sedation', span: 'For your anxious patients' },
        { b: 'Same week', span: 'Urgent cases seen' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/still-doctor-xray-screen.jpg' },
      text: 'A referral is a relationship, not a handoff. Your patient should come back to you with the implant where your restoration needs it, and a report that says so.',
      after: ['Dr. Barriere plans from the restoration backwards, places with robotic guidance, and documents every position and component for the dentist who restores.'],
    },
    {
      type: 'ledger', name: 'The Referrals', tag: 'The Referrals', title: 'What to <em>send.</em>',
      lead: 'The more you send, the less your patient repeats. Any of it can follow later.',
      figure: { value: 5, label: 'things that help' },
      items: [
        { b: 'The reason for referral', span: 'Which teeth, which procedure, and what you would like to restore yourself.' },
        { b: 'Recent radiographs', span: 'Periapicals, a panoramic, or a CBCT if you have one. We take our own scan if not.' },
        { b: 'Medical history', span: 'Medications, anticoagulants, bisphosphonates, and anything relevant to sedation.' },
        { b: 'Your restorative plan', span: 'Planned crown, bridge or denture design, so the implant position serves it.' },
        { b: 'Contact for the patient', span: 'A phone number and the best time to reach them.' },
      ],
    },
    {
      type: 'steps', name: 'The Process', tag: 'The Process', title: 'How a referral <em>runs.</em>',
      steps: [
        { title: 'You refer', text: 'Call the office and ask for the back office manager, or send the form below with the patient’s details and the reason. Urgent cases are seen the same week.' },
        { title: 'We consult', text: 'A CBCT scan, a plan, and a written report back to you with the proposed implant positions and timing.' },
        { title: 'We place', text: 'Surgery under the sedation the patient needs, with Yomi® guidance. Post-operative instructions and after-hours access are ours to handle.' },
        { title: 'You restore', text: 'Once integrated, the patient returns to you with the implant positions and components documented, or we restore in house if you prefer.' },
      ],
      image: { src: '/media/img/still-cbct-suite.jpg', alt: 'The CBCT suite' },
    },
    {
      type: 'strip', name: 'The Standard', tag: 'The Standard', title: 'The same surgeon, the same <em>suite.</em>',
      lead: 'Dr. Barriere trained at Ohio State and completed a yearlong surgical residency at NYU Langone. Every referred case is planned on CBCT and placed with guidance.',
      body: ['Communication is the whole relationship. You receive a report after the consultation, after surgery and at integration, and a call whenever something changes.'],
      list: [
        { b: 'Implants', span: 'Single, multiple, full arch' },
        { b: 'Grafting', span: 'Socket, ridge, sinus' },
        { b: 'Extractions', span: 'Including wisdom teeth' },
        { b: 'Sedation', span: 'IV, oral, nitrous' },
      ],
      actions: [{ href: '/dr-tony-barriere.html', label: 'About Dr. Barriere', kind: 'text' }],
      photos: [
        { src: '/media/img/yomi-robot-surgical.jpg', alt: 'The Yomi robot' },
        { src: '/media/img/surgical-kit.jpg', alt: 'The guided surgery kit' },
        { src: '/media/img/still-doctor-masked.jpg', alt: 'Dr. Barriere in surgery' },
      ],
      flip: true,
    },
    {
      type: 'invite', name: 'Invitation', title: 'Refer a <em>patient.</em>', lead: 'Use the form, or call (310) 481-0111 and ask for the back office manager.',
      formTitle: 'Referral request',
      interests: ['Implant placement', 'Full-arch treatment', 'Bone grafting or sinus lift', 'Extractions or sedation', 'Something else'],
      next: [
        { href: '/technology.html', label: 'The technology', text: 'Yomi®, CBCT, guides and the lab.' },
        { href: '/bone-grafting.html', label: 'Bone grafting', text: 'Socket, ridge and sinus procedures.' },
        { href: '/contact.html', label: 'Contact', text: 'Address, hours and directions.' },
      ],
    },
  ],
}
