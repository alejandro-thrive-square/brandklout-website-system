/**
 * Re-emits every photograph of Dr. Stone, and the practice's other small
 * photographs, at high resolution through Magnific (Freepik's upscaler).
 *
 * WHY. 2026-09-04, Alejandro: "Dr. Mona doesn't have very high-end pictures so
 * if we can regenerate the same image but on high resolution using Magnific,
 * would be great (those images have to look very realistic)." The largest
 * photograph of her the practice owns is 1000x1482; the rest are 450 to 700px
 * navigation tiles and a video thumbnail. On a 2K screen, in a hero, they are
 * soft. This is the SAME photograph enlarged, never a substitute: a similar
 * looking person is not Dr. Stone.
 *
 * REALISM. Creativity stays at 1 and resemblance at 3 so the upscaler adds
 * texture (fabric, hair, the marble) without reinterpreting a face. Check the
 * output on every face before shipping; assets/_upscaled/ keeps the raw PNG
 * next to what the page uses, and import-client-images.mjs is the fallback.
 *
 * THE STEPS PHOTOGRAPH is a video thumbnail: a play icon over her chest and a
 * dark overlay. The icon is patched out of her black top (uniform fabric,
 * cloned from beside it) and the levels lifted, before the upscale. If a
 * better original of that photograph ever arrives, drop it in and re-run.
 *
 * Auth: MAGNIFIC in the repo-root .env (a Freepik API key).
 *
 * Usage:
 *   node upscale-doctor.mjs             everything not yet upscaled
 *   node upscale-doctor.mjs --force     redo everything
 *   node upscale-doctor.mjs --only dr-stone-steps   one job, by file stem
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ASSETS = path.join(HERE, 'assets')
const RAW = path.join(ASSETS, '_upscaled')
const SRC = path.resolve(HERE, '../../../../01-content-intake/.tmp/google-drive-images')
const argv = process.argv.slice(2)
const force = argv.includes('--force')
const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null

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
const KEY = apiKey()

/* `width` is the emitted width; `aspect` is unchanged from
   import-client-images.mjs so no layout moves. `face` picks the portrait
   preset. `prep` names a python pre-pass (see below). */
const JOBS = [
  { file: 'dr-stone-standing.webp', from: 'img/feature/dr-mona-stone.jpg', scale: '2x', aspect: 2 / 3, width: 2000, face: true },
  { file: 'dr-stone-smile.webp', from: 'img/nav/dr-stone-nav-img.jpg', scale: '4x', aspect: 1, width: 1600, face: true },
  { file: 'dr-stone-desk.webp', from: 'img/nav/about-us.jpg', scale: '4x', aspect: 4 / 3, width: 2000, face: true },
  { file: 'dr-stone-candid.webp', from: 'img/feature/media/03.jpeg', scale: '4x', aspect: 1, width: 1400, face: true },
  // Levels only. The play icon is removed AFTER the upscale by fix-steps.py:
  // patching the 702px source first, three ways, had Magnific invent a fold
  // of fabric where the flat patch was. A crisp icon at 4x is easier to
  // replace than a hallucination.
  { file: 'dr-stone-steps.webp', from: 'img/feature/media/youtube.jpg', scale: '4x', aspect: 3 / 2, width: 2000, face: true, prep: 'steps' },
  { file: 'dr-stone-portrait.webp', abs: path.join(ASSETS, 'dr-stone-portrait.webp'), scale: '2x', aspect: 643 / 1020, width: 1200, face: true },
  { file: 'ssa-desk-laugh.webp', from: 'img/collage-03.jpg', scale: '4x', aspect: 2 / 3, width: 1200, face: true },
  { file: 'ssa-treatment-pair.webp', from: 'img/collage-01.jpg', scale: '4x', aspect: 2 / 3, width: 1200, face: true },
  { file: 'ssa-reception-pair.webp', from: 'img/nav/contact.jpg', scale: '4x', aspect: 4 / 3, width: 1600, face: true },
  { file: 'ssa-desk-detail.webp', from: 'img/nav/patient-resources.jpg', scale: '4x', aspect: 4 / 3, width: 1600, face: false },
  ...['alexis', 'breanna', 'jennifer', 'lv', 'team-diana-img', 'team-lellie-img'].map((n) => ({
    file: `staff-${n.replace(/^team-|-img$/g, '')}.webp`,
    from: `img/staff/${n}.jpg`,
    scale: '2x',
    aspect: 4 / 5,
    width: 960,
    face: true,
  })),
]

const api = async (method, url, body) => {
  const r = await fetch(url, {
    method,
    headers: { 'x-freepik-api-key': KEY, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`${r.status} ${text.slice(0, 300)}`)
  return JSON.parse(text)
}

async function upscale(buf, job) {
  const created = await api('POST', 'https://api.freepik.com/v1/ai/image-upscaler', {
    image: buf.toString('base64'),
    scale_factor: job.scale,
    optimized_for: job.face ? 'soft_portraits' : 'standard',
    creativity: 1,
    hdr: 2,
    resemblance: 3,
    fractality: 0,
    engine: 'magnific_sharpy',
  })
  const id = created.data.task_id
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 5000))
    const s = await api('GET', `https://api.freepik.com/v1/ai/image-upscaler/${id}`)
    if (s.data.status === 'COMPLETED') return s.data.generated[0]
    if (s.data.status === 'FAILED') throw new Error(`task failed: ${s.data.error ?? 'unknown'}`)
  }
  throw new Error('timed out waiting for the upscaler')
}

const PREP = {
  /* The play icon sits on the black scrub top; clone the fabric from its left
     under a soft round mask, then lift the thumbnail's dark overlay. */
  steps: `
import sys
from PIL import Image, ImageEnhance
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
im = ImageEnhance.Brightness(im).enhance(1.32)
im = ImageEnhance.Contrast(im).enhance(1.06)
im.save(dst, "PNG")
print(im.size)
`,
}

function toWebp(src, dst, width, aspect) {
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
im.save(dst, "WEBP", quality=84, method=6)
print(im.width, im.height)
`
  const out = execFileSync('python', ['-c', script, src, dst, String(width), String(aspect)], { encoding: 'utf8' })
  const [w, h] = out.trim().split(/\s+/).map(Number)
  return { w, h }
}

async function run(job) {
  const stem = job.file.replace(/\.webp$/, '')
  const src = job.abs ?? path.join(SRC, job.from)
  const dst = path.join(ASSETS, job.file)
  const marker = path.join(RAW, `${stem}.png`)
  if (!fs.existsSync(src)) return console.error(`MISSING SOURCE ${src}`)
  if (fs.existsSync(marker) && !force && !only) return console.log(`skip  ${job.file} (already upscaled)`)
  fs.mkdirSync(RAW, { recursive: true })

  let input = src
  if (job.prep) {
    input = path.join(RAW, `${stem}.prep.png`)
    execFileSync('python', ['-c', PREP[job.prep], src, input], { encoding: 'utf8' })
  }
  console.log(`upscaling ${job.file} ${job.scale} ...`)
  const url = await upscale(fs.readFileSync(input), job)
  const bin = await fetch(url)
  if (!bin.ok) throw new Error(`download ${bin.status}`)
  fs.writeFileSync(marker, Buffer.from(await bin.arrayBuffer()))
  const { w, h } = toWebp(marker, dst, job.width, job.aspect)
  console.log(`ok    ${job.file}  ${w}x${h}  ${(fs.statSync(dst).size / 1024).toFixed(0)}KB`)
}

const queue = JOBS.filter((j) => !only || j.file.startsWith(only))
const CONCURRENCY = 3
let failed = 0
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const job = queue.shift()
      try {
        await run(job)
      } catch (e) {
        failed++
        console.error(`FAIL  ${job.file}: ${e.message}`)
      }
    }
  }),
)
if (failed) process.exitCode = 1
