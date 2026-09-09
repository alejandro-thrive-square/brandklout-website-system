/**
 * KERNEL — one-time Webflow login capture.
 *
 * Creates (or reuses) a Kernel profile, opens a HEADFUL cloud browser you can
 * drive from its live-view URL, and waits while YOU log into Webflow by hand
 * (this is where CAPTCHA / 2FA gets solved — the exact thing that defeats a
 * stock headless Playwright login). On Enter it DELETES the browser, which is
 * what persists the logged-in cookies/storage back into the profile so
 * kernel-paste.mjs can reuse the session with zero re-auth.
 *
 *   node kernel-login.mjs
 *
 * Env:
 *   KERNEL_API_KEY   (required)  — your Kernel API key
 *   KERNEL_PROFILE   (optional)  — profile name, default "webflow"
 *
 * Why stealth:false — stealth routes through a rotating residential proxy, so
 * every run looks like a new IP/location and Webflow tends to invalidate the
 * session or force re-auth. A direct connection keeps a stable identity, which
 * is what makes the saved login actually reusable across runs.
 */
import Kernel, { ConflictError } from "@onkernel/sdk";
import readline from "node:readline";

const PROFILE = process.env.KERNEL_PROFILE || "webflow";
if (!process.env.KERNEL_API_KEY) {
  console.error("set KERNEL_API_KEY (PowerShell: $env:KERNEL_API_KEY='...')");
  process.exit(2);
}

const kernel = new Kernel();
const ask = (q) =>
  new Promise((res) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(q, (a) => {
      rl.close();
      res(a);
    });
  });

// 1. profile (idempotent — reuse if it already exists)
try {
  await kernel.profiles.create({ name: PROFILE });
  console.log(`created profile "${PROFILE}"`);
} catch (e) {
  if (e instanceof ConflictError) console.log(`reusing existing profile "${PROFILE}"`);
  else throw e;
}

// 2. headful browser that writes its end state back into the profile
const b = await kernel.browsers.create({
  headless: false,
  stealth: false,
  profile: { name: PROFILE, save_changes: true },
  viewport: { width: 1440, height: 900 },
  start_url: "https://webflow.com/dashboard/login",
  timeout_seconds: 1800, // 30 min headroom to log in by hand
});

console.log("\n=== OPEN THIS LIVE VIEW AND LOG INTO WEBFLOW ===\n");
console.log("  " + b.browser_live_view_url + "\n");
console.log("Log in fully — keep going until you see your Webflow dashboard.");
await ask("\nPress Enter here once you are logged in… ");

// 3. delete => persists the profile. close() alone does NOT save.
await kernel.browsers.deleteByID(b.session_id);
console.log(`\nLogin saved into profile "${PROFILE}". You can now run kernel-paste.mjs.`);
process.exit(0);
