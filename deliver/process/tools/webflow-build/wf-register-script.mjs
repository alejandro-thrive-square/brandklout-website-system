#!/usr/bin/env node
/**
 * wf-register-script.mjs — ship one site-wide script to a Webflow site as a REGISTERED script,
 * the way the agent owns site-wide code without touching the team's freeform head/footer.
 *
 * Promoted 2026-09-23 from the procedure run by hand on 29 sites in the consent rollout
 * (deliver/process/tools/termly-ghl-consent "Phase 1 - Webflow") and on oceanic-dental
 * (site-scripts/dni-loader.js, OceanicDNI 1.1.0 -> 2.0.0, docs/runbook/2026-09-22-*).
 *
 * WHAT IT ENFORCES
 * - Inline registered scripts cap at 2000 characters: minify first (npx terser@5 -c -m).
 * - Backslashes: a source TYPED into an MCP tool call can lose a layer. This script sends the
 *   file bytes itself, so it only warns; the hosted-copy compare is the gate.
 * - The hosted copy must be byte-identical: it curls `hostedLocation` and compares.
 * - Header, not footer, by default: a footer script is emitted last and malformed page markup
 *   (an unclosed <style>) swallows it as text. Self-defer to DOMContentLoaded instead.
 * - Registered scripts accept data-* attributes only. type="text/plain" is refused (400), so a
 *   script that must wait for consent gates itself on Termly.getConsentState().
 * - get_site_scripts 404s on a site with nothing applied, and add_site_script then 404s too;
 *   set_site_scripts with the one script works there. Otherwise the full applied list is
 *   re-sent with only this script's version changed, so nothing else is dropped.
 * - Applying a registered script does NOT move get_site.lastUpdated; it still ships only with
 *   the next publish (see wf-publish.mjs).
 *
 * USAGE (site id from the client docs/mcp-access.md)
 *   node wf-register-script.mjs --site <id> --name BrandkloutConsentBridge --version 2.2.0 \
 *        --file kit/ghl-consent-bridge.min.js [--location header|footer] [--dry]
 *   > .tmp/register.log 2>&1
 * Keep the unminified source and the .min.js in the client folder (e.g. <client>/site-scripts/)
 * and bump --version on every change: a registered version is immutable.
 */
import fs from 'node:fs';
import { call, result } from './wf.mjs';

const argv = process.argv.slice(2);
const flag = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const site = flag('site') || process.env.WF_SITE_ID;
const name = flag('name');
const version = flag('version');
const file = flag('file');
const location = flag('location', 'header');
const dry = argv.includes('--dry');
if (!site || !name || !version || !file) {
  console.error('usage: wf-register-script.mjs --site <id> --name <Name> --version <x.y.z> --file <min.js> [--location header|footer] [--dry]');
  process.exit(2);
}

const src = fs.readFileSync(file, 'utf8').replace(/\r?\n$/, '');
if (src.length > 2000) { console.error(`${file} is ${src.length} chars; the cap is 2000. Minify or split.`); process.exit(1); }
if (src.includes('\\')) console.log(`WARN ${file} contains backslashes. This script sends the file bytes directly, so they survive; when typing a source into an MCP tool call by hand, they may not. The hosted-copy compare below is the gate.`);
if (!/^[A-Za-z0-9]{1,50}$/.test(name)) { console.error('--name must be 1-50 alphanumeric characters'); process.exit(1); }
console.log(`${file}: ${src.length} chars, ok`);

const reg = result(await call('data_scripts_tool', [{ label: 'r', get_registered_scripts: {} }], { site }));
const regList = reg?.registeredScripts || reg || [];
const same = (Array.isArray(regList) ? regList : []).filter((s) => (s.displayName || '').toLowerCase() === name.toLowerCase());
console.log(`registered versions of ${name}: ${same.map((s) => s.version).join(', ') || 'none'}`);
if (same.some((s) => s.version === version)) { console.error(`version ${version} already registered; bump it`); process.exit(1); }

let applied = null;
try {
  const a = result(await call('data_scripts_tool', [{ label: 'a', get_site_scripts: {} }], { site }));
  applied = a?.scripts || a || [];
} catch (e) {
  if (!/404|not found/i.test(e.message)) throw e;
  applied = null; // nothing applied on this site yet
}
console.log(`applied site scripts: ${applied === null ? 'none (404)' : applied.map((s) => `${s.id}@${s.version}/${s.location}`).join(', ') || 'none'}`);
if (dry) { console.log('--dry: stopping before any write'); process.exit(0); }

const r = result(await call('data_scripts_tool', [{
  label: 'reg',
  register_inline_script: { source_code: src, version, display_name: name, can_copy: true },
}], { site, context: `Registering ${name} ${version} as a site script` }));
const id = r?.id;
const hosted = r?.hostedLocation;
console.log(`registered ${name} ${version} id=${id}`);

if (hosted) {
  const body = (await (await fetch(hosted)).text()).replace(/\r?\n$/, '');
  if (body !== src) { console.error(`hosted copy DIFFERS from ${file} (${body.length} vs ${src.length} chars). Do not apply.`); process.exit(1); }
  console.log(`hosted copy identical: ${hosted}`);
} else {
  console.log('WARN: no hostedLocation returned; curl it from get_registered_scripts and compare by hand');
}

if (applied === null) {
  await call('data_scripts_tool', [{ label: 'set', set_site_scripts: { scripts: [{ id, location, version }] } }], { site });
} else if (applied.some((s) => s.id === id)) {
  const scripts = applied.map((s) => (s.id === id ? { id, location, version } : { id: s.id, location: s.location, version: s.version, ...(s.attributes ? { attributes: s.attributes } : {}) }));
  await call('data_scripts_tool', [{ label: 'set', set_site_scripts: { scripts } }], { site });
} else {
  await call('data_scripts_tool', [{ label: 'add', add_site_script: { script_id: id, location, version } }], { site });
}
console.log(`applied ${name} ${version} in the ${location}. It ships with the next publish; run wf-publish.mjs state.`);
