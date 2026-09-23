// PROMOTED 2026-09-23 to deliver/process/tools/instatic-site/push/upload-media.mjs
// Origin: bk-west-la-implants/deliver/brandklout/west-la-implants/workflows/21-instatic-upload/upload-media.mjs. Paths now come from ../lib/paths.mjs (run from the client's workflow
// folder; build root = --site-src or SITE_SRC; outputs in <cwd>/.tmp) and the admin client from
// ../lib/site.mjs (refuses to run without INSTATIC_BASE_URL). Client-specific notes below are the
// origin's record; review them against the new site before --apply.
/**
 * Step 1 of the Stone Instatic upload — put the site's images into the media
 * library and record filename -> served URL.
 *
 * WHY THIS RUNS FIRST. The page importer turns `<img src="assets/x.webp">`
 * into an image node carrying that src verbatim. If the images are not in the
 * library and the srcs are not rewritten first, every page imports with a
 * broken image and the media panel stays empty — so the client cannot swap a
 * photograph without a developer, which is the whole point of the platform.
 *
 * The map it writes (`.tmp/media-map.json`) is what `build-import-input.mjs`
 * rewrites the HTML against.
 *
 * `site.css` and `site.js` are deliberately skipped: those are code assets on
 * the site shell, not media. See push-code-assets.mjs.
 *
 * Usage:
 *   node upload-media.mjs            upload anything not already there
 *   node upload-media.mjs --force    re-upload everything
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { api, requestForm, BASE } from '../lib/site.mjs'

const HERE = P.WORK // was this file's folder; outputs now go to <cwd>/.tmp
/* WEST LA IMPLANTS. The build is `site-src/dist`, and its media is NOT a flat
   `assets/` folder: `dist/media/img/*`, `dist/media/video/*` and `dist/fonts/*`.
   The markup references them by that PATH (`media/img/x.jpg`), so the media map
   is keyed by the path as written, and by the bare basename as well, so a CSS
   `url('../fonts/manrope-var.woff2')` finds the same entry.

   FONTS GO IN HERE, NOT THROUGH install-fonts.mjs. Instatic's font installer
   creates STATIC instances and silently ignores `font-variation-settings`, and
   this build's three faces are VARIABLE woff2 with weight ranges and an `opsz`
   axis. `font/woff2` is an accepted media mime (mediaUpload.ts sniffs the
   `wOF2` magic), so the variable files upload as ordinary media and the
   @font-face blocks — carried into the token code asset by push-site.mjs —
   point at `/uploads/...`.

   VIDEO TOO. `video/mp4` is accepted and `MAX_MEDIA_BYTES` is 50MB
   (server/handlers/cms/mediaUpload.ts); the largest file here is 7.4MB. */
const DIST = P.DIST
const MEDIA_DIRS = ['media/img', 'media/video', 'fonts']
const OUT = path.join(HERE, '.tmp', 'media-map.json')

const MIME = {
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
}

const force = process.argv.includes('--force')
// --only a.webp,b.webp  re-uploads just those names even though the library
// already has them. Added 2026-09-02 when ten photographs were re-exported at
// their 2200px source width for 4K screens: --force would have re-uploaded
// all 78 and orphaned 78 more (trap 11), for ten that changed.
const onlyIx = process.argv.indexOf('--only')
const only = onlyIx > -1 ? new Set(process.argv[onlyIx + 1].split(',')) : new Set()

/* --- AVIF is not uploadable to this platform ------------------------------
   Instatic sniffs the MIME from magic bytes and never trusts the declared
   type — correct, but its ISO-BMFF branch matches on `ftyp` alone and does not
   read the brand that follows. AVIF files begin `....ftypavif`, so both of
   this site's `.avif` assets were stored as **video/mp4**, with null
   dimensions and zero responsive variants. They upload "successfully" and
   then cannot render as images.

   Rather than patch the platform, convert at this boundary: the static build
   keeps its AVIFs (every browser handles them, and get-assets.mjs re-fetches
   them from the client's own CDN), and Instatic gets WebP. The media map
   records the ORIGINAL filename as the key, so the HTML rewrite still finds
   `assets/banner-ssa.avif` and points it at the uploaded `.webp`.

   Report upstream. Until it is fixed, never upload AVIF here. */
const TMPDIR = path.join(HERE, '.tmp', 'converted')

function avifToWebp(src, name) {
  fs.mkdirSync(TMPDIR, { recursive: true })
  const dest = path.join(TMPDIR, name.replace(/\.avif$/i, '.webp'))
  execFileSync(
    'python',
    [
      '-c',
      [
        'import sys',
        'from PIL import Image',
        'im = Image.open(sys.argv[1])',
        'if im.mode not in ("RGB", "RGBA"): im = im.convert("RGBA")',
        'im.save(sys.argv[2], "WEBP", quality=88, method=6)',
        'print(im.width, im.height)',
      ].join('\n'),
      src,
      dest,
    ],
    { encoding: 'utf8' },
  )
  return dest
}

// `files` holds the REFERENCE PATH relative to dist/ — `media/img/x.jpg` —
// because that is what the markup and the CSS write. `basename` is what the
// bytes upload under, since the library is flat.
const files = MEDIA_DIRS.flatMap((d) =>
  fs.existsSync(path.join(DIST, d))
    ? fs
        .readdirSync(path.join(DIST, d))
        .filter((f) => MIME[path.extname(f).toLowerCase()])
        .map((f) => `${d}/${f}`)
    : [],
).sort()
{
  // A flat library cannot hold two files with the same basename, and the map
  // would silently point both references at one of them.
  const seen = new Map()
  for (const rel of files) {
    const b = path.basename(rel)
    if (seen.has(b)) {
      console.error(`REFUSING: ${rel} and ${seen.get(b)} share a basename; the media library is flat.`)
      process.exit(1)
    }
    seen.set(b, rel)
  }
}

// What is already in the library, so a re-run is cheap and idempotent.
// `filename` is the field the list endpoint returns; the served URL is
// `publicPath` (NOT `url` — that cost one silent round of "undefined" URLs).
const existing = new Map()
{
  const listed = await api('GET', '/admin/api/cms/media?limit=500')
  for (const a of listed.assets ?? listed.rows ?? listed.items ?? []) {
    if (a.filename) existing.set(a.filename, a)
  }
}

// An asset stored with a video mime is a mis-sniffed AVIF from an earlier run.
// Soft-delete then purge it so the re-upload is not shadowed by a broken twin.
// An asset stored with a mime that does not match its extension is a
// mis-sniffed upload from an earlier run. Video and font assets are LEGITIMATE
// here (see the header), so the test is against what the extension wants.
for (const [name, a] of existing) {
  const want = MIME[path.extname(name).toLowerCase()]
  if (want && (a.mimeType ?? '') !== want) {
    try {
      await api('DELETE', `/admin/api/cms/media/${a.id}`)
      await api('DELETE', `/admin/api/cms/media/${a.id}?purge=1`).catch(() => {})
      existing.delete(name)
      console.error(`removed mis-typed asset ${name} (${a.mimeType}, wanted ${want})`)
    } catch (e) {
      console.error(`could not remove ${name}: ${e.message.slice(0, 120)}`)
    }
  }
}

const map = {}
const log = []
for (const rel of files) {
  const name = path.basename(rel)
  const isAvif = path.extname(name).toLowerCase() === '.avif'
  // The name the bytes are uploaded under; for AVIF that is the WebP twin.
  const uploadName = isAvif ? name.replace(/\.avif$/i, '.webp') : name
  const hit = existing.get(uploadName)
  if (hit && !force && !only.has(uploadName)) {
    map[rel] = { id: hit.id, url: hit.publicPath, reused: true, uploadedAs: uploadName }
    map[name] = map[rel]
    log.push(`skip   ${rel.padEnd(46)} ${hit.publicPath}`)
    continue
  }

  const srcPath = isAvif ? avifToWebp(path.join(DIST, rel), name) : path.join(DIST, rel)
  const bytes = fs.readFileSync(srcPath)
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: MIME[path.extname(uploadName).toLowerCase()] }), uploadName)
  try {
    const res = await requestForm('/admin/api/cms/media', form)
    const asset = res.asset ?? res
    if (!asset.publicPath) throw new Error(`upload returned no publicPath: ${JSON.stringify(asset).slice(0, 160)}`)
    const wantMime = MIME[path.extname(uploadName).toLowerCase()]
    if ((asset.mimeType ?? '') !== wantMime) {
      throw new Error(`stored as ${asset.mimeType}, not ${wantMime} — sniffing rejected it`)
    }
    map[rel] = {
      id: asset.id,
      url: asset.publicPath,
      uploadedAs: uploadName,
      ...(isAvif ? { convertedFrom: 'avif' } : {}),
      width: asset.width,
      height: asset.height,
      variants: (asset.variants ?? []).length,
    }
    map[name] = map[rel]
    log.push(
      `ok     ${rel.padEnd(46)} ${(bytes.length / 1024).toFixed(0)}KB -> ${asset.publicPath}` +
        `  ${asset.width}x${asset.height}, ${(asset.variants ?? []).length} variants` +
        (isAvif ? '  [avif->webp]' : ''),
    )
  } catch (e) {
    log.push(`FAIL   ${rel.padEnd(46)} ${e.message.slice(0, 160)}`)
    process.exitCode = 1
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify({ base: BASE, uploadedAt: new Date().toISOString(), map }, null, 2))
console.log(log.join('\n'))
console.log(`\n${Object.keys(map).length}/${files.length} -> ${path.relative(process.cwd(), OUT)}`)
