/* publish_site takes site_id INSIDE the action (not a top-level siteId like the
   style/page tools), and every action object needs exactly one action key. */
import { callTool as call } from './wfmcp.mjs';
import { SITE } from './wfstyles.mjs';
const r = await call('data_sites_tool', {
  context: 'Publishing the footer grid tablet fix to the Webflow staging subdomain for verification.',
  actions: [{ label: 'publish', publish_site: { site_id: SITE, publishToWebflowSubdomain: true } }] });
console.log((r.text || JSON.stringify(r)).slice(0, 800));
