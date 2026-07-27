import { chromium } from "playwright";

const url = process.argv[2] || "https://giovanni-serrano.webflow.io/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "networkidle" });

// auto-scroll to bottom to trigger reveals
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 400) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 60));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(1500);

const report = await page.evaluate(() => {
  const out = {};
  // portfolio cards
  const cards = [...document.querySelectorAll(".project-card")];
  out.projectCards = cards.length;
  out.cardSamples = cards.slice(0, 6).map(c => {
    const cs = getComputedStyle(c);
    const r = c.getBoundingClientRect();
    return {
      cls: c.className.slice(0, 60),
      opacity: cs.opacity, display: cs.display, visibility: cs.visibility,
      w: Math.round(r.width), h: Math.round(r.height),
      text: (c.textContent || "").trim().slice(0, 40),
      href: c.getAttribute("href")
    };
  });
  // dyn lists
  out.dynLists = [...document.querySelectorAll(".w-dyn-list")].map(l => {
    const cs = getComputedStyle(l);
    const r = l.getBoundingClientRect();
    const items = l.querySelectorAll(".w-dyn-item").length;
    return { items, display: cs.display, opacity: cs.opacity, w: Math.round(r.width), h: Math.round(r.height), parentCls: (l.parentElement?.className || "").slice(0, 60) };
  });
  // grids that hold the lists
  out.grids = [...document.querySelectorAll('[class*="grid"]')].slice(0, 12).map(g => {
    const cs = getComputedStyle(g);
    const r = g.getBoundingClientRect();
    return { cls: (g.getAttribute("class") || "").slice(0, 60), display: cs.display, cols: cs.gridTemplateColumns.slice(0, 80), h: Math.round(r.height) };
  });
  // testimonials
  const t = document.querySelector('[class*="testi"], .quotes, .reviews');
  out.testiSectionFound = !!t;
  // reveal state
  const reveals = [...document.querySelectorAll(".reveal")];
  out.reveals = reveals.length;
  out.revealsHidden = reveals.filter(x => getComputedStyle(x).opacity === "0").length;
  out.hiddenSamples = reveals.filter(x => getComputedStyle(x).opacity === "0").slice(0, 8).map(x => ({ cls: x.className.slice(0, 70), text: (x.textContent || "").trim().slice(0, 40) }));
  return out;
});
console.log(JSON.stringify(report, null, 1));

const errors = [];
page.on("pageerror", e => errors.push(String(e)));
await browser.close();
