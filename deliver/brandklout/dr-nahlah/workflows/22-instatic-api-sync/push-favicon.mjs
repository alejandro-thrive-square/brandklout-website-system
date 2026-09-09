#!/usr/bin/env node
/**
 * Sets the site favicon — upload the file, then point `settings.faviconUrl` at it.
 *
 * WHY A SCRIPT AND NOT THE PANEL
 * ------------------------------
 * `settings.faviconUrl` is the ONE thing the publisher reads for the icon
 * (`core/publisher/render.ts` -> `buildDocumentMetaTags`). There is no icon set,
 * no apple-touch-icon, no `sizes` variants — Instatic emits a single
 * `<link rel="icon" href="{faviconUrl}">` and nothing else. So whatever goes in
 * here IS the favicon at every size, and a wide wordmark becomes a smear in a
 * 16px tab. Match whatever the client already approved elsewhere rather than
 * inventing a mark.
 *
 * THE UPLOAD ENDPOINT
 * -------------------
 * `POST /admin/api/cms/media`, multipart, field name `file`
 * (`server/handlers/cms/mediaUpload.ts`). Two things the server decides, not us:
 *
 *   - **The extension comes from magic bytes, never from the filename.** The
 *     handler drops the supplied extension deliberately, so a `.html` payload
 *     cannot be served as text/html. A PNG uploaded as `foo.jpg` is stored
 *     `.png`. Read `publicPath` off the response; never construct it.
 *   - Responsive variants are generated for JPEG/PNG/WebP. Harmless here — the
 *     favicon link always points at the original.
 *
 *   node push-favicon.mjs <image-file>            # dry run
 *   node push-favicon.mjs <image-file> --apply
 *   node insta-api.mjs publish                    # separate, announced step
 *
 * Deliberately does NOT publish: publishing ships the whole draft including
 * anyone else's in-progress work (see 15-instatic-api-sync.md).
 */
import { readFileSync, existsSync } from 'node:fs'
import { basename } from 'node:path'
import { getSite, saveShell, requestForm, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const argv = process.argv.slice(2)
const APPLY = argv.includes('--apply')
const SRC = argv.find((a) => !a.startsWith('--'))

if (!SRC) {
  console.error('usage: node push-favicon.mjs <image-file> [--apply]')
  process.exit(2)
}
if (!existsSync(SRC)) {
  console.error(`no such file: ${SRC}`)
  process.exit(2)
}

const bytes = readFileSync(SRC)

/** PNG/JPEG/WebP/GIF/SVG header sniff + intrinsic size, so the report says what
 *  is actually being uploaded rather than what the filename claims. */
function describe(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { mime: 'image/png', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let o = 2
    while (o < buf.length - 9) {
      if (buf[o] !== 0xff) { o++; continue }
      const marker = buf[o + 1]
      const len = buf.readUInt16BE(o + 2)
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { mime: 'image/jpeg', height: buf.readUInt16BE(o + 5), width: buf.readUInt16BE(o + 7) }
      }
      o += 2 + len
    }
    return { mime: 'image/jpeg', width: null, height: null }
  }
  if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') {
    return { mime: 'image/webp', width: null, height: null }
  }
  if (buf.slice(0, 3).toString() === 'GIF') {
    return { mime: 'image/gif', width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) }
  }
  if (buf.slice(0, 512).toString().includes('<svg')) return { mime: 'image/svg+xml', width: null, height: null }
  return { mime: 'unknown', width: null, height: null }
}

const info = describe(bytes)
const { site, seq } = await getSite()
const current = site.settings?.faviconUrl ?? null

console.log(`site          ${BASE}  (seq ${seq})`)
console.log(`current icon  ${current ?? '(none)'}`)
console.log(`uploading     ${basename(SRC)}  ${info.mime}  ${info.width ?? '?'}x${info.height ?? '?'}  ${bytes.length} bytes`)

if (info.mime === 'unknown') {
  console.error('\nrefusing: the bytes do not look like an image the platform accepts.')
  process.exit(1)
}
if (info.width && info.height && info.width !== info.height) {
  console.warn(`\nNOTE: not square (${info.width}x${info.height}). Instatic emits ONE <link rel="icon">, `
    + 'so browsers letterbox this into every size including the 16px tab.')
}

if (!APPLY) {
  console.log('\ndry run — nothing written. Re-run with --apply.')
  process.exit(0)
}

/* Upload. The File constructor is what makes Bun/Node's FormData emit a
   multipart *file* part rather than a text field; a Blob without a filename
   arrives as a field and `readUploadedFile` returns null -> 400 "Missing file". */
const form = new FormData()
form.append('file', new File([bytes], basename(SRC), { type: info.mime }))
const uploaded = await requestForm('/admin/api/cms/media', form)
const asset = uploaded?.asset
if (!asset?.publicPath) {
  throw new Error(`upload returned no publicPath: ${JSON.stringify(uploaded).slice(0, 400)}`)
}
console.log(`\nuploaded      ${asset.id}  ${asset.publicPath}  ${asset.width}x${asset.height} ${asset.mimeType}`)

/* Re-read the shell: the upload is a separate request and could have raced a
   browser edit, and `saveShell` needs the seq we are actually writing against. */
const fresh = await getSite()
const shell = fresh.site
shell.settings = { ...(shell.settings ?? {}), faviconUrl: asset.publicPath }
const saved = await saveShell(shell, fresh.seq)
console.log(`saved         seq ${fresh.seq} -> ${saved.seq}`)

/* This platform reports some write failures as prose with a 200. Read it back. */
const after = await getSite()
const got = after.site.settings?.faviconUrl
if (got !== asset.publicPath) {
  throw new Error(`read-back mismatch: settings.faviconUrl is ${got}, expected ${asset.publicPath}`)
}
console.log(`verified      settings.faviconUrl = ${got}`)
console.log('\nDRAFT only. `node insta-api.mjs publish` is a separate step.')
