// Is the LIVE Fraunces a variable font, or the static instances Instatic
// installs? The whole 10-20% geometry difference between local and live turns
// on this: `font-variation-settings: "SOFT" 100` is on every display face in
// site.css, and a static instance ignores it silently.
//
//   node font-axes.mjs [url]
import { chromium } from "playwright-core";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2] || "https://mason-park-kids.up.railway.app/";

const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const fonts = [];
page.on("response", (r) => {
  if (/\.(woff2?|ttf|otf)(\?|$)/i.test(r.url())) fonts.push(`${r.status()}  ${r.url()}`);
});
await page.goto(url, { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(2500);

const probe = await page.evaluate(() => {
  const measure = (family, settings) => {
    const el = document.createElement("span");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    el.style.whiteSpace = "nowrap";
    el.style.fontSize = "200px";
    el.style.fontFamily = family;
    if (settings) el.style.fontVariationSettings = settings;
    el.textContent = "Hamburgefonstiv";
    document.body.appendChild(el);
    const w = el.getBoundingClientRect().width;
    el.remove();
    return +w.toFixed(2);
  };
  const h1 = document.querySelector("h1");
  const stack = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim();
  const FAMILY = stack ? stack.split(",")[0].trim() : "Fraunces";
  return {
    // Measure the family the DISPLAY STACK actually resolves to, not the
    // literal name "Fraunces": since 2026-09-08 the stack leads with the
    // self-hosted variable face "Fraunces VF" and "Fraunces" is only the
    // fallback behind it, so measuring the old name tested nothing.
    family: FAMILY,
    fraunces_plain: measure(FAMILY),
    fraunces_soft0: measure(FAMILY, '"SOFT" 0'),
    fraunces_soft100: measure(FAMILY, '"SOFT" 100'),
    fraunces_opsz9: measure(FAMILY, '"opsz" 9'),
    fraunces_opsz144: measure(FAMILY, '"opsz" 144'),
    h1Family: h1 ? getComputedStyle(h1).fontFamily : null,
    h1Settings: h1 ? getComputedStyle(h1).fontVariationSettings : null,
    h1Size: h1 ? getComputedStyle(h1).fontSize : null,
    h1Width: h1 ? +h1.getBoundingClientRect().width.toFixed(1) : null,
  };
});

console.log(url);
console.log("font files requested:");
console.log(fonts.length ? "  " + fonts.join("\n  ") : "  (none)");
console.log(JSON.stringify(probe, null, 2));
const variable = probe.fraunces_soft0 !== probe.fraunces_soft100 || probe.fraunces_opsz9 !== probe.fraunces_opsz144;
console.log(`\nVERDICT: Fraunces here is ${variable ? "VARIABLE - the axes move it" : "a STATIC INSTANCE - SOFT and opsz do nothing"}`);
await browser.close();
