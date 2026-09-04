// Full-page screenshots of every archived stonesurgicalarts.com page.
//
// Two things make this non-trivial:
//  1. web.archive.org rate-limits, so pacing is deliberately slow with backoff.
//  2. Many captures are the site's OWN bot-protection page ("One moment, please...")
//     baked into the snapshot by Common Crawl. Reloading never fixes those, so each
//     page carries a ranked list of candidate timestamps and we walk it until one
//     renders real content.
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const OUT = process.env.WB_OUT;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SHOTS = path.join(OUT, 'shots');
const LOG = path.join(OUT, 'capture-log.jsonl');

const DELAY_MS = Number(process.env.WB_DELAY ?? 7000);
const NAV_TIMEOUT = 90_000;
const NET_ATTEMPTS = 3;
const BACKOFF = [45_000, 120_000, 240_000];

const manifest = JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (o) => fs.appendFileSync(LOG, JSON.stringify({ at: new Date().toISOString(), ...o }) + '\n');
const wbUrl = (ts, orig) => `https://web.archive.org/web/${ts}if_/${orig}`;

const BOT_PAGE = /One moment, please|being verified|Checking your browser|Please wait while/i;

// Reject anything that isn't real content: the site's captured bot-protection
// page, and also captures that render blank/near-empty. Some snapshots sit at
// 27-40KB -- past a naive size filter, but they paint nothing. A real page here
// is always taller than the viewport and carries substantial text.
async function looksLikeBotPage(page) {
  return page.evaluate((re) => {
    const rx = new RegExp(re, 'i');
    const body = document.body;
    const txt = body ? body.innerText.trim() : '';
    const h = Math.max(body ? body.scrollHeight : 0, document.documentElement.scrollHeight);
    if (rx.test(document.title) || rx.test(txt.slice(0, 600))) return true;
    if (h <= 1100) return true;                    // no taller than the viewport
    if (txt.replace(/\s+/g, ' ').length < 200) return true;   // effectively blank
    return false;
  }, BOT_PAGE.source);
}

async function prepare(page) {
  await page.evaluate(() => {
    for (const sel of ['#wm-ipp-base', '#wm-ipp', '#donato', '.wb-autocomplete-suggestions']) {
      document.querySelectorAll(sel).forEach((el) => el.remove());
    }
    // The theme paints .animate blocks at opacity:0.001 and its scroll script
    // raises them to 1. Where the archived JS is missing that never fires and the
    // page renders blank, so force the end state. Deliberately scoped to .animate:
    // .mega-menu / .main-menu dropdowns sit at 0.001 too and must STAY hidden.
    for (const el of document.querySelectorAll('.animate')) {
      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('transform', 'none', 'important');
    }
    document.querySelectorAll('img[loading="lazy"]').forEach((el) => el.removeAttribute('loading'));
    for (const img of document.querySelectorAll('img[data-src]')) {
      if (!img.src || img.src.startsWith('data:')) img.src = img.dataset.src;
    }
  });
  await page.evaluate(async () => {
    const step = Math.max(400, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 250));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 600));
  });
  await page.evaluate(() =>
    Promise.race([
      Promise.all([...document.images].filter((i) => !i.complete)
        .map((i) => new Promise((r) => { i.onload = i.onerror = r; }))),
      new Promise((r) => setTimeout(r, 8000)),
    ]));
}

// One navigation attempt at one timestamp. Returns null if it rendered the bot page.
async function tryCapture(page, item, cand) {
  const url = wbUrl(cand.timestamp, item.original);
  let status = 0;
  try {
    const res = await page.goto(url, { waitUntil: 'networkidle2', timeout: NAV_TIMEOUT });
    status = res ? res.status() : 0;
  } catch (e) {
    if (!/timeout|Navigation/i.test(e.message)) throw e;
    log({ slug: item.slug, ts: cand.timestamp, note: 'networkidle2 timeout, using current DOM' });
  }
  if (status === 429 || status === 503) {
    const err = new Error(`rate limited (${status})`);
    err.rateLimited = true;
    throw err;
  }

  if (await looksLikeBotPage(page)) {
    // Stop the interstitial's 5s self-reload loop before moving on.
    await page.goto('about:blank').catch(() => {});
    return null;
  }

  await prepare(page);
  const { height, textLen, title } = await page.evaluate(() => ({
    height: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
    textLen: document.body.innerText.replace(/\s+/g, ' ').trim().length,
    title: document.title,
  }));

  const dest = path.join(SHOTS, item.file);
  try {
    await page.screenshot({ path: dest, fullPage: true });
  } catch (e) {
    log({ slug: item.slug, note: `fullPage failed (${e.message}), clipping` });
    await page.screenshot({ path: dest, clip: { x: 0, y: 0, width: 1440, height: Math.min(height, 15000) } });
  }
  return { status, height, textLen, title, bytes: fs.statSync(dest).size, timestamp: cand.timestamp };
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars', '--disable-dev-shm-usage', '--no-sandbox', '--force-device-scale-factor=1'],
  defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 1 },
});

// Resume-safe: keep records for pages captured by an earlier invocation.
const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : []);
const resultsBy = new Map(readJson(path.join(OUT, 'results.json')).map((r) => [r.file, r]));
const failuresBy = new Map(readJson(path.join(OUT, 'failures.json')).map((r) => [r.slug, r]));
const flush = () => {
  const byIndex = (a, b) => (a.index ?? 0) - (b.index ?? 0);
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify([...resultsBy.values()].sort(byIndex), null, 2));
  fs.writeFileSync(path.join(OUT, 'failures.json'), JSON.stringify([...failuresBy.values()], null, 2));
};

let done = 0, skipped = 0, failed = 0;

for (const item of manifest) {
  const dest = path.join(SHOTS, item.file);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 20_000) { skipped++; continue; }

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36');
  page.setDefaultTimeout(NAV_TIMEOUT);

  let got = null;
  const tried = [];

  outer:
  for (const cand of item.candidates) {
    for (let attempt = 1; attempt <= NET_ATTEMPTS; attempt++) {
      try {
        const r = await tryCapture(page, item, cand);
        if (r) { got = r; break outer; }
        tried.push({ ts: cand.timestamp, why: 'bot-page' });
        log({ slug: item.slug, ts: cand.timestamp, result: 'bot-page' });
        await sleep(2500);
        break;                                   // next candidate timestamp
      } catch (e) {
        const wait = e.rateLimited ? (BACKOFF[attempt - 1] ?? 240_000) : 12_000 * attempt;
        log({ slug: item.slug, ts: cand.timestamp, result: 'retry', attempt, error: e.message, waitMs: wait });
        console.log(`[${item.index}/${manifest.length}] retry ${attempt} ${item.slug}: ${e.message} (wait ${wait / 1000}s)`);
        if (attempt < NET_ATTEMPTS) await sleep(wait);
        else tried.push({ ts: cand.timestamp, why: e.message });
      }
    }
  }

  if (got) {
    done++;
    resultsBy.set(item.file, { ...item, captured: got });
    failuresBy.delete(item.slug);
    console.log(`[${item.index}/${manifest.length}] OK  ${item.file}  ${(got.bytes / 1024) | 0}KB  h=${got.height}  text=${got.textLen}  ts=${got.timestamp}`);
    log({ slug: item.slug, file: item.file, result: 'ok', ...got });
  } else {
    failed++;
    resultsBy.delete(item.file);
    failuresBy.set(item.slug, { slug: item.slug, file: item.file, original: item.original, tried });
    if (fs.existsSync(dest)) fs.rmSync(dest);     // never leave a blank/bot PNG behind
    console.log(`[${item.index}/${manifest.length}] FAIL ${item.slug} (no usable capture; tried ${tried.length})`);
    log({ slug: item.slug, result: 'failed', tried });
  }

  await page.close();
  flush();
  await sleep(DELAY_MS);
}

await browser.close();
console.log(`\nDONE  captured=${done} skipped=${skipped} failed=${failed} of ${manifest.length}`);
