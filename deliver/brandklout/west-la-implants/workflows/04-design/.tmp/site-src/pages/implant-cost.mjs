export default {
  slug: 'implant-cost',
  title: 'Dental Implant Cost in Los Angeles: What Decides It | West LA Implants',
  description: 'What dental implants cost in Los Angeles and why: implant count, grafting, materials and the restoration. West LA Implants quotes after a 3D scan, offers six financing partners, a savings plan, a one-year warranty and free second opinions.',
  image: '/media/img/patient-calculator.jpg',
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Dental implant cost · Los Angeles',
      title: 'An honest answer about <em>cost.</em>',
      lead: 'The price of an implant depends on your mouth, not on a menu. Here is what moves it, how the practice quotes, and how most patients pay.',
      image: { src: '/media/img/front-desk-receptionist.jpg', pos: '20% 40%', alt: 'The front desk at West LA Implants' }, // BugHerd #75
      actions: [{ href: '#invitation', label: 'Request a Quote After a Scan' }, { href: '/financing.html', label: 'Financing options', kind: 'text' }],
      meta: [
        { b: 'After a scan', span: 'Never before' },
        { b: 'Six', span: 'Financing partners' },
        { b: 'One year', span: 'Warranty on materials' },
        { b: 'Free', span: 'Second opinions' },
      ],
    },
    {
      type: 'ledger', name: 'The Factors', tag: 'The Factors', title: 'Six things that move the <em>number.</em>', // BugHerd #76: moved up to sit right after the cover
      lead: 'Every quote is built from these. Ask about each one at your consultation.',
      figure: { value: 6, label: 'factors in every quote' },
      items: [
        { b: 'How many teeth', span: 'One implant, a bridge on two, or a full arch on four or more.' },
        { b: 'How long they have been missing', span: 'Bone recedes over time; more time can mean grafting first.' },
        { b: 'Grafting or a sinus lift', span: 'Rebuilding the foundation is a separate procedure when it is needed.' },
        { b: 'Extractions', span: 'Teeth that must come out before the implant goes in.' },
        { b: 'Materials', span: 'Titanium or zirconia implants; porcelain, acrylic or zirconia teeth.' },
        { b: 'Sedation', span: 'Nitrous, oral or IV, chosen with you.' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/using-laptop.jpg' },
      text: 'Implants cost more up front than a bridge or a denture. They are also the only replacement that does not have to be redone, relined or replaced every few years.',
      after: ['The practice will file your insurance claim, connect you with financing that breaks the fee into monthly payments, and tell you the number after a scan, not a guess before one.'],
    },
    {
      type: 'compare', name: 'The Comparison', tag: 'The Comparison', title: 'Initial cost against <em>lifetime</em> cost.',
      intro: 'For a full arch, three options at three price levels, and what each one gives back.',
      columns: [
        { title: 'Traditional dentures', sub: 'Lowest initial cost', rows: ['Fragile', 'Removed at night', 'About a quarter of natural bite force', 'Needs adhesives, relines and replacements'] },
        { title: 'Implant-supported dentures', sub: 'Medium initial cost', rows: ['Reduces jawbone recession', 'Fully removable', 'Fewer food restrictions', 'More biting and chewing power'], href: '/implant-supported-dentures.html', cta: 'Implant-supported dentures' },
        { title: 'Fixed full arch', sub: 'Highest initial cost', hot: true, rows: ['Custom to your mouth', 'Permanently fixed', 'About 99 percent of bite force restored', 'A lifelong answer to tooth loss'], href: '/all-on-4.html', cta: 'All-on-4® full arch' },
      ],
      note: 'The practice quotes in dollars after your scan. It is not shown here because your number depends on the six factors above, and a menu price would be wrong for most people who read it.',
    },
    {
      type: 'strip', name: 'The Promise', tag: 'The Promise', title: 'Two things the practice puts in <em>writing.</em>',
      lead: 'A one-year warranty on every implant, and a free second opinion on any treatment plan, from anywhere.',
      body: [
        'If an implant material fails within the first year, the practice covers it in full, no questions asked.',
        'If another office has quoted you, or declined you, bring the plan. Dr. Barriere will read it and tell you what he would do differently, at no charge.',
      ],
      list: [
        { b: 'One-year warranty', span: 'Materials covered 100 percent' },
        { b: 'Free second opinion', span: 'On any plan, from any office' },
        { b: 'Claims filed for you', span: 'Most PPO plans in network' },
        { b: 'Monthly payments', span: 'Six lenders, in-house savings plan' },
      ],
      actions: [{ href: '/financing.html', label: 'See the financing options', kind: 'text' }],
      photos: [
        { src: '/media/img/patient-paying.jpg', alt: 'A patient paying for treatment by card' },
        { src: '/media/img/front-desk-emily.jpg', pos: '100% 50%', alt: 'Emily at the front desk discussing insurance' },
        { src: '/media/img/doctor-handshake.jpg', pos: '70% 30%', alt: 'Dr. Barriere greeting a patient' },
      ],
      flip: true,
    },
    {
      type: 'faq', name: 'The Questions', title: 'Cost <em>questions.</em>',
      items: [
        { q: 'Why will you not publish a price?', a: 'Because a price for one tooth in healthy bone says nothing about a full arch with grafting, and most people reading it would be misled in one direction or the other. After a 3D scan the quote is specific to you and it holds.' },
        { q: 'Does insurance cover dental implants?', a: 'Often partly. The practice is in network with most PPO carriers, including United, Concordia, Principal, GIHA, Emeritus and Guardian, and files the claim for you. Coverage varies by plan; the consultation includes a benefits check.' },
        { q: 'What financing is available?', a: 'Lending Club, CareCredit®, Proceed Finance, Alphaeon Credit, Cherry and Sunbit, plus the West LA Implants Dental Savings Plan for patients without insurance. Details on the financing page.' },
        { q: 'Is a cheaper implant elsewhere a bad idea?', a: 'Not always. Ask who plans it, who places it, what guides the placement, what the restoration is made of, and what happens if it fails. The second opinion here is free, so you can compare the plans, not just the prices.' },
        { q: 'What does the warranty cover?', a: 'If a material fails within the first year after your implant, the practice covers it fully. It does not cover damage from trauma or neglect, and it needs you to keep your hygiene visits.' },
      ],
    },
    {
      type: 'invite', name: 'Invitation', title: 'Get the real <em>number.</em>', lead: 'A scan, an honest read, and a written quote with the financing worked out.',
      interests: ['A quote for dental implants', 'All-on-4 / full arch', 'A second opinion on another quote', 'Financing questions', 'Not sure yet'],
      next: [
        { href: '/financing.html', label: 'Financing', text: 'Six lenders, most PPO plans, a savings plan.' },
        { href: '/dental-implants.html', label: 'Dental implants', text: 'What the process looks like, step by step.' },
        { href: '/what-to-expect.html', label: 'Your first visit', text: 'What happens at the consultation.' },
      ],
    },
  ],
}
