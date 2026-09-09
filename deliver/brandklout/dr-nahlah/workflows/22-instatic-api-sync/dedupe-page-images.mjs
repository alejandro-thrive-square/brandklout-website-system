#!/usr/bin/env node
/**
 * dedupe-page-images.mjs — BugHerd pin #11, the fix. DRAFT ONLY, NEVER PUBLISHES.
 *
 *   node dedupe-page-images.mjs            # resolve + contact sheet, writes NOTHING
 *   node dedupe-page-images.mjs --apply    # upload the Freepik picks, then patch the pages
 *
 * Run `audit-page-images.mjs` first — this reads its output and refuses to run
 * against a stale one.
 *
 * ## What it changes, and what it deliberately does not
 *
 * The client: "make sure not to repeat images on the same page… if the image has
 * a round radius to it, pick a new one from the Magnific API." The audit found
 * 37 same-page repeats over 19 pages and 9 round-cropped source images. Every
 * one of them is listed in PLAN below, by node id, with the slot's own copy and
 * the reason for the choice.
 *
 * Three rules decided which INSTANCE moves, and they are worth keeping:
 *
 *  1. **A case photograph's home is the before/after gallery.** Where a
 *     `case-*.jpg` appears both in `.pk-ba` and in a process card, the gallery
 *     instance stays and the card is re-shot. Breaking a before/after pair to
 *     satisfy a de-duplication rule would be a worse page.
 *  2. **A hero outranks a card.** `.ph-bg` and `.mband-fig` are the page's
 *     defining images; a `.pk-card-fig` in a four-up grid is not.
 *  3. **Library first, Freepik second** — the client's own ordering, set on pin
 *     #7. Where the practice's own photography can fill the slot it does, and
 *     where it cannot the query is a CURATED PHRASE for the slot's topic, never
 *     the page title. Building a query from a title is what put one photograph
 *     on 24 of 43 articles last week.
 *
 * ## The rounded crops
 *
 * Nine source files arrive already cropped into a circle (verified from the
 * pixels by `audit-round-corners.mjs`, not from their names). Two things follow:
 *
 *  - Some sit in `.pk-card-fig-pad` / `.mz-plain`, variants whose whole job is
 *    `object-fit: contain` on a flat card — they exist BECAUSE the art was a
 *    cut-out. Where the replacement is a photograph the variant class comes off
 *    too, so the photo fills the frame like its neighbours. Where the tile
 *    genuinely holds a MODEL RENDER among other model renders the class stays
 *    and a white-background render is sourced, because dropping it would leave
 *    one full-bleed photo in a row of padded models.
 *  - `team-hana.png` is NOT replaced. It is a real member of staff, circularly
 *    cropped. Swapping a named employee's face for stock is not a fix; the
 *    practice needs to supply the square original. Recorded in the report.
 *
 * ## Concurrency
 *
 * Three other agents are writing this same document. So: every page edit goes in
 * ONE `PUT /site-document`, the seq is taken immediately before it, and a 409
 * re-reads and retries rather than forcing. Media uploads are batched first and
 * on purpose — each one bumps the shell seq by about six.
 *
 * ## `seoTitle` / `seoDescription`
 *
 * `pageToCells()` does not carry them, so ANY page write through this endpoint
 * drops them — 33 of the 37 pages have them. They are captured before the write
 * and re-applied afterwards through `PATCH /data/rows/:id`, which does merge.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, getPages, getSite, toChangedPage, requestForm, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const BUG = join(HERE, '..', '05-design-revisions', '.tmp', 'bugherd')
const OUT = join(HERE, '.tmp', 'pin11')
const APPLY = process.argv.includes('--apply')

const KEY = process.env.MAGNIFIC
if (!KEY) { console.error('MAGNIFIC is not set in the repo-root .env'); process.exit(1) }

// ── the Freepik searches ───────────────────────────────────────────────────
/**
 * One entry per DISTINCT picture to license. Several page slots may share one —
 * cross-page reuse is explicitly out of scope for this pin ("on the same page"),
 * and sharing halves the download quota this costs.
 *
 * `q` is a curated phrase for the SLOT, never a page title. `model: true` means
 * the slot is a padded product tile, so the search is biased to renders.
 */
const FP = {
  xray:        { q: 'panoramic dental x-ray radiograph diagnosis',        must: /x.?ray|radiograph|panoram/i },
  inlay:       { q: 'ceramic dental inlay restoration tooth',             must: /inlay|overlay|restorat/i },
  bite:        { q: 'dentist explaining bite occlusion to patient',       must: /occlusion|bite|explain/i },
  // The literal search for a provisional bridge returned an open surgical field.
  // The card promises you go home with teeth the same day; a patient who has just
  // got them says that without the blood.
  provisional: { q: 'happy patient smiling after dental implant treatment',   must: /happy|satisfied|smil|delighted|jolly/i, avoid: /girl|child|kid/i },
  prep:        { q: 'ultra thin veneers and crowns white background',     must: /veneer/i, avoid: /technician|black background/i },
  stained:     { q: 'stained yellow teeth before whitening close up',     must: /whiten|stain|yellow/i },
  brushing:    { q: 'woman brushing teeth bathroom mirror',               must: /brush/i },
  shade:       { q: 'dental shade guide tooth colour selection',          must: /shade|sample|colou?r|compar/i },
  milling:     { q: 'dental technician working milling laboratory',       must: /milling/i },
  iv:          { q: 'dental sedation anesthesiologist monitoring patient',must: /anesthe|sedat/i, avoid: /child|little girl|boy|cosmetolog|paramedic|massage/i },
  calm:        { q: 'relaxed patient reclining dental chair',             must: /dental|dentist|chair/i },
  nitrous:     { q: 'nitrous oxide dental sedation',                      must: /sedat|inhalation|nitrous/i, avoid: /child|girl|boy|hyperbaric/i },
  oral:        { q: 'patient taking medication tablet before appointment',must: /pill|medicat|tablet|capsul/i, avoid: /gargl|rins/i },
  insurance:   { q: 'patient filling dental insurance paperwork',         must: /dental reception|dental paperwork/i },
  reception:   { q: 'dental clinic waiting area interior',                must: /dental clinic|dental office/i, avoid: /quot|skull|3d/i },
  surgery:     { q: 'dental implant surgery operating close up',          must: /surg|implant|operat/i },
  teaching:    { q: 'dentist lecturing continuing education seminar',     must: /present|lectur|semin|teach|educat|technique/i },
  cbct:        { q: 'dentist showing dental scan screen patient',         must: /showing dental scan|results of the scan|scan to a patient/i },
  // 'white background' is in the query AND in the sieve on purpose: card 01 sits
  // in an unpadded .pk-card-fig, so whatever backdrop the render carries becomes
  // the whole card. The first pick was a clean render on hot pink.
  single:      { q: 'dental implant tooth isolated white background',     must: /implant/i, avoid: /hand|toothbrush|icon set|tube/i },
  bridge3:     { q: 'implant supported dental bridge model white background', must: /bridge/i, model: true },
  restoration: { q: 'dental implant crown restoration model white background', must: /restorat|crown|prosthe/i, model: true },
  overdenture: { q: 'implant overdenture model',                          must: /overdenture|denture/i, avoid: /woman|lady|senior|smil/i, model: true },
  fullarch:    { q: 'full arch implant bridge prosthesis model',          must: /implant|prosthe|jaw|arch/i, avoid: /woman|holds|holding|surprised|joyful|happy/i, model: true },
  denture:     { q: 'complete acrylic denture upper lower white background', must: /complete denture|complete upper and lower/i, model: true },
  calculator:  { q: 'calculator and pen financial planning desk',         must: /calculat/i },
  payment:     { q: 'credit card payment at reception counter',           must: /payment|card|pay/i },
  estimate:    { q: 'doctor and patient writing on documents at desk',    must: /document|paperwork|writing|form/i, avoid: /coffee|pills/i },
  crownfig:    { q: 'ceramic dental crown restoration close up',          must: /crown/i, avoid: /cups?|zircon/i },
  zirconia:    { q: 'zirconia dental crown laboratory',                   must: /zircon/i },
  bridgefig:   { q: 'dental bridge plaster model three crowns',           must: /dental bridge/i },
  secondopinion: { q: 'dentist reviewing treatment plan with patient at desk', must: /plan|discuss|explain|consult|treatment/i },
}

// ── the plan ───────────────────────────────────────────────────────────────
/**
 * `expect` is the filename that MUST currently be at that node. It is asserted
 * before anything is written: node ids are stable but not guaranteed, and three
 * other agents are editing this document right now.
 *
 * `dropClass` removes a variant class from the image's PARENT figure. See the
 * header for when that is right and when it is not.
 */
const PLAN = [
  // ── /emergency-dentistry ────────────────────────────────────────────────
  { page: 'emergency-dentistry', node: '7pHtlf2CHEHIWsCcDRyuo', expect: 'tech-advanced.jpg', fp: 'xray',
    slot: '#medical mosaic — "Diagnosed fast"',
    why: 'Twin of the #expect split image. The mosaic tile is captioned "Diagnosed fast", so it takes the radiograph and the split keeps the arrival photo.' },

  // ── /cosmetic-dentistry ─────────────────────────────────────────────────
  { page: 'cosmetic-dentistry', node: 'ShD_pnFug5jZ4sKfWar4L', expect: 'dental-crowns-model-2.jpg', fp: 'inlay',
    slot: '#treatments card 05 — "Inlays & onlays"',
    why: 'Byte-identical to card 02\'s crown-model.jpg. Card 02 is the crowns card and keeps it; card 05 is about inlays and onlays and had never had its own picture.' },
  { page: 'cosmetic-dentistry', node: 'XYm7MDYy7MMLjnpFZyXOI', expect: 'consult-discussion.jpg', fp: 'bite',
    slot: '#treatments card 06 — "And knowing when to stop"',
    why: 'Same photo as the #evaluation split below it. The split is the evaluation section and keeps it; this card is about a bad bite being functional, not cosmetic.' },

  // ── /all-on-4 ───────────────────────────────────────────────────────────
  { page: 'all-on-4', node: 'hlU04_-NosrjR7RM40jMD', expect: 'case-ao4-double-1-after.jpg', lib: 'case-ao4-double-4-after.jpg',
    slot: '#why mosaic — "One day later"',
    why: 'Case 1 appeared three times. Its home is the before/after grid; the mosaic takes a different real case from the same series so the tile stays the practice\'s own work.' },
  { page: 'all-on-4', node: 'IHz56w-XNNn06vf3nCHre', expect: 'case-ao4-double-1-before.jpg', lib: 'case-ao4-double-4-before.jpg',
    slot: '#why mosaic — "Where it starts"',
    why: 'Pairs with the tile above: the mosaic now tells one consistent case, and the gallery keeps case 1 intact.' },
  { page: 'all-on-4', node: 'Yl8OcRCzK5cvbWC04BP3J', expect: 'case-ao4-double-1-after.jpg', fp: 'provisional',
    slot: '#assurances card — "Same day"',
    why: 'Third use of case 1. A third result photograph would have read as repetition of kind; the promise here is the provisional fitted the same day.' },
  { page: 'all-on-4', node: 'bA1K2WF3Yx-MZ20shax3H', expect: 'consult.jpg', lib: 'pt-interaction-3.jpg',
    slot: '#assurances card — "Every 6 mo"',
    why: 'Twin of the #steps card 03 image. Card 03 is the consultation-shaped one; a six-month review is a patient-and-clinician interaction.' },
  { page: 'all-on-4', node: '6ZtUxYLABoaZ8z56vTg_-', expect: 'case-ao4-single-2-after.jpg', lib: 'arch_implants.jpg',
    slot: '#steps card 04 — "The zirconia final"',
    why: 'Repeat of the gallery photo. The card is about the definitive prosthesis, which is what the arch model shows.' },
  { page: 'all-on-4', node: '-OaO6g7dvcSrIzxR8jWeg', expect: 'case-ao4-double-9-after.jpg', lib: 'case-ao4-double-12-after.jpg',
    slot: '#band — "Transformation day"',
    why: 'The band and the gallery held the same case. The gallery keeps case 9 (its before is beside it); the band takes a different real result.' },

  // ── /about ──────────────────────────────────────────────────────────────
  { page: 'about', node: 'Fw-oou1LElLoVk_84vQYs', expect: 'tech-hero.jpg', lib: '8L6A7479.jpg',
    slot: '#difference card 04 — "One building, start to finish"',
    why: 'tech-hero.jpg IS lab.jpg — one file, two names. The #home mosaic keeps it for "A lab in each practice"; this card is about scan-to-fabrication, which is the practice\'s own intraoral scanner shot.' },

  // ── /veneers ────────────────────────────────────────────────────────────
  { page: 'veneers', node: '2CBUyuzQwN90HmyE7yIR_', expect: 'veneers-procedure.png', lib: 'luxury_smile.jpg',
    slot: '#hero background',
    why: 'A circular crop was being used as a full-bleed hero background — the mask was visible. Replaced with a landscape smile portrait whose subject sits right of the headline.' },
  { page: 'veneers', node: 'NJGzTcTkYf2ctwkZuh6Ua', expect: 'veneers-procedure.png', fp: 'prep', dropClass: 'pk-card-fig-pad',
    slot: '#process card 02 — "Minimally invasive prep"',
    why: 'Second use of the same round crop. The pad variant existed only to letterbox that cut-out; cards 01, 03 and 04 are full-bleed photos, so this one now matches them.' },
  { page: 'veneers', node: 'xNpw6k3L6CE-D1OmTzE6i', expect: 'case-veneers-5-after.jpg', lib: 'case-veneers-4-after.jpg',
    slot: '#process card 04 — "Fit & bond"',
    why: 'Case 5 was on the page twice. #candidacy is the larger, earlier use and keeps it; the card takes a different real veneers result.' },
  { page: 'veneers', node: 'lb448ZPUdgahJwhEE05cY', expect: 'case-veneers-7-after.jpg', lib: 'case-veneers-6-after.jpg',
    slot: '#band — "Under a millimetre"',
    why: 'The band repeated the gallery. The gallery keeps case 7 beside its before; the band takes case 6.' },

  // ── /teeth-whitening ────────────────────────────────────────────────────
  { page: 'teeth-whitening', node: 'Un0PMhoKj4gssYXEzYR-V', expect: 'case-whitening-1-before.jpg', fp: 'stained',
    slot: '#advantage mosaic — "Where most people start"',
    why: 'The mosaic was reusing both halves of gallery case 1. Only two whitening cases exist, so the second would just move the repeat; a generic stained-teeth close-up is what the caption actually describes.' },
  { page: 'teeth-whitening', node: 'CvmqO8U-fDUHsMqSl59JG', expect: 'case-whitening-1-after.jpg', fp: 'shade',
    slot: '#advantage mosaic — "A shade you choose"',
    why: 'Same reason. "A shade you choose" is a shade guide, which is more literal than the result photo it replaces.' },
  { page: 'teeth-whitening', node: '07KV90HOg3rRSeK28t2MU', expect: 'whitening-procedure.jpg', fp: 'brushing',
    slot: '#keeping split — "Afterwards"',
    why: 'The in-chair procedure photo belongs on the mosaic tile captioned "About one hour". This section is about the three habits that keep the result.' },

  // ── /smile-makeover  (the pinned page) ──────────────────────────────────
  { page: 'smile-makeover', node: 'onzd7fJ7UhMpbItQgFPUx', expect: 'tech-hero.jpg', lib: '8L6A7479.jpg',
    slot: '#process card 03 — "The design"',
    why: 'THE PINNED DEFECT. Cards 03 and 04 and the #approach mosaic were one lab photograph three times, under two filenames. The mosaic keeps it ("Built in the building"); card 03 is about the design being settled before preparation, which is the scan on screen.' },
  { page: 'smile-makeover', node: 'LjfMxUlTRbh8viI0BPcrs', expect: 'lab.jpg', fp: 'milling',
    slot: '#process card 04 — "Build it"',
    why: 'Third instance of the same photograph. The card is about the in-house lab adjusting shade and fit, so it takes the milling machine rather than the bench again.' },
  { page: 'smile-makeover', node: 'a1a1UUbOAuHshoSFJGnat', expect: 'smile_makeover.png', lib: '8L6A7602.jpg', dropClass: 'mz-plain',
    slot: '#approach mosaic — circular crop',
    why: 'Round-radius offender, and the fix costs nothing: 8L6A7602.jpg is the SAME photograph uncropped, at 2560x1707. The other three tiles in this mosaic are full-bleed, so mz-plain comes off.' },

  // ── /sedation-dentistry ─────────────────────────────────────────────────
  { page: 'sedation-dentistry', node: 'm73-r6VxldENiDfFI1qzE', expect: 'sedation-dentistry-patient.jpg', fp: 'iv',
    slot: '#options card — "Strongest / IV sedation"',
    why: 'The hero, this card and the band were one file under three names. The hero keeps it; this card is specifically about IV sedation.' },
  { page: 'sedation-dentistry', node: 'Ag-4UKgaVQqvM4JvadRF5', expect: 'sedation.jpg', fp: 'calm',
    slot: '#band — "One sitting"',
    why: 'Third instance of the same file. The band promises a whole case in one sitting, so it takes a calm, reclining patient rather than the hero again.' },
  { page: 'sedation-dentistry', node: 'SkLt5i5j1oxTgBAO3JGU_', expect: 'sedation-nitrous.png', fp: 'nitrous', dropClass: 'pk-card-fig-pad',
    slot: '#options card — "Mildest / Nitrous oxide"',
    why: 'Circular crop. With all three option cards now holding photographs, the pad variant comes off so the row is consistent.' },
  { page: 'sedation-dentistry', node: 'SUg1bZhsg6L0WMpx1Stdb', expect: 'sedation-oral.png', fp: 'oral', dropClass: 'pk-card-fig-pad',
    slot: '#options card — "Deeper / Oral sedation"',
    why: 'Rounded-square crop, same section, same reasoning.' },

  // ── /patient-center ─────────────────────────────────────────────────────
  { page: 'patient-center', node: 'XnxW9bAxAq9n3aEW20qg0', expect: 'pt-interaction.jpg', lib: 'patient_interaction3.jpg',
    slot: '#visit card 01 — "A warm welcome"',
    why: 'Repeated the hero. The card is about somebody being there the moment you step inside, and the library has exactly that: a front-desk greeting, previously unused.' },
  { page: 'patient-center', node: 'vdzGUe_v7Cc3ArKvokR6V', expect: 'financing-card.jpg', fp: 'insurance',
    slot: '#welcome mosaic — "Most PPOs accepted"',
    why: 'Repeated the #affordable split. The split is the affordability section and keeps it; this tile is specifically about plans being accepted.' },

  // ── /our-facility ───────────────────────────────────────────────────────
  { page: 'our-facility', node: '1DrY8PcmeQUVpkeGJzTXa', expect: 'tech-hero.jpg', fp: 'milling',
    slot: '#technology card 05 — "Milling machine"',
    why: 'Card 04 is "In-house digital lab" and keeps the bench photo; card 05 is captioned "Milling machine" and had the same picture under its other filename.' },
  { page: 'our-facility', node: '8VTFY7aJrfSf2XbBgPR9E', expect: 'tech-hero.jpg', lib: '8L6A7479.jpg',
    slot: '#why split — "The whole chain, in one building"',
    why: 'Third instance. The section is about holding scan-plan-mill end to end, which is the scanner-and-scan photograph.' },
  { page: 'our-facility', node: 'pf48cLlrf8mPaZpELwh_t', expect: 'office-hero.jpg', fp: 'reception',
    slot: '#tour — "Reception"',
    why: 'Repeated the hero on the same page. The tile is labelled Reception; the library\'s other interiors are operatories and exteriors, and its one reception shot carries a former practice\'s signage.' },

  // ── /oral-surgery ───────────────────────────────────────────────────────
  { page: 'oral-surgery', node: 'x2wzbz_KGIGNb6NAOyvfR', expect: 'tech-hero.jpg', lib: '8L6A7479.jpg',
    slot: '#one-place mosaic — "Scanned first"',
    why: 'Two tiles in one mosaic held the same file under two names. "Restored in-house" keeps the lab bench; "Scanned first" takes the intraoral scanner.' },

  // ── /meet-dr-nahlah ─────────────────────────────────────────────────────
  { page: 'meet-dr-nahlah', node: 'Vt1BYfqKgc8X1ZAyEsfuk', expect: 'dr-with-patient.jpg', fp: 'surgery',
    slot: '#specialty mosaic — "18,000+ implants placed"',
    why: 'Repeated the hero. The tile is a count of implants placed, so it takes the surgery rather than the portrait a second time.' },
  { page: 'meet-dr-nahlah', node: 'RHJnOc9CXTBG3L3uwj7JL', expect: 'dr-award.jpg', fp: 'teaching',
    slot: '#teaching split — "Mentor & Educator"',
    why: 'The award photograph belongs on the "Since 2003 / In practice" tile it also occupied. This section is about him teaching the dentists who refer to him.' },

  // ── /index  (coordinate with pin #8 — #services is theirs, this is not) ──
  { page: 'index', node: 'QWE7RAi1LGAPQsQhShUj4', expect: 'case2-before.jpg', lib: 'case-ao4-double-2-before.jpg',
    slot: 'Chapter 01 #realityImg',
    why: 'Case 2\'s before was both the Chapter 01 image and one half of the Chapter 04 comparison slider. The slider needs its pair intact, so Chapter 01 takes a different real before.' },
  { page: 'index', node: 'opGWBWrurdecOO9mckl2b', expect: 'case1-after.jpg', lib: '8L6A7479.jpg',
    slot: 'Chapter 05 path card 02 — "Digital Smile Design"',
    why: 'Repeated the slider. The card is about the teeth being designed before a single implant is placed, which is literally the scan on the screen.' },
  { page: 'index', node: 'cRuOiEXdSxjXa-vv026-L', expect: 'case2-after.jpg', lib: 'case-ao4-double-2-after.jpg',
    slot: 'Chapter 05 path card 04 — "Final Restoration"',
    why: 'Repeated the slider. Takes the after of the same case now used in Chapter 01, so the page opens and closes on one story.' },
  { page: 'index', node: 'bdPnSLi8Ter0gtYEWExGC', expect: 'veneers-procedure.png', lib: 'case-veneers-2-after.jpg',
    slot: '#stdGrid card',
    why: 'Round-radius offender used as a full-bleed .std-card background, where the circular mask was plainly visible against the card. Its three neighbours are photographs.' },

  // ── /implant-supported-dentures ─────────────────────────────────────────
  { page: 'implant-supported-dentures', node: 'kbO0SPpFztuISsYRwdB3y', expect: 'case-fullarch-4-after.jpg', lib: 'arch_implants.jpg',
    slot: '#process card 04 — "Final teeth"',
    why: 'Repeated the gallery, which keeps case 4 beside its before. The card is about the final set being crafted and attached.' },
  { page: 'implant-supported-dentures', node: 'tykAvwX_KA7Ic5XItX_rh', expect: 'dentures-model.png', fp: 'denture',
    slot: '#options mosaic — traditional denture tile',
    why: 'Circular crop. mz-plain stays: all three tiles in this row are model renders against a flat card, and dropping it from one would leave a single full-bleed photo among padded models.' },
  { page: 'implant-supported-dentures', node: 'ooyx7O1w0IrQ3Wkqs5Nkj', expect: 'implant-supported-denture.png', fp: 'overdenture',
    slot: '#options mosaic — overdenture tile',
    why: 'Circular crop, same row, same reasoning.' },
  { page: 'implant-supported-dentures', node: 'RYq35XU5ah-vgQ2Ga8J5G', expect: 'full-arch-dental-implants.png', fp: 'fullarch',
    slot: '#options mosaic — full-arch tile',
    why: 'Circular crop, same row, same reasoning.' },
  { page: 'implant-supported-dentures', node: 'xtueWW-DOttL7AFb6VGzT', expect: 'cost-calculating.png', fp: 'calculator',
    slot: '#cost split — "Affording It"',
    why: 'A circular crop inside a 4:3 .sp-fig with object-fit: cover, so the arc was being cut through. Replaced with a rectangular photograph of the same subject.' },

  // ── /implant-cost ───────────────────────────────────────────────────────
  { page: 'implant-cost', node: 'U5EdzPcYHQ-POY3gcesZW', expect: 'consult-discussion.jpg', fp: 'secondopinion',
    slot: '#drivers card — "Bring another quote"',
    why: 'Repeated the #insurance split, which keeps it. The obvious library answer, xray-consult.jpg, is already elsewhere on this page — the simulation caught it — so the card takes a plan-review photograph instead.' },

  // ── /financing ──────────────────────────────────────────────────────────
  { page: 'financing', node: '5Vw6wU9F1p4zQagFBTL9b', expect: 'financing-card.jpg', fp: 'payment',
    slot: '#why mosaic — "Five ways to pay"',
    why: 'Repeated the #payment split, which is the section about accepted forms and keeps it.' },
  { page: 'financing', node: '9-2Rfn9X_C_pF19i5BPAE', expect: 'consult-discussion.jpg', fp: 'insurance',
    slot: '#why mosaic — "Most PPO plans"',
    why: 'Repeated the #no-insurance split, which keeps it. This tile is about plans being accepted.' },
  { page: 'financing', node: 'sGqXfl7_LuIycxTvEx7aa', expect: 'cost-calculating.png', fp: 'estimate', dropClass: 'mz-plain',
    slot: '#why mosaic — "Written estimate"',
    why: 'Circular crop, and the odd one out: the other three tiles in this mosaic are full-bleed photographs, so mz-plain comes off with it.' },

  // ── /doctor-referral ────────────────────────────────────────────────────
  { page: 'doctor-referral', node: '_ROEc4-BAkLJV3qDLd-Dv', expect: 'tech-hero.jpg', fp: 'cbct',
    slot: '#capability card 01 — "Diagnosis & planning"',
    why: 'Cards 01 and 03 and the #study-club split were one file under two names. Card 03 is the prosthetic/laboratory card and keeps the bench; card 01 is CBCT and scan planning.' },
  { page: 'doctor-referral', node: '4Q9I8DwGxxvO6f1soWULs', expect: 'tech-hero.jpg', fp: 'teaching',
    slot: '#study-club split — "Continuing Education"',
    why: 'Third instance. The section is the Tysons Study Club he founded, which is a teaching room, not a laboratory.' },

  // ── /dental-implants ────────────────────────────────────────────────────
  { page: 'dental-implants', node: 'l9K6Z9xGN5z59uo6nVtUK', expect: 'dental-implant-crown-model.jpg', fp: 'single',
    slot: '#options card 01 — "Single Implant"',
    why: 'Repeated the #anatomy tile "The abutment", which keeps it. The card needs a single implant and crown of its own.' },
  { page: 'dental-implants', node: 'zGyfqm0SoP80jSgQVjOdd', expect: 'multi-implant-model.png', fp: 'bridge3',
    slot: '#options card 02 — "Implant-Supported Bridge"',
    why: 'Byte-identical to the #anatomy tile "The restoration" under a different filename. The card is about two implants carrying a span.' },
  { page: 'dental-implants', node: 'ZaD_ahHoGlKvCkiwUHCmb', expect: 'multiple-dental-implant-model.png', fp: 'restoration',
    slot: '#anatomy mosaic — "The restoration"',
    why: 'The other half of that pair, and itself a circular crop. mz-plain stays: this row is three padded model tiles.' },
  { page: 'dental-implants', node: 'W4EuItP44uxkAMqOyU964', expect: 'implant-supported-denture.png', fp: 'overdenture',
    slot: '#options card 03 — "Implant-Supported Dentures"',
    why: 'Circular crop. Shares the licensed render with the same subject on /implant-supported-dentures — different pages, which is outside this pin\'s rule and saves a download.' },
  { page: 'dental-implants', node: 'jVdTzIO_pDUvu64xECPEb', expect: 'full-arch-dental-implants.png', fp: 'fullarch',
    slot: '#options card 04 — "Full-Arch Implants"',
    why: 'Circular crop, same reasoning.' },
  { page: 'dental-implants', node: 'qA8mryZz1FiooFmi9TsUn', expect: 'case-ao4-double-3-after.jpg', lib: 'case-ao4-double-5-after.jpg',
    slot: '#process card 04',
    why: 'Repeated the gallery, which keeps case 3 beside its before.' },

  // ── /crowns-and-bridges ─────────────────────────────────────────────────
  { page: 'crowns-and-bridges', node: 'xEkqU69-yGh5RKDkfsQXx', expect: 'crown-model.jpg', fp: 'crownfig',
    slot: '#crowns split — "Crowns"',
    why: 'crown-model.jpg and dental-crowns-model-2.jpg are one file, and between them they filled three slots. The #whole mosaic tile captioned "Crown" keeps it, because that tile has to show a crown.' },
  { page: 'crowns-and-bridges', node: '9A1xiJxUZmnhScny_sSTT', expect: 'dental-crowns-model-2.jpg', fp: 'zirconia',
    slot: '#whole mosaic — third tile',
    why: 'The duplicate upload. A crown in the laboratory rather than a second copy of the same model shot.' },
  { page: 'crowns-and-bridges', node: 'tCmLxHzh4duY7huMLIVfO', expect: 'bridge-model.jpg', fp: 'bridgefig',
    slot: '#bridges split — "Bridges"',
    why: 'The mosaic tile captioned "Bridge" keeps bridge-model.jpg for the same reason as the crown tile; the section gets its own.' },
  { page: 'crowns-and-bridges', node: 'zUJjv0nNpk2elWZEE8kKv', expect: 'cost-calculating.png', fp: 'calculator',
    slot: '#cost split — "Cost"',
    why: 'The same circular crop cut through by a 4:3 cover frame as on /implant-supported-dentures. Shares the replacement.' },
]

/** Round-radius findings we are deliberately NOT changing, and why. */
const KEPT = [
  { file: 'team-hana.png', where: '/our-team, .tm-shot',
    why: 'A named member of staff, circularly cropped. Replacing a real employee with stock photography would be a worse error than the crop. The practice needs to supply the square original — flagged for the client.' },
  { file: 'allon4.png', where: '/all-on-4',
    why: 'The corner detector flagged it; the pixels say otherwise. It is a 3D render whose translucent blue backdrop happens to reach all four edge midpoints. Not a rounded crop, so it stays.' },
]

// ── load the audit ─────────────────────────────────────────────────────────
const auditPath = join(BUG, 'image-audit.before.json')
if (!existsSync(auditPath)) { console.error(`run audit-page-images.mjs first — ${auditPath} is missing`); process.exit(1) }
const audit = JSON.parse(readFileSync(auditPath, 'utf8'))

const { assets } = await api('GET', '/admin/api/cms/media')
const { site } = await getSite()
const ruleByName = new Map()
for (const r of Object.values(site.styleRules ?? {})) if (r.kind === 'class') ruleByName.set(r.name, r.id)
const pageRows = (await getPages()).rows
const rowBySlug = new Map(pageRows.map((r) => [r.slug, r]))

/** Largest upload of a given filename — the library holds several sizes. */
const libByName = new Map()
for (const a of assets) {
  if (!a.publicPath || !/^image\//.test(a.mimeType ?? '')) continue
  const prev = libByName.get(a.filename)
  if (!prev || (a.width ?? 0) * (a.height ?? 0) > (prev.width ?? 0) * (prev.height ?? 0)) libByName.set(a.filename, a)
}

// ── assert the plan against the live draft, before anything moves ─────────
const problems = []
for (const p of PLAN) {
  const row = rowBySlug.get(p.page)
  if (!row) { problems.push(`${p.page}: page not found`); continue }
  const node = row.cells?.body?.nodes?.[p.node]
  if (!node) { problems.push(`${p.page}/${p.node}: node not found`); continue }
  if (node.moduleId !== 'base.image') { problems.push(`${p.page}/${p.node}: moduleId is ${node.moduleId}`); continue }
  const cur = (node.props?.src ?? '').replace(/^\/uploads\/[A-Za-z0-9_-]{21}-/, '')
  if (cur !== p.expect) { problems.push(`${p.page}/${p.node}: holds "${cur}", plan expects "${p.expect}"`); continue }
  if (p.lib && !libByName.has(p.lib)) problems.push(`${p.page}/${p.node}: library asset "${p.lib}" not found`)
  if (p.fp && !FP[p.fp]) problems.push(`${p.page}/${p.node}: unknown search key "${p.fp}"`)
  if (p.dropClass) {
    const parent = row.cells.body.nodes[node.parentId]
    const id = ruleByName.get(p.dropClass)
    if (!id) problems.push(`${p.page}/${p.node}: no style rule named "${p.dropClass}"`)
    else if (!(parent?.classIds ?? []).includes(id)) problems.push(`${p.page}/${p.node}: parent does not carry .${p.dropClass}`)
  }
}
if (problems.length) {
  console.error(`plan does not match the draft — ${problems.length} problem(s):`)
  for (const m of problems) console.error(`  ${m}`)
  process.exit(1)
}
console.log(`plan verified against the draft: ${PLAN.length} nodes across ${new Set(PLAN.map((p) => p.page)).size} pages`)

// ── does the plan actually clear the page? ────────────────────────────────
/**
 * The point of the exercise is that no page repeats an image, so simulate it
 * rather than trusting the table. Library picks are checked against everything
 * else the page will hold, INCLUDING byte-identical twins under other names —
 * the exact trap that created this pin.
 */
const shaByPath = new Map()
for (const [sig, group] of Object.entries(
  audit.duplicateUploads.reduce((m, d) => { m[d.sig] = d.files; return m }, {})
)) for (const f of group) shaByPath.set(f, sig)

const identity = (filename) => shaByPath.get(filename) ?? filename
const planByPage = new Map()
for (const p of PLAN) {
  if (!planByPage.has(p.page)) planByPage.set(p.page, [])
  planByPage.get(p.page).push(p)
}
const collisions = []
for (const [slug, entries] of planByPage) {
  const page = audit.pages.find((x) => x.slug === slug)
  const after = new Map()   // identity -> [labels]
  for (const h of page.hits) {
    if (/[{}]/.test(h.src)) continue
    const fname = h.src.replace(/^\/uploads\/[A-Za-z0-9_-]{21}-/, '')
    const ent = entries.find((e) => e.node === h.nodeId)
    // Keyed by the PICTURE, not the node: two slots on one page sharing a search
    // key would receive the same licensed file, which is the very repeat this
    // pin exists to remove. Keying by node hid exactly that on /dental-implants.
    const key = ent ? (ent.lib ? identity(ent.lib) : `fp:${ent.fp}`) : identity(fname)
    const label = ent ? `${ent.lib ?? 'fp/' + ent.fp} (${ent.slot})` : fname
    if (!after.has(key)) after.set(key, [])
    after.get(key).push({ label, chrome: h.chrome })
  }
  for (const [key, uses] of after) {
    if (uses.length > 1 && !uses.every((u) => u.chrome)) collisions.push(`${slug}: ${key} -> ${uses.map((u) => u.label).join(' | ')}`)
  }
}
if (collisions.length) {
  console.error(`\nthe plan would leave ${collisions.length} repeat(s) in place:`)
  for (const c of collisions) console.error(`  ${c}`)
  process.exit(1)
}
console.log('simulated: no page repeats an image after the plan is applied')

// ── Freepik: search, review, then (only on --apply) license ───────────────
async function search (term) {
  const url = `https://api.freepik.com/v1/resources?term=${encodeURIComponent(term)}` +
    `&limit=10&filters[content_type][photo]=1&filters[orientation][landscape]=1&order=relevance`
  const res = await fetch(url, { headers: { 'x-freepik-api-key': KEY } })
  if (!res.ok) { console.warn(`  ! freepik ${res.status} for "${term}"`); return [] }
  return ((await res.json()).data ?? []).filter((d) => d.image?.source?.url)
}

const needed = [...new Set(PLAN.filter((p) => p.fp).map((p) => p.fp))]
console.log(`\n${needed.length} distinct pictures to license, ${PLAN.filter((p) => p.lib).length} slots filled from the library`)

const chosen = {}
const takenIds = new Set()
for (const key of needed) {
  const { must, avoid } = FP[key]
  const hits = await search(FP[key].q)
  // Freepik's relevance ordering is loose — "zirconia dental crown laboratory"
  // returned ceramic CUPS at rank 0. `must`/`avoid` are a cheap title sieve over
  // the free result list; the survivor is still looked at as a picture before
  // any download is spent.
  const ok = hits.filter((h) => (!must || must.test(h.title ?? '')) && (!avoid || !avoid.test(h.title ?? '')))
  if (!ok.length && hits.length) console.log(`  !    ${key.padEnd(13)} ${hits.length} results, none passed the title sieve`)
  const hit = ok.find((h) => !takenIds.has(h.id))
  if (!hit) { console.log(`  MISS ${key.padEnd(13)} "${FP[key].q}"`); continue }
  takenIds.add(hit.id)
  chosen[key] = { id: hit.id, title: hit.title, preview: hit.image.source.url, term: FP[key].q,
    license: (hit.licenses ?? [])[0]?.type ?? '?' }
  console.log(`  fp   ${key.padEnd(13)} ${String(hit.title).slice(0, 58)}`)
}

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'picks.json'), JSON.stringify({ chosen, plan: PLAN, kept: KEPT }, null, 2))

// ── contact sheet ──────────────────────────────────────────────────────────
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const beforeUrl = (p) => BASE + (libByName.get(p.expect)?.publicPath ?? '')
const afterUrl = (p) => p.lib ? BASE + libByName.get(p.lib).publicPath : (chosen[p.fp]?.preview ?? '')
const card = (p) => `
  <div class="row ${p.lib ? 'lib' : 'fp'}">
    <div class="meta">
      <b>/${esc(p.page)}</b>
      <span class="slot">${esc(p.slot)}</span>
      <span class="why">${esc(p.why)}</span>
      <span class="src">${p.lib ? `library · ${esc(p.lib)}` : `Freepik · "${esc(FP[p.fp].q)}"${chosen[p.fp] ? ` · ${esc(chosen[p.fp].license)}` : ''}`}${p.dropClass ? ` · drops .${esc(p.dropClass)}` : ''}</span>
    </div>
    <figure><img src="${esc(beforeUrl(p))}" loading="lazy" alt=""><figcaption>before — ${esc(p.expect)}</figcaption></figure>
    <figure><img src="${esc(afterUrl(p))}" loading="lazy" alt=""><figcaption>after</figcaption></figure>
  </div>`

writeFileSync(join(BUG, 'dedupe-contact-sheet.html'), `<!doctype html><meta charset="utf-8">
<title>Pin #11 — every image change, before and after</title>
<style>
 body{font:14px/1.5 system-ui,sans-serif;margin:2rem;background:#faf9f6;color:#16161a}
 h1{font-size:1.5rem;margin:0 0 .25rem} .sub{color:#666;margin-bottom:2rem;max-width:70ch}
 .row{display:grid;grid-template-columns:minmax(260px,1.1fr) 1fr 1fr;gap:1rem;align-items:start;
   background:#fff;border:1px solid #e3e0d8;padding:1rem;margin-bottom:1rem}
 .lib{border-left:3px solid #2e7d32} .fp{border-left:3px solid #8a7e4e}
 .meta{display:flex;flex-direction:column;gap:.3rem}
 .slot{font-size:.8rem;color:#333} .why{font-size:.78rem;color:#666}
 .src{font-size:.7rem;text-transform:uppercase;letter-spacing:.05em;color:#8a7e4e}
 figure{margin:0} figure img{width:100%;height:190px;object-fit:cover;display:block;background:#eee;border:1px solid #eee}
 figcaption{font-size:.7rem;color:#888;padding-top:.35rem}
 .kept{background:#fff;border:1px solid #e3e0d8;border-left:3px solid #a33;padding:1rem;margin-bottom:1rem}
</style>
<h1>Pin #11 — ${PLAN.length} image changes</h1>
<div class="sub">Green = the practice's own library. Gold = Freepik/Magnific, shown from the free
626px preview; the licensed file is downloaded only on <code>--apply</code>.
"Before" is rendered from the live draft. Nothing here has been published.</div>
${PLAN.map(card).join('')}
<h2>Deliberately not changed</h2>
${KEPT.map((k) => `<div class="kept"><b>${esc(k.file)}</b> — ${esc(k.where)}<br><span class="why">${esc(k.why)}</span></div>`).join('')}
`)
console.log(`\nwrote ${join(BUG, 'dedupe-contact-sheet.html')}`)

if (!APPLY) {
  console.log('\nREAD-ONLY — nothing downloaded, nothing changed. Review the sheet, then --apply.')
  process.exit(0)
}

// ── apply ──────────────────────────────────────────────────────────────────
const missing = needed.filter((k) => !chosen[k])
if (missing.length) { console.error(`refusing to apply: no candidate for ${missing.join(', ')}`); process.exit(1) }

/**
 * Uploads first and in one run. Each one regenerates variants and bumps the
 * shell seq by roughly six, and three other agents are writing this document —
 * so the page save takes its seq AFTER all of this has settled.
 */
/**
 * RESUMABLE, and it has to be: a Freepik download SPENDS QUOTA, so a run that
 * dies after 11 of 31 must not pay for those 11 again. The ledger is written
 * after every single upload, and a key already in it is skipped — the licensed
 * file is already in the media library, and re-licensing it would be money for
 * a second copy of a picture we own.
 */
const LEDGER = join(OUT, 'uploaded.json')
const uploaded = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : {}
if (Object.keys(uploaded).length) console.log(`resuming: ${Object.keys(uploaded).length} already licensed and uploaded`)
for (const [key, pick] of Object.entries(chosen)) {
  if (uploaded[key]) { console.log(`  skip ${key.padEnd(13)} ${uploaded[key].publicPath}`); continue }
  const meta = await fetch(`https://api.freepik.com/v1/resources/${pick.id}/download`, { headers: { 'x-freepik-api-key': KEY } })
  if (!meta.ok) throw new Error(`freepik download ${meta.status} for ${key}`)
  const { data } = await meta.json()
  const bin = await fetch(data.url)
  if (!bin.ok) throw new Error(`freepik cdn ${bin.status} for ${key}`)
  const bytes = Buffer.from(await bin.arrayBuffer())
  // `File`, not `Blob` — a bare Blob arrives as a text field and the handler
  // answers 400 "Missing file". The server picks the extension from the magic
  // bytes, so publicPath is read off the response and never constructed.
  const form = new FormData()
  form.append('file', new File([bytes], data.filename || `${pick.id}.jpg`, { type: 'image/jpeg' }))
  const res = await requestForm('/admin/api/cms/media', form)
  const asset = res?.asset
  if (!asset?.id) throw new Error(`upload returned no asset for ${key}: ${JSON.stringify(res).slice(0, 200)}`)
  uploaded[key] = asset
  writeFileSync(LEDGER, JSON.stringify(uploaded, null, 2))   // after EVERY one
  console.log(`  up   ${key.padEnd(13)} ${asset.publicPath}  ${asset.width}x${asset.height}`)
}

const targetPath = (p) => p.lib ? libByName.get(p.lib).publicPath : uploaded[p.fp].publicPath

/** One save for every page. Small read->write window, one seq to lose. */
async function saveOnce () {
  const rows = (await getPages()).rows
  const bySlug = new Map(rows.map((r) => [r.slug, r]))
  const changed = []
  const baseSeqs = {}
  const seo = []

  for (const [slug, entries] of planByPage) {
    const row = bySlug.get(slug)
    const nodes = { ...row.cells.body.nodes }
    for (const p of entries) {
      const node = nodes[p.node]
      const cur = (node?.props?.src ?? '').replace(/^\/uploads\/[A-Za-z0-9_-]{21}-/, '')
      if (cur !== p.expect) throw new Error(`${slug}/${p.node} moved under us: holds "${cur}", expected "${p.expect}"`)
      nodes[p.node] = { ...node, props: { ...node.props, src: targetPath(p) } }
      if (p.dropClass) {
        const parent = nodes[node.parentId]
        const drop = ruleByName.get(p.dropClass)
        nodes[node.parentId] = { ...parent, classIds: (parent.classIds ?? []).filter((c) => c !== drop) }
      }
    }
    if (Object.keys(nodes).length !== Object.keys(row.cells.body.nodes).length) throw new Error(`${slug}: node count changed`)
    changed.push(toChangedPage(row, { nodes }))
    baseSeqs[row.id] = row.seq
    // pageToCells() cannot carry these; captured now, re-applied after the save.
    if (row.cells.seoTitle || row.cells.seoDescription) {
      seo.push({ id: row.id, slug, seoTitle: row.cells.seoTitle, seoDescription: row.cells.seoDescription })
    }
  }

  const { site: shell, seq: shellBaseSeq } = await getSite()
  const res = await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental',
    site: shell,
    changedPages: changed,
    deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
    changedLayouts: [], deletedLayoutIds: [],
    baseSeqs,
    shellBaseSeq,
  })
  return { res, seo }
}

let saved = null
for (let attempt = 1; attempt <= 4 && !saved; attempt++) {
  try {
    saved = await saveOnce()
  } catch (e) {
    // A seq that moved is one of the other three agents, not corruption.
    if (e.status === 409 && attempt < 4) { console.log(`  409 on attempt ${attempt} — re-reading and retrying`); continue }
    throw e
  }
}
console.log(`\nsaved — seq ${saved.res.seq}`)

// Re-apply the SEO cells the endpoint just dropped. PATCH merges; the row is
// re-read immediately before so nothing else is clobbered.
for (const s of saved.seo) {
  const before = (await api('GET', `/admin/api/cms/data/rows/${s.id}`)).row
  if (before.cells.seoTitle === s.seoTitle && before.cells.seoDescription === s.seoDescription) continue
  await api('PATCH', `/admin/api/cms/data/rows/${s.id}`,
    { cells: { ...before.cells, seoTitle: s.seoTitle, seoDescription: s.seoDescription } })
  console.log(`  seo  restored on /${s.slug}`)
}

// ── read back, subtree-scoped ─────────────────────────────────────────────
const after = (await getPages()).rows
const failures = []
for (const p of PLAN) {
  const row = after.find((r) => r.slug === p.page)
  const node = row?.cells?.body?.nodes?.[p.node]
  if (!node) { failures.push(`${p.page}/${p.node}: gone`); continue }
  if (node.props.src !== targetPath(p)) failures.push(`${p.page}/${p.node}: src is ${node.props.src}`)
  if (p.dropClass) {
    const parent = row.cells.body.nodes[node.parentId]
    if ((parent.classIds ?? []).includes(ruleByName.get(p.dropClass))) failures.push(`${p.page}/${p.node}: .${p.dropClass} still on the parent`)
  }
}
for (const [slug] of planByPage) {
  const wasCount = Object.keys(rowBySlug.get(slug).cells.body.nodes).length
  const isCount = Object.keys(after.find((r) => r.slug === slug).cells.body.nodes).length
  if (wasCount !== isCount) failures.push(`${slug}: node count ${wasCount} -> ${isCount}`)
}
if (failures.length) {
  console.error(`\nread-back FAILED on ${failures.length}:`)
  for (const f of failures) console.error(`  ${f}`)
  process.exit(1)
}
console.log(`read back clean: ${PLAN.length} nodes, node counts unchanged on all ${planByPage.size} pages`)
console.log('\nDRAFT ONLY. Nothing published. Re-run audit-page-images.mjs --after for the AFTER table.')
