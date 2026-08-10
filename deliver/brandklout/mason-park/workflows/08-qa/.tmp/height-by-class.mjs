// height-by-class.mjs — which CLASS is taller on staging, and by how much?
//
// height-diff.mjs says which section holds the extra pixels; this says which
// element inside it. Keyed by the design's own class names and compared as a
// sorted multiset, so an off-by-one in sibling order cannot manufacture a
// finding (that trap cost a full pass — see FINDINGS.md).
//
// Reads the .deep.*.json dumps, so run deep-diff.mjs first. Offline and instant.
//
// Usage: node height-by-class.mjs [page] [--section <id>]
// Source Asana task GID: 1217040406855582
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "parity");
const ALL = ["invisalign", "new-patient-special", "thank-you"];
const arg = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const PAGES = arg[0] ? ALL.filter((p) => p === arg[0]) : ALL;
const secIdx = process.argv.indexOf("--section");
const ONLY_SEC = secIdx > -1 ? process.argv[secIdx + 1] : null;

// The converter suffixes a shared class when it would collide across pages.
const fold = (c) => c.replace(/-(ty|nps|inv)$/, "");

for (const page of PAGES) {
  const lf = path.join(OUT, `${page}.deep.local.json`);
  if (!fs.existsSync(lf)) { console.log(`(no dump for ${page} — run deep-diff.mjs)`); continue; }
  const L = JSON.parse(fs.readFileSync(lf, "utf8"));
  const S = JSON.parse(fs.readFileSync(path.join(OUT, `${page}.deep.staging.json`), "utf8"));

  const vocab = new Set();
  for (const e of L) String(e.cls || "").split(/\s+/).filter(Boolean).forEach((c) => vocab.add(fold(c)));

  const index = (arr) => {
    const m = new Map();
    for (const e of arr) {
      if (ONLY_SEC && e.sec !== ONLY_SEC) continue;
      for (const c of new Set(String(e.cls || "").split(/\s+/).map(fold).filter((x) => vocab.has(x)))) {
        if (!m.has(c)) m.set(c, []);
        m.get(c).push(e);
      }
    }
    return m;
  };
  const li = index(L), si = index(S);

  const rows = [];
  for (const [c, les] of li) {
    const ses = si.get(c);
    if (!ses || ses.length !== les.length) continue;   // count drift is a different question
    const a = les.map((e) => e.h).sort((x, y) => x - y);
    const b = ses.map((e) => e.h).sort((x, y) => x - y);
    let d = 0;
    for (let i = 0; i < a.length; i++) d += b[i] - a[i];
    if (Math.abs(d) > 8) rows.push({ c, d, n: les.length, sec: les[0].sec || "-", a, b });
  }
  rows.sort((x, y) => Math.abs(y.d) - Math.abs(x.d));

  console.log("\n" + "=".repeat(78));
  console.log(`HEIGHT BY CLASS  ${page}${ONLY_SEC ? "  #" + ONLY_SEC : ""}`);
  console.log("=".repeat(78));
  if (!rows.length) { console.log("  every design class has the same height on both sides."); continue; }
  console.log("  class".padEnd(26) + "section".padEnd(14) + "n".padEnd(4) + "delta".padStart(7) + "   design -> staging");
  for (const r of rows.slice(0, 24)) {
    console.log("  " + r.c.padEnd(24) + String(r.sec).padEnd(14) + String(r.n).padEnd(4) +
      String(r.d).padStart(7) + "   [" + r.a.join(",").slice(0, 26) + "] -> [" + r.b.join(",").slice(0, 26) + "]");
  }
}
