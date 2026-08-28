/**
 * Compare installed plugins between the Dr Nahlah instance and Mason Park.
 *
 *   node probe-plugins.mjs
 *
 * Dr Nahlah publishes a permissive CSP (`script-src 'self' https: 'unsafe-inline'
 * 'unsafe-eval'; frame-src 'self' https: ... reputationhub.site`) from the same
 * Instatic image that gives Mason Park `script-src 'none'; frame-src 'none'`.
 * cspPlan.ts says the injection pipeline relaxes the base policy for plugin
 * `frontend.assets[]`, so the difference should be visible here.
 *
 * Read-only.
 */
import fs from "node:fs";
import { api as mpApi } from "../../09-static-rebuild/.tmp/insta.mjs";

const ENV = "C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-dr-nahlah/.env";
const env = {};
for (const line of fs.readFileSync(ENV, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
}
const NB = (env.INSTATIC_BASE_URL || "").replace(/\/+$/, "");

const res = await fetch(`${NB}/admin/api/cms/login`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: NB },
  body: JSON.stringify({ email: env.INSTATIC_EMAIL, password: env.INSTATIC_PASSWORD }),
});
const cookie = (res.headers.getSetCookie?.() ?? [])
  .map((c) => c.split(";")[0]).find((c) => c.startsWith("instatic_admin_session="));

const nahlah = async (p) => {
  const r = await fetch(`${NB}${p}`, { headers: { origin: NB, cookie } });
  if (!r.ok) throw new Error(`GET ${p} -> ${r.status}`);
  return r.json();
};

const show = (label, out) => {
  console.log(`\n=== ${label} ===`);
  const list = out.plugins ?? out.rows ?? out.items ?? out;
  if (!Array.isArray(list)) { console.log(JSON.stringify(out).slice(0, 900)); return; }
  console.log(`${list.length} plugins`);
  for (const p of list) {
    console.log(`  ${(p.id ?? p.slug ?? "?").padEnd(30)} v${p.version ?? "?"}  `
      + `${p.enabled ?? p.status ?? ""}  ${(p.name ?? "").slice(0, 40)}`);
  }
};

for (const path of ["/admin/api/cms/plugins", "/admin/api/cms/plugins/installed"]) {
  try { show(`NAHLAH ${path}`, await nahlah(path)); }
  catch (e) { console.log(`\nNAHLAH ${path} -> ${e.message}`); }
  try { show(`MASON PARK ${path}`, await mpApi("GET", path)); }
  catch (e) { console.log(`MASON PARK ${path} -> ${String(e.message).slice(0, 120)}`); }
}
