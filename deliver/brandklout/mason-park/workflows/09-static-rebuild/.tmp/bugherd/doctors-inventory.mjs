// Where Dr. Sung and Dr. Cho appear on every local page: provider bands, portraits
// (album keys), and text mentions outside tags. node doctors-inventory.mjs > log
import fs from "node:fs";
import path from "node:path";
const HOME = path.join(import.meta.dirname, "..", "..", "home");
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? (e.name === "assets" ? [] : walk(path.join(d, e.name))) : e.name === "index.html" ? [path.join(d, e.name)] : []);
const rows = [];
for (const f of walk(HOME)) {
  const page = "/" + path.relative(HOME, path.dirname(f)).split(path.sep).join("/");
  const h = fs.readFileSync(f, "utf8");
  const body = h.slice(h.indexOf("<main"), h.lastIndexOf("</main>"));
  const text = body.replace(/<script[^]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");
  const sung = (text.match(/\bSung\b/g) || []).length, cho = (text.match(/\bCho\b/g) || []).length;
  const providers = [...body.matchAll(/<div class="svc-provider">[^]*?<h3>([^<]*)<\/h3>/g)].map((m) => m[1]);
  const shots = [...new Set([...body.matchAll(/mp-(dr-[a-z0-9-]+?|team-dr-dave-cho|family-nguyen-sung)-\d+x\d+\.jpg/g)].map((m) => m[1]))];
  const sections = [...new Set([...body.matchAll(/<section[^>]*id="([^"]+)"[^]*?(?=<section|$)/g)].filter((m) => /\bSung\b/.test(m[0].replace(/<[^>]+>/g, " "))).map((m) => m[1]))];
  if (sung || cho || shots.length) rows.push({ page, sung, cho, providers: providers.join(" | "), shots: shots.join(","), sungSections: sections.join(",") });
}
rows.sort((a, b) => a.page.localeCompare(b.page));
for (const r of rows) console.log(`${r.page.padEnd(46)} sung ${String(r.sung).padStart(2)} cho ${String(r.cho).padStart(2)}  prov[${r.providers}] shots[${r.shots}] in[${r.sungSections}]`);
console.log(`${rows.length} pages`);
