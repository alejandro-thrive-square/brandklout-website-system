/**
 * READ-ONLY comparison probe against the Dr Nahlah Instatic instance.
 *
 * Mason Park's published pages carry `script-src 'none'; frame-src 'none'`,
 * which would kill the GHL lead form and the call-tracking number pool on the
 * six landing pages. Dr Nahlah's instance publishes a permissive policy from
 * the same Instatic image, so the difference is configuration. This reads that
 * instance's site document to find out which knob it is.
 *
 * Deliberately does NOT import insta.mjs: that client hard-refuses any base URL
 * that is not Mason Park, which is the guard that keeps writes off the wrong
 * client's site. This file issues GETs only and never writes.
 *
 *   node probe-nahlah.mjs
 */
import fs from "node:fs";

const ENV = "C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-dr-nahlah/.env";
const env = {};
for (const line of fs.readFileSync(ENV, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
}
const BASE = (env.INSTATIC_BASE_URL || "").replace(/\/+$/, "");
if (!BASE) throw new Error("no INSTATIC_BASE_URL in the dr-nahlah worktree");
console.log(`base: ${BASE}`);

const res = await fetch(`${BASE}/admin/api/cms/login`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: BASE },
  body: JSON.stringify({ email: env.INSTATIC_EMAIL, password: env.INSTATIC_PASSWORD }),
});
if (!res.ok) throw new Error(`login ${res.status}: ${(await res.text()).slice(0, 200)}`);
const cookie = (res.headers.getSetCookie?.() ?? [])
  .map((c) => c.split(";")[0]).find((c) => c.startsWith("instatic_admin_session="));
if (!cookie) throw new Error("no session cookie");

const get = async (p) => {
  const r = await fetch(`${BASE}${p}`, { headers: { origin: BASE, cookie } });
  if (!r.ok) throw new Error(`GET ${p} -> ${r.status}`);
  return r.json();
};

const { site } = await get("/admin/api/cms/site");

// settings carries the whole design-token framework on this site, which is
// megabytes of noise for this question - list its keys and skip the payload.
console.log(`\n=== nahlah site.settings keys ===`);
console.log(Object.keys(site.settings ?? {}).join(", "));
for (const [k, v] of Object.entries(site.settings ?? {})) {
  if (k === "framework") continue;
  console.log(`  ${k}: ${JSON.stringify(v).slice(0, 400)}`);
}

for (const key of ["runtime", "packageJson"]) {
  console.log(`\n=== nahlah site.${key} ===`);
  console.log(JSON.stringify(site[key], null, 2).slice(0, 2500));
}
console.log(`\n=== nahlah site.files (${(site.files ?? []).length}) ===`);
for (const f of site.files ?? []) {
  console.log(`${(f.path ?? f.name ?? "?").padEnd(46)} ${f.kind ?? f.type ?? ""} ${String(f.content ?? "").length}b`);
}
