/**
 * The one photograph of the building, into assets/ssa-exterior.webp.
 *
 * WHY. The client, 2026-09-04, on the home page's neon band: "we need to
 * change this image for the front of the location, if you can't find a local
 * photo, grab one from the internet." The practice owns no exterior
 * photograph. The sister site's "banner-office-bg-img" on the Webflow CDN,
 * which get-assets.mjs files as office-exterior, is the reception desk, not
 * the building. The only exterior that exists anywhere is Southlake Style's
 * TRG_1543 from the 12 February 2021 opening: stone and stucco, the SSA sign
 * over the entrance, blue sky, a cluster of opening balloons at the door.
 * See 01-content-intake/.tmp/press-photos/README.md.
 *
 * > [!IMPORTANT]
 * > THE COPYRIGHT IS SOUTHLAKE STYLE'S AND ITS PHOTOGRAPHER'S, not the
 * > practice's. It is on the site on the client's instruction above, and the
 * > README's one-line permission ask still has to be sent before the domain
 * > goes live. If permission is refused, this slot goes back to the neon
 * > (assets/ssa-neon.webp, one line in pages/home.body.html).
 *
 * WHAT THIS DOES. Downloads the largest rendition the magazine serves
 * (1601x2400, portrait), cuts the 16:9 band that holds the roofline, the
 * sign and the doors, and runs it through Magnific at 2x (standard preset,
 * creativity 1: a building, nothing to reinterpret) so the full-bleed band
 * has 3200px to work with on a 2K screen. Provenance goes to
 * press-manifest.json.
 *
 * Usage: node import-exterior.mjs [--force]
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ASSETS = path.join(HERE, 'assets')
const RAW = path.join(ASSETS, '_upscaled')
const PRESS = path.resolve(HERE, '../../../../01-content-intake/.tmp/press-photos')
const MANIFEST = path.join(HERE, 'press-manifest.json')
const force = process.argv.includes('--force')

const SOURCE_URL =
  'https://www.southlakestyle.com/downloads/22129/download/TRG_1543.jpg?cb=1fd6ff376b76b92fdba171490d36a028&w=1601&h=2400'
const PAGE_URL = 'https://www.southlakestyle.com/upcoming-events/photos/photos-stone-surgical-arts-opens-in-westlake/'
const SRC = path.join(PRESS, 'TRG_1543-1601.jpg')
const CROP = path.join(RAW, 'ssa-exterior.crop.png')
const UP = path.join(RAW, 'ssa-exterior.png')
const DST = path.join(ASSETS, 'ssa-exterior.webp')
// The band, as fractions of the 1601x2400 source: from just above the tiled
// roofline to the pavement, full width. 16:9 of 1601 is 900px tall.
const BAND_TOP = 0.395

function apiKey() {
  if (process.env.MAGNIFIC) return process.env.MAGNIFIC.trim()
  let dir = HERE
  for (let i = 0; i < 12; i++) {
    const c = path.join(dir, '.env')
    if (fs.existsSync(c)) {
      const line = fs.readFileSync(c, 'utf8').split('\n').find((l) => l.startsWith('MAGNIFIC='))
      if (line) return line.slice(9).trim().replace(/^["']|["']$/g, '')
    }
    const up = path.dirname(dir)
    if (up === dir) break
    dir = up
  }
  throw new Error('no MAGNIFIC and no .env found')
}

if (fs.existsSync(DST) && !force) {
  console.log('skip  ssa-exterior.webp (exists; --force to redo)')
  process.exit(0)
}
fs.mkdirSync(RAW, { recursive: true })
fs.mkdirSync(PRESS, { recursive: true })
if (!fs.existsSync(SRC)) {
  const r = await fetch(SOURCE_URL)
  if (!r.ok) throw new Error(`download ${r.status}`)
  fs.writeFileSync(SRC, Buffer.from(await r.arrayBuffer()))
}
const py = (script, ...args) => execFileSync('python', ['-c', script, ...args], { encoding: 'utf8' }).trim()
const cropped = py(
  `
import sys
from PIL import Image
src, dst, top = sys.argv[1], sys.argv[2], float(sys.argv[3])
im = Image.open(src).convert("RGB")
w, h = im.size
bh = round(w * 9 / 16); y = min(max(0, round(h * top)), h - bh)
im.crop((0, y, w, y + bh)).save(dst, "PNG")
print(w, bh, y)
`,
  SRC, CROP, String(BAND_TOP),
)
console.log(`crop  ${cropped}`)

const KEY = apiKey()
const api = async (method, url, body) => {
  const r = await fetch(url, { method, headers: { 'x-freepik-api-key': KEY, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  const text = await r.text()
  if (!r.ok) throw new Error(`${r.status} ${text.slice(0, 300)}`)
  return JSON.parse(text)
}
if (!fs.existsSync(UP) || force) {
  console.log('upscaling 2x ...')
  const created = await api('POST', 'https://api.freepik.com/v1/ai/image-upscaler', {
    image: fs.readFileSync(CROP).toString('base64'),
    scale_factor: '2x', optimized_for: 'standard', creativity: 1, hdr: 2, resemblance: 3, fractality: 0, engine: 'magnific_sharpy',
  })
  const id = created.data.task_id
  let url = null
  for (let i = 0; i < 120 && !url; i++) {
    await new Promise((r) => setTimeout(r, 5000))
    const s = await api('GET', `https://api.freepik.com/v1/ai/image-upscaler/${id}`)
    if (s.data.status === 'COMPLETED') url = s.data.generated[0]
    if (s.data.status === 'FAILED') throw new Error(`task failed: ${s.data.error ?? 'unknown'}`)
  }
  if (!url) throw new Error('timed out waiting for the upscaler')
  const bin = await fetch(url)
  fs.writeFileSync(UP, Buffer.from(await bin.arrayBuffer()))
}
const out = py(
  `
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGB")
if im.width > 3200: im = im.resize((3200, round(im.height * 3200 / im.width)), Image.LANCZOS)
im.save(sys.argv[2], "WEBP", quality=82, method=6)
print(im.width, im.height)
`,
  UP, DST,
)
const manifest = {
  source: 'Southlake Style, "Photos: Stone Surgical Arts opens in Westlake", 12 February 2021',
  pageUrl: PAGE_URL,
  copyright: 'Southlake Style and its photographer. NOT the practice’s. Permission not yet asked; see 01-content-intake/.tmp/press-photos/README.md.',
  placedOn: 'client instruction, 2026-09-04: "if you can’t find a local photo, grab one from the internet"',
  slots: {
    'ssa-exterior.webp': {
      from: 'TRG_1543.jpg (1601x2400 rendition)',
      crop: `16:9 band from ${BAND_TOP} of the height, full width`,
      upscale: 'Magnific 2x, standard, creativity 1',
      output: out.replace(' ', 'x'),
      bytes: fs.statSync(DST).size,
      alt: 'The front of the practice at 72 Andorra Drive: stone and stucco, the Stone Surgical Arts sign over the entrance',
      used: 'index.html — the place band (formerly the neon)',
    },
  },
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
console.log(`ok    ssa-exterior.webp ${out.replace(' ', 'x')}  ${(fs.statSync(DST).size / 1024).toFixed(0)}KB -> press-manifest.json`)
