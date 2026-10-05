#!/usr/bin/env node
/**
 * wf-publish.mjs — the publish gate for a live Webflow site: what a publish would ship, and
 * a publish that cannot reach a custom domain by accident.
 *
 * Promoted 2026-09-23 from a procedure repeated by hand on the client worktrees:
 *   - grand-mission-dentistry/workflows/07-webflow-build/output/publish-staging.mjs
 *     (staging-only publish, customDomains: [])
 *   - the lastUpdated vs lastPublished check from the Termly rollout
 *     (deliver/process/tools/termly-ghl-consent, .claude/runbook/2026-09-22-*) and
 *     oceanic-dental docs/runbook/2026-09-22-contact-pages-forms-dni-consent.md
 *     ("checked that only those 5 pages had changed since the user's publish").
 *
 * WHY
 * - Every Webflow publish is WHOLE-SITE. Single-page publishing needs an Enterprise plan
 *   (`pageId` returns bad_request on ours). A publish ships every pending Designer edit,
 *   including a teammate's or the client's unfinished work.
 * - Some sites carry a second brand's domains (Stone: stonesurgicalarts.com; Legacy:
 *   caldentalpasadena.com). Passing `customDomains` explicitly is the only control.
 *
 * USAGE (site id from the client docs/mcp-access.md)
 *   node wf-publish.mjs state   --site <id> [--since <ISO>]      read-only: pending pages, domains
 *   node wf-publish.mjs staging --site <id> --yes                publish to <short>.webflow.io only
 *   node wf-publish.mjs live    --site <id> --domains a.com,www.a.com --yes
 *                               [--expect <pageId,pageId>] [--ship-pending]
 *
 * `live` refuses when pages other than --expect changed since the last publish, unless
 * --ship-pending is given. Only run `live` after the user's explicit go-ahead in the
 * conversation. Afterwards re-fetch with a cache-buster and check `cf-cache-status`: Cloudflare
 * and the Webflow CDN serve the old page for minutes, and publish_site returns before the site
 * has finished compiling.
 *
 * Redirect output to a file, never pipe it.
 */
import { call, result } from './wf.mjs';

const [cmd, ...rest] = process.argv.slice(2);
const flags = {};
for (let i = 0; i < rest.length; i++) {
  if (!rest[i].startsWith('--')) continue;
  const k = rest[i].slice(2);
  flags[k] = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true;
}
const site = flags.site || process.env.WF_SITE_ID;
if (!cmd || !site) {
  console.error('usage: wf-publish.mjs state|staging|live --site <id> [...] (see header)');
  process.exit(2);
}

async function state() {
  const s = result(await call('data_sites_tool', [{ label: 's', get_site: {} }], { site }));
  const pages = [];
  for (let offset = 0; ; offset += 100) {
    const r = result(await call('data_pages_tool', [{ label: 'p', list_pages: { limit: 100, offset } }], { site }));
    const batch = r.pages || r || [];
    pages.push(...batch);
    if (batch.length < 100) break;
  }
  const since = new Date(flags.since || s.lastPublished || 0);
  const pending = pages.filter((p) => new Date(p.lastUpdated) > since);
  return { s, pages, pending, since };
}

function report({ s, pages, pending, since }) {
  const gapS = Math.round((new Date(s.lastUpdated) - new Date(s.lastPublished)) / 1000);
  console.log(`site          ${s.displayName} (${s.id}) short=${s.shortName}`);
  console.log(`lastPublished ${s.lastPublished}`);
  console.log(`lastUpdated   ${s.lastUpdated}   (${gapS}s after publish)`);
  console.log(`domains       ${(s.customDomains || []).map((d) => d.url).join(', ') || '(none)'}  + ${s.shortName}.webflow.io`);
  console.log(`pages         ${pages.length}, changed since ${since.toISOString()}: ${pending.length}`);
  for (const p of pending) console.log(`  PENDING ${p.id}  ${p.publishedPath || '/' + p.slug}${p.lastUpdated}${p.draft ? '  (draft)' : ''}`);
  const clean = gapS <= 90 && !pending.length;
  console.log(clean
    ? 'VERDICT       CLEAN: nothing pending, a publish ships only what you change next'
    : 'VERDICT       PENDING: a publish ships the pages above too. Site-level edits (freeform code, styles, components) also move lastUpdated and are not listed per page.');
  return clean;
}

const st = await state();
const clean = report(st);

if (cmd === 'state') process.exit(0);

if (!flags.yes) { console.error('\nrefusing to publish without --yes'); process.exit(2); }

if (cmd === 'staging') {
  const r = await call('data_sites_tool', [{
    label: 'publish staging',
    publish_site: { publishToWebflowSubdomain: true, customDomains: [] },
  }], { site, context: 'Staging-only publish to the webflow.io subdomain for review; custom domains untouched.' });
  console.log(JSON.stringify(result(r)).slice(0, 600));
  console.log(`\nverify on https://${st.s.shortName}.webflow.io/<slug>?cb=${Date.now()}`);
} else if (cmd === 'live') {
  const domains = String(flags.domains || '').split(',').map((d) => d.trim()).filter(Boolean);
  const known = (st.s.customDomains || []).map((d) => d.url);
  const unknown = domains.filter((d) => !known.includes(d));
  if (!domains.length || unknown.length) {
    console.error(`\n--domains must list custom domains of this site. Unknown: ${unknown.join(', ') || '(none given)'}; known: ${known.join(', ')}`);
    process.exit(2);
  }
  const expect = new Set(String(flags.expect || '').split(',').filter(Boolean));
  const others = st.pending.filter((p) => !expect.has(p.id));
  if (!clean && others.length && !flags['ship-pending']) {
    console.error(`\nrefusing: ${others.length} page(s) changed that are not in --expect. Publishing would ship someone else's work. ` +
      'Leave the change applied-but-unpublished and tell the user, or re-run with --ship-pending after they agree.');
    process.exit(1);
  }
  // publish_site takes custom domain IDs; a hostname 400s with "Please send a valid custom domain ID".
  const ids = domains.map((d) => st.s.customDomains.find((c) => c.url === d).id);
  const r = await call('data_sites_tool', [{
    label: 'publish live',
    publish_site: { publishToWebflowSubdomain: true, customDomains: ids },
  }], { site, context: `Live publish to ${domains.join(', ')} after explicit user go-ahead.` });
  console.log(JSON.stringify(result(r)).slice(0, 600));
  console.log(`\nre-fetch each changed URL with ?cb=${Date.now()} and check cf-cache-status before believing it`);
} else {
  console.error(`unknown command ${cmd}`);
  process.exit(2);
}
