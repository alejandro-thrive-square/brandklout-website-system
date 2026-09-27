// Runs crop-probe.mjs over every core page at two widths and prints one table.
//   node crop-all.mjs              the eleven local pages
//   node crop-all.mjs --live       the eleven live routes
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 2026-09-09: this used to carry the eleven core pages as a hard-coded list.
// The other forty-six were then redesigned and none of them was ever swept,
// which is the shape of bug this gate exists to catch. It now walks home/, so
// a page added to the site is swept without anybody remembering to add it.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, "..", "home");
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);

const routes = walk(SITE)
  .filter((f) => f.endsWith("index.html"))
  .map((f) => path.relative(SITE, path.dirname(f)).split(path.sep).filter(Boolean).join("/"))
  .sort((a, b) => a.length - b.length || a.localeCompare(b));

const LOCAL = routes.map((r) => (r ? `../home/${r}/index.html` : "../home/index.html"));
const BASE = "https://mason-park-kids.up.railway.app";
const LIVE = routes.map((r) => `${BASE}/${r}`);

const live = process.argv.includes("--live");
const targets = live ? LIVE : LOCAL;
const widths = [1440, 390];

let total = 0;
for (const t of targets) {
  for (const w of widths) {
    let out = "";
    try {
      out = execFileSync("node", ["crop-probe.mjs", t, "--width", String(w)], { encoding: "utf8" });
    } catch (e) {
      out = (e.stdout || "") + (e.stderr || "");
    }
    const hits = (out.match(/CROP/g) || []).length;
    total += hits;
    const name = out.split("\n").find((l) => l.trim())?.split(/\s+/)[0] || t;
    console.log(`${String(name).padEnd(34)} @${String(w).padEnd(5)} ${hits ? `${hits} cropped heading(s)` : "clean"}`);
    if (hits) {
      for (const l of out.split("\n")) if (/CROP|clipped by|"/.test(l)) console.log("   " + l.trim());
    }
  }
}
console.log(`\n${total} cropped heading(s) across ${targets.length} page(s) x ${widths.length} width(s)`);
process.exitCode = total ? 1 : 0;
