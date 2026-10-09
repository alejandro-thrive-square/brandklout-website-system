export default {
  slug: 'financing',
  title: 'Insurance & Financing for Dental Implants in Los Angeles | West LA Implants',
  description: 'How patients pay at West LA Implants: most PPO dental plans in network, six financing partners with monthly payments, and the West LA Implants Dental Savings Plan for patients without insurance.',
  image: '/media/img/patient-paying.jpg',
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Insurance & financing · Los Angeles',
      title: 'Cost should not decide your <em>health.</em>',
      lead: 'Cash, card or check. Most PPO plans. Six financing partners. A savings plan for patients without insurance. There is almost always a way.',
      image: { src: '/media/img/doctor-handshake.jpg', pos: '40% 40%', alt: 'Dr. Barriere greeting a patient' }, // BugHerd #77
      actions: [{ href: '#invitation', label: 'Ask About Financing' }, { href: '/implant-cost.html', label: 'What decides the cost', kind: 'text' }],
      meta: [
        { b: 'PPO', span: 'Most carriers, in network' },
        { b: 'Six', span: 'Financing partners' },
        { b: 'Savings plan', span: 'Two tiers, no insurance needed' },
        { b: 'Claims', span: 'Filed for you' },
      ],
    },
    {
      type: 'ledger', name: 'The Partners', tag: 'The Partners', title: 'Six lenders, one <em>application</em> each.', // BugHerd #78: moved up to sit right after the cover
      lead: 'Each applies in minutes, most from your phone. Ask the front desk which suits your situation.',
      figure: { value: 6, label: 'financing partners' },
      items: [
        { b: 'Lending Club', span: 'Rates, terms and payments you choose; apply from your phone. lendingclub.com, 800-630-1663.' },
        { b: 'CareCredit®', span: 'Flexible monthly payments for treatment. carecredit.com, 800-677-0718.' },
        { b: 'Proceed Finance', span: 'No-collateral loans up to $60,000 with terms up to 96 months. proceedfinance.com, 844-272-7587.' },
        { b: 'Alphaeon Credit', span: 'Special financing over $250 and credit lines up to $25,000. goalphaeon.com.' },
        { b: 'Cherry', span: 'Split the cost into monthly payments with no hard credit check. pay.withcherry.com.' },
        { b: 'Sunbit', span: 'Most applicants approved, fair rates, no late or penalty fees. sunbit.com.' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/front-desk-emily.jpg' },
      text: 'Better oral health improves medical health, mental health and the plain quality of a day. Finances should not stand between you and that.',
      after: ['The front desk checks your benefits before the consultation, files your claim afterwards, and walks you through the financing that fits.'],
    },
    {
      type: 'compare', name: 'The Savings Plan', tag: 'The Savings Plan', title: 'No insurance? The <em>in-house</em> plan.',
      intro: 'The West LA Implants Dental Savings Plan, for adults 18 and over. No waiting periods, no deductibles, no maximums.',
      columns: [
        { title: 'Executive plan', sub: '$400 a year, adults', hot: true, rows: ['$300 off Invisalign®', '20% off the dental services list (orthodontics excluded)', 'New-patient exam and X-rays', 'Two periodic exams, two cleanings, two fluoride treatments', 'Oral cancer screening, two emergency visits', 'Perio maintenance $150, discount excluded'] },
        { title: 'Premier plan', sub: '$300 a year, adults', rows: ['$150 off Invisalign®', '10% off the dental services list (orthodontics excluded)', 'Two regular cleanings', 'Perio maintenance $150, discount excluded'] },
        { title: 'Also accepted', sub: 'Every day', rows: ['Cash, check and major credit cards', 'Most PPO dental plans: United, Concordia, Principal, GIHA, Emeritus, Guardian', 'Claims filed on your behalf', 'Third-party financing above'] },
      ],
      note: 'Plan terms: cannot be combined with insurance or outside financing; the fee is a discount on the listed services, not insurance; unused services do not roll over or transfer; the plan runs one year from purchase and is non-refundable.',
    },
    {
      type: 'strip', name: 'The Promise', tag: 'The Promise', title: 'Care you can <em>afford,</em> and a warranty behind it.',
      lead: 'Every implant the practice places carries a one-year warranty on the materials, covered in full.',
      body: [
        'Ask the front desk to run your benefits before your visit. If a treatment plan needs financing, they will help you apply on the spot.',
      ],
      list: [
        { b: 'Benefits check', span: 'Before the consultation' },
        { b: 'Claims filed', span: 'By the practice, for you' },
        { b: 'Apply on the spot', span: 'Any of six lenders' },
        { b: 'One-year warranty', span: 'On every implant' },
      ],
      actions: [{ href: '/implant-cost.html', label: 'What decides the cost', kind: 'text' }],
      photos: [
        { src: '/media/img/front-desk-leslie.jpg', pos: '50% 40%', alt: 'Leslie welcomed at the front desk' }, // BugHerd #79
        { src: '/media/img/front-desk-receptionist.jpg', alt: 'The front desk at West LA Implants' },
        { src: '/media/img/doctor-patient-2.jpg', pos: '60% 40%', alt: 'Dr. Barriere with a patient' },
      ],
    },
    {
      type: 'faq', name: 'The Questions', title: 'Payment <em>questions.</em>',
      items: [
        { q: 'Which insurance do you accept?', a: 'The practice is in network with most PPO dental carriers, including United, Concordia, Principal, GIHA, Emeritus and Guardian, and files claims on your behalf. HMO plans are not accepted.' },
        { q: 'Can I use the savings plan with my insurance?', a: 'No. The savings plan is for patients without dental insurance and cannot be combined with insurance or with outside financing.' },
        { q: 'Can I finance a full arch?', a: 'Yes. Proceed Finance goes up to $60,000 over up to 96 months, and the other five partners cover a wide range of amounts and credit situations.' },
        { q: 'Do you offer in-house payment plans?', a: 'The savings plan discounts fees; the monthly-payment options run through the six partners. The front desk will help you choose and apply.' },
      ],
    },
    {
      type: 'invite', name: 'Invitation', title: 'Let the front desk do the <em>maths.</em>', lead: 'A benefits check, the financing that fits, and a written plan.',
      interests: ['Financing questions', 'Insurance questions', 'The savings plan', 'A quote for implants', 'Not sure yet'],
      next: [
        { href: '/implant-cost.html', label: 'Implant cost', text: 'The six factors in every quote.' },
        { href: '/dental-implants.html', label: 'Dental implants', text: 'How the treatment works.' },
        { href: '/what-to-expect.html', label: 'Your first visit', text: 'What happens at the consultation.' },
      ],
    },
  ],
}
