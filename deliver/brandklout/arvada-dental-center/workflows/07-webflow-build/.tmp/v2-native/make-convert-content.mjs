#!/usr/bin/env node
/**
 * make-convert-content.mjs — generate the consult and thank-you content for
 * all six topics from one compact spec each.
 *
 * These two page types say almost the same thing on every topic; only the
 * service, the offer wording and the interest options change. Writing twelve
 * JSON files by hand would invite exactly the drift the shared `_base.json`
 * exists to prevent, so they are generated and the spec is the thing reviewed.
 *
 * Every factual claim here is already carried by the matching ads-landing page
 * (see content/<topic>.json) — nothing new is asserted about the practice.
 *
 *   node make-convert-content.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.resolve(HERE, '../../../04-design/.tmp/v2/content');

const TEL = 'tel:+13034217611';
const PHONE = '(303) 421-7611';
const BOOK = 'https://www.patientsreach.com/schedule/Arvada-Dental-Center/patient_types/';

/** Per topic: what the visit is called, and what the page is about. */
const SPEC = {
  implants: {
    service: 'dental implants',
    visit: 'free consultation',
    Visit: 'Free consultation',
    eyebrow: 'DENTAL IMPLANT CONSULTATION',
    h1: 'Book your free implant consultation.',
    lead: 'Tell us a little about your situation and the team will call you back to arrange a consultation with Dr. Gregory Bennett — an examination, a 3D scan, and a written plan with a real number.',
    micro: 'Free consultation · 3D scan · A written plan',
    noteTitle: 'No obligation',
    note: 'you leave with a written plan and a real number. Nothing is booked on the day unless you want it booked.',
    options: ['One missing tooth', 'Several missing teeth', 'Most or all of my teeth', "I'm not sure yet"],
    legal: 'Individual treatment is quoted in writing after examination and 3D imaging.',
  },
  aox: {
    service: 'full-arch treatment',
    visit: 'consultation',
    Visit: 'Consultation',
    eyebrow: 'FULL-ARCH CONSULTATION',
    h1: 'Find out if a fixed arch is possible for you.',
    lead: 'Tell us where you are starting from and the team will call you back to arrange a consultation — a 3D scan to measure the bone, a plan built for your jaw, and the published price applied to your case.',
    micro: '3D scan · A plan for your jaw · A published price',
    noteTitle: 'A published price',
    note: 'a fixed full upper or lower arch is $18,795. Anything more complex is quoted in writing after your scan.',
    options: ['I wear dentures now', 'I have several teeth left', 'I have no teeth in one arch', "I'm not sure yet"],
    legal: '$18,795 refers to a fixed full upper or lower arch. Individual treatment is quoted in writing after examination and 3D imaging.',
  },
  veneers: {
    service: 'porcelain veneers',
    visit: 'smile evaluation',
    Visit: 'Smile evaluation',
    eyebrow: 'SMILE EVALUATION',
    h1: 'Book your smile evaluation.',
    lead: 'Tell us what you would change and the team will call you back to arrange an evaluation — gum health, decay and bite checked first, then shade, shape and proportion decided with you.',
    micro: 'Candidacy checked first · Designed with you · Quoted in writing',
    noteTitle: 'An honest answer first',
    note: 'if straighter teeth are what you actually want, Invisalign® or Six Month Smiles is usually the better route, and you will be told so.',
    options: ['Chips or cracks', 'Gaps between teeth', 'Stains or discolouration', 'Overall shape and proportion'],
    legal: 'Veneers are quoted in writing after examination, because the figure depends on how many teeth are treated.',
  },
  emergency: {
    service: 'urgent dental care',
    visit: 'urgent visit',
    Visit: 'Urgent visit',
    eyebrow: 'REQUEST AN URGENT VISIT',
    h1: 'Tell us what hurts. We will call you back.',
    lead: 'Describe what is going on and the team will call back to assess urgency and offer the earliest appropriate opening. If it cannot wait, call — the phone is faster than a form.',
    micro: 'Urgent assessment · Digital imaging · Relief first',
    noteTitle: 'Call 911 or go to an ER',
    note: 'for trouble breathing or swallowing, uncontrolled bleeding, serious facial trauma, or life-threatening symptoms.',
    options: ['Severe or persistent pain', 'Swelling or infection', 'Broken or knocked-out tooth', 'Lost crown or filling'],
    legal: 'Urgent visits are scheduled by clinical need and availability. A request is not a confirmed appointment.',
  },
  'dentist-near-me': {
    service: 'your first visit',
    visit: '$109 first visit',
    Visit: '$109 first visit',
    eyebrow: 'CLAIM THE $109 NEW PATIENT SPECIAL',
    h1: 'Claim your $109 first visit.',
    lead: 'Tell us how to reach you and the team will call back to book it — a comprehensive exam, digital X-rays, an OralID oral cancer screening and a treatment plan talked through with one of the doctors.',
    micro: 'Exam · Digital X-rays · OralID screening · Treatment plan',
    noteTitle: 'No lecture, whatever the gap',
    note: 'however long it has been, the practice is judgment-free and education-based. You get told what is going on; what happens next is your call.',
    options: ['A check-up and clean', "I've not been in a while", "Something specific is bothering me", 'I want a second opinion'],
    legal: '$109 new patient special. New patients aged 18 and over; restrictions apply. Not HMO or Medicaid.',
  },
  'next-door': {
    service: 'your first visit',
    visit: '$109 first visit',
    Visit: '$109 first visit',
    eyebrow: 'YOUR NEIGHBOURHOOD DENTIST',
    h1: 'Book the $109 first visit.',
    lead: 'Tell us how to reach you and the team will call back to book it — for you, or for everyone at your address. Exam, digital X-rays, oral cancer screening and a plan talked through with a doctor.',
    micro: 'Minutes away · Families welcome · Parking at the door',
    noteTitle: 'One practice for the whole house',
    note: 'children and adults are both treated here. The $109 special itself applies to patients 18 and over.',
    options: ['Just me', 'Me and my partner', 'The whole family', "I'm booking for someone else"],
    legal: '$109 new patient special. New patients aged 18 and over; restrictions apply. Not HMO or Medicaid.',
  },
};

for (const [topic, s] of Object.entries(SPEC)) {
  const ads = JSON.parse(fs.readFileSync(path.join(CONTENT, `${topic}.json`), 'utf8'));

  const consult = {
    _note: `Consult page for ${topic}. Generated by make-convert-content.mjs; edit the spec there, not this file. Facts match content/${topic}.json.`,
    'announce1.announce-lead': ads['announce1.announce-lead'],
    'announce1.announce-note': ads['announce1.announce-note'],
    'announce1.announce-link.href': TEL,
    'announce1.announce-link2': PHONE,
    'consult.eyebrow': s.eyebrow,
    'consult.h1': s.h1,
    'consult.lead': s.lead,
    'consult.microproof': s.micro,
    'consult.note-title': s.noteTitle,
    'consult.note': s.note,
    'consult.form-kicker': 'REQUEST A CALL BACK',
    'consult.form-title': `Book your ${s.visit}`,
    'consult.field-interest': `What is this about?`,
    'consult.option1': s.options[0],
    'consult.option2': s.options[1],
    'consult.option3': s.options[2],
    'consult.option4': s.options[3],
    'consult.field-notes': 'Anything the team should know?',
    'consult.submit': `Request my ${s.visit}`,
    'consult.form-note': `The team calls back Monday to Friday, 8am to 5pm. A request is not a confirmed appointment until the office speaks with you. ${s.legal}`,
    'section-mist12.eyebrow': 'PATIENT-BACKED TRUST',
    'consult.reviews-h2': "Why Arvada patients choose Dr. Bennett's team.",
    'section-mist12.text': ads['section-mist12.text'],
    'consult.legal': s.legal,
    'consult.mobile-cta': 'Request a call',
  };

  const ty = {
    _note: `Thank-you page for ${topic}. Generated by make-convert-content.mjs; edit the spec there, not this file.`,
    'ty.announce-lead': 'Request received',
    'ty.announce-note': '· The team will call you back',
    'announce1.announce-link.href': TEL,
    'announce1.announce-link2': PHONE,
    'ty.eyebrow': 'REQUEST RECEIVED',
    'ty.h1': 'Thank you — your request is with the team.',
    'ty.lead': `Someone from Arvada Dental Center will call you back Monday to Friday, 8am to 5pm to arrange your ${s.visit}. If you would rather not wait, the phone is faster.`,
    'ty.button1': `Call ${PHONE}`,
    'ty.button2.href': BOOK,
    'ty.button2': 'Book online instead',
    'ty.meta': `A request is not a confirmed appointment until the office speaks with you. ${s.legal}`,
    'ty.next-eyebrow': 'WHAT HAPPENS NEXT',
    'ty.next-h2': 'Know what comes next before you begin.',
    'ty.next-text': 'Four short steps, so nothing about the process is a surprise.',
    'ty.step1-title': 'We call you back',
    'ty.step1-text': 'A member of the team calls Monday to Friday, 8am to 5pm to confirm a time that works and answer anything you want to ask first.',
    'ty.step2-title': `Your ${s.visit}`,
    'ty.step2-text': `You see Dr. Bennett or one of the doctors at 6695 Wadsworth Blvd. Bring anything relevant about your medical history and any insurance details.`,
    'ty.step3-title': 'A plan, in writing',
    'ty.step3-text': 'You are told what is going on, what the options are, and what each would cost — before anything is scheduled.',
    'ty.step4-title': 'You decide',
    'ty.step4-text': 'Nothing is booked unless you want it booked. Monthly payment plans are available if you would rather spread the cost.',
    'ty.provider-caption': 'ARVADA, CO · IN PRACTICE SINCE 2003',
    'ty.provider-eyebrow': 'WHO YOU WILL SEE',
    'ty.provider-h2': 'Every phase of your case, one surgeon.',
    'ty.provider-text': ads['section10.text'] || 'Dr. Bennett founded Arvada Dental Center and has practised in Colorado for more than two decades.',
    'ty.provider-link': `Call ${PHONE}`,
    'section-mist12.eyebrow': 'PATIENT-BACKED TRUST',
    'ty.reviews-h2': "Why Arvada patients choose Dr. Bennett's team.",
    'section-mist12.text': ads['section-mist12.text'],
    'ty.legal': s.legal,
  };

  fs.writeFileSync(path.join(CONTENT, `${topic}.consult.json`), JSON.stringify(consult, null, 1));
  fs.writeFileSync(path.join(CONTENT, `${topic}.ty.json`), JSON.stringify(ty, null, 1));
  console.log(`${topic}: consult + thank-you content written`);
}
