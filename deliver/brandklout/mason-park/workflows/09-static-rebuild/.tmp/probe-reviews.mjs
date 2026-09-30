// Read-only: where the reviews sit on the live rows, and whether embed-origins is there.
//   INSTATIC_BASE_URL=https://staging.masonparkdental.com node probe-reviews.mjs
import { api, getSite, getPages, publishStatus, BASE, IS_STAGING } from "./insta.mjs";

const MODULE = "brandklout.embed-origins.embed";
console.log(`${BASE}  (${IS_STAGING ? "staging" : "PRODUCTION"})`);
let settings = null;
try {
  const r = await api("GET", "/admin/api/cms/plugins/brandklout.embed-origins/settings");
  settings = r.settings ?? r;
  console.log("embed-origins settings keys:", Object.keys(settings).join(", "));
  console.log("  embedPolicy:", settings.embedPolicy, " autoTrust:", settings.autoTrust);
  console.log("  scriptOrigins:", settings.scriptOrigins, " connectOrigins:", settings.connectOrigins, " frameOrigins:", settings.frameOrigins);
} catch (e) { console.log("embed-origins: NOT READABLE ->", e.message.slice(0, 200)); }
const plugins = await api("GET", "/admin/api/cms/plugins").catch((e) => ({ error: e.message.slice(0, 200) }));
const list = plugins.plugins ?? plugins.rows ?? plugins;
console.log("plugins:", Array.isArray(list) ? list.map((p) => `${p.id ?? p.pluginId ?? p.name}@${p.version ?? "?"}${p.enabled === false ? "(off)" : ""}`).join(", ") : JSON.stringify(list).slice(0, 300));

const site = await getSite();
const shell = site.site;
const rules = shell.styleRules ?? {};
console.log(`shell seq ${site.seq}; styleRules ${Object.keys(rules).length}; rv-embed rule: ${rules["rv-embed"] ? "yes" : "no"}`);
const assets = shell.codeAssets ?? shell.assets ?? {};
console.log("code assets:", Object.values(assets).map((a) => `${a.name ?? a.path ?? a.id} (${(a.content ?? a.source ?? "").length})`).join(", ").slice(0, 400));

const { rows } = await getPages();
console.log(`pages ${rows.length}; publish ${JSON.stringify(await publishStatus()).slice(0, 120)}`);
for (const slug of ["index", "patient-reviews"]) {
  const row = rows.find((r) => r.slug === slug);
  if (!row) { console.log(`/${slug}: NO ROW`); continue; }
  const nodes = row.cells.body.nodes;
  console.log(`\n/${slug}  id ${row.id} seq ${row.seq} status ${row.status ?? row.cells.status ?? "?"} nodes ${Object.keys(nodes).length}`);
  const has = (n, c) => (n.classIds ?? []).includes(c);
  for (const c of ["el-deck", "el-deck_foot", "el-deck_score", "el-deck_score-label", "cp-wall", "pr-rail", "pr-lead", "rv-embed"]) {
    for (const n of Object.values(nodes).filter((x) => has(x, c))) {
      const parent = nodes[n.parentId];
      console.log(`  .${c.padEnd(20)} ${n.id}  module ${n.moduleId}  parent ${n.parentId} [${(parent?.classIds ?? []).join(" ")}] idx ${parent?.children?.indexOf(n.id)}/${parent?.children?.length}  kids ${n.children?.length ?? 0}`);
    }
  }
  const sections = Object.values(nodes).filter((n) => n.props?.htmlAttributes?.id && ["proof", "wall"].includes(n.props.htmlAttributes.id));
  for (const s of sections) console.log(`  #${s.props.htmlAttributes.id} ${s.id} [${(s.classIds ?? []).join(" ")}] children ${s.children.map((c) => `${nodes[c]?.moduleId}[${(nodes[c]?.classIds ?? []).join(" ")}]`).join(" | ")}`);
  const embeds = Object.values(nodes).filter((n) => n.moduleId === MODULE);
  console.log(`  embeds ${embeds.length}: ${embeds.map((e) => `${e.id} "${e.props?.title}" ${/elfsight/.test(e.props?.snippet ?? "") ? "ELFSIGHT" : ""}`).join(", ")}`);
  const txt = Object.values(nodes).filter((n) => JSON.stringify(n.props ?? {}).includes("1,037"));
  console.log(`  nodes saying 1,037: ${txt.length}: ${txt.map((n) => `${n.moduleId}[${(n.classIds ?? []).join(" ")}] ${JSON.stringify(n.props).slice(0, 120)}`).join("\n     ")}`);
}
