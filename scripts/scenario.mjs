#!/usr/bin/env node
/**
 * scenario.mjs — copy a delivery scenario into a client folder, keep that copy current, show drift.
 *
 * The process lives once, on main, in deliver/process/:
 *   scenario-N-name/NN-step/{NN-step.md, scripts/, tools.json, output/}
 *   tools/<toolkit>/
 * A client gets a mirror of that layout, so every relative path in a directive or script works
 * the same in both places:
 *   deliver/brandklout/<client>/
 *     README.md, RUNBOOK.md, docs/          the client's own record (never overwritten)
 *     scenario-N-name/NN-step/              directive + scripts copied from main
 *     scenario-N-name/NN-step/output/       the step's assets, code and RUNBOOK.md (never overwritten)
 *     tools/<toolkit>/                      copies of the toolkits the started steps list
 *
 * Usage (from anywhere inside the repo):
 *   node scripts/scenario.mjs list
 *   node scripts/scenario.mjs start  <client> <scenario>     # scenario: "0", "scenario-0" or the folder name
 *   node scripts/scenario.mjs update <client> [<scenario>]   # refresh directives, scripts, toolkits; never output/
 *   node scripts/scenario.mjs status <client>                # what differs from main, per file
 *   Add --dry to start/update to print the plan without writing.
 *
 * Rules this enforces: output/ and the client's README, RUNBOOK and docs are never overwritten;
 * a scenario that is already started is refreshed with `update`, never re-started.
 */
import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim()
// Client worktrees check out no deliver/process/ (sparse, since 2026-09-27): the process is read from
// the checkout of main, so a client copy is always refreshed from the one place it is fixed.
const mainCheckout = () => {
  const list = execSync('git worktree list --porcelain', { encoding: 'utf8' }).split(/\r?\n\r?\n/)
  const hit = list.find((b) => /^branch refs\/heads\/main$/m.test(b))
  return hit ? hit.match(/^worktree (.+)$/m)[1] : null
}
const PROCESS_ROOT = fs.existsSync(path.join(ROOT, 'deliver', 'process')) ? ROOT : mainCheckout()
if (!PROCESS_ROOT) throw new Error('no deliver/process here and no checkout of main to read it from')
const PROCESS = path.join(PROCESS_ROOT, 'deliver', 'process')
const CLIENTS = path.join(ROOT, 'deliver', 'brandklout')
const SHARED = new Set()   // deliver/brandklout/ holds client folders only (docs and scripts moved to deliver/ on 2026-09-23)
const SKIP = new Set(['output', 'node_modules', '.tmp', '__pycache__'])

const [cmd, clientArg, scenArg] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const DRY = process.argv.includes('--dry')
const today = new Date().toISOString().slice(0, 10)
const head = () => { try { return execSync('git rev-parse --short HEAD', { cwd: PROCESS_ROOT, encoding: 'utf8' }).trim() } catch { return 'unknown' } }

const scenarios = () => fs.readdirSync(PROCESS).filter((d) => /^scenario-\d+-/.test(d)).sort()
function resolveScenario(arg) {
  if (!arg) throw new Error('name a scenario (see `list`)')
  const n = String(arg).replace(/^scenario-/, '')
  const hit = scenarios().find((s) => s === arg || s.startsWith(`scenario-${n}-`) || s === `scenario-${n}`)
  if (!hit) throw new Error(`no scenario "${arg}" in deliver/process (see \`list\`)`)
  return hit
}
const steps = (scen) => fs.readdirSync(path.join(PROCESS, scen)).filter((d) => /^\d\d-/.test(d) && fs.statSync(path.join(PROCESS, scen, d)).isDirectory()).sort()
const toolkitsOf = (scen, st) => {
  const f = path.join(PROCESS, scen, st, 'tools.json')
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).toolkits || [] : []
}
function clientDir(client) {
  if (!client || SHARED.has(client) || !/^[a-z0-9-]+$/.test(client)) throw new Error(`"${client}" is not a client slug (lowercase, dashes)`)
  return path.join(CLIENTS, client)
}

/** Copy src into dst, skipping output/ and caches; returns the relative files written. */
function copyTree(src, dst, written = [], base = dst) {
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue
    const s = path.join(src, e.name), d = path.join(dst, e.name)
    if (e.isDirectory()) { copyTree(s, d, written, base); continue }
    const same = fs.existsSync(d) && hash(fs.readFileSync(d)) === hash(fs.readFileSync(s))
    if (same) continue
    written.push(path.relative(ROOT, d).replace(/\\/g, '/'))
    if (!DRY) { fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d) }
  }
  return written
}
const hash = (b) => createHash('sha1').update(b).digest('hex')
const writeIfMissing = (p, text, written) => {
  if (fs.existsSync(p)) return
  written.push(path.relative(ROOT, p).replace(/\\/g, '/'))
  if (!DRY) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text) }
}

function scaffoldClient(dir, client, written) {
  writeIfMissing(path.join(dir, 'README.md'), `# ${client}\n\nClient folder. Each started scenario is a copy of \`deliver/process/<scenario>/\`; each step's\n\`output/\` holds its assets, code and runbook. Refresh the copies with\n\`node scripts/scenario.mjs update ${client}\`; never edit a directive or script here to fix the process.\n\n## Scenarios\n\n| Scenario | Started | From commit |\n| --- | --- | --- |\n\n## Version Control\n\nFollows [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md). Only files in this folder change on the client's branch.\n`, written)
  writeIfMissing(path.join(dir, 'RUNBOOK.md'), `# ${client} runbook\n\nStanding state: what is true now, what is next, the traps. Each step's own history is in its\n\`output/RUNBOOK.md\`; add a row below for every run.\n\n## Standing\n\n## Runs\n\n| Date | Scenario / step | What happened | Commit |\n| --- | --- | --- | --- |\n\n## Version Control\n\nFollows [SYSTEM_RULES.md §5](../../../SYSTEM_RULES.md).\n`, written)
  writeIfMissing(path.join(dir, 'docs', 'project-overview.md'), `# ${client} · project overview\n\nBusiness name, hosts (production, staging, railway link), locations, style pick, platform.\n\n## Version Control\n\nFollows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).\n`, written)
  writeIfMissing(path.join(dir, 'docs', 'facts.md'), `# ${client} · facts\n\nOne source for phones, hours, addresses, doctors and credentials. Every page, footer and schema is\nbuilt from this file.\n\n## Version Control\n\nFollows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).\n`, written)
}

function copyScenario(client, scen, { starting }) {
  const dir = clientDir(client), dst = path.join(dir, scen), written = []
  if (starting && fs.existsSync(dst)) throw new Error(`${client} already has ${scen}; use \`update\``)
  if (!starting && !fs.existsSync(dst)) throw new Error(`${client} has not started ${scen}; use \`start\``)
  if (starting) scaffoldClient(dir, client, written)
  copyTree(path.join(PROCESS, scen), dst, written)           // README + every step's directive, scripts, tools.json
  const kits = new Set()
  for (const st of steps(scen)) {
    const out = path.join(dst, st, 'output')
    writeIfMissing(path.join(out, 'RUNBOOK.md'), `# ${scen} · ${st} · runbook\n\nNewest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.\n\n## Version Control\n\nFollows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).\n`, written)
    for (const sub of ['assets', 'code']) writeIfMissing(path.join(out, sub, '.gitkeep'), '', written)
    for (const k of toolkitsOf(scen, st)) kits.add(k)
  }
  for (const k of kits) copyTree(path.join(PROCESS, 'tools', k), path.join(dir, 'tools', k), written)
  const meta = { scenario: scen, fromCommit: head(), updated: today, steps: steps(scen), toolkits: [...kits].sort() }
  const metaPath = path.join(dst, '.process.json')
  const prev = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : null
  if (prev) meta.started = prev.started; else meta.started = today
  if (!DRY) fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n')
  if (starting && !DRY) {
    const readme = path.join(dir, 'README.md'), r = fs.readFileSync(readme, 'utf8')
    if (!r.includes(`| ${scen} |`)) fs.writeFileSync(readme, r.replace(/(\| --- \| --- \| --- \|\n)/, `$1| ${scen} | ${today} | ${meta.fromCommit} |\n`))
  }
  return written
}

function status(client) {
  const dir = clientDir(client)
  const started = fs.existsSync(dir) ? fs.readdirSync(dir).filter((d) => /^scenario-\d+-/.test(d)) : []
  if (!started.length) { console.log(`${client}: no scenario started`); return }
  for (const scen of started) {
    const meta = fs.existsSync(path.join(dir, scen, '.process.json')) ? JSON.parse(fs.readFileSync(path.join(dir, scen, '.process.json'), 'utf8')) : {}
    const was = DRY; // status never writes
    const drift = []
    const cmp = (src, dst) => {
      for (const e of fs.readdirSync(src, { withFileTypes: true })) {
        if (SKIP.has(e.name)) continue
        const s = path.join(src, e.name), d = path.join(dst, e.name)
        if (e.isDirectory()) { cmp(s, d); continue }
        if (!fs.existsSync(d)) drift.push(`missing  ${path.relative(dir, d)}`)
        else if (hash(fs.readFileSync(d)) !== hash(fs.readFileSync(s))) drift.push(`changed  ${path.relative(dir, d)}`)
      }
    }
    cmp(path.join(PROCESS, scen), path.join(dir, scen))
    for (const k of meta.toolkits || []) if (fs.existsSync(path.join(PROCESS, 'tools', k))) cmp(path.join(PROCESS, 'tools', k), path.join(dir, 'tools', k))
    const outputs = steps(scen).map((st) => {
      const o = path.join(dir, scen, st, 'output')
      const n = fs.existsSync(o) ? fs.readdirSync(o, { recursive: true }).filter((f) => !/\.gitkeep$|RUNBOOK\.md$/.test(String(f)) && fs.statSync(path.join(o, String(f))).isFile()).length : 0
      return `${st}: ${n} file(s)`
    })
    console.log(`\n${client} / ${scen}  (from ${meta.fromCommit || '?'}, updated ${meta.updated || '?'})`)
    console.log(drift.length ? `  ${drift.length} file(s) differ from main — run: node scripts/scenario.mjs update ${client} ${scen}\n    ` + drift.slice(0, 40).join('\n    ') : '  directives, scripts and toolkits match main')
    console.log('  outputs: ' + outputs.join(' · '))
    void was
  }
}

try {
  if (cmd === 'list' || !cmd) {
    for (const s of scenarios()) console.log(`${s}: ${steps(s).join(', ')}`)
  } else if (cmd === 'start') {
    const w = copyScenario(clientArg, resolveScenario(scenArg), { starting: true })
    console.log(`${DRY ? 'would write' : 'wrote'} ${w.length} file(s)`); for (const f of w) console.log('  ' + f)
  } else if (cmd === 'update') {
    const dir = clientDir(clientArg)
    const list = scenArg ? [resolveScenario(scenArg)] : fs.readdirSync(dir).filter((d) => /^scenario-\d+-/.test(d))
    for (const scen of list) {
      const w = copyScenario(clientArg, scen, { starting: false })
      console.log(`${scen}: ${DRY ? 'would update' : 'updated'} ${w.length} file(s)`); for (const f of w) console.log('  ' + f)
    }
  } else if (cmd === 'status') {
    status(clientArg)
  } else {
    console.error('usage: scenario.mjs list | start <client> <scenario> | update <client> [<scenario>] | status <client> [--dry]')
    process.exitCode = 2
  }
} catch (e) {
  console.error(`scenario.mjs: ${e.message}`)
  process.exitCode = 1
}
