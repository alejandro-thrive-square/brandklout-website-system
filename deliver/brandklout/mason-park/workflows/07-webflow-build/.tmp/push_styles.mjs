#!/usr/bin/env node
/**
 * push_styles.mjs — send `mkactions.py` batches to `data_style_tool` through
 * the direct MCP client, then retry whatever the API refused until it sticks.
 *
 * Source Asana task GID: 1217040406855582
 *
 * WHY NOT SEND THEM AS AGENT TOOL CALLS
 * -------------------------------------
 * The re-theme is ~300 rules. Inlining them into agent tool calls costs the
 * whole payload in tokens twice (request + echoed result) for no benefit —
 * they are generated files, already reviewed as files. This drives the exact
 * same MCP tool over the exact same grant.
 *
 * WHY THE RETRY LOOP IS NOT OPTIONAL
 * ----------------------------------
 * Two failures are routine at this volume and BOTH are reported per action,
 * inside an otherwise successful call — a script that only checks the HTTP
 * status will report a clean run over a half-applied re-theme:
 *
 *   "Too Many Requests" / "init-multiplayer-connection returned 429"
 *       Webflow rate-limits the Designer multiplayer backend, not the REST
 *       envelope. Measured: ~40 update_style actions in a burst is enough.
 *   "[Conflict] The operation could not be applied to the style block store"
 *       A transient write conflict in the style store. Retrying the same
 *       action alone succeeds.
 *
 * `update_style` MERGES the properties it is given, so re-sending a rule that
 * already holds the right value is a no-op — always send the whole set rather
 * than trusting a count of what a previous run got through.
 *
 *   node push_styles.mjs <batchDir> <pageId> [--chunk 8] [--pace 1200] [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { callTool } from './wfmcp.mjs';

const SITE = '6a60bdc0340e5f1784b4d553'; // Mason Park Dental — the boundary.

const argv = process.argv.slice(2);
const [dir, pageId] = argv;
const flag = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? dflt : Number(argv[i + 1]);
};
if (!dir || !pageId) {
  console.error('usage: push_styles.mjs <batchDir> <pageId> [--chunk N] [--pace MS] [--dry]');
  process.exit(2);
}
const CHUNK = flag('chunk', 8);
const PACE = flag('pace', 1200);
const dry = argv.includes('--dry');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const actions = fs
  .readdirSync(dir)
  .filter((f) => /^\d+\.json$/.test(f))
  .sort((a, b) => parseInt(a) - parseInt(b))
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));

console.log(`${actions.length} actions from ${path.basename(dir)} -> page ${pageId}`);
if (dry) process.exit(0);

/** Send one chunk; return the actions the API refused. */
async function send(chunk, pace) {
  let text;
  try {
    ({ text } = await callTool('data_style_tool', {
      siteId: SITE,
      pageId,
      context: 'Applies generated re-theme property updates to one landing page.',
      actions: chunk,
    }));
  } catch (e) {
    console.log(`   call failed wholesale: ${String(e.message).slice(0, 160)}`);
    return { failed: chunk, rateLimited: /429|Too Many/i.test(String(e.message)) };
  }
  const byLabel = new Map();
  for (const line of text.split('\n')) {
    if (!line.trim().startsWith('{')) continue;
    try {
      const o = JSON.parse(line);
      if (o.label) byLabel.set(o.label, o);
    } catch {
      /* a non-JSON line is not a per-action verdict */
    }
  }
  const failed = [];
  let rateLimited = false;
  for (const a of chunk) {
    const r = byLabel.get(a.label);
    if (!r || r.error) {
      failed.push(a);
      const msg = r?.error?.message ?? 'no verdict returned';
      if (/429|Too Many/i.test(msg)) rateLimited = true;
      if (failed.length <= 3) console.log(`   ! ${a.label}: ${msg.slice(0, 120)}`);
    }
  }
  await sleep(pace);
  return { failed, rateLimited };
}

let queue = actions;
let round = 0;
let pace = PACE;
let chunkSize = CHUNK;

// Three rounds, not eight: past that the loop is spending minutes of backoff on
// actions the API keeps refusing, and `verify_styles.mjs` reads the site back
// anyway — repair from what is actually missing, not from what a call claimed.
while (queue.length && round < 3) {
  round += 1;
  console.log(`round ${round}: ${queue.length} action(s), chunk ${chunkSize}, pace ${pace}ms`);
  const next = [];
  let sawRateLimit = false;
  for (let i = 0; i < queue.length; i += chunkSize) {
    const { failed, rateLimited } = await send(queue.slice(i, i + chunkSize), pace);
    next.push(...failed);
    if (rateLimited) {
      sawRateLimit = true;
      // Back off hard the moment the multiplayer backend pushes back.
      await sleep(15000);
    }
  }
  queue = next;
  if (queue.length) {
    // Retries get smaller and slower — a [Conflict] usually clears when the
    // action is sent alone.
    chunkSize = Math.max(1, Math.floor(chunkSize / 2));
    pace = Math.min(pace * 2, 8000);
    if (sawRateLimit) await sleep(10000);
  }
}

console.log(
  JSON.stringify({
    page: pageId,
    actions: actions.length,
    rounds: round,
    unapplied: queue.length,
    unappliedLabels: queue.map((a) => a.label),
  })
);
process.exitCode = queue.length ? 1 : 0;
