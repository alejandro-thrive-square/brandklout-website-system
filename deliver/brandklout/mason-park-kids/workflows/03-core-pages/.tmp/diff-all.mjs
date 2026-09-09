// Runs diff-live.mjs for every core page: local file against its live row.
//
//   node diff-all.mjs             all eleven
//   node diff-all.mjs --only /financing
//
// Prints one block per page and a tally at the end, so "a lot of errors on
// Instatic" becomes a list with a route against each one.
import { execFileSync } from "node:child_process";

const BASE = "https://mason-park-kids.up.railway.app";
const PAGES = [
  ["../home/index.html", "/"],
  ["../home/about-us/index.html", "/about-us"],
  ["../home/our-doctors/index.html", "/our-doctors"],
  ["../home/our-team/index.html", "/our-team"],
  ["../home/our-services/index.html", "/our-services"],
  ["../home/services/comprehensive-pediatric-dentistry/index.html", "/services/comprehensive-pediatric-dentistry"],
  ["../home/new-patients/index.html", "/new-patients"],
  ["../home/financing/index.html", "/financing"],
  ["../home/dental-saving-plan/index.html", "/dental-saving-plan"],
  ["../home/patient-reviews/index.html", "/patient-reviews"],
  ["../home/thank-you/index.html", "/thank-you"],
];

const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const rows = [];
for (const [local, route] of PAGES) {
  if (only && route !== only) continue;
  let out = "", failed = false;
  try {
    out = execFileSync("node", ["diff-live.mjs", local, BASE + route], { encoding: "utf8", maxBuffer: 32e6 });
  } catch (e) {
    out = (e.stdout || "") + (e.stderr || "");
    failed = true;
  }
  console.log(`\n${"=".repeat(78)}\n${route}\n${"=".repeat(78)}`);
  console.log(out.trim());
  rows.push([route, failed]);
}
console.log(`\n\nSUMMARY`);
for (const [route, failed] of rows) console.log(`  ${failed ? "DIFFERS" : "match  "}  ${route}`);
process.exitCode = rows.some((r) => r[1]) ? 1 : 0;
