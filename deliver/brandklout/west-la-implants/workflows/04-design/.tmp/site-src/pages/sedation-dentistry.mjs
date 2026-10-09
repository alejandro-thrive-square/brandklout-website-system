export default {
  slug: 'sedation-dentistry',
  title: 'IV Sedation Dentistry in Los Angeles | West LA Implants',
  description: 'IV, oral and nitrous oxide sedation at West LA Implants for anxious patients and long procedures. Sleep through implant surgery, combine several treatments in one visit, wake up with the work done.',
  image: '/media/img/sedation-patient-smiling.jpg',
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Sedation dentistry · Los Angeles',
      title: 'Leave the fear at the <em>door.</em>',
      lead: 'Nervous patients are the rule here, not the exception. IV, oral and nitrous sedation are matched to how anxious you are and how long the work will take.',
      image: { src: '/media/img/sedation-patient-smiling.jpg', pos: '80% 50%', alt: 'A relaxed patient at West LA Implants' },
      actions: [{ href: '#invitation', label: 'Request a Consultation' }, { href: '/our-practice.html', label: 'The comforts of the practice', kind: 'text' }],
      meta: [
        { b: 'IV', span: 'A sleep-like state' },
        { b: 'Oral', span: 'A pill before you arrive' },
        { b: 'Nitrous', span: 'Wears off in minutes' },
        { b: 'One visit', span: 'Several treatments combined' },
      ],
    },
    {
      type: 'ledger', name: 'The Reasons', tag: 'The Reasons', title: 'Five reasons people <em>choose</em> it.', // BugHerd #80: moved up to sit right after the cover
      figure: { value: 5, label: 'common reasons' },
      items: [
        { b: 'Fear of the dentist', span: 'From mild dread to years of avoidance.' },
        { b: 'Dental anxiety', span: 'The sights, sounds and smells of the room.' },
        { b: 'A sensitive gag reflex', span: 'Impressions and instruments become tolerable.' },
        { b: 'A low pain threshold', span: 'Comfort through the whole appointment.' },
        { b: 'Several complex treatments', span: 'Combined into one efficient visit instead of many.' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/patient-under-sedation.jpg' },
      text: 'Fear keeps people out of the chair for years. Decay becomes gum disease, gum disease becomes tooth loss, and the bacteria do not stay in the mouth.',
      after: ['Sedation is the way back in. Most patients who have IV sedation remember little or nothing of the appointment, and wake up with the work done.'],
    },
    {
      type: 'compare', name: 'The Options', tag: 'The Options', title: 'Three levels of <em>calm.</em>',
      intro: 'Chosen with you at the consultation, based on your anxiety, your health and the procedure.',
      columns: [
        { title: 'Nitrous oxide', sub: 'Laughing gas', rows: ['Breathed through a small mask', 'Takes the edge off within minutes', 'Wears off minutes after it stops', 'You can drive yourself home'] },
        { title: 'Oral sedation', sub: 'A pill', rows: ['Taken before the appointment', 'Deeply relaxed, still responsive', 'Lasts a few hours', 'Someone drives you home'] },
        { title: 'IV sedation', sub: 'The deepest option', hot: true, rows: ['Given intravenously and adjusted through the visit', 'A sleep-like state, with amnesia for most of it', 'For severe anxiety and long or complex surgery', 'Someone drives you home'] },
      ],
    },
    {
      type: 'strip', name: 'The Experience', tag: 'The Experience', title: 'Calm is designed <em>in,</em> not added on.',
      lead: 'Blankets and pillows, noise-cancelling headphones, a television with Netflix, a team that speaks English and Spanish, and a doctor who does complex cases every day.',
      body: [
        'Sedation is also how the practice combines an extraction, a graft and an implant into one appointment instead of three, which for an anxious patient is the whole point.',
        'Health and safety first: every sedation case starts with a medical history, and a member of the team monitors you throughout.',
      ],
      list: [
        { b: 'Monitored', span: 'Throughout the visit' },
        { b: 'Amenities', span: 'Blankets, headphones, Netflix' },
        { b: 'Bilingual', span: 'English and Spanish' },
        { b: 'Combined visits', span: 'Fewer appointments overall' },
      ],
      photos: [
        { src: '/media/img/still-reception-neon.jpg', alt: 'The reception at West LA Implants' },
        { src: '/media/img/waiting-room.jpg', alt: 'The waiting room' },
        { src: '/media/img/patient-under-sedation.jpg', pos: '30% 40%', alt: 'A patient resting comfortably under sedation' }, // BugHerd #81
      ],
    },
    {
      type: 'proof', name: 'The Proof', patient: 'emily', title: 'Through it, and <em>out</em> the other side.',
      text: 'Emily had crowns and implants placed under sedation. Her film is on the practice’s channel.',
    },
    {
      type: 'faq', name: 'The Questions', title: 'Sedation <em>questions.</em>',
      items: [
        { q: 'Will I be asleep?', a: 'Under IV sedation you are in a sleep-like state and most patients remember little or nothing, though you are not under general anaesthesia and can respond. Oral sedation is lighter; nitrous lighter still.' },
        { q: 'Is sedation safe?', a: 'Yes, for healthy patients, with a medical history reviewed first and monitoring throughout. Some conditions and medications change which option is right, which is what the consultation is for.' },
        { q: 'Can I drive afterwards?', a: 'After nitrous, yes. After oral or IV sedation, no: bring someone to drive you home and plan to rest for the day.' },
        { q: 'Do I need sedation for a single implant?', a: 'Not necessarily. Local anaesthetic is enough for many patients. Sedation is offered for anxiety, for long or complex surgery, and for anyone who simply prefers not to be aware of it.' },
        { q: 'Does insurance cover sedation?', a: 'Sometimes partly, depending on the plan and the procedure. The front desk checks benefits before the visit.' },
      ],
    },
    {
      type: 'invite', name: 'Invitation', title: 'Schedule the one you’ll <em>keep.</em>', lead: 'Tell us how you feel about the dentist. The plan starts there.',
      interests: ['IV sedation', 'Dental implants', 'All-on-4 / full arch', 'General dentistry', 'Not sure yet'],
      next: [
        { href: '/our-practice.html', label: 'The practice', text: 'The rooms, the team, the comforts.' },
        { href: '/dental-implants.html', label: 'Dental implants', text: 'What happens at each visit.' },
        { href: '/tooth-extractions.html', label: 'Tooth extractions', text: 'Gentle, and often the first step.' },
      ],
    },
  ],
}
