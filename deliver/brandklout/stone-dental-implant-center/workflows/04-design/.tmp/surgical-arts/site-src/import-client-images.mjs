/**
 * Imports photography out of the client's Drive export into assets/, as WebP
 * at the site's sizes.
 *
 * TWO KINDS OF IMAGE COME OUT OF THE EXPORT, and the manifest records which
 * is which under `kind`.
 *
 *   `practice`  The practice's OWN photography: Dr. Stone, the team, the
 *               rooms, the signage, the neon. Real, on brand, and it says
 *               whose building you are in. These beat anything generated or
 *               searched, for the same subject.
 *
 *   `model`     The portrait library from the practice's PREVIOUS website
 *               (built by Influx; the export is that site's whole asset
 *               tree). About forty studio and editorial portraits, warm and
 *               on-palette, filed under treatment names.
 *
 * > [!IMPORTANT]
 * > **THE MODEL LIBRARY WAS OFF LIMITS UNTIL 2026-09-01, AND WHY THAT
 * > CHANGED.** The first import took only the six practice photographs and
 * > wrote, in this header, that a face on a treatment page reads as that
 * > treatment's result. That is still true and the rule is still in force;
 * > what changed is where the line is drawn. The client, reviewing the
 * > design against four competitor home pages (see
 * > ../../reference-sites/README.md): the site needs *"way more images"*,
 * > and *"we have some statue images that don't lead to any surgical
 * > procedure. We need to make sure to grab some images of people."* And on
 * > the export itself: *"I forgot to tell you we have these Google Drive
 * > images too."* Every competitor page reviewed carries model photography
 * > on its category, concern and gallery surfaces, and a facial surgery site
 * > with no faces on it reads as evasive rather than as careful.
 * >
 * > So a model portrait may now appear AS A PERSON: on a category card, in a
 * > concern list, in a photographic band, in a hero. It may still NOT appear
 * > inside a results grid, beside a "before" or "after" label, under a
 * > caption that names it as a patient, or under one that claims an outcome.
 * > That is the rule get-people.mjs already carries for searched stock, and
 * > it is the same rule here. `audit.mjs` enforces the results-context half.
 *
 * > [!IMPORTANT]
 * > **LICENCE.** The model portraits were licensed for the practice's
 * > previous site by the agency that built it. The client supplied them as
 * > the practice's own assets and asked for them to be used; this build
 * > treats that as authorisation, and records the provenance of every file
 * > here so Brandklout can confirm the licence travels with the practice
 * > before the domain goes live. If it does not, every `model` slot has a
 * > searched or generated fallback path through get-people.mjs.
 *
 * > [!IMPORTANT]
 * > `img/before-after/` holds REAL, IDENTIFIABLE PATIENTS. It is not imported
 * > here and must not be until consent is confirmed in writing. See
 * > HANDOFF.md. One of them, `image1.jpg`, is captioned "Courtesy of G.
 * > Mueller MD": it is the DEVICE MANUFACTURER'S marketing image of another
 * > surgeon's patient, and publishing it as a Stone result would be a
 * > fabricated outcome regardless of consent.
 *
 * > [!NOTE]
 * > **The staff portraits are 597x615 at source.** That is small for a
 * > portrait card at 1x and soft at 2x. They are imported straight here;
 * > upscale-client-images.mjs is the separate pass that enlarges them, and
 * > was written for Brooke's first.
 *
 * Usage: node import-client-images.mjs [--force] [--only <file>]
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ASSETS = path.join(HERE, 'assets')
const SRC = path.resolve(
  HERE,
  '../../../../01-content-intake/.tmp/google-drive-images'
)
const MANIFEST = path.join(HERE, 'client-manifest.json')
const force = process.argv.includes('--force')
const onlyIx = process.argv.indexOf('--only')
const only = onlyIx > -1 ? process.argv[onlyIx + 1] : null

/* aspect: 16/9 for bands, 2/3 and 4/5 for the tall frames, 1 for the square
   tiles the concern list and the catalogue use. `kind` is recorded in the
   manifest and is what audit.mjs reads. */
const IMPORTS = [
  /* --- the practice, first import 2026-08-31 -------------------------- */
  {
    file: 'ssa-signage.webp',
    kind: 'practice',
    from: 'img/masthead/auxilary/03.jpg',
    aspect: 16 / 9,
    width: 1600,
    alt: 'The Stone Surgical Arts sign on the practice wall',
    used: 'index.html invitation; about',
    note: 'The practice’s own signage. Real, on brand, and it says whose building you are in.',
  },
  {
    file: 'ssa-treatment-room.webp',
    kind: 'practice',
    from: 'img/masthead/auxilary/01.jpg',
    aspect: 16 / 9,
    width: 1600,
    alt: 'A treatment room at the practice with the laser platform and a product display',
    used: 'index.html place strip; treatments',
    note: 'The actual devices in the actual room.',
  },
  {
    file: 'ssa-front-desk.webp',
    kind: 'practice',
    from: 'img/masthead/auxilary/04.jpg',
    aspect: 16 / 9,
    width: 1600,
    alt: 'Two members of the practice team at the front desk beneath the Stone Surgical Arts sign',
    used: 'index.html place strip; book',
    note: 'Shows the people you actually meet. Has faces, but they are STAFF at a desk, which cannot be read as a clinical result.',
  },
  {
    file: 'ssa-team.webp',
    kind: 'practice',
    from: 'img/masthead/auxilary/our-team.jpg',
    aspect: 16 / 9,
    width: 1600,
    alt: 'The Stone Surgical Arts team seated together',
    used: 'index.html place strip; team',
    note: 'The real team.',
  },
  {
    file: 'ssa-consult-room.webp',
    kind: 'practice',
    from: 'img/masthead/cosmetic-facial-surgery/glow-with-hydra-gacial-bg-img.jpg',
    aspect: 16 / 9,
    width: 1600,
    alt: 'A woman with a clipboard seated in an armchair in the practice’s consultation room',
    used: 'index.html the path; neck-lift and blepharoplasty booking chapters',
    note: 'A real consult room. The seated woman is at the RIGHT of the frame near the TOP; every slot that crops this needs .u-focus-figure or she is cropped out. See css/02-base.css.',
  },
  {
    file: 'staff-brooke.webp',
    kind: 'practice',
    from: 'img/staff/brooke.jpg',
    aspect: 4 / 5,
    width: 640,
    alt: 'Brooke, nurse practitioner and aesthetic injector at Stone Surgical Arts',
    used: 'team',
    note: 'SOURCE IS ONLY 597x615. Upscaled separately by upscale-client-images.mjs; this is the straight import and the fallback.',
  },

  /* --- the practice, second import 2026-09-01 ------------------------- */
  {
    file: 'ssa-neon.webp',
    kind: 'practice',
    from: 'img/masthead/auxilary/02.jpg',
    aspect: 16 / 9,
    width: 1600,
    alt: 'The green neon sign on the practice wall: Be the best version of you',
    used: 'index.html, the band above the invitation',
    note: 'The practice’s own neon, in the brand green. The one image in the export that is both a real place and a line of copy.',
  },
  {
    file: 'dr-stone-standing.webp',
    kind: 'practice',
    from: 'img/feature/dr-mona-stone.jpg',
    aspect: 2 / 3,
    width: 1000,
    alt: 'Dr. Mona Stone, DDS, in a white coat at the Westlake practice',
    used: 'index.html the surgeon; meet-the-doctor hero',
    note: '1000x1482 at source, the largest photograph of Dr. Stone the practice has. Replaces dr-stone-portrait.webp (643x1020) wherever the slot is bigger than 600px.',
  },
  {
    file: 'dr-stone-smile.webp',
    kind: 'practice',
    from: 'img/nav/dr-stone-nav-img.jpg',
    aspect: 1,
    width: 550,
    alt: 'Dr. Mona Stone smiling, in a white coat',
    used: 'index.html thesis attribution; CTA band',
    note: '700x550 at source; square-cropped for a small round portrait.',
  },
  {
    file: 'dr-stone-desk.webp',
    kind: 'practice',
    from: 'img/nav/about-us.jpg',
    aspect: 4 / 3,
    width: 700,
    alt: 'Dr. Mona Stone at the front desk beneath the practice’s sign',
    used: 'index.html the surgeon, second frame; about',
    note: '700x550 at source. Fine up to about 700px wide.',
  },
  {
    file: 'ssa-desk-detail.webp',
    kind: 'practice',
    from: 'img/nav/patient-resources.jpg',
    aspect: 4 / 3,
    width: 700,
    alt: 'Business cards and branded pens on the marble front desk',
    used: 'index.html place strip; book',
    note: 'A still life of the practice’s own stationery. The office manager’s name is legible on the card.',
  },
  {
    file: 'ssa-reception-pair.webp',
    kind: 'practice',
    from: 'img/nav/contact.jpg',
    aspect: 4 / 3,
    width: 700,
    alt: 'Two members of the team working at the front desk',
    used: 'index.html place strip; book',
    note: 'Staff at the desk.',
  },
  {
    file: 'ssa-treatment-pair.webp',
    kind: 'practice',
    from: 'img/collage-01.jpg',
    aspect: 2 / 3,
    width: 411,
    alt: 'A member of the clinical team treating a seated patient in a treatment room',
    used: 'index.html place strip',
    note: '411x750 at source. Small; keep it to a tile under 420px.',
  },
  {
    file: 'ssa-desk-laugh.webp',
    kind: 'practice',
    from: 'img/collage-03.jpg',
    aspect: 2 / 3,
    width: 411,
    alt: 'A member of the team laughing on the phone at the front desk',
    used: 'index.html place strip',
    note: '411x750 at source. Small; keep it to a tile under 420px.',
  },
  ...['alexis', 'breanna', 'jennifer', 'lv', 'team-diana-img', 'team-lellie-img'].map((n) => ({
    file: `staff-${n.replace(/^team-|-img$/g, '')}.webp`,
    kind: 'practice',
    from: `img/staff/${n}.jpg`,
    aspect: 4 / 5,
    width: 640,
    alt: 'A member of the Stone Surgical Arts team',
    used: 'team',
    note: '597x615 at source. The name is the filename; the role comes from the archived team page where it names one.',
  })),

  /* --- the model library, imported 2026-09-01 -------------------------
     Chosen on a contact sheet (sheet-a/b/c in the session scratchpad) for
     warmth, daylight and the palette. Age was weighed where the slot is a
     surgical one: the hero and the Face category are the mature portraits,
     because that is who the surgical work is for. */
  {
    file: 'm-hero.webp',
    kind: 'model',
    from: 'img/feature/home/01.jpg',
    aspect: 2 / 3,
    width: 1000,
    alt: 'A woman in her fifties with her eyes closed and a hand at her neck, in soft ivory light',
    used: 'index.html arrival',
    note: 'The one portrait in the export that is the palette: ivory, calm, mature. Was the previous site’s own home masthead.',
  },
  {
    file: 'm-mature-smile.webp',
    kind: 'model',
    from: 'img/feature/home/cosmetic-facial-surgery.jpg',
    aspect: 3 / 4,
    width: 900,
    alt: 'A woman in her fifties smiling, bare-shouldered, in warm light',
    used: 'index.html catalogue, Face',
  },
  {
    file: 'm-neck-hand.webp',
    kind: 'model',
    from: 'img/feature/face-skin-rejuvenation/01.jpg',
    aspect: 4 / 5,
    width: 1200,
    alt: 'A woman with a dark bob, eyes closed, a hand resting at her neck',
    used: 'index.html catalogue, Neck',
  },
  {
    file: 'm-skin-glow.webp',
    kind: 'model',
    from: 'img/feature/face-skin-rejuvenation/02.jpg',
    aspect: 4 / 5,
    width: 1200,
    alt: 'A close portrait of clear skin in soft daylight',
    used: 'index.html catalogue, Skin',
  },
  {
    file: 'm-injectables.webp',
    kind: 'model',
    from: 'img/selector/injectables.jpg',
    aspect: 4 / 5,
    width: 1200,
    alt: 'A woman with blonde waves, hand at her collarbone, looking at the camera',
    used: 'index.html catalogue, Non-surgical',
  },
  {
    file: 'm-profile-light.webp',
    kind: 'model',
    from: 'img/masthead/home/02.jpg',
    aspect: 16 / 9,
    width: 1600,
    alt: 'A woman in profile in a slant of warm light, neck and jaw in shadow',
    used: 'index.html results band',
  },
  {
    file: 'm-profile-dark.webp',
    kind: 'model',
    from: 'img/masthead/home/03.jpg',
    aspect: 16 / 9,
    width: 1600,
    alt: 'A woman in profile against a dark ground, a hand raised to her cheek',
    used: 'index.html, the standard',
  },
  {
    file: 'm-freckles.webp',
    kind: 'model',
    from: 'img/masthead/cosmetic-facial-surgery/restore-your-glow-img.jpg',
    aspect: 16 / 9,
    width: 1600,
    alt: 'A close portrait of freckled skin, a fingertip at the temple',
    used: 'index.html concerns, skin',
  },
  {
    file: 'm-neck-outdoor.webp',
    kind: 'model',
    from: 'img/masthead/necklift/02.jpg',
    aspect: 16 / 9,
    width: 1600,
    alt: 'A woman in profile outdoors, chin resting on her hand',
    used: 'index.html concerns, neck',
  },
  {
    file: 'm-jawline.webp',
    kind: 'model',
    from: 'img/selector/jawline-implant.jpg',
    aspect: 1,
    width: 1200,
    alt: 'A woman looking down, her jawline in profile',
    used: 'index.html concerns, jawline',
  },
  {
    file: 'm-chin.webp',
    kind: 'model',
    from: 'img/selector/chin-implant.jpg',
    aspect: 1,
    width: 1200,
    alt: 'A woman in three-quarter profile, chin lifted',
    used: 'index.html concerns, chin',
  },
  {
    file: 'm-neck-soft.webp',
    kind: 'model',
    from: 'img/selector/neck-lift.jpg',
    aspect: 1,
    width: 1200,
    alt: 'A woman with blonde hair, a hand resting on her neck, smiling softly',
    used: 'index.html concerns, neck; treatments',
  },
  {
    file: 'm-cheek.webp',
    kind: 'model',
    from: 'img/selector/cheek-implant.jpg',
    aspect: 1,
    width: 1200,
    alt: 'A woman with dark curls, laughing',
    used: 'index.html concerns, mid-face',
  },
  {
    file: 'm-facelift-hand.webp',
    kind: 'model',
    from: 'img/feature/facelift/02.jpg',
    aspect: 4 / 5,
    width: 1200,
    alt: 'A woman with a hand held to her cheek, looking at the camera',
    used: 'index.html concerns, lower face',
  },
  {
    file: 'm-lips.webp',
    kind: 'model',
    from: 'img/feature/necklift/01.jpg',
    aspect: 4 / 5,
    width: 1200,
    alt: 'A woman with auburn hair, a hand at her jaw',
    used: 'index.html concerns, lips',
  },
  {
    file: 'm-man-suit.webp',
    kind: 'model',
    from: 'img/masthead/home/05.jpg',
    aspect: 16 / 9,
    width: 1600,
    alt: 'A man in a checked jacket looking out of a doorway',
    used: 'index.html concerns, men',
  },
  {
    file: 'm-eyes-young.webp',
    kind: 'model',
    from: 'img/feature/face-skin-rejuvenation/05.jpg',
    aspect: 4 / 5,
    width: 1200,
    alt: 'A woman looking to one side, light on her eyes',
    used: 'treatments',
  },
]

function convert(src, dst, width, aspect) {
  const script = `
import sys
from PIL import Image, ImageOps
src, dst, max_w, aspect = sys.argv[1], sys.argv[2], int(sys.argv[3]), float(sys.argv[4])
im = ImageOps.exif_transpose(Image.open(src))
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
  const out = execFileSync('python', ['-c', script, src, dst, String(width), String(aspect)], {
    encoding: 'utf8',
  })
  const [w, h] = out.trim().split(/\s+/).map(Number)
  return { w, h }
}

if (!fs.existsSync(SRC)) {
  console.error(`Drive export not found at:\n  ${SRC}`)
  process.exit(1)
}
fs.mkdirSync(ASSETS, { recursive: true })

const manifest = fs.existsSync(MANIFEST)
  ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
  : { source: 'client Google Drive export, 01-content-intake/.tmp/google-drive-images', slots: {} }
manifest.note =
  'Two kinds of slot: `practice` is the practice’s own photography, `model` is the portrait library from the previous site. A model slot may show a person as a person and never as a patient or a result. See the header of import-client-images.mjs.'

let done = 0
for (const item of IMPORTS) {
  if (only && item.file !== only) continue
  const src = path.join(SRC, item.from)
  const dst = path.join(ASSETS, item.file)
  if (!fs.existsSync(src)) {
    console.error(`MISSING SOURCE  ${item.from}`)
    process.exitCode = 1
    continue
  }
  if (fs.existsSync(dst) && !force && !only) {
    console.log(`skip  ${item.file}  (exists)`)
    continue
  }
  const { w, h } = convert(src, dst, item.width, item.aspect)
  const kb = (fs.statSync(dst).size / 1024).toFixed(0)
  const orig = execFileSync(
    'python',
    ['-c', 'import sys;from PIL import Image;im=Image.open(sys.argv[1]);print(im.width,im.height)', src],
    { encoding: 'utf8' }
  ).trim()
  manifest.slots[item.file] = {
    kind: item.kind,
    from: item.from,
    sourceSize: orig,
    output: `${w}x${h}`,
    alt: item.alt,
    used: item.used,
    note: item.note,
  }
  console.log(`ok    ${item.file}  ${w}x${h}  ${kb}KB   <- ${item.from} (${orig})`)
  done++
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
console.log(`\n${done} imported, manifest -> client-manifest.json`)
