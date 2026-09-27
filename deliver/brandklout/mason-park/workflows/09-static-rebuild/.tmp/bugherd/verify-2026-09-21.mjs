// The 2026-09-21 round, asserted rather than photographed. Run against the
// local server (bugherd/serve.mjs, :8089) before the push, and against
// staging after it.
//
//   node verify-2026-09-21.mjs http://127.0.0.1:8089
//   node verify-2026-09-21.mjs https://staging.masonparkdental.com
//
// A screenshot cannot tell you that a link points somewhere, that a click was
// bound, or that a row of tabs has room to spare. This drives each of them.
import { chromium } from "playwright-core";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = (process.argv[2] || "http://127.0.0.1:8089").replace(/\/$/, "");
const local = BASE.startsWith("http://127.");
const page_ = (p) => BASE + p + (local && !p.endsWith("/") ? "/" : "");

let fails = 0;
const ok = (cond, label, extra = "") => {
  if (!cond) fails++;
  console.log(`${cond ? "  ok  " : "FAIL  "}${label}${extra ? "  " + extra : ""}`);
};

const b = await chromium.launch({ executablePath: CHROME });
const ctx = await b.newContext({ viewport: { width: 2560, height: 1305 }, permissions: ["clipboard-read", "clipboard-write"] });

async function open(p) {
  const pg = await ctx.newPage();
  const errs = [];
  pg.on("pageerror", (e) => errs.push(e.message));
  await pg.goto(page_(p), { waitUntil: "domcontentloaded", timeout: 60000 });
  await pg.waitForTimeout(2500);
  // A lazy image still below the fold has an empty currentSrc, which is not
  // the same thing as a missing image. Read the attribute the page states.
  await pg.evaluate(() => { window.src = (i) => (i.getAttribute("src") || "").split("/").pop(); });
  return { pg, errs };
}

/* --- #78 #83  the hours, in all five shapes, on three kinds of page ------ */
console.log("\n#78 #83  opening hours");
for (const p of ["/", "/contacts", "/services/invisalign", "/blog"]) {
  const { pg } = await open(p);
  const r = await pg.evaluate(() => {
    const t = (s) => (document.querySelector(s) || { textContent: "" }).textContent.replace(/\s+/g, " ").trim();
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent).join(" ");
    return {
      topbar: t(".topbar_note"),
      facts: t(".iv-facts"),
      footer: [...document.querySelectorAll(".hours_row")].map((li) => li.textContent.replace(/\s+/g, " ").trim()).join(" | "),
      stale: /"08:00"/.test(ld) || /8am/.test(document.body.innerText),
    };
  });
  ok(!r.stale, `${p}: no 8am anywhere`);
  ok(!r.topbar || /Mon.Wed 9-6/.test(r.topbar), `${p}: topbar`, r.topbar);
  ok(!r.facts || /Thu 9am to 5pm/.test(r.facts.replace(/\s+/g, " ")), `${p}: invitation facts`, r.facts.slice(0, 80));
  ok(!r.footer || /Tuesday9am - 6pm|Tuesday 9am - 6pm/.test(r.footer.replace(/\s+/g, " ")) || r.footer.includes("Tuesday9am - 6pm"), `${p}: footer rows`, r.footer.slice(0, 90));
  await pg.close();
}

/* --- #94-#99  the finder rows ------------------------------------------- */
console.log("\n#94 #95 #96 #98 #99  the services finder");
{
  const { pg } = await open("/our-services");
  const rows = await pg.$$eval(".el-finder_row", (as) =>
    as.map((a) => ({ n: a.querySelector(".el-finder_num").textContent.trim(), href: a.getAttribute("href") })));
  const want = { "01": "preventative-dentistry", "02": "root-canal-therapy", "03": "bonding", "04": "dental-implant-restorations", "05": "invisalign", "06": "composite-fillings", "07": "tmj-tmd", "08": "sedation-dentistry", "09": "extractions", 10: "#invitation" };
  for (const r of rows) ok((r.href || "").includes(want[r.n]), `row ${r.n}`, r.href);
  // and hovering one still swaps the panel: the click target changed, the
  // hover behaviour must not have.
  await pg.hover('.el-finder_item:nth-of-type(4) .el-finder_row');
  await pg.waitForTimeout(600);
  const cap = await pg.$eval(".el-finder_caption", (e) => e.textContent.trim());
  ok(/Implants placed/i.test(cap), "hover still swaps the panel caption", cap);
  await pg.close();
}

/* --- #93  seven tab names, one line ------------------------------------- */
console.log("\n#93  the service group tabs");
for (const w of [1280, 1440, 1512, 1920, 2560]) {
  const pg = await ctx.newPage();
  await pg.setViewportSize({ width: w, height: 900 });
  await pg.goto(page_("/our-services"), { waitUntil: "domcontentloaded", timeout: 60000 });
  await pg.waitForTimeout(2000);
  const r = await pg.evaluate(() => {
    const row = document.querySelector(".el-tabs_row");
    const tabs = [...row.querySelectorAll(".el-tabs_tab")];
    const gap = parseFloat(getComputedStyle(row).columnGap);
    const need = tabs.reduce((s, t) => s + t.getBoundingClientRect().width, 0) + gap * (tabs.length - 1);
    return { lines: new Set(tabs.map((t) => Math.round(t.getBoundingClientRect().top))).size, need: Math.round(need), have: Math.round(row.getBoundingClientRect().width) };
  });
  ok(r.lines === 1 && r.need < r.have * 0.97, `${w}px: one line with room`, `${r.need} of ${r.have}, ${r.lines} line(s)`);
  await pg.close();
}

/* --- #90  the contact sheet says where a frame was taken ---------------- */
console.log("\n#90  the contact sheet caption");
{
  const { pg } = await open("/about-us");
  const before = await pg.$eval(".el-sheet_tile:nth-of-type(3)", (t) => getComputedStyle(t, "::after").opacity);
  await pg.hover(".el-sheet_tile:nth-of-type(3)");
  await pg.waitForTimeout(800);
  const after = await pg.$eval(".el-sheet_tile:nth-of-type(3)", (t) => getComputedStyle(t, "::after").opacity);
  const text = await pg.$eval(".el-sheet_tile:nth-of-type(3)", (t) => getComputedStyle(t, "::after").content);
  const line = await pg.$eval(".el-sheet_line", (e) => e.textContent.trim());
  ok(before === "0" && after === "1", "the tile's own caption fades in on hover", `${before} -> ${after}`);
  ok(/sterilizer/i.test(text), "and it is that tile's caption", text);
  ok(/sterilizer/i.test(line), "the line under the grid still follows too", line);
  await pg.close();
}

/* --- #79-#84 #97 #100  the phone number answers a click ----------------- */
console.log("\n#79-#84 #97 #100  the phone number");
for (const p of ["/", "/contacts", "/services/emergency-dentist"]) {
  const { pg, errs } = await open(p);
  const links = await pg.$$('a[href^="tel:"]');
  ok(links.length > 0, `${p}: tel: links present`, String(links.length));
  const visible = (await Promise.all(links.map(async (l) => ((await l.boundingBox()) ? l : null)))).filter(Boolean);
  ok(visible.length > 0, `${p}: at least one is on screen`, String(visible.length));
  await visible[0].click();
  await pg.waitForTimeout(600);
  const note = await pg.evaluate(() => {
    const n = document.querySelector(".phone-copied");
    return n ? { text: n.textContent, on: n.classList.contains("is-on"), opacity: getComputedStyle(n).opacity } : null;
  });
  ok(note && note.on && /769.8878/.test(note.text), `${p}: the click says something`, JSON.stringify(note));
  ok(errs.length === 0, `${p}: no page errors`, errs.join(" | "));
  await pg.close();
}

/* --- #85 #88 #92 #106  Dr. Sung, in the middle of his frame ------------- */
console.log("\n#85 #88 #92 #106  the portrait");
for (const [p, sel] of [["/about-us", ".el-pillar:nth-of-type(3) .el-pillar_frame img"], ["/our-team", ".cp-byline:nth-of-type(3) img"], ["/services/preventative-dentistry", ".svc-provider_shot img"]]) {
  const { pg } = await open(p);
  const r = await pg.$eval(sel, (i) => ({ src: src(i), w: +i.getAttribute("width"), h: +i.getAttribute("height") }));
  ok(/dr-sung-standing/.test(r.src) && Math.abs(r.w / r.h - 0.7507) < 0.01, `${p}: the re-cut file`, JSON.stringify(r));
  await pg.close();
}

/* --- #101-#109  a photograph on every card that was asked for ----------- */
console.log("\n#101-#109  the photographs");
{
  const { pg } = await open("/services/preventative-dentistry");
  const cards = await pg.$$eval("#qualify .svc-card", (as) =>
    as.map((a) => ({ no: (a.querySelector(".svc-card_no") || { textContent: "price" }).textContent.trim(), img: (function (i) { return i ? (i.getAttribute("src") || "").split("/").pop() : null; })(a.querySelector(".svc-card_media img")) })));
  for (const c of cards) ok(!!c.img, `qualify card ${c.no} has a frame`, (c.img || "").split("/").pop());
  ok(new Set(cards.map((c) => (c.img || "").split("/").pop().replace(/-\d+x\d+\.[a-z]+$/, ""))).size === cards.length, "and no two are the same frame");
  const why2 = await pg.$eval("#why .svc-card:nth-of-type(2) .svc-card_media img", (i) => (i.getAttribute("src") || "").split("/").pop()).catch(() => null);
  ok(/gingivitis/.test(why2 || ""), "#105 why card 02", why2);
  const path1 = await pg.$eval(".pa-card:nth-of-type(1) .pa-shot img", (i) => (i.getAttribute("src") || "").split("/").pop());
  ok(/desk-call-6/.test(path1), "#107 path card 01", path1);
  await pg.close();
}
{
  const { pg } = await open("/services/oral-cancer-screening");
  const a = await pg.$eval("#why .svc-card:nth-of-type(1) .svc-card_media img", (i) => (i.getAttribute("src") || "").split("/").pop());
  const d = await pg.$eval("#why .svc-card:nth-of-type(4) .svc-card_media img", (i) => (i.getAttribute("src") || "").split("/").pop()).catch(() => null);
  ok(/clinical-pair-senior/.test(a), "#108 why card 01", a);
  ok(/schedule-screen-2/.test(d || ""), "#109 why card 04", d);
  await pg.close();
}
{
  const { pg } = await open("/about-us");
  const l = await pg.$eval(".el-pair_frame.is-left img", (i) => (i.getAttribute("src") || "").split("/").pop());
  ok(/sofa-tablet-pair/.test(l), "#89 the pair's left frame", l);
  await pg.close();
}

/* --- #87  the numeral is the big half ----------------------------------- */
console.log("\n#87  the counted numbers");
{
  const { pg } = await open("/our-doctors");
  const r = await pg.$$eval(".cp-figure b", (bs) =>
    bs.map((b) => {
      const num = b.querySelector("[data-count]") || b;
      const unit = b.querySelector("small");
      return { num: parseFloat(getComputedStyle(num).fontSize), unit: unit ? parseFloat(getComputedStyle(unit).fontSize) : 0 };
    }));
  for (const [i, x] of r.entries()) ok(x.unit === 0 || x.num > x.unit * 1.8, `figure ${i + 1}: the number is larger`, `${x.num} vs ${x.unit}`);
  await pg.close();
}

await b.close();
console.log(`\n${fails} failure(s) against ${BASE}`);
process.exit(fails ? 1 : 0);
