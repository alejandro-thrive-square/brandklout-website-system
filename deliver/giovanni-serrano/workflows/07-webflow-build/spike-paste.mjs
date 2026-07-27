/**
 * SPIKE: can Playwright paste ONE Webflow section into the Designer?
 *
 * Proves the single riskiest mechanic of the proposed build loop:
 *   generated paste page  ->  execCommand('copy') writes @webflow/XscpData
 *   to the real clipboard ->  switch to Designer canvas -> Ctrl/Cmd+V.
 *
 * Relume is loaded (cross-page class dedup) but is NOT required to paste a
 * single section; it's here so the spike matches the real paste environment.
 *
 * FIRST RUN is interactive: a headed Chrome opens. You log into Webflow (and
 * Relume) in THAT window and open the target project's Designer. The script
 * waits (polls) until it sees a /design/ URL, then does the copy+paste and
 * saves screenshots to .tmp/spike/ for review. The profile dir persists, so
 * subsequent runs skip the login.
 */
import { chromium } from "playwright";
import path from "node:path";
import url from "node:url";
import fs from "node:fs";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));

// --- config -------------------------------------------------------------
const RELUME_EXT = String.raw`C:\Users\pc\AppData\Local\Google\Chrome\User Data\Profile 2\Extensions\doeokejknjdlpgkkmlbcahojmnpdlebm\80_0`;
const PASTE_FILE = path.join(HERE, ".tmp", "invest", "paste_01_progress.html");
const PROFILE_DIR = path.join(HERE, ".tmp", "spike", "pw-profile");
const OUT_DIR = path.join(HERE, ".tmp", "spike");
const DESIGNER_URL_RE = /webflow\.com\/design\//;
const LOGIN_TIMEOUT_MS = 10 * 60 * 1000; // 10 min to log in + open Designer
// ------------------------------------------------------------------------

fs.mkdirSync(OUT_DIR, { recursive: true });
const log = (...a) => console.log("[spike]", ...a);

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: false, // extensions + clipboard require headed
  channel: "chrome", // use the real installed Chrome (normal fingerprint) not bundled Chromium
  viewport: null,
  // Strip the automation fingerprint that triggers Webflow's bot/CAPTCHA wall:
  // remove the --enable-automation flag and the navigator.webdriver signal.
  ignoreDefaultArgs: ["--enable-automation"],
  args: [
    `--disable-extensions-except=${RELUME_EXT}`,
    `--load-extension=${RELUME_EXT}`,
    "--disable-blink-features=AutomationControlled",
  ],
});
// Belt-and-suspenders: hide navigator.webdriver before any page script runs.
await ctx.addInitScript(() => {
  Object.defineProperty(navigator, "webdriver", { get: () => undefined });
});
await ctx.grantPermissions(["clipboard-read", "clipboard-write"]);

const start = ctx.pages()[0] ?? (await ctx.newPage());
await start.goto("https://webflow.com/dashboard");
log("Chrome is open. Log into Webflow + Relume, then OPEN THE TARGET PROJECT'S DESIGNER.");
log("Waiting up to 10 min for a /design/ URL...");

// Poll every tab (incl. tabs opened later — Webflow opens the Designer in a
// NEW tab) until one is sitting on the Designer. Page-independent sleep so a
// closed/navigated tab can't crash the loop.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const deadline = Date.now() + LOGIN_TIMEOUT_MS;
let designer = null;
while (Date.now() < deadline && !designer) {
  for (const p of ctx.pages()) {
    let u = "";
    try { u = p.url(); } catch { continue; } // page may have closed mid-poll
    if (DESIGNER_URL_RE.test(u)) { designer = p; break; }
  }
  if (!designer) await sleep(2000);
}
if (!designer) { log("ERROR: never saw a Designer tab. Aborting."); await ctx.close(); process.exit(1); }
log("Designer detected:", designer.url());
await designer.waitForTimeout(4000); // let the canvas finish loading

// 1) Open the generated paste page and copy the payload to the real clipboard.
const paste = await ctx.newPage();
await paste.goto(url.pathToFileURL(PASTE_FILE).href);
await paste.bringToFront();
await paste.click("#btn");
const status = await paste.locator("#status").textContent();
log("copy status:", JSON.stringify(status));
// sanity: read it back out of the clipboard
const clip = await paste.evaluate(async () => {
  try { return (await navigator.clipboard.readText()).slice(0, 60); } catch (e) { return "readText blocked: " + e.message; }
});
log("clipboard head:", JSON.stringify(clip));

// 2) Focus the Designer canvas and paste.
await designer.bringToFront();
await designer.waitForTimeout(1000);
const box = designer.viewportSize() ?? { width: 1280, height: 800 };
await designer.mouse.click(box.width / 2, box.height / 2); // set insertion point on canvas
await designer.waitForTimeout(500);
const mod = process.platform === "darwin" ? "Meta" : "Control";
await designer.keyboard.press(`${mod}+v`);
log("pressed", mod + "+V — waiting for the Designer to react...");
await designer.waitForTimeout(5000);

// 3) Capture evidence.
const shot = path.join(OUT_DIR, "after-paste.png");
await designer.screenshot({ path: shot, fullPage: false });
log("screenshot saved:", shot);

// Best-effort: did a #progressBar element appear inside the canvas iframe?
let found = "n/a";
try {
  for (const f of designer.frames()) {
    const n = await f.locator("#progressBar").count().catch(() => 0);
    if (n > 0) { found = `#progressBar x${n} in frame ${f.url().slice(0, 50)}`; break; }
  }
} catch {}
log("pasted-element probe:", found);

log("DONE. Review .tmp/spike/after-paste.png. Leaving the browser open 30s.");
await designer.waitForTimeout(30000);
await ctx.close();
