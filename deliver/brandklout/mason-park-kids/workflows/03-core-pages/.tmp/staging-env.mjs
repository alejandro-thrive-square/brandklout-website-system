// Stand up the Railway `staging` environment for Mason Park Kids (process 21, section A).
//   node staging-env.mjs create     environment + PUBLIC_ORIGIN (skipDeploys) - idempotent
//   node staging-env.mjs volume     /app/storage volume on staging
//   node staging-env.mjs domain     move staging.masonparkpediatricdental.com from production to staging
//   node staging-env.mjs state      read-only
import { gql } from './rw-state.mjs';
import { PROJECT, PRODUCTION as PROD, SERVICE } from './railway-ssh.mjs';
const HOST = 'staging.masonparkpediatricdental.com';
const cmd = process.argv[2];
const envs = async () => (await gql(`query($p:String!){ project(id:$p){ environments { edges { node { id name } } } } }`, { p: PROJECT })).project.environments.edges.map(e => e.node);
const stagingId = async () => (await envs()).find(e => e.name === 'staging')?.id;
const domains = async (e) => (await gql(`query($p:String!,$e:String!,$s:String!){ domains(projectId:$p, environmentId:$e, serviceId:$s){ customDomains { id domain status { verified certificateStatus verificationDnsHost verificationToken dnsRecords { hostlabel recordType requiredValue } } } serviceDomains { id domain } } }`, { p: PROJECT, e, s: SERVICE })).domains;
if (cmd === 'create') {
  let id = await stagingId();
  if (!id) {
    const r = await gql(`mutation($i:EnvironmentCreateInput!){ environmentCreate(input:$i){ id name } }`, { i: { name: 'staging', projectId: PROJECT, sourceEnvironmentId: PROD, skipInitialDeploys: true } });
    id = r.environmentCreate.id; console.log('created staging', id);
  } else console.log('staging exists', id);
  await gql(`mutation($i:VariableUpsertInput!){ variableUpsert(input:$i) }`, { i: { projectId: PROJECT, environmentId: id, serviceId: SERVICE, name: 'PUBLIC_ORIGIN', value: `https://${HOST}`, skipDeploys: true } });
  console.log('PUBLIC_ORIGIN set on staging');
}
if (cmd === 'volume') {
  const id = await stagingId();
  const r = await gql(`mutation($i:VolumeCreateInput!){ volumeCreate(input:$i){ id name } }`, { i: { projectId: PROJECT, environmentId: id, serviceId: SERVICE, mountPath: '/app/storage' } });
  console.log('volume', JSON.stringify(r.volumeCreate));
}
if (cmd === 'domain') {
  const id = await stagingId();
  const prod = await domains(PROD);
  const old = prod.customDomains.find(d => d.domain === HOST);
  if (old) { await gql(`mutation($id:String!){ customDomainDelete(id:$id) }`, { id: old.id }); console.log('removed from production', old.id); }
  const st = await domains(id);
  if (!st.customDomains.find(d => d.domain === HOST)) {
    const r = await gql(`mutation($i:CustomDomainCreateInput!){ customDomainCreate(input:$i){ id domain } }`, { i: { domain: HOST, projectId: PROJECT, environmentId: id, serviceId: SERVICE, targetPort: 8080 } });
    console.log('created on staging', r.customDomainCreate.id);
  }
}
if (cmd === 'deleteServiceDomains') {
  const id = await stagingId();
  for (const s of (await domains(id)).serviceDomains) { await gql(`mutation($id:String!){ serviceDomainDelete(id:$id) }`, { id: s.id }); console.log('deleted service domain', s.domain); }
}
const id = await stagingId();
if (id) {
  console.log('staging', id, JSON.stringify(await domains(id), null, 1));
  const v = await gql(`query($p:String!,$e:String!,$s:String!){ variables(projectId:$p, environmentId:$e, serviceId:$s) }`, { p: PROJECT, e: id, s: SERVICE });
  console.log('staging PUBLIC_ORIGIN', v.variables.PUBLIC_ORIGIN);
  const d = await gql(`query($p:String!,$e:String!,$s:String!){ deployments(first:3, input:{projectId:$p, environmentId:$e, serviceId:$s}){ edges { node { id status createdAt } } } }`, { p: PROJECT, e: id, s: SERVICE });
  console.log('deployments', JSON.stringify(d.deployments.edges.map(e => e.node)));
}
