/**
 * BugHerd #15 (/team, "Inside the office" strip): the client asked for Drive's
 * "Stone-Treatment-Room" in place of the equipment shot. Drive only has it at
 * 696x371, and the strip frame renders up to ~870px wide (1740 on a retina
 * screen), so it is enlarged first -- with Freepik's PRECISION upscaler (2x,
 * 1392x736). The creative Magnific upscaler (4x, creativity 0, resemblance 3)
 * was tried first and rejected: it repainted the surgical light as a patterned
 * dome and turned the face in the wall art into an abstract splash. Look at the
 * light and the painting after any re-run.
 *
 * Source: 01-content-intake/.tmp/google-drive-images/Stone-Treatment-Room.webp
 *   (`node scripts/drive.mjs get 1shPBExqRWu3bqrcPIIuRY6IxL0aQ76eK <dir>`)
 * Output: assets/stone-treatment-room.webp, 16:9 at native size (a NEW filename:
 *   Instatic skips a media upload whose basename it already has).
 *
 * Usage: node upscale-treatment-room.mjs [--force]
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.resolve(HERE, '../../../../01-content-intake/.tmp/google-drive-images/Stone-Treatment-Room.webp')
const DST = path.join(HERE, 'assets', 'stone-treatment-room.webp')
const RAW = path.join(HERE, 'assets', '_upscaled', 'stone-treatment-room.png')
const force = process.argv.includes('--force')

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
  throw new Error('no MAGNIFIC key in env or any .env above')
}
const KEY = apiKey()

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

async function upscale(buf) {
  const created = await api('POST', 'https://api.freepik.com/v1/ai/image-upscaler-precision', {
    image: buf.toString('base64'),
    sharpen: 7,
    smart_grain: 7,
    ultra_detail: 30,
  })
  const id = created.data.task_id
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 4000))
    const s = await api('GET', `https://api.freepik.com/v1/ai/image-upscaler-precision/${id}`)
    if (s.data.status === 'COMPLETED' && s.data.generated?.length) return s.data.generated[0]
    if (s.data.status === 'FAILED') throw new Error(`task failed: ${s.data.error ?? 'unknown'}`)
  }
  throw new Error('timed out waiting for the upscaler')
}

if (!fs.existsSync(RAW) || force) {
  // The API rejects webp input; hand it a PNG.
  const png = RAW.replace(/\.png$/, '.src.png')
  fs.mkdirSync(path.dirname(RAW), { recursive: true })
  execFileSync('python', ['-c', 'import sys;from PIL import Image;Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2])', SRC, png])
  console.log('upscaling ...')
  const url = await upscale(fs.readFileSync(png))
  const bin = await fetch(url)
  if (!bin.ok) throw new Error(`download ${bin.status}`)
  fs.writeFileSync(RAW, Buffer.from(await bin.arrayBuffer()))
}

const out = execFileSync('python', ['-c', `
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGB")
w, h = im.size
aspect = 16 / 9
if w / h > aspect:
    nw = round(h * aspect); left = (w - nw) // 2; im = im.crop((left, 0, left + nw, h))
else:
    nh = round(w / aspect); top = (h - nh) // 2; im = im.crop((0, top, w, top + nh))
im.save(sys.argv[2], "WEBP", quality=86, method=6)
print(im.width, im.height)
`, RAW, DST], { encoding: 'utf8' })
console.log(`ok  assets/stone-treatment-room.webp  ${out.trim()}  ${(fs.statSync(DST).size / 1024).toFixed(0)}KB`)
