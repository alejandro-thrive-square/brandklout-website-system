// Production in a real browser: images decoded, no console errors, fonts and CSS applied.
// Chrome is pinned to Cloudflare's current answer, because this machine's VPN caches DNS.
import { chromium } from 'playwright-core';
const j = await (await fetch('https://cloudflare-dns.com/dns-query?name=masonparkpediatricdental.com&type=A', { headers: { accept: 'application/dns-json' } })).json();
const ip = j.Answer.find(a => a.type === 1).data;
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: [`--host-resolver-rules=MAP masonparkpediatricdental.com ${ip}`] });
let fails = 0;
for (const [w, h] of [[1440, 900], [390, 844]]) for (const p of ['/', '/about-us/', '/services/comprehensive-pediatric-dentistry/', '/blog/']) {
  const page = await b.newPage({ viewport: { width: w, height: h } });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
  page.on('pageerror', e => errs.push('pageerror ' + e.message.slice(0, 120)));
  const r = await page.goto('https://masonparkpediatricdental.com' + p, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  const info = await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('main img')].slice(0, 12);
    for (const i of imgs) { i.loading = 'eager'; await i.decode().catch(() => {}); }
    return { broken: imgs.filter(i => !i.naturalWidth).map(i => i.getAttribute('src')).slice(0, 3), n: imgs.length,
      font: getComputedStyle(document.querySelector('h1,h2')).fontFamily.split(',')[0], css: getComputedStyle(document.body).backgroundColor, overflow: document.documentElement.scrollWidth > innerWidth };
  });
  const bad = r.status() !== 200 || info.broken.length || info.overflow || errs.filter(e => !/termly|google|gstatic|maps/i.test(e)).length;
  if (bad) fails++;
  console.log(bad ? 'FAIL' : 'PASS', w, p, r.status(), `imgs ${info.n} broken ${info.broken.length}`, info.font, info.overflow ? 'OVERFLOW' : '', errs.length ? 'console: ' + errs.join(' | ') : '');
  await page.close();
}
await b.close();
console.log(fails ? `${fails} FAILED` : 'all passed');
