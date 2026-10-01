#!/usr/bin/env node
/**
 * live-page-check.mjs — fast post-publish check of served pages (staging or live).
 *
 * Promoted 2026-09-23. Generalises checks that were re-written per client:
 *   - stone-dental-implant-center runbook 2026-09-03 (em dash pass re-fetched live; the hero
 *     form published as an empty <div class="w-embed"></div>; CDN served the old page)
 *   - marvel-dental / legacy-dental-pasadena workflows/08-qa/output/gate.mjs (foreign names,
 *     {{tokens}}, placeholder form ids, main line vs campaign line)
 *   - arvada-dental-center workflows/07-webflow-build/verify_links.mjs (tel: and hrefs)
 *   - termly-ghl-consent gotcha: cf-cache HIT with a non-zero age is the edge, not the deploy.
 *
 * It reads the served HTML only. That is a first pass, not the verdict: scripts that inject
 * the head or swap numbers at runtime (DNI, Termly, a registered script swallowed by broken
 * markup) are only visible in a real browser DOM. Drive the page for those.
 *
 *   node live-page-check.mjs <url>[,<url>...] [--foreign "arvada,bennett"] [--phone 8173838361]
 *        [--marker "text that must be on the page"]   > output/live-check.log 2>&1
 * Exit 1 on any FAIL.
 */
const argv = process.argv.slice(2);
const flag = (k) => { const i = argv.indexOf(`--${k}`); return i < 0 ? null : argv[i + 1]; };
const urls = (argv[0] || '').split(',').filter((u) => /^https?:/.test(u));
if (!urls.length) { console.error('usage: live-page-check.mjs <url>[,<url>] [--foreign a,b] [--phone digits] [--marker text]'); process.exit(2); }
const foreign = (flag('foreign') || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const phone = flag('phone') ? flag('phone').replace(/\D/g, '').slice(-10) : null;
const marker = flag('marker');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

let fails = 0;
for (const url of urls) {
  const bust = url + (url.includes('?') ? '&' : '?') + 'cb=' + Date.now();
  const r = await fetch(bust, { headers: { 'user-agent': UA, 'cache-control': 'no-cache' }, redirect: 'follow' });
  const html = await r.text();
  const out = [];
  const bad = (m) => { fails++; out.push('FAIL  ' + m); };
  const warn = (m) => out.push('WARN  ' + m);
  const cache = `${r.headers.get('cf-cache-status') || '-'} age=${r.headers.get('age') || 0}`;
  if (!r.ok) bad(`HTTP ${r.status}`);
  if (r.redirected) warn(`redirected to ${r.url}`);
  if ((r.headers.get('cf-cache-status') || '') === 'HIT' && Number(r.headers.get('age') || 0) > 0) warn(`served from the Cloudflare edge (${cache}); re-check on a MISS before believing a failure`);

  const body = (html.split(/<body[^>]*>/i)[1] || html).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ');
  const text = body.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  const low = (text + ' ' + (body.match(/(?:alt|aria-label|title)="[^"]*"/g) || []).join(' ')).toLowerCase();
  for (const f of foreign) if (low.includes(f)) bad(`another client's name on the page: "${f}"`);
  const dashes = (text.match(/—/g) || []).length;
  if (dashes) warn(`${dashes} em dash(es) in copy. House rule: none in copy WE write; the client's own older copy may keep them`);
  if (/\{\{[^}]*\}\}|REPLACE_WITH|lorem ipsum/i.test(text)) bad('unfilled token or placeholder copy');
  const emptyEmbeds = (html.match(/<div class="w-embed[^"]*"><\/div>/g) || []).length;
  if (emptyEmbeds) bad(`${emptyEmbeds} empty w-embed(s): an HtmlEmbed lost its code`);
  if (/<meta[^>]+name="robots"[^>]+noindex/i.test(html)) warn('noindex on this page');
  const canon = (html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i) || [])[1];
  if (canon) out.push(`info  canonical ${canon}`);

  const tels = [...new Set((html.match(/href="tel:[^"]+"/g) || []).map((h) => h.slice(10, -1)))];
  const shown = [...new Set(text.match(/\(?\b\d{3}\)?[\s.\-–]?\d{3}[\s.\-–]\d{4}\b/g) || [])];
  out.push(`info  tel: ${tels.join(', ') || 'none'} | shown: ${shown.join(', ') || 'none'}`);
  for (const s of shown) if (/–/.test(s)) bad(`en dash in phone number "${s}" (the GHL pool cannot swap it)`);
  if (phone) for (const n of [...tels, ...shown]) {
    const d = n.replace(/\D/g, '').slice(-10);
    if (d.length === 10 && d !== phone) warn(`number ${n} is not the expected ${phone}`);
  }
  const forms = [...new Set((html.match(/widget\/form\/[A-Za-z0-9]+/g) || []).map((f) => f.split('/').pop()))];
  if (forms.length) out.push(`info  GHL forms ${forms.join(', ')} (run ../termly-ghl-consent/gates/check-ghl-form.mjs on them)`);
  if (marker && !html.includes(marker)) bad(`marker not found: "${marker}"`);

  console.log(`\n${url}  ${r.status}  cache ${cache}`);
  for (const l of out) console.log('  ' + l);
}
console.log(fails ? `\nFAIL (${fails})` : '\nPASS');
process.exit(fails ? 1 : 0);
