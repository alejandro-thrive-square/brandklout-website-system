/**
 * bake_display_ladder.mjs — restore the type ladders the cascade resolver
 * cannot see (Mason Park design package).
 *
 * The design steps type by overriding :root tokens inside media queries, and
 * `var()` is resolved ONCE, at the base — so the payload ships every heading
 * at its desktop size from 1439 down, and the sub-479 reading tier vanishes
 * entirely (the documented failure of the first headless build).
 *
 * Deterministic post-pass on final.json, part of the build pipeline:
 *
 *   1. DISPLAY LADDER (tokens --t-h1/--t-h2/--t-statement/--t-price):
 *      991/767 rungs become REAL medium/small breakpoint variants on every
 *      style whose base font-size equals the token's base value. The 1439
 *      rung cannot be a variant (Webflow has no max-width breakpoint between
 *      991 and the desktop base) — it is emitted into head-tier.json for the
 *      site head block.
 *   2. READING TIER (<=478): emitted into head-tier.json (selector lists with
 *      combo chains resolved), boundary 478 NOT 479 — at 479 the root has not
 *      started moving and the tier would step across a flat-root seam.
 *   3. Strips the converter's re-hang of the design's <=478 `.btn--lg` rule
 *      onto the tiny (<=479) breakpoint — that re-hang IS the 479/480 seam
 *      bug; the rule rides in the head tier at 478 instead.
 *
 * Value-keyed matching is the documented trap (a scale change silently
 * matches nothing), so every bucket asserts it matched at least its floor.
 *
 * Usage: node bake_display_ladder.mjs .tmp/pc/<page>/final.json [...]
 */
import fs from "node:fs";

// token: [base, at1439, at991, at767]  (null = no step at that rung)
const DISPLAY = {
  h1: ["3.25rem", "2.86rem", "2.51rem", "2.17rem"],
  h2: ["2.375rem", "2.16rem", "1.94rem", "1.77rem"],
  statement: ["2.95rem", "2.56rem", "2.21rem", "1.78rem"],
  price: ["4.75rem", null, "4.15rem", "3.45rem"],
};
// token: [base, tierValue at <=478]
const READING = {
  eyebrow: ["0.72rem", "0.9rem"],
  small: ["0.875rem", "1.0625rem"],
  ui: ["0.9375rem", "1.125rem"],
  body: ["1.125rem", "1.31rem"],
  lead: ["1.3125rem", "1.47rem"],
};

for (const file of process.argv.slice(2)) {
  const doc = JSON.parse(fs.readFileSync(file, "utf8"));
  const styles = doc.payload.styles;

  // parent map for combo selector chains
  const parentsOf = new Map();
  for (const s of styles)
    for (const kid of s.children || []) {
      if (!parentsOf.has(kid)) parentsOf.set(kid, []);
      parentsOf.get(kid).push(s);
    }
  function selectors(s) {
    if (s.comb !== "&") return ["." + s.name];
    const ps = parentsOf.get(s._id) || [];
    if (!ps.length) return ["." + s.name]; // orphan combo — best effort
    return ps.flatMap((p) => selectors(p).map((sel) => sel + "." + s.name));
  }

  const baseFs = (s) => ((s.styleLess || "").match(/font-size: ([\d.]+rem);/) || [])[1];

  // ---- 1. display ladder -> medium/small variants ----
  const laddered = {};
  for (const [tok, [base, , at991, at767]] of Object.entries(DISPLAY)) {
    laddered[tok] = 0;
    for (const s of styles) {
      if (baseFs(s) !== base) continue;
      s.variants ||= {};
      for (const [bp, val] of [["medium", at991], ["small", at767]]) {
        if (!val) continue;
        const v = (s.variants[bp] ||= { styleLess: "" });
        if (/font-size:/.test(v.styleLess)) {
          throw new Error(`${file}: ${s.name} already sets font-size at ${bp}`);
        }
        v.styleLess = (v.styleLess ? v.styleLess.replace(/;?\s*$/, "; ") : "") +
          `font-size: ${val};`;
      }
      laddered[tok]++;
    }
  }
  if (!laddered.h1 || !laddered.h2) {
    throw new Error(`${file}: display ladder matched h1=${laddered.h1} h2=${laddered.h2} — the scale moved; re-derive DISPLAY`);
  }

  // ---- 3. strip the seam re-hang on btn--lg ----
  let stripped = 0;
  for (const s of styles) {
    if (s.name !== "btn--lg" || !s.variants?.tiny) continue;
    const before = s.variants.tiny.styleLess || "";
    if (/font-size:/.test(before)) {
      s.variants.tiny.styleLess = before.replace(/font-size:[^;]+;?\s*/, "").trim();
      if (!s.variants.tiny.styleLess) delete s.variants.tiny;
      stripped++;
    }
  }

  // ---- 2. head-tier data ----
  const tier = {};
  for (const [tok, [base, tierVal]] of Object.entries(READING)) {
    const sels = styles.filter((s) => baseFs(s) === base).flatMap(selectors);
    tier[tok] = { value: tierVal, selectors: [...new Set(sels)].sort() };
  }
  const rung1439 = {};
  for (const [tok, [base, at1439]] of Object.entries(DISPLAY)) {
    if (!at1439) continue;
    const sels = styles.filter((s) => baseFs(s) === base).flatMap(selectors);
    rung1439[tok] = { value: at1439, selectors: [...new Set(sels)].sort() };
  }
  const out = file.replace(/final\.json$/, "head-tier.json");
  fs.writeFileSync(out, JSON.stringify({ tier478: tier, rung1439 }, null, 1));
  fs.writeFileSync(file, JSON.stringify(doc));

  console.log(
    `${file}: ladder ${Object.entries(laddered).map(([k, n]) => `${k}=${n}`).join(" ")}` +
    ` | btn--lg tiny font-size stripped x${stripped} | tier -> ${out}`
  );
}
