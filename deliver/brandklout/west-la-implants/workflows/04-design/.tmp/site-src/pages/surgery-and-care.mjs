/* /surgery-and-care — the hub for the treatments around the implant (BugHerd #59, Asana 1219333478027729),
   as workflows/21-instatic-upload/apply-bugherd-round3.mjs (HUBS) built it on the live site: a split cover,
   the treatments as photo cards of the pages they link to, and the invitation (the sedation page's, which
   the live page was cloned from) with its own "where next". */
import fs from 'node:fs'

const ORIGIN = JSON.parse(fs.readFileSync(new URL('../seo.json', import.meta.url), 'utf8')).origin.replace(/\/$/, '')
const TITLE = 'Surgery & Care in Los Angeles | West LA Implants'
const CARDS = [
  { href: '/sedation-dentistry.html', title: 'IV sedation', text: 'IV, oral and nitrous sedation, matched to how anxious you are and how long the work will take.', image: '/media/img/stock-sedation-hero.jpg', pos: '50% 50%' },
  { href: '/bone-grafting.html', title: 'Bone, sinus & ridge grafting', text: 'Bone shrinks where a tooth is missing. Grafting puts it back, so an implant has something solid to hold.', image: '/media/img/stock-graft-hero.jpg', pos: '50% 50%' },
  { href: '/tooth-extractions.html', title: 'Tooth extractions', text: 'When a tooth cannot be saved, a gentle extraction ends the pain and protects everything around it.', image: '/media/img/patient-smile-portrait-5.jpg', pos: '50% 40%' },
  { href: '/periodontics.html', title: 'Periodontics', text: 'Gum disease treated with a diode laser: less scraping, less pain and faster healing.', image: '/media/img/gum-disease-patient.jpg', pos: '90% 50%' },
  { href: '/missing-teeth.html', title: 'Missing teeth & loose dentures', text: 'Missing teeth, loose dentures and bone loss, and every option that replaces them.', image: '/media/img/patient-covering-mouth.jpg', pos: '90% 50%' },
  { href: '/cosmetic-dentistry.html', title: 'Cosmetic dentistry', text: 'Veneers, whitening, Invisalign® and complete makeovers, shown to you on screen first.', image: '/media/img/emily-makeover-after.jpg', pos: '100% 50%' },
  { href: '/general-dentistry.html', title: 'General dentistry', text: 'Cleanings, exams, crowns and emergencies, with the same team and the same scanner.', image: '/media/img/cbct-emily.jpg', pos: '90% 40%' },
]

export default {
  slug: 'surgery-and-care',
  title: TITLE,
  description: 'Sedation, bone and sinus grafting, extractions, gum care, missing teeth and loose dentures, cosmetic and general dentistry at West LA Implants on Wilshire Blvd.',
  image: '/media/img/hygienist-procedure.jpg',
  jsonld: [{ '@type': 'CollectionPage', name: TITLE, url: `${ORIGIN}/surgery-and-care`, hasPart: CARDS.map((c) => ({ '@type': 'WebPage', name: c.title, url: ORIGIN + c.href.replace(/\.html$/, '') })) }],
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Surgery & care · Los Angeles',
      title: 'The care around <em>the implant.</em>',
      lead: 'Sedation, grafting, extractions and gum treatment prepare the mouth for an implant. Cosmetic and general dentistry keep the result for life. All of it is done here, by the same team.',
      image: { src: '/media/img/hygienist-procedure.jpg', pos: '60% 50%', alt: 'A hygiene visit at West LA Implants' },
      actions: [{ href: '#invitation', label: 'Request a Consultation' }, { href: '/dr-tony-barriere.html', label: 'Meet Dr. Barriere', kind: 'text' }],
      meta: [
        { b: '7', span: 'Treatments under one roof' },
        { b: 'IV sedation', span: 'For anxious patients' },
        { b: 'Laser', span: 'Gum care, faster healing' },
        { b: 'Same day', span: 'Emergency visits' },
      ],
    },
    {
      type: 'postindex', name: 'The Treatments', hub: true, id: 'treatments', tag: 'The treatments', title: 'Seven treatments, <em>one roof.</em>',
      lead: 'Each page explains the treatment, the visit and the recovery.',
      cards: CARDS,
    },
    {
      type: 'invite', name: 'Invitation', title: 'Schedule the one you’ll <em>keep.</em>', lead: 'Tell us how you feel about the dentist. The plan starts there.',
      interests: ['IV sedation', 'Dental implants', 'All-on-4 / full arch', 'General dentistry', 'Not sure yet'],
      next: [
        { href: '/dental-implants.html', label: 'Dental implants', text: 'One tooth to a full arch.' },
        { href: '/technology.html', label: 'Technology', text: 'Yomi®, the CBCT and the in-house lab.' },
        { href: '/the-practice.html', label: 'The practice', text: 'The team, the first visit, the journal.' },
      ],
    },
  ],
}
