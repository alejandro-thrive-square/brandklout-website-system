/**
 * KERNEL — paste-one-section spike.
 *
 * Reuses the logged-in profile captured by kernel-login.mjs, connects Playwright
 * to the Kernel cloud browser over CDP, loads ONE generated paste_*.html and
 * clicks its "Copy to Webflow clipboard" button. That click is a TRUSTED
 * Playwright gesture, so the page's execCommand('copy') handler writes the
 * @webflow/XscpData payload under the `application/json` MIME type — exactly the
 * mechanism Webflow's paste handler reads, and the one thing the async Clipboard
 * API cannot do. Then it opens the target Webflow Designer page.
 *
 * Two modes, on purpose — prove the risky bit before automating it:
 *
 *   default        Sets the clipboard, opens the Designer, prints the live-view
 *                  URL and WAITS. You click the canvas + Ctrl+V by hand in the
 *                  live view to confirm the section pastes. This isolates the one
 *                  genuine unknown: does a cloud browser's clipboard carry
 *                  application/json into Webflow's paste?
 *
 *   --auto-paste   Also clicks the canvas centre and presses Ctrl+V via
 *                  Playwright — the fully unattended path, once the default mode
 *                  has proven the clipboard works.
 *
 * Usage:
 *   node kernel-paste.mjs <designer-url> [paste-file] [--auto-paste]
 *
 * e.g. (paste the hero onto a scratch page)
 *   node kernel-paste.mjs "https://webflow.com/design/[client-name]?pageId=XXXX" .tmp/index/paste_03_home.html
 *
 * Env:
 *   KERNEL_API_KEY   (required)
 *   KERNEL_PROFILE   (optional, default "webflow")
 *
 * NOTE on cross-page classes: there is no Relume extension in the cloud browser,
 * so this proves the mechanism on a SCRATCH/first page. Multi-page production
 * paste without the extension needs the converter's --avoid regen (see
 * html-to-webflow-clipboard.md §A.2), or loading Relume via Kernel
 * browsers.loadExtensions — a later step, not part of this spike.
 */
import Kernel from "@onkernel/sdk";
import { chromium } from "playwright";
import readline from "node:readline";
import fs from "node:fs";
import path from "node:path";

const designerUrl = process.argv[2];
const pasteFile = process.argv[3] && !process.argv[3].startsWith("--")
  ? process.argv[3]
  : ".tmp/index/paste_03_home.html";
const AUTO = process.argv.includes("--auto-paste");
const PROFILE = process.env.KERNEL_PROFILE || "webflow";

if (!designerUrl || !designerUrl.startsWith("http")) {
  console.error("usage: node kernel-paste.mjs <designer-url> [paste-file] [--auto-paste]");
  process.exit(2);
}
if (!process.env.KERNEL_API_KEY) {
  console.error("set KERNEL_API_KEY (PowerShell: $env:KERNEL_API_KEY='...')");
  process.exit(2);
}
if (!fs.existsSync(pasteFile)) {
  console.error(`paste file not found: ${pasteFile}`);
  process.exit(1);
}

const OUT = path.join(".tmp", "kernel");
fs.mkdirSync(OUT, { recursive: true });
const html = fs.readFileSync(pasteFile, "utf-8");
console.log(`paste file: ${pasteFile}`);

const ask = (q) =>
  new Promise((res) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(q, (a) => {
      rl.close();
      res(a);
    });
  });

const kernel = new Kernel();
const b = await kernel.browsers.create({
  headless: false,
  stealth: false,
  profile: { name: PROFILE }, // reuse login; omit save_changes => profile stays immutable
  viewport: { width: 1440, height: 900 },
  timeout_seconds: 1800,
});
console.log("live view:", b.browser_live_view_url);

const browser = await chromium.connectOverCDP(b.cdp_ws_url);
const ctx = browser.contexts()[0] ?? (await browser.newContext());
try {
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"]);
} catch {
  /* execCommand path doesn't strictly need this; ignore if unsupported over CDP */
}

// --- 1. put the @webflow/XscpData payload on the clipboard via the proven copy page ---
const copyPage = await ctx.newPage();
await copyPage.setContent(html, { waitUntil: "load" }); // no network: HTML injected directly
await copyPage.click("#btn");
const status = (await copyPage.locator("#status").textContent({ timeout: 5000 })) || "";
console.log("copy page status:", status.trim() || "(empty)");
if (!/Copied/i.test(status)) {
  console.warn("!! copy may have failed — check the status text above before pasting");
}

// --- 2. open the Webflow Designer (heavy SPA — give the canvas time) ---
const designer = await ctx.newPage();
await designer
  .goto(designerUrl, { waitUntil: "load", timeout: 120000 })
  .catch((e) => console.warn("designer goto:", e.message));
await designer.waitForTimeout(15000);
await designer.screenshot({ path: path.join(OUT, "designer-before.png") }).catch(() => {});

if (AUTO) {
  // click roughly the canvas centre to select Body, then paste
  const vp = designer.viewportSize() || { width: 1440, height: 900 };
  await designer.mouse.click(Math.round(vp.width * 0.55), Math.round(vp.height * 0.5));
  await designer.waitForTimeout(500);
  await designer.keyboard.press("Control+V");
  await designer.waitForTimeout(6000);
  await designer.screenshot({ path: path.join(OUT, "designer-after.png") }).catch(() => {});
  console.log("auto-paste sent. screenshots in", OUT);
} else {
  console.log("\nClipboard is set. In the LIVE VIEW: click the canvas, then press Ctrl+V.");
  console.log("(Verify in a focused/visible tab — background tabs freeze the Designer.)");
  await ask("Press Enter when you have verified the paste (or to finish)… ");
  await designer.screenshot({ path: path.join(OUT, "designer-after.png") }).catch(() => {});
}

await browser.close(); // disconnects the CDP client; remote browser lingers until deleted
await kernel.browsers.deleteByID(b.session_id).catch(() => {}); // stop billing
console.log("done. screenshots (if any) in", OUT);
process.exit(0);
