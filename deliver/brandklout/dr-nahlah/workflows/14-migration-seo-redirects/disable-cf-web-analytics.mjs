#!/usr/bin/env node
/**
 * disable-cf-web-analytics.mjs — stop Cloudflare injecting its Web Analytics
 * beacon into drnahlah.com (QA 2026-09-28, F08: "console error on 73 pages").
 *
 *   node disable-cf-web-analytics.mjs            # show the current setting
 *   node disable-cf-web-analytics.mjs --apply    # auto_install -> false
 *   node disable-cf-web-analytics.mjs --enable   # put it back (needs the CSP grant too)
 *
 * Cloudflare auto-installed the beacon at the edge (site created 2026-08-25), but
 * the page CSP (brandklout.embed-origins) never allowed static.cloudflareinsights.com,
 * so it has never collected anything and logged a CSP error on every page.
 * Allowing it would START collecting analytics on a medical site while the client's
 * HIPAA sign-off on tracking is open (QA decision 9), so it is switched off instead.
 * Only this zone's site entry is touched.
 */
import { cf, accountId } from './cf-api.mjs'
const ZONE = 'drnahlah.com'
const acct = await accountId()
const site = (await cf('GET', `/accounts/${acct}/rum/site_info/list`)).find((s) => s.ruleset?.zone_name === ZONE)
if (!site) { console.error(`no Web Analytics site for ${ZONE}`); process.exit(1) }
console.log(`${ZONE}: site_tag ${site.site_tag}, auto_install ${site.auto_install}`)
/* `auto_install: false` alone did NOT stop the edge injecting the beacon (still in
   every page 25 minutes later, 2026-10-02). Cloudflare's switch is `enabled`, which
   it only honours in auto-install mode: auto_install true + enabled false = off. */
const want = process.argv.includes('--enable') ? true : process.argv.includes('--apply') ? false : null
console.log(`  ruleset enabled ${site.ruleset?.enabled}`)
if (want === null) process.exit(0)
const r = await cf('PUT', `/accounts/${acct}/rum/site_info/${site.site_tag}`, { auto_install: true, enabled: want, zone_tag: site.ruleset.zone_tag })
console.log(`now auto_install ${r.auto_install}, ruleset enabled ${r.ruleset?.enabled}`)
