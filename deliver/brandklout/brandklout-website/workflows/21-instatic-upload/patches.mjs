/**
 * Agency changes to a page Sang supplied, applied on top of his package by prepare-source.mjs, and
 * by `visual-diff --source`, so its lossless check compares like with like.
 *
 * `patches/<package path>.mjs` default-exports a list of `{ why, find, replace }`. `find` must occur
 * EXACTLY ONCE in the file or the build refuses. When Sang sends a new package, a patch whose anchor
 * moved or changed fails loudly instead of silently not applying, or applying twice. That is the
 * reason for patches over a whole-page copy: his next version of the page still comes through, and
 * only the edited spots are ours. To replace a whole page, use overlay/ instead.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'patches')

/** package path (e.g. `index.html`) -> [{ why, find, replace }] */
export async function loadPatches() {
  const out = new Map()
  if (!fs.existsSync(DIR)) return out
  for (const f of fs.readdirSync(DIR, { recursive: true }).map(String)) {
    if (!f.endsWith('.mjs')) continue
    const rel = f.replace(/\\/g, '/').replace(/\.mjs$/, '')
    out.set(rel, (await import(pathToFileURL(path.join(DIR, f)).href)).default)
  }
  return out
}

/* `find` may also be a RegExp (v11, 2026-09-14: a whole legal-page body, which is too long to quote
   as a literal). The exactly-once rule is the same: it is counted with a global copy of the regex. */
export function applyPatches(rel, html, patches) {
  for (const p of patches.get(rel) ?? []) {
    const n =
      p.find instanceof RegExp
        ? (html.match(new RegExp(p.find.source, p.find.flags.includes('g') ? p.find.flags : p.find.flags + 'g')) ?? []).length
        : html.split(p.find).length - 1
    if (n !== 1) {
      throw new Error(`patch "${p.why}" on ${rel}: its anchor occurs ${n} times, expected exactly 1. The source changed; re-anchor the patch.`)
    }
    /* `replace` may be a function (v16, 2026-09-14): it gets the match and its groups, so a patch can
       move a block Sang supplied instead of quoting it (the home page's section order). */
    html = html.replace(p.find, typeof p.replace === 'function' ? p.replace : () => p.replace)
  }
  return html
}
