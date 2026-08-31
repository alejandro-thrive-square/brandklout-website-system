/**
 * Minimal Instatic admin client for the Mason Park import.
 *
 * Modelled on dr-nahlah/workflows/15-instatic-api-sync/insta-api.mjs, kept
 * separate because that one defaults BASE to encorercm.com and caches its
 * session in that workflow's .tmp - pointing it here would be one env var away
 * from writing to the wrong client's live site.
 *
 * Two things bite:
 *   1. CSRF. Every state-changing request is checked against the container's
 *      PUBLIC_ORIGIN. A foreign Origin is 403 "invalid origin", which reads
 *      like a permissions problem. We always send BASE as the origin.
 *   2. Publishing needs step-up auth, and step-up ROTATES the session cookie.
 *      Miss the new cookie and every later request 401s.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const COOKIE_NAME = "instatic_admin_session";

// Walk up to the repo root for .env rather than assuming a depth.
const findEnv = () => {
  let dir = HERE;
  for (let i = 0; i < 12; i++) {
    const p = path.join(dir, ".env");
    if (fs.existsSync(p)) return p;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
};

const loadEnv = () => {
  const file = findEnv();
  if (!file) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!m) continue;
    const [, k, raw] = m;
    if (process.env[k]) continue;
    process.env[k] = raw.replace(/^["']|["']$/g, "").trim();
  }
};
loadEnv();

export const BASE = (process.env.INSTATIC_BASE_URL || "").replace(/\/+$/, "");
if (!BASE) throw new Error("INSTATIC_BASE_URL is not set - refusing to guess a target site.");

// A misaimed run writes 74 pages into the wrong client's CMS, so this is a hard stop.
//
// 2026-08-31: the pattern used to be `/mason-park/i`, which only ever matched the
// hyphenated Railway host `mason-park.up.railway.app`. That host was DELETED, and
// both real targets — `www.masonparkdental.com` and `staging.masonparkdental.com` —
// spell the name without a hyphen, so this guard refused every live run. Match both.
if (!/(mason-park|masonparkdental)/i.test(BASE)) {
  throw new Error(`INSTATIC_BASE_URL is ${BASE}, which is not a Mason Park instance. Refusing to run.`);
}

// Which instance, said out loud. Instatic's publish is all-or-nothing, so knowing
// production from staging is the difference between a review and an incident.
export const IS_STAGING = /(^|\/\/|\.)staging\./i.test(BASE);

// The session cache is keyed BY HOST. It used to be one bare `.session` file with
// no record of where its cookie came from, so switching between production and
// staging silently reused the other environment's session — which fails as a 401
// on a good credential, or worse, succeeds against the wrong site.
const SESSION_FILE = path.join(HERE, `.session-${BASE.replace(/^https?:\/\//, "").replace(/[^a-z0-9.-]/gi, "_")}`);

const cacheCookie = (v) => fs.writeFileSync(SESSION_FILE, v, "utf8");
const cachedCookie = () => (fs.existsSync(SESSION_FILE) ? fs.readFileSync(SESSION_FILE, "utf8").trim() : null);

const pickCookie = (res) => {
  const all = res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie")].filter(Boolean);
  return all.map((c) => c.split(";")[0]).find((c) => c.startsWith(`${COOKIE_NAME}=`));
};

export async function login() {
  const email = process.env.INSTATIC_EMAIL;
  const password = process.env.INSTATIC_PASSWORD;
  if (!email || !password) throw new Error("INSTATIC_EMAIL / INSTATIC_PASSWORD are not set.");
  const res = await fetch(`${BASE}/admin/api/cms/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`login failed ${res.status}: ${JSON.stringify(body)}`);
  if (body.mfaRequired) throw new Error("this account needs a second factor and cannot drive the import");
  const cookie = pickCookie(res);
  if (!cookie) throw new Error("login returned no session cookie");
  cacheCookie(cookie);
  return cookie;
}

export async function stepUp() {
  const password = process.env.INSTATIC_PASSWORD;
  const res = await fetch(`${BASE}/admin/api/cms/auth/step-up`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE, cookie: cachedCookie() ?? "" },
    body: JSON.stringify({ password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`step-up failed ${res.status}: ${JSON.stringify(body)}`);
  const rotated = pickCookie(res);
  if (!rotated) throw new Error("step-up returned no rotated cookie");
  cacheCookie(rotated); // miss this and everything after 401s
  return rotated;
}

/** JSON request that logs in on 401 and steps up on step_up_required, once each. */
export async function api(method, p, body, { retryAuth = true, retryStepUp = true } = {}) {
  if (!cachedCookie()) await login();
  const res = await fetch(`${BASE}${p}`, {
    method,
    headers: {
      origin: BASE,
      cookie: cachedCookie() ?? "",
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (res.status === 401 && retryAuth) {
    const j = await res.clone().json().catch(() => ({}));
    if (j?.error === "step_up_required" && retryStepUp) {
      await stepUp();
      return api(method, p, body, { retryAuth, retryStepUp: false });
    }
    await login();
    return api(method, p, body, { retryAuth: false, retryStepUp });
  }
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${p} -> ${res.status}: ${JSON.stringify(out).slice(0, 400)}`);
  return out;
}

/** multipart upload; Blob sets its own boundary so we must not set content-type */
export async function uploadFile(p, filename, bytes, mime) {
  if (!cachedCookie()) await login();
  const form = new FormData();
  form.set("file", new Blob([bytes], { type: mime }), filename);
  const send = () => fetch(`${BASE}${p}`, {
    method: "POST",
    headers: { origin: BASE, cookie: cachedCookie() ?? "" },
    body: form,
  });
  let res = await send();
  if (res.status === 401) { await login(); res = await send(); }
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`upload ${filename} -> ${res.status}: ${JSON.stringify(out).slice(0, 300)}`);
  return out;
}

export const whoami = () => api("GET", "/admin/api/cms/me");
export const getSite = () => api("GET", "/admin/api/cms/site");
export const getPages = () => api("GET", "/admin/api/cms/pages");
export const listMedia = () => api("GET", "/admin/api/cms/media");
export const publish = () => api("POST", "/admin/api/cms/publish", {});
export const publishStatus = () => api("GET", "/admin/api/cms/publish/status");
