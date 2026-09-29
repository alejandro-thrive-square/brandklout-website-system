/**
 * sedation-api.mjs — load THIS worktree's .env before the shared Instatic
 * client, then re-export it.
 *
 * Since system v2 (2026-09-27) client worktrees have no deliver/process, so
 * insta-api.mjs is imported from the main checkout. Its own loadEnv() walks up
 * from ITS folder and would read main's root .env, which is not this client's
 * instance. It never overwrites a variable already set, so loading ours first
 * pins every call to Dr. Nahlah's host.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

let dir = dirname(fileURLToPath(import.meta.url))
while (!existsSync(join(dir, '.env')) && dirname(dir) !== dir) dir = dirname(dir)
/* Parsed the way insta-api.mjs parses it. NOT process.loadEnvFile: that treats
   `#` as the start of a comment and silently truncated this instance's
   password, which the server answered with a 401 (one strike of the five). */
for (const line of readFileSync(join(dir, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
if (!/drnahlah/i.test(process.env.INSTATIC_BASE_URL ?? '')) {
  throw new Error(`INSTATIC_BASE_URL is ${process.env.INSTATIC_BASE_URL} — not Dr. Nahlah's instance`)
}

const MAIN = process.env.WEBZITE_MAIN
  ?? 'C:/Users/ACER/Documents/Webzite Studio/Brandklout Website System'
const lib = await import(pathToFileURL(join(MAIN, 'deliver/process/tools/instatic-api-sync/insta-api.mjs')).href)
export const { api, getSite, getPages, toChangedPage, saveShell, requestForm, BASE } = lib
