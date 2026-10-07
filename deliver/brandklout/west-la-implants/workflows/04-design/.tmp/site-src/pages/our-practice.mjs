import { FILMS, filmHref } from '../lib/site.mjs'

export default {
  slug: 'our-practice',
  title: 'Our Practice & Team: West LA Implants on Wilshire Blvd, Los Angeles',
  description: 'Inside West LA Implants: the surgical suite with the Yomi® robot and CBCT, the reception, the amenities for nervous patients, and the team of assistants, hygienist and office manager who run the day.',
  image: '/media/img/still-reception-neon.jpg',
  chapters: [
    {
      type: 'cover', name: 'Arrival', layout: 'bleed', kicker: 'The practice · 12301 Wilshire Blvd, Suite 205',
      title: 'Advanced dentistry, without forgetting the <em>person</em> in the chair.',
      lead: 'An implant and cosmetic dentistry centre on Wilshire, built so a nervous patient feels calm from the front door to the last appointment.',
      video: { src: '/media/video/hero-practice-1920.mp4', srcMobile: '/media/video/hero-practice-960.mp4', poster: '/media/img/still-reception-neon.jpg', label: 'Inside West LA Implants: the reception, the 3D imaging suite and the Yomi surgical robot' },
      actions: [{ href: '#invitation', label: 'Book a Visit' }, { href: filmHref(FILMS.welcome), label: 'Watch: welcome to West LA Implants', kind: 'text', ext: true }],
      meta: [
        { b: 'Wilshire', span: 'Suite 205, free of clutter' },
        { b: 'One roof', span: 'Scan, surgery, lab, teeth' },
        { b: 'English & Spanish', span: 'Spoken by the team' },
        { b: 'Mon to Fri', span: '9am to 5pm' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/waiting-room.jpg' },
      text: 'Almost every patient the practice sees carries some dental anxiety. The rooms, the pace and the people are arranged around that fact.',
      after: ['Blankets and pillows, noise-cancelling headphones, a television with Netflix, IV sedation for the day itself, and a team that would rather answer a question twice than leave it hanging.'],
    },
    {
      type: 'ledger', name: 'The Comforts', tag: 'The Comforts', title: 'Six small things that make a <em>calm</em> visit.',
      figure: { value: 6, label: 'comforts, on every visit' },
      items: [
        { b: 'IV sedation', span: 'Sleep through the surgery, wake up with the work done.' },
        { b: 'Blankets and pillows', span: 'Warm, and yours for the appointment.' },
        { b: 'TV and Netflix', span: 'In the chair, on the ceiling, your choice of programme.' },
        { b: 'Noise-cancelling headphones', span: 'The sound of the room replaced with your own.' },
        { b: 'English and Spanish', span: 'Spoken by the team, at the front desk and in the room.' },
        { b: 'Same-day emergency visits', span: 'For a toothache, a broken tooth, a lost crown.' },
      ],
    },
    {
      type: 'strip', name: 'The Rooms', tag: 'The Rooms', title: 'A surgical suite that happens to be a <em>dental</em> office.',
      lead: 'Diagnostics, planning, surgery and the lab share one floor, so nothing about your case leaves the building.',
      body: [
        'The cone-beam CT and intraoral scanners sit beside the operatories. The Yomi® robot lives in the surgical suite. Guides are printed and restorations milled a few steps away.',
        'The reception is quiet, the front desk knows your name, and the coffee is real.',
      ],
      list: [
        { b: 'CBCT suite', span: '3D scans in seconds' },
        { b: 'Surgical suite', span: 'With the Yomi® robot' },
        { b: 'In-house lab', span: '3D printer and milling' },
        { b: 'Reception', span: 'Calm, unhurried' },
      ],
      actions: [{ href: '/technology.html', label: 'The technology', kind: 'text' }],
      photos: [
        { src: '/media/img/still-cbct-suite.jpg', alt: 'The CBCT imaging suite' },
        { src: '/media/img/yomi-technology.jpg', alt: 'The Yomi robot in the surgical suite' },
        { src: '/media/img/still-reception-neon.jpg', alt: 'The reception at West LA Implants' },
      ],
    },
    {
      type: 'team', name: 'The Team', title: 'The people who run the <em>day.</em>',
      lead: 'Dr. Barriere places the implants. These are the people who make the rest of the visit work.',
      people: [
        { name: 'Dr. Tony Barriere', role: 'Implant & cosmetic dentist', image: '/media/img/doctor-headshot-square.png', bio: 'Ohio State College of Dentistry, a yearlong surgical residency at NYU Langone, more than a thousand hours of continuing education. Plans, places and restores every implant himself.' },
        { name: 'Veronica V.', role: 'Office manager', image: '/media/img/team-veronica.png', bio: 'Nineteen years as a surgical coordinator and operatory materials manager at an outpatient surgical centre before dentistry. Her job is that every patient leaves in the best possible condition, whatever the treatment.' },
        { name: 'Delia E.', role: 'Registered dental assistant & back office manager', image: '/media/img/team-delia.png', bio: 'In dentistry since 2011; braces as a child are what drew her in. Treats every patient like family, because most arrive with some fear and kindness is the cure for it. A lifelong Angeleno.' },
        { name: 'Tielar A.', role: 'Dental assistant', image: '/media/img/team-tielar.png', bio: 'A dental assistant since 2019, energised by how fast the technology moves and by knowing she made a difference in someone’s smile. Born and raised in Los Angeles.' },
        { name: 'Jacob R.', role: 'Hygienist', image: '/media/img/team-jacob.png', bio: 'The most gentle and proficient hygienist on the west side, according to one Google review. Runs the cleanings and the periodontal maintenance visits.' },
      ],
    },
    {
      type: 'proof', name: 'The Proof', patient: 'emily', title: 'The experience, in <em>her</em> words.',
      text: 'Emily’s crowns and implants. Her film is on the practice’s channel.',
    },
    {
      type: 'faq', name: 'The Questions', title: 'Practical <em>questions.</em>',
      items: [
        { q: 'Where do I park?', a: 'The building at 12301 Wilshire Blvd has parking; the front desk will tell you the current arrangement when you book. The practice is in Suite 205.' },
        { q: 'Do you speak Spanish?', a: 'Yes. The team speaks English and Spanish.' },
        { q: 'Can I bring someone with me?', a: 'Yes, and for oral or IV sedation you must: someone needs to drive you home.' },
        { q: 'What are the hours?', a: 'Monday to Friday, 9am to 5pm, with same-day emergency appointments. After hours, surgical patients can reach the office and someone calls back as soon as possible.' },
      ],
    },
    {
      type: 'invite', name: 'Invitation', title: 'You are <em>welcome</em> here.', lead: 'Book a first visit, or come for a consultation and a look around.',
      interests: ['A first visit', 'Dental implants', 'IV sedation', 'A second opinion', 'Not sure yet'],
      next: [
        { href: '/dr-tony-barriere.html', label: 'Dr. Barriere', text: 'Training, residency and continuing education.' },
        { href: '/what-to-expect.html', label: 'Your first visit', text: 'What happens, and the forms.' },
        { href: '/contact.html', label: 'Contact', text: 'Address, hours, directions and Zocdoc.' },
      ],
    },
  ],
}
