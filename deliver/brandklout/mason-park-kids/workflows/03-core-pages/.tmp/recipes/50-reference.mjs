// The reference tables, the index pages, the two legal notices, and the town
// page. The end of the site, and the part where most of the inherited errors
// were hiding.
//
// > [!IMPORTANT]
// > THREE PAGES MAKE CLAIMS THE PRACTICE CANNOT STAND BEHIND, and all three are
// > handled here rather than reproduced.
// >
// > 1. /toothpaste-chart/ was Lead Safe Mama LLC's article pasted in whole,
// >    including their fundraising links, their reader numbers and their
// >    first-person voice ("we had nearly 2.3 million unique individual readers
// >    here on this website"). Read on this domain it is the practice speaking.
// >    The CHART is the useful part and is a real third-party lab result, so it
// >    stays, credited to Lead Safe Mama by name with a link, framed as what it
// >    is. Their marketing copy does not.
// > 2. /accessibility-statement/ was theme boilerplate: dated January 2022,
// >    signed "Mason Park Family Dental" (the parent practice), and describing
// >    an accessibility widget with a screen-reader mode and a keyboard menu.
// >    There is no such widget on this site. A false accessibility claim is
// >    worse than none, so it is replaced with a truthful statement about what
// >    this site actually does, and the practice's real contact route.
// > 3. /town-resource/ named Dr. William Sung, linked twice to the ADULT
// >    practice at bestdentistinkatytx.com, signed off "BMason Park Family
// >    Dental", and listed teeth whitening, wisdom tooth removal and oral
// >    cancer screenings as services. The Katy civic links are genuinely
// >    useful and stay. The rest is the parent practice's and does not.
// >
// > /privacy-policy/ was written by workflow 02 and is honest, with one line
// > that has since gone stale: it says pages load typefaces from Google Fonts.
// > They have been self-hosted since 2026-09-09. Corrected below.

export default [

// ------------------------------------------------------------ toothpaste RDA
{
  slug: 'toothpaste-rda-table',
  title: 'Toothpaste Abrasiveness (RDA) Table | Mason Park Dental for Kids, Katy TX',
  description: 'The RDA abrasiveness value of ninety common toothpastes, from 0 to 200, with the four bands: low, medium, highly abrasive, and the harmful limit.',
  eyebrow: 'Patient resources',
  h1: 'How rough is the toothpaste you are already buying?',
  em: 'already buying',
  lede: 'RDA is Relative Dentin Abrasivity: a measure of how much a toothpaste wears the tooth as it cleans it. Higher is not better, and for a child it is usually worse.',
  cta: 'Ask at your next visit', cta2: 'The bands', cta2href: 'bands',
  hero: { img: 'st-tube', alt: 'Toothpaste on a toothbrush by a bathroom sink' },
  crumbs: [['Patient resources', '/patient-resources/'], 'Toothpaste RDA table'],
  chapters: [
    { k: 'cards', id: 'bands', name: 'The Bands', title: 'Four bands, and where to aim.', theme: 'warm',
      lede: 'The scale runs from 0, a brush with plain water, to 250. Anything above 250 is not permitted for sale.',
      numbered: false,
      cards: [
        { h: '0 to 70', p: 'Low abrasive. Where a child’s toothpaste should sit, and where most sensitivity formulations are.', mod: '' },
        { h: '70 to 100', p: 'Medium abrasive. Most ordinary family toothpastes are in this band.', mod: 'is-sky' },
        { h: '100 to 150', p: 'Highly abrasive. Usually a whitening or tartar-control claim on the front of the tube.', mod: 'is-sun' },
        { h: '150 to 250', p: 'Regarded as the harmful limit. Not a band to put a child’s enamel in twice a day.', mod: '' },
      ] },
    { k: 'table', id: 'table', name: 'The Table', title: 'Ninety toothpastes, lowest first.', theme: 'sage',
      from: 1, pairs: 2, sortBy: 1, head: ['Toothpaste', 'RDA value'],
      note: 'A number here is not a recommendation. Bring the tube, or a photograph of it, to your child’s next visit and we will tell you whether it suits their teeth.' },
    { k: 'statement', id: 'point', name: 'The Point', theme: 'sky', kicker: 'What actually matters',
      text: 'Technique and frequency do far more than the tube does. Twice a day, for two minutes, with you finishing the job.',
      link: ['Dental hygiene education', '/services/dental-hygiene-education/'] },
    { k: 'invite', title: 'Bring the tube to the next appointment.',
      lede: 'We will look at what your child is using and say plainly whether to change it. Contact Mason Park Dental for Kids in Katy, TX.',
      shot: { img: 'st-floss', alt: 'Floss and toothpaste on a bathroom shelf' },
      related: [['Toothpaste chart', '/toothpaste-chart/'], ['pH and acidity', '/ph-and-acidity-of-food-beverages/'], ['Dental hygiene education', '/services/dental-hygiene-education/']] },
  ],
},

// ---------------------------------------------------------- toothpaste chart
{
  slug: 'toothpaste-chart',
  title: 'Toothpaste Toxicant Testing Chart | Mason Park Dental for Kids, Katy TX',
  description: 'Independent third-party laboratory testing of popular toothpastes for lead, mercury, arsenic and cadmium, published by Lead Safe Mama LLC. What it is and how to read it.',
  eyebrow: 'Patient resources',
  h1: 'A chart parents keep sending us, and what we think of it.',
  em: 'what we think of it',
  lede: 'Lead Safe Mama LLC publishes independent, community-funded laboratory testing of consumer products, including toothpaste. Parents ask about it, so it is here with the context it needs.',
  cta: 'Ask at your next visit', cta2: 'What it is', cta2href: 'what',
  hero: { img: 'st-tube', alt: 'Toothpaste on a toothbrush by a bathroom sink' },
  crumbs: [['Patient resources', '/patient-resources/'], 'Toothpaste chart'],
  chapters: [
    { k: 'prose', id: 'what', name: 'The Source', title: 'Whose work this is.', theme: 'warm',
      figure: { img: 'st-soda', alt: 'Sweets and drinks laid out on a table' },
      sections: [
        { h: 'Not ours', b: [
          'The chart is <b>not the practice’s work and not the practice’s data</b>. It is published by <a href="https://tamararubin.com/" target="_blank" rel="noopener">Lead Safe Mama, LLC</a>, which since March 2024 has coordinated independent, third-party laboratory testing of foods, supplements, cosmetics and personal-care items, and has sent more than 400 community-nominated products to laboratories to be tested for lead, mercury, arsenic and cadmium.',
          'It is <a href="https://tamararubin.com/" target="_blank" rel="noopener">read on their own site</a> rather than copied onto ours. It is fifty-one products across nine columns, watermarked, and unreadable at any width a phone has; and it is their work, kept current by them. A stale copy of somebody else’s lab results is worse than a link to the live one.',
        ] },
        { h: 'How to read it', b: [
          'A detection is not automatically a dose that matters, and an absence in one batch is not an absence in every batch. What a chart like this is genuinely good for is narrowing a shortlist, and then asking somebody who knows your child’s teeth.',
          'The position Lead Safe Mama takes, and which is the scientific and medical consensus, is that there is no safe level of lead exposure for humans.',
        ] },
      ] },
    { k: 'statement', id: 'credit', name: 'The Credit', theme: 'sage', kicker: 'Chart and data',
      text: 'Lead Safe Mama, LLC. Community-funded, third-party laboratory testing, published in full on their own site.',
      link: ['Read the original', 'https://tamararubin.com/'] },
    { k: 'overlap', id: 'ours', name: 'What We Say', title: 'What the practice would actually tell you.', theme: 'sky',
      lede: 'A chart is a shortlist, not a prescription. This is what we say in the room when a parent brings one in.',
      shot: { img: 'st-floss', alt: 'Floss and toothpaste on a bathroom shelf' },
      h3: 'Four things that matter more than the brand.',
      items: [
        'Fluoride, at the strength that suits your child’s age. Dr. Nguyen will advise you on that.',
        'Abrasiveness, which the <a href="/toothpaste-rda-table/">RDA table</a> covers and which almost nobody checks.',
        'A pea-sized amount, and a smear before the age of three.',
        'Twice a day for two minutes, with you finishing the job until they can do it unassisted.',
      ],
      link: ['Dental hygiene education', '/services/dental-hygiene-education/'] },
    { k: 'invite', title: 'Bring the chart, and bring the tube.',
      lede: 'We would rather talk about what your child is actually using than about a chart. Contact Mason Park Dental for Kids in Katy, TX.',
      related: [['Toothpaste RDA table', '/toothpaste-rda-table/'], ['pH and acidity', '/ph-and-acidity-of-food-beverages/'], ['Product recommendations', '/product-recommendations-2/']] },
  ],
},

// -------------------------------------------------------------- pH and acid
{
  slug: 'ph-and-acidity-of-food-beverages',
  title: 'pH and Acidity of Foods and Drinks | Mason Park Dental for Kids, Katy TX',
  description: 'Why acid erodes enamel below pH 5.5, which everyday drinks sit under that line, and the thirty minutes to wait before brushing afterwards.',
  eyebrow: 'Patient resources',
  h1: 'Enamel starts dissolving at pH 5.5. Most of what children drink is below it.',
  em: 'below it',
  lede: 'Erosion is not decay. Decay is bacteria making acid; erosion is acid arriving ready-made in a cup. Both wear enamel, and the second one is the easier of the two to change.',
  cta: 'Book a visit', cta2: 'The line', cta2href: 'line',
  hero: { img: 'st-soda', alt: 'Sweets and drinks laid out on a table' },
  crumbs: [['Patient resources', '/patient-resources/'], 'pH and acidity'],
  chapters: [
    { k: 'figures', id: 'line', name: 'The Line', title: 'Three numbers to remember.', theme: 'warm',
      figures: [
        { n: '5.5', label: 'the pH', note: 'Below pH 5.5, tooth enamel begins to demineralise. That is the whole of the rule.' },
        { n: '30', label: 'minutes', note: 'If something acidic has been eaten or drunk, wait thirty minutes before brushing so saliva can neutralise the acid first.' },
        { n: '1', label: 'glass of water', note: 'When you can, have your child drink a glass of water after meals. This helps wash away sugars and dilute the acid.' },
      ] },
    { k: 'cards', id: 'what', name: 'What Is Acidic', title: 'Where the everyday drinks sit.', theme: 'sage',
      lede: 'The exact figure varies by brand and batch, so these are the bands rather than a table of decimals we cannot stand behind.',
      numbered: false,
      cards: [
        { h: 'Well below the line', p: 'Fizzy drinks, sports and energy drinks, and citrus juices. These sit far under pH 5.5 and are the ones worth limiting to mealtimes.', mod: '' },
        { h: 'Around the line', p: 'Fruit juices, flavoured waters, yoghurt drinks and many fruits. Fine with a meal; a problem when sipped all afternoon.', mod: 'is-sky' },
        { h: 'Above the line', p: 'Water, plain milk and most cheese. Water is the one to make ordinary.', mod: 'is-sun' },
      ] },
    { k: 'overlap', id: 'how', name: 'What To Change', title: 'It is the sipping, not the drink.', theme: 'sky',
      lede: 'A glass of juice at breakfast and a glass of juice sipped over two hours are very different events for a tooth. The second one never lets the mouth recover.',
      shot: { img: 'st-water', alt: 'A glass of water on a kitchen table' },
      h3: 'Four things that actually help.',
      items: [
        'Keep acidic drinks to mealtimes rather than between them.',
        'Water between meals, and water after them.',
        'Through a straw where that suits, so less of it washes over the front teeth.',
        'Wait thirty minutes after something acidic before brushing.',
      ],
      link: ['Dental hygiene education', '/services/dental-hygiene-education/'] },
    { k: 'invite', title: 'We will tell you what we can see on the teeth.',
      lede: 'Erosion is visible at an ordinary exam long before a child notices it. Contact Mason Park Dental for Kids in Katy, TX.',
      shot: { img: 'st-lunchbox', alt: 'A packed school lunch of fruit and vegetables' },
      related: [['Toothpaste RDA table', '/toothpaste-rda-table/'], ['Fluoride treatment', '/services/fluoride-treatment/'], ['Preventive dentistry', '/services/preventive-dentistry/']] },
  ],
},

// ------------------------------------------------------- product recommendations
{
  slug: 'product-recommendations-2',
  title: 'Product Recommendations | Mason Park Dental for Kids, Katy TX',
  description: 'What we tell parents to look for on the label, and the two reference tables the practice reads from in the chair.',
  eyebrow: 'Patient resources',
  h1: 'We would rather tell you what to look for than what to buy.',
  em: 'what to look for',
  lede: 'The page that used to be here was empty. Rather than fill it with brands we have not checked, here is what we actually say in the room, and the two tables we read from.',
  cta: 'Ask at your next visit', cta2: 'The label', cta2href: 'label',
  hero: { img: 'st-brushes', alt: 'Children’s toothbrushes in a cup' },
  crumbs: [['Patient resources', '/patient-resources/'], 'Product recommendations'],
  chapters: [
    { k: 'cards', id: 'label', name: 'On The Label', title: 'Four things worth checking.', theme: 'warm',
      cards: [
        { h: 'Fluoride, at the right strength', p: 'Toothpastes and mouth rinses with fluoride are available over the counter, and stronger rinses can be prescribed. Dr. Nguyen will advise you on your child’s fluoride needs.' },
        { h: 'A soft brush, and a small head', p: 'Small enough to reach the back molars of the mouth your child has now, not the one they will have in three years.' },
        { h: 'Low abrasiveness', p: 'The RDA value, which almost never appears on the tube. Our table has ninety of them, and a child’s paste should be under 70.' },
        { h: 'No whitening claim', p: 'Whitening and tartar-control formulations are the abrasive ones. Neither is something a child’s teeth need.' },
      ] },
    { k: 'links', id: 'tables', name: 'The Tables', title: 'The two we read from in the chair.', theme: 'sage',
      cols: 2,
      groups: [
        { h: 'Toothpaste RDA table', p: 'The abrasiveness of ninety common toothpastes, with the four bands and where a child’s should sit.', links: [['Read the RDA table', '/toothpaste-rda-table/']] },
        { h: 'Toothpaste chart', p: 'Independent third-party laboratory testing for toxicants, published by Lead Safe Mama LLC, with the context it needs.', links: [['Read the chart', '/toothpaste-chart/']] },
      ] },
    { k: 'statement', id: 'point', name: 'The Point', theme: 'sky', kicker: 'What matters most',
      text: 'Nothing on a label matters as much as twice a day, for two minutes, with you finishing the job.',
      link: ['Dental hygiene education', '/services/dental-hygiene-education/'] },
    { k: 'invite', title: 'Bring what you are using and we will look at it.',
      lede: 'The most useful version of this page is a two-minute conversation at your child’s next visit. Contact Mason Park Dental for Kids in Katy, TX.',
      related: [['pH and acidity', '/ph-and-acidity-of-food-beverages/'], ['Dental hygiene education', '/services/dental-hygiene-education/'], ['Fluoride treatment', '/services/fluoride-treatment/']] },
  ],
},

// ---------------------------------------------------------- patient resources
{
  slug: 'patient-resources',
  title: 'Patient Resources | Mason Park Dental for Kids, Katy TX',
  description: 'Forms, plans, offers, reference tables and the FAQs, all in one place. Patient resources at Mason Park Dental for Kids in Katy, TX.',
  eyebrow: 'Patients',
  h1: 'Everything a parent needs, in one place.',
  em: 'in one place',
  lede: 'Forms and what to bring, the ways of paying for it, the reference tables we read from, and every question we are asked.',
  cta: 'Book a visit', cta2: 'The resources', cta2href: 'all',
  hero: { img: 'st-desk', alt: 'A clipboard and a pen on a desk' },
  crumbs: ['Patient resources'],
  chapters: [
    { k: 'links', id: 'all', name: 'Everything', title: 'Four groups, and what is in each.', theme: 'warm',
      groups: [
        { h: 'Before the first visit', p: 'What to bring, what happens, and how a first appointment actually runs.', links: [['New patients', '/new-patients/'], ['Request an appointment', '/appointment/'], ['Knee-to-knee exams', '/knee-to-knee-pediatric-dental-exam/']] },
        { h: 'Paying for it', p: 'Insurance, the savings plan for families without one, and the current offers.', links: [['Insurance and financing', '/financing/'], ['Dental savings plan', '/dental-saving-plan/'], ['Special offers', '/special-offers/']] },
        { h: 'Questions', p: 'Fifty of them, answered by the practice, plus the words you will hear in the room.', links: [['All FAQs', '/faq-page/'], ['Pediatric dentistry FAQs', '/pediatric-dentistry-faqs-katy-tx/'], ['Invisalign FAQs', '/invisalign-faqs-katy-tx/'], ['Dental dictionary', '/dental-dictionary/']] },
        { h: 'At home', p: 'What to buy, what to avoid, and the two tables we read from in the chair.', links: [['Product recommendations', '/product-recommendations-2/'], ['Toothpaste RDA table', '/toothpaste-rda-table/'], ['Toothpaste chart', '/toothpaste-chart/'], ['pH and acidity', '/ph-and-acidity-of-food-beverages/']] },
        { h: 'The practice', p: 'Who we are, what is in the rooms, and how to reach us.', links: [['About the practice', '/about-us/'], ['Meet the doctors', '/our-doctors/'], ['Technology', '/technology/'], ['Contact', '/contacts/']] },
        { h: 'For clinicians', p: 'Referring a child to a board certified pediatric dentist.', links: [['Refer a patient', '/refer-a-patient/'], ['Special needs care', '/services/special-needs-patient-care/'], ['Sedation dentistry', '/services/sedation-dentistry/']] },
      ] },
    { k: 'invite', title: 'If it is not here, call and ask.',
      lede: 'The front desk would rather answer it on the phone than have you hunt for it. Contact Mason Park Dental for Kids in Katy, TX.',
      shot: { img: 'st-calendar', alt: 'A calendar and a pen on a desk' },
      related: [['New patients', '/new-patients/'], ['Contact', '/contacts/'], ['Sitemap', '/sitemap/']] },
  ],
},

// ------------------------------------------------------------- dental library
{
  slug: 'dental-library',
  title: 'Dental Library | Mason Park Dental for Kids, Katy TX',
  description: 'Plain-language explanations of every treatment we provide, written for parents. The complete index of services at Mason Park Dental for Kids.',
  eyebrow: 'Patient resources',
  h1: 'Every treatment we provide, explained for parents.',
  em: 'for parents',
  lede: 'Grouped the way the practice is: prevention first, then repair, then the appearance, then the straightening, then the things that make an appointment possible at all.',
  cta: 'Book a visit', cta2: 'The library', cta2href: 'library',
  hero: { img: 'st-books', alt: 'A stack of children’s picture books' },
  crumbs: ['Dental library'],
  chapters: [
    { k: 'links', id: 'library', name: 'The Library', title: 'Six departments, twenty-three pages.', theme: 'warm',
      groups: [
        { h: 'Comprehensive pediatric dentistry', p: 'The exam, the cleaning and the conversation. Where everything else begins.', links: [['Comprehensive pediatric dentistry', '/services/comprehensive-pediatric-dentistry/'], ['Special needs patient care', '/services/special-needs-patient-care/']] },
        { h: 'Preventive dentistry', p: 'Making sure nothing has to be done.', links: [['Preventive dentistry', '/services/preventive-dentistry/'], ['Dental cleanings and exams', '/services/dental-cleanings-and-exams/'], ['Dental hygiene education', '/services/dental-hygiene-education/'], ['Fluoride treatment', '/services/fluoride-treatment/'], ['Sealants', '/services/sealants/'], ['Mouth guards', '/services/mouth-guards/'], ['Night guards', '/services/night-guards/']] },
        { h: 'Restorative dentistry', p: 'Giving a damaged tooth its job back.', links: [['Restorative dentistry', '/services/restorative-dentistry/'], ['Composite fillings', '/services/composite-fillings/'], ['Dental crowns', '/services/dental-crowns/'], ['Pulp therapy', '/services/pulp-therapy/'], ['Extractions', '/services/extractions/'], ['Space maintainers', '/services/space-maintainers/']] },
        { h: 'Cosmetic dentistry', p: 'For a child who has stopped smiling in photographs.', links: [['Cosmetic dentistry', '/services/cosmetic-dentistry/'], ['Bonding', '/services/bonding/']] },
        { h: 'Orthodontics', p: 'An evaluation at seven, and what may follow years later.', links: [['Orthodontics', '/services/orthodontics/'], ['Early intervention', '/services/early-intervention/'], ['Invisalign', '/services/invisalign/'], ['Retainers', '/services/retainers/']] },
        { h: 'Periodontics, sedation and emergencies', p: 'The gums, the comfort, and the day something happens.', links: [['Periodontics', '/services/periodontics/'], ['Frenectomy', '/services/frenectomy/'], ['Sedation dentistry', '/services/sedation-dentistry/'], ['Emergency pediatric dentistry', '/emergency-pediatric-dentistry/']] },
      ] },
    { k: 'invite', title: 'Read the page, then ask us the rest.',
      lede: 'Every one of these is written to be read before an appointment, not instead of one. Contact Mason Park Dental for Kids in Katy, TX.',
      related: [['All services', '/our-services/'], ['Dental dictionary', '/dental-dictionary/'], ['Pediatric dentistry FAQs', '/pediatric-dentistry-faqs-katy-tx/']] },
  ],
},

// -------------------------------------------------------------------- sitemap
{
  slug: 'sitemap',
  title: 'Sitemap | Mason Park Dental for Kids, Katy TX',
  description: 'Every page on this website, grouped by what it is for.',
  eyebrow: 'The site',
  h1: 'Every page on this website.',
  em: 'Every page',
  lede: 'Fifty-seven of them, grouped by what they are for rather than by where they sit in the menu.',
  cta: 'Book a visit', cta2: 'The pages', cta2href: 'pages',
  hero: { img: 'st-nook', alt: 'A reading nook by a window' },
  crumbs: ['Sitemap'],
  chapters: [
    { k: 'links', id: 'pages', name: 'The Pages', title: 'Six groups.', theme: 'warm',
      groups: [
        { h: 'The practice', links: [['Home', '/'], ['About us', '/about-us/'], ['Meet the doctors', '/our-doctors/'], ['Meet the team', '/our-team/'], ['Technology', '/technology/'], ['Knee-to-knee exams', '/knee-to-knee-pediatric-dental-exam/'], ['Smile gallery', '/before-after/'], ['Patient reviews', '/patient-reviews/'], ['Contact', '/contacts/']] },
        { h: 'Preventive care', links: [['All services', '/our-services/'], ['Comprehensive pediatric dentistry', '/services/comprehensive-pediatric-dentistry/'], ['Preventive dentistry', '/services/preventive-dentistry/'], ['Dental cleanings and exams', '/services/dental-cleanings-and-exams/'], ['Dental hygiene education', '/services/dental-hygiene-education/'], ['Fluoride treatment', '/services/fluoride-treatment/'], ['Sealants', '/services/sealants/'], ['Mouth guards', '/services/mouth-guards/'], ['Night guards', '/services/night-guards/']] },
        { h: 'Repair and comfort', links: [['Restorative dentistry', '/services/restorative-dentistry/'], ['Composite fillings', '/services/composite-fillings/'], ['Dental crowns', '/services/dental-crowns/'], ['Pulp therapy', '/services/pulp-therapy/'], ['Extractions', '/services/extractions/'], ['Space maintainers', '/services/space-maintainers/'], ['Periodontics', '/services/periodontics/'], ['Frenectomy', '/services/frenectomy/'], ['Sedation dentistry', '/services/sedation-dentistry/'], ['Special needs patient care', '/services/special-needs-patient-care/'], ['Emergency pediatric dentistry', '/emergency-pediatric-dentistry/']] },
        { h: 'Appearance and straightening', links: [['Cosmetic dentistry', '/services/cosmetic-dentistry/'], ['Bonding', '/services/bonding/'], ['Orthodontics', '/services/orthodontics/'], ['Early intervention', '/services/early-intervention/'], ['Invisalign', '/services/invisalign/'], ['Retainers', '/services/retainers/']] },
        { h: 'For parents', links: [['New patients', '/new-patients/'], ['Request an appointment', '/appointment/'], ['Patient resources', '/patient-resources/'], ['Insurance and financing', '/financing/'], ['Dental savings plan', '/dental-saving-plan/'], ['Special offers', '/special-offers/'], ['Virtual consultation', '/virtual-consultation/'], ['Refer a patient', '/refer-a-patient/'], ['Town resources', '/town-resource/']] },
        { h: 'Questions and reference', links: [['All FAQs', '/faq-page/'], ['Pediatric dentistry FAQs', '/pediatric-dentistry-faqs-katy-tx/'], ['Invisalign FAQs', '/invisalign-faqs-katy-tx/'], ['Dental dictionary', '/dental-dictionary/'], ['Dental library', '/dental-library/'], ['Product recommendations', '/product-recommendations-2/'], ['Toothpaste chart', '/toothpaste-chart/'], ['Toothpaste RDA table', '/toothpaste-rda-table/'], ['pH and acidity', '/ph-and-acidity-of-food-beverages/'], ['Privacy policy', '/privacy-policy/'], ['Accessibility statement', '/accessibility-statement/'], ['Thank you', '/thank-you/']] },
      ] },
    { k: 'invite', title: 'Still cannot find it? Call.',
      lede: 'Contact Mason Park Dental for Kids in Katy, TX and the front desk will point you at it.',
      related: [['Patient resources', '/patient-resources/'], ['Dental library', '/dental-library/'], ['Contact', '/contacts/']] },
  ],
},

// -------------------------------------------------------------- town resource
{
  slug: 'town-resource',
  title: 'Katy, TX Town Resources for Families | Mason Park Dental for Kids',
  description: 'New to Katy? The city council, the courts, the police department, the chamber of commerce, and the numbers worth having. From your local pediatric dentist.',
  eyebrow: 'The town',
  h1: 'New to Katy? Here is some useful information about your new home.',
  em: 'your new home',
  lede: 'Katy, TX is a community devoted to balancing economic opportunity and historic preservation. Our growing community includes places for hiking, shopping, running, theaters and more.',
  cta: 'Book a visit', cta2: 'Who to know', cta2href: 'who',
  hero: { img: 'st-park', alt: 'A tree-lined path in a neighbourhood park' },
  crumbs: [['Patients', '/new-patients/'], 'Town resources'],
  chapters: [
    { k: 'links', id: 'who', name: 'Who To Know', title: 'The people who run the place.', theme: 'warm',
      groups: [
        { h: 'The county', p: 'Harris County’s elected officials, including the County Judge and Commissioners.', links: [['Harris County elected officials', 'https://www.harriscountytx.gov/County-Judge-and-Commissioners/Harris-County-Elected-Officials']] },
        { h: 'The city', p: 'The Mayor and City Council of the City of Katy.', links: [['Katy Mayor and City Council', 'https://www.cityofkaty.com/government/mayor-city-council']] },
        { h: 'The courts', p: 'The municipal court, for anything from a citation to a permit dispute.', links: [['Katy Municipal Court', 'https://www.cityofkaty.com/government/city-departments/municipal-court']] },
      ] },
    { k: 'links', id: 'places', name: 'Places To Know', title: 'Business, and the police.', theme: 'sage',
      cols: 2,
      groups: [
        { h: 'Chamber of Commerce', p: 'Katy has a county chamber of commerce that promotes the growth and success of business and industry in the community.', links: [['Katy Chamber of Commerce', 'https://www.katychamber.com/']] },
        { h: 'Police Department', p: 'Katy Police Department is ready and willing to serve and protect our community.', links: [['Katy Police Department', 'https://www.cityofkaty.com/government/city-departments/police-department']] },
      ] },
    { k: 'figures', id: 'numbers', name: 'The Numbers', title: 'Three worth putting in your phone.', theme: 'sky',
      figures: [
        { n: '911', label: 'emergencies', note: 'For any emergency, please dial 911.' },
        { n: '713-884-3131', label: 'non-emergency', note: 'For non-emergency calls to the police department.' },
        { n: '(281) 578-7100', label: 'this practice', note: 'For a dental emergency, call us and follow the message if it is out of hours.' },
      ] },
    { k: 'invite', title: 'And when you need a dentist for the children.',
      lede: 'Mason Park Dental for Kids is at the corner of Mason Rd and Kingsland Blvd, behind the Ranch 99 complex. We hope this page helps as you settle into Katy.',
      shot: { img: 'st-family', alt: 'A parent and a young child laughing together at home' },
      related: [['New patients', '/new-patients/'], ['About the practice', '/about-us/'], ['Contact', '/contacts/']] },
  ],
},

// ------------------------------------------------------------- privacy policy
{
  slug: 'privacy-policy',
  title: 'Privacy Policy | Mason Park Dental for Kids, Katy TX',
  description: 'What this website collects, which third parties handle appointment requests, how text message reminders work, and how to ask what the practice holds about you.',
  noindex: true,
  eyebrow: 'The site',
  h1: 'This site is static. It has no accounts and no tracking.',
  em: 'no tracking',
  lede: 'What follows is what this website does, plainly. It is not the practice’s clinical privacy notice, which is a separate document you are given at the practice.',
  cta: 'Contact the practice', cta2: 'What it collects', cta2href: 'collects',
  hero: { img: 'st-window', alt: 'Sunlight through a window in a quiet room' },
  badges: false,
  crumbs: ['Privacy policy'],
  chapters: [
    { k: 'prose', id: 'collects', name: 'The Website', title: 'What this website collects.', theme: 'warm',
      sections: [
        { h: 'The pages themselves', b: [1] },
        { h: 'Forms and booking', b: [3] },
        // The 02 copy said pages load typefaces from Google Fonts. Since
        // 2026-09-09 both families are self-hosted woff2 served from this
        // site's own uploads, and there is no request to Google for a font.
        { h: 'Fonts and maps', b: ['Typefaces are self-hosted and served from this site, so loading a page makes no request to a font provider. The contact page and several others embed a Google Map, which is loaded only when you scroll to it; opening that map is a request to Google and is covered by Google’s own privacy policy.'] },
      ] },
    { k: 'prose', id: 'you', name: 'You', title: 'Messages, children, and your information.', theme: 'sage',
      sections: [
        { h: 'Text messages', b: [5] },
        { h: 'Children', b: [7] },
        { h: 'Asking us about your information', b: [11] },
      ] },
    { k: 'statement', id: 'changes', name: 'Changes', theme: 'sky', kicker: 'One thing to note',
      text: 'This notice will be replaced by the practice’s reviewed policy. Until then it is what governs this website.',
      link: ['Contact the practice', '/contacts/'] },
    { k: 'invite', title: 'Ask us anything about this.',
      lede: 'To ask what the practice holds about you or your child, or to have it corrected, contact the office.',
      cta: 'Contact the practice',
      related: [['Accessibility statement', '/accessibility-statement/'], ['Contact', '/contacts/'], ['Sitemap', '/sitemap/']] },
  ],
},

// ------------------------------------------------------ accessibility statement
{
  slug: 'accessibility-statement',
  title: 'Accessibility Statement | Mason Park Dental for Kids, Katy TX',
  description: 'What this website does for accessibility, what it does not yet do, and how to tell us about a page you cannot use. Mason Park Dental for Kids, Katy, TX.',
  noindex: true,
  eyebrow: 'The site',
  h1: 'What this site does, and what it does not do yet.',
  em: 'does not do yet',
  lede: 'The statement that used to be here described an accessibility widget this site does not have. This one describes what is actually true, which is more useful and rather less impressive.',
  cta: 'Tell us about a problem', cta2: 'What it does', cta2href: 'does',
  hero: { img: 'st-nook', alt: 'A reading nook by a window' },
  badges: false,
  crumbs: ['Accessibility statement'],
  chapters: [
    { k: 'cards', id: 'does', name: 'What It Does', title: 'Six things built into every page.', theme: 'warm',
      numbered: false,
      cards: [
        { h: 'Semantic markup', p: 'Real headings in order, real lists, real tables, and one main landmark per page, so a screen reader can move through a page by structure rather than by guessing.' },
        { h: 'A skip link', p: 'The first thing on every page is a link to the main content, so a keyboard user does not tab through the whole menu on each one.' },
        { h: 'Text alternatives', p: 'Every photograph carries alt text describing the frame, and decorative marks are hidden from assistive technology rather than announced.' },
        { h: 'Keyboard operation', p: 'Menus, accordions and the mobile drawer work from the keyboard, with a visible focus outline that is not removed.' },
        { h: 'Legible type', p: 'Nothing on a phone is set below the label floor, the type scales with the viewport rather than being fixed in pixels, and text can be zoomed without the layout breaking.' },
        { h: 'Reduced motion', p: 'The scroll animations respect the operating system’s reduce-motion setting, and the page is complete and readable with every animation off.' },
      ] },
    { k: 'cards', id: 'not', name: 'What It Does Not', title: 'Three honest limitations.', theme: 'sage',
      numbered: false,
      cards: [
        { h: 'No accessibility overlay', p: 'There is no widget, no screen-reader mode and no font-size toolbar. Overlays of that kind are widely held to make things worse, so the work has gone into the pages instead.' },
        { h: 'The embedded map', p: 'The Google Map on the contact page is a third-party embed and we do not control its accessibility. The address and directions are given as text beside it for that reason.' },
        { h: 'No formal audit yet', p: 'The site is built to WCAG 2.1 AA as a target and has not yet been independently audited against it. We will say so here when it has.' },
      ] },
    { k: 'statement', id: 'help', name: 'Here For You', theme: 'sky', kicker: 'If a page will not work for you',
      text: 'Call the practice and we will give you whatever is on that page over the phone, and then fix the page.',
      link: ['Contact the practice', '/contacts/'] },
    { k: 'invite', title: 'Tell us about anything you cannot use.',
      lede: 'If you are having difficulty with any content on this site, or need help with any part of it, call (281) 578-7100 or email office@masonparkdental.com. Please say which page, and what happened.',
      cta: 'Call (281) 578-7100',
      related: [['Privacy policy', '/privacy-policy/'], ['Contact', '/contacts/'], ['Special needs care', '/services/special-needs-patient-care/']] },
  ],
},

];
