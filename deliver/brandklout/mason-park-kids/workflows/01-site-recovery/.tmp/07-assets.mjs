// Step 7: collect the CSS, JS, images and fonts the pages reference — by
// copying those exact files off the server's disk, not by fetching them.
//
// WHY NOT HTTP
// ------------
// WordPress emits its asset URLs port-less (src="http://127.0.0.1/wp-includes/…")
// even with WP_HOME carrying the port, so wget's --page-requisites tries port 80,
// finds nothing listening inside the SSH jail, and gives up having downloaded not
// one stylesheet. Copying from disk sidesteps that entirely, and is better on
// three other counts: it is far faster, it never runs PHP, and it lets us state
// exactly which files crossed the wire.
//
// SAFETY
// ------
// This host is actively compromised, so the transfer is allow-listed by
// extension and every path is checked before it is requested:
//
//   * only css/js/images/fonts/media are ever asked for;
//   * anything executable (.php, .phtml, .htaccess, .sh, .cgi) is refused and
//     reported, even if a page references it;
//   * paths are normalised and required to stay under the docroot, so a
//     "../../.." in a URL cannot walk out of it;
//   * the docroot is read-only here — nothing is written to the site.
//
// Runs in passes: HTML references CSS, CSS references fonts and background
// images, and those stylesheets only exist locally after the first pass. It
// repeats until a pass finds nothing new.
//
//   node 07-assets.mjs [--max-passes 4] [--dry]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..", "..", "..", "..");
const MIRROR = path.join(HERE, "recovered", "mirror");
const DOCROOT = "www/pediatricdentistkatytx.com/public_html";

const argv = process.argv.slice(2);
const DRY = argv.includes("--dry");
const MAX_PASSES = Number(argv.includes("--max-passes") ? argv[argv.indexOf("--max-passes") + 1] : 4);

const ALLOWED = new Set([
  ".css", ".js", ".mjs", ".map",
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg", ".ico", ".cur", ".bmp",
  ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".mp4", ".webm", ".ogg", ".mp3", ".json", ".txt", ".xml",
]);
const FORBIDDEN = new Set([".php", ".phtml", ".php5", ".php7", ".phar", ".sh", ".cgi", ".pl", ".htaccess", ".zip", ".gz", ".tar", ".wpress", ".sql", ".bin", ".dat", ".exe"]);

if (!fs.existsSync(MIRROR)) {
  console.error("no recovered/mirror — run 05-mirror.sh and extract mirror.tar.gz first");
  process.exit(1);
}

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

// Pull every reference that could name a local file out of one document.
//
// `baseDir` is the document's own directory as a docroot-relative posix path,
// and it is what makes stylesheets work: almost every url() in a theme
// stylesheet is RELATIVE ("../fonts/fontello.woff2"), not root-relative. An
// earlier version only accepted paths starting with "/", so pass 2 reported
// "nothing new" while every icon font and background image was still missing.
function refsFrom(text, isCss, baseDir) {
  const found = new Set();
  const add = (u) => {
    if (!u) return;
    u = u.trim().replace(/^['"]|['"]$/g, "");
    if (!u || u.startsWith("//")) return;        // protocol-relative is external
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return;  // absolute scheme, or data:/mailto:
    if (u.startsWith("#")) return;
    const clean = u.split("?")[0].split("#")[0];
    if (!clean) return;
    found.add(clean.startsWith("/") ? clean : path.posix.join(baseDir, clean));
  };
  if (isCss) {
    for (const m of text.matchAll(/url\(\s*([^)]+?)\s*\)/gi)) add(m[1]);
    for (const m of text.matchAll(/@import\s+(?:url\()?\s*["']([^"']+)["']/gi)) add(m[1]);
  } else {
    for (const m of text.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) add(m[1]);
    for (const m of text.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi))
      m[1].split(",").forEach((c) => add(c.trim().split(/\s+/)[0]));
    for (const m of text.matchAll(/\b(?:data-src|data-lazy-src|data-bg|data-background)\s*=\s*["']([^"']+)["']/gi)) add(m[1]);
    for (const m of text.matchAll(/url\(\s*([^)]+?)\s*\)/gi)) add(m[1]); // inline <style>
  }
  return found;
}

const refused = [];
const outsideDocroot = [];

function classify(rel) {
  // Normalise and refuse anything that escapes the docroot or is executable.
  const norm = path.posix.normalize(rel);
  if (norm.startsWith("..") || norm.includes("/../")) { outsideDocroot.push(rel); return null; }
  const ext = path.posix.extname(norm).toLowerCase();
  if (FORBIDDEN.has(ext)) { refused.push(norm); return null; }
  if (!ALLOWED.has(ext)) return null;
  return norm.replace(/^\/+/, "");
}

const have = () => new Set(walk(MIRROR).map((f) => path.relative(MIRROR, f).replace(/\\/g, "/")));

// Connection details, read once. scp spells the port -P and ssh spells it -p,
// which is the only reason these are not one array.
const KEY = path.join(ROOT, ".secrets", "sg_pediatric_recovery");
const envText = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
const envGet = (k) => (envText.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim();
const PORT = envGet("PORT");
const HOSTSPEC = `${envGet("USERNAME")}@${envGet("HOSTNAME")}`;
const COMMON = ["-i", KEY, "-o", "IdentitiesOnly=yes", "-o", "StrictHostKeyChecking=accept-new"];
const scp = (a, b) => execFileSync("scp", [...COMMON, "-P", PORT, a, b], { stdio: "inherit" });
const ssh = (cmd) => execFileSync("ssh", [...COMMON, "-p", PORT, HOSTSPEC, cmd], { stdio: "inherit" });

let grandTotal = 0;
for (let pass = 1; pass <= MAX_PASSES; pass++) {
  const present = have();
  const wanted = new Set();

  for (const f of walk(MIRROR)) {
    const ext = path.extname(f).toLowerCase();
    if (ext !== ".html" && ext !== ".css") continue;
    // The document's own directory, docroot-relative — the base a relative
    // url() or src resolves against.
    const baseDir = "/" + path.relative(MIRROR, path.dirname(f)).replace(/\\/g, "/");
    const refs = refsFrom(fs.readFileSync(f, "utf8"), ext === ".css", baseDir);
    for (const r of refs) {
      const c = classify(r);
      if (c && !present.has(c)) wanted.add(c);
    }
  }

  console.log(`\npass ${pass}: ${wanted.size} referenced files not yet local`);
  if (!wanted.size) { console.log("nothing new — done"); break; }
  if (DRY) { [...wanted].slice(0, 40).forEach((w) => console.log("  " + w)); break; }

  const listFile = path.join(HERE, `asset-list-pass${pass}.txt`);
  fs.writeFileSync(listFile, [...wanted].join("\n") + "\n");

  // Ship the list up, tar exactly those paths out of the docroot, pull it back.
  // `tar -T` reads the file list, so there is no argument-length limit and no
  // shell globbing anywhere near a path that came out of a compromised page.
  scp(listFile, `${HOSTSPEC}:~/recovery-tmp/asset-list.txt`);

  const remote = [
    `cd ~/${DOCROOT}`,
    // Only paths that actually exist go into the tar; a stale reference is
    // reported rather than aborting the whole transfer.
    `grep -v '^$' ~/recovery-tmp/asset-list.txt | while read -r p; do [ -f "$p" ] && echo "$p"; done > ~/recovery-tmp/asset-have.txt`,
    `echo "  on disk: $(wc -l < ~/recovery-tmp/asset-have.txt) of $(wc -l < ~/recovery-tmp/asset-list.txt)"`,
    `tar czf ~/recovery-tmp/assets.tar.gz -T ~/recovery-tmp/asset-have.txt 2>/dev/null || true`,
  ].join(" && ");
  ssh(remote);

  const tgz = path.join(HERE, "recovered", `assets-pass${pass}.tar.gz`);
  scp(`${HOSTSPEC}:~/recovery-tmp/assets.tar.gz`, tgz);
  // Windows paths and MSYS tar do not mix. An absolute "C:\…" archive path is
  // read as a host:path remote spec ("Cannot connect to C: resolve failed"),
  // and passing one to -C gets its backslashes mangled into "C\:\\Users\\…".
  // Running from cwd with a RELATIVE archive name avoids both.
  //
  // --exclude takes a character class because a bare '?' is itself a glob
  // wildcard: "*?*" matches — and so excludes — every file in the archive.
  execFileSync("tar", ["xzf", path.posix.join("..", path.basename(tgz)), "--exclude=*[?]*"],
    { cwd: MIRROR, stdio: "inherit" });

  const after = have();
  const gained = after.size - present.size;
  grandTotal += gained;
  console.log(`pass ${pass}: +${gained} files (mirror now ${after.size})`);
  if (gained === 0) break;
}

console.log(`\ntotal files added: ${grandTotal}`);
if (refused.length) {
  console.log(`\nREFUSED ${refused.length} executable/archive references (never transferred):`);
  [...new Set(refused)].slice(0, 15).forEach((r) => console.log("  " + r));
}
if (outsideDocroot.length) {
  console.log(`\nREFUSED ${outsideDocroot.length} paths that tried to escape the docroot:`);
  [...new Set(outsideDocroot)].slice(0, 10).forEach((r) => console.log("  " + r));
}
fs.writeFileSync(
  path.join(HERE, "assets-report.json"),
  JSON.stringify({ collectedAt: new Date().toISOString(), added: grandTotal,
                   refusedExecutable: [...new Set(refused)],
                   refusedTraversal: [...new Set(outsideDocroot)] }, null, 2)
);
console.log("wrote assets-report.json");
