// Clicks the /patient-reviews story carousel: next x5 (wraps to 01), prev x1 (wraps to 05).
//   node carousel-test.mjs [base]     base defaults to the local build (file://)
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
const here = path.dirname(fileURLToPath(import.meta.url));
const base = process.argv[2];
const url = base ? `${base}/patient-reviews/` : pathToFileURL(path.join(here, '..', 'home', 'patient-reviews', 'index.html')).href;
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
let fail = 0;
for (const w of [1440, 390]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
  await p.goto(url, { waitUntil: 'load' });
  await p.locator('#stories').scrollIntoViewIfNeeded();
  const read = () => p.evaluate(() => ({ n: document.querySelector('.st-count b').textContent, on: [...document.querySelectorAll('.st-card')].findIndex((c) => c.classList.contains('is-on')), x: Math.round(document.querySelector('.st-track').scrollLeft) }));
  const seq = [await read()];
  for (let i = 0; i < 5; i++) { await p.click('.st-next'); await p.waitForTimeout(400); seq.push(await read()); }
  await p.click('.st-prev'); await p.waitForTimeout(400); seq.push(await read());
  const got = seq.map((s) => s.n).join(' ');
  const want = '01 02 03 04 05 01 05';
  const ok = got === want && seq.every((s) => +s.n === s.on + 1);
  if (!ok) fail++;
  console.log(`${w}: ${ok ? 'PASS' : 'FAIL'} ${got}  scrollLeft ${seq.map((s) => s.x).join(',')}`);
  await p.close();
}
await b.close();
process.exit(fail ? 1 : 0);
