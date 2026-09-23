#!/usr/bin/env node
// PROMOTED 2026-09-23 to deliver/process/tools/instatic-site/push/check-link.mjs
// Origin: bk-west-la-implants/deliver/brandklout/west-la-implants/workflows/21-instatic-upload/check-link.mjs. Paths now come from ../lib/paths.mjs (run from the client's workflow
// folder; build root = --site-src or SITE_SRC; outputs in <cwd>/output) and the admin client from
// ../lib/site.mjs (refuses to run without INSTATIC_BASE_URL). Client-specific notes below are the
// origin's record; review them against the new site before --apply.
/**
 * Guard for `ship.sh` — refuse to open a shell into a container that is not
 * this site's.
 *
 * WHY THIS EXISTS. `ship.sh` takes its Railway target from `$RAILWAY_LINK_DIR`
 * and from nothing else: every `railway ssh` runs `cd "$RAILWAY_LINK_DIR"` and
 * inherits whatever project that directory happens to be linked to. Nothing
 * tied that directory to the client the worktree builds, and the whole upload
 * toolkit gets copied verbatim from one client's worktree to the next — so on
 * 2026-09-04 the med spa's own directive still read
 * `railway link -p "Stone Surgical Arts"`, four lines above a script that would
 * have shipped the med spa's payload into the Surgical Arts container and run
 * the importer there, against twelve pages the client was reviewing.
 *
 * THE INVARIANT. The linked project+environment must actually serve the host
 * the rest of the pipeline talks to. `INSTATIC_BASE_URL` is that host —
 * `insta-api.mjs` resolves `BASE` from it, and so every request `push-site.mjs`
 * makes — and it is per-worktree, generated from `~/.webzite/.env`. Checking
 * against it therefore needs no per-client table here and stays correct when
 * this file is copied to the next client, which is the failure mode.
 *
 * It resolves `INSTATIC_BASE_URL` exactly the way `insta-api.mjs` does — an
 * exported value wins, then the nearest `.env` walking up — deliberately: a
 * guard that resolved the target differently from the pipeline would pass on a
 * target the pipeline then ignores.
 *
 * Fails closed. Anything it cannot determine is an abort, never a warning.
 *
 * Usage:  node check-link.mjs "$RAILWAY_LINK_DIR"
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const HERE = process.cwd() // walk for .env from the client folder
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

function die(...lines) {
  console.error('')
  console.error('  REFUSING TO SHIP — the link dir is not this site.')
  console.error('')
  for (const l of lines) console.error('  ' + l)
  console.error('')
  process.exit(1)
}

const link = process.argv[2]
if (!link) die('usage: node check-link.mjs <RAILWAY_LINK_DIR>')

// Snapshot before loadEnv(), which is about to inject the worktree's own
// RAILWAY_* values. See railwayEnv() below for why the difference matters.
const shellRailwayVars = new Set(Object.keys(process.env).filter((k) => k.startsWith('RAILWAY_')))

// Same walk as insta-api.mjs: first .env found going up, and an already-set
// variable is never overwritten.
function loadEnv() {
  let dir = HERE
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, '.env')
    if (existsSync(candidate)) {
      for (const line of readFileSync(candidate, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
      return candidate
    }
    const up = dirname(dir)
    if (up === dir) return null
    dir = up
  }
  return null
}

const envFile = loadEnv()
const base = process.env.INSTATIC_BASE_URL
if (!base) {
  die(
    'INSTATIC_BASE_URL is not set and no .env below this file supplies it.',
    envFile ? `nearest .env: ${envFile}` : 'no .env found walking up from ' + HERE,
    'It is generated from ~/.webzite/.env — add the client section there and re-sync.',
  )
}

let want
try {
  want = new URL(base).host.toLowerCase()
} catch {
  die(`INSTATIC_BASE_URL is not a URL: ${base}`)
}

/* Run `railway` in the environment SHIP.SH will have, not the one this file
 * made for itself. ship.sh never loads a .env, so every RAILWAY_* value that
 * loadEnv() just injected is invisible to it, and letting those reach the CLI
 * here would have the guard inspect a target ship.sh will not use.
 *
 * Two of them do real damage, and both are in the worktree .env today:
 *
 *   RAILWAY_TOKEN overrides the CLI's own stored auth in ~/.railway/config.json.
 *   The master copy is stale, so every `railway` call from a script that loaded
 *   a worktree .env dies with "Invalid RAILWAY_TOKEN" — from a CLI that works
 *   perfectly by hand. `~/.webzite/.env` already says the CLI "works without
 *   this" and that the variable is for scripts that cannot shell out.
 *
 *   RAILWAY_PROJECT_ID outranks the linked directory ENTIRELY. Standing in a
 *   directory linked to Stone Surgical Arts with the med spa's value set,
 *   `railway status` reports Stone Med Spa. $RAILWAY_LINK_DIR stops meaning
 *   anything at that point, which is worth knowing before you `set -a; . .env`
 *   in a shell you then run ship.sh from.
 *
 * Values the calling SHELL exported are kept — those ship.sh does inherit, so
 * the guard must see them too, and shellOverrides() calls them out by name when
 * the check fails. */
function railwayEnv() {
  const env = { ...process.env }
  for (const k of Object.keys(env)) {
    if (k.startsWith('RAILWAY_') && !shellRailwayVars.has(k)) delete env[k]
  }
  return env
}

// RAILWAY_* the shell exported, which silently outrank $LINK.
function shellOverrides() {
  const hits = [...shellRailwayVars].filter((k) => k !== 'RAILWAY_TOKEN').sort()
  if (!hits.length) return []
  return [
    '',
    'NOTE: these are exported in your shell and OUTRANK the link dir:',
    ...hits.map((k) => `  ${k}=${process.env[k]}`),
    'Unset them, or link a directory and let it speak for itself.',
  ]
}

function railway(args) {
  try {
    // execSync so PATH resolution works on Windows (railway.exe) and POSIX
    // alike. `link` is only ever a cwd, never interpolated into the command.
    return execSync(`railway ${args}`, { cwd: link, env: railwayEnv(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (e) {
    die(
      `\`railway ${args}\` failed in ${link}`,
      'Is that directory linked? `railway link` links the CURRENT directory only —',
      'the CLI does not walk up to a parent, so each dir is its own link.',
      String(e.stderr || e.message).trim().split('\n').slice(0, 4).join('\n  '),
    )
  }
}

// The plain output is the only place that names the LINKED environment, as
// opposed to every environment the project has. Dr. Nahlah has staging and
// production on one project with different hosts, so project-level matching
// would not be enough.
const plain = railway('status')
const envId = (plain.match(new RegExp(`Environment ID:\\s*(${UUID})`, 'i')) || [])[1]
const projId = (plain.match(new RegExp(`Project ID:\\s*(${UUID})`, 'i')) || [])[1]
if (!envId || !projId) {
  die(
    `could not read the linked project/environment out of \`railway status\` in ${link}`,
    projId && !envId
      ? 'It named a project but no environment — the usual cause is a RAILWAY_PROJECT_ID'
      : 'The CLI output format may have changed; this guard fails closed on purpose.',
    projId && !envId ? 'pointing somewhere the link dir is not.' : '',
    ...shellOverrides(),
  )
}

let status
try {
  status = JSON.parse(railway('status --json'))
} catch (e) {
  die('could not parse `railway status --json`', String(e.message))
}

const found = []
for (const e of status.environments?.edges ?? []) {
  const env = e.node ?? {}
  for (const se of env.serviceInstances?.edges ?? []) {
    const svc = se.node ?? {}
    const d = svc.domains ?? {}
    for (const x of [...(d.serviceDomains ?? []), ...(d.customDomains ?? [])]) {
      if (!x?.domain) continue
      found.push({ host: String(x.domain).toLowerCase(), env: env.name, envId: env.id, service: svc.serviceName })
    }
  }
}

const hit = found.find((f) => f.host === want && f.envId === envId)
if (!hit) {
  const inEnv = found.filter((f) => f.envId === envId).map((f) => `  - ${f.host}  [${f.service}]`)
  const elsewhere = found.find((f) => f.host === want)
  die(
    `this worktree targets  ${want}`,
    `the link dir resolves to project "${status.name}" (${projId}), environment ${envId}`,
    `link dir: ${link}`,
    '',
    'hosts that project serves in the linked environment:',
    ...(inEnv.length ? inEnv : ['  (none)']),
    '',
    ...(elsewhere
      ? [`${want} IS served by this project, but in environment "${elsewhere.env}" — link that one.`]
      : ['Link a directory to THIS site instead:', '  railway link   # then point RAILWAY_LINK_DIR at that directory']),
    ...shellOverrides(),
  )
}

console.log(`  link OK — ${status.name} / ${hit.env} / ${hit.service} serves ${hit.host}`)
