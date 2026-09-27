// Every live page aborts one request to a random 81-character path on its own
// origin. Who asks for it, and does it matter?
import { chromium } from "playwright-core";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2] || "https://mason-park-kids.up.railway.app/";

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on("request", (r) => {
  const u = r.url();
  if (/\/[A-Za-z0-9_-]{60,}$/.test(u)) {
    console.log("REQUEST  ", r.method(), r.resourceType(), u.slice(0, 130));
    console.log("  initiator frame:", r.frame() ? r.frame().url().slice(0, 80) : "(none)");
    console.log("  headers:", JSON.stringify(Object.fromEntries(Object.entries(r.headers()).filter(([k]) => /accept|purpose|sec-|x-/i.test(k)))));
  }
});
page.on("requestfailed", (r) => {
  const u = r.url();
  if (/\/[A-Za-z0-9_-]{60,}$/.test(u)) console.log("FAILED   ", r.failure()?.errorText, u.slice(0, 130));
});

await page.goto(url, { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(4000);

const clues = await page.evaluate(() => ({
  speculationRules: Array.from(document.querySelectorAll('script[type="speculationrules"]')).map((s) => s.textContent.slice(0, 300)),
  serviceWorker: !!navigator.serviceWorker && !!navigator.serviceWorker.controller,
  prefetchLinks: Array.from(document.querySelectorAll('link[rel="prefetch"], link[rel="prerender"], link[rel="next"]')).map((l) => l.href.slice(0, 120)),
  instaticScripts: Array.from(document.scripts).map((s) => s.src).filter(Boolean).map((s) => s.slice(-70)),
}));
console.log(JSON.stringify(clues, null, 1));
await browser.close();
