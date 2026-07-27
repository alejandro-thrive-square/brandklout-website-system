import { chromium } from 'playwright';

const URL = 'https://clifton-exteriors-lutum.webflow.io/untitled';
const OUT = process.argv[2] || 'untitled-full.png';

const browser = await chromium.launch();
const page = await browser.newPage({ viewportSize: { width: 1440, height: 900 } });
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });

// force any scroll-reveal styles visible
await page.addStyleTag({ content: '*{opacity:1 !important; transform:none !important; visibility:visible !important;}' });
// scroll through to trigger lazy loads
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 800) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 120));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(1500);

await page.screenshot({ path: OUT, fullPage: true });

// dump top-level section outline
const outline = await page.evaluate(() => {
  const secs = [...document.querySelectorAll('body section, body > div section, section, header, footer')]
    .filter(el => el.getBoundingClientRect === undefined ? false : true);
  const seen = new Set();
  const rows = [];
  for (const el of document.querySelectorAll('section, header, footer, [class*="section"]')) {
    if ([...el.querySelectorAll('section')].length > 0 && el.tagName !== 'SECTION') continue;
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY;
    const key = Math.round(top) + '|' + el.className;
    if (seen.has(key) || r.height < 40) continue;
    seen.add(key);
    const h = el.querySelector('h1,h2,h3');
    rows.push({
      tag: el.tagName.toLowerCase(),
      cls: String(el.className).slice(0, 100),
      top: Math.round(top),
      height: Math.round(r.height),
      heading: h ? h.textContent.trim().slice(0, 80) : ''
    });
  }
  rows.sort((a, b) => a.top - b.top);
  return { title: document.title, totalHeight: document.body.scrollHeight, rows };
});
console.log(JSON.stringify(outline, null, 2));

await browser.close();
