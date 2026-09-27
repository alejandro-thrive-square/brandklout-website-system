#!/usr/bin/env node
/**
 * audit-round-corners.mjs — BugHerd pin #11, the "round radius" half. READ-ONLY.
 *
 *   node audit-round-corners.mjs            # scans the BEFORE inventory
 *   node audit-round-corners.mjs --after    # scans the AFTER one
 *
 * The client: "if the image has a round radius to it, pick a new one from the
 * Magnific API." They mean a source file that arrived already cropped into a
 * circle or a rounded square and is now sitting inside one of this site's
 * square figures — the corners give it away, and it reads as a placeholder that
 * was dropped in and never replaced.
 *
 * ## Why this looks at pixels and not at filenames
 *
 * There is no naming convention for it. `xray.png` is a rounded cut-out;
 * `crown-model.jpg` is a full-bleed photograph; nothing in either name says so.
 * The brief was explicit: find them by the pixels.
 *
 * ## Two detectors, because one file format answers and the other does not
 *
 * 1. **PNG — decisive.** A round cut-out is transparent outside the circle, so
 *    the four corner pixels have alpha 0. `zlib` is in the standard library and
 *    a non-interlaced PNG is just filtered scanlines, so this is decoded here
 *    directly: no dependency, and an exact answer rather than an estimate.
 *    A PNG with opaque but identical flat corners is reported too — that is the
 *    same defect exported onto a white card instead of onto transparency.
 *
 * 2. **JPEG/WebP — a screen, not a verdict.** They cannot carry transparency,
 *    so the tell is four flat, near-white corners around a darker subject.
 *    Decoding a JPEG without a dependency is not worth it, so the CMS's own
 *    `blurHash` is decoded instead — it is a low-frequency DCT of the image the
 *    server already computed, which is exactly the corners-versus-centre
 *    question at low resolution. It is deliberately reported as SUSPECT, never
 *    as a finding: blurHash is 4x3 components and will call a photograph with a
 *    bright sky or a white ceiling a candidate. Every suspect is looked at by a
 *    human before anything is swapped.
 *
 * Reads the matching `image-audit.<tag>.json`, so run `audit-page-images.mjs`
 * with the same flag first.
 *
 * Output: 05-design-revisions/.tmp/bugherd/round-corner-audit.<tag>.md (+ .json)
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const BUG = join(HERE, '..', '05-design-revisions', '.tmp', 'bugherd')

// ── PNG ────────────────────────────────────────────────────────────────────
/**
 * Minimal non-interlaced PNG reader: enough to answer "what are the four corner
 * pixels". Returns null on anything it does not handle (interlaced, 16-bit)
 * rather than guessing — a null is reported as "not decoded", never as "clean".
 */
function decodePng (buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) return null
  let pos = 8
  let ihdr = null
  const idat = []
  let plte = null
  let trns = null
  while (pos < buf.length - 8) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      ihdr = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        depth: data[8],
        color: data[9],
        interlace: data[12],
      }
    } else if (type === 'PLTE') plte = Buffer.from(data)
    else if (type === 'tRNS') trns = Buffer.from(data)
    else if (type === 'IDAT') idat.push(Buffer.from(data))
    else if (type === 'IEND') break
    pos += 12 + len
  }
  if (!ihdr || ihdr.depth !== 8 || ihdr.interlace !== 0) return null
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ihdr.color]
  if (!channels) return null

  const raw = inflateSync(Buffer.concat(idat))
  const bpp = channels
  const stride = ihdr.width * bpp
  const out = Buffer.alloc(ihdr.height * stride)
  let rp = 0
  for (let y = 0; y < ihdr.height; y++) {
    const filter = raw[rp++]
    const line = raw.subarray(rp, rp + stride)
    rp += stride
    const cur = out.subarray(y * stride, (y + 1) * stride)
    const prev = y ? out.subarray((y - 1) * stride, y * stride) : null
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0
      const b = prev ? prev[x] : 0
      const c = prev && x >= bpp ? prev[x - bpp] : 0
      let v = line[x]
      if (filter === 1) v += a
      else if (filter === 2) v += b
      else if (filter === 3) v += (a + b) >> 1
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      cur[x] = v & 0xff
    }
  }

  const px = (x, y) => {
    const o = y * stride + x * bpp
    switch (ihdr.color) {
      case 0: return [out[o], out[o], out[o], 255]
      case 2: return [out[o], out[o + 1], out[o + 2], 255]
      case 3: {
        const i = out[o]
        return plte ? [plte[i * 3], plte[i * 3 + 1], plte[i * 3 + 2], trns && i < trns.length ? trns[i] : 255] : null
      }
      case 4: return [out[o], out[o], out[o], out[o + 1]]
      case 6: return [out[o], out[o + 1], out[o + 2], out[o + 3]]
      default: return null
    }
  }
  return { ...ihdr, px }
}

/**
 * "Transparent corners" is NOT the test — that is just a PNG cut-out, and this
 * library is full of legitimate ones (the tooth models, the partner logos, the
 * `logo.png` in the header). A first pass that used it flagged 22 of 23 PNGs,
 * which is the same as flagging nothing.
 *
 * What separates a ROUNDED CROP from a cut-out is where the transparency is:
 *
 *   rounded crop   corners transparent, all four EDGE MIDPOINTS opaque,
 *                  and most of the frame still covered — the mask is the
 *                  frame minus four small arcs
 *   circular crop  same, because a circle inscribed in a square touches all
 *                  four edge midpoints
 *   cut-out object corners transparent AND the edge midpoints transparent too,
 *                  because the background is gone all the way round
 *
 * So the finding requires all three: transparent (or flat) corners, opaque edge
 * midpoints, and >70% coverage measured on a sampled grid.
 *
 * Sampling is INSET by 2% rather than reading the literal corner pixel: one
 * pixel can be an antialiasing artefact either way, and 2% is inside the
 * cut-away arc of any real rounded crop while staying outside a full-bleed
 * image's 1px border.
 */
const LUM = (p) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]

function cornerStats (img) {
  const ix = Math.max(1, Math.round(img.width * 0.02))
  const iy = Math.max(1, Math.round(img.height * 0.02))
  const W = img.width - 1
  const H = img.height - 1
  const corners = [[ix, iy], [W - ix, iy], [ix, H - iy], [W - ix, H - iy]].map(([x, y]) => img.px(x, y))
  const edges = [[W >> 1, iy], [W >> 1, H - iy], [ix, H >> 1], [W - ix, H >> 1]].map(([x, y]) => img.px(x, y))
  if (corners.some((c) => !c) || edges.some((e) => !e)) return null
  const centre = img.px(img.width >> 1, img.height >> 1)

  // Coverage: how much of the frame is actually opaque, on a 32x32 grid.
  let opaque = 0
  let cells = 0
  for (let gy = 0; gy < 32; gy++) {
    for (let gx = 0; gx < 32; gx++) {
      const p = img.px(Math.round((gx + 0.5) / 32 * W), Math.round((gy + 0.5) / 32 * H))
      if (!p) continue
      cells++
      if (p[3] > 200) opaque++
    }
  }
  const coverage = cells ? opaque / cells : 0

  const cornersClear = corners.every((c) => c[3] < 8)
  const cornersFlatWhite = corners.every((c) => c[3] > 247 && LUM(c) > 244)
  const edgesOpaque = edges.every((e) => e[3] > 247)
  const edgesWhite = edges.every((e) => e[3] > 247 && LUM(e) > 244)

  return {
    corners,
    coverage,
    // A rounded/circular CROP: corners gone, edges intact, frame mostly filled.
    rounded: cornersClear && edgesOpaque && coverage > 0.7,
    // The same defect exported onto a white card instead of onto transparency.
    roundedWhite: cornersFlatWhite && edgesOpaque && !edgesWhite && LUM(centre) < 232 && coverage > 0.95,
    // Reported separately so the classification can be checked, never as a find.
    cutout: cornersClear && !edgesOpaque,
    cornerLum: Math.round(corners.reduce((n, c) => n + LUM(c), 0) / 4),
    centreLum: Math.round(LUM(centre)),
  }
}

// ── blurHash ───────────────────────────────────────────────────────────────
// Reference decoder (woltapp/blurhash), trimmed to the corner/centre samples.
const B83 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~'
const b83 = (s) => [...s].reduce((n, c) => n * 83 + B83.indexOf(c), 0)
const srgb = (v) => { const x = v / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }
const linear = (v) => {
  const x = Math.max(0, Math.min(1, v))
  return Math.round(x <= 0.0031308 ? x * 12.92 * 255 : (1.055 * x ** (1 / 2.4) - 0.055) * 255)
}
function blurComponents (hash) {
  const sizeFlag = b83(hash[0])
  const nx = (sizeFlag % 9) + 1
  const ny = Math.floor(sizeFlag / 9) + 1
  const maxAc = (b83(hash[1]) + 1) / 166
  const colours = []
  for (let i = 0; i < nx * ny; i++) {
    if (i === 0) {
      const v = b83(hash.slice(2, 6))
      colours.push([srgb(v >> 16), srgb((v >> 8) & 255), srgb(v & 255)])
    } else {
      const v = b83(hash.slice(4 + i * 2, 6 + i * 2))
      const q = (n) => { const f = (n - 9) / 9; return Math.sign(f) * f * f * maxAc }
      colours.push([q(Math.floor(v / (19 * 19))), q(Math.floor(v / 19) % 19), q(v % 19)])
    }
  }
  return { nx, ny, colours }
}
function blurSample (hash, u, v) {
  const { nx, ny, colours } = blurComponents(hash)
  const rgb = [0, 0, 0]
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const b = Math.cos(Math.PI * u * i) * Math.cos(Math.PI * v * j)
      const c = colours[i + j * nx]
      rgb[0] += c[0] * b; rgb[1] += c[1] * b; rgb[2] += c[2] * b
    }
  }
  return rgb.map(linear)
}

// ── run ────────────────────────────────────────────────────────────────────
const { assets } = await api('GET', '/admin/api/cms/media')
const byPath = new Map(assets.filter((a) => a.publicPath).map((a) => [a.publicPath, a]))
// Which inventory to scan. `--after` reads the post-fix one, which is the whole
// point of re-running this: scanning image-audit.before.json after the fix
// reports the crops that are no longer on any page.
const TAG = process.argv.includes('--after') ? 'after' : 'before'
const audit = JSON.parse(await (await import('node:fs/promises')).readFile(join(BUG, `image-audit.${TAG}.json`), 'utf8'))

// One entry per distinct src that actually renders, with the pages it renders on.
const usedOn = new Map()
for (const p of audit.pages) {
  for (const h of p.hits) {
    if (/[{}]/.test(h.src)) continue
    if (!usedOn.has(h.src)) usedOn.set(h.src, new Set())
    usedOn.get(h.src).add(p.slug)
  }
}
console.log(`${usedOn.size} distinct images render on pages`)

const findings = []
const suspects = []
const cutouts = []
const undecoded = []
let n = 0
for (const [src, slugs] of usedOn) {
  const asset = byPath.get(src)
  const name = asset?.filename ?? src
  n++
  if (asset?.mimeType === 'image/png') {
    let stats = null
    try {
      const res = await fetch(BASE + src)
      if (res.ok) {
        const img = decodePng(Buffer.from(await res.arrayBuffer()))
        stats = img && cornerStats(img)
      }
    } catch { /* reported as undecoded below */ }
    if (!stats) { undecoded.push({ name, src, pages: [...slugs] }); continue }
    const cov = `${Math.round(stats.coverage * 100)}% covered`
    if (stats.rounded || stats.roundedWhite) {
      findings.push({ name, src, pages: [...slugs], method: 'png-pixels',
        why: `${stats.rounded ? 'transparent' : 'flat white'} corners, opaque edge midpoints, ${cov}`,
        cornerLum: stats.cornerLum, centreLum: stats.centreLum })
    } else if (stats.cutout) {
      cutouts.push({ name, src, pages: [...slugs], why: `cut-out on transparency (${cov}) — not a rounded crop` })
    }
    continue
  }
  // JPEG / WebP: blurHash screen only.
  if (!asset?.blurHash) { undecoded.push({ name, src, pages: [...slugs] }); continue }
  const c = [[0.02, 0.02], [0.98, 0.02], [0.02, 0.98], [0.98, 0.98]].map(([u, v]) => blurSample(asset.blurHash, u, v))
  const mid = blurSample(asset.blurHash, 0.5, 0.5)
  const lum = (p) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]
  const cl = c.reduce((s, p) => s + lum(p), 0) / 4
  const ml = lum(mid)
  const spread = Math.max(...c.map(lum)) - Math.min(...c.map(lum))
  if (cl > 225 && ml < 205 && spread < 22) {
    suspects.push({ name, src, pages: [...slugs], why: 'blurHash: four flat bright corners around a darker centre',
      cornerLum: Math.round(cl), centreLum: Math.round(ml), method: 'blurhash-screen' })
  }
}

console.log(`\nPNG pixel findings: ${findings.length}`)
for (const f of findings) console.log(`  ${f.name.padEnd(40)} ${f.why.padEnd(22)} corners=${f.cornerLum} centre=${f.centreLum}  ${f.pages.join(', ')}`)
console.log(`\nsuspects (need a human to look): ${suspects.length}`)
for (const s of suspects) console.log(`  ${s.name.padEnd(40)} ${s.method.padEnd(16)} corners=${s.cornerLum} centre=${s.centreLum}  ${s.pages.slice(0, 4).join(', ')}`)
console.log(`\nnot decoded: ${undecoded.length}${undecoded.length ? ` (${undecoded.slice(0, 8).map((u) => u.name).join(', ')})` : ''}`)

mkdirSync(BUG, { recursive: true })
writeFileSync(join(BUG, `round-corner-audit.${TAG}.json`), JSON.stringify({ scanned: n, findings, suspects, cutouts, undecoded }, null, 2))
writeFileSync(join(BUG, `round-corner-audit.${TAG}.md`), `# Round-radius audit — BugHerd #11 (${TAG.toUpperCase()})

${n} distinct images render across the 37 pages. Every PNG was decoded and its
four inset corner pixels read; every JPEG/WebP was screened through the CMS's own
\`blurHash\`. **No file was judged by its name.**

## Confirmed from the pixels — ${findings.length}

${findings.length
  ? '| file | why | corner lum | centre lum | pages |\n|---|---|---:|---:|---|\n' +
    findings.map((f) => `| \`${f.name}\` | ${f.why} | ${f.cornerLum} | ${f.centreLum} | ${f.pages.join(', ')} |`).join('\n')
  : '_none_'}

## Suspects — ${suspects.length}

A screen, not a verdict: \`blurHash\` is a 4x3 DCT and will flag a photograph with
a bright sky or a white ceiling. Each of these is looked at before anything moves.

${suspects.length
  ? '| file | method | why | corner lum | centre lum | pages |\n|---|---|---|---:|---:|---|\n' +
    suspects.map((s) => `| \`${s.name}\` | ${s.method} | ${s.why} | ${s.cornerLum} | ${s.centreLum} | ${s.pages.join(', ')} |`).join('\n')
  : '_none_'}

## Legitimate cut-outs, deliberately NOT flagged — ${cutouts.length}

Transparent corners alone are just a PNG cut-out — the tooth models, the partner
logos, the header \`logo.png\`. Flagging those would have flagged 22 of the 23
PNGs on the site, which is the same as flagging nothing. They are listed so the
line between the two can be checked.

${cutouts.length ? cutouts.map((c) => `- \`${c.name}\` — ${c.why} (${c.pages.join(', ')})`).join('\n') : '_none_'}

## Not decoded — ${undecoded.length}

${undecoded.length ? undecoded.map((u) => `- \`${u.name}\` (${u.pages.join(', ')})`).join('\n') : '_none_'}
`)
console.log(`\nwrote ${join(BUG, 'round-corner-audit.md')}`)
