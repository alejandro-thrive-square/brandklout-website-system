// Step 6: make the downloaded mirror local, offline and inert.
//
// Everything in recovered/mirror/ came off a WordPress install that is actively
// compromised, so this step does two jobs at once and both matter.
//
// 1. MAKE IT LOCAL. The pages arrive with absolute http://127.0.0.1:<port>/
//    URLs (from WP_HOME during the fetch) plus the ~66 per page that were typed
//    into post content or baked into Elementor/RankMath JSON and still point at
//    the live domain. Left alone, the first set breaks the moment the port
//    changes and the second set reaches out to the public internet — straight
//    into SiteGround's redirect. Both become root-relative here.
//
//    This runs locally rather than as a PHP output filter on the server on
//    purpose. The server-side version only fired while a page-cache drop-in
//    happened to be flushing the buffer chain; when that was disabled it
//    silently stopped, and the visible symptom was 39 of 40 pages rendering as
//    blank stubs because Chrome blocks parsing on a <script src> it cannot
//    fetch. Here the rewriting is deterministic and every count is reported.
//
// 2. MAKE IT INERT. Third-party <script> and <iframe> tags are removed
//    outright. The injected loaders on this site build their payload at runtime
//    from a remote host, so with those tags gone the saved copy cannot do
//    anything even if someone opens it in an ordinary browser with a live
//    network. Local scripts are KEPT — the theme needs them to lay the page out,
//    and 07-shoot.mjs runs them with every external host blackholed.
//
// Writes in place and reports what changed. Idempotent: safe to re-run.
//
//   node 06-sanitize.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIRROR = path.join(HERE, "recovered", "mirror");
const DRY = process.argv.includes("--dry");

if (!fs.existsSync(MIRROR)) {
  console.error("no recovered/mirror — run 05-mirror.sh, pull mirror.tar.gz and extract it first");
  process.exit(1);
}

// Hosts whose script/iframe tags are stripped. Everything not served from the
// mirror itself is third-party by definition, so this is a catch-all rather
// than a list of known-bad domains — naming only the malware hosts would leave
// the analytics and tag-manager tags that can inject arbitrary script later.
const IOC_MARKERS = [
  "yourbodybydesign", "webanalytics-cdn.sbs", '[data-sm="1"]', "2147483647",
];

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

const files = walk(MIRROR);
const htmlFiles = files.filter((f) => f.toLowerCase().endsWith(".html"));
const cssFiles = files.filter((f) => f.toLowerCase().endsWith(".css"));

// Any http(s)://127.0.0.1[:port] — the port varies per mirror run, and the
// port-less form shows up too because something in the stack rebuilds asset
// URLs from SERVER_NAME instead of home_url().
const RE_LOOPBACK = /(?:https?:)?\/\/127\.0\.0\.1(?::\d+)?/gi;
const RE_LOOPBACK_ESC = /(?:https?:)?\\\/\\\/127\.0\.0\.1(?::\d+)?/gi;
const RE_DOMAIN = /(?:https?:)?\/\/(?:www\.)?pediatricdentistkatytx\.com/gi;
const RE_DOMAIN_ESC = /(?:https?:)?\\\/\\\/(?:www\.)?pediatricdentistkatytx\.com/gi;

// A <script src> or <iframe src> pointing anywhere other than this mirror.
// Root-relative and relative srcs are local and are left alone.
const RE_EXT_SCRIPT = /<script\b[^>]*\bsrc\s*=\s*["'](?:https?:)?\/\/[^"']*["'][^>]*>\s*<\/script>/gi;
const RE_EXT_IFRAME = /<iframe\b[^>]*\bsrc\s*=\s*["'](?:https?:)?\/\/[^"']*["'][\s\S]*?<\/iframe>/gi;
const RE_EXT_IFRAME_SELF = /<iframe\b[^>]*\bsrc\s*=\s*["'](?:https?:)?\/\/[^"']*["'][^>]*\/>/gi;

const totals = {
  loopback: 0, domain: 0, extScripts: 0, extIframes: 0,
  cssLoopback: 0, cssDomain: 0, iocBefore: 0, iocAfter: 0,
};
const perFile = [];

for (const f of htmlFiles) {
  const before = fs.readFileSync(f, "utf8");
  let s = before;

  totals.iocBefore += IOC_MARKERS.reduce((n, m) => n + (s.split(m).length - 1), 0);

  // Escaped-slash forms first: their bodies contain the plain forms, so doing
  // the plain ones first would leave "https:\/\/" fragments behind.
  const cEsc = (s.match(RE_DOMAIN_ESC) || []).length + (s.match(RE_LOOPBACK_ESC) || []).length;
  s = s.replace(RE_DOMAIN_ESC, "").replace(RE_LOOPBACK_ESC, "");

  const cLoop = (s.match(RE_LOOPBACK) || []).length;
  const cDom = (s.match(RE_DOMAIN) || []).length;
  s = s.replace(RE_LOOPBACK, "").replace(RE_DOMAIN, "");

  const nScript = (s.match(RE_EXT_SCRIPT) || []).length;
  const nIframe = (s.match(RE_EXT_IFRAME) || []).length + (s.match(RE_EXT_IFRAME_SELF) || []).length;
  s = s
    .replace(RE_EXT_SCRIPT, "<!-- external script removed by 06-sanitize.mjs -->")
    .replace(RE_EXT_IFRAME, "<!-- external iframe removed by 06-sanitize.mjs -->")
    .replace(RE_EXT_IFRAME_SELF, "<!-- external iframe removed by 06-sanitize.mjs -->");

  totals.loopback += cLoop + cEsc;
  totals.domain += cDom;
  totals.extScripts += nScript;
  totals.extIframes += nIframe;
  totals.iocAfter += IOC_MARKERS.reduce((n, m) => n + (s.split(m).length - 1), 0);

  if (s !== before) {
    if (!DRY) fs.writeFileSync(f, s);
    perFile.push({
      file: path.relative(MIRROR, f).replace(/\\/g, "/"),
      loopback: cLoop + cEsc, domain: cDom, extScripts: nScript, extIframes: nIframe,
    });
  }
}

// Stylesheets carry url() references and @import, with the same absolute forms.
for (const f of cssFiles) {
  const before = fs.readFileSync(f, "utf8");
  const cLoop = (before.match(RE_LOOPBACK) || []).length;
  const cDom = (before.match(RE_DOMAIN) || []).length;
  if (!cLoop && !cDom) continue;
  const s = before.replace(RE_LOOPBACK, "").replace(RE_DOMAIN, "");
  if (!DRY) fs.writeFileSync(f, s);
  totals.cssLoopback += cLoop;
  totals.cssDomain += cDom;
}

const report = {
  sanitizedAt: new Date().toISOString(),
  dryRun: DRY,
  htmlFiles: htmlFiles.length,
  cssFiles: cssFiles.length,
  totals,
  changedFiles: perFile.length,
  perFile: perFile.slice(0, 60),
};
fs.writeFileSync(path.join(HERE, "sanitize-report.json"), JSON.stringify(report, null, 2));

console.log(DRY ? "DRY RUN — nothing written\n" : "");
console.log(`html files            : ${htmlFiles.length}`);
console.log(`css files             : ${cssFiles.length}`);
console.log(`loopback URLs rewritten: ${totals.loopback}  (+${totals.cssLoopback} in css)`);
console.log(`live-domain rewritten  : ${totals.domain}  (+${totals.cssDomain} in css)`);
console.log(`external <script> gone : ${totals.extScripts}`);
console.log(`external <iframe> gone : ${totals.extIframes}`);
console.log(`IOC markers before/after: ${totals.iocBefore} / ${totals.iocAfter}`);
console.log(`files changed          : ${perFile.length}`);

// Re-scan to prove the job is actually done rather than merely attempted.
let stillAbsolute = 0;
for (const f of htmlFiles) {
  const s = fs.readFileSync(f, "utf8");
  if (RE_LOOPBACK.test(s) || RE_DOMAIN.test(s)) stillAbsolute++;
  RE_LOOPBACK.lastIndex = 0;
  RE_DOMAIN.lastIndex = 0;
}
console.log(
  stillAbsolute
    ? `\n!! ${stillAbsolute} html files still contain absolute URLs`
    : "\nverified: no absolute loopback or live-domain URLs remain in any page"
);
console.log("wrote sanitize-report.json");
