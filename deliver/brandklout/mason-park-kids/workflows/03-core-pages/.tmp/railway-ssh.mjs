/**
 * `railway ssh` into THIS site's Instatic container, with the retries the
 * transport needs.
 *
 * The ids are the Mason Park KIDS service - `pediatricdentistkatytx.com`, not
 * the parent practice. Kept in one module so `ship-payload.mjs` and
 * `fetch-nodes.mjs` cannot drift apart and quietly address different
 * containers; that is a mistake nothing downstream would catch, because a
 * payload shipped to one container and converted in another just looks like an
 * empty result.
 *
 *   railway list                       # Brandklout > Mason Park Kids
 *   railway link -p "Mason Park Kids"  # if you need the ids again
 */
import { execFileSync } from "node:child_process";
import { BASE } from "./insta.mjs";

export const PROJECT = "a135c5ec-da62-4643-a775-c6a39317fb1b";
// Two environments since 2026-09-27 (process 21). The container follows INSTATIC_BASE_URL, so a
// payload shipped for staging is converted in staging's container and never in production's.
export const PRODUCTION = "f9cddccd-2fbf-4e54-8898-722250075937";
export const STAGING = "2433658d-4971-46e9-8dfc-e83cd8c96a2c";
export const ENVIRONMENT = /\/\/staging\./.test(BASE) ? STAGING : PRODUCTION;
export const SERVICE = "d1d1ce4a-3b10-4145-a50d-e83a0f0dcce9";

/* Go through bash, not cmd.exe: `railway` on PATH is a .cmd shim and cmd.exe
   mangles the single-quoted payload ("El sistema no puede encontrar la ruta"). */
const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

const once = (cmd) => execFileSync(
  "bash",
  ["-c", `railway ssh -p ${PROJECT} -e ${ENVIRONMENT} -s ${SERVICE} ${shq(cmd)}`],
  // insta.mjs loads the worktree .env, whose shared RAILWAY_TOKEN is dead; the CLI must use its
  // own OAuth login, so the token variables are dropped for this call.
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env: Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^RAILWAY_(API_)?TOKEN$/.test(k))) },
);

/**
 * `railway ssh` intermittently dies with "Failed to fetch: error decoding
 * response body" - a transport hiccup, and the command may well have RUN. So
 * every caller must keep its commands idempotent (write to a numbered file,
 * never append) or a retry duplicates work.
 */
export const ssh = (cmd, tries = 5) => {
  let last;
  for (let i = 1; i <= tries; i++) {
    try { return once(cmd); } catch (e) {
      last = e;
      if (i < tries) sleep(1000 * i);
    }
  }
  throw last;
};
