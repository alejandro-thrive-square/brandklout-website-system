// ===========================================================================
// HOW LONG IS THIS PAGE, AND WHERE DID THE LENGTH GO.
//
//   node measure.mjs ../home/services/invisalign/index.html 1440 900
//   node measure.mjs ../home/services/invisalign/index.html 390 844
//
// Per chapter: pixels, screens, visible words, images, list items. Then every
// tick list with its height, because on a treatment page the lists ARE the
// length -- four of them were 600 words and three of eighteen screens.
//
// WHY IT EXISTS. The client's note was "users don't scroll to a page that has
// that much text", and the honest answer to that is a number, not a redesign.
// Measure first: it was repetition, not length, and the four lists were the
// same list. See "No wall of text" in DESIGN-STANDARD.md.
//
// A CAVEAT ON THE TOTAL. `document.body.scrollHeight` includes the pin spacer
// ScrollTrigger inserts for the path chapter, and the per-chapter number for
// that section does NOT -- it is the scene's own height. They will not add up,
// and that difference is the pinned travel. Use probe-scene.mjs to see it.
// ===========================================================================
import { chromium } from "playwright-core";
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = "file:///" + process.argv[2].split("\\").join("/");
const w = +(process.argv[3] || 1440), h = +(process.argv[4] || 900);

const b = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
const p = await c.newPage();
await p.goto(url, { waitUntil: "load" });
await p.waitForTimeout(1000);

const r = await p.evaluate(() => {
  const words = (el) => (el.innerText || "").split(/\s+/).filter(Boolean).length;
  const rows = [];
  let totalW = 0;
  for (const s of document.querySelectorAll("main > section, main > div.pr-badges, main > div.padding-global")) {
    const wc = words(s);
    totalW += wc;
    rows.push({
      id: s.id || s.className.split(" ")[0],
      px: Math.round(s.getBoundingClientRect().height),
      words: wc,
      imgs: s.querySelectorAll("img").length,
      lis: s.querySelectorAll("li").length,
    });
  }
  const ticks = [...document.querySelectorAll("ul.lf-ticks")].map((u) => ({
    where: (u.closest(".lf-section, .faq_answer") || {}).id || "faq",
    items: u.children.length,
    px: Math.round(u.getBoundingClientRect().height),
    // innerText of a CLOSED <details> is empty, which is the point: this counts
    // what the reader is actually shown, not what the file contains.
    words: (u.innerText || "").split(/\s+/).filter(Boolean).length,
  }));
  return { rows, totalW, ticks, total: document.body.scrollHeight };
});

console.log("viewport " + w + "x" + h + "   page " + r.total + "px   " + r.totalW + " visible words   " +
  (r.total / h).toFixed(1) + " screens\n");
console.log("chapter".padEnd(14) + "px".padStart(7) + "screens".padStart(9) + "words".padStart(7) + "imgs".padStart(6) + "li".padStart(5));
for (const x of r.rows) {
  console.log(x.id.padEnd(14) + String(x.px).padStart(7) + (x.px / h).toFixed(1).padStart(9) +
    String(x.words).padStart(7) + String(x.imgs).padStart(6) + String(x.lis).padStart(5));
}
console.log("\ntick lists");
for (const t of r.ticks) console.log("  " + t.where.padEnd(22) + String(t.items).padStart(3) + " items " +
  String(t.px).padStart(5) + "px " + String(t.words).padStart(4) + "w");
await b.close();
