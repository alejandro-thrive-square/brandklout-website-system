#!/usr/bin/env node
/**
 * api.mjs — throttled, retrying wrapper around the direct Webflow MCP driver.
 *
 * The Webflow Data API rate-limits hard (HTTP 429 / "Too Many Requests"). A
 * consolidation run makes hundreds of calls, so every call goes through here:
 * a minimum spacing between requests plus exponential backoff on 429.
 *
 * Env overrides: WF_MIN_GAP_MS (default 1100), WF_MAX_RETRIES (default 6).
 */
import { callTool as raw } from './wfmcp.mjs';

const MIN_GAP = Number(process.env.WF_MIN_GAP_MS ?? 1100);
const MAX_RETRIES = Number(process.env.WF_MAX_RETRIES ?? 6);

let lastAt = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isRateLimited = (s) =>
  /429|too many requests|rate.?limit/i.test(String(s ?? ''));

/** Split a tool result body into its per-action JSON objects. */
export function frames(text) {
  const out = [];
  let depth = 0, start = -1, inStr = false, esc = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === '{') { if (depth === 0) start = i; depth++; }
    else if (c === '}') { depth--; if (depth === 0 && start >= 0) out.push(JSON.parse(text.slice(start, i + 1))); }
  }
  return out;
}

/**
 * Call one MCP tool. Returns the parsed per-action frames.
 * Throws only after MAX_RETRIES consecutive rate-limit responses.
 */
export async function call(tool, args, label = tool) {
  for (let attempt = 0; ; attempt++) {
    const wait = Math.max(0, lastAt + MIN_GAP - Date.now());
    if (wait) await sleep(wait);
    lastAt = Date.now();

    let text, err;
    try {
      ({ text } = await raw(tool, args));
    } catch (e) {
      err = e;
    }

    // A 429 can surface as a thrown HTTP error OR as an in-band action error.
    const inBand = text && isRateLimited(text) ? text : null;
    if (err || inBand) {
      const why = err ? String(err.message) : 'in-band 429';
      if ((err && !isRateLimited(err.message)) || attempt >= MAX_RETRIES) {
        throw new Error(`${label}: ${why.slice(0, 400)}`);
      }
      const backoff = Math.min(60_000, 2000 * 2 ** attempt);
      process.stderr.write(`  [throttle] ${label} rate-limited, retry ${attempt + 1}/${MAX_RETRIES} in ${backoff}ms\n`);
      await sleep(backoff);
      continue;
    }
    return frames(text);
  }
}

/**
 * Recursively collect every Designer element from an arbitrarily shaped
 * response. Shape-agnostic on purpose: the element tree is nested differently
 * per action, and guessing wrong silently yields zero elements.
 */
export function collectElements(node, acc = []) {
  if (!node || typeof node !== 'object') return acc;
  if (Array.isArray(node)) { for (const n of node) collectElements(n, acc); return acc; }
  const id = node.id;
  if (id && typeof id === 'object' && typeof id.element === 'string') {
    acc.push({
      id: { component: id.component, element: id.element },
      type: node.type ?? null,
      styleNames: Array.isArray(node.styleNames) ? node.styleNames : [],
    });
  }
  for (const v of Object.values(node)) {
    if (v && typeof v === 'object') collectElements(v, acc);
  }
  return acc;
}
