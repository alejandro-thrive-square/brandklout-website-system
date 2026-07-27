import { chromium } from 'playwright';

const URL = 'https://clifton-exteriors-lutum.webflow.io/untitled';
const OUTDIR = process.argv[2];

const browser = await chromium.launch();
const page = await browser.newPage({ viewportSize: { width: 1440, height: 900 } });
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.addStyleTag({ content: '*{opacity:1 !important; transform:none !important; visibility:visible !important; animation:none !important; transition:none !important;}' });
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 800) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 100));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(1500);

const total = await page.evaluate(() => document.body.scrollHeight);
const SLICE = 2500;
let i = 0;
for (let y = 0; y < total; y += SLICE) {
  const h = Math.min(SLICE, total - y);
  await page.screenshot({ path: `${OUTDIR}/slice-${String(i).padStart(2, '0')}.png`, fullPage: true, clip: { x: 0, y, width: 1440, height: h } });
  i++;
}
console.log(`done: ${i} slices, total height ${total}`);
await browser.close();
