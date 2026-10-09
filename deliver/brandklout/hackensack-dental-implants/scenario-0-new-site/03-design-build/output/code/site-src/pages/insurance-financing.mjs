/* /insurance-financing. Copy: the live page (scrape/pages/insurance-financing.md, checked against
   mirror/raw-html/insurance-financing.html), placed and folded, not rewritten. The lender copy is
   LENDER_COPY, word for word. The insurance section's three bold-led points stay a list with their
   bold lead-ins; the third folds behind "Read more" (the run passes 110 words).
   Left out: the "Schedule Your Consultation", "Request an appointment" (kept as the financing
   chapter's button), "Verify My Benefits" buttons; the link on "your plan" (it pointed to
   /cost-of-dental-implants from a sentence about the patient's insurance plan); the stock photo of an
   insurance form (its slot here is to be filled again); the Elfsight reviews widget under the FAQ
   (labelled "Aesthetic Dental Center" in the live markup: another practice's widget); footer blocks.
   Facts: no second phone number, no "Arvada", no review count on the live page. */
import { page, hero, checks, financing, statement, faq, consult, p, ul } from '../lib/ui.mjs';
import { LENDER_COPY } from './_shared.mjs';

const crumbs = [['/first-visit-expectations', 'Patients'], ['/insurance-financing', 'Insurance & Financing']];

export default page({
  path: '/insurance-financing',
  crumbs,
  seo: {
    title: 'Insurance & Financing in Hackensack, NJ | Hackensack Center',
    description: 'Insurance and financing for dental implants in Hackensack, NJ. Hackensack Center for Dental Implants helps you plan payment.',
    image: 'insurance-financing-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'Paying for Care',
      title: 'Insurance and Financing in Hackensack, NJ',
      lead: 'Cost should never stand between you and the care you need. We work with every financing option available to you, and our treatment coordinators will help you find a plan that fits your budget.',
      image: { src: 'insurance-financing-hero.webp', w: 1080, h: 1080, alt: 'A patient shaking hands with the front-desk team at reception' },
    }),
    checks({
      name: 'Finance Options',
      tagline: 'Payment Plans',
      title: 'Finance Options Available, for Your Dental Treatments',
      intro: p("We believe a healthy, confident smile should be within reach, whatever your situation. In the doctor's own words, we will find a way. We try every avenue, and our dedicated team of treatment coordinators will sit down with you to walk through your options until we land on a plan that works."),
      items: ['Get treatment now', 'Pay off at any time', 'Flexible deposits', 'Split the cost'],
    }),
    financing({
      title: 'Our Financing Partners',
      lenders: LENDER_COPY,
      action: { label: 'Request an appointment', href: '#consultation' },
    }),
    statement({
      name: 'Insurance',
      tagline: 'Insurance',
      title: 'Not Sure What Your Insurance Actually Covers?',
      lead: 'Insurance can be confusing, especially when it comes to implants, crowns, and restorative work.',
      body: p('Our team verifies your benefits, explains what your plan actually pays, and gives you a clear estimate up front, before any treatment begins.')
        + ul([
          '<strong>Benefits Verified Up Front.</strong> Before any treatment starts, we review your plan and confirm your coverage in advance, so you know exactly what insurance will pay and what you will owe. No surprise bills after the fact.',
          '<strong>Every Dollar of Coverage Used.</strong> Insurance rarely covers the full cost of implant or restorative work, but it often covers more than people expect. Our coordinators handle the paperwork and claims for you and make sure you get every dollar of the benefit you are entitled to.',
        ]),
      more: ul(['<strong>Combined with Financing.</strong> Where insurance covers only part, financing bridges the rest. We help you combine the two so your care stays affordable, and we flag any unused annual benefits before they expire at year end.']),
      image: { src: 'insurance-financing-statement.webp', w: 1000, h: 900, alt: 'A dental insurance claim form, a pen and glasses' },
    }),
    faq({
      title: 'Answering Your Questions About Insurance and Financing',
      items: [
        ['Do I need good credit to qualify?', 'Not necessarily. Our partners offer soft credit checks so you can see what you qualify for without any impact on your score. Cherry, for example, considers applicants with credit scores as low as 520. If one partner is not the right fit, our coordinators can often find another that is.'],
        ['Will applying affect my credit score?', 'No, not at the application stage. All four of our financing partners offer soft credit checks to see your options, which do not affect your score. A hard check only happens later, if and when you formally accept a plan.'],
        ['How much can I finance?', 'It depends on the partner and your qualification, but our partners cover treatments from smaller single-tooth cases through full-mouth reconstruction. For larger cases like full-arch implants, Proceed Finance is specifically built for higher amounts.'],
        ['What are the monthly payments like?', 'Monthly payments depend on your treatment cost, your term length, and your qualification. Longer terms mean lower monthly payments. Our coordinators will run the numbers with you before you commit, so there are no surprises.'],
        ['Do you take my dental insurance?', 'We work with most dental insurance plans and verify your benefits before treatment. Even if we are out of network, many plans still cover part of your care, and our coordinators handle the paperwork for you.'],
        ['Can I combine insurance and financing?', 'Yes, and it is often the smartest approach. Insurance covers part of the treatment, financing covers the rest, and your out-of-pocket cost is spread across manageable monthly payments.'],
        ['What if I still cannot afford it?', "Talk to us anyway. In the doctor's own words, we will find a way. Our coordinators work through every avenue, from combining plans to phasing your treatment, so cost does not become the reason you go without care."],
      ],
    }),
    consult({}),
  ],
});
