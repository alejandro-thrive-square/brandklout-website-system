/**
 * Minimal Instatic admin client for the Mason Park KIDS import.
 *
 * Ported from the parent practice's `09-static-rebuild/.tmp/insta.mjs` rather
 * than importing the shared `deliver/process/18-instatic-embeds/lib/insta-api.mjs`,
 * for one reason: the shared lib caches its session cookie in ONE file for
 * every site, so a run against this instance right after a run against the
 * parent's silently reuses the other site's session. This one keys the cache
 * by host and refuses any host that is not the pediatric instance.
 *
 * Two things bite:
 *   1. CSRF. Every state-changing request is checked against the container's
 *      PUBLIC_ORIGIN. A foreign Origin is 403 "invalid origin". BASE is always
 *      sent as the origin.
 *   2. Publishing needs step-up auth, and step-up ROTATES the session cookie.
 *      Miss the new cookie and every later request 401s.
 *
 * Credentials come from the worktree's .env (walked up from here):
 *   INSTATIC_BASE_URL   https://mason-park-kids.up.railway.app
 *   INSTATIC_EMAIL / INSTATIC_PASSWORD
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const COOKIE_NAME = "instatic_admin_session";

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

// A misaimed run writes eleven pages into the wrong client's CMS. The parent
// practice's hosts spell the name without "kids"; this guard wants the
// pediatric instance and nothing else.
if (!/(mason-park-kids|pediatricdentistkatytx|masonparkpediatricdental)/i.test(BASE)) {
  throw new Error(`INSTATIC_BASE_URL is ${BASE}, which is not the Mason Park Kids instance. Refusing to run.`);
}
// Since 2026-09-27 staging is its own instance and the default target. Production is reached
// only on purpose: PROMOTE=production INSTATIC_BASE_URL=https://mason-park-kids.up.railway.app
if (!/\/\/staging\./.test(BASE) && process.env.PROMOTE !== "production") {
  throw new Error(`INSTATIC_BASE_URL is production (${BASE}). Work on staging; to promote, set PROMOTE=production.`);
}

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
  cacheCookie(rotated);
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
  const text = await res.text();
  let out;
  try { out = text ? JSON.parse(text) : {}; } catch { throw new Error(`${method} ${p} -> ${res.status}, non-JSON body: ${text.slice(0, 200)}`); }
  if (!res.ok) throw new Error(`${method} ${p} -> ${res.status}: ${JSON.stringify(out).slice(0, 400)}`);
  return out;
}

/** multipart upload; FormData sets its own boundary so content-type is not set */
export async function uploadFile(p, filename, bytes, mime) {
  if (!cachedCookie()) await login();
  const form = new FormData();
  form.set("file", new Blob([bytes], { type: mime }), filename);
  const send = () => fetch(`${BASE}${p}`, { method: "POST", headers: { origin: BASE, cookie: cachedCookie() ?? "" }, body: form });
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
export const publishStatus = () => api("GET", "/admin/api/cms/publish/status");
// Staging is behind Cloudflare, which cuts a response off at 100 s with a 502/524 while the
// server finishes the publish (2026-09-27). On that, wait for the status to show a newer
// publish that matches the draft, instead of failing a chain that actually worked.
export const publish = async () => {
  const before = (await publishStatus()).lastPublishedAt ?? "";
  try { return await api("POST", "/admin/api/cms/publish", {}); }
  catch (e) {
    if (!/-> (502|503|504|520|522|524)\b/.test(e.message)) throw e;
    console.log(`  publish response cut off (${e.message.match(/-> (\d+)/)[1]}); waiting for the server to finish`);
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 10000));
      const s = await publishStatus().catch(() => null);
      if (s && (s.lastPublishedAt ?? "") > before && s.draftMatchesPublished) return { publishedPages: s.publishedPages, via: "status" };
    }
    throw e;
  }
};
export async function saveShell(shell, shellBaseSeq) {
  return api("PUT", "/admin/api/cms/site-document", {
    mode: "incremental", site: shell, changedPages: [], deletedPageIds: [],
    changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: {}, shellBaseSeq,
  });
}
