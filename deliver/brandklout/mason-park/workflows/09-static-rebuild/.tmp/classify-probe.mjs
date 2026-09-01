import fs from "node:fs";
import { splitLongform, routeSections } from "./site/longform.mjs";
const files = fs.readdirSync("./content").filter((f) => f.startsWith("services-"));
const tally = {}, pagesWith = {};
let total = 0;
for (const f of files) {
  const d = JSON.parse(fs.readFileSync("./content/" + f, "utf8"));
  const { sections } = splitLongform((d.html || "").replace(/<(\/?)h1(\s|>)/gi, "<$1h2$2"));
  const r = routeSections(sections);
  for (const [k, v] of Object.entries(r)) {
    if (!v.length) continue;
    tally[k] = (tally[k] || 0) + v.length; total += v.length;
    pagesWith[k] = (pagesWith[k] || 0) + 1;
  }
}
console.log(total, "sections across", files.length, "pages");
for (const k of Object.keys(tally).sort((a, b) => tally[b] - tally[a])) {
  console.log("  " + k.padEnd(10), String(tally[k]).padStart(4), "|", String(pagesWith[k]).padStart(2), "of 35 pages");
}
const d = JSON.parse(fs.readFileSync("./content/services-invisalign.json", "utf8"));
const r = routeSections(splitLongform((d.html || "").replace(/<(\/?)h1(\s|>)/gi, "<$1h2$2")).sections);
console.log("\ninvisalign routing:");
for (const [k, v] of Object.entries(r)) if (v.length) console.log("  " + k + ": " + v.map((s) => s.title.slice(0, 40)).join(" | "));
