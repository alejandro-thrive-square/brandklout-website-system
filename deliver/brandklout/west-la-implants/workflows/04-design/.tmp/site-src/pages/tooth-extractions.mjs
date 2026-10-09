import { FILMS, filmHref } from '../lib/site.mjs'

export default {
  slug: 'tooth-extractions',
  title: 'Tooth Extractions & Wisdom Teeth Removal in Los Angeles | West LA Implants',
  description: 'Gentle tooth extractions and wisdom teeth removal at West LA Implants, with sedation, socket preservation and a plan for the replacement. Same-day emergency visits on Wilshire Blvd.',
  image: '/media/img/wisdom-tooth-extraction.jpg',
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Tooth extractions · wisdom teeth · Los Angeles',
      title: 'Removal can be <em>restorative.</em>',
      lead: 'The goal is always to save the tooth. When infection, trauma or an impacted wisdom tooth make that impossible, a gentle extraction ends the pain and protects everything around it.',
      image: { src: '/media/img/patient-smile-portrait-5.jpg', pos: '50% 40%', alt: 'A West LA Implants patient smiling after his treatment' }, // BugHerd #86
      actions: [{ href: '#invitation', label: 'Request an Appointment' }, { href: filmHref(FILMS.wisdom), label: 'Watch: why wisdom teeth come out', kind: 'text', ext: true }],
      meta: [
        { b: 'Same day', span: 'Emergency visits' },
        { b: 'Sedation', span: 'Nitrous, oral or IV' },
        { b: 'Socket graft', span: 'To protect the bone' },
        { b: 'A plan', span: 'For what replaces it' },
      ],
    },
    {
      type: 'compare', name: 'The Two Kinds', tag: 'The Two Kinds', title: 'Simple, or <em>wisdom.</em>', // BugHerd #88: moved up to sit right after the cover
      columns: [
        { title: 'Simple extraction', sub: 'A damaged or infected tooth', hot: true, rows: ['Local anaesthetic, sedation if you want it', 'The tooth is loosened and lifted with forceps', 'Neighbouring teeth, bone and gum protected', 'Healing over a few days with over-the-counter relief'] },
        { title: 'Wisdom tooth extraction', sub: 'Impacted or crowding', rows: ['Sedation as needed, local anaesthetic at the site', 'Bone and gum preserved as the tooth is removed', 'Detailed aftercare to protect the clot', 'Dr. Barriere has more than a decade of wisdom tooth experience'] },
        { title: 'Then what', sub: 'Every extraction except wisdom teeth', rows: ['A socket graft keeps the bone', 'An implant is the permanent replacement', 'A bridge or partial is the alternative', 'The plan is made before the tooth comes out'], href: '/dental-implants.html', cta: 'Dental implants' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/tooth-extraction-model.jpg' },
      text: 'An abscessed tooth does not stay a tooth problem. It reaches the neighbours, the bone, and in some cases the body.',
      after: ['When root canals, gum treatment and restorations cannot save it, extraction is the conservative choice. Most take minutes, and most patients report pressure, not pain.'],
    },
    {
      type: 'steps', name: 'The Aftercare', tag: 'The Aftercare', title: 'The first <em>48 hours.</em>',
      intro: 'A clot forms over the socket and protects the bone and nerve beneath. Everything below is about keeping it there.',
      steps: [
        { title: 'The first hour', text: 'Bite on the gauze for 30 to 60 minutes. No spitting, rinsing, straws, smoking, carbonated or alcoholic drinks for 24 hours. Let your mouth empty passively.' },
        { title: 'Day one', text: 'Cold compresses in ten-minute intervals for swelling. Some oozing is normal for 12 to 24 hours; a hand towel on the pillow helps. Firm pressure on folded gauze or a damp tea bag if bleeding is heavy, and call if it does not subside.' },
        { title: 'Day two', text: 'Expect minor pain, swelling, bruising, some limit on opening, perhaps a sore throat. Rest. No heavy lifting. Brush gently; a lukewarm salt water rinse, not spat out. Over-the-counter relief as directed.' },
        { title: 'The week after', text: 'Soft foods and fluids: yogurt, soup, fish, pasta, nothing spicy. Finish any antibiotics. Sutures come out in 7 to 10 days at a short visit. Call the office with anything unusual.' },
      ],
      image: { src: '/media/img/woman-tea.jpg', pos: '70% 50%', alt: 'Resting at home after an extraction' },
    },
    {
      type: 'strip', name: 'The Replacement', tag: 'The Replacement', title: 'The extraction is not the <em>last</em> step.',
      lead: 'Except for wisdom teeth and teeth removed for crowding, a missing tooth should be replaced. Bone starts receding beneath the socket within months.',
      body: [
        'A socket graft at the time of extraction slows that loss and keeps the site ready. An implant, a root and a crown, then makes it as if the tooth had never gone.',
        'The whole path is planned before the extraction so nothing is left to chance and no bone is lost waiting.',
      ],
      list: [
        { b: 'Socket preservation', span: 'Graft placed at extraction' },
        { b: 'Implant', span: 'The permanent replacement' },
        { b: 'Bridge or partial', span: 'The alternatives, explained' },
        { b: 'Emergencies', span: 'Same-day and next-day visits' },
      ],
      actions: [{ href: '/bone-grafting.html', label: 'Socket preservation and grafting', kind: 'text' }],
      photos: [
        { src: '/media/img/implant-crown-model.jpg', alt: 'Two implants supporting a three-tooth bridge' },
        { src: '/media/img/bone-graft-model.jpg', pos: '70% 50%', alt: 'An implant and crown replacing an extracted tooth' },
        { src: '/media/img/dental-implant-crown-placement.png', pos: '50% 50%', alt: 'A dental implant with its crown being placed' }, // BugHerd #87
      ],
      flip: true,
    },
    {
      type: 'faq', name: 'The Questions', title: 'Extraction <em>questions.</em>',
      items: [
        { q: 'Will it hurt?', a: 'The area is numbed and sedation is available. Most patients feel pressure during the extraction and mild soreness for a few days afterwards, managed with over-the-counter medication.' },
        { q: 'What is dry socket?', a: 'A painful complication when the blood clot over the socket is lost and the bone and nerve beneath are exposed. Following the aftercare, especially no spitting, straws or smoking for the first days, is how it is avoided.' },
        { q: 'Do wisdom teeth always need to come out?', a: 'No. Impacted, infected, crowding or painful wisdom teeth do. Healthy, fully erupted ones that can be cleaned can stay. An exam and an X-ray decide it.' },
        { q: 'Can the implant go in the same day?', a: 'Sometimes, when the socket is healthy and the bone is good. Otherwise a socket graft is placed and the implant follows once the site has healed.' },
      ],
    },
    {
      type: 'invite', name: 'Invitation', title: 'Do not wait on a <em>toothache.</em>', lead: 'Same-day and next-day emergency appointments. Call, or send the form.',
      interests: ['A toothache or emergency', 'Wisdom teeth', 'A tooth extraction', 'Dental implants', 'Not sure yet'],
      next: [
        { href: '/bone-grafting.html', label: 'Bone grafting', text: 'Socket preservation and what follows it.' },
        { href: '/dental-implants.html', label: 'Dental implants', text: 'The permanent replacement.' },
        { href: '/sedation-dentistry.html', label: 'Sedation', text: 'Nitrous, oral or IV, chosen with you.' },
      ],
    },
  ],
}
