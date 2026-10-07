/* ==========================================================================
   ADS LANDING PAGES — two campaigns, three pages each, under /ads-landing-pages/
     all-on-6   West LA All on 6 Page (ChatGPT Ads)            Asana 1218513737115127
     3-on-6     West La 3 on 6 Landing Page (Google Search)    Asana 1218556641026733
   Assembled by lib/lp.mjs. The manifest the gates read is
   scenario-3-ads-landing-pages/01-campaign-intake/output/combo.json; keep the
   slugs here and there identical.

   SOURCES. Nothing here is invented:
   - the practice, the process, sedation, financing: the organic pages in
     pages/*.mjs, which were written from the client's own site
   - the patients' words: the transcripts the practice publishes under its own
     YouTube films (01-campaign-intake/output/assets/patient-film-transcripts.md)
   - the Google reviews: the ones on the approved homepage
   - 3-on-6 and All-on-6 as treatments: described in general terms only, and
     flagged in INTAKE.md for Dr. Barriere to confirm
   Withheld until the client confirms them in writing: any price, "free
   consultation", the one-year warranty, an implant count, a star rating.

   formSnippet: paste the campaign's Go High Level embed here, verbatim, when
   Brandklout sends it. Until then the slot carries the prototype fields.
   ========================================================================== */
import { combo } from '../lib/lp.mjs'

const A = '__ALT__' // the alt this photograph already carries on the organic site (one alt per asset)
const I = (file, alt = A, pos) => ({ src: `/media/img/${file}`, alt, ...(pos ? { pos } : {}) })

const REVIEWS = {
  peter: { text: 'He’s on my team, advising me on my behalf.', who: 'Peter C.' },
  joshua: { text: 'West LA Implants feels like home.', who: 'Joshua F.' },
  annie: { text: 'I actually look forward to going to the dentist.', who: 'Annie G.' },
  mike: { text: 'I am driving from Central California for my implant.', who: 'Mike H.' },
}
const LONG_REVIEWS = [
  { text: 'Dr. Barriere is a dentist who sees a long-term vision for my dental health. He’s on my team, advising me on my behalf, instead of just someone I visit for procedures.', who: 'Peter Chang' },
  { text: 'He is very careful with his implant technique. He makes sure the implant has plenty of time to heal into the jawbone. I am confident he will do a good job with the implant crown.', who: 'Mike Hascats' },
  { text: 'Dr. B was the first person to say, ‘I’m going to do everything. We’re going to do it all in this chair.’', who: 'Michael', src: 'Patient, on film' },
]

const CASES = {
  leslie: { before: '/media/img/case10_before_westlaimplants_leslie_barriere_large.jpg', after: '/media/img/case10_after_westlaimplants_leslie_barriere_large.jpg', label: 'All-on-4® full arch', sub: 'Leslie' },
  michael: { before: '/media/img/case12_before_westlaimplants_michael_barriere_large.jpg', after: '/media/img/case12_after_westlaimplants_michael_barriere_large.jpg', label: 'Full mouth reconstruction', sub: 'Michael' },
  emily: { before: '/media/img/case11_before_westlaimplants_emily_barriere_large.jpg', after: '/media/img/case11_after_westlaimplants_emily_barriere_large.jpg', label: 'Implants & crowns', sub: 'Emily' },
  c2: { before: '/media/img/case2_before_westlaimplants_barriere_large.jpg', after: '/media/img/case2_after_westlaimplants_barriere_large.jpg', label: 'Dental implant & crowns' },
  c3: { before: '/media/img/case3_before_westlaimplants_barriere_large.jpg', after: '/media/img/case3_after_westlaimplants_barriere_large.jpg', label: 'Dental implants' },
  c4: { before: '/media/img/ba-case4-before.jpg', after: '/media/img/ba-case4-after.jpg', label: 'Dental implants' },
  c5: { before: '/media/img/ba-case5-before.jpg', after: '/media/img/ba-case5-after.jpg', label: 'Dental implants' },
  c6: { before: '/media/img/ba-case6-before.jpg', after: '/media/img/ba-case6-after.jpg', label: 'Dental implants' },
  c7: { before: '/media/img/ba-case7-before.jpg', after: '/media/img/ba-case7-after.jpg', label: 'Dental implants' },
}

const FILMS_BEAT = {
  title: 'Three patients, in their own <em>words.</em>',
  lead: 'Leslie, Emily and Michael each agreed to be filmed. Hover to see them; click to watch the full story.',
}
const DOCTOR_BODY = [
  'Dr. Tony Barriere trained at The Ohio State University College of Dentistry, then chose a yearlong surgical residency through NYU Langone Hospital.',
  'More than a thousand hours of continuing education since, most recently on the Yomi® robot that now assists in his implant surgeries.',
]
const DOCTOR_LIST = [
  { b: 'Ohio State', span: 'College of Dentistry' },
  { b: 'NYU Langone', span: 'Yearlong surgical residency' },
  { b: '1,000+ hours', span: 'Continuing education' },
  { b: 'AACD · AAID · ADA', span: 'Memberships' },
]
const ROOMS = (reception, alt) => [
  { title: 'The reception', text: 'Quiet and unhurried. The front desk knows your name.', image: I(reception, alt) },
  { title: 'The 3D imaging suite', text: 'A cone-beam CT scan in seconds, a few steps from the chair.', image: I('still-cbct-suite.jpg') },
  { title: 'The surgical suite', text: 'Where the Yomi® robot lives, and where your implants are placed along the plan.', image: I('yomi-technology.jpg') },
  { title: 'The operatory', text: 'Blankets and pillows, noise-cancelling headphones, and a television with Netflix.', image: I('footer_cta_barriere.jpg', 'A treatment room at West LA Implants') },
  { title: 'The in-house lab', text: 'Guides are printed and restorations milled on the same floor, so nothing about your case leaves the building.', image: I('doctor-cosmetic.jpg') },
]
const Q = {
  pain: { q: 'Does it hurt?', a: 'The surgery is done under IV, oral or nitrous sedation, chosen with you. Most patients who have IV sedation remember little or nothing of the appointment, and a member of the team monitors you throughout.' },
  bone: { q: 'What if I have been told I do not have enough bone?', a: 'Where bone is missing it can be rebuilt with grafting or a sinus lift, in the same suite. Being declined elsewhere is a reason to come, not a reason to stay away, and a second opinion is free.' },
  cost: { q: 'How much does it cost?', a: 'It is quoted after a scan, because implant count, grafting and materials change it. A price before a scan would be wrong for most people who read it. After the scan the quote is specific to you.' },
  finance: { q: 'Can I finance it?', a: 'Yes. The practice works with six lenders, including Proceed Finance with loans up to $60,000 over up to 96 months. It is in network with most PPO dental plans and files the claim for you.' },
}
const TY_EXPECT = {
  title: 'A short call, three <em>things.</em>',
  items: [
    { title: 'Your treatment options', text: 'Tell us what is going on. We explain what a consultation with Dr. Barriere covers and what to bring.' },
    { title: 'Payment options', text: 'Most PPO plans are in network, six lenders offer monthly payments, and the front desk checks your benefits before the visit.' },
    { title: 'Your consultation', text: 'We find a time that suits you, Monday to Friday. The visit includes a 3D scan and a written plan.' },
  ],
}
const TY_WHY = (shots) => ({
  title: 'Why patients <em>choose</em> us.',
  items: [
    { title: 'Experience', text: 'Ohio State, a surgical residency at NYU Langone, and more than a thousand hours of continuing education.', image: I(...shots[0]) },
    { title: 'Personal care', text: 'One surgeon from the plan to the final teeth, and a team that expects nervous patients.', image: I(...shots[1]) },
    { title: 'Clear costs', text: 'A quote after your scan, specific to you, with insurance and financing worked out.', image: I(...shots[2]) },
  ],
})
const DISCLAIMER = 'Individual results vary. Photographs and films show patients of West LA Implants. Treatment, candidacy and fees are determined after an examination and a 3D scan; nothing on this page is a quote or a guarantee of a result. All-on-4® is a registered trademark of Nobel Biocare.'

/* --------------------------------------------------------------------------
   ALL-ON-6 (ChatGPT Ads)
   -------------------------------------------------------------------------- */
const allOn6 = {
  key: 'all-on-6', offer: 'All-on-6 full arch', landing: 'all-on-6', consultation: 'all-on-6-consultation', thankYou: 'thank-you-all-on-6',
  formSnippet: '',
  image: '/media/img/still-leslie-smile-tablet.jpg',
  interests: ['All-on-6 / full arch', 'Loose or failing dentures', 'A second opinion', 'IV sedation', 'Not sure yet'],
  disclaimer: DISCLAIMER,
  seo: {
    landing: { title: 'All-on-6 Full Arch Dental Implants in Los Angeles | West LA Implants', description: 'All-on-6 at West LA Implants: a fixed full arch on six implants, planned from a 3D scan and placed with Yomi® robotic guidance by Dr. Tony Barriere on Wilshire Blvd.' },
    consultation: { title: 'Book an All-on-6 Consultation in Los Angeles | West LA Implants', description: 'Request an All-on-6 consultation with Dr. Tony Barriere: a 3D scan, an honest read on candidacy, and a written plan with insurance and financing worked out.' },
    thankYou: { title: 'Thank You: All-on-6 Consultation Request | West LA Implants', description: 'Your All-on-6 consultation request has reached West LA Implants. The front desk replies within one business day, or call us now.' },
  },
  hero: {
    kicker: 'All-on-6 full arch implants · Los Angeles',
    title: 'A full arch of fixed teeth, on <em>six</em> implants.',
    lead: 'When most or all of the teeth in a jaw are failing, six implants can carry a complete, fixed set. In most full-arch cases you leave surgery with temporary teeth the same day.',
    checks: ['Planned from a 3D scan, placed with Yomi® robotic guidance', 'IV sedation for the day of surgery', 'One surgeon plans, places and restores'],
    review: REVIEWS.peter,
  },
  journey: {
    patient: 'leslie', ba: CASES.leslie, treatment: 'Full arch All-on-4®, top and bottom',
    title: 'Leslie wanted her <em>smile</em> back.',
    lead: 'Years of gum problems, and years spent trying to save her teeth. This is her story, in her words and her surgeon’s. Her arches are carried on four implants each; whether yours needs four or six is read from your scan.',
    portrait: I('still-leslie-smile-tablet.jpg'),
    before: ['Years of gum and periodontal problems', 'Years of work trying to keep her own teeth', 'A hand over her mouth, or turning away', 'Reluctant to smile for her first photographs'],
    after: ['Failing teeth removed and a new smile fitted the same day', 'A fixed full arch, top and bottom', 'Smiling and laughing at her post-op visit', 'Recommends the practice the way it was recommended to her'],
    beats: [
      { label: 'The years before', quote: 'I used to smile all the time and I wasn’t doing that anymore.', who: 'Leslie' },
      { label: 'The decision', quote: 'I like the way I was treated. I like the staff here. I like the friendliness. So I went forward from there.', who: 'Leslie' },
      { label: 'The day', quote: 'We took out her teeth and we gave her a brand new smile the same day.', who: 'Dr. Barriere' },
      { label: 'After', quote: 'If you’re not happy with what you’re doing, come on over here. I highly recommend them.', who: 'Leslie' },
    ],
  },
  why: {
    title: 'Why patients drive <em>past</em> other offices.',
    lead: '“I am driving from Central California for my implant.” Mike H., Google review.',
    image: I('doctor-leslie.jpg', 'Dr. Barriere with Leslie after her full-arch treatment'),
    reasons: [
      { title: 'One surgeon, start to finish', text: 'Dr. Barriere plans, places and restores every implant himself. The person who plans places, and the person who places restores.' },
      { title: 'Guided, never free-hand', text: 'Every case starts with a cone-beam CT scan. The implants go in along the plan, with Yomi® robotic guidance or a printed guide.' },
      { title: 'Everything on one floor', text: 'The scanner, the surgical suite and the in-house lab share one floor, so nothing about your case leaves the building.' },
      { title: 'Difficult cases are the usual ones', text: 'Patients arrive having been declined elsewhere. If the bone is not there it is rebuilt first, and a second opinion is free.' },
    ],
  },
  films: FILMS_BEAT,
  doctor: {
    title: 'The surgeon who does the <em>whole</em> case.',
    lead: '“Dr. Barriere is a dentist who sees a long-term vision for my dental health.” Peter Chang, Google review.',
    body: DOCTOR_BODY, list: DOCTOR_LIST,
    photos: [I('tonybarrerie_headshot_dentist_westlaimplants1.jpg', 'Dr. Tony Barriere, DDS', '60% 30%'), I('still-doctor-xray-screen.jpg'), I('still-doctor-masked.jpg')],
  },
  options: {
    title: 'Three ways to replace an <em>arch.</em>',
    intro: 'Dr. Barriere offers all three and will say plainly which one fits your bone, your health and your budget.',
    columns: [
      { title: 'Implant-supported denture', sub: 'Removable or fixed', rows: ['What it is: a denture secured by two or more implants', 'Treatment time: fewer implants and a shorter surgery', 'Ideal if: you want stability at a lower cost', 'Cost moves with: implant count and the denture material'] },
      { title: 'All-on-4® full arch', sub: 'Fixed, on four implants', rows: ['What it is: a fixed arch on four implants, angled to use the strongest bone', 'Treatment time: temporary teeth the day of surgery in most cases', 'Ideal if: the scan shows four strong sites', 'Cost moves with: grafting, extractions and materials'] },
      { title: 'All-on-6 full arch', sub: 'Fixed, on six implants', hot: true, rows: ['What it is: the same fixed arch, carried by six implants for more support', 'Treatment time: temporary teeth the day of surgery in most cases, final zirconia after three to four months', 'Ideal if: the scan shows bone for six sites', 'Cost moves with: two more implants, plus grafting and materials'] },
    ],
    note: 'The practice quotes after your scan, because implant count, grafting and materials change the number.',
  },
  method: {
    title: 'Three visits that <em>matter.</em>',
    intro: 'Planned from a 3D scan, placed along the plan, restored in the same suite.',
    steps: [
      { title: 'Consultation and 3D scan', text: 'A cone-beam CT scan of your mouth and jaw shows where the bone is strongest and what needs treating first. The plan, and the number of implants, is built from the scan.' },
      { title: 'The day of surgery', text: 'Under IV, oral or nitrous sedation, any remaining teeth are removed and the implants are placed along the plan with Yomi® robotic guidance. In most full-arch cases you leave with temporary teeth.' },
      { title: 'Your final teeth', text: 'After three to four months of healing, a fixed zirconia bridge, milled from a single block, is fitted and checked for bite and comfort.' },
    ],
    image: I('barriere_dentalpractice_dentalimplant_westla2.jpg'),
  },
  results: {
    title: 'Before and <em>after.</em>',
    lead: 'Drag the handle, or hover, to compare. Each case is a patient of this practice.',
    pairs: [CASES.leslie, CASES.michael, CASES.emily, CASES.c4, CASES.c5, CASES.c7],
    note: 'Photographs are of West LA Implants patients. Results vary.',
  },
  rooms: { title: 'A space designed for your <em>comfort.</em>', cards: ROOMS('still-reception-neon.jpg') },
  questions: {
    title: 'Everything patients ask before <em>booking.</em>',
    items: [
      Q.pain,
      { q: 'Can I really get teeth the same day?', a: 'In most full-arch cases, yes. Temporary teeth are fitted at the end of surgery, and the final zirconia bridge follows after three to four months of healing.' },
      { q: 'Four implants or six?', a: 'All-on-4® and All-on-6 are the same idea: a fixed full-arch bridge on implants. Six gives the bridge more support and needs bone in more places. Dr. Barriere decides the number from your scan.' },
      Q.bone, Q.cost, Q.finance,
    ],
  },
  final: { title: 'Make the first step feel <em>clear.</em>', lead: 'A consultation covers candidacy, options, sedation, financing and timing. No pressure, no surprises.', image: '/media/img/still-doctor-patient-hug.jpg' },
  consult: {
    kicker: 'All-on-6 consultation · West LA Implants',
    title: 'Book your <em>consultation.</em>',
    lead: 'Leave your details and the front desk calls to find a time. At the visit Dr. Barriere scans, reads the scan with you, and tells you plainly what he would do.',
    covers: ['A cone-beam CT scan of your mouth and jaw', 'An honest read on candidacy: four implants or six', 'A written plan, with insurance and financing worked out'],
    review: REVIEWS.annie,
    proofTitle: 'One dentist, <em>start</em> to finish.',
    proofLead: 'Dr. Barriere plans, places and restores every implant himself, in one office on Wilshire.',
    proofImage: I('still-doctor-xray-screen.jpg'),
    reviews: LONG_REVIEWS,
  },
  thanks: {
    kicker: 'All-on-6 consultation · request received',
    title: 'Your All-on-6 consultation request is <em>in.</em>',
    lead: 'Thank you. Your request for an All-on-6 consultation with Dr. Barriere is with the front desk, and we reply within one business day. If you would rather not wait, call now and we will find a time together.',
    note: 'Our phones are answered Monday to Friday, 9am to 5pm.',
    review: REVIEWS.joshua,
    image: I('still-front-desk-handshake.jpg', A, '20% 50%'),
    expect: TY_EXPECT,
    why: TY_WHY([['tonybarrerie_headshot_dentist_westlaimplants_frontfacing.jpg'], ['doctor-handshake.jpg'], ['patient-paying.jpg', 'A patient paying for treatment by card']]),
    questions: { title: 'Before you <em>call.</em>', items: [Q.pain, { q: 'Four implants or six?', a: 'Six gives a full-arch bridge more support and needs bone in more places. Dr. Barriere decides the number from your scan.' }, Q.cost, Q.finance] },
    cta: { tag: 'Ready when you are', title: 'Ready to take the next <em>step?</em>', lead: 'Call us, or come and see us on Wilshire.', image: '/media/img/waiting-room.jpg' },
  },
}

/* --------------------------------------------------------------------------
   3-ON-6 (Google Search) — "the same structure as the All-on-X landing page"
   -------------------------------------------------------------------------- */
const threeOn6 = {
  key: '3-on-6', offer: '3-on-6 dental implants', landing: '3-on-6', consultation: '3-on-6-consultation', thankYou: 'thank-you-3-on-6',
  formSnippet: '',
  image: '/media/img/michael-before-after.jpg',
  interests: ['3-on-6 bridges', 'A fixed full arch', 'A second opinion', 'IV sedation', 'Not sure yet'],
  disclaimer: DISCLAIMER,
  seo: {
    landing: { title: '3-on-6 Dental Implants in Los Angeles | West LA Implants', description: '3-on-6 at West LA Implants: three bridges on six implants, with no denture plate. Planned from a 3D scan and placed with Yomi® robotic guidance by Dr. Tony Barriere.' },
    consultation: { title: 'Book a 3-on-6 Consultation in Los Angeles | West LA Implants', description: 'Request a 3-on-6 consultation with Dr. Tony Barriere: a 3D scan, an honest read on candidacy, and a written plan with insurance and financing worked out.' },
    thankYou: { title: 'Thank You: 3-on-6 Consultation Request | West LA Implants', description: 'Your 3-on-6 consultation request has reached West LA Implants. The front desk replies within one business day, or call us now.' },
  },
  hero: {
    kicker: '3-on-6 dental implants · Los Angeles',
    title: 'Three bridges, six implants, <em>your</em> own gumline.',
    lead: 'A 3-on-6 replaces a full arch of teeth with three separate bridges on six implants. There is no denture plate and no acrylic gum: the teeth meet your own gums.',
    checks: ['Planned from a 3D scan, placed with Yomi® robotic guidance', 'IV, oral or nitrous sedation, chosen with you', 'One surgeon plans, places and restores'],
    review: REVIEWS.mike,
  },
  journey: {
    patient: 'michael', ba: CASES.michael, treatment: 'Full mouth reconstruction on implants, top and bottom',
    title: 'Michael heard five plans. One made <em>sense.</em>',
    lead: 'He had lost many teeth and his bite had collapsed. This is his story, in his words. His was a full mouth reconstruction on implants; the plan for yours is read from your scan.',
    portrait: I('michael-before-after.jpg'),
    before: ['Many teeth lost, and a collapsed bite', 'Five consultations, five different plans', 'A different dentist proposed for every stage', 'A smile that did not match his personality'],
    after: ['One surgeon, one chair, one plan', 'Comfortable through a long surgery', 'Went home smiling the same day', 'Final teeth fitted, top and bottom'],
    beats: [
      { label: 'The search', quote: 'Different doctors gave me different treatment plans and opinions.', who: 'Michael' },
      { label: 'The plan', quote: 'Dr. B was the first person to say, ‘I’m going to do everything. We’re going to do it all in this chair.’', who: 'Michael' },
      { label: 'The day', quote: 'They made sure that I was comfortable in the whole thing.', who: 'Michael' },
      { label: 'After', quote: 'I remember just tearing up and saying, ‘Wow, I have teeth again.’', who: 'Michael' },
    ],
  },
  why: {
    title: 'Why patients drive <em>past</em> other offices.',
    lead: '“Doctor Barriere was the first doctor that I met who actually had a game plan.” Michael, a patient, on film.',
    image: I('doctor-patient-2.jpg', 'Dr. Barriere showing Michael a model of his new teeth', '40% 40%'),
    reasons: [
      { title: 'One surgeon for the whole case', text: 'No relay between offices. Dr. Barriere plans the case, places the implants and fits the bridges himself.' },
      { title: 'A plan you can see', text: 'A cone-beam CT scan comes first, and the plan is drawn on it in front of you. Implants are placed with Yomi® robotic guidance or a printed guide.' },
      { title: 'Scan, surgery and lab together', text: 'Diagnostics, the surgical suite and the in-house lab share one floor on Wilshire.' },
      { title: 'An honest read on candidacy', text: 'A 3-on-6 needs enough bone and healthy gums. If it is not the right fit he will say so, and explain what is. A second opinion is free.' },
    ],
  },
  films: FILMS_BEAT,
  doctor: {
    title: 'Trained as a <em>surgeon</em>, still training.',
    lead: '“He is very careful with his implant technique.” Mike Hascats, Google review.',
    body: DOCTOR_BODY, list: DOCTOR_LIST,
    photos: [I('doctor-headshot-2.jpg', 'Dr. Tony Barriere, DDS', '70% 30%'), I('still-yomi-closeup.jpg'), I('barriere_dentalpractice_dentalimplant_westla4.jpg', 'Dr. Barriere treating a patient')],
  },
  options: {
    title: 'Three ways to replace a full <em>arch.</em>',
    intro: 'Dr. Barriere offers each of these and will say plainly which one fits your bone, your gums and your budget.',
    columns: [
      { title: 'Implant-supported denture', sub: 'Removable or fixed', rows: ['What it is: a denture secured by two or more implants', 'Treatment time: fewer implants and a shorter surgery', 'Ideal if: you want stability at a lower cost', 'Cost moves with: implant count and the denture material'] },
      { title: 'Fixed full arch', sub: 'One bridge, four to six implants', rows: ['What it is: one fixed bridge for the whole arch', 'Treatment time: temporary teeth the day of surgery in most cases', 'Ideal if: more bone or gum has been lost', 'Cost moves with: implant count, grafting and materials'] },
      { title: '3-on-6', sub: 'Three bridges, six implants', hot: true, rows: ['What it is: three separate bridges on six implants, with no denture plate', 'Treatment time: set at your consultation; implants need months to fuse before the final bridges', 'Ideal if: your gums and bone are healthy enough to frame the teeth', 'Cost moves with: six implants, three bridges and any grafting'] },
    ],
    note: 'Which option fits is decided from your scan. The practice quotes after it, because implant count, grafting and materials change the number.',
  },
  method: {
    title: 'Three stages, one <em>surgeon.</em>',
    intro: 'Planned from a 3D scan, placed along the plan, restored in the same suite.',
    steps: [
      { title: 'Consultation and 3D scan', text: 'A cone-beam CT scan of your mouth and jaw shows whether there is bone for six implants and healthy gum to frame three bridges. The plan is built from it.' },
      { title: 'The day of surgery', text: 'Under IV, oral or nitrous sedation, any failing teeth are removed and six implants are placed along the plan with Yomi® robotic guidance.' },
      { title: 'Your final bridges', text: 'Once the implants have fused with the bone, three bridges are fitted and checked for bite and comfort. You brush them, and floss between them.' },
    ],
    image: I('doctor-explaining.jpg'),
  },
  results: {
    title: 'Before and <em>after.</em>',
    lead: 'Drag the handle, or hover, to compare. Each case is a patient of this practice.',
    pairs: [CASES.michael, CASES.leslie, CASES.emily, CASES.c2, CASES.c3, CASES.c6],
    note: 'Photographs are of West LA Implants patients. Results vary.',
  },
  rooms: { title: 'A space designed for your <em>comfort.</em>', cards: ROOMS('waiting-room.jpg', 'The waiting room at West LA Implants') },
  questions: {
    title: 'Everything patients ask before <em>booking.</em>',
    items: [
      { q: 'What is a 3-on-6?', a: 'A way to replace a full arch of teeth with three separate bridges carried by six implants. There is no denture plate and no acrylic gum: the bridges meet your own gums.' },
      { q: 'How is it different from All-on-4?', a: 'All-on-4® carries one bridge for the whole arch on four implants. A 3-on-6 uses six implants and three bridges. Which one suits you depends on how much bone and gum you have, and that is read from your scan.' },
      Q.pain,
      { q: 'What if I have been told I do not have enough bone?', a: 'Where bone is missing it can be rebuilt with grafting or a sinus lift, in the same suite. If a 3-on-6 is not the right fit, Dr. Barriere will say so and explain what is. A second opinion is free.' },
      Q.cost, Q.finance,
    ],
  },
  final: { title: 'Find out if a 3-on-6 <em>fits.</em>', lead: 'A consultation covers candidacy, options, sedation, financing and timing. No pressure, no surprises.', image: '/media/img/doctor-handshake.jpg' },
  consult: {
    kicker: '3-on-6 consultation · West LA Implants',
    title: 'Book your <em>consultation.</em>',
    lead: 'Leave your details and the front desk calls to find a time. At the visit Dr. Barriere scans, reads the scan with you, and tells you plainly whether a 3-on-6 fits.',
    covers: ['A cone-beam CT scan of your mouth and jaw', 'An honest read on candidacy: bone, gums and bite', 'A written plan, with insurance and financing worked out'],
    review: REVIEWS.peter,
    proofTitle: 'One dentist, <em>start</em> to finish.',
    proofLead: 'Dr. Barriere plans, places and restores every implant himself, in one office on Wilshire.',
    proofImage: I('still-doctor-masked.jpg'),
    reviews: LONG_REVIEWS,
  },
  thanks: {
    kicker: '3-on-6 consultation · request received',
    title: 'Your 3-on-6 consultation request is <em>in.</em>',
    lead: 'Thank you. Your request for a 3-on-6 consultation with Dr. Barriere is with the front desk, and we reply within one business day. If you would rather not wait, call now and we will find a time together.',
    note: 'Our phones are answered Monday to Friday, 9am to 5pm.',
    review: REVIEWS.annie,
    image: I('front-desk-emily.jpg', A, '30% 50%'), /* 2000px; the 800px receptionist read soft (review 2026-10-06) */
    expect: TY_EXPECT,
    why: TY_WHY([['tonybarrerie_headshot_dentist_westlaimplants1.jpg', 'Dr. Tony Barriere, DDS', '60% 30%'], ['still-doctor-patient-hug.jpg'], ['patient-paying.jpg', 'A patient paying for treatment by card']]),
    questions: { title: 'Before you <em>call.</em>', items: [{ q: 'What is a 3-on-6?', a: 'Three separate bridges carried by six implants, replacing a full arch of teeth with no denture plate.' }, Q.pain, Q.cost, Q.finance] },
    cta: { tag: 'Ready when you are', title: 'Ready to take the next <em>step?</em>', lead: 'Call us, or come and see us on Wilshire.', image: '/media/img/still-reception-neon.jpg' },
  },
}

export const CAMPAIGNS = [allOn6, threeOn6]
export default CAMPAIGNS.flatMap(combo)
