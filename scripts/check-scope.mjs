#!/usr/bin/env node
/**
 * check-scope.mjs — a change is either a CLIENT change or a SYSTEM change, never both.
 *
 *   Client change: touches exactly one client folder, deliver/brandklout/<client>/, and nothing else.
 *                  This is what a client worktree merges into main when its site launches.
 *   System change: touches anything EXCEPT client folders (process, tools, docs, scripts, rules).
 *                  This is what main commits when the process or system is updated.
 *
 * deliver/docs/ and deliver/scripts/ are system files, not a client.
 *
 * Usage:
 *   node scripts/check-scope.mjs                     # the current branch's changes against main
 *   node scripts/check-scope.mjs --base <ref>        # against another base
 *   node scripts/check-scope.mjs --staged            # what is staged right now (pre-commit)
 *   node scripts/check-scope.mjs --merge             # the incoming MERGE_HEAD (pre-merge-commit)
 *   node scripts/check-scope.mjs --expect client:<slug> | --expect system
 * Exit 0 when the change is one kind, 1 when it mixes kinds or touches the wrong client.
 */
import { execSync } from 'node:child_process'

const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null }
const has = (n) => process.argv.includes(n)
const git = (c) => execSync(`git ${c}`, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }).trim()
const SHARED = new Set()   // deliver/brandklout/ holds client folders only

let files
if (has('--staged')) files = git('diff --cached --name-only')
else if (has('--merge')) {
  const base = git('merge-base HEAD MERGE_HEAD')
  files = git(`diff --name-only ${base} MERGE_HEAD`)
} else {
  const base = git(`merge-base HEAD ${arg('--base') || 'main'}`)
  files = git(`diff --name-only ${base} HEAD`)
}
files = files.split('\n').filter(Boolean)

const clientOf = (f) => {
  const m = f.match(/^deliver\/brandklout\/([a-z0-9][a-z0-9-]*)\//)   // client slugs only; a stray .tmp is not a client
  return m && !SHARED.has(m[1]) ? m[1] : null
}
const clients = [...new Set(files.map(clientOf).filter(Boolean))]
const system = files.filter((f) => !clientOf(f))
const expect = arg('--expect')

let ok = true, kind
if (!files.length) kind = 'empty'
else if (clients.length === 0) kind = 'system'
else if (clients.length === 1 && system.length === 0) kind = `client:${clients[0]}`
else { ok = false; kind = 'mixed' }
if (ok && expect && kind !== expect && kind !== 'empty') ok = false

console.log(`${files.length} file(s): ${kind}${expect ? ` (expected ${expect})` : ''}`)
if (!ok) {
  if (clients.length > 1) console.log(`  touches ${clients.length} client folders: ${clients.join(', ')}`)
  if (clients.length && system.length) {
    console.log(`  a client change must stay inside deliver/brandklout/${clients[0]}/; these are system files:`)
    for (const f of system.slice(0, 30)) console.log(`    ${f}`)
    console.log('  Split it: commit the system part on main (it cascades to clients with `scenario.mjs update`),')
    console.log('  and keep only the client folder on the client branch.')
  }
  if (expect && kind !== expect && kind !== 'mixed') console.log(`  expected ${expect}, got ${kind}`)
  process.exitCode = 1
}
