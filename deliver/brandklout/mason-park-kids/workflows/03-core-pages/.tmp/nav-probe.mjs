// Does the navigation work from disk? Opens a page over file://, reads every
// internal link after site.js has run, checks that each target file exists,
// and clicks through three of them. Added 2026-09-09 (evening) when the client
// asked for a review that could be clicked through without a server.
//   node nav-probe.mjs ../home/services/invisalign/index.html
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const file = path.resolve(process.argv[2] || "../home/index.html");
const url = "file:///" + file.split(path.sep).join("/");
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(800);
const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll("a[href]")).map((a) => a.getAttribute("href")));
const internal = hrefs.filter((h) => !/^(https?:|mailto:|tel:|#)/.test(h));
let bad = 0;
for (const h of internal) {
  if (h.startsWith("/")) { console.log("still root-relative:", h); bad++; continue; }
  const target = path.resolve(path.dirname(file), h.split("#")[0]);
  if (!fs.existsSync(target)) { console.log("missing:", h, "->", target); bad++; }
}
console.log(`${internal.length} internal links, ${bad} bad`);
for (const sel of ['.masthead_menu a[href*="about-us"]', 'a[href*="our-services"]', 'a[href*="new-patients"]']) {
  const a = page.locator(sel).first();
  if (!(await a.count())) { console.log("no link for", sel); bad++; continue; }
  await a.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), a.click({ force: true })]);
  const title = await page.title();
  console.log(`clicked ${sel} -> ${page.url().split("/home/")[1]}  "${title.slice(0, 50)}"`);
  await page.goBack({ waitUntil: "load" });
  await page.waitForTimeout(300);
}
await browser.close();
process.exitCode = bad ? 1 : 0;
