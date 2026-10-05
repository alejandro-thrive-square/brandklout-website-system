#!/usr/bin/env node
/**
 * Run any command with one Instatic instance's credentials in the environment.
 *
 *   node with-site.mjs <client>[:staging|:production] -- node ../instatic-site/ops/backup-site.mjs --out …
 *
 * For the older tools that read INSTATIC_BASE_URL / EMAIL / PASSWORD from the environment
 * (backup-site, verify-live, apply-template-flags …). Resolution is the plugin fleet's
 * (master env + instatic-domain-origins/sites.json), same as `--site` in target.mjs.
 * Refuses a production target unless --allow-production comes before `--`.
 */
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const sep = process.argv.indexOf('--')
const head = process.argv.slice(2, sep === -1 ? undefined : sep)
const cmd = sep === -1 ? [] : process.argv.slice(sep + 1)
const spec = head.find((x) => !x.startsWith('--'))
if (!spec || !cmd.length) {
  console.error('usage: with-site.mjs <client>[:staging|:production] [--allow-production] -- <command ...>')
  process.exit(2)
}
const [client, env = 'staging'] = spec.split(':')
if (env === 'production' && !head.includes('--allow-production')) {
  console.error('REFUSING: production target without --allow-production')
  process.exit(2)
}
const { targets } = await import(pathToFileURL(join(HERE, '..', 'instatic-plugins', 'lib', 'fleet.mjs')).href)
const t = targets({ only: [client], env })[0]
if (!t || t.problem) throw new Error(t?.problem ?? `no ${env} instance for ${client}`)
const r = spawnSync(cmd[0], cmd.slice(1), {
  stdio: 'inherit',
  env: { ...process.env, ...t.creds, STAGING_HOST: env === 'staging' ? new URL(t.url).hostname : '' },
  shell: false,
})
process.exit(r.status ?? 1)
