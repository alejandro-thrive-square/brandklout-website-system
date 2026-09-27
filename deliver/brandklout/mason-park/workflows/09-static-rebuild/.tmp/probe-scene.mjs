// Drive the pinned scene and assert it actually does work: the track moves, the
// progress bar fills, and every card reveals. A screenshot cannot tell you any
// of this -- DESIGN-STANDARD "Verification: interaction, not screenshots".
import { chromium } from "playwright-core";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = "file:///" + process.argv[2].split("\\").join("/");
const w = +(process.argv[3] || 1440), h = +(process.argv[4] || 900);

const b = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const c = await b.newContext({ viewport: { width: w, height: h } });
const p = await c.newPage();
await p.goto(url, { waitUntil: "load" });
await p.waitForTimeout(1200);

const top = await p.evaluate(() => {
  const s = document.querySelector(".ch-path");
  return window.scrollY + s.getBoundingClientRect().top;
});
const span = await p.evaluate(() => {
  const s = document.querySelector(".ch-path");
  return s.getBoundingClientRect().height;
});

const at = [];
for (const f of [0, 0.25, 0.5, 0.75, 0.98]) {
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round(top + span * f));
  await p.waitForTimeout(500);
  at.push(await p.evaluate((frac) => {
    const track = document.querySelector("#pathTrack");
    const bar = document.querySelector("#pathBar");
    const cards = [...document.querySelectorAll(".pa-card")];
    const m = new DOMMatrixReadOnly(getComputedStyle(track).transform);
    const bm = new DOMMatrixReadOnly(getComputedStyle(bar).transform);
    const r = bar.getBoundingClientRect();
    return {
      frac,
      trackX: Math.round(m.m41),
      barScale: +bm.a.toFixed(3),
      barOnScreen: r.top > 0 && r.bottom < window.innerHeight,
      cardsOn: cards.filter((x) => x.classList.contains("is-on")).length + "/" + cards.length,
      firstCardLeft: Math.round(cards[0].getBoundingClientRect().left),
      lastCardRight: Math.round(cards[cards.length - 1].getBoundingClientRect().right),
    };
  }, f));
}
console.log("scene top " + Math.round(top) + "px, span " + Math.round(span) + "px, viewport " + w + "x" + h);
for (const a of at) {
  console.log("  " + String(Math.round(a.frac * 100)).padStart(3) + "%  trackX " + String(a.trackX).padStart(6) +
    "  bar " + String(a.barScale).padStart(5) + (a.barOnScreen ? " (on screen)" : " (OFF SCREEN)") +
    "  cards on " + a.cardsOn + "  card1.left " + String(a.firstCardLeft).padStart(6) +
    "  cardN.right " + String(a.lastCardRight).padStart(6));
}
await b.close();
