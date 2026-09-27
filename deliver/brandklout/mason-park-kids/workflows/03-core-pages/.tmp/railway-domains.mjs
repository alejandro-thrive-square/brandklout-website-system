// Railway custom domains on the Mason Park Kids service: list, or create apex + www.
//   node railway-domains.mjs            list with certificate status and the DNS they want
//   node railway-domains.mjs --create   add masonparkpediatricdental.com and www (idempotent)
// GraphQL takes the CLI's OAuth token (~/.railway/config.json user.accessToken); run
// `railway whoami` first if it says Not Authorized.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { PROJECT, PRODUCTION as ENVIRONMENT, SERVICE } from './railway-ssh.mjs';
const tok = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.railway', 'config.json'), 'utf8')).user.accessToken;
const gql = async (query, variables) => {
  const r = await fetch('https://backboard.railway.com/graphql/v2', { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }) });
  const j = await r.json(); if (j.errors) throw new Error(JSON.stringify(j.errors)); return j.data;
};
const STATUS = `status { certificateStatus verificationDnsHost verificationToken verified dnsRecords { hostlabel recordType requiredValue currentValue status } }`;
const list = async () => (await gql(`query($p:String!,$e:String!,$s:String!){ domains(projectId:$p, environmentId:$e, serviceId:$s){ customDomains { id domain ${STATUS} } serviceDomains { domain } } }`, { p: PROJECT, e: ENVIRONMENT, s: SERVICE })).domains;
if (process.argv.includes('--create')) {
  const have = (await list()).customDomains.map(d => d.domain);
  for (const domain of ['masonparkpediatricdental.com', 'www.masonparkpediatricdental.com']) {
    if (have.includes(domain)) { console.log('exists', domain); continue; }
    const d = await gql(`mutation($i:CustomDomainCreateInput!){ customDomainCreate(input:$i){ id domain } }`, { i: { domain, projectId: PROJECT, environmentId: ENVIRONMENT, serviceId: SERVICE, targetPort: 8080 } });
    console.log('created', d.customDomainCreate.domain, d.customDomainCreate.id);
  }
}
const d = await list();
console.log(JSON.stringify(d, null, 1));
