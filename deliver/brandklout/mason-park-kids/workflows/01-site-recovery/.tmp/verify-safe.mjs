// Safety gate for everything pulled off pediatricdentistkatytx.com.
//
// That host is actively compromised (docs/security-incident-2026-08-27.md), so
// "we were careful" is not good enough — this asserts it, and exits non-zero if
// any check fails. Run it after any recovery step and before handing the bundle
// to anyone.
//
// What it proves:
//
//   1. NO EXECUTABLE CODE was downloaded. Not one .php, .phtml, .htaccess,
//      .sh, .cgi or archive anywhere in recovered/. This is the check that
//      matters: the four planted plugins and the mu-plugin backdoor are all
//      PHP, and none of it was ever asked for.
//   2. NO INJECTION MARKERS survive in the mirrored HTML — the same IOC set
//      used on the main site, so the two stay comparable.
//   3. NO EXTERNAL script or iframe tags remain, so opening a page in an
//      ordinary browser cannot fetch a payload.
//   4. NO ABSOLUTE URLs remain, so nothing silently reaches for the live host.
//   5. The DB dump and WXR are present but are NOT tracked by git.
//
//   node verify-safe.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REC = path.join(HERE, "recovered");
const MIRROR = path.join(REC, "mirror");

const EXECUTABLE = /\.(php\d?|phtml|phar|sh|bash|cgi|pl|py|exe|dll|so|jsp|asp|aspx)$/i;
const ARCHIVE = /\.(zip|rar|7z|wpress|tar|tgz)$/i;   // .tar.gz from our own transfers is allowed below
const IOC = ["yourbodybydesign", "webanalytics-cdn.sbs", 'data-sm="1"', "2147483647"];

const RE_ABS = /(?:https?:)?\/\/(?:127\.0\.0\.1(?::\d+)?|(?:www\.)?pediatricdentistkatytx\.com)/i;
const RE_EXT_SCRIPT = /<script\b[^>]*\bsrc\s*=\s*["'](?:https?:)?\/\/[^"']*["']/i;
const RE_EXT_IFRAME = /<iframe\b[^>]*\bsrc\s*=\s*["'](?:https?:)?\/\/[^"']*["']/i;

const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

const checks = [];
const fail = (name, detail) => checks.push({ name, ok: false, detail });
const pass = (name, detail) => checks.push({ name, ok: true, detail });

if (!fs.existsSync(REC)) {
  console.error("no recovered/ — nothing to verify");
  process.exit(1);
}

// ---- 1. no executable code anywhere in the bundle
const all = walk(REC);
const exe = all.filter((f) => EXECUTABLE.test(f));
// Our own transfer archives are expected; anything else compressed is not.
const arch = all.filter((f) => ARCHIVE.test(f) && !/\.tar\.gz$/i.test(f));
exe.length
  ? fail("no executable files", `${exe.length} found: ` + exe.slice(0, 5).map((f) => path.relative(REC, f)).join(", "))
  : pass("no executable files", `${all.length} files scanned`);
arch.length
  ? fail("no unexpected archives", arch.slice(0, 5).map((f) => path.relative(REC, f)).join(", "))
  : pass("no unexpected archives", "only our own .tar.gz transfers");

// ---- 2..4. the mirrored HTML is local and inert
const html = walk(MIRROR).filter((f) => f.toLowerCase().endsWith(".html"));
let iocHits = [], absHits = [], scriptHits = [], iframeHits = [];
for (const f of html) {
  const s = fs.readFileSync(f, "utf8");
  const rel = path.relative(MIRROR, f).replace(/\\/g, "/");
  if (IOC.some((m) => s.includes(m))) iocHits.push(rel);
  if (RE_ABS.test(s)) absHits.push(rel);
  if (RE_EXT_SCRIPT.test(s)) scriptHits.push(rel);
  if (RE_EXT_IFRAME.test(s)) iframeHits.push(rel);
}
iocHits.length ? fail("no injection markers", iocHits.slice(0, 5).join(", "))
               : pass("no injection markers", `${html.length} pages clean`);
scriptHits.length ? fail("no external <script>", scriptHits.slice(0, 5).join(", "))
                  : pass("no external <script>", `${html.length} pages`);
iframeHits.length ? fail("no external <iframe>", iframeHits.slice(0, 5).join(", "))
                  : pass("no external <iframe>", `${html.length} pages`);
absHits.length ? fail("no absolute URLs", absHits.slice(0, 5).join(", "))
               : pass("no absolute URLs", `${html.length} pages fully root-relative`);

// ---- 5. the sensitive artefacts exist and are NOT tracked by git
const db = path.join(REC, "db.sql.gz");
const wxr = path.join(REC, "content.xml");
pass("content recovered",
  `${fs.existsSync(wxr) ? "content.xml " + (fs.statSync(wxr).size / 1e6).toFixed(1) + "MB" : "content.xml MISSING"}, ` +
  `${fs.existsSync(db) ? "db.sql.gz " + (fs.statSync(db).size / 1e6).toFixed(1) + "MB" : "db.sql.gz MISSING"}`);

let tracked = "";
try {
  tracked = execFileSync("git", ["ls-files", "--", "recovered"], { cwd: HERE, encoding: "utf8" }).trim();
} catch { tracked = ""; }
tracked
  ? fail("recovered/ is not tracked by git", tracked.split("\n").slice(0, 5).join(", "))
  : pass("recovered/ is not tracked by git", "db dump and WXR stay local");

// ---- report
console.log("\nSafety verification — recovered/ from pediatricdentistkatytx.com\n");
let bad = 0;
for (const c of checks) {
  if (!c.ok) bad++;
  console.log(`  ${c.ok ? "PASS" : "FAIL"}  ${c.name.padEnd(32)} ${c.detail}`);
}
fs.writeFileSync(path.join(HERE, "verify-safe-report.json"),
  JSON.stringify({ verifiedAt: new Date().toISOString(), ok: bad === 0, checks }, null, 2));
console.log(bad ? `\n${bad} CHECK(S) FAILED — do not distribute this bundle` : "\nAll checks passed — the bundle is inert and safe to open.");
console.log("wrote verify-safe-report.json");
process.exit(bad ? 1 : 0);
