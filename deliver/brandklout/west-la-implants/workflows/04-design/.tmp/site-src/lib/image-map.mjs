/* Image-to-copy map: the strict image review (08-qa, 2026-09-24) found ~120 placements whose photo
   did not show what the copy is about, or was too soft at 1440. Each row re-points ONE image inside
   ONE section of ONE rendered page:

     [page slug, section id, old file, new file, focal point?, alt?]

   - the section id is the rendered <section id="…"> (qa-fit's `section` column), so a photo used in
     two sections is only swapped where it was judged wrong
   - `stock-*.jpg` are licensed Freepik photos (03-graphic-resources/.tmp/stock/stock-ledger.json);
     real people and before/after results are never stock
   - alt omitted = the alt this file carries elsewhere on the FINISHED site (filled after every swap;
     Instatic keeps one alt per asset and the longest wins, so build.mjs also reports any photo that
     still carries two different alts)
   Journal heroes live in templates/blog.mjs (HERO) because the index card and the entry share them.
   BugHerd round 3 (workflows/21-instatic-upload/apply-bugherd-round3.mjs, 2026-10-08) re-pointed its
   slots in the page modules themselves; the eight rows those slots superseded are gone (all-on-4 steps,
   bone-grafting / failing-dental-implants / our-practice / tooth-extractions strip, financing /
   implant-cost / tooth-extractions arrival). */
/* neighbourhood strips: a verified photo of the place where one exists (Freepik titles name it);
   Brentwood, Century City and Culver City had none, so they show the practice's own front desk */
const HOOD_PHOTO = { 'beverly-hills': 'stock-hood-beverly-hills.jpg', 'santa-monica': 'stock-hood-santa-monica.jpg', westwood: 'stock-hood-westwood.jpg' }
const HOOD_ALT = { 'beverly-hills': 'A palm-lined street in Beverly Hills', 'santa-monica': 'The Santa Monica bluffs and Palisades Park above Pacific Coast Highway', westwood: 'Royce Hall on the UCLA campus in Westwood' }
const HOOD_POS = {"beverly-hills": "50% 45%", "santa-monica": "45% 30%", "westwood": "51% 48%"}

export const IMAGE_MAP = [
  ['accessibility', 'arrival', 'still-front-desk-handshake.jpg', 'using-laptop.jpg', '50% 50%', 'Using the website on a laptop'],
  ['all-on-4', 'strip', 'full-arch-model.jpg', 'jaw-bone-loss.jpg', '70% 50%', 'Illustration of bone loss in the jaw where teeth are missing'],
  ['all-on-4', 'strip', 'zirconia-model.jpg', 'periimplantitis-model.jpg', '50% 50%'],
  ['bone-grafting', 'arrival', 'bone-graft-model.jpg', 'stock-graft-hero.jpg', '45% 50%', 'Bone graft granules being packed into a tooth socket'],
  ['cosmetic-dentistry', 'arrival', 'veneer-patient.jpg', 'emily-makeover-after.jpg', '90% 50%', 'A patient smiling after her smile makeover'],
  ['cosmetic-dentistry', 'rail', 'whitening-patient.jpg', 'stock-cosmetic-whitening.jpg', '55% 55%', 'Professional teeth whitening in the chair'],
  ['cosmetic-dentistry', 'rail', 'implant-crown-model.jpg', 'stock-cosmetic-crown.jpg', '48% 50%', 'A porcelain crown being fitted'],
  ['cosmetic-dentistry', 'rail', 'hygienist-procedure.jpg', 'stock-cosmetic-bonding.jpg', '58% 60%', 'Tooth-coloured bonding set with a curing light'],
  ['cosmetic-dentistry', 'rail', 'patient-smiling.jpg', 'stock-perio-laser.jpg', '50% 50%', 'Laser treatment along the gum line'],
  ...[['beverly-hills', 'yomi-robot-surgical.jpg', '70% 50%'], ['brentwood', 'yomi-robot-surgical.jpg', '70% 50%'], ['century-city', 'yomi-robot-surgical.jpg', '70% 50%'],
      ['culver-city', 'still-emily-consult.jpg', '50% 50%'], ['santa-monica', 'still-emily-consult.jpg', '50% 50%'], ['westwood', 'still-emily-consult.jpg', '50% 50%']]
    .flatMap(([h, chair, pos]) => [
      [`dental-implants-${h}`, 'strip', 'practice-full.jpg', HOOD_PHOTO[h] || 'front-desk-receptionist.jpg', HOOD_POS[h] || '50% 40%', HOOD_ALT[h]],
      [`dental-implants-${h}`, 'strip', 'still-cbct-suite.jpg', chair, pos],
    ]),
  ['dental-implants-santa-monica', 'arrival', 'still-front-desk-handshake.jpg', 'yomi-robot-surgical.jpg', '70% 50%'],
  ['dental-implants-westwood', 'arrival', 'waiting-room.jpg', 'yomi-robot-surgical.jpg', '50% 45%'],
  ['dr-tony-barriere', 'strip', 'still-doctor-masked.jpg', 'barriere_dentalpatient_welcoming_westlaimplants3.jpg', '70% 50%', 'Dr. Barriere welcoming a patient'],
  ['failing-dental-implants', 'strip', 'three-single-implants.jpg', 'stock-failing-clean.jpg', '55% 45%', 'Cleaning along the gumline with a water flosser'],
  ['faq', 'arrival', 'emily-practice.jpg', 'still-emily-consult.jpg', '60% 20%'], // both faces in frame (BugHerd #22; the cover image is .still, no parallax)
  ['financing', 'strip', 'doctor-patient-2.jpg', 'doctor-patient-2.jpg', '30% 40%'],
  ['general-dentistry', 'arrival', 'patient-smiling.jpg', 'hygienist-procedure.jpg', '70% 50%', 'A hygiene visit at West LA Implants'],
  ['general-dentistry', 'strip', 'still-reception-neon.jpg', 'doctor-handshake.jpg', '70% 30%'],
  ['hybrid-dentures', 'steps', 'surgical-kit.jpg', 'still-cbct-suite.jpg'],
  ['hybrid-dentures', 'strip', 'implant-post-model.jpg', 'full-arch-model.jpg'],
  ['hybrid-dentures', 'strip', 'still-emily-consult.jpg', 'hygienist-procedure.jpg', '70% 50%', 'A hygiene visit at West LA Implants'],
  ['implant-cost', 'strip', 'patient-paying.jpg', 'still-emily-consult.jpg', '50% 50%'],
  ['implant-cost', 'strip', 'front-desk-emily.jpg', 'stock-cost-warranty.jpg', '55% 50%', 'Signing the written treatment plan'],
  ['implant-cost', 'strip', 'doctor-handshake.jpg', 'doctor-patient-2.jpg', '30% 40%'],
  ['implant-supported-dentures', 'arrival', 'denture-patient-renewed.jpg', 'dentures-patient-eating.jpg', '85% 50%'],
  ['implant-supported-dentures', 'strip', 'older-couple-smiling.jpg', 'stock-dentures-meal.jpg', '45% 45%', 'An older couple enjoying a meal together'],
  ['index', 'answer', 'still-doctor-masked.jpg', 'patient-under-sedation.jpg', '50% 50%', 'A patient resting comfortably under sedation'],
  ['index', 'answer', 'still-emily-mirror.jpg', 'stock-index-cosmetic.jpg', '40% 45%', 'A veneer shade guide held against a smile'],
  ['index', 'precision', 'still-cbct-suite.jpg', 'still-yomi-robot-team.jpg'],
  ['index', 'precision', 'barriere_dentalpractice_dentalimplant_westla2.jpg', 'yomi-technology.jpg'],
  ['missing-teeth', 'strip', 'older-couple-smiling.jpg', 'painful-dentures.jpg', '70% 50%', 'A denture wearer holding her jaw where a loose denture rubs'],
  ['periodontics', 'steps', 'practice-patient-3.jpg', 'barriere_dentalpractice_dentalimplant_westla2.jpg', '60% 50%', 'Dr. Barriere reviewing a scan on screen'], // the step: X-rays and images on screen
  ['periodontics', 'strip', 'still-doctor-xray-screen.jpg', 'stock-perio-laser.jpg', '52% 45%', 'Laser treatment along the gum line'],
  ['periodontics', 'strip', 'three-single-implants.jpg', 'bone-graft-model.jpg', '70% 50%'],
  ['referring-doctors', 'strip', 'surgical-kit.jpg', 'barriere_dentalpractice_dentalimplant_westla2.jpg', '60% 50%', 'Dr. Barriere reviewing a scan on screen'],
  ['sedation-dentistry', 'arrival', 'sedation-patient-smiling.jpg', 'stock-sedation-hero.jpg', '40% 40%', 'A relaxed patient under light sedation in the dental chair'],
  ['sedation-dentistry', 'strip', 'waiting-room.jpg', 'stock-sedation-comfort.jpg', '25% 45%', 'A patient resting in a reclined dental chair'],
  ['thank-you', 'arrival', 'still-doctor-patient-hug.jpg', 'front-desk-emily.jpg', '25% 50%'],
  ['tooth-extractions', 'steps', 'woman-tea.jpg', 'stock-extraction-aftercare.jpg', '66% 38%', 'Resting at home with a cold pack after an extraction'],
  ['financing', 'statement', 'front-desk-emily.jpg', 'using-laptop.jpg', null, ''],
  ['general-dentistry', 'statement', 'hygienist-procedure.jpg', 'dental-xray.png', null, ''],
  ['implant-supported-dentures', 'statement', 'dentures-patient-eating.jpg', 'painful-dentures.jpg', null, ''],
  ['cosmetic-dentistry', 'rail', 'emily-makeover.jpg', 'emily-makeover.jpg', '66% 45%'],
]

/* The alt a photo carries as an Instatic ASSET, where the page that captioned it no longer shows it:
   BugHerd round 3 replaced those placements, production kept the asset's alt, so every '__ALT__' (the ad
   pages, the rows above without an alt) must still resolve to it. build.mjs seeds its alt pass with these;
   the five new photographs carry the alts round 3 wrote onto their assets. */
export const ASSET_ALT = {
  'doctor-cosmetic.jpg': 'Dr. Barriere with a patient beside the in-house 3D printers',
  'doctor-explaining.jpg': 'Dr. Barriere explaining a case',
  'full-arch-model.jpg': 'A full-arch bridge on four implants',
  'michael-before-after.jpg': 'Michael smiling after his full mouth reconstruction',
  'still-leslie-smile-tablet.jpg': 'Leslie holding up a photo of her new full-arch smile',
  'patient-smile-portrait-1.jpg': 'A West LA Implants patient smiling after his treatment',
  'patient-smile-portrait-2.jpg': 'A West LA Implants patient smiling after her treatment',
  'patient-smile-portrait-3.jpg': 'A West LA Implants patient smiling after his implant treatment',
  'patient-smile-portrait-4.jpg': 'A West LA Implants patient smiling after her treatment',
  'patient-smile-portrait-5.jpg': 'A West LA Implants patient smiling after his treatment',
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')

/* apply the map to rendered pages in place; `alts` = { file: longest alt on the site } */
export function applyImageMap(pages, exists) {
  const misses = []
  for (const [slug, section, from, to, pos, alt] of IMAGE_MAP) {
    const p = pages.find((x) => x.slug === slug)
    if (!p) { misses.push(`${slug}: no such page`); continue }
    if (!exists(to)) { misses.push(`${slug}/${section}: ${to} not in media/img`); continue }
    const open = p.body.search(new RegExp(`<section[^>]*\\bid="${section}"`))
    if (open < 0) { misses.push(`${slug}: no section #${section}`); continue }
    const close = p.body.indexOf('</section>', open)
    let seg = p.body.slice(open, close)
    const re = new RegExp(`<img([^>]*?)src="/media/img/${from.replace(/[.]/g, '\\.')}"([^>]*)>`)
    if (!re.test(seg)) { misses.push(`${slug}/${section}: ${from} not found`); continue }
    seg = seg.replace(re, (_, a, b) => {
      let attrs = (a + b).replace(/\s*alt="[^"]*"/, '')
      // the row's focal point replaces the page's (fp- is the pre-Client-First name of object-position-)
      const cls = ((attrs.match(/class="([^"]*)"/) || [])[1] || '').split(/\s+/).filter((c) => c && !/^(fp|object-position)-\d+-\d+$/.test(c))
      if (pos) cls.push('object-position-' + pos.split(/\s+/).map((v) => Math.round(parseFloat(v) / 10) * 10).join('-'))
      attrs = attrs.replace(/\s*class="[^"]*"/, '')
      const a2 = alt ?? '__ALT__' // filled from the finished pages by build.mjs, so a swapped-out caption can never win
      return `<img${cls.length ? ` class="${cls.join(' ')}"` : ''} src="/media/img/${to}" alt="${esc(a2)}"${attrs.replace(/^\s*/, ' ').replace(/\s+$/, '')}>`
    })
    p.body = p.body.slice(0, open) + seg + p.body.slice(close)
    if (section === 'arrival' && p.image === `/media/img/${from}`) p.image = `/media/img/${to}`
  }
  return misses
}
