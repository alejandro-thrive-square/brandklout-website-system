/**
 * Generates the site's remaining imagery with Magnific / Freepik **Mystic**.
 *
 * WHY GENERATE RATHER THAN SEARCH. `get-stock.mjs` searches a library and takes
 * the closest hit, which on the first pass returned a cold blue instrument tray
 * into a warm ivory design and a portrait flat-lay into a 16:9 band. Generation
 * takes the palette as an instruction, so every image below is authored to
 * Sculpted Ivory: warm off-white, stone, sage green accent, soft north light.
 * The eight searched images in `stock-manifest.json` stay as they are; this
 * fills the slots the content expansion left without a picture.
 *
 * > [!IMPORTANT]
 * > **NO PEOPLE, NO FACES, NO BEFORE/AFTER. This is a surgery site.**
 * >
 * > A generated face beside a treatment name reads as that treatment's result,
 * > and a generated "case" IS a fabricated clinical outcome. Neither is a
 * > styling choice; both are claims a patient would rely on. Every prompt below
 * > is a room, an object, a material or an architectural detail, and every one
 * > carries an explicit negative prompt. Two slots are deliberately absent and
 * > must stay absent until the practice supplies real photography:
 * >
 * >   - **Brooke's and Abby's portraits.** They are real, named people. A
 * >     generated likeness standing in for a named individual is a fabrication
 * >     of that person, whatever the alt text says.
 * >   - **The before/after gallery.** See results.body.html, and HANDOFF.md §3.
 *
 * Auth: MAGNIFIC in the repo-root .env.
 *
 * Usage:
 *   node generate-images.mjs --dry-run   print the slot table, call nothing
 *   node generate-images.mjs             generate anything missing
 *   node generate-images.mjs --force     regenerate everything
 *   node generate-images.mjs --only hero-planning
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ASSETS = path.join(HERE, 'assets')
const MANIFEST = path.join(HERE, 'generated-manifest.json')

function findEnv() {
  let dir = HERE
  for (let i = 0; i < 12; i++) {
    const c = path.join(dir, '.env')
    if (fs.existsSync(c)) return c
    const up = path.dirname(dir)
    if (up === dir) break
    dir = up
  }
  return null
}
function apiKey() {
  if (process.env.MAGNIFIC) return process.env.MAGNIFIC.trim()
  const env = findEnv()
  if (!env) throw new Error(`no MAGNIFIC and no .env above ${HERE}`)
  const line = fs.readFileSync(env, 'utf8').split('\n').find((l) => l.startsWith('MAGNIFIC='))
  if (!line) throw new Error(`.env at ${env} has no MAGNIFIC line`)
  return line.slice(9).trim().replace(/^["']|["']$/g, '')
}
const KEY = apiKey()

/* The house look, appended to every prompt so the set reads as one shoot. */
const STYLE =
  'editorial interior photography, warm off-white and ivory palette, pale stone and travertine, ' +
  'soft muted sage green accent, natural north light, long soft shadows, shallow depth of field, ' +
  'calm minimal luxury, film grain, 35mm, muted and desaturated, no text, no signage, no logos'

/* Enforced on every slot. The people clauses are the point of the file. */
/* Textures are not photographs of a subject: flat even light, no depth of
   field, no horizon, nothing to look AT. Type sits on top of these, so any
   vignette or hot spot shows up as a stain behind a sentence. */
const TEXTURE_STYLE =
  'macro material photography, flat even studio light, seamless full-frame texture, no objects, no props, no horizon, no depth of field, sharp across the whole frame, no text, no logo, no watermark'
const TEXTURE_NEGATIVE =
  'people, hands, objects, props, furniture, plant, room, horizon, vignette, frame, border, text, watermark, logo, lettering, oversaturated, neon, cold blue, harsh flash'

const NEGATIVE =
  'people, person, face, portrait, model, patient, hands, skin closeup, body, mannequin, doll, ' +
  'before and after, medical results, text, watermark, logo, signage, lettering, ' +
  'oversaturated, neon, cold blue, clinical white, harsh flash, cluttered'

/* --- second pass, 2026-08-31 -------------------------------------------
   The first set was chosen for palette and mood and NOT for subject, and it
   showed: folded spa towels beside the eight-hour fasting rules, a massage bed
   beside "implants are planned to the bone", an abstract stone lump beside the
   platysma. Every one was on-brand and about nothing.

   The rule for this pass: **the image has to depict what the section says.**
   Palette is a constraint, not the brief. Where the honest subject is surgical,
   the image is surgical; keeping it soft would be the same mistake again. */
const SLOTS = [
  /* gen-consult-desk was a leather folder and a pen: stationery, and the only
     strong brown on the site. Superseded by gen-consult-pair, which shows the
     two chairs the consultation copy is actually about. */

  {
    file: 'gen-or-light.webp',
    used: 'treatments.html - Face category band (replaces cat-face)',
    // Was a spa massage bed. The copy is facial SURGERY: implants planned in
    // three dimensions, blepharoplasty, buccal fat. A spa bed misrepresents it.
    prompt:
      'a modern surgical light above an empty operating table draped in clean sage-green surgical ' +
      'cloth, in a calm warm-toned operating room, no people, soft light',
  },
  {
    file: 'gen-suture-tray.webp',
    used: 'treatments.html - Neck & Jawline band (replaces cat-neck)',
    // Was an abstract stone form. The copy is specifically about a suture
    // suspending the platysma, so the subject is the suture and the instrument.
    prompt:
      'a needle holder and a fine curved suture needle on folded cream surgical linen, ' +
      'extreme close up, warm ivory ground, soft directional light on the polished steel',
  },
  {
    file: 'gen-injectables.webp',
    used: 'treatments.html - Non-Surgical band',
    // The copy is neuromodulators priced per unit and filler priced per
    // syringe. Capped syringes and vials on a tray, and no needle near skin.
    prompt:
      'unlabelled glass vials and two capped syringes arranged on a small stainless tray on a pale ' +
      'stone counter, clean and clinical but warm, soft daylight, no needles touching anything',
  },
  {
    file: 'gen-procedure-room.webp',
    used: 'book.html - the sedation rules; myellevate-neck-lift.html - the day',
    // Was folded towels beside the eight-hour fast and the no-driving rule.
    // The subject is the day of a procedure: the chair you will be in.
    prompt:
      'an empty medical procedure chair reclined in a calm treatment room, a small monitor on a ' +
      'stand beside it switched off, folded cloth on the armrest, warm neutral tones, daylight',
  },
  {
    file: 'gen-planning.webp',
    used: 'myellevate-neck-lift.html - "why it matters who holds the suture"',
    // First pass asked for an anatomical skull model. It came back technically
    // perfect and completely wrong: a human skull on a plinth reads as an
    // anatomy lab, not as boutique facial aesthetics, and it is the last thing
    // a nervous cosmetic patient should meet. A classical sculptural fragment
    // says the same thing about proportion and is unmistakably an artwork, so
    // it cannot be read as a patient. The design board is called Sculpted
    // Ivory and the brand's verb is "sculpt"; this is that, literally.
    prompt:
      'a classical plaster sculpture fragment, a fragment of a carved profile in pale marble, ' +
      'resting on a travertine plinth in an empty gallery-like room, raking daylight',
  },
  {
    file: 'gen-recovery-room.webp',
    used: 'myellevate-neck-lift.html - the recovery / journey band',
    prompt:
      'a quiet recovery room corner, a single upholstered chair in oatmeal boucle, a folded cream ' +
      'throw, a small round side table with a glass of water, sheer curtain diffusing daylight',
  },
  {
    file: 'gen-instruments-warm.webp',
    used: 'about.html - the training / clinical oversight band',
    prompt:
      'fine surgical instruments arranged in a neat row on folded cream linen, warm ivory ground, ' +
      'soft directional light catching the polished steel, overhead flat lay',
  },
  {
    file: 'gen-skincare-shelf.webp',
    used: 'memberships.html - what the credit buys',
    prompt:
      'unlabelled amber and frosted glass skincare bottles on a floating stone shelf, soft shadow ' +
      'on a plaster wall, one folded white towel',
  },
  {
    file: 'gen-daylight-wall.webp',
    used: 'home.html - the service area band',
    prompt:
      'an empty plaster wall in warm ivory with the soft shadow of a window frame and a leafy branch ' +
      'falling across it, abstract architectural minimalism',
  },
  {
    file: 'gen-linen-detail.webp',
    used: 'book.html - the pre-visit band',
    prompt:
      'a neatly folded stack of cream linen towels on a pale stone counter, a small dish of cotton ' +
      'rounds, soft morning light from the left',
  },
  {
    file: 'gen-laser-device.webp',
    used: 'treatments.html - non-surgical band alternate; morpheus8.html band',
    prompt:
      'a modern aesthetic laser handpiece resting in its cradle on a pale stone counter in an empty ' +
      'treatment room, warm neutral tones, soft daylight',
  },

  /* --- third pass, 2026-08-31: the twelve service pages -------------------
     render-treatments.mjs gives every flagship treatment its own page, each
     needing a band and a journey image. Most slots are filled by reusing the
     existing set or, better, by the practice's OWN photography now that the
     client's Drive export has arrived (see import-client-images.mjs: the real
     laser platform beats a generated one, so no handpiece slot was added).
     These three had no honest match in either pool. */
  {
    file: 'gen-recovery-daylight.webp',
    used: 'brow-lift.html, blepharoplasty.html - the journey band',
    // gen-recovery-room was already carrying five pages. A second, different
    // recovery corner so the eyelid and brow pages do not look like reprints
    // of the neck pages.
    prompt:
      'a quiet recovery corner with a pale linen armchair, a small side table holding a glass of ' +
      'water and a folded cloth, tall window with sheer curtain, empty room',
  },
  {
    file: 'gen-implant-forms.webp',
    used: 'cheek-and-chin-implants.html, jawline-implant.html - the detail band',
    // An actual facial implant photographed alone reads as hardware and is
    // faintly alarming; a skull model is an anatomy lab, which the first pass
    // already learned the hard way.
    //
    // REGENERATED 2026-08-31. "Three smooth sculpted alabaster forms" returned
    // two eggs and a pot: on palette, beautifully lit, and about nothing, which
    // is the exact mistake the second pass was supposed to end. The copy on
    // both these pages says the implant is PLANNED AGAINST YOUR OWN SKELETAL
    // MEASUREMENTS, so the honest subject is measurement, not sculpture.
    prompt:
      'a pair of precision brass calipers resting on a technical profile drawing on tracing paper, ' +
      'on a pale stone counter, architectural draughting still life, soft directional daylight',
  },
  {
    file: 'gen-surgical-suite.webp',
    used: 'neck-lift.html - the detail band',
    // gen-or-light is on the face lift and the implant pages. The full neck
    // lift is the other major theatre case and needed its own frame.
    prompt:
      'an empty operating suite from the side, vacant table with folded drapes, a stainless ' +
      'instrument trolley, warm indirect light, calm and uncluttered, no equipment branding',
  },

  /* --- fourth pass, 2026-08-31: the home page rebuild ---------------------
     The client's team called the first home "very ugly and simple" and set
     drnahlah.com as the quality bar. The rebuild is an editorial JOURNEY, and
     it needs two things this asset pool did not have:

       1. STONE AS A MATERIAL. The practice's own retired site (Wayback,
          `01-content-intake/.tmp/wayback-screenshots/shots/058-home.png`) ran
          marble as the page ground, as panels behind copy and as a dark break
          band. That is where its editorial feel came from, and none of it
          survived into the first build, which sits on flat ivory throughout.
          These are TEXTURES, not pictures: flat even light, seamless, no
          subject, so type can sit on them and they can tile.

       2. PORTRAIT-ORIENTATION IMAGES. Every existing asset is 16:9, which is
          why every section is a horizontal band. An editorial page needs tall
          frames it can overlap and bleed, and cropping 16:9 to 2:3 throws away
          two thirds of the picture.

     Subject rule from the second pass still holds: each image depicts what its
     section SAYS. The four category images are the four categories' real
     subjects, not four pretty stones. */

  {
    file: 'tex-carrara.webp',
    aspect: 'horizontal_2_1',
    maxWidth: 1800,
    detail: 20,
    style: TEXTURE_STYLE,
    negative: TEXTURE_NEGATIVE,
    used: 'home - the panels behind copy, and the surgeon panel',
    // texture-stone.jpg (the one stone asset the first build had) is a cold
    // grey slab. Sculpted Ivory is warm. A cold grey panel inside a warm ivory
    // page reads as a mistake, which is why the first build barely used it.
    prompt:
      'warm off-white Carrara marble slab, very fine soft grey and pale beige veining, honed matte ' +
      'finish, seamless, evenly lit',
  },
  {
    file: 'tex-marble-dark.webp',
    aspect: 'horizontal_2_1',
    maxWidth: 1800,
    detail: 20,
    style: TEXTURE_STYLE,
    negative: TEXTURE_NEGATIVE,
    used: 'home - the dark break band behind the practice-standard chapter',
    // The archive used a near-black marble for exactly one band, which is what
    // made the ivory either side of it read as light rather than as default.
    prompt:
      'dark charcoal brown marble slab, deep near-black ground with fine warm bronze and pale ' +
      'cream veining, honed matte finish, seamless, evenly lit',
  },
  {
    file: 'hero-arrival.webp',
    aspect: 'portrait_2_3',
    maxWidth: 1200,
    used: 'home - chapter 00, the tall frame beside the headline',
    // The first build's hero was the front desk photographed so that the
    // practice's own signage read "STON". A hero that crops the client's name
    // in half is not a hero. This is the room the copy describes: boutique,
    // quiet, one surgeon, north light.
    prompt:
      'a tall arched window in a warm ivory plaster room of a boutique clinic, one sculptural ' +
      'lounge chair in oatmeal boucle, a low travertine table, raking morning light laying long ' +
      'soft shadows across a pale stone floor, vertical composition, empty room',
  },
  {
    file: 'cat-face-tall.webp',
    aspect: 'portrait_2_3',
    maxWidth: 1000,
    used: 'home - chapter 03, the Face card',
    // REGENERATED. The first attempt was an operating room with a green-draped
    // table: the honest subject, and completely the wrong register for the
    // first card a nervous cosmetic patient meets on a HOME page. It read as
    // institutional, not boutique. The Face category is about structure and
    // proportion, which is what this says, and a carved marble profile cannot
    // be misread as a patient or as a result the way a photograph of a person
    // could. It also happens to be the practice's own name and the design
    // board's own word.
    prompt:
      'a classical carved marble profile fragment, a fragment of a sculpted face in pale warm ' +
      'stone, standing on a travertine plinth in an empty ivory gallery room, raking daylight ' +
      'from the left, tall vertical composition, deep soft shadow',
  },
  {
    file: 'cat-neck-tall.webp',
    aspect: 'portrait_2_3',
    maxWidth: 1000,
    used: 'home - chapter 03, the Neck & Jawline card',
    // REGENERATED. "A needle holder and a suture on linen" came back as one
    // small ambiguous object on a crumpled cloth: legible as nothing in
    // particular at card size. A row of instruments reads instantly, fills a
    // 2:3 frame, and is the honest subject for a category whose flagship
    // procedure is a suture suspending the platysma.
    prompt:
      'an overhead flat lay of fine polished stainless surgical instruments, a needle holder, ' +
      'forceps and a fine curved needle, arranged in a neat evenly spaced vertical row on folded ' +
      'cream linen over a pale stone counter, tall vertical composition, soft raking daylight ' +
      'catching the polished steel',
  },
  {
    file: 'cat-skin-tall.webp',
    aspect: 'portrait_2_3',
    maxWidth: 1000,
    used: 'home - chapter 03, the Skin card',
    prompt:
      'an aesthetic laser handpiece resting in its cradle beside two unlabelled amber glass bottles ' +
      'on a pale travertine counter in an empty treatment room, vertical composition, soft daylight',
  },
  {
    file: 'cat-nonsurgical-tall.webp',
    aspect: 'portrait_2_3',
    maxWidth: 1000,
    used: 'home - chapter 03, the Non-Surgical card',
    prompt:
      'unlabelled glass vials and two capped syringes arranged on a small stainless tray on a pale ' +
      'stone counter beside a folded cream cloth, vertical composition, warm daylight, no needles ' +
      'touching anything',
  },
  /* --- fifth pass, 2026-09-01: two service pages were sharing a head --------
     The service template now puts `bandImage` at the top of the page as the
     hero, where it used to be a band halfway down. That promotion raised the
     cost of reuse: two photographs were each doing duty as the HEAD of two
     different treatments, which is barely noticeable mid-page and obvious when
     it is the first thing on the screen twice.

       gen-implant-forms  was the head of cheek-and-chin-implants AND jawline-implant
       gen-planning       was the head of brow-lift AND myellevate-neck-lift

     One new image each, so all twelve service pages open on something of their
     own. Same rules as every other pass: an object or a room, never a face,
     never a result. */
  {
    file: 'gen-contour-gauges.webp',
    used: 'jawline-implant.html - the head (was sharing gen-implant-forms with cheek-and-chin)',
    // The jawline implant page's copy is about the mandible's angle and
    // projection being measured rather than chosen off a shelf. Contour gauges
    // and a protractor say measurement without repeating the calipers that now
    // belong to the cheek and chin page.
    prompt:
      'a set of machined metal contour gauges and a brass protractor laid on tracing paper over a ' +
      'pale stone counter, precision measuring instruments, architectural draughting still life, ' +
      'soft directional daylight',
  },
  {
    file: 'gen-iclight-wand.webp',
    used: 'myellevate-neck-lift.html - the head (was sharing gen-planning with brow-lift)',
    // MyEllevate's distinguishing feature, in the practice's own description, is
    // that the suture is placed under a guiding ICLED light. That is the honest
    // subject for this page and it belongs to no other one.
    prompt:
      'a slim illuminated surgical light wand resting in its cradle on a pale stone counter in a ' +
      'darkened calm treatment room, a narrow warm beam falling across folded cream linen, ' +
      'close up, no people',
  },
  /* --- sixth pass, 2026-09-01: the service pages were text with two pictures
     Client review of the neck lift page: "We shouldn't have this type of chunk
     of text playing text and that's it. This is bad for conversions"; "Same
     here. We only have text"; "Overall the entire page is lacking images."

     Measured: two images across an 8,372px page, the thinnest on the site. The
     two biggest reading blocks, the lede and the spec rows, had none at all.

     Two per service page, and these two are the neck lift's. The other eleven
     fall back to text-only until theirs exist, which the renderer reports. */
  {
    file: 'gen-marble-jawline.webp',
    aspect: 'portrait_2_3',
    maxWidth: 1000,
    used: 'neck-lift.html - beside the lede',
    // The lede is about the neck being where age shows first, and about the
    // platysma being what gives the neck its shape. A carved jaw and neck IS
    // that subject, it cannot be mistaken for a patient or a result, and the
    // practice is called Stone. Cropped close and lit from the side so it reads
    // as a study of the jawline rather than as another bust on a plinth.
    prompt:
      'a close side view of a classical marble sculpture, cropped to the jaw and neck, pale warm ' +
      'stone with visible chisel texture, raking light from the left across the jawline, plain ' +
      'ivory background, gallery lighting, tall vertical composition',
  },
  {
    file: 'gen-surgical-loupes.webp',
    aspect: 'portrait_2_3',
    maxWidth: 1000,
    used: 'neck-lift.html - beside the spec rows',
    // The spec rows are "often combined with" and "why it matters who
    // operates", and the second is about the marginal mandibular nerve and
    // knowing anatomy in three dimensions. Magnifying loupes are the honest
    // object for precision and for seeing what is small.
    prompt:
      'a pair of surgical magnifying loupes resting on folded sterile cloth beside a stainless ' +
      'tray on a pale stone counter, precision optics catching the light, warm ivory ground, ' +
      'soft directional daylight, tall vertical composition',
  },
  {
    file: 'ask-reception-tall.webp',
    aspect: 'portrait_2_3',
    maxWidth: 1000,
    used: 'home - chapter 08, beside the five questions',
    // The chapter is called "Before you book", so the subject is the desk you
    // book at. The slot was filled with ssa-front-desk.webp cropped from 16:9
    // to 3:4, which cut a member of staff in half and sliced the practice's own
    // signage down to an S. That is the same crop the client already rejected
    // once on the v1 hero; a real photograph forced into the wrong aspect is
    // not better than a generated one that fits.
    prompt:
      'a boutique clinic reception counter in pale travertine, a small ceramic vase of eucalyptus ' +
      'and a closed linen-bound appointment book on the surface, warm ivory plaster wall behind, ' +
      'tall vertical composition, soft daylight from the left, empty and calm',
  },
]

const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null
const force = process.argv.includes('--force')
const dryRun = process.argv.includes('--dry-run')

const api = async (method, url, body) => {
  const r = await fetch(url, {
    method,
    headers: { 'x-freepik-api-key': KEY, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`${r.status} ${text.slice(0, 200)}`)
  return JSON.parse(text)
}

/* Mystic is async: create a task, poll until COMPLETED. */
const ASPECTS = {
  widescreen_16_9: 16 / 9,
  portrait_2_3: 2 / 3,
  social_post_4_5: 4 / 5,
  square_1_1: 1,
  horizontal_2_1: 2,
  vertical_1_2: 1 / 2,
}

async function generate(slot) {
  const created = await api('POST', 'https://api.freepik.com/v1/ai/mystic', {
    prompt: `${slot.prompt}. ${slot.style ?? STYLE}`,
    negative_prompt: slot.negative ?? NEGATIVE,
    aspect_ratio: slot.aspect ?? 'widescreen_16_9',
    model: 'realism',
    creative_detailing: slot.detail ?? 33,
  })
  const id = created.data.task_id
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 5000))
    const s = await api('GET', `https://api.freepik.com/v1/ai/mystic/${id}`)
    if (s.data.status === 'COMPLETED') {
      if (s.data.has_nsfw?.some(Boolean)) throw new Error('generation flagged NSFW; not used')
      return s.data.generated[0]
    }
    if (s.data.status === 'FAILED') throw new Error(`task failed: ${s.data.error ?? 'unknown'}`)
  }
  throw new Error('timed out after ~200s')
}

/* Same downscale + WebP as get-stock.mjs; Mystic returns large PNGs. */
function toWebp(src, dest, aspect = 16 / 9, maxW = 1600) {
  const script = `
import sys
from PIL import Image
src, dst, max_w, q, aspect = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), float(sys.argv[5])
im = Image.open(src)
if im.mode not in ("RGB", "RGBA"):
    im = im.convert("RGB")
w, h = im.size
if w / h > aspect:
    nw = round(h * aspect); left = (w - nw) // 2; im = im.crop((left, 0, left + nw, h))
else:
    nh = round(w / aspect); top = (h - nh) // 2; im = im.crop((0, top, w, top + nh))
if im.width > max_w:
    im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
im.save(dst, "WEBP", quality=82, method=6)
print(im.width, im.height)
`
  const out = execFileSync('python', ['-c', script, src, dest, String(maxW), '82', String(aspect)], {
    encoding: 'utf8',
  })
  const [w, h] = out.trim().split(/\s+/).map(Number)
  return { w, h }
}

fs.mkdirSync(ASSETS, { recursive: true })
const manifest = fs.existsSync(MANIFEST)
  ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
  : { generator: 'Freepik Mystic (api.freepik.com/v1/ai/mystic)', slots: {} }

if (dryRun) {
  for (const s of SLOTS) console.log(`${s.file.padEnd(26)} ${s.used}\n    ${s.prompt}\n`)
  process.exit(0)
}

const log = []
for (const slot of SLOTS) {
  if (only && !slot.file.includes(only)) continue
  const dest = path.join(ASSETS, slot.file)
  if (!force && fs.existsSync(dest) && manifest.slots[slot.file]) {
    log.push(`skip  ${slot.file}`)
    continue
  }
  try {
    const url = await generate(slot)
    const tmp = dest.replace(/\.webp$/, '.orig.png')
    const bin = await fetch(url)
    if (!bin.ok) throw new Error(`download ${bin.status}`)
    fs.writeFileSync(tmp, Buffer.from(await bin.arrayBuffer()))
    const origBytes = fs.statSync(tmp).size
    const { w, h } = toWebp(tmp, dest, ASPECTS[slot.aspect ?? 'widescreen_16_9'], slot.maxWidth ?? 1600)
    fs.unlinkSync(tmp)
    manifest.slots[slot.file] = {
      prompt: slot.prompt,
      style: STYLE,
      negativePrompt: NEGATIVE,
      usedFor: slot.used,
      aspect: slot.aspect ?? 'widescreen_16_9',
      width: w,
      height: h,
      bytes: fs.statSync(dest).size,
      generatedAt: new Date().toISOString().slice(0, 10),
    }
    log.push(
      `ok    ${slot.file.padEnd(26)} ${w}x${h}  ${(origBytes / 1024 / 1024).toFixed(1)}MB -> ${(fs.statSync(dest).size / 1024).toFixed(0)}KB`,
    )
  } catch (e) {
    log.push(`FAIL  ${slot.file.padEnd(26)} ${e.message.slice(0, 140)}`)
    process.exitCode = 1
  }
}

manifest.generatedAt = new Date().toISOString().slice(0, 10)
manifest.note =
  'AI-generated with Freepik Mystic, to the Sculpted Ivory palette. Rooms, objects, materials and ' +
  'architectural details ONLY: no people, no faces, no before/after. A generated face on a surgery ' +
  'page reads as a patient or as a result, and a generated case IS a fabricated clinical outcome. ' +
  'Replace with the practice photography as it arrives; the two slots deliberately left empty are ' +
  'the team portraits and the results gallery.'
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), 'utf8')
console.log(log.join('\n'))
