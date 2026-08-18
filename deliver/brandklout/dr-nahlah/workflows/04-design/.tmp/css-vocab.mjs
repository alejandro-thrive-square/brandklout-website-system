// Class-vocabulary gate. Runs against the BUILT pages, because that is where the
// shell partials and the page bodies finally meet.
//
// Three rules, and each one is a defect this build actually shipped:
//
//   A. ONE NAME, ONE MEANING. `.head` was defined by four different chapters and
//      `.row` by three, kept apart only by a descendant selector while the markup
//      said plain `class="head"`. Webflow has no descendant scoping in its class
//      panel, so those arrive as one name with four conflicting definitions and
//      the Designer forks them into head, head-2, head-3 — which is exactly the
//      "duplicate and renamed classes" this build was criticised for.
//
//   B. NO DEAD CLASSES. A class on an element that no rule and no script reads
//      is either a typo or a leftover, and it will be carried into Webflow as a
//      real class either way.
//
//   C. A COMPONENT PART MUST WORK WHEREVER ITS COMPONENT GOES. If a rule is
//      written `.pk-card a.more`, then every `.more` has to sit inside a
//      `.pk-card` — otherwise it silently renders as body copy. Five did.
//      Scoping a part to its own container is fine, and it is what lets a whole
//      section move between pages; scoping it to a container it does not always
//      have is a bug waiting for someone to move the markup.
//
// Usage: node css-vocab.mjs [final-site]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(process.argv[2] || path.join(HERE, "final-site"));

/* Primitives every component is meant to share. */
const GLOBAL = new Set([
  "wrap", "no-rail", "section", "label", "chapter-tag",
  "btn", "btn-primary", "btn-ghost", "btn-dark", "brandmark", "magnetic", "sr-only",
]);
/* States, toggled from script. Always qualify another class, never stand alone. */
const STATE = /^is-[a-z0-9-]+$/;
/* Written by the GSAP runtime, not authored in the page. */
const RUNTIME = new Set(["wz-line", "wz-word", "wz-ready", "wz-kit"]);

// Classes owned by a third party, not by this package. They carry no rule here
// on purpose: the vendor's own script selects on them, and styling them from
// our stylesheet would be reaching inside somebody else's widget.
//   lc_reviews_widget - LeadConnector / ReputationHub review embed, added to the
//   home page's Chapter 07 on 2026-08-18. review-widget.js finds the iframe by
//   this class to size it to its content; drop it and the frame never resizes.
const VENDOR = new Set(["lc_reviews_widget"]);

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr"]);

const pages = fs.readdirSync(SITE).filter((f) => f.endsWith(".html"));
if (!pages.length) { console.error(`no pages in ${SITE} — run build-site.mjs first`); process.exit(1); }

const clean = (css) => css
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/@[a-z-]+[^{;]*\{/gi, "\n");

const declaredBy = new Map();     // class -> Set(component that declares it)
const needsAncestor = new Map();  // class -> array of alternative ancestor-class sets
const unqualified = new Set();    // class with at least one first-position rule
const usage = [];                 // { page, cls, ancestors:Set }

/* The CSS is one bundle now, assembled from site-src/css/*.css with a banner
   per source file, so "which component owns this rule" is answered by the
   banners rather than by guessing from the markup around a <style> block. */
{
  const bundlePath = path.join(SITE, "assets", "site.css");
  if (!fs.existsSync(bundlePath)) {
    console.error(`no ${bundlePath} — run build-site.mjs first`);
    process.exit(1);
  }
  const bundle = fs.readFileSync(bundlePath, "utf8");
  const parts = bundle.split(/\/\* ===== css\/([\w.-]+) ===== \*\//);
  // parts[0] is whatever preceded the first banner; then name, body, name, body…
  for (let i = 1; i < parts.length; i += 2) {
    const owner = parts[i].replace(/^\d+-/, "").replace(/\.css$/, "");
    collectCss(parts[i + 1], owner);
  }
}

/* One pass per page for the markup, carrying a real ancestor stack, because the
   question the third rule asks is about ancestry: does a class sit under the
   container its rule requires. */
for (const file of pages) {
  const html = fs.readFileSync(path.join(SITE, file), "utf8");
  const stack = [];

  const TOKEN = /<style[^>]*>([\s\S]*?)<\/style>|<script[^>]*>[\s\S]*?<\/script>|<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g;
  for (const t of html.matchAll(TOKEN)) {
    if (t[1] === undefined && t[3] === undefined) continue;   // script or comment
    // A page body should carry no CSS of its own any more; if one reappears,
    // attribute it to the page so a collision still gets reported.
    if (t[1] !== undefined) { collectCss(t[1], `(inline in ${file})`); continue; }
    const [, , closing, tag, attrs, selfClose] = t;
    const name = tag.toLowerCase();
    if (closing) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === name) { stack.length = i; break; }
      }
      continue;
    }
    const cm = /class="([^"]*)"/.exec(attrs);
    const classes = cm ? cm[1].split(/\s+/).filter(Boolean) : [];
    const ancestors = new Set();
    for (const f of stack) for (const c of f.classes) ancestors.add(c);
    for (const c of classes) usage.push({ page: file, cls: c, ancestors });
    if (!VOID.has(name) && !selfClose) stack.push({ tag: name, classes });
  }
}

function collectCss(css, owner) {
  {
    for (const r of clean(css).matchAll(/(^|[}\n])\s*([^{}@][^{}]*?)\{/g)) {
      if (/^\s*(from|to|\d+%)\s*$/.test(r[2])) continue;
      for (const one of r[2].split(",")) {
        const sel = one.trim();
        if (!sel) continue;
        const units = sel.split(/\s*[>+~]\s*|\s+/).filter(Boolean);
        units.forEach((unit, ui) => {
          const classes = [...unit.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)].map((x) => x[1]);
          for (const c of classes) {
            if (GLOBAL.has(c) || RUNTIME.has(c) || STATE.test(c)) continue;
            if (!declaredBy.has(c)) declaredBy.set(c, new Set());
            declaredBy.get(c).add(owner);
            if (ui === 0) { unqualified.add(c); continue; }
            // Ancestor classes this rule requires above `c`.
            const req = new Set();
            for (const prev of units.slice(0, ui)) {
              for (const p of [...prev.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)].map((x) => x[1])) {
                if (!STATE.test(p)) req.add(p);
              }
            }
            if (!req.size) return;                     // pure tag scoping
            if (!needsAncestor.has(c)) needsAncestor.set(c, []);
            needsAncestor.get(c).push(req);
          }
        });
      }
    }
  }

}

const fails = [];

// A. one name, one meaning
for (const [cls, owners] of declaredBy) {
  if (owners.size > 1) {
    fails.push(`A  .${cls} is defined in ${owners.size} different stylesheets (${[...owners].join(", ")}) — in Webflow that is one class with ${owners.size} conflicting definitions`);
  }
}

// B. no dead classes
const seenDead = new Set();
for (const u of usage) {
  if (declaredBy.has(u.cls) || GLOBAL.has(u.cls) || RUNTIME.has(u.cls) || VENDOR.has(u.cls) || STATE.test(u.cls)) continue;
  if (seenDead.has(u.cls)) continue;
  seenDead.add(u.cls);
  fails.push(`B  .${u.cls} is on elements (first seen in ${u.page}) but no rule and no known hook uses it`);
}

// C. a part must work wherever its component goes
const orphanCount = new Map();
const orphanWhere = new Map();
for (const u of usage) {
  if (unqualified.has(u.cls)) continue;              // has a rule of its own
  const alts = needsAncestor.get(u.cls);
  if (!alts) continue;
  const ok = alts.some((req) => [...req].every((r) => u.ancestors.has(r)));
  if (ok) continue;
  orphanCount.set(u.cls, (orphanCount.get(u.cls) || 0) + 1);
  if (!orphanWhere.has(u.cls)) orphanWhere.set(u.cls, u.page);
}
for (const [cls, n] of orphanCount) {
  const need = [...new Set(needsAncestor.get(cls).map((s) => [...s].map((x) => "." + x).join("")))];
  fails.push(`C  .${cls} is styled only under ${need.join(" or ")}, but ${n} use(s) have no such ancestor (e.g. ${orphanWhere.get(cls)}) — those render unstyled`);
}

const scoped = [...needsAncestor.keys()].filter((c) => !unqualified.has(c)).length;
if (fails.length) {
  console.log(`css-vocab: ${fails.length} problem(s) across ${declaredBy.size} class names in ${pages.length} pages\n`);
  for (const f of fails.sort()) console.log("  FAIL  " + f);
  process.exit(1);
}
console.log(`css-vocab: ${declaredBy.size} class names across ${pages.length} pages.`);
console.log(`  every name has one meaning, every class on an element is styled,`);
console.log(`  and all ${scoped} container-scoped parts sit inside their container everywhere they are used. OK`);
