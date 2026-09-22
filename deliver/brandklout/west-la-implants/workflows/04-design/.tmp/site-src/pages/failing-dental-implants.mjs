export default {
  slug: 'failing-dental-implants',
  title: 'Failing Dental Implants & Peri-Implantitis Treatment in Los Angeles | West LA Implants',
  description: 'Loose, sore or receding around an implant? West LA Implants treats peri-implantitis, rebuilds lost bone and rescues or replaces failing dental implants placed anywhere. Free second opinions on Wilshire Blvd.',
  image: '/media/img/periimplantitis-model.jpg',
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Failing dental implants · Los Angeles',
      title: 'An implant that is failing can usually be <em>saved.</em>',
      lead: 'Implants succeed about 98 percent of the time nationwide. When one does not, the cause is usually infection around it, and infection can be treated. Bring the implant, whoever placed it.',
      image: { src: '/media/img/periimplantitis-model.jpg', alt: 'A model showing peri-implantitis around a dental implant' },
      actions: [{ href: '#invitation', label: 'Request a Second Opinion' }, { href: '/bone-grafting.html', label: 'Rebuilding lost bone', kind: 'text' }],
      meta: [
        { b: 'Any implant', span: 'Placed here or elsewhere' },
        { b: 'Free', span: 'Second opinion' },
        { b: 'Laser', span: 'For infected tissue' },
        { b: 'Grafting', span: 'Where bone was lost' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/dental-xray.png' },
      text: 'Peri-implantitis is gum disease around an implant. Left alone it takes the gum, then the bone, and then the implant loosens.',
      after: ['Poor grafting, a bad extraction, bad bridgework or an implant placed at the wrong angle can all start it. Whatever started it, the treatment begins by removing every trace of infection.'],
    },
    {
      type: 'ledger', name: 'The Signs', tag: 'The Signs', title: 'Seven things to <em>notice.</em>',
      lead: 'Any one of these is a reason to be seen this week, not next year.',
      figure: { value: 7, label: 'warning signs' },
      items: [
        { b: 'A loose implant', span: 'Movement of any kind, however slight.' },
        { b: 'Sore, inflamed gums', span: 'Tenderness or redness around the implant.' },
        { b: 'Blood or pus', span: 'On the gums when you brush, or at any time.' },
        { b: 'Deep pockets', span: 'The gum pulling away from the implant.' },
        { b: 'A visible post', span: 'Metal showing where gum used to be.' },
        { b: 'Receding gums', span: 'The crown looking longer than it did.' },
        { b: 'Receding bone', span: 'Seen on an X-ray, felt as looseness.' },
      ],
    },
    {
      type: 'steps', name: 'The Rescue', tag: 'The Rescue', title: 'How a failing implant is <em>treated.</em>',
      steps: [
        { title: 'Diagnosis', text: 'A 3D cone-beam scan shows how much bone remains around the implant and whether it can be kept. Dr. Barriere gives this opinion free, whoever placed the implant.' },
        { title: 'Clearing the infection', text: 'Bacteria are destroyed below the gum line and any diseased tissue that cannot recover is removed. A diode laser does much of this with less discomfort and faster healing.' },
        { title: 'Rebuilding the foundation', text: 'Where bone has been lost, it is rebuilt with grafting so the implant sits in solid support again.' },
        { title: 'Replacing, if needed', text: 'An implant that cannot be saved is removed, the site is grafted, and a new implant is planned and placed with Yomi® guidance once the bone has healed.' },
      ],
      image: { src: '/media/img/still-doctor-masked.jpg', alt: 'Dr. Barriere in surgery' },
    },
    {
      type: 'strip', name: 'The Prevention', tag: 'The Prevention', title: 'Protecting the <em>investment.</em>',
      lead: 'Implants do not decay. The gums around them still get gum disease, and the same habits that protect teeth protect implants.',
      body: [
        'Brush twice a day and floss once. Keep your hygiene visits. Tobacco is the single biggest avoidable risk for peri-implantitis.',
        'If you are noticing any of the signs above, call. Early peri-implantitis is treated in one visit; late peri-implantitis may cost the implant.',
      ],
      list: [
        { b: 'Brush and floss', span: 'Daily, around every implant' },
        { b: 'Hygiene visits', span: 'Every six months' },
        { b: 'No tobacco', span: 'The biggest avoidable risk' },
        { b: 'Call early', span: 'Sooner is simpler' },
      ],
      photos: [
        { src: '/media/img/hygienist-procedure.jpg', alt: 'A hygiene visit at West LA Implants' },
        { src: '/media/img/still-emily-consult.jpg', alt: 'Emily in consultation' },
        { src: '/media/img/three-single-implants.jpg', alt: 'Three single dental implants' },
      ],
      flip: true,
    },
    {
      type: 'faq', name: 'The Questions', title: 'Failing implant <em>questions.</em>',
      items: [
        { q: 'My implant was placed somewhere else. Can you still treat it?', a: 'Yes. Most failing implants the practice sees were placed elsewhere. The second opinion is free.' },
        { q: 'Does a failing implant have to come out?', a: 'Not usually. If the infection is treated and the bone rebuilt, many implants are kept. An implant that has lost too much bone is removed, the site grafted, and a new one placed.' },
        { q: 'What is peri-implantitis?', a: 'Infection of the gum and bone around an implant, caused by bacteria in plaque and tartar. It is the most common reason implants fail, and the one you have the most control over.' },
        { q: 'How is it treated?', a: 'By destroying the bacteria below the gum line, removing diseased tissue, and rebuilding lost bone with grafting where needed. Sedation is available.' },
      ],
    },
    {
      type: 'invite', name: 'Invitation', title: 'Bring the <em>implant.</em>', lead: 'A second opinion on a failing implant is free. A 3D scan, an honest read, and a plan to keep it or replace it.',
      interests: ['A failing or loose implant', 'A second opinion', 'Bone grafting', 'All-on-4 / full arch', 'Not sure yet'],
      next: [
        { href: '/bone-grafting.html', label: 'Bone grafting', text: 'Rebuilding the jaw before an implant goes in.' },
        { href: '/periodontics.html', label: 'Periodontics', text: 'Laser gum treatment for the tissue around implants.' },
        { href: '/dental-implants.html', label: 'Dental implants', text: 'How a new implant is planned and placed.' },
      ],
    },
  ],
}
