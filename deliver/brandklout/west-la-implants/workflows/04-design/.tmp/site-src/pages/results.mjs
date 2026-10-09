import { FILMS } from '../lib/site.mjs'

export default {
  slug: 'results',
  title: 'Before & After Photos, Patient Stories & Video Library | West LA Implants',
  description: 'Real results from West LA Implants: All-on-4® full arch, implants and crowns, full mouth reconstruction, veneers, whitening and Invisalign® before and after, three patient stories on film, and Dr. Barriere’s video library.',
  image: '/media/img/michael-before-after.jpg',
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Results · Los Angeles',
      title: 'The proof is in our <em>patients.</em>',
      lead: 'Before and after, in the practice’s own photographs. Three patients telling their own stories on film. And the doctor explaining the work in his own words.',
      image: { src: '/media/img/patient-smile-portrait-1.jpg', pos: '40% 40%', alt: 'A West LA Implants patient smiling after his treatment' }, // BugHerd #57
      actions: [{ href: '#gallery', label: 'See the Gallery' }, { href: '#invitation', label: 'Request a consultation', kind: 'text' }],
      meta: [
        { b: '3', span: 'Patients on film' },
        { b: '12', span: 'Before and after cases' },
        { b: '10', span: 'Films in the library' },
        { b: 'Real', span: 'Every photograph is a patient here' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/still-leslie-tablet.jpg' },
      text: 'Every photograph on this page is a patient of this practice. No stock, no models, no borrowed smiles.',
      after: ['Three of them agreed to be filmed. The rest are on the practice’s walls. Results vary; a consultation includes a simulation of your own.'],
    },
    {
      type: 'stories', name: 'The Stories', title: 'Three patients, in their own <em>words.</em>', ba: false, // the gallery below carries the same before/after pairs
      lead: 'Leslie, Emily and Michael each agreed to be filmed. Hover to see them; click to watch the full story.',
    },
    {
      type: 'gallery', name: 'The Gallery', title: 'Before and <em>after.</em>', id: 'gallery',
      lead: 'Drag the handle, or hover, to compare. Each case is a patient of the practice.',
      pairs: [
        { before: '/media/img/case10_before_westlaimplants_leslie_barriere.jpg', after: '/media/img/case10_after_westlaimplants_leslie_barriere.jpg', label: 'All-on-4® full arch', sub: 'Leslie' },
        { before: '/media/img/case11_before_westlaimplants_emily_barriere.jpg', after: '/media/img/case11_after_westlaimplants_emily_barriere.jpg', label: 'Implants & crowns', sub: 'Emily' },
        { before: '/media/img/case2_before_westlaimplants_barriere_large.jpg', after: '/media/img/case2_after_westlaimplants_barriere_large.jpg', label: 'Dental implant & crowns' },
        { before: '/media/img/case3_before_westlaimplants_barriere_large.jpg', after: '/media/img/case3_after_westlaimplants_barriere_large.jpg', label: 'Dental implants' },
        { before: '/media/img/ba-case4-before.jpg', after: '/media/img/ba-case4-after.jpg', label: 'Dental implants' },
        { before: '/media/img/ba-case5-before.jpg', after: '/media/img/ba-case5-after.jpg', label: 'Dental implants' },
        { before: '/media/img/ba-case6-before.jpg', after: '/media/img/ba-case6-after.jpg', label: 'Dental implants' },
        { before: '/media/img/ba-case7-before.jpg', after: '/media/img/ba-case7-after.jpg', label: 'Dental implants' },
        { before: '/media/img/ba-veneers-1-before.jpg', after: '/media/img/ba-veneers-1-after.jpg', label: 'Porcelain veneers' },
        { before: '/media/img/ba-whitening-before.jpg', after: '/media/img/ba-whitening-after.jpg', label: 'Teeth whitening' },
        { before: '/media/img/ba-invisalign-before.jpg', after: '/media/img/ba-invisalign-after.jpg', label: 'Invisalign®' },
      ],
      note: 'Photographs are of West LA Implants patients. Results vary; your consultation includes a simulation of your own.',
    },
    {
      type: 'proof', name: 'The Proof', patient: 'michael', title: 'One case, <em>slowly.</em>',
      text: 'Michael’s full mouth reconstruction, before and after, at the speed of your scroll.',
    },
    {
      type: 'ledger', name: 'The Count', tag: 'The Count', title: 'What this page <em>holds.</em>',
      figure: { value: 12, label: 'before-and-after cases' },
      items: [
        { b: 'Three patient stories', span: 'Leslie, Emily and Michael, filmed for the practice’s channel.' },
        { b: 'Twelve cases', span: 'Full arch, implants and crowns, reconstruction, veneers, whitening, Invisalign®.' },
        { b: 'Ten films', span: 'Dr. Barriere on experience, guided surgery, technology and cosmetic work.' },
        { b: 'One rule', span: 'Every image is a patient of the practice, none of them stock.' },
      ],
    },
    {
      type: 'videos', name: 'The Library', title: 'Dr. Barriere <em>explains.</em>',
      lead: 'Short films from the practice’s YouTube channel. Each opens on YouTube.',
      items: [FILMS.experience, FILMS.guided, FILMS.technology, FILMS.cosmetic, FILMS.wisdom, FILMS.invisalign, FILMS.welcome, FILMS.leslie, FILMS.emily, FILMS.michael],
    },
    {
      type: 'invite', name: 'Invitation', title: 'Your before is <em>today.</em>', lead: 'A consultation includes a scan and a simulation of your own result.',
      interests: ['Dental implants', 'All-on-4 / full arch', 'Veneers or cosmetic', 'A second opinion', 'Not sure yet'],
      next: [
        { href: '/all-on-4.html', label: 'All-on-4® full arch', text: 'What Leslie had.' },
        { href: '/cosmetic-dentistry.html', label: 'Cosmetic dentistry', text: 'Veneers, whitening and Invisalign®.' },
        { href: '/dr-tony-barriere.html', label: 'Dr. Barriere', text: 'The surgeon behind the work.' },
      ],
    },
  ],
}
