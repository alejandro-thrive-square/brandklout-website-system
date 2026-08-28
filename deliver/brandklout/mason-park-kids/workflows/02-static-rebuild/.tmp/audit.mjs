// Static QA gate for dist/. Runs on the built HTML, no browser needed.
//
//   node audit.mjs
//
// Checks, in order of how badly each one would embarrass the practice:
//   1. leftover theme demo content (lorem ipsum, the fabricated award table)
//   2. internal links that go nowhere
//   3. <img src> that is not on disk
//   4. pages with no <h1>, a junk <h1>, or a duplicate <h1>
//   5. missing <title> / meta description, and duplicates of either
//   6. pages nothing links to
//   7. any surviving reference to the compromised WordPress host or the malware
//   8. accessibility: alt text, heading order, link and control names
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);

const files = walk(DIST);
const pages = files.filter((f) => f.endsWith(".html"));
const routeOf = (f) => {
  const rel = path.relative(DIST, f).split(path.sep).join("/");
  return rel === "404.html" ? "/404.html" : "/" + rel.replace(/index\.html$/, "");
};
const known = new Set(pages.map(routeOf));
const onDisk = new Set(files.map((f) => "/" + path.relative(DIST, f).split(path.sep).join("/")));

const problems = [];
const flag = (level, route, msg) => problems.push({ level, route, msg });

const DEMO = [
  /lorem ipsum/i, /dicta sunt explicabo/i, /nemo enim ipsam/i,
  /adipiscing elit/i, /eusmod tempor/i, /consectetur adipiscing/i,
  /top dental clinic/i, /best dental practice/i, /silver pack/i,
];
const MALWARE = [
  /yourbodybydesign/i, /webanalytics-cdn\.sbs/i, /data-sm=/i, /2147483647/,
  /0x08207B087F61d7e95E441E15fd6d40BEfd6eD308/i, /charCodeAt/,
];

const EXPECTED_THIN = new Set(["/404.html", "/thank-you/"]);

// Every class the stylesheet actually defines. A class in the markup that is not
// in here is styled by nothing - which is how a whole page can render unstyled
// with no error anywhere, exactly what happened when the vocabulary moved to
// Client-First and the page templates still named the old classes.
const cssText = fs.readFileSync(path.join(DIST, "assets", "site.css"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");
const definedClasses = new Set([...cssText.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
// Utility prefixes generated per page (spacer sizes etc.) are all literal, so
// nothing has to be allow-listed; anything missing is a genuine orphan.
const unknownClasses = new Map();
const titles = new Map();
const descs = new Map();
const linkedTo = new Set(["/"]);

for (const file of pages) {
  const route = routeOf(file);
  const html = fs.readFileSync(file, "utf8");
  const main = (html.match(/<main id="main">([\s\S]*?)<\/main>/) || [, html])[1];
  const text = main.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

  for (const re of MALWARE) if (re.test(html)) flag("BLOCKER", route, `malware marker present: ${re}`);
  for (const re of DEMO) if (re.test(text)) flag("BLOCKER", route, `theme demo content survived: ${re}`);
  if (/bestdentistinkatytx\.com\/wp-content/.test(html)) flag("ERROR", route, "still points at the compromised host for an asset");

  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => m[1].replace(/<[^>]+>/g, "").trim());
  if (!h1s.length) flag("ERROR", route, "no <h1>");
  else if (h1s.length > 1) flag("WARN", route, `${h1s.length} <h1> elements: ${h1s.join(" / ")}`);
  else if (h1s[0].length < 3) flag("ERROR", route, `<h1> too short: "${h1s[0]}"`);
  else if (/dental news in katy|professional team|403|forbidden/i.test(h1s[0])) flag("ERROR", route, `<h1> looks wrong: "${h1s[0]}"`);

  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [, ""])[1].trim();
  if (!title) flag("ERROR", route, "no <title>");
  else {
    if (!titles.has(title)) titles.set(title, []);
    titles.get(title).push(route);
  }
  const desc = (html.match(/<meta name="description" content="([^"]*)"/i) || [, ""])[1].trim();
  if (!desc) flag("WARN", route, "no meta description");
  else {
    if (!descs.has(desc)) descs.set(desc, []);
    descs.get(desc).push(route);
  }

  // ------------------------------------------------------------ accessibility
  // A dental practice's site is a place people book healthcare. These are the
  // faults that actually stop a screen-reader user completing that.
  for (const tag of html.match(/<img[^>]*>/g) || []) {
    const alt = tag.match(/\salt="([^"]*)"/);
    const decorative = /aria-hidden="true"/.test(tag);
    if (!alt) flag("ERROR", route, `<img> with no alt attribute: ${(tag.match(/src="([^"]+)"/) || [, "?"])[1].slice(-60)}`);
    else if (!alt[1].trim() && !decorative) {
      flag("WARN", route, `<img> with empty alt and no aria-hidden: ${(tag.match(/src="([^"]+)"/) || [, "?"])[1].slice(-60)}`);
    }
  }

  // Heading order: skipping a level (h2 straight to h4) breaks the outline a
  // screen reader navigates by.
  const levels = [...html.matchAll(/<h([1-6])[^>]*>/g)].map((m) => Number(m[1]));
  let prev = 0;
  for (const lv of levels) {
    if (prev && lv > prev + 1) { flag("WARN", route, `heading order skips h${prev} -> h${lv}`); break; }
    prev = lv;
  }

  // A link or control with no text and no label is unreachable by name.
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    const [, attrs, inner] = m;
    const text = inner.replace(/<[^>]+>/g, "").trim();
    const labelled = /aria-label="[^"]+"/.test(attrs) || /aria-labelledby="/.test(attrs);
    const hasImgAlt = /<img[^>]+alt="[^"]+"/.test(inner);
    if (!text && !labelled && !hasImgAlt) {
      flag("ERROR", route, `link with no accessible name: ${(attrs.match(/href="([^"]+)"/) || [, "?"])[1].slice(0, 60)}`);
    }
  }
  for (const m of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const [, attrs, inner] = m;
    const text = inner.replace(/<[^>]+>/g, "").trim();
    if (!text && !/aria-label="[^"]+"/.test(attrs) && !/aria-hidden="true"/.test(attrs)) {
      flag("ERROR", route, "button with no accessible name");
    }
  }
  // An iframe with no title is an unlabelled region.
  for (const tag of html.match(/<iframe[^>]*>/g) || []) {
    if (!/\stitle="[^"]+"/.test(tag)) flag("WARN", route, "<iframe> with no title");
  }
  if (!/<html[^>]+lang="/.test(html)) flag("ERROR", route, "<html> has no lang attribute");

  for (const m of html.matchAll(/class="([^"]+)"/g)) {
    for (const cls of m[1].trim().split(/\s+/)) {
      if (!cls || definedClasses.has(cls)) continue;
      // Client-First names every section (section_hero, section_footer) purely
      // so it can be found in the builder. Those carry no styles by design.
      if (cls.startsWith("section_")) continue;
      if (!unknownClasses.has(cls)) unknownClasses.set(cls, new Set());
      unknownClasses.get(cls).add(route);
    }
  }

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words < 60 && !EXPECTED_THIN.has(route)) flag("WARN", route, `thin page: ${words} words of body copy`);

  for (const m of html.matchAll(/<img[^>]+src="([^"]+)"/gi)) {
    const src = m[1];
    if (!src.startsWith("/")) {
      // Hotlinked from someone else's server: breaks when they change it, and on
      // this site it is the SIBLING PRACTICE's domain. See README, open items.
      const host = (src.match(/^(?:https?:)?\/\/([^/]+)/) || [])[1];
      if (host) flag("WARN", route, `image hotlinked from ${host}: ${src.slice(0, 90)}`);
      continue;
    }
    if (!onDisk.has(src)) flag("ERROR", route, `image not on disk: ${src}`);
  }
  for (const m of html.matchAll(/<(?:a|link)[^>]+href="([^"]+)"/gi)) {
    const href = m[1].split("#")[0].split("?")[0];
    if (!href.startsWith("/")) continue;
    if (onDisk.has(href)) continue;
    const withSlash = href.endsWith("/") ? href : href + "/";
    if (known.has(withSlash)) { linkedTo.add(withSlash); continue; }
    flag("ERROR", route, `dead internal link: ${href}`);
  }
}

for (const [title, routes] of titles) if (routes.length > 1) flag("WARN", routes[0], `<title> duplicated on ${routes.length} pages: "${title}" (${routes.join(", ")})`);
for (const [desc, routes] of descs) if (routes.length > 1) flag("WARN", routes[0], `meta description duplicated on ${routes.length} pages (${routes.slice(0, 4).join(", ")}${routes.length > 4 ? ", …" : ""})`);
// Deliberately unlinked: the 404 page, and the thank-you page a form redirects to.
const EXPECTED_ORPHANS = new Set(["/", "/404.html", "/thank-you/"]);
for (const route of known) {
  if (EXPECTED_ORPHANS.has(route)) continue;
  if (!linkedTo.has(route)) flag("WARN", route, "orphan: nothing on the site links here");
}

for (const [cls, routes] of unknownClasses) {
  flag("ERROR", [...routes][0], `class "${cls}" is styled by nothing (${routes.size} page(s))`);
}

const order = { BLOCKER: 0, ERROR: 1, WARN: 2 };
problems.sort((a, b) => order[a.level] - order[b.level] || a.route.localeCompare(b.route));
const counts = problems.reduce((a, p) => ((a[p.level] = (a[p.level] || 0) + 1), a), {});

for (const p of problems) console.log(`${p.level.padEnd(8)} ${p.route.padEnd(38)} ${p.msg}`);
console.log(`\n${pages.length} pages audited - ` +
  `${counts.BLOCKER || 0} blockers, ${counts.ERROR || 0} errors, ${counts.WARN || 0} warnings`);
fs.writeFileSync(path.join(HERE, "audit-report.json"), JSON.stringify({ pages: pages.length, counts, problems }, null, 1));
process.exit(counts.BLOCKER || counts.ERROR ? 1 : 0);
