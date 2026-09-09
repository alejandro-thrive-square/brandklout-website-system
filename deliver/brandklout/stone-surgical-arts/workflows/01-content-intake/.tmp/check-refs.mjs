/* Every reference cited in blog-data.mjs has to resolve. Checked before the
 * copy is written, so nothing gets cited that cannot be linked. */
const URLS = [
  // ASPS — procedures
  'https://www.plasticsurgery.org/cosmetic-procedures',
  'https://www.plasticsurgery.org/patient-safety',
  'https://www.plasticsurgery.org/cosmetic-procedures/facelift',
  'https://www.plasticsurgery.org/cosmetic-procedures/neck-lift',
  'https://www.plasticsurgery.org/cosmetic-procedures/eyelid-surgery',
  'https://www.plasticsurgery.org/cosmetic-procedures/rhinoplasty',
  'https://www.plasticsurgery.org/cosmetic-procedures/liposuction',
  'https://www.plasticsurgery.org/cosmetic-procedures/dermal-fillers',
  'https://www.plasticsurgery.org/cosmetic-procedures/botulinum-toxin',
  'https://www.plasticsurgery.org/cosmetic-procedures/chin-surgery',
  'https://www.plasticsurgery.org/cosmetic-procedures/facial-implants',
  'https://www.plasticsurgery.org/cosmetic-procedures/chemical-peel',
  'https://www.plasticsurgery.org/cosmetic-procedures/laser-skin-resurfacing',
  'https://www.plasticsurgery.org/cosmetic-procedures/hair-transplant',
  'https://www.plasticsurgery.org/reconstructive-procedures',
  // FDA
  'https://www.fda.gov/medical-devices/aesthetic-cosmetic-devices/dermal-fillers-soft-tissue-fillers',
  'https://www.fda.gov/drugs/postmarket-drug-safety-information-patients-and-providers/botulinum-toxin-injectables-drug-safety-communication',
  'https://www.fda.gov/consumers/consumer-updates/fda-approves-new-drug-treatment-chronic-weight-management-first-2014',
  'https://www.fda.gov/drugs/postmarket-drug-safety-information-patients-and-providers/medications-containing-semaglutide-marketed-type-2-diabetes-or-weight-loss',
  'https://www.fda.gov/medical-devices/aesthetic-cosmetic-devices/laser-products-and-instruments',
  // AAOMS
  'https://myoms.org/what-we-do/wisdom-teeth-management/',
  'https://myoms.org/what-we-do/dental-implant-surgery/',
  'https://myoms.org/what-we-do/facial-injury-trauma-surgery/',
  'https://myoms.org/what-we-do/corrective-jaw-surgery/',
  'https://myoms.org/what-we-do/tmj-and-facial-pain/',
  'https://myoms.org/what-we-do/obstructive-sleep-apnea/',
  'https://myoms.org/what-we-do/oral-pathology/',
  'https://myoms.org/',
  // AAD
  'https://www.aad.org/public/diseases/acne/derm-treat/treat',
  'https://www.aad.org/public/diseases/acne',
  'https://www.aad.org/public/cosmetic/scars-stretch-marks/chemical-peels-overview',
  'https://www.aad.org/public/cosmetic/wrinkles/laser-resurfacing-overview',
  'https://www.aad.org/public/cosmetic/younger-look/microneedling-overview',
  // Sleep
  'https://www.nhlbi.nih.gov/health/sleep-apnea',
  'https://www.nhlbi.nih.gov/health/sleep-apnea/treatment',
  'https://sleepeducation.org/sleep-disorders/obstructive-sleep-apnea/',
  // Dental / ADA
  'https://www.mouthhealthy.org/all-topics-a-z/dental-emergencies',
  'https://www.ada.org/resources/ada-library/oral-health-topics/dental-implants',
  'https://www.mouthhealthy.org/all-topics-a-z/implants',
  // Misc
  'https://www.niddk.nih.gov/health-information/weight-management',
  'https://www.cdc.gov/healthy-weight-growth/about/index.html',
  'https://www.aao.org/eye-health/treatments/blepharoplasty-what-to-expect',
]

const results = []
await Promise.all(
  URLS.map(async (u) => {
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 20000)
      let r = await fetch(u, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' } })
      clearTimeout(t)
      results.push({ u, status: r.status, final: r.url !== u ? r.url : '' })
    } catch (e) {
      results.push({ u, status: 'ERR', final: String(e.name || e.message).slice(0, 40) })
    }
  })
)

results.sort((a, b) => String(a.status).localeCompare(String(b.status)) || a.u.localeCompare(b.u))
let ok = 0
for (const r of results) {
  const good = r.status === 200
  if (good) ok++
  console.log(`${good ? 'OK  ' : 'BAD '} ${String(r.status).padEnd(4)} ${r.u}${r.final ? '\n         -> ' + r.final : ''}`)
}
console.log(`\n${ok}/${results.length} usable`)
