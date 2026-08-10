/**
 * fix_variant_fns.mjs — evaluate fluid CSS functions that survive inside
 * breakpoint VARIANTS after resolve_wholepage.mjs (which processes base
 * styleLess only). A clamp()/calc() in a variant renders fine but shows `0`
 * in the Designer's style panel, the same defect the base resolver exists for.
 *
 * Deterministic post-pass, part of the build pipeline — regenerating the
 * payload and re-running this yields identical bytes, so it is NOT the
 * hand-tuning the packaging rules forbid.
 *
 * Bands evaluate at their MIDPOINT, matching resolve_wholepage policy.
 * Only rem/px/vw/vh terms are evaluated; anything %-relative is left alone
 * (no px equivalent exists at any breakpoint).
 *
 * Usage: node fix_variant_fns.mjs <payload.json> [payload.json ...]
 */
import fs from "node:fs";

// Webflow ladder: large=1280, xl=1440, xxl=1920. Midpoints per band.
const BAND_VW = {
  xxl: 2160,          // 1920 .. open (use 1920*1.125)
  xl: 1680,           // 1440..1920
  large: 1360,        // 1280..1440
  main: 1136,         // 992..1280
  medium: 880,        // 768..991
  small: 624,         // 480..767
  tiny: 400,          // ..479
};

const ROOT_PX = 16;

function evalTerm(t, vw) {
  t = t.trim();
  let m;
  if ((m = t.match(/^(-?[\d.]+)rem$/))) return parseFloat(m[1]) * ROOT_PX;
  if ((m = t.match(/^(-?[\d.]+)px$/))) return parseFloat(m[1]);
  if ((m = t.match(/^(-?[\d.]+)vw$/))) return (parseFloat(m[1]) / 100) * vw;
  if ((m = t.match(/^(-?[\d.]+)$/))) return parseFloat(m[1]);
  return null; // %, em, ch, var() — not resolvable here
}

function evalFn(expr, vw) {
  // innermost-first: repeatedly replace fn(...) whose args hold no nested fn
  let guard = 20;
  while (guard--) {
    const m = expr.match(/\b(clamp|min|max|calc)\(([^()]*)\)/);
    if (!m) break;
    const [whole, fn, argsRaw] = m;
    let out = null;
    if (fn === "calc") {
      // support "A - B", "A + B", "N * X" with px-resolvable terms
      const parts = argsRaw.split(/\s+([+\-])\s+/);
      let acc = null, op = "+", bad = false;
      for (const p of parts) {
        if (p === "+" || p === "-") { op = p; continue; }
        // multiplication inside a part: "2 * 40px"
        let v;
        if (p.includes("*")) {
          const f = p.split("*").map((x) => evalTerm(x, vw));
          if (f.some((x) => x === null)) { bad = true; break; }
          v = f.reduce((a, b) => a * b, 1);
        } else {
          v = evalTerm(p, vw);
          if (v === null) { bad = true; break; }
        }
        acc = acc === null ? v : op === "+" ? acc + v : acc - v;
      }
      out = bad ? null : acc;
    } else {
      const args = argsRaw.split(",").map((a) => evalTerm(a, vw));
      if (!args.some((a) => a === null)) {
        if (fn === "min") out = Math.min(...args);
        else if (fn === "max") out = Math.max(...args);
        else if (fn === "clamp") out = Math.min(Math.max(args[1], args[0]), args[2]);
      }
    }
    if (out === null) return null; // unresolvable — leave the declaration alone
    expr = expr.replace(whole, `${+(out / ROOT_PX).toFixed(4)}rem`);
  }
  return /\b(clamp|min|max|calc)\(/.test(expr) ? null : expr;
}

for (const file of process.argv.slice(2)) {
  const doc = JSON.parse(fs.readFileSync(file, "utf8"));
  let fixed = 0, left = 0;
  for (const s of doc.payload.styles) {
    for (const [bp, v] of Object.entries(s.variants || {})) {
      const band = bp.replace(/_.*/, "");
      const vw = BAND_VW[band] ?? BAND_VW.main;
      if (!/\b(clamp|min|max|calc)\(/.test(v.styleLess || "")) continue;
      v.styleLess = v.styleLess.replace(/([\w-]+)\s*:\s*([^;]+);?/g, (decl, prop, val) => {
        if (!/\b(clamp|min|max|calc)\(/.test(val)) return decl;
        const r = evalFn(val, vw);
        if (r === null) { left++; return decl; }
        fixed++;
        return `${prop}: ${r.trim()};`;
      });
    }
  }
  fs.writeFileSync(file, JSON.stringify(doc));
  console.log(`${file}: ${fixed} variant declaration(s) resolved, ${left} left (unresolvable)`);
}
