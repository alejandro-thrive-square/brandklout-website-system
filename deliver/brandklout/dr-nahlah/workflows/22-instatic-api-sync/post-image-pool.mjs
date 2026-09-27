/**
 * post-image-pool.mjs — the hand-checked editorial pool, and the topic model.
 *
 * WHY AN ALLOWLIST. The library is 434 assets and a blocklist cannot be trusted
 * on it: alongside the obvious `*-before.jpg` / `*-after.jpg` pairs there are
 * bare numeric case files (`1.1.jpg`, `8.2.jpg`, `9-b4.jpg`), duplicate
 * uploads of the same picture, staff headshots, and named patient portraits
 * (`pt-yolanda.jpg`, `pt-barb.jpg`). Every one of those is the wrong thing to
 * put at the top of a general article: a specific patient's case photo on an
 * unrelated piece misrepresents the case, and a team headshot reads as though
 * the article is about that person.
 *
 * So the pool below is explicit. If a filename here stops existing, the picker
 * warns rather than silently dropping it.
 *
 * TOPIC ORDER MATTERS. `match` is tested top-down and the first hit wins, so
 * the specific topics (all-on-4, dentures, veneers) sit above the general
 * `implants` bucket — otherwise every title containing "dental implant" would
 * land in the general one, which is exactly what made a first attempt give 24
 * of 43 articles the same photograph.
 */

/**
 * MINIMUM WIDTH. A hero renders 16:9 at roughly 860px wide on a laptop, so a
 * source narrower than this is upscaled and visibly soft. The first pass ignored
 * this and put 26 of 43 articles on sub-1200px art -- including a 223x700 model
 * render cropped to a sliver and blown up four times. The topical 3D model PNGs
 * are the casualties: they are 500-800px product renders, right for an inline
 * diagram and wrong for a page-width header.
 *
 * What replaces them is the practice's OWN photography at 1600-2560px. It is
 * less literal -- a treatment room rather than a model of the thing named in the
 * title -- but it is real, on-brand, correctly sized, and already cleared for
 * marketing use. For a practice journal that trade is worth making.
 */
export const MIN_WIDTH = 1400

export const TOPICS = [
  {
    id: 'all-on-4',
    match: /all[- ]on[- ](4|four)|full[- ]arch|full[- ]mouth|whole mouth|arch/i,
    assets: ['arch_implants.jpg', 'patient_hero4.jpg', 'patient_hero5.jpg', 'pt-hero-4.jpg'],
    query: 'full arch dental implant prosthesis',
  },
  {
    id: 'dentures',
    match: /denture|dentures|snap[- ]on|removable|traditional teeth/i,
    assets: ['pt-hero-1.jpg', 'pt-hero-2.jpg'],
    query: 'implant supported denture dental',
  },
  {
    id: 'veneers',
    match: /veneer|porcelain|makeover|cosmetic|new smile|smile design/i,
    assets: ['luxury_smile.jpg', 'patient_hero2.jpg', 'patient_hero3.jpg'],
    query: 'porcelain veneers smile dentist',
  },
  {
    id: 'whitening',
    match: /whiten|stain|brighter|white smile/i,
    assets: ['whitening-procedure.jpg'],
    query: 'teeth whitening dental',
  },
  {
    id: 'sedation',
    match: /sedation|sedated|anxiet|anxious|nitrous|asleep|comfort/i,
    assets: ['sedation.jpg', 'sedation-patient.jpg', 'sedation-dentistry-patient.jpg'],
    query: 'dental sedation patient calm',
  },
  {
    id: 'crowns',
    match: /crown|bridge|cap/i,
    assets: ['lab.jpg', 'practice-space-4.jpg'],
    query: 'dental crown ceramic model',
  },
  {
    id: 'emergency',
    match: /emergenc|urgent|broken|knocked|abscess|toothache|pain/i,
    assets: ['office-outside.jpg'],
    query: 'dental emergency toothache',
  },
  {
    id: 'consultation',
    match: /consult|diagnos|x-?ray|scan|exam|first visit|appointment|plan|planning/i,
    assets: ['xray.png', 'patient_interaction_hero.jpg', 'patient_interaction3.jpg', 'pt-interaction.jpg'],
    query: 'dentist consulting patient xray',
  },
  {
    id: 'technology',
    match: /technolog|digital|guided|3d|advanced|innovat|revolutioni/i,
    assets: ['tech-hero.jpg', 'lab.jpg', 'img-full-width-dental-office-1.jpeg'],
    query: 'dental technology digital scanner',
  },
  {
    id: 'aftercare',
    match: /care|clean|maintain|maintenance|longevity|last|lifespan|complication|fail/i,
    assets: ['pt-interaction-3.jpg', 'patient_interaction5.jpg', 'patient-story.jpg', 'pt-interaction-5.jpg'],
    query: 'dental implant care checkup',
  },
  {
    id: 'cost',
    match: /cost|price|worth|afford|insurance|financ|invest/i,
    assets: ['office.jpg', 'office-hero.jpg'],
    query: 'dental clinic reception consultation',
  },
  {
    // The catch-all, and the largest pool: most of this blog is general implant
    // writing, so variety has to come from somewhere.
    id: 'implants',
    match: /.*/,
    assets: ['patient_hero.jpg', 'patient_heroo.jpg', 'pt-hero-3.jpg', 'homepage_hero.jpg',
      'practice-space-1.jpg', 'practice-space-2.jpg', 'practice-space-3.jpg',
      'practice-space-5.jpg', 'interior.jpg', 'office-wide.jpeg'],
    query: 'dental implant tooth model dentist',
  },
]

/** No asset may headline more than this many articles. */
export const MAX_USES = 2

export function topicFor (title) {
  for (const t of TOPICS) if (t.match.test(title)) return t
  return TOPICS[TOPICS.length - 1]
}
