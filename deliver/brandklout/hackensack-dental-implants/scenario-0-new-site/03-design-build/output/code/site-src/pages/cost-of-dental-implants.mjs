/* /cost-of-dental-implants. Copy: the live page (scrape/pages/cost-of-dental-implants.md; the price
   cards read from mirror/raw-html/cost-of-dental-implants.html, because the markdown dropped the
   repeated "includes" lines and the "per month" label of the zirconia card). Every dollar figure is
   as printed on the live page: $179 per month, $13,999, $249 per month, $24,999 (struck through on
   the live card), $18,999, $3,599, $8,999, and in the FAQ $3,599, $8,999 and $13,999 per arch.
   Structure: the copy under the H1 had no heading of its own. Its last paragraph ("If cost is the
   reason...") sits in the hero as its note, just above the buttons, where it sat above the live page's
   button; its first two paragraphs introduce the price cards ("What you see below is the honest
   starting point") and join that chapter's intro; its four icon labels ("Get treatment now" ...) are
   payment-plan features and head the financing chapter. The "Why a Prosthodontist" block is this
   page's own text (not the shared MESKIN block); the lender copy is LENDER_COPY, word for word.
   Left out: the "Schedule Your Consultation" / "View All Testimonials" buttons, the "Overview" tab
   label of the doctor block, the stock photo of dollar bills, and the footer blocks.
   Fixes: "Meet Dr. Meskin" linked to /contact on the live page; it links to /dr-alan-meskin here.
   Facts: no second phone number, no "Arvada", no review count on the live page. */
import { page, hero, cards, index, specialist, films, financing, faq, consult, p, ul } from '../lib/ui.mjs';
import { LENDER_COPY } from './_shared.mjs';

const crumbs = [['/first-visit-expectations', 'Patients'], ['/cost-of-dental-implants', 'Cost of Dental Implants']];

export default page({
  path: '/cost-of-dental-implants',
  crumbs,
  seo: {
    title: 'Dental Implant Cost in Hackensack, NJ | Hackensack Center',
    description: 'Dental implant cost in Hackensack, NJ explained by prosthodontist Dr. Alan Meskin. Pricing ranges and payment options.',
    image: 'cost-of-dental-implants-hero.webp',
  },
  chapters: [
    hero({
      crumbs,
      tagline: 'Implant Pricing',
      title: 'Cost of Dental Implants',
      lead: 'Cost should never stand between you and the care you need. We work with every financing option available to you, and our treatment coordinators will help you find a plan that fits your budget.',
      note: 'If cost is the reason you have been putting this off, please talk to us before you rule it out. We will find a way.',
      image: { src: 'cost-of-dental-implants-hero.webp', w: 1200, h: 1200, alt: 'A calculator beside a model of a full set of teeth' },
    }),
    cards({
      name: 'The Prices',
      tagline: 'Starting Prices',
      title: 'What Dental Implants Actually Cost',
      intro: p(
        'Dental implants are a real investment, and we believe you deserve to see what things cost before you commit. This page walks through our starting prices for the treatments patients ask about most, the factors that change the number for your specific case, and every financing option we offer to make it manageable.',
        'We publish starting prices because most implant offices refuse to. That refusal is what makes shopping for implant care so frustrating. What you see below is the honest starting point. What you actually pay depends on your case, and you leave your consultation with a written estimate in your hand, not a mystery.',
        'Every price below is an all-inclusive bundle. What we quote at your consultation is what you pay, with financing options to break it into a monthly payment that fits your budget.',
      ),
      columns: 2,
      items: [
        {
          title: 'All-on-X (Acrylic Teeth)',
          text: p('<strong>$179</strong> per month', 'A full arch of fixed teeth, done in one day.', 'Full cash price from <strong>$13,999</strong>', 'Bundle Price. Includes:')
            + ul(['Extractions of failing teeth in the arch', 'Four to six titanium implants per arch', 'Bone grafting at every implant site', 'Full fixed hybrid ceramic resin bridge'])
            + p('General anesthesia available.'),
          href: '/services/all-on-x',
          label: 'More On All on x →',
        },
        {
          title: 'All-on-X with Zirconia',
          text: p('<strong>$249</strong> per month', 'A full arch in solid zirconia. Stronger, more natural-looking, and built to last for years.', 'Full cash price from <del>$24,999</del> <strong>$18,999</strong>', 'All-Inclusive Bundle Price. Includes:')
            + ul(['Extractions of failing teeth in the arch', 'Four to six titanium implants per arch', 'Bone grafting at every implant site', 'Fixed temporary teeth on surgery day', 'Final solid zirconia bridge, custom shaped and shaded', 'Custom night guard to protect your bite'])
            + p('General anesthesia available.'),
        },
        {
          title: 'Single Tooth Implant',
          text: p('One missing tooth, replaced from the root up, without touching the teeth beside it.', 'Starting at <strong>$3,599</strong>', 'Bundle Price. Includes:')
            + ul(['Titanium implant body placed in the bone', 'Custom-fit abutment (the connector piece)', 'Final porcelain crown, shade-matched to your teeth']),
          href: '/services/single-implant',
          label: 'More On Single Implant →',
        },
        {
          title: 'Implant Bridge, 2 to 4 Teeth',
          text: p('Two, three, or four missing teeth in a row, held by two implants, without grinding down the healthy teeth beside them.', 'Starting at <strong>$8,999</strong>', 'Bundle Price. Includes:')
            + ul(['Two titanium implant bodies placed in the bone', 'Two custom-fit abutments (the connector pieces)', 'Custom three-unit porcelain bridge on top']),
          href: '/services/implant-bridges',
          label: 'More On Implant Bridge →',
        },
      ],
      action: { label: 'Schedule Your Consultation', href: '#consultation' },
    }),
    index({
      name: 'What Changes The Price',
      tagline: 'Cost Factors',
      title: 'What Affect the cost',
      intro: p('The starting prices above are honest starting points, not the final number for every patient. Your specific quote depends on a handful of things, all of which are explained clearly at your consultation and included in your written estimate. Nothing is added later.'),
      items: [
        { title: 'How Much Bone You Have', body: p('Implants need bone to fuse to. If the bone under a missing tooth has shrunk over the years, a bone graft may be needed before or during placement. Grafts can range from a small socket preservation done at extraction (minor cost) to a larger sinus lift or ridge augmentation (larger cost, longer timeline). Your 3D scan tells us exactly what your site needs.') },
        { title: 'Whether Extractions Are Needed', body: p('If failing teeth still need to come out, those extractions are added to your plan. For a single implant, this might mean one tooth. For a full-arch case, it can mean removing many teeth in the same appointment, which is included in most All-on-X bundles but may vary depending on how difficult the extractions are.') },
        { title: 'Sinus Lift for Upper Back Teeth', body: p('Implants in the upper back part of the mouth sometimes need extra bone underneath the sinus to hold securely. A sinus lift is a common, focused procedure, but it adds cost and healing time. Your 3D scan tells us whether yours needs one.') },
        { title: 'Number of Implants', body: p('More implants mean higher cost. A single tooth needs one. A bridge needs two. A full arch usually needs four to six, and back-of-mouth or longer-span cases sometimes need an extra implant for support. Dr. Meskin recommends the fewest that will give you a strong, lasting result.') },
        { title: 'Sedation', body: p('Placement is comfortable under local anesthetic for most patients. If you would prefer oral or IV sedation for anxiety or for a longer case, those are available and priced as an add-on.') },
        { title: 'Gum or Bite Treatment Before Implants', body: p('If active gum disease is present, it has to be treated before implants go in. Same for a bite that puts too much force on the wrong spots. This work is done first and priced separately, because your implants only last if the foundation is healthy.') },
      ],
    }),
    specialist({
      tagline: 'Specialist-led, start to finish',
      title: 'Why a Prosthodontist for Your Dental Implants',
      body: p('Placing an implant well is not the same as restoring one well, and doing both together is what a prosthodontist trains for. A prosthodontist spends years of additional education specifically on replacing and restoring teeth, from the surgery through to how the finished tooth looks, feels, and shares your bite. Dr. Meskin earned his dental degree and his prosthodontics specialty at NYU, refined his implant work at ClearChoice, one of the largest implant networks in the country, and plans and finishes every case himself, rather than handing you off between offices.')
        + ul(['NYU-trained prosthodontist, the specialty for restoring and replacing teeth', 'Every case planned in 3D and placed with surgical guidance, not freehand', 'One specialist through the whole process, from first scan to final tooth', 'Care in English, Spanish, and Russian']),
      link: { href: '/dr-alan-meskin', label: 'Meet Dr. Meskin →' },
    }),
    films({
      tagline: 'Patient Films',
      title: 'Real Patients, Real Stories',
      intro: 'Hear from patients who rebuilt their entire smile and got their comfort and confidence back, in their own words.',
    }),
    financing({
      tagline: 'Payment Options',
      title: 'Smile Now, Pay Later',
      intro: ul(['Get treatment now', 'Pay off at any time', 'Flexible deposits', 'Split the cost']),
      lenders: LENDER_COPY,
      action: { label: 'Request an appointment', href: '#consultation' },
    }),
    faq({
      title: 'Answering Your Questions About Financing',
      items: [
        ['How much do dental implants cost?', 'The cost depends on the treatment. A single tooth implant starts at $3,599, an implant bridge at $8,999, and full-arch All-on-X at $13,999 per arch. Every quote comes with a written breakdown of exactly what is included.'],
        ['Why do some treatments show a price and others do not?', 'Single implants, bridges, and All-on-X are priced as complete bundles, so we can publish them. Full-mouth rehabilitation, smile makeovers, and revision cases are planned around your specific mouth, so we quote those in writing after your consultation.'],
        ['What is included in the price?', 'Everything needed to complete the treatment. A single tooth implant includes the implant body, abutment, and crown. All-on-X includes extractions, implants, bone grafting, and fixed teeth. If something is not included, we tell you before you commit.'],
      ],
    }),
    consult({}),
  ],
});
