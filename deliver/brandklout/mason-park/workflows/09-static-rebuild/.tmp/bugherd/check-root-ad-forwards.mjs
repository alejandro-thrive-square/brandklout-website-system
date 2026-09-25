// Gate: each retired root ad page forwards to its /ads-landing-pages/ twin in a real
// browser, keeping the query string and hash. GHL is blocked so the check burns no pool
// numbers. It uses a NEUTRAL param: on this workstation NordVPN Threat Protection strips
// gclid and utm_* from every Chrome navigation (even a plain page opened directly, before
// any script runs), so a gclid test fails here while the site passes it through; curl,
// which the VPN does not filter, gets gclid through.
//   node bugherd/check-root-ad-forwards.mjs [https://www.masonparkdental.com]
import { chromium } from "playwright-core";
const base = (process.argv[2] || "https://www.masonparkdental.com").replace(/\/+$/, "");
const br = await chromium.launch({ channel: "chrome" });
const ctx = await br.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36" });
await ctx.route(/leadconnectorhq|msgsndr/, (r) => r.abort());
let bad = 0;
for (const s of ["invisalign", "invisalign-consultation", "invisalign-thank-you", "new-patient-special", "new-patient-special-consultation", "new-patient-thank-you"]) {
  const p = await ctx.newPage();
  await p.goto(`${base}/${s}?qa_fwd=TEST123&qa_src=ads#form`, { waitUntil: "load" });
  await p.waitForURL(/ads-landing-pages/, { timeout: 15000 }).catch(() => {});
  const u = new URL(p.url());
  const ok = /^\/ads-landing-pages\/[^/]+\/?$/.test(u.pathname) && u.pathname.includes(s)
    && u.searchParams.get("qa_fwd") === "TEST123" && u.searchParams.get("qa_src") === "ads" && u.hash === "#form";
  if (!ok) bad++;
  console.log(`${ok ? "PASS" : "FAIL"} /${s} -> ${u.pathname}${u.search}${u.hash}`);
  await p.close();
}
console.log(`${bad} problem(s)`);
await br.close();
process.exitCode = bad ? 1 : 0;
