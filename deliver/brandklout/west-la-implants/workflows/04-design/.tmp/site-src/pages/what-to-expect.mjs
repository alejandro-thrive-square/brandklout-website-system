export default {
  slug: 'what-to-expect',
  title: 'Your First Visit & Post-Operative Instructions | West LA Implants, Los Angeles',
  description: 'What happens at your first visit to West LA Implants, how the implant process runs from consultation to final teeth, and the practice’s post-operative guidelines for extractions, sinus lifts and implants.',
  image: '/media/img/front-desk-leslie.jpg',
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Your first visit · Los Angeles',
      title: 'Know what happens <em>before</em> it happens.',
      lead: 'The first visit, the implant process, and the instructions you will be handed after surgery, all written down here so nothing is a surprise.',
      image: { src: '/media/img/front-desk-leslie.jpg', pos: '90% 50%', alt: 'Leslie welcomed at the front desk' },
      actions: [{ href: '#invitation', label: 'Book a First Visit' }, { href: '#instructions', label: 'Post-operative guidelines', kind: 'text' }],
      meta: [
        { b: '1 hour', span: 'Your first exam' },
        { b: 'Forms', span: 'At the desk, or sent ahead' },
        { b: '24 hours', span: 'Notice if you must cancel' },
        { b: 'After hours', span: 'Surgical patients called back' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/still-front-desk-handshake.jpg' },
      text: 'Fear is mostly not knowing. A visit that has been explained in full is already half as frightening.',
      after: ['Everything below is what the front desk and Dr. Barriere will also tell you in person. Read it, then ask about whatever is still unclear.'],
    },
    {
      type: 'steps', name: 'The First Visit', tag: 'The First Visit', title: 'Your first <em>hour.</em>',
      steps: [
        { title: 'Walking in', text: 'The front desk greets you and gives you the new-patient paperwork: a health questionnaire, your insurance information and contact details. Ask and the forms are sent ahead so you can fill them in at home.' },
        { title: 'The examination', text: 'About an hour. The team asks about your routine and your concerns, takes digital X-rays and, for implant cases, a 3D cone-beam scan, and looks at every tooth with the intraoral camera.' },
        { title: 'The cleaning and the read', text: 'The hygienist cleans your teeth, then Dr. Barriere completes the exam and gives his recommendations. Smile simulation shows your after for implants, veneers or Invisalign®.' },
        { title: 'The plan', text: 'A written treatment plan, a quote, and the financing worked out with the front desk. Same-day crowns and emergency visits mean many things are handled on the spot.' },
      ],
      image: { src: '/media/img/cbct-emily.jpg', alt: 'Emily at the CBCT scanner' },
    },
    {
      type: 'ledger', name: 'The Implant Path', tag: 'The Implant Path', title: 'The implant process, in <em>five</em> steps.',
      lead: 'Even if other dentists have said you do not qualify, Dr. Barriere may be able to help. The second opinion is free.',
      figure: { value: 5, label: 'steps from scan to smile' },
      items: [
        { b: 'Meet the team', span: 'A team that places hundreds of implants a year and treats you like family from the first visit.' },
        { b: 'Plan your smile', span: 'Intraoral scans and a CBCT build a precise roadmap; smile simulation shares it with you, and you can change it.' },
        { b: 'A custom treatment plan', span: 'No cookie-cutter treatment. You take an active role and choose what works for you.' },
        { b: 'Cost and payment', span: 'In-house savings plan, third-party financing and most PPO plans, so cost is not the barrier.' },
        { b: 'Receiving your implants', span: 'Yomi® robotic guidance, IV, oral or nitrous sedation, and temporary teeth the same day where the case allows.' },
      ],
    },
    {
      type: 'tabs', name: 'The Instructions', tag: 'The Instructions', id: 'instructions', title: 'After <em>surgery.</em>',
      lead: 'The practice’s own post-operative guidelines, as handed to patients. If anything is unusual, call the office: (310) 481-0111. After hours and weekends, someone calls back as soon as possible.',
      panels: [
        {
          label: 'Tooth extraction', title: 'After a tooth extraction',
          sections: [
            { h: 'Day one', text: ['Keep biting on the gauze for 30 to 60 minutes. Do not spit, rinse, use a straw, smoke, or drink carbonated or alcoholic beverages for at least 24 hours. Empty your mouth passively. The goal is to keep the clot in the socket and avoid the painful complication known as dry socket.'] },
            { h: 'Day two', text: ['Expect one or more of: minor pain, swelling, bruising, limited opening, pain in the jaw or ear, a sore throat. Listen to your body and take it easy. No heavy lifting, spitting, sucking, alcohol or smoking.'] },
            { h: 'Oral hygiene', text: ['Brush gently. A lukewarm salt water rinse freshens the mouth, but do not spit; let it empty passively. The corners of the mouth may crack and dry; moisturise often.'] },
            { h: 'Discomfort and swelling', text: ['Over-the-counter medication (ibuprofen, naproxen or acetaminophen) as directed on the bottle. Cold compresses in ten-minute intervals for the first 24 hours. Swelling usually starts to go down within 72 hours; call if it does not change.'] },
            { h: 'Bleeding', text: ['Some oozing is normal for the first 12 to 24 hours; put a hand towel on your pillow. For heavier bleeding, apply firm pressure with one or two folded gauze pads or a damp tea bag for 30 to 60 minutes and keep your head elevated. Call if it does not subside.'] },
            { h: 'Diet', text: ['Plenty of fluids, no carbonated or alcoholic drinks. Soft foods: yogurt, milkshakes without a straw, soups, fish, pasta. Nothing too spicy. Some tenderness when chewing and difficulty opening wide is normal.'] },
            { h: 'Stitches and prescriptions', text: ['Leave sutures alone; they are removed at a fifteen-minute visit in 7 to 10 days. Finish any antibiotics even if symptoms fade; some antibiotics reduce the effectiveness of birth control pills and other medications. Take any prescribed pain medication or rinse as directed.'] },
          ],
        },
        {
          label: 'Dental implants', title: 'After implant surgery',
          sections: [
            { h: 'Activity', text: ['Reduce activity. No running, weight lifting, strenuous aerobic activity or contact sports for 48 hours. Avoid exercises that put your head below your heart, such as Pilates or yoga.'] },
            { h: 'Care of your mouth', text: ['Immediately after surgery, keep ice-cold water in your mouth or cold foods such as ice cream or low-fat yogurt for 6 to 8 hours, as continuously as possible, letting them defrost in the mouth to cool the surgical site. An external ice pack is of little value. Clean the teeth that did not have surgery as normal. Try not to play with the top covers over the implants.'] },
            { h: 'Discomfort', text: ['Some discomfort is expected after any surgery. Take prescribed pain medication as directed, with milk and food if nausea develops. Do not drink alcohol with pain medication.'] },
            { h: 'Swelling', text: ['Anti-inflammatory medication is generally prescribed for 3 to 4 days. Cold liquids for 6 to 8 hours after surgery and for the rest of that day are essential; after 24 hours any temperature is fine. Do not apply heat for 72 hours.'] },
            { h: 'Bleeding', text: ['A small amount is expected. No spitting, rinsing or sucking through a straw. Biting on the gauze provided, soaked in cold water, prevents bleeding.'] },
            { h: 'Eating and dentures', text: ['Cold, soft, mainly liquid foods for 3 to 4 days; nothing hard, chewy, crunchy or spicy. Do not wear dentures for the first two weeks, or until the doctor says so.'] },
            { h: 'Antibiotics and smoking', text: ['Finish prescribed antibiotics; call if an allergic reaction or nausea develops. Do not smoke; it seriously irritates and delays healing.'] },
          ],
        },
        {
          label: 'Sinus lift', title: 'After a sinus lift or augmentation',
          sections: [
            { h: 'Activity', text: ['Reduce activity. No running, weight lifting, strenuous aerobic activity or contact sports for 48 hours; no exercises with the head below the heart. Do not take airplane flights for 10 days.'] },
            { h: 'Care of your mouth and nose', text: ['Ice-cold water or cold foods in the mouth for 6 to 8 hours after surgery, as continuously as possible; a gentle external ice pack may help. Clean the teeth that did not have surgery. Try not to sneeze, cough hard or blow your nose; any of these can disturb the graft.'] },
            { h: 'Discomfort and swelling', text: ['Prescribed pain medication as directed, with milk and food if nauseous, never with alcohol. Anti-inflammatories for 3 to 4 days. Cold liquids for the rest of the day of surgery; no heat for 72 hours. An external ice pack in cycles of 15 minutes on, 15 off.'] },
            { h: 'Bleeding', text: ['A small amount is expected, and you may have nosebleeds. No spitting, rinsing or sucking; bite on the cold-soaked gauze provided. Do not blow your nose.'] },
            { h: 'Eating and dentures', text: ['Cold, soft, mainly liquid foods for 3 to 4 days; nothing hard, chewy, crunchy or spicy. No dentures for the first two weeks, or until the doctor says so.'] },
            { h: 'Nose sprays, antibiotics, smoking', text: ['For congestion use a decongestant spray such as Afrin, but do not clear the nose by blowing; a cotton swab if needed. Saline spray keeps a dry nose moist. Finish antibiotics; call about any reaction. Do not smoke.'] },
          ],
        },
      ],
      note: 'These are general guidelines. Your own instructions from Dr. Barriere take precedence.',
    },
    {
      type: 'faq', name: 'The Questions', title: 'First-visit <em>questions.</em>',
      items: [
        { q: 'How do I make an appointment?', a: 'Call (310) 692-9316 if you are a new patient, book a time on Zocdoc, or send the form below. Current patients call (310) 481-0111.' },
        { q: 'What if I need to cancel?', a: 'Please call at least 24 hours ahead so the time can be offered to someone else.' },
        { q: 'What should I bring?', a: 'Your insurance card, a list of medications, and any recent X-rays or scans from another office. If you have been quoted elsewhere, bring the plan; the second opinion is free.' },
        { q: 'How is pain handled?', a: 'Dr. Barriere discusses your pain tolerance and makes a plan before any procedure: local anaesthetic, nitrous, oral or IV sedation as needed.' },
      ],
    },
    {
      type: 'invite', name: 'Invitation', title: 'You are <em>welcome</em> here.', lead: 'Schedule your new-patient appointment. The forms can be sent ahead.',
      formTitle: 'Book a first visit',
      interests: ['A first visit', 'Dental implants', 'A second opinion', 'A toothache or emergency', 'Not sure yet'],
      next: [
        { href: '/our-practice.html', label: 'The practice', text: 'The rooms, the team, the comforts.' },
        { href: '/financing.html', label: 'Financing', text: 'Insurance, six lenders, a savings plan.' },
        { href: '/faq.html', label: 'Questions', text: 'The long list, by topic.' },
      ],
    },
  ],
}
