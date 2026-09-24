// Crop the photographs of BugHerd round six (2026-09-24) into the four-width
// set and register them in album-manifest.json, by running frame.mjs once per
// plan entry in plan-2026-09-24/*.json (a copy of frames-2026-09-23.mjs with
// the plan folder moved). Resumable: a key already in the manifest is skipped,
// so a re-cut needs a NEW key (the upload skips by basename).
//
//   node frames-2026-09-24.mjs > frames-2026-09-24.log 2>&1
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const HERE = import.meta.dirname;
const TMP = path.join(HERE, "..");
const DIR = path.join(HERE, "plan-2026-09-24");
const manifestPath = path.join(TMP, "album-manifest.json");
const plans = fs.readdirSync(DIR).filter((f) => /^[A-Z]-.*\.json$/.test(f) && !f.includes("targets"))
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")).map((p) => ({ ...p, group: f })));

let made = 0, skipped = 0, failed = 0;
for (const p of plans) {
  if (!["replace", "add-media"].includes(p.action) || !p.key || !p.src) continue;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest[p.key]) { skipped++; continue; }
  const src = path.isAbsolute(p.src) ? p.src : path.join(HERE, p.src);
  const args = [path.join(TMP, "frame.mjs"), src, p.key, "--alt", p.alt, "--source", p.source];
  if (p.box) args.push("--box", p.box);
  if (p.widths) args.push("--widths", p.widths);
  if (p.upscale) args.push("--upscale");
  let r;
  for (let i = 0; i < 3; i++) {                     // Chrome screenshot timeouts under load are transient
    r = spawnSync(process.execPath, args, { cwd: TMP, encoding: "utf8" });
    if (r.status === 0) break;
  }
  if (r.status === 0) { made++; console.log(`ok   ${p.n ?? "fill"} ${p.key}`); }
  else { failed++; console.log(`FAIL ${p.n ?? "fill"} ${p.key}\n${(r.stderr || r.stdout).slice(-600)}`); }
}
console.log(`made ${made}, already there ${skipped}, failed ${failed}`);
process.exit(failed ? 1 : 0);
