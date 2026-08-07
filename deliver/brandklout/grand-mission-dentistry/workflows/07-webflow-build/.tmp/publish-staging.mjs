/**
 * publish-staging.mjs — publish the site to grandmissiondentistry.webflow.io ONLY.
 *
 * customDomains is left EMPTY on purpose. Publishing to grandmissiondentistry.com
 * is out of scope and not authorized (docs/mcp-access.md → Forbidden Operations):
 * that domain serves real patients and real paid traffic. The subdomain publish
 * necessarily republishes all 303 pages to webflow.io, which is accepted for
 * staging and is precisely why the custom domains must stay untouched.
 */
import { callTool } from './wfmcp.mjs';
const r = await callTool('data_sites_tool', {
  context: 'Publishing the site to its Webflow staging subdomain only so the three rebuilt landing pages can be verified without touching the live customer domain.',
  actions: [{
    label: 'publish staging subdomain only',
    publish_site: { site_id: '698111847e9608eb30ee21c6', publishToWebflowSubdomain: true, customDomains: [] },
  }],
});
console.log(r.text.slice(0, 800));
