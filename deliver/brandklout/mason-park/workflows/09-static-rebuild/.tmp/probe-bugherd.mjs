// Does the BugHerd sidebar actually mount on a live page, and does the CSP let it?
//
//   node probe-bugherd.mjs https://staging.masonparkdental.com/ [more urls]
//
// Reads the CSP meta, loads the page in Chromium, waits for BugHerd, and
// reports: the <bugherd-sidebar> element, the www.bugherd.com iframe, every
// bugherd/bugsnag request and its status, and any console line that mentions
// a CSP refusal. A refused script says "Refused to load the script" in the
// console and nothing else anywhere, so the console is the thing to read.
import { chromium } from "playwright-core";

// Same launch as the other probes: system Chrome, not a downloaded Chromium.
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const urls = process.argv.slice(2);
if (urls.length === 0) {
  console.error("usage: node probe-bugherd.mjs <url> [url...]");
  process.exit(2);
}

const browser = await chromium.launch({ executablePath: CHROME });
let failed = false;
for (const url of urls) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const console_ = [];
  const requests = [];
  page.on("console", (m) => console_.push(`${m.type()}: ${m.text()}`));
  page.on("response", (r) => {
    const u = r.url();
    if (/bugherd|bugsnag/i.test(u)) requests.push(`${r.status()} ${u.slice(0, 110)}`);
  });
  page.on("requestfailed", (r) => {
    const u = r.url();
    if (/bugherd|bugsnag/i.test(u)) requests.push(`FAILED ${r.failure()?.errorText} ${u.slice(0, 110)}`);
  });

  await page.goto(url, { waitUntil: "load" });
  const csp = await page.evaluate(
    () => document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute("content") ?? "(none)",
  );
  const loaderTag = await page.evaluate(
    () => [...document.scripts].map((s) => s.src).filter((s) => /bugherd/.test(s)),
  );
  let mounted = false;
  try {
    await page.waitForSelector("bugherd-sidebar", { timeout: 15000, state: "attached" });
    mounted = true;
  } catch {}
  const frames = page.frames().map((f) => f.url()).filter((u) => /bugherd/.test(u));
  const refusals = console_.filter((l) => /refused|content security policy|csp/i.test(l));

  console.log(`\n== ${url}`);
  console.log(`csp      ${csp}`);
  console.log(`scripts  ${loaderTag.join(" | ") || "(no bugherd <script> in the document)"}`);
  console.log(`mounted  ${mounted ? "<bugherd-sidebar> present" : "NO <bugherd-sidebar> after 15s"}`);
  console.log(`frames   ${frames.join(" | ") || "(none)"}`);
  console.log(`requests ${requests.length}`);
  for (const r of requests) console.log(`  ${r}`);
  console.log(`refusals ${refusals.length}`);
  for (const r of refusals) console.log(`  ${r}`);
  if (!mounted || refusals.length) failed = true;
  await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
