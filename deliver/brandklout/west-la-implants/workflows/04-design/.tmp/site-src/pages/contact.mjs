export default {
  slug: 'contact',
  title: 'Contact West LA Implants: 12301 Wilshire Blvd Suite 205, Los Angeles | Book a Consultation',
  description: 'Contact West LA Implants on Wilshire Blvd in Los Angeles. New patients (310) 692-9316, current patients (310) 481-0111, book online on Zocdoc, or send a consultation request. Monday to Friday, 9am to 5pm.',
  image: '/media/img/still-front-desk-handshake.jpg',
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Contact · Wilshire Blvd, Los Angeles',
      title: 'Get in <em>touch.</em>',
      lead: 'Call, book a time online, or send a request. New patients have their own line, and a real person answers it.',
      image: { src: '/media/img/still-front-desk-handshake.jpg', pos: '10% 50%', alt: 'Our front desk welcoming a patient' },
      actions: [{ href: 'tel:+13106929316', label: 'Call (310) 692-9316' }, { href: 'https://www.zocdoc.com/booking-link/practice/west-la-implants-65990', label: 'Book online on Zocdoc', kind: 'text', ext: true }],
      meta: [
        { b: 'New patients', span: '(310) 692-9316' },
        { b: 'Current patients', span: '(310) 481-0111' },
        { b: 'Suite 205', span: '12301 Wilshire Blvd' },
        { b: 'Mon to Fri', span: '9am to 5pm' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/hygienist-procedure.jpg' },
      text: 'A phone call is still the fastest way into this practice. A person answers, checks your benefits, and finds the time.',
      after: ['Everything else on this page exists for the hours when nobody is at the desk.'],
    },
    {
      type: 'contactcard', name: 'The Place', title: 'On Wilshire, minutes from the <em>Westside.</em>',
      image: { src: '/media/img/still-reception-neon.jpg', alt: 'The reception at West LA Implants' },
      body: [
        'The practice is at 12301 Wilshire Blvd, Suite 205, at the western end of Wilshire between Brentwood and Santa Monica. Westwood, Century City, Culver City and Beverly Hills are a short drive along the boulevard or down the 405.',
      ],
    },
    {
      type: 'steps', name: 'The Ways', tag: 'The Ways', title: 'Three ways to <em>book.</em>',
      steps: [
        { title: 'Call', text: 'New patients: (310) 692-9316. Current patients: (310) 481-0111. Monday to Friday, 9am to 5pm. For a dental emergency, call and say so; same-day and next-day appointments are kept for it.' },
        { title: 'Book online', text: 'Pick a time on Zocdoc and it lands straight in the practice’s calendar.' },
        { title: 'Send a request', text: 'The form below reaches the front desk, who reply within one business day with times.' },
      ],
      image: { src: '/media/img/front-desk-receptionist.jpg', alt: 'The front desk at West LA Implants' },
    },
    {
      type: 'ledger', name: 'Before You Come', tag: 'Before You Come', title: 'Six things to <em>know.</em>',
      figure: { value: 6, label: 'things to know before you come' },
      items: [
        { b: 'Two numbers', span: 'New patients (310) 692-9316; current patients (310) 481-0111. Either reaches the same team.' },
        { b: 'Suite 205', span: '12301 Wilshire Blvd, at Bundy. The building has parking.' },
        { b: 'Bring', span: 'Your insurance card, a medication list, and any scans or quotes from another office.' },
        { b: 'Sedation', span: 'If you are having oral or IV sedation, bring someone to drive you home.' },
        { b: 'Languages', span: 'English and Spanish, at the desk and in the room.' },
        { b: 'Emergencies', span: 'Same-day and next-day appointments; call and say it is urgent.' },
      ],
    },
    {
      type: 'faq', name: 'The Questions', title: 'Before you <em>arrive.</em>',
      items: [
        { q: 'Is there parking?', a: 'Yes, at the building. The front desk will tell you the current arrangement when you book.' },
        { q: 'Which number do I call?', a: 'New patients use (310) 692-9316. Current patients use (310) 481-0111. Either line reaches the same team.' },
        { q: 'Do you take walk-ins?', a: 'For emergencies, call first and come in; same-day appointments are kept for them. For everything else, booking ahead means you are seen on time.' },
        { q: 'Where do referring doctors send records?', a: 'The referring doctors page has the details, or call the office and ask for the back office manager.' },
      ],
    },
    {
      type: 'invite', name: 'Invitation', title: 'Send a <em>request.</em>', lead: 'The front desk replies within one business day. For an emergency, call.',
      interests: ['A consultation', 'A first visit or cleaning', 'A toothache or emergency', 'A question about a quote', 'Not sure yet'],
      next: [
        { href: '/what-to-expect.html', label: 'Your first visit', text: 'What happens, and the forms.' },
        { href: '/our-practice.html', label: 'The practice', text: 'The rooms, the team, the comforts.' },
        { href: '/referring-doctors.html', label: 'Referring doctors', text: 'How to refer a patient.' },
      ],
    },
  ],
}
