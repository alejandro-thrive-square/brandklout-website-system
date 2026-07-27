const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const root = __dirname;
const fileUrl = 'file://' + path.resolve(root, 'final-design/index.html').replace(/\\/g, '/');
const screenshotsDir = path.resolve(root, 'screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

const allowedConsolePatterns = [/Not allowed to load local resource/i];

async function openPage(browser, viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('console', (msg) => {
    if (['error', 'warning'].includes(msg.type())) {
      const text = msg.text();
      if (!allowedConsolePatterns.some((pattern) => pattern.test(text))) {
        errors.push(`${msg.type()}: ${text}`);
      }
    }
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  await page.goto(fileUrl, { waitUntil: 'load' });
  return { page, errors };
}

async function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function hasText(page, selector, pattern) {
  const text = await page.locator(selector).first().innerText();
  return pattern.test(text);
}

(async () => {
  const browser = await chromium.launch();
  const results = [];

  async function run(name, fn) {
    try {
      await fn();
      results.push({ name, status: 'PASS' });
      console.log(`PASS ${name}`);
    } catch (error) {
      results.push({ name, status: 'FAIL', error: error.message });
      console.error(`FAIL ${name}: ${error.message}`);
      process.exitCode = 1;
    }
  }

  await run('desktop load, sections, scroll UI', async () => {
    const { page, errors } = await openPage(browser, { width: 1440, height: 1100 });
    await assert(/Los Angeles Custom Homes/.test(await page.title()), 'Title is not custom-home focused');
    await assert(await hasText(page, 'h1', /Custom homes built with intention/i), 'H1 missing custom homes message');
    for (const selector of ['#why', '#planning', '#process', '#consultation', '.photo-frame']) {
      await assert(await page.locator(selector).count() > 0, `${selector} missing`);
    }
    await page.mouse.wheel(0, 2200);
    await page.waitForTimeout(250);
    await assert((await page.locator('.sticky-cta.is-visible').count()) === 1, 'Sticky CTA did not appear after scroll');
    const progressWidth = await page.locator('[data-scroll-progress]').evaluate((el) => getComputedStyle(el).width);
    await assert(progressWidth !== '0px', 'Scroll progress did not update');
    await page.screenshot({ path: path.join(screenshotsDir, 'desktop.png'), fullPage: true });
    await assert(errors.length === 0, `Console/page errors: ${errors.join(' | ')}`);
    await page.close();
  });

  await run('interactive path tabs', async () => {
    const { page, errors } = await openPage(browser, { width: 1280, height: 900 });
    await page.locator('[data-path-tab="path-2"]').click();
    await assert(await page.locator('#path-2').isVisible(), 'Path 2 panel not visible after click');
    await assert(!(await page.locator('#path-1').isVisible()), 'Path 1 panel still visible after click');
    await page.locator('[data-path-tab="path-4"]').click();
    await assert(await page.locator('#path-4').isVisible(), 'Path 4 panel not visible after click');
    await assert((await page.locator('[data-path-tab="path-4"]').getAttribute('aria-selected')) === 'true', 'Path 4 aria-selected not true');
    await assert(errors.length === 0, `Console/page errors: ${errors.join(' | ')}`);
    await page.close();
  });

  await run('testimonial slider shows real current-site testimonials', async () => {
    const { page, errors } = await openPage(browser, { width: 1280, height: 900 });
    await assert(await page.locator('[data-testimonial-slide]').first().isVisible(), 'First testimonial not visible');
    await assert(await hasText(page, '[data-testimonial-slide].is-active', /They treated our home like it was their own/i), 'First real testimonial missing');
    await page.locator('[data-testimonial-next]').click();
    await assert(await hasText(page, '[data-testimonial-slide].is-active', /Professional from day one/i), 'Second testimonial did not appear after next click');
    await page.locator('[data-testimonial-prev]').click();
    await assert(await hasText(page, '[data-testimonial-slide].is-active', /They treated our home like it was their own/i), 'Previous testimonial did not return to first slide');
    await assert(errors.length === 0, `Console/page errors: ${errors.join(' | ')}`);
    await page.close();
  });

  await run('draft form intercepts placeholder endpoint', async () => {
    const { page, errors } = await openPage(browser, { width: 1280, height: 900 });
    await page.locator('#name').fill('Test Homeowner');
    await page.locator('#email').fill('test@example.com');
    await page.locator('#phone').fill('555-0100');
    await page.locator('#city').fill('Los Angeles');
    await page.locator('#project-type').selectOption({ label: 'Custom Home' });
    await page.locator('#budget').selectOption({ label: '$1M+' });
    await page.locator('#timeline').selectOption({ label: '3–6 months' });
    await page.locator('#message').fill('Planning a custom home project.');
    await page.locator('button[type="submit"]').click();
    await assert(await page.locator('.form-success').isVisible(), 'Form success message not visible');
    await assert(await hasText(page, '.form-success', /Draft form submitted locally/), 'Form success message text incorrect');
    await assert(errors.length === 0, `Console/page errors: ${errors.join(' | ')}`);
    await page.close();
  });

  await run('mobile navigation', async () => {
    const { page, errors } = await openPage(browser, { width: 390, height: 844 });
    await page.locator('[data-nav-toggle]').click();
    await assert((await page.locator('[data-nav]').getAttribute('class')).includes('is-open'), 'Mobile nav did not open');
    await assert((await page.locator('[data-nav-toggle]').getAttribute('aria-expanded')) === 'true', 'Mobile aria-expanded not true');
    await page.locator('[data-nav] a[href="#planning"]').click();
    await assert(!(await page.locator('[data-nav]').getAttribute('class')).includes('is-open'), 'Mobile nav did not close after navigation');
    await assert((await page.locator('[data-nav-toggle]').getAttribute('aria-expanded')) === 'false', 'Mobile aria-expanded not false after close');
    await page.screenshot({ path: path.join(screenshotsDir, 'mobile.png'), fullPage: true });
    await assert(errors.length === 0, `Console/page errors: ${errors.join(' | ')}`);
    await page.close();
  });

  await browser.close();

  const report = {
    url: fileUrl,
    generated_at: new Date().toISOString(),
    results,
    screenshots: [
      path.relative(root, path.join(screenshotsDir, 'desktop.png')).replace(/\\/g, '/'),
      path.relative(root, path.join(screenshotsDir, 'mobile.png')).replace(/\\/g, '/')
    ]
  };
  fs.writeFileSync(path.join(root, 'playwright-report.json'), JSON.stringify(report, null, 2));

  if (process.exitCode) process.exit(process.exitCode);
})();
