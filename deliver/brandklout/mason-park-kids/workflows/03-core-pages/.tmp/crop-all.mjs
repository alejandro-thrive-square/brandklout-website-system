// Runs crop-probe.mjs over every core page at two widths and prints one table.
//   node crop-all.mjs              the eleven local pages
//   node crop-all.mjs --live       the eleven live routes
import { execFileSync } from "node:child_process";

const LOCAL = [
  "../home/index.html",
  "../home/about-us/index.html",
  "../home/our-doctors/index.html",
  "../home/our-team/index.html",
  "../home/our-services/index.html",
  "../home/services/comprehensive-pediatric-dentistry/index.html",
  "../home/new-patients/index.html",
  "../home/financing/index.html",
  "../home/dental-saving-plan/index.html",
  "../home/patient-reviews/index.html",
  "../home/thank-you/index.html",
];
const BASE = "https://mason-park-kids.up.railway.app";
const LIVE = [
  "/", "/about-us", "/our-doctors", "/our-team", "/our-services",
  "/services/comprehensive-pediatric-dentistry", "/new-patients", "/financing",
  "/dental-saving-plan", "/patient-reviews", "/thank-you",
].map((p) => BASE + p);

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
