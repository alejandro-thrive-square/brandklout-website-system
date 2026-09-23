#!/usr/bin/env node
/**
 * wf.mjs — the front end every Webflow script should call instead of wfmcp.mjs directly.
 *
 * Promoted 2026-09-23. Merges two copies that grew separately on the client worktrees:
 *   - grand-mission-dentistry/workflows/07-webflow-build/output/mcp.mjs  (429 / 1101 retries,
 *     one-JSON-object-per-line parsing, throws on non-transient errors)
 *   - legacy-dental-pasadena and marvel-dental .../webflow-build/output/native/wf.mjs
 *     (argument-shape injection; arvada's v2-native/wf.mjs is the same file)
 * Client site maps were removed. The site id now comes from --site or WF_SITE_ID.
 *
 * WHAT IT ADDS
 * - Argument shapes. Designer tools (element / style / variable / component / builders) take
 *   `siteId` + `pageId` at the TOP level. Data-API tools (pages / assets / sites / cms / scripts
 *   / forms / comments) take `site_id` INSIDE each action and reject a top-level `siteId`.
 *   Mixing them up returns a Zod wall. This injects whichever the tool wants.
 * - The site guard. Every Brandklout client shares one MCP instance, so the site id is the
 *   security boundary, not the tool prefix. A call whose actions name a different site id than
 *   the one resolved here is refused.
 * - Retries. The endpoint rate-limits (429, Cloudflare 1101, or the bare text
 *   "Too Many Requests") after ~30 fast calls, and a rate-limited call can look like success.
 *   Transient failures back off exponentially; anything else THROWS.
 *
 * CLI
 *   node wf.mjs <tool> '<json action or [actions]>' --site <siteId> [--page <pageId>] [--out f.json]
 *   e.g. node wf.mjs data_sites_tool '{"label":"s","get_site":{}}' --site 693c51e685b19f0d0c149cab
 *
 * LIBRARY
 *   import { call, result } from './wf.mjs';
 *   const res = await call('data_element_tool', [{ label: 't', get_all_elements: {} }], { site, page });
 *   const root = result(res)?.[0]?.data ?? result(res);   // shapes vary per tool, see README
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { callTool } from './wfmcp.mjs';

export const DATA_API = new Set([
  'data_pages_tool', 'data_assets_tool', 'data_sites_tool', 'data_cms_tool',
  'data_scripts_tool', 'data_forms_tool', 'data_fonts_tool', 'data_webhook_tool',
  'data_sitemap_tool', 'data_enterprise_tool', 'data_comments_tool', 'data_localization_tool',
]);

/* Since September 2026 every tool requires `session_id` and `agent_id`. The first call sends
   "start"; the server answers with a "[session_id issued ...] ses_..." text block ahead of the
   JSON, and every later call in the process must send that ses_ value. agent_id is a
   self-chosen, stable identifier per task. WF_SESSION_ID / WF_AGENT_ID override both, so a
   script run by an agent can share the agent's own session. */
const SESSION = { id: process.env.WF_SESSION_ID || 'start' };
const AGENT_ID = process.env.WF_AGENT_ID || `script|wf.mjs|${Math.random().toString(36).slice(2, 7)}`;

const TRANSIENT =/\b429\b|\b1101\b|rate.?limit|too many requests|timeout|ECONN|fetch failed/i;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Parse a tool reply: one JSON object per line (one per action), or one JSON document. */
export function parse(text) {
  const t = (text || '').trim();
  try { const j = JSON.parse(t); return Array.isArray(j) ? j : [j]; } catch { /* per line */ }
  return t.split(/\r?\n(?=\{)/).filter(Boolean).map((l) => {
    try { return JSON.parse(l); } catch { return { error: { name: 'ProtocolError', message: l.slice(0, 600) } }; }
  });
}

/** The `result` of the first action, whatever envelope the tool used. */
export function result(parsed, i = 0) {
  const a = parsed?.[i] ?? parsed;
  if (a?.actions) return a.actions[i]?.result;
  return a?.result ?? a?.data ?? a;
}

function siteIdsIn(obj, out = new Set()) {
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if ((k === 'site_id' || k === 'siteId') && typeof v === 'string') out.add(v);
      else siteIdsIn(v, out);
    }
  }
  return out;
}

/**
 * @param tool     MCP tool name
 * @param actions  one action object or an array of them ({ label, <action>: {...} })
 * @param opts     { site, page, context, tries, strict }
 */
export async function call(tool, actions, opts = {}) {
  const site = opts.site || process.env.WF_SITE_ID;
  if (!site) throw new Error('no site id: pass --site / opts.site or set WF_SITE_ID (read it from the client docs/mcp-access.md)');
  const list = Array.isArray(actions) ? actions : [actions];
  const foreign = [...siteIdsIn(list)].filter((s) => s !== site);
  if (foreign.length) throw new Error(`site guard: actions name ${foreign.join(', ')} but this call is scoped to ${site}`);

  const args = {
    actions: list,
    context: opts.context || `Brandklout scenario 2 update on Webflow site ${site}`,
    session_id: SESSION.id,
    agent_id: AGENT_ID,
  };
  if (DATA_API.has(tool)) {
    for (const a of list) {
      for (const [k, body] of Object.entries(a)) {
        if (k !== 'label' && body && typeof body === 'object' && body.site_id === undefined) body.site_id = site;
      }
    }
  } else {
    args.siteId = site;
    if (opts.page) args.pageId = opts.page;
  }

  const tries = opts.tries ?? 6;
  let lastErr;
  for (let i = 0; i < tries; i++) {
    if (i) {
      const wait = 5000 * 2 ** (i - 1);
      process.stderr.write(`[wf] ${tool} transient failure, retry ${i}/${tries - 1} in ${wait / 1000}s\n`);
      await sleep(wait);
    }
    let out;
    try { out = await callTool(tool, args); } catch (e) {
      lastErr = e;
      if (!TRANSIENT.test(e.message)) throw e;
      continue;
    }
    if (out.text.startsWith('[session_id')) {
      const cut = out.text.search(/\n[{[]/);
      const notice = cut < 0 ? out.text : out.text.slice(0, cut);
      const id = (notice.match(/ses_[0-9A-Za-z]{27}/) || [])[0];
      if (id) SESSION.id = id;
      else if (/unrecognized/.test(notice)) { SESSION.id = 'start'; lastErr = new Error(notice); continue; }
      out.text = cut < 0 ? '' : out.text.slice(cut + 1);
    }
    const parsed = parse(out.text);
    const errs = parsed.filter((p) => p && p.error);
    if (errs.some((p) => TRANSIENT.test(JSON.stringify(p.error)))) { lastErr = new Error(JSON.stringify(errs[0].error)); continue; }
    if ((opts.strict ?? true) && (errs.length || out.raw?.isError)) {
      throw new Error(`${tool}: ${(errs.map((e) => JSON.stringify(e.error)).join('\n') || out.text).slice(0, 1200)}`);
    }
    return parsed;
  }
  throw lastErr;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  const [tool, json, ...rest] = process.argv.slice(2);
  if (!tool || !json) {
    console.error("usage: node wf.mjs <tool> '<json action|[actions]>' --site <id> [--page <id>] [--out file]");
    process.exit(2);
  }
  const flags = {};
  for (let i = 0; i < rest.length; i++) if (rest[i].startsWith('--')) flags[rest[i].slice(2)] = rest[++i];
  const res = await call(tool, JSON.parse(json), { site: flags.site, page: flags.page });
  const s = JSON.stringify(res, null, 1);
  if (flags.out) { fs.writeFileSync(path.resolve(flags.out), s); console.log(`${flags.out}: ${s.length} bytes`); }
  else console.log(s.length > 8000 ? s.slice(0, 8000) + '\n...[truncated, use --out]' : s);
}
