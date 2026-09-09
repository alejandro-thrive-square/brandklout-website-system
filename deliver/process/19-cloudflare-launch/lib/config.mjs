/**
 * Per-client configuration for the Cloudflare launch module.
 *
 * Every script here refuses to guess which site it is talking to. Copy
 * `cloudflare-launch.config.example.json` to `cloudflare-launch.config.json`
 * in the CLIENT workflow folder and fill it in; nothing is defaulted to a
 * domain, because the API token on a Brandklout account can see every client
 * zone and a wrong default would deploy one practice's redirects onto another's
 * domain.
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

export function loadConfig(startDir = process.cwd()) {
  const name = 'cloudflare-launch.config.json'
  for (const dir of [startDir, resolve(HERE, '..'), resolve(HERE, '../..')]) {
    const p = join(dir, name)
    if (existsSync(p)) {
      const cfg = JSON.parse(readFileSync(p, 'utf8'))
      return validate(cfg, p)
    }
  }
  console.error(`no ${name} found — copy cloudflare-launch.config.example.json and fill it in`)
  process.exit(2)
}

function validate(cfg, path) {
  const required = ['apex', 'canonicalHost', 'workerName', 'listName']
  const missing = required.filter((k) => !cfg[k])
  if (missing.length) {
    console.error(`${path} is missing: ${missing.join(', ')}`)
    process.exit(2)
  }
  /* `canonicalHost` must be an origin, not a bare hostname — every target URL
     and every sitemap <loc> is built by concatenating onto it, and a missing
     scheme produces rows Cloudflare accepts and browsers cannot follow. */
  if (!/^https:\/\/[^/]+$/.test(cfg.canonicalHost)) {
    console.error(`${path}: canonicalHost must look like https://www.example.com (no trailing slash)`)
    process.exit(2)
  }
  if (!/^[a-z0-9.-]+$/.test(cfg.apex)) {
    console.error(`${path}: apex must be a bare hostname, e.g. example.com`)
    process.exit(2)
  }
  /* Bulk Redirect list names are referenced in rule expressions as
     `$name`, so the character set is constrained. */
  if (!/^[a-z0-9_]+$/.test(cfg.listName)) {
    console.error(`${path}: listName must be lowercase letters, digits and underscores`)
    process.exit(2)
  }
  if (!cfg.canonicalHost.endsWith(cfg.apex)) {
    console.error(`${path}: canonicalHost ${cfg.canonicalHost} is not on apex ${cfg.apex}`)
    process.exit(2)
  }
  return cfg
}
