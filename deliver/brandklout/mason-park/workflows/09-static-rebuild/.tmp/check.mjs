// ===========================================================================
// THE GATE. Run it on the FILES IN home/, never on an intermediate.
//
// The lesson this workflow paid for twice: a pass that reports what it DID is
// not a gate. The prose ceiling reported "42 paragraphs folded" while
// /services/what-is-tmj/ still rendered a 404 word wall, and the fluid root
// reported success while --t-disp sat at its 1440 value on a 360 phone. Both
// were only visible in the OUTPUT. So everything here reads the shipped HTML
// and the shipped CSS off disk and nothing here trusts a build log.
//
//   node .tmp/check.mjs                 # every page under home/
//   node .tmp/check.mjs home/services/invisalign/index.html
//
// WHAT IT CHECKS
//   1. every src / srcset / href into assets/ resolves on disk, from THAT
//      page's own directory (a nested page climbs two folders, and the whole
//      point of relative paths is that file:// has no server to forgive a miss)
//   2. site.css braces balance
//   3. no control characters in the html, js or css -- see README, a backslash
//      escape written through a heredoc becomes a real control byte, the file
//      still parses, and the regex holding it silently matches nothing
//   4. no <script type="module"> and no fetch(): Instatic stores a body
//   5. DESIGN-STANDARD.md "No wall of text": no unbroken run of <p> over the
//      ceiling. Measured with ONE implementation, on the rendered markup. A
//      second implementation of the measurement is how a win got hidden once.
//   6. every id is unique, and every in-page #anchor resolves
//   7. every img carries a non-empty alt
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, "..", "home");

// The ceiling is on the RUN, not the section. 110 is the rule; the folder
// declines a tail under 45 words, so a run that legitimately survives the fold
// can reach 155. Over 155 is a wall and nothing in the system produced it.
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
    if (!/assets\//.test(ref) || /^https?:/.test(ref)) continue;
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
  // EVERY container that can hold running prose, not just `lf-section`.
  // When the service page moved from prose sections to cards and overlap
  // panels this check silently reported "0 words" for a page that still had
  // two-paragraph panels on it -- a gate that stops matching reports a PASS,
  // which is the same failure the Elementor wrapper caused in the first place.
  // Add the container here whenever a new one is introduced.
  //
  // `lf-more-in` is deliberately NOT here. The ceiling is on what the reader is
  // SHOWN, and the whole point of the fold is that a closed <details> shows
  // nothing. Counting inside one would fail the page for applying the fix.
  const HOLDERS = [
    /<section class="lf-section"[^>]*id="([^"]*)"[\s\S]*?<\/section>/g,
    /<div class="svc-overlap_panel"[\s\S]*?<\/div>\s*<\/div>/g,
  ];
  let worst = 0, worstAt = "";
  for (const re of HOLDERS)
  for (const sec of html.matchAll(re)) {
    let run = 0;
    for (const part of sec[0].split(/(<p\b[^>]*>[\s\S]*?<\/p>)/)) {
      if (/^<p\b/.test(part)) {
        // a lead-in is a label for the list under it, not a paragraph of prose
        run += /class="lf-lead"/.test(part) ? 0 : words(part);
        if (run > worst) { worst = run; worstAt = sec[1] || "panel"; }
      } else if (stripTags(part).trim() || /<(ul|ol|figure|details|table|h[2-6]|blockquote)/.test(part)) {
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
  console.log("  images: " + imgs + " on the page, " +
    ((inMain.match(/<img\b/g) || []).length) + " inside <main>");
  if (noAlt) warn(rel, noAlt + " image(s) with an empty alt and no aria-hidden");
}

// ---- 2. the stylesheet, once
const css = fs.readFileSync(path.join(SITE, "assets", "site.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const open = (css.match(/{/g) || []).length, close = (css.match(/}/g) || []).length;
console.log("\nsite.css braces: " + open + "/" + close + (open === close ? " balanced" : " UNBALANCED"));
if (open !== close) errors++;

console.log("\n" + pages.length + " page(s) - " + errors + " error(s), " + warnings + " warning(s)");
process.exit(errors ? 1 : 0);
