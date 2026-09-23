#!/usr/bin/env node
/**
 * push-home.mjs — the client's corrections and the four differentiators on the
 * Instatic home page.
 *
 * Written in INSTATIC'S class idiom (`stat`, `std`, `tagline`, `cap`, `row`,
 * `bio`), not the local build's. The two vocabularies diverged in the
 * 2026-08-17 re-architecture and Instatic has no CSS for the newer prefixed
 * names, so importing local markup verbatim would land correct copy in
 * unstyled elements.
 *
 * The `.ta*` thin-arch classes ARE new on both sides. They ship as a stylesheet
 * code asset rather than through site_apply_css, because Instatic strips
 * "unused" CSS from the style registry at publish and a code asset survives it.
 *
 * NOTE ON THE DUPLICATE SECTION: this page carries `ch-specialist` TWICE, with
 * the same DOM id, from the original import. Both copies are updated here so
 * whichever survives is correct; removing the duplicate is a separate,
 * destructive change and is not done from this script.
 */
import { callJson } from './instatic-mcp.mjs';

const D = '<b>&#9670;</b>';
const stat = (count, extra, label) =>
  `<div class="stat"><b data-count="${count}"${extra}>0</b><span>${label}</span></div>`;
const row = (us, them) =>
  `<div class="vs-row" role="row"><span class="vs-us" role="cell">${us}</span>`
  + `<span class="vs-mid" aria-hidden="true"><i></i></span>`
  + `<span class="vs-them" role="cell">${them}</span></div>`;
const card = (cls, src, alt, tagline, head, body) =>
  `<article class="${cls}"><img src="${src}" alt="${alt}" loading="lazy" decoding="async">`
  + `<span class="tagline">${tagline}</span>`
  + `<div class="cap"><b>${head}</b><span>${body}</span></div></article>`;
const cred = (t) => `<li><i></i>${t}</li>`;

const BIO = '<p>Dr. Nahlah has practised dentistry <strong>since 2003</strong>, moving to Northern Virginia in 2013 to focus entirely on prosthodontics: esthetic dentistry, implant dentistry, full-mouth rehabilitation and smile makeovers.</p>'
  + '<p>In 2013 the American Board of Prosthodontics awarded him <strong>Diplomate</strong> status, the most prestigious credential in the field. He is also a <strong>Fellow of the American College of Prosthodontists</strong>.</p>'
  + '<p>He is <strong>adjunct faculty at Virginia Commonwealth University</strong>, teaching the residents in its Prosthodontics Postgraduate Program. He has published in national and international scientific journals and lectures on smile design and dental implants. That is the kind of work that tends to bring the difficult cases to his door.</p>'
  + '<p>Across that career he has placed <strong>over 18,000 implants</strong> and restored <strong>over 15,000 arches</strong>.</p>';

const CREDS = cred('Diplomate, American Board of Prosthodontics')
  + cred('Fellow, American College of Prosthodontists')
  + cred('Adjunct Faculty, VCU Prosthodontics Postgraduate Program')
  + cred('Certificate in Prosthodontics')
  + cred('M.S., Master of Science in Oral Biology')
  + cred('Fellow, International Congress of Oral Implantologists')
  + cred('Associate Fellow, American Academy of Implant Dentistry')
  + cred('IV Sedation Certificate');

const EDITS = [
  // Chapter 02 — the credential counter contradicted the eight credentials
  // listed in Chapter 03; the client's volume figures replace it and the
  // location count, which the hero meta and the contact page already carry.
  { label: 'ch02 stats', uid: 'i7lYOLC_xsnDgJ02okJsW',
    html: stat('23', ' data-suffix="+"', 'Years in Practice')
        + stat('18000', ' data-suffix="+"', 'Implants Placed')
        + stat('15000', ' data-suffix="+"', 'Arches Restored')
        + stat('4.9', ' data-decimals="1"', 'Average Patient Rating') },

  { label: 'ch02 comparison', uid: '10PAqk8UXc1oKm3SQjvGQ',
    html: '<div class="vs-row vs-head-row" role="row">'
        + '<span class="vs-us" role="columnheader">Dr. Nahlah</span>'
        + '<span class="vs-mid" aria-hidden="true" role="columnheader">vs</span>'
        + '<span class="vs-them" role="columnheader">A General Practice</span></div>'
        + row('Board-certified prosthodontist with three years of specialist training beyond dental school.',
              'A weekend implant course, or a referral out.')
        + row('Surgery and final teeth planned and placed by the same specialist.',
              'Handed between a surgeon, a dentist and an outside lab.')
        + row('The final smile is designed first, then implants are placed to serve it.',
              'Implants placed first, restoration figured out afterwards.')
        + row('Complex and failed cases accepted, including work other practices decline.',
              'Straightforward cases only.')
        + row('IV sedation certified, so a full-arch case is done in one sitting.',
              'Local anaesthetic, or a referral for sedation.')
        + row('Thin-arch (FP1) full arches wherever the bone allows: teeth, not a slab of pink acrylic.',
              'One thick FP3 prosthesis, whatever the case looks like.')
        + row('A digital laboratory inside both offices, so shade and fit are corrected while you wait.',
              'Posted to an outside lab, and waited on for weeks.')
        + row('Every implant placed through a computer-generated surgical guide.',
              'Placed freehand, judged by eye on the day.') },

  { label: 'ch02 marquee', uid: 'yJF6DLIDmbXe_eLdqDcf3',
    html: '<span>Board-Certified Prosthodontist</span>' + D
        + '<span>Fellow, American College of Prosthodontists</span>' + D
        + '<span>Thin-Arch FP1 Full Arches</span>' + D
        + '<span>In-House Digital Lab in Both Offices</span>' + D
        + '<span>Minimally Invasive Veneer Preps</span>' + D
        + '<span>Computer-Guided Implant Surgery</span>' + D
        + '<span>18,000+ Implants Placed</span>' + D },

  { label: 'ch03 bio (copy 1)', uid: 'iFwRbUY_18I4wnDZC5qx0', html: BIO },
  { label: 'ch03 bio (copy 2)', uid: 'cDII2PPoKy14Nb6tQQmqq', html: BIO },
  { label: 'ch03 creds (copy 1)', uid: 'MQpzq8UAb3nrRxNEySaO0', html: CREDS },
  { label: 'ch03 creds (copy 2)', uid: 'eCrHcVDtZv08VtzhBqKVd', html: CREDS },

  { label: 'ch06 heading', uid: 'od1gHUnila180cp2hDCoB',
    html: 'Four things you will not find down the road.' },
  { label: 'ch06 lede', uid: 'NV_Molefy3wdZ9hNmz4s2',
    html: 'Planning, surgery, sedation and the lab that makes your teeth, all in the same building, run by the same team. These four are what that actually buys you.' },

  // The 3D-imaging card folds into computer-guided (the scan is that card's
  // input) and the sedation card into the Chapter 02 comparison, which carries
  // it already. That leaves exactly the four the client named.
  { label: 'ch06 grid', uid: '6QdzcDHyu4NW6Kop0stUp',
    html: card('std wide', '/uploads/Kyq8mJbQJb9LPzeqcho88-lab.jpg',
               'The in-house dental laboratory bench with a surgical microscope',
               'In-House Digital Lab', 'A digital laboratory in both practices.',
               'McLean and Alexandria each have their own lab and their own technician. Your teeth are designed, milled and finished in the building you are sitting in, so shade, shape and fit are corrected in minutes rather than posted to a third party and waited on for weeks.')
        + card('std', '/uploads/f4EvdWr16VBeLKsqAiQlW-xray.png',
               'A cone-beam scan used to plan implant positions',
               'Computer-Guided Surgery', 'Placed to a plan, not by eye.',
               'A cone-beam scan maps the bone, the positions are planned in software, and a printed surgical guide puts every implant at the planned angle and depth.')
        + card('std', '/uploads/N3OobIU3i-6PA8SeuRX78-veneers-procedure.png',
               'A minimally invasive veneer preparation in progress',
               'Minimally Invasive Veneers', 'Under a millimetre of enamel.',
               'Veneer preparations are kept as thin as the case allows, so what is already yours stays yours.')
        + card('std', '/uploads/991LexO9uFTin-ATA0-CG-case-ao4-double-1-after.jpg',
               'A finished full-arch case treated at the practice, the teeth meeting the gum line with no pink acrylic showing',
               'Thin Arch', 'Teeth, not a slab of acrylic.',
               'Where the bone allows it, a full arch is restored as FP1: crowns on implants, with no bulky pink base. The difference is below.') },
];

const fp = (key, head, items) =>
  `<article class="ta-card ta-${key}"><span class="ta-key">${key.toUpperCase()}</span>`
  + `<h3>${head}</h3><ul class="ta-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul></article>`;

export const THIN_ARCH =
  '<div class="wrap section ta ta-inset" id="thin-arch">'
  + '<div class="ta-head"><div class="chapter-tag"><i></i><span class="label">Thin Arch</span></div>'
  + '<h2 class="ta-title">FP1, FP2, FP3, and why we plan for the first.</h2>'
  + '<p>Every full-arch implant prosthesis is one of three types. What separates them is how much of it is teeth, and how much is pink acrylic standing in for gum and bone. Most practices fit one kind. Here the arch is planned as thin as the case will carry.</p></div>'
  + '<div class="ta-grid">'
  + fp('fp1', 'Replaces teeth only',
       ['Natural crown-and-bridge look', 'No added pink, no extra bulk', 'Typically on more natural gum architecture'])
  + fp('fp2', 'Longer teeth, minimal pink',
       ['Longer teeth, minimal pink acrylic', 'The pink that is added still follows the natural gum contour', 'Rarely indicated, and often not ideal'])
  + fp('fp3', 'Replaces teeth, gums and bone',
       ['Thick pink acrylic stands in for gum and bone', 'Thicker, stronger prosthesis', 'Typically best where there is bone loss, and a lower hygiene risk'])
  + '</div>'
  + '<figure class="ta-fig"><img src="/uploads/ENFTs0BxHOSzBrq1fNHbs-fp1-fp3-comparison.png" loading="lazy" decoding="async" alt="FP1, FP2 and FP3 full-arch prostheses side by side. FP1 replaces the teeth only, with no pink acrylic. FP2 has longer teeth and minimal pink. FP3 replaces teeth, gums and bone with thick pink acrylic.">'
  + '<figcaption>The same arch, three ways. The pink is the difference.</figcaption></figure>'
  + '<p class="ta-note">A thin arch is not always possible. Where bone loss is advanced, FP3 is both the honest answer and the stronger one. What is worth asking is whether anyone planned for the alternative. <a class="pk-more" href="/all-on-4">How a full arch is planned</a></p>'
  + '</div>';

if (import.meta.filename === process.argv[1]) {
  let ok = 0;
  const problems = [];
  for (const e of EDITS) {
    try {
      const r = await callJson('site_replace_node_html', { nodeId: e.uid, html: e.html });
      if (r && typeof r.text === 'string') {
        if (!/does not accept children/i.test(r.text)) throw new Error(r.text.slice(0, 150));
        if (/<[a-z]/i.test(e.html)) throw new Error('text node but replacement has markup');
        const r2 = await callJson('site_update_node_props', { nodeId: e.uid, patch: { text: e.html } });
        if (!r2 || r2.ok !== true) throw new Error(`props patch rejected: ${JSON.stringify(r2).slice(0, 130)}`);
      }
      ok++;
      console.log(`  ${e.label.padEnd(22)} ${e.uid} ok`);
    } catch (err) {
      problems.push(`${e.label} (${e.uid}): ${err.message.slice(0, 170)}`);
    }
  }

  // the thin-arch block becomes the second child of the Standard chapter,
  // straight after the four cards
  try {
    const r = await callJson('site_insert_html',
      { parentId: 'ls3pGs9sTSjefWpOaHw50', index: 1, html: THIN_ARCH });
    if (r && typeof r.text === 'string' && !/ok/i.test(r.text)) throw new Error(r.text.slice(0, 150));
    ok++;
    console.log('  thin-arch block        inserted into ls3pGs9sTSjefWpOaHw50[1]');
  } catch (err) {
    problems.push(`thin-arch insert: ${err.message.slice(0, 170)}`);
  }

  console.log(`\n${ok}/${EDITS.length + 1} applied`);
  if (problems.length) { console.log('\nproblems:'); for (const p of problems) console.log('  ' + p); }
}
