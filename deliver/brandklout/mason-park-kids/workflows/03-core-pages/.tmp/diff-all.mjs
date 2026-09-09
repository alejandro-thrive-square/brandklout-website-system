// Runs diff-live.mjs for every core page: local file against its live row.
//
//   node diff-all.mjs             every page under home/
//   node diff-all.mjs --only /financing
//
// Prints one block per page and a tally at the end, so "a lot of errors on
// Instatic" becomes a list with a route against each one.
import { execFileSync } from "node:child_process";

const BASE = "https://mason-park-kids.up.railway.app";
// Every page under home/ (2026-09-09, evening: it carried the eleven as a
// list while 57 more pages went live; a gate with a list watches only the list).
import fs from "node:fs";
import path from "node:path";
const HOME = path.resolve("..", "home");
const walkPages = (dir, rel) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() && e.name !== "assets" ? walkPages(path.join(dir, e.name), rel + e.name + "/")
  : e.name === "index.html" ? [[path.join(dir, e.name), "/" + rel.replace(/\/$/, "")]] : []);
const PAGES = walkPages(HOME, "");

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
