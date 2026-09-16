// One page, one viewport, one scroll position (or a selector brought to a
// given fraction of the window), in WebKit or Chromium. Optional --hover
// <selector> hovers an element before the shot; --click <selector> clicks.
//   node shot-at.mjs <url> <out.png> [--size 1512x652] [--y 0 | --sel "#x" --frac .3] [--engine webkit] [--hover sel] [--click sel] [--wait 2500]
import { chromium, webkit } from "playwright-core";

const [url, out, ...rest] = process.argv.slice(2);
const flag = (n, d) => (rest.includes(n) ? rest[rest.indexOf(n) + 1] : d);
const [w, h] = flag("--size", "1512x652").split("x").map(Number);
const engine = flag("--engine", "webkit");
const b = engine === "webkit" ? await webkit.launch() : await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: Number(flag("--dpr", 1)) });
p.on("pageerror", (e) => console.log(`pageerror ${e.message}`));
await p.goto(url, { waitUntil: "load" });
await p.waitForTimeout(1500);
const sel = flag("--sel", null);
await p.evaluate(([y, sel, frac]) => {
  document.documentElement.style.scrollBehavior = "auto";
  if (sel) {
    const el = document.querySelector(sel);
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * frac);
  } else window.scrollTo(0, y);
}, [Number(flag("--y", 0)), sel, Number(flag("--frac", 0.3))]);
await p.waitForTimeout(Number(flag("--wait", 2500)));
if (flag("--click", null)) { await p.click(flag("--click")); await p.waitForTimeout(1200); }
if (flag("--hover", null)) { await p.hover(flag("--hover")); await p.waitForTimeout(900); }
await p.screenshot({ path: out });
console.log(`${out} ${w}x${h} ${engine}`);
await b.close();
