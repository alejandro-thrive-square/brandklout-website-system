/**
 * Console errors and failed requests on every published route, motion ON.
 *
 * > [!WARNING]
 * > **A REQUEST TO AN OPAQUE 72-CHARACTER TOKEN AT THE SITE ROOT IS THIS
 * > MACHINE'S VPN, NOT THE SITE.** NordVPN's Threat Protection rewrites every
 * > asset URL in Chrome to `https://<origin>/<random token>` and the aborted
 * > one shows up as `net::ERR_ABORTED` on every page. The tell is that scripts,
 * > fetches AND FONTS all come from paths that are not in the served HTML — and
 * > that the sibling's live site does exactly the same thing. It is filtered
 * > below so a real failure is not lost in eleven copies of a false one.
 * > See the `nordvpn-threat-protection-filters-chrome` note.
 */
import puppeteer from 'puppeteer-core';

// A path at the origin root that is one long base64url token, referenced by no
// markup: the VPN's rewrite, not ours. Everything this site actually serves
// lives under /_instatic/, /uploads/ or a readable slug.
const VPN_REWRITE = /^https?:\/\/[^/]+\/[A-Za-z0-9_-]{40,}$/;

const BASE = 'https://stone-med-spa-production.up.railway.app';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ROUTES = ['', 'treatments', 'botox', 'results', 'membership', 'financing', 'meet-the-doctor', 'team', 'about', 'book', 'thank-you'];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'] });
let bad = 0;
for (const route of ROUTES) {
  const p = await browser.newPage();
  const problems = [];
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(`${m.type()}: ${m.text().slice(0, 160)}`); });
  p.on('pageerror', (e) => problems.push(`pageerror: ${String(e).slice(0, 160)}`));
  p.on('requestfailed', (r) => { if (!VPN_REWRITE.test(r.url())) problems.push(`requestfailed: ${r.url().slice(0, 120)} ${r.failure()?.errorText}`); });
  p.on('response', (r) => { if (r.status() >= 400 && !VPN_REWRITE.test(r.url())) problems.push(`http ${r.status()}: ${r.url().slice(0, 120)}`); });
  await p.setViewport({ width: 1440, height: 1000 });
  await p.goto(`${BASE}/${route}`, { waitUntil: 'networkidle0', timeout: 120000 });
  await p.evaluate(async () => {
    await new Promise((r) => { let y = 0; const t = setInterval(() => { window.scrollBy(0, 700); y += 700; if (y > document.body.scrollHeight) { clearInterval(t); r(); } }, 30); });
  });
  await new Promise((r) => setTimeout(r, 1500));
  console.log(`${(route || '/').padEnd(18)} ${problems.length ? 'PROBLEMS' : 'clean'}`);
  for (const x of problems) { console.log('   ' + x); bad++; }
  await p.close();
}
console.log(bad ? `\n${bad} problem(s)` : '\nconsole clean on every route');
await browser.close();
process.exit(bad ? 1 : 0);
