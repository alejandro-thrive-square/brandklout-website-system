const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, 'reference-markdown');
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  { slug: 'heart-current-squarespace', url: 'https://www.myheartconstruction.com/' },
  { slug: 'las-ruinas-reference', url: 'https://info.lasruinas.com/' }
];

function cleanText(text) {
  return (text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

function mdEscape(text) {
  return (text || '').replace(/\|/g, '\\|').trim();
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 650;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 120);
    });
  });
}

async function scrapeTarget(browser, target) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const consoleMessages = [];
  page.on('console', (msg) => {
    if (['error', 'warning'].includes(msg.type())) consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });

  await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await autoScroll(page);
  await page.waitForTimeout(800);

  const data = await page.evaluate(() => {
    const textOf = (el) => (el?.innerText || el?.textContent || '').replace(/\s+/g, ' ').trim();
    const attr = (el, name) => el?.getAttribute(name) || '';
    const title = document.title || '';
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const canonical = document.querySelector('link[rel="canonical"]')?.href || location.href;

    const headings = [...document.querySelectorAll('h1,h2,h3,h4')]
      .map((el) => ({ level: el.tagName.toLowerCase(), text: textOf(el) }))
      .filter((item) => item.text);

    const ctas = [...document.querySelectorAll('a,button,input[type="submit"]')]
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        text: textOf(el) || attr(el, 'value') || attr(el, 'aria-label'),
        href: el.href || attr(el, 'href') || ''
      }))
      .filter((item) => item.text)
      .filter((item, idx, arr) => arr.findIndex((other) => other.text === item.text && other.href === item.href) === idx)
      .slice(0, 80);

    const images = [...document.querySelectorAll('img')]
      .map((img) => ({
        src: img.currentSrc || img.src || attr(img, 'data-src'),
        alt: attr(img, 'alt'),
        width: img.naturalWidth || img.width || 0,
        height: img.naturalHeight || img.height || 0
      }))
      .filter((item) => item.src)
      .filter((item, idx, arr) => arr.findIndex((other) => other.src === item.src) === idx)
      .slice(0, 60);

    const sectionSelectors = ['main section', '[data-section-id]', 'section', 'main > div', '.sqs-block', 'article'];
    const candidates = [];
    sectionSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        const rect = el.getBoundingClientRect();
        const text = textOf(el);
        if (text.length > 80 && rect.width > 100) candidates.push({ selector, text });
      });
    });
    const seen = new Set();
    const sections = candidates
      .map((item) => ({ selector: item.selector, text: item.text.replace(/\s+/g, ' ').trim() }))
      .filter((item) => {
        const key = item.text.slice(0, 180);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 40);

    const bodyText = textOf(document.body);
    return { title, description, canonical, headings, ctas, images, sections, bodyText };
  });

  const lines = [];
  lines.push(`# ${data.title || target.slug}`);
  lines.push('');
  lines.push(`- **URL:** ${target.url}`);
  lines.push(`- **Canonical:** ${data.canonical}`);
  if (data.description) lines.push(`- **Meta description:** ${data.description}`);
  lines.push(`- **Scraped:** ${new Date().toISOString()}`);
  lines.push('');

  lines.push('## Heading Map');
  if (data.headings.length) {
    data.headings.forEach((h) => {
      const level = Number(h.level.replace('h', '')) + 1;
      lines.push(`${'#'.repeat(Math.min(level, 6))} ${h.text}`);
    });
  } else {
    lines.push('_No headings found._');
  }
  lines.push('');

  lines.push('## CTAs / Navigation Links');
  if (data.ctas.length) {
    lines.push('| Text | Href |');
    lines.push('| --- | --- |');
    data.ctas.forEach((cta) => lines.push(`| ${mdEscape(cta.text)} | ${mdEscape(cta.href)} |`));
  } else {
    lines.push('_No CTAs found._');
  }
  lines.push('');

  lines.push('## Image Inventory');
  if (data.images.length) {
    lines.push('| Alt | Dimensions | Source |');
    lines.push('| --- | ---: | --- |');
    data.images.forEach((img) => lines.push(`| ${mdEscape(img.alt)} | ${img.width}×${img.height} | ${mdEscape(img.src)} |`));
  } else {
    lines.push('_No images found._');
  }
  lines.push('');

  lines.push('## Rendered Section Text');
  data.sections.forEach((section, index) => {
    lines.push(`### Section ${index + 1}`);
    lines.push('');
    lines.push(cleanText(section.text));
    lines.push('');
  });

  lines.push('## Full Rendered Body Text');
  lines.push('');
  lines.push(cleanText(data.bodyText));
  lines.push('');

  if (consoleMessages.length) {
    lines.push('## Console Warnings / Errors');
    consoleMessages.forEach((msg) => lines.push(`- ${msg}`));
    lines.push('');
  }

  const md = lines.join('\n');
  fs.writeFileSync(path.join(outDir, `${target.slug}.md`), md, 'utf8');
  await page.close();
  return { target, output: path.join(outDir, `${target.slug}.md`), headings: data.headings.length, ctas: data.ctas.length, images: data.images.length, sections: data.sections.length };
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const target of targets) {
    results.push(await scrapeTarget(browser, target));
  }
  await browser.close();
  fs.writeFileSync(path.join(outDir, 'scrape-summary.json'), JSON.stringify(results, null, 2), 'utf8');
  console.log(JSON.stringify(results, null, 2));
})();
