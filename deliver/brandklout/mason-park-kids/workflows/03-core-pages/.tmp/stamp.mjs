// ===========================================================================
// THE CHROME IS CONSTANT. This keeps it so.
//
//   node .tmp/stamp.mjs            # re-stamp every page from the homepage's chrome
//   node .tmp/stamp.mjs --check    # report which pages differ, change nothing
//
// `home/index.html` is the ONLY source of the chrome: the head (minus the
// per-page lines), the top line, the masthead, the footer, the call bar and
// the five script tags. Every other `home/**/index.html` keeps its own
// <title>, description, canonical, og:* tags, robots, JSON-LD, body class and
// its whole <main>, and gets everything else from the homepage, with the
// asset prefix rewritten for its depth.
//
// So: to change one page, edit its <main>. To change the chrome on every page,
// edit the homepage and run this. There is one source for each, and
// check.mjs fails a page whose chrome has drifted.
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, "..", "home");
const CHECK = process.argv.includes("--check");

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);

const home = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
const [homeHead, homeRest] = home.split(/(?=<body)/);
const homeBefore = homeRest.split("<main")[0];
// Everything AFTER the closing tag. The page's own <main> keeps its closing
// tag; splitting it off here and re-adding it once ate the tag on the first
// run, and every stamped page lost its footer to the check gate.
const homeAfter = homeRest.split("</main>")[1];

// The per-page head lines, in the order they sit in the homepage's head.
const PER_PAGE = [
  /<title>[\s\S]*?<\/title>/,
  /<meta name="description"[^>]*>/,
  /<meta name="robots"[^>]*>/,
  /<link rel="canonical"[^>]*>/,
  /<meta property="og:type"[^>]*>/,
  /<meta property="og:site_name"[^>]*>/,
  /<meta property="og:title"[^>]*>/,
  /<meta property="og:description"[^>]*>/,
  /<meta property="og:url"[^>]*>/,
  /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
];

function stamp(file) {
  const depth = path.relative(SITE, path.dirname(file)).split(path.sep).filter(Boolean).length;
  const prefix = "../".repeat(depth);
  const html = fs.readFileSync(file, "utf8");
  const own = {};
  for (const re of PER_PAGE) { const m = html.match(re); if (m) own[re.source] = m[0]; }
  const bodyClass = (html.match(/<body class="([^"]*)">/) || [, ""])[1];
  if (!html.includes("</main>")) throw new Error(file + " has no </main>; refusing to stamp a page whose body cannot be found");
  const main = "<main" + html.split("<main")[1].split("</main>")[0] + "</main>";

  let head = homeHead;
  for (const re of PER_PAGE) {
    const mine = own[re.source];
    if (mine) head = head.replace(re, mine.replace(/\$/g, "$$$$"));
    else head = head.replace(re, "");
  }
  head = head.replace(/\n{3,}/g, "\n\n");
  let before = homeBefore.replace(/<body class="[^"]*">/, '<body class="' + bodyClass + '">').replace(/<body>/, '<body class="' + bodyClass + '">');
  if (!bodyClass) before = before.replace(/<body class="">/, "<body>");
  const out = (head + before + main + homeAfter)
    .replace(/(src|href)="assets\//g, "$1=\"" + prefix + "assets/")
    .replace(/srcset="assets\//g, 'srcset="' + prefix + "assets/")
    .replace(/, assets\//g, ", " + prefix + "assets/");
  // Only the chrome is rewritten: <main> was authored with its own prefix, so
  // put its original back verbatim.
  const final = out.replace(/<main[\s\S]*?<\/main>/, () => main);
  return { final, changed: final !== html };
}

let changed = 0;
for (const file of walk(SITE).filter((f) => f.endsWith("index.html"))) {
  if (path.resolve(file) === path.resolve(SITE, "index.html")) continue;
  const rel = path.relative(SITE, file).split(path.sep).join("/");
  const { final, changed: diff } = stamp(file);
  if (diff) {
    changed++;
    if (CHECK) console.log("  differs: " + rel);
    else { fs.writeFileSync(file, final); console.log("  stamped: " + rel); }
  }
}
console.log((CHECK ? changed + " page(s) differ" : changed + " page(s) stamped") + " from the homepage chrome");
process.exit(CHECK && changed ? 1 : 0);
