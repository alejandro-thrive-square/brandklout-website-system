/**
 * Imports the stock photography DR. STONE CHOSE HERSELF into assets/, as WebP
 * at the site's sizes, with a manifest entry per slot.
 *
 * WHERE IT COMES FROM. 01-content-intake/.tmp/Stock Images-20260904T185452Z-1-001/
 * Stock Images/ — twenty files the client sent on 2026-09-03, one folder, named
 * by treatment: Botox and Xeomin, chemical peels, Dysport, facial fillers, hair
 * restoration, Morpheus8, PRP. Nineteen are camera originals between 3936 and
 * 8768px wide (2 to 13 MB each) and one is a 5-second QuickTime clip. None can
 * go on a page as it is; this is the pass that makes them pages-sized, the
 * same way import-client-images.mjs does for the practice's own photographs.
 *
 * WHY A THIRD MANIFEST. client-manifest.json is the practice's own photography
 * and the previous site's model library; stock-manifest.json is what we
 * searched for on Magnific; generated-manifest.json is what we prompted. These
 * are a fourth provenance: stock the CLIENT picked and supplied, so the
 * licence question is hers rather than ours (recorded under `licenceNote`)
 * and the choice of picture is hers rather than ours. Every slot carries the
 * source filename, the source size, the output size and the alt text.
 *
 * > [!IMPORTANT]
 * > These photographs show TREATMENTS BEING PERFORMED, on models. They may
 * > appear beside the name of the treatment they depict, as a picture of the
 * > procedure. They may NOT appear inside a results grid, beside a "before"
 * > or "after" label, or under a caption that claims an outcome — the same
 * > rule client-manifest.json carries for the model library, and audit.mjs
 * > enforces the results-context half. One of the twenty, `Facial
 * > Fillers-3.jpeg`, IS a before-and-after collage of an unknown person's
 * > mouth; it is recorded below as excluded and never written to assets/.
 *
 * WHAT GOES ON A PAGE. The site sells every subject in the folder, all of them
 * on the treatments page (Skin: Morpheus8, chemical peels, PRP; Non-Surgical:
 * Botox and Xeomin, Dysport, fillers, hair restoration). No dossier page
 * exists for any of them. Four slots are placed on treatments.html — the
 * Skin and Non-Surgical category bands and the two instrument stills under
 * them, which were generated still lifes until now (the stills stay still
 * lifes: a 3.85:1 strip cannot hold a face, see ds-botox-brow). The rest are imported as
 * the library (`used: "library"`): sized, named, described, in the media
 * panel once uploaded, so the client can swap a photograph without a
 * developer, which is the point of the platform.
 *
 * SIZES. The same two shapes the rest of the site's photography uses: 16:9 at
 * 2200px for a band or a still (the 2K/4K width the full-bleed photographs
 * were re-exported at on 2026-09-02) and 4:5 at 1200px for a portrait column.
 * There is no srcset in the markup: Instatic generates the responsive
 * variants (w320 ... w1800) itself on upload, from the one file.
 *
 * THE CLIP. `Chemical peels-3.mov` is 2048x1080 H.264, 25fps, 5.04s, 31 MB.
 * It is converted (see VIDEO below) into video/, NOT assets/: no component on
 * this site plays video — dr-stone-steps.webp is a still of a video with the
 * play icon painted out — and upload-media.mjs has no MIME entry for .mp4, so
 * a clip in assets/ would be an unknown file in the upload. Adding a video
 * component is a design decision for Alejandro; the file is ready for it.
 *
 * Usage:
 *   node import-doctor-stock.mjs            convert anything missing
 *   node import-doctor-stock.mjs --force    reconvert everything
 *   node import-doctor-stock.mjs --only ds-morpheus-jaw.webp
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.resolve(
  HERE,
  '../../../../01-content-intake/.tmp/Stock Images-20260904T185452Z-1-001/Stock Images',
)
const ASSETS = path.join(HERE, 'assets')
const VIDEO = path.join(HERE, 'video')
const MANIFEST = path.join(HERE, 'doctor-stock-manifest.json')
const force = process.argv.includes('--force')
const onlyIx = process.argv.indexOf('--only')
const only = onlyIx > -1 ? process.argv[onlyIx + 1] : null

const WIDE = { aspect: 16 / 9, width: 2200 }
const TALL = { aspect: 4 / 5, width: 1200 }

/* One entry per output. `from` is the client's filename, verbatim. `cx` and
   `cy` are where the crop is centred, as fractions of the source, when the
   subject is not in the middle; 0.5 is a centre crop. `used` names the slot
   or says `library`. */
const IMPORTS = [
  // --- Botox and Xeomin ---------------------------------------------------
  {
    file: 'ds-botox-brow.webp',
    from: 'Botox and Xeomin treatments-3.jpeg',
    ...WIDE,
    alt: 'Gloved hands placing a fine syringe at the brow of a woman whose eyes are closed',
    used: 'library',
    note:
      'The neuromodulator picture: the needle at the frown line. Tried as the Non-Surgical still ' +
      'and taken out again the same day: that band is 3.85:1 at 1440 and showed the face from the ' +
      'brow to the mouth with the chin cut, which is the complaint this pass exists to close. It ' +
      'needs a frame that is at least 4:3.',
  },
  {
    file: 'ds-botox-smile.webp',
    from: 'Botox and Xeomin treatments-2.jpeg',
    ...WIDE,
    alt: 'A woman with long brown hair smiling, a hand at the back of her neck',
    used: 'library',
    note: 'A portrait on white, no treatment shown. 8768px at source.',
  },
  {
    file: 'ds-botox-silver.webp',
    from: 'Botox and Xeomin treatments.jpeg',
    ...WIDE,
    alt: 'A woman with silver-blonde hair, a hand resting at her cheek',
    used: 'library',
  },
  // --- Chemical peels -----------------------------------------------------
  {
    file: 'ds-peel-brush.webp',
    from: 'Chemical peels.jpeg',
    ...WIDE,
    cx: 0.42,
    alt: 'A peel being brushed onto the forehead of a woman in a towel headband',
    used: 'library',
    note: 'The source is 6652x2217, a 3:1 strip; the 16:9 crop is centred on the face.',
  },
  {
    file: 'ds-peel-lift.webp',
    from: 'Chemical peels-2.jpeg',
    ...WIDE,
    alt: 'A peel mask being lifted away from the cheek, close',
    used: 'library',
  },
  // --- Dysport --------------------------------------------------------------
  {
    file: 'ds-dysport-chair.webp',
    from: 'Dysport.jpeg',
    ...WIDE,
    cx: 0.6,
    alt: 'A practitioner in blue gloves treating the cheek of a woman reclined in the chair',
    used: 'library',
  },
  {
    file: 'ds-dysport-curls.webp',
    from: 'Dysport-2.jpeg',
    ...TALL,
    alt: 'A woman with dark curls smiling, fingertips at her cheekbones',
    used: 'library',
    note: 'A portrait, warm ground, no treatment shown. Fits a 4:5 column.',
  },
  // --- Facial fillers -------------------------------------------------------
  {
    file: 'ds-filler-smile.webp',
    from: 'Facial Fillers.jpeg',
    ...TALL,
    alt: 'A woman lying back and smiling, the practitioner’s hands framing her jaw',
    used: 'treatments.html — Non-Surgical category band',
    note: 'Replaces m-injectables. The face is centred in the source, so the 4:5 column crop holds it at every width.',
  },
  {
    file: 'ds-filler-fold.webp',
    from: 'Facial Fillers-2.jpeg',
    ...WIDE,
    cx: 0.45,
    alt: 'A syringe held at the fold beside the mouth of a woman in a towel headband',
    used: 'library',
  },
  // --- Hair restoration -----------------------------------------------------
  {
    file: 'ds-hair-mark.webp',
    from: 'Hair restoration-2.jpeg',
    ...WIDE,
    alt: 'A man’s hairline being marked with a pen before treatment',
    used: 'library',
  },
  {
    file: 'ds-hair-hand.webp',
    from: 'Hair restoration-3.jpeg',
    ...WIDE,
    alt: 'A woman with long dark hair, a hand pushed through it',
    used: 'library',
  },
  {
    file: 'ds-hair-pen.webp',
    from: 'Hair restoration.jpeg',
    ...TALL,
    alt: 'A microneedling pen at the hairline of a woman lying back',
    used: 'library',
    note: 'The only portrait frame in the folder, 4480x6720.',
  },
  // --- Morpheus8 ------------------------------------------------------------
  {
    file: 'ds-morpheus-jaw.webp',
    from: 'Morpheus8-2.jpeg',
    ...TALL,
    cx: 0.55,
    alt: 'A radiofrequency microneedling handpiece held to the jaw',
    used: 'treatments.html — Skin category band',
    note: 'Replaces m-freckles. Morpheus8 is the chapter’s lead treatment.',
  },
  {
    file: 'ds-morpheus-cheek.webp',
    from: 'Morpheus8.jpeg',
    ...WIDE,
    alt: 'The Morpheus8 handpiece held to a man’s cheek by a practitioner in blue gloves',
    used: 'library',
  },
  // --- PRP --------------------------------------------------------------------
  {
    file: 'ds-prp-syringes.webp',
    from: 'PRP treatment-3.jpeg',
    ...WIDE,
    alt: 'Three syringes of platelet-rich plasma laid on folded gauze',
    used: 'treatments.html — Skin still, "The plasma"',
    note: 'A real still life for a chapter that had a generated one.',
  },
  {
    file: 'ds-prp-draw.webp',
    from: 'PRP treatment-2.jpeg',
    ...WIDE,
    alt: 'A syringe of platelet-rich plasma drawn up beside a woman lying back',
    used: 'library',
  },
  {
    file: 'ds-prp-tube.webp',
    from: 'PRP treatment-4.jpeg',
    ...WIDE,
    alt: 'A spun tube of blood with the plasma separated, held in gloved hands',
    used: 'treatments.html — Non-Surgical still, "The spin"',
    note:
      'A still life for the chapter, like the theatre, the suture tray and the plasma above it. ' +
      'PRP belongs here too: hair restoration in this chapter is platelet-rich plasma to the scalp.',
  },
  {
    file: 'ds-prp-tray.webp',
    from: 'PRP treatment.jpeg',
    ...WIDE,
    alt: 'A syringe of platelet-rich plasma on the tray, close',
    used: 'library',
  },
]

/* Recorded, not imported. */
const EXCLUDED = {
  'Facial Fillers-3.jpeg': {
    reason:
      'A before-and-after collage of an unknown person’s mouth. A stock before/after presented ' +
      'on a surgery site reads as this practice’s result, which it is not; audit.mjs fails any ' +
      'stock file in a results context, so this one is not written to assets/ at all.',
    sourceSize: '4077x2333',
  },
}

/* The clip. Converted, described, not placed. */
const VIDEO_CLIP = {
  from: 'Chemical peels-3.mov',
  file: 'ds-peel-clip.mp4',
  poster: 'ds-peel-clip-poster.webp',
  alt: 'A peel being applied with a brush, five seconds, no sound',
}

function convert(src, dst, width, aspect, cx = 0.5, cy = 0.5) {
  const script = `
import sys
from PIL import Image, ImageOps
src, dst, max_w, aspect, cx, cy = sys.argv[1], sys.argv[2], int(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), float(sys.argv[6])
im = ImageOps.exif_transpose(Image.open(src))
if im.mode not in ("RGB", "RGBA"):
    im = im.convert("RGB")
w, h = im.size
if w / h > aspect:
    nw = round(h * aspect); left = min(max(0, round(w * cx - nw / 2)), w - nw); im = im.crop((left, 0, left + nw, h))
else:
    nh = round(w / aspect); top = min(max(0, round(h * cy - nh / 2)), h - nh); im = im.crop((0, top, w, top + nh))
if im.width > max_w:
    im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
im.save(dst, "WEBP", quality=82, method=6)
print(im.width, im.height)
`
  const out = execFileSync(
    'python',
    ['-c', script, src, dst, String(width), String(aspect), String(cx), String(cy)],
    { encoding: 'utf8' },
  )
  const [w, h] = out.trim().split(/\s+/).map(Number)
  return { w, h }
}

function sourceSize(src) {
  return execFileSync(
    'python',
    [
      '-c',
      'import sys;from PIL import Image, ImageOps;im=ImageOps.exif_transpose(Image.open(sys.argv[1]));print(im.width,im.height)',
      src,
    ],
    { encoding: 'utf8' },
  ).trim()
}

if (!fs.existsSync(SRC)) {
  console.error(`Stock folder not found at:\n  ${SRC}`)
  process.exit(1)
}
fs.mkdirSync(ASSETS, { recursive: true })
fs.mkdirSync(VIDEO, { recursive: true })

const manifest = fs.existsSync(MANIFEST)
  ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
  : { slots: {} }
manifest.source =
  'Stock photography chosen and supplied by Dr. Stone, 2026-09-03: ' +
  '01-content-intake/.tmp/Stock Images-20260904T185452Z-1-001/Stock Images/'
manifest.note =
  'Treatments being performed, on models. A slot may sit beside the name of the treatment it ' +
  'shows, as a picture of the procedure, and never inside a results grid, beside a before/after ' +
  'label or under a caption that claims an outcome. See the header of import-doctor-stock.mjs.'
manifest.licenceNote =
  'The client chose and supplied these files; the licence is theirs and was not shown to us. ' +
  'Brandklout should confirm it covers web use on the practice’s own site before the domain ' +
  'goes live. Every slot names its source file so the question can be asked per picture.'

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
  const { w, h } = convert(src, dst, item.width, item.aspect, item.cx, item.cy)
  const kb = (fs.statSync(dst).size / 1024).toFixed(0)
  manifest.slots[item.file] = {
    kind: 'chosen',
    from: item.from,
    sourceSize: sourceSize(src),
    output: `${w}x${h}`,
    bytes: fs.statSync(dst).size,
    alt: item.alt,
    used: item.used,
    ...(item.note ? { note: item.note } : {}),
  }
  console.log(`ok    ${item.file.padEnd(26)} ${w}x${h}  ${kb}KB   <- ${item.from}`)
  done++
}

/* --- VIDEO ------------------------------------------------------------------
   H.264 in an MP4 with the moov atom first so it can start before it has
   fully loaded, 1920 wide, no audio track (the source has none worth keeping
   and an autoplaying clip must be muted anyway), quality 26, which lands the
   five seconds near 1.5 MB against 31 MB. The poster is the first frame as
   WebP at the same width, so a component can show something before the clip
   plays and so the clip has a still for reduced-motion. */
const clipSrc = path.join(SRC, VIDEO_CLIP.from)
const clipDst = path.join(VIDEO, VIDEO_CLIP.file)
const posterDst = path.join(VIDEO, VIDEO_CLIP.poster)
if (fs.existsSync(clipSrc) && (force || !fs.existsSync(clipDst)) && !only) {
  execFileSync('ffmpeg', [
    '-y', '-v', 'error', '-i', clipSrc, '-an',
    '-vf', 'scale=1920:-2', '-c:v', 'libx264', '-preset', 'slow', '-crf', '26',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', clipDst,
  ])
  const posterPng = posterDst.replace(/\.webp$/, '.png')
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', clipDst, '-frames:v', '1', posterPng])
  execFileSync('python', [
    '-c',
    'import sys;from PIL import Image;Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2],"WEBP",quality=82,method=6)',
    posterPng, posterDst,
  ])
  fs.unlinkSync(posterPng)
  const probe = execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration:stream=width,height',
    '-of', 'csv=p=0', clipDst,
  ], { encoding: 'utf8' }).trim().split(/\s+/)
  manifest.video = {
    from: VIDEO_CLIP.from,
    sourceSpec: '2048x1080 H.264 QuickTime, 25 fps, 5.04 s, 31.4 MB',
    file: `video/${VIDEO_CLIP.file}`,
    poster: `video/${VIDEO_CLIP.poster}`,
    output: probe.join(' '),
    bytes: fs.statSync(clipDst).size,
    alt: VIDEO_CLIP.alt,
    used: 'not placed — no component on the site plays video; see HANDOFF.md',
  }
  console.log(`ok    ${VIDEO_CLIP.file.padEnd(26)} ${(fs.statSync(clipDst).size / 1024 / 1024).toFixed(2)}MB + poster  <- ${VIDEO_CLIP.from}`)
}

manifest.excluded = EXCLUDED
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
console.log(`\n${done} imported, manifest -> doctor-stock-manifest.json`)
