#!/usr/bin/env node
/**
 * wf.mjs — task-local front end to ../wfmcp.mjs for the v2 native rebuild.
 *
 * The 2026-07-28 stateless Webflow MCP splits its tools into two shapes:
 *   - Designer tools (style / element / variable / component / builders) take
 *     `siteId` + `pageId` at the TOP level of the arguments.
 *   - Data-API tools (pages / assets / sites / cms / scripts) keep `site_id`
 *     INSIDE each action, and reject a top-level `siteId`.
 * This wrapper injects whichever the tool wants, so callers write only the
 * action body.
 *
 *   node wf.mjs <tool> '<json actions>' [--site arvada|masonpark|kit|<id>]
 *                                       [--page <pageId>] [--out file]
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const SITES = {
  arvada: '693c51e685b19f0d0c149cab',
  masonpark: '6a60bdc0340e5f1784b4d553',
  kit: '6a7a804cfed7e6e46272c6b0',
};

const CTX = 'Rebuilding Arvada paid-traffic landing pages natively with client-first classes on new v2 pages';

/** Tools whose actions carry site_id themselves. */
const DATA_API = new Set([
  'data_pages_tool', 'data_assets_tool', 'data_sites_tool', 'data_cms_tool',
  'data_scripts_tool', 'data_forms_tool', 'data_fonts_tool', 'data_webhook_tool',
  'data_sitemap_tool', 'data_enterprise_tool', 'data_comments_tool', 'data_localization_tool',
]);

export function raw(tool, args) {
  const r = spawnSync(process.execPath,
    [path.join(HERE, '..', 'wfmcp.mjs'), 'call', tool, JSON.stringify(args)],
    { encoding: 'utf8', maxBuffer: 1 << 28 });
  return ((r.stdout || '') + (r.stderr || '')).trim();
}

export function call(tool, actions, opts = {}) {
  const site = opts.site || SITES.arvada;
  const list = Array.isArray(actions) ? actions : [actions];
  const args = { actions: list, context: opts.context || CTX };

  if (DATA_API.has(tool)) {
    for (const a of list) {
      for (const k of Object.keys(a)) {
        const body = a[k];
        if (k !== 'label' && body && typeof body === 'object' && body.site_id === undefined) {
          body.site_id = site;
        }
      }
    }
  } else {
    args.siteId = site;
    args.pageId = opts.page || '';
  }

  let out = raw(tool, args);
  // wfmcp prints housekeeping lines (token refresh) alongside the JSON payload.
  out = out.split(/\r?\n/).filter((l) => !l.startsWith('[wfmcp]')).join('\n').trim();

  // A multi-action call comes back as one JSON object PER ACTION, newline-delimited —
  // not as a JSON array. Parse both shapes and always hand back an array-ish result.
  try {
    return JSON.parse(out);
  } catch {
    const parts = out.split(/\n(?=\{)/).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      try { return parts.map((p) => JSON.parse(p)); } catch { /* fall through */ }
    }
    return { error: out };
  }
}

function main() {
  const [tool, json, ...rest] = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith('--')) flags[rest[i].slice(2)] = rest[i + 1];
  }
  const site = SITES[flags.site] || flags.site;
  const res = call(tool, JSON.parse(json), { site, page: flags.page });
  const s = JSON.stringify(res, null, 1);
  if (flags.out) {
    fs.writeFileSync(path.resolve(flags.out), s);
    console.log(`${flags.out}: ${s.length} bytes`);
  } else {
    console.log(s.length > 6000 ? s.slice(0, 6000) + '\n...[truncated]' : s);
  }
}

if (process.argv[1] && process.argv[1].endsWith('wf.mjs')) main();
