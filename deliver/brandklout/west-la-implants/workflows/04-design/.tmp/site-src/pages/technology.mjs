import { FILMS } from '../lib/site.mjs'

export default {
  slug: 'technology',
  title: 'Yomi® Robotic Implant Surgery & Dental Technology in Los Angeles | West LA Implants',
  description: 'West LA Implants places implants with the Yomi® dental robot, plans every case on cone-beam CT, prints its own surgical guides and mills restorations in house. See the technology on Wilshire Blvd.',
  image: '/media/img/still-yomi-robot-team.jpg',
  chapters: [
    {
      type: 'cover', name: 'Arrival', layout: 'bleed', kicker: 'Robotic surgery & technology · Los Angeles',
      title: 'The first robot built for implant surgery is in <em>this</em> room.',
      lead: 'Yomi® reads your 3D scan and guides the drill to the position, angle and depth in the plan. Dr. Barriere holds the handpiece. The robot keeps it honest.',
      video: { src: '/media/video/dr-barriere-yomi-1920.mp4', poster: '/media/img/still-yomi-robot-team.jpg', label: 'Dr. Barriere and his assistant operating the Yomi surgical robot' },
      actions: [{ href: '#invitation', label: 'Request a Consultation' }, { href: `https://www.youtube.com/watch?v=${FILMS.guided.id}`, label: 'Watch: 3D guided surgery', kind: 'text', ext: true }],
      meta: [
        { b: 'Yomi®', span: 'Robotic guidance' },
        { b: 'CBCT', span: '3D cone-beam imaging' },
        { b: 'In house', span: 'Guides printed, teeth milled' },
        { b: 'Under 3 hrs', span: 'Some full-arch surgeries' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/dental-xray.png' },
      text: 'An implant is a millimetre from a nerve, a sinus, a neighbouring root. Free-hand, it is placed by feel. Guided, it is placed by the plan.',
      after: ['The robot does not replace the surgeon. It removes the guessing from the surgeon’s hands, and lets him focus on you.'],
    },
    {
      type: 'steps', name: 'The Workflow', tag: 'The Workflow', title: 'Scan. Plan. Guide. <em>Restore.</em>',
      intro: 'Diagnostics, planning, surgery and the final teeth all happen under one roof, on one digital model of your mouth.',
      steps: [
        { title: 'Scan', text: 'A cone-beam CT captures your jaw in seconds, at a minimal radiation dose, with no bite plates or film. An intraoral scanner maps your teeth without impression trays.' },
        { title: 'Plan', text: 'On the 3D model, each implant is positioned in the strongest bone, clear of nerves and sinuses, with the final tooth already designed. Smile simulation shows you the after before you begin.' },
        { title: 'Guide', text: 'Yomi® follows the plan directly from the scan, so most cases need no physical guide at all. Where one helps, it is 3D-printed in chrome, fitted only to you.' },
        { title: 'Restore', text: 'Temporary nanoceramic teeth are ready the same day. The final crowns, bridges and arches are designed on the same model and milled or printed in house.' },
      ],
      image: { src: '/media/img/still-cbct-suite.jpg', alt: 'The CBCT imaging suite at West LA Implants' },
    },
    {
      type: 'ledger', name: 'The Suite', tag: 'The Suite', title: 'Eleven tools, one <em>reason.</em>',
      lead: 'Each one shortens a visit, removes a guess, or makes the result more predictable. Nothing here is for show.',
      figure: { value: 11, label: 'technologies in the practice' },
      items: [
        { b: 'Yomi® dental robot', span: 'Robotic guidance for implant position, angle and depth, directly from your CBCT scan.' },
        { b: 'Cone-beam CT scanner', span: 'A 3D image of your jaw in seconds, at a minimal dose, with nothing in your mouth.' },
        { b: 'Intraoral scanner', span: 'A digital map of your teeth from a few seconds with a wand. No impression trays.' },
        { b: 'Chrome-guided surgery', span: '3D-printed chrome guides where a physical guide serves the plan better than a robot.' },
        { b: 'NDX® nSequence', span: 'CBCT plus CAD/CAM planning that shortens surgery and delivers same-day temporary teeth.' },
        { b: 'TeethToday®', span: 'Strong, natural-looking nanoceramic teeth on the day of surgery, for one tooth or all of them.' },
        { b: '3D printer', span: 'Guides, models and provisional restorations made in house, in hours.' },
        { b: 'In-house milling', span: 'Crowns and bridges cut from the digital design without a lab round trip.' },
        { b: 'Diode laser', span: 'Gum surgery, scaling and root planing and gum contouring with faster healing and less infection.' },
        { b: 'Intraoral cameras', span: 'Early detection of infection, decay and oral cancer on a screen you can see.' },
        { b: 'Smile simulation', span: 'Your after, shown before you commit to implants, veneers or Invisalign®.' },
      ],
    },
    {
      type: 'strip', name: 'The Robot', tag: 'The Robot', title: 'What Yomi® actually <em>does.</em>',
      lead: 'It reads your cone-beam scan directly and physically guides the handpiece along the planned path, protecting nerves and sinuses.',
      body: [
        'For full-arch cases that means implants placed without a surgical guide, and in some cases a surgery finished in under three hours.',
        'Dr. Barriere trained on the robot as part of the more than a thousand hours of continuing education he has completed in implant and cosmetic dentistry.',
      ],
      list: [
        { b: 'Reads the scan', span: 'No transfer errors between plan and mouth' },
        { b: 'Guides the drill', span: 'Position, angle and depth held to the plan' },
        { b: 'Shorter surgery', span: 'Less time in the chair, faster recovery' },
        { b: 'Surgeon in control', span: 'The robot assists, it does not operate' },
      ],
      actions: [{ href: `https://www.youtube.com/watch?v=${FILMS.technology.id}`, label: 'Watch: state-of-the-art technology', kind: 'text', ext: true }],
      photos: [
        { src: '/media/img/yomi-robot-surgical.jpg', alt: 'The Yomi surgical robot in the operatory' },
        { src: '/media/img/still-yomi-closeup.jpg', pos: '30% 50%', alt: 'The Yomi guidance arm, close up' },
        { src: '/media/img/yomi-technology.jpg', alt: 'Yomi robotic guidance at West LA Implants' },
      ],
      flip: true,
    },
    {
      type: 'proof', name: 'The Proof', patient: 'leslie', title: 'Planned digitally. Placed <em>precisely.</em>',
      text: 'Leslie’s full arch was planned on her scan and placed to the plan. Her film is on the practice’s channel.',
    },
    {
      type: 'faq', name: 'The Questions', title: 'Technology <em>questions.</em>',
      items: [
        { q: 'Does a robot do the surgery?', a: 'No. Dr. Barriere does. Yomi® holds the handpiece to the planned position, angle and depth so the surgeon can focus on the patient rather than on measuring. He can override it at any moment.' },
        { q: 'Is robotic guidance safer?', a: 'It removes the free-hand variation in where an implant ends up, which is what protects nerves and sinuses and gives the final tooth a predictable foundation. Precision also means smaller incisions and faster healing.' },
        { q: 'Is the CBCT scan safe?', a: 'It uses a minimal radiation dose and takes seconds. It is the standard of care for implant planning because it shows bone volume and anatomy that a flat X-ray cannot.' },
        { q: 'Why does having the lab in house matter?', a: 'Fewer visits, faster turnaround and no handoff between the surgeon and a distant lab. The temporary teeth are ready the day of surgery and the final teeth are designed on the same model.' },
      ],
    },
    {
      type: 'invite', name: 'Invitation', title: 'See the room for <em>yourself.</em>', lead: 'A consultation includes the scan, a look at the plan on screen, and a tour of the suite.',
      interests: ['Dental implants', 'All-on-4 / full arch', 'A second opinion', 'IV sedation', 'Not sure yet'],
      next: [
        { href: '/dental-implants.html', label: 'Dental implants', text: 'How the treatment works, step by step.' },
        { href: '/dr-tony-barriere.html', label: 'Dr. Barriere', text: 'Training, residency and continuing education.' },
        { href: '/our-practice.html', label: 'The practice', text: 'The team, the rooms, the comforts.' },
      ],
    },
  ],
}
