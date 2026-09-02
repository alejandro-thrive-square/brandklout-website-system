// Which face is actually painted on the live page, and why.
//
//   node font-probe.mjs [url]
//
// Lists every FontFace the document knows and its status, the computed family
// on the h1 and the body, the width of a test string in each family against
// its fallback (equal widths mean the fallback is on screen), and every font
// file request the page made with its status.
import { chromium } from "playwright-core";
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2] || "https://mason-park-kids.up.railway.app/";
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const fontReq = [];
page.on("response", (r) => { if (/woff2?/.test(r.url())) fontReq.push(r.status() + " " + r.url().split("/").slice(-2).join("/")); });
page.on("console", (m) => { if (m.type() === "error") console.log("console:", m.text().slice(0, 200)); });
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await page.waitForTimeout(3000);
const r = await page.evaluate(async () => {
  await document.fonts.ready;
  const faces = [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.style} ${f.status}`);
  const h1 = document.querySelector("h1");
  const s = document.createElement("span");
  s.textContent = "Handgloves 12345";
  s.style.cssText = "position:absolute;font-size:48px;font-family:Georgia";
  document.body.appendChild(s);
  const georgia = s.getBoundingClientRect().width;
  s.style.fontFamily = "'Fraunces', Georgia";
  const fraunces = s.getBoundingClientRect().width;
  s.style.fontFamily = "Arial";
  const arial = s.getBoundingClientRect().width;
  s.style.fontFamily = "'Nunito', Arial";
  const nunito = s.getBoundingClientRect().width;
  return {
    faces, h1Family: getComputedStyle(h1).fontFamily, bodyFamily: getComputedStyle(document.body).fontFamily,
    georgia, fraunces, arial, nunito,
    check: [document.fonts.check("48px Fraunces"), document.fonts.check("48px Nunito")],
    csp: (document.querySelector('meta[http-equiv="Content-Security-Policy"]') || {}).content || "",
  };
});
console.log(JSON.stringify(r, null, 1));
console.log("font requests:", fontReq.length ? fontReq : "(none)");
await browser.close();
