// Gate: the GHL pool swaps the phone number on every kind of page for ONE visitor (one
// browser context, cookie banner never accepted), and GHL is asked for a number once, not
// once per page. Uses one pool number per run.
//   node bugherd/check-site-pool.mjs [https://www.masonparkdental.com]
import { chromium } from "playwright-core";
const base = (process.argv[2] || "https://www.masonparkdental.com").replace(/\/+$/, "");
const PAGES = ["/", "/services/invisalign/", "/blog/which-teeth-move-first-with-invisalign/", "/contacts/", "/ads-landing-pages/invisalign/"];
const br = await chromium.launch({ channel: "chrome" });
const ctx = await br.newContext({ viewport: { width: 1440, height: 900 }, userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36" });
let assigns = 0, bad = 0; const csp = [];
ctx.on("response", (r) => { if (/number-pools\/assign-number/.test(r.url())) assigns++; });
for (const path of PAGES) {
  const p = await ctx.newPage();
  // Only GHL's own CSP errors count: strict pages already refuse Cloudflare's analytics
  // beacon and a data: font (2026-09-25), which have nothing to do with the swap.
  p.on("console", (m) => { const t = m.text(); if (/Content Security Policy|Refused to|violates/i.test(t) && /leadconnectorhq|msgsndr/.test(t)) csp.push(`${path}: ${t.slice(0, 140)}`); });
  await p.goto(base + path, { waitUntil: "load" });
  await p.waitForTimeout(8000);
  const nums = await p.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute("href")))]);
  const swapped = nums.length > 0 && !nums.some((n) => n.includes("2817698878"));
  if (!swapped) bad++;
  console.log(`${swapped ? "PASS" : "FAIL"} ${path.padEnd(52)} ${nums.join(" ")}`);
  await p.close();
}
console.log(`assign-number calls: ${assigns} (want 1)   CSP errors: ${csp.length ? csp.join(" | ") : "none"}`);
if (assigns !== 1 || csp.length) bad++;
console.log(`${bad} problem(s)`);
await br.close();
process.exitCode = bad ? 1 : 0;
