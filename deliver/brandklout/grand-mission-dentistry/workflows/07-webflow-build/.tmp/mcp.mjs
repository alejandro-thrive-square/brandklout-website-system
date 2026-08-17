/**
 * mcp.mjs — thin wrapper over wfmcp.callTool that survives this site's rate
 * limits. Several data_* actions do internal reads, so a multi-page run WILL
 * hit `429` (and Cloudflare `1101`); both are transient. Every response is one
 * JSON object PER LINE, one per action, shaped {label, action, result|error}.
 */
import { callTool } from './wfmcp.mjs';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Most responses are one JSON object per line, but a protocol-level failure
   (bad arguments, auth) comes back as a bare "MCP error …" string. Surface it
   as {error} rather than dying in JSON.parse. */
export function lines(text) {
  return text.trim().split(/\r?\n/).filter(Boolean).map((l) => {
    try { return JSON.parse(l); }
    catch { return { error: { name: 'ProtocolError', message: l } }; }
  });
}

/** Call one tool, retrying transient 429/1101 with exponential backoff.
 *  Returns the parsed action objects. THROWS on any other error — a schema
 *  validation failure used to slip through as "success" and a caller then
 *  reported an element removed that was still on the page. */
/* What a transient failure looks like on this endpoint. `429` is the HTTP
   status, `1101` is Cloudflare's worker error — but the rate limiter most often
   surfaces as the bare English string "Too Many Requests" with no code at all,
   which an earlier version of this pattern did not match, so a long run died
   on a retryable error two thirds of the way through. */
const TRANSIENT = /429|1101|rate limit|too many requests|timeout|ECONN|fetch failed/i;

export async function call(tool, args, { tries = 6, base = 4000, strict = true } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    if (i) await sleep(base * 2 ** (i - 1));
    let out;
    try {
      out = await callTool(tool, args);
    } catch (e) {
      lastErr = e;
      if (!TRANSIENT.test(e.message)) throw e;
      continue;
    }
    const parsed = lines(out.text);
    const errs = parsed.filter((p) => p.error);
    const transient = errs.some((p) => TRANSIENT.test(p.error.message || ''));
    if (!transient) {
      if (strict && errs.length) {
        // A multi-line protocol error arrives split across lines; rejoin it.
        throw new Error(errs.map((e) => e.error.message).join('\n').slice(0, 1200));
      }
      return parsed;
    }
    lastErr = new Error(errs[0].error.message);
  }
  throw lastErr;
}

export const SITE = '698111847e9608eb30ee21c6';
export const PAGES = {
  implant: '6a724b6977f9b0019d2a03f8',
  cosmetic: '6a723ad5534774f35f17d119',
  'thank-you': '6a7268a862a728c1cd4df73b',
};
