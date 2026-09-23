// Resolve every open BugHerd note of the 2026-09-23 pull to the local slot it
// is about: the page file, the section, the card, the image that is there now
// (or that there is none), and the rendered aspect of the frame at 1440.
// Needs serve.mjs running on :8089.
//
//   node resolve-2026-09-23.mjs > resolve-2026-09-23.log
//
// Writes resolve-2026-09-23.json. The selectors come from the LIVE page, so the
// runtime-only classes (is-in, is-on, is-active...) are stripped before they
// are run against the local file, and nth-of-type is kept as it is.
import { chromium } from "playwright-core";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const { tasks } = JSON.parse(fs.readFileSync("tasks-2026-09-23.json", "utf8"));
const open = tasks.filter((t) => !["done", "closed"].includes(t.task.status)).map((t) => t.task);
const RUNTIME = /\.(is-in|is-on|is-active|is-open|is-visible|is-lit|is-done|is-current|is-hover|is-shown)(?=[.>:\s]|$)/g;

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const out = [];
let current = "";
for (const t of open) {
  const rec = { n: t.local_task_id, url: t.url, text: (t.description || "").replace(/\s+/g, " ").trim() };
  const shots = fs.readdirSync("screens-2026-09-23").filter((f) => f.startsWith(`${rec.n}-att`));
  rec.att = shots.map((f) => {
    const buf = fs.readFileSync(path.join("screens-2026-09-23", f));
    return { file: f, sha: crypto.createHash("sha1").update(buf).digest("hex").slice(0, 10), bytes: buf.length };
  });
  rec.shot = `screens-2026-09-23/${rec.n}.jpg`;
  const sel = (t.selector_info?.path || "").replace(RUNTIME, "").split("div.wrap:nth-of-type(1)").join("div.wrap");
  rec.sel = sel;
  const u = (t.url || "/").replace(/#.*$/, "").replace(/\/?$/, "/");
  if (u !== current) {
    const res = await page.goto(`http://127.0.0.1:8089${u}`, { waitUntil: "load" });
    rec.status = res?.status();
    current = u;
  }
  rec.page = u;
  rec.slot = await page.evaluate((sel) => {
    let el;
    try { el = document.querySelector(sel); } catch (e) { return { error: String(e) }; }
    if (!el) return { error: "no match" };
    const sec = el.closest("section");
    const card = el.closest("article, figure, li, .pr-portrait, .svc-overlap, .iv-aside");
    const scope = card || el;
    const img = el.tagName === "IMG" ? el : scope.querySelector("img");
    const box = (img?.parentElement || scope).getBoundingClientRect();
    const siblings = card?.parentElement ? [...card.parentElement.children].filter((c) => c.tagName === card.tagName) : [];
    return {
      section: sec ? `${sec.id}.${[...sec.classList].join(".")}` : null,
      heading: sec?.querySelector("h2")?.textContent.trim().slice(0, 70) || null,
      card: card ? `${card.tagName.toLowerCase()}.${[...card.classList].join(".")} ${siblings.indexOf(card) + 1}/${siblings.length}` : null,
      cardName: card?.querySelector("h3, .svc-card_name, figcaption")?.textContent.trim().slice(0, 80) || null,
      img: img ? (img.getAttribute("src") || "").split("/").pop() : null,
      imgAlt: img?.alt || null,
      frame: img ? `${img.parentElement.tagName.toLowerCase()}.${[...img.parentElement.classList].join(".")}` : null,
      w: Math.round(box.width), h: Math.round(box.height),
      aspect: box.height ? +(box.width / box.height).toFixed(3) : null,
    };
  }, sel);
  out.push(rec);
  console.log(`#${rec.n} ${u} ${rec.slot.error || `${rec.slot.section} | ${rec.slot.card} | ${rec.slot.img || "NO IMG"} ${rec.slot.w}x${rec.slot.h}`}`);
}
fs.writeFileSync("resolve-2026-09-23.json", JSON.stringify(out, null, 1));
await browser.close();
