/**
 * VERIFY: compare a Webflow staging page against the Vercel design (source of
 * truth) on desktop + mobile, with zero login (staging is public).
 *
 * You paste + publish manually, then:
 *   node verify.mjs <staging-url> [design-url]
 * e.g.
 *   node verify.mjs https://[client-name].webflow.io/invest
 *
 * If [design-url] is omitted it's derived by swapping the staging host for the
 * Vercel design host, keeping the same path.
 *
 * For each breakpoint it:
 *   - loads the page, auto-scrolls to trigger every IntersectionObserver reveal,
 *   - runs the SAME fingerprint JS that `wf_tools.py compare` prints (single
 *     source of truth — no duplicated logic here),
 *   - captures console/page errors and a full-page screenshot,
 *   - then runs `wf_tools.py compare --diff design.json staging.json`.
 *
 * Artifacts land in .tmp/verify/<page>/ so the screenshots can be reviewed.
 */
import { chromium } from "playwright";
import { execFileSync, spawn } from "node:child_process";
import path from "node:path";
import url from "node:url";
import fs from "node:fs";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
// Source of truth = the client-approved local design package.
const DESIGN_DIR = path.resolve(HERE, "..", "05-design-revisions", ".tmp", "final revisions");
const DESIGN_PORT = 8799;

const staging = process.argv[2];
if (!staging) {
  console.error("usage: node verify.mjs <staging-url> [design-url]");
  console.error("  design defaults to a local server of 05-design-revisions/.tmp/final revisions");
  process.exit(2);
}
const stagingU = new URL(staging);
const pageName = (stagingU.pathname.replace(/\/+$/, "").split("/").pop() || "index").replace(/\.html$/, "");
// design: explicit override, else the matching local <page>.html
const design = process.argv[3] || `http://127.0.0.1:${DESIGN_PORT}/${pageName}.html`;
const OUT = path.join(HERE, ".tmp", "verify", pageName);
fs.mkdirSync(OUT, { recursive: true });

// Serve the local design folder (only when no explicit design URL was given).
let designServer = null;
if (!process.argv[3]) {
  if (!fs.existsSync(path.join(DESIGN_DIR, `${pageName}.html`))) {
    console.error(`design file not found: ${path.join(DESIGN_DIR, pageName + ".html")}`);
    process.exit(1);
  }
  designServer = spawn("python", ["-m", "http.server", String(DESIGN_PORT), "--directory", DESIGN_DIR],
    { cwd: HERE, stdio: "ignore" });
  // wait for it to accept connections
  for (let i = 0; i < 50; i++) {
    try { await fetch(`http://127.0.0.1:${DESIGN_PORT}/${pageName}.html`); break; }
    catch { await new Promise((r) => setTimeout(r, 100)); }
  }
}

// Pull the fingerprint snippet straight out of wf_tools.py so it can never
// drift from the project's tuned probes.
const printed = execFileSync("python", ["wf_tools.py", "compare", design, staging], {
  cwd: HERE, encoding: "utf-8",
});
const FINGERPRINT = printed.slice(printed.indexOf("(() =>"));
if (!FINGERPRINT.startsWith("(() =>")) {
  console.error("could not extract fingerprint snippet from wf_tools.py output");
  process.exit(1);
}

const BREAKPOINTS = [
  { name: "desktop", viewport: { width: 1440, height: 900 } },
  { name: "mobile", viewport: { width: 390, height: 844 } },
];

const autoScroll = async (page) => {
  await page.evaluate(async () => {
    const step = Math.floor(window.innerHeight * 0.8);
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 180)); // let IO reveals fire
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
};

const capture = async (ctx, label, pageUrl, bp) => {
  const page = await ctx.newPage();
  await page.setViewportSize(bp.viewport);
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.goto(pageUrl, { waitUntil: "networkidle", timeout: 60000 }).catch((e) =>
    errors.push("goto: " + e.message));
  await page.waitForTimeout(1200);
  await autoScroll(page);
  const json = await page.evaluate(FINGERPRINT);
  const jsonPath = path.join(OUT, `${label}-${bp.name}.json`);
  fs.writeFileSync(jsonPath, json);
  const shot = path.join(OUT, `${label}-${bp.name}.png`);
  await page.screenshot({ path: shot, fullPage: true });
  await page.close();
  return { jsonPath, shot, errors };
};

console.log(`\n=== VERIFY ${pageName} ===`);
console.log(`design : ${design}`);
console.log(`staging: ${staging}\n`);

const ctx = await chromium.launchPersistentContext("", { headless: true });
let anyDiff = false;
for (const bp of BREAKPOINTS) {
  console.log(`\n----- ${bp.name} (${bp.viewport.width}x${bp.viewport.height}) -----`);
  const d = await capture(ctx, "design", design, bp);
  const s = await capture(ctx, "staging", staging, bp);
  if (s.errors.length) {
    console.log(`[console] ${s.errors.length} staging error(s):`);
    for (const e of s.errors.slice(0, 10)) console.log("   - " + e.slice(0, 140));
    anyDiff = true;
  } else {
    console.log("[console] staging: 0 errors");
  }
  try {
    execFileSync("python", ["wf_tools.py", "compare", "--diff", d.jsonPath, s.jsonPath],
      { cwd: HERE, stdio: "inherit" });
  } catch {
    anyDiff = true; // non-zero exit = differences found
  }
  console.log(`[shots] ${path.relative(HERE, d.shot)}  vs  ${path.relative(HERE, s.shot)}`);
}
await ctx.close();
if (designServer) designServer.kill();

console.log(`\n=== ${anyDiff ? "DIFFERENCES / ERRORS FOUND" : "CLEAN"} — artifacts in ${path.relative(HERE, OUT)} ===`);
process.exit(anyDiff ? 1 : 0);
