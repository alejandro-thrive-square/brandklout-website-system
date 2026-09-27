export default {
  slug: 'periodontics',
  title: 'Periodontics & Laser Gum Treatment in Los Angeles | West LA Implants',
  description: 'Periodontal care at West LA Implants: laser scaling and root planing, osseous surgery, gingivectomy, crown lengthening, gum grafts and frenectomy, plus peri-implantitis treatment around implants.',
  image: '/media/img/gum-disease-patient.jpg',
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Periodontics · Los Angeles',
      title: 'Your gums are the <em>foundation.</em>',
      lead: 'Teeth and implants stand in gum and bone. Periodontal disease takes both, quietly. The practice treats it with a diode laser, which means less scraping, less pain and faster healing.',
      image: { src: '/media/img/gum-disease-patient.jpg', pos: '90% 50%', alt: 'A patient being examined for gum disease' },
      actions: [{ href: '#invitation', label: 'Request an Evaluation' }, { href: '/failing-dental-implants.html', label: 'Gum disease around an implant', kind: 'text' }],
      meta: [
        { b: 'Diode laser', span: 'Less pain, faster healing' },
        { b: 'Six', span: 'Periodontal procedures' },
        { b: 'Implants too', span: 'Peri-implantitis treated' },
        { b: 'Sedation', span: 'Available for any of them' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/hygienist-procedure.jpg' },
      text: 'Gingivitis becomes periodontitis, then bone loss, then tooth loss. The same bacteria are linked to diabetes, blood pressure and heart disease.',
      after: ['Even with implants, the gums around them can get the same disease. Keeping them healthy is what keeps the implant.'],
    },
    {
      type: 'ledger', name: 'The Procedures', tag: 'The Procedures', title: 'Six treatments, most of them <em>laser.</em>',
      figure: { value: 6, label: 'periodontal procedures' },
      items: [
        { b: 'Scaling and root planing', span: 'Laser removal of plaque and tartar above and below the gum line, with less scraping and discomfort than the traditional method.' },
        { b: 'Osseous surgery', span: 'Pocket reduction: the gum is lifted, bacteria removed from the pockets, and the gum closed and dressed to heal. A minor surgery with outsized results.' },
        { b: 'Gingivectomy', span: 'For advanced disease where the gum has pulled away: infected tissue is removed and the gum reshaped to save the teeth.' },
        { b: 'Crown lengthening', span: 'Laser removal of excess gum over the crowns of the teeth, for a gummy smile and for tissue that is prone to infection.' },
        { b: 'Gingival grafts', span: 'Gum tissue grafted onto areas of recession to cover roots and save natural teeth.' },
        { b: 'Frenectomy', span: 'Release of a tight lip or tongue tie to restore full range of motion in the mouth.' },
      ],
    },
    {
      type: 'steps', name: 'The Visit', tag: 'The Visit', title: 'What a periodontal visit looks <em>like.</em>',
      steps: [
        { title: 'Measuring', text: 'Pocket depths around every tooth and implant, X-rays for bone levels, and intraoral camera images you can see on screen.' },
        { title: 'The plan', text: 'Which pockets need laser scaling, which sites need surgery, and how often you should be seen. Emergencies change the order; the plan does not change the goal.' },
        { title: 'Treatment', text: 'Local anaesthetic, sedation if you want it. Laser scaling in one or two visits; surgical procedures scheduled as needed.' },
        { title: 'Maintenance', text: 'Periodontal maintenance visits, typically every three to four months, to keep the pockets closed and the bone where it is.' },
      ],
      image: { src: '/media/img/practice-patient-3.jpg', alt: 'A patient in the treatment room at West LA Implants' },
    },
    {
      type: 'strip', name: 'The Implants', tag: 'The Implants', title: 'Gum health is <em>implant</em> health.',
      lead: 'Peri-implantitis is gum disease around an implant. Treated early it is a cleaning; treated late it can cost the implant.',
      body: [
        'Because the practice places implants, it treats the tissue around them with the same care and the same laser, and rebuilds bone where infection has taken it.',
      ],
      list: [
        { b: 'Peri-implantitis', span: 'Treated below the gum line' },
        { b: 'Bone rebuilt', span: 'Grafting where needed' },
        { b: 'Soft tissue aesthetics', span: 'Gum contour around crowns and arches' },
        { b: 'Maintenance', span: 'Every three to six months' },
      ],
      actions: [{ href: '/failing-dental-implants.html', label: 'Failing implants', kind: 'text' }],
      photos: [
        { src: '/media/img/periimplantitis-model.jpg', alt: 'A model of peri-implantitis around an implant' },
        { src: '/media/img/still-doctor-xray-screen.jpg', pos: '80% 40%', alt: 'Dr. Barriere reviewing X-rays on the operatory screen' },
        { src: '/media/img/three-single-implants.jpg', alt: 'Three single implants' },
      ],
      flip: true,
    },
    {
      type: 'faq', name: 'The Questions', title: 'Gum <em>questions.</em>',
      items: [
        { q: 'What are the signs of gum disease?', a: 'Bleeding when you brush, red or swollen gums, bad breath that does not go, receding gums, loose teeth, and pockets between gum and tooth. Any of them is a reason to be measured.' },
        { q: 'Why a laser?', a: 'A diode laser removes infected tissue and bacteria with less bleeding, less scraping and faster healing than instruments alone, and lowers the chance of infection afterwards.' },
        { q: 'Is periodontal treatment painful?', a: 'Local anaesthetic covers it and sedation is available. Laser scaling is noticeably more comfortable than traditional scaling; surgical procedures are followed by a few days of tenderness.' },
        { q: 'Can gum disease be cured?', a: 'It can be controlled and kept controlled with treatment and maintenance visits. Lost bone can be rebuilt with grafting; lost gum can be grafted.' },
      ],
    },
    {
      type: 'invite', name: 'Invitation', title: 'Take care of the other <em>half</em> of your smile.', lead: 'A periodontal evaluation measures every pocket and tells you exactly where you stand.',
      interests: ['Gum disease or bleeding gums', 'Gum disease around an implant', 'A gummy smile', 'General dentistry', 'Not sure yet'],
      next: [
        { href: '/general-dentistry.html', label: 'General dentistry', text: 'Cleanings, exams and the everyday care.' },
        { href: '/failing-dental-implants.html', label: 'Failing implants', text: 'When the gums around an implant are the problem.' },
        { href: '/bone-grafting.html', label: 'Bone grafting', text: 'Rebuilding what disease took.' },
      ],
    },
  ],
}
