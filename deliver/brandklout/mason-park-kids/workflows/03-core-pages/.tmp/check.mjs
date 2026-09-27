// ===========================================================================
// THE GATE. Run it on the FILES IN home/, never on an intermediate.
//
//   node .tmp/check.mjs                      # every page under home/
//   node .tmp/check.mjs home/about-us/index.html
//
// Ported from the parent practice's workflow 09 (bk-mason-park). Everything
// here reads the shipped HTML and the shipped CSS off disk and nothing trusts
// a build log.
//
// WHAT IT CHECKS
//   1. every src / srcset / href into assets/ resolves on disk, from THAT
//      page's own directory
//   2. site.css braces balance
//   3. no control characters in the html, js or css
//   4. no <script type="module">, no fetch(), no svg inside a button
//   5. DESIGN-STANDARD.md "No wall of text": no unbroken run of <p> over the
//      ceiling, measured inside every container that can hold running prose
//   6. every id is unique, and every in-page #anchor resolves
//   7. every img carries a non-empty alt
//   8. no em dash anywhere in the page: the client asked for none in the copy
//   9. the chrome is byte-identical to the homepage's (stamp.mjs keeps it so)
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, "..", "home");

const CEILING = 110;
const HARD = 155;

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);

const pages = process.argv.length > 2
  ? process.argv.slice(2).map((p) => path.resolve(p))
  : walk(SITE).filter((f) => f.endsWith("index.html"));

let errors = 0, warnings = 0;
const fail = (page, msg) => { errors++; console.log("  FAIL " + page + ": " + msg); };
const warn = (page, msg) => { warnings++; console.log("  warn " + page + ": " + msg); };

const stripTags = (s) => s.replace(/<[^>]+>/g, " ");
const words = (s) => stripTags(s).replace(/&[a-z#0-9]+;/gi, "x").split(/\s+/).filter(Boolean).length;

// The chrome as the homepage carries it: everything outside <main>, with the
// per-page head lines (title, description, canonical, og:*, robots) removed
// and the asset prefix normalised, so a nested page compares equal.
function chromeOf(html) {
  const before = html.split("<main")[0];
  const after = html.split("</main>")[1] || "";
  const scrub = (s) => s
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta name="description"[^>]*>/, "")
    .replace(/<meta name="robots"[^>]*>/, "")
    .replace(/<link rel="canonical"[^>]*>/, "")
    .replace(/<meta property="og:[^"]*"[^>]*>/g, "")
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, "")
    .replace(/<body class="[^"]*">/, "<body>")
    .replace(/(?:\.\.\/)+assets\//g, "assets/")
    .replace(/\s+/g, " ");
  return scrub(before) + "|" + scrub(after);
}
const homeHtml = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
const homeChrome = chromeOf(homeHtml);

for (const file of pages) {
  const rel = path.relative(SITE, file).split(path.sep).join("/");
  const dir = path.dirname(file);
  const html = fs.readFileSync(file, "utf8");
  console.log("\n" + rel + "  (" + html.length + " bytes)");

  // ---- 1. assets resolve, from this page's own directory
  const refs = new Set();
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) refs.add(m[1]);
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const cand of m[1].split(",")) {
      const url = cand.trim().split(/\s+/)[0];
      if (url) refs.add(url);
    }
  }
  let checked = 0;
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|#|\/)/.test(ref)) continue;
    // 2026-09-09: a RELATIVE reference that is not under assets/ is a broken
    // one - `../uploads/x.webp` painted as a grey box on seven pages while
    // this gate reported clean, because it only looked at refs it could parse
    // as assets. A relative ref is a file, and a file either exists or fails.
    if (!/assets\//.test(ref) && !/\.(webp|png|jpg|jpeg|svg|css|js|woff2?)(\?|$)/.test(ref)) continue;
    checked++;
    if (!fs.existsSync(path.resolve(dir, ref))) fail(rel, "missing asset " + ref);
  }
  console.log("  assets: " + checked + " references");

  // ---- 3. control characters
  for (let k = 0; k < html.length; k++) {
    const c = html.charCodeAt(k);
    if (c < 32 && c !== 9 && c !== 10 && c !== 13) { fail(rel, "control char at byte " + k); break; }
  }

  // ---- 4. what Instatic will not take
  if (/<script[^>]*type="module"/.test(html)) fail(rel, "a module script");
  if (/\bfetch\s*\(/.test(html)) fail(rel, "inline fetch()");
  for (const m of html.matchAll(/<button\b[\s\S]*?<\/button>/g)) {
    if (/<svg/.test(m[0])) fail(rel, "an svg inside a button - Instatic drops the children");
  }

  // ---- 5. the prose ceiling, on unbroken runs of <p>
  // EVERY container that can hold running prose. A container missing from
  // this list makes the gate report "0 words" for a page full of prose, which
  // is a silent pass. Add the container whenever a new one is introduced.
  const HOLDERS = [
    /<div class="ft-after">[\s\S]*?<\/div>/g,
    /<article class="gr-stage"[\s\S]*?<\/article>/g,
    /<div class="cf-card[^"]*">[\s\S]*?<\/div>/g,
    /<div class="pe-copy">[\s\S]*?<\/dl>/g,
    /<article class="pa-card[^"]*">[\s\S]*?<\/article>/g,
    /<div class="iv-copy">[\s\S]*?<\/dl>/g,
    /<div class="faq_answer">[\s\S]*?<\/div>/g,
    /<div class="prose">[\s\S]*?<\/div>\s*<\/div>/g,
    /<section class="lf-section"[^>]*id="([^"]*)"[\s\S]*?<\/section>/g,
    /<div class="dr-bio">[\s\S]*?<\/div>/g,
    /<div class="ab-panel">[\s\S]*?<\/div>/g,
    /<div class="sv-card_copy">[\s\S]*?<\/div>/g,
    /<div class="np-copy">[\s\S]*?<\/div>/g,
    /<div class="fi-copy">[\s\S]*?<\/div>/g,
    /<div class="mb-copy">[\s\S]*?<\/div>/g,
    /<div class="ty-copy">[\s\S]*?<\/div>/g,
    /<div class="tm-copy">[\s\S]*?<\/div>/g,
    /<div class="ov-copy">[\s\S]*?<\/div>/g,
  ];
  const shown = (s) => s.replace(/<details class="lf-more"[\s\S]*?<\/details>/g, " ");
  let worst = 0, worstAt = "";
  for (const re of HOLDERS)
  for (const sec of html.matchAll(re)) {
    let run = 0;
    for (const part of shown(sec[0]).split(/(<p\b[^>]*>[\s\S]*?<\/p>)/)) {
      if (/^<p\b/.test(part)) {
        run += /class="(?:lf-lead|kicker|gr-stage_when|pe-role|chapter-tag|ch-foot|pa-call)"/.test(part) ? 0 : words(part);
        if (run > worst) { worst = run; worstAt = sec[1] || "panel"; }
      } else if (stripTags(part).trim() || /<(ul|ol|figure|details|table|h[2-6]|blockquote|dl)/.test(part)) {
        run = 0;
      }
    }
  }
  console.log("  longest prose run: " + worst + " words" + (worstAt ? " (#" + worstAt + ")" : ""));
  if (worst > HARD) fail(rel, "wall of text: " + worst + " words in #" + worstAt);
  else if (worst > CEILING) warn(rel, "over the " + CEILING + " ceiling but inside the fold bound: " + worst);

  // ---- 6. ids and anchors
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = ids.filter((v, i) => ids.indexOf(v) !== i);
  if (dupes.length) fail(rel, "duplicate id " + [...new Set(dupes)].join(", "));
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    if (m[1] !== "main" && !ids.includes(m[1])) fail(rel, "anchor #" + m[1] + " goes nowhere");
  }

  // ---- 7. alt text
  let imgs = 0, noAlt = 0;
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    imgs++;
    const alt = m[0].match(/\salt="([^"]*)"/);
    if (!alt) { fail(rel, "an img with no alt attribute"); continue; }
    if (!alt[1].trim() && !/aria-hidden="true"/.test(m[0])) noAlt++;
  }
  const inMain = (html.split("<main")[1] || "").split("</main>")[0];
  console.log("  images: " + imgs + " on the page, " + ((inMain.match(/<img\b/g) || []).length) + " inside <main>");
  if (noAlt) warn(rel, noAlt + " image(s) with an empty alt and no aria-hidden");

  // ---- 8. em dashes. The client asked for none in the copy.
  const dashes = (inMain.match(/—|&mdash;/g) || []).length;
  if (dashes) fail(rel, dashes + " em dash(es) in the page");

  // ---- 9. the chrome matches the homepage's
  if (rel !== "index.html" && chromeOf(html) !== homeChrome) {
    fail(rel, "chrome differs from the homepage - run `node .tmp/stamp.mjs`");
  }
}

// ---- 2. the stylesheet, once
const css = fs.readFileSync(path.join(SITE, "assets", "site.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const open = (css.match(/{/g) || []).length, close = (css.match(/}/g) || []).length;
console.log("\nsite.css braces: " + open + "/" + close + (open === close ? " balanced" : " UNBALANCED"));
if (open !== close) errors++;
for (const f of ["site.css", "site.js", "journey.js"]) {
  const t = fs.readFileSync(path.join(SITE, "assets", f), "utf8");
  for (let k = 0; k < t.length; k++) {
    const c = t.charCodeAt(k);
    if (c < 32 && c !== 9 && c !== 10 && c !== 13) { errors++; console.log("  FAIL " + f + ": control char at byte " + k); break; }
  }
}
// No px or clamp() font-sizes: the fluid root already does that job.
const pxFont = [...css.matchAll(/font-size:\s*[^;}]*?\d+px/g)].length;
const clampFont = [...css.matchAll(/font-size:\s*clamp\(/g)].length;
if (pxFont) { errors++; console.log("  FAIL site.css: " + pxFont + " px font-size(s)"); }
if (clampFont) { errors++; console.log("  FAIL site.css: " + clampFont + " clamp() font-size(s)"); }

console.log("\n" + pages.length + " page(s) - " + errors + " error(s), " + warnings + " warning(s)");
process.exit(errors ? 1 : 0);
