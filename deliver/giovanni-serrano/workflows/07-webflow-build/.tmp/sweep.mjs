import { chromium } from "playwright";

const pages = ["", "invest", "develop", "scale", "sell", "projects/4855-college-ave", "projects/256-bed-student-housing"];
const browser = await chromium.launch();

for (const w of [1440, 390]) {
  console.log(`\n########## VIEWPORT ${w}`);
  for (const p of pages) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    const errors = [];
    page.on("pageerror", e => errors.push(String(e).slice(0, 160)));
    page.on("console", m => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
    try {
      await page.goto("https://giovanni-serrano.webflow.io/" + p, { waitUntil: "networkidle", timeout: 45000 });
    } catch (e) { console.log(p || "index", "GOTO FAIL", String(e).slice(0, 100)); await page.close(); continue; }
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 350) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 50));
      }
    });
    await page.waitForTimeout(1200);
    const rep = await page.evaluate(() => {
      const out = {};
      const stuck = [...document.querySelectorAll('[class*="reveal"]')].filter(el => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return cs.opacity === "0" && r.height > 0;
      });
      out.stuckReveals = stuck.length;
      out.stuckSamples = stuck.slice(0, 6).map(el => ({
        cls: (el.getAttribute("class") || "").slice(0, 70),
        text: (el.textContent || "").trim().slice(0, 50)
      }));
      // children of reveal-stagger stuck at 0 (even if parent has .in)
      const hiddenKids = [...document.querySelectorAll('[class*="reveal-stagger"] *')].filter(el => {
        const cs = getComputedStyle(el);
        return cs.opacity === "0" && el.getBoundingClientRect().height > 40;
      });
      out.hiddenStaggerKids = hiddenKids.length;
      out.hiddenKidSamples = [...new Set(hiddenKids.map(el => (el.getAttribute("class") || "").slice(0, 50)))].slice(0, 5);
      out.brokenImgs = [...document.images].filter(i => i.src && !i.src.startsWith("data:") && !i.complete || (i.complete && i.naturalWidth === 0 && i.src && !i.src.startsWith("data:"))).map(i => i.src.slice(0, 110));
      out.forms = document.querySelectorAll("form").length;
      out.hScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth ? document.documentElement.scrollWidth : null;
      return out;
    });
    console.log("---", p || "index", JSON.stringify({ ...rep, errors: [...new Set(errors)].slice(0, 5) }, null, 1));
    await page.close();
  }
}
await browser.close();
