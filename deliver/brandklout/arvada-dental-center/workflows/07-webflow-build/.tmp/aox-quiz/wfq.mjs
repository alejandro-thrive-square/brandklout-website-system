/**
 * wfq.mjs — Webflow MCP calls for the All-on-X quiz build.
 *
 * ../v2-native/wf.mjs predates the server's session contract and now returns
 * `{ error: "[session_id issued ..." }` for every call: since 2026-09 each call
 * must carry `session_id` (the literal "start" once, then the ses_ value the
 * server issues) and an `agent_id`, and the first reply is prefixed with a
 * text block that is not JSON. This wrapper carries both, keeps the session in
 * .session.json so separate script runs belong to one task, and parses the
 * newline-delimited JSON the server returns (one object per action).
 *
 * The instance reaches every Brandklout site. SITE below is the boundary.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { callTool } from '../wfmcp.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
export const SITE = '693c51e685b19f0d0c149cab';            // Arvada Dental Center — the only site this build may touch
const SESSION_FILE = join(HERE, '.session.json');
const CONTEXT = 'Builds the new All-on-X quiz landing, consult and thank-you pages on the Arvada Dental Center site from the approved local design.';

const DATA_API = new Set(['data_pages_tool', 'data_assets_tool', 'data_sites_tool', 'data_scripts_tool', 'data_fonts_tool']);

function session() {
  if (existsSync(SESSION_FILE)) return JSON.parse(readFileSync(SESSION_FILE, 'utf8'));
  const s = { session_id: 'start', agent_id: 'opus-5.5-1m|claude-code|' + Math.random().toString(36).slice(2, 7) };
  writeFileSync(SESSION_FILE, JSON.stringify(s));
  return s;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Call one tool with a list of actions. Returns an array, one parsed result per action. */
export async function wf(tool, actions, { pageId } = {}) {
  const list = Array.isArray(actions) ? actions : [actions];
  let text = '';
  for (let attempt = 0; attempt < 6; attempt++) {
    const s = session();
    const args = { actions: list, session_id: s.session_id, agent_id: s.agent_id, context: CONTEXT };
    if (!DATA_API.has(tool)) { args.siteId = SITE; args.pageId = pageId ?? ''; }
    ({ text } = await callTool(tool, args));
    const issued = text.match(/session_id: (ses_[0-9A-Za-z]{27})/);
    if (issued) { writeFileSync(SESSION_FILE, JSON.stringify({ ...s, session_id: issued[1] })); }
    if (/\[session_id unrecognized/.test(text)) { writeFileSync(SESSION_FILE, JSON.stringify({ ...s, session_id: 'start' })); continue; }
    if (/\b429\b|rate.?limit/i.test(text.slice(0, 400))) { await sleep(15000 * 2 ** attempt); continue; }
    break;
  }
  // Drop the session preamble: everything before the first line that starts a JSON value.
  const lines = text.split(/\r?\n/);
  const at = lines.findIndex((l) => l.startsWith('{') || l.startsWith('['));
  const body = at < 0 ? text : lines.slice(at).join('\n');
  try { const j = JSON.parse(body); return Array.isArray(j) ? j : [j]; } catch { /* one object per action */ }
  const parts = body.split(/\n(?=\{)/).map((p) => p.trim()).filter(Boolean);
  try { return parts.map((p) => JSON.parse(p)); } catch { return [{ error: text }]; }
}

/** Throw on any action that did not succeed, with the server's words. */
export function must(results, what) {
  for (const r of results) {
    const s = JSON.stringify(r);
    if (r.error !== undefined || r.status === 'error' || /"status":"error"/.test(s)) throw new Error(`${what}: ${s.slice(0, 900)}`);
  }
  return results;
}

// CLI: node wfq.mjs <tool> '<json actions>' [pageId]
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [tool, json, pageId] = process.argv.slice(2);
  const out = await wf(tool, JSON.parse(json), { pageId });
  console.log(JSON.stringify(out, null, 1));
}
