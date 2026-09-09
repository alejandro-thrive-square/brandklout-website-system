#!/usr/bin/env node
/**
 * Stop `seo-head.js` overwriting the site favicon with the platform default.
 *
 * THE BUG
 * -------
 * `src/scripts/seo-head.js` carried this, and ran it on every page load:
 *
 *     tag('link[rel="icon"]', ...).setAttribute('href', '/favicon.svg');
 *
 * `tag()` SELECTS-OR-CREATES. When the publisher emits no icon it creates one;
 * when the publisher DOES emit one it finds that link and rewrites its href.
 * So `settings.faviconUrl` was correct in the served HTML and wrong in the DOM
 * a few milliseconds later, on every page, and `/favicon.svg` — Instatic's
 * black-and-white platform glyph — is what a browser tab actually showed.
 *
 * The comment above the line records why it was written: at the time NO page
 * declared an icon, so every browser fell back to `/favicon.ico` and logged a
 * 404. That was true then. It stopped being true on 2026-08-25, when session 14
 * set `settings.faviconUrl` — the publisher has emitted `<link rel="icon">` ever
 * since, which both kills the `/favicon.ico` fallback and makes this line a
 * regression. Two client-reported "the favicon did not change" rounds were this.
 *
 * Removing rather than repointing: `settings.faviconUrl` is the platform's own
 * slot for this and is where `push-favicon.mjs` writes. One source of truth.
 * A repoint here would be a second one, and the next person to change the icon
 * in the panel would be bitten exactly as we were.
 *
 * Surgical edit, not a regenerate-and-push, for the same reason as
 * `fix-seo-head-spelling.mjs`: the generator rewrites all 48 KB and this needs
 * to delete 5 lines. `gen-seo-head.mjs` is fixed in the same commit so a
 * regenerate does not reintroduce it.
 *
 *   node fix-seo-head-favicon.mjs [--apply]
 *
 * Draft only. Publishing is a separate step.
 */
import { getSite, saveShell } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')
const ASSET = 'src/scripts/seo-head.js'

/* Anchored on the comment's first words and the exact setAttribute call, so a
   near-miss fails loudly rather than deleting a neighbouring block. */
const BLOCK = /\r?\n[ \t]*\/\* No page declares an icon[\s\S]*?\}\)\.setAttribute\('href', '\/favicon\.svg'\);\r?\n/g

const { site, seq } = await getSite()
const file = (site.files ?? []).find((f) => f.path === ASSET)
if (!file) throw new Error(`no code asset at ${ASSET}`)

const before = file.content ?? ''
const hits = before.match(BLOCK) ?? []
console.log(`${ASSET}: ${before.length} bytes`)
console.log(`favicon.svg references: ${(before.match(/favicon\.svg/g) ?? []).length}`)
console.log(`block matches: ${hits.length}`)

if (hits.length === 0) { console.log('\nnothing to do — the override is already gone.'); process.exit(0) }
if (hits.length !== 1) {
  console.error(`refusing: expected exactly 1 block, found ${hits.length}.`)
  process.exit(1)
}

console.log(`\n--- removing ---\n${hits[0].replace(/^\r?\n/, '')}`)

const after = before.replace(BLOCK, '\n')

/* The only thing this may delete is the block. Anything else is a bad regex. */
const delta = before.length - after.length
if (delta !== hits[0].length - 1) throw new Error(`removed ${delta} bytes, expected ${hits[0].length - 1}`)
if ((after.match(/favicon\.svg/g) ?? []).length !== 0) throw new Error('favicon.svg still referenced after removal')
if (!after.includes("link[rel=\"canonical\"]")) throw new Error('canonical block lost — aborting')
if (!after.includes("og:site_name")) throw new Error('og block lost — aborting')

/* Sanity: the icon this now leaves standing is whatever the publisher emits. */
const icon = site.settings?.faviconUrl ?? null
console.log(`settings.faviconUrl (what will now stand): ${icon ?? '(none — the tab would fall back to /favicon.ico, which 404s)'}`)
if (!icon) {
  console.error('\nrefusing: no faviconUrl is set, so removing this would leave NO icon at all.')
  console.error('Run push-favicon.mjs first.')
  process.exit(1)
}

if (!APPLY) {
  console.log(`\n${before.length} -> ${after.length} bytes`)
  console.log('dry run — nothing written. Re-run with --apply.')
  process.exit(0)
}

file.content = after
const saved = await saveShell(site, seq)
console.log(`\nsaved         seq ${seq} -> ${saved.seq}`)

/* This platform reports some write failures as prose with a 200, and a
   code-asset write is exactly where that has bitten before. Read it back. */
const fresh = await getSite()
const got = (fresh.site.files ?? []).find((f) => f.path === ASSET)?.content ?? ''
if (got.length !== after.length) throw new Error(`read-back length ${got.length}, expected ${after.length}`)
if (got.includes('favicon.svg')) throw new Error('read-back still references favicon.svg')
console.log(`verified      ${got.length} bytes, no favicon.svg reference remains`)
console.log('\nDRAFT only. `node insta-api.mjs publish` is a separate step.')
