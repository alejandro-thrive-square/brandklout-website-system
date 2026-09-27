#!/usr/bin/env node
/**
 * gen-card-face-swap.mjs — BugHerd #24. GENERATION ONLY: it produces candidate
 * images and writes them to `.tmp/pin24/`. It does not touch the site.
 *
 *   node gen-card-face-swap.mjs            # 1 candidate
 *   node gen-card-face-swap.mjs --n 3      # 3, to choose between
 *
 * > "We shouldn't add doctors who are not Dr. Nahlah. Let's try to edit this
 * > photo with the Magnific AI Generation API so we can swap the face for the
 * > Dr. Nahlah."   /our-facility, `#technology` card 05 "Milling machine"
 *
 * The card currently shows a licensed stock model who reads as a member of
 * staff. The practice's own principal is already photographed across the site,
 * and the client's instruction is to put HIS face on their own marketing image —
 * their doctor, their likeness rights, a decorative card rather than a record.
 *
 * ## What this is, and what it is not
 *
 * It is a composite: a real photograph of Dr. Nahlah's face over a stock body in
 * a stock laboratory. It is NOT a photograph of Dr. Nahlah at this practice's
 * milling machine, and nobody downstream should describe it as one. Worth the
 * practice knowing, because "is that really your lab?" is a fair question from a
 * patient and the honest answer is "that is our doctor, the room is stock".
 *
 * ## Endpoint
 *
 * `POST /v1/ai/gemini-2-5-flash-image-preview` takes a prompt plus up to three
 * `reference_images`, each a public URL or bare base64 (no `data:` prefix). It
 * returns a `task_id`; GET the same path with the id until `status` is
 * `COMPLETED` and `generated` carries the image URLs.
 *
 * The references are passed as URLs off the CMS rather than base64: the target
 * is 7008x4672 and inlining it is pointless when the model outputs ~1024px
 * anyway. The `-w1024.webp` variants are what the card can actually use.
 *
 * ## Cost
 *
 * Each candidate is a paid generation. The ledger records every task id and its
 * output, so a re-run after a crash reports rather than regenerates.
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import './insta-api.mjs'                       // loads the repo-root .env

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '.tmp', 'pin24')
const LEDGER = join(OUT, 'generated.json')
mkdirSync(OUT, { recursive: true })

const KEY = process.env.MAGNIFIC
if (!KEY) { console.error('MAGNIFIC is not set in the repo-root .env'); process.exit(1) }

const nArg = process.argv.indexOf('--n')
const N = nArg > -1 ? Number(process.argv[nArg + 1]) : 1

const BASE = 'https://encorercm.com'
const TARGET = `${BASE}/uploads/N77gckzCpwJYut5N9fmqB-26192-w1024.webp`      // the milling-machine card
/* A LANDSCAPE crop of Dr. Nahlah's headshot, made by `.tmp/crop.mjs`.
   The endpoint has no aspect-ratio parameter and the model takes its output
   shape from the references: with the portrait 1024x1280 headshot in the set it
   returned 896x1152 every time, however firmly the prompt asked for landscape.
   Two landscape references, and it keeps the landscape frame the card needs. */
const FACE = join(OUT, 'face-landscape.png')

/* Passed INLINE as bare base64, not as URLs. Freepik's fetcher gets a 403 from
   the Cloudflare edge in front of the CMS ("could not download image: the URL
   returned HTTP 403"), and the failure is a 400 on the POST — no task is
   created and no quota is spent, but nothing is generated either. The -w1024
   variants are ~100-150 KB each, so inlining two is a ~400 KB body. */
async function inline (src) {
  if (existsSync(src)) return readFileSync(src).toString('base64')
  const r = await fetch(src)
  if (!r.ok) throw new Error(`${r.status} fetching ${src}`)
  return Buffer.from(await r.arrayBuffer()).toString('base64')
}

/* The two men are close enough in age, build and colouring that the swap is
   plausible — but the model has thick dark hair and Dr. Nahlah's head is shaved,
   so the hairline has to travel with the face or the join is obvious. Everything
   else is pinned down explicitly, because what makes this usable is that ONLY
   the head changes: same pose, same lighting direction, same shallow depth of
   field, same white coat, same machine. */
const PROMPT = [
  'Edit the FIRST image. Do not reframe, re-crop, re-compose or re-render it.',
  'The FIRST image is a landscape photograph, 3:2, wider than it is tall: a technician in a white coat leaning in from the right over a white laboratory milling machine, smiling toward the camera, with the machine filling the left half.',
  'Your output MUST be the same landscape 3:2 photograph with the same framing, the same crop and the same composition. Do not output a portrait or square image.',
  "Change exactly one thing: the man's head is replaced by the head of the man in the SECOND image, so the technician becomes the man from the second photograph.",
  "Preserve that second man's identity precisely — his closely shaved scalp and receding hairline, the broad shape of his face and jaw, his eyebrows, the set of his eyes, his nose, his mouth and his short dark beard and moustache. A viewer who knows him must recognise him.",
  "Do NOT keep the first man's thick dark hair; his head is shaved.",
  'Keep the head at the identical angle, tilt, size and position in the frame as in the first image, and keep the same warm smile toward the camera.',
  "Match the first image's lighting exactly: soft bright light from the upper left, the same skin tone, the same soft shadow under the jaw, the same shallow depth of field.",
  'Everything else is untouched: the same white coat and collar, the same black-gloved hand and instrument, the same milling machine, the same out-of-focus white laboratory behind.',
  'Photorealistic. No visible seam at the neck or jaw. No text, logos or watermarks.',
].join(' ')

const headers = { 'Content-Type': 'application/json', 'x-freepik-api-key': KEY, 'x-magnific-api-key': KEY }
const EP = 'https://api.freepik.com/v1/ai/gemini-2-5-flash-image-preview'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const ledger = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : { tasks: [] }
const refs = [await inline(TARGET), await inline(FACE)]
console.log(`references inlined: ${refs.map((r) => Math.round(r.length / 1024) + 'KB').join(', ')}`)

async function generate (i) {
  const res = await fetch(EP, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt: PROMPT, reference_images: refs }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`POST ${res.status}: ${text.slice(0, 300)}`)
  const { data } = JSON.parse(text)
  console.log(`  ${i}  task ${data.task_id}  ${data.status}`)
  ledger.tasks.push({ i, task_id: data.task_id, at: new Date().toISOString() })
  writeFileSync(LEDGER, JSON.stringify(ledger, null, 2))      // before any polling

  for (let n = 0; n < 90; n++) {
    await wait(3000)
    const r = await fetch(`${EP}/${data.task_id}`, { headers })
    const t = await r.text()
    if (!r.ok) { console.log(`     poll ${r.status} ${t.slice(0, 120)}`); continue }
    const d = JSON.parse(t).data
    if (d.status === 'COMPLETED') return d.generated ?? []
    if (d.status === 'FAILED') throw new Error(`task ${data.task_id} FAILED`)
    if (n % 5 === 0) console.log(`     ${d.status}…`)
  }
  throw new Error(`task ${data.task_id} did not finish in 270s`)
}

const files = []
for (let i = 1; i <= N; i++) {
  const urls = await generate(i)
  for (const [j, u] of urls.entries()) {
    const bin = await fetch(u)
    if (!bin.ok) { console.log(`     ! download ${bin.status}`); continue }
    const buf = Buffer.from(await bin.arrayBuffer())
    /* Extension from the magic bytes, never from the URL. */
    const ext = buf.slice(0, 4).toString('hex').startsWith('89504e47') ? 'png'
      : buf.slice(0, 2).toString('hex') === 'ffd8' ? 'jpg'
        : buf.slice(8, 12).toString('ascii') === 'WEBP' ? 'webp' : 'bin'
    const f = join(OUT, `swap-${i}-${j}.${ext}`)
    writeFileSync(f, buf)
    files.push(f)
    console.log(`     -> ${f}  ${buf.length} bytes`)
  }
  ledger.tasks[ledger.tasks.length - 1].files = files.slice()
  writeFileSync(LEDGER, JSON.stringify(ledger, null, 2))
}

/* A contact sheet next to the original, so the candidates are judged as pictures
   at roughly the size the card renders them. */
const sheet = join(OUT, 'candidates.html')
writeFileSync(sheet,
  '<style>body{margin:0;background:#111;color:#eee;font:12px system-ui;padding:8px}' +
  'figure{display:inline-block;margin:0 6px 8px;width:430px}' +
  'img{width:430px;height:322px;object-fit:cover;display:block;background:#222}' +
  'figcaption{padding:3px 0}</style>' +
  `<figure><img src="${TARGET}"><figcaption>ORIGINAL (stock model)</figcaption></figure>` +
  files.map((f) => `<figure><img src="${f.split(/[\\/]/).pop()}"><figcaption>${f.split(/[\\/]/).pop()}</figcaption></figure>`).join(''))
console.log(`\n${files.length} candidate(s). Sheet: ${sheet}`)
console.log('NOTHING WAS UPLOADED OR PUBLISHED. Look at them first.')
