/**
 * Publish the IFA production site after `legal/push-legal.mjs --apply`.
 *
 *   node publish-legal.mjs --status     draftMatchesPublished only
 *   node publish-legal.mjs              publish (a publish bakes every page)
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
for (let dir = HERE; ; dir = path.dirname(dir)) {
  const env = path.join(dir, '.env')
  if (fs.existsSync(env)) {
    for (const l of fs.readFileSync(env, 'utf8').split(/\r?\n/)) {
      const m = l.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
    break
  }
  if (path.dirname(dir) === dir) throw new Error('no .env above this script')
}
const TOOL = 'deliver/process/tools/instatic-api-sync/insta-api.mjs'
const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: HERE })
const { publish, publishStatus, BASE } = await import(pathToFileURL(path.join(path.dirname(String(common).trim()), TOOL)).href)
if (!/ifadentistry|institute-for-advanced-dentistry/.test(BASE)) throw new Error(`refusing: ${BASE}`)
console.log(`host   ${BASE}`)
console.log('status', JSON.stringify(await publishStatus()))
if (process.argv.includes('--status')) process.exit(0)
console.log('publish', JSON.stringify(await publish()).slice(0, 300))
console.log('status', JSON.stringify(await publishStatus()))
