#!/usr/bin/env node
/**
 * client.mjs — read a client's work from main without merging it.
 *
 * A client's history lives on its own branch (bk-<client>), permanently; it never merges into main
 * (since 2026-10-03), so main stays the system and nothing is split between git and R2 by a merge.
 * This reads the branch directly, from any checkout, read-only:
 *
 *   node scripts/client.mjs list                          # every client branch, its folder, last commit, worktree
 *   node scripts/client.mjs log     <client> [-n 30]      # the client's commit history (its folder only)
 *   node scripts/client.mjs runbook <client>              # the client RUNBOOK.md as the branch has it now
 *   node scripts/client.mjs ls      <client> [<path>]     # tracked files under the client folder (or a subfolder)
 *   node scripts/client.mjs show    <client> <path>       # one file's content from the branch
 *   node scripts/client.mjs where   <client>              # the branch and the worktree that has it checked out
 *
 * <client> is the folder slug (mason-park) or the branch (bk-mason-park). Media is not in git: open
 * the client's worktree, or `node scripts/assets.mjs pull <client>` into a checkout.
 */
import { execFileSync } from 'node:child_process'

const git = (args) => execFileSync('git', ['-c', 'core.quotepath=false', ...args], { encoding: 'utf8', maxBuffer: 1 << 28 })
const [cmd, who, ...rest] = process.argv.slice(2)
const nIx = rest.indexOf('-n'), N = nIx >= 0 ? rest.splice(nIx, 2)[1] : '30'

/** Branch names that are not a prefix of their folder (or match several). Add a row for a new one. */
const ALIASES = { 'ifa-dentistry': 'institute-for-advanced-dentistry', stone: 'stone-surgical-arts', 'stone-dental': 'stone-dental-implant-center' }

/** Client branches: bk-*, each mapped to its folder by name (exact, alias, then a unique prefix). */
function clients() {
  const branches = git(['for-each-ref', '--format=%(refname:short)', 'refs/heads/']).split('\n').filter((b) => /(^|\/)bk-/.test(b) && !b.startsWith('backup/'))
  const worktrees = Object.fromEntries(git(['worktree', 'list', '--porcelain']).split(/\r?\n\r?\n/)
    .map((b) => [b.match(/^branch refs\/heads\/(.+)$/m)?.[1], b.match(/^worktree (.+)$/m)?.[1]]).filter(([b]) => b))
  return branches.map((branch) => {
    const slug = branch.split('/').pop().replace(/^bk-/, '')
    const folders = git(['ls-tree', '-d', '--name-only', branch, 'deliver/brandklout/']).split('\n').map((p) => p.split('/')[2]).filter(Boolean)
    const prefixed = folders.filter((f) => f.startsWith(slug))
    const folder = folders.includes(slug) ? slug : ALIASES[slug] && folders.includes(ALIASES[slug]) ? ALIASES[slug] : prefixed.length === 1 ? prefixed[0] : null
    return { branch, folder, worktree: worktrees[branch] || null }
  })
}
function resolve(arg) {
  if (!arg) throw new Error('name a client (folder slug or bk-* branch); see `list`')
  const all = clients()
  const hit = all.find((c) => c.branch === arg || c.branch.endsWith(`/${arg}`)) || all.find((c) => c.folder === arg)
    || all.find((c) => c.folder?.startsWith(arg) || c.branch.split('/').pop().startsWith(`bk-${arg}`))
  if (!hit || !hit.folder) throw new Error(`no client branch for "${arg}" (see \`list\`)`)
  return { ...hit, dir: `deliver/brandklout/${hit.folder}` }
}

try {
  if (cmd === 'list' || !cmd) {
    for (const c of clients()) {
      const last = git(['log', '-1', '--format=%cs %s', c.branch]).trim().slice(0, 70)
      console.log(`${c.branch.padEnd(32)} ${String(c.folder).padEnd(34)} ${last}${c.worktree ? '' : '   (no worktree)'}`)
    }
  } else if (cmd === 'log') {
    const c = resolve(who)
    process.stdout.write(git(['log', `-n${N}`, '--format=%h %cs %s', c.branch, '--', c.dir]))
  } else if (cmd === 'runbook') {
    const c = resolve(who)
    // Scenario-layout clients keep it at the folder root; pre-v2 clients (workflows/) in docs/.
    const files = git(['ls-tree', '--name-only', c.branch, `${c.dir}/RUNBOOK.md`, `${c.dir}/docs/RUNBOOK.md`]).split('\n').filter(Boolean)
    if (!files.length) throw new Error(`${c.branch} has no RUNBOOK.md in ${c.dir}/ or ${c.dir}/docs/`)
    process.stdout.write(git(['show', `${c.branch}:${files[0]}`]))
  } else if (cmd === 'ls') {
    const c = resolve(who)
    const sub = rest[0] ? `${c.dir}/${rest[0].replace(/^\/+|\/+$/g, '')}` : c.dir
    process.stdout.write(git(['ls-tree', '-r', '--name-only', c.branch, '--', sub]).split('\n').filter(Boolean).map((p) => p.slice(c.dir.length + 1)).join('\n') + '\n')
  } else if (cmd === 'show') {
    const c = resolve(who)
    if (!rest[0]) throw new Error('show <client> <path inside the client folder>')
    process.stdout.write(git(['show', `${c.branch}:${c.dir}/${rest[0].replace(/^\/+/, '')}`]))
  } else if (cmd === 'where') {
    const c = resolve(who)
    console.log(`branch:   ${c.branch}\nfolder:   ${c.dir}\nworktree: ${c.worktree || '(none — create one with scripts/new-client-worktree.sh)'}`)
  } else {
    console.error('usage: client.mjs list | log <client> [-n N] | runbook <client> | ls <client> [path] | show <client> <path> | where <client>')
    process.exitCode = 2
  }
} catch (e) {
  console.error(`client.mjs: ${String(e.message).split('\n')[0]}`)
  process.exitCode = 1
}
