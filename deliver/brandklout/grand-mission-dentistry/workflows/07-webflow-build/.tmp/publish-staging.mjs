/**
 * publish-staging.mjs — publish the site to grandmissiondentistry.webflow.io ONLY.
 *
 * customDomains is left EMPTY on purpose. Publishing to grandmissiondentistry.com
 * is out of scope and not authorized (docs/mcp-access.md → Forbidden Operations):
 * that domain serves real patients and real paid traffic. The subdomain publish
 * necessarily republishes all 303 pages to webflow.io, which is accepted for
 * staging and is precisely why the custom domains must stay untouched.
 */
/* Goes through mcp.mjs rather than callTool directly: publishing straight after
   a batch of writes hits the rate limit, and this script used to report the 429
   as its result and exit 0 — so a run would look published when nothing had
   been. `call` retries transient failures and throws on everything else. */
import { call } from './mcp.mjs';
const r = await call('data_sites_tool', {
  context: 'Publishing the site to its Webflow staging subdomain only so the three rebuilt landing pages can be verified without touching the live customer domain.',
  actions: [{
    label: 'publish staging subdomain only',
    publish_site: { site_id: '698111847e9608eb30ee21c6', publishToWebflowSubdomain: true, customDomains: [] },
  }],
});
console.log(JSON.stringify(r).slice(0, 800));
