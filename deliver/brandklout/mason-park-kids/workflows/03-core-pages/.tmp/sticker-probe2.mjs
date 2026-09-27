// Which rule paints the sticker's ink? Ask CDP for the matched-rule cascade.
// node sticker-probe2.mjs > sticker-probe2.log
import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = 'file:///' + path.join(here, '..', 'home', 'index.html').replace(/\\/g, '/');

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 855 } });
const cdp = await page.context().newCDPSession(page);
await cdp.send('DOM.enable');
await cdp.send('CSS.enable');
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(1500);

const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '.ft-sticker' });
const m = await cdp.send('CSS.getMatchedStylesForNode', { nodeId });
for (const r of m.matchedCSSRules || []) {
  const decls = r.rule.style.cssProperties.filter((p) => p.name === 'color' || p.name === 'font-family');
  if (!decls.length) continue;
  const sheet = m.cssStyleSheets?.find?.((s) => s.styleSheetId === r.rule.styleSheetId);
  console.log(
    (r.rule.selectorList.text + '').padEnd(48),
    '| line', (r.rule.style.range?.startLine ?? '?'),
    '|', decls.map((d) => `${d.name}: ${d.value}`).join('; ')
  );
}
console.log('--- inline:', JSON.stringify((m.inlineStyle?.cssProperties || []).map((p) => p.name + ':' + p.value)));
await browser.close();
