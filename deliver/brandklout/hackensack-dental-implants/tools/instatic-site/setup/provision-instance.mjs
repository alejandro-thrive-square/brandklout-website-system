#!/usr/bin/env node
// PROMOTED 2026-09-23 to tools/instatic-site/setup/provision-instance.mjs. Origin: deliver/process/tools/instatic-api-sync/
// provision-instance.mjs on branches bk-west-la-implants (2026-09-10) and bk-ifa-dentistry (identical); not on main.
// Changes: workspace from --workspace or RAILWAY_WORKSPACE_ID, admin display name from --display-name.
// Next steps after this: tools/instatic-embeds install-plugin (all plugins), tools/instatic-domain-origins
// check-origins, then staging-clone/staging-clone.md section A for the staging environment.
/* Provision a NEW Instatic instance on Railway, name-first, in the order that
   matters. Written 2026-09-10 for West LA Implants because the six mutations
   only existed as prose in stone-med-spa/05-instatic-upload.md and had to be
   hand-run every time.

   Usage:
     node provision-instance.mjs --name "West LA Implants" [--dry]
     node provision-instance.mjs --name "West LA Implants" --setup   # after first deploy

   --dry     print the plan and exit; nothing is created
   --setup   skip creation; only run the one-shot admin bootstrap against
             INSTATIC_PROVISION_URL with INSTATIC_EMAIL / INSTATIC_SETUP_PASSWORD

   Reads the Railway token from ~/.railway/config.json (the CLI's own login),
   never from a worktree .env. Prints ids and the generated host; never prints
   the secret key or the admin password.

   Order (see the med-spa directive, "Provisioning it, in the order that matters"):
     1 projectCreate        2 serviceCreate (image ghcr.io/corebunch/instatic:latest)
     3 volumeCreate /app/storage       4 serviceDomainCreate :8080  <- ONLY after naming
     5 variableCollectionUpsert         6 healthcheck /health + serviceInstanceDeploy
   Then poll /health until 200, and POST /admin/api/cms/setup once. */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'

const args = process.argv.slice(2)
const flag = (n) => args.includes(n)
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d }

const NAME = opt('--name')
const WORKSPACE = opt('--workspace', process.env.RAILWAY_WORKSPACE_ID || '92d349ea-1cad-4b50-b57e-7f9b280d98aa') // Brandklout workspace id (not a secret)
const IMAGE = 'ghcr.io/corebunch/instatic:latest'
if (!NAME) { console.error('--name is required'); process.exit(2) }

const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.railway', 'config.json'), 'utf8'))
const TOKEN = cfg.user?.accessToken
if (!TOKEN) { console.error('no accessToken in ~/.railway/config.json — run `railway login`'); process.exit(2) }

async function gql(query, variables) {
  const r = await fetch('https://backboard.railway.com/graphql/v2', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ query, variables }),
  })
  const j = await r.json()
  if (j.errors) throw new Error(`${query.split('(')[0].trim()}: ${JSON.stringify(j.errors)}`)
  return j.data
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function health(url) {
  try { const r = await fetch(`${url}/health`, { redirect: 'manual' }); return r.status } catch { return 0 }
}

async function setup(url) {
  const email = process.env.INSTATIC_EMAIL
  const password = process.env.INSTATIC_SETUP_PASSWORD
  if (!email || !password) throw new Error('INSTATIC_EMAIL and INSTATIC_SETUP_PASSWORD must be in the environment for --setup')
  if (password.length < 12) throw new Error('Instatic requires a password of at least 12 characters')
  const st = await (await fetch(`${url}/admin/api/cms/setup/status`)).json().catch(() => null)
  console.log('setup/status', JSON.stringify(st))
  if (st && st.needsSetup === false) { console.log('already set up — nothing to do'); return }
  const r = await fetch(`${url}/admin/api/cms/setup`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: url },
    body: JSON.stringify({ siteName: NAME, email, password, displayName: opt('--display-name', 'Alejandro Milano') }),
  })
  console.log('setup ->', r.status, (await r.text()).slice(0, 200))
}

if (flag('--setup')) {
  const url = process.env.INSTATIC_PROVISION_URL
  if (!url) throw new Error('INSTATIC_PROVISION_URL missing')
  await setup(url.replace(/\/$/, ''))
  process.exit(0)
}

// guard: do not create a second project with the same name
const existing = await gql(`{ me { workspaces { id name projects { edges { node { id name } } } } } }`)
const ws = existing.me.workspaces.find((w) => w.id === WORKSPACE)
if (!ws) throw new Error(`workspace ${WORKSPACE} not visible to this token`)
const dup = ws.projects.edges.find((e) => e.node.name.toLowerCase() === NAME.toLowerCase())
if (dup) { console.error(`a project named "${NAME}" already exists: ${dup.node.id} — refusing to create another`); process.exit(1) }

console.log(`plan: workspace "${ws.name}" -> project "${NAME}" -> service "${NAME}" (${IMAGE}) -> volume /app/storage -> domain :8080 -> vars -> deploy`)
if (flag('--dry')) process.exit(0)

// 1 project
const p = await gql(`mutation($input: ProjectCreateInput!) { projectCreate(input: $input) { id name environments { edges { node { id name } } } } }`,
  { input: { name: NAME, workspaceId: WORKSPACE, defaultEnvironmentName: 'production' } })
const projectId = p.projectCreate.id
const environmentId = p.projectCreate.environments.edges.find((e) => e.node.name === 'production').node.id
console.log('project', projectId, 'environment', environmentId)

// 2 service, named before anything derives a host from it
const s = await gql(`mutation($input: ServiceCreateInput!) { serviceCreate(input: $input) { id name } }`,
  { input: { projectId, environmentId, name: NAME, source: { image: IMAGE } } })
const serviceId = s.serviceCreate.id
console.log('service', serviceId, s.serviceCreate.name)

// 3 volume
const v = await gql(`mutation($input: VolumeCreateInput!) { volumeCreate(input: $input) { id name } }`,
  { input: { projectId, environmentId, serviceId, mountPath: '/app/storage' } })
console.log('volume', v.volumeCreate.id)

// 4 domain — only now, so the host carries the service name
const d = await gql(`mutation($input: ServiceDomainCreateInput!) { serviceDomainCreate(input: $input) { id domain } }`,
  { input: { environmentId, serviceId, targetPort: 8080 } })
const host = d.serviceDomainCreate.domain
const origin = `https://${host}`
console.log('domain', host)

// 5 variables — a fresh secret, never another client's
const secret = crypto.randomBytes(32).toString('base64')
await gql(`mutation($input: VariableCollectionUpsertInput!) { variableCollectionUpsert(input: $input) }`,
  { input: { projectId, environmentId, serviceId, variables: {
    DATABASE_URL: 'sqlite:/app/storage/data/cms.db',
    PUBLIC_ORIGIN: origin,
    PORT: '8080',
    STATIC_DIR: '/app/dist',
    UPLOADS_DIR: '/app/storage/uploads',
    RAILWAY_RUN_UID: '0',
    INSTATIC_SECRET_KEY: secret,
  } } })
console.log('variables set (7)')

// 6 healthcheck + deploy
await gql(`mutation($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) { serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input) }`,
  { serviceId, environmentId, input: { healthcheckPath: '/health' } })
await gql(`mutation($serviceId: String!, $environmentId: String!) { serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId) }`,
  { serviceId, environmentId })
console.log('deploy requested; polling /health')

let ok = false
for (let i = 0; i < 60; i++) {
  await sleep(10000)
  const st = await health(origin)
  process.stdout.write(`  ${i * 10}s -> ${st}\n`)
  if (st === 200) { ok = true; break }
}
if (!ok) { console.error('instance did not become healthy in 10 minutes — check the Railway dashboard'); }

console.log(JSON.stringify({ projectId, environmentId, serviceId, host, origin }, null, 2))
if (ok && process.env.INSTATIC_EMAIL && process.env.INSTATIC_SETUP_PASSWORD) await setup(origin)
else console.log('run again with --setup once healthy, with INSTATIC_PROVISION_URL, INSTATIC_EMAIL and INSTATIC_SETUP_PASSWORD in the environment')
