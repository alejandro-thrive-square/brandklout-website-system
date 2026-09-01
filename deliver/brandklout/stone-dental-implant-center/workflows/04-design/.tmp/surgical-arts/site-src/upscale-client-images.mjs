/**
 * Upscales the LOW-RESOLUTION images in the client's Drive export with
 * Magnific / Freepik's upscaler, and re-emits them at the site's sizes.
 *
 * WHY UPSCALE RATHER THAN REPLACE. Alejandro: "there are a lot that are low
 * resolution so try to search for similar ones using the Magnific API." For the
 * scenery that is right, and generate-images.mjs already does it. For a
 * PORTRAIT OF A NAMED MEMBER OF STAFF it is not: a similar-looking person is
 * not Brooke, and a generated or substituted likeness under her name and her
 * Instagram handle fabricates her. So the real 597x615 photograph is enlarged
 * rather than swapped for a better-lit stranger.
 *
 * An upscaler still invents detail, which is fine on a jumper and a background
 * and is worth a second look on a face. Check the output before shipping it;
 * the straight LANCZOS import from import-client-images.mjs stays the fallback
 * and is what the page uses if this never runs.
 *
 * Auth: MAGNIFIC in the repo-root .env, same key as generate-images.mjs.
 *
 * Usage:
 *   node upscale-client-images.mjs            upscale anything missing
 *   node upscale-client-images.mjs --force    redo everything
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ASSETS = path.join(HERE, 'assets')
const SRC = path.resolve(HERE, '../../../../01-content-intake/.tmp/google-drive-images')
const force = process.argv.includes('--force')

function apiKey() {
  if (process.env.MAGNIFIC) return process.env.MAGNIFIC.trim()
  let dir = HERE
  for (let i = 0; i < 12; i++) {
    const c = path.join(dir, '.env')
    if (fs.existsSync(c)) {
      const line = fs.readFileSync(c, 'utf8').split('\n').find((l) => l.startsWith('MAGNIFIC='))
      if (!line) throw new Error(`.env at ${c} has no MAGNIFIC line`)
      return line.slice(9).trim().replace(/^["']|["']$/g, '')
    }
    const up = path.dirname(dir)
    if (up === dir) break
    dir = up
  }
  throw new Error('no MAGNIFIC and no .env found')
}
const KEY = apiKey()

const JOBS = [
  {
    from: 'img/staff/brooke.jpg',
    file: 'staff-brooke.webp',
    aspect: 4 / 5,
    width: 800,
    why: 'About team card. Source is 597x615, the smallest real asset the site uses.',
  },
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

/* Async, same shape as Mystic: create a task, poll until COMPLETED. */
async function upscale(buf) {
  const created = await api('POST', 'https://api.freepik.com/v1/ai/image-upscaler', {
    image: buf.toString('base64'),
    scale_factor: '2x',
    optimized_for: 'standard',
    creativity: 0,          // 0 = do not reinterpret. It is a real person's face.
    hdr: 0,
    resemblance: 2,      // stay close to the source
    fractality: 0,
  })
  const id = created.data.task_id
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 4000))
    const s = await api('GET', `https://api.freepik.com/v1/ai/image-upscaler/${id}`)
    if (s.data.status === 'COMPLETED') return s.data.generated[0]
    if (s.data.status === 'FAILED') throw new Error(`task failed: ${s.data.error ?? 'unknown'}`)
  }
  throw new Error('timed out waiting for the upscaler')
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
im.save(dst, "WEBP", quality=86, method=6)
print(im.width, im.height)
`
  const out = execFileSync('python', ['-c', script, src, dst, String(width), String(aspect)], {
    encoding: 'utf8',
  })
  const [w, h] = out.trim().split(/\s+/).map(Number)
  return { w, h }
}

for (const job of JOBS) {
  const src = path.join(SRC, job.from)
  const dst = path.join(ASSETS, job.file)
  const marker = path.join(ASSETS, '_upscaled', job.file.replace(/\.webp$/, '.png'))

  if (!fs.existsSync(src)) {
    console.error(`MISSING SOURCE ${job.from}`)
    process.exitCode = 1
    continue
  }
  if (fs.existsSync(marker) && !force) {
    console.log(`skip  ${job.file} (already upscaled)`)
    continue
  }

  console.log(`upscaling ${job.from} ...`)
  const url = await upscale(fs.readFileSync(src))
  const bin = await fetch(url)
  if (!bin.ok) throw new Error(`download ${bin.status}`)
  fs.mkdirSync(path.dirname(marker), { recursive: true })
  fs.writeFileSync(marker, Buffer.from(await bin.arrayBuffer()))

  const { w, h } = toWebp(marker, dst, job.width, job.aspect)
  console.log(`ok    ${job.file}  ${w}x${h}  ${(fs.statSync(dst).size / 1024).toFixed(0)}KB`)
  console.log(`      raw upscale kept at assets/_upscaled/ for comparison (build-site skips _ files)`)
}
