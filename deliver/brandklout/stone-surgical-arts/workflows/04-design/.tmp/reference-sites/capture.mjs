import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2];
const SITES = [
  ['nassif', 'https://www.drpaulnassif.com/'],
  ['nassifmd-medspa', 'https://www.nassifmdmedspa.com/'],
  ['maercks', 'https://www.themaercksinstitute.com/'],
  ['nipandtuck', 'https://www.drnipandtuck.com/'],
];

const W = 1440, H = 900;

const browser = await puppeteer.launch({
  headless: 'new', executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900'],
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
});

for (const [slug, url] of SITES) {
  const dir = path.join(OUT, slug);
  fs.mkdirSync(dir, { recursive: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
  } catch (e) {
    console.log(slug + ' NAV WARN: ' + e.message);
  }
  await new Promise(r => setTimeout(r, 3000));

  // Hide cookie/consent/accessibility overlays visually (no consent given, nothing clicked)
  await page.evaluate(() => {
    const words = ['cookie', 'consent', 'gdpr', 'ccpa', 'privacy-choice', 'privacychoice', 'osano', 'onetrust', 'termly', 'usercentrics', 'acsb', 'userway', 'accessibe', 'popup', 'modal', 'chat-widget', 'podium'];
    const hit = (s) => { s = (s || '').toString().toLowerCase(); return words.some(w => s.includes(w)); };
    for (const el of document.querySelectorAll('body *')) {
      if (hit(el.id) || hit(el.className)) {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' || cs.position === 'absolute' || el.tagName === 'DIALOG' || el.tagName === 'IFRAME') {
          el.style.setProperty('display', 'none', 'important');
        }
      }
    }
    document.querySelectorAll('dialog[open]').forEach(d => d.style.setProperty('display', 'none', 'important'));
    document.body.style.overflow = 'auto';
  });
  await new Promise(r => setTimeout(r, 500));

  // scroll through to trigger lazy loading / scroll animations
  const total = await page.evaluate(async () => {
    const step = 600;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 220));
    }
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 800));
    return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  });
  console.log(slug + ' height=' + total);

  // hide fixed/sticky overlays so they do not repeat in every segment
  await page.evaluate(() => {
    window.__hidden = [];
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.position === 'sticky') {
        const r = el.getBoundingClientRect();
        if (r.height > 0 && r.width > 0) { window.__hidden.push([el, el.style.visibility]); }
      }
    }
  });

  const segs = Math.min(22, Math.ceil(total / H));
  for (let i = 0; i < segs; i++) {
    const y = i * H;
    await page.evaluate((yy, first) => {
      window.scrollTo(0, yy);
      for (const [el, prev] of window.__hidden) { el.style.visibility = first ? prev : 'hidden'; }
    }, y, i === 0);
    await new Promise(r => setTimeout(r, 700));
    await page.screenshot({ path: path.join(dir, String(i).padStart(2, '0') + '.png') });
  }

  // one tall full-page image per site, for sharing
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    for (const [el, prev] of window.__hidden) { el.style.visibility = prev; }
  });
  await new Promise(r => setTimeout(r, 600));
  try {
    await page.screenshot({ path: path.join(dir, 'full-page.png'), fullPage: true, captureBeyondViewport: true });
  } catch (e) { console.log(slug + ' FULLPAGE WARN: ' + e.message); }

  const text = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync(path.join(dir, 'text.txt'), text);
  const outline = await page.evaluate(() => {
    const rows = [];
    const secs = document.querySelectorAll('section, header, footer, main > div, [class*="section"]');
    let i = 0;
    for (const s of secs) {
      const r = s.getBoundingClientRect();
      const top = r.top + window.scrollY;
      if (r.height < 120) continue;
      const heading = s.querySelector('h1,h2,h3');
      rows.push([Math.round(top), Math.round(r.height), s.tagName, (s.className || '').toString().slice(0, 90), heading ? heading.innerText.trim().slice(0, 80) : ''].join(' | '));
      if (++i > 120) break;
    }
    return rows.join('\n');
  });
  fs.writeFileSync(path.join(dir, 'outline.txt'), outline);
  await page.close();
}

await browser.close();
console.log('done');
