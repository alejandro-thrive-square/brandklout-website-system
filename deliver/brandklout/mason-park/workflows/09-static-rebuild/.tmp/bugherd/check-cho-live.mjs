// Served-page check for "Dr. Cho leads": every page of an instance, visible text only.
// A page that names Dr. Sung must name Dr. Cho, the six /ads-landing-pages/ must not name
// Dr. Sung at all, and the provider band must be Dr. Cho's. Plus a sample of articles.
//   node check-cho-live.mjs https://staging.masonparkdental.com > log
import fs from "node:fs";
const base = process.argv[2];
const rows = JSON.parse(fs.readFileSync(new URL("../blog/cms-rows.json", import.meta.url)));
const arts = (rows.rows || rows).map((r) => (r.cells || r).slug);
const pages = fs.readFileSync(new URL("./doctors-inventory-after.log", import.meta.url), "utf8").split("\n")
  .map((l) => l.split(/\s+/)[0]).filter((p) => p.startsWith("/") && !p.startsWith("/blog/"));
const urls = [...pages, ...arts.map((s) => `/blog/${s}`)];
let bad = 0, n = 0;
for (const p of urls) {
  const r = await fetch(base + p.replace(/\/$/, "") || base + "/");
  const h = await r.text();
  const t = h.replace(/<script[^]*?<\/script>/g, "").replace(/<style[^]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");
  const sung = (t.match(/\bSung\b/g) || []).length, cho = (t.match(/\bCho\b/g) || []).length;
  const problems = [];
  if (r.status !== 200) problems.push(`status ${r.status}`);
  if (p.startsWith("/ads-landing-pages/") && sung) problems.push(`ad page names Sung ${sung}x`);
  if (sung && !cho) problems.push(`Sung ${sung}x without Cho`);
  if (/svc-provider"/.test(h) && !/svc-provider[^]*?Dr\. Dave Cho, DMD/.test(h)) problems.push("band is not Dr. Cho's");
  n++;
  if (problems.length) { bad++; console.log(`BAD ${p}: ${problems.join("; ")}`); }
}
console.log(`${n} URLs, ${bad} with problems`);
