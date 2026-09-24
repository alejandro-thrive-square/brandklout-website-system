// #172: the live fluoride tick list, cropped, at 1440 and 390.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const w of [1440, 390]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
  await p.goto('https://staging.masonparkpediatricdental.com/services/comprehensive-pediatric-dentistry', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(2000);
  await p.addStyleTag({ content: '.masthead_component,[id^=termly],.t-consentPrompt{display:none!important}' });
  await p.locator('section#fluoride').screenshot({ path: `shots/bh/tick172-${w}.png` });
  await p.close();
}
await b.close();
