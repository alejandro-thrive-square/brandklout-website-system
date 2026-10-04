/**
 * push-state.mjs — what this workstation last pushed to one Instatic instance, so an update can
 * write only what changed.
 *
 * Written 2026-09-28 for the incremental push (`push-site.mjs --update`,
 * `build-import-input.mjs --changed`). One file per instance, `output/push-state.<host>.json`:
 *
 *   {
 *     recordedAt, base,
 *     shell: { sourceHash, styleRulesHash, seq },
 *     pages: { <slug>: { id, seq, htmlHash, pushedAt } }
 *   }
 *
 * - `htmlHash` is the hash of the page's REWRITTEN html in import-input (media paths already
 *   mapped to this instance), set only by a push. `build-import-input.mjs --changed` converts
 *   the pages whose hash differs.
 * - `seq` (per page) and `styleRulesHash` (the shell's registry) are what the instance looked
 *   like after our last write or `--record`. A different value on the next update means someone
 *   edited that page or the Styles panel in the browser since, and the update refuses rather than
 *   overwrite it.
 * - `sourceHash` is the hash of the local CSS/JS sources the shell was built from. Unchanged means
 *   the shell does not need to be sent.
 *
 * The file is per workstation and per instance; it is a convenience plus a guard, never the
 * source of truth. Deleting it only makes the next update convert everything and ask for --force.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16)

/** JSON with sorted keys, so a server that reorders an object does not read as an edit. */
export function stable(v) {
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']'
  if (v && typeof v === 'object') {
    return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}'
  }
  return JSON.stringify(v)
}

/** The registry minus timestamps: a save that only touches updatedAt is not a style edit. */
export function styleRulesHash(styleRules = {}) {
  const clean = {}
  for (const [id, r] of Object.entries(styleRules)) {
    const { createdAt, updatedAt, ...rest } = r
    clean[id] = rest
  }
  return sha(stable(clean))
}

export function statePath(tmp, base = process.env.INSTATIC_BASE_URL) {
  return path.join(tmp, `push-state.${new URL(base).hostname}.json`)
}

export function loadState(tmp, base) {
  const f = statePath(tmp, base)
  if (!fs.existsSync(f)) return null
  return JSON.parse(fs.readFileSync(f, 'utf8'))
}

export function saveState(tmp, state, base = process.env.INSTATIC_BASE_URL) {
  const f = statePath(tmp, base)
  fs.writeFileSync(f, JSON.stringify({ ...state, recordedAt: new Date().toISOString(), base }, null, 1))
  return f
}
