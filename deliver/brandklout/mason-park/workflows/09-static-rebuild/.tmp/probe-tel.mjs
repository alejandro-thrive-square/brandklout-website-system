// Is the phone button actually bound, or is something swallowing the click?
// BugHerd #79-#84, #97, #100: "the button is enabled, but it doesn't redirect
// to any page", filed seven times on Windows 10 / Chrome at 2560px.
//
//   node probe-tel.mjs https://staging.masonparkdental.com/contacts > bugherd/probe-tel.log
//
// For every a[href^="tel:"] on the page it prints the href, the box, and what
// a real click does: whether any listener called preventDefault(). A tel:
// link that nobody intercepts is a working link -- on a desktop with no
// handler registered for the tel: scheme the operating system simply does
// nothing, which is what the reviewer saw.
import { chromium } from "playwright-core";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2] || "https://staging.masonparkdental.com/";
const b = await chromium.launch({ executablePath: CHROME });
const p = await b.newPage({ viewport: { width: 2560, height: 1305 } });
const external = [];
p.on("request", (r) => { if (!/^https?:/.test(r.url())) external.push(r.url()); });
const res = await p.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 }).catch((e) => ({ status: () => String(e) }));
await p.waitForTimeout(3000);
console.log("http", res.status(), "| title", JSON.stringify(await p.title()), "| bytes", (await p.content()).length);
const out = await p.evaluate(() => {
  const rows = [];
  document.querySelectorAll('a[href^="tel:"]').forEach((a) => {
    const r = a.getBoundingClientRect();
    // Dispatch a real, cancelable click and see whether anything cancels it.
    const ev = new MouseEvent("click", { bubbles: true, cancelable: true, view: window });
    let prevented = false;
    const guard = (e) => { if (e.target === a || a.contains(e.target)) prevented = e.defaultPrevented; };
    document.addEventListener("click", guard, false);
    a.dispatchEvent(ev);
    document.removeEventListener("click", guard, false);
    rows.push({
      href: a.getAttribute("href"),
      text: (a.textContent || "").trim().slice(0, 40),
      where: (a.closest("section,header,footer,div[class]") || {}).className || "",
      box: [Math.round(r.width), Math.round(r.height)],
      visible: r.width > 0 && r.height > 0,
      prevented: prevented || ev.defaultPrevented,
    });
  });
  return rows;
});
console.log(url);
for (const r of out) console.log(JSON.stringify(r));
console.log("non-http requests during load/click:", JSON.stringify(external));
await b.close();
