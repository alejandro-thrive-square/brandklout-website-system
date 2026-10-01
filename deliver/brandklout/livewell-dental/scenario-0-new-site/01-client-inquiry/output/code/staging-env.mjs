// Stand up the staging environment of a new Instatic project that has no client domain yet
// (staging-clone.md section A, in the order the 2026-09-15 med spa run proved): duplicate the
// environment without deploying, give it a host, set PUBLIC_ORIGIN before anything boots, create
// its own volume, deploy, then claim the admin at once with the same login as production.
// Usage: node staging-env.mjs <projectId> <productionEnvironmentId> <serviceId> "<site name>"
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [projectId, sourceEnvironmentId, serviceId, siteName] = process.argv.slice(2);
const TOKEN = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.railway', 'config.json'), 'utf8')).user.accessToken;
const gql = async (query, variables) => {
  const r = await fetch('https://backboard.railway.com/graphql/v2', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` }, body: JSON.stringify({ query, variables }) });
  const j = await r.json();
  if (j.errors) throw new Error(`${query.split('(')[0].trim()}: ${JSON.stringify(j.errors)}`);
  return j.data;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const proj = await gql(`query($id: String!) { project(id: $id) { environments { edges { node { id name } } } } }`, { id: projectId });
let env = proj.project.environments.edges.map((e) => e.node).find((e) => e.name === 'staging');
if (!env) {
  env = (await gql(`mutation($input: EnvironmentCreateInput!) { environmentCreate(input: $input) { id name } }`, { input: { name: 'staging', projectId, sourceEnvironmentId, skipInitialDeploys: true } })).environmentCreate;
  console.log('environment created', env.id);
} else console.log('environment exists', env.id);
const environmentId = env.id;

const dom = await gql(`query($p: String!, $e: String!, $s: String!) { domains(projectId: $p, environmentId: $e, serviceId: $s) { serviceDomains { id domain } customDomains { id domain } } }`, { p: projectId, e: environmentId, s: serviceId });
let host = dom.domains.serviceDomains[0]?.domain;
if (!host) {
  host = (await gql(`mutation($input: ServiceDomainCreateInput!) { serviceDomainCreate(input: $input) { id domain } }`, { input: { environmentId, serviceId, targetPort: 8080 } })).serviceDomainCreate.domain;
  console.log('service domain created', host);
} else console.log('service domain present', host);
const origin = `https://${host}`;

await gql(`mutation($input: VariableCollectionUpsertInput!) { variableCollectionUpsert(input: $input) }`, { input: { projectId, environmentId, serviceId, skipDeploys: true, variables: { PUBLIC_ORIGIN: origin } } });
console.log('PUBLIC_ORIGIN set to the staging host');

const vols = await gql(`query($id: String!) { project(id: $id) { volumes { edges { node { id name volumeInstances { edges { node { environmentId mountPath serviceId } } } } } } } }`, { id: projectId });
const has = vols.project.volumes.edges.some((v) => v.node.volumeInstances.edges.some((i) => i.node.environmentId === environmentId));
if (!has) {
  const v = await gql(`mutation($input: VolumeCreateInput!) { volumeCreate(input: $input) { id name } }`, { input: { projectId, environmentId, serviceId, mountPath: '/app/storage' } });
  console.log('volume created', v.volumeCreate.id);
} else console.log('volume present');

const vars = await gql(`query($p: String!, $e: String!, $s: String!) { variables(projectId: $p, environmentId: $e, serviceId: $s) }`, { p: projectId, e: environmentId, s: serviceId });
console.log('staging variables:', Object.keys(vars.variables).filter((k) => !k.startsWith('RAILWAY_')).join(', '), '| PUBLIC_ORIGIN ok:', vars.variables.PUBLIC_ORIGIN === origin);

await gql(`mutation($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) { serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input) }`, { serviceId, environmentId, input: { healthcheckPath: '/health' } });
await gql(`mutation($serviceId: String!, $environmentId: String!) { serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId) }`, { serviceId, environmentId });
console.log('deploy requested; polling /health');
let ok = false;
for (let i = 0; i < 60 && !ok; i++) {
  await sleep(10000);
  let st = 0;
  try { st = (await fetch(`${origin}/health`, { redirect: 'manual' })).status; } catch {}
  if (st === 200) ok = true;
  else if (i % 3 === 0) console.log(`  ${i * 10}s -> ${st}`);
}
if (!ok) { console.error('staging did not become healthy in 10 minutes'); process.exit(1); }

const status = await (await fetch(`${origin}/admin/api/cms/setup/status`)).json();
console.log('setup/status', JSON.stringify(status));
if (status.needsSetup) {
  const r = await fetch(`${origin}/admin/api/cms/setup`, { method: 'POST', headers: { 'content-type': 'application/json', origin }, body: JSON.stringify({ siteName, email: process.env.INSTATIC_EMAIL, password: process.env.INSTATIC_SETUP_PASSWORD, displayName: 'Alejandro Milano' }) });
  console.log('setup ->', r.status, (await r.text()).slice(0, 120));
}
console.log(JSON.stringify({ environmentId, host, origin }));
