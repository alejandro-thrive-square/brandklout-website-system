// Read-only: environments, domains, volumes and PUBLIC_ORIGIN of the Mason Park Kids project.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { PROJECT, SERVICE } from './railway-ssh.mjs';
const tok = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.railway', 'config.json'), 'utf8')).user.accessToken;
export const gql = async (query, variables) => {
  const r = await fetch('https://backboard.railway.com/graphql/v2', { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }) });
  const j = await r.json(); if (j.errors) throw new Error(JSON.stringify(j.errors)); return j.data;
};
if (process.argv[1].includes('rw-state')) {
  const p = await gql(`query($p:String!){ project(id:$p){ name environments { edges { node { id name } } } volumes { edges { node { id name volumeInstances { edges { node { environmentId mountPath currentSizeMB } } } } } } } }`, { p: PROJECT });
  console.log(JSON.stringify(p, null, 1));
  for (const { node: e } of p.project.environments.edges) {
    const d = await gql(`query($p:String!,$e:String!,$s:String!){ domains(projectId:$p, environmentId:$e, serviceId:$s){ customDomains { id domain status { certificateStatus } } serviceDomains { id domain } } }`, { p: PROJECT, e: e.id, s: SERVICE });
    const v = await gql(`query($p:String!,$e:String!,$s:String!){ variables(projectId:$p, environmentId:$e, serviceId:$s) }`, { p: PROJECT, e: e.id, s: SERVICE });
    console.log(e.name, JSON.stringify(d.domains), 'PUBLIC_ORIGIN=', v.variables.PUBLIC_ORIGIN);
  }
}
