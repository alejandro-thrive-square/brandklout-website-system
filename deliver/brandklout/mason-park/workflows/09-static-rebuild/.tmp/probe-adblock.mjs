/**
 * Does an ad blocker's cosmetic filter hit any element on a PUBLISHED page?
 *
 *   node probe-adblock.mjs <url> [url...]
 *
 * This workstation's Chrome applies a generic element-hiding list to every
 * http(s) document (NordVPN Threat Protection; the same kind of list uBlock,
 * AdGuard and Brave ship). The rules live in a browser-injected sheet that
 * `document.styleSheets` does NOT list, and they are absent on file://, so a
 * local render is always clean and an in-page scan finds nothing.
 *
 * On 2026-09-18 the class `is-ad` on the paid pages' hero matched one of them
 * (`position: absolute !important`, among selectors for doubleclick and ezoic)
 * and the whole arrival, form included, collapsed to a 0px box on staging while
 * every other gate was green. A paid landing page is exactly where visitors
 * with a blocker are most common.
 *
 * So this asks the browser itself, over CDP, which rules match every element
 * that carries a class or id, and reports any rule that does not come from one
 * of the page's own linked sheets or its own <style> tags. Exit 1 on any hit.
 */
import { chromium } from "playwright-core";

const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const urls = process.argv.slice(2);
if (!urls.length) throw new Error("usage: node probe-adblock.mjs <url> [url...]");
const browser = await chromium.launch({ executablePath: CHROME });
let problems = 0;
for (const url of urls) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(url, { waitUntil: "load", timeout: 120000 });
  await page.waitForTimeout(2500);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  // Sheet headers arrive as events while CSS is being enabled.
  const own = new Set();
  const foreign = new Map();
  cdp.on("CSS.styleSheetAdded", ({ header }) => {
    if (header.sourceURL || header.ownerNode) own.add(header.styleSheetId);
    else foreign.set(header.styleSheetId, header.origin);
  });
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
  const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: "[class], [id]" });
  const hits = new Map();
  for (const nodeId of nodeIds) {
    let m; try { m = await cdp.send("CSS.getMatchedStylesForNode", { nodeId }); } catch { continue; }
    for (const { rule } of m.matchedCSSRules ?? []) {
      if (rule.origin !== "regular" && rule.origin !== "injected") continue;
      if (rule.styleSheetId && own.has(rule.styleSheetId)) continue;
      const { node } = await cdp.send("DOM.describeNode", { nodeId });
      const attrs = {}; for (let i = 0; i < (node.attributes ?? []).length; i += 2) attrs[node.attributes[i]] = node.attributes[i + 1];
      const name = `${node.localName}${attrs.id ? "#" + attrs.id : ""}${attrs.class ? "." + attrs.class.split(/\s+/).join(".") : ""}`.slice(0, 90);
      hits.set(name, `{ ${rule.style.cssText.slice(0, 110)} }  origin:${rule.origin}`);
    }
  }
  console.log(`${hits.size ? "FAIL" : "ok  "} ${url}  ${nodeIds.length} elements, ${foreign.size} sheet(s) not the page's own, ${hits.size} element(s) matched by one`);
  for (const [name, rule] of hits) console.log(`     ${name}  <-  ${rule}`);
  if (!foreign.size) console.log("     (no foreign sheet seen: this network may not be filtering, so a clean result proves less)");
  problems += hits.size;
  await page.close();
}
await browser.close();
console.log(`${problems} problem(s)`);
process.exitCode = problems ? 1 : 0;
