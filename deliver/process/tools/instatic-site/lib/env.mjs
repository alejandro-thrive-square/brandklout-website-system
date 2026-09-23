/**
 * env.mjs — load the generated worktree .env (nearest one walking up from the current directory)
 * and refuse to run without INSTATIC_BASE_URL.
 *
 * Written 2026-09-23 for tools/instatic-site. Import it FIRST (lib/site.mjs does) so the shared
 * Instatic client never falls back to a default host: tools/instatic-api-sync/insta-api.mjs
 * defaults to another client's admin when the variable is missing, and a script pointed at the
 * wrong site writes one practice's content over another's.
 *
 * Env: INSTATIC_BASE_URL (required), INSTATIC_EMAIL, INSTATIC_PASSWORD. Never hand-edit a
 * worktree .env; it is generated from ~/.webzite/.env by scripts/env-sync.mjs.
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

export function loadEnv(start = process.cwd()) {
  let dir = start
  for (let i = 0; i < 12; i++) {
    const f = join(dir, '.env')
    if (existsSync(f)) {
      for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
      }
      return f
    }
    const up = dirname(dir)
    if (up === dir) return null
    dir = up
  }
  return null
}

export const ENV_FILE = loadEnv()

if (!process.env.INSTATIC_BASE_URL) {
  console.error(
    'REFUSING: INSTATIC_BASE_URL is not set (no value in the environment or in ' +
      (ENV_FILE || 'any .env above ' + process.cwd()) +
      ').\nExport the target explicitly, e.g. INSTATIC_BASE_URL=https://staging.<domain> node ...',
  )
  process.exit(2)
}
