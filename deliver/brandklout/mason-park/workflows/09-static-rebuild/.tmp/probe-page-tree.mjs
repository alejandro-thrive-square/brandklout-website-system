// Read-only: print one page row's node tree compactly.
//   INSTATIC_BASE_URL=https://staging.masonparkdental.com node probe-page-tree.mjs privacy-policy [maxDepth]
import fs from "node:fs";
import { getPages, BASE } from "./insta.mjs";

const slug = process.argv[2] ?? "privacy-policy";
const maxDepth = Number(process.argv[3] ?? 99);
const { rows } = await getPages();
const row = rows.find((r) => (r.cells?.slug ?? r.slug) === slug);
if (!row) throw new Error(`no /${slug} on ${BASE}`);
const { nodes, rootNodeId } = row.cells.body;
if (process.argv.includes("--dump")) fs.writeFileSync(`tree-${slug}.json`, JSON.stringify(row, null, 1));
const out = [];
const walk = (id, d) => {
  const n = nodes[id];
  if (!n) { out.push(`${"  ".repeat(d)}MISSING ${id}`); return; }
  const p = n.props ?? {};
  const bits = [n.moduleId, (n.classIds ?? []).map((c) => "." + c).join("")];
  if (p.tag) bits.push(`<${p.tag}>`);
  if (p.text) bits.push(JSON.stringify(String(p.text).slice(0, 70)));
  if (p.href) bits.push(`href=${p.href}`);
  const extra = Object.keys(p).filter((k) => !["tag", "text", "href"].includes(k));
  if (extra.length) bits.push(`{${extra.join(",")}}`);
  out.push(`${"  ".repeat(d)}${bits.join(" ")}`);
  if (d < maxDepth) for (const c of n.children ?? []) walk(c, d + 1);
};
walk(rootNodeId, 0);
console.log(out.join("\n"));
