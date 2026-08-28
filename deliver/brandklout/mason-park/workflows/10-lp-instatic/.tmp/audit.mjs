/**
 * Gate the built landing pages before anything is written to Instatic.
 *
 *   node audit.mjs
 *
 * Blockers are things that would ship a broken page: a leftover Webflow CDN
 * URL (an image that stops loading the day Webflow's trial lapses), a surviving
 * <script> (dropped silently by the importer, so it would look fine here and be
 * absent live), a missing asset, a lost form, or a stylesheet rule that escaped
 * the `.lp-page` scope and could restyle the 71 live pages.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { splitSelectors } from "./scope-css.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "out");
const RAW = path.join(HERE, "capture", "raw");
const ASSETS = path.join(HERE, "capture", "assets");

const blockers = [];
const warnings = [];
const B = (s) => blockers.push(s);
const W = (s) => warnings.push(s);

const pages = fs.readdirSync(path.join(OUT, "pages")).map((f) =>
  JSON.parse(fs.readFileSync(path.join(OUT, "pages", f), "utf8")));
const forms = JSON.parse(fs.readFileSync(path.join(OUT, "forms.json"), "utf8"));
const css = fs.readFileSync(path.join(OUT, "lp.css"), "utf8");

console.log("page                              bytes  imgs  links  h1  form  text%");
for (const p of pages) {
  const raw = fs.readFileSync(path.join(RAW, `${p.slug}.html`), "utf8");
  const rawBody = raw.slice(raw.indexOf("<body"), raw.lastIndexOf("</body>"));

  const imgs = [...p.html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  const links = [...p.html.matchAll(/<a[^>]+href="([^"]+)"/g)].map((m) => m[1]);
  const h1 = (p.html.match(/<h1\b/g) || []).length;
  const form = (p.html.match(/leadconnectorhq\.com\/widget\/form\//g) || []).length;

  // Text retention: the port must not silently drop copy.
  const strip = (s) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const kept = strip(p.html).length;
  const orig = strip(rawBody.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "")).length;
  const pct = orig ? Math.round((kept / orig) * 100) : 0;

  console.log(
    `${p.slug.padEnd(34)}${String(p.html.length).padStart(6)}${String(imgs.length).padStart(6)}`
    + `${String(links.length).padStart(7)}${String(h1).padStart(4)}${String(form).padStart(6)}${String(pct).padStart(6)}`);

  if (!p.html.startsWith('<div class="lp-page"')) B(`${p.slug}: not wrapped in .lp-page`);
  if (!p.title) B(`${p.slug}: no title`);
  if (/&(amp|lt|gt|quot|#\d+);/.test(p.title)) B(`${p.slug}: title still carries an entity: ${p.title}`);
  if (h1 !== 1) W(`${p.slug}: ${h1} <h1> elements`);
  if (pct < 95) B(`${p.slug}: only ${pct}% of the original text survived`);

  if (/<script\b/i.test(p.html)) B(`${p.slug}: a <script> survived into the page body`);
  if (/<style\b/i.test(p.html)) B(`${p.slug}: a <style> survived into the page body`);
  if (/cdn\.prod\.website-files\.com|d3e54v103j8qbb/.test(p.html)) {
    const left = [...p.html.matchAll(/https:\/\/(?:cdn\.prod\.website-files\.com|d3e54v103j8qbb)[^"'\s)]+/g)];
    B(`${p.slug}: ${left.length} Webflow CDN URL(s) left, e.g. ${left[0][0].slice(0, 90)}`);
  }
  if (/srcset=|sizes=/.test(p.html)) B(`${p.slug}: srcset/sizes survived - candidates were never uploaded`);

  for (const src of imgs) {
    if (src.startsWith("/assets/")) {
      const f = path.join(ASSETS, decodeURIComponent(src.slice("/assets/".length)));
      if (!fs.existsSync(f)) B(`${p.slug}: image not on disk: ${src}`);
    } else if (!src.startsWith("/uploads/")) {
      W(`${p.slug}: image with an unexpected src: ${src.slice(0, 80)}`);
    }
  }
  for (const href of links) {
    if (/^https?:\/\//.test(href) || href.startsWith("tel:") || href.startsWith("mailto:")
      || href.startsWith("#") || href.startsWith("/")) continue;
    W(`${p.slug}: relative link that may not resolve on Instatic: ${href}`);
  }

  // The reference page's form must still be somewhere.
  const wantForm = /data-form-id="/.test(rawBody);
  if (wantForm && form === 0) B(`${p.slug}: the reference page has a GoHighLevel form and the build lost it`);
}

// ------------------------------------------------------- stylesheet scoping
const preludes = [];
{
  let depth = 0, buf = "", quote = null;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (quote) { buf += c; if (c === quote && css[i - 1] !== "\\") quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; buf += c; continue; }
    if (c === "{") { if (depth === 0) preludes.push(buf); depth++; buf = ""; continue; }
    if (c === "}") { depth--; buf = ""; continue; }
    if (depth === 0) buf += c;
  }
}
const leaks = [];
for (const pre of preludes) {
  const t = pre.trim();
  if (!t || t.startsWith("@")) continue;
  for (const sel of splitSelectors(t)) {
    if (!sel.includes("lp-page")) leaks.push(sel.trim().slice(0, 90));
  }
}
console.log(`\nlp.css: ${css.length} bytes, ${preludes.length} top-level blocks`);
if (leaks.length) {
  B(`lp.css has ${leaks.length} selector(s) outside the .lp-page scope - these would restyle the live site`);
  for (const l of leaks.slice(0, 10)) console.log(`   LEAK  ${l}`);
}
if (/cdn\.prod\.website-files\.com/.test(css)) B("lp.css still points at the Webflow CDN");

const ids = [...new Set(forms.map((f) => f.formId))];
console.log(`forms: ${forms.length} placeholders across ${ids.length} GoHighLevel form ids (${ids.join(", ")})`);

console.log(`\n${blockers.length} blockers, ${warnings.length} warnings`);
for (const b of blockers) console.log(`  BLOCKER  ${b}`);
for (const w of warnings.slice(0, 25)) console.log(`  warn     ${w}`);
if (warnings.length > 25) console.log(`  ... and ${warnings.length - 25} more warnings`);
process.exitCode = blockers.length ? 1 : 0;
