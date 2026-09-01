/**
 * Imports the practice's OWN photography out of the client's Drive export into
 * assets/, as WebP at the site's sizes.
 *
 * WHAT THIS DELIBERATELY DOES NOT IMPORT, and why.
 *
 * The export is the sister site's whole asset tree, 187 images. Almost all of
 * it is a STOCK MODEL LIBRARY: about forty studio beauty portraits filed under
 * treatment names (`cosmetic-facial-surgery/blepharoplasty.jpg` is a stock
 * model, not a blepharoplasty patient). Those are not imported.
 *
 * > [!IMPORTANT]
 * > A face on a treatment page reads as that treatment's RESULT. That is the
 * > same rule that stopped generate-images.mjs producing faces, and buying the
 * > face from a stock library instead of a diffusion model does not change what
 * > the reader concludes from it. Model portraits belong on lifestyle and
 * > category surfaces, not above "Who it suits".
 *
 * > [!IMPORTANT]
 * > `img/before-after/` holds REAL, IDENTIFIABLE PATIENTS. It is not imported
 * > here and must not be until consent is confirmed in writing. See
 * > HANDOFF.md. One of them, `image1.jpg`, is captioned "Courtesy of G.
 * > Mueller MD": it is the DEVICE MANUFACTURER'S marketing image of another
 * > surgeon's patient, and publishing it as a Stone result would be a
 * > fabricated outcome regardless of consent.
 *
 * What IS imported is the genuinely real, genuinely Stone material: the rooms,
 * the signage, the team, and one staff portrait. Those beat anything generated,
 * because they are the actual practice.
 *
 * Usage: node import-client-images.mjs [--force]
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

/* aspect: 16/9 for bands, 4/5 for the portrait cards on About. */
const IMPORTS = [
  {
    file: 'ssa-signage.webp',
    from: 'img/masthead/auxilary/03.jpg',
    aspect: 16 / 9,
    width: 1600,
    alt: 'The Stone Surgical Arts sign on the practice wall',
    used: 'about.html, and available as a closing band anywhere',
    note: 'The practice’s own signage. Real, on brand, and it says whose building you are in.',
  },
  {
    file: 'ssa-treatment-room.webp',
    from: 'img/masthead/auxilary/01.jpg',
    aspect: 16 / 9,
    width: 1600,
    alt: 'A treatment room at the practice with the laser platform and a product display',
    used: 'laser-resurfacing.html, morpheus8.html',
    note: 'The actual devices in the actual room. Replaces a generated laser handpiece.',
  },
  {
    file: 'ssa-front-desk.webp',
    from: 'img/masthead/auxilary/04.jpg',
    aspect: 16 / 9,
    width: 1600,
    alt: 'Two members of the practice team at the front desk beneath the Stone Surgical Arts sign',
    used: 'book.html',
    note: 'Shows the people you actually meet. Has faces, but they are STAFF at a desk, which cannot be read as a clinical result.',
  },
  {
    file: 'ssa-team.webp',
    from: 'img/masthead/auxilary/our-team.jpg',
    aspect: 16 / 9,
    width: 1600,
    alt: 'The Stone Surgical Arts team seated together',
    used: 'about.html',
    note: 'The real team. Named individuals are still not identified in copy without confirmation.',
  },
  {
    file: 'ssa-consult-room.webp',
    from: 'img/masthead/cosmetic-facial-surgery/glow-with-hydra-gacial-bg-img.jpg',
    aspect: 16 / 9,
    width: 1600,
    alt: 'A consultation room at the practice with an armchair, a side table and daylight through tall blinds',
    used: 'treatments.html consultation band, injectables.html',
    note: 'A real consult room. Better than gen-consult-pair for the same slot.',
  },
  {
    file: 'staff-brooke.webp',
    from: 'img/staff/brooke.jpg',
    aspect: 4 / 5,
    width: 640,
    alt: 'Brooke, nurse injector at Stone Surgical Arts',
    used: 'about.html team grid',
    note: 'SOURCE IS ONLY 597x615, which is small for this slot. Upscaled separately by upscale-client-images.mjs; this is the straight import and the fallback.',
  },
]

function convert(src, dst, width, aspect) {
  const script = `
import sys
from PIL import Image
src, dst, max_w, aspect = sys.argv[1], sys.argv[2], int(sys.argv[3]), float(sys.argv[4])
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

let done = 0
for (const item of IMPORTS) {
  const src = path.join(SRC, item.from)
  const dst = path.join(ASSETS, item.file)
  if (!fs.existsSync(src)) {
    console.error(`MISSING SOURCE  ${item.from}`)
    process.exitCode = 1
    continue
  }
  if (fs.existsSync(dst) && !force) {
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
