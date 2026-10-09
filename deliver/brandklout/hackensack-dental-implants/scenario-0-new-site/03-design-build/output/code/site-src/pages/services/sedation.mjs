/* /services/sedation. Copy: the live page (scrape/pages/services-sedation.md; the bold-led anxiety
   list, the three sedation types and the before / after lists checked in
   mirror/raw-html/services/sedation.html), placed and folded, not rewritten.
   Left out: the bare "Schedule Your Consultation", "Book A Consultation" and "Request an appointment"
   buttons, "Key Features:" and the address / hours / languages footer. The live page has no
   "Experience Exceptional Dental Care" paragraph, so the consultation chapter carries no text.
   "Smile Now, Pay Later" is LENDER_COPY (word for word the same as this page). "Why Choose Hackensack
   Center for Sedation Dentistry" is this page's own text, not MESKIN, so the specialist chapter carries
   it: the intro line as the lead and the three titled notes as its list.
   Structure restored: the four anxiety lines are a bold title, an en dash and a sentence on the live page
   ("It Quiets the Fear – Anxiety before..."); the title becomes the row heading and the dash goes. The
   trailing colon of "Before the Appointment:" / "After the Appointment:" and the trailing full stop of
   the three "Why Choose" titles go, as they are now headings.
   Left as the live page has it: "Care in Multi-Languages." reads "in English, and Spanish" with no full
   stop, while the specialist bio elsewhere says English, Spanish, and Russian.
   No fact changes: the page names no other practice and no second number. */
import { page, hero, statement, index, cards, path, checks, features, specialist, financing, faq, consult, p, ul } from '../../lib/ui.mjs';
import { LENDER_COPY } from '../_shared.mjs';

const crumbs = [['/services', 'Implant Solutions'], ['/services/sedation', 'Sedation Dentistry']];

export default page({
  path: '/services/sedation',
  crumbs,
  seo: {
    title: 'Sedation Dentistry in Hackensack, NJ | Hackensack Center',
    description: 'Sedation dentistry in Hackensack, NJ at Hackensack Center for Dental Implants. Comfortable implant treatment with Dr. Alan Meskin.',
    image: 'sedation-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'Comfort Options',
      title: 'Sedation Dentistry in Hackensack, NJ',
      lead: 'For patients who have put off dental care because of fear, sensitivity, or a rough experience in the past. Comfortable, monitored sedation, so treatment finally feels manageable.',
      image: { src: 'sedation-hero.webp', w: 1080, h: 1080, alt: 'A treatment room with two orange dental chairs and a screen on the wall' },
    }),
    statement({
      tagline: 'The Treatment',
      title: 'What Is Sedation Dentistry?',
      lead: 'Sedation dentistry helps you feel calm, relaxed, and at ease during dental procedures. It uses medication to reduce anxiety and sensitivity, so the appointment feels manageable rather than overwhelming.',
      body: p(
        'Depending on the level chosen, you may stay fully awake and simply feel relaxed, drift into a semi-conscious "twilight" state, or sleep through the whole procedure entirely.',
        'What sedation is not is a shortcut. It is not a replacement for careful, gentle care, and it does not skip any part of the treatment. What it does is take the fear, the tension, and often the memory of the difficult parts out of the experience, so you can get the care you need without dread.',
        'At Hackensack Center, sedation is available for anyone who wants it. For some patients, it is what finally makes long-avoided care possible.',
      ),
      image: { src: 'sedation-statement.webp', w: 1000, h: 900, alt: 'A vital-signs monitor beside the chair in a treatment room' },
    }),
    index({
      name: 'How It Helps',
      tagline: 'Dental Anxiety',
      title: 'What Dental Anxiety Feels Like, and How Sedation Helps',
      intro: p('Dental anxiety is common, and there is no reason to be embarrassed by it. For a lot of our patients, the fear is the hardest part of coming in, and sedation is what finally makes it possible. Here is how it changes the experience.'),
      items: [
        { title: 'It Quiets the Fear', body: p('Anxiety before an appointment can be worse than the appointment itself. Sedation calms the nervous system, so you arrive and stay relaxed rather than tense.') },
        { title: 'It Takes Out the Memory', body: p('The medications we use produce a mild amnesic effect, so much of the procedure simply feels like a hazy blur afterward. For many patients, that alone changes everything.') },
        { title: 'It Helps Where Numbing Struggles', body: p('Some patients are difficult to fully numb, or feel every sensation despite local anesthetic. Sedation adds a second layer of comfort, so treatment is truly painless.') },
        { title: 'It Lets Us Do More in One Visit', body: p('Because you are relaxed for the full appointment, we can complete more treatment at once rather than breaking it into short visits. Fewer appointments, faster progress.') },
      ],
    }),
    cards({
      name: 'The Options',
      tagline: 'Levels of Sedation',
      title: 'Types of Sedation We Offer',
      items: [
        { title: 'Oral Conscious Sedation', text: p('The mildest option. You take a prescription sedative pill before your appointment, often one the night before to help you sleep and another the morning of. You stay awake and responsive, but deeply relaxed throughout the procedure. Well-suited to shorter appointments and moderate anxiety.') },
        { title: 'IV Sedation', text: p('A stronger, more precise level of sedation delivered intravenously. It places you in a semi-conscious "twilight" state, so you are unaware of the procedure and often will not remember it afterward. IV sedation also reduces post-operative swelling and discomfort, which makes it a good fit for implant surgery and longer visits.') },
        { title: 'General Anesthesia', text: p('The deepest level of sedation, administered by a specially trained dental anesthesiologist. You are fully asleep throughout the procedure and wake up with the treatment complete. General anesthesia is typically used for the most complex or full-arch cases, and for patients who prefer to be entirely unconscious for their care.') },
      ],
    }),
    path({
      tagline: 'Your Appointment',
      title: 'How Your Sedation Appointment Works',
      intro: p('Sedation is planned carefully in advance, so nothing about the appointment feels rushed or uncertain.'),
      steps: [
        { title: 'Pre-Sedation Consultation', body: p('Before we sedate you for anything, Dr. Meskin reviews your health history, current medications, and allergies to confirm which sedation level is right for you. Some medical conditions may require clearance from your physician, and we will let you know if that applies.') },
        { title: 'Pre-Appointment Instructions', body: p('You receive clear, specific instructions covering fasting, medications, clothing, and transportation. Following these correctly is what makes the sedation both safe and comfortable, so we walk through them with you.') },
        { title: 'Sedation Administration', body: p('On the day of the procedure, sedation is administered by Dr. Meskin or, for general anesthesia and IV sedation, by our dental anesthesiologist. You are then eased into a calm, comfortable state before treatment begins.') },
        { title: 'Monitored Treatment', body: p('Throughout the procedure, your vital signs are monitored continuously by trained staff. This is the standard for any level of sedation above oral, and it is how we keep the experience safe as well as comfortable.') },
        { title: 'Recovery and Discharge', body: p('After treatment, you rest in our recovery area until you are fully alert and stable. You will need a responsible adult to drive you home and stay with you for a few hours, since the effects of sedation can linger for the rest of the day.') },
      ],
    }),
    checks({
      name: 'Who It Is For',
      tagline: 'Who It Is For',
      title: 'Who Might Benefit From Sedation Dentistry',
      intro: p('Sedation dentistry is not just for people with severe phobia. It is for anyone who wants the experience of dental care to feel easier, and it is an especially good fit if any of the following apply:'),
      items: [
        'Fear or phobia of dental procedures',
        'Difficulty getting fully numb with local anesthetic',
        'A strong gag reflex',
        'Sensitive teeth or sensitive oral nerves',
        'A history of a difficult past dental experience',
        'Complex or lengthy treatment ahead of you',
        'Full-arch implant surgery or other significant procedures',
        'Discomfort holding your mouth open for long periods',
      ],
      image: { src: 'sedation-benefit.webp', w: 1100, h: 900, alt: 'A patient reclined in a treatment chair, talking with a dentist' },
      after: p('If any of these apply, ask about sedation at your consultation. Dr. Meskin will help you choose the level that fits your treatment and how you want to feel.'),
    }),
    features({
      name: 'Before and After',
      tagline: 'Instructions',
      title: 'Before and After Your Sedation Appointment',
      items: [
        {
          title: 'Before the Appointment',
          text: ul([
            'Avoid eating or drinking for 10 hours before your appointment',
            'Take your normal medications with a sip of water, unless we instruct you otherwise',
            'Do not smoke for 24 hours before your procedure',
            'Wear comfortable, loose clothing',
            'Remove jewelry, nail polish, and contact lenses',
            'Brush your teeth as normal',
            'Arrange for a responsible adult to drive you home',
          ]),
        },
        {
          title: 'After the Appointment',
          text: ul([
            'Rest for the remainder of the day',
            'Do not drive, operate machinery, or return to work',
            'Avoid alcohol for at least 24 hours',
            'Take any prescribed medications exactly as directed',
            'Stick to soft foods and cool liquids at first',
            'Have your companion stay with you for a few hours',
            'Call us if anything feels wrong or unexpected',
          ]),
        },
      ],
    }),
    specialist({
      tagline: 'Why Choose Us',
      title: 'Why Choose Hackensack Center for Sedation Dentistry',
      lead: 'Specialist-led sedation care designed to make every visit feel calm, comfortable, and manageable.',
      credentials: [
        ['Prosthodontist-Led Care', "Complex and full-arch cases, where sedation is often needed, are Dr. Meskin's daily work as an NYU-trained prosthodontist."],
        ['Comfort-First Environment', 'A calm, judgment-free practice, designed around anxious patients, with sedation as one of several tools to make care feel manageable.'],
        ['Care in Multi-Languages', 'Clear communication before, during, and after sedation, in English, and Spanish'],
      ],
    }),
    financing({
      title: 'Smile Now, Pay Later',
      lenders: LENDER_COPY,
      action: { label: 'Request An Appointment', href: '#consultation' },
    }),
    faq({
      items: [
        ['Is sedation dentistry safe?', 'Yes, when it is properly planned and administered. Before any sedation, we review your health history, current medications, and allergies to confirm you are a good candidate. Your vital signs are monitored throughout the procedure. General anesthesia and IV sedation are handled by a dental anesthesiologist trained specifically for these levels of sedation.'],
        ['Will I be asleep the whole time?', 'It depends on the level. Oral sedation keeps you relaxed but awake. IV sedation puts you in a "twilight" state where you may drift in and out but usually will not remember the procedure. General anesthesia puts you fully asleep. Dr. Meskin will help you choose the level that fits.'],
        ['Will I feel any pain?', 'No. Sedation is used alongside local anesthetic, so the treatment area is fully numb regardless of the sedation level. Patients typically describe the experience as calm and pain-free, and often say the memory of it is hazy or absent.'],
        ['How long does the sedation last?', 'It depends on the level. Oral sedation can leave you drowsy for several hours. IV sedation and general anesthesia typically wear off within a few hours, but you should plan to rest for the remainder of the day and avoid driving or making important decisions until the next morning.'],
        ['Do I need someone to drive me home?', 'Yes, for any sedation level beyond very light oral sedation. You will not be permitted to drive yourself, and we ask that a responsible adult stay with you for at least a few hours after your appointment.'],
        ['Can I eat before my appointment?', 'No, not for most sedation levels. You will need to avoid eating and drinking for 10 hours before your appointment. We will send you complete pre-appointment instructions so nothing is unclear.'],
        ['How much does sedation cost?', 'It depends on the level and the length of your procedure. We will include sedation in your written treatment estimate up front, so there are no surprises. Financing options are available if cost is a concern.'],
        ['Is sedation covered by insurance?', 'Sometimes, particularly when sedation is medically necessary for a specific procedure. Our team will verify your insurance benefits before treatment and let you know what may be covered.'],
      ],
    }),
    consult({}),
  ],
});
