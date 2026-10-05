/**
 * `--site <client>[:staging|:production]` for the scripts in this folder.
 *
 * `insta-api.mjs` reads INSTATIC_BASE_URL / EMAIL / PASSWORD when it is first
 * imported, so the target has to be in the environment BEFORE that import.
 * This resolves it from the master env and `sites.json` through the plugin
 * fleet (the same lookup `instatic-plugins` uses for rollouts) and then
 * imports the client. Without `--site`, the worktree `.env` decides, as before.
 *
 *   const { api, target } = await connect()
 */
import { pathToFileURL } from 'node:url'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

export function argOf(name) {
  const i = process.argv.indexOf(name)
  return i === -1 ? null : process.argv[i + 1]
}

export async function connect() {
  const spec = argOf('--site')
  let target = null
  if (spec) {
    const [client, env = 'staging'] = spec.split(':')
    const { targets } = await import(pathToFileURL(join(HERE, '..', 'instatic-plugins', 'lib', 'fleet.mjs')).href)
    target = targets({ only: [client], env })[0]
    if (!target) throw new Error(`no ${env} instance for "${client}" in sites.json or the master env`)
    if (target.problem) throw new Error(target.problem)
    Object.assign(process.env, target.creds)
  }
  const api = await import(pathToFileURL(join(HERE, 'insta-api.mjs')).href)
  return { api, target: target ?? { url: api.BASE, env: 'from .env' } }
}
