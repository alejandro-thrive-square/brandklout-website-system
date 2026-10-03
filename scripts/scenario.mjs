#!/usr/bin/env node
/**
 * scenario.mjs — mirror the delivery process from main into a client folder, keep the mirror current,
 * and refuse to lose a fix that was made in the mirror instead of on main.
 *
 * The process exists ONCE, tracked on main only, in deliver/process/:
 *   scenario-N-name/NN-step/{NN-step.md, scripts/, tools.json}
 *   tools/<toolkit>/
 * A client worktree gets an UNTRACKED mirror of the started scenarios, so every relative path in a
 * directive or script works the same in both places (since 2026-10-03; before that the mirror was a
 * tracked copy on the client branch, and every fix made in it stayed on that branch):
 *   deliver/brandklout/<client>/
 *     README.md, RUNBOOK.md, docs/          the client's own record (tracked, never overwritten)
 *     scenario-N-name/NN-step/output/       the step's assets, code and RUNBOOK.md (tracked, never overwritten)
 *     scenario-N-name/NN-step/*             directive + scripts mirrored from main (gitignored)
 *     tools/<toolkit>/                      toolkits the started steps list, plus every toolkit those
 *                                           declare in their toolkit.json "requires" (gitignored)
 *     .process-mirror.json                  what was mirrored, from which commit, each file's blob id (gitignored)
 *
 * The mirror is read from the committed `main` ref (shared by every worktree), never from the main
 * checkout's working tree, so an edit half-made on main never reaches a client.
 *
 * Usage (from anywhere inside a client worktree):
 *   node scripts/scenario.mjs list
 *   node scripts/scenario.mjs start  <client> <scenario>     # scenario: "0", "scenario-0" or the folder name
 *   node scripts/scenario.mjs sync   [<client>]              # refresh the mirror from main (alias: update)
 *   node scripts/scenario.mjs status [<client>]              # behind main? edited locally? still tracked?
 *   node scripts/scenario.mjs detach [<client>]              # one-time: untrack a pre-2026-10-03 tracked copy
 *   Flags: --dry (print the plan), --quiet (print only when something changed or is wrong; never fails),
 *          --force (sync overwrites mirror files edited locally), --ref <ref> (default main).
 *   No <client>: every client folder on disk that has a started scenario.
 *
 * A mirror file edited in the worktree is NEVER overwritten silently: sync keeps it, names it, and
 * exits 3. The edit exists nowhere else — port it to deliver/process/ on main, commit, then sync.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const git = (args, cwd = ROOT) => execFileSync('git', ['-c', 'core.quotepath=false', ...args], { cwd, encoding: 'utf8', maxBuffer: 1 << 28 })
const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
const CLIENTS = path.join(ROOT, 'deliver', 'brandklout')
const SKIP = new Set(['output', 'node_modules', '.tmp', '__pycache__'])
const MANIFEST = '.process-mirror.json'

const argv = process.argv.slice(2)
const flagVal = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv.splice(i, 2)[1] : null }
const REF = flagVal('--ref') || 'main'
const [cmd, clientArg, scenArg] = argv.filter((a) => !a.startsWith('--'))
const DRY = argv.includes('--dry'), QUIET = argv.includes('--quiet'), FORCE = argv.includes('--force')
const today = new Date().toISOString().slice(0, 10)
const log = (...a) => { if (!QUIET) console.log(...a) }

const isMainWorktree = () => {
  try { return git(['rev-parse', '--abbrev-ref', 'HEAD']).trim() === 'main' } catch { return false }
}

/* ---------- the process, read from the ref ---------- */

const COMMIT = git(['rev-parse', `${REF}^{commit}`]).trim()
const SHORT = COMMIT.slice(0, 8)
/** deliver/process at REF: Map relPath -> blob sha (relative to deliver/process, output/ and caches skipped). */
const TREE = (() => {
  const m = new Map()
  for (const entry of git(['ls-tree', '-r', '-z', '--full-tree', COMMIT, '--', 'deliver/process']).split('\0')) {
    const hit = entry.match(/^(\d+) blob ([0-9a-f]+)\t(.+)$/)
    if (!hit || hit[1] === '120000') continue
    const rel = hit[3].slice('deliver/process/'.length)
    if (rel.split('/').some((s) => SKIP.has(s))) continue
    m.set(rel, hit[2])
  }
  if (!m.size) throw new Error(`no deliver/process at ${REF} (${SHORT})`)
  return m
})()

/** Read blobs in one git process: Map sha -> Buffer. */
function readBlobs(shas) {
  const out = new Map(), want = [...new Set(shas)]
  if (!want.length) return out
  const r = spawnSync('git', ['cat-file', '--batch'], { cwd: ROOT, input: want.join('\n') + '\n', maxBuffer: 1 << 30 })
  if (r.status !== 0) throw new Error(`git cat-file failed: ${r.stderr}`)
  const buf = r.stdout
  let at = 0
  while (at < buf.length) {
    const nl = buf.indexOf(10, at)
    const [sha, type, size] = buf.subarray(at, nl).toString().split(' ')
    if (type === 'missing') { at = nl + 1; continue }
    const len = Number(size)
    out.set(sha, buf.subarray(nl + 1, nl + 1 + len))
    at = nl + 1 + len + 1
  }
  return out
}
const readJson = (rel) => {
  const sha = TREE.get(rel)
  return sha ? JSON.parse(readBlobs([sha]).get(sha).toString('utf8')) : null
}

const scenarios = () => [...new Set([...TREE.keys()].map((p) => p.split('/')[0]).filter((d) => /^scenario-\d+-/.test(d)))].sort()
function resolveScenario(arg) {
  if (!arg) throw new Error('name a scenario (see `list`)')
  const n = String(arg).replace(/^scenario-/, '')
  const hit = scenarios().find((s) => s === arg || s.startsWith(`scenario-${n}-`) || s === `scenario-${n}`)
  if (!hit) throw new Error(`no scenario "${arg}" in deliver/process at ${REF} (see \`list\`)`)
  return hit
}
/** Step folders of a scenario: a second-level `NN-name/` holding at least one file. */
const steps = (scen) => [...new Set([...TREE.keys()].map((p) => p.split('/')).filter((s) => s[0] === scen && s.length > 2 && /^\d\d-/.test(s[1])).map((s) => s[1]))].sort()
const toolkitsOf = (scen, st) => readJson(`${scen}/${st}/tools.json`)?.toolkits || []
const requiresOf = (kit) => readJson(`tools/${kit}/toolkit.json`)?.requires || []
function withRequires(kits) {
  const all = new Set(kits), queue = [...kits]
  while (queue.length) for (const r of requiresOf(queue.shift())) if (!all.has(r)) { all.add(r); queue.push(r) }
  for (const k of all) if (![...TREE.keys()].some((p) => p.startsWith(`tools/${k}/`))) throw new Error(`toolkit "${k}" is listed but does not exist in deliver/process/tools/ at ${REF}`)
  return [...all].sort()
}

/** Everything a client's mirror should hold: Map clientRelPath -> blob sha. */
function desired(scens) {
  const want = new Map(), kits = new Set()
  for (const scen of scens) {
    for (const [rel, sha] of TREE) if (rel.startsWith(`${scen}/`)) want.set(rel, sha)
    for (const st of steps(scen)) for (const k of toolkitsOf(scen, st)) kits.add(k)
  }
  const toolkits = withRequires(kits)
  for (const k of toolkits) for (const [rel, sha] of TREE) if (rel.startsWith(`tools/${k}/`)) want.set(rel, sha)
  return { want, toolkits }
}

/* ---------- the client side ---------- */

function clientDir(client) {
  if (!client || !/^[a-z0-9-]+$/.test(client)) throw new Error(`"${client}" is not a client slug (lowercase, dashes)`)
  return path.join(CLIENTS, client)
}
const started = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir).filter((d) => /^scenario-\d+-/.test(d) && fs.statSync(path.join(dir, d)).isDirectory()).sort() : []
/** Clients to act on: the named one, or every client folder on disk with a started scenario. */
function targets() {
  if (clientArg) return [clientArg]
  if (!fs.existsSync(CLIENTS)) return []
  return fs.readdirSync(CLIENTS).filter((c) => /^[a-z0-9-]+$/.test(c) && fs.statSync(path.join(CLIENTS, c)).isDirectory() && started(path.join(CLIENTS, c)).length)
}

/** Git blob id of a file on disk; CRLF-normalised for text, the way autocrlf would store it. */
function blobId(buf) {
  const id = (b) => createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex')
  const raw = id(buf)
  return { raw, norm: buf.includes(0) ? raw : id(Buffer.from(buf.toString('latin1').replace(/\r\n/g, '\n'), 'latin1')) }
}
const matches = (buf, sha) => { const b = blobId(buf); return b.raw === sha || b.norm === sha }
/** Was this exact content ever main's version of the file? (Used once, for a mirror with no manifest yet.) */
function everOnMain(rel, buf) {
  const ids = new Set(git(['log', '--format=', '--raw', '--no-abbrev', COMMIT, '--', `deliver/process/${rel}`]).match(/\b[0-9a-f]{40}\b/g) || [])
  const b = blobId(buf)
  return ids.has(b.raw) || ids.has(b.norm)
}

const writeIfMissing = (p, text, written) => {
  if (fs.existsSync(p)) return
  written.push(path.relative(ROOT, p).replace(/\\/g, '/'))
  if (!DRY) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text) }
}

function scaffoldClient(dir, client, written) {
  writeIfMissing(path.join(dir, 'README.md'), `# ${client}\n\nClient folder. Each started scenario mirrors \`deliver/process/<scenario>/\` from main (untracked,\nrefreshed with \`node scripts/scenario.mjs sync\`); each step's \`output/\` holds its assets, code and\nrunbook and is the only part tracked here. Never fix a directive or script in this folder: fix it on\nmain, then sync.\n\n## Scenarios\n\n| Scenario | Started | From commit |\n| --- | --- | --- |\n\n## Version Control\n\nFollows [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md). Only files in this folder change on the client's branch.\n`, written)
  writeIfMissing(path.join(dir, 'RUNBOOK.md'), `# ${client} runbook\n\nStanding state: what is true now, what is next, the traps. Each step's own history is in its\n\`output/RUNBOOK.md\`; add a row below for every run.\n\n## Standing\n\n## Runs\n\n| Date | Scenario / step | What happened | Commit |\n| --- | --- | --- | --- |\n\n## Version Control\n\nFollows [SYSTEM_RULES.md §5](../../../SYSTEM_RULES.md).\n`, written)
  writeIfMissing(path.join(dir, 'docs', 'project-overview.md'), `# ${client} · project overview\n\nBusiness name, hosts (production, staging, railway link), locations, style pick, platform.\n\n## Version Control\n\nFollows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).\n`, written)
  writeIfMissing(path.join(dir, 'docs', 'facts.md'), `# ${client} · facts\n\nOne source for phones, hours, addresses, doctors and credentials. Every page, footer and schema is\nbuilt from this file.\n\n## Version Control\n\nFollows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).\n`, written)
}

/** The tracked part of a started scenario: each step's output/ with its RUNBOOK and keep-files. */
function scaffoldOutputs(dir, scen, written) {
  for (const st of steps(scen)) {
    const out = path.join(dir, scen, st, 'output')
    writeIfMissing(path.join(out, 'RUNBOOK.md'), `# ${scen} · ${st} · runbook\n\nNewest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.\n\n## Version Control\n\nFollows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).\n`, written)
    for (const sub of ['assets', 'code']) writeIfMissing(path.join(out, sub, '.gitkeep'), '', written)
  }
}

/** Bring one client's mirror to REF. Returns { written, removed, edited, kept }. */
function sync(client) {
  const dir = clientDir(client)
  const scens = started(dir)
  const res = { written: [], removed: [], edited: [], scaffolded: [] }
  if (!scens.length) return res
  const manifestPath = path.join(dir, MANIFEST)
  const prev = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : null
  const prevFiles = prev?.files || {}
  const { want, toolkits } = desired(scens)
  const files = {}, toWrite = []

  for (const [rel, sha] of want) {
    const abs = path.join(dir, rel)
    if (!fs.existsSync(abs)) { toWrite.push([rel, sha]); files[rel] = sha; continue }
    const buf = fs.readFileSync(abs)
    if (matches(buf, sha)) { files[rel] = sha; continue }
    const stale = prevFiles[rel] ? matches(buf, prevFiles[rel]) : everOnMain(rel, buf)
    if (stale || FORCE) { toWrite.push([rel, sha]); files[rel] = sha; continue }
    res.edited.push(rel); files[rel] = prevFiles[rel] || '(edited before the first sync)'
  }
  for (const rel of Object.keys(prevFiles)) {
    if (want.has(rel)) continue
    const abs = path.join(dir, rel)
    if (!fs.existsSync(abs)) continue
    if (matches(fs.readFileSync(abs), prevFiles[rel]) || FORCE) { res.removed.push(rel); if (!DRY) fs.rmSync(abs) }
    else { res.edited.push(rel); files[rel] = prevFiles[rel] }
  }

  const blobs = readBlobs(toWrite.map(([, sha]) => sha))
  for (const [rel, sha] of toWrite) {
    res.written.push(rel)
    if (DRY) continue
    const abs = path.join(dir, rel)
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    try { fs.chmodSync(abs, 0o644) } catch {}
    fs.writeFileSync(abs, blobs.get(sha))
  }
  for (const scen of scens) scaffoldOutputs(dir, scen, res.scaffolded)
  if (!DRY) fs.writeFileSync(manifestPath, JSON.stringify({ ref: REF, commit: SHORT, synced: today, scenarios: scens, toolkits, files }, null, 2) + '\n')
  return res
}

function report(client, r) {
  const changed = r.written.length + r.removed.length + r.scaffolded.length
  if (changed || !QUIET) console.log(`${client}: mirror ${DRY ? 'would be ' : ''}at main ${SHORT} — ${r.written.length} written, ${r.removed.length} removed${r.scaffolded.length ? `, ${r.scaffolded.length} output file(s) scaffolded` : ''}`)
  if (changed && !QUIET) for (const f of [...r.written.map((f) => '  + ' + f), ...r.removed.map((f) => '  - ' + f)].slice(0, 60)) console.log(f)
  if (r.edited.length) {
    console.log(`\n${client}: ${r.edited.length} mirror file(s) were EDITED in this worktree and were left as they are.`)
    console.log('  The mirror is not tracked: this edit exists nowhere else. Port it to main (deliver/process/<same path>),')
    console.log(`  commit it there, then run \`node scripts/scenario.mjs sync ${client}\`. --force discards the local edits.`)
    for (const f of r.edited) console.log(`    ~ ${f}   ->  deliver/process/${f}`)
    if (!QUIET) process.exitCode = 3   // --quiet (hooks, postinstall) reports but never fails
  }
}

/** Tracked files where the mirror goes (the pre-2026-10-03 copy): { mirror: main's files and toolkit
 *  leftovers, safe to untrack; strays: client files outside output/, to move into it }. */
function trackedOutsideOutput(client) {
  const rel = `deliver/brandklout/${client}`
  const all = git(['ls-files', '-z', '--', rel]).split('\0').filter(Boolean)
    .map((p) => p.slice(rel.length + 1))
    .filter((p) => /^tools\//.test(p) || /^scenario-[^/]+\/(?![^/]+\/output\/)/.test(p))
  const isMirror = (p) => /^tools\//.test(p) || TREE.has(p) || /(^|\/)\.process\.json$/.test(p)
  return { mirror: all.filter(isMirror), strays: all.filter((p) => !isMirror(p)) }
}

function status(client) {
  const dir = clientDir(client)
  const scens = started(dir)
  if (!scens.length) { console.log(`${client}: no scenario started`); return }
  const prev = fs.existsSync(path.join(dir, MANIFEST)) ? JSON.parse(fs.readFileSync(path.join(dir, MANIFEST), 'utf8')) : null
  const { want } = desired(scens)
  const missing = [], behind = [], edited = []
  for (const [rel, sha] of want) {
    const abs = path.join(dir, rel)
    if (!fs.existsSync(abs)) { missing.push(rel); continue }
    const buf = fs.readFileSync(abs)
    if (matches(buf, sha)) continue
    const stale = prev?.files?.[rel] ? matches(buf, prev.files[rel]) : everOnMain(rel, buf)
    ;(stale ? behind : edited).push(rel)
  }
  const { mirror: tracked, strays } = trackedOutsideOutput(client)
  console.log(`\n${client}  scenarios: ${scens.join(', ')}  mirror: ${prev ? `main ${prev.commit}, synced ${prev.synced}` : 'never synced'}  main now: ${SHORT}`)
  if (!missing.length && !behind.length && !edited.length) console.log('  mirror matches main')
  if (missing.length || behind.length) console.log(`  ${missing.length + behind.length} file(s) behind main — run: node scripts/scenario.mjs sync ${client}`)
  if (edited.length) { console.log(`  ${edited.length} file(s) EDITED here — port to deliver/process/ on main, then sync:`); for (const f of edited) console.log(`    ~ ${f}`) }
  if (tracked.length) console.log(`  ${tracked.length} mirror file(s) still TRACKED on this branch — run once: node scripts/scenario.mjs detach ${client}`)
  if (strays.length) { console.log(`  ${strays.length} client file(s) outside output/ (gitignored once detached) — move into the step's output/:`); for (const f of strays) console.log(`    ? ${f}`) }
  for (const scen of scens) {
    const outs = steps(scen).map((st) => {
      const o = path.join(dir, scen, st, 'output')
      const n = fs.existsSync(o) ? fs.readdirSync(o, { recursive: true }).filter((f) => !/\.gitkeep$|RUNBOOK\.md$/.test(String(f)) && fs.statSync(path.join(o, String(f))).isFile()).length : 0
      return `${st}: ${n}`
    })
    console.log(`  ${scen} outputs: ${outs.join(' · ')}`)
  }
}

/** One-time migration: drop the tracked copy from this branch's index (files stay on disk). */
function detach(client) {
  const dir = clientDir(client)
  const { mirror, strays } = trackedOutsideOutput(client)
  if (!mirror.length && !strays.length) { console.log(`${client}: nothing tracked outside output/ — already detached`); return }
  if (mirror.length) {
    console.log(`${client}: ${DRY ? 'would untrack' : 'untracking'} ${mirror.length} mirror file(s) (they stay on disk)`)
    if (!DRY) {
      const rel = `deliver/brandklout/${client}`
      for (let i = 0; i < mirror.length; i += 200) git(['rm', '-q', '--cached', '--', ...mirror.slice(i, i + 200).map((p) => `${rel}/${p}`)])
    }
  }
  if (strays.length) {
    console.log(`${client}: ${strays.length} tracked file(s) sit beside the mirror but are not part of main's process.`)
    console.log('  Client work belongs in the step\'s output/ (gitignore hides everything else). Move each one, or delete it:')
    for (const f of strays) console.log(`    ? ${f}`)
    process.exitCode = 3
  }
  if (mirror.length && !DRY) console.log(`  commit it: git commit -m "chore(${client}): process mirror untracked — process lives on main only"`)
}

try {
  if (cmd === 'list' || !cmd) {
    console.log(`deliver/process at ${REF} ${SHORT}`)
    for (const s of scenarios()) console.log(`${s}: ${steps(s).join(', ')}`)
  } else if (cmd === 'start') {
    if (isMainWorktree()) throw new Error('start a scenario in the client\'s worktree, not on main')
    const scen = resolveScenario(scenArg), dir = clientDir(clientArg)
    if (fs.existsSync(path.join(dir, scen))) throw new Error(`${clientArg} already has ${scen}; use \`sync\``)
    const w = []
    scaffoldClient(dir, clientArg, w)
    if (!DRY) fs.mkdirSync(path.join(dir, scen), { recursive: true })
    if (!DRY) {
      const readme = path.join(dir, 'README.md'), r = fs.readFileSync(readme, 'utf8')
      if (!r.includes(`| ${scen} |`)) fs.writeFileSync(readme, r.replace(/(\| --- \| --- \| --- \|\r?\n)/, `$1| ${scen} | ${today} | ${SHORT} |\n`))
    }
    for (const f of w) log('  + ' + f)
    report(clientArg, DRY ? { written: [], removed: [], edited: [], scaffolded: [] } : sync(clientArg))
  } else if (cmd === 'sync' || cmd === 'update') {
    if (isMainWorktree()) { log('scenario.mjs: this is main — the process is tracked here; nothing to mirror.'); process.exit(0) }
    const list = targets()
    if (!list.length) log('scenario.mjs: no client folder here has a started scenario.')
    for (const c of list) report(c, sync(c))
  } else if (cmd === 'status') {
    for (const c of targets()) status(c)
  } else if (cmd === 'detach') {
    if (isMainWorktree()) throw new Error('detach runs on a client branch, not on main')
    for (const c of targets()) detach(c)
  } else {
    console.error('usage: scenario.mjs list | start <client> <scenario> | sync [<client>] | status [<client>] | detach [<client>]  [--dry] [--quiet] [--force] [--ref <ref>]')
    process.exitCode = 2
  }
} catch (e) {
  console.error(`scenario.mjs: ${e.message}`)
  process.exitCode = 1
}
