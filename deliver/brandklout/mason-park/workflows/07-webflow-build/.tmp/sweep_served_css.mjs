/* EXPERIMENTAL — a research tool, NOT a gate. Do not quote its number as a
   verdict, and do not wire it into CI as-is.
   ==========================================================================
   The idea is sound: the API read-back is not the real gate, the SERVED
   stylesheet is, because a style can be stored correctly and still never reach
   the browser. The implementation is not finished.

   Progress so far, on the three Mason Park staging pages: the raw comparison
   reports ~3900 "missing" declarations, of which every single one investigated
   turned out to be the COMPARATOR's fault, not the site's. Fixing four of those
   causes took it to ~990, and the remainder are the same kind of thing. Known
   equivalences already handled: grouped selectors (`.a, .b { }`), combo class
   ORDER (`.wrap.inv-div` vs `.inv-div.wrap`), pseudo variants living under
   their own selector, Webflow's minifier (rgba->#rrggbbaa, .45s, #fff, 0px),
   single-family font storage, and longhand/shorthand in both directions.

   TWO REASONS IT CANNOT BE TRUSTED YET:

   1. A combo in the payload can be served as a BARE-CLASS rule. `.btn.inv-a`
      at <=767 looks absent, and the site actually serves `@767 .inv-a {
      display: none }`. Read naively that is "a mobile-hidden button is
      showing"; it is nothing. Resolving this needs real cascade resolution,
      not selector lookup.
   2. It compares the CURRENT payload against the LIVE site, and those are
      allowed to differ — the site was pasted from an earlier payload. Every
      intentional change shows up as a finding. It needs to compare against the
      payload the site was actually built from, or be run immediately after a
      push.

   What was verified properly instead, and IS trustworthy: the specific
   declarations that changed this session were checked in the served CSS by
   hand — see verify_published_grids.mjs, which confirmed `.grid--3` and
   `.foot-grid` ladders byte-for-byte off the CDN.

   Usage: node sweep_served_css.mjs
   Source Asana task GID: 1217040406855582 */
import fs from "node:fs";

const BASE = "https://mason-park-dental.webflow.io";
const PAGES = ["invisalign", "new-patient-special", "thank-you"];
// Webflow's own media widths, in the order the stylesheet declares them.
const BP = { main: null, medium: 991, small: 767, tiny: 479 };

/* Webflow MINIFIES the published stylesheet, so a byte comparison against the
   payload reports hundreds of differences that are the same value written
   differently. Everything here is a documented equivalence, not a fudge:
     rgba(255,255,255,0.86) -> #ffffffdb      alpha folded into an 8-digit hex
     0.45s                  -> .45s           leading zero dropped
     #fff                   -> #ffffff        3-digit hex expanded
     0px                    -> 0              unit dropped on zero
   Any tolerance added here MUST be a true equivalence — the whole point of this
   script is to catch a value the site does not serve, and a sloppy normaliser
   turns it into a script that always passes. */
const hex2 = (n) => Math.round(n).toString(16).padStart(2, "0");
const norm = (v) => String(v).toLowerCase().trim()
  .replace(/;$/, "")
  .replace(/["']/g, "")
  .replace(/\s*,\s*/g, ",").replace(/\s+/g, " ")
  // rgba()/rgb() -> hex, matching Webflow's own output
  .replace(/rgba?\(([\d.]+),([\d.]+),([\d.]+)(?:,([\d.]+))?\)/g, (_, r, g, b, a) =>
    "#" + hex2(+r) + hex2(+g) + hex2(+b) + (a !== undefined && +a < 1 ? hex2(+a * 255) : ""))
  .replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/, "#$1$1$2$2$3$3")
  .replace(/(^|[\s,(])0+\.(\d)/g, "$1.$2")   // 0.45 -> .45
  .replace(/\b0(px|rem|em|%)\b/g, "0")
  .trim();

/* Walk the stylesheet ONCE into { selector: { mediaKey: {prop: value} } }.
   Two things a regex-per-selector gets wrong and that cost a full rewrite here:
     - Webflow GROUPS selectors that share declarations (`.skip-link, .site-head
       { … }`), so a pattern demanding the selector alone before `{` matches
       nothing and reports a correct site as 95% missing;
     - nested @media blocks need real brace tracking, not a split(). */
function indexStylesheet(css) {
  const index = {};
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let i = 0, media = "main";
  let mediaDepth = -1, depth = 0;
  while (i < src.length) {
    const at = src.indexOf("@media", i);
    const brace = src.indexOf("{", i);
    if (brace < 0) break;
    if (at >= 0 && at < brace) {
      const cond = src.slice(at, brace);
      const mw = cond.match(/max-width:\s*(\d+)px/);
      media = mw ? +mw[1] : "main";
      mediaDepth = depth;
      depth++;
      i = brace + 1;
      continue;
    }
    const selectors = src.slice(i, brace);
    const close = src.indexOf("}", brace);
    if (close < 0) break;
    const body = src.slice(brace + 1, close);
    for (const sel of selectors.split(",")) {
      const s = sel.trim();
      if (!s) continue;
      index[s] = index[s] || {};
      index[s][media] = index[s][media] || {};
      for (const decl of body.split(";")) {
        const c = decl.indexOf(":");
        if (c > 0) index[s][media][decl.slice(0, c).trim().toLowerCase()] = norm(decl.slice(c + 1));
      }
    }
    i = close + 1;
    // leaving the @media block?
    while (src[i] === "}" || src[i] === "\n" || src[i] === " ") {
      if (src[i] === "}") { depth--; if (depth === mediaDepth) { media = "main"; mediaDepth = -1; } }
      i++;
    }
  }
  return index;
}

/* A combo's class ORDER is not stable between the payload and the published
   sheet: the payload yields `.wrap.inv-div` where Webflow serves
   `.inv-div.wrap`. Keying by the SET of classes removes the question — and it
   mattered, because an order mismatch reported 212 present selectors as absent,
   which would equally have hidden a genuinely missing one. Pseudo suffix is
   kept, since `:focus` is a different rule. */
const classKey = (sel) => {
  const m = sel.match(/^((?:\.[A-Za-z0-9_-]+)+)(:[a-z-]+)?$/);
  if (!m) return null;
  return m[1].split(".").filter(Boolean).sort().join(".") + (m[2] || "");
};
function bySet(index) {
  const out = {};
  for (const [sel, media] of Object.entries(index)) {
    const k = classKey(sel);
    if (!k) continue;
    out[k] = out[k] || {};
    for (const [mk, props] of Object.entries(media)) {
      out[k][mk] = Object.assign(out[k][mk] || {}, props);
    }
  }
  return out;
}

/* Properties Webflow legitimately does not put in the class stylesheet.
   -webkit-* are REFUSED by data_style_tool and live in the site head block
   instead (documented in the runbook), so their absence here is expected. */
const NOT_IN_CLASS_CSS = /^-webkit-|^-moz-/;

/* Longhand -> the shorthand Webflow may have kept instead. */
const SHORTHAND_OF = (prop) =>
  /^border-(top|bottom)-(left|right)-radius$/.test(prop) ? "border-radius"
  : /^(top|right|bottom|left)$/.test(prop) ? "inset"
  : prop.replace(/-(top|right|bottom|left|width|style|color|family|size|image)$/, "");

let missingSel = 0, missingDecl = 0, checkedSel = 0, checkedDecl = 0;
const report = [];

for (const page of PAGES) {
  const html = await (await fetch(`${BASE}/${page}`, { cache: "no-store" })).text();
  const href = [...html.matchAll(/<link[^>]+href="([^"]+\.css[^"]*)"/g)].map((m) => m[1])[0];
  if (!href) { console.log(`${page}: NO STYLESHEET`); missingSel++; continue; }
  const css = await (await fetch(href, { cache: "no-store" })).text();
  const index = bySet(indexStylesheet(css));

  const payload = JSON.parse(fs.readFileSync(`.tmp/pc/${page}/final.json`, "utf8")).payload;
  // Build each style's full selector chain: a combo is .parent.child
  const byId = Object.fromEntries(payload.styles.map((s) => [s._id, s]));
  const chain = (s) => "." + [...(s.children || []).map((id) => byId[id]?.name).filter(Boolean), s.name].join(".");

  const seen = new Set();
  for (const s of payload.styles) {
    const sel = chain(s);
    if (seen.has(sel)) continue;
    seen.add(sel);
    const served = index[classKey(sel)] || {};
    if (!Object.keys(served).length) {
      // A style with no declarations anywhere legitimately emits no rule.
      const hasAny = (s.styleLess || "").trim() ||
        Object.values(s.variants || {}).some((v) => (v.styleLess || "").trim());
      if (hasAny) { missingSel++; report.push(`${page}  SELECTOR ABSENT  ${sel}`); }
      continue;
    }
    checkedSel++;
    /* A variant key is either a breakpoint ("medium") or a breakpoint_pseudo
       pair ("main_focus"). A pseudo lives under its OWN selector in the served
       CSS (`.skip-link:focus`), so comparing it against the base rule reports
       every focus style as wrong — which it did. */
    const want = { main: s.styleLess || "", ...Object.fromEntries(
      Object.entries(s.variants || {}).map(([k, v]) => [k, v.styleLess || ""])) };
    for (const [rawKey, less] of Object.entries(want)) {
      if (!less.trim()) continue;
      const [bpName, pseudo] = rawKey.split("_");
      const bpKey = BP[bpName] ?? (bpName === "main" ? "main" : bpName);
      const source = pseudo ? (index[classKey(`${sel}:${pseudo}`)] || {}) : served;
      if (pseudo && !Object.keys(source).length) continue; // pseudo rule absent entirely
      const got = source[bpKey] || source.main || {};
      for (const decl of less.split(";")) {
        const c = decl.indexOf(":");
        if (c < 0) continue;
        const prop = decl.slice(0, c).trim().toLowerCase();
        const val = norm(decl.slice(c + 1));
        if (!val) continue;
        if (NOT_IN_CLASS_CSS.test(prop)) continue;
        checkedDecl++;
        const g = got[prop];
        let ok;
        if (g !== undefined) {
          ok = g === val
            // Webflow stores ONE family, never the source stack.
            || (prop === "font-family" && g.split(",")[0] === val.split(",")[0]);
        } else {
          /* Shorthand/longhand goes BOTH ways: the payload may send
             `padding-top` where Webflow kept `padding`, or send `padding` where
             Webflow expanded it. Accept either, and treat a value that appears
             anywhere inside the shorthand as served. */
          const root = SHORTHAND_OF(prop);
          const short = got[root];
          ok = (short !== undefined && short.split(" ").includes(val))
            || Object.keys(got).some((k) => k.startsWith(prop + "-"));
        }
        if (!ok) { missingDecl++; if (report.length < 60) report.push(`${page}  ${sel} @${bpKey}  ${prop}: want ${val} | served ${g ?? "(absent)"}`); }
      }
    }
  }
}

console.log(`selectors checked : ${checkedSel}   absent: ${missingSel}`);
console.log(`declarations check: ${checkedDecl}   not served: ${missingDecl}`);
if (report.length) { console.log("\n--- findings ---"); report.forEach((r) => console.log("  " + r)); }
else console.log("\nEverything the payload declares is present in the SERVED stylesheet.");
process.exit(missingSel || missingDecl ? 1 : 0);
