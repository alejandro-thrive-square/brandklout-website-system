import { chromium } from "playwright";

// --- 1. template page static checks (two different projects) ---
for (const slug of ["4855-college-ave", "256-bed-student-housing"]) {
  const h = await (await fetch("https://giovanni-serrano.webflow.io/projects/" + slug)).text();
  const brandOk = /class="k">Brand<\/div><p[^>]*><strong[^>]*>Giovanni Serrano<\/strong>/.test(h.replace(/\n/g, ""));
  const compOk = h.replace(/\n/g, "").includes("Giovanni Serrano</strong> · DRE #02282434");
  const crumb = h.includes('class="now"');
  const badLogo = h.includes("REAL%20Broker");
  const logoMatch = h.match(/<img[^>]+real-broker-logo[^>]*>/);
  console.log(slug, { brandOk, compOk, crumbStillBound: crumb, badLogoGone: !badLogo, logo: logoMatch ? logoMatch[0].slice(0, 120) : "MISSING" });
}
// logo URL resolves?
const lm = await (await fetch("https://giovanni-serrano.webflow.io/projects/4855-college-ave")).text();
const src = lm.match(/src="([^"]*real-broker-logo[^"]*)"/);
if (src) {
  const r = await fetch(src[1], { method: "HEAD" });
  console.log("logo HTTP:", r.status, src[1].slice(0, 100));
}

// --- 2. home portfolio reveal, desktop + mobile ---
const browser = await chromium.launch();
for (const w of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  await page.goto("https://giovanni-serrano.webflow.io/", { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 350) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 50));
    }
  });
  await page.waitForTimeout(1500);
  const rep = await page.evaluate(() => {
    const cards = [...document.querySelectorAll(".project-card")];
    return {
      cards: cards.length,
      visible: cards.filter(c => getComputedStyle(c).opacity === "1").length,
      hidden: cards.filter(c => getComputedStyle(c).opacity === "0").length
    };
  });
  console.log("home w" + w, JSON.stringify(rep));
  await page.close();
}
await browser.close();
