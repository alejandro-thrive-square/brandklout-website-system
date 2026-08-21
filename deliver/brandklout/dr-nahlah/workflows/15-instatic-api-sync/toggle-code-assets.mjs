#!/usr/bin/env node
/**
 * Turn the two code-asset stylesheets on or off without touching anything else.
 *
 * `--cutover` in the migration script does this as part of a larger change;
 * this is the surgical version, for A/B-ing the registry against the code asset
 * on the live site. Content is never deleted — only `runtime.styles[id].enabled`
 * moves — so the flip is exact in both directions.
 *
 *   node toggle-code-assets.mjs on|off [--apply]
 */
import { getSite, saveShell } from './insta-api.mjs'

const want = process.argv[2]
const apply = process.argv.includes('--apply')
if (want !== 'on' && want !== 'off') { console.error('usage: toggle-code-assets.mjs on|off [--apply]'); process.exit(2) }

const PATHS = ['src/styles/runtime-states.css', 'src/styles/site.css']
const { site: shell, seq } = await getSite()
const styles = (shell.runtime ?? (shell.runtime = {})).styles ?? (shell.runtime.styles = {})
for (const path of PATHS) {
  const file = (shell.files ?? []).find((f) => f.type === 'style' && f.path === path)
  if (!file) { console.warn(`  ! ${path} missing`); continue }
  const before = styles[file.id]?.enabled ?? true
  styles[file.id] = { ...(styles[file.id] ?? {}), enabled: want === 'on' }
  console.log(`  ${path}: ${before} -> ${want === 'on'}`)
}
if (!apply) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }
const res = await saveShell(shell, seq)
const { site: after } = await getSite()
const s2 = after.runtime?.styles ?? {}
for (const path of PATHS) {
  const f = (after.files ?? []).find((x) => x.type === 'style' && x.path === path)
  console.log(`  verified ${path}: enabled=${s2[f.id]?.enabled ?? true}`)
}
console.log(`seq ${seq} -> ${res.seq}`)
