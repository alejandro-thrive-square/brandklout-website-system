#!/usr/bin/env node
/**
 * upscale-images.mjs — re-emit soft photographs at high resolution through Magnific (Freepik's
 * upscaler API), into <out>/<key>.png. THE SAME PHOTOGRAPH, ENLARGED, never a substitute.
 *
 * Origin: bk-mason-park-kids, workflows/03-core-pages/output/upscale-images.mjs (2026-09-08). Generalized
 * 2026-09-23: the job table is a JSON file instead of a constant.
 *
 * Settings are fixed on purpose: creativity 1, resemblance 3, hdr 2, engine magnific_sharpy,
 * `soft_portraits` on every frame with a person. Below ~500px a generative upscaler can return a
 * DIFFERENT FACE (Mason Park Kids: two of four 300px staff portraits came back as someone else at 4x
 * AND 2x). Judge the contact sheet (contact-sheet.py), never the settings; a rejected job gets
 * `"skip": true` with the reason, and the page keeps the soft original.
 *
 * Usage:
 *   node upscale-images.mjs --jobs upscale-jobs.json [--src-dir <dir>] [--out output/_upscaled]
 *                           [--force] [--only <key>] [--list]
 * upscale-jobs.json: [{ "key": "staff-gia", "from": "2023/12/Gia.jpg", "scale": "4x"|"2x",
 *                       "face": true, "skip": false, "note": "300x301 thumbnail" }, ...]
 *   `from` is relative to --src-dir (default: the jobs file's folder). `key` is the pool name the
 *   markup uses. A re-cut or re-upscaled image needs a NEW filename before upload: Instatic's media
 *   upload skips by basename.
 * Auth: MAGNIFIC (a Freepik API key) in the environment or the nearest .env.
 */
import fs from 'node:fs'
import path from 'node:path'

const argv = process.argv.slice(2)
const arg = (n) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : undefined }
const JOBS_FILE = arg('jobs')
if (!JOBS_FILE) { console.error('usage: --jobs upscale-jobs.json [--src-dir dir] [--out dir] [--force] [--only key] [--list]'); process.exit(2) }
const JOBS = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'))
const SRC = path.resolve(arg('src-dir') || path.dirname(path.resolve(JOBS_FILE)))
const OUT = path.resolve(arg('out') || path.join('output', '_upscaled'))
const force = argv.includes('--force')
const list = argv.includes('--list')
const only = arg('only')

function apiKey() {
  if (process.env.MAGNIFIC) return process.env.MAGNIFIC.trim()
  let dir = process.cwd()
  for (let i = 0; i < 12; i++) {
    const c = path.join(dir, '.env')
    if (fs.existsSync(c)) {
      const line = fs.readFileSync(c, 'utf8').split(/\r?\n/).find((l) => l.startsWith('MAGNIFIC='))
      if (line) return line.slice('MAGNIFIC='.length).trim().replace(/^["']|["']$/g, '')
    }
    const up = path.dirname(dir)
    if (up === dir) break
    dir = up
  }
  throw new Error('no MAGNIFIC in the environment or any .env above ' + process.cwd())
}

const srcOf = (j) => (path.isAbsolute(j.from) ? j.from : path.join(SRC, ...j.from.split('/')))

if (list) {
  for (const j of JOBS) console.log(`${j.key.padEnd(16)} ${j.scale}  ${fs.existsSync(srcOf(j)) ? 'src ok ' : 'MISSING'}  ${j.skip ? 'SKIP  ' : '      '}${j.note ?? ''}`)
  process.exit(0)
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
  for (let i = 0; i < 180; i++) {
    await new Promise((r) => setTimeout(r, 5000))
    const s = await api('GET', `https://api.freepik.com/v1/ai/image-upscaler/${id}`)
    if (s.data.status === 'COMPLETED') return s.data.generated[0]
    if (s.data.status === 'FAILED') throw new Error(`task failed: ${s.data.error ?? 'unknown'}`)
  }
  throw new Error('timed out waiting for the upscaler')
}

fs.mkdirSync(OUT, { recursive: true })
// `skip` is a recorded rejection, not a to-do. `--only <key>` still runs it, to try a better original.
const queue = JOBS.filter((j) => (only ? j.key === only : !j.skip))
let failed = 0
await Promise.all(Array.from({ length: 3 }, async () => {
  while (queue.length) {
    const job = queue.shift()
    const dst = path.join(OUT, `${job.key}.png`)
    try {
      if (fs.existsSync(dst) && !force) { console.log(`skip  ${job.key} (already upscaled)`); continue }
      const src = srcOf(job)
      if (!fs.existsSync(src)) { console.error(`MISSING SOURCE ${job.key}: ${src}`); failed++; continue }
      console.log(`upscaling ${job.key} ${job.scale} ...`)
      const url = await upscale(fs.readFileSync(src), job)
      const bin = await fetch(url)
      if (!bin.ok) throw new Error(`download ${bin.status}`)
      fs.writeFileSync(dst, Buffer.from(await bin.arrayBuffer()))
      console.log(`ok    ${job.key}  ${(fs.statSync(dst).size / 1048576).toFixed(1)}MB  -> ${dst}`)
    } catch (e) {
      failed++
      console.error(`FAIL  ${job.key}: ${e.message}`)
    }
  }
}))
console.log(`\nnext: python contact-sheet.py --jobs ${JOBS_FILE} --src-dir "${SRC}" --up "${OUT}" and LOOK at every face`)
if (failed) process.exitCode = 1
