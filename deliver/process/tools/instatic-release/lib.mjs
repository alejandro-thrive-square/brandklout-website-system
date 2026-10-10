/**
 * lib.mjs — shared helpers for tools/instatic-release (Scenario 5 · Instatic Release Update).
 *
 * Written 2026-09-23. Railway GraphQL pattern from tools/instatic-site/setup/provision-instance.mjs,
 * the `railway ssh` addressing and Windows binary lookup from tools/instatic-api-sync/prune-versions.mjs,
 * the sectioned master env reader from tools/instatic-embeds/rollout-site-scripts.mjs.
 *
 * What lives here:
 *   gql()             Railway GraphQL with ~/.railway/config.json user.accessToken (never user.token,
 *                     never the shared RAILWAY_TOKEN; both are rejected). Refreshes an expired token by
 *                     running `railway whoami` once.
 *   listTargets()     every service instance in the workspace: project, environment, service, image,
 *                     running digest, latest deployment, volume, domains. READ ONLY.
 *   publicOrigin()    PUBLIC_ORIGIN of one service instance. Every other variable is discarded unread.
 *   ghcr*()           tags and digests of ghcr.io/corebunch/instatic (anonymous pull token).
 *   ssh()             `railway ssh -p <project> -s <service> -e <env> <cmd>`, banner stripped.
 *   bunScript()       ship a bun script over ssh as base64 so no `$` or quote meets a shell.
 *   pickTarget()      resolve --project/--site + --env to exactly one target, or exit.
 *   siteCreds()       INSTATIC_EMAIL / INSTATIC_PASSWORD for a target from ~/.brandklout/.env.
 *
 * Never prints a token, a password or any variable other than PUBLIC_ORIGIN.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { execFileSync, spawnSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const HERE = dirname(fileURLToPath(import.meta.url))
export const TOOLS = dirname(HERE)
export const IMAGE_REPO = 'ghcr.io/corebunch/instatic'
export const MOUNT = '/app/storage'
export const DB = '/app/storage/data/cms.db'
export const WORKSPACE = process.env.RAILWAY_WORKSPACE_ID || '92d349ea-1cad-4b50-b57e-7f9b280d98aa' // Brandklout workspace id (not a secret)

/* ── CLI args ─────────────────────────────────────────────────────────────── */
export const argv = process.argv.slice(2)
export const has = (n) => argv.includes('--' + n)
export const opt = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d }
export const stamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
export const die = (msg, code = 2) => { console.error(msg); process.exit(code) }

/* ── railway binary (a .cmd shim on Windows cannot be spawned without a shell) ── */
export const RAILWAY = (() => {
  const c = [
    process.env.RAILWAY_BIN,
    process.platform === 'win32' && process.env.APPDATA ? join(process.env.APPDATA, 'npm/node_modules/@railway/cli/bin/railway.exe') : null,
  ].filter(Boolean)
  return c.find((p) => existsSync(p)) ?? 'railway'
})()

/* ── Railway GraphQL ──────────────────────────────────────────────────────── */
const CONFIG = join(homedir(), '.railway', 'config.json')
function token() {
  const read = () => JSON.parse(readFileSync(CONFIG, 'utf8')).user ?? {}
  let u = read()
  if (!u.accessToken || (u.tokenExpiresAt && u.tokenExpiresAt * 1000 < Date.now() + 60_000)) {
    spawnSync(RAILWAY, ['whoami'], { stdio: 'ignore' }) // any CLI command refreshes the OAuth token
    u = read()
  }
  if (!u.accessToken) die('no user.accessToken in ~/.railway/config.json: run `railway login`')
  return u.accessToken
}

export async function gql(query, variables) {
  const r = await fetch('https://backboard.railway.com/graphql/v2', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token()}` },
    body: JSON.stringify({ query, variables }),
  })
  const j = await r.json()
  if (j.errors) throw new Error(`railway: ${JSON.stringify(j.errors).slice(0, 400)}`)
  return j.data
}

const INVENTORY = `query($w: String!) { workspace(workspaceId: $w) { name projects(first: 100) { edges { node { id name
  environments { edges { node { id name
    serviceInstances { edges { node { serviceId serviceName source { image repo }
      domains { serviceDomains { domain } customDomains { domain } }
      latestDeployment { id status createdAt canRollback meta } } } }
    volumeInstances { edges { node { id mountPath serviceId currentSizeMB sizeMB state } } }
  } } } } } } } }`

/** Every service instance in the workspace, flattened. Read only. */
export async function listTargets() {
  const d = await gql(INVENTORY, { w: WORKSPACE })
  const out = []
  for (const p of d.workspace.projects.edges.map((e) => e.node)) {
    for (const e of p.environments.edges.map((x) => x.node)) {
      const vols = e.volumeInstances.edges.map((x) => x.node)
      for (const s of e.serviceInstances.edges.map((x) => x.node)) {
        const dep = s.latestDeployment ?? {}
        const meta = dep.meta ?? {}
        out.push({
          projectId: p.id, project: p.name, environmentId: e.id, environment: e.name,
          serviceId: s.serviceId, service: s.serviceName,
          image: s.source?.image ?? null, repo: s.source?.repo ?? null,
          runningImage: meta.image ?? null, digest: meta.imageDigest ?? null, volumeMounts: meta.volumeMounts ?? [],
          deploymentId: dep.id ?? null, deploymentStatus: dep.status ?? null, deployedAt: dep.createdAt ?? null, canRollback: dep.canRollback ?? null,
          volume: vols.find((v) => v.serviceId === s.serviceId && v.mountPath === MOUNT) ?? null,
          otherVolumes: vols.filter((v) => v.serviceId === s.serviceId && v.mountPath !== MOUNT),
          customDomains: (s.domains?.customDomains ?? []).map((x) => x.domain),
          serviceDomains: (s.domains?.serviceDomains ?? []).map((x) => x.domain),
        })
      }
    }
  }
  return out
}

/** One service instance, fresh from the API (used to wait on a deploy). */
export async function currentDeployment(t) {
  const d = await gql(`query($e: String!, $s: String!) { serviceInstance(environmentId: $e, serviceId: $s) {
    source { image } latestDeployment { id status createdAt canRollback meta } } }`, { e: t.environmentId, s: t.serviceId })
  const dep = d.serviceInstance.latestDeployment ?? {}
  return { image: d.serviceInstance.source?.image, id: dep.id, status: dep.status, createdAt: dep.createdAt,
    digest: dep.meta?.imageDigest ?? null, volumeMounts: dep.meta?.volumeMounts ?? [] }
}

/** PUBLIC_ORIGIN only. The query returns every variable (secrets included); they are dropped here. */
export async function publicOrigin(t) {
  const d = await gql(`query($p: String!, $e: String!, $s: String!) { variables(projectId: $p, environmentId: $e, serviceId: $s) }`,
    { p: t.projectId, e: t.environmentId, s: t.serviceId })
  return d.variables?.PUBLIC_ORIGIN ?? null
}

/* ── ghcr.io: tags and digests ────────────────────────────────────────────── */
const ACCEPT = [
  'application/vnd.oci.image.index.v1+json', 'application/vnd.docker.distribution.manifest.list.v2+json',
  'application/vnd.oci.image.manifest.v1+json', 'application/vnd.docker.distribution.manifest.v2+json',
].join(',')
let ghcrToken
async function ghcrAuth() {
  ghcrToken ??= (await (await fetch('https://ghcr.io/token?scope=repository:corebunch/instatic:pull')).json()).token
  return { authorization: 'Bearer ' + ghcrToken }
}
export async function ghcrTags() {
  const j = await (await fetch('https://ghcr.io/v2/corebunch/instatic/tags/list?n=1000', { headers: await ghcrAuth() })).json()
  const tags = j.tags ?? []
  const ver = (t) => t.replace(/^v/, '').split('.').map(Number)
  return tags.filter((t) => /^v?\d+\.\d+\.\d+$/.test(t)).sort((a, b) => {
    const x = ver(a), y = ver(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0
  })
}
export async function ghcrDigest(tag) {
  const r = await fetch(`https://ghcr.io/v2/corebunch/instatic/manifests/${tag}`, { method: 'HEAD', headers: { ...(await ghcrAuth()), accept: ACCEPT } })
  if (!r.ok) throw new Error(`ghcr: no manifest for ${tag} (${r.status})`)
  return r.headers.get('docker-content-digest')
}
/** Map digest -> version tag for every version tag (plus 'latest'). */
export async function ghcrDigestMap() {
  const map = new Map()
  for (const t of [...(await ghcrTags()), 'latest']) {
    try { const d = await ghcrDigest(t); if (!map.has(d) || t !== 'latest') map.set(d, t) } catch { /* skip */ }
  }
  return map
}

/* ── railway ssh ──────────────────────────────────────────────────────────── */
export function ssh(t, script, { quiet = true, timeout = 600_000 } = {}) {
  const out = execFileSync(RAILWAY, ['ssh', '-p', t.projectId, '-s', t.serviceId, '-e', t.environmentId, script],
    { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, timeout, env: { ...process.env, MSYS_NO_PATHCONV: '1' } })
  const body = out.replace(/^Using SSH key from file .*\r?\n/gm, '')
  if (!quiet) process.stdout.write(body)
  return body
}
/** Run a bun script on the container. Shipped as base64, so nothing in it meets a shell. */
export function bunScript(t, js, opts) {
  const b64 = Buffer.from(js).toString('base64')
  const name = `/tmp/wz-release-${process.pid}.js`
  return ssh(t, `sh -c "echo ${b64} | base64 -d > ${name} && cd /app && bun ${name}; rm -f ${name}"`, opts)
}
/** Last JSON line a container script printed. */
export function lastJson(text) {
  const line = text.trim().split(/\r?\n/).reverse().find((l) => l.trim().startsWith('{'))
  if (!line) throw new Error('container script printed no JSON:\n' + text.slice(-800))
  return JSON.parse(line)
}

/** Read-only facts from cms.db: migrations, row counts, integrity, disk. Opens the DB readonly. */
export const DB_INFO_JS = `
const { Database } = require('bun:sqlite')
const fs = require('fs')
const out = { db: '${DB}' }
const size = (f) => { try { return fs.statSync(f).size } catch { return null } }
out.dbBytes = size('${DB}'); out.walBytes = size('${DB}-wal')
try {
  const d = new Database('${DB}', { readonly: true })
  const one = (q) => { try { return d.query(q).get() } catch (e) { return { error: String(e.message || e) } } }
  const all = (q) => { try { return d.query(q).all() } catch (e) { return [{ error: String(e.message || e) }] } }
  out.migrations = all('select id from schema_migrations order by id').map((r) => r.id)
  out.lastMigration = out.migrations[out.migrations.length - 1] ?? null
  out.counts = {}
  for (const t of ['data_rows', 'data_row_versions', 'data_tables', 'media_assets', 'installed_plugins', 'users', 'site_snapshots', 'published_runtime_assets', 'audit_events']) {
    const r = one('select count(*) as n from ' + t); out.counts[t] = r && 'n' in r ? r.n : null
  }
  const live = one('select count(*) as n from media_assets where deleted_at is null'); out.counts.media_live = live && 'n' in live ? live.n : null
  out.quickCheck = (one('pragma quick_check') || {}).quick_check ?? null
} catch (e) { out.error = String(e.message || e) }
try {
  const df = require('child_process').execSync('df -B1 --output=size,avail ${MOUNT} | tail -1').toString().trim().split(/\\s+/).map(Number)
  out.volumeBytes = df[0]; out.volumeFree = df[1]
} catch {}
console.log(JSON.stringify(out))
`

/* ── master env (~/.brandklout/.env), same format env-sync.mjs reads ─────────── */
export function readMaster() {
  const file = process.env.WEBZITE_ENV_MASTER || join(homedir(), '.brandklout', '.env')
  if (!existsSync(file)) return new Map()
  const sections = new Map([['shared', new Map()]])
  let cur = 'shared'
  for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#') || line.startsWith(';')) continue
    const h = line.match(/^\[\s*([^\]]+?)\s*\]$/)
    if (h) { cur = h[1].toLowerCase(); if (!sections.has(cur)) sections.set(cur, new Map()); continue }
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/)
    if (!kv) continue
    let v = kv[2].trim()
    if (v.length >= 2 && /^(["']).*\1$/.test(v)) v = v.slice(1, -1)
    sections.get(cur).set(kv[1], v)
  }
  const vars = sections.get('vars') ?? new Map()
  const shared = sections.get('shared')
  const expand = (v, trail = []) => v.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (w, n) => {
    if (trail.includes(n)) throw new Error(`circular reference ${w}`)
    const hit = vars.get(n) ?? shared.get(n)
    if (hit === undefined) throw new Error(`${w} is not defined in [vars] or [shared]`)
    return expand(hit, trail.concat(n))
  })
  const sites = new Map()
  for (const [name, keys] of sections) {
    if (['shared', 'vars', 'aliases'].includes(name)) continue
    const get = (k) => expand(keys.get(k) ?? shared.get(k) ?? '')
    sites.set(name, {
      name, projectId: get('RAILWAY_PROJECT_ID') || null,
      baseUrl: get('INSTATIC_BASE_URL') || null, stagingUrl: get('INSTATIC_STAGING_URL') || null,
      email: get('INSTATIC_EMAIL') || null, password: get('INSTATIC_PASSWORD') || null,
    })
  }
  return sites
}

export function readRegistry() {
  const f = join(TOOLS, 'instatic-domain-origins', 'sites.json')
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')).sites ?? [] : []
}

const hostOf = (u) => { try { return new URL(u).hostname } catch { return null } }

/** The master-env section a target belongs to: by RAILWAY_PROJECT_ID, else by host. */
export function sectionFor(t, master = readMaster()) {
  for (const s of master.values()) if (s.projectId && s.projectId === t.projectId) return s
  const hosts = new Set([...t.customDomains, ...t.serviceDomains])
  const bare = (h) => h.replace(/^(www|staging|stg)\./, '')
  for (const s of master.values()) {
    const h = hostOf(s.baseUrl), hs = hostOf(s.stagingUrl)
    if ((h && hosts.has(h)) || (hs && hosts.has(hs))) return s
  }
  // staging.<domain> belongs to the section whose production host is <domain> or www.<domain>
  for (const s of master.values()) {
    const h = hostOf(s.baseUrl)
    if (h && !/\.up\.railway\.app$/.test(h)) for (const x of hosts) if (bare(x) === bare(h)) return s
  }
  return null
}

/** The URL to talk to a target on: --base, else www custom domain, else any custom domain, else the railway host. */
export function baseFor(t) {
  if (opt('base')) return opt('base').replace(/\/$/, '')
  const www = t.customDomains.find((d) => d.startsWith('www.'))
  const host = www ?? t.customDomains[0] ?? t.serviceDomains[0]
  return host ? `https://${host}` : null
}

export function siteCreds(t) {
  const s = sectionFor(t)
  const email = process.env.INSTATIC_EMAIL || s?.email
  const password = process.env.INSTATIC_PASSWORD || s?.password
  return { section: s?.name ?? null, email, password }
}

/** --project <id|name> or --site <master section>, plus --env <name>. Exactly one match or exit. */
export async function pickTarget(targets) {
  targets ??= await listTargets()
  const env = opt('env')
  let project = opt('project')
  const site = opt('site')
  if (!project && site) {
    const s = readMaster().get(site.toLowerCase())
    if (!s) die(`no [${site}] section in ~/.brandklout/.env`)
    project = s.projectId ?? null
    if (!project) {
      const hit = targets.find((t) => sectionFor(t)?.name === s.name)
      project = hit?.projectId
    }
    if (!project) die(`[${site}] has no RAILWAY_PROJECT_ID and no Railway domain matches its INSTATIC_BASE_URL; pass --project`)
  }
  if (!project || !env) die('pass --project <id|name> (or --site <section>) and --env <production|staging>')
  const p = project.toLowerCase()
  const hits = targets.filter((t) => (t.projectId === project || t.project.toLowerCase() === p) &&
    (t.environment.toLowerCase() === env.toLowerCase() || t.environmentId === env))
  if (opt('service')) hits.splice(0, hits.length, ...hits.filter((t) => t.service === opt('service') || t.serviceId === opt('service')))
  if (hits.length !== 1) die(`expected exactly one service for project "${project}" env "${env}", found ${hits.length}${hits.length ? ': ' + hits.map((h) => h.service).join(', ') + ' (pass --service)' : ''}`)
  return hits[0]
}

/** Staging hosts are not always a `staging` environment (Mason Park Kids): classify by domain. */
export function role(t) {
  const hosts = [...t.customDomains, ...t.serviceDomains]
  if (hosts.some((h) => /(^|\.)staging\.|(^|\.)stg\.|-staging\.up\.railway\.app$/.test(h))) return 'staging'
  return t.environment === 'production' ? 'production' : t.environment
}

export async function health(base) {
  try { const r = await fetch(base + '/health', { redirect: 'manual' }); return r.status } catch { return 0 }
}

export function slug(t) { return `${t.project}-${t.environment}`.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
export function outDir(kind, t) {
  const d = join(process.cwd(), 'output', 'instatic-release', `${stamp()}-${kind}-${slug(t)}`)
  mkdirSync(d, { recursive: true })
  return d
}
export const writeJson = (f, v) => writeFileSync(f, JSON.stringify(v, null, 1))
export const readJson = (f) => JSON.parse(readFileSync(f, 'utf8'))
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Image reference for a version: `ghcr.io/corebunch/instatic:0.0.20`, or `@sha256:…` with byDigest. */
export function imageRef(version, digest, byDigest) {
  return byDigest ? `${IMAGE_REPO}@${digest}` : `${IMAGE_REPO}:${version}`
}

/** Set the service image, make sure a deployment follows, wait for it, return it. */
export async function deployImage(t, image, { minutes = 12 } = {}) {
  const before = await currentDeployment(t)
  await gql(`mutation($s: String!, $e: String!, $i: ServiceInstanceUpdateInput!) { serviceInstanceUpdate(serviceId: $s, environmentId: $e, input: $i) }`,
    { s: t.serviceId, e: t.environmentId, i: { source: { image } } })
  console.log(`  image set to ${image}`)
  // Some Railway updates trigger a deploy on their own (a variable set did, 2026-08-28). Wait briefly before asking for one.
  let now = before
  for (let i = 0; i < 4 && now.id === before.id; i++) { await sleep(5000); now = await currentDeployment(t) }
  if (now.id === before.id) {
    await gql(`mutation($s: String!, $e: String!) { serviceInstanceDeployV2(serviceId: $s, environmentId: $e) }`, { s: t.serviceId, e: t.environmentId })
    console.log('  deploy requested')
  } else console.log('  the update triggered a deployment on its own')
  const end = Date.now() + minutes * 60_000
  while (Date.now() < end) {
    await sleep(10_000)
    now = await currentDeployment(t)
    process.stdout.write(`  ${now.id === before.id ? '(old deployment)' : now.id} ${now.status}\n`)
    if (now.id !== before.id && ['SUCCESS', 'FAILED', 'CRASHED', 'REMOVED', 'SKIPPED'].includes(now.status)) break
  }
  return { before, after: now }
}
