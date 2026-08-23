// class-parity.mjs — the nth-proof half of the parity verdict.
//
// deep-diff.mjs pairs elements positionally, which is what you want for
// "is THIS element right". But one extra or missing wrapper inside a section
// shifts every following sibling's nth, and two adjacent divs then pair
// crosswise — the report shows `design=block staging=flex` for a pair that is
// actually `rating` matched against `arr-cue`, both of them correct.
//
// This reads the same fingerprints and asks a question that cannot drift:
// for each of the DESIGN's own class names, is the multiset of rendered values
// across every element carrying it the same on both sides? Order-free, so a
// shifted nth cannot produce a finding, and a real change cannot hide behind
// one either.
//
// Run deep-diff.mjs first — this consumes its .deep.*.json dumps.
// Usage: node class-parity.mjs [page]
// Source Asana task GID: 1217040406855582
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "parity");
const ALL = ["invisalign", "new-patient-special", "thank-you"];
const PAGES = process.argv[2] ? ALL.filter((p) => p === process.argv[2]) : ALL;

// Same properties deep-diff compares, minus the ones that are pure layout
// consequence (w/h) rather than authored style.
const PROPS = ["disp", "color", "bg", "bc", "bw", "ff", "fs", "fw", "lh", "tt", "ls", "ta", "rad", "fill", "stroke"];
// Bare tags worth checking on their own: the design styles them through its
// reset, and Webflow's base stylesheet competes for exactly these.
const TAGS = ["sup", "sub", "blockquote", "figcaption", "label", "figure", "cite", "small"];

const rgb = (s) => {
  const m = String(s).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(",").map(Number);
  return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
};
const sameColour = (x, y) => {
  const xs = String(x).split("/"), ys = String(y).split("/");
  if (xs.length !== ys.length) return false;
  return xs.every((v, i) => {
    if (v === ys[i]) return true;
    const a = rgb(v), b = rgb(ys[i]);
    if (!a || !b) return false;
    return Math.abs(a.r - b.r) <= 6 && Math.abs(a.g - b.g) <= 6 &&
           Math.abs(a.b - b.b) <= 6 && Math.abs(a.a - b.a) <= 0.03;
  });
};
const near = (prop, a, b) => {
  if (String(a) === String(b)) return true;
  if (["color", "bg", "bc", "fill", "stroke"].includes(prop)) return sameColour(a, b);
  if (["fs", "lh", "ls", "rad", "bw"].includes(prop)) {
    const pa = String(a).split("/"), pb = String(b).split("/");
    if (pa.length !== pb.length) return false;
    return pa.every((v, i) => {
      const x = parseFloat(v), y = parseFloat(pb[i]);
      return Number.isFinite(x) && Number.isFinite(y) ? Math.abs(x - y) <= 0.6 : v === pb[i];
    });
  }
  return false;
};

// Sort key that orders colours and lengths by magnitude rather than by their
// text, so near-identical values land next to each other.
const sortKey = (v) => String(v).split("/").map((part) => {
  const c = rgb(part);
  if (c) return [c.r, c.g, c.b, c.a].map((n) => String(Math.round(n * 1000)).padStart(7, "0")).join(",");
  const n = parseFloat(part);
  return Number.isFinite(n) ? "N" + String(Math.round(n * 1000)).padStart(9, "0") : "S" + part;
}).join("|");
const cmp = (x, y) => (sortKey(x) < sortKey(y) ? -1 : sortKey(x) > sortKey(y) ? 1 : 0);

// The converter suffixes a shared class name when it would collide across
// pages: `name` becomes `name-ty`, `chips` becomes `chips-nps`. The element is
// the same element and it renders the same; only the record's name moved. Fold
// those back so a rename does not read as a missing class.
const PAGE_SUFFIX = /-(ty|nps|inv)$/;
const fold = (c) => c.replace(PAGE_SUFFIX, "");

let grandTotal = 0;
for (const page of PAGES) {
  const L = JSON.parse(fs.readFileSync(path.join(OUT, `${page}.deep.local.json`), "utf8"));
  const S = JSON.parse(fs.readFileSync(path.join(OUT, `${page}.deep.staging.json`), "utf8"));

  // The design's own vocabulary. Staging elements carry these PLUS generated
  // page-prefixed names, so intersecting against this is what lines them up.
  const vocab = new Set();
  for (const e of L) String(e.cls || "").split(/\s+/).filter(Boolean).forEach((c) => vocab.add(fold(c)));

  const index = (arr) => {
    const m = new Map();
    for (const e of arr) {
      const keys = [...new Set(String(e.cls || "").split(/\s+/).map(fold).filter((c) => vocab.has(c)))];
      if (TAGS.includes(e.tag)) keys.push("<" + e.tag + ">");
      for (const k of keys) {
        if (!m.has(k)) m.set(k, []);
        m.get(k).push(e);
      }
    }
    return m;
  };
  const li = index(L), si = index(S);

  console.log("\n" + "=".repeat(74));
  console.log(`CLASS PARITY  ${page}   (${vocab.size} design class names)`);
  console.log("=".repeat(74));

  const findings = [];
  for (const [key, les] of [...li].sort()) {
    const ses = si.get(key);
    if (!ses) { findings.push(`  MISSING on staging: ${key} (${les.length} element(s) in the design)`); continue; }
    if (les.length !== ses.length) {
      findings.push(`  COUNT ${key}: design ${les.length} / staging ${ses.length}`);
    }
    for (const prop of PROPS) {
      // Order-free: sort both sides' values and compare position by position.
      // Colours must sort NUMERICALLY. Sorting them as strings puts
      // "rgba(2, 181, 216, .54)" and "rgba(4, 181, 217, .537)" — the same colour
      // to two decimal places apart — at opposite ends of the list, and the
      // comparison then lines each up against an unrelated value and reports a
      // near-white against a cyan.
      const a = les.map((e) => String(e[prop])).sort(cmp);
      const b = ses.map((e) => String(e[prop])).sort(cmp);
      if (a.length !== b.length) continue;         // count already reported
      const bad = [];
      for (let i = 0; i < a.length; i++) if (!near(prop, a[i], b[i])) bad.push(`${a[i]} -> ${b[i]}`);
      if (bad.length) {
        const uniq = [...new Set(bad)];
        findings.push(`  ${key} ${prop}: ${uniq.slice(0, 3).join(" | ")}${uniq.length > 3 ? ` (+${uniq.length - 3})` : ""}`);
      }
    }
  }
  grandTotal += findings.length;
  if (!findings.length) console.log("  every design class renders identically on both sides.");
  else findings.forEach((f) => console.log(f));
}

console.log("\n" + "=".repeat(74));
console.log(grandTotal === 0
  ? "CLASS PARITY: clean on every page."
  : `CLASS PARITY: ${grandTotal} class-level differences.`);
