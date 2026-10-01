#!/usr/bin/env node
/**
 * Import the media ASSET ROWS produced by chunk-media.py.
 *
 *   node import-media-chunks.mjs --to https://staging.drnahlah.com --chunks ./chunks
 *
 * Media has two halves and they move separately:
 *   BYTES  -> pull-media.js (container-to-container, seconds)
 *   ROWS   -> this script
 *
 * Bytes alone are enough for pages to RENDER — the published HTML references
 * `/uploads/<path>` directly, so images appear as soon as the files exist.
 * The rows are what the media library lists and what the editor can pick from,
 * so a clone people will actually EDIT needs both.
 *
 * Uses `strategy=merge-add` with an explicit `selection` naming only that
 * chunk's media ids, `includeSite:false` and `tables:[]` — so it adds media and
 * cannot touch the site shell or any content row. Each chunk gets a fresh
 * step-up: the window is 15 minutes and a slow run would otherwise expire.
 */
import { readFileSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { session, mb } from './lib.mjs'

const argv = process.argv.slice(2)
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i === -1 ? d : argv[i + 1] }
const TO = flag('to')
const DIR = flag('chunks', './chunks')
if (!TO) { console.error('usage: node import-media-chunks.mjs --to <url> [--chunks <dir>]'); process.exit(2) }

const manifestPath = join(DIR, 'chunks.json')
if (!existsSync(manifestPath)) { console.error(`no chunks.json in ${DIR} — run chunk-media.py first`); process.exit(2) }
const chunks = JSON.parse(readFileSync(manifestPath, 'utf8'))
console.log(`${chunks.length} chunk(s) -> ${TO}\n`)

let imported = 0
for (const ch of chunks) {
  const file = join(DIR, ch.file.replace(/^.*[\\/]/, ''))
  const bytes = readFileSync(file)
  const selection = {
    includeSite: false,
    tables: [],
    includeMedia: true,
    mediaIds: ch.mediaIds,
    includeMediaFolders: false,
    includeRedirects: false,
  }
  const url = `${TO}/admin/api/cms/import/archive?strategy=merge-add&selection=${encodeURIComponent(JSON.stringify(selection))}`
  const cookie = await session(TO)
  const t0 = Date.now()
  let r
  try {
    r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/zip', cookie, origin: TO }, body: bytes })
  } catch (e) {
    console.log(`${ch.file.padEnd(14)} THREW ${e.message} ${e.cause?.code ?? ''}`)
    continue
  }
  const txt = await r.text()
  let j = {}
  try { j = JSON.parse(txt) } catch {}
  imported += j.mediaImported ?? 0
  console.log(`${ch.file.padEnd(14)} ${mb(statSync(file).size).padStart(9)}  ${r.status}  ${((Date.now() - t0) / 1000).toFixed(1)}s  mediaImported=${j.mediaImported ?? '-'} ${r.ok ? '' : txt.slice(0, 160)}`)
  if (r.status === 413) {
    console.log('  413 — chunk too large for the Railway edge; re-run chunk-media.py with a smaller target')
    process.exit(1)
  }
}
console.log(`\ntotal media rows imported: ${imported}`)
