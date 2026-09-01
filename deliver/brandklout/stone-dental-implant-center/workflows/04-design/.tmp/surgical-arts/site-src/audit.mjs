// Static audit of ../final-site. Run after every build.
//
// Checks the things that are cheap to get wrong in a hand-built static site and
// expensive to notice later — a link to a page that was renamed, an image that
// was deleted, an aria-controls pointing at an id that no longer exists, an
// image with no alt text. None of it needs a browser.
//
// Usage: node audit.mjs        (exit code 1 if anything FAILs)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(SRC, "..", "final-site");

const pages = fs.readdirSync(SITE).filter((f) => f.endsWith(".html"));

// Comments are stripped before anything is scanned. The build carries a lot of
// them — the Results page keeps a full worked example of the case-card markup
// inside one — and a commented <img> is not an <img> the browser will ask for.
const load = (p) => fs.readFileSync(path.join(SITE, p), "utf8").replace(/<!--[\s\S]*?-->/g, "");
const fails = [];
const warns = [];
const fail = (p, m) => fails.push(`${p}: ${m}`);
const warn = (p, m) => warns.push(`${p}: ${m}`);

// id -> set, per page, so in-page anchors can be checked.
const idsByPage = {};
for (const p of pages) {
  const html = load(p);
  idsByPage[p] = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
}

for (const p of pages) {
  const html = load(p);

  // --- unresolved template tokens ---
  for (const m of new Set([...html.matchAll(/\{\{[A-Z_]+\}\}/g)].map((x) => x[0]))) {
    fail(p, `unresolved token ${m}`);
  }

  // --- links ---
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|tel:|data:|#)/.test(href)) {
      // In-page anchor: the id has to exist on this page.
      if (href.startsWith("#") && href.length > 1 && !idsByPage[p].has(href.slice(1))) {
        fail(p, `anchor ${href} has no matching id`);
      }
      continue;
    }
    const [file, hash] = href.split("#");
    if (!fs.existsSync(path.join(SITE, file))) {
      fail(p, `link target missing: ${file}`);
      continue;
    }
    if (hash && file.endsWith(".html") && !idsByPage[file]?.has(hash)) {
      fail(p, `link ${href} points at an id that does not exist in ${file}`);
    }
  }

  // --- images ---
  for (const m of html.matchAll(/<img\b([^>]*)>/g)) {
    const tag = m[1];
    const src = /src="([^"]+)"/.exec(tag)?.[1];
    if (!src) {
      fail(p, "img with no src");
      continue;
    }
    if (!/^https?:|^data:/.test(src) && !fs.existsSync(path.join(SITE, src))) {
      fail(p, `image missing on disk: ${src}`);
    }
    if (!/\salt="/.test(tag)) fail(p, `img has no alt: ${src}`);
    if (!/\sloading="lazy"/.test(tag) && !/fetchpriority="high"/.test(tag)) {
      warn(p, `img is neither lazy nor marked high priority: ${src}`);
    }
  }

  // --- css url() references ---
  // (the stylesheet is one bundle, checked once below)

  // --- aria-controls has to resolve ---
  for (const m of html.matchAll(/aria-controls="([^"]+)"/g)) {
    if (!idsByPage[p].has(m[1])) fail(p, `aria-controls="${m[1]}" has no matching id`);
  }

  // --- exactly one h1 ---
  const h1s = [...html.matchAll(/<h1\b/g)].length;
  if (h1s !== 1) fail(p, `${h1s} <h1> elements (expected exactly 1)`);

  // --- heading order: no jumps deeper than one level ---
  const levels = [...html.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      warn(p, `heading jumps h${levels[i - 1]} -> h${levels[i]}`);
    }
  }

  // --- every form control needs a label ---
  for (const m of html.matchAll(/<(input|select|textarea)\b([^>]*)>/g)) {
    const tag = m[2];
    const type = /type="([^"]+)"/.exec(tag)?.[1];
    if (type === "hidden" || type === "submit") continue;
    const id = /\sid="([^"]+)"/.exec(tag)?.[1];
    const labelled =
      /aria-label=/.test(tag) ||
      (id && new RegExp(`<label[^>]*for="${id}"`).test(html)) ||
      // the consent checkbox is wrapped by its own <label>
      /class="form_consent"/.test(html.slice(Math.max(0, m.index - 200), m.index));
    if (!labelled) fail(p, `<${m[1]}> is not labelled${id ? ` (id=${id})` : ""}`);
  }

  // --- external links that open in a new context need rel=noopener ---
  for (const m of html.matchAll(/<a\b([^>]*target="_blank"[^>]*)>/g)) {
    if (!/rel="[^"]*noopener/.test(m[1])) fail(p, "target=_blank without rel=noopener");
  }

  // --- lang and title ---
  if (!/<html lang="en">/.test(html)) fail(p, "missing lang on <html>");
  if (!/<title>.+<\/title>/.test(html)) fail(p, "missing <title>");
  const title = /<title>(.+)<\/title>/.exec(html)?.[1] ?? "";
  if (title.length > 65) warn(p, `title is ${title.length} chars (over 65)`);
  const desc = /name="description" content="([^"]*)"/.exec(html)?.[1] ?? "";
  if (!desc) fail(p, "missing meta description");
  else if (desc.length > 165) warn(p, `meta description is ${desc.length} chars (over 165)`);

  // --- JSON-LD has to parse ---
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch (e) {
      fail(p, `JSON-LD does not parse: ${e.message}`);
    }
  }

  // --- no inline styles: Client-First keeps presentation in classes ---
  const inline = [...html.matchAll(/\sstyle="[^"]+"/g)];
  if (inline.length) fail(p, `${inline.length} inline style attribute(s)`);
}

// --- the CSS bundle's own url() references ---
//
// A relative url() in a stylesheet resolves against the STYLESHEET, not against
// the site root, and site.css lives in assets/. This check used to resolve
// against SITE and so would have reported every correct relative reference as
// missing. It never fired before 2026-08-31 because no rule carried one; the
// journey layer's stone textures are the first, and they are written the way a
// browser reads them: url("tex-carrara.webp") beside site.css in assets/.
const CSS_DIR = path.join(SITE, "assets");
const css = fs.readFileSync(path.join(CSS_DIR, "site.css"), "utf8");
// Comments are stripped before scanning, for the same reason check-copy.mjs
// strips them: this bundle documents its own history, and a comment that says
// `this used to say url("assets/foo.jpg")` is a NOTE about a fixed bug, not a
// reference. Scanning the raw text reports the explanation of a bug as the bug.
const cssCode = css.replace(/\/\*[\s\S]*?\*\//g, "");
for (const m of cssCode.matchAll(/url\(["']?(?!data:|https?:)([^"')]+)["']?\)/g)) {
  const ref = m[1].split(/[?#]/)[0];
  const abs = ref.startsWith("/") ? path.join(SITE, ref) : path.join(CSS_DIR, ref);
  if (!fs.existsSync(abs)) fail("assets/site.css", `url() missing: ${m[1]}`);
}

// --- unused assets, so nothing ships that nothing points at ---
const allHtml = pages.map(load).join("");
for (const f of fs.readdirSync(path.join(SITE, "assets"))) {
  if (f === "site.css" || f === "site.js") continue;
  if (!allHtml.includes(f) && !cssCode.includes(f)) warn("assets", `${f} is not referenced anywhere`);
}

console.log(`audited ${pages.length} pages: ${pages.join(", ")}\n`);
if (fails.length) {
  console.log("FAIL");
  fails.forEach((f) => console.log("  " + f));
} else {
  console.log("FAIL  none");
}
console.log("");
if (warns.length) {
  console.log("WARN");
  warns.forEach((w) => console.log("  " + w));
} else {
  console.log("WARN  none");
}
process.exitCode = fails.length ? 1 : 0;
