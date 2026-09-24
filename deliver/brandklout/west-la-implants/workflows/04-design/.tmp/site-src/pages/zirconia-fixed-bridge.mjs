export default {
  slug: 'zirconia-fixed-bridge',
  title: 'Zirconia Fixed Bridge in Los Angeles | West LA Implants',
  description: 'A zirconia fixed bridge at West LA Implants: a full arch milled from one solid block of zirconia and secured to dental implants. Will not stain, chip or break, and looks like natural teeth.',
  image: '/media/img/zirconia-model.jpg',
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Zirconia fixed bridge · Los Angeles',
      title: 'New teeth that look and feel <em>real.</em>',
      lead: 'One solid block of zirconia, milled into a full arch and secured to your implants. It is the strongest material in dentistry and the closest match to the colour and translucency of teeth.',
      image: { src: '/media/img/zirconia-model.jpg', pos: '90% 50%', alt: 'A zirconia fixed bridge' },
      actions: [{ href: '#invitation', label: 'Request a Consultation' }, { href: '/all-on-4.html', label: 'How the arch is placed', kind: 'text' }],
      meta: [
        { b: 'One block', span: 'No acrylic base, no seams' },
        { b: 'Stain-proof', span: 'And odour resistant' },
        { b: 'Biocompatible', span: 'Non-porous, kind to gums' },
        { b: 'Decades', span: 'Of everyday use' },
      ],
    },
    {
      type: 'statement', name: 'The Reality', tag: 'The Reality', image: { src: '/media/img/still-doctor-xray-screen.jpg' },
      text: 'Traditional dentures and some hybrids set porcelain teeth into an acrylic base. Two materials, one weak seam, and a plastic that stains and wears.',
      after: ['A zirconia arch has no seam and no base. It is one piece, with the physical strength of titanium and the look of enamel.'],
    },
    {
      type: 'ledger', name: 'The Material', tag: 'The Material', title: 'Why zirconia, in <em>five</em> facts.',
      lead: 'Leaders in implant dentistry consider this the superior full-arch restoration. Here is what the material actually does.',
      figure: { value: 5, label: 'reasons the practice chose it' },
      items: [
        { b: 'Natural appearance', span: 'The colour and translucency of enamel, custom shaded to your gums, lips and skin tone.' },
        { b: 'Long-lasting durability', span: 'Everyday wear and strong bite forces without fracturing, for decades.' },
        { b: 'Stain and odour resistant', span: 'A polished, non-porous surface that does not absorb coffee, wine or bacteria.' },
        { b: 'Biocompatible', span: 'Smooth and inert against the gums, with none of the irritation of acrylic.' },
        { b: 'Precision designed', span: 'Planned digitally from your scan and milled to fit your implants and your face.' },
      ],
    },
    {
      type: 'strip', name: 'The Craft', tag: 'The Craft', title: 'Designed to your <em>face</em>, not to a chart.',
      lead: 'The bridge is shaped to your smile line, your lips and your gum line, then coloured to match your gums and shaded to the brightness you choose.',
      body: [
        'Secured to implants, the arch keeps the jawbone stimulated and healthy. It feels smooth against the gums and needs no adhesive, no soaking and no relines.',
        'The cost is higher than less aesthetic solutions and is matched by how long it lasts. Insurance and six financing partners are on the financing page.',
      ],
      list: [
        { b: 'Custom shade', span: 'Teeth and gums both coloured to you' },
        { b: 'Fixed', span: 'Stays in day and night' },
        { b: 'Bone kept alive', span: 'Implants replace the roots' },
        { b: 'Second opinion', span: 'Free, before you decide anything' },
      ],
      photos: [
        { src: '/media/img/emily-makeover-after.jpg', pos: '90% 50%', alt: 'Emily smiling after her smile makeover' },
        { src: '/media/img/full-arch-model.jpg', alt: 'A full-arch bridge on four implants' },
        { src: '/media/img/blog-prosthedontist-milling-implant-model.jpg', pos: '40% 50%', alt: 'A prosthesis being hand-finished in the lab' },
      ],
      flip: true,
    },
    {
      type: 'proof', name: 'The Proof', patient: 'michael', title: 'A fixed arch, <em>worn</em> every day.',
      text: 'Michael’s full mouth reconstruction. His film is on the practice’s channel.',
    },
    {
      type: 'faq', name: 'The Questions', title: 'Zirconia <em>questions.</em>',
      items: [
        { q: 'How much does a zirconia bridge cost?', a: 'More than an acrylic hybrid or a denture, less than replacing those several times over. It is quoted after a scan. Insurance, six financing partners and the in-house savings plan are on the financing page.' },
        { q: 'Will people be able to tell?', a: 'The point of zirconia is that they cannot. Its translucency matches enamel and the pink portion is coloured to your own gums.' },
        { q: 'Can it break?', a: 'Zirconia withstands everyday wear and strong bite forces without fracturing. Every implant the practice places carries a one-year warranty on the materials.' },
        { q: 'How is it cleaned?', a: 'Brush it, floss beneath it with a water flosser, and keep your hygiene visits. It does not decay; the gums around the implants still need care.' },
      ],
    },
    {
      type: 'invite', name: 'Invitation', interests: ['Zirconia fixed bridge', 'All-on-4 / full arch', 'Hybrid fixed denture', 'A second opinion', 'Not sure yet'],
      next: [
        { href: '/all-on-4.html', label: 'All-on-4® full arch', text: 'The surgery that carries the bridge.' },
        { href: '/hybrid-dentures.html', label: 'Hybrid fixed dentures', text: 'The acrylic-on-frame alternative.' },
        { href: '/results.html', label: 'Results', text: 'Before and after, and three patients on film.' },
      ],
    },
  ],
}
