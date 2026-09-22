export default {
  slug: 'general-dentistry',
  title: 'General Dentistry in Los Angeles: Cleanings, Crowns, Emergencies | West LA Implants',
  description: 'General dentistry at West LA Implants: preventive cleanings and exams, same-day crowns and bridges, fillings, root canals, pediatric care and same-day emergency visits, with the same technology used for implants.',
  image: '/media/img/patient-smiling.jpg',
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'General dentistry · Los Angeles',
      title: 'Everyday care, with <em>surgical</em> standards.',
      lead: 'The same team, the same scanner and the same attention whether you are here for a cleaning or a full arch. One roof for everything, and a savings plan if you have no insurance.',
      image: { src: '/media/img/patient-smiling.jpg', alt: 'A patient smiling in the chair at West LA Implants' },
      actions: [{ href: '#invitation', label: 'Book a First Visit' }, { href: '/financing.html', label: 'Insurance and the savings plan', kind: 'text' }],
      meta: [
        { b: 'Same day', span: 'Emergency visits' },
        { b: 'Same day', span: 'Crowns and bridges' },
        { b: 'All ages', span: 'Children welcome' },
        { b: 'PPO', span: 'Most plans in network' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/hygienist-procedure.jpg' },
      text: 'Most serious dental problems began as small ones that nobody looked at. Two cleanings a year is the cheapest dentistry there is.',
      after: ['Each visit is tailored to you, with intraoral cameras and digital X-rays that catch decay, gum disease and even oral cancer early.'],
    },
    {
      type: 'rail', name: 'The Services', tag: 'The Services', title: 'Six things done <em>here.</em>',
      cards: [
        { title: 'Preventive dentistry', text: 'Cleanings, digital X-rays, oral cancer screenings and fluoride. Twice a year, tailored to you, with the best technology in the room.' },
        { title: 'Emergency dentistry', text: 'Cracked or broken teeth, broken restorations, knocked-out teeth, toothaches and bleeding gums, with same-day and next-day appointments.' },
        { title: 'Crowns and bridges', text: 'Custom crowns restore damaged or root-canal-treated teeth; bridges replace missing ones. Same-day crowns mean you leave restored.' },
        { title: 'Fillings and sealants', text: 'Tooth-coloured composite fillings as the first answer to a cavity, with sealants to make them last.' },
        { title: 'Root canals', text: 'For deeper decay, root canal therapy that saves the tooth, made pain-free with local anaesthetic and sedation where wanted.' },
        { title: 'Pediatric dentistry', text: 'Children of any age, with the aim of teaching them to make good decisions about their own smiles as they grow.' },
      ],
      end: { title: 'Something else?', label: 'Ask the team', href: '#invitation' },
    },
    {
      type: 'steps', name: 'The First Visit', tag: 'The First Visit', title: 'Your first hour <em>here.</em>',
      steps: [
        { title: 'Arriving', text: 'The front desk greets you, takes your health questionnaire and insurance details, and can send the forms ahead if you would rather fill them in at home.' },
        { title: 'The exam', text: 'About an hour. Questions about your routine and your concerns, digital X-rays, and a look at every tooth and gum with the intraoral camera.' },
        { title: 'The cleaning', text: 'The hygienist cleans and polishes, then Dr. Barriere completes the examination and makes recommendations, from nothing at all to a restoration.' },
        { title: 'The plan', text: 'If treatment is needed, you leave with a written plan, a quote, and financing worked out. Same-day crowns and emergency care mean many things are handled at once.' },
      ],
      image: { src: '/media/img/front-desk-leslie.jpg', alt: 'Leslie at the front desk' },
    },
    {
      type: 'strip', name: 'The Relationship', tag: 'The Relationship', title: 'A lifetime relationship, a lifetime of <em>health.</em>',
      lead: 'Each visit, the team knows you a little better, and the care gets a little more precise.',
      body: [
        'Oral health and general health are linked in study after study. Preventing gum disease is preventing more than tooth loss.',
        'Having general dentistry done by the team that places your implants and veneers means one record, one scanner and one standard.',
      ],
      list: [
        { b: 'One roof', span: 'From cleanings to full arch' },
        { b: 'Bilingual', span: 'English and Spanish' },
        { b: 'Savings plan', span: 'For patients without insurance' },
        { b: 'Sedation', span: 'For nervous patients, any visit' },
      ],
      actions: [{ href: '/what-to-expect.html', label: 'What to expect at your first visit', kind: 'text' }],
      photos: [
        { src: '/media/img/staff.jpg', alt: 'The West LA Implants team' },
        { src: '/media/img/still-front-desk-handshake.jpg', alt: 'A patient welcomed at the front desk' },
        { src: '/media/img/still-reception-neon.jpg', alt: 'The reception' },
      ],
      flip: true,
    },
    {
      type: 'faq', name: 'The Questions', title: 'Everyday <em>questions.</em>',
      items: [
        { q: 'Do you take my insurance?', a: 'The practice is in network with most PPO carriers, including United, Concordia, Principal, GIHA, Emeritus and Guardian, and files claims for you. Without insurance, the savings plan includes exams, cleanings and a discount on treatment.' },
        { q: 'Do you see children?', a: 'Yes, at any age.' },
        { q: 'What counts as an emergency?', a: 'A cracked or broken tooth, a lost filling or crown, a knocked-out tooth, a toothache, bleeding gums or swelling. Call; same-day and next-day appointments are kept for exactly this.' },
        { q: 'How often should I come in?', a: 'Twice a year for most people, more often with periodontal disease. The exam sets the interval.' },
      ],
    },
    {
      type: 'invite', name: 'Invitation', title: 'Smile at the whole <em>suite</em> of services.', lead: 'Book a first visit, a cleaning, or an emergency appointment. The team replies within one business day; for an emergency, call.',
      formTitle: 'Book a visit',
      interests: ['A first visit or cleaning', 'A toothache or emergency', 'A crown, filling or root canal', 'Care for a child', 'Not sure yet'],
      next: [
        { href: '/what-to-expect.html', label: 'Your first visit', text: 'What happens, and the forms.' },
        { href: '/periodontics.html', label: 'Periodontics', text: 'When the gums need more than a cleaning.' },
        { href: '/cosmetic-dentistry.html', label: 'Cosmetic dentistry', text: 'Veneers, whitening and Invisalign®.' },
      ],
    },
  ],
}
