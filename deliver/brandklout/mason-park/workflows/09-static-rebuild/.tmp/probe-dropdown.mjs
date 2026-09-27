// ===========================================================================
// THE DROPDOWN CONTRAST PROBE
//
// The nav dropdown is a white card. On a `has-journey` page the navbar starts
// transparent over the hero and paints EVERY `.navbar_link` white -- including
// the ones inside that white card. A screenshot of the navbar closed shows
// nothing wrong, which is why this reads the computed colours instead.
//
//   node probe-dropdown.mjs ../home/index.html
//   node probe-dropdown.mjs https://staging.masonparkdental.com/
//
// Reports, for EVERY dropdown panel including the nested group submenus under
// Services: the panel's own background, and the colour of each link in it, at
// the top of the page (transparent navbar) and after scrolling (solid navbar).
// Flags any pair whose contrast is under 3:1.
//
// It used to read only `.navbar_item.has-dropdown` FIRST -- the About menu --
// which meant it reported "every dropdown link is legible" for a nav whose
// other three menus it had never opened. When the Services menu became a
// grouped two-level dropdown on 2026-09-09 that blind spot got a whole level
// deeper. A gate that inspects one of four menus is not a gate.
// ===========================================================================
import { chromium } from "playwright-core";
import path from "node:path";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const target = process.argv[2];
if (!target) {
  console.error("usage: node probe-dropdown.mjs <path/to/index.html | https://url>");
  process.exit(1);
}
const url = /^https?:/.test(target)
  ? target
  : "file:///" + path.resolve(target).split(path.sep).join("/");

const rgb = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
const lum = (c) => {
  const [r, g, b] = c.map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "networkidle" }).catch(() => {});
await page.waitForTimeout(600);

// The panel only paints when its parent item is hovered, so hover it and read
// the panel that becomes visible -- reading a hidden one gives the closed state.
const read = async (label) => {
  console.log(`
--- ${label} ---`);
  let bad = 0;

  // Every dropdown in the nav, top level and nested, in document order. A
  // nested panel only paints once its ancestors are hovered too, so hover the
  // whole chain from the outside in before reading it.
  const count = await page.locator(".navbar_item.has-dropdown").count();
  for (let i = 0; i < count; i++) {
    const item = page.locator(".navbar_item.has-dropdown").nth(i);
    const chain = await item.evaluate((el) => {
      const path = [];
      for (let n = el; n; n = n.parentElement) {
        if (n.classList && n.classList.contains("has-dropdown")) path.unshift(n);
      }
      return path.map((n) => n.querySelector(":scope > .navbar_link").textContent.trim());
    });
    for (const name of chain) {
      await page.locator(".navbar_item.has-dropdown", { hasText: name }).first().hover().catch(() => {});
    }
    await item.hover();
    await page.waitForTimeout(320);

    const out = await item.evaluate((el) => {
      const panel = el.querySelector(":scope > .navbar_dropdown-list");
      if (!panel) return null;
      // The panel background can be transparent, in which case what you see is
      // whatever is behind it -- walk up until something actually paints.
      let bgEl = panel, bg = getComputedStyle(panel).backgroundColor;
      while (bgEl && /rgba\(0, 0, 0, 0\)|transparent/.test(bg)) {
        bgEl = bgEl.parentElement;
        bg = bgEl ? getComputedStyle(bgEl).backgroundColor : "rgb(255, 255, 255)";
      }
      const cs = getComputedStyle(panel);
      return {
        owner: el.querySelector(":scope > .navbar_link").textContent.trim(),
        panelBg: cs.backgroundColor,
        paintedBg: bg,
        visibility: cs.visibility,
        opacity: cs.opacity,
        links: [...panel.querySelectorAll(":scope > .navbar_item > .navbar_link")].map((a) => ({
          text: a.textContent.trim(),
          color: getComputedStyle(a).color,
        })),
      };
    });
    if (!out) continue;

    const depth = chain.length - 1;
    const pad = "  ".repeat(depth);
    console.log(`${pad}[${out.owner}] bg ${out.paintedBg}  ${out.visibility}, opacity ${out.opacity}`);
    if (out.visibility === "hidden" || out.opacity === "0") {
      console.log(`${pad}  ! panel did not open -- contrast not measured`);
      bad++;
      continue;
    }
    for (const l of out.links) {
      const c = contrast(l.color, out.paintedBg);
      const flag = c < 3 ? "  <-- INVISIBLE" : "";
      if (c < 3) bad++;
      console.log(`${pad}  ${c.toFixed(2)}:1  ${l.color.padEnd(22)} ${l.text}${flag}`);
    }
  }
  return bad;
};

let bad = await read("navbar at top of page (transparent state)");
await page.evaluate(() => window.scrollTo(0, 2000));
await page.waitForTimeout(900);
bad += await read("navbar scrolled (solid state)");

await browser.close();
console.log(bad ? `\nFAIL: ${bad} link(s) under 3:1 against their own panel.` : "\nOK: every dropdown link is legible.");
process.exit(bad ? 1 : 0);
