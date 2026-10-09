// Client script, 2026-09-30. What the generic live gates do not ask of THIS site's staging page:
// the rendered head (robots, canonical, og:url, icon), the two variable fonts actually loaded from
// /uploads, the Embed block in place with its form frame, the editor breakpoints, and the motion
// contract on the published page.
// Usage (from the step folder): node output/code/check-staging.mjs [url] > output/live-staging.txt
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve(process.cwd(), '../../scenario-1-migration/01-old-site-capture/scripts/package.json'));
const puppeteer = require('puppeteer-core');
const URL_ = (process.argv[2] || 'https://hackensack-dental-implants-staging.up.railway.app').replace(/\/$/, '') + '/';
const host = new URL(URL_).hostname;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const say = (ok, name, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
const pg = await browser.newPage();
const bad = [];
pg.on('pageerror', (e) => bad.push('pageerror ' + e.message));
pg.on('response', (r) => { if (r.status() >= 400 && new URL(r.url()).hostname === host) bad.push(`${r.status()} ${new URL(r.url()).pathname}`); });
await pg.setViewport({ width: 1440, height: 900 });
await pg.goto(URL_, { waitUntil: 'networkidle2', timeout: 90000 });
await sleep(3000);

const d = await pg.evaluate(async () => {
  const meta = (sel) => document.querySelector(sel)?.getAttribute('content') ?? document.querySelector(sel)?.getAttribute('href') ?? null;
  await document.fonts.ready;
  const probe = document.createElement('span');
  probe.textContent = 'Hamburgefonstiv';
  probe.style.cssText = 'position:absolute;visibility:hidden;font:400 80px Newsreader;white-space:nowrap';
  document.body.appendChild(probe);
  probe.style.fontVariationSettings = '"opsz" 6'; const a = probe.getBoundingClientRect().width;
  probe.style.fontVariationSettings = '"opsz" 72'; const b = probe.getBoundingClientRect().width;
  probe.remove();
  const frame = document.querySelector('.consultation_card iframe');
  return {
    title: document.title,
    robots: [...document.querySelectorAll('meta[name="robots"]')].map((m) => m.content),
    canonical: meta('link[rel="canonical"]'),
    ogUrl: meta('meta[property="og:url"]'),
    ogImage: meta('meta[property="og:image"]'),
    description: meta('meta[name="description"]'),
    icon: meta('link[rel="icon"]'),
    fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')),
    h1Font: getComputedStyle(document.querySelector('h1')).fontFamily,
    opszWidths: [Math.round(a), Math.round(b)],
    boxSizing: getComputedStyle(document.querySelector('.solutions_item')).boxSizing,
    textlink: (() => { const t = document.querySelector('.button.is-link'); const cs = getComputedStyle(t); return { bg: cs.backgroundImage, border: cs.borderBottomWidth }; })(),
    embed: { block: !!document.querySelector('.consultation_card .wz-embed'), frame: frame ? frame.src : null, frameHeight: frame ? Math.round(frame.getBoundingClientRect().height) : 0 },
    chapters: document.querySelectorAll('section[data-chapter]').length,
    wz: window.WZ ? { ok: WZ.ok, smoother: !!WZ.smoother, active: WZ.active } : null,
    pins: window.ScrollTrigger ? ScrollTrigger.getAll().filter((t) => t.pin).map((t) => t.trigger.id) : [],
    images: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
    alts: [...document.querySelectorAll('main img')].filter((i) => !i.alt).length,
    h1: document.querySelectorAll('h1').length,
    interaction: {
      drawings: document.querySelectorAll('.solutions_item .solutions_drawing svg').length,
      drawingPos: document.querySelector('.solutions_drawing') ? getComputedStyle(document.querySelector('.solutions_drawing')).position : null,
      cursor: !!document.querySelector('.cursor'),
      rule: !!document.querySelector('.journey_steps .journey_rule'),
      film: (() => { const v = document.querySelector('[data-hero-video]'); const t = document.querySelector('.arrival_frame .arrival_film-toggle'); return !!(v && v.currentSrc && v.readyState >= 2 && t && getComputedStyle(t).position === 'absolute'); })(),
    },
  };
});

const staging = /-staging[.]up[.]railway[.]app$|^staging[.]/.test(host);
const PINS = ['story-scene', 'process-scene', 'results-scene'];
say(d.wz && d.wz.ok && d.wz.smoother && PINS.every((p) => d.pins.includes(p)), 'runtime armed on the published page, three pinned scenes', `pins ${d.pins.join(', ')}; ${d.wz ? d.wz.active.join(' ') : 'no WZ'}`);
say(d.interaction.drawings === 3 && d.interaction.rule && d.interaction.drawingPos === 'static' && d.interaction.film && !d.interaction.cursor, 'interaction layer created and styled (the verbatim stylesheet reached the page)', JSON.stringify(d.interaction));
say(d.chapters === 8 && d.h1 === 1, 'eight chapters, one h1');
say(d.fonts.includes('Newsreader') && d.fonts.includes('DM Sans') && /Newsreader/.test(d.h1Font), 'both typefaces loaded from the media library', d.fonts.join(', '));
say(d.opszWidths[0] !== d.opszWidths[1], 'Newsreader is the variable file (optical size changes the width)', `${d.opszWidths[0]}px at opsz 6, ${d.opszWidths[1]}px at opsz 72`);
say(d.textlink.bg === 'none' && d.textlink.border === '1px', 'text links are underlined, not blocks', JSON.stringify(d.textlink));
say(d.boxSizing === 'border-box', 'border-box sizing reached the page');
say(d.embed.block && /leadconnectorhq[.]com\/widget\/survey/.test(d.embed.frame || '') && d.embed.frameHeight > 200, 'the consultation form is an Embed block with its frame sized', `${d.embed.frameHeight}px tall`);
say(d.images.length === 0 && d.alts === 0, 'every image loaded and carries alt text', d.images.join(' ') + (d.alts ? ` ${d.alts} without alt` : ''));
say(!!d.icon && !!d.ogImage && !!d.description, 'icon, share image and description are in the head', `${d.icon}`);
if (staging) {
  say(d.robots.some((r) => /noindex/.test(r)), 'staging says noindex', d.robots.join(' | '));
  say(!d.canonical, 'staging emits no canonical', String(d.canonical));
  say(!d.ogUrl || new URL(d.ogUrl).hostname === host, 'og:url points at staging itself', String(d.ogUrl));
} else {
  say(!d.robots.some((r) => /noindex/.test(r)), 'production is indexable');
  say(!!d.canonical && new URL(d.canonical).hostname === host, 'canonical points at this host', String(d.canonical));
}
say(bad.length === 0, 'no page error and no failed request on this host', [...new Set(bad)].join(' | '));
await browser.close();
console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exitCode = failed ? 1 : 0;
