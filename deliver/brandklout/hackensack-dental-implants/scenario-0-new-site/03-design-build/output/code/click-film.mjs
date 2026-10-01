// Client script, 2026-10-01. Presses what check-staging.mjs only looks at: the hero film's pause
// control, the play button (light box with the patient film, with sound), Escape to close and focus
// handed back; then scrolls to the numbers and reads them once they have counted. A real mouse
// click and a real key press, desktop and phone.
// Usage (from the step folder): node output/code/click-film.mjs [url] > output/click-film.txt
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve(process.cwd(), '../../scenario-1-migration/01-old-site-capture/scripts/package.json'));
const puppeteer = require('puppeteer-core');
const URL_ = (process.argv[2] || 'https://hackensack-dental-implants-staging.up.railway.app').replace(/\/$/, '') + '/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const say = (ok, name, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });

for (const [w, h, label] of [[1440, 900, 'desktop'], [390, 844, 'phone']]) {
  const pg = await browser.newPage();
  const errors = [];
  pg.on('pageerror', (e) => errors.push(e.message));
  await pg.setUserAgent(UA);
  await pg.setViewport({ width: w, height: h, isMobile: w < 500, hasTouch: w < 500 });
  await pg.goto(URL_, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3500);

  const v0 = await pg.evaluate(() => { const v = document.querySelector('.js-hero-video'); return { src: v.currentSrc, playing: !v.paused, t: v.currentTime }; });
  await sleep(1200);
  const v1 = await pg.evaluate(() => document.querySelector('.js-hero-video').currentTime);
  say(v0.playing && v1 > v0.t && /\/uploads\//.test(v0.src) && (w < 768 ? /hero-loop-m/.test(v0.src) : !/hero-loop-m/.test(v0.src)), `${label}: hero film plays the right file from the media library`, `${v0.src.split('/').pop()} ${v0.t.toFixed(1)}s -> ${v1.toFixed(1)}s`);

  /* BugHerd #16: the doctor's card sits at the foot of the film (off the faces); on a laptop that is
     below the first view, so desktop asks only that it sits inside the film's lower edge */
  const firstView = await pg.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(); const d = r('.hero-doctor'); const p = r('.hero-play'); const f = r('.hero-frame'); return { play: p.top >= 0 && p.bottom <= innerHeight, doctorInView: d.top >= 0 && d.bottom <= innerHeight, doctorAtFoot: f.bottom - d.bottom >= 0 && f.bottom - d.bottom < 80 }; });
  say(firstView.play && (w < 768 ? firstView.doctorInView : firstView.doctorAtFoot), `${label}: play button in the first view; doctor's card ${w < 768 ? 'in the first view' : 'at the foot of the film'}`, JSON.stringify(firstView));

  await pg.click('.film-toggle');
  await sleep(400);
  const paused = await pg.evaluate(() => ({ paused: document.querySelector('.js-hero-video').paused, label: document.querySelector('.film-toggle').getAttribute('aria-label') }));
  await pg.click('.film-toggle');
  await sleep(600);
  const resumed = await pg.evaluate(() => !document.querySelector('.js-hero-video').paused);
  say(paused.paused && /Play/.test(paused.label) && resumed, `${label}: the pause control stops and restarts the film`, paused.label);

  await pg.click('.hero-play');
  await sleep(2500);
  const box = await pg.evaluate(() => {
    const f = document.querySelector('.film'); const v = f && f.querySelector('video');
    return f ? { open: true, src: v.currentSrc.split('/').pop(), playing: !v.paused, muted: v.muted, t: v.currentTime, w: Math.round(v.getBoundingClientRect().width), focus: document.activeElement.className, hero: document.querySelector('.js-hero-video').paused } : { open: false };
  });
  say(box.open && box.playing && !box.muted && box.t > 0.5 && /isaac-story/.test(box.src) && box.w > 300, `${label}: play opens the patient film with sound`, JSON.stringify(box));
  say(box.focus === 'film__close' && box.hero, `${label}: focus moves into the light box and the background film pauses`);
  await pg.keyboard.press('Escape');
  await sleep(600);
  const closed = await pg.evaluate(() => ({ gone: !document.querySelector('.film'), focus: document.activeElement.className, hero: !document.querySelector('.js-hero-video').paused }));
  say(closed.gone && /hero-play/.test(closed.focus) && closed.hero, `${label}: Escape closes it, focus returns to the play button, the background film resumes`, JSON.stringify(closed));

  await pg.evaluate(() => { const s = document.querySelector('.stats'); if (window.WZ && WZ.smoother) WZ.smoother.scrollTo(s, false, 'top 60%'); else window.scrollTo(0, s.getBoundingClientRect().top + scrollY - innerHeight * 0.6); });
  await sleep(3500);
  const nums = await pg.evaluate(() => [...document.querySelectorAll('.stat strong')].map((n) => n.textContent.trim()));
  say(nums.join('|') === '5.0|50,000+|30+|4', `${label}: the numbers count up and settle on the written values`, nums.join(' | '));
  say(errors.length === 0, `${label}: no page errors`, errors.join(' | '));
  await pg.close();
}

await browser.close();
console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exitCode = failed ? 1 : 0;
