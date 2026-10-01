// Read-only: every row's footer legal row on one instance, grouped by shape.
//   INSTATIC_BASE_URL=https://staging.masonparkdental.com node .tmp/hipaa/probe-footer-legal.mjs [--show]
import { api, getPages, getSite, publishStatus, BASE } from "../insta.mjs";

console.log(BASE, JSON.stringify(await publishStatus()));
const site = await getSite();
console.log("shell keys with components?", Object.keys(site.site).filter((k) => /comp|layout/i.test(k)).join(",") || "none");
try { const c = await api("GET", "/admin/api/cms/components"); console.log("components", JSON.stringify(c).slice(0, 300)); } catch (e) { console.log("components endpoint:", e.message.slice(0, 120)); }
const { rows } = await getPages();
const shapes = new Map();
for (const r of rows) {
  const N = r.cells.body.nodes;
  const legal = Object.values(N).filter((n) => (n.classIds ?? []).includes("footer_legal"));
  const refs = Object.values(N).filter((n) => /component|ref/i.test(n.moduleId));
  const sig = legal.map((l) => l.children.map((c) => { const n = N[c]; return n.moduleId === "base.link" ? `[${n.props.text}→${n.props.href}]` : JSON.stringify(n.props.text ?? n.moduleId); }).join(" ")).join(" || ") || "(no .footer_legal)";
  const key = sig + (refs.length ? `  +${refs.length} component refs` : "");
  if (!shapes.has(key)) shapes.set(key, []);
  shapes.get(key).push(r.cells.slug ?? r.slug);
}
for (const [k, v] of shapes) console.log(`\n${v.length} rows: ${k}\n   ${v.slice(0, 12).join(", ")}${v.length > 12 ? " …" : ""}`);
if (process.argv.includes("--show")) {
  const r = rows.find((x) => (x.cells.slug ?? x.slug) === "privacy-policy");
  const N = r.cells.body.nodes;
  const l = Object.values(N).find((n) => (n.classIds ?? []).includes("footer_legal"));
  console.log(JSON.stringify(l));
  for (const c of l.children) console.log(JSON.stringify(N[c]));
}
