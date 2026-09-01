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
// Reports, for the first dropdown panel: the panel's own background, and the
// colour of each link in it, at the top of the page (transparent navbar) and
// after scrolling (solid navbar). Flags any pair whose contrast is under 3:1.
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
  const item = page.locator(".navbar_item.has-dropdown").first();
  await item.hover();
  await page.waitForTimeout(400);
  const out = await page.evaluate(() => {
    const panel = document.querySelector(".navbar_item.has-dropdown > .navbar_dropdown-list");
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
  if (!out) { console.log(`${label}: no dropdown panel found`); return 0; }
  console.log(`\n--- ${label} ---`);
  console.log(`panel background : ${out.panelBg}  (painted: ${out.paintedBg})`);
  console.log(`panel visibility : ${out.visibility}, opacity ${out.opacity}`);
  let bad = 0;
  for (const l of out.links) {
    const c = contrast(l.color, out.paintedBg);
    const flag = c < 3 ? "  <-- INVISIBLE" : "";
    if (c < 3) bad++;
    console.log(`  ${c.toFixed(2)}:1  ${l.color.padEnd(22)} ${l.text}${flag}`);
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
