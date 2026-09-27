/**
 * Dump the full plugin records from the Dr Nahlah instance.
 *
 *   node probe-plugin-detail.mjs
 *
 * These four Webzite plugins are the ones to mirror onto every new site.
 * `webzite.embed-origins` is the one that matters most here: Dr Nahlah's pages
 * publish `frame-src 'self' https: ... reputationhub.site` where Mason Park
 * publishes `frame-src 'none'`, which is what blocks the GoHighLevel form.
 *
 * Read-only.
 */
import fs from "node:fs";

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

const get = async (p) => {
  const r = await fetch(`${NB}${p}`, { headers: { origin: NB, cookie } });
  if (!r.ok) return { __error: `${r.status}` };
  return r.json();
};

const listed = await get("/admin/api/cms/plugins");
const plugins = listed.plugins ?? listed.rows ?? listed;

for (const p of plugins) {
  const id = p.id ?? p.slug;
  console.log(`\n########## ${id} ##########`);
  console.log(JSON.stringify(p, null, 1).slice(0, 3000));
  for (const sub of [`/admin/api/cms/plugins/${encodeURIComponent(id)}`,
    `/admin/api/cms/plugins/${encodeURIComponent(id)}/config`]) {
    const out = await get(sub);
    console.log(`--- GET ${sub}`);
    console.log(JSON.stringify(out, null, 1).slice(0, 1800));
  }
}
