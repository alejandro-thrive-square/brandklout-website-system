#!/usr/bin/env node
/**
 * Install (or upgrade) ONE brandklout.* plugin on ONE Instatic instance.
 *
 *   node install-plugin.mjs embed-origins                 # dry run: pack, inspect, show the plan
 *   node install-plugin.mjs embed-origins --apply         # install (step-up is automatic)
 *   node install-plugin.mjs open-graph --apply --allow-downgrade   # only on purpose
 *
 * The instance is INSTATIC_BASE_URL: run from the client folder so the worktree .env is found, and
 * prefix INSTATIC_BASE_URL=https://staging.<domain> for staging. There is no default site.
 * For more than one site, or production after staging, use `plugins.mjs rollout` instead: it adds
 * the backup, the settings and records check, the parity rule and the verify.
 *
 * Origin: tools/instatic-embeds/install-plugin.mjs (embed-origins grants only) merged with the
 * per-id GRANTS version in bk-dr-nahlah workflows/16-instatic-plugins/install-plugin.mjs, 2026-09-23.
 * The grant lists now live in plugins.json. The argument is a plugin name, not a zip, so an old
 * package (a `webzite.*` id, or a version the registry no longer releases) cannot be installed.
 */
import { loadRegistry, resolvePluginId } from './lib/fleet.mjs'

const argv = process.argv.slice(2)
const name = argv.find((a) => !a.startsWith('--'))
const APPLY = argv.includes('--apply')
if (!name) {
  console.error('usage: node install-plugin.mjs <embed-origins|open-graph|aeo-schema|link-editor> [--apply] [--allow-downgrade]')
  process.exit(2)
}
if (name.endsWith('.zip')) {
  console.error('Pass the plugin NAME, not a zip: the package is always rebuilt from tools/instatic-plugins/<name>/ ' +
    'so an old package can never be installed (a zip from before 2026-09-10 installs the webzite.* id).')
  process.exit(2)
}

const { reg, problems } = loadRegistry()
if (problems.length) {
  console.error(`plugins.json does not match the sources:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
const id = resolvePluginId(reg, name)
const p = reg.plugins[id]

const { installPlugin, packPlugin, listInstalled, idOf, versionOf, BASE } = await import('./lib/install.mjs')
console.log(`\n${id} v${p.version} -> ${BASE}`)
const zip = packPlugin(p, id)
try {
  const res = await installPlugin({ id, p, zip, apply: APPLY, allowDowngrade: argv.includes('--allow-downgrade') })
  if (res.action === 'installed') {
    const now = (await listInstalled()).find((x) => idOf(x) === id)
    const ok = now && versionOf(now) === p.version && now.enabled && now.lifecycleStatus === 'active'
    console.log(`  after    ${now ? `v${versionOf(now)} ${now.lifecycleStatus} enabled=${now.enabled} lastError=${now.lastError ?? null}` : 'MISSING'}`)
    if (!ok) process.exitCode = 1
    else console.log('\n  Installed. A publish.html plugin changes pages only at the next publish.')
  }
  if (res.action === 'dry') console.log('\nDRY RUN — re-run with --apply to install')
} catch (e) {
  console.error(`\n${e.message}`)
  process.exitCode = 1
}
