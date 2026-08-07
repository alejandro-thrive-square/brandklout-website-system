// Core logic for the webflow-clientfirst MCP.
// Kept separate from server.mjs so every capability is runnable and testable
// from the CLI without an MCP client attached.

import fs from "node:fs";
import path from "node:path";

/* ------------------------------------------------------------------ *
 * 1. HARVEST — compiled Webflow CSS -> a reusable class/variable vocabulary
 * ------------------------------------------------------------------ */

// Client-First families. Order matters: first match wins, so the more specific
// prefixes must precede the generic ones.
const CF_FAMILIES = [
  ["text-size",      /^text-size-/],
  ["text-style",     /^text-style-/],
  ["text-weight",    /^text-weight-/],
  ["text-align",     /^text-align-/],
  ["text-color",     /^text-color-/],
  ["heading-style",  /^heading-style-/],
  ["padding",        /^padding-/],
  ["margin",         /^margin-/],
  ["spacer",         /^spacer-/],
  ["max-width",      /^max-width-/],
  ["background",     /^background-color-/],
  ["button",         /^button/],
  ["layout",         /^(page-wrapper|main-wrapper|container-|section_|padding-global)/],
  ["grid",           /^(grid-|w-layout-grid)/],
  ["aspect-ratio",   /^aspect-ratio-/],
  ["align",          /^align-/],
  ["overflow",       /^overflow-/],
  ["display",        /^(hide|display-)/],
  ["icon",           /^icon-/],
  ["form",           /^(form|field|checkbox|radio)/],
];

function familyOf(name) {
  for (const [fam, re] of CF_FAMILIES) if (re.test(name)) return fam;
  return "other";
}

/** Strip comments and split a stylesheet into { selector, body } rules. */
function splitRules(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = [];
  // Walk brace-depth so nested at-rules (@media, @supports) are handled.
  let depth = 0, buf = "", selStart = 0, media = [];
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (c === "{") {
      depth++;
      if (depth === 1) { buf = clean.slice(selStart, i).trim(); selStart = i + 1; continue; }
      if (depth === 2) { selStart = i + 1; }
      continue;
    }
    if (c === "}") {
      if (depth === 2) {
        rules.push({ selector: buf, body: clean.slice(selStart, i), media: media.slice() });
      } else if (depth === 1) {
        if (media.length) media.pop();
      }
      depth--;
      selStart = i + 1;
      if (depth === 0) buf = "";
      continue;
    }
    if (depth === 1 && c === "{") continue;
  }
  // Simpler second pass for the common flat case (top-level rules).
  const flat = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(clean))) {
    const sel = m[1].trim();
    if (sel.startsWith("@")) continue;
    flat.push({ selector: sel, body: m[2] });
  }
  return flat;
}

function parseDecls(body) {
  const out = {};
  for (const chunk of body.split(";")) {
    const i = chunk.indexOf(":");
    if (i < 0) continue;
    const prop = chunk.slice(0, i).trim().toLowerCase();
    const val = chunk.slice(i + 1).trim();
    if (prop && val) out[prop] = val;
  }
  return out;
}

/**
 * Build a vocabulary from compiled Webflow CSS.
 * Returns { classes: {name: {family, decls, selectors}}, variables: {name: value} }
 */
export function harvestCss(cssText) {
  const rules = splitRules(cssText);
  const classes = Object.create(null);
  const variables = Object.create(null);

  for (const { selector, body } of rules) {
    const decls = parseDecls(body);

    // CSS custom properties, usually declared on :root / html / body
    for (const [p, v] of Object.entries(decls)) {
      if (p.startsWith("--")) variables[p] = v;
    }

    // Only single, unqualified class selectors are safe to treat as reusable
    // Webflow classes. Anything compound is a contextual override.
    for (const sel of selector.split(",")) {
      const s = sel.trim();
      const m = /^\.([a-zA-Z0-9_-]+)$/.exec(s);
      if (!m) continue;
      const name = m[1];
      if (name.startsWith("w-")) continue; // Webflow internals
      const entry = classes[name] || (classes[name] = { family: familyOf(name), decls: {}, selectors: [] });
      Object.assign(entry.decls, Object.fromEntries(Object.entries(decls).filter(([p]) => !p.startsWith("--"))));
      entry.selectors.push(s);
    }
  }
  return { classes, variables };
}

export function summarizeVocab(vocab) {
  const byFamily = {};
  for (const [name, v] of Object.entries(vocab.classes)) {
    (byFamily[v.family] ||= []).push(name);
  }
  const families = Object.entries(byFamily)
    .map(([f, names]) => ({ family: f, count: names.length, sample: names.sort().slice(0, 6) }))
    .sort((a, b) => b.count - a.count);
  return {
    classes: Object.keys(vocab.classes).length,
    variables: Object.keys(vocab.variables).length,
    families,
  };
}

/* ------------------------------------------------------------------ *
 * 2. VALIDATE — check a converter payload before it ever reaches Webflow
 * ------------------------------------------------------------------ */

const CSS_FN = /\b(clamp|calc|min|max)\s*\(/;
const BARE_TAG =
  /^(div|span|p|b|i|a|em|strong|small|section|article|aside|header|footer|main|nav|figure|figcaption|img|video|ul|ol|li|h[1-6]|blockquote|cite|address|form|label|input|button|table|tr|td|th)(-\d+)?$/;

function stylesOf(payload) {
  return payload?.payload?.styles || payload?.styles || [];
}

/**
 * Validate a Webflow clipboard payload.
 * `vocab` is optional; when supplied, reuse/fork analysis is included.
 */
export function validatePayload(payload, vocab = null) {
  const styles = stylesOf(payload);
  const cssFunctions = [];
  const bareNames = [];
  const propCount = {};

  const knownNames = vocab ? new Set(Object.keys(vocab.classes)) : null;

  for (const s of styles) {
    const name = s.name || "";
    const less = s.styleLess || "";
    // Some Client-First class names are also HTML tags (`button`, `label`).
    // A name that exists in the target vocabulary AND declares nothing is
    // intentional reuse, not an accidental tag-derived auto-name.
    const isIntentionalReuse = knownNames?.has(name) && !less.trim();
    if (BARE_TAG.test(name) && !isIntentionalReuse) bareNames.push(name);
    for (const m of less.matchAll(/([a-zA-Z-]+)\s*:\s*([^;]+)/g)) {
      const prop = m[1], val = m[2].trim();
      if (CSS_FN.test(val)) {
        cssFunctions.push({ class: name, prop, value: val.slice(0, 60) });
        propCount[prop] = (propCount[prop] || 0) + 1;
      }
    }
  }

  const result = {
    styles: styles.length,
    violations: {
      cssFunctions: cssFunctions.length,
      bareTagNames: bareNames.length,
    },
    cssFunctionsByProp: Object.entries(propCount).sort((a, b) => b[1] - a[1]).map(([p, c]) => ({ prop: p, count: c })),
    bareTagNamesSample: [...new Set(bareNames)].sort().slice(0, 20),
    cssFunctionSample: cssFunctions.slice(0, 8),
  };

  if (vocab) {
    const known = new Set(Object.keys(vocab.classes));
    // A name that already exists on the target site is only SAFE when we set no
    // properties — Webflow's pasted definition wins for properties it declares,
    // so an empty styleLess leaves the site's class (and its variable bindings)
    // intact. That is intentional reuse. A name match carrying declarations is
    // an overwrite, and is what corrupts a style guide.
    const reused = [], forked = [], overwrites = [];
    for (const s of styles) {
      if (!known.has(s.name)) { forked.push(s.name); continue; }
      if ((s.styleLess || "").trim()) {
        overwrites.push({ class: s.name, wouldPush: (s.styleLess || "").slice(0, 70) });
      } else {
        reused.push(s.name);
      }
    }
    result.reuse = {
      reused: reused.length,
      forked: forked.length,
      reusePct: styles.length ? Math.round((reused.length / styles.length) * 100) : 0,
      reusedSample: [...new Set(reused)].sort().slice(0, 20),
      // The dangerous set. Must be empty before pasting.
      overwrites: overwrites.length,
      overwritesSample: overwrites.slice(0, 12),
    };
  }

  result.pass =
    result.violations.cssFunctions === 0 &&
    result.violations.bareTagNames === 0 &&
    (!vocab || result.reuse.overwrites === 0);
  return result;
}

/* ------------------------------------------------------------------ *
 * 3. SUGGEST — map emitted styles onto existing style-guide classes
 * ------------------------------------------------------------------ */

const MATCHABLE = new Set([
  "font-size", "line-height", "font-weight", "letter-spacing", "text-transform",
  "text-align", "color", "background-color",
  "padding-top", "padding-bottom", "padding-left", "padding-right",
  "margin-top", "margin-bottom", "margin-left", "margin-right",
  "max-width", "display", "flex-direction", "align-items", "justify-content",
]);

function declsFromLess(less) {
  const out = {};
  for (const m of (less || "").matchAll(/([a-zA-Z-]+)\s*:\s*([^;]+)/g)) {
    const p = m[1].toLowerCase().trim();
    if (MATCHABLE.has(p)) out[p] = m[2].trim().toLowerCase();
  }
  return out;
}

// A match on a single shared declaration is noise — two classes that both set
// `display:block` are not the same component. Require real overlap.
const MIN_SHARED_DECLS = 2;

/** Jaccard-ish score over matchable declarations, with a floor on shared count. */
function score(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  if (!keys.size) return 0;
  let same = 0;
  for (const k of keys) if (a[k] && b[k] && a[k] === b[k]) same++;
  if (same < MIN_SHARED_DECLS) return 0;
  return same / keys.size;
}

/**
 * For each emitted style, propose the closest style-guide class.
 * Only proposes when the score clears `threshold`.
 */
export function suggestReuse(payload, vocab, threshold = 0.6) {
  const styles = stylesOf(payload);
  const cand = Object.entries(vocab.classes).map(([name, v]) => ({
    name, family: v.family, decls: Object.fromEntries(
      Object.entries(v.decls).filter(([p]) => MATCHABLE.has(p)).map(([p, x]) => [p, String(x).toLowerCase()])
    ),
  })).filter((c) => Object.keys(c.decls).length);

  const suggestions = [];
  for (const s of styles) {
    const mine = declsFromLess(s.styleLess);
    if (!Object.keys(mine).length) continue;
    let best = null;
    for (const c of cand) {
      const sc = score(mine, c.decls);
      if (!best || sc > best.score) best = { name: c.name, family: c.family, score: sc };
    }
    if (best && best.score >= threshold) {
      suggestions.push({ from: s.name, to: best.name, family: best.family, score: +best.score.toFixed(2) });
    }
  }
  return {
    styles: styles.length,
    suggested: suggestions.length,
    coveragePct: styles.length ? Math.round((suggestions.length / styles.length) * 100) : 0,
    suggestions: suggestions.sort((a, b) => b.score - a.score),
  };
}

/* ------------------------------------------------------------------ *
 * 4. FLUID RESOLUTION — clamp()/min()/max()/calc() -> per-breakpoint values
 * ------------------------------------------------------------------ */

/* Each entry is evaluated at a width INSIDE the band it governs, not at the
 * band's edge. Evaluating every band at its maximum (the old 1440/991/767/478)
 * makes the baked value the largest the band ever needs, so a `clamp()` renders
 * systematically oversized everywhere except the exact edge — the hero measured
 * 106.56px live against the design's 93.5px at a 1280 viewport.
 *
 * Webflow band structure: xl is min-width 1280 and wins above it, so base only
 * governs 992-1279. Splitting that band is what closes most of the gap; the
 * remaining bands are narrow enough that their midpoint keeps the error small.
 *
 * `xl` stays pinned to 1440 — the design's reference width — so the build
 * remains pixel-exact at the width it was signed off at.
 */
export const BREAKPOINTS = [
  { name: "xxl",     width: 1920, band: "1920+"      },
  { name: "xl",      width: 1440, band: "1440-1919"  },
  { name: "large",   width: 1360, band: "1280-1439"  },
  { name: "desktop", width: 1136, band: "992-1279"   },
  { name: "tablet",  width: 880,  band: "768-991"    },
  { name: "mobileL", width: 623,  band: "479-767"    },
  { name: "mobileP", width: 400,  band: "0-478"      },
];

const ROOT_PX = 16;

/** Evaluate a CSS length expression at a viewport width. Returns px, or null. */
export function evalLength(expr, viewportPx, rootPx = ROOT_PX) {
  const src = String(expr).trim();

  function toPx(tok) {
    const m = /^(-?[\d.]+)(px|rem|em|vw|vh|svh|dvh|lvh|vmin|vmax|%)?$/
      .exec(tok.trim());
    if (!m) return null;
    const n = parseFloat(m[1]);
    switch (m[2]) {
      case "px": case undefined: case "": return n;
      case "rem": case "em": return n * rootPx;
      case "vw": return (n / 100) * viewportPx;
      // Viewport-HEIGHT units are deliberately unresolvable. This used to
      // evaluate `vh` against the viewport WIDTH ("rare in type scales"),
      // which silently turned `height: min(92vh, 940px)` into a hard
      // `940px`: 92vh measured 1324px against a 1440 width, so min() picked
      // the clamp. The hero portrait then rendered 27% oversized and stopped
      // scaling with the viewport (Dr. Nahlah, live 2026-07-30).
      // There is no correct px for a vh: returning null leaves the
      // expression live and reports it in `failed`, which is honest.
      case "vh": case "svh": case "dvh": case "lvh":
      case "vmin": case "vmax": return null;
      default: return null;
    }
  }

  // Recursive descent over clamp/min/max/calc and bare lengths.
  function evaluate(s) {
    s = s.trim();
    const fn = /^(clamp|min|max|calc)\s*\(([\s\S]*)\)$/.exec(s);
    if (fn) {
      const name = fn[1];
      const args = splitArgs(fn[2]);
      if (name === "calc") return evalArithmetic(args[0]);
      const vals = args.map(evaluate);
      if (vals.some((v) => v === null)) return null;
      if (name === "min") return Math.min(...vals);
      if (name === "max") return Math.max(...vals);
      if (name === "clamp") {
        const [lo, pref, hi] = vals;
        return Math.min(Math.max(pref, lo), hi);
      }
    }
    if (/[+\-*/]/.test(s) && !/^-?[\d.]+[a-z%]*$/.test(s)) return evalArithmetic(s);
    return toPx(s);
  }

  function splitArgs(s) {
    const out = []; let depth = 0, cur = "";
    for (const c of s) {
      if (c === "(") depth++;
      if (c === ")") depth--;
      if (c === "," && depth === 0) { out.push(cur); cur = ""; continue; }
      cur += c;
    }
    if (cur.trim()) out.push(cur);
    return out;
  }

  function evalArithmetic(s) {
    // Resolve nested functions first — `calc(clamp(1rem,4vw,4.5rem) + 0px)` is
    // common once CSS variables holding clamp() are expanded into calc().
    let src = String(s);
    for (let guard = 0; guard < 12; guard++) {
      const m = /(clamp|min|max)\s*\(([^()]*)\)/i.exec(src);
      if (!m) break;
      const inner = evaluate(`${m[1]}(${m[2]})`);
      if (inner === null) return null;
      src = src.slice(0, m.index) + `${inner}px` + src.slice(m.index + m[0].length);
    }
    // Tokenise into numbers (converted to px) and operators, then eval safely.
    const tokens = src.match(/(-?[\d.]+[a-z%]*|\(|\)|[+\-*/])/gi);
    if (!tokens) return null;
    const conv = tokens.map((t) => {
      if (/^[+\-*/()]$/.test(t)) return t;
      const p = toPx(t);
      return p === null ? null : String(p);
    });
    if (conv.some((t) => t === null)) return null;
    const expr = conv.join(" ");
    if (!/^[-+*/(). \d]+$/.test(expr)) return null;
    try { const v = Function(`"use strict";return (${expr})`)(); return Number.isFinite(v) ? v : null; }
    catch { return null; }
  }

  const px = evaluate(src);
  return px === null ? null : Math.round(px * 100) / 100;
}

/** Split a value on top-level whitespace, ignoring spaces inside parentheses. */
function splitTopLevel(value) {
  const out = []; let depth = 0, cur = "";
  for (const c of value) {
    if (c === "(") depth++;
    if (c === ")") depth--;
    if (/\s/.test(c) && depth === 0) { if (cur) { out.push(cur); cur = ""; } continue; }
    cur += c;
  }
  if (cur) out.push(cur);
  return out;
}

/**
 * Resolve a possibly multi-value length (shorthand) at one viewport width.
 * Returns a space-joined px string, or null if any part is unresolvable.
 */
export function resolveMultiValue(value, viewportPx) {
  const parts = splitTopLevel(String(value).trim());
  const out = [];
  for (const part of parts) {
    if (!CSS_FN.test(part)) { out.push(part); continue; }
    const px = evalLength(part, viewportPx);
    if (px === null) return null;
    out.push(`${px}px`);
  }
  return out.join(" ");
}

/**
 * Rewrite a payload so every CSS-function value becomes a concrete px value
 * per Webflow breakpoint. Returns { payload (desktop), breakpoints: {name: {class: {prop: px}}} }.
 */
export function resolveFluid(payload) {
  const styles = stylesOf(payload);
  const overrides = {};
  let resolved = 0, failed = [];

  for (const bp of BREAKPOINTS) overrides[bp.name] = {};

  for (const s of styles) {
    const less = s.styleLess || "";
    if (!CSS_FN.test(less)) continue;
    let out = less;
    for (const m of [...less.matchAll(/([a-zA-Z-]+)\s*:\s*([^;]+)/g)]) {
      const prop = m[1], val = m[2].trim();
      if (!CSS_FN.test(val)) continue;
      for (const bp of BREAKPOINTS) {
        // Shorthands carry several values (`padding-block: clamp(..) clamp(..)`),
        // so resolve each top-level part and rejoin rather than failing whole.
        const px = resolveMultiValue(val, bp.width);
        if (px === null) { failed.push({ class: s.name, prop, value: val.slice(0, 50) }); break; }
        // resolveMultiValue already returns units, e.g. "48px" or "48px 24px".
        (overrides[bp.name][s.name] ||= {})[prop] = px;
        if (bp.name === "desktop") {
          out = out.replace(`${prop}:${val}`, `${prop}:${px}`)
                   .replace(`${prop}: ${val}`, `${prop}: ${px}`);
          resolved++;
        }
      }
    }
    s.styleLess = out;
  }

  return {
    payload,
    breakpoints: overrides,
    resolved,
    failed: [...new Map(failed.map((f) => [f.class + f.prop, f])).values()],
  };
}

/* ------------------------------------------------------------------ *
 * IO helpers
 * ------------------------------------------------------------------ */
export const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
export const writeJson = (p, o) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(o, null, 2), "utf8");
};
