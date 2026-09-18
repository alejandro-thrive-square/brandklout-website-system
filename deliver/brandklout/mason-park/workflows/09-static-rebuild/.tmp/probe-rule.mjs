/**
 * Which stylesheet rules give an element a property, on a PUBLISHED page?
 *
 *   node probe-rule.mjs <url> <selector> <property> [property...]
 *
 * A published page carries four sheets (reset, framework, style, userStyles)
 * and only the last is ours. When a live element computes to something the
 * local file never said, this lists every matching rule that declares the
 * property, with the sheet it came from, in cascade order.
 */
import { chromium } from "playwright-core";

const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const [url, selector, ...props] = process.argv.slice(2);
if (!url || !selector || !props.length) throw new Error("usage: node probe-rule.mjs <url> <selector> <property> [property...]");
const browser = await chromium.launch({ executablePath: CHROME });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await page.waitForTimeout(3000);
const out = await page.evaluate(([sel, wanted]) => {
  const el = document.querySelector(sel);
  if (!el) return { error: "no element " + sel };
  const hits = [];
  const walk = (rules, sheet, media) => {
    for (const r of rules) {
      if (r.cssRules && r.conditionText !== undefined) { walk(r.cssRules, sheet, (media ? media + " and " : "") + r.conditionText); continue; }
      if (r.cssRules && !r.selectorText) { walk(r.cssRules, sheet, media); continue; }
      if (!r.selectorText) continue;
      let ok = false;
      try { ok = el.matches(r.selectorText); } catch { ok = false; }
      if (!ok) continue;
      for (const p of wanted) {
        const v = r.style.getPropertyValue(p);
        if (v) hits.push(`${sheet}  ${media ? "@media " + media + "  " : ""}${r.selectorText.slice(0, 90)}  { ${p}: ${v}${r.style.getPropertyPriority(p) ? " !important" : ""} }`);
      }
    }
  };
  for (const s of document.styleSheets) {
    let rules; try { rules = s.cssRules; } catch { continue; }
    walk(rules, (s.href || "inline").split("/").pop().slice(0, 34), "");
  }
  const cs = getComputedStyle(el);
  return { classes: el.className, inline: el.getAttribute("style"), computed: Object.fromEntries(wanted.map((p) => [p, cs.getPropertyValue(p)])), hits };
}, [selector, props]);
console.log(JSON.stringify(out, null, 1));
await browser.close();
